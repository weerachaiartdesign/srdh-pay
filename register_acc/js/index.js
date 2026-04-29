// version : 00100
let allData = [];

window.onload = function() {
  loadData();
};

function loadData() {
  google.script.run.withSuccessHandler(data => {
    allData = data;
    showPage('dashboard');
  }).getRegisterData();
}

function showPage(pageId) {
  const contentArea = document.getElementById('content-area');
  // อัปเดตเมนู
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('sidebar-active', 'text-white'));
  // โหลด HTML ผ่าน Template
  google.script.run.withSuccessHandler(html => {
    contentArea.innerHTML = html;
    if(pageId === 'dashboard') initDashboard();
    if(pageId === 'register-list') initRegisterList();
  }).include(pageId + '.html');
}
