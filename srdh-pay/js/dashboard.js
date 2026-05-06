/*<!-- ==========================================
       ไฟล์: js/dashboard.js  version : 00105
       ========================================== -->*/
// ควบคุมการแสดงผลและการคำนวณข้อมูลหน้า Dashboard

function initDashboard() {
      const types = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอื่น"];
      let html = '';
      
      let totalDays = 0, countApproved = 0, totalSuccess = 0, totalItems = 0;

      types.forEach(type => {
        let items = allData.filter(d => type === "เงินอื่น" ? !["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ"].includes(d.moneyType) : d.moneyType === type);
        items = items.filter(d => d.status !== 'ยกเลิก');
        
        const count = items.length;
        const countApprove = items.filter(d => ['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).length;
        const amtApprove = items.filter(d => ['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).reduce((s, d) => s + d.amount, 0);
        const amtWait = items.filter(d => !['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).reduce((s, d) => s + d.amount, 0);
        const amtTotal = items.reduce((s, d) => s + d.amount, 0);

        totalItems += count;
        totalSuccess += items.filter(d => d.status === 'จ่ายแล้ว').length;

        const c = COLORS[type] || COLORS["เงินอื่น"];
        
        html += `
          <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-opacity-50 border-gray-400">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-bold ${c.text}">${type}</span>
              <div class="text-right"><span class="font-bold">${countApprove}</span><span class="text-xs text-gray-400">/${count} ฎีกา</span></div>
            </div>
            <div class="text-xs text-gray-500">เบิกแล้ว <span class="text-lg font-bold text-green-600 block">${amtApprove.toLocaleString()} ฿</span></div>
            <div class="text-xs text-red-400 mt-1">รอตรวจสอบ: ${amtWait.toLocaleString()} ฿</div>
            <div class="text-xs text-gray-800 mt-1 border-t pt-1">รวมทั้งสิ้น: ${amtTotal.toLocaleString()} ฿</div>
          </div>
        `;
      });
      document.getElementById('dash-summary-cards').innerHTML = html;
      
      // Progress & Avg Days (Mock Math)
      document.getElementById('dash-progress-text').innerText = (totalItems ? Math.round((totalSuccess/totalItems)*100) : 0) + '%';
      document.getElementById('dash-progress-bar').style.width = (totalItems ? Math.round((totalSuccess/totalItems)*100) : 0) + '%';
      document.getElementById('dash-avg-time').innerText = '3 วัน'; // Simulated

      renderCharts();
    }

    let chart1, chart2;
    function renderCharts() {
      // ทำลายกราฟเก่าถ้ามี
      if(chart1) chart1.destroy(); if(chart2) chart2.destroy();
      
      const ctx1 = document.getElementById('chart-overall').getContext('2d');
      chart1 = new Chart(ctx1, {
        type: 'bar',
        data: { labels: ['เภสัชกรรม', 'พัสดุ', 'โภชนาการ', 'อื่นๆ'], datasets: [{ label: 'จำนวนเงิน', data: [150000, 80000, 50000, 20000], backgroundColor: '#c39bd3' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });

      const ctx2 = document.getElementById('chart-types').getContext('2d');
      chart2 = new Chart(ctx2, {
        type: 'bar',
        data: { labels: ['เภสัชกรรม', 'พัสดุ'], datasets: [{ label: 'เงินบำรุง', data: [10, 5], backgroundColor: '#FFFF99' }, { label: 'เงินงบประมาณ', data: [2, 8], backgroundColor: '#FFCCFF' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: false }, y: { stacked: false } } }
      });
    }
