/*<!-- settings.js - (ควบคุมหน้าตั้งค่าระบบ) - version : 00108 -->*/

function initSettings() {
    loadSystemDates();
    attachSettingsEvents();
}
function loadSystemDates() {
  google.script.run.withSuccessHandler(data => {
    document.getElementById('startDate').value = data.startDate;
    document.getElementById('endDate').value = data.endDate; }).getSystemDates();
}
function attachSettingsEvents() { 
  document.getElementById('saveDatesBtn')?.addEventListener('click', () => {
    const start = document.getElementById('startDate').value; 
    const end = document.getElementById('endDate').value; 
    google.script.run.withSuccessHandler(()=>alert('บันทึกสำเร็จ')).setSystemDates(start,end); 
  });
}
function convertToYyyyMmDd(dateStr) {
    // dateStr format dd/mm/yyyy -> yyyy-mm-dd
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}
