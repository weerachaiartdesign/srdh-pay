/*<!-- =================================================
       ไฟล์: js/list.js (ตารางและตัวกรอง) version : 00105
       ================================================= -->*/
// ควบคุมระบบตาราง ค้นหา กรองข้อมูล และ Modal Popup

let filteredData = [];
let currentPage = 1;
let limit = 50;

function populateFilters() {
      // ดึงรายชื่อหน่วยงานและประเภทเงินที่ไม่ซ้ำกัน
      const depts = [...new Set(allData.map(d => d.dept))].sort();
      const types = [...new Set(allData.map(d => d.moneyType))].sort();
      
      document.getElementById('list-filter-dept').innerHTML = `<option value="">ทุกหน่วยงาน</option>` + depts.map(d => `<option value="${d}">${d}</option>`).join('');
      document.getElementById('list-filter-type').innerHTML = `<option value="">ทุกประเภทเงิน</option>` + types.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    function getStatusStyle(status) {
      const map = {
        'รับเข้าหน่วยงาน': 'bg-gray-100 text-gray-600 border-gray-200',
        'ตรวจสอบ': 'bg-blue-50 text-blue-600 border-blue-200',
        'ส่งแก้ไข': 'bg-red-50 text-red-600 border-red-200',
        'ตรวจผ่าน': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        'ส่งเสนอ': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'อนุมัติ': 'bg-orange-50 text-orange-600 border-orange-200',
        'จ่ายแล้ว': 'bg-green-50 text-green-700 border-green-200 font-bold',
        'ยกเลิก': 'bg-gray-800 text-white border-gray-800'
      };
      return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    }

    function renderTable() {
      const q = document.getElementById('list-search').value.toLowerCase();
      const fDept = document.getElementById('list-filter-dept').value;
      const fType = document.getElementById('list-filter-type').value;
      const limit = parseInt(document.getElementById('list-limit').value);

      let filtered = allData.filter(d => {
        const matchQ = !q || [d.vendor, d.item, d.receiveNo, d.dekaNo, d.withdrawNo].join(' ').toLowerCase().includes(q);
        const matchD = !fDept || d.dept === fDept;
        const matchT = !fType || d.moneyType === fType;
        return matchQ && matchD && matchT;
      }).slice(0, limit);

      const tbody = document.getElementById('list-tbody');
      
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400"><i class="ph ph-folder-open text-4xl block mb-2 opacity-50"></i>ไม่พบข้อมูลที่ค้นหา</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map((r, i) => {
        const c = COLORS[r.moneyType] || COLORS["เงินอื่น"];
        return `
        <tr class="hover:bg-purple-50 transition cursor-pointer border-b md:border-none group" onclick="openDetail(${r.id})">
          <td data-label="ลำดับ" class="px-4 py-3 align-top">
             <div class="text-[11px] text-gray-400 mb-0.5"><i class="ph ph-calendar-blank mr-1"></i>${r.dateIn}</div>
             <div class="font-bold text-gray-800">รับ: ${r.receiveNo}</div>
          </td>
          <td data-label="สถานะ" class="px-4 py-3 align-top">
             <span class="px-2.5 py-1 rounded text-xs border ${getStatusStyle(r.status)}">${r.status}</span>
          </td>
          <td data-label="ฎีกา" class="px-4 py-3 align-top text-xs">
             <div class="text-gray-500 mb-0.5">ใบเบิก: <span class="text-gray-800">${r.withdrawNo}</span></div>
             <div class="text-gray-500">ฎีกา: <span class="font-bold text-purple-700">${r.dekaNo}</span></div>
          </td>
          <td data-label="เจ้าหนี้" class="px-4 py-3 align-top font-bold text-gray-800 whitespace-normal min-w-[150px] group-hover:text-purple-700 transition">${r.vendor}</td>
          <td data-label="รายการ" class="px-4 py-3 align-top text-xs text-gray-600 whitespace-normal break-words w-1/4 min-w-[200px]">
             <div class="line-clamp-2" title="${r.item}">${r.item}</div>
          </td>
          <td data-label="จำนวนเงิน" class="px-4 py-3 align-top text-right">
             <div class="font-black text-lg text-gray-800 group-hover:text-purple-600 transition">${r.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</div>
          </td>
          <td data-label="ประเภท" class="px-4 py-3 align-top text-center md:text-left">
             <span class="${c.bg} ${c.text} px-2 py-0.5 rounded text-[11px] font-medium inline-block mb-1 border border-black/5">${r.moneyType}</span>
             <div class="text-xs text-gray-500 truncate max-w-[150px]" title="${r.dept}"><i class="ph ph-buildings mr-1"></i>${r.dept}</div>
          </td>
        </tr>
        `;
      }).join('');
    }

    function openDetail(id) {
      const r = allData.find(d => d.id === id);
      if(!r) return;
      
      const c = COLORS[r.moneyType] || COLORS["เงินอื่น"];
      const steps = ['รับเข้าหน่วยงาน', 'ตรวจสอบ', 'ส่งแก้ไข', 'ตรวจผ่าน', 'ส่งเสนอ', 'อนุมัติ', 'จ่ายแล้ว'];
      const currentStepIdx = steps.indexOf(r.status);
      
      // สร้าง Progress Bar
      let progressHtml = `
      <div class="mb-8 px-2 md:px-6 mt-4">
        <div class="flex justify-between relative">
          <div class="absolute top-3 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
          <div class="absolute top-3 left-0 h-1 bg-purple-500 -z-10 rounded-full transition-all" style="width: ${currentStepIdx > 0 ? (currentStepIdx / (steps.length - 1)) * 100 : 0}%"></div>
      `;
      
      steps.forEach((step, idx) => {
        // ข้ามขั้นตอน "ส่งแก้ไข" ถ้ารายการนี้ไม่เคยโดนส่งแก้
        if(step === 'ส่งแก้ไข' && r.status !== 'ส่งแก้ไข') {
           progressHtml += `<div></div>`; // placeholder รักษา spacing
           return; 
        }
        
        let nodeClass = "bg-white border-2 border-gray-300 text-gray-300";
        let textClass = "text-gray-400";
        if (idx < currentStepIdx) {
          nodeClass = "bg-purple-500 border-2 border-purple-500 text-white";
          textClass = "text-purple-600 font-medium";
        } else if (idx === currentStepIdx) {
          nodeClass = "bg-white border-4 border-purple-600 text-purple-600 shadow-md ring-4 ring-purple-100";
          textClass = "text-purple-800 font-bold";
        }
        
        if (r.status === 'ยกเลิก' && idx === currentStepIdx) {
           nodeClass = "bg-red-500 border-2 border-red-500 text-white";
           textClass = "text-red-600 font-bold";
        }

        progressHtml += `
          <div class="flex flex-col items-center relative group">
            <div class="w-7 h-7 rounded-full ${nodeClass} flex items-center justify-center text-[10px] font-bold mb-2 transition-all duration-300 z-10">
               ${idx < currentStepIdx ? '<i class="ph ph-check"></i>' : (idx+1)}
            </div>
            <span class="text-[10px] text-center w-14 absolute top-8 md:top-9 ${textClass} leading-tight">${step}</span>
          </div>
        `;
      });
      progressHtml += `</div></div>`;

      // โครงสร้างข้อมูลตารางรายละเอียด
      document.getElementById('modal-detail-body').innerHTML = `
        ${progressHtml}
        
        <div class="mt-12 bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">เลขรับ</span><b class="text-gray-800 text-base">${r.receiveNo}</b></div>
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">เลขที่ใบขอเบิก</span><b class="text-gray-800">${r.withdrawNo}</b></div>
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">เลขที่ฎีกา</span><b class="text-purple-700 font-bold text-base">${r.dekaNo}</b></div>
            <div class="text-right">
              <span class="${c.bg} ${c.text} px-3 py-1 rounded-full text-xs font-bold inline-block border border-black/5 shadow-sm">${r.moneyType}</span>
            </div>
            
            <div class="col-span-2"><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">หน่วยงาน</span><b class="text-gray-800">${r.dept}</b></div>
            <div class="col-span-2"><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">ผู้ส่งเอกสาร</span><b class="text-gray-800">${r.sender}</b></div>
            
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">ผู้ตรวจ</span><b class="text-gray-800">${r.checker || '-'}</b></div>
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">งวด/เดือน</span><b class="text-gray-800">${r.lesson || '-'}</b></div>
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">Invoice</span><b class="text-gray-800">${r.invoice || '-'}</b></div>
            <div><span class="text-gray-400 text-[11px] block uppercase tracking-wider mb-0.5">เลขที่ใบกัน</span><b class="text-gray-800">${r.budgetCode || '-'}</b></div>
          </div>
        </div>

        <div class="mt-4 bg-white p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div class="absolute -right-6 -top-6 text-purple-50 opacity-40 transform rotate-12 pointer-events-none"><i class="ph-fill ph-receipt text-[150px]"></i></div>
          <div class="relative z-10">
            <div class="mb-4">
              <span class="text-gray-400 text-xs block mb-1">ชื่อเจ้าหนี้ / บริษัท</span>
              <div class="text-xl font-bold text-gray-800 leading-tight">${r.vendor}</div>
            </div>
            <div class="mb-4">
              <span class="text-gray-400 text-xs block mb-1">รายการ</span>
              <div class="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 leading-relaxed">${r.item}</div>
            </div>
            <div class="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-end">
              <span class="text-gray-500 text-sm font-medium">จำนวนเงินขอเบิกรวม</span>
              <div class="text-3xl font-black text-purple-600 tracking-tight">${r.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})} <span class="text-base font-normal text-gray-400">บาท</span></div>
            </div>
          </div>
        </div>
      `;

      // เช็คสิทธิ์และแสดงปุ่มแก้ไข
      const actions = document.getElementById('modal-detail-actions');
      let btnHtml = `<button onclick="closeModal()" class="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">ปิดหน้าต่าง</button>`;
      
      if (currentUser.role === 'admin') {
        btnHtml += `<button class="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-md flex items-center"><i class="ph ph-pencil-simple mr-2"></i>แก้ไขข้อมูล (Admin)</button>`;
      } else if (currentUser.role === 'editor') {
        btnHtml += `<button class="px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-medium shadow-md flex items-center"><i class="ph ph-check-square mr-2"></i>แก้ไขการตรวจ</button>`;
      }
      actions.innerHTML = btnHtml;

      const modal = document.getElementById('modal-detail');
      const content = document.getElementById('modal-content');
      
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      // สร้าง Animation เด้งขึ้นมา
      setTimeout(() => {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
      }, 10);
    }

    function closeModal() {
      const modal = document.getElementById('modal-detail');
      const content = document.getElementById('modal-content');
      
      content.classList.remove('scale-100');
      content.classList.add('scale-95');
      
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }, 200);
    }

    // สร้างข้อมูลจำลอง (Mock Data) สำหรับดูพรีวิวโดยไม่ต้องต่อ Google Sheets
    function generateMockData() {
      const depts = ["กลุ่มงานเภสัชกรรม", "ฝ่ายพัสดุ", "ฝ่ายโภชนาการ", "กลุ่มงานประกันสุขภาพ", "ฝ่ายบริหารงานทั่วไป"];
      const vendors = ["บริษัท เมดดิคอล ซัพพลาย จำกัด", "หจก. เครื่องเขียนไทย", "บริษัท ซีพีเอฟ (ประเทศไทย) จำกัด (มหาชน)", "บจก. คลีนนิ่ง เอ็กซ์เพรส", "ร้าน สบายใจ ไอที"];
      const statuses = ['รับเข้าหน่วยงาน', 'ตรวจสอบ', 'ตรวจผ่าน', 'ส่งเสนอ', 'อนุมัติ', 'จ่ายแล้ว', 'ยกเลิก'];
      
      return Array.from({length: 45}).map((_, i) => ({
        id: i, 
        receiveNo: (1000+i).toString(), 
        dekaNo: 'DK-2569-' + (i+1).toString().padStart(3, '0'), 
        withdrawNo: 'WD-' + (i+100).toString(),
        dateIn: `0${Math.floor(Math.random() * 9) + 1}/10/2568`, 
        status: statuses[Math.floor(Math.random() * statuses.length)], 
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        item: `ชำระค่าซื้อวัสดุอุปกรณ์ทางการแพทย์/เวชภัณฑ์ ประจำงวดที่ ${Math.floor(Math.random()*12)+1} ตามใบส่งของเลขที่ INV-${1000+i}`, 
        amount: Math.floor(Math.random() * 90000) + 10500.50,
        moneyType: i % 5 === 0 ? 'เงินงบประมาณ' : (i % 3 === 0 ? 'เงินประกันสุขภาพ' : 'เงินบำรุง'), 
        dept: depts[Math.floor(Math.random() * depts.length)], 
        sender: 'นายสมชาย รักดี',
        checker: 'นางสาววิมล สุขใจ',
        invoice: `INV-2025-${i}`,
        lesson: `งวด ${Math.floor(Math.random()*3)+1}`,
        budgetCode: `BG-69-${i}`
      }));
    }
