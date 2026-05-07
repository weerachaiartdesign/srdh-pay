/*<!-- approve.js - (ควบคุมหน้าบันทึกรายการ - รับเอกสาร, ส่งแก้ไข, ส่งเสนอ, จ่ายเช็ค) - version 00108 -->*/

let approveRecords = [];
let selectedRows = new Set();

function initApprove() {
    loadApproveData();
    attachApproveEvents();
}

function loadApproveData() {
    google.script.run.withSuccessHandler(data => { approveRecords = data; renderApproveTable(); }).getRegisterData({});
}

function renderApproveTable() {
    const container = document.getElementById('approveTableContainer');
    if (!container) return;
    let html = '<div class="overflow-x-auto"><table class="min-w-full bg-white dark:bg-gray-800"><thead class="bg-purple-100"><tr><th><input type="checkbox" id="selectAll"></th><th>ลำดับ</th><th>สถานะ</th><th>เลขที่ใบขอเบิก/ฎีกา</th><th>ชื่อเจ้าหนี้</th><th>รายการ</th><th>จำนวนเงิน</th><th>ประเภทเงิน/หน่วยงาน</th></tr></thead><tbody>';
    approveRecords.forEach((r, idx) => {
        const isChecked = selectedRows.has(idx);
        html += `<tr class="border-b"><td><input type="checkbox" class="rowCheckbox" data-idx="${idx}" ${isChecked ? 'checked' : ''}></td>`;
        html += `<td>${formatDate(r['วันที่รับเอกสาร'])}<br>เลขรับ:${r['เลขที่รับ']}</td><td>${getStatusBadge(getStatus(r))}</td>`;
        html += `<td>ใบขอเบิก:${r['เลขที่ใบขอเบิก']||'-'}<br>ฎีกา:${r['เลขที่ฎีกา']||'-'}</td>`;
        html += `<td class="font-bold">${r['ชื่อเจ้าหนี้/ชื่อบริษัท']}</td><td>${r['รายการ']}</td>`;
        html += `<td class="text-right">${formatNumber(r['จำนวนเงินขอเบิก'])}</td>`;
        html += `<td>${r['ประเภทเงิน']}<br>${r['หน่วยงาน']}</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
    document.getElementById('selectAll')?.addEventListener('change', (e) => { document.querySelectorAll('.rowCheckbox').forEach(cb => { cb.checked = e.target.checked; if(e.target.checked) selectedRows.add(parseInt(cb.dataset.idx)); else selectedRows.clear(); }); });
    document.querySelectorAll('.rowCheckbox').forEach(cb => { cb.addEventListener('change', (e) => { const idx = parseInt(e.target.dataset.idx); if(e.target.checked) selectedRows.add(idx); else selectedRows.delete(idx); }); });
}

function attachApproveEvents() {
    document.getElementById('receiveDocsBtn')?.addEventListener('click', () => batchAction('receive'));
    document.getElementById('sendEditBtn')?.addEventListener('click', () => batchAction('edit'));
    document.getElementById('submitProposeBtn')?.addEventListener('click', () => batchAction('propose'));
    document.getElementById('payCheckBtn')?.addEventListener('click', () => batchAction('pay'));
}

function batchAction(action) {
    if (selectedRows.size === 0) { alert('กรุณาเลือกรายการอย่างน้อย 1 รายการ'); return; }
    const selectedIndices = Array.from(selectedRows);
    const selectedRecords = selectedIndices.map(i => approveRecords[i]);
    if (action === 'receive') {
        const date = prompt('วันที่รับเอกสาร (dd/mm/yyyy):', new Date().toLocaleDateString('en-GB'));
        if(date) google.script.run.withSuccessHandler(()=>{ alert('บันทึกสำเร็จ'); loadApproveData(); }).updateReceiveInfo(selectedIndices, date, currentUser.email);
    } else if (action === 'edit') {
        const date = prompt('วันที่แก้ไข:', new Date().toLocaleDateString('en-GB'));
        if(date) google.script.run.withSuccessHandler(()=>{ alert('บันทึกและพิมพ์'); window.open('printout.html?type=edit&data='+encodeURIComponent(JSON.stringify(selectedRecords))); loadApproveData(); }).updateFields(selectedIndices, {R:date}, currentUser.email);
    } else if (action === 'propose') {
        const date = prompt('วันที่เสนอ:', new Date().toLocaleDateString('en-GB'));
        if(date) google.script.run.withSuccessHandler(()=>{ alert('บันทึกและพิมพ์'); window.open('printout.html?type=propose&data='+encodeURIComponent(JSON.stringify(selectedRecords))); loadApproveData(); }).updateFields(selectedIndices, {U:date}, currentUser.email);
    } else if (action === 'pay') {
        const date = prompt('วันที่จ่ายเช็ค:', new Date().toLocaleDateString('en-GB'));
        if(date) google.script.run.withSuccessHandler(()=>{ alert('บันทึกและพิมพ์'); window.open('printout.html?type=pay&data='+encodeURIComponent(JSON.stringify(selectedRecords))); loadApproveData(); }).updateFields(selectedIndices, {W:date}, currentUser.email);
    }
}
function getStatus(row) { /* เหมือนเดิม */ }
function getStatusBadge(status) { /* เหมือนเดิม */ }
function formatNumber(num) { return new Intl.NumberFormat().format(num||0); }
function formatDate(d) { if(!d) return '-'; let date = new Date(d); return date.toLocaleDateString('th-TH'); }
