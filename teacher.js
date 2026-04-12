const API_URL = "https://script.google.com/macros/s/AKfycbwZJkpgBxv6bOBHGubmfvgA261GPamynMsjQjxTKWT-PV4M6NifU55Oh7wXIjfWtkvS_w/exec";
let currentRoom = "";

// โหลดข้อมูลเมื่อเปิดหน้า
window.onload = async () => {
    // แสดงชื่อครู "admin" หรือชื่อที่ Login มา
    const auth = JSON.parse(localStorage.getItem('auth')) || { name: 'admin' };
    document.getElementById('teacher-name-display').innerText = auth.name;
    loadRooms(); // โหลดปุ่มห้องเรียน
};

// 1. ฟังก์ชันโหลดปุ่มห้องเรียนพร้อมสี
async function loadRooms() {
    const response = await fetch(`${API_URL}?action=getRooms`);
    const rooms = await response.json();
    const area = document.getElementById('room-selection-area');
    
    // สร้างปุ่มห้องเรียนพร้อมสีตามที่กำหนดใน Sheet
    area.innerHTML = rooms.map(room => `
        <div class="col-md-3">
            <button class="btn btn-white shadow-sm w-100 py-3 rounded-4 btn-room ${room.color || ''}" onclick="selectRoom('${room.name}')">
                ${room.name}<br><small class="text-muted fw-normal">${room.studentCount} คน</small>
            </button>
        </div>
    `).join('');
}

// 2. ฟังก์ชันเมื่อคลิกเลือกห้องเรียน
async function selectRoom(roomName) {
    currentRoom = roomName;
    document.getElementById('current-room-display').innerText = roomName;
    
    // ปรับสีปุ่ม Active
    document.querySelectorAll('.btn-room').forEach(b => b.classList.remove('border-primary', 'border-2'));
    event.currentTarget.classList.add('border-primary', 'border-2');

    // โหลดตารางนักเรียนตามห้อง
    const tbody = document.getElementById('student-list-table');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">กำลังโหลดข้อมูล...</td></tr>`;

    const response = await fetch(`${API_URL}?action=getStudents&room=${roomName}`);
    const students = await response.json();
    
    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.num}</td>
            <td>${s.id}</td>
            <td><img src="${s.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" width="35" height="35" class="rounded-circle border"></td>
            <td>${s.name}</td>
            <td><span class="badge ${getStatusClass(s.status)} p-2 rounded-pill">● ${s.status}</span></td>
            <td>
                <button class="btn btn-link text-primary p-0 me-2" onclick="editStudent('${s.id}')"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-link text-danger p-0" onclick="deleteStudent('${s.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// 3. ฟังก์ชัน "เพิ่มนักเรียน" พร้อมป้องกันการกรอกชื่อผิด
function openStudentModal() {
    if (!currentRoom) return Swal.fire('คำแนะนำ', 'โปรดเลือกห้องเรียนก่อน', 'info');
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
}

// ตรวจสอบชื่อ-นามสกุลก่อนบันทึก
function validateAndSaveStudent() {
    const id = document.getElementById('m-id').value;
    const name = document.getElementById('m-name').value;
    
    // ตรวจสอบชื่อ: ห้ามมีตัวเลขหรือสัญลักษณ์
    const namePattern = /^[ก-๙a-zA-Z\s]+$/;
    if (!namePattern.test(name)) {
        Swal.fire('ข้อผิดพลาด', 'ชื่อ-นามสกุลต้องเป็นตัวอักษรเท่านั้น', 'error');
        return;
    }
    
    // ตรงนี้จะเป็นการ Fetch ส่งข้อมูลไป Apps Script
}

// 4. ฟังก์ชัน "เพิ่มห้องเรียน" พร้อมเลือกสี
function openRoomModal() {
    const modal = new bootstrap.Modal(document.getElementById('roomModal'));
    modal.show();
}

async function saveRoom() {
    const name = document.getElementById('r-name').value;
    const color = document.getElementById('r-color').value;
    // ส่งข้อมูลไป Apps Script เพื่อ appendRow ลง Subjects
}

function getStatusClass(status) {
    if(status === 'มาเรียน') return 'text-success bg-success bg-opacity-10';
    if(status === 'ขาด') return 'text-danger bg-danger bg-opacity-10';
    return 'text-muted bg-light';
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ฟังก์ชันบันทึกนักเรียน (เพิ่มจากของเดิมที่คุณครูเขียนค้างไว้)
async function validateAndSaveStudent() {
    const id = document.getElementById('m-id').value;
    const name = document.getElementById('m-name').value;
    const photo = document.getElementById('m-photo').value;
    
    const namePattern = /^[ก-๙a-zA-Z\s]+$/;
    if (!namePattern.test(name)) {
        return Swal.fire('ข้อผิดพลาด', 'ชื่อ-นามสกุลต้องเป็นตัวอักษรเท่านั้น', 'error');
    }

    Swal.showLoading();
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addStudent',
            id: id,
            name: name,
            photo: photo,
            room: currentRoom
        })
    });
    const result = await response.json();
    if (result.success) {
        Swal.fire('สำเร็จ', 'เพิ่มนักเรียนเรียบร้อย', 'success');
        bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
        selectRoom(currentRoom); // โหลดตารางใหม่
    }
}

// ฟังก์ชันบันทึกห้องเรียน
async function saveRoomToSheet() {
    const name = document.getElementById('input-room-name').value;
    const color = document.getElementById('input-room-color').value;

    if(!name) return Swal.fire('เตือน', 'กรุณาระบุชื่อห้อง', 'warning');

    Swal.showLoading();
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addRoom',
            roomName: name,
            roomColor: color
        })
    });
    const result = await response.json();
    if (result.success) {
        Swal.fire('สำเร็จ', 'เพิ่มห้องเรียนเรียบร้อย', 'success');
        bootstrap.Modal.getInstance(document.getElementById('roomModal')).hide();
        loadRooms(); // โหลดปุ่มใหม่
    }
}
