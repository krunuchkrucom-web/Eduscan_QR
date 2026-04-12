const API_URL = "https://script.google.com/macros/s/AKfycbzzyo9foeyhXfOrqmLEW6-wgLAyArbdSTk37yxfhqrxNPSjt1huu3K6QU96QDW8TXcMmw/exec";
let currentRoom = "";

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
window.onload = async () => {
    // 1. ตรวจสอบการ Login และแสดงชื่อ/รูปครู
    const auth = JSON.parse(localStorage.getItem('auth')) || { name: 'admin' };
    document.getElementById('teacher-name').innerText = auth.name;
    
    // 2. โหลดปุ่มห้องเรียนจาก Google Sheets
    await loadRooms();
};

// ฟังก์ชันดึงห้องเรียนมาสร้างปุ่ม
async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}?action=getRooms`);
        const rooms = await response.json();
        const area = document.getElementById('room-selection-area');
        
        area.innerHTML = rooms.map(room => `
            <div class="col-md-3">
                <button class="btn ${room.color || 'btn-primary'} w-100 p-3 rounded-4 shadow-sm fw-bold border-0 text-white" 
                        onclick="selectRoom('${room.name}')">
                    ${room.name}<br><small class="fw-normal">${room.studentCount || 0} คน</small>
                </button>
            </div>
        `).join('');
    } catch (err) { console.error("โหลดห้องเรียนไม่สำเร็จ", err); }
}

// ฟังก์ชันเมื่อกดเลือกห้องเรียน
async function selectRoom(roomName) {
    currentRoom = roomName;
    document.getElementById('current-room-display').innerText = roomName;
    
    // แสดงสถานะกำลังโหลดในตาราง
    const tbody = document.getElementById('student-list-table');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">กำลังโหลดข้อมูล...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}?action=getStudents&room=${roomName}`);
        const students = await response.json();
        
        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td><span class="badge bg-light text-muted rounded-pill">● ${s.status}</span></td>
                <td>
                    <button class="btn btn-link text-primary p-0 me-2" onclick="editStudent('${s.id}')"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-link text-danger p-0" onclick="deleteStudent('${s.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) { tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`; }
}

// ฟังก์ชันปุ่ม "เพิ่มนักเรียน"
function studentModal(mode) {
    if (!currentRoom) return Swal.fire('คำแนะนำ', 'โปรดเลือกห้องเรียนก่อนดำเนินการ', 'info');
    
    Swal.fire({
        title: 'เพิ่มนักเรียนใหม่',
        html: `
            <input id="swal-id" class="swal2-input" placeholder="รหัสนักเรียน">
            <input id="swal-name" class="swal2-input" placeholder="ชื่อ-นามสกุล">
        `,
        confirmButtonText: 'บันทึก',
        showCancelButton: true,
        preConfirm: () => {
            return {
                id: document.getElementById('swal-id').value,
                name: document.getElementById('swal-name').value
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            // ส่งข้อมูลไป Google Sheets
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'addStudent',
                    room: currentRoom,
                    ...result.value
                })
            });
            Swal.fire('สำเร็จ', 'เพิ่มข้อมูลแล้ว', 'success');
            selectRoom(currentRoom); // โหลดตารางใหม่
        }
    });
}
