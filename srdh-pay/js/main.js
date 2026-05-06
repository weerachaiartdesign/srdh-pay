/* <!-- ==========================================
       ไฟล์: js/main.js (ควบคุม UI และ Navigation หลัก) version : 00106
       ========================================== --> */
/**
 * Main application logic.
 * - Initializes user from local storage, fetches data, configures navigation.
 * - Global state: allData (array from register), settings (vendors, checkers, moneyTypes).
 * - Provides global helpers like showLoader, hideLoader, callApi.
 */

let allData = [];
let settings = { vendors: [], checkers: [], moneyTypes: [] };
let currentUser = null;
const COLORS = {  // used in several pages
  "เงินงบประมาณ": "bg-[#FFCCFF] text-[#cc00cc]",
  "เงินบำรุง": "bg-[#FFFF99] text-[#999900]",
  "เงินประกันสุขภาพ": "bg-[#F8CBAD] text-[#d2691e]",
  "เงินอุดหนุน": "bg-[#FF9999] text-[#cc0000]",
  "เงินแพทยศาสตร์": "bg-[#FFF2CC] text-[#b38f00]",
  "เงินอื่น": "bg-[#808080] text-white"
};

window.onload = () => {
  const savedUser = localStorage.getItem('srdh_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    initApp();
  } else {
    document.getElementById('auth-view').classList.remove('hidden');
  }
};

async function initApp() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  document.getElementById('user-name').innerText = currentUser.username;
  document.getElementById('user-role').innerText = currentUser.role.toUpperCase();
  document.getElementById('btn-profile-settings').classList.toggle('hidden', currentUser.role === 'guest');

  renderSidebar();
  showLoader(true);
  await fetchAppData();
  showLoader(false);
  navigate('dashboard');
}

function renderSidebar() {
  const nav = document.getElementById('main-nav');
  let html = `
    <div class="nav-item px-6 py-3 cursor-pointer" onclick="navigate('dashboard')"><i class="ph ph-squares-four text-xl mr-3"></i>แดชบอร์ด</div>
    <div class="nav-item px-6 py-3 cursor-pointer" onclick="navigate('list')"><i class="ph ph-list-dashes text-xl mr-3"></i>ทะเบียนฎีกา</div>`;
  if (['admin','staff'].includes(currentUser.role)) {
    html += `<div class="nav-item px-6 py-3 cursor-pointer" onclick="navigate('import')"><i class="ph ph-file-plus text-xl mr-3"></i>นำเข้าข้อมูล</div>`;
  }
  if (['admin','checker'].includes(currentUser.role)) {
    html += `<div class="nav-item px-6 py-3 cursor-pointer" onclick="navigate('approve')"><i class="ph ph-check-square-offset text-xl mr-3"></i>บันทึกรายการ</div>`;
  }
  if (currentUser.role === 'admin') {
    html += `<div class="nav-item px-6 py-3 cursor-pointer" onclick="navigate('settings')"><i class="ph ph-gear text-xl mr-3"></i>ตั้งค่าระบบ</div>`;
  }
  nav.innerHTML = html;
}

function navigate(page) {
  document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.remove('hidden');
  document.getElementById('header-title').innerText = {
    dashboard: 'แดชบอร์ด', list: 'ทะเบียนฎีกาเบิกจ่ายเงิน', import: 'นำเข้าข้อมูล',
    approve: 'บันทึกรายการ/พิมพ์', settings: 'ตั้งค่าระบบ', printout: 'พิมพ์/ส่งออก PDF'
  }[page] || '';

  if (window.innerWidth < 768) toggleSidebar(); // close sidebar on mobile

  // Trigger page-specific init
  if (page === 'dashboard') initDashboard();
  if (page === 'list') initList();
  if (page === 'import') initImport();
  if (page === 'approve') initApprove();
  if (page === 'settings') initSettings();
  if (page === 'printout') initPrintout();
}

async function fetchAppData() {
  try {
    showLoader(true);
    const resp = await callApi('getRegisterData');
    allData = resp.data || [];
    const sets = await callApi('getSettings');
    settings = sets;
  } catch (e) {
    alert('ไม่สามารถโหลดข้อมูลได้: ' + e.message);
  } finally {
    showLoader(false);
  }
}

async function callApi(action, body = {}) {
  body.action = action;
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Network error');
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Server error');
  return result;
}

function showLoader(show) {
  document.getElementById('app-loader').classList.toggle('hidden', !show);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-full');
}
function toggleProfileMenu() {
  document.getElementById('profile-menu').classList.toggle('hidden');
}
function logout() {
  if (confirm('ยืนยันการออกจากระบบ?')) {
    localStorage.removeItem('srdh_user');
    location.reload();
  }
}
