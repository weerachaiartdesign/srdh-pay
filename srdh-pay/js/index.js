/* version : 00102 */
// ควบคุมการทำงานและ State หลักของระบบ
let allData = [];

window.addEventListener('load', init);

async function init() {
  const container = document.getElementById('view-container');
  try {
    if (typeof CONFIG === 'undefined' || CONFIG.API_URL === 'xxxx') {
      throw new Error("กรุณาตั้งค่า API_URL ใน js/api-config.js ให้เรียบร้อย");
    }

    const response = await fetch(CONFIG.API_URL);
    const result = await response.json();
    
    if(result.error) throw new Error(result.error);
    
    allData = result;
    changePage('dashboard'); // เริ่มต้นที่หน้า Dashboard
  } catch (e) {
    console.error(e);
    container.innerHTML = `
      <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm max-w-2xl mx-auto mt-10">
        <div class="flex items-center gap-3 mb-2">
          <i class="ph-fill ph-warning-circle text-red-500 text-2xl"></i>
          <h3 class="text-red-700 font-bold text-lg">ไม่สามารถเชื่อมต่อข้อมูลได้</h3>
        </div>
        <p class="text-red-600 mb-4">${e.message}</p>
        <button onclick="location.reload()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition">ลองใหม่อีกครั้ง</button>
      </div>
    `;
  }
}

async function changePage(page) {
  const container = document.getElementById('view-container');
  
  // อัพเดท UI เมนู
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const btn = document.getElementById(`btn-${page === 'dashboard' ? 'dash' : 'list'}`);
  if(btn) btn.classList.add('active');

  // ตรวจสอบชื่อไฟล์ที่จะโหลดให้ตรงกับที่สร้างไว้
  let fileName = page === 'list' ? 'register-list.html' : `${page}.html`;

  // โหลดหน้า
  try {
    const res = await fetch(fileName);
    if (!res.ok) throw new Error(`ไม่พบไฟล์ ${fileName}`);
    const html = await res.text();
    container.innerHTML = html;

    if (page === 'dashboard') {
      initDashboard();
    } else if (page === 'list') {
      initRegisterList();
    }
  } catch (e) {
    container.innerHTML = `<div class="p-4 text-red-500">เกิดข้อผิดพลาดในการโหลดหน้า ${page}: ${e.message}</div>`;
  }
}

// ฟังก์ชันช่วยเหลือสำหรับจัดรูปแบบตัวเลข
const formatMoney = (num) => Number(num || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
