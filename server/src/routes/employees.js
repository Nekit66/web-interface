const express = require('express');
const bcrypt = require('bcryptjs');
const { authRequired, requireRoles } = require('../middleware/auth');

function mapEmployee(row) {
    return {
        id: row.id,
        login: row.login,
        fullName: row.full_name,
        roleCode: row.role_code,
        roleName: row.role_name,
        departmentId: row.department_id,
        departmentName: row.department_name || null,
        isActive: !!row.is_active
    };
}

function createEmployeesRouter(db) {
    const router = express.Router();

    router.use(authRequired);

    router.get('/', (req, res) => {
        const { role, departmentId, gipOnly, designersOnly } = req.query;
        let sql = `
            SELECT e.id, e.login, e.full_name, e.department_id, e.is_active,
                   r.code AS role_code, r.name AS role_name,
                   d.name AS department_name
            FROM employees e
            JOIN roles r ON r.id = e.role_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE e.is_active = 1
        `;
        const params = [];

        if (role) {
            sql += ' AND r.code = ?';
            params.push(role);
        }
        if (gipOnly === '1') {
            sql += " AND r.code = 'project_chief'";
        }
        if (designersOnly === '1') {
            sql += " AND r.code = 'designer'";
        }
        if (departmentId) {
            sql += ' AND e.department_id = ?';
            params.push(Number(departmentId));
        }

        sql += ' ORDER BY r.level DESC, e.full_name ASC';

        const rows = db.prepare(sql).all(...params);
        res.json(rows.map(mapEmployee));
    });

    router.get('/roles', (_req, res) => {
        const roles = db.prepare('SELECT id, code, name, level FROM roles ORDER BY level DESC').all();
        res.json(roles);
    });

    router.post('/', requireRoles('chief_engineer', 'tech_dept_head'), (req, res) => {
        const { login, password, fullName, roleCode, departmentId } = req.body || {};

        if (!login || !password || !fullName || !roleCode) {
            return res.status(400).json({ error: 'Заполните логин, пароль, ФИО и роль' });
        }

        const role = db.prepare('SELECT id FROM roles WHERE code = ?').get(roleCode);
        if (!role) {
            return res.status(400).json({ error: 'Неизвестная роль' });
        }

        if (roleCode === 'designer' && !departmentId) {
            return res.status(400).json({ error: 'Для проектировщика укажите отдел' });
        }

        const exists = db.prepare('SELECT id FROM employees WHERE login = ?').get(login.trim());
        if (exists) {
            return res.status(409).json({ error: 'Логин уже занят' });
        }

        const hash = bcrypt.hashSync(password, 10);
        const result = db.prepare(`
            INSERT INTO employees (login, password_hash, full_name, role_id, department_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            login.trim(),
            hash,
            fullName.trim(),
            role.id,
            departmentId ? Number(departmentId) : null
        );

        const created = db.prepare(`
            SELECT e.id, e.login, e.full_name, e.department_id, e.is_active,
                   r.code AS role_code, r.name AS role_name,
                   d.name AS department_name
            FROM employees e
            JOIN roles r ON r.id = e.role_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE e.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(mapEmployee(created));
    });

    return router;
}

module.exports = createEmployeesRouter;
