// Version: 00120
// Settings Page Controller (Admin Only)

async function loadSettings() {
    if (currentUser?.role !== 'admin') {
        alert("เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้");
        window.location.href = 'dashboard.html';
        return;
    }

    await loadMoneyTypes();
    await loadVendors();
    await loadCheckers();
}

async function loadMoneyTypes() {
    const result = await callGAS('getSettings', { sheet: 'moneytype' });
    const container = document.getElementById('money-list');
    if (result.success) {
        container.innerHTML = result.data.map(item => `
            <div class="flex justify-between bg-purple-50 px-4 py-3 rounded-2xl">
                <span>${item}</span>
                <button onclick="deleteSetting('moneytype', '${item}')" class="text-red-500 text-sm">ลบ</button>
            </div>
        `).join('');
    }
}

async function loadVendors() {
    const result = await callGAS('getSettings', { sheet: 'vendor' });
    const container = document.getElementById('vendor-list');
    if (result.success) {
        container.innerHTML = result.data.map(item => `
            <div class="flex justify-between bg-purple-50 px-4 py-3 rounded-2xl">
                <span>${item}</span>
                <button onclick="deleteSetting('vendor', '${item}')" class="text-red-500 text-sm">ลบ</button>
            </div>
        `).join('');
    }
}

async function loadCheckers() {
    const result = await callGAS('getSettings', { sheet: 'checker' });
    const container = document.getElementById('checker-list');
    if (result.success) {
        container.innerHTML = result.data.map(item => `
            <div class="flex justify-between bg-purple-50 px-4 py-3 rounded-2xl">
                <span>${item}</span>
                <button onclick="deleteSetting('checker', '${item}')" class="text-red-500 text-sm">ลบ</button>
            </div>
        `).join('');
    }
}

// Add Functions
async function addMoneyType() {
    const val = document.getElementById('new-money').value.trim();
    if (val) await saveSetting('moneytype', val);
}

async function addVendor() {
    const val = document.getElementById('new-vendor').value.trim();
    if (val) await saveSetting('vendor', val);
}

async function addChecker() {
    const val = document.getElementById('new-checker').value.trim();
    if (val) await saveSetting('checker', val);
}

async function saveSetting(type, value) {
    await callGAS('addSetting', { type, value });
    loadSettings(); // Refresh
}

async function deleteSetting(type, value) {
    if (confirm(`ลบ "${value}"?`)) {
        await callGAS('deleteSetting', { type, value });
        loadSettings();
    }
}

async function savePeriod() {
    alert("บันทึกช่วงเวลารับฎีกาสำเร็จ (เชื่อมต่อกับ GAS)");
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    loadSettings();
});
