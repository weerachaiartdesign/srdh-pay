/* <!-- ==========================================
       ไฟล์: js/main.js (ควบคุม UI และ Navigation หลัก) version : 00105
       ========================================== --> */

/* --- State (ตัวแปรส่วนกลาง) --- */
    let allData = [];
    let currentUser = null;

    /* --- ค่าคงที่เรื่องสีตาม Requirement --- */
    const COLORS = {
      "เงินงบประมาณ": { bg: "bg-[#FFCCFF]", text: "text-[#cc00cc]" },
      "เงินบำรุง": { bg: "bg-[#FFFF99]", text: "text-[#999900]" },
      "เงินประกันสุขภาพ": { bg: "bg-[#F8CBAD]", text: "text-[#d2691e]" },
      "เงินอุดหนุน": { bg: "bg-[#FF9999]", text: "text-[#cc0000]" },
      "เงินแพทยศาสตร์": { bg: "bg-[#FFF2CC]", text: "text-[#b38f00]" },
      "เงินอื่น": { bg: "bg-[#808080]", text: "text-[#ffffff]" } // เทาเข้ม
    };

    /* --- การเริ่มต้นแอป (Init) --- */
    window.onload = () => {
      const savedUser = localStorage.getItem('srdh_user');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initApp();
      }
    };

 async function initApp() {
      document.getElementById('auth-view').classList.remove('active');
      document.getElementById('app-view').classList.add('active');
      
      // แสดงชื่อผู้ใช้
      document.getElementById('user-name').innerText = currentUser.username;
      document.getElementById('user-role').innerText = `สิทธิ์: ${currentUser.role}`;
      document.getElementById('btn-profile-settings').classList.toggle('hidden', currentUser.role === 'guest');

      renderSidebar();
      await fetchAppData(); // โหลดข้อมูลจำลอง
      navigate('dashboard');
    }

    function renderSidebar() {
      const nav = document.getElementById('main-nav');
      let html = `<div class="nav-item px-6 py-3 cursor-pointer text-gray-700 flex items-center gap-3" onclick="navigate('dashboard')"><i class="ph ph-squares-four text-xl"></i>แดชบอร์ดภาพรวม</div>`;
      html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-700 flex items-center gap-3 mt-1" onclick="navigate('list')"><i class="ph ph-list-dashes text-xl"></i>ทะเบียนฎีกาเบิกจ่าย</div>`;
      
      if (['admin', 'staff'].includes(currentUser.role)) {
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-700 flex items-center gap-3 mt-1" onclick="navigate('import')"><i class="ph ph-file-plus text-xl"></i>นำเข้าข้อมูลใหม่</div>`;
      }
      if (['admin', 'checker'].includes(currentUser.role)) {
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-700 flex items-center gap-3 mt-1" onclick="navigate('approve')"><i class="ph ph-check-square-offset text-xl"></i>บันทึกสถานะ/จ่ายเช็ค</div>`;
      }
      if (currentUser.role === 'admin') {
        html += `<div class="border-t border-gray-100 my-2 mx-4"></div>`;
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-700 flex items-center gap-3" onclick="navigate('settings')"><i class="ph ph-gear text-xl"></i>ตั้งค่าระบบ</div>`;
      }
      nav.innerHTML = html;
    }

    function toggleSidebar() {
      const sb = document.getElementById('sidebar');
      sb.classList.toggle('-translate-x-full');
    }
    
    function toggleProfileMenu() {
      document.getElementById('profile-menu').classList.toggle('hidden');
    }

    // ปิดเมนูโปรไฟล์เมื่อคลิกที่อื่น
    window.addEventListener('click', function(e) {
      if (!document.getElementById('profile-menu').contains(e.target) && !e.target.closest('button[onclick="toggleProfileMenu()"]')) {
        document.getElementById('profile-menu').classList.add('hidden');
      }
    });

    function navigate(page) {
      document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
      document.getElementById(`page-${page}`).classList.remove('hidden');
      
      const titles = { 
        dashboard: 'แดชบอร์ดภาพรวม', 
        list: 'ทะเบียนฎีกาเบิกจ่ายเงิน', 
        import: 'นำเข้าข้อมูลใหม่', 
        approve: 'บันทึกสถานะและพิมพ์', 
        settings: 'ตั้งค่าระบบ (Admin)' 
      };
      document.getElementById('header-title').innerText = titles[page];

      // อัปเดตเมนูที่ Active
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active', 'bg-purple-50', 'text-purple-700', 'border-r-4', 'border-purple-600'));
      const activeNavs = document.querySelectorAll(`.nav-item[onclick="navigate('${page}')"]`);
      if(activeNavs.length > 0) {
          activeNavs[0].classList.add('active', 'bg-purple-50', 'text-purple-700', 'border-r-4', 'border-purple-600', 'font-bold');
      }

      if(window.innerWidth < 768) document.getElementById('sidebar').classList.add('-translate-x-full');

      if(page === 'dashboard') initDashboard();
      if(page === 'list') renderTable();
    }

    async function fetchAppData() {
      document.getElementById('app-loader').classList.remove('hidden');
      // หน่วงเวลาจำลองการโหลดข้อมูลจาก Google Sheets
      await new Promise(r => setTimeout(r, 600)); 
      allData = generateMockData(); 
      populateFilters();
      document.getElementById('app-loader').classList.add('hidden');
    }
