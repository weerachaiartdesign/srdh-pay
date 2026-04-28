/** * ระบบทะเบียนฎีกา - Dashboard Logic
 * version 001-2
 */
function renderDashboard() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <h4 class="mb-4 text-purple fw-bold"><i class="bi bi-graph-up"></i> ภาพรวมฎีกา</h4>
    <div class="row g-3 mb-4" id="stat-cards"></div>
    <div class="card p-4 text-center mb-4 border-0 shadow-sm">
      <h5 id="avg-time" class="mb-0">กำลังคำนวณระยะเวลา...</h5>
    </div>
    <div class="row">
      <div class="col-md-6 mb-4"><div class="card p-3"><canvas id="chart1"></canvas></div></div>
      <div class="col-md-6 mb-4"><div class="card p-3"><canvas id="chart2"></canvas></div></div>
    </div>
  `;
  drawDashboardContent();
}

function drawDashboardContent() {
  const mTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงิน 30 บาท", "เงินอุดหนุน", "เงินอื่น"];
  let html = '';
  mTypes.forEach(t => {
    const sub = allData.filter(d => d.moneyType === t);
    const paid = sub.filter(d => d.checkDate);
    const amt = sub.reduce((a,b)=>a+(Number(b.amount)||0), 0);
    html += `
      <div class="col-md-4">
        <div class="card p-3 border-start border-4 shadow-sm" style="border-left-color: #BA55D3 !important">
          <small class="text-muted fw-bold">${t}</small>
          <div class="h5 mt-1 mb-0">${paid.length} / ${sub.length} ฉบับ</div>
          <small class="text-purple fw-bold">${amt.toLocaleString()} บาท</small>
        </div>
      </div>
    `;
  });
  document.getElementById('stat-cards').innerHTML = html;

  let total = 0, count = 0;
  allData.forEach(d => {
    if(d.tsIn && d.tsApprove) {
      let diff = (d.tsApprove - d.tsIn) / 86400000;
      if(diff >= 0) { total += diff; count++; }
    }
  });
  document.getElementById('avg-time').innerHTML = `🕒 ระยะเวลาเฉลี่ย (รับ-อนุมัติ): <span class="text-purple fw-bold">${count > 0 ? (total/count).toFixed(1) : 0} วัน</span>`;

  const depts = ["ยา", "พัสดุ", "โภชนา", "ปกส", "บริหาร", "เลือด", "Lab", "X-Ray", "อื่นๆ"];
  new Chart(document.getElementById('chart1'), {
    type: 'bar',
    data: {
      labels: depts,
      datasets: [
        { label: 'จำนวนฎีกา', data: depts.map(n => allData.filter(d => (d.dept||'').includes(n)).length), backgroundColor: '#BA55D3' },
        { label: 'ยอดเงิน (แสน)', data: depts.map(n => allData.filter(d => (d.dept||'').includes(n)).reduce((a,b)=>a+(Number(b.amount)||0),0)/100000), backgroundColor: '#E0B0FF' }
      ]
    }
  });
  new Chart(document.getElementById('chart2'), {
    type: 'bar',
    data: {
      labels: depts,
      datasets: mTypes.map((t, i) => ({
        label: t,
        data: depts.map(n => allData.filter(d => (d.dept||'').includes(n) && d.moneyType === t).length),
        backgroundColor: `rgba(186, 85, 211, ${1 - i*0.15})`
      }))
    }
  });
}
