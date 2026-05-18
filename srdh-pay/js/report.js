// Version: 00122
// Report Page Controller

let reportMoneyChart, reportDeptChart;

async function loadReport() {
    try {
        const result = await callGAS('getReportData', {
            month: document.getElementById('report-month').value,
            year: document.getElementById('report-year').value
        });

        if (result.success) {
            renderReportSummary(result.summary);
            renderMoneyChart(result.moneyData);
            renderDeptChart(result.deptData);
            renderPendingItems(result.pending);
        }
    } catch (e) {
        alert("ไม่สามารถโหลดรายงานได้");
    }
}

function renderReportSummary(summary) {
    const container = document.getElementById('report-summary');
    container.innerHTML = `
        <div class="card p-6">
            <p class="text-purple-600">ยอดเบิกทั้งหมด</p>
            <p class="text-4xl font-bold text-purple-900">${formatCurrency(summary.totalAmount)}</p>
        </div>
        <div class="card p-6">
            <p class="text-emerald-600">จ่ายแล้ว</p>
            <p class="text-4xl font-bold text-emerald-600">${formatCurrency(summary.paidAmount)}</p>
        </div>
        <div class="card p-6">
            <p class="text-amber-600">รอตรวจสอบ</p>
            <p class="text-4xl font-bold text-amber-600">${formatCurrency(summary.waitingAmount)}</p>
        </div>
        <div class="card p-6">
            <p class="text-purple-600">จำนวนฎีกา</p>
            <p class="text-4xl font-bold text-purple-900">${summary.count.toLocaleString()}</p>
        </div>
    `;
}

function renderMoneyChart(data) {
    if (reportMoneyChart) reportMoneyChart.destroy();
    reportMoneyChart = new Chart(document.getElementById('reportMoneyChart'), {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{ data: data.values, backgroundColor: ['#7C3AED','#C026D3','#F59E0B','#10B981'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderDeptChart(data) {
    if (reportDeptChart) reportDeptChart.destroy();
    reportDeptChart = new Chart(document.getElementById('reportDeptChart'), {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{ label: 'จำนวนเงิน', data: data.values, backgroundColor: '#7C3AED' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderPendingItems(pending) {
    const container = document.getElementById('pending-list');
    container.innerHTML = pending.map(item => `
        <div class="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
            <div>
                <span class="font-medium">${item.vendor}</span>
                <span class="text-sm text-gray-500 ml-3">${item.moneyType}</span>
            </div>
            <div class="text-right">
                <div class="font-bold">${formatCurrency(item.amount)}</div>
                <div class="text-xs text-amber-600">${item.status}</div>
            </div>
        </div>
    `).join('');
}

async function exportToExcel() {
    alert("กำลังส่งออกไฟล์ Excel (CSV)...\nฟังก์ชันจะเชื่อมต่อกับ Google Apps Script");
    // TODO: callGAS('exportExcel')
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    
    // Populate year and month
    const yearSelect = document.getElementById('report-year');
    const currentYear = new Date().getFullYear() + 543;
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }
    
    loadReport();
});