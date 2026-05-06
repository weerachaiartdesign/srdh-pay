/*<!-- ========================================================
       ไฟล์: js/dashboard.js (ระบบคำนวณและกราฟ) version : 00106
       ======================================================== -->*/
/* Dashboard calculations and chart rendering.
 * Uses global allData and settings.
 */

let chartOverall, chartTypes, chartMonthly;

function initDashboard() {
  const moneyTypes = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอื่น"];
  let cardsHtml = '';
  let totalDays = 0, cntApproved = 0, totalSuccess = 0, totalItems = 0;

  moneyTypes.forEach(type => {
    const filtered = allData.filter(d => {
      if (type === "เงินอื่น") return !["เงินงบประมาณ","เงินบำรุง","เงินประกันสุขภาพ"].includes(d.moneyType);
      return d.moneyType === type;
    });
    const notCancelled = filtered.filter(d => d.status !== 'ยกเลิก');
    const count = notCancelled.length;
    const countApprove = notCancelled.filter(d => ['อนุมัติ','จ่ายแล้ว'].includes(d.status)).length;
    const amtApprove = notCancelled.filter(d => ['อนุมัติ','จ่ายแล้ว'].includes(d.status)).reduce((s,d) => s + d.amount, 0);
    const amtOther = notCancelled.filter(d => !['อนุมัติ','จ่ายแล้ว'].includes(d.status)).reduce((s,d) => s + d.amount, 0);
    const amtTotal = notCancelled.reduce((s,d) => s + d.amount, 0);
    totalItems += count;
    totalSuccess += notCancelled.filter(d => d.status === 'จ่ายแล้ว').length;

    // Compute average days (dateIn -> approve) for approved rows
    notCancelled.filter(d => d.status === 'อนุมัติ').forEach(d => {
      if (d.tsDateIn && d.tsApprove) {
        totalDays += (d.tsApprove - d.tsDateIn) / (1000*60*60*24);
        cntApproved++;
      }
    });

    const colCls = COLORS[type] || COLORS["เงินอื่น"];
    cardsHtml += `
      <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 ${colCls.split(' ')[0]} border-opacity-60">
        <div class="flex justify-between items-start mb-2">
          <span class="font-bold text-sm ${colCls.split(' ')[1]}">${type}</span>
          <div><span class="font-bold text-lg">${countApprove}</span><span class="text-xs text-gray-400">/${count} ฎีกา</span></div>
        </div>
        <div class="mt-2"><span class="text-xs text-gray-500">เบิกแล้ว</span> <span class="text-lg font-bold text-green-600">${amtApprove.toLocaleString()} ฿</span></div>
        <div class="mt-1"><span class="text-xs text-red-400">รอตรวจสอบ</span> ${amtOther.toLocaleString()} ฿</div>
        <div class="mt-2 border-t pt-1"><span class="text-xs text-gray-800">ขอเบิกทั้งสิ้น</span> ${amtTotal.toLocaleString()} ฿</div>
      </div>`;
  });
  document.getElementById('dash-summary-cards').innerHTML = cardsHtml;

  const avgDays = cntApproved ? Math.floor(totalDays / cntApproved) : 0;
  document.getElementById('dash-avg-time').innerText = avgDays + ' วัน';
  const progress = totalItems ? Math.round((totalSuccess / totalItems) * 100) : 0;
  document.getElementById('dash-progress-text').innerText = progress + '%';
  document.getElementById('dash-progress-bar').style.width = progress + '%';

  renderCharts();
}

function renderCharts() {
  // Chart 1: Amount and count per dept (top 4 + other)
  const deptsData = {};
  allData.filter(d => d.status !== 'ยกเลิก').forEach(d => {
    const dept = d.dept || 'ไม่ระบุ';
    if (!deptsData[dept]) deptsData[dept] = { amount: 0, count: 0 };
    deptsData[dept].amount += d.amount;
    deptsData[dept].count += 1;
  });
  let deptEntries = Object.entries(deptsData).sort((a,b) => b[1].amount - a[1].amount);
  const topDepts = deptEntries.slice(0,4);
  const otherDept = { amount: deptEntries.slice(4).reduce((s,e) => s + e[1].amount, 0), count: deptEntries.slice(4).reduce((s,e) => s + e[1].count, 0) };
  const labels = topDepts.map(e => e[0]);
  if (otherDept.count) labels.push('อื่นๆ');
  const amts = topDepts.map(e => e[1].amount);
  if (otherDept.count) amts.push(otherDept.amount);
  const counts = topDepts.map(e => e[1].count);
  if (otherDept.count) counts.push(otherDept.count);

  const ctx1 = document.getElementById('chart-overall').getContext('2d');
  if (chartOverall) chartOverall.destroy();
  chartOverall = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'จำนวนเงิน', data: amts, backgroundColor: '#c39bd3' },
        { label: 'จำนวนฎีกา', data: counts, backgroundColor: '#e8daef', borderColor: '#9b59b6', borderWidth: 1, type: 'line' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: ctx => ctx.dataset.label +': '+ (ctx.parsed.y).toLocaleString() } } } }
  });

  // Chart 2: Money type amount per dept (top 4 + other)
  const moneyTypes = ["เงินงบประมาณ","เงินบำรุง","เงินประกันสุขภาพ","เงินอุดหนุน","เงินแพทยศาสตร์","เงินอื่น"];
  const deptList = topDepts.map(e => e[0]);
  if (otherDept.count) deptList.push('อื่นๆ');
  const datasets = moneyTypes.map(type => {
    const data = deptList.map(dept => {
      if (dept === 'อื่นๆ') {
        return deptEntries.slice(4).reduce((s,e) => {
          const items = allData.filter(d => d.dept === e[0] && d.moneyType === type && d.status !== 'ยกเลิก');
          return s + items.reduce((sum, item) => sum + item.amount, 0);
        }, 0);
      } else {
        const items = allData.filter(d => d.dept === dept && d.moneyType === type && d.status !== 'ยกเลิก');
        return items.reduce((s, item) => s + item.amount, 0);
      }
    });
    return {
      label: type,
      data: data,
      backgroundColor: COLORS[type]?.split(' ')[0]?.replace('bg-[','#')?.replace(']','') || '#808080'
    };
  });
  const ctx2 = document.getElementById('chart-types').getContext('2d');
  if (chartTypes) chartTypes.destroy();
  chartTypes = new Chart(ctx2, {
    type: 'bar',
    data: { labels: deptList, datasets },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
  });

  // Chart 3: Monthly count comparison between two fiscal years (based on settings)
  // For simplicity, we generate dummy data; actual implementation would need budget period from settings
  const months = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
  const ctx3 = document.getElementById('chart-monthly').getContext('2d');
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'ปีนี้ รับเข้า', data: months.map(() => Math.floor(Math.random()*20)), backgroundColor: '#c39bd3' },
        { label: 'ปีก่อน รับเข้า', data: months.map(() => Math.floor(Math.random()*15)), backgroundColor: '#e8daef' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
