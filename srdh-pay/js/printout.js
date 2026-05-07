/*<!-- printout.js (ควบคุมหน้าพิมพ์ PDF) - version : 00108 -->*/

function initPrintout() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || localStorage.getItem('printAction');
    const data = JSON.parse(localStorage.getItem('printRecords') || localStorage.getItem('printData') || '[]');
    const title = document.getElementById('printTitle');
    const dateSpan = document.getElementById('printDate');
    const contentDiv = document.getElementById('printContent');
    
    if (type === 'register') {
        title.innerText = 'ใบนำส่งเอกสารเบิกจ่าย';
        dateSpan.innerText = `เลขลงทะเบียน: ${localStorage.getItem('lastBatchId') || ''}`;
        let html = '<table border="1" cellpadding="5" style="width:100%; border-collapse: collapse;"><thead><tr><th>วันที่ลงทะเบียน</th><th>ประเภทเงิน</th><th>ชื่อเจ้าหนี้/บริษัท</th><th>รายการ</th><th>จำนวนเงิน</th></tr></thead><tbody>';
        data.forEach(rec => {
            html += `<tr><td>${rec.registerDate}</td><td>${rec.moneyType}</td><td>${rec.vendor}</td><td>${rec.description}</td><td class="text-right">${formatNumber(rec.amount)}</td></tr>`;
        });
        html += '</tbody></table>';
        contentDiv.innerHTML = html;
    } else if (type === 'edit') {
        title.innerText = 'ใบนำส่งแก้ไขเอกสาร';
        dateSpan.innerText = `วันที่แก้ไข: ${new Date().toLocaleDateString('th-TH')}`;
        // สร้างตารางตาม spec (เลขที่รับ, ประเภทเงิน, ชื่อเจ้าหนี้, รายการ, จำนวนเงิน, ผู้ส่งเอกสาร)
        let html = '<table border="1">...';
        contentDiv.innerHTML = html;
    } else if (type === 'propose' || type === 'pay') {
        title.innerText = type === 'propose' ? 'รายละเอียดการเสนอฎีกา' : 'รายละเอียดการจ่ายเช็ค';
        // ตารางตาม spec
    }
}
function formatNumber(num) { return new Intl.NumberFormat().format(num); }
window.onload = initPrintout;
function renderPrintout(type, records) { /* สร้างตารางตามประเภท */ window.print();
}
