/*<!-- report.js - (ควมคุมการส่งออก) - Version : 00108 -->*/

function initReport() {
    loadReportData();
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
}

function loadReportData() {
    const month = document.getElementById('reportMonth')?.value || new Date().toISOString().slice(0,7);
    google.script.run.withSuccessHandler(renderReport).getReportData(month);
}

function renderReport(data) {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (ctx && data.trendChart) {
        new Chart(ctx, {
            type: 'line',
            data: data.trendChart
        });
    }
    const tableDiv = document.getElementById('summaryReportTable');
    if (tableDiv && data.tableHtml) tableDiv.innerHTML = data.tableHtml;
}

function exportToExcel() {
    const month = document.getElementById('reportMonth').value;
    google.script.run.withSuccessHandler(csv => {
        const blob = new Blob([csv], {type: 'text/csv'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report_${month}.csv`;
        link.click();
    }).exportReportToCsv(month);
}
