/* version : 00101 */
// ควบคุมระบบตาราง ค้นหา กรองข้อมูล และ Modal Popup

let filteredData = [];
let currentPage = 1;
let limit = 50;

function initRegisterList() {
  // Populate Department Dropdown
  const depts = [...new Set(allData.map(d => d.dept))].filter(d => d && d !== "-");
  const deptSelect = document.getElementById('filter-dept');
  if(deptSelect) {
    depts.sort().forEach(d => {
      deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });
  }
  
  applyFilters(); // Initial render
}

function applyFilters() {
  const searchQ = document.getElementById('tb-search').value.toLowerCase();
  const fType = document.getElementById('filter-type').value;
  const fDept = document.getElementById('filter-dept').value;
  const fStatus = document.getElementById('filter-status').value;

  filteredData = allData.filter(d => {
    // 1. Search (ครอบคลุมหลายฟิลด์)
    const matchSearch = searchQ === "" || 
      [d.dateIn, d.dept, d.moneyType, d.sender, d.invoice, d.budgetCode, d.vendor, d.item, d.withdrawNo, d.dekaNo, d.amount.toString()]
      .join(" ").toLowerCase().includes(searchQ);
    
    // 2. Filters
    const dType = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน"].includes(d.moneyType) ? d.moneyType : "เงินอื่น";
    const matchType = fType === "" || dType === fType;
    const matchDept = fDept === "" || d.dept === fDept;
    const matchStatus = fStatus === "" || d.status === fStatus;

    return matchSearch && matchType && matchDept && matchStatus;
  });

  // Sort: วันที่รับล่าสุด (tsIn มากไปน้อย), ถ้าวันเดียวกัน เลขรับมากไปน้อย
  filteredData.sort((a, b) => {
    if (a.tsIn === b.tsIn) {
      return b.receiveNo - a.receiveNo;
    }
    return (b.tsIn || 0) - (a.tsIn || 0);
  });

  currentPage = 1;
  renderTable();
}

function clearFilters() {
  document.getElementById('tb-search').value = "";
  document.getElementById('filter-type').value = "";
  document.getElementById('filter-dept').value = "";
  document.getElementById('filter-status').value = "";
  applyFilters();
}

function changeLimit() {
  limit = parseInt(document.getElementById('tb-limit').value);
  currentPage = 1;
  renderTable();
}

function getStatusBadge(status) {
  const map = {
    'รับเข้าระบบ': 'bg-gray-100 text-gray-600',
    'ตรวจสอบ': 'bg-blue-100 text-blue-600',
    'ส่งแก้ไข': 'bg-red-100 text-red-600',
    'ผ่านการตรวจ': 'bg-indigo-100 text-indigo-600',
    'ส่งเสนอ': 'bg-yellow-100 text-yellow-700',
    'อนุมัติจ่าย': 'bg-orange-100 text-orange-600',
    'รอจ่าย': 'bg-teal-100 text-teal-600',
    'จ่ายแล้ว': 'bg-green-100 text-green-600',
    'ยกเลิก': 'bg-gray-800 text-white'
  };
  const cls = map[status] || 'bg-gray-100 text-gray-600';
  return `<span class="px-2 py-1 rounded text-xs font-medium ${cls}">${status}</span>`;
}

function getTypeStyle(type) {
  const map = {
    "เงินงบประมาณ": "bg-[#FFCCFF] text-[#cc00cc]",
    "เงินบำรุง": "bg-[#FFFF99] text-[#999900]",
    "เงินประกันสุขภาพ": "bg-[#F8CBAD] text-[#d2691e]",
    "เงินอุดหนุน": "bg-[#FF9999] text-[#cc0000]"
  };
  return map[type] || "bg-gray-200 text-gray-600"; // เงินอื่น
}

function renderTable() {
  const tbody = document.getElementById('tb-body');
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const pageData = filteredData.slice(start, end);

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>`;
    document.getElementById('tb-info').innerText = "แสดง 0 ถึง 0 จาก 0 รายการ";
    document.getElementById('tb-pagination').innerHTML = "";
    return;
  }

  tbody.innerHTML = pageData.map((r, i) => {
    const typeCls = getTypeStyle(["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน"].includes(r.moneyType) ? r.moneyType : "เงินอื่น");
    
    return `
    <tr class="table-row-hover transition" onclick="openModal(${allData.indexOf(r)})">
      <td class="px-4 py-3 align-top">
        <div class="text-xs text-gray-500">วันที่รับ: ${r.dateIn || '-'}</div>
        <div class="font-medium text-gray-800">เลขรับ: ${r.receiveNo}</div>
      </td>
      <td class="px-4 py-3 align-top">${getStatusBadge(r.status)}</td>
      <td class="px-4 py-3 align-top text-sm">
        <div class="text-gray-500">ใบขอเบิก: <span class="text-gray-800">${r.withdrawNo}</span></div>
        <div class="text-gray-500">เลขที่ฎีกา: <span class="text-gray-800">${r.dekaNo}</span></div>
      </td>
      <td class="px-4 py-3 align-top font-bold text-gray-900 text-base">${r.vendor}</td>
      <td class="px-4 py-3 align-top whitespace-normal break-words w-1/3">
        <div class="line-clamp-2" title="${r.item}">${r.item}</div>
      </td>
      <td class="px-4 py-3 align-top text-right font-black text-lg text-purple-600">
        ${formatMoney(r.amount)}
      </td>
      <td class="px-4 py-3 align-top">
        <span class="inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${typeCls}">${r.moneyType}</span>
        <div class="text-xs text-gray-600 truncate max-w-[150px]" title="${r.dept}"><i class="ph ph-buildings mr-1"></i>${r.dept}</div>
      </td>
    </tr>
  `}).join('');

  document.getElementById('tb-info').innerText = `แสดง ${start + 1} ถึง ${Math.min(end, filteredData.length)} จาก ${filteredData.length} รายการ`;
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / limit);
  let html = '';
  
  if (totalPages > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})" class="px-2 py-1 rounded border bg-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}"><i class="ph ph-caret-left"></i></button>`;
    
    // Simple pagination logic (shows some pages)
    for(let i=1; i<=totalPages; i++) {
      if(i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button onclick="goToPage(${i})" class="px-3 py-1 rounded border ${i === currentPage ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-50'}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="px-2 py-1">...</span>`;
      }
    }

    html += `<button onclick="goToPage(${currentPage + 1})" class="px-2 py-1 rounded border bg-white ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}"><i class="ph ph-caret-right"></i></button>`;
  }
  document.getElementById('tb-pagination').innerHTML = html;
}

function goToPage(p) {
  const totalPages = Math.ceil(filteredData.length / limit);
  if (p >= 1 && p <= totalPages) {
    currentPage = p;
    renderTable();
  }
}

function openModal(index) {
  const r = allData[index];
  if(!r) return;

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-body');
  
  const typeCls = getTypeStyle(["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน"].includes(r.moneyType) ? r.moneyType : "เงินอื่น");

  body.innerHTML = `
    <div class="flex justify-between items-start mb-4">
      <div>
        <div class="text-sm text-gray-500">สถานะปัจจุบัน</div>
        <div class="mt-1">${getStatusBadge(r.status)}</div>
      </div>
      <div class="text-right">
        <span class="${typeCls} px-3 py-1 rounded-full text-xs font-medium">${r.moneyType}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 border-y border-gray-100 py-4 mb-4 text-sm">
      <div><span class="text-gray-400 block text-xs">เลขรับ</span><span class="font-medium">${r.receiveNo}</span></div>
      <div><span class="text-gray-400 block text-xs">เลขที่ใบขอเบิก</span><span class="font-medium">${r.withdrawNo}</span></div>
      <div><span class="text-gray-400 block text-xs">เลขที่ฎีกา</span><span class="font-medium">${r.dekaNo}</span></div>
      
      <div class="col-span-2 md:col-span-1"><span class="text-gray-400 block text-xs">หน่วยงาน</span><span class="font-medium">${r.dept}</span></div>
      <div class="col-span-2 md:col-span-2"><span class="text-gray-400 block text-xs">ผู้ส่งเอกสาร</span><span class="font-medium">${r.sender}</span></div>
      
      <div><span class="text-gray-400 block text-xs">เลขที่ใบกัน</span><span class="font-medium">${r.budgetCode}</span></div>
      <div><span class="text-gray-400 block text-xs">จำนวนเงินกัน</span><span class="font-medium">${formatMoney(r.budgetAmount)} บ.</span></div>
      <div><span class="text-gray-400 block text-xs">ผู้ตรวจ</span><span class="font-medium">${r.checker}</span></div>

      <div><span class="text-gray-400 block text-xs">Invoice</span><span class="font-medium">${r.invoice}</span></div>
      <div class="col-span-2"><span class="text-gray-400 block text-xs">งวด/เดือนที่เบิก</span><span class="font-medium">${r.lesson}</span></div>
    </div>

    <div class="bg-gray-50 p-4 rounded-lg">
      <div class="mb-3">
        <span class="text-gray-400 block text-xs mb-1">ชื่อเจ้าหนี้/ชื่อบริษัท</span>
        <span class="text-lg font-bold text-gray-800">${r.vendor}</span>
      </div>
      <div class="mb-3">
        <span class="text-gray-400 block text-xs mb-1">รายการ</span>
        <span class="text-gray-700 leading-relaxed">${r.item}</span>
      </div>
      <div>
        <span class="text-gray-400 block text-xs mb-1">จำนวนเงินขอเบิก</span>
        <span class="text-2xl font-black text-purple-600">${formatMoney(r.amount)} <span class="text-sm font-normal text-gray-500">บาท</span></span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  // Add animation class slightly after showing
  setTimeout(() => {
    document.getElementById('detail-modal-content').classList.remove('scale-95');
    document.getElementById('detail-modal-content').classList.add('scale-100');
  }, 10);
}

function closeModal() {
  document.getElementById('detail-modal-content').classList.remove('scale-100');
  document.getElementById('detail-modal-content').classList.add('scale-95');
  setTimeout(() => {
    document.getElementById('detail-modal').classList.add('hidden');
  }, 200);
}

// ปิด Modal เมื่อคลิกพื้นที่ว่าง
document.getElementById('detail-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
