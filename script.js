const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;

async function apiCall(data) {
    document.getElementById('loader').style.display = 'flex';
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
    document.getElementById('loader').style.display = 'none';
    return res.json();
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const res = await apiCall({ action: 'login', user, pass });
    if(res.success) {
        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        initApp();
    } else {
        Swal.fire('Error', 'ชื่อผู้ใช้หรือรหัสผ่านผิด', 'error');
    }
}

function initApp() {
    if(!auth) return;
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    renderMenu();
}

function renderMenu() {
    const area = document.getElementById('content-area');
    if(auth.role === 'Student') {
        area.innerHTML = `
            <div class="row g-4">
                <div class="col-6"><div class="card-menu bg-grad-blue" onclick="showAttendanceView()">เช็คชื่อ</div></div>
                <div class="col-6"><div class="card-menu bg-grad-green" onclick="showUploadView()">ส่งงาน</div></div>
                <div class="col-12"><div class="card-menu bg-grad-purple" onclick="showHistoryView()">ประวัติ & คะแนน</div></div>
            </div>
            <div id="sub-page" class="mt-4"></div>`;
    } else {
        area.innerHTML = `
            <div class="row g-4">
                <div class="col-6 col-md-3"><div class="card-menu bg-grad-orange" onclick="teacherManage()">จัดการข้อมูล</div></div>
                <div class="col-6 col-md-3"><div class="card-menu bg-grad-blue" onclick="teacherQR()">สร้าง QR</div></div>
                <div class="col-6 col-md-3"><div class="card-menu bg-grad-green" onclick="teacherScanner()">สแกนให้คะแนน</div></div>
                <div class="col-6 col-md-3"><div class="card-menu bg-grad-purple" onclick="teacherReport()">ตารางรายวัน</div></div>
            </div>
            <div id="sub-page" class="mt-4"></div>`;
    }
}

// ฟังก์ชันเปิดกล้อง (สแกนได้เร็วบน GitHub Pages)
function teacherScanner() {
    document.getElementById('sub-page').innerHTML = `
        <div class="card p-4 rounded-4 shadow-sm border-0">
            <h3>สแกน QR Code ให้คะแนน</h3>
            <div id="reader"></div>
        </div>`;
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        Swal.fire('พบรหัส', text, 'success');
        // ส่งค่าไปบันทึกคะแนนใน Sheets ต่อไป
    });
}

function logout() { localStorage.clear(); location.reload(); }
window.onload = initApp;


let selectedRole = "";

function selectRole(role) {
    selectedRole = role;
    document.getElementById('role-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'block';
    
    // ปรับหัวข้อตามบทบาทที่เลือก
    document.getElementById('login-title').innerText = (role === 'Student') ? "นักเรียน Login" : "ผู้สอน Login";
    document.getElementById('login-subtitle').innerText = (role === 'Student') ? "กรุณาใช้รหัสนักเรียนในการเข้าสู่ระบบ" : "สำหรับเจ้าหน้าที่และครูผู้สอน";
}

function backToRole() {
    document.getElementById('role-view').style.display = 'flex';
    document.getElementById('login-view').style.display = 'none';
}

// แก้ไขฟังก์ชัน handleLogin เดิมเล็กน้อยเพื่อให้เช็ค Role ตรงกัน
async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    const res = await apiCall({ action: 'login', user, pass });
    
    if(res.success) {
        // ตรวจสอบว่า Role ใน Sheet ตรงกับที่เลือกหน้าแรกหรือไม่
        if(res.role !== selectedRole) {
            Swal.fire('ผิดพลาด', `บัญชีนี้ไม่ใช่สิทธิ์ ${selectedRole === 'Student' ? 'นักเรียน' : 'ผู้สอน'}`, 'warning');
            return;
        }
        
        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        initApp();
    } else {
        Swal.fire('Error', 'ชื่อผู้ใช้หรือรหัสผ่านผิด', 'error');
    }
}

let currentSelectedRole = ""; // เก็บค่าว่าตอนนี้เลือกเป็นใคร

function selectRole(role) {
    currentSelectedRole = role;
    document.getElementById('role-view').classList.add('d-none'); // ซ่อนหน้าแรก
    document.getElementById('login-view').style.display = 'block'; // โชว์หน้า login
    
    // แสดงป้ายบอกสถานะที่เลือก
    const badge = document.getElementById('role-badge');
    badge.innerText = (role === 'Student') ? "สถานะ: นักเรียน" : "สถานะ: ผู้สอน";
    badge.className = (role === 'Student') ? "badge rounded-pill bg-info text-white px-3" : "badge rounded-pill bg-warning text-dark px-3";
}

function backToRole() {
    document.getElementById('role-view').classList.remove('d-none');
    document.getElementById('login-view').style.display = 'none';
    currentSelectedRole = "";
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if(!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
    }

    const res = await apiCall({ action: 'login', user, pass });

    if(res.success) {
        // ตรวจสอบว่าสิทธิ์ในฐานข้อมูล ตรงกับที่เลือกจากหน้าแรกหรือไม่
        if(res.role !== currentSelectedRole) {
            Swal.fire('เข้าสู่ระบบไม่ได้', `บัญชีนี้ไม่มีสิทธิ์ใช้งานในฐานะ ${currentSelectedRole === 'Student' ? 'นักเรียน' : 'ผู้สอน'}`, 'error');
            return;
        }

        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';
        renderMenu(); // ฟังก์ชันสร้างปุ่มเมนู Card ที่เคยเขียนไว้
    } else {
        Swal.fire('ล้มเหลว', 'Username หรือ Password ไม่ถูกต้อง', 'error');
    }
}
