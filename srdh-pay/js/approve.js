/* version 00106 */
/**
 * Approve page for admin/checker – select rows and apply batch actions.
 * Actions: รับเอกสาร, ส่งแก้ไข, ส่งเสนอ, จ่ายเช็ค.
 * Each action records date and updates status; some trigger PDF print.
 */

let approveSelected = new Set();

function initApprove() {
  populateApproveFilters();
  applyApproveFilters();
  document.getElementById('approve-actions').innerHTML = renderApproveButtons();
}

function renderApproveButtons() {
  return `
    <button onclick="batchAction('receive')" class="bg-green-600 text-white px-4 py-2 rounded-lg">รับเอกสาร</button>
    <button onclick="batchAction('return')" class="bg-orange-500 text-white px-4 py-2 rounded-lg">ส่งแก้ไข</button>
    <button onclick="batchAction('propose')" class="bg-blue-600 text-white px-4 py-2 rounded-lg">ส่งเสนอ</button>
    <button onclick="batchAction('pay')" class="bg-purple-600 text-white px-4 py-2 rounded-lg">จ่ายเช็ค</button>`;
}

function populateApproveFilters() {
  // Similar to list filters but also add sender and checker
  const senders = [...new Set(allData.map(d => d.sender).filter(Boolean))];
  const checkers = [...new Set(allData.map(d => d.checker).filter(Boolean))];
  document.getElementById('approve-filter-sender').innerHTML = '<option value="">ทุกผู้ส่ง</option>' + senders.map(s => `<option>${s}</option>`).join('');
  document.getElementById('approve-filter-checker').innerHTML = '<option value="">ทุกผู้ตรวจ</option>' + checkers.map(c => `<option>${c}</option>`).join('');
}

function applyApproveFilters() {
  // Similar logic to list, but used for approve table
  // ...
  renderApproveTable();
}

function renderApproveTable() {
  const tbody = document.getElementById('approve-tbody');
  // Use filtered data from list-like filtering (in actual full implementation)
  // For brevity, assume we have approveFilteredData
  tbody.innerHTML = approveFilteredData.map(r => {
    const checked = approveSelected.has(r.receiveNo) ? 'checked' : '';
    return `<tr>
      <td><input type="checkbox" ${checked} onchange="toggleApproveSelect(${r.receiveNo})"></td>
      <td>${r.receiveNo}</td><td>${r.status}</td><td>${r.withdrawNo}/${r.dekaNo}</td>
      <td>${r.vendor}</td><td>${r.item}</td><td class="text-right">${r.amount.toLocaleString()}</td>
      <td>${r.moneyType}/${r.dept}</td>
    </tr>`;
  }).join('');
}

function toggleApproveSelect(receiveNo) {
  if (approveSelected.has(receiveNo)) approveSelected.delete(receiveNo);
  else approveSelected.add(receiveNo);
}

async function batchAction(action) {
  if (approveSelected.size === 0) {
    alert('กรุณาเลือกรายการอย่างน้อย 1 รายการ');
    return;
  }
  const dateStr = prompt('เลือกวันที่ (dd/mm/yyyy)', new Date().toLocaleDateString('en-GB'));
  if (!dateStr) return;
  const parts = dateStr.split('/');
  const dateObj = new Date(parts[2], parts[1]-1, parts[0]);
  const timestamp = dateObj.getTime();

  const updates = {};
  let columnIdx;
  switch (action) {
    case 'receive':
      columnIdx = 16; // DATE_IN (Q, 0-indexed 16)
      updates[columnIdx] = dateStr;
      // Update receive number automatically (next sequential)
      break;
    case 'return':
      columnIdx = 17; // EDIT_DATE (R)
      updates[columnIdx] = dateStr;
      break;
    case 'propose':
      columnIdx = 20; // PROPOSE_DATE (U)
      updates[columnIdx] = dateStr;
      break;
    case 'pay':
      columnIdx = 22; // PAY_DATE (W)
      updates[columnIdx] = dateStr;
      break;
  }

  try {
    showLoader(true);
    for (let receiveNo of approveSelected) {
      const row = allData.find(d => d.receiveNo === receiveNo);
      const rowIndex = allData.indexOf(row) + 1; // 1-based row index in sheet
      await callApi('updateRegisterRow', { rowIndex, updates });
    }
    alert('บันทึกสำเร็จ');
    // Trigger PDF print if needed
    if (action === 'return') printReturnSlip();
    else if (action === 'propose') printProposeSlip();
    else if (action === 'pay') printPaySlip();
    approveSelected.clear();
    await fetchAppData();
    initApprove();
  } catch(e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    showLoader(false);
  }
}
