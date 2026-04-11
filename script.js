const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;
let currentSelectedRole = ""; 

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

function initApp() {
    if (!auth) return;
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
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

            <div class="row g-3">
                <div class="col-6">
                    <div class="card-menu bg-grad-blue" onclick="showAttendanceView()">
                        <div class="fs-2 mb-2">📅</div>
                        <div>เช็คชื่อเข้าเรียน</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card-menu bg-grad-green" onclick="showAssignmentView()">
                        <div class="fs-2 mb-2">📝</div>
                        <div>ใบงาน & ส่งงาน</div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="card-menu bg-grad-purple" onclick="showReportView()">
                        <div class="fs-2 mb-2">📊</div>
                        <div>รายงานผลคะแนน & ประวัติ</div>
                    </div>
                </div>
            </div>

            <div id="sub-page-container" class="mt-4" style="display:none;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 id="sub-page-title" class="fw-bold mb-0">รายละเอียด</h5>
                    <button class="btn btn-sm btn-light rounded-pill" onclick="closeSubPage()">ปิด X</button>
                </div>
                <div id="sub-page-content" class="bg-white rounded-4 shadow-sm p-3"></div>
            </div>`;
    } else {
        if (auth.role === 'Teacher') {
        area.innerHTML = `
            <div class="card border-0 rounded-4 shadow-sm mb-4 bg-grad-orange text-white">
                <div class="card-body p-4 text-center">
                    <h5 class="mb-1">ยินดีต้อนรับคุณครู ${auth.name}</h5>
                    <p class="small mb-0 opacity-75">จัดการระบบ EduTrack QR</p>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showTeacherAttendance()">
                        <div class="fs-2 mb-2">📸</div>
                        <div class="fw-bold text-dark">สแกนเช็คชื่อ</div>
                    </div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showSubjectManager()">
                        <div class="fs-2 mb-2">📚</div>
                        <div class="fw-bold text-dark">จัดการรายวิชา</div>
                    </div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showStudentManager()">
                        <div class="fs-2 mb-2">👥</div>
                        <div class="fw-bold text-dark">ข้อมูลนักเรียน</div>
                    </div>
                </div>

                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showAssignmentManager()">
                        <div class="fs-2 mb-2">📝</div>
                        <div class="fw-bold text-dark">ใบงาน/แบบทดสอบ</div>
                    </div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showScanWork()">
                        <div class="fs-2 mb-2">🎯</div>
                        <div class="fw-bold text-dark">สแกนตรวจงาน</div>
                    </div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="card-menu bg-white border shadow-sm" onclick="showReportDashboard()">
                        <div class="fs-2 mb-2">📈</div>
                        <div class="fw-bold text-dark">สรุปผล & Export</div>
                    </div>
                </div>
            </div>

            <div id="sub-page-container" class="mt-4" style="display:none;">
                <div class="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded-3">
                    <h5 id="sub-page-title" class="fw-bold mb-0 text-primary">หัวข้อการจัดการ</h5>
                    <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="closeSubPage()">ปิด</button>
                </div>
                <div id="sub-page-content" class="bg-white rounded-4 shadow-sm p-3 border"></div>
            </div>`;
    }
}
    }
}

function logout() { 
    localStorage.clear(); 
    location.reload(); 
}

window.onload = initApp;
