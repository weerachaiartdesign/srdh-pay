/**
 * version 001-3
 * ไฟล์: index.js
 * หน้าที่: 
 * 1. จัดการการโหลดข้อมูลเริ่มต้น (Initialize Data) จาก Google Apps Script API
 * 2. จัดการระบบ Navigation (SPA) เพื่อสลับหน้า Dashboard และ รายการทะเบียน
 * 3. เก็บสถานะข้อมูลส่วนกลาง (Global State) เพื่อใช้งานร่วมกันในระบบ
 */

let allData = []; // ตัวแปรเก็บข้อมูลหลักของระบบ

// เริ่มต้นทำงานเมื่อไฟล์ JS ทั้งหมดโหลดเสร็จ
window.addEventListener('load', init);

/**
 * ฟังก์ชัน init:
 * ดึงข้อมูลจาก API โดยอ้างอิงค่าจาก CONFIG ใน api-config.js
 * มีการจัดการ Error Handling กรณีเชื่อมต่อไม่ได้
 */
async function init() {
  const container = document.getElementById('view-container');
  
  try {
    // ตรวจสอบว่ามีวัตถุ CONFIG หรือไม่เพื่อป้องกันข้อผิดพลาด config is not defined
    if (typeof CONFIG === 'undefined') {
      throw new Error("ไม่พบไฟล์ตั้งค่าระบบ (api-config.js)");
    }

    const response = await fetch(CONFIG.API_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const result = await response.json();
    
    if(result.error) throw new Error(result.error);
    
    allData = result;
    // เมื่อข้อมูลพร้อม ให้แสดงหน้า Dashboard เป็นหน้าเริ่มต้น
    changePage('dashboard');
  } catch (e) {
    console.error("Fetch Error:", e);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger m-4 shadow-sm border-0" style="border-radius:15px;">
          <h5 class="alert-heading text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> การเชื่อมต่อล้มเหลว</h5>
          <p class="mb-2">ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้: <br><code class="text-dark">${e.message}</code></p>
          <hr>
          <button class="btn btn-danger btn-sm px-4" onclick="location.reload()" style="border-radius:8px;">
            <i class="bi bi-arrow-clockwise"></i> ลองใหม่อีกครั้ง
          </button>
        </div>`;
    }
  }
}

/**
 * ฟังก์ชัน changePage:
 * ควบคุมการเปลี่ยนหน้าจอโดยไม่ต้องรีโหลดหน้าเว็บ (SPA)
 * @param {string} page - ชื่อหน้าจอที่ต้องการแสดง ('dashboard' หรือ 'list')
 */
function changePage(page) {
  const container = document.getElementById('view-container');
  if (!container) return;

  // เปลี่ยนสถานะเมนูใน Sidebar ให้ Active ตามหน้าที่เลือก
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  
  if(page === 'dashboard') {
    const btnDash = document.getElementById('btn-dash');
    if (btnDash) btnDash.classList.add('active');
    
    // เรียกฟังก์ชันจาก dashboard.js
    if (typeof renderDashboard === 'function') {
      renderDashboard();
    }
  } else if(page === 'list') {
    const btnList = document.getElementById('btn-list');
    if (btnList) btnList.classList.add('active');
    
    // โหลดโครงสร้าง HTML ของหน้ารายการ
    fetch('register-list.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        // เรียกฟังก์ชันลอจิกจาก register-list.js
        if (typeof initListLogic === 'function') {
          initListLogic();
        }
      })
      .catch(err => {
        container.innerHTML = `<div class="alert alert-warning">โหลดหน้าจอรายการไม่สำเร็จ: ${err.message}</div>`;
      });
  }
}
