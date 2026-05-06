/*<!-- ==========================================
       ไฟล์: js/auth.js Version : 00105
       ========================================== -->*/

function toggleGuestForm(show) {
      document.getElementById('login-form').classList.toggle('hidden', show);
      document.getElementById('btn-show-guest').classList.toggle('hidden', show);
      document.getElementById('guest-form').classList.toggle('hidden', !show);
    }

    async function doLogin() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      if (!email || !pass) return alert('กรุณากรอกข้อมูลให้ครบ');
      
      // การจำลองผลลัพธ์จากเซิร์ฟเวอร์เพื่อให้แสดง UI ได้ในหน้าต่าง Preview
      // ของจริงต้องใช้ fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({action:'login', email, password}) })
      mockLoginProcess(email, 'admin'); 
    }

    async function doGuestLogin() {
      const email = document.getElementById('guest-email').value;
      if (!email) return alert('กรุณาระบุอีเมล');
      mockLoginProcess(email, 'guest');
    }

    function mockLoginProcess(email, role) {
      currentUser = { email: email, role: role, username: role === 'guest' ? 'ผู้เยี่ยมชม' : 'ทดสอบแอดมิน', dept: 'ฝ่ายบริหาร' };
      localStorage.setItem('srdh_user', JSON.stringify(currentUser));
      initApp();
    }

    function logout() {
      if(confirm('ยืนยันการออกจากระบบ?')) {
        localStorage.removeItem('srdh_user');
        currentUser = null;
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
      }
    }
