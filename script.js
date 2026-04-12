const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;
let currentSelectedRole = ""; 

// --- 1. ระบบจัดการหน้าจอ (Navigation) ---
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

// --- 2. ระบบ Login ---
async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
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
            auth = json;
            localStorage.setItem('auth', JSON.stringify(json));
            // ล้างค่าในช่องกรอก
            document.getElementById('username').value = "";
            document.getElementById('password').value = "";
            initApp();
        } else {
            Swal.fire('ล้มเหลว', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
        }
    } catch (err) {
        document.getElementById('loader').style.display = 'none';
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
}

// --- 3. เริ่มต้นแอป ---
function initApp() {
    if (!auth) return;
    document.getElementById('role-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';

    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) {
        userDisplay.innerHTML = `<div class="fw-bold text-dark">${auth.name}</div><small class="text-muted">${auth.role}</small>`;
    }
    
    // จัดการ Sidebar กรณีเป็นนักเรียน
    if (auth.role === 'Student') {
        document.getElementById('teacher-sidebar').style.display = 'none';
    }

    showDashboard(); // เริ่มต้นที่หน้า Dashboard
}

// --- 4. ฟังก์ชันแสดงเนื้อหาแต่ละหน้า ---
function showDashboard(el) {
    updateActiveLink(el);
    const area = document.getElementById('content-area');
    document.getElementById('header-title').innerText = "จัดการชั้นเรียน";

    if (auth.role === 'Teacher') {
        area.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4"><div class="stat-card-v2 bg-light-blue p-3 d-flex align-items-center shadow-sm" onclick="showCreateQR()">
                    <div class="bg-primary text-white p-3 rounded-4 me-3">📸</div>
                    <div><h6 class="mb-0 fw-bold">สแกนเข้าเรียน</h6></div>
                </div></div>
                <div class="col-md-4"><div class="stat-card-v2 bg-light-green p-3 d-flex align-items-center shadow-sm">
                    <div class="bg-success text-white p-3 rounded-4 me-3">👤</div>
                    <div><h6 class="mb-0 fw-bold">เพิ่มนักเรียน</h6></div>
                </div></div>
                <div class="col-md-4"><div class="stat-card-v2 bg-light-purple p-3 d-flex align-items-center shadow-sm" onclick="showHistory()">
                    <div class="bg-warning text-white p-3 rounded-4 me-3">📊</div>
                    <div><h6 class="mb-0 fw-bold">ดูรายงาน</h6></div>
                </div></div>
            </div>
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm rounded-4 p-4">
                        <h5 class="fw-bold mb-3">เลือกห้องเรียน</h5>
                        <div class="d-flex gap-2 mb-4">
                            <button class="btn btn-primary rounded-pill px-4" onclick="loadClassRoom('ปวช.1/1')">ปวช.1/1</button>
                            <button class="btn btn-outline-secondary rounded-pill px-4" onclick="loadClassRoom('ปวช.1/2')">ปวช.1/2</button>
                        </div>
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead class="table-light"><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                                <tbody id="student-list-area"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 p-4 text-center">
                        <h6 class="fw-bold mb-3">สรุปภาพรวมวันนี้</h6>
                        <h2 class="text-primary fw-bold display-5">158</h2>
                        <p class="text-muted">คนเข้าเรียนทั้งหมด</p>
                    </div>
                </div>
            </div>`;
        loadClassRoom('ปวช.1/1');
    } else {
        area.innerHTML = `<div class="p-5 text-center"><h3>ยินดีต้อนรับนักเรียน: ${auth.name}</h3><p>ระบบกำลังเตรียมข้อมูลส่วนตัวของคุณ...</p></div>`;
    }
}

function showCreateQR(el) {
    updateActiveLink(el);
    document.getElementById('header-title').innerText = "สร้าง QR Code";
    document.getElementById('content-area').innerHTML = `<div class="card p-5 border-0 shadow-sm rounded-4 text-center"><h4>ระบบสร้าง QR Code รายบุคคล</h4><p>ฟังก์ชันนี้กำลังถูกเรียกใช้งาน...</p></div>`;
}

function showHistory(el) {
    updateActiveLink(el);
    document.getElementById('header-title').innerText = "สรุปรายงานการเข้าเรียน";
    document.getElementById('content-area').innerHTML = `<div class="card p-5 border-0 shadow-sm rounded-4 text-center"><h4>รายงานสรุปผล</h4><p>กำลังดึงข้อมูลจาก Google Sheets...</p></div>`;
}

function updateActiveLink(el) {
    if (!el) return;
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    el.classList.add('active');
}

async function loadClassRoom(room) {
    const tbody = document.getElementById('student-list-area');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">กำลังดึงข้อมูลนักเรียนห้อง ' + room + '...</td></tr>';
}

function logout() {
    localStorage.clear();
    location.reload();
}

function toggleSidebar() {
    document.getElementById('teacher-sidebar').classList.toggle('toggled');
}

// ตรวจสอบสถานะตอนโหลดหน้า
window.onload = () => { if (auth) initApp(); };
