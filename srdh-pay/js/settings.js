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
