const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;
let currentSelectedRole = ""; 

// --- 1. ระบบจัดการการเรียกใช้ API ---
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
        console.error(err);
        return { success: false };
    }
}

// --- 2. ระบบ Login และการเลือกสถานะ (ไม่กระทบหน้าแรก) ---
function selectRole(role) {
    currentSelectedRole = role;
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.display = 'block';
    
    const badge = document.getElementById('role-badge');
    if (badge) {
        badge.innerText = (role === 'Student') ? "สถานะ: นักเรียน" : "สถานะ: ผู้สอน";
        badge.className = (role === 'Student') ? "badge rounded-pill bg-info text-white px-3 py-2 shadow-sm" : "badge rounded-pill bg-warning text-dark px-3 py-2 shadow-sm";
    }
    
    const title = document.getElementById('login-title');
    if (title) title.innerText = (role === 'Student') ? "นักเรียน Login" : "ผู้สอน Login";
}

function backToRole() {
    document.getElementById('role-view').style.setProperty('display', 'flex', 'important');
    document.getElementById('login-view').style.display = 'none';
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
    }

    const res = await apiCall({ action: 'login', user, pass });

    if (res.success) {
        if (res.role !== currentSelectedRole) {
            Swal.fire('ผิดพลาด', `บัญชีนี้ไม่มีสิทธิ์ใช้งานในฐานะ ${currentSelectedRole}`, 'error');
            return;
        }
        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        initApp();
    } else {
        Swal.fire('ล้มเหลว', 'Username หรือ Password ไม่ถูกต้อง', 'error');
    }
}

// --- 3. ระบบแสดงผลหลัก (Main Dashboard) ---
// แก้ฟังก์ชัน initApp ของเดิม
function initApp() {
    if (!auth) return;
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    
    // ดึงชื่อครู/นักเรียนมาแสดงที่ Header ใหม่
    const userDisplay = document.getElementById('user-display-name');
    if(userDisplay) {
        userDisplay.innerHTML = `
            <span class="d-block fw-bold">${auth.role === 'Student' ? 'สวัสดี,' : 'ยินดีต้อนรับ'} ${auth.name}</span>
            <span class="text-muted extra-small">${auth.role === 'Student' ? 'รหัสนักเรียน: ' + auth.user : 'จัดการระบบ EduTrack QR'}</span>
        `;
    }
    
    renderMenu();
}

function renderMenu() {
    const area = document.getElementById('content-area');
    if (!area) return;

    if (auth.role === 'Student') {
        area.innerHTML = `
            <div class="card border-0 rounded-4 shadow-sm mb-4 bg-primary text-white">
                <div class="card-body p-4">
                    <h5 class="mb-1">สวัสดี, ${auth.name}</h5>
                    <p class="small mb-0 opacity-75">รหัสนักเรียน: ${auth.user}</p>
                </div>
            </div>
            <div id="menu-grid" class="row g-3">
                <div class="col-6">
                    <div class="card-menu bg-grad-blue p-4 text-center rounded-4 shadow-sm border" onclick="showAttendanceView()">
                        <div class="fs-2 mb-2">📅</div><div>เช็คชื่อเข้าเรียน</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card-menu bg-grad-green p-4 text-center rounded-4 shadow-sm border" onclick="showAssignmentView()">
                        <div class="fs-2 mb-2">📝</div><div>ใบงาน & ส่งงาน</div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="card-menu bg-grad-purple p-4 text-center rounded-4 shadow-sm border" onclick="showReportView()">
                        <div class="fs-2 mb-2">📊</div><div>รายงานผลคะแนน & ประวัติ</div>
                    </div>
                </div>
            </div>`;
    } else if (auth.role === 'Teacher') {
        // ส่วนครู: ฉีด HTML Dashboard เข้า content-area ทันที
        area.innerHTML = `
            <div class="row g-3 mb-4 text-white text-center">
                <div class="col-12 col-md-4">
                    <div class="card stat-card bg-grad-blue shadow-sm p-4">
                        <div class="fs-1 mb-2">📸</div>
                        <div class="fw-bold fs-5">สแกนเข้าเรียน</div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card stat-card bg-grad-green shadow-sm p-4">
                        <div class="fs-1 mb-2">👥</div>
                        <div class="fw-bold fs-5">ลงทะเบียนใหม่</div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card stat-card bg-grad-orange shadow-sm p-4">
                        <div class="fs-1 mb-2">📚</div>
                        <div class="fw-bold fs-5">จัดการรายวิชา</div>
                    </div>
                </div>
            </div>

            <div class="card border-0 rounded-4 shadow-sm p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold text-dark mb-0">เลือกห้องเรียน</h5>
                    <div class="btn-group extra-small">
                        <button class="btn btn-outline-primary btn-sm rounded-pill px-3 active" onclick="loadClassData('CS101', this)">วิทยาการคำนวณ</button>
                    </div>
                </div>

                <div class="row g-2 mb-4 text-white extra-small" id="class-list-area">
                    <div class="col-4 col-md-2">
                        <button class="btn btn-primary class-btn w-100 rounded-3 shadow-sm py-2" onclick="loadClassRoom('ปวช1/1', this)">ปวช1/1</button>
                    </div>
                    </div>

                <h6 class="fw-bold mb-3 text-muted">รายชื่อนักเรียนในห้อง: <span class="text-dark" id="current-class-view">กรุณาเลือกห้องเรียน</span></h6>
                <div class="table-responsive">
                    <table class="table table-hover table-striped align-middle small table-sm">
                        <thead class="table-light text-muted">
                            <tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>USERNAME</th><th>สถานะ</th></tr>
                        </thead>
                        <tbody id="student-list-area">
                            <tr><td class="text-muted extra-small" colspan="4">กำลังโหลดข้อมูล...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
}

// --- 4. ฟังก์ชันควบคุมหน้าย่อย (Sub-page) ---
function openSubPage(title) {
    const menuGrid = document.getElementById('menu-grid');
    const subContainer = document.getElementById('sub-page-container');
    if (menuGrid) menuGrid.style.display = 'none';
    if (subContainer) {
        subContainer.style.display = 'block';
        document.getElementById('sub-page-title').innerText = title;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeSubPage() {
    const menuGrid = document.getElementById('menu-grid');
    const subContainer = document.getElementById('sub-page-container');
    if (menuGrid) menuGrid.style.display = 'flex';
    if (subContainer) subContainer.style.display = 'none';
    const content = document.getElementById('sub-page-content');
    if (content) content.innerHTML = '';
}

// --- 5. ฟังก์ชันแสดงเนื้อหาแต่ละหน้า (Content Generators) ---
function showAttendanceView() {
    openSubPage("เช็คชื่อ & ประวัติการเข้าเรียน");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="text-center mb-4"><button class="btn btn-primary btn-lg rounded-pill shadow" onclick="startQRScanner()">📸 สแกน QR เช็คชื่อ</button></div>
        <h6 class="fw-bold mb-3 small">ประวัติเข้าเรียนล่าสุด</h6>
        <div class="table-responsive"><table class="table table-sm small">
            <thead class="table-light text-muted"><tr><th>วันที่</th><th>เวลา</th><th>สถานะ</th></tr></thead>
            <tbody><tr><td>11/04/2026</td><td>08:30</td><td><span class="badge bg-success">มาเรียน</span></td></tr></tbody>
        </table></div>`;
}

function showAssignmentView() {
    openSubPage("ใบงาน & แบบฝึกหัด");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="card border-0 bg-light p-3 mb-3">
            <div class="fw-bold small">ใบงานที่ 1: พื้นฐานคอมพิวเตอร์</div>
            <div class="text-muted extra-small mb-2">กำหนดส่ง: 15 เม.ย. 2569</div>
            <input type="file" class="form-control form-control-sm mb-2" accept=".pdf,.jpg">
            <button class="btn btn-sm btn-primary w-100 rounded-pill" onclick="uploadFile()">ส่งงาน</button>
        </div>`;
}

function showReportDashboard() {
    openSubPage("รายงานและสรุปผล");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="row g-2 mb-3">
            <div class="col-6"><button class="btn btn-outline-success w-100 btn-sm" onclick="exportToExcel()">Excel</button></div>
            <div class="col-6"><button class="btn btn-outline-danger w-100 btn-sm" onclick="exportToPDF()">PDF</button></div>
        </div>
        <div class="p-3 bg-light rounded-3 text-center small">เลือกวิชาหรือนักเรียนเพื่อดูสรุปผลมาเรียนรายวัน/เดือน</div>`;
}

// เพิ่มเติมสำหรับครู (โครงสร้างเบื้องต้น)
function showSubjectManager() { openSubPage("จัดการรายวิชา"); document.getElementById('sub-page-content').innerHTML = '<p class="text-center py-5">ระบบจัดการรายวิชา...</p>'; }
function showStudentManager() { openSubPage("ข้อมูลนักเรียน"); document.getElementById('sub-page-content').innerHTML = '<p class="text-center py-5">ระบบจัดการข้อมูลนักเรียน...</p>'; }
function showAssignmentManager() { openSubPage("ใบงาน & คะแนน"); document.getElementById('sub-page-content').innerHTML = '<p class="text-center py-5">ระบบจัดการใบงาน...</p>'; }
function showTeacherAttendance() { openSubPage("สแกนเช็คชื่อ"); document.getElementById('sub-page-content').innerHTML = '<div id="reader"></div>'; }
function showScanWork() { openSubPage("สแกนตรวจงาน"); document.getElementById('sub-page-content').innerHTML = '<div id="reader-work"></div>'; }

function logout() { localStorage.clear(); location.reload(); }
window.onload = initApp;

    // ฟังก์ชันสำหรับสลับ Sidebar ยุบ/ขยาย
function toggleSidebar() {
    const sidebar = document.getElementById('teacher-sidebar');
    if(sidebar) sidebar.classList.toggle('toggled');
}

// ฟังก์ชันโหลดรายชื่อห้องเรียนจริงจาก Subjects
function loadTeacherSubjects() {
    const ss = SpreadsheetApp.openById(SS_ID);
    // ... โค้ดดึงข้อมูล Subjects และ Students มาจัดกลุ่มตามห้อง
}

// ฟังก์ชันเปลี่ยนหน้าย่อยฝั่งครู
function showDashboard(el) { openSubPage老师('จัดการชั้นเรียน', el); renderMenu(); }
function showCreateQR(el) { openSubPage老师('สร้าง QR Code', el); document.getElementById('content-area').innerHTML = 'หน้าสร้าง QR'; }
function showHistory(el) { openSubPage老师('ประวัติมาเรียน', el); document.getElementById('content-area').innerHTML = 'หน้าประวัติ'; }
function showTeacherSetting(el) { openSubPage老师('ตั้งค่าระบบ', el); document.getElementById('content-area').innerHTML = 'หน้าตั้งค่า'; }

// ฟังก์ชันเปิดหน้าย่อยฝั่งครู และ ไฮไลท์เมนู
function openSubPage老师(title, el) {
    document.getElementById('teacher-content').querySelector('.navbar-brand').innerText = title;
    const sidebar = document.getElementById('teacher-sidebar');
    if(sidebar){
        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'text-primary');
            link.classList.add('text-muted');
        });
        el.classList.add('active', 'text-primary');
        el.classList.remove('text-muted');
    }
}
