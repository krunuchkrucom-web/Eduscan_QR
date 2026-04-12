const API_URL = "https://script.google.com/macros/s/AKfycbwHV8K0Me5It_ePtkt4EhEnFPzypA6Rdpl-zmpU-vABr2fTeFYQGI8DZSppXSggnuPbtw/exec";
let auth = JSON.parse(localStorage.getItem('auth')) || null;

// --- 1. ระบบจัดการสถานะเริ่มต้น ---
window.onload = () => {
    if (auth) {
        initApp();
    } else {
        // หากไม่มีข้อมูล Login ให้กลับไปหน้าเลือกบทบาท
        document.getElementById('role-view').style.setProperty('display', 'flex', 'important');
        document.getElementById('login-view').style.setProperty('display', 'none', 'important');
        document.getElementById('main-view').style.display = 'none';
    }
};

// --- 2. ฟังก์ชันหลักในการรันแอป ---
function initApp() {
    if (!auth) return;

    // ซ่อนหน้า Login และแสดงหน้าหลัก
    document.getElementById('role-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';

    // แสดงชื่อผู้ใช้ (แก้ไขจุดที่ขึ้น undefined)
    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) {
        userDisplay.innerHTML = `
            <div class="fw-bold text-dark">${auth.name || 'ผู้ใช้งาน'}</div>
            <div class="text-muted small">${auth.role === 'Teacher' ? 'ครูผู้สอน' : 'นักเรียน: ' + (auth.user || '')}</div>
        `;
    }

    // จัดการ Sidebar ตามบทบาท
    const sidebar = document.getElementById('teacher-sidebar');
    if (auth.role === 'Student') {
        if (sidebar) sidebar.style.display = 'none';
        document.getElementById('main-content-area').style.width = '100%';
    }

    renderMenu();
}

// --- 3. ฟังก์ชัน Render หน้าจอตามรูปภาพที่คุณครูต้องการ ---
function renderMenu() {
    const area = document.getElementById('content-area');
    if (!area) return;

    if (auth.role === 'Teacher') {
        // โครงสร้าง Dashboard ครูแบบใหม่ตามรูปภาพ (ภาพที่ 4)
        area.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4"><div class="stat-card-v2 bg-light-blue p-3 d-flex align-items-center rounded-4 shadow-sm" onclick="showCreateQR()">
                    <div class="bg-primary text-white p-3 rounded-4 me-3">📸</div>
                    <div><h6 class="mb-0 fw-bold">สแกนเข้าเรียน</h6><small class="text-muted">เริ่มสแกน QR Code</small></div>
                </div></div>
                <div class="col-md-4"><div class="stat-card-v2 bg-light-green p-3 d-flex align-items-center rounded-4 shadow-sm">
                    <div class="bg-success text-white p-3 rounded-4 me-3">👤</div>
                    <div><h6 class="mb-0 fw-bold">เพิ่มนักเรียน</h6><small class="text-muted">ลงทะเบียนนักเรียนใหม่</small></div>
                </div></div>
                <div class="col-md-4"><div class="stat-card-v2 bg-light-purple p-3 d-flex align-items-center rounded-4 shadow-sm" onclick="showHistory()">
                    <div class="bg-warning text-white p-3 rounded-4 me-3">📊</div>
                    <div><h6 class="mb-0 fw-bold">ดูรายงาน</h6><small class="text-muted">สรุปข้อมูลการเข้าเรียน</small></div>
                </div></div>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="card border-0 rounded-5 shadow-sm p-4 mb-4">
                        <div class="d-flex justify-content-between mb-3">
                            <h5 class="fw-bold">เลือกห้องเรียน</h5>
                            <button class="btn btn-sm btn-outline-primary">+ เพิ่มห้องเรียน</button>
                        </div>
                        <div class="d-flex gap-2 flex-wrap mb-4">
                            <button class="btn btn-primary rounded-4 px-4 py-3" onclick="loadClassRoom('ปวช.1/1', this)">ปวช.1/1<br><small>32 คน</small></button>
                            <button class="btn btn-outline-secondary border-0 bg-light rounded-4 px-4 py-3" onclick="loadClassRoom('ปวช.1/2', this)">ปวช.1/2<br><small>28 คน</small></button>
                        </div>
                        <div id="student-list-container" class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light"><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                                <tbody id="student-list-area"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card border-0 rounded-5 shadow-sm p-4 mb-4">
                        <h6 class="fw-bold mb-3">สรุปภาพรวมวันนี้</h6>
                        <div class="text-center py-3">
                            <h2 class="fw-bold text-primary">158</h2>
                            <p class="text-muted">จำนวนนักเรียนทั้งหมด</p>
                        </div>
                    </div>
                </div>
            </div>`;
        loadClassRoom('ปวช.1/1'); 
    } else {
        // เมนูสำหรับนักเรียน
        area.innerHTML = `
            <div class="row g-3">
                <div class="col-12 col-md-6"><div class="card-menu bg-grad-blue p-4 text-center rounded-4 text-white shadow-sm" onclick="alert('กำลังพัฒนา')">📅 เช็คชื่อเข้าเรียน</div></div>
                <div class="col-12 col-md-6"><div class="card-menu bg-grad-green p-4 text-center rounded-4 text-white shadow-sm" onclick="alert('กำลังพัฒนา')">📝 ใบงาน & ส่งงาน</div></div>
            </div>`;
    }
}

// --- ฟังก์ชันเสริมอื่นๆ ---
function logout() {
    localStorage.removeItem('auth');
    location.reload();
}

async function apiCall(data) {
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        return await res.json();
    } catch (err) {
        console.error(err);
        return { success: false };
    }
}
