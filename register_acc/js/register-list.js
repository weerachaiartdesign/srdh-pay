/** * ระบบทะเบียนฎีกา - Table & Search Logic
 * version 001-2
 */
function renderList() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h4 class="text-purple fw-bold"><i class="bi bi-table"></i> รายการทะเบียน</h4>
      <input type="text" id="q" class="form-control w-50 shadow-sm" placeholder="🔍 ค้นหา (เลขรับ, ฎีกา, บริษัท...)" onkeyup="doSearch()">
    </div>
    <div class="card shadow-sm overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead style="background: #BA55D3; color: white">
            <tr><th>สถานะ</th><th>เจ้าหนี้</th><th class="text-end">จำนวนเงิน</th><th>รายการ</th><th>ประเภทเงิน</th><th>หน่วยงาน</th></tr>
          </thead>
          <tbody id="list-body"></tbody>
        </table>
      </div>
    </div>
  `;
  drawTable(allData);
}

function drawTable(data) {
  const body = document.getElementById('list-body');
  body.innerHTML = data.map(r => `
    <tr>
      <td><span class="badge" style="background:${stColor(r.status)}">${r.status}</span></td>
      <td><b>${r.vendor || '-'}</b><br><small class="text-muted">เลขรับ: ${r.receiveNo}</small></td>
      <td class="text-end text-purple fw-bold">${Number(r.amount || 0).toLocaleString()}</td>
      <td><div class="text-truncate" style="max-width:200px">${r.item || '-'}</div></td>
      <td><small>${r.moneyType || '-'}</small></td>
      <td>${r.dept || '-'}</td>
    </tr>
  `).join('');
}

function stColor(s) {
  const map = { 'จ่ายแล้ว':'#28a745', 'ยกเลิก':'#dc3545', 'อนุมัติจ่าย':'#17a2b8', 'ส่งเสนอ':'#ffc107', 'ตรวจสอบ':'#BA55D3' };
  return map[s] || '#6c757d';
}

function doSearch() {
  const val = document.getElementById('q').value.toLowerCase();
  const filtered = allData.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(val)));
  drawTable(filtered);
}
