/* version 002
 * ไฟล์หลัก ควบคุมการโหลดข้อมูลและการเปลี่ยนหน้า
 */

let allData = [];
let cachedData = null;
let lastFetch = 0;

// เริ่มต้นเมื่อโหลดหน้า
window.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadData();
  changePage('dashboard');
}

async function loadData(forceRefresh = false) {
  const container = document.getElementById('view-container');
  
  // ตรวจสอบ cache
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - lastFetch) < CONFIG.CACHE_TIMEOUT) {
    allData = cachedData;
    return;
  }
  
  // แสดง loading
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 text-muted">กำลังโหลดข้อมูลจากระบบ...</p>
      </div>
    `;
  }
  
  try {
    const data = await fetchRegisterData();
    allData = data;
    cachedData = data;
    lastFetch = now;
  } catch (error) {
    console.error('Load data error:', error);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger m-4 shadow-sm border-0" style="border-radius:15px;">
          <h5 class="alert-heading"><i class="bi bi-exclamation-triangle-fill"></i> เกิดข้อผิดพลาด</h5>
          <p>ไม่สามารถโหลดข้อมูลได้: ${error.message}</p>
          <button class="btn btn-danger" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise"></i> ลองใหม่
          </button>
        </div>
      `;
    }
    throw error;
  }
}

function changePage(page) {
  // อัปเดต active menu
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  
  if (page === 'dashboard') {
    const btnDash = document.getElementById('btn-dash');
    if (btnDash) btnDash.classList.add('active');
    renderDashboard(allData);
  } else if (page === 'list') {
    const btnList = document.getElementById('btn-list');
    if (btnList) btnList.classList.add('active');
    renderRegisterList(allData);
  }
}

// ฟังก์ชัน refresh ข้อมูล
window.refreshData = async function() {
  await loadData(true);
  const currentPage = document.querySelector('.nav-link.active')?.id === 'btn-dash' ? 'dashboard' : 'list';
  changePage(currentPage);
};
