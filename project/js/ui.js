var UI = {
    init: function(currentPage) {
        Auth.requireAuth();

        var user = Auth.getCurrentUser();
        if (!user) return;

        var userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = user.roleName + ' (' + user.fullName + ')';
        }

        var navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(function(link) {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        var newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            if (Auth.checkAccessByCode(['chief_engineer', 'tech_dept_head'])) {
                newProjectBtn.style.display = 'block';
            } else {
                newProjectBtn.style.display = 'none';
            }
        }

        var employeesNav = document.getElementById('employeesNav');
        if (employeesNav) {
            employeesNav.style.display = Auth.checkAccessByCode(['chief_engineer', 'tech_dept_head'])
                ? 'block' : 'none';
        }

        var menuBtn = document.getElementById('mobileMenuBtn');
        var sidebar = document.getElementById('sidebar');
        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', function() {
                sidebar.classList.toggle('open');
            });
        }

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal') && e.target.classList.contains('open')) {
                e.target.classList.remove('open');
            }
        });
    },

    getStatusBadge: function(status) {
        var map = {
            'В работе': 'badge-blue',
            'Выполнено': 'badge-green',
            'Просрочено': 'badge-red',
            'На проверке': 'badge-orange',
            'Проектирование': 'badge-yellow',
            'Проверка': 'badge-orange',
            'Согласовано': 'badge-green',
            'Утвержден': 'badge-green',
            'Черновик': 'badge-gray',
            'Новый': 'badge-gray'
        };
        var cls = map[status] || 'badge-gray';
        return '<span class="badge ' + cls + '">' + status.toUpperCase() + '</span>';
    },

    openModal: function(id) {
        var modal = document.getElementById(id);
        if (modal) modal.classList.add('open');
    },

    closeModal: function(id) {
        var modal = document.getElementById(id);
        if (modal) modal.classList.remove('open');
    },

    showNotification: function(message, type) {
        var el = document.getElementById('notification');
        if (!el) {
            el = document.createElement('div');
            el.id = 'notification';
            el.className = 'notification';
            var container = document.querySelector('.main-content') || document.body;
            container.insertBefore(el, container.firstChild);
        }
        el.textContent = message;
        el.className = 'notification notification-' + (type || 'success') + ' show';
        setTimeout(function() { el.classList.remove('show'); }, 2500);
    },

    logout: function() {
        Auth.logout();
    },

    showError: function(message) {
        this.showNotification(message, 'error');
    }
};
