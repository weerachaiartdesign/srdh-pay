/* version : 00106 */
// ควบคุมการทำงานและ State หลักของระบบ
window.allData = []; 

window.addEventListener('load', init);

async function init() {
  const container = document.getElementById('view-container');
  if (!container) return;

  try {
    if (typeof CONFIG === 'undefined' || CONFIG.API_URL === 'xxxx') {
      throw new Error("กรุณาตั้งค่า API_URL ใน js/api-config.js ให้เรียบร้อย");
    }

    const response = await fetch(CONFIG.API_URL);
    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลจาก Server ได้");
    
    const result = await response.json();
    if(result.error) throw new Error(result.error);
    
    // เก็บข้อมูลลง window เพื่อให้ไฟล์ JS อื่นๆ (เช่น register-list.js) เข้าถึงได้
    window.allData = result;
    
    // เริ่มต้นที่หน้า Dashboard
    changePage('dashboard'); 
  } catch (e) {
    console.error("Init Error:", e);
    container.innerHTML = `
      <div class="alert alert-danger m-4 shadow-sm" style="border-radius:15px;">
        <h5 class="fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> เกิดข้อผิดพลาด</h5>
        <p>${e.message}</p>
        <button onclick="location.reload()" class="btn btn-danger btn-sm px-4">ลองใหม่อีกครั้ง</button>
      </div>
    `;
  }
}

async function changePage(page) {
  const container = document.getElementById('view-container');
  if (!container) return;

  // อัพเดท UI เมนู (รองรับทั้ง nav-item และ nav-link)
  document.querySelectorAll('.nav-item, .nav-link').forEach(el => el.classList.remove('active'));
  
  const btnId = page === 'dashboard' ? 'btn-dash' : 'btn-list';
  const activeBtn = document.getElementById(btnId);
  if (activeBtn) activeBtn.classList.add('active');

  // กำหนดชื่อไฟล์ HTML ที่จะโหลด
  let fileName = page === 'list' ? 'register-list.html' : `${page}.html`;

  try {
    const res = await fetch(fileName);
    if (!res.ok) throw new Error(`ไม่พบไฟล์หน้าจอ: ${fileName}`);
    
    const html = await res.text();
    container.innerHTML = html;

    // เรียกฟังก์ชันเริ่มต้นของแต่ละหน้า
    if (page === 'dashboard') {
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      } else if (typeof initDashboard === 'function') {
        initDashboard();
      }
    } else if (page === 'list') {
      // เรียกฟังก์ชันใน js/register-list.js (รองรับทั้ง 2 ชื่อเพื่อความชัวร์)
      if (typeof initRegisterList === 'function') {
        initRegisterList();
      } else if (typeof initListLogic === 'function') {
        initListLogic();
      }
    }
  } catch (e) {
    console.error("Page Load Error:", e);
    container.innerHTML = `
      <div class="p-4 text-center">
        <div class="text-danger mb-2"><i class="bi bi-file-earmark-x fs-1"></i></div>
        <div class="text-secondary">เกิดข้อผิดพลาดในการโหลดหน้า ${page}</div>
        <div class="small text-muted">${e.message}</div>
      </div>
    `;
  }
}

// Helper: สำหรับจัดรูปแบบตัวเลข (ถ้าต้องการใช้ในอนาคต)
const formatMoney = (num) => Number(num || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
