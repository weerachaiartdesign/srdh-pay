// Version: 00122
// Approve Page Controller - หน้าบันทึกรายการ (สำหรับ Checker & Admin)

let approveData = [];
let filteredApproveData = [];
let selectedItems = new Set();
let currentAction = null;

// โหลดข้อมูล
async function loadApproveData() {
    try {
        const result = await callGAS('getRegisterData');
        if (result.success) {
            approveData = result.data || [];
            filteredApproveData = [...approveData];
            renderApproveTable();
            populateApproveFilters();
        }
    } catch (error) {
        console.error("Load approve data error:", error);
    }
}

function populateApproveFilters() {
    // Similar to list.js - populate dropdowns
    const moneySelect = document.getElementById('filterMoneyType');
    const deptSelect = document.getElementById('filterDept');
    
    const moneyTypes = new Set(approveData.map(row => row[0]).filter(Boolean));
    const depts = new Set(approveData.map(row => row[1]).filter(Boolean));
    
    moneyTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type; opt.textContent = type;
        moneySelect.appendChild(opt);
    });
    
    depts.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept; opt.textContent = dept;
        deptSelect.appendChild(opt);
    });
}

function renderApproveTable() {
    const tbody = document.getElementById('approve-table-body');
    tbody.innerHTML = '';

    filteredApproveData.forEach((row, index) => {
        const status = getStatus(row);
        const isChecked = selectedItems.has(index);
        
        const tr = document.createElement('tr');
        tr.className = `table-row hover:bg-purple-50 ${isChecked ? 'bg-purple-50' : ''}`;
        tr.innerHTML = `
            <td class="px-4 py-5">
                <input type="checkbox" ${isChecked ? 'checked' : ''} 
                       onchange="toggleSelect(${index}, this)">
            </td>
            <td class="px-6 py-5">
                <div class="text-sm">${formatThaiDate(row[16])}</div>
                <div class="font-medium">เลขรับ: ${row[10] || '-'}</div>
            </td>
            <td class="px-6 py-5">
                <span class="px-4 py-1.5 rounded-2xl text-xs font-medium ${getStatusClass(status)}">${status}</span>
            </td>
            <td class="px-6 py-5 font-semibold">${row[4] || '-'}</td>
            <td class="px-6 py-5 max-w-md truncate">${row[6] || '-'}</td>
            <td class="px-6 py-5 text-right font-bold">${formatCurrency(row[5])}</td>
            <td class="px-6 py-5">
                <span class="money-type-${(row[0] || '').replace(/ /g,'')} px-4 py-1 rounded-2xl text-xs">${row[0] || '-'}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateSelectedCount();
}

function toggleSelect(index, checkbox) {
    if (checkbox.checked) {
        selectedItems.add(index);
    } else {
        selectedItems.delete(index);
    }
    updateSelectedCount();
}

function toggleSelectAll(checkbox) {
    selectedItems.clear();
    if (checkbox.checked) {
        filteredApproveData.forEach((_, i) => selectedItems.add(i));
    }
    renderApproveTable();
}

function updateSelectedCount() {
    document.getElementById('selected-count').textContent = `เลือก ${selectedItems.size} รายการ`;
}

// ปุ่ม Action
function performAction(action) {
    if (selectedItems.size === 0) {
        alert("กรุณาเลือกรายการอย่างน้อย 1 รายการ");
        return;
    }
    
    currentAction = action;
    
    const titles = {
        'receive': 'รับเอกสาร',
        'edit': 'ส่งแก้ไข',
        'propose': 'ส่งเสนอ',
        'pay': 'จ่ายเช็ค'
    };
    
    document.getElementById('modal-title').textContent = titles[action];
    document.getElementById('dateModal').classList.remove('hidden');
}

function closeDateModal() {
    document.getElementById('dateModal').classList.add('hidden');
}

async function confirmAction() {
    const date = document.getElementById('action-date').value;
    if (!date) {
        alert("กรุณาเลือกวันที่");
        return;
    }

    const selectedRows = Array.from(selectedItems).map(i => filteredApproveData[i]);

    try {
        const result = await callGAS('updateStatus', {
            action: currentAction,
            items: selectedRows,
            date: date,
            user: currentUser
        });

        if (result.success) {
            alert(`ดำเนินการ "${currentAction}" สำเร็จ`);
            selectedItems.clear();
            closeDateModal();
            loadApproveData(); // Refresh
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการบันทึก");
    }
}

// Filter
function filterApproveData() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const money = document.getElementById('filterMoneyType').value;
    const dept = document.getElementById('filterDept').value;
    const statusFilter = document.getElementById('filterStatus').value;

    filteredApproveData = approveData.filter(row => {
        let match = true;
        if (term) {
            match = row.some(cell => cell && String(cell).toLowerCase().includes(term));
        }
        if (money && row[0] !== money) match = false;
        if (dept && row[1] !== dept) match = false;
        if (statusFilter && getStatus(row) !== statusFilter) match = false;
        return match;
    });

    renderApproveTable();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    loadApproveData();
});