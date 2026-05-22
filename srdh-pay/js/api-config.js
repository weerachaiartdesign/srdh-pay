// Version: 00123.0
// api-config.js
// Centralized Secure API Client
// SRDH PAY SYSTEM

'use strict';

// ====================== CONFIG ======================

const API_CONFIG = {

    APP_NAME: 'SRDH PAY',

    APP_VERSION: '00123.0',

    API_URL:
        'https://script.google.com/macros/s/AKfycbz0OPKeE7072A2Bzr46kcJe4HSSeR-LwPfiZKMUK_X2GbIEIG8omu49npKTO_Z8fQk_sg/exec',

    REQUEST_TIMEOUT: 30000,

    MAX_RETRY: 2,

    RETRY_DELAY: 1500,

    SESSION_DURATION_HOURS: 2,

    STORAGE_KEYS: {

        TOKEN: 'srdh_token',

        USER: 'srdh_user',

        SESSION_EXPIRE: 'srdh_session_expire',

        GUEST_TOKEN: 'srdh_guest_token',

        LAST_ACTIVITY: 'srdh_last_activity'
    }
};

// ====================== ROLE MATRIX ======================

const ROLE_PERMISSIONS = {

    admin: [
        'dashboard',
        'register',
        'import',
        'approve',
        'report',
        'settings',
        'edit',
        'delete',
        'export'
    ],

    editor: [
        'dashboard',
        'register',
        'approve',
        'edit'
    ],

    checker: [
        'dashboard',
        'register',
        'report'
    ],

    staff: [
        'dashboard',
        'register',
        'import',
        'report'
    ],

    guest: [
        'dashboard',
        'register'
    ]
};

// ====================== SESSION MANAGER ======================

const SessionManager = {

    setSession(data) {

        if (!data || !data.token || !data.user) {
            throw new Error('Invalid session data');
        }

        const expireAt = Date.now() +
            (
                API_CONFIG.SESSION_DURATION_HOURS *
                60 *
                60 *
                1000
            );

        localStorage.setItem(
            API_CONFIG.STORAGE_KEYS.TOKEN,
            data.token
        );

        localStorage.setItem(
            API_CONFIG.STORAGE_KEYS.USER,
            JSON.stringify(data.user)
        );

        localStorage.setItem(
            API_CONFIG.STORAGE_KEYS.SESSION_EXPIRE,
            expireAt
        );

        localStorage.setItem(
            API_CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
            Date.now()
        );
    },

    getToken() {

        return localStorage.getItem(
            API_CONFIG.STORAGE_KEYS.TOKEN
        );
    },

    getUser() {

        const raw = localStorage.getItem(
            API_CONFIG.STORAGE_KEYS.USER
        );

        if (!raw) {
            return null;
        }

        try {

            return JSON.parse(raw);

        } catch (error) {

            console.error(error);

            return null;
        }
    },

    isLoggedIn() {

        const token = this.getToken();

        const expireAt = Number(
            localStorage.getItem(
                API_CONFIG.STORAGE_KEYS.SESSION_EXPIRE
            )
        );

        if (!token || !expireAt) {
            return false;
        }

        if (Date.now() > expireAt) {

            this.clearSession();

            return false;
        }

        return true;
    },

    updateActivity() {

        localStorage.setItem(
            API_CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
            Date.now()
        );
    },

    clearSession() {

        localStorage.removeItem(
            API_CONFIG.STORAGE_KEYS.TOKEN
        );

        localStorage.removeItem(
            API_CONFIG.STORAGE_KEYS.USER
        );

        localStorage.removeItem(
            API_CONFIG.STORAGE_KEYS.SESSION_EXPIRE
        );

        localStorage.removeItem(
            API_CONFIG.STORAGE_KEYS.LAST_ACTIVITY
        );

        sessionStorage.clear();
    }
};

// ====================== SECURITY ENGINE ======================

const SecurityManager = {

    generateTimestamp() {

        return Date.now();
    },

    async sha256(message) {

        const msgBuffer = new TextEncoder()
            .encode(message);

        const hashBuffer =
            await crypto.subtle.digest(
                'SHA-256',
                msgBuffer
            );

        const hashArray =
            Array.from(new Uint8Array(hashBuffer));

        return hashArray
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    async generateSignature(timestamp) {

        const secret = 'SRDH_SECURE_SIGNATURE';

        return await this.sha256(
            secret + String(timestamp)
        );
    }
};

// ====================== API CLIENT ======================

const ApiClient = {

    async request(functionName, payload = {}) {

        const timestamp =
            SecurityManager.generateTimestamp();

        const signature =
            await SecurityManager
                .generateSignature(timestamp);

        const requestPayload = {

            ...payload,

            token: SessionManager.getToken(),

            timestamp: timestamp,

            signature: signature
        };

        return await this.fetchWithRetry(
            functionName,
            requestPayload
        );
    },

    async fetchWithRetry(
        functionName,
        payload,
        retryCount = 0
    ) {

        try {

            return await this.fetch(
                functionName,
                payload
            );

        } catch (error) {

            console.error(
                'API Retry:',
                retryCount,
                error
            );

            if (
                retryCount <
                API_CONFIG.MAX_RETRY
            ) {

                await this.delay(
                    API_CONFIG.RETRY_DELAY
                );

                return await this.fetchWithRetry(
                    functionName,
                    payload,
                    retryCount + 1
                );
            }

            throw error;
        }
    },

    async fetch(functionName, payload) {

        const controller =
            new AbortController();

        const timeoutId = setTimeout(() => {

            controller.abort();

        }, API_CONFIG.REQUEST_TIMEOUT);

        try {

            const response = await fetch(

                `${API_CONFIG.API_URL}?function=${functionName}`,

                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify(payload),

                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const result =
                await response.json();

            if (!result.success) {

                if (
                    result.code ===
                    'SESSION_EXPIRED'
                ) {

                    handleSessionExpired();
                }

                throw new Error(
                    result.message ||
                    'API Error'
                );
            }

            SessionManager.updateActivity();

            return result;

        } catch (error) {

            clearTimeout(timeoutId);

            if (
                error.name === 'AbortError'
            ) {

                throw new Error(
                    'Request timeout'
                );
            }

            throw error;
        }
    },

    delay(ms) {

        return new Promise(resolve => {

            setTimeout(resolve, ms);

        });
    }
};

// ====================== AUTH API ======================

const AuthAPI = {

    async login(email, password) {

        const result =
            await ApiClient.request(
                'loginUser',
                {
                    email: email,
                    password: password
                }
            );

        if (
            result.success &&
            result.token
        ) {

            SessionManager.setSession({

                token: result.token,

                user: result.user
            });
        }

        return result;
    },

    async guestLogin() {

        const guestId =
            'guest_' + Date.now();

        const result =
            await ApiClient.request(
                'guestLogin',
                {
                    guestId: guestId
                }
            );

        if (
            result.success &&
            result.token
        ) {

            SessionManager.setSession({

                token: result.token,

                user: result.user
            });
        }

        return result;
    },

    async logout() {

        try {

            await ApiClient.request(
                'logoutUser'
            );

        } catch (error) {

            console.warn(error);

        } finally {

            SessionManager.clearSession();

            window.location.href =
                'index.html';
        }
    }
};

// ====================== REGISTER API ======================

const RegisterAPI = {

    async getAll(filters = {}) {

        return await ApiClient.request(
            'getRegisterData',
            filters
        );
    },

    async updateStatus(data) {

        return await ApiClient.request(
            'updateStatus',
            data
        );
    },

    async delete(uuid) {

        return await ApiClient.request(
            'deleteRegisterRow',
            {
                uuid: uuid
            }
        );
    }
};

// ====================== IMPORT API ======================

const ImportAPI = {

    async save(data) {

        return await ApiClient.request(
            'saveImportData',
            data
        );
    }
};

// ====================== DASHBOARD API ======================

const DashboardAPI = {

    async getSummary() {

        return await ApiClient.request(
            'getDashboardData'
        );
    }
};

// ====================== REPORT API ======================

const ReportAPI = {

    async getReport(filters = {}) {

        return await ApiClient.request(
            'getReportData',
            filters
        );
    }
};

// ====================== SETTINGS API ======================

const SettingsAPI = {

    async getAll() {

        return await ApiClient.request(
            'getSettings'
        );
    },

    async add(type, value) {

        return await ApiClient.request(
            'addSetting',
            {
                type: type,
                value: value
            }
        );
    },

    async delete(type, value) {

        return await ApiClient.request(
            'deleteSetting',
            {
                type: type,
                value: value
            }
        );
    }
};

// ====================== PERMISSION ENGINE ======================

const PermissionManager = {

    hasRole(role) {

        const user =
            SessionManager.getUser();

        if (!user) {
            return false;
        }

        return user.role === role;
    },

    canAccess(permission) {

        const user =
            SessionManager.getUser();

        if (!user) {
            return false;
        }

        const permissions =
            ROLE_PERMISSIONS[user.role] || [];

        return permissions.includes(permission);
    },

    require(permission) {

        if (!this.canAccess(permission)) {

            alert(
                'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
            );

            window.location.href =
                'dashboard.html';

            return false;
        }

        return true;
    }
};

// ====================== SESSION EXPIRED ======================

function handleSessionExpired() {

    SessionManager.clearSession();

    alert(
        'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
    );

    window.location.href =
        'index.html';
}

// ====================== MULTI TAB SYNC ======================

window.addEventListener(
    'storage',
    function(event) {

        if (
            event.key ===
            API_CONFIG.STORAGE_KEYS.TOKEN &&
            !event.newValue
        ) {

            alert(
                'คุณถูกออกจากระบบ'
            );

            window.location.href =
                'index.html';
        }
    }
);

// ====================== AUTO SESSION CHECK ======================

setInterval(function() {

    if (!SessionManager.isLoggedIn()) {

        handleSessionExpired();
    }

}, 60000);

// ====================== GLOBAL ERROR HANDLER ======================

window.addEventListener(
    'unhandledrejection',
    function(event) {

        console.error(
            'Unhandled Promise Error:',
            event.reason
        );
    }
);

console.log(
    `${API_CONFIG.APP_NAME} API Client Loaded`
);
