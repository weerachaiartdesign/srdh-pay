// Version: 00122-
// List Page Controller - ทะเบียนฎีกา

let allData = [];
let filteredData = [];
let currentPage = 1;
let pageSize = 100;

// โหลดข้อมูลทั้งหมด
async function loadRegisterData() {
    try {
        const result = await callGAS('getRegisterData');
        if (result.success) {
            allData = result.data || [];
            filteredData = [...allData];
            renderTable();
            populateFilters();
        }
    } catch (error) {
        console.error("Load data error:", error);
        alert("ไม่สามารถโหลดข้อมูลทะเบียนได้");
    }
}

// เติมข้อมูลในตัวกรอง
function populateFilters() {
    const moneyTypes = new Set();
    const depts = new Set();
    const statuses = new Set();

    allData.forEach(item => {
        if (item[0]) moneyTypes.add(item[0]); // ประเภทเงิน (Column A)
        if (item[1]) depts.add(item[1]);       // หน่วยงาน (Column B)
        const status = getStatus(item);
        if (status) statuses.add(status);
    });

    // Populate money type filter
    const mtSelect = document.getElementById('filterMoneyType');
    Array.from(moneyTypes).sort().forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        mtSelect.appendChild(opt);
    });

    // Populate department filter
    const deptSelect = document.getElementById('filterDept');
    Array.from(depts).sort().forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        deptSelect.appendChild(opt);
    });
}

// หาสถานะของแต่ละรายการ
function getStatus(row) {
    if (row[23]) return "ยกเลิก";           // X = วันที่ยกเลิก
    if (row[22]) return "จ่ายแล้ว";         // W
    if (row[21]) return "อนุมัติ";          // V
    if (row[20]) return "เสนอ";             // U
    if (row[19]) return "ตรวจผ่าน";         // T
    if (row[18]) return "รับคืน";           // S
    if (row[17]) return "ส่งแก้ไข";         // R
    if (row[16]) return "รับเอกสาร";        // Q
    if (row[15]) return "รอเอกสาร";         // P
    return "รออนุมัติ";
}

// Render Desktop Table
function renderTable() {
    const tbody = document.getElementById('table-body');
    const mobileContainer = document.getElementById('mobile-cards');
    tbody.innerHTML = '';
    mobileContainer.innerHTML = '';

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);

    pageData.forEach((row, index) => {
        const globalIndex = start + index;
        const status = getStatus(row);
        const moneyType = row[0] || '-';

        // Desktop Row
        const tr = document.createElement('tr');
        tr.className = `table-row cursor-pointer hover:bg-purple-50`;
        tr.innerHTML = `
            <td class="px-6 py-5">
                <div class="text-sm">${formatThaiDate(row[16])}</div>
                <div class="font-medium text-purple-700">เลขรับ: ${row[10] || '-'}</div>
            </td>
            <td class="px-6 py-5">
                <span class="px-4 py-1.5 rounded-2xl text-xs font-medium ${getStatusClass(status)}">${status}</span>
            </td>
            <td class="px-6 py-5">
                <div>ใบขอเบิก: ${row[12] || '-'}</div>
                <div class="font-medium">ฎีกา: ${row[13] || '-'}</div>
            </td>
            <td class="px-6 py-5 font-semibold text-gray-800">${row[4] || '-'}</td>
            <td class="px-6 py-5 max-w-xs truncate">${row[6] || '-'}</td>
            <td class="px-6 py-5 text-right font-bold text-lg">${formatCurrency(row[5])}</td>
            <td class="px-6 py-5">
                <span class="money-type-${moneyType.replace(/ /g,'')} px-4 py-1 rounded-2xl text-xs">${moneyType}</span>
            </td>
        `;
        tr.onclick = () => showDetailPopup(globalIndex);
        tbody.appendChild(tr);

        // Mobile Card
        const card = document.createElement('div');
        card.className = `card p-5 cursor-pointer`;
        card.innerHTML = `
            <div class="flex justify-between">
                <div>
                    <div class="text-xs text-purple-500">${formatThaiDate(row[16])}</div>
                    <div class="font-semibold">เลขรับ ${row[10] || '-'}</div>
                </div>
                <span class="px-4 py-1 text-xs font-medium rounded-2xl ${getStatusClass(status)}">${status}</span>
            </div>
            <div class="mt-3 font-bold text-lg">${row[4] || '-'}</div>
            <div class="text-sm text-gray-600 line-clamp-2">${row[6] || '-'}</div>
            <div class="flex justify-between items-end mt-4">
                <div>
                    <span class="money-type-${moneyType.replace(/ /g,'')} px-3 py-1 text-xs rounded-2xl">${moneyType}</span>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold">${formatCurrency(row[5])}</div>
                </div>
            </div>
        `;
        card.onclick = () => showDetailPopup(globalIndex);
        mobileContainer.appendChild(card);
    });

    renderPagination();
}

function getStatusClass(status) {
    if (status.includes("จ่ายแล้ว") || status.includes("อนุมัติ")) return "bg-emerald-100 text-emerald-700";
    if (status.includes("ยกเลิก")) return "bg-red-100 text-red-700";
    if (status.includes("แก้ไข")) return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
}

// Popup แสดงรายละเอียด
function showDetailPopup(index) {
    const row = filteredData[index];
    if (!row) return;

    const html = `
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>ประเภทเงิน:</strong> ${row[0] || '-'}</div>
            <div><strong>หน่วยงาน:</strong> ${row[1] || '-'}</div>
            <div><strong>เลขที่รับ:</strong> ${row[10] || '-'}</div>
            <div><strong>เลขที่ฎีกา:</strong> ${row[13] || '-'}</div>
            <div class="col-span-2"><strong>ชื่อเจ้าหนี้:</strong> ${row[4] || '-'}</div>
            <div class="col-span-2"><strong>รายการ:</strong> ${row[6] || '-'}</div>
            <div><strong>จำนวนเงิน:</strong> <span class="font-bold">${formatCurrency(row[5])}</span></div>
            <div><strong>สถานะ:</strong> ${getStatus(row)}</div>
        </div>
        
        <div class="mt-8">
            <h4 class="font-semibold mb-3 text-purple-800">ไทม์ไลน์การดำเนินการ</h4>
            <div class="space-y-4">
                ${generateTimeline(row)}
            </div>
        </div>

        ${getActionButtons(row, index)}
    `;

    document.getElementById('popup-content').innerHTML = html;
    document.getElementById('detailPopup').classList.remove('hidden');
}

function generateTimeline(row) {
    const steps = [
        { label: "ลงทะเบียน", date: row[15] },
        { label: "รับเอกสาร", date: row[16] },
        { label: "ตรวจผ่าน", date: row[19] },
        { label: "อนุมัติ", date: row[21] },
        { label: "จ่ายเช็ค", date: row[22] }
    ];

    return steps.map(step => `
        <div class="flex gap-4">
            <div class="w-24 text-right text-purple-500">${step.label}</div>
            <div class="flex-1 border-l-2 border-purple-200 pl-6">
                ${step.date ? formatThaiDate(step.date) : '<span class="text-gray-400">รอดำเนินการ</span>'}
            </div>
        </div>
    `).join('');
}

function getActionButtons(row, index) {
    const role = currentUser ? currentUser.role : 'guest';
    let buttons = '';

    if (role === 'admin' || role === 'editor') {
        buttons = `
            <div class="flex gap-3 mt-8">
                <button onclick="editRecord(${index})" 
                        class="flex-1 btn-primary py-4 rounded-2xl text-white">
                    แก้ไขข้อมูล
                </button>
            </div>
        `;
    }
    return buttons;
}

function closePopup() {
    document.getElementById('detailPopup').classList.add('hidden');
}

// Search & Filter
function searchTable() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(row => 
            row.some(cell => cell && String(cell).toLowerCase().includes(term))
        );
    }
    currentPage = 1;
    renderTable();
}

function filterTable() {
    const money = document.getElementById('filterMoneyType').value;
    const dept = document.getElementById('filterDept').value;
    const statusFilter = document.getElementById('filterStatus').value;

    filteredData = allData.filter(row => {
        let match = true;
        if (money && row[0] !== money) match = false;
        if (dept && row[1] !== dept) match = false;
        if (statusFilter && getStatus(row) !== statusFilter) match = false;
        return match;
    });

    currentPage = 1;
    renderTable();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterMoneyType').value = '';
    document.getElementById('filterDept').value = '';
    document.getElementById('filterStatus').value = '';
    filteredData = [...allData];
    currentPage = 1;
    renderTable();
}

// Pagination
function renderPagination() {
    // Implementation can be expanded
    document.getElementById('pagination').innerHTML = `
        <button onclick="prevPage()" class="px-4 py-2 border rounded-xl">ก่อนหน้า</button>
        <span class="px-4 py-2">หน้า ${currentPage}</span>
        <button onclick="nextPage()" class="px-4 py-2 border rounded-xl">ถัดไป</button>
    `;
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function refreshList() {
    loadRegisterData();
}

function editRecord(index) {
    alert("ฟังก์ชันแก้ไขข้อมูล (จะเชื่อมต่อกับ Popup แก้ไขในเวอร์ชันถัดไป)");
    // TODO: Implement full edit modal
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    loadRegisterData();
});