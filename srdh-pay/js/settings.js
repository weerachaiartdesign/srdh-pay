/* version 00106 */
/**
 * Settings page (admin only) – manage budget period and system lists.
 * Currently allows editing budget start/end dates.
 */

let budgetStart = null, budgetEnd = null;

function initSettings() {
  document.getElementById('settings-container').innerHTML = renderSettingsUI();
  loadSettingsData();
}

function renderSettingsUI() {
  return `
    <div class="bg-white p-6 rounded-xl shadow-sm mb-4">
      <h3 class="text-lg font-bold mb-3">กำหนดวันเปิด-ปิดรับฎีกา</h3>
      <div class="flex gap-4 items-center">
        <label>เริ่มต้น <input type="date" id="budget-start" class="border rounded px-2 py-1"></label>
        <label>สิ้นสุด <input type="date" id="budget-end" class="border rounded px-2 py-1"></label>
        <button onclick="saveBudgetPeriod()" class="bg-purple-600 text-white px-4 py-2 rounded-lg">บันทึก</button>
      </div>
    </div>
    <div class="bg-white p-6 rounded-xl shadow-sm">
      <h3 class="text-lg font-bold mb-2">ตั้งค่ารายการ (Vendor / Checker / MoneyType)</h3>
      <p class="text-gray-500">กำลังพัฒนา</p>
    </div>`;
}

function loadSettingsData() {
  // In a real implementation, fetch budget period from settings sheet or server
  const savedStart = localStorage.getItem('budgetStart');
  const savedEnd = localStorage.getItem('budgetEnd');
  if (savedStart) document.getElementById('budget-start').value = savedStart;
  if (savedEnd) document.getElementById('budget-end').value = savedEnd;
}

function saveBudgetPeriod() {
  const start = document.getElementById('budget-start').value;
  const end = document.getElementById('budget-end').value;
  if (!start || !end) return alert('กรุณาเลือกทั้งวันที่เริ่มต้นและสิ้นสุด');
  localStorage.setItem('budgetStart', start);
  localStorage.setItem('budgetEnd', end);
  alert('บันทึกช่วงเวลาเรียบร้อย');
}
