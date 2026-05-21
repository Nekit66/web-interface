-- Справочник ролей
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0
);

-- Производственные отделы
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Сотрудники
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    department_id INTEGER REFERENCES departments(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Проекты
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    client TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Новый',
    progress INTEGER NOT NULL DEFAULT 0,
    gip_id INTEGER NOT NULL REFERENCES employees(id),
    created_by_id INTEGER REFERENCES employees(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Задания (задачи)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    assignee_id INTEGER REFERENCES employees(id),
    assigned_by_id INTEGER REFERENCES employees(id),
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'В работе',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Документация
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT,
    version TEXT,
    size TEXT,
    status TEXT NOT NULL DEFAULT 'Черновик',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Замечания к документам
CREATE TABLE IF NOT EXISTS document_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES employees(id),
    author_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_gip ON projects(gip_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
