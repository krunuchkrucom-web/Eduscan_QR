// ตั้งค่าเริ่มต้น
const API_URL = "https://script.google.com/macros/s/AKfycbw9f4HgvLHp7ypCrAdkBweVooDZETkI-yZUu4MxaCt_Z31q7HC8kyNrKLxB-bfav4xSgg/exec";
let currentRoom = "";

window.onload = () => {
    const auth = JSON.parse(localStorage.getItem('auth'));
    if (!auth) window.location.href = 'index.html';
    document.getElementById('teacher-name-display').innerText = auth.name;
    showDashboard();
};

// 1. หน้าจัดการนักเรียนหลัก
function showDashboard() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-4"><div class="card p-3 border-0 shadow-sm rounded-4 bg-primary text-white card-action" onclick="startScan()"><i class="fa-solid fa-camera mb-2"></i> สแกนเข้าเรียน</div></div>
            <div class="col-md-4"><div class="card p-3 border-0 shadow-sm rounded-4 bg-success text-white card-action" onclick="openStudentModal('add')"><i class="fa-solid fa-user-plus mb-2"></i> เพิ่มนักเรียน</div></div>
            <div class="col-md-4"><div class="card p-3 border-0 shadow-sm rounded-4 bg-info text-white card-action"><i class="fa-solid fa-file-alt mb-2"></i> ดูรายงาน</div></div>
        </div>

        <div class="row">
            <div class="col-lg-8">
                <div class="d-flex justify-content-between mb-3 align-items-center">
                    <h6 class="fw-bold mb-0">เลือกห้องเรียน</h6>
                    <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="manageRoom()">+ เพิ่มห้องเรียน</button>
                </div>
                <div class="row g-2 mb-4" id="room-list">
                    <div class="col-md-3"><button class="btn btn-white shadow-sm w-100 py-3 rounded-4 btn-room" onclick="selectRoom('ปวช.1/1')">ปวช.1/1</button></div>
                    <div class="col-md-3"><button class="btn btn-white shadow-sm w-100 py-3 rounded-4 btn-room" onclick="selectRoom('ปวช.1/2')">ปวช.1/2</button></div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">ห้องเรียน: <span id="room-title">-</span></h5>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary px-3" onclick="startScan()">สแกน</button>
                            <button class="btn btn-sm btn-success px-3" onclick="openStudentModal('add')">เพิ่ม</button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead class="table-light">
                                <tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>สถานะ</th><th>จัดการ</th></tr>
                            </thead>
                            <tbody id="student-data-table">
                                <tr><td colspan="4" class="text-center text-muted">กรุณาเลือกห้องเรียน</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 p-4 mb-3">
                    <h6 class="fw-bold">สรุปภาพรวมวันนี้</h6>
                    <div class="text-center py-3">
                        <h2 class="text-primary fw-bold">158</h2>
                        <small class="text-muted">คนเข้าเรียนทั้งหมด</small>
                    </div>
                </div>
                <div class="card border-0 shadow-sm rounded-4 p-4">
                    <h6 class="fw-bold mb-3">กิจกรรมล่าสุด</h6>
                    <div id="recent-activity" class="small text-muted">ยังไม่มีกิจกรรม</div>
                </div>
            </div>
        </div>
    `;
}

// 2. ฟังก์ชันเลือกห้องเรียนและโหลดข้อมูลนักเรียน
async function selectRoom(room) {
    currentRoom = room;
    document.getElementById('room-title').innerText = room;
    // ปรับสีปุ่ม Active
    document.querySelectorAll('.btn-room').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // เรียกข้อมูลจาก Google Sheets
    const tableBody = document.getElementById('student-data-table');
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">กำลังโหลด...</td></tr>`;
    
    // ตรงนี้จะเป็นการ Fetch ข้อมูลนักเรียนที่กรองตาม Room จาก Sheets
}

// 3. ฟังก์ชันเพิ่ม/แก้ไขนักเรียน (CRUD)
function openStudentModal(mode, data = null) {
    if(!currentRoom) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกห้องเรียนก่อน', 'warning');
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    document.getElementById('modalTitle').innerText = mode === 'add' ? 'เพิ่มนักเรียนใหม่' : 'แก้ไขข้อมูล';
    modal.show();
}

async function saveStudent() {
    const id = document.getElementById('m-id').value;
    const name = document.getElementById('m-name').value;
    // ส่งข้อมูลไป Apps Script เพื่อ appendRow หรือ updateRow ในแท็บ Students
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
