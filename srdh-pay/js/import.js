/* version 00106 */
/**
 * Import page – allows admin/staff to add up to 15 rows, then register them.
 * Temporary data is stored in a local array until registration.
 * Provides a print preview of the registration slip.
 */

let importTempRows = [];
let currentRegisterNo = null;

function initImport() {
  document.getElementById('import-container').innerHTML = renderImportUI();
  importTempRows = [];
  currentRegisterNo = null;
  document.getElementById('btn-register').disabled = true;
}

function renderImportUI() {
  return `
    <div class="flex gap-2 mb-4">
      <button onclick="addImportRow()" class="bg-purple-600 text-white px-4 py-2 rounded-lg"><i class="ph ph-plus mr-2"></i>เพิ่มข้อมูล</button>
      <button id="btn-register" onclick="registerRows()" disabled class="bg-gray-400 text-white px-4 py-2 rounded-lg"><i class="ph ph-check-circle mr-2"></i>ลงทะเบียน</button>
      <button onclick="printRegistrationSlip()" class="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg"><i class="ph ph-printer mr-2"></i>พิมพ์ใบลงทะเบียน</button>
    </div>
    <div id="import-table-container" class="bg-white rounded-xl shadow-sm border overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-purple-600 text-white">
          <tr>
            <th class="px-4 py-3">วันที่ลงทะเบียน</th><th class="px-4 py-3">ประเภทเงิน</th><th class="px-4 py-3">เจ้าหนี้</th>
            <th class="px-4 py-3">รายการ</th><th class="px-4 py-3 text-right">จำนวนเงิน</th><th class="px-4 py-3">จัดการ</th>
          </tr>
        </thead>
        <tbody id="import-tbody" class="divide-y divide-gray-100"></tbody>
      </table>
    </div>
    <div id="import-error" class="text-red-500 text-sm mt-2"></div>`;
}

function addImportRow() {
  if (importTempRows.length >= 15) {
    document.getElementById('import-error').innerText = 'เพิ่มได้สูงสุด 15 รายการ';
    return;
  }
  // Show form in modal or inline; simplified: prompt for required fields
  const moneyType = prompt('ประเภทเงิน (จากรายการ): ' + settings.moneyTypes?.join(', '));
  const vendor = prompt('ชื่อเจ้าหนี้/บริษัท', settings.vendors[0] || '');
  const item = prompt('รายการ');
  const amount = parseFloat(prompt('จำนวนเงินขอเบิก') || '0');
  const budgetCode = prompt('เลขที่ใบกัน') || '';
  const budgetAmount = parseFloat(prompt('จำนวนเงินกัน') || '0');
  const invoice = prompt('Invoice') || '';
  const lesson = prompt('งวด/เดือนที่เบิก') || '';

  if (!moneyType || !vendor || !item || isNaN(amount) || amount <= 0) {
    alert('กรุณากรอกข้อมูลให้ครบ');
    return;
  }
  importTempRows.push({
    moneyType, vendor, item, amount, budgetCode, budgetAmount, invoice, lesson,
    dept: currentUser.dept,
    sender: currentUser.username,
    date: new Date().toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' })
  });
  renderImportTable();
  document.getElementById('btn-register').disabled = false;
  document.getElementById('import-error').innerText = '';
}

function renderImportTable() {
  const tbody = document.getElementById('import-tbody');
  tbody.innerHTML = importTempRows.map((r, idx) => `
    <tr>
      <td class="px-4 py-2">${r.date}</td>
      <td class="px-4 py-2">${r.moneyType}</td>
      <td class="px-4 py-2 font-bold">${r.vendor}</td>
      <td class="px-4 py-2">${r.item}</td>
      <td class="px-4 py-2 text-right text-purple-600">${r.amount.toLocaleString()}</td>
      <td class="px-4 py-2"><button onclick="removeImportRow(${idx})" class="text-red-500">ลบ</button></td>
    </tr>`).join('');
}

function removeImportRow(idx) {
  importTempRows.splice(idx, 1);
  renderImportTable();
  document.getElementById('btn-register').disabled = importTempRows.length === 0;
}

async function registerRows() {
  if (!confirm('ยืนยันการลงทะเบียน?')) return;
  try {
    showLoader(true);
    const result = await callApi('insertRegisterRows', { data: importTempRows });
    currentRegisterNo = result.registerNo;
    alert('ลงทะเบียนสำเร็จ เลขที่ลงทะเบียน: ' + currentRegisterNo);
    importTempRows = [];
    renderImportTable();
    document.getElementById('btn-register').disabled = true;
  } catch(e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    showLoader(false);
  }
}

function printRegistrationSlip() {
  // Open printout page with data for current registration or search
  navigate('printout');
  initPrintout('registration', importTempRows.length ? importTempRows : null, currentRegisterNo);
}
