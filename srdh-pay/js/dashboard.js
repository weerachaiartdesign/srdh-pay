// Version: 00122
// Dashboard Controller - Srdh Pay

let deptChart, moneyTypeChart, monthlyChart;

async function loadDashboard() {
    try {
        const data = await callGAS('getDashboardData');
        
        if (!data.success) {
            console.error(data.message);
            return;
        }

        renderSummaryCards(data.summary);
        renderAverageTime(data.avgTime);
        renderProgress(data.progress);
        renderDepartmentChart(data.deptData);
        renderMoneyTypeChart(data.moneyTypeData);
        renderMonthlyChart(data.monthlyData);

    } catch (error) {
        console.error("Dashboard load error:", error);
        alert("ไม่สามารถโหลดข้อมูล Dashboard ได้");
    }
}

// Render Summary Cards
function renderSummaryCards(summary) {
    const container = document.getElementById('summary-cards');
    container.innerHTML = '';

    const types = [
        { key: 'งบประมาณ', label: 'เงินงบประมาณ', color: 'purple' },
        { key: 'บำรุง', label: 'เงินบำรุง', color: 'amber' },
        { key: 'ประกันสุขภาพ', label: 'เงินประกันสุขภาพ', color: 'orange' },
        { key: 'อื่น', label: 'เงินอื่นๆ', color: 'slate' }
    ];

    types.forEach(type => {
        const s = summary[type.key] || { total: 0, approved: 0, waiting: 0 };
        
        const cardHTML = `
            <div class="card p-6 border-l-4 border-${type.color}-500">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-${type.color}-600">${type.label}</p>
                        <p class="text-3xl font-bold text-gray-800 mt-2">${s.approved.toLocaleString()} <span class="text-sm font-normal text-gray-500">ฎีกา</span></p>
                    </div>
                    <div class="text-4xl text-${type.color}-200">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                </div>
                <div class="mt-6 space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-emerald-600 font-medium">เบิกแล้ว</span>
                        <span class="font-semibold">${formatCurrency(s.approvedAmount)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-red-500">รอตรวจสอบ</span>
                        <span>${formatCurrency(s.waitingAmount)}</span>
                    </div>
                    <div class="flex justify-between border-t pt-2">
                        <span class="font-medium">ขอเบิกทั้งสิ้น</span>
                        <span class="font-bold">${formatCurrency(s.totalAmount)}</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function renderAverageTime(days) {
    document.getElementById('avg-days').textContent = Math.floor(days || 0);
}

function renderProgress(percent) {
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('progress-percent').textContent = `${Math.round(percent)}%`;
}

// Charts
function renderDepartmentChart(data) {
    if (deptChart) deptChart.destroy();
    
    deptChart = new Chart(document.getElementById('deptChart'), {
        type: 'bar',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'จำนวนเงิน (บาท)',
                data: data.values || [],
                backgroundColor: '#7C3AED',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderMoneyTypeChart(data) {
    if (moneyTypeChart) moneyTypeChart.destroy();
    
    moneyTypeChart = new Chart(document.getElementById('moneyTypeChart'), {
        type: 'doughnut',
        data: {
            labels: data.labels || [],
            datasets: [{
                data: data.values || [],
                backgroundColor: ['#7C3AED', '#C026D3', '#F59E0B', '#10B981', '#6366F1']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderMonthlyChart(data) {
    if (monthlyChart) monthlyChart.destroy();
    
    monthlyChart = new Chart(document.getElementById('monthlyChart'), {
        type: 'bar',
        data: {
            labels: data.months || [],
            datasets: [
                {
                    label: 'ปีปัจจุบัน',
                    data: data.currentYear || [],
                    backgroundColor: '#7C3AED'
                },
                {
                    label: 'ปีก่อนหน้า',
                    data: data.previousYear || [],
                    backgroundColor: '#C4B5FD'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    loadDashboard();
});