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

// --- 2. ระบบ Login (คงเดิมเพื่อไม่ให้กระทบหน้าแรก) ---
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

// --- 3. ระบบ Dashboard (แสดงผลตามภาพที่ 2) ---
function initApp() {
    if (!auth) return;
    document.getElementById('role-view').style.setProperty('display', 'none', 'important');
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    
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
            <div id="menu-grid" class="row g-3">
                <div class="col-6"><div class="card-menu bg-grad-blue p-4 text-center rounded-4 shadow-sm border" onclick="showAttendanceView()">📅 เช็คชื่อเข้าเรียน</div></div>
                <div class="col-6"><div class="card-menu bg-grad-green p-4 text-center rounded-4 shadow-sm border" onclick="showAssignmentView()">📝 ใบงาน & ส่งงาน</div></div>
                <div class="col-12"><div class="card-menu bg-grad-purple p-4 text-center rounded-4 shadow-sm border" onclick="showReportDashboard()">📊 รายงานผลคะแนน</div></div>
            </div>
            <div id="sub-page-container" style="display:none;" class="mt-3">
                <div class="d-flex justify-content-between mb-2"><h5 id="sub-page-title"></h5><button class="btn btn-sm btn-light" onclick="closeSubPage()">ปิด X</button></div>
                <div id="sub-page-content" class="p-3 bg-white rounded-4 border"></div>
            </div>`;
    } } else if (auth.role === 'Teacher') {
    area.innerHTML = `
        <div class="row g-3 mb-4 text-white">
            <div class="col-md-4">
                <div class="card stat-card bg-grad-blue p-4 shadow-sm" onclick="showTeacherAttendance()">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><h5 class="mb-0">สแกนเข้าเรียน</h5><small>เริ่มสแกน QR Code</small></div>
                        <div class="fs-1">📸</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card bg-grad-green p-4 shadow-sm" onclick="showStudentManager()">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><h5 class="mb-0">เพิ่มนักเรียน</h5><small>ลงทะเบียนนักเรียนใหม่</small></div>
                        <div class="fs-1">👥</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card bg-grad-purple p-4 shadow-sm" onclick="showHistory()">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><h5 class="mb-0">ดูรายงาน</h5><small>สรุปข้อมูลการเข้าเรียน</small></div>
                        <div class="fs-1">📊</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 rounded-4 shadow-sm p-4 mb-4">
            <h5 class="fw-bold mb-3">เลือกห้องเรียน</h5>
            <div class="d-flex gap-2 flex-wrap mb-4" id="class-list-area">
                <button class="btn btn-primary class-btn rounded-3 px-4" onclick="loadClassRoom('ปวช.1/1', this)">ปวช.1/1</button>
                <button class="btn btn-outline-primary class-btn rounded-3 px-4" onclick="loadClassRoom('ปวช.1/2', this)">ปวช.1/2</button>
                <button class="btn btn-outline-primary class-btn rounded-3 px-4" onclick="loadClassRoom('ปวส.2/1', this)">ปวส.2/1</button>
            </div>

            <h6 class="fw-bold text-muted mb-3">ห้องเรียน: <span id="current-class-view" class="text-primary">ปวช.1/1</span></h6>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>USERNAME</th><th>สถานะ</th></tr>
                    </thead>
                    <tbody id="student-list-area">
                        </tbody>
                </table>
            </div>
        </div>
    `;
    // โหลดข้อมูลเริ่มต้น
    const firstBtn = document.querySelector('.class-btn');
    if(firstBtn) loadClassRoom('ปวช.1/1', firstBtn);
}
}

// --- 4. ฟังก์ชันจัดการ Sidebar และหน้าย่อย (Teacher Only) ---
function toggleSidebar() {
    const sidebar = document.getElementById('teacher-sidebar');
    if(sidebar) sidebar.classList.toggle('toggled');
}

// ฟังก์ชันเปลี่ยนหน้าสำหรับครู (รับพารามิเตอร์ el เพื่อไฮไลท์เมนู)
function showDashboard(el) {
    updateSidebarUI(el, "จัดการชั้นเรียน");
    renderMenu();
}

function showCreateQR(el) {
    updateSidebarUI(el, "สร้าง QR Code");
    document.getElementById('content-area').innerHTML = '<div class="card p-5 text-center shadow-sm rounded-4"><h5>เครื่องมือสร้าง QR Code สำหรับนักเรียน</h5><p class="text-muted">กำลังพัฒนาส่วนนี้...</p></div>';
}

function showHistory(el) {
    updateSidebarUI(el, "ประวัติการมาเรียน");
    document.getElementById('content-area').innerHTML = '<div class="card p-4 shadow-sm rounded-4"><h6>สรุปรายงานการมาเรียนรายเดือน</h6><hr><p>ตารางแสดงผล...</p></div>';
}

function updateSidebarUI(el, title) {
    // เปลี่ยนหัวข้อหน้า
    const brand = document.querySelector('.navbar-brand');
    if(brand) brand.innerText = title;
    
    // ไฮไลท์เมนูที่ถูกกด
    if(el) {
        document.querySelectorAll('#teacher-sidebar .nav-link').forEach(nav => {
            nav.classList.remove('active', 'text-primary');
            nav.classList.add('text-muted');
        });
        el.classList.add('active', 'text-primary');
        el.classList.remove('text-muted');
    }
}

// เพิ่มฟังก์ชันโหลดข้อมูลห้องเรียน
async function loadClassRoom(className, btnEl) {
    // ไฮไลท์ปุ่มที่เลือก
    document.querySelectorAll('.class-btn').forEach(btn => btn.classList.replace('btn-primary', 'btn-outline-primary'));
    btnEl.classList.replace('btn-outline-primary', 'btn-primary');
    
    document.getElementById('current-class-view').innerText = className;
    const tableBody = document.getElementById('student-list-area');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    // ดึงข้อมูลจาก Google Sheets (เรียก Action: 'getStudentsByClass' ที่คุณครูต้องไปเขียนเพิ่มใน Apps Script)
    const res = await apiCall({ action: 'getStudents', room: className });
    
    if (res.success && res.data) {
        tableBody.innerHTML = res.data.map(std => `
            <tr>
                <td>${std.id}</td>
                <td>${std.name}</td>
                <td><span class="badge bg-light text-dark border">${std.user}</span></td>
                <td><span class="${std.status === 'มาเรียน' ? 'text-success' : 'text-danger'}">● ${std.status}</span></td>
            </tr>
        `).join('');
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>';
    }
}

// --- 5. ฟังก์ชันสำหรับนักเรียน ---
function openSubPage(title) {
    document.getElementById('menu-grid').style.display = 'none';
    document.getElementById('sub-page-container').style.display = 'block';
    document.getElementById('sub-page-title').innerText = title;
}

function closeSubPage() {
    document.getElementById('menu-grid').style.display = 'flex';
    document.getElementById('sub-page-container').style.display = 'none';
}

function showAttendanceView() { openSubPage("เช็คชื่อเข้าเรียน"); document.getElementById('sub-page-content').innerHTML = '<div class="text-center">กล้องสแกน QR...</div>'; }
function showAssignmentView() { openSubPage("ส่งงาน"); document.getElementById('sub-page-content').innerHTML = '<input type="file" class="form-control">'; }
function showReportDashboard() { openSubPage("ผลคะแนน"); document.getElementById('sub-page-content').innerHTML = 'คะแนนรวม: 0'; }

// ฟังก์ชันอื่นๆ
function logout() { localStorage.clear(); location.reload(); }
window.onload = initApp;
