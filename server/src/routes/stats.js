const express = require('express');
const { authRequired } = require('../middleware/auth');

function createStatsRouter(db) {
    const router = express.Router();
    router.use(authRequired);

    router.get('/', (req, res) => {
        let activeProjects;
        if (req.user.roleCode === 'project_chief') {
            activeProjects = db.prepare(`
                SELECT COUNT(*) AS c FROM projects
                WHERE gip_id = ? AND status IN ('В работе', 'Проектирование')
            `).get(req.user.id).c;
        } else {
            activeProjects = db.prepare(`
                SELECT COUNT(*) AS c FROM projects
                WHERE status IN ('В работе', 'Проектирование')
            `).get().c;
        }

        let taskSql = `
            SELECT COUNT(*) AS c FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.status = 'В работе'
        `;
        const taskParams = [];

        if (req.user.roleCode === 'project_chief') {
            taskSql += ' AND p.gip_id = ?';
            taskParams.push(req.user.id);
        } else if (req.user.roleCode === 'designer') {
            taskSql += ' AND t.assignee_id = ?';
            taskParams.push(req.user.id);
        }

        const tasksInProgress = db.prepare(taskSql).get(...taskParams).c;

        const pendingReview = db.prepare(`
            SELECT COUNT(*) AS c FROM documents WHERE status = 'На проверке'
        `).get().c;

        res.json({ activeProjects, tasksInProgress, pendingReview });
    });

    return router;
}

module.exports = createStatsRouter;
