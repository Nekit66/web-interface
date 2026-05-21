const express = require('express');
const { authRequired, requireRoles } = require('../middleware/auth');

function mapProject(row) {
    return {
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        type: row.type,
        client: row.client,
        deadline: row.deadline,
        status: row.status,
        progress: row.progress,
        gipId: row.gip_id,
        gipName: row.gip_name,
        createdByName: row.created_by_name || null
    };
}

function canManageProject(user, project) {
    if (['chief_engineer', 'tech_dept_head'].includes(user.roleCode)) return true;
    if (user.roleCode === 'project_chief' && project.gip_id === user.id) return true;
    return false;
}

function createProjectsRouter(db) {
    const router = express.Router();
    router.use(authRequired);

    router.get('/', (req, res) => {
        let sql = `
            SELECT p.*, g.full_name AS gip_name, c.full_name AS created_by_name
            FROM projects p
            JOIN employees g ON g.id = p.gip_id
            LEFT JOIN employees c ON c.id = p.created_by_id
        `;
        const params = [];

        if (req.user.roleCode === 'project_chief') {
            sql += ' WHERE p.gip_id = ?';
            params.push(req.user.id);
        } else if (req.user.roleCode === 'designer') {
            sql += `
                WHERE p.id IN (
                    SELECT DISTINCT project_id FROM tasks WHERE assignee_id = ?
                )
            `;
            params.push(req.user.id);
        }

        sql += ' ORDER BY p.deadline ASC';
        const rows = db.prepare(sql).all(...params);
        res.json(rows.map(mapProject));
    });

    router.get('/:id', (req, res) => {
        const row = db.prepare(`
            SELECT p.*, g.full_name AS gip_name, c.full_name AS created_by_name
            FROM projects p
            JOIN employees g ON g.id = p.gip_id
            LEFT JOIN employees c ON c.id = p.created_by_id
            WHERE p.id = ?
        `).get(req.params.id);

        if (!row) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        if (req.user.roleCode === 'project_chief' && row.gip_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к этому проекту' });
        }

        if (req.user.roleCode === 'designer') {
            const hasTask = db.prepare(
                'SELECT 1 FROM tasks WHERE project_id = ? AND assignee_id = ? LIMIT 1'
            ).get(row.id, req.user.id);
            if (!hasTask) {
                return res.status(403).json({ error: 'Нет доступа к этому проекту' });
            }
        }

        res.json(mapProject(row));
    });

    router.post('/', requireRoles('chief_engineer', 'tech_dept_head'), (req, res) => {
        const { code, title, description, type, client, deadline, gipId } = req.body || {};

        if (!code || !title || !client || !deadline || !gipId) {
            return res.status(400).json({
                error: 'Обязательные поля: шифр, наименование, заказчик, срок, ГИП'
            });
        }

        const gip = db.prepare(`
            SELECT e.id FROM employees e
            JOIN roles r ON r.id = e.role_id
            WHERE e.id = ? AND r.code = 'project_chief' AND e.is_active = 1
        `).get(Number(gipId));

        if (!gip) {
            return res.status(400).json({ error: 'Выберите действующего ГИП' });
        }

        try {
            const result = db.prepare(`
                INSERT INTO projects (code, title, description, type, client, deadline, gip_id, created_by_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                code.trim(),
                title.trim(),
                description || '',
                type || '',
                client.trim(),
                deadline,
                gip.id,
                req.user.id
            );

            const created = db.prepare(`
                SELECT p.*, g.full_name AS gip_name, c.full_name AS created_by_name
                FROM projects p
                JOIN employees g ON g.id = p.gip_id
                LEFT JOIN employees c ON c.id = p.created_by_id
                WHERE p.id = ?
            `).get(result.lastInsertRowid);

            res.status(201).json(mapProject(created));
        } catch (err) {
            if (String(err.message).includes('UNIQUE')) {
                return res.status(409).json({ error: 'Проект с таким шифром уже существует' });
            }
            throw err;
        }
    });

    router.patch('/:id/gip', requireRoles('chief_engineer', 'tech_dept_head'), (req, res) => {
        const { gipId } = req.body || {};
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
        if (!project) return res.status(404).json({ error: 'Проект не найден' });

        const gip = db.prepare(`
            SELECT e.id FROM employees e
            JOIN roles r ON r.id = e.role_id
            WHERE e.id = ? AND r.code = 'project_chief' AND e.is_active = 1
        `).get(Number(gipId));

        if (!gip) return res.status(400).json({ error: 'Некорректный ГИП' });

        db.prepare('UPDATE projects SET gip_id = ? WHERE id = ?').run(gip.id, project.id);

        const updated = db.prepare(`
            SELECT p.*, g.full_name AS gip_name, c.full_name AS created_by_name
            FROM projects p
            JOIN employees g ON g.id = p.gip_id
            LEFT JOIN employees c ON c.id = p.created_by_id
            WHERE p.id = ?
        `).get(project.id);

        res.json(mapProject(updated));
    });

    return { router, canManageProject };
}

module.exports = createProjectsRouter;
