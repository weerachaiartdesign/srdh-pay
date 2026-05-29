// Version: 0200
// main.js
// SRDH PAY Frontend Runtime Engine

'use strict';

// ============================================================
// APP CONFIG
// ============================================================

const APP_CONFIG = {
    DASHBOARD_REFRESH_INTERVAL: 5 * 60 * 1000,  // 5 นาที
    INACTIVE_TIMEOUT          : 30 * 60 * 1000, // 30 นาที
    MOBILE_BREAKPOINT         : 768,
    TOAST_DURATION            : 4000
};

// ============================================================
// APP STATE
// ============================================================

const AppState = {
    initialized  : false,
    currentUser  : null,
    currentPage  : '',
    isMobile     : false,
    loadingCount : 0,
    dashboardTimer: null,
    inactivityTimer: null
};

// ============================================================
// DOM READY
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await App.init();
    } catch (error) {
        console.error('App init error:', error);
        UI.showToast(error.message, 'error');
    }
});

// ============================================================
// THEME MANAGER
// ============================================================

const ThemeManager = {

    STORAGE_KEY: 'srdh_theme',

    init() {
        // Default: light mode เสมอ ถ้าไม่เคย save ค่าไว้
        const saved = localStorage.getItem(this.STORAGE_KEY);
        const isDark = saved === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        this._updateIcon(isDark);
    },

    toggle() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
        this._updateIcon(isDark);
    },

    isDark() {
        return document.documentElement.classList.contains('dark');
    },

    _updateIcon(isDark) {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        btn.innerHTML = isDark
            ? '<span>☀️</span><span>Light Mode</span>'
            : '<span>🌙</span><span>Dark Mode</span>';
        btn.title = isDark ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode';
    }
};

// ============================================================
// APP ENGINE
// ============================================================

const App = {

    async init() {

        ThemeManager.init();
        this.detectPage();
        this.detectDevice();
        this.setupGlobalEvents();
        this.setupResponsiveLayout();
        this.initializeGlobalComponents();

        // Login page — ไม่ต้องตรวจ session
        if (AppState.currentPage === 'index.html' ||
            AppState.currentPage === 'index.html' ||
            AppState.currentPage === '') {
            AppState.initialized = true;
            return;
        }

        // ตรวจ session
        if (!SessionManager.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        AppState.currentUser = SessionManager.getUser();

        this.setupPermissionUI();
        this.renderUserInfo();
        Navigation.renderMenu();
        RouteGuard.check();
        this.setupDashboardRefresh();
        this.startInactivityWatcher();

        AppState.initialized = true;
        console.log('SRDH PAY initialized — user:', AppState.currentUser.email);
    },

    detectPage() {
        const path = window.location.pathname;
        AppState.currentPage = path.split('/').pop() || 'index.html';
    },

    detectDevice() {
        AppState.isMobile = window.innerWidth < APP_CONFIG.MOBILE_BREAKPOINT;
    },

    setupGlobalEvents() {

        window.addEventListener('resize', debounce(() => {
            this.detectDevice();
            this.setupResponsiveLayout();
        }, 300));

        document.addEventListener('click',   () => this.resetInactivity());
        document.addEventListener('keydown', () => this.resetInactivity());
    },

    setupResponsiveLayout() {
        if (AppState.currentPage === 'list.html' ||
            AppState.currentPage === 'approve.html') {
            RegisterResponsive.render();
        }
    },

    setupPermissionUI() {

        // ซ่อน element ที่ไม่มีสิทธิ์
        document.querySelectorAll('[data-permission]').forEach(el => {
            if (!PermissionManager.canAccess(el.dataset.permission)) {
                el.remove();
            }
        });

        // ซ่อน element ที่กำหนด role
        document.querySelectorAll('[data-role]').forEach(el => {
            const roles = el.dataset.role.split(',').map(r => r.trim());
            if (!roles.includes(AppState.currentUser?.role)) {
                el.remove();
            }
        });
    },

    renderUserInfo() {

        const user = AppState.currentUser;
        if (!user) return;

        // แสดงชื่อ user
        const nameEl = document.getElementById('userDisplayName');
        if (nameEl) nameEl.textContent = user.username || user.email;

        // แสดง role badge
        const roleEl = document.getElementById('userRoleBadge');
        if (roleEl) {
            roleEl.textContent = _roleLabel(user.role);
            roleEl.className   = 'text-xs px-2 py-0.5 rounded-full ' + _roleBadgeClass(user.role);
        }

        // แสดง dept
        const deptEl = document.getElementById('userDeptDisplay');
        if (deptEl) deptEl.textContent = user.dept || '';
    },

    setupDashboardRefresh() {

        if (AppState.currentPage !== 'dashboard.html') return;

        if (AppState.dashboardTimer) clearInterval(AppState.dashboardTimer);

        AppState.dashboardTimer = setInterval(async () => {
            try {
                if (typeof loadDashboard === 'function') {
                    await loadDashboard();
                }
            } catch (e) {
                console.error('Dashboard refresh error:', e);
            }
        }, APP_CONFIG.DASHBOARD_REFRESH_INTERVAL);
    },

    startInactivityWatcher() {
        this.resetInactivity();
    },

    resetInactivity() {

        if (AppState.inactivityTimer) clearTimeout(AppState.inactivityTimer);

        AppState.inactivityTimer = setTimeout(() => {
            this._handleInactiveLogout();
        }, APP_CONFIG.INACTIVE_TIMEOUT);
    },

    _handleInactiveLogout() {
        UI.showToast('หมดเวลาการใช้งาน กำลังออกจากระบบ...', 'error');
        setTimeout(async () => {
            await AuthAPI.logout();
        }, 1500);
    },

    initializeGlobalComponents() {
        UI.createToastContainer();
        UI.createLoadingOverlay();
        UI.createConfirmModal();
    }
};

// ============================================================
// ROUTE GUARD
// ============================================================

const RouteGuard = {

    check() {

        const pagePermissions = {
            'dashboard.html': 'dashboard',
            'list.html'     : 'register',
            'import.html'   : 'import',
            'approve.html'  : 'approve',
            'report.html'   : 'report',
            'settings.html' : 'settings'
        };

        const required = pagePermissions[AppState.currentPage];

        if (!required) return true;

        if (!PermissionManager.canAccess(required)) {
            UI.showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
            return false;
        }

        return true;
    }
};

// ============================================================
// NAVIGATION
// ============================================================

const Navigation = {

    renderMenu() {

        const container = document.getElementById('sidebarMenu');
        if (!container) return;

        const menus = [
            { label: 'Dashboard', icon: '📊', page: 'dashboard.html', permission: 'dashboard' },
            { label: 'ทะเบียน',   icon: '📋', page: 'list.html',      permission: 'register'  },
            { label: 'Import',    icon: '📥', page: 'import.html',    permission: 'import'    },
            { label: 'Approve',   icon: '✅', page: 'approve.html',   permission: 'approve'   },
            { label: 'Report',    icon: '📈', page: 'report.html',    permission: 'report'    },
            { label: 'Settings',  icon: '⚙️', page: 'settings.html',  permission: 'settings'  }
        ];

        container.innerHTML = '';

        menus.forEach(menu => {

            if (!PermissionManager.canAccess(menu.permission)) return;

            const active = AppState.currentPage === menu.page;

            const a       = document.createElement('a');
            a.href        = menu.page;
            a.className   = [
                'flex items-center gap-2 px-4 py-2.5 rounded-lg mb-1 text-sm transition-all',
                active
                    ? 'bg-violet-600 text-white font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
            ].join(' ');
            a.innerHTML   = `<span>${menu.icon}</span><span>${menu.label}</span>`;

            container.appendChild(a);
        });

        // Divider
        const divider     = document.createElement('div');
        divider.className = 'border-t border-white border-opacity-20 my-2';
        container.appendChild(divider);

        // Theme Toggle button
        const themeBtn       = document.createElement('button');
        themeBtn.id          = 'themeToggleBtn';
        themeBtn.className   = 'flex items-center gap-2 px-4 py-2.5 rounded-lg mb-1 text-sm w-full text-left transition-all ' +
            'text-gray-600 hover:bg-violet-50 hover:text-violet-700 ' +
            'dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white';
        themeBtn.innerHTML   = ThemeManager.isDark()
            ? '<span>☀️</span><span>Light Mode</span>'
            : '<span>🌙</span><span>Dark Mode</span>';
        themeBtn.title       = ThemeManager.isDark() ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode';
        themeBtn.onclick     = () => ThemeManager.toggle();
        container.appendChild(themeBtn);

        // Logout button
        const logoutBtn       = document.createElement('button');
        logoutBtn.className   = 'flex items-center gap-2 px-4 py-2.5 rounded-lg mb-1 text-sm w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-300 transition-all';
        logoutBtn.innerHTML   = '<span>🚪</span><span>ออกจากระบบ</span>';
        logoutBtn.onclick     = async () => {
            const ok = await UI.confirmModal('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่?');
            if (ok) await AuthAPI.logout();
        };
        container.appendChild(logoutBtn);
    }
};

// ============================================================
// UI ENGINE
// ============================================================

const UI = {

    showLoading() {
        AppState.loadingCount++;
        const el = document.getElementById('globalLoadingOverlay');
        if (el) el.classList.remove('hidden');
    },

    hideLoading() {
        AppState.loadingCount = Math.max(0, AppState.loadingCount - 1);
        if (AppState.loadingCount === 0) {
            const el = document.getElementById('globalLoadingOverlay');
            if (el) el.classList.add('hidden');
        }
    },

    showToast(message, type = 'success') {

        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast       = document.createElement('div');
        const colorClass  = {
            success: 'bg-green-500',
            error  : 'bg-red-500',
            warning: 'bg-yellow-500',
            info   : 'bg-blue-500'
        }[type] || 'bg-green-500';

        toast.className = `px-4 py-3 rounded-lg shadow-lg text-white text-sm mb-2 transition-all ${colorClass}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, APP_CONFIG.TOAST_DURATION);
    },

    async confirmModal(title, message) {

        return new Promise(resolve => {

            const modal   = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmModalTitle');
            const msgEl   = document.getElementById('confirmModalMessage');
            const okBtn   = document.getElementById('confirmModalConfirm');
            const cancelBtn = document.getElementById('confirmModalCancel');

            if (!modal) { resolve(false); return; }

            titleEl.textContent = title;
            msgEl.textContent   = message;
            modal.classList.remove('hidden');

            const cleanup = () => modal.classList.add('hidden');

            okBtn.onclick = () => { cleanup(); resolve(true);  };
            cancelBtn.onclick = () => { cleanup(); resolve(false); };
        });
    },

    // Confirm modal พร้อม input field (สำหรับการลบที่ต้องพิมพ์ยืนยัน)
    async confirmWithInput(title, message, expectedText) {

        return new Promise(resolve => {

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl mx-4">
                    <h2 class="text-lg font-bold mb-2 text-red-600">${title}</h2>
                    <p class="text-sm text-gray-600 mb-4">${message}</p>
                    <p class="text-sm text-gray-500 mb-2">พิมพ์ <strong class="text-red-500">${expectedText}</strong> เพื่อยืนยัน</p>
                    <input type="text" id="confirmInput"
                        class="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="พิมพ์ ${expectedText}">
                    <div class="flex justify-end gap-2">
                        <button id="cancelInputConfirm"
                            class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
                        <button id="okInputConfirm"
                            class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">ยืนยัน</button>
                    </div>
                </div>`;

            document.body.appendChild(modal);

            const cleanup = () => modal.remove();

            modal.querySelector('#cancelInputConfirm').onclick = () => { cleanup(); resolve(false); };
            modal.querySelector('#okInputConfirm').onclick     = () => {
                const val = modal.querySelector('#confirmInput').value.trim();
                if (val !== expectedText) {
                    modal.querySelector('#confirmInput').classList.add('border-red-400');
                    return;
                }
                cleanup();
                resolve(true);
            };
        });
    },

    createToastContainer() {
        if (document.getElementById('toastContainer')) return;
        const el      = document.createElement('div');
        el.id         = 'toastContainer';
        el.className  = 'fixed top-4 right-4 z-50 max-w-sm w-full';
        document.body.appendChild(el);
    },

    createLoadingOverlay() {
        if (document.getElementById('globalLoadingOverlay')) return;
        const el      = document.createElement('div');
        el.id         = 'globalLoadingOverlay';
        el.className  = 'hidden fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50';
        el.innerHTML  = `
            <div class="bg-white rounded-xl px-8 py-5 shadow-xl flex items-center gap-3">
                <div class="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm text-gray-600">กำลังโหลด...</span>
            </div>`;
        document.body.appendChild(el);
    },

    createConfirmModal() {
        if (document.getElementById('confirmModal')) return;
        const el      = document.createElement('div');
        el.id         = 'confirmModal';
        el.className  = 'hidden fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
        el.innerHTML  = `
            <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl mx-4">
                <h2 id="confirmModalTitle"   class="text-lg font-bold mb-3"></h2>
                <p  id="confirmModalMessage" class="text-sm text-gray-600 mb-6"></p>
                <div class="flex justify-end gap-2">
                    <button id="confirmModalCancel"
                        class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
                    <button id="confirmModalConfirm"
                        class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">ยืนยัน</button>
                </div>
            </div>`;
        document.body.appendChild(el);
    }
};

// ============================================================
// RESPONSIVE REGISTER TABLE
// ============================================================

const RegisterResponsive = {

    render() {
        const desktop = document.getElementById('registerDesktopTable');
        const mobile  = document.getElementById('registerMobileCard');

        if (AppState.isMobile) {
            if (desktop) desktop.classList.add('hidden');
            if (mobile)  mobile.classList.remove('hidden');
        } else {
            if (desktop) desktop.classList.remove('hidden');
            if (mobile)  mobile.classList.add('hidden');
        }
    }
};

// ============================================================
// FORMATTER
// ============================================================

const Formatter = {

    currency(number) {
        return Number(number || 0).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    thaiDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        const day   = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year  = d.getFullYear() + 543;
        return `${day}/${month}/${year}`;
    },

    // "680000007" → "7/68"
    runningNo(value) {
        if (!value) return '-';
        const raw = String(value).replace(/\D/g, '');
        if (raw.length < 3) return String(value);
        const year    = raw.substring(0, 2);
        const running = parseInt(raw.substring(2), 10);
        return `${running}/${year}`;
    },

    shortText(text, maxLen = 40) {
        if (!text) return '-';
        const s = String(text);
        return s.length > maxLen ? s.substring(0, maxLen) + '…' : s;
    }
};

// ============================================================
// STATUS HELPERS
// ============================================================

const StatusHelper = {

    // CSS class สำหรับ badge
    badgeClass(status) {
        const map = {
            'รอดำเนินการ': 'status-r-waiting',
            'รับเอกสาร'  : 'status-r-received',
            'ส่งแก้ไข'   : 'bg-orange-100 text-orange-700',
            'รับคืน'     : 'bg-purple-100 text-purple-700',
            'ตรวจผ่าน'   : 'bg-teal-100 text-teal-700',
            'เสนอ'       : 'bg-cyan-100 text-cyan-700',
            'อนุมัติ'    : 'status-r-approved',
            'จ่ายแล้ว'   : 'status-r-paid',
            'ยกเลิก'     : 'status-r-cancel'
        };
        return map[status] || 'bg-gray-100 text-gray-600';
    },

    badge(status) {
        return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${this.badgeClass(status)}">${status || '-'}</span>`;
    }
};

// ============================================================
// EVENT BUS
// ============================================================

const EventBus = {

    _events: {},

    on(event, callback) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
    },

    off(event, callback) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        (this._events[event] || []).forEach(cb => cb(data));
    }
};

// ============================================================
// PAGINATION HELPER
// ============================================================

const Pagination = {

    // render pagination buttons
    render(container, currentPage, totalPages, onPageChange) {

        if (!container) return;

        container.innerHTML = '';

        if (totalPages <= 1) return;

        const pages = this._getPageNumbers(currentPage, totalPages);

        const prev       = document.createElement('button');
        prev.className   = 'px-3 py-1.5 rounded border text-sm ' +
            (currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-violet-50');
        prev.textContent = '←';
        prev.disabled    = currentPage <= 1;
        prev.onclick     = () => onPageChange(currentPage - 1);
        container.appendChild(prev);

        pages.forEach(p => {

            const btn       = document.createElement('button');
            btn.className   = 'px-3 py-1.5 rounded border text-sm ' +
                (p === currentPage
                    ? 'bg-violet-600 text-white border-violet-600'
                    : p === '...'
                        ? 'cursor-default opacity-50'
                        : 'hover:bg-violet-50');
            btn.textContent = p;
            btn.disabled    = p === '...';
            if (p !== '...') btn.onclick = () => onPageChange(p);
            container.appendChild(btn);
        });

        const next       = document.createElement('button');
        next.className   = 'px-3 py-1.5 rounded border text-sm ' +
            (currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-violet-50');
        next.textContent = '→';
        next.disabled    = currentPage >= totalPages;
        next.onclick     = () => onPageChange(currentPage + 1);
        container.appendChild(next);
    },

    _getPageNumbers(current, total) {

        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        const pages = [1];

        if (current > 3)       pages.push('...');
        if (current > 2)       pages.push(current - 1);
        if (current !== 1 && current !== total) pages.push(current);
        if (current < total - 1) pages.push(current + 1);
        if (current < total - 2) pages.push('...');

        pages.push(total);

        return [...new Set(pages)];
    }
};

// ============================================================
// UTILITIES
// ============================================================

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================
// ROLE HELPERS (internal)
// ============================================================

function _roleLabel(role) {
    const map = {
        admin  : 'Admin',
        editor : 'Editor',
        checker: 'Checker',
        staff  : 'Staff',
        guest  : 'Guest'
    };
    return map[role] || role;
}

function _roleBadgeClass(role) {
    const map = {
        admin  : 'bg-red-100 text-red-700',
        editor : 'bg-blue-100 text-blue-700',
        checker: 'bg-green-100 text-green-700',
        staff  : 'bg-yellow-100 text-yellow-700',
        guest  : 'bg-gray-100 text-gray-600'
    };
    return map[role] || 'bg-gray-100 text-gray-600';
}

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

window.onerror = function (message, source, lineno, colno, error) {
    console.error({ message, source, lineno, colno, error });
    UI.showToast('เกิดข้อผิดพลาดในระบบ', 'error');
};

window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled Promise:', event.reason);
    UI.showToast(
        event.reason?.message || 'เกิดข้อผิดพลาด',
        'error'
    );
});

console.log('SRDH PAY Runtime v' + (typeof API_CONFIG !== 'undefined' ? API_CONFIG.APP_VERSION : '0200') + ' loaded');
