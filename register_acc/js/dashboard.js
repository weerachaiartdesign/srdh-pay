/**
 * version 001-3
 * หน้าที่: จัดการการแสดงผลกราฟและสถิติภาพรวม
 */

function renderDashboard() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <h4 class="mb-4 text-purple fw-bold"><i class="bi bi-bar-chart-line"></i> Dashboard สรุปผล</h4>
    <div class="row g-3 mb-4" id="stat-cards"></div>
    <div class="card p-4 text-center mb-4 border-0 shadow-sm" style="background:#fff">
      <h5 id="avg-time" class="mb-0 text-muted">กำลังคำนวณ...</h5>
    </div>
    <div class="row">
      <div class="col-lg-7 mb-4"><div class="card p-3 h-100"><canvas id="chart1"></canvas></div></div>
      <div class="col-lg-5 mb-4"><div class="card p-3 h-100"><canvas id="chart2"></canvas></div></div>
    </div>
  `;
  drawDashboardContent();
}

function drawDashboardContent() {
  const mTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงิน 30 บาท", "เงินอุดหนุน", "เงินอื่น"];
  let html = '';
  
  mTypes.forEach(t => {
    const sub = allData.filter(d => d.moneyType === t);
    const paid = sub.filter(d => d.status === "จ่ายแล้ว");
    const amt = sub.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    
    html += `
      <div class="col-md-4 col-sm-6">
        <div class="card p-3 border-0 shadow-sm h-100" style="border-left: 5px solid #BA55D3 !important">
          <small class="text-muted d-block mb-1">${t}</small>
          <div class="h4 mb-0 text-dark">${paid.length} / ${sub.length} <small class="text-muted" style="font-size:0.7rem">ฉบับ</small></div>
          <div class="text-purple fw-bold mt-1 small">${amt.toLocaleString()} ฿</div>
        </div>
      </div>
    `;
  });
  document.getElementById('stat-cards').innerHTML = html;

  // ระยะเวลาเฉลี่ย
  let totalDays = 0, count = 0;
  allData.forEach(d => {
    if(d.tsIn && d.tsApprove) {
      let diff = (d.tsApprove - d.tsIn) / 86400000;
      if(diff >= 0) { totalDays += diff; count++; }
    }
  });
  const avg = count > 0 ? (totalDays / count).toFixed(1) : 0;
  document.getElementById('avg-time').innerHTML = `🕒 ระยะเวลาเฉลี่ย (รับเรื่อง - อนุมัติ): <span class="text-purple fw-bold">${avg} วัน</span>`;

  // กราฟหน่วยงาน
  const depts = ["ยา", "พัสดุ", "โภชนา", "ปกส", "บริหาร", "เลือด", "Lab", "X-Ray"];
  new Chart(document.getElementById('chart1'), {
    type: 'bar',
    data: {
      labels: depts,
      datasets: [
        { label: 'จำนวน (ฉบับ)', data: depts.map(n => allData.filter(d => d.dept.includes(n)).length), backgroundColor: '#BA55D3' },
        { label: 'ยอดเงิน (แสน)', data: depts.map(n => allData.filter(d => d.dept.includes(n)).reduce((a,b)=>a+(Number(b.amount)||0),0)/100000), backgroundColor: '#E0B0FF' }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'สถิติรายหน่วยงาน' } } }
  });

  // กราฟสถานะ (ตามลอจิกใหม่)
  const statuses = ["รับเข้าระบบ", "ตรวจสอบ", "แก้ไข", "หน.ตรวจสอบ", "ส่งเสนอ", "อนุมัติจ่าย", "จ่ายแล้ว", "ยกเลิก"];
  new Chart(document.getElementById('chart2'), {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [{
        data: statuses.map(s => allData.filter(d => d.status === s).length),
        backgroundColor: ['#6c757d', '#007bff', '#dc3545', '#17a2b8', '#ffc107', '#fd7e14', '#28a745', '#343a40']
      }]
    },
    options: { plugins: { title: { display: true, text: 'สัดส่วนสถานะงาน' } } }
  });
}
