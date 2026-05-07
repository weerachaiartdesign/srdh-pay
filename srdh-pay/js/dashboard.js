/*<!-- js/dashboard.js - (ควบคุมหน้า Dashboard - แสดง summary cards, charts) - version : 00108 -->*/

let deptChart, moneyTypeChart, monthlyChart;

function initDashboard() {
    showLoading();
    google.script.run
        .withSuccessHandler(renderDashboard)
        .withFailureHandler(showError)
        .getDashboardData();
}

function renderDashboard(data) {
    renderSummaryCards(data.summary);
    renderAvgDays(data.avgDays);
    renderSuccessProgress(data.successPercent);
    renderDeptChartAndTable(data.deptChartData);
    renderMoneyTypeChartAndTable(data.moneyTypeData);
    renderMonthlyChartAndTable(data.monthlyData);
    hideLoading();
}

function renderSummaryCards(summary) {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    container.innerHTML = '';
    summary.forEach(s => {
        const color = getColorByType(s.type);
        container.innerHTML += `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-8" style="border-color: ${color}">
                <div class="flex justify-between items-start">
                    <span class="font-bold text-lg">${s.type}</span>
                    <span class="text-sm text-gray-500">${s.approvedCount}/${s.totalCount} ฎีกา</span>
                </div>
                <div class="mt-3">
                    <div class="flex justify-between">
                        <span class="text-gray-500">เบิกแล้ว</span>
                        <span class="text-green-600 font-bold text-xl">${formatNumber(s.approvedAmount)}</span>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span class="text-gray-500">รอตรวจสอบ</span>
                        <span class="text-red-400 font-semibold">${formatNumber(s.pendingAmount)}</span>
                    </div>
                    <div class="flex justify-between mt-1 pt-1 border-t">
                        <span class="text-gray-500">ขอเบิกทั้งสิ้น</span>
                        <span class="font-bold">${formatNumber(s.totalAmount)}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderAvgDays(days) {
    const el = document.getElementById('avgDays');
    if (el) el.innerText = `${days} วัน`;
}

function renderSuccessProgress(percent) {
    const progressBar = document.getElementById('successProgress');
    const percentText = document.getElementById('successPercent');
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (percentText) percentText.innerText = `${percent.toFixed(1)}%`;
}

function renderDeptChartAndTable(data) {
    const ctx = document.getElementById('deptChart')?.getContext('2d');
    if (!ctx) return;
    const labels = [...data.labels, 'หน่วยงานอื่น'];
    const values = [...data.values, data.others];
    if (deptChart) deptChart.destroy();
    deptChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนเงิน (บาท)',
                data: values,
                backgroundColor: '#a855f7',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });
    // ตาราง
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="border-b"><th class="text-left py-1">หน่วยงาน</th><th class="text-right py-1">ยอดเงิน (บาท)</th></tr></thead><tbody>';
    data.labels.forEach((l, i) => {
        html += `<tr class="border-b"><td class="py-1">${l}</td><td class="text-right">${formatNumber(data.values[i])}</td></tr>`;
    });
    html += `<tr class="border-b"><td class="py-1 font-semibold">อื่นๆ</td><td class="text-right">${formatNumber(data.others)}</td></tr>`;
    html += '</tbody></table></div>';
    const tableDiv = document.getElementById('deptTable');
    if (tableDiv) tableDiv.innerHTML = html;
}

function renderMoneyTypeChartAndTable(data) {
    // data format: { labels: ['กลุ่มงานเภสัชกรรม',...], datasets: { 'เงินงบประมาณ': [], ... } }
    const ctx = document.getElementById('moneyTypeChart')?.getContext('2d');
    if (!ctx) return;
    if (moneyTypeChart) moneyTypeChart.destroy();
    const datasets = [];
    const colors = ['#FFCCFF', '#FFFF99', '#F8CBAD', '#FF9999', '#FFF2CC', '#808080'];
    const typeNames = Object.keys(data.datasets);
    typeNames.forEach((t, idx) => {
        datasets.push({
            label: t,
            data: data.datasets[t],
            backgroundColor: colors[idx % colors.length],
            borderRadius: 4
        });
    });
    moneyTypeChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: data.labels, datasets },
        options: { responsive: true, maintainAspectRatio: true, scales: { x: { stacked: false }, y: { stacked: false } } }
    });
    // สร้างตารางรวม
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr><th>หน่วยงาน</th>';
    typeNames.forEach(t => html += `<th class="text-right">${t}</th>`);
    html += '<th class="text-right">รวม</th></tr></thead><tbody>';
    data.labels.forEach((dept, i) => {
        let total = 0;
        html += `<tr><td class="py-1">${dept}</td>`;
        typeNames.forEach(t => {
            let val = data.datasets[t][i] || 0;
            total += val;
            html += `<td class="text-right">${formatNumber(val)}</td>`;
        });
        html += `<td class="text-right font-semibold">${formatNumber(total)}</td></tr>`;
    });
    html += '</tbody></table></div>';
    const tableDiv = document.getElementById('moneyTypeTable');
    if (tableDiv) tableDiv.innerHTML = html;
}

function renderMonthlyChartAndTable(data) {
    const ctx = document.getElementById('monthlyChart')?.getContext('2d');
    if (!ctx) return;
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                { label: 'ปีงบประมาณปัจจุบัน', data: data.currentYear, backgroundColor: '#f97316' },
                { label: 'ปีงบประมาณก่อน', data: data.prevYear, backgroundColor: '#94a3b8' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    let html = '<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr><th>เดือน</th><th class="text-right">ปีปัจจุบัน</th><th class="text-right">ปีก่อน</th></tr></thead><tbody>';
    data.labels.forEach((month, i) => {
        html += `<tr><td>${month}</td><td class="text-right">${data.currentYear[i]}</td><td class="text-right">${data.prevYear[i]}</td></tr>`;
    });
    html += '</tbody></table></div>';
    const tableDiv = document.getElementById('monthlyTable');
    if (tableDiv) tableDiv.innerHTML = html;
}

function getColorByType(type) {
    const map = {
        'เงินงบประมาณ': '#FFCCFF',
        'เงินบำรุง': '#FFFF99',
        'เงินประกันสุขภาพ': '#F8CBAD',
        'เงินอื่น': '#808080'
    };
    return map[type] || '#cbd5e1';
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.round(num));
}

function showLoading() {
    const container = document.getElementById('summaryCards');
    if (container) container.innerHTML = '<div class="col-span-full text-center py-10">กำลังโหลดข้อมูล...</div>';
}

function hideLoading() { /* ไม่ต้องทำอะไร */ }
function showError(err) { alert('เกิดข้อผิดพลาด: ' + err); 
}
