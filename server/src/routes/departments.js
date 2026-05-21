const express = require('express');
const { authRequired } = require('../middleware/auth');

function createDepartmentsRouter(db) {
    const router = express.Router();
    router.use(authRequired);

    router.get('/', (_req, res) => {
        const rows = db.prepare('SELECT id, name FROM departments ORDER BY name').all();
        res.json(rows);
    });

    return router;
}

module.exports = createDepartmentsRouter;
