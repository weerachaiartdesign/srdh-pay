// Version: 0200
// api-config.js
// Centralized API Client — SRDH PAY
// Backend: Google Apps Script (Code.gs v0200)

'use strict';

// ============================================================
// CONFIG
// ============================================================

const API_CONFIG = {

    APP_NAME   : 'SRDH PAY',
    APP_VERSION: '0200',

    // แก้เป็น URL จริงหลัง deploy GAS
    API_URL: 'https://script.google.com/macros/s/AKfycbxcUzP2MCjOvWn34ULBu8FIc5ldq2RO4DAAYLRaP0g7YAqyxr4bStza6h9s6wMOTRhKUg/exec',

    REQUEST_TIMEOUT: 30000,
    MAX_RETRY      : 2,
    RETRY_DELAY    : 1500,

    STORAGE_KEYS: {
        TOKEN         : 'srdh_token',
        USER          : 'srdh_user',
        SESSION_EXPIRE: 'srdh_session_expire',
        LAST_ACTIVITY : 'srdh_last_activity'
    }
};

// ============================================================
// ROLE PERMISSIONS (ใช้ตรวจสอบ UI ฝั่ง client)
// ============================================================

const ROLE_PERMISSIONS = {
    admin  : ['dashboard','register','import','approve','report','settings','edit','delete','export'],
    editor : ['dashboard','register','approve','edit'],
    checker: ['dashboard','register','report','approve'],
    staff  : ['dashboard','register','import','report'],
    guest  : ['dashboard','register']
};

// ============================================================
// SESSION MANAGER
// ============================================================

const SessionManager = {

    setSession(data) {

        if (!data || !data.token || !data.user) {
            throw new Error('Invalid session data');
        }

        // ใช้ expireAt จาก server ถ้ามี ไม่งั้น fallback 8 ชม.
        const expireAt = data.expireAt
            ? new Date(data.expireAt).getTime()
            : Date.now() + (8 * 60 * 60 * 1000);

        localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN,          data.token);
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER,           JSON.stringify(data.user));
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.SESSION_EXPIRE, String(expireAt));
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.LAST_ACTIVITY,  String(Date.now()));
    },

    getToken() {
        return localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    },

    getUser() {
        try {
            const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    isLoggedIn() {

        const token    = this.getToken();
        const expireAt = Number(localStorage.getItem(API_CONFIG.STORAGE_KEYS.SESSION_EXPIRE));

        if (!token || !expireAt) return false;

        if (Date.now() > expireAt) {
            this.clearSession();
            return false;
        }

        return true;
    },

    updateActivity() {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
    },

    clearSession() {
        Object.values(API_CONFIG.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        sessionStorage.clear();
    }
};

// ============================================================
// API CLIENT
// ============================================================

const ApiClient = {

    async request(functionName, payload = {}) {

        const requestPayload = {
            ...payload,
            function: functionName,
            token   : SessionManager.getToken()
        };

        return await this._fetchWithRetry(functionName, requestPayload);
    },

    async _fetchWithRetry(functionName, payload, retryCount = 0) {

        try {

            return await this._fetch(payload);

        } catch (error) {

            if (retryCount < API_CONFIG.MAX_RETRY) {
                await this._delay(API_CONFIG.RETRY_DELAY);
                return await this._fetchWithRetry(functionName, payload, retryCount + 1);
            }

            throw error;
        }
    },

    async _fetch(payload) {

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

        try {

            const response = await fetch(API_CONFIG.API_URL, {
                method : 'POST',
                // ใช้ text/plain เพื่อหลีกเลี่ยง CORS preflight บน GAS
                // GAS ไม่รองรับ OPTIONS preflight — body ยังเป็น JSON ปกติ
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body   : JSON.stringify(payload),
                signal : controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const result = await response.json();

            // Session หมดอายุ
            if (!result.success &&
                (result.message === 'Session expired' ||
                 result.message === 'Session invalid'  ||
                 result.message === 'Session token required')) {
                _handleSessionExpired();
                throw new Error(result.message);
            }

            if (!result.success) {
                throw new Error(result.message || 'API Error');
            }

            SessionManager.updateActivity();

            return result;

        } catch (error) {

            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout — กรุณาลองใหม่');
            }

            throw error;
        }
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ============================================================
// AUTH API
// ============================================================

const AuthAPI = {

    async login(email, password) {

        const result = await ApiClient.request('loginUser', { email, password });

        if (result.token && result.user) {
            SessionManager.setSession({
                token   : result.token,
                user    : result.user,
                expireAt: result.expireAt
            });
        }

        return result;
    },

    async guestAccess() {

        const result = await ApiClient.request('guestAccess', {});

        if (result.token && result.user) {
            SessionManager.setSession({
                token   : result.token,
                user    : result.user,
                expireAt: result.expireAt
            });
        }

        return result;
    },

    async logout() {

        try {
            await ApiClient.request('logoutUser', {});
        } catch (e) {
            console.warn('logout error:', e);
        } finally {
            SessionManager.clearSession();
            window.location.href = 'index.html';
        }
    },

    async validateToken() {
        return await ApiClient.request('validateToken', {});
    }
};

// ============================================================
// REGISTER API
// ============================================================

const RegisterAPI = {

    // ดึงรายการ พร้อม pagination + filter
    async getList(params = {}) {
        return await ApiClient.request('getRegisterList', params);
    },

    // ดึงรายการเดียว
    async getDetail(uuid) {
        return await ApiClient.request('getRegisterDetail', { uuid });
    },

    // ค้นหา
    async search(keyword) {
        return await ApiClient.request('searchRegister', { keyword });
    },

    // สร้างใหม่ (manual)
    async create(items) {
        return await ApiClient.request('createRegister', { items });
    },

    // แก้ไข
    async update(uuid, data, note = '') {
        return await ApiClient.request('updateRegisterRow', { uuid, data, note });
    },

    // ลบ (ต้องส่ง confirmText: 'DELETE')
    async delete(uuid, note = '') {
        return await ApiClient.request('deleteRegisterRow', {
            uuid,
            confirmText: 'DELETE',
            note
        });
    },

    // อัปเดตสถานะ
    async updateStatus(uuid, action, note = '') {
        return await ApiClient.request('updateStatus', { uuid, action, note });
    },

    // อัปเดตสถานะหลายรายการ
    async batchUpdateStatus(uuids, action, note = '') {
        return await ApiClient.request('batchUpdateStatus', { uuids, action, note });
    },

    // ดู timeline
    async getTimeline(uuid) {
        return await ApiClient.request('getTimeline', { uuid });
    },

    // ตรวจสอบ duplicate ก่อน import
    async previewImport(rows, filename) {
        return await ApiClient.request('previewImport', { rows, filename });
    },

    // ยืนยัน import จริง
    async confirmImport(rows, filename) {
        return await ApiClient.request('confirmImport', { rows, filename });
    },

    // ประวัติ import
    async getImportHistory() {
        return await ApiClient.request('getImportHistory', {});
    },

    // Master data (moneyTypes, depts, statuses ฯลฯ)
    async getMasterData() {
        return await ApiClient.request('getMasterData', {});
    }
};

// ============================================================
// DASHBOARD API
// ============================================================

const DashboardAPI = {

    async getSummary() {
        return await ApiClient.request('getDashboardData', {});
    }
};

// ============================================================
// REPORT API
// ============================================================

const ReportAPI = {

    async getReport(filters = {}) {
        return await ApiClient.request('getReportData', { filters });
    },

    async getPrintSummary(filters = {}) {
        return await ApiClient.request('getPrintSummary', { filters });
    },

    async export(type, filters = {}) {
        return await ApiClient.request('exportReport', { type, filters });
    }
};

// ============================================================
// SETTINGS API
// ============================================================

const SettingsAPI = {

    async getAll() {
        return await ApiClient.request('getSettingsData', {});
    },

    // type: 'money_type' | 'checker' | 'alias' | 'vendor'
    async add(type, name, color = '') {
        return await ApiClient.request('addSetting', { type, name, color });
    },

    async update(id, fields = {}) {
        return await ApiClient.request('updateSetting', { id, ...fields });
    },

    // ต้องส่ง confirmText: 'DELETE'
    async delete(id) {
        return await ApiClient.request('deleteSetting', {
            id,
            confirmText: 'DELETE'
        });
    }
};

// ============================================================
// USER API
// ============================================================

const UserAPI = {

    async getAll() {
        return await ApiClient.request('getUsers', {});
    },

    async create(data) {
        return await ApiClient.request('createUser', data);
    },

    async update(email, data) {
        return await ApiClient.request('updateUser', { email, ...data });
    },

    async toggleStatus(email) {
        return await ApiClient.request('toggleUserStatus', { email });
    }
};

// ============================================================
// SYSTEM API
// ============================================================

const SystemAPI = {

    async getStatus() {
        return await ApiClient.request('getSystemStatus', {});
    },

    async getAuditLogs() {
        return await ApiClient.request('getAuditLogs', {});
    },

    async backup() {
        return await ApiClient.request('backupSystem', {});
    },

    async clearCache() {
        return await ApiClient.request('clearCache', {});
    },

    async initializeSheets() {
        return await ApiClient.request('initializeSheets', {});
    },

    async healthCheck() {
        return await ApiClient.request('healthCheck', {});
    }
};

// ============================================================
// PERMISSION MANAGER
// ============================================================

const PermissionManager = {

    hasRole(role) {
        const user = SessionManager.getUser();
        return user ? user.role === role : false;
    },

    canAccess(permission) {
        const user = SessionManager.getUser();
        if (!user) return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        return perms.includes(permission);
    },

    require(permission) {
        if (!this.canAccess(permission)) {
            UI.showToast('ไม่มีสิทธิ์เข้าถึงส่วนนี้', 'error');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
            return false;
        }
        return true;
    }
};

// ============================================================
// SESSION EXPIRED HANDLER
// ============================================================

function _handleSessionExpired() {
    SessionManager.clearSession();
    UI.showToast('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
}

// ============================================================
// MULTI TAB SYNC
// ============================================================

window.addEventListener('storage', function (event) {
    if (event.key === API_CONFIG.STORAGE_KEYS.TOKEN && !event.newValue) {
        _handleSessionExpired();
    }
});

// ============================================================
// AUTO SESSION CHECK (ทุก 1 นาที)
// ============================================================

setInterval(function () {
    if (SessionManager.isLoggedIn()) return;

    const page = window.location.pathname.split('/').pop();
    const publicPages = ['login.html', 'index.html', ''];

    if (!publicPages.includes(page)) {
        _handleSessionExpired();
    }
}, 60000);

// ============================================================
// GLOBAL UNHANDLED REJECTION
// ============================================================

window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled Promise Error:', event.reason);
});

console.log(API_CONFIG.APP_NAME + ' API Client v' + API_CONFIG.APP_VERSION + ' loaded');
