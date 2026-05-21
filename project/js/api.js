var API = {
    baseUrl: (function() {
        var host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return '';
        if (host.endsWith('github.io')) return 'https://is-ikd-api.onrender.com';
        return '';
    })(),

    getToken: function() {
        return localStorage.getItem('authToken');
    },

    request: function(method, path, body) {
        var opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        var token = this.getToken();
        if (token) opts.headers.Authorization = 'Bearer ' + token;
        if (body !== undefined) opts.body = JSON.stringify(body);

        return fetch(this.baseUrl + path, opts).then(function(res) {
            return res.json().catch(function() { return {}; }).then(function(data) {
                if (!res.ok) {
                    var err = new Error(data.error || 'Ошибка запроса');
                    err.status = res.status;
                    throw err;
                }
                return data;
            });
        }).catch(function(err) {
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                throw new Error('Сервер недоступен. Подождите 1–2 мин. (холодный старт) или запустите API локально.');
            }
            throw err;
        });
    },

    login: function(login, password) {
        return this.request('POST', '/api/auth/login', { login: login, password: password });
    },

    getMe: function() {
        return this.request('GET', '/api/auth/me');
    },

    getStats: function() {
        return this.request('GET', '/api/stats');
    },

    getProjects: function() {
        return this.request('GET', '/api/projects');
    },

    getProject: function(id) {
        return this.request('GET', '/api/projects/' + id);
    },

    createProject: function(data) {
        return this.request('POST', '/api/projects', data);
    },

    getTasks: function(params) {
        var q = new URLSearchParams(params || {}).toString();
        return this.request('GET', '/api/tasks' + (q ? '?' + q : ''));
    },

    createTask: function(data) {
        return this.request('POST', '/api/tasks', data);
    },

    assignTask: function(id, data) {
        return this.request('PATCH', '/api/tasks/' + id + '/assign', data);
    },

    updateTaskStatus: function(id, status) {
        return this.request('PATCH', '/api/tasks/' + id + '/status', { status: status });
    },

    deleteTask: function(id) {
        return this.request('DELETE', '/api/tasks/' + id);
    },

    getDocuments: function(projectId) {
        return this.request('GET', '/api/documents?projectId=' + projectId);
    },

    addComment: function(docId, text) {
        return this.request('POST', '/api/documents/' + docId + '/comments', { text: text });
    },

    approveProjectDocs: function(projectId) {
        return this.request('POST', '/api/documents/approve-project/' + projectId);
    },

    getEmployees: function(params) {
        var q = new URLSearchParams(params || {}).toString();
        return this.request('GET', '/api/employees' + (q ? '?' + q : ''));
    },

    getRoles: function() {
        return this.request('GET', '/api/employees/roles');
    },

    registerEmployee: function(data) {
        return this.request('POST', '/api/employees', data);
    },

    getDepartments: function() {
        return this.request('GET', '/api/departments');
    }
};
