/*<!-- ==========================================
       ไฟล์: js/auth.js Version : 00106
       ========================================== -->*/
/* Authentication UI logic.
 * Provides functions to login, guest login, and toggle forms.
 */

function toggleGuestForm(show) {
  document.getElementById('login-form').classList.toggle('hidden', show);
  document.getElementById('btn-show-guest').classList.toggle('hidden', show);
  document.getElementById('guest-form').classList.toggle('hidden', !show);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return alert('กรุณากรอกข้อมูลให้ครบ');
  try {
    const result = await callApi('login', { email, password });
    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('srdh_user', JSON.stringify(currentUser));
      initApp();
    } else {
      alert(result.message);
    }
  } catch (e) {
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ' + e.message);
  }
}

async function doGuestLogin() {
  const email = document.getElementById('guest-email').value.trim();
  if (!email) return alert('กรุณาระบุอีเมล');
  try {
    const result = await callApi('guestLogin', { email });
    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('srdh_user', JSON.stringify(currentUser));
      initApp();
    } else {
      alert(result.message);
    }
  } catch (e) {
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ' + e.message);
  }
}

function showProfileSettings() {
  // Open a modal or navigate to a profile edit form
  const newName = prompt('ชื่อ-สกุล', currentUser.username);
  const newPos = prompt('ตำแหน่ง', currentUser.position);
  const newDept = prompt('หน่วยงาน', currentUser.dept);
  const newPass = prompt('รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)');
  if (!newName && !newPos && !newDept && !newPass) return;
  const newData = {};
  if (newName) newData.username = newName;
  if (newPos) newData.position = newPos;
  if (newDept) newData.dept = newDept;
  if (newPass) newData.password = newPass;
  callApi('updateProfile', { userEmail: currentUser.email, newData }).then(res => {
    if (res.success) {
      Object.assign(currentUser, newData);
      localStorage.setItem('srdh_user', JSON.stringify(currentUser));
      document.getElementById('user-name').innerText = currentUser.username;
      alert('บันทึกข้อมูลเรียบร้อย');
    } else alert('เกิดข้อผิดพลาด');
  });
}
