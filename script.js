const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let currentSelectedRole = ""; 

// --- 1. ระบบเลือกบทบาท ---
function selectRole(role) {
    currentSelectedRole = role;
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

// --- 2. ระบบ Login และ Redirect (จุดสำคัญ) ---
async function handleLogin() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    const user = userEl.value;
    const pass = passEl.value;

    if (!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
    }
    
    document.getElementById('loader').style.display = 'flex';
    
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'login', user, pass }) 
        });
        const json = await response.json();
        
        document.getElementById('loader').style.display = 'none';
        
        if (json.success) {
            if (json.role !== currentSelectedRole) {
                Swal.fire('ผิดพลาด', `บัญชีนี้ไม่ใช่สิทธิ์ ${currentSelectedRole}`, 'error');
                return;
            }
            
            // เก็บข้อมูลลง LocalStorage
            localStorage.setItem('auth', JSON.stringify(json));
            
            // ล้างค่าในฟอร์ม
            userEl.value = "";
            passEl.value = "";

            // เปลี่ยนหน้าไปยังไฟล์ที่แยกไว้
            if (json.role === 'Teacher') {
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
