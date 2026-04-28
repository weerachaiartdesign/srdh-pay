/* version 002
 * หน้า Dashboard - แสดงภาพรวมและกราฟ
 */

let dashboardCharts = {};

function renderDashboard(data) {
  const container = document.getElementById('view-container');
  
  container.innerHTML = `
    <div class="fade-in">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 class="text-purple fw-bold">
          <i class="bi bi-pie-chart-fill"></i> ภาพรวมข้อมูลทะเบียน
        </h4>
        <button class="btn btn-outline-purple btn-sm" onclick="refreshData()">
          <i class="bi bi-arrow-clockwise"></i> refresh
        </button>
      </div>
      
      <div class="row g-3 mb-4" id="stat-cards"></div>
      
      <div class="card p-3 text-center mb-4 border-0 shadow-sm">
        <h6 id="avg-time" class="mb-0 text-muted fw-normal">กำลังคำนวณ...</h6>
      </div>
      
      <div class="row">
        <div class="col-lg-7 mb-4">
          <div class="card p-3 h-100 border-0 shadow-sm">
            <canvas id="deptChart"></canvas>
          </div>
        </div>
        <div class="col-lg-5 mb-4">
          <div class="card p-3 h-100 border-0 shadow-sm">
            <canvas id="statusChart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12 mb-4">
          <div class="card p-3 border-0 shadow-sm">
            <canvas id="deptMoneyTypeChart" style="height: 400px;"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
  
  drawSummaryCards(data);
  drawAvgTime(data);
  drawDeptChart(data);
  drawStatusChart(data);
  drawDeptMoneyTypeChart(data);
}

function drawSummaryCards(data) {
  const moneyTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงิน 30 บาท", "เงินอุดหนุน", "เงินอื่น"];
  let html = '';
  
  moneyTypes.forEach(type => {
    const filtered = data.filter(d => d.moneyType === type);
    const paid = filtered.filter(d => d.status === "จ่ายแล้ว");
    const totalAmount = filtered.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const paidAmount = paid.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const percent = filtered.length > 0 ? ((paid.length / filtered.length) * 100).toFixed(0) : 0;
    
    html += `
      <div class="col-md-4 col-lg-2-4">
        <div class="card stat-card p-3 h-100">
          <small class="text-muted text-uppercase fw-bold">${type}</small>
          <div class="h3 my-1 fw-bold">${paid.length} <small class="fs-6 fw-normal">/ ${filtered.length}</small></div>
          <div class="progress my-2" style="height: 6px;">
            <div class="progress-bar bg-purple" style="width: ${percent}%"></div>
          </div>
          <div class="small text-purple fw-bold">${paidAmount.toLocaleString()} / ${totalAmount.toLocaleString()} ฿</div>
        </div>
      </div>
    `;
  });
  
  document.getElementById('stat-cards').innerHTML = html;
}

function drawAvgTime(data) {
  let totalDays = 0;
  let count = 0;
  
  data.forEach(d => {
    if (d.tsIn && d.tsApprove) {
      const diffDays = (d.tsApprove - d.tsIn) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) {
        totalDays += diffDays;
        count++;
      }
    }
  });
  
  const avg = count > 0 ? (totalDays / count).toFixed(1) : 0;
  document.getElementById('avg-time').innerHTML = `
    🕒 ระยะเวลาเฉลี่ย (รับเรื่อง - อนุมัติ): 
    <span class="text-purple fw-bold fs-4 ms-2">${avg}</span> 
    <span class="text-muted">วัน</span>
    <small class="text-muted ms-2">(จาก ${count} ฎีกา)</small>
  `;
}

function drawDeptChart(data) {
  const ctx = document.getElementById('deptChart');
  if (!ctx) return;
  
  if (dashboardCharts.deptChart) dashboardCharts.deptChart.destroy();
  
  const depts = ["ยา", "พัสดุ", "โภชนา", "ปกส", "บริหาร", "เลือด", "Lab", "X-Ray", "อื่นๆ"];
  const countData = depts.map(dept => 
    data.filter(d => (d.dept || "").toLowerCase().includes(dept.toLowerCase())).length
  );
  const amountData = depts.map(dept => 
    data.filter(d => (d.dept || "").toLowerCase().includes(dept.toLowerCase()))
        .reduce((s, d) => s + (Number(d.amount) || 0), 0) / 1000
  );
  
  dashboardCharts.deptChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: depts,
      datasets: [
        { label: 'จำนวนฎีกา (ฉบับ)', data: countData, backgroundColor: '#BA55D3', borderRadius: 8, yAxisID: 'y' },
        { label: 'ยอดเงิน (พันบาท)', data: amountData, backgroundColor: '#E0B0FF', borderRadius: 8, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'top' }, title: { display: true, text: 'สถิติแยกตามหน่วยงาน' } },
      scales: { y: { title: { display: true, text: 'จำนวน (ฉบับ)' } }, y1: { position: 'right', title: { text: 'ยอดเงิน (พันบาท)' } } }
    }
  });
}

function drawStatusChart(data) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  if (dashboardCharts.statusChart) dashboardCharts.statusChart.destroy();
  
  const statuses = ["รับเข้าระบบ", "ตรวจสอบ", "แก้ไข", "หน.ตรวจสอบ", "ส่งเสนอ", "อนุมัติจ่าย", "จ่ายแล้ว", "ยกเลิก"];
  const statusData = statuses.map(s => data.filter(d => d.status === s).length);
  const colors = ['#6c757d', '#007bff', '#dc3545', '#17a2b8', '#ffc107', '#fd7e14', '#28a745', '#343a40'];
  
  dashboardCharts.statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: statuses, datasets: [{ data: statusData, backgroundColor: colors, borderWidth: 0 }] },
    options: { cutout: '60%', responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'สถานะงานปัจจุบัน' } } }
  });
}

function drawDeptMoneyTypeChart(data) {
  const ctx = document.getElementById('deptMoneyTypeChart');
  if (!ctx) return;
  
  if (dashboardCharts.deptMoneyTypeChart) dashboardCharts.deptMoneyTypeChart.destroy();
  
  const depts = ["ยา", "พัสดุ", "โภชนา", "ปกส", "บริหาร", "เลือด", "Lab", "X-Ray"];
  const moneyTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงิน 30 บาท", "เงินอุดหนุน", "เงินอื่น"];
  const colors = ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff'];
  
  const datasets = moneyTypes.map((type, idx) => ({
    label: type,
    data: depts.map(dept => data.filter(d => (d.dept || "").toLowerCase().includes(dept.toLowerCase()) && d.moneyType === type).length),
    backgroundColor: colors[idx % colors.length],
    borderRadius: 4
  }));
  
  dashboardCharts.deptMoneyTypeChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: depts, datasets: datasets },
    options: { responsive: true, maintainAspectRatio: true, scales: { x: { stacked: false }, y: { title: { display: true, text: 'จำนวนฎีกา (ฉบับ)' } } }, plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} ฉบับ` } } } }
  });
}
