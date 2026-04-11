const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;
let currentSelectedRole = ""; 

// ฟังก์ชันเรียก API
async function apiCall(data) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const json = await res.json();
        if (loader) loader.style.display = 'none';
        return json;
    } catch (err) {
        if (loader) loader.style.display = 'none';
        Swal.fire('Error', 'เชื่อมต่อ Server ไม่สำเร็จ', 'error');
        return { success: false };
    }
}

// เลือกบทบาท (นักเรียน/ผู้สอน)
function selectRole(role) {
    currentSelectedRole = role;
    
    // ซ่อนหน้าเลือกบทบาท
    const roleView = document.getElementById('role-view');
    if (roleView) roleView.style.setProperty('display', 'none', 'important');
    
    // แสดงหน้า Login
    const loginView = document.getElementById('login-view');
    if (loginView) loginView.style.display = 'block';
    
    // ปรับข้อความตามบทบาท
    const badge = document.getElementById('role-badge');
    const title = document.getElementById('login-title');
    
    if (badge) {
        badge.innerText = (role === 'Student') ? "สถานะ: นักเรียน" : "สถานะ: ผู้สอน";
        badge.className = (role === 'Student') ? "badge rounded-pill bg-info text-white px-3 py-2 shadow-sm" : "badge rounded-pill bg-warning text-dark px-3 py-2 shadow-sm";
    }
    if (title) title.innerText = (role === 'Student') ? "นักเรียน Login" : "ผู้สอน Login";
}

function backToRole() {
    const roleView = document.getElementById('role-view');
    const loginView = document.getElementById('login-view');
    if (roleView) roleView.style.setProperty('display', 'flex', 'important');
    if (loginView) loginView.style.display = 'none';
    currentSelectedRole = "";
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอก Username และ Password', 'warning');
        return;
    }

    const res = await apiCall({ action: 'login', user, pass });

    if (res.success) {
        if (res.role !== currentSelectedRole) {
            Swal.fire('สิทธิ์ไม่ถูกต้อง', `บัญชีนี้ไม่มีสิทธิ์ใช้งานในฐานะ ${currentSelectedRole === 'Student' ? 'นักเรียน' : 'ผู้สอน'}`, 'error');
            return;
        }
        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        initApp();
    } else {
        Swal.fire('ล้มเหลว', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
}

function initApp() {
    if (!auth) return;
    const rv = document.getElementById('role-view');
    const lv = document.getElementById('login-view');
    const mv = document.getElementById('main-view');
    if (rv) rv.style.setProperty('display', 'none', 'important');
    if (lv) lv.style.display = 'none';
    if (mv) mv.style.display = 'block';
    renderMenu();
}

function renderMenu() {
    const area = document.getElementById('content-area');
    if (!area) return;
    if (auth.role === 'Student') {
        area.innerHTML = `
            <div class="row g-4">
                <div class="col-6"><div class="card-menu bg-grad-blue">เช็คชื่อ</div></div>
                <div class="col-6"><div class="card-menu bg-grad-green">ส่งงาน</div></div>
            </div>`;
    } else {
        area.innerHTML = `
            <div class="row g-4">
                <div class="col-6"><div class="card-menu bg-grad-orange">จัดการข้อมูล</div></div>
                <div class="col-6"><div class="card-menu bg-grad-blue">สร้าง QR</div></div>
            </div>`;
    }
}

function logout() { 
    localStorage.clear(); 
    location.reload(); 
}

window.onload = initApp;
