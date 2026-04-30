/* version 00105
 * แก้ไขปัญหาข้อมูลไม่แสดงผล (Data Binding) 
 * และจัดการรูปแบบวันที่เป็น พ.ศ. (ว/ด/ปปปป)
 */

// ฟังก์ชันหลักที่ index.js จะเรียกเมื่อสลับหน้ามาที่ 'list'
function initRegisterList() {
    console.log("Initializing Register List...");
    initListLogic();
}

// ฟังก์ชันรองรับกรณี index.js เวอร์ชันเก่าเรียกชื่อนี้
function initListLogic() {
    // พยายามดึงข้อมูลจาก window.allData (Global Scope)
    const data = window.allData || allData || [];
    
    if (data.length === 0) {
        console.warn("Data is empty, waiting for global data...");
        // ถ้ายังไม่มีข้อมูล ให้รอ 500ms แล้วลองใหม่หนึ่งครั้ง (กรณีโหลด API ช้า)
        setTimeout(() => {
            const retryData = window.allData || allData || [];
            drawTable(retryData);
        }, 500);
    } else {
        drawTable(data);
    }
}

/**
 * แปลงวันที่จากระบบ (ค.ศ. dd/mm/yyyy) เป็น พ.ศ.
 * @param {string} dateStr 
 */
function formatThaiDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('/')) return '-';
    
    try {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return dateStr;
        
        let day = parts[0];
        let month = parts[1];
        let year = parseInt(parts[2]);
        
        // ถ้าปีน้อยกว่า 2400 ให้ถือว่าเป็น ค.ศ. แล้วบวก 543
        if (year < 2400) year += 543;
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
}

function drawTable(data) {
    const body = document.getElementById('list-body');
    if (!body) return;

    if (!data || data.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">ไม่พบข้อมูลในระบบ</td></tr>`;
        return;
    }

    body.innerHTML = data.map(r => `
    <tr onclick="showDetail(${r.receiveNo})" style="cursor:pointer" class="align-middle">
      <td class="ps-3">
        <span class="badge w-100 py-2" style="background:${stColor(r.status)}">${r.status || 'รับเข้าระบบ'}</span>
      </td>
      <td>
        <div class="fw-bold text-dark">${r.vendor || '-'}</div>
        <div class="small text-muted"><i class="bi bi-calendar3"></i> รับเมื่อ: ${formatThaiDate(r.dateIn)}</div>
      </td>
      <td class="text-end text-purple fw-bold">
        ${Number(r.amount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}
      </td>
      <td>
        <div class="text-truncate" style="max-width:220px" title="${r.item}">
          ${r.item || '-'}
        </div>
        <small class="text-muted">เลขเบิก: ${r.withdrawNo || '-'}</small>
      </td>
      <td>
        <div class="small"><i class="bi bi-building"></i> ${r.dept || '-'}</div>
        <div class="small badge bg-light text-dark border mt-1 font-weight-normal">${r.moneyType || '-'}</div>
      </td>
    </tr>
  `).join('');
}

function showDetail(receiveNo) {
    const source = window.allData || allData || [];
    const r = source.find(d => d.receiveNo === receiveNo);
    if (!r) return;

    let modalEl = document.getElementById('detailModal');
    if (!modalEl) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="modal fade" id="detailModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius:20px;">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold text-purple"><i class="bi bi-info-circle-fill"></i> รายละเอียดฎีกา</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="detailModalBody"></div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal" style="border-radius:10px;">ปิด</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div);
        modalEl = document.getElementById('detailModal');
    }

    const body = document.getElementById('detailModalBody');
    body.innerHTML = `
        <div class="text-center mb-4">
            <span class="badge px-4 py-2 mb-2" style="background:${stColor(r.status)}; font-size:0.9rem; border-radius:30px;">${r.status}</span>
            <h3 class="fw-bold text-dark mt-2 mb-0">${Number(r.amount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})} <small class="fs-6">บาท</small></h3>
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
    const source = window.allData || allData || [];
    const filtered = source.filter(d => 
        (d.vendor || '').toLowerCase().includes(q) ||
        (d.receiveNo || '').toString().includes(q) ||
        (d.item || '').toLowerCase().includes(q) ||
        (d.dekaNo || '').toLowerCase().includes(q)
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
