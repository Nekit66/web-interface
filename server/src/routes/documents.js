const express = require('express');
const { authRequired, requireRoles } = require('../middleware/auth');

function createDocumentsRouter(db) {
    const router = express.Router();
    router.use(authRequired);

    router.get('/', (req, res) => {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ error: 'Укажите projectId' });
        }

        const docs = db.prepare(`
            SELECT id, project_id, task_id, name, type, version, size, status
            FROM documents WHERE project_id = ?
            ORDER BY name
        `).all(Number(projectId));

        const getComments = db.prepare(`
            SELECT id, author_name, text, created_at
            FROM document_comments WHERE document_id = ?
            ORDER BY created_at ASC
        `);

        res.json(docs.map((d) => ({
            id: d.id,
            projectId: d.project_id,
            taskId: d.task_id,
            name: d.name,
            type: d.type,
            version: d.version,
            size: d.size,
            status: d.status,
            comments: getComments.all(d.id).map((c) => ({
                id: c.id,
                author: c.author_name,
                text: c.text,
                date: c.created_at
            }))
        })));
    });

    router.post('/:id/comments', (req, res) => {
        const { text } = req.body || {};
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Введите текст замечания' });
        }

        const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Документ не найден' });

        const author = db.prepare('SELECT full_name FROM employees WHERE id = ?').get(req.user.id);

        const result = db.prepare(`
            INSERT INTO document_comments (document_id, author_id, author_name, text)
            VALUES (?, ?, ?, ?)
        `).run(doc.id, req.user.id, author.full_name, text.trim());

        const comment = db.prepare(`
            SELECT id, author_name, text, created_at FROM document_comments WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            id: comment.id,
            author: comment.author_name,
            text: comment.text,
            date: comment.created_at
        });
    });

    router.post('/approve-project/:projectId', requireRoles('chief_engineer'), (req, res) => {
        db.prepare(`
            UPDATE documents SET status = 'Утвержден' WHERE project_id = ?
        `).run(Number(req.params.projectId));
        res.json({ success: true });
    });

    return router;
}

module.exports = createDocumentsRouter;
