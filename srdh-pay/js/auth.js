/*<!-- ==========================================
       ไฟล์: js/auth.js Version : 00105
       ========================================== -->*/

function toggleGuestForm(show) {
      document.getElementById('login-form').classList.toggle('hidden', show);
      document.getElementById('btn-show-guest').classList.toggle('hidden', show);
      document.getElementById('guest-form').classList.toggle('hidden', !show);
    }

    function doLogin() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      if (!email || !pass) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      
      // จำลองการเข้าสู่ระบบแบบ Admin เพื่อให้เห็นปุ่มแก้ไขครบถ้วน
      mockLoginProcess(email, 'admin'); 
    }

    function doGuestLogin() {
      const email = document.getElementById('guest-email').value;
      if (!email) return alert('กรุณาระบุอีเมล');
      mockLoginProcess(email, 'guest');
    }

    function mockLoginProcess(email, role) {
      currentUser = { 
        email: email, 
        role: role, 
        username: role === 'guest' ? 'ผู้เยี่ยมชมระบบ' : 'ทดสอบผู้ดูแลระบบ (Admin)', 
        dept: 'ฝ่ายงบประมาณการเงินและบัญชี' 
      };
      localStorage.setItem('srdh_user', JSON.stringify(currentUser));
      initApp();
    }

    function logout() {
      if(confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('srdh_user');
        currentUser = null;
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
        // รีเซ็ตฟอร์มล็อกอิน
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        toggleGuestForm(false);
      }
    }
