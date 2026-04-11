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

// 1. หน้าเช็คชื่อและประวัติการมาเรียน
function showAttendanceView() {
    openSubPage("เช็คชื่อ & ประวัติการเข้าเรียน");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="text-center mb-4">
            <button class="btn btn-primary btn-lg rounded-pill px-5 shadow" onclick="startQRScanner()">
                📸 สแกน QR เช็คชื่อ
            </button>
        </div>
        <h6 class="fw-bold mb-3">ประวัติการเข้าเรียนล่าสุด</h6>
        <div class="table-responsive">
            <table class="table table-sm small">
                <thead>
                    <tr class="table-light">
                        <th>วันที่</th>
                        <th>เวลา</th>
                        <th>สถานะ</th>
                    </tr>
                </thead>
                <tbody id="attendance-list">
                    <tr><td>11/04/2026</td><td>08:30</td><td><span class="badge bg-success">มาเรียน</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// 2. หน้าดูใบงานและส่งงาน (PDF/JPG)
function showAssignmentView() {
    openSubPage("ใบงาน & แบบฝึกหัด");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="list-group list-group-flush">
            <div class="list-group-item border-0 px-0 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold">ใบงานที่ 1: พื้นฐานคอมพิวเตอร์</div>
                        <div class="small text-muted">กำหนดส่ง: 15 เม.ย. 2569</div>
                    </div>
                    <span class="badge bg-warning text-dark">ยังไม่ได้ส่ง</span>
                </div>
                <div class="mt-2">
                    <input type="file" id="fileInput" class="form-control form-control-sm mb-2" accept=".pdf,.jpg,.jpeg">
                    <button class="btn btn-sm btn-outline-primary w-100 rounded-pill" onclick="uploadFile()">ส่งไฟล์งาน (.pdf / .jpg)</button>
                </div>
            </div>
        </div>
    `;
}

// 3. หน้าดูรายงานคะแนน
function showReportView() {
    openSubPage("รายงานคะแนนสะสม");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="p-3 bg-light rounded-3 mb-3 text-center">
            <div class="small text-muted">คะแนนรวมทั้งหมด</div>
            <div class="display-6 fw-bold text-primary">85 / 100</div>
        </div>
        <h6 class="fw-bold">รายละเอียดคะแนน</h6>
        <ul class="list-group list-group-flush small">
            <li class="list-group-item d-flex justify-content-between">
                <span>เช็คชื่อเข้าเรียน</span>
                <span class="fw-bold">20/20</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>ใบงานที่ 1</span>
                <span class="fw-bold">10/10</span>
            </li>
        </ul>
    `;
}

// ฟังก์ชันควบคุม UI
function openSubPage(title) {
    document.getElementById('sub-page-container').style.display = 'block';
    document.getElementById('sub-page-title').innerText = title;
    window.scrollTo({ top: document.getElementById('sub-page-container').offsetTop - 100, behavior: 'smooth' });
}

function closeSubPage() {
    document.getElementById('sub-page-container').style.display = 'none';
}

// --- 1. จัดการรายวิชา ---
function showSubjectManager() {
    openSubPage("จัดการรายวิชา (Subject Manager)");
    document.getElementById('sub-page-content').innerHTML = `
        <button class="btn btn-success btn-sm mb-3" onclick="addSubjectForm()">+ เพิ่มรายวิชาใหม่</button>
        <div class="table-responsive">
            <table class="table table-hover align-middle small">
                <thead class="table-light">
                    <tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>จัดการ</th></tr>
                </thead>
                <tbody id="subject-list">
                    </tbody>
            </table>
        </div>
    `;
}

// --- 2. จัดการใบงาน/แบบทดสอบ และคะแนน ---
function showAssignmentManager() {
    openSubPage("จัดการใบงาน & คะแนน");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="mb-4">
            <label class="form-label small fw-bold">เลือกรายวิชาเพื่อจัดการงาน:</label>
            <select class="form-select form-select-sm mb-3" onchange="loadAssignments(this.value)">
                <option value="">-- เลือกวิชา --</option>
                <option value="CS101">วิทยาการคำนวณ</option>
            </select>
        </div>
        <div id="assignment-list-area"></div>
    `;
}

// --- 3. รายงานสรุปผล และ Export ---
function showReportDashboard() {
    openSubPage("สรุปรายงานและการส่งออกข้อมูล");
    document.getElementById('sub-page-content').innerHTML = `
        <div class="row g-2 mb-4">
            <div class="col-6">
                <button class="btn btn-outline-success w-100 btn-sm" onclick="exportToExcel()">📊 Export to Excel</button>
            </div>
            <div class="col-6">
                <button class="btn btn-outline-danger w-100 btn-sm" onclick="exportToPDF()">📑 Export to PDF</button>
            </div>
        </div>
        <h6 class="fw-bold mb-3">สรุปเวลาเรียนรายบุคคล (รายเดือน)</h6>
        <div id="report-summary" class="small text-muted">เลือกนักเรียนเพื่อดูรายละเอียด...</div>
    `;
}

// ฟังก์ชันสแกน QR สำหรับครู (เช็คชื่อเข้าเรียน)
function showTeacherAttendance() {
    openSubPage("สแกนเช็คชื่อนักเรียน");
    document.getElementById('sub-page-content').innerHTML = `
        <div id="reader" style="width:100%"></div>
        <p class="text-center mt-3 text-muted small">วางคิวอาร์โค้ดของนักเรียนในกรอบเพื่อเช็คชื่อ</p>
    `;
    startScanner(); // เรียกใช้งาน html5-qrcode
}

// ฟังก์ชันเปิด/ปิดหน้าย่อย (เหมือนของนักเรียน)
function openSubPage(title) {
    document.getElementById('sub-page-container').style.display = 'block';
    document.getElementById('sub-page-title').innerText = title;
    window.scrollTo({ top: document.getElementById('sub-page-container').offsetTop - 50, behavior: 'smooth' });
}

function closeSubPage() {
    document.getElementById('sub-page-container').style.display = 'none';
}
// ฟังก์ชันสำหรับเปิดหน้าย่อย
function openSubPage(title) {
    document.getElementById('menu-grid').style.display = 'none'; // ซ่อนเมนูหลัก
    document.getElementById('sub-page-container').style.display = 'block'; // แสดงหน้าย่อย
    document.getElementById('sub-page-title').innerText = title;
    window.scrollTo(0,0);
}

// ฟังก์ชันสำหรับปิดหน้าย่อยกลับไปหน้าเมนู
function closeSubPage() {
    document.getElementById('menu-grid').style.display = 'block';
    document.getElementById('sub-page-container').style.display = 'none';
    document.getElementById('sub-page-content').innerHTML = ''; // ล้างขยะข้อมูลเดิม
}

function logout() { 
    localStorage.clear(); 
    location.reload(); 
}

window.onload = initApp;
