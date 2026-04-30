// version : 00101
async function showPage(page) {
  const contentArea = document.getElementById('content-area');
  const response = await fetch(`${page}.html`);
  contentArea.innerHTML = await response.text();
  
  if (page === 'dashboard') {
    initDashboard();
  } else if (page === 'register') {
    initRegisterList();
  }
}

// โหลดหน้าแรกเมื่อเปิดเว็บ
window.onload = () => showPage('dashboard');
