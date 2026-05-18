// Version: 00122
// index JavaScript - Core functionality for Srdh Pay

let currentUser = null;

// Initialize Authentication
function initAuth() {
    const user = localStorage.getItem('srdh_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUserUI();
        
        // Check session timeout
        const lastLogin = localStorage.getItem('srdh_last_login');
        if (lastLogin) {
            const minutesPassed = (Date.now() - parseInt(lastLogin)) / 60000;
            if (minutesPassed > CONFIG.SESSION_TIMEOUT) {
                logout();
            }
        }
    } else {
        // Redirect to login if not on auth page
        if (!window.location.pathname.includes('auth.html')) {
            window.location.href = 'auth.html';
        }
    }
}

// Update User Interface
function updateUserUI() {
    if (!currentUser) return;
    
    document.getElementById('user-name').textContent = currentUser.username || currentUser.email;
    document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
    document.getElementById('menu-user-name').textContent = currentUser.username;
    document.getElementById('menu-user-position').textContent = currentUser.position || '';
    
    // Avatar
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
        avatar.textContent = currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'US';
    }
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const result = await callGAS('loginUser', { email, password });
        
        if (result.success) {
            localStorage.setItem('srdh_user', JSON.stringify(result.user));
            localStorage.setItem('srdh_last_login', Date.now());
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

// Guest Login
async function guestLogin() {
    const email = prompt("กรอกอีเมลสำหรับเข้าใช้งานแบบ Guest:");
    if (!email) return;

    try {
        const result = await callGAS('guestLogin', { email });
        if (result.success) {
            localStorage.setItem('srdh_user', JSON.stringify(result.user));
            localStorage.setItem('srdh_last_login', Date.now());
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        alert('ไม่สามารถเข้าใช้งานแบบ Guest ได้ในขณะนี้');
    }
}

// Logout
function logout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        callGAS('logAction', {
            email: currentUser?.email,
            action: 'logout'
        }).catch(() => {});
        
        localStorage.removeItem('srdh_user');
        localStorage.removeItem('srdh_last_login');
        window.location.href = 'auth.html';
    }
}

// Dark Mode
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDark ? 'fas fa-moon text-xl' : 'fas fa-sun text-xl';
}

function checkDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
    }
}

// Toggle User Menu
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Utility: Format Thai Date
function formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Utility: Format Currency
function formatCurrency(amount) {
    return Number(amount).toLocaleString('th-TH') + ' บาท';
}

// Close all popups when press ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const popups = document.querySelectorAll('.popup');
        popups.forEach(p => p.classList.add('hidden'));
    }
});
 </script>
    
    <script>
        // Toggle Sidebar for Mobile
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        }

        // Active Nav Highlight
        function setActiveNav() {
            const links = document.querySelectorAll('.nav-item');
            links.forEach(link => {
                if (link.href === window.location.href) {
                    link.classList.add('bg-purple-100', 'text-purple-900', 'font-semibold');
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            initAuth();
            checkDarkMode();
            setActiveNav();
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', function(e) {
                const sidebar = document.getElementById('sidebar');
                if (window.innerWidth < 1024 && !sidebar.contains(e.target)) {
                    sidebar.classList.add('-translate-x-full');
                }
            });
        });