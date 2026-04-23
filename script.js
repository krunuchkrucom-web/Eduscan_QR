const API_URL = "https://script.google.com/macros/s/AKfycbxt5rndbk6Gw4d-opv4CHRRliB6K84awMxtSPJm5qTr5yPhjdZhllISfrR-zGlV3Tsgsw/exec";
let currentSelectedRole = ""; 

function selectRole(role) {
    currentSelectedRole = role; // 'Student' หรือ 'Teacher'
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.setProperty('display', 'flex', 'important');
    
    const badge = document.getElementById('role-badge');
    if (badge) {
        badge.innerText = (role === 'Student') ? "สถานะ: นักเรียน" : "สถานะ: ผู้สอน";
        badge.className = (role === 'Student') ? "badge rounded-pill bg-info text-white px-3 py-2 shadow-sm" : "badge rounded-pill bg-warning text-dark px-3 py-2 shadow-sm";
    }
}

function backToRole() {
    document.getElementById('role-view').style.setProperty('display', 'flex', 'important');
    document.getElementById('login-view').style.setProperty('display', 'none', 'important');
}

async function handleLogin() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
    }
    
    document.getElementById('loader').style.display = 'flex';
    
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'login', user: user, pass: pass }) 
        });
        const json = await response.json();
        
        document.getElementById('loader').style.display = 'none';
        
        if (json.success) {
            // เช็คตัวพิมพ์ใหญ่-เล็กให้ตรงกับใน Google Sheets
            if (json.role.toLowerCase() !== currentSelectedRole.toLowerCase()) {
                Swal.fire('ผิดพลาด', `บัญชีนี้ไม่ใช่สิทธิ์ ${currentSelectedRole}`, 'error');
                return;
            }
            
            localStorage.setItem('auth', JSON.stringify(json));
            
            if (json.role.toLowerCase() === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }
        } else {
            Swal.fire('ล้มเหลว', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
        }
    } catch (err) {
        document.getElementById('loader').style.display = 'none';
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
}
}
