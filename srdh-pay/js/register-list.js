/* version 00103
 * แก้ไขปัญหา initRegisterList is not defined
 * และจัดรูปแบบวันที่เป็น พ.ศ. พร้อม Modal รายละเอียด
 */

// เพิ่มฟังก์ชันนี้เพื่อให้สอดคล้องกับการเรียกใช้ใน index.js
function initRegisterList() {
  initListLogic();
}

function initListLogic() {
  drawTable(allData);
}

// ฟังก์ชันแปลงวันที่จาก dd/mm/yyyy (ค.ศ.) เป็น dd/mm/yyyy (พ.ศ.)
function formatThaiDate(dateStr) {
  if (!dateStr || !dateStr.includes('/')) return '-';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  
  const day = parts[0];
  const month = parts[1];
  let year = parseInt(parts[2]);
  
  // ถ้าปีที่ส่งมาน้อยกว่า 2400 สันนิษฐานว่าเป็น ค.ศ. ให้บวก 543
  if (year < 2400) {
    year += 543;
  }
  
  return `${day}/${month}/${year}`;
}

function drawTable(data) {
  const body = document.getElementById('list-body');
  if(!body) return;
  
  if(data.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">ไม่พบข้อมูลที่ต้องการค้นหา</td></tr>`;
    return;
  }
  
  body.innerHTML = data.map(r => `
    <tr onclick="showDetail(${r.receiveNo})" style="cursor:pointer">
      <td class="ps-3">
        <span class="badge w-100 py-2" style="background:${stColor(r.status)}">${r.status}</span>
      </td>
      <td>
        <div class="fw-bold text-dark">${r.vendor || '-'}</div>
        <div class="small text-muted">วันที่รับ: ${formatThaiDate(r.dateIn)}</div>
      </td>
      <td class="text-end text-purple fw-bold">
        ${Number(r.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
      </td>
      <td>
        <div class="text-truncate" style="max-width:250px" title="${r.item}">
          ${r.item || '-'}
        </div>
        <small class="text-muted">เลขเบิก: ${r.withdrawNo || '-'}</small>
      </td>
      <td>
        <div><i class="bi bi-building"></i> ${r.dept || '-'}</div>
        <div class="small badge bg-light text-dark border mt-1 font-weight-normal">${r.moneyType || '-'}</div>
      </td>
    </tr>
  `).join('');
}

function showDetail(receiveNo) {
  const r = allData.find(d => d.receiveNo === receiveNo);
  if (!r) return;

  let modalEl = document.getElementById('detailModal');
  if (!modalEl) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="detailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius:20px;">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title fw-bold text-purple">รายละเอียดฎีกาเบิกจ่าย</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="detailModalBody"></div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal" style="border-radius:10px;">ปิด</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modalEl = document.getElementById('detailModal');
  }

  const body = document.getElementById('detailModalBody');
  body.innerHTML = `
    <div class="text-center mb-4">
       <span class="badge px-4 py-2 mb-2" style="background:${stColor(r.status)}; font-size:1rem; border-radius:30px;">${r.status}</span>
       <h4 class="fw-bold text-dark mt-2 mb-0">${Number(r.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} บาท</h4>
    </div>
    
    <div class="bg-light p-3 rounded-4 mb-3">
      <div class="row g-2">
        <div class="col-5 text-muted small">วันที่รับเข้าระบบ</div>
        <div class="col-7 fw-bold">${formatThaiDate(r.dateIn)}</div>
        
        <div class="col-5 text-muted small">เลขทะเบียนรับ</div>
        <div class="col-7 fw-bold text-purple">${r.receiveNo}</div>
        
        <div class="col-5 text-muted small">เลขที่ฎีกา</div>
        <div class="col-7 fw-bold">${r.dekaNo || '-'}</div>
      </div>
    </div>

    <div class="px-2">
      <label class="text-muted small d-block">ชื่อเจ้าหนี้/บริษัท</label>
      <p class="fw-bold text-dark mb-3">${r.vendor || '-'}</p>
      
      <label class="text-muted small d-block">รายการเบิกจ่าย</label>
      <p class="text-dark mb-3">${r.item || '-'}</p>
      
      <div class="row">
        <div class="col-6">
          <label class="text-muted small d-block">หน่วยงาน</label>
          <p class="small fw-bold">${r.dept || '-'}</p>
        </div>
        <div class="col-6">
          <label class="text-muted small d-block">ประเภทเงิน</label>
          <p class="small fw-bold">${r.moneyType || '-'}</p>
        </div>
      </div>
    </div>
  `;

  const myModal = new bootstrap.Modal(modalEl);
  myModal.show();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allData.filter(d => 
    (d.vendor || '').toLowerCase().includes(q) ||
    (d.receiveNo || '').toString().includes(q) ||
    (d.item || '').toLowerCase().includes(q) ||
    (d.dekaNo || '').toLowerCase().includes(q) ||
    (d.dept || '').toLowerCase().includes(q)
  );
  drawTable(filtered);
}

function stColor(s) {
  const colors = {
    "รับเข้าระบบ": "#6c757d",
    "ตรวจสอบ": "#0dcaf0",
    "ส่งแก้ไข": "#fd7e14",
    "ผ่านการตรวจ": "#0d6efd",
    "ส่งเสนอ": "#6610f2",
    "อนุมัติจ่าย": "#20c997",
    "รอจ่าย": "#ffc107",
    "จ่ายแล้ว": "#198754",
    "ยกเลิก": "#dc3545"
  };
  return colors[s] || "#6c757d";
}
