/*<!-- js/list.js - (ควบคุมหน้าทะเบียนฎีกา - ตาราง/card, search, filter, popup) - version : 00108 -->*/

let allRecords = [];
let currentPage = 1;
let perPage = 50;
let sortOrder = 'desc';
let currentFilters = { search: '', moneyType: '', dept: '', status: '' };

function initList() {
    loadFiltersOptions();
    loadListData();
    attachListEvents();
}

function loadFiltersOptions() {
    google.script.run.withSuccessHandler(data => {
        const deptSelect = document.getElementById('deptFilter');
        if (deptSelect && data.depts) {
            data.depts.forEach(d => { let opt = document.createElement('option'); opt.value = d; opt.text = d; deptSelect.appendChild(opt); });
        }
    }).getFilterOptions(); // ต้องเพิ่มฟังก์ชันนี้ใน main.gs
}

function loadListData() {
    showListLoading();
    google.script.run
        .withSuccessHandler(displayList)
        .withFailureHandler(showError)
        .getRegisterData(currentFilters);
}

function displayList(data) {
    allRecords = data;
    currentPage = 1;
    renderTableOrCards();
    renderPagination();
}

function renderTableOrCards() {
    const container = document.getElementById('recordsContainer');
    if (!container) return;
    let filtered = filterRecords(allRecords);
    let sorted = sortRecords(filtered);
    let paginated = paginateRecords(sorted);
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        renderCardView(paginated, container);
    } else {
        renderTableView(paginated, container);
    }
}

function filterRecords(records) {
    let filtered = [...records];
    if (currentFilters.search) {
        const term = currentFilters.search.toLowerCase();
        filtered = filtered.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term)));
    }
    if (currentFilters.moneyType) filtered = filtered.filter(r => r['ประเภทเงิน'] === currentFilters.moneyType);
    if (currentFilters.dept) filtered = filtered.filter(r => r['หน่วยงาน'] === currentFilters.dept);
    if (currentFilters.status) filtered = filtered.filter(r => getStatus(r) === currentFilters.status);
    return filtered;
}

function sortRecords(records) {
    return records.sort((a, b) => {
        let dateA = new Date(a['วันที่รับเอกสาร'] || a['วันที่ลงทะเบียน'] || 0);
        let dateB = new Date(b['วันที่รับเอกสาร'] || b['วันที่ลงทะเบียน'] || 0);
        if (sortOrder === 'desc') return dateB - dateA;
        else return dateA - dateB;
    });
}

function paginateRecords(records) {
    const start = (currentPage - 1) * perPage;
    return records.slice(start, start + perPage);
}

function renderTableView(records, container) {
    let html = '<div class="overflow-x-auto"><table class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"><thead class="bg-purple-100 dark:bg-purple-900"><tr>';
    html += '<th class="p-2 text-left">ลำดับ</th><th class="p-2 text-left">สถานะ</th><th class="p-2 text-left">เลขที่ใบขอเบิก/ฎีกา</th><th class="p-2 text-left">ชื่อเจ้าหนี้/บริษัท</th><th class="p-2 text-left">รายการ</th><th class="p-2 text-right">จำนวนเงิน</th><th class="p-2 text-left">ประเภทเงิน/หน่วยงาน</th></tr></thead><tbody>';
    records.forEach((r, idx) => {
        const status = getStatus(r);
        const moneyType = r['ประเภทเงิน'];
        const bgColor = getMoneyTypeColor(moneyType);
        html += `<tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" data-idx="${idx}" onclick="showDetailModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">`;
        html += `<td class="p-2 text-sm">${formatDate(r['วันที่รับเอกสาร'])}<br><span class="text-xs">เลขรับ:${r['เลขที่รับ'] || '-'}</span></td>`;
        html += `<td class="p-2">${getStatusBadge(status)}</td>`;
        html += `<td class="p-2 text-sm">ใบขอเบิก:${r['เลขที่ใบขอเบิก'] || '-'}<br>ฎีกา:${r['เลขที่ฎีกา'] || '-'}</td>`;
        html += `<td class="p-2 font-bold">${r['ชื่อเจ้าหนี้/ชื่อบริษัท'] || '-'}</td>`;
        html += `<td class="p-2">${r['รายการ'] || '-'}</td>`;
        html += `<td class="p-2 text-right font-bold">${formatNumber(r['จำนวนเงินขอเบิก'])}</td>`;
        html += `<td class="p-2 text-sm" style="background-color:${bgColor}20">${moneyType}<br>${r['หน่วยงาน'] || '-'}</td>`;
        html += `</tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderCardView(records, container) {
    let html = '<div class="space-y-3">';
    records.forEach(r => {
        const status = getStatus(r);
        html += `<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border-l-4 ${getStatusBorder(status)}" onclick="showDetailModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">`;
        html += `<div class="flex justify-between"><span class="font-bold">${r['ชื่อเจ้าหนี้/ชื่อบริษัท']}</span><span>${getStatusBadge(status)}</span></div>`;
        html += `<div class="text-sm mt-1">${r['รายการ']}</div>`;
        html += `<div class="flex justify-between mt-2 text-sm"><span>${formatNumber(r['จำนวนเงินขอเบิก'])} บาท</span><span>${r['ประเภทเงิน']}</span></div>`;
        html += `<div class="text-xs text-gray-500 mt-1">รับเอกสาร: ${formatDate(r['วันที่รับเอกสาร'])} | เลขรับ: ${r['เลขที่รับ'] || '-'}</div>`;
        html += `</div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderPagination() {
    const total = filterRecords(allRecords).length;
    const totalPages = Math.ceil(total / perPage);
    let html = '<div class="flex gap-2">';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="px-3 py-1 rounded ${i === currentPage ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" onclick="goToPage(${i})">${i}</button>`;
    }
    if (totalPages > 5) html += '<span>...</span>';
    html += '</div>';
    const paginationDiv = document.getElementById('pagination');
    if (paginationDiv) paginationDiv.innerHTML = html;
}

function goToPage(page) { currentPage = page; renderTableOrCards(); renderPagination(); }
function attachListEvents() {
    document.getElementById('searchInput')?.addEventListener('input', e => { currentFilters.search = e.target.value; loadListData(); });
    document.getElementById('moneyTypeFilter')?.addEventListener('change', e => { currentFilters.moneyType = e.target.value; loadListData(); });
    document.getElementById('deptFilter')?.addEventListener('change', e => { currentFilters.dept = e.target.value; loadListData(); });
    document.getElementById('statusFilter')?.addEventListener('change', e => { currentFilters.status = e.target.value; loadListData(); });
    document.getElementById('clearFilters')?.addEventListener('click', () => { currentFilters = { search: '', moneyType: '', dept: '', status: '' }; loadListData(); });
    document.getElementById('perPage')?.addEventListener('change', e => { perPage = parseInt(e.target.value); loadListData(); });
    document.getElementById('sortOrder')?.addEventListener('change', e => { sortOrder = e.target.value; loadListData(); });
    document.getElementById('advancedSearchBtn')?.addEventListener('click', showAdvancedSearchModal);
}

function showAdvancedSearchModal() { alert('ฟังก์ชันค้นหาแบบละเอียด (จะเพิ่มเติมในรอบถัดไป)'); }
function getStatus(row) { /* เหมือนใน main.gs */ if (row['วันที่ยกเลิก']) return 'ยกเลิก'; if (row['วันที่จ่ายเช็ค']) return 'จ่ายแล้ว'; if (row['วันที่อนุมัติ']) return 'อนุมัติ'; if (row['วันที่เสนอ']) return 'ส่งเสนอ'; if (row['วันที่ตรวจผ่าน']) return 'ตรวจผ่าน'; if (row['วันที่รับคืน']) return 'ตรวจสอบ'; if (row['วันที่แก้ไข']) return 'ส่งแก้ไข'; if (row['ผู้ตรวจ']) return 'ตรวจสอบ'; if (row['วันที่รับเอกสาร']) return 'รับเข้าหน่วยงาน'; if (row['วันที่ลงทะเบียน']) return 'รอเอกสาร'; return 'ไม่ระบุ'; }
function getStatusBadge(status) { const color = { 'ยกเลิก':'red', 'จ่ายแล้ว':'green', 'อนุมัติ':'blue', 'ส่งเสนอ':'purple', 'ตรวจผ่าน':'teal', 'ตรวจสอบ':'yellow', 'ส่งแก้ไข':'orange', 'รับเข้าหน่วยงาน':'indigo', 'รอเอกสาร':'gray' }[status] || 'gray'; return `<span class="px-2 py-0.5 rounded-full text-xs bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200">${status}</span>`; }
function getStatusBorder(status) { const map = { 'ยกเลิก':'border-red-500','จ่ายแล้ว':'border-green-500','อนุมัติ':'border-blue-500' }; return map[status] || 'border-gray-300'; }
function getMoneyTypeColor(type) { const map = { 'เงินงบประมาณ':'#FFCCFF','เงินบำรุง':'#FFFF99','เงินประกันสุขภาพ':'#F8CBAD','เงินอุดหนุน':'#FF9999','เงินแพทยศาสตร์':'#FFF2CC','เงินอื่น':'#808080' }; return map[type] || '#CCCCCC'; }
function formatDate(dateStr) { if (!dateStr) return '-'; let d = new Date(dateStr); return d.toLocaleDateString('th-TH'); }
function formatNumber(num) { return new Intl.NumberFormat().format(num || 0); }
function showListLoading() { document.getElementById('recordsContainer').innerHTML = '<div class="text-center py-10">กำลังโหลด...</div>'; }
function showError(err) { alert('เกิดข้อผิดพลาด: ' + err); }

// ฟังก์ชันแสดง modal รายละเอียด (ใช้ร่วมกับ popup)
window.showDetailModal = function(record) {
    const modal = document.getElementById('globalModal');
    const contentDiv = modal.querySelector('.bg-white');
    const role = (currentUser && currentUser.role) ? currentUser.role : 'guest';
    let html = `<div class="p-5"><div class="flex justify-between"><h2 class="text-xl font-bold">รายละเอียดฏีกาเบิกจ่าย</h2><button onclick="closeModal()" class="text-gray-500">&times;</button></div>`;
    html += `<div class="mt-4 space-y-2 text-sm">`;
    html += `<p><strong>เลขที่รับ:</strong> ${record['เลขที่รับ'] || '-'}</p>`;
    html += `<p><strong>เลขที่ใบขอเบิก:</strong> ${record['เลขที่ใบขอเบิก'] || '-'}</p>`;
    html += `<p><strong>เลขที่ฎีกา:</strong> ${record['เลขที่ฎีกา'] || '-'}</p>`;
    html += `<p><strong>ประเภทเงิน:</strong> ${record['ประเภทเงิน']}</p>`;
    html += `<p><strong>หน่วยงาน:</strong> ${record['หน่วยงาน']}</p>`;
    html += `<p><strong>ผู้ส่งเอกสาร:</strong> ${record['ผู้ส่งเอกสาร'] || '-'}</p>`;
    html += `<p><strong>ผู้ตรวจ:</strong> ${record['ผู้ตรวจ'] || '-'}</p>`;
    html += `<p><strong>ชื่อเจ้าหนี้/บริษัท:</strong> ${record['ชื่อเจ้าหนี้/ชื่อบริษัท']}</p>`;
    html += `<p><strong>จำนวนเงินขอเบิก:</strong> ${formatNumber(record['จำนวนเงินขอเบิก'])} บาท</p>`;
    html += `<p><strong>รายการ:</strong> ${record['รายการ'] || '-'}</p>`;
    if (role === 'admin' || role === 'editor') {
        html += `<div class="mt-4 pt-2 border-t"><button onclick="editRecord('${record['เลขที่รับ']}')" class="bg-blue-600 text-white px-4 py-1 rounded">แก้ไขข้อมูล</button></div>`;
    }
    html += `</div></div>`;
    contentDiv.innerHTML = html;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
window.closeModal = function() { const modal = document.getElementById('globalModal'); modal.classList.add('hidden'); modal.classList.remove('flex'); 
};
