/*<!-- ==========================================
       ไฟล์: js/list.js version : 00105
       ========================================== -->*/
// ควบคุมระบบตาราง ค้นหา กรองข้อมูล และ Modal Popup

let filteredData = [];
let currentPage = 1;
let limit = 50;

function populateFilters() {
      const depts = [...new Set(allData.map(d => d.dept))];
      const types = [...new Set(allData.map(d => d.moneyType))];
      
      document.getElementById('list-filter-dept').innerHTML = `<option value="">ทุกหน่วยงาน</option>` + depts.map(d => `<option value="${d}">${d}</option>`).join('');
      document.getElementById('list-filter-type').innerHTML = `<option value="">ทุกประเภท</option>` + types.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    function renderTable() {
      const q = document.getElementById('list-search').value.toLowerCase();
      const fDept = document.getElementById('list-filter-dept').value;
      const fType = document.getElementById('list-filter-type').value;
      const limit = parseInt(document.getElementById('list-limit').value);

      let filtered = allData.filter(d => {
        const matchQ = !q || [d.vendor, d.item, d.receiveNo, d.dekaNo].join(' ').toLowerCase().includes(q);
        const matchD = !fDept || d.dept === fDept;
        const matchT = !fType || d.moneyType === fType;
        return matchQ && matchD && matchT;
      }).slice(0, limit);

      const tbody = document.getElementById('list-tbody');
      tbody.innerHTML = filtered.map((r, i) => {
        const c = COLORS[r.moneyType] || COLORS["เงินอื่น"];
        return `
        <tr class="hover:bg-gray-50 cursor-pointer border-b md:border-none" onclick="openDetail(${r.id})">
          <td data-label="ลำดับ" class="px-4 py-2"><div class="text-xs text-gray-500">${r.dateIn}</div><b>เลขรับ: ${r.receiveNo}</b></td>
          <td data-label="สถานะ" class="px-4 py-2"><span class="px-2 py-1 bg-gray-100 rounded text-xs">${r.status}</span></td>
          <td data-label="ฎีกา" class="px-4 py-2 text-xs text-gray-500">ใบเบิก: ${r.withdrawNo}<br><b class="text-gray-800">ฎีกา: ${r.dekaNo}</b></td>
          <td data-label="เจ้าหนี้" class="px-4 py-2 font-bold">${r.vendor}</td>
          <td data-label="รายการ" class="px-4 py-2 text-xs truncate max-w-xs">${r.item}</td>
          <td data-label="จำนวนเงิน" class="px-4 py-2 text-right font-bold text-lg text-purple-600">${r.amount.toLocaleString()}</td>
          <td data-label="ประเภท" class="px-4 py-2"><span class="${c.bg} ${c.text} px-2 py-0.5 rounded text-xs block mb-1 text-center">${r.moneyType}</span><div class="text-xs text-gray-500 truncate text-center">${r.dept}</div></td>
        </tr>
        `;
      }).join('') || `<tr><td colspan="7" class="text-center py-8 text-gray-500">ไม่พบข้อมูล</td></tr>`;
    }

    function openDetail(id) {
      const r = allData.find(d => d.id === id);
      if(!r) return;
      
      // การแสดง Progress Bar สถานะ
      const steps = ['รับเข้าหน่วยงาน', 'ตรวจสอบ', 'ส่งแก้ไข', 'ตรวจผ่าน', 'ส่งเสนอ', 'อนุมัติ', 'จ่ายแล้ว'];
      const currentStepIdx = steps.indexOf(r.status);
      
      let progressHtml = `<div class="flex justify-between mb-6 relative"><div class="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>`;
      steps.forEach((step, idx) => {
        if(step === 'ส่งแก้ไข' && r.status !== 'ส่งแก้ไข') return; // ข้ามถ้าไม่ได้ส่งแก้
        const active = idx <= currentStepIdx ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400';
        progressHtml += `<div class="flex flex-col items-center"><div class="w-6 h-6 rounded-full ${active} flex items-center justify-center text-xs font-bold mb-1">${idx+1}</div><span class="text-[10px] text-center w-16">${step}</span></div>`;
      });
      progressHtml += `</div>`;

      document.getElementById('modal-detail-body').innerHTML = `
        ${progressHtml}
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg border">
          <div><span class="text-gray-400 text-xs block">ประเภทเงิน</span><b>${r.moneyType}</b></div>
          <div><span class="text-gray-400 text-xs block">หน่วยงาน</span><b>${r.dept}</b></div>
          <div><span class="text-gray-400 text-xs block">ผู้ส่งเอกสาร</span><b>${r.sender}</b></div>
          
          <div class="col-span-2"><span class="text-gray-400 text-xs block">เจ้าหนี้</span><b class="text-lg">${r.vendor}</b></div>
          <div><span class="text-gray-400 text-xs block">จำนวนเงินขอเบิก</span><b class="text-xl text-purple-600">${r.amount.toLocaleString()} บ.</b></div>
          
          <div class="col-span-3"><span class="text-gray-400 text-xs block">รายการ</span>${r.item}</div>
        </div>
      `;

      // เช็คสิทธิ์และแสดงปุ่มแก้ไข
      const actions = document.getElementById('modal-detail-actions');
      actions.innerHTML = `<button onclick="closeModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">ปิด</button>`;
      
      if (currentUser.role === 'admin') {
        actions.innerHTML += `<button class="px-4 py-2 bg-purple-600 text-white rounded-lg"><i class="ph ph-pencil-simple mr-2"></i>แก้ไขข้อมูล (Admin)</button>`;
      } else if (currentUser.role === 'editor') {
        actions.innerHTML += `<button class="px-4 py-2 bg-indigo-500 text-white rounded-lg"><i class="ph ph-check-square mr-2"></i>แก้ไขการตรวจ</button>`;
      }

      document.getElementById('modal-detail').classList.remove('hidden');
      document.getElementById('modal-detail').classList.add('flex');
    }

    function closeModal() {
      document.getElementById('modal-detail').classList.add('hidden');
      document.getElementById('modal-detail').classList.remove('flex');
    }

    // ฟังก์ชันจำลองข้อมูลเพื่อการพรีวิว
    function generateMockData() {
      return Array.from({length: 20}).map((_, i) => ({
        id: i, receiveNo: 'REC-' + (1000+i), dekaNo: 'DK-2569-' + i, withdrawNo: 'WD-' + i,
        dateIn: '01/10/2568', status: i % 3 === 0 ? 'อนุมัติ' : 'ตรวจสอบ', vendor: 'บริษัท ตัวอย่าง จำกัด',
        item: 'ซื้อวัสดุการแพทย์ประจำเดือน', amount: Math.floor(Math.random() * 100000) + 1000,
        moneyType: i % 2 === 0 ? 'เงินงบประมาณ' : 'เงินบำรุง', dept: 'เภสัชกรรม', sender: 'นายสมชาย รักดี'
      }));
    }
