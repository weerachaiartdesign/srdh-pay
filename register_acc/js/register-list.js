/* version 002
 * หน้ารายการทะเบียน - แสดงตารางและค้นหา
 */

function renderRegisterList(data) {
  const container = document.getElementById('view-container');
  
  container.innerHTML = `
    <div class="fade-in">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 class="text-purple fw-bold">
          <i class="bi bi-list-ul"></i> รายการทะเบียนฎีกา
        </h4>
        <div class="d-flex gap-2">
          <div class="search-wrapper">
            <i class="bi bi-search"></i>
            <input type="text" id="searchInput" class="form-control" placeholder="ค้นหา เจ้าหนี้, เลขรับ, รายการ, ฎีกา, หน่วยงาน..." onkeyup="filterRegisterList()">
          </div>
          <button class="btn btn-outline-secondary btn-sm" onclick="refreshData()">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      
      <div class="card shadow-sm border-0 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-purple text-white">
              <tr>
                <th class="ps-3" style="min-width:110px">สถานะ</th>
                <th style="min-width:180px">เจ้าหนี้ / บริษัท</th>
                <th class="text-end" style="min-width:120px">จำนวนเงิน</th>
                <th style="min-width:200px">รายการ</th>
                <th style="min-width:180px">หน่วยงาน / ประเภทเงิน</th>
              </tr>
            </thead>
            <tbody id="register-list-body"></tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-3 text-muted small" id="list-info"></div>
    </div>
  `;
  
  drawRegisterTable(data);
}

function drawRegisterTable(data) {
  const tbody = document.getElementById('register-list-body');
  const info = document.getElementById('list-info');
  
  if (!tbody) return;
  
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">🔍 ไม่พบข้อมูลที่ต้องการค้นหา</td></tr>`;
    if (info) info.innerHTML = '';
    return;
  }
  
  tbody.innerHTML = data.map(row => `
    <tr>
      <td class="ps-3"><span class="badge" style="background: ${getStatusColor(row.status)}; color: white;">${row.status}</span></td>
      <td>
        <div class="fw-bold text-dark">${escapeHtml(row.vendor) || '-'}</div>
        <small class="text-muted">เลขรับ: ${row.receiveNo}</small>
      </td>
      <td class="text-end text-purple fw-bold">${Number(row.amount || 0).toLocaleString()} ฿</td>
      <td>
        <div class="text-truncate" style="max-width: 280px;" title="${escapeHtml(row.item) || ''}">
          ${escapeHtml(row.item) || '-'}
        </div>
        <small class="text-muted">เลขที่ฎีกา: ${row.dikaNo || '-'}</small>
      </td>
      <td>
        <div><i class="bi bi-building"></i> ${escapeHtml(row.dept) || '-'}</div>
        <span class="badge bg-light text-dark border mt-1 fw-normal">${escapeHtml(row.moneyType) || '-'}</span>
      </td>
    </tr>
  `).join('');
  
  if (info) {
    info.innerHTML = `พบข้อมูลทั้งหมด ${data.length} รายการ`;
  }
}

function filterRegisterList() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allData.filter(row => {
    return (row.vendor || '').toLowerCase().includes(keyword) ||
           (row.receiveNo || '').toString().includes(keyword) ||
           (row.item || '').toLowerCase().includes(keyword) ||
           (row.dikaNo || '').toLowerCase().includes(keyword) ||
           (row.dept || '').toLowerCase().includes(keyword) ||
           (row.moneyType || '').toLowerCase().includes(keyword) ||
           (row.withdrawNo || '').toLowerCase().includes(keyword);
  });
  drawRegisterTable(filtered);
}

function getStatusColor(status) {
  const colors = {
    'จ่ายแล้ว': '#28a745', 'ยกเลิก': '#343a40', 'อนุมัติจ่าย': '#fd7e14',
    'ส่งเสนอ': '#ffc107', 'หน.ตรวจสอบ': '#17a2b8', 'แก้ไข': '#dc3545',
    'ตรวจสอบ': '#007bff', 'รับเข้าระบบ': '#6c757d'
  };
  return colors[status] || '#6c757d';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ทำให้ filterRegisterList อยู่ใน global scope
window.filterRegisterList = filterRegisterList;
