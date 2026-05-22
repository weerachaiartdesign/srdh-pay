// Version: 00123.0
// main.js
// SRDH PAY Frontend Runtime Engine

'use strict';

// ====================== APP CONFIG ======================

const APP_CONFIG = {

    DASHBOARD_REFRESH_INTERVAL:
        5 * 60 * 1000,

    INACTIVE_TIMEOUT:
        30 * 60 * 1000,

    MOBILE_BREAKPOINT: 768,

    TOAST_DURATION: 4000
};

// ====================== GLOBAL APP STORE ======================

const AppState = {

    initialized: false,

    currentUser: null,

    currentPage: '',

    isMobile: false,

    loadingCount: 0,

    dashboardTimer: null,

    inactivityTimer: null
};

// ====================== APP INITIALIZER ======================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        try {

            await App.init();

        } catch (error) {

            console.error(error);

            UI.showToast(
                error.message,
                'error'
            );
        }
    }
);

// ====================== APP ENGINE ======================

const App = {

    async init() {

        this.detectPage();

        this.detectDevice();

        this.restoreSession();

        this.setupGlobalEvents();

        this.setupResponsiveLayout();

        this.setupPermissionUI();

        this.setupDashboardRefresh();

        this.startInactivityWatcher();

        this.initializeGlobalComponents();

        AppState.initialized = true;

        console.log(
            'SRDH PAY initialized'
        );
    },

    detectPage() {

        const path =
            window.location.pathname;

        const fileName =
            path.split('/').pop();

        AppState.currentPage =
            fileName || 'index.html';
    },

    detectDevice() {

        AppState.isMobile =
            window.innerWidth <
            APP_CONFIG.MOBILE_BREAKPOINT;
    },

    restoreSession() {

        if (
            !SessionManager.isLoggedIn()
        ) {

            this.handleGuestAccess();

            return;
        }

        AppState.currentUser =
            SessionManager.getUser();

        Navigation.renderMenu();

        RouteGuard.check();
    },

    handleGuestAccess() {

        const publicPages = [

            'index.html',

            'dashboard.html',

            'list.html'
        ];

        if (
            !publicPages.includes(
                AppState.currentPage
            )
        ) {

            window.location.href =
                'index.html';
        }
    },

    setupGlobalEvents() {

        window.addEventListener(
            'resize',
            debounce(() => {

                this.detectDevice();

                this.setupResponsiveLayout();

            }, 300)
        );

        document.addEventListener(
            'click',
            () => this.resetInactivity()
        );

        document.addEventListener(
            'keydown',
            () => this.resetInactivity()
        );
    },

    setupResponsiveLayout() {

        if (
            AppState.currentPage ===
            'list.html'
        ) {

            RegisterResponsive.render();
        }
    },

    setupPermissionUI() {

        const elements =
            document.querySelectorAll(
                '[data-permission]'
            );

        elements.forEach(element => {

            const permission =
                element.dataset.permission;

            if (
                !PermissionManager
                    .canAccess(permission)
            ) {

                element.remove();
            }
        });
    },

    setupDashboardRefresh() {

        if (
            AppState.currentPage !==
            'dashboard.html'
        ) {

            return;
        }

        if (AppState.dashboardTimer) {

            clearInterval(
                AppState.dashboardTimer
            );
        }

        AppState.dashboardTimer =
            setInterval(async () => {

                try {

                    if (
                        typeof loadDashboard ===
                        'function'
                    ) {

                        await loadDashboard();
                    }

                } catch (error) {

                    console.error(error);
                }

            }, APP_CONFIG.DASHBOARD_REFRESH_INTERVAL);
    },

    startInactivityWatcher() {

        this.resetInactivity();
    },

    resetInactivity() {

        if (
            AppState.inactivityTimer
        ) {

            clearTimeout(
                AppState.inactivityTimer
            );
        }

        AppState.inactivityTimer =
            setTimeout(() => {

                this.handleInactiveLogout();

            }, APP_CONFIG.INACTIVE_TIMEOUT);
    },

    handleInactiveLogout() {

        UI.alertModal(
            'หมดเวลาการใช้งาน',
            'ระบบจะออกจากระบบอัตโนมัติ'
        );

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

// ====================== ROUTE GUARD ======================

const RouteGuard = {

    check() {

        const pagePermissions = {

            'dashboard.html':
                'dashboard',

            'list.html':
                'register',

            'import.html':
                'import',

            'approve.html':
                'approve',

            'report.html':
                'report',

            'settings.html':
                'settings'
        };

        const requiredPermission =
            pagePermissions[
                AppState.currentPage
            ];

        if (!requiredPermission) {

            return true;
        }

        if (
            !PermissionManager
                .canAccess(
                    requiredPermission
                )
        ) {

            UI.showToast(
                'ไม่มีสิทธิ์เข้าถึง',
                'error'
            );

            setTimeout(() => {

                window.location.href =
                    'dashboard.html';

            }, 1200);

            return false;
        }

        return true;
    }
};

// ====================== NAVIGATION ENGINE ======================

const Navigation = {

    renderMenu() {

        const container =
            document.getElementById(
                'sidebarMenu'
            );

        if (!container) {
            return;
        }

        const menus = [

            {
                label: 'Dashboard',
                page: 'dashboard.html',
                permission: 'dashboard'
            },

            {
                label: 'ทะเบียน',
                page: 'list.html',
                permission: 'register'
            },

            {
                label: 'Import',
                page: 'import.html',
                permission: 'import'
            },

            {
                label: 'Approve',
                page: 'approve.html',
                permission: 'approve'
            },

            {
                label: 'Report',
                page: 'report.html',
                permission: 'report'
            },

            {
                label: 'Settings',
                page: 'settings.html',
                permission: 'settings'
            }
        ];

        container.innerHTML = '';

        menus.forEach(menu => {

            if (
                !PermissionManager
                    .canAccess(
                        menu.permission
                    )
            ) {

                return;
            }

            const active =
                AppState.currentPage ===
                menu.page;

            const button =
                document.createElement('a');

            button.href = menu.page;

            button.className =
                `
                block
                px-4
                py-2
                rounded-lg
                mb-1
                transition
                ${
                    active
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }
                `;

            button.textContent =
                menu.label;

            container.appendChild(
                button
            );
        });
    }
};

// ====================== UI ENGINE ======================

const UI = {

    showLoading() {

        AppState.loadingCount++;

        const overlay =
            document.getElementById(
                'globalLoadingOverlay'
            );

        if (overlay) {

            overlay.classList.remove(
                'hidden'
            );
        }
    },

    hideLoading() {

        AppState.loadingCount--;

        if (
            AppState.loadingCount < 0
        ) {

            AppState.loadingCount = 0;
        }

        if (
            AppState.loadingCount === 0
        ) {

            const overlay =
                document.getElementById(
                    'globalLoadingOverlay'
                );

            if (overlay) {

                overlay.classList.add(
                    'hidden'
                );
            }
        }
    },

    showToast(
        message,
        type = 'success'
    ) {

        const container =
            document.getElementById(
                'toastContainer'
            );

        if (!container) {
            return;
        }

        const toast =
            document.createElement('div');

        toast.className =
            `
            px-4
            py-3
            rounded-lg
            shadow-lg
            text-white
            mb-2
            animate-fade-in
            ${
                type === 'error'
                ? 'bg-red-500'
                : 'bg-green-500'
            }
            `;

        toast.textContent =
            message;

        container.appendChild(toast);

        setTimeout(() => {

            toast.remove();

        }, APP_CONFIG.TOAST_DURATION);
    },

    async confirmModal(
        title,
        message
    ) {

        return new Promise(resolve => {

            const modal =
                document.getElementById(
                    'confirmModal'
                );

            const titleElement =
                document.getElementById(
                    'confirmModalTitle'
                );

            const messageElement =
                document.getElementById(
                    'confirmModalMessage'
                );

            const confirmButton =
                document.getElementById(
                    'confirmModalConfirm'
                );

            const cancelButton =
                document.getElementById(
                    'confirmModalCancel'
                );

            titleElement.textContent =
                title;

            messageElement.textContent =
                message;

            modal.classList.remove(
                'hidden'
            );

            confirmButton.onclick =
                function() {

                    modal.classList.add(
                        'hidden'
                    );

                    resolve(true);
                };

            cancelButton.onclick =
                function() {

                    modal.classList.add(
                        'hidden'
                    );

                    resolve(false);
                };
        });
    },

    alertModal(
        title,
        message
    ) {

        this.showToast(
            `${title}: ${message}`,
            'error'
        );
    },

    createToastContainer() {

        if (
            document.getElementById(
                'toastContainer'
            )
        ) {

            return;
        }

        const container =
            document.createElement('div');

        container.id =
            'toastContainer';

        container.className =
            `
            fixed
            top-4
            right-4
            z-50
            max-w-sm
            `;

        document.body.appendChild(
            container
        );
    },

    createLoadingOverlay() {

        if (
            document.getElementById(
                'globalLoadingOverlay'
            )
        ) {

            return;
        }

        const overlay =
            document.createElement('div');

        overlay.id =
            'globalLoadingOverlay';

        overlay.className =
            `
            hidden
            fixed
            inset-0
            bg-black
            bg-opacity-30
            flex
            items-center
            justify-center
            z-50
            `;

        overlay.innerHTML =
            `
            <div class="
                bg-white
                rounded-xl
                px-6
                py-4
                shadow-xl
            ">
                Loading...
            </div>
            `;

        document.body.appendChild(
            overlay
        );
    },

    createConfirmModal() {

        if (
            document.getElementById(
                'confirmModal'
            )
        ) {

            return;
        }

        const modal =
            document.createElement('div');

        modal.id =
            'confirmModal';

        modal.className =
            `
            hidden
            fixed
            inset-0
            bg-black
            bg-opacity-40
            flex
            items-center
            justify-center
            z-50
            `;

        modal.innerHTML =
            `
            <div class="
                bg-white
                rounded-xl
                w-full
                max-w-md
                p-6
                shadow-2xl
            ">

                <h2
                    id="confirmModalTitle"
                    class="
                        text-lg
                        font-bold
                        mb-3
                    "
                ></h2>

                <p
                    id="confirmModalMessage"
                    class="
                        text-sm
                        text-gray-600
                        mb-6
                    "
                ></p>

                <div class="
                    flex
                    justify-end
                    gap-2
                ">

                    <button
                        id="confirmModalCancel"
                        class="
                            px-4
                            py-2
                            border
                            rounded-lg
                        "
                    >
                        ยกเลิก
                    </button>

                    <button
                        id="confirmModalConfirm"
                        class="
                            px-4
                            py-2
                            bg-red-500
                            text-white
                            rounded-lg
                        "
                    >
                        ยืนยัน
                    </button>

                </div>

            </div>
            `;

        document.body.appendChild(
            modal
        );
    }
};

// ====================== RESPONSIVE REGISTER ======================

const RegisterResponsive = {

    render() {

        const desktopTable =
            document.getElementById(
                'registerDesktopTable'
            );

        const mobileCard =
            document.getElementById(
                'registerMobileCard'
            );

        if (
            AppState.isMobile
        ) {

            if (desktopTable) {

                desktopTable.classList
                    .add('hidden');
            }

            if (mobileCard) {

                mobileCard.classList
                    .remove('hidden');
            }

        } else {

            if (desktopTable) {

                desktopTable.classList
                    .remove('hidden');
            }

            if (mobileCard) {

                mobileCard.classList
                    .add('hidden');
            }
        }
    }
};

// ====================== FORMATTER ======================

const Formatter = {

    currency(number) {

        return Number(number || 0)
            .toLocaleString(
                'th-TH',
                {
                    minimumFractionDigits: 2
                }
            );
    },

    thaiDate(date) {

        if (!date) {
            return '-';
        }

        const d = new Date(date);

        const day =
            String(d.getDate())
                .padStart(2, '0');

        const month =
            String(d.getMonth() + 1)
                .padStart(2, '0');

        const year =
            d.getFullYear() + 543;

        return `${day}/${month}/${year}`;
    }
};

// ====================== EVENT BUS ======================

const EventBus = {

    events: {},

    on(event, callback) {

        if (!this.events[event]) {

            this.events[event] = [];
        }

        this.events[event]
            .push(callback);
    },

    emit(event, data) {

        if (!this.events[event]) {
            return;
        }

        this.events[event]
            .forEach(callback => {

                callback(data);
            });
    }
};

// ====================== UTILITIES ======================

function debounce(
    func,
    wait
) {

    let timeout;

    return function(...args) {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            func.apply(this, args);

        }, wait);
    };
}

// ====================== GLOBAL ERROR HANDLER ======================

window.onerror = function(
    message,
    source,
    lineno,
    colno,
    error
) {

    console.error({
        message,
        source,
        lineno,
        colno,
        error
    });

    UI.showToast(
        'เกิดข้อผิดพลาดในระบบ',
        'error'
    );
};

console.log(
    'SRDH PAY Runtime Loaded'
);
