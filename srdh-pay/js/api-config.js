/*<!-- api-config.js - (กำหนด endpoints สำหรับเรียก Google Apps Script) - Version : 00109 -->*/

const CONFIG = {
  // URL จากการ Deploy Google Apps Script (ต้องเป็นแบบ Web App และตั้งค่า Access เป็น Anyone)
  API_URL: 'https://script.google.com/macros/s/AKfycbwswHCCUqCVupeG_73LsJ0nLrdVWiJg8rv0L-0uV3HBx2AEYGQ6ABAUW9TAIjZ9UmZufQ/exec',
  SHEET_ID: '14XoNe8jsygjaH3y0uz5c2VeNKpKubgxu8KT7TZBXu4A'
};

/**
 * ฟังก์ชันกลางสำหรับเรียกใช้ API
 * รองรับทั้งการรันผ่าน Web App (google.script.run) 
 * และ Standalone (fetch API)
 */
async function callGAS(functionName, ...args) {
  // กรณีรันภายใต้สภาพแวดล้อมของ Google Script (หน้า HTML ใน GAS)
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[functionName](...args);
    });
  }

  // กรณีรันเป็น Standalone Frontend (เรียกผ่าน Fetch API)
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'cors', // สำคัญ: ต้องเปิด CORS ในฝั่ง GAS (doPost)
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS มักจะไม่รับ application/json ในบางเคส
      },
      body: JSON.stringify({
        action: functionName,
        data: args
      })
    });

    if (!response.ok) throw new Error('การเชื่อมต่อเครือข่ายขัดข้อง');
    const result = await response.json();
    
    if (result.success) {
      return result.data || result;
    } else {
      throw new Error(result.message || 'เกิดข้อผิดพลาดจาก Server');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// กำหนด window.api ให้เรียกใช้ callGAS
window.api = {
  login: (email, password) => callGAS('login', email, password),
  guestLogin: (email) => callGAS('guestLogin', email),
  getRegisterData: (filters) => callGAS('getRegisterData', filters),
  getDashboardData: () => callGAS('getDashboardData'),
  batchInsertRegister: (records, batchId, userEmail, userDept) => 
    callGAS('batchInsertRegister', records, batchId, userEmail, userDept),
  updateReceiveInfo: (rowsIndices, receiveDate, userEmail) => 
    callGAS('updateReceiveInfo', rowsIndices, receiveDate, userEmail),
  updateFields: (rowsIndices, updates, userEmail) => 
    callGAS('updateFields', rowsIndices, updates, userEmail),
  getSettings: () => callGAS('getSettings'),
  getSystemDates: () => callGAS('getSystemDates'),
  setSystemDates: (start, end) => callGAS('setSystemDates', start, end)
};
