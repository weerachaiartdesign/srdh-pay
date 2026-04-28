/**
 * version 003
 * หน้าที่: ลอจิกการแสดงผลตาราง และการกรองข้อมูล (Search)
 */

function initListLogic() {
  drawTable(allData);
}

function drawTable(data) {
  const body = document.getElementById('list-body');
  if(!body) return;
  
  if(data.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">ไม่พบข้อมูลที่ต้องการค้นหา</td></tr>`;
    return;
  }
  
  body.innerHTML = data.map(r => `
    <tr>
      <td class="ps-3">
        <span class="badge w-100 py-2" style="background:${stColor(r.status)}">${r.status}</span>
      </td>
      <td>
        <div class="fw-bold text-dark">${r.vendor || '-'}</div>
        <small class="text-muted">เลขรับ: ${r.receiveNo}</small>
      </td>
      <td class="text-end text-purple fw-bold">
        ${Number(r.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
      </td>
      <td>
        <div class="text-truncate" style="max-width:250px" title="${r.item}">
          ${r.item || '-'}
        </div>
        <small class="text-muted">เลขเบิก/ฎีกา: ${r.withdrawNo || '-'}/${r.dikaNo || '-'}</small>
      </td>
      <td>
        <div><i class="bi bi-building"></i> ${r.dept || '-'}</div>
        <div class="small badge bg-light text-dark border mt-1 font-weight-normal">${r.moneyType || '-'}</div>
      </td>
    </tr>
  `).join('');
}

function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allData.filter(d => 
    (d.vendor || '').toLowerCase().includes(q) ||
    (d.receiveNo || '').toString().includes(q) ||
    (d.item || '').toLowerCase().includes(q) ||
    (d.dikaNo || '').toLowerCase().includes(q) ||
    (d.dept || '').toLowerCase().includes(q)
  );
  drawTable(filtered);
}

// ฟังก์ชันกำหนดสี Badge ตาม 8 สถานะใหม่
function stColor(s) {
  const map = { 
    'จ่ายแล้ว': '#28a745', 
    'ยกเลิก': '#343a40', 
    'อนุมัติจ่าย': '#fd7e14', 
    'ส่งเสนอ': '#ffc107', 
    'หน.ตรวจสอบ': '#17a2b8',
    'แก้ไข': '#dc3545',
    'ตรวจสอบ': '#007bff',
    'รับเข้าระบบ': '#6c757d'
  };
  return map[s] || '#dee2e6';
}
