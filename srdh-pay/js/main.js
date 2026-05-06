/* <!-- ==========================================
       ไฟล์: js/main.js version : 00105
       ========================================== --> */

/* --- State --- */
    let allData = [];
    let currentUser = null;
    let settings = {};

    /* --- Constants --- */
    const COLORS = {
      "เงินงบประมาณ": { bg: "bg-[#FFCCFF]", text: "text-[#cc00cc]" },
      "เงินบำรุง": { bg: "bg-[#FFFF99]", text: "text-[#999900]" },
      "เงินประกันสุขภาพ": { bg: "bg-[#F8CBAD]", text: "text-[#d2691e]" },
      "เงินอุดหนุน": { bg: "bg-[#FF9999]", text: "text-[#cc0000]" },
      "เงินแพทยศาสตร์": { bg: "bg-[#FFF2CC]", text: "text-[#b38f00]" },
      "เงินอื่น": { bg: "bg-[#808080]", text: "text-[#ffffff]" }
    };

    /* --- Init --- */
    window.onload = () => {
      // ตรวจสอบการ Login ค้างไว้ (สำหรับระบบจริง ควรใช้ Token)
      const savedUser = localStorage.getItem('srdh_user');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initApp();
      }
    };

async function initApp() {
      document.getElementById('auth-view').classList.remove('active');
      document.getElementById('app-view').classList.add('active');
      
      // Update User UI
      document.getElementById('user-name').innerText = currentUser.username;
      document.getElementById('user-role').innerText = currentUser.role.toUpperCase();
      document.getElementById('btn-profile-settings').classList.toggle('hidden', currentUser.role === 'guest');

      renderSidebar();
      await fetchAppData();
      navigate('dashboard');
    }

    function renderSidebar() {
      const nav = document.getElementById('main-nav');
      let html = `<div class="nav-item px-6 py-3 cursor-pointer text-gray-600 flex items-center gap-3" onclick="navigate('dashboard')"><i class="ph ph-squares-four text-xl"></i>แดชบอร์ด</div>`;
      html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-600 flex items-center gap-3" onclick="navigate('list')"><i class="ph ph-list-dashes text-xl"></i>ทะเบียนฎีกา</div>`;
      
      if (['admin', 'staff'].includes(currentUser.role)) {
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-600 flex items-center gap-3" onclick="navigate('import')"><i class="ph ph-file-plus text-xl"></i>นำเข้าข้อมูล</div>`;
      }
      if (['admin', 'checker'].includes(currentUser.role)) {
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-600 flex items-center gap-3" onclick="navigate('approve')"><i class="ph ph-check-square-offset text-xl"></i>บันทึกรายการ</div>`;
      }
      if (currentUser.role === 'admin') {
        html += `<div class="nav-item px-6 py-3 cursor-pointer text-gray-600 flex items-center gap-3" onclick="navigate('settings')"><i class="ph ph-gear text-xl"></i>ตั้งค่าระบบ</div>`;
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

    function navigate(page) {
      document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
      document.getElementById(`page-${page}`).classList.remove('hidden');
      
      const titles = { dashboard: 'แดชบอร์ด', list: 'ทะเบียนฎีกาเบิกจ่ายเงิน', import: 'นำเข้าข้อมูล', approve: 'บันทึกสถานะ/พิมพ์', settings: 'ตั้งค่าระบบ' };
      document.getElementById('header-title').innerText = titles[page];

      if(window.innerWidth < 768) toggleSidebar(); // auto close on mobile

      if(page === 'dashboard') initDashboard();
      if(page === 'list') renderTable();
    }

    async function fetchAppData() {
      showLoader(true);
      // Mocking fetch request due to iframe limitations
      allData = generateMockData(); 
      populateFilters();
      showLoader(false);
    }

    function showLoader(show) {
      document.getElementById('app-loader').classList.toggle('hidden', !show);
    }
