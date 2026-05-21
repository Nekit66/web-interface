const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken, authRequired } = require('../middleware/auth');

function createAuthRouter(db) {
    const router = express.Router();

    router.post('/login', (req, res) => {
        const { login, password } = req.body || {};
        if (!login || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }

        const row = db.prepare(`
            SELECT e.id, e.login, e.password_hash, e.full_name, e.department_id,
                   r.code AS role_code, r.name AS role_name, r.level AS role_level
            FROM employees e
            JOIN roles r ON r.id = e.role_id
            WHERE e.login = ? AND e.is_active = 1
        `).get(login.trim());

        if (!row || !bcrypt.compareSync(password, row.password_hash)) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = {
            id: row.id,
            login: row.login,
            fullName: row.full_name,
            departmentId: row.department_id,
            roleCode: row.role_code,
            roleName: row.role_name,
            roleLevel: row.role_level
        };

        res.json({
            token: signToken(user),
            user
        });
    });

    router.get('/me', authRequired, (req, res) => {
        const row = db.prepare(`
            SELECT e.id, e.login, e.full_name, e.department_id,
                   r.code AS role_code, r.name AS role_name, r.level AS role_level
            FROM employees e
            JOIN roles r ON r.id = e.role_id
            WHERE e.id = ? AND e.is_active = 1
        `).get(req.user.id);

        if (!row) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }

        res.json({
            id: row.id,
            login: row.login,
            fullName: row.full_name,
            departmentId: row.department_id,
            roleCode: row.role_code,
            roleName: row.role_name,
            roleLevel: row.role_level
        });
    });

    return router;
}

module.exports = createAuthRouter;
