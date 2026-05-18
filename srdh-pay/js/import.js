// Version: 00122
// Import Page Controller - การนำเข้าข้อมูลและลงทะเบียน

let currentBatch = [];
let currentBatchId = null;
let userDept = "";
let userName = "";

// โหลดข้อมูลเริ่มต้น
async function loadImportPage() {
    if (!currentUser) return;
    
    userDept = currentUser.dept || "อื่นๆ";
    userName = currentUser.username || currentUser.email;
    
    document.getElementById('dept').value = userDept;
    document.getElementById('sender').value = userName;
    
    await loadMoneyTypes();
    await loadVendors();
    
    // ตั้งค่าวันที่ปัจจุบัน
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reg-date').value = today;
}

// โหลดประเภทเงิน
async function loadMoneyTypes() {
    try {
        const result = await callGAS('getSettings', { sheet: 'moneytype' });
        const select = document.getElementById('money-type');
        if (result.success) {
            result.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            });
        }
    } catch (e) {}
}

// โหลดรายชื่อเจ้าหนี้
async function loadVendors() {
    try {
        const result = await callGAS('getSettings', { sheet: 'vendor' });
        const select = document.getElementById('vendor-select');
        if (result.success) {
            result.data.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v;
                select.appendChild(opt);
            });
        }
    } catch (e) {}
}

// เพิ่มรายการใหม่ (เปิด Modal)
function addNewItem() {
    if (currentBatch.length >= 15) {
        alert("เพิ่มได้สูงสุด 15 รายการต่อการลงทะเบียนหนึ่งครั้ง");
        return;
    }
    document.getElementById('addItemModal').classList.remove('hidden');
}

// ปิด Modal
function closeAddModal() {
    document.getElementById('addItemModal').classList.add('hidden');
}

// บันทึกรายการลง Batch
function saveItemToBatch() {
    const item = {
        moneyType: document.getElementById('money-type').value,
        reserveNo: document.getElementById('reserve-no').value,
        reserveAmount: parseFloat(document.getElementById('reserve-amount').value) || 0,
        amount: parseFloat(document.getElementById('amount').value) || 0,
        vendor: document.getElementById('vendor-new').value || document.getElementById('vendor-select').value,
        description: document.getElementById('description').value,
        regDate: document.getElementById('reg-date').value,
        dept: userDept,
        sender: userName
    };

    if (!item.amount || !item.vendor || !item.description) {
        alert("กรุณากรอกข้อมูลที่จำเป็น (จำนวนเงิน, ชื่อเจ้าหนี้, รายการ)");
        return;
    }

    currentBatch.push(item);
    renderBatchItems();
    closeAddModal();
    
    // เปิดปุ่มลงทะเบียน
    document.getElementById('register-btn').classList.remove('bg-gray-400', 'cursor-not-allowed');
    document.getElementById('register-btn').classList.add('bg-gradient-to-r', 'from-purple-600', 'to-violet-600');
}

// แสดงรายการใน Batch
function renderBatchItems() {
    const container = document.getElementById('batch-items');
    container.innerHTML = '';
    
    currentBatch.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-purple-50 p-5 rounded-2xl";
        div.innerHTML = `
            <div class="flex-1">
                <div class="font-medium">${item.vendor}</div>
                <div class="text-sm text-gray-600 line-clamp-1">${item.description}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-lg">${formatCurrency(item.amount)}</div>
                <button onclick="removeFromBatch(${index})" 
                        class="text-red-500 hover:text-red-700 text-sm mt-1">ลบ</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    document.getElementById('item-count').textContent = currentBatch.length;
}

// ลบรายการจาก Batch
function removeFromBatch(index) {
    if (confirm("ลบรายการนี้?")) {
        currentBatch.splice(index, 1);
        renderBatchItems();
    }
}

// ลงทะเบียน Batch
async function registerBatch() {
    if (currentBatch.length === 0) {
        alert("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ");
        return;
    }

    if (!confirm("ยืนยันการลงทะเบียนทั้งหมด?")) return;

    try {
        const result = await callGAS('registerBatch', {
            items: currentBatch,
            user: currentUser
        });

        if (result.success) {
            currentBatchId = result.batchId;
            document.getElementById('batch-id').textContent = currentBatchId;
            document.getElementById('batch-info').classList.remove('hidden');
            
            alert(`ลงทะเบียนสำเร็จ! เลขที่: ${currentBatchId}`);
            
            // รีเซ็ต Batch
            currentBatch = [];
            renderBatchItems();
        } else {
            alert(result.message || "ลงทะเบียนไม่สำเร็จ");
        }
    } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการลงทะเบียน");
    }
}

// พิมพ์ใบลงทะเบียน
function printRegistrationForm() {
    if (!currentBatchId && currentBatch.length === 0) {
        alert("ยังไม่มีข้อมูลที่ลงทะเบียน");
        return;
    }
    alert("กำลังเปิดหน้าพิมพ์ใบลงทะเบียน (PDF) - ฟังก์ชันจะเชื่อมต่อกับ GAS ในขั้นตอนถัดไป");
    // TODO: Implement print with window.print() + hidden iframe
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkDarkMode();
    loadImportPage();
});