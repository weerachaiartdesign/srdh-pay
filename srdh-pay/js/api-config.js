/*<!-- api-config.js - (กำหนด endpoints สำหรับเรียก Google Apps Script) - Version : 00108 -->*/

const API_URL = 'https://script.google.com/macros/s/AKfycbwswHCCUqCVupeG_73LsJ0nLrdVWiJg8rv0L-0uV3HBx2AEYGQ6ABAUW9TAIjZ9UmZufQ/exec'; // ต้องแทนที่ด้วย URL ของการ deploy จริง
const SHEET_ID = '14XoNe8jsygjaH3y0uz5c2VeNKpKubgxu8KT7TZBXu4A';

// ฟังก์ชันเรียก GAS โดยใช้ google.script.run (เมื่อรันใน environment ของ GAS Web App)
// แต่ถ้าใช้ standalone frontend ต้องใช้ fetch แทน ซึ่งในที่นี้สมมติว่าใช้ google.script.run
window.api = {
  login: (email, password) => google.script.run.withSuccessHandler().login(email, password),
  guestLogin: (email) => google.script.run.withSuccessHandler().guestLogin(email),
  getRegisterData: (filters) => google.script.run.withSuccessHandler().getRegisterData(filters),
  getDashboardData: () => google.script.run.withSuccessHandler().getDashboardData(),
  batchInsertRegister: (records, batchId, userEmail, userDept) => google.script.run.withSuccessHandler().batchInsertRegister(records, batchId, userEmail, userDept),
  updateReceiveInfo: (rowsIndices, receiveDate, userEmail) => google.script.run.withSuccessHandler().updateReceiveInfo(rowsIndices, receiveDate, userEmail),
  updateFields: (rowsIndices, updates, userEmail) => google.script.run.withSuccessHandler().updateFields(rowsIndices, updates, userEmail),
  getSettings: () => google.script.run.withSuccessHandler().getSettings(),
  getSystemDates: () => google.script.run.withSuccessHandler().getSystemDates(),
  setSystemDates: (start, end) => google.script.run.withSuccessHandler().setSystemDates(start, end)
};
