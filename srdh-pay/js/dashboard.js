/* version : 00101 */
// ควบคุมการแสดงผลและการคำนวณข้อมูลหน้า Dashboard

function initDashboard() {
  renderSummaryCards();
  renderAvgTimeAndProgress();
  renderCharts();
}

function classifyMoneyType(typeStr) {
  const t = (typeStr || "").trim();
  const validTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน"];
  return validTypes.includes(t) ? t : "เงินอื่น";
}

function getMoneyTypeColorConfig(type) {
  const map = {
    "เงินงบประมาณ": { bg: "bg-[#FFCCFF]", border: "border-[#ff99ff]", text: "text-[#cc00cc]" },
    "เงินบำรุง": { bg: "bg-[#FFFF99]", border: "border-[#e6e600]", text: "text-[#999900]" },
    "เงินประกันสุขภาพ": { bg: "bg-[#F8CBAD]", border: "border-[#f4a460]", text: "text-[#d2691e]" },
    "เงินอุดหนุน": { bg: "bg-[#FF9999]", border: "border-[#ff4d4d]", text: "text-[#cc0000]" },
    "เงินอื่น": { bg: "bg-[#e0e0e0]", border: "border-[#808080]", text: "text-[#4d4d4d]" } // สีเทา
  };
  return map[type];
}

function renderSummaryCards() {
  const container = document.getElementById('dash-summary-cards');
  const types = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน", "เงินอื่น"];
  
  let html = '';
  types.forEach(t => {
    // กรองข้อมูลตามประเภทเงิน
    const typeData = allData.filter(d => classifyMoneyType(d.moneyType) === t);
    const totalCount = typeData.length;
    const totalAmount = typeData.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    
    // กรองเฉพาะที่สถานะรอจ่ายขึ้นไป (ตาม requirement: มีบันทึกวันที่รอจ่าย)
    // หรือดูที่ status ก็ได้ หาก "รอจ่าย", "จ่ายแล้ว" ถือว่าเบิกแล้ว
    const paidData = typeData.filter(d => d.status === "รอจ่าย" || d.status === "จ่ายแล้ว");
    const paidCount = paidData.length;
    const paidAmount = paidData.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    
    const colors = getMoneyTypeColorConfig(t);

    html += `
      <div class="rounded-xl p-4 shadow-sm border-l-4 ${colors.border} ${colors.bg} bg-opacity-30 relative overflow-hidden">
        <div class="flex justify-between items-start mb-3">
          <span class="text-sm font-bold ${colors.text}">${t}</span>
          <div class="text-right">
            <span class="text-xl font-black text-gray-800">${paidCount}</span>
            <span class="text-sm text-gray-400">/${totalCount} <span class="text-xs">ฎีกา</span></span>
          </div>
        </div>
        <div>
          <div class="text-[11px] text-gray-500 mb-0.5">เป็นจำนวนเงิน</div>
          <div class="flex justify-between items-baseline">
            <span class="text-lg font-black text-gray-800">${formatMoney(paidAmount)}</span>
            <span class="text-xs text-gray-400">/${formatMoney(totalAmount)} บ.</span>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function renderAvgTimeAndProgress() {
  // คำนวณ Avg Time (Date In -> Approved)
  let totalDays = 0, count = 0;
  allData.forEach(d => {
    if(d.tsIn && d.tsApprove) {
      let diffDays = (d.tsApprove - d.tsIn) / (1000 * 60 * 60 * 24);
      if(diffDays >= 0) {
        totalDays += diffDays;
        count++;
      }
    }
  });
  
  const avg = count > 0 ? (totalDays / count).toFixed(1) : 0;
  document.getElementById('dash-avg-time').innerHTML = `${avg} <span class="text-lg font-normal">วัน</span>`;

  // คำนวณ Progress Bar (สถานะ = จ่ายแล้ว)
  const total = allData.length;
  const success = allData.filter(d => d.status === "จ่ายแล้ว").length;
  const percent = total > 0 ? Math.round((success / total) * 100) : 0;
  
  document.getElementById('dash-progress-text').innerText = `${percent}%`;
  document.getElementById('dash-progress-bar').style.width = `${percent}%`;
}

function renderCharts() {
  const deptList = ["กลุ่มงานเภสัชกรรม", "ฝ่ายพัสดุ", "ฝ่ายโภชนาการ", "กลุ่มงานประกันสุขภาพ", "ฝ่ายบริหารงานทั่วไป", "กลุ่มงานธนาคารเลือด", "กลุ่มงานเทคนิคการแพทย์", "กลุ่มงานรังสีวิทยา", "อื่นๆ"];
  const moneyTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอุดหนุน", "เงินอื่น"];

  // กราฟ 1: สถิติการเบิกจ่าย (จำนวนเงิน เป็น Bar, จำนวนฎีกา เป็น Line/Bullet ซ้อน)
  const amtData = [];
  const countData = [];

  deptList.forEach(dept => {
    // หาข้อมูลหน่วยงาน หากไม่ใช่ 8 หน่วยงานแรก ให้จัดเป็น "อื่นๆ"
    const isOther = dept === "อื่นๆ";
    const dFilter = allData.filter(d => isOther ? !deptList.includes(d.dept) : d.dept === dept);
    
    amtData.push(dFilter.reduce((sum, d) => sum + Number(d.amount || 0), 0));
    countData.push(dFilter.length);
  });

  new Chart(document.getElementById('chart-overall'), {
    type: 'bar',
    data: {
      labels: deptList,
      datasets: [
        {
          label: 'จำนวนฎีกา (ใบ)',
          data: countData,
          type: 'line',
          borderColor: '#ff6b6b',
          backgroundColor: '#ff6b6b',
          borderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: 'จำนวนเงิน (บาท)',
          data: amtData,
          backgroundColor: 'rgba(155, 89, 182, 0.6)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: {display: true, text: 'จำนวนเงิน (บาท)'} },
        y1: { type: 'linear', display: true, position: 'right', title: {display: true, text: 'จำนวนฎีกา'}, grid: {drawOnChartArea: false} }
      }
    }
  });

  // กราฟ 2: Stacked Bar แยกตามประเภทเงิน
  const datasetsStacked = moneyTypes.map(mType => {
    const bgColors = {
      "เงินงบประมาณ": "#FFCCFF", "เงินบำรุง": "#FFFF99", "เงินประกันสุขภาพ": "#F8CBAD", "เงินอุดหนุน": "#FF9999", "เงินอื่น": "#808080"
    };
    return {
      label: mType,
      backgroundColor: bgColors[mType],
      data: deptList.map(dept => {
        const isOther = dept === "อื่นๆ";
        const dFilter = allData.filter(d => 
          (isOther ? !deptList.includes(d.dept) : d.dept === dept) && 
          classifyMoneyType(d.moneyType) === mType
        );
        return dFilter.length; // จำนวนฎีกา
      })
    };
  });

  new Chart(document.getElementById('chart-types'), {
    type: 'bar',
    data: {
      labels: deptList,
      datasets: datasetsStacked
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: false }, // แยก 5 แท่ง ไม่ซ้อนกันตาม Requirement
        y: { beginAtZero: true, title: {display: true, text: 'จำนวนฎีกา'} }
      }
    }
  });
}
