// Version: 00120
// API Configuration for Google Apps Script Backend

const CONFIG = {
    // เปลี่ยน SPREADSHEET_ID เป็นของจริงเมื่อ deploy
    SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",
    
    // Google Apps Script Web App URL (จะได้หลัง Deploy)
    GAS_URL: "YOUR_GAS_WEB_APP_URL_HERE",
    
    // เวลาหมดอายุของ Session (นาที)
    SESSION_TIMEOUT: 480, // 8 ชั่วโมง
    
    // ปีงบประมาณเริ่มต้น
    BUDGET_YEAR_START_MONTH: 10, // ตุลาคม
};

// ฟังก์ชันเรียก Google Apps Script
async function callGAS(functionName, params = {}) {
    const url = `${CONFIG.GAS_URL}?function=${functionName}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
    }
}
