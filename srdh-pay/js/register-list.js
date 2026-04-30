// version : 00101

/**
 * ฟังก์ชันเริ่มต้นสำหรับหน้าทะเบียนรายการ
 */
function initRegisterList() {
  populateDeptFilter();
  handleFilter(); // โหลดข้อมูลลงตารางครั้งแรก
}

/**
 * ดึงรายการหน่วยงานที่ไม่ซ้ำกันมาใส่ใน Select Filter
 */
function populateDeptFilter() {
  const depts = [...new Set(allData.map(d => d.dept))].filter(Boolean).sort();
  const select = document.getElementById('filterDept');
  depts.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    select.appendChild(opt);
  });
}

/**
 * จัดการการกรองข้อมูลทั้งหมด (Search + Filters + Pagination)
 */
function handleFilter() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const moneyType = document.getElementById('filterMoneyType').value;
  const dept = document.getElementById('filterDept').value;
  const status = document.getElementById('filterStatus').value;
  const pageSize = parseInt(document.getElementById('pageSize').value);

  // กรองข้อมูล
  let filtered = allData.filter(item => {
    const matchSearch = Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm)
    );
    
    // Logic กรองเงินประเภท "อื่นๆ"
    const isSpecialType = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน"].includes(item.moneyType);
    const matchMoney = !moneyType ? true : 
                      (moneyType === "อื่นๆ" ? !isSpecialType : item.moneyType === moneyType);
    
    const matchDept = !dept ? true : item.dept === dept;
    const matchStatus = !status ? true : item.status === status;

    return matchSearch && matchMoney && matchDept && matchStatus;
  });

  // เรียงลำดับ: วันที่รับล่าสุดอยู่บน (A), ถ้าวันเดียวกันให้เลขรับมากอยู่บน
  filtered.sort((a, b) => {
    const dateA = new Date(a.rawDateIn).getTime();
    const dateB = new Date(b.rawDateIn).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return b.receiveNo - a.receiveNo;
  });

  renderTable(filtered.slice(0, pageSize));
}

/**
 * แสดงผลข้อมูลลงใน HTML Table
 */
function renderTable(data) {
  const tbody = document.getElementById('registerTableBody');
  tbody.innerHTML = data.map((r, idx) => `
    <tr class="hover:bg-purple-50 cursor-pointer transition-colors" onclick="showDetail(${r.receiveNo})">
      <td class="px-4 py-4 text-xs text-gray-500 leading-tight">
        วันที่รับ: ${r.dateIn}<br>
        <span class="font-semibold text-purple-600">เลขรับ: ${r.receiveNo}</span>
      </td>
      <td class="px-4 py-4">
        <span class="px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(r.status)}">
          ${r.status}
        </span>
      </td>
      <td class="px-4 py-4 text-xs">
        ใบขอเบิก: ${r.withdrawNo || '-'}<br>
        เลขที่ฎีกา: ${r.dekaNo || '-'}
      </td>
      <td class="px-4 py-4">
        <div class="text-sm font-bold text-gray-900">${r.vendor || '-'}</div>
      </td>
      <td class="px-4 py-4 text-sm text-gray-600 leading-relaxed">
        ${r.item || '-'}
      </td>
      <td class="px-4 py-4 text-right">
        <span class="text-base font-bold text-purple-800">
          ${Number(r.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </span>
      </td>
      <td class="px-4 py-4 text-xs">
        <div class="inline-block px-2 py-0.5 rounded font-medium mb-1" style="background-color: ${getMoneyColor(r.moneyType)}">
          ${r.moneyType}
        </div><br>
        <span class="text-gray-500">${r.dept || '-'}</span>
      </td>
    </tr>
  `).join('');
}

/**
 * กำหนดสีพื้นหลังตามประเภทเงิน
 */
function getMoneyColor(type) {
  const colors = {
    "เงินงบประมาณ": "#FFCCFF",
    "เงินบำรุง": "#FFFF99",
    "เงินประกันสุขภาพ": "#F8CBAD",
    "เงินอุดหนุน": "#FF9999"
  };
  return colors[type] || "#808080"; // เงินอื่นๆ เป็นสีเทา
}

/**
 * กำหนดสี Label ของสถานะ
 */
function getStatusColor(status) {
  const colors = {
    "รับเข้าระบบ": "bg-blue-100 text-blue-700",
    "ตรวจสอบ": "bg-yellow-100 text-yellow-700",
    "ส่งแก้ไข": "bg-orange-100 text-orange-700",
    "ผ่านการตรวจ": "bg-indigo-100 text-indigo-700",
    "ส่งเสนอ": "bg-purple-100 text-purple-700",
    "อนุมัติจ่าย": "bg-teal-100 text-teal-700",
    "รอจ่าย": "bg-pink-100 text-pink-700",
    "จ่ายแล้ว": "bg-green-100 text-green-700",
    "ยกเลิก": "bg-red-100 text-red-700"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

/**
 * แสดง Pop-up รายละเอียด
 */
function showDetail(receiveNo) {
  const item = allData.find(d => d.receiveNo === receiveNo);
  if (!item) return;

  const content = `
    <div class="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
      <div class="col-span-2 flex justify-between border-b pb-2">
        <span class="font-bold text-purple-700 text-base">เลขรับ: ${item.receiveNo}</span>
        <span class="px-3 py-1 rounded-full font-bold ${getStatusColor(item.status)}">${item.status}</span>
      </div>
      <div><p class="text-gray-500 text-xs uppercase">เลขที่ใบขอเบิก</p><p class="font-medium">${item.withdrawNo || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">เลขที่ฎีกา</p><p class="font-medium">${item.dekaNo || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">ประเภทเงิน</p><p class="font-medium">${item.moneyType || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">หน่วยงาน</p><p class="font-medium">${item.dept || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">ผู้ส่งเอกสาร</p><p class="font-medium">${item.sender || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">Invoice</p><p class="font-medium">${item.invoice || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">เลขที่ใบกัน</p><p class="font-medium">${item.budgetCode || '-'}</p></div>
      <div><p class="text-gray-500 text-xs uppercase">จำนวนเงินกัน</p><p class="font-medium">${Number(item.budgetAmount || 0).toLocaleString()} บาท</p></div>
      <div class="col-span-2 border-t pt-4">
        <p class="text-gray-500 text-xs uppercase">ชื่อเจ้าหนี้/บริษัท</p>
        <p class="text-lg font-bold text-gray-800">${item.vendor || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="text-gray-500 text-xs uppercase">รายการ</p>
        <p class="bg-gray-50 p-3 rounded-lg border border-gray-100">${item.item || '-'}</p>
      </div>
      <div class="col-span-2 flex justify-between items-center bg-purple-50 p-4 rounded-xl">
        <span class="text-purple-700 font-semibold">จำนวนเงินขอเบิก:</span>
        <span class="text-2xl font-bold text-purple-900">${Number(item.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} บาท</span>
      </div>
      <div class="col-span-2 text-right text-xs text-gray-400">
        ผู้ตรวจ: ${item.checker || '-'}
      </div>
    </div>
  `;
  document.getElementById('modalContent').innerHTML = content;
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterMoneyType').value = '';
  document.getElementById('filterDept').value = '';
  document.getElementById('filterStatus').value = '';
  handleFilter();
}
