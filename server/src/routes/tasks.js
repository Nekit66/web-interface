const express = require('express');
const { authRequired } = require('../middleware/auth');

function mapTask(row) {
    return {
        id: row.id,
        projectId: row.project_id,
        projectCode: row.project_code || null,
        code: row.code,
        title: row.title,
        departmentId: row.department_id,
        departmentName: row.department_name || null,
        assigneeId: row.assignee_id,
        assigneeName: row.assignee_name || 'Не назначен',
        assignedByName: row.assigned_by_name || null,
        deadline: row.deadline,
        status: row.status
    };
}

function createTasksRouter(db) {
    const router = express.Router();
    router.use(authRequired);

    function getProject(id) {
        return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    }

    function canAssignTasks(user, project) {
        if (['chief_engineer', 'tech_dept_head'].includes(user.roleCode)) return true;
        if (user.roleCode === 'project_chief' && project.gip_id === user.id) return true;
        return false;
    }

    router.get('/', (req, res) => {
        const { projectId, status } = req.query;
        let sql = `
            SELECT t.*, p.code AS project_code,
                   d.name AS department_name,
                   a.full_name AS assignee_name,
                   ab.full_name AS assigned_by_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN departments d ON d.id = t.department_id
            LEFT JOIN employees a ON a.id = t.assignee_id
            LEFT JOIN employees ab ON ab.id = t.assigned_by_id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.roleCode === 'project_chief') {
            sql += ' AND p.gip_id = ?';
            params.push(req.user.id);
        } else if (req.user.roleCode === 'designer') {
            sql += ' AND t.assignee_id = ?';
            params.push(req.user.id);
        }

        if (projectId) {
            sql += ' AND t.project_id = ?';
            params.push(Number(projectId));
        }
        if (status) {
            sql += ' AND t.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY t.deadline ASC';
        const rows = db.prepare(sql).all(...params);
        res.json(rows.map(mapTask));
    });

    router.post('/', (req, res) => {
        const { projectId, title, departmentId, assigneeId, deadline } = req.body || {};

        if (!projectId || !title || !departmentId) {
            return res.status(400).json({ error: 'Укажите проект, содержание и отдел' });
        }

        const project = getProject(Number(projectId));
        if (!project) return res.status(404).json({ error: 'Проект не найден' });

        if (!canAssignTasks(req.user, project)) {
            return res.status(403).json({ error: 'Вы не можете назначать задания на этом проекте' });
        }

        const dept = db.prepare('SELECT id FROM departments WHERE id = ?').get(Number(departmentId));
        if (!dept) return res.status(400).json({ error: 'Отдел не найден' });

        let assignee = null;
        if (assigneeId) {
            assignee = db.prepare(`
                SELECT e.id FROM employees e
                JOIN roles r ON r.id = e.role_id
                WHERE e.id = ? AND r.code = 'designer'
                  AND e.department_id = ? AND e.is_active = 1
            `).get(Number(assigneeId), dept.id);

            if (!assignee) {
                return res.status(400).json({
                    error: 'Исполнитель должен быть проектировщиком выбранного отдела'
                });
            }
        }

        const count = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
        const deptLetter = db.prepare('SELECT name FROM departments WHERE id = ?').get(dept.id).name;
        const letter = deptLetter ? deptLetter.charAt(0).toUpperCase() : 'X';
        const code = 'T-' + letter + '-' + String(count + 1).padStart(3, '0');

        const result = db.prepare(`
            INSERT INTO tasks (project_id, code, title, department_id, assignee_id, assigned_by_id, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            code,
            title.trim(),
            dept.id,
            assignee ? assignee.id : null,
            req.user.id,
            deadline || null
        );

        const created = db.prepare(`
            SELECT t.*, p.code AS project_code,
                   d.name AS department_name,
                   a.full_name AS assignee_name,
                   ab.full_name AS assigned_by_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN departments d ON d.id = t.department_id
            LEFT JOIN employees a ON a.id = t.assignee_id
            LEFT JOIN employees ab ON ab.id = t.assigned_by_id
            WHERE t.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(mapTask(created));
    });

    router.patch('/:id/assign', (req, res) => {
        const { assigneeId, departmentId } = req.body || {};
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!task) return res.status(404).json({ error: 'Задание не найдено' });

        const project = getProject(task.project_id);
        if (!canAssignTasks(req.user, project)) {
            return res.status(403).json({ error: 'Нет прав на назначение исполнителя' });
        }

        const deptId = departmentId || task.department_id;
        const assignee = db.prepare(`
            SELECT e.id FROM employees e
            JOIN roles r ON r.id = e.role_id
            WHERE e.id = ? AND r.code = 'designer'
              AND e.department_id = ? AND e.is_active = 1
        `).get(Number(assigneeId), deptId);

        if (!assignee) {
            return res.status(400).json({ error: 'Некорректный исполнитель для отдела' });
        }

        db.prepare(`
            UPDATE tasks SET assignee_id = ?, department_id = ?, assigned_by_id = ?
            WHERE id = ?
        `).run(assignee.id, deptId, req.user.id, task.id);

        const updated = db.prepare(`
            SELECT t.*, p.code AS project_code,
                   d.name AS department_name,
                   a.full_name AS assignee_name,
                   ab.full_name AS assigned_by_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN departments d ON d.id = t.department_id
            LEFT JOIN employees a ON a.id = t.assignee_id
            LEFT JOIN employees ab ON ab.id = t.assigned_by_id
            WHERE t.id = ?
        `).get(task.id);

        res.json(mapTask(updated));
    });

    router.patch('/:id/status', (req, res) => {
        const { status } = req.body || {};
        const allowed = ['В работе', 'Выполнено', 'Просрочено', 'На проверке'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!task) return res.status(404).json({ error: 'Задание не найдено' });

        const project = getProject(task.project_id);
        const isAssignee = task.assignee_id === req.user.id;
        const isManager = canAssignTasks(req.user, project);

        if (!isAssignee && !isManager) {
            return res.status(403).json({ error: 'Нет прав изменять статус' });
        }

        db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, task.id);

        const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(project.id);
        if (tasks.length > 0) {
            const done = tasks.filter((t) => t.status === 'Выполнено').length;
            const progress = Math.round((done / tasks.length) * 100);
            db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(progress, project.id);
        }

        const updated = db.prepare(`
            SELECT t.*, p.code AS project_code,
                   d.name AS department_name,
                   a.full_name AS assignee_name,
                   ab.full_name AS assigned_by_name
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN departments d ON d.id = t.department_id
            LEFT JOIN employees a ON a.id = t.assignee_id
            LEFT JOIN employees ab ON ab.id = t.assigned_by_id
            WHERE t.id = ?
        `).get(task.id);

        res.json(mapTask(updated));
    });

    router.delete('/:id', (req, res) => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!task) return res.status(404).json({ error: 'Задание не найдено' });

        const project = getProject(task.project_id);
        if (!canAssignTasks(req.user, project)) {
            return res.status(403).json({ error: 'Нет прав удалять задание' });
        }

        db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
        res.json({ success: true });
    });

    return router;
}

module.exports = createTasksRouter;
