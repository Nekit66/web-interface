var Auth = {
    login: function(login, password) {
        return API.login(login, password).then(function(result) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('currentUser', JSON.stringify({
                id: result.user.id,
                login: result.user.login,
                fullName: result.user.fullName,
                roleCode: result.user.roleCode,
                roleName: result.user.roleName,
                departmentId: result.user.departmentId
            }));
            return { success: true };
        }).catch(function(err) {
            return { success: false, message: err.message || 'Ошибка входа' };
        });
    },

    logout: function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    getCurrentUser: function() {
        try {
            var stored = localStorage.getItem('currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    },

    checkAccess: function(allowedRoles) {
        var user = this.getCurrentUser();
        if (!user) return false;
        return allowedRoles.indexOf(user.roleName) !== -1;
    },

    checkAccessByCode: function(roleCodes) {
        var user = this.getCurrentUser();
        if (!user) return false;
        return roleCodes.indexOf(user.roleCode) !== -1;
    },

    requireAuth: function() {
        if (!this.getCurrentUser() || !API.getToken()) {
            window.location.href = 'index.html';
        }
    }
};
