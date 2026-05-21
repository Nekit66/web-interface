const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'is-ikd-dev-secret-change-in-production';

function signToken(user) {
    return jwt.sign(
        { id: user.id, login: user.login, roleCode: user.roleCode, roleName: user.roleName },
        JWT_SECRET,
        { expiresIn: '12h' }
    );
}

function authRequired(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Сессия истекла, войдите снова' });
    }
}

function requireRoles(...roleCodes) {
    return (req, res, next) => {
        if (!req.user || !roleCodes.includes(req.user.roleCode)) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    };
}

module.exports = { JWT_SECRET, signToken, authRequired, requireRoles };
