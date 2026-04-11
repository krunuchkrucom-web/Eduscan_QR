const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;
let currentSelectedRole = ""; 

// --- 1. ระบบ API ---
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
        console.error("API Error:", err);
        return { success: false };
    }
}

// --- 2. ระบบ Login ---
function selectRole(role) {
    currentSelectedRole = role;
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.setProperty('display', 'flex', 'important'); // ใช้ flex เพื่อให้ปุ่มอยู่กลาง
    
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
    document.getElementById('login-view').style.setProperty('display', 'none', 'important');
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
            Swal.fire('ผิดพลาด', `บัญชีนี้ไม่มีสิทธิ์ใช้งานในฐานะ ${currentSelectedRole}`, 'error');
            return;
        }
        auth = res;
        localStorage.setItem('auth', JSON.stringify(res));
        initApp();
    } else {
        Swal.fire('ล้มเหลว', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
}

// --- 3. ระบบแสดงผล Dashboard ---
function initApp() {
    if (!auth) return;
    
    // ซ่อนหน้าจอเลือกบทบาทและ Login
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.setProperty('display', 'none', 'important');
    document.getElementById('main-view').style.display = 'block';
    
    // ตั้งค่า Mode สำหรับ CSS
    if (auth.role === 'Student') {
        document.getElementById('app').classList.add('student-mode');
    } else {
        document.getElementById('app').classList.remove('student-mode');
    }

    const userDisplay = document.getElementById('user-display-name');
    if(userDisplay) {
        userDisplay.innerHTML = `
            <span class="d-block fw-bold">${auth.name}</span>
            <span class="text-muted extra-small">${auth.role === 'Teacher' ? 'Teacher' : 'Student ID: ' + auth.user}</span>
        `;
    }
    renderMenu();
}

function renderMenu() {
    const area = document.getElementById('content-area');
    if (!area) return;

    if (auth.role === 'Student') {
        area.innerHTML = `
            <div id="menu-grid" class="row g-3">
                <div class="col-6"><div class="card-menu bg-grad-blue p-4 text-center rounded-4 text-white shadow-sm" onclick="showAttendanceView()">📅 เช็คชื่อเข้าเรียน</div></div>
                <div class="col-6"><div class="card-menu bg-grad-green p-4 text-center rounded-4 text-white shadow-sm" onclick="showAssignmentView()">📝 ใบงาน & ส่งงาน</div></div>
                <div class="col-12"><div class="card-menu bg-grad-purple p-4 text-center rounded-4 text-white shadow-sm" onclick="showReportDashboard()">📊 รายงานผลคะแนน</div></div>
            </div>
            <div id="sub-page-container" style="display:none;" class="mt-3">
                <div class="d-flex justify-content-between mb-2"><h5 id="sub-page-title"></h5><button class="btn btn-sm btn-light" onclick="closeSubPage()">ปิด X</button></div>
                <div id="sub-page-content" class="p-3 bg-white rounded-4 border"></div>
            </div>`;
    } else if (auth.role === 'Teacher') {
        area.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="stat-card-v2 bg-light-blue p-3 d-flex align-items-center" onclick="showCreateQR()">
                        <div class="icon-box bg-primary text-white p-3 rounded-4 me-3">📸</div>
                        <div><h6 class="mb-0 fw-bold">สแกนเข้าเรียน</h6><small>เริ่มสแกน QR Code</small></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card-v2 bg-light-green p-3 d-flex align-items-center">
                        <div class="icon-box bg-success text-white p-3 rounded-4 me-3">👤</div>
                        <div><h6 class="mb-0 fw-bold">เพิ่มนักเรียน</h6><small>ลงทะเบียนนักเรียนใหม่</small></div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card-v2 bg-light-purple p-3 d-flex align-items-center" onclick="showHistory()">
                        <div class="icon-box bg-purple text-white p-3 rounded-4 me-3" style="background:#7c3aed;">📊</div>
                        <div><h6 class="mb-0 fw-bold">ดูรายงาน</h6><small>สรุปข้อมูลการเข้าเรียน</small></div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="summary-box mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold mb-0">เลือกห้องเรียน</h5>
                            <button class="btn btn-sm btn-outline-primary">+ เพิ่มห้องเรียน</button>
                        </div>
                        <div class="d-flex gap-2 flex-wrap mb-4">
                            <button class="class-pill active p-3 bg-grad-blue" onclick="loadClassRoom('ปวช.1/1', this)">ปวช.1/1<br><small>32 คน</small></button>
                            <button class="class-pill p-3 bg-grad-green" onclick="loadClassRoom('ปวช.1/2', this)">ปวช.1/2<br><small>28 คน</small></button>
                            <button class="class-pill p-3" style="background:#f59e0b" onclick="loadClassRoom('ปวช.3/5', this)">ปวช.3/5<br><small>30 คน</small></button>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold">ห้องเรียน: <span id="current-class-view" class="text-primary">ปวช.1/1</span></h6>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary">📸 สแกนเข้าเรียน</button>
                                <button class="btn btn-sm btn-success">+ เพิ่มนักเรียน</button>
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>รหัสนักเรียน</th>
                                        <th>ชื่อ-นามสกุล</th>
                                        <th>USERNAME</th>
                                        <th>สถานะ</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody id="student-list-area">
                                    </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="summary-box">
                                <h6 class="fw-bold mb-3">📸 สแกนเข้าเรียน</h6>
                                <div class="bg-dark rounded-4 mb-3 d-flex align-items-center justify-content-center" style="height:200px;">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=S002" width="120">
                                </div>
                                <div class="text-center">
                                    <p class="mb-1 fw-bold">นายสมศักดิ์ มีเกียรติ (S002)</p>
                                    <div class="d-flex justify-content-center gap-2">
                                        <button class="btn btn-sm btn-success px-3">มา</button>
                                        <button class="btn btn-sm btn-warning px-3">สาย</button>
                                        <button class="btn btn-sm btn-danger px-3">ขาด</button>
                                        <button class="btn btn-sm btn-primary px-3">ลา</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="summary-box">
                                <h6 class="fw-bold mb-3">🎫 สร้าง QR Code</h6>
                                <div class="row g-2 overflow-auto" style="max-height: 250px;">
                                    <div class="col-6"><div class="qr-card"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=S001"><br><small>S001</small></div></div>
                                    <div class="col-6"><div class="qr-card"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=S002"><br><small>S002</small></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="summary-box mb-4">
                        <h6 class="fw-bold mb-3">สรุปภาพรวมวันนี้</h6>
                        <div class="text-center mb-3">
                            <div class="position-relative d-inline-block">
                                <h2 class="position-absolute top-50 start-50 translate-middle fw-bold mb-0">158</h2>
                                <canvas id="chart-summary" width="150" height="150"></canvas>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li class="d-flex justify-content-between mb-2"><span><i class="status-dot dot-present"></i> มาเรียน</span> <b>132 (83.5%)</b></li>
                            <li class="d-flex justify-content-between mb-2"><span><i class="status-dot dot-late"></i> สาย</span> <b>12 (7.6%)</b></li>
                            <li class="d-flex justify-content-between mb-2"><span><i class="status-dot dot-absent"></i> ขาด</span> <b>8 (5.1%)</b></li>
                            <li class="d-flex justify-content-between"><span><i class="status-dot dot-leave"></i> ลา</span> <b>6 (3.8%)</b></li>
                        </ul>
                    </div>

                    <div class="summary-box">
                        <h6 class="fw-bold mb-3">กิจกรรมล่าสุด</h6>
                        <div class="small">
                            <div class="d-flex mb-3">
                                <div class="me-3 text-success">📸</div>
                                <div><p class="mb-0 fw-bold">สแกนเข้าเรียน</p><small class="text-muted">นายสมศักดิ์ มีเกียรติ - 08:15</small></div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="me-3 text-primary">👤</div>
                                <div><p class="mb-0 fw-bold">เพิ่มนักเรียน</p><small class="text-muted">รหัส S033 - 10:30</small></div>
                            </div>
                            <button class="btn btn-light btn-sm w-100 rounded-pill">ดูทั้งหมด →</button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        // หลังจากโหลด HTML เสร็จ ให้ดึงข้อมูลนักเรียนห้องแรก
        loadClassRoom('ปวช.1/1', document.querySelector('.class-pill'));
    }
}


// --- 4. ฟังก์ชันเสริมต่างๆ ---
async function loadClassRoom(className, btnEl) {
    document.querySelectorAll('.class-btn').forEach(btn => btn.classList.replace('btn-primary', 'btn-outline-primary'));
    btnEl.classList.replace('btn-outline-primary', 'btn-primary');
    document.getElementById('current-class-view').innerText = className;
    const tableBody = document.getElementById('student-list-area');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">กำลังดึงข้อมูล...</td></tr>';
    
    const res = await apiCall({ action: 'getStudents', room: className });
    if (res.success && res.data) {
        tableBody.innerHTML = res.data.map(std => `
            <tr><td>${std.id}</td><td>${std.name}</td>
            <td><span class="badge bg-light text-dark border">${std.user}</span></td>
            <td><span class="${std.status === 'มาเรียน' ? 'text-success' : 'text-danger'}">● ${std.status}</span></td></tr>`).join('');
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">ไม่พบข้อมูลในห้องนี้</td></tr>';
    }
}

function showDashboard(el) { updateHeader("จัดการชั้นเรียน", el); renderMenu(); }
function showCreateQR(el) { updateHeader("สร้าง QR Code", el); document.getElementById('content-area').innerHTML = '<div class="card p-5 text-center shadow-sm"><h5>ระบบสร้าง/สแกน QR Code</h5></div>'; }
function showHistory(el) { updateHeader("ประวัติมาเรียน", el); document.getElementById('content-area').innerHTML = '<div class="card p-5 text-center shadow-sm"><h5>รายงานสรุปข้อมูล</h5></div>'; }

function updateHeader(title, el) {
    document.getElementById('header-title').innerText = title;
    if(el) {
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active', 'text-primary'));
        el.classList.add('active', 'text-primary');
    }
}

function toggleSidebar() { document.getElementById('teacher-sidebar').classList.toggle('d-none'); }
function logout() { localStorage.clear(); location.reload(); }

// รันระบบเมื่อเปิดหน้าเว็บ
window.onload = () => { if(auth) initApp(); };
