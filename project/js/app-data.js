var AppData = {
    users: {
        chief_engineer:      { login:'chief_engineer',   password:'123', fullName:'Андрей Сергеевич',   role:'Главный инженер' },
        tech_dept_head:       { login:'tech_dept_head',    password:'123', fullName:'Дмитрий Алексеевич', role:'Начальник технического отдела' },
        project_chief1:       { login:'project_chief1',    password:'123', fullName:'Елена Викторовна',  role:'Главный инженер проекта' },
        designer_ivanov:      { login:'designer_ivanov',   password:'123', fullName:'Иван Петрович',     role:'Инженер-проектировщик' }
    },

    projects: {
        '1':{ id:'1', code:'ТЭЦ-4', title:'Реконструкция ТЭЦ-4', description:'Модернизация основного оборудования энергоблока №2', type:'ТЭЦ', client:'АО "ЭнергоПром"', deadline:'15.12.2026', status:'В работе', progress:68 },
        '2':{ id:'2', code:'НС-12', title:'Насосная станция 12-го подъема', description:'Проектирование АСУ ТП и силового оборудования', type:'Насосная станция', client:'ТОО "КазТрансОйл"', deadline:'20.03.2027', status:'Проектирование', progress:34 },
        '3':{ id:'3', code:'ВЛ-110', title:'ВЛ 110 кВ "Шелек-Хоргос"', description:'Проектирование фундамента опор №12-45', type:'ЛЭП', client:'АО "KEGOC"', deadline:'01.10.2026', status:'Проверка', progress:91 },
        '4':{ id:'4', code:'К-001', title:'Котельная "Северная"', description:'Замена теплообменников', type:'Котельная', client:'МУП Теплосеть', deadline:'30.11.2026', status:'Согласовано', progress:100 }
    },

    tasks: {
        't1':{ id:'t1', projectId:'1', code:'T4-E-061', title:'Схема электрических соединений РУ-6кВ', department:'Электротехнический', responsible:'Петров А.С.', deadline:'12.10.2026', status:'Выполнено' },
        't2':{ id:'t2', projectId:'1', code:'T4-M-045', title:'Монтажный чертеж трубопроводов обвязки насосов', department:'Технологический', responsible:'Сидоров К.М.', deadline:'20.11.2026', status:'В работе' },
        't3':{ id:'t3', projectId:'1', code:'T4-A-112', title:'Разработка алгоритмов управления защитами котла', department:'Автоматизация', responsible:'Иванов И.И.', deadline:'15.11.2026', status:'Просрочено' },
        't4':{ id:'t4', projectId:'2', code:'NS-S-001', title:'Проект силового щита НС-12', department:'Электротехнический', responsible:'Козлов А.Д.', deadline:'15.03.2027', status:'В работе' },
        't5':{ id:'t5', projectId:'3', code:'VL-F-012', title:'Расчет фундаментов опор №12-20', department:'Строительный', responsible:'Морозов П.Н.', deadline:'01.09.2026', status:'В работе' }
    },

    documents: {
        'd1':{ id:'d1', projectId:'1', taskId:'t1', name:'Схема_РУ-6кВ_финальная.pdf', type:'pdf', version:'v3.1', size:'4.2 MB', status:'Утвержден', comments:[] },
        'd2':{ id:'d2', projectId:'1', taskId:'t2', name:'План_обвязки_насосов_ред2.dwg', type:'dwg', version:'v2.3', size:'18.5 MB', status:'Черновик', comments:[
            { id:'c1', author:'Дмитрий Алексеевич', text:'Необходимо уточнить диаметры трубопроводов на участке А-Б', date:'18.11.2026' }
        ]},
        'd3':{ id:'d3', projectId:'1', taskId:'t3', name:'Алгоритмы_защит_котла_К-5.docx', type:'doc', version:'v1.0', size:'890 KB', status:'На проверке', comments:[
            { id:'c2', author:'Елена Викторовна', text:'Добавить описание аварийных режимов', date:'10.11.2026' },
            { id:'c3', author:'Дмитрий Алексеевич', text:'Проверить соответствие ГОСТ 21.208-2013', date:'12.11.2026' }
        ]}
    },

    _nextProjectId: 5,
    _nextTaskId: 6,
    _nextDocId: 4,
    _nextCommentId: 4,

    findUser: function(login, password) {
        var users = Object.values(this.users);
        for (var i = 0; i < users.length; i++) {
            if (users[i].login === login && users[i].password === password) return users[i];
        }
        return null;
    },

    getUserByKey: function(key) { return this.users[key] || null; },

    addProject: function(data) {
        var id = String(this._nextProjectId++);
        this.projects[id] = {
            id: id, code: data.code, title: data.title,
            description: data.description || '', type: data.type || '',
            client: data.client, deadline: data.deadline,
            status: 'Новый', progress: 0
        };
        this.save();
        return this.projects[id];
    },

    addTask: function(data) {
        var id = 't' + this._nextTaskId++;
        this.tasks[id] = {
            id: id, projectId: data.projectId, code: data.code,
            title: data.title, department: data.department,
            responsible: data.responsible, deadline: data.deadline,
            status: 'В работе'
        };
        this.save();
        return this.tasks[id];
    },

    addComment: function(docId, data) {
        if (this.documents[docId]) {
            var comment = { id: 'c' + this._nextCommentId++, author: data.author, text: data.text, date: data.date };
            this.documents[docId].comments.push(comment);
            this.save();
            return comment;
        }
        return null;
    },

    getProjectById: function(id) { return this.projects[id] || null; },

    getTasksByProject: function(pid) {
        return Object.values(this.tasks).filter(function(t){ return t.projectId === pid; });
    },

    getDocsByProject: function(pid) {
        return Object.values(this.documents).filter(function(d){ return d.projectId === pid; });
    },

    getStats: function() {
        var projects = Object.values(this.projects);
        var tasks = Object.values(this.tasks);
        var docs = Object.values(this.documents);
        return {
            activeProjects: projects.filter(function(p){ return p.status === 'В работе' || p.status === 'Проектирование'; }).length,
            tasksInProgress: tasks.filter(function(t){ return t.status === 'В работе'; }).length,
            pendingReview: docs.filter(function(d){ return d.status === 'На проверке'; }).length
        };
    },

    save: function() {
        try {
            localStorage.setItem('appData', JSON.stringify({
                projects: this.projects, tasks: this.tasks, documents: this.documents,
                _nextProjectId: this._nextProjectId, _nextTaskId: this._nextTaskId,
                _nextDocId: this._nextDocId, _nextCommentId: this._nextCommentId
            }));
        } catch(e) {}
    },

    load: function() {
        try {
            var saved = localStorage.getItem('appData');
            if (saved) {
                var data = JSON.parse(saved);
                this.projects = data.projects || this.projects;
                this.tasks = data.tasks || this.tasks;
                this.documents = data.documents || this.documents;
                this._nextProjectId = data._nextProjectId || this._nextProjectId;
                this._nextTaskId = data._nextTaskId || this._nextTaskId;
                this._nextDocId = data._nextDocId || this._nextDocId;
                this._nextCommentId = data._nextCommentId || this._nextCommentId;
            }
        } catch(e) {}
    }
};

AppData.load();