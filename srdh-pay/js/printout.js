/* version 00106 */
/**
 * Handles printout generation.
 * Depending on the context, builds an A4 table with appropriate headers.
 * Uses window.print() to trigger print (or could integrate jsPDF later).
 */

function initPrintout(type, data = null, extra = null) {
  let html = '';
  if (type === 'registration') {
    html = buildRegistrationSlip(data, extra);
  } else if (type === 'return') {
    html = buildReturnSlip(data);
  } else if (type === 'propose') {
    html = buildProposeSlip(data);
  } else if (type === 'pay') {
    html = buildPaySlip(data);
  }
  document.getElementById('printout-content').innerHTML = html;
}

function printPage() {
  window.print();
}

function buildRegistrationSlip(rows, registerNo) {
  const title = `ใบนำส่งเอกสารเบิกจ่าย<br>เลขลงทะเบียน ${registerNo || '___________'}`;
  let tableRows = rows ? rows.map(r => `<tr><td>${r.date||''}</td><td>${r.moneyType}</td><td>${r.vendor}</td><td>${r.item}</td><td class="text-right">${r.amount.toLocaleString()}</td></tr>`).join('') : '';
  return `<div class="print-slip"><h2 class="text-center">${title}</h2>
    <table class="print-table"><thead><tr><th>วันที่ลงทะเบียน</th><th>ประเภทเงิน</th><th>เจ้าหนี้</th><th>รายการ</th><th>จำนวนเงิน</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
}

function buildReturnSlip(selectedData) {
  // Build return slip from selected items (sorted by receiveNo)
  let sorted = [...selectedData].sort((a,b) => a.receiveNo - b.receiveNo);
  return `<div class="print-slip">
    <h2 class="text-center">ใบนำส่งแก้ไขเอกสาร<br>วันที่แก้ไข ${new Date().toLocaleDateString('th-TH', { day:'2-digit', month:'long', year:'numeric' })}</h2>
    <table class="print-table"><thead><tr><th>เลขที่รับ</th><th>ประเภทเงิน</th><th>เจ้าหนี้</th><th>รายการ</th><th>จำนวนเงิน</th><th>ผู้ส่ง</th></tr></thead>
    <tbody>${sorted.map(r => `<tr><td>${r.receiveNo}</td><td>${r.moneyType}</td><td>${r.vendor}</td><td>${r.item}</td><td class="text-right">${r.amount.toLocaleString()}</td><td>${r.sender}</td></tr>`).join('')}</tbody></table></div>`;
}

function buildProposeSlip(selectedData) {
  let sorted = [...selectedData].sort((a,b) => parseInt(a.dekaNo) - parseInt(b.dekaNo));
  return `<div class="print-slip">
    <h2 class="text-center">รายละเอียดการเสนอฎีกา ฝ่ายงบประมาณการเงินและบัญชี<br>วันที่เสนอ ${new Date().toLocaleDateString('th-TH', { day:'2-digit', month:'long', year:'numeric' })}</h2>
    <table class="print-table"><thead><tr><th>ลำดับ</th><th>วันที่รับ</th><th>ประเภทเงิน</th><th>เลขที่ฎีกา</th><th>เจ้าหนี้</th><th>จำนวนเงิน</th><th>หน่วยงาน</th></tr></thead>
    <tbody>${sorted.map((r, idx) => `<tr><td>${idx+1}</td><td>${r.dateIn}</td><td>${r.moneyType}</td><td>${r.dekaNo}</td><td>${r.vendor}</td><td class="text-right">${r.amount.toLocaleString()}</td><td>${r.dept}</td></tr>`).join('')}</tbody></table></div>`;
}

function buildPaySlip(selectedData) {
  return buildProposeSlip(selectedData).replace('การเสนอฎีกา', 'การจ่ายเช็ค').replace('วันที่เสนอ', 'วันที่จ่าย');
}
