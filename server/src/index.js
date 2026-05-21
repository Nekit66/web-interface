const path = require('path');
const express = require('express');
const cors = require('cors');
const { ensureDatabase } = require('./db/database');
const createAuthRouter = require('./routes/auth');
const createEmployeesRouter = require('./routes/employees');
const createDepartmentsRouter = require('./routes/departments');
const createProjectsRouter = require('./routes/projects');
const createTasksRouter = require('./routes/tasks');
const createDocumentsRouter = require('./routes/documents');
const createStatsRouter = require('./routes/stats');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '../../project');

const db = ensureDatabase();

const { seedIfEmpty } = require('./db/seed');
if (seedIfEmpty(db)) {
    console.log('База заполнена начальными данными');
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', createAuthRouter(db));
app.use('/api/employees', createEmployeesRouter(db));
app.use('/api/departments', createDepartmentsRouter(db));
app.use('/api/projects', createProjectsRouter(db).router);
app.use('/api/tasks', createTasksRouter(db));
app.use('/api/documents', createDocumentsRouter(db));
app.use('/api/stats', createStatsRouter(db));

app.use(express.static(FRONTEND_DIR));

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`ИС ИКД API: http://localhost:${PORT}`);
    console.log(`Веб-интерфейс: http://localhost:${PORT}/index.html`);
});
