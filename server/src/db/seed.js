const bcrypt = require('bcryptjs');
const { ensureDatabase, DB_PATH } = require('./database');

function seedIfEmpty(db) {
    const roleCount = db.prepare('SELECT COUNT(*) AS c FROM roles').get().c;
    if (roleCount > 0) return false;

    const roles = [
        { code: 'chief_engineer', name: 'Главный инженер', level: 100 },
        { code: 'tech_dept_head', name: 'Начальник технического отдела', level: 80 },
        { code: 'project_chief', name: 'Главный инженер проекта', level: 60 },
        { code: 'designer', name: 'Инженер-проектировщик', level: 20 }
    ];

    const insertRole = db.prepare('INSERT INTO roles (code, name, level) VALUES (?, ?, ?)');
    roles.forEach((r) => insertRole.run(r.code, r.name, r.level));

    ['Электротехнический', 'Технологический', 'Автоматизация', 'Строительный'].forEach((name) => {
        db.prepare('INSERT INTO departments (name) VALUES (?)').run(name);
    });

    const roleIds = Object.fromEntries(
        db.prepare('SELECT id, code FROM roles').all().map((r) => [r.code, r.id])
    );
    const deptIds = Object.fromEntries(
        db.prepare('SELECT id, name FROM departments').all().map((d) => [d.name, d.id])
    );

    const hash = bcrypt.hashSync('123', 10);
    const insertEmployee = db.prepare(`
        INSERT INTO employees (login, password_hash, full_name, role_id, department_id)
        VALUES (?, ?, ?, ?, ?)
    `);

    [
        { login: 'chief_engineer', fullName: 'Андрей Сергеевич', role: 'chief_engineer', dept: null },
        { login: 'tech_dept_head', fullName: 'Дмитрий Алексеевич', role: 'tech_dept_head', dept: null },
        { login: 'project_chief1', fullName: 'Елена Викторовна', role: 'project_chief', dept: null },
        { login: 'designer_ivanov', fullName: 'Иван Петрович', role: 'designer', dept: 'Автоматизация' },
        { login: 'designer_petrov', fullName: 'Петров А.С.', role: 'designer', dept: 'Электротехнический' },
        { login: 'designer_sidorov', fullName: 'Сидоров К.М.', role: 'designer', dept: 'Технологический' },
        { login: 'designer_kozlov', fullName: 'Козлов А.Д.', role: 'designer', dept: 'Электротехнический' },
        { login: 'designer_morozov', fullName: 'Морозов П.Н.', role: 'designer', dept: 'Строительный' },
        { login: 'project_chief2', fullName: 'Смирнова О.И.', role: 'project_chief', dept: null }
    ].forEach((e) => {
        insertEmployee.run(e.login, hash, e.fullName, roleIds[e.role], e.dept ? deptIds[e.dept] : null);
    });

    const empByLogin = Object.fromEntries(
        db.prepare('SELECT id, login FROM employees').all().map((e) => [e.login, e.id])
    );

    const insertProject = db.prepare(`
        INSERT INTO projects (code, title, description, type, client, deadline, status, progress, gip_id, created_by_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run('ТЭЦ-4', 'Реконструкция ТЭЦ-4', 'Модернизация основного оборудования энергоблока №2', 'ТЭЦ', 'АО "ЭнергоПром"', '15.12.2026', 'В работе', 68, empByLogin.project_chief1, empByLogin.chief_engineer);
    insertProject.run('НС-12', 'Насосная станция 12-го подъема', 'Проектирование АСУ ТП и силового оборудования', 'Насосная станция', 'ТОО "КазТрансОйл"', '20.03.2027', 'Проектирование', 34, empByLogin.project_chief2, empByLogin.tech_dept_head);
    insertProject.run('ВЛ-110', 'ВЛ 110 кВ "Шелек-Хоргос"', 'Проектирование фундамента опор №12-45', 'ЛЭП', 'АО "KEGOC"', '01.10.2026', 'Проверка', 91, empByLogin.project_chief1, empByLogin.chief_engineer);
    insertProject.run('К-001', 'Котельная "Северная"', 'Замена теплообменников', 'Котельная', 'МУП Теплосеть', '30.11.2026', 'Согласовано', 100, empByLogin.project_chief2, empByLogin.chief_engineer);

    const projectByCode = Object.fromEntries(
        db.prepare('SELECT id, code FROM projects').all().map((p) => [p.code, p.id])
    );

    const insertTask = db.prepare(`
        INSERT INTO tasks (project_id, code, title, department_id, assignee_id, assigned_by_id, deadline, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    [
        { projectCode: 'ТЭЦ-4', code: 'T4-E-061', title: 'Схема электрических соединений РУ-6кВ', dept: 'Электротехнический', assignee: 'designer_petrov', deadline: '12.10.2026', status: 'Выполнено' },
        { projectCode: 'ТЭЦ-4', code: 'T4-M-045', title: 'Монтажный чертеж трубопроводов обвязки насосов', dept: 'Технологический', assignee: 'designer_sidorov', deadline: '20.11.2026', status: 'В работе' },
        { projectCode: 'ТЭЦ-4', code: 'T4-A-112', title: 'Разработка алгоритмов управления защитами котла', dept: 'Автоматизация', assignee: 'designer_ivanov', deadline: '15.11.2026', status: 'Просрочено' },
        { projectCode: 'НС-12', code: 'NS-S-001', title: 'Проект силового щита НС-12', dept: 'Электротехнический', assignee: 'designer_kozlov', deadline: '15.03.2027', status: 'В работе' },
        { projectCode: 'ВЛ-110', code: 'VL-F-012', title: 'Расчет фундаментов опор №12-20', dept: 'Строительный', assignee: 'designer_morozov', deadline: '01.09.2026', status: 'В работе' }
    ].forEach((t) => {
        insertTask.run(
            projectByCode[t.projectCode], t.code, t.title, deptIds[t.dept],
            empByLogin[t.assignee], empByLogin.project_chief1, t.deadline, t.status
        );
    });

    const p1 = projectByCode['ТЭЦ-4'];
    const taskByCode = Object.fromEntries(
        db.prepare('SELECT id, code FROM tasks WHERE project_id = ?').all(p1).map((t) => [t.code, t.id])
    );

    const insertDoc = db.prepare(`
        INSERT INTO documents (project_id, task_id, name, type, version, size, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertDoc.run(p1, taskByCode['T4-E-061'], 'Схема_РУ-6кВ_финальная.pdf', 'pdf', 'v3.1', '4.2 MB', 'Утвержден');
    insertDoc.run(p1, taskByCode['T4-M-045'], 'План_обвязки_насосов_ред2.dwg', 'dwg', 'v2.3', '18.5 MB', 'Черновик');
    insertDoc.run(p1, taskByCode['T4-A-112'], 'Алгоритмы_защит_котла_К-5.docx', 'doc', 'v1.0', '890 KB', 'На проверке');

    const docByName = Object.fromEntries(
        db.prepare('SELECT id, name FROM documents WHERE project_id = ?').all(p1).map((d) => [d.name, d.id])
    );

    const insertComment = db.prepare(`
        INSERT INTO document_comments (document_id, author_id, author_name, text, created_at)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertComment.run(docByName['План_обвязки_насосов_ред2.dwg'], empByLogin.tech_dept_head, 'Дмитрий Алексеевич', 'Необходимо уточнить диаметры трубопроводов на участке А-Б', '18.11.2026');
    insertComment.run(docByName['Алгоритмы_защит_котла_К-5.docx'], empByLogin.project_chief1, 'Елена Викторовна', 'Добавить описание аварийных режимов', '10.11.2026');
    insertComment.run(docByName['Алгоритмы_защит_котла_К-5.docx'], empByLogin.tech_dept_head, 'Дмитрий Алексеевич', 'Проверить соответствие ГОСТ 21.208-2013', '12.11.2026');

    return true;
}

module.exports = { seedIfEmpty };

if (require.main === module) {
    const db = ensureDatabase();
    if (seedIfEmpty(db)) {
        console.log('База успешно заполнена:', DB_PATH);
    } else {
        console.log('База уже заполнена:', DB_PATH);
    }
}
