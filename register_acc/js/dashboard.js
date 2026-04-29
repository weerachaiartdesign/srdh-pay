// version : 00100
function initDashboard() {
  const summary = calculateSummary(allData);
  updateCards(summary);
  renderCharts(allData);
  
  // คำนวณระยะเวลาเฉลี่ย 
  const avg = calculateAverageDays(allData);
  document.getElementById('avg-days').innerText = `ระยะเวลาเฉลี่ย (รับเรื่อง - อนุมัติ) : ${avg} วัน`;
}

function calculateAverageDays(data) {
  const completed = data.filter(d => d.วันที่รับ && d.วันที่อนุมัติ);
  if (!completed.length) return 0;
  const totalDays = completed.reduce((acc, d) => {
    const diff = new Date(d.วันที่อนุมัติ) - new Date(d.วันที่รับ);
    return acc + (diff / (1000 * 60 * 60 * 24));
  }, 0);
  return (totalDays / completed.length).toFixed(1);
}
