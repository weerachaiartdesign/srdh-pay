/*<!-- import.js - (ควบคุมหน้านำเข้าข้อมูล) - version 00108 -->*/

let pendingRecords = [];
let currentBatchId = null;

function initImport() {
    loadSettingsForImport();
    attachImportEvents();
    renderPendingTable();
}

function loadSettingsForImport() {
    google.script.run.withSuccessHandler(data => {
        window.vendors = data.vendors || [];
        window.moneyTypes = data.moneyTypes || [];
        const moneySelect = document.getElementById('moneyTypeSelect');
        if (moneySelect) {
            moneySelect.innerHTML = '<option value="">--เลือก--</option>';
            window.moneyTypes.forEach(t => { let opt = document.createElement('option'); opt.value = t; opt.text = t; moneySelect.appendChild(opt); });
        }
    }).getSettings();
}

function attachImportEvents() {
    document.getElementById('addRecordBtn')?.addEventListener('click', showAddRecordForm);
    document.getElementById('registerBtn')?.addEventListener('click', confirmRegister);
    document.getElementById('printRegisterBtn')?.addEventListener('click', showPrintRegisterDialog);
}

function showAddRecordForm() {
    if (pendingRecords.length >= 15) { alert('เพิ่มได้สูงสุด 15 รายการต่อการลงทะเบียน'); return; }
    const modal = document.getElementById('globalModal');
    const content = modal.querySelector('.bg-white');
    content.innerHTML = `
        <div class="p-5">
            <h2 class="text-xl font-bold mb-4">เพิ่มข้อมูลเบิกจ่าย</h2>
            <form id="addRecordForm" class="space-y-3">
                <div><label>ประเภทเงิน</label><select id="moneyType" class="w-full border rounded p-1" required>${(window.moneyTypes||[]).map(t=>`<option>${t}</option>`).join('')}</select></div>
                <div><label>เลขที่ใบกัน</label><input id="reserveNo" class="w-full border rounded p-1"></div>
                <div><label>จำนวนเงินกัน</label><input id="reservedAmount" type="number" class="w-full border rounded p-1"></div>
                <div><label>ชื่อเจ้าหนี้/บริษัท</label><input id="vendor" list="vendorList" class="w-full border rounded p-1" required><datalist id="vendorList">${(window.vendors||[]).map(v=>`<option>${v}</option>`).join('')}</datalist></div>
                <div><label>จำนวนเงินขอเบิก</label><input id="amount" type="number" class="w-full border rounded p-1" required></div>
                <div><label>รายการ</label><textarea id="description" class="w-full border rounded p-1" rows="2" required></textarea></div>
                <div><label>Invoice</label><input id="invoice" class="w-full border rounded p-1"></div>
                <div><label>งวด/เดือนที่เบิก</label><input id="period" class="w-full border rounded p-1"></div>
                <div class="flex justify-end gap-2"><button type="button" onclick="closeModal()" class="bg-gray-500 text-white px-3 py-1 rounded">ยกเลิก</button><button type="submit" class="bg-green-600 text-white px-3 py-1 rounded">เพิ่ม</button></div>
            </form>
        </div>
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('addRecordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newRecord = {
            moneyType: document.getElementById('moneyType').value,
            reserveNo: document.getElementById('reserveNo').value,
            reservedAmount: document.getElementById('reservedAmount').value,
            vendor: document.getElementById('vendor').value,
            amount: document.getElementById('amount').value,
            description: document.getElementById('description').value,
            invoice: document.getElementById('invoice').value,
            period: document.getElementById('period').value,
            registerDate: new Date().toLocaleDateString('en-GB'),
            dept: currentUser?.dept || '',
            sender: currentUser?.username || ''
        };
        pendingRecords.push(newRecord);
        renderPendingTable();
        closeModal();
        document.getElementById('registerBtn').disabled = false;
    });
}

function renderPendingTable() {
    const container = document.getElementById('pendingTable');
    if (!container) return;
    if (pendingRecords.length === 0) { container.innerHTML = '<div class="text-center text-gray-500 py-10">ยังไม่มีรายการ กรุณากด + เพิ่มข้อมูล</div>'; return; }
    let html = '<div class="overflow-x-auto"><table class="min-w-full bg-white dark:bg-gray-800"><thead class="bg-purple-100"><tr><th>#</th><th>ประเภทเงิน</th><th>เจ้าหนี้</th><th>รายการ</th><th>จำนวนเงิน</th><th></th></tr></thead><tbody>';
    pendingRecords.forEach((r, idx) => {
        html += `<tr><td>${idx+1}</td><td>${r.moneyType}</td><td>${r.vendor}</td><td>${r.description.substring(0,30)}</td><td class="text-right">${formatNumber(r.amount)}</td><td><button onclick="removeRecord(${idx})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function removeRecord(idx) { pendingRecords.splice(idx,1); renderPendingTable(); if(pendingRecords.length===0) document.getElementById('registerBtn').disabled=true; }
function confirmRegister() { if(pendingRecords.length===0) return; if(confirm('ยืนยันการลงทะเบียน '+pendingRecords.length+' รายการ?')) { doRegister(); } }
function doRegister() {
    const batchId = Date.now().toString();
    google.script.run.withSuccessHandler(result => { if(result.success) { alert('ลงทะเบียนสำเร็จ เลขที่ '+result.batchId); pendingRecords=[]; renderPendingTable(); document.getElementById('registerBtn').disabled=true; } else alert('เกิดข้อผิดพลาด'); }).batchInsertRegister(pendingRecords, batchId, currentUser.email, currentUser.dept);
}
function showPrintRegisterDialog() { alert('เลือกเลขที่ลงทะเบียนเพื่อพิมพ์ (กำลังพัฒนา)'); }
function formatNumber(num) { return new Intl.NumberFormat().format(num||0); }
