/* version 002
 */
const CONFIG = {
  // แก้ไข URL นี้เป็น URL Web App ของคุณหลังจาก Deploy
  API_URL: "https://script.google.com/macros/s/AKfycbxzCinFmHqaydiyRW8rZfra0I_2UyzMoC_rQUhHXBAvHvnjnvtWLAyTGAURxPSHXPwGTA/exec",
  
  // สำหรับพัฒนาใช้ dev mode (ต้อง Deploy แบบ dev)
  //DEV_MODE: false,
  //DEV_API_URL: "https://script.google.com/macros/s/AKfycbwSts47UICrCmQ7HLxYma-TMANPTiuYxBJ02mh_hZxufpHQNgwTWEIyh1eVKjUSFNhn/dev",
  
  // ตั้งค่า cache timeout (มิลลิวินาที)
  CACHE_TIMEOUT: 5 * 60 * 1000, // 5 นาที
};

// ฟังก์ชัน helper สำหรับเรียก API
async function fetchRegisterData() {
  const url = CONFIG.DEV_MODE ? CONFIG.DEV_API_URL : CONFIG.API_URL;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
