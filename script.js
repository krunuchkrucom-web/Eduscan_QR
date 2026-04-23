const API_URL = "https://script.google.com/macros/s/AKfycbxt5rndbk6Gw4d-opv4CHRRliB6K84awMxtSPJm5qTr5yPhjdZhllISfrR-zGlV3Tsgsw/exec";
let currentSelectedRole = ""; 

function selectRole(role) {
    currentSelectedRole = role; // 'Student' หรือ 'Teacher'
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

async function handleLogin() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (!user || !pass) {
        Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
    }
    
    document.getElementById('loader').style.display = 'flex';
    
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'login', user: user, pass: pass }) 
        });
        const json = await response.json();
        
        document.getElementById('loader').style.display = 'none';
        
        if (json.success) {
            // เช็คตัวพิมพ์ใหญ่-เล็กให้ตรงกับใน Google Sheets
            if (json.role.toLowerCase() !== currentSelectedRole.toLowerCase()) {
                Swal.fire('ผิดพลาด', `บัญชีนี้ไม่ใช่สิทธิ์ ${currentSelectedRole}`, 'error');
                return;
            }
            
            localStorage.setItem('auth', JSON.stringify(json));
            
            if (json.role.toLowerCase() === 'teacher') {
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

// ฟังก์ชันสำหรับแสดงหน้าสแกน
function showScanner(element) {
    // 1. จัดการแถบเมนู (Sidebar) ให้ขึ้นสีไฮไลท์ที่เมนูที่เลือก
    if (element) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        element.classList.add('active');
    }
    
    // 2. เปลี่ยนหัวข้อบน Header ของหน้าเว็บ
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.innerText = "สแกนเข้าเรียนและส่งงานอัจฉริยะ";

    // 3. เปลี่ยนเนื้อหาในพื้นที่แสดงผลหลัก (content-area)
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="row g-4 animate__animated animate__fadeIn">
            <div class="col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                    <h6 class="fw-bold mb-3"><i class="fas fa-sliders-h me-2 text-primary"></i> ตั้งค่าโหมด</h6>
                    <div class="btn-group w-100 p-1 bg-light rounded-pill mb-4">
                        <button class="btn btn-primary rounded-pill btn-sm fw-bold" id="mode-att" onclick="switchScannerMode('attendance')">เช็คชื่อ</button>
                        <button class="btn btn-light rounded-pill btn-sm fw-bold" id="mode-ass" onclick="switchScannerMode('assignment')">ส่งงาน</button>
                    </div>
                    
                    <div id="assignment-settings" style="display:none;">
                        <div class="mb-3">
                            <label class="small fw-bold text-muted">ชื่อใบงาน/งานที่ส่ง</label>
                            <input type="text" id="task-name" class="form-control border-0 bg-light rounded-3" placeholder="ระบุชื่อใบงาน...">
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <label class="small fw-bold text-muted">คะแนน</label>
                                <input type="number" id="max-score" class="form-control border-0 bg-light rounded-3 text-center" value="10">
                            </div>
                            <div class="col-6">
                                <label class="small fw-bold text-muted">หมดเวลา</label>
                                <input type="time" class="form-control border-0 bg-light rounded-3">
                            </div>
                        </div>
                        <button class="btn btn-success w-100 mt-3 rounded-pill fw-bold btn-sm" onclick="updateTask()">อัพเดทข้อมูลงาน</button>
                    </div>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="card border-0 shadow-lg rounded-5 overflow-hidden bg-dark position-relative" style="aspect-ratio: 1/1;">
                    <div class="scanner-line"></div>
                    <div class="d-flex flex-column justify-content-center align-items-center h-100 text-white opacity-50">
                        <i class="fas fa-qrcode fa-4x mb-3"></i>
                        <p>วาง QR Code ให้ตรงกรอบ</p>
                    </div>
                </div>
                <div class="alert alert-info mt-3 rounded-4 border-0 shadow-sm d-flex align-items-center">
                    <div class="spinner-grow spinner-grow-sm me-3 text-primary"></div>
                    <span class="small">ระบบกำลังรอสัญญาณจากกล้อง...</span>
                </div>
            </div>

            <div class="col-lg-3">
                <div class="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="fw-bold m-0">สแกนล่าสุด</h6>
                        <span class="badge bg-primary-soft text-primary rounded-pill px-2">Live</span>
                    </div>
                    <div id="scan-log" class="overflow-auto" style="max-height: 400px;">
                        <div class="text-center py-5 text-muted small">ยังไม่มีข้อมูลการสแกน</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ฟังก์ชันสำหรับสลับโหมดในหน้าสแกน
function switchScannerMode(mode) {
    const btnAtt = document.getElementById('mode-att');
    const btnAss = document.getElementById('mode-ass');
    const settings = document.getElementById('assignment-settings');
    
    if(mode === 'assignment') {
        btnAss.classList.replace('btn-light', 'btn-primary');
        btnAtt.classList.replace('btn-primary', 'btn-light');
        settings.style.display = 'block';
    } else {
        btnAtt.classList.replace('btn-light', 'btn-primary');
        btnAss.classList.replace('btn-primary', 'btn-light');
        settings.style.display = 'none';
    }
}

// --- วางไว้บรรทัดสุดท้ายของไฟล์ script.js ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("ระบบพร้อมทำงาน...");
    
    // 1. ถ้าอยู่ในหน้า Dashboard (ที่มีส่วนแสดงห้องเรียน) ให้โหลดห้องเรียนทันที
    if (typeof loadRooms === "function") {
        loadRooms();
    }

    // 2. ตรวจสอบสถานะการ Login เบื้องต้น (ถ้ามีข้อมูลใน localStorage ให้ข้ามหน้าเลือกบทบาท)
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        document.getElementById('role-view').style.setProperty('display', 'none', 'important');
        document.getElementById('main-view').style.display = 'block';
        showDashboard(); 
    }
});
