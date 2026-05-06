/*<!-- =================================================
       ไฟล์: js/list.js (ตารางและตัวกรอง) version : 00106
       ================================================= -->*/
/* Handles the register list table, filtering, and detail modal. */

let currentPage = 1, limit = 50, filteredData = [];

function initList() {
  populateFilterOptions();
  applyFilters();
}

function populateFilterOptions() {
  const types = [...new Set(allData.map(d => d.moneyType).filter(Boolean))];
  const depts = [...new Set(allData.map(d => d.dept).filter(Boolean))];
  document.getElementById('list-filter-type').innerHTML = '<option value="">ทุกประเภท</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
  document.getElementById('list-filter-dept').innerHTML = '<option value="">ทุกหน่วยงาน</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
}

function applyFilters() {
  const q = (document.getElementById('list-search')?.value || '').toLowerCase();
  const type = document.getElementById('list-filter-type')?.value || '';
  const dept = document.getElementById('list-filter-dept')?.value || '';
  const status = document.getElementById('list-filter-status')?.value || '';
  limit = parseInt(document.getElementById('list-limit')?.value || 50);

  let filtered = allData.filter(d => {
    const searchStr = [d.moneyType, d.dept, d.sender, d.invoice, d.vendor, d.withdrawNo, d.dekaNo, d.receiveNo, d.item].join(' ').toLowerCase();
    return (!q || searchStr.includes(q)) &&
           (!type || d.moneyType === type) &&
           (!dept || d.dept === dept) &&
           (!status || d.status === status);
  });
  // Sort by dateIn desc, then receiveNo desc
  filtered.sort((a,b) => (b.tsDateIn || 0) - (a.tsDateIn || 0) || b.receiveNo - a.receiveNo);
  filteredData = filtered;
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * limit;
  const pageItems = filteredData.slice(start, start + limit);
  const tbody = document.getElementById('list-tbody');
  tbody.innerHTML = pageItems.map((r, idx) => {
    const col = COLORS[r.moneyType] || COLORS["เงินอื่น"];
    return `<tr class="hover:bg-gray-50 cursor-pointer" onclick="openDetail(${r.receiveNo})">
      <td data-label="ลำดับ" class="px-4 py-2"><div class="text-xs text-gray-500">${r.dateIn}</div><b>เลขรับ: ${r.receiveNo}</b></td>
      <td data-label="สถานะ" class="px-4 py-2"><span class="px-2 py-1 bg-gray-100 rounded text-xs">${r.status}</span></td>
      <td data-label="ฎีกา" class="px-4 py-2"><div class="text-xs">ใบเบิก: ${r.withdrawNo}</div><div>ฎีกา: ${r.dekaNo}</div></td>
      <td data-label="เจ้าหนี้" class="px-4 py-2 font-bold">${r.vendor}</td>
      <td data-label="รายการ" class="px-4 py-2 text-xs max-w-xs truncate">${r.item}</td>
      <td data-label="จำนวนเงิน" class="px-4 py-2 text-right font-bold text-purple-600">${r.amount.toLocaleString()}</td>
      <td data-label="ประเภท/หน่วยงาน" class="px-4 py-2"><span class="${col} px-2 py-0.5 rounded text-xs block mb-1 text-center">${r.moneyType}</span><div class="text-xs text-gray-500 text-center">${r.dept}</div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-500">ไม่พบข้อมูล</td></tr>';

  // Pagination
  const totalPages = Math.ceil(filteredData.length / limit);
  document.getElementById('list-pagination').innerHTML = `หน้า ${currentPage} / ${totalPages} (${filteredData.length} รายการ)`;
}

function openDetail(receiveNo) {
  const r = allData.find(d => d.receiveNo === receiveNo);
  if (!r) return;
  // Status progress bar
  const steps = ['รับเข้าหน่วยงาน','ตรวจสอบ','ส่งแก้ไข','ตรวจผ่าน','ส่งเสนอ','อนุมัติ','จ่ายแล้ว'];
  const dates = {
    'รับเข้าหน่วยงาน': r.dateIn,
    'ตรวจสอบ': (r.checker || r.receiveBackDate) ? 'มี' : '',
    'ส่งแก้ไข': r.editDate,
    'ตรวจผ่าน': r.checkPassDate,
    'ส่งเสนอ': r.proposeDate,
    'อนุมัติ': r.approveDate,
    'จ่ายแล้ว': r.payDate
  };
  let progressHtml = '<div class="flex flex-wrap gap-2 mb-4">';
  steps.forEach(step => {
    const active = steps.indexOf(step) <= steps.indexOf(r.status);
    const dateText = dates[step] || '';
    if (step === 'ส่งแก้ไข' && !r.editDate) return; // skip if not in this path
    progressHtml += `<span class="${active?'bg-purple-600 text-white':'bg-gray-200 text-gray-500'} px-3 py-1 rounded-full text-xs">${step}${dateText?'<br>'+dateText:''}</span>`;
  });
  progressHtml += '</div>';

  const body = document.getElementById('modal-detail-body');
  body.innerHTML = `
    ${progressHtml}
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div><span class="text-gray-400">เลขที่รับ</span> <b>${r.receiveNo}</b></div>
      <div><span class="text-gray-400">ใบขอเบิก/ฎีกา</span> ${r.withdrawNo}/${r.dekaNo}</div>
      <div><span class="text-gray-400">ประเภทเงิน</span> ${r.moneyType}</div>
      <div><span class="text-gray-400">หน่วยงาน</span> ${r.dept}</div>
      <div><span class="text-gray-400">ผู้ส่งเอกสาร</span> ${r.sender}</div>
      <div><span class="text-gray-400">ผู้ตรวจ</span> ${r.checker||'-'}</div>
      <div><span class="text-gray-400">เลขที่ใบกัน</span> ${r.budgetCode||'-'}</div>
      <div><span class="text-gray-400">จำนวนเงินกัน</span> ${r.budgetAmount||0}</div>
      <div><span class="text-gray-400">Invoice</span> ${r.invoice||'-'}</div>
      <div><span class="text-gray-400">งวด/เดือน</span> ${r.lesson||'-'}</div>
      <div class="col-span-2"><span class="text-gray-400">เจ้าหนี้</span> <b>${r.vendor}</b></div>
      <div class="col-span-2"><span class="text-gray-400">จำนวนเงินขอเบิก</span> <b class="text-xl text-purple-600">${r.amount.toLocaleString()} บ.</b></div>
      <div class="col-span-2"><span class="text-gray-400">รายการ</span> ${r.item}</div>
    </div>`;

  const actions = document.getElementById('modal-detail-actions');
  actions.innerHTML = '<button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded-lg">ปิด</button>';
  if (currentUser.role === 'admin') {
    actions.innerHTML += '<button onclick="editRow('+r.receiveNo+')" class="px-4 py-2 bg-purple-600 text-white rounded-lg">แก้ไขข้อมูล</button>';
  } else if (currentUser.role === 'editor') {
    actions.innerHTML += '<button onclick="editRowEditor('+r.receiveNo+')" class="px-4 py-2 bg-indigo-500 text-white rounded-lg">แก้ไขการตรวจ</button>';
  }
  document.getElementById('modal-detail').classList.remove('hidden');
  document.getElementById('modal-detail').classList.add('flex');
}

function closeModal() {
  document.getElementById('modal-detail').classList.add('hidden');
  document.getElementById('modal-detail').classList.remove('flex');
}

function clearFilters() {
  document.getElementById('list-search').value = '';
  document.getElementById('list-filter-type').value = '';
  document.getElementById('list-filter-dept').value = '';
  document.getElementById('list-filter-status').value = '';
  applyFilters();
}
