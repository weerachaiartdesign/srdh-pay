/*<!-- ========================================================
       ไฟล์: js/dashboard.js (ระบบคำนวณและกราฟ) version : 00105
       ======================================================== -->*/
// ควบคุมการแสดงผลและการคำนวณข้อมูลหน้า Dashboard

function initDashboard() {
      const types = ["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ", "เงินอื่น"];
      let html = '';
      
      let totalDays = 0, totalSuccess = 0, totalItems = 0;

      types.forEach(type => {
        // กรองข้อมูลตามประเภท (รวมประเภทที่ไม่ตรงกับ 3 อันแรกเป็น "เงินอื่น")
        let items = allData.filter(d => type === "เงินอื่น" ? !["เงินงบประมาณ", "เงินบำรุง", "เงินประกันสุขภาพ"].includes(d.moneyType) : d.moneyType === type);
        items = items.filter(d => d.status !== 'ยกเลิก'); // ไม่นับที่ยกเลิก
        
        const count = items.length;
        const countApprove = items.filter(d => ['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).length;
        const amtApprove = items.filter(d => ['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).reduce((sum, d) => sum + d.amount, 0);
        const amtWait = items.filter(d => !['อนุมัติ', 'จ่ายแล้ว'].includes(d.status)).reduce((sum, d) => sum + d.amount, 0);
        const amtTotal = items.reduce((sum, d) => sum + d.amount, 0);

        totalItems += count;
        totalSuccess += items.filter(d => d.status === 'จ่ายแล้ว').length;

        const c = COLORS[type] || COLORS["เงินอื่น"];
        
        html += `
          <div class="bg-white rounded-xl p-5 shadow-sm border-l-4 border-gray-200 hover:shadow-md transition relative overflow-hidden" style="border-left-color: ${c.bg.replace('bg-[','').replace(']','')}">
            <div class="absolute top-0 right-0 p-3 opacity-10 text-4xl"><i class="ph-fill ph-coins"></i></div>
            <div class="flex justify-between items-start mb-3 relative z-10">
              <span class="text-sm font-bold ${c.text} bg-gray-50 px-2 py-1 rounded">${type}</span>
              <div class="text-right">
                <span class="text-xl font-black text-gray-800">${countApprove}</span>
                <span class="text-xs text-gray-400">/${count} ฎีกา</span>
              </div>
            </div>
            <div class="relative z-10">
              <div class="text-xs text-gray-500 mb-0.5">เบิกแล้ว</div>
              <div class="text-xl font-black text-green-600 leading-none mb-2">${amtApprove.toLocaleString('th-TH')} <span class="text-sm font-normal text-gray-400">฿</span></div>
              <div class="flex justify-between items-center text-xs border-t border-gray-100 pt-2 mt-2">
                <span class="text-red-400">รอตรวจสอบ: ${amtWait.toLocaleString()} ฿</span>
              </div>
              <div class="text-xs text-gray-800 mt-1 font-medium">
                ขอเบิกทั้งสิ้น: ${amtTotal.toLocaleString()} ฿
              </div>
            </div>
          </div>
        `;
      });
      document.getElementById('dash-summary-cards').innerHTML = html;
      
      // คำนวณ % ความสำเร็จ
      const percent = totalItems > 0 ? Math.round((totalSuccess/totalItems)*100) : 0;
      document.getElementById('dash-progress-text').innerText = percent + '%';
      document.getElementById('dash-progress-bar').style.width = percent + '%';
      
      // ระยะเวลาเฉลี่ย (ตัวเลขสมมติสำหรับการแสดงผล)
      document.getElementById('dash-avg-time').innerHTML = '3 <span class="text-xl font-medium">วัน</span>';

      renderCharts();
    }

    let chartOverall, chartTypes;
    function renderCharts() {
      // ทำลายกราฟเก่าถ้ามีเพื่อป้องกันการวาดซ้อน
      if(chartOverall) chartOverall.destroy(); 
      if(chartTypes) chartTypes.destroy();
      
      // ข้อมูลจำลองสำหรับกราฟ (เพื่อให้เห็นภาพสวยงาม)
      const labels = ['เภสัชกรรม', 'พัสดุ', 'โภชนาการ', 'ประกันสุขภาพ', 'อื่นๆ'];
      const dataAmt = [450000, 280000, 150000, 95000, 50000];
      const dataCount = [15, 10, 8, 4, 3];

      // กราฟ 1: Bar + Line
      const ctx1 = document.getElementById('chart-overall').getContext('2d');
      chartOverall = new Chart(ctx1, {
        type: 'bar',
        data: { 
          labels: labels, 
          datasets: [
            { 
              label: 'จำนวนฎีกา (ใบ)', 
              data: dataCount, 
              type: 'line', 
              borderColor: '#ff6b6b', 
              backgroundColor: '#ff6b6b', 
              borderWidth: 2,
              yAxisID: 'y1'
            },
            { 
              label: 'จำนวนเงิน (บาท)', 
              data: dataAmt, 
              backgroundColor: 'rgba(155, 89, 182, 0.7)',
              borderRadius: 4,
              yAxisID: 'y'
            }
          ] 
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { type: 'linear', display: true, position: 'left', title: {display: true, text: 'จำนวนเงิน (บาท)'} },
            y1: { type: 'linear', display: true, position: 'right', grid: {drawOnChartArea: false}, title: {display: true, text: 'จำนวนฎีกา (ใบ)'} }
          }
        }
      });

      // กราฟ 2: Stacked Bar
      const ctx2 = document.getElementById('chart-types').getContext('2d');
      chartTypes = new Chart(ctx2, {
        type: 'bar',
        data: { 
          labels: labels, 
          datasets: [
            { label: 'เงินงบประมาณ', data: [8, 5, 2, 0, 1], backgroundColor: '#FFCCFF' },
            { label: 'เงินบำรุง', data: [5, 4, 6, 2, 1], backgroundColor: '#FFFF99' },
            { label: 'เงินประกันสุขภาพ', data: [2, 1, 0, 2, 1], backgroundColor: '#F8CBAD' }
          ] 
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          scales: { 
            x: { stacked: false }, // แท่งไม่ซ้อนกัน
            y: { beginAtZero: true, title: {display: true, text: 'จำนวนฎีกา'} } 
          } 
        }
      });
    }
