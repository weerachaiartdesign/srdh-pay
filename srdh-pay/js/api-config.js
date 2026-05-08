/* api-config.js - Version 00110 */

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyq6dW5gCwY_vVSDz0u4_yXrSMG-Xo86j0CqnIxOzW3FSDJ82cImI3kR0GzDEYuZG3tMw/exec',
  VERSION: '00110'
};

/**
 * แก้ไขปัญหา "Arguments too many" โดยการห่อหุ้ม arguments เข้าไปใน payload ตัวเดียว
 */
async function callGAS(functionName, ...args) {
  // หากรันใน Google Script Environment
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(res => resolve(res))
        .withFailureHandler(err => reject(err))[functionName](...args);
    });
  }

  // หากรันเป็น Standalone (Cloudflare Pages)
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: functionName,
        data: args // ส่งเป็น array ของอาร์กิวเมนต์
      })
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    
    if (result.success) {
      return result.data || result;
    } else {
      throw new Error(result.message || 'Server error occurred');
    }
  } catch (error) {
    console.error(`API Error [${functionName}]:`, error);
    throw error;
  }
}

window.api = {
  login: (email, pw) => callGAS('login', email, pw),
  guestLogin: (email) => callGAS('guestLogin', email),
  getRegisterData: (filters) => callGAS('getRegisterData', filters),
  getSettings: () => callGAS('getSettings'),
  batchInsertRegister: (records, bId, email, dept) => callGAS('batchInsertRegister', records, bId, email, dept),
  updateReceiveInfo: (indices, date, email) => callGAS('updateReceiveInfo', indices, date, email),
  // เพิ่มฟังก์ชันอื่นๆ ตามเอกสาร...
};
