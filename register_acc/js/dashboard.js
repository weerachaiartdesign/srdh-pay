/**
 * version 003
 * ไฟล์: dashboard.js
 * หน้าที่: จัดการลอจิกการวาดกราฟและสรุปตัวเลขสถิติในหน้า Dashboard
 */

function renderDashboard() {
  const container = document.getElementById('view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="container-fluid fade-in">
      <h4 class="mb-4 text-purple fw-bold d-flex align-items-center gap-2">
        <i class="bi bi-pie-chart-fill"></i> ภาพรวมข้อมูลทะเบียน
      </h4>
      <div class="row g-3 mb-4" id="stat-cards"></div>
      <div class="card p-3 text-center mb-4 border-0 shadow-sm bg-white" style="border-radius:15px;">
        <h6 id="avg-time" class="mb-0 text-muted fw-normal">ประมวลผลข้อมูล...</h6>
      </div>
      <div class="row">
        <div class="col-lg-7 mb-4">
          <div class="card p-3 h-100 border-0 shadow-sm" style="border-radius:15px;">
            <canvas id="chart1"></canvas>
          </div>
        </div>
        <div class="col-lg-5 mb-4">
          <div class="card p-3 h-100 border-0 shadow-sm" style="border-radius:15px;">
            <canvas id="chart2"></canvas>
          </div>
        </div>
      </div>
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
        <div class="card p-3 border-0 shadow-sm h-100 stat-card" style="border-left: 5px solid #BA55D3 !important; border-radius:12px;">
          <small class="text-muted text-uppercase fw-bold" style="font-size:0.7rem; letter-spacing:0.5px;">${t}</small>
          <div class="h4 my-1 fw-bold text-dark">${paid.length} / ${sub.length} <small class="fw-normal text-muted" style="font-size:0.8rem">ใบ</small></div>
          <div class="text-purple fw-bold mt-1" style="font-size:0.9rem">${amt.toLocaleString(undefined, {minimumFractionDigits:2})} ฿</div>
        </div>
      </div>
    `;
  });
  document.getElementById('stat-cards').innerHTML = html;

  // คำนวณระยะเวลาเฉลี่ย
  let totalDays = 0, count = 0;
  allData.forEach(d => {
    if(d.tsIn && d.tsApprove) {
      let diff = (d.tsApprove - d.tsIn) / 86400000;
      if(diff >= 0) { totalDays += diff; count++; }
    }
  });
  const avg = count > 0 ? (totalDays / count).toFixed(1) : 0;
  document.getElementById('avg-time').innerHTML = `🕒 ระยะเวลาเฉลี่ย (รับเรื่อง - อนุมัติ): <span class="text-purple fw-bold fs-5 ms-2">${avg} วัน</span>`;

  // กราฟที่ 1: รายหน่วยงาน
  const depts = ["ยา", "พัสดุ", "โภชนา", "ปกส", "บริหาร", "เลือด", "Lab", "X-Ray"];
  const ctx1 = document.getElementById('chart1');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: depts,
        datasets: [
          { label: 'จำนวน (ฉบับ)', data: depts.map(n => allData.filter(d => d.dept && d.dept.includes(n)).length), backgroundColor: '#BA55D3', borderRadius: 5 },
          { label: 'เงิน (แสนบาท)', data: depts.map(n => allData.filter(d => d.dept && d.dept.includes(n)).reduce((a,b)=>a+(Number(b.amount)||0),0)/100000), backgroundColor: '#E0B0FF', borderRadius: 5 }
        ]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'สถิติแยกตามหน่วยงาน' } } }
    });
  }

  // กราฟที่ 2: สัดส่วนสถานะ
  const statuses = ["รับเข้าระบบ", "ตรวจสอบ", "แก้ไข", "หน.ตรวจสอบ", "ส่งเสนอ", "อนุมัติจ่าย", "จ่ายแล้ว", "ยกเลิก"];
  const ctx2 = document.getElementById('chart2');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: statuses,
        datasets: [{
          data: statuses.map(s => allData.filter(d => d.status === s).length),
          backgroundColor: ['#6c757d', '#007bff', '#dc3545', '#17a2b8', '#ffc107', '#fd7e14', '#28a745', '#343a40']
        }]
      },
      options: { cutout: '65%', plugins: { title: { display: true, text: 'สถานะงานปัจจุบัน' } } }
    });
  }
}
