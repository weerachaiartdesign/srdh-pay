// Version: 00121
// Main JavaScript - Core functionality for Srdh Pay
// Fixed Session Loop / Auth Redirect / Null Element Errors

let currentUser = null;

// ====================== AUTH INITIALIZATION ======================
function initAuth() {

    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('auth.html');

    try {

        const user = localStorage.getItem('srdh_user');

        // ======================
        // NO LOGIN
        // ======================
        if (!user) {

            if (!isAuthPage) {
                window.location.replace('auth.html');
            }

            return;
        }

        currentUser = JSON.parse(user);

        // ======================
        // SESSION TIMEOUT CHECK
        // ======================
        const lastLogin = localStorage.getItem('srdh_last_login');

        if (lastLogin) {

            const minutesPassed =
                (Date.now() - parseInt(lastLogin, 10)) / 60000;

            // Session expired
            if (minutesPassed > CONFIG.SESSION_TIMEOUT) {

                console.warn('Session expired');

                logout(true);
                return;
            }

            // ======================
            // REFRESH SESSION TIME
            // ======================
            localStorage.setItem(
                'srdh_last_login',
                Date.now().toString()
            );
        }

        // ======================
        // UPDATE UI
        // ======================
        updateUserUI();

        // ======================
        // PREVENT BACK TO LOGIN
        // ======================
        if (isAuthPage) {
            window.location.replace('dashboard.html');
        }

    } catch (error) {

        console.error('Auth initialization error:', error);

        // corrupted localStorage
        localStorage.removeItem('srdh_user');
        localStorage.removeItem('srdh_last_login');

        if (!isAuthPage) {
            window.location.replace('auth.html');
        }
    }
}

// ====================== UPDATE USER UI ======================
function updateUserUI() {

    if (!currentUser) return;

    try {

        // ======================
        // SAFE ELEMENT ACCESS
        // ======================
        const userName =
            document.getElementById('user-name');

        const userRole =
            document.getElementById('user-role');

        const menuUserName =
            document.getElementById('menu-user-name');

        const menuUserPosition =
            document.getElementById('menu-user-position');

        const avatar =
            document.getElementById('user-avatar');

        const sidebarName =
            document.getElementById('sidebar-name');

        const sidebarRole =
            document.getElementById('sidebar-role');

        const sidebarAvatar =
            document.getElementById('sidebar-avatar');

        // ======================
        // SET TEXT
        // ======================
        if (userName) {
            userName.textContent =
                currentUser.username || currentUser.email;
        }

        if (userRole) {
            userRole.textContent =
                (currentUser.role || 'user').toUpperCase();
        }

        if (menuUserName) {
            menuUserName.textContent =
                currentUser.username || '-';
        }

        if (menuUserPosition) {
            menuUserPosition.textContent =
                currentUser.position || '-';
        }

        if (sidebarName) {
            sidebarName.textContent =
                currentUser.username || currentUser.email;
        }

        if (sidebarRole) {
            sidebarRole.textContent =
                currentUser.role || 'user';
        }

        // ======================
        // AVATAR
        // ======================
        const avatarText =
            currentUser.username
                ? currentUser.username.substring(0, 2).toUpperCase()
                : 'US';

        if (avatar) {
            avatar.textContent = avatarText;
        }

        if (sidebarAvatar) {
            sidebarAvatar.textContent = avatarText;
        }

    } catch (error) {

        console.error('Update UI error:', error);
    }
}

// ====================== LOGIN HANDLER ======================
async function handleLogin(e) {

    e.preventDefault();

    const email =
        document.getElementById('email').value.trim();

    const password =
        document.getElementById('password').value;

    try {

        const result =
            await callGAS('loginUser', {
                email,
                password
            });

        if (!result.success) {

            alert(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
            return;
        }

        // ======================
        // SAVE SESSION
        // ======================
        localStorage.setItem(
            'srdh_user',
            JSON.stringify(result.user)
        );

        localStorage.setItem(
            'srdh_last_login',
            Date.now().toString()
        );

        // ======================
        // REDIRECT
        // ======================
        window.location.replace('dashboard.html');

    } catch (error) {

        console.error('Login error:', error);

        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

// ====================== GUEST LOGIN ======================
async function guestLogin() {

    const email =
        prompt('กรอกอีเมลสำหรับเข้าใช้งานแบบ Guest:');

    if (!email) return;

    try {

        const result =
            await callGAS('guestLogin', { email });

        if (!result.success) {
            alert('ไม่สามารถเข้าใช้งานได้');
            return;
        }

        localStorage.setItem(
            'srdh_user',
            JSON.stringify(result.user)
        );

        localStorage.setItem(
            'srdh_last_login',
            Date.now().toString()
        );

        window.location.replace('dashboard.html');

    } catch (error) {

        console.error(error);

        alert('ไม่สามารถเข้าใช้งานแบบ Guest ได้');
    }
}

// ====================== LOGOUT
// force = true → no confirm
// ======================
function logout(force = false) {

    if (!force) {

        const confirmed =
            confirm('คุณต้องการออกจากระบบใช่หรือไม่?');

        if (!confirmed) {
            return;
        }
    }

    try {

        callGAS('logAction', {
            email: currentUser?.email || '',
            action: 'logout'
        }).catch(() => {});

    } catch (_) {}

    // ======================
    // CLEAR SESSION
    // ======================
    localStorage.removeItem('srdh_user');
    localStorage.removeItem('srdh_last_login');

    currentUser = null;

    // ======================
    // REDIRECT
    // ======================
    window.location.replace('auth.html');
}

// ====================== KEEP SESSION ALIVE ======================
document.addEventListener('click', refreshSession);
document.addEventListener('keydown', refreshSession);
document.addEventListener('mousemove', refreshSession);

function refreshSession() {

    if (localStorage.getItem('srdh_user')) {

        localStorage.setItem(
            'srdh_last_login',
            Date.now().toString()
        );
    }
}

// ====================== DARK MODE ======================
function toggleDarkMode() {

    const body = document.body;

    const isDark =
        body.getAttribute('data-theme') === 'dark';

    body.setAttribute(
        'data-theme',
        isDark ? 'light' : 'dark'
    );

    localStorage.setItem(
        'theme',
        isDark ? 'light' : 'dark'
    );
}

// ====================== LOAD SAVED THEME ======================
function loadTheme() {

    const savedTheme =
        localStorage.getItem('theme') || 'light';

    document.body.setAttribute(
        'data-theme',
        savedTheme
    );
}

// ====================== PAGE START ======================
document.addEventListener('DOMContentLoaded', () => {

    loadTheme();

    initAuth();
});
