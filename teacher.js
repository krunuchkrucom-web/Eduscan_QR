const API_URL = "https://script.google.com/macros/s/AKfycbylt9pNy48G9ZIASdutlxX1d6yjWRmHEpvDNaxQJN-uj20J-SzcbyXarxTLaDgWId1IJw/exec";
let currentRoom = "";

window.onload = async () => {
    const auth = JSON.parse(localStorage.getItem('auth')) || { name: 'ครูผู้สอน' };
    document.getElementById('teacher-name-display').innerText = auth.name;
    loadRooms();
};

async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}?action=getRooms`);
        const rooms = await response.json();
        const area = document.getElementById('room-selection-area');
        
        area.innerHTML = rooms.map(room => `
            <div class="col-md-3">
                <button class="btn shadow-sm w-100 py-3 rounded-4 btn-room ${room.color || 'btn-white'}" onclick="selectRoom('${room.name}')">
                    ${room.name}
                </button>
            </div>
        `).join('');
    } catch (e) { console.error("Load Rooms Error:", e); }
}

async function selectRoom(roomName) {
    currentRoom = roomName;
    document.getElementById('current-room-display').innerText = roomName;
    
    const tbody = document.getElementById('student-list-table');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">กำลังโหลด...</td></tr>`;

    try {
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
                    <button class="btn btn-sm btn-outline-primary me-1"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">ไม่พบข้อมูลนักเรียน</td></tr>`; }
}

function openStudentModal() {
    if (!currentRoom) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกห้องเรียนก่อนเพิ่มนักเรียน', 'warning');
    new bootstrap.Modal(document.getElementById('studentModal')).show();
}

async function validateAndSaveStudent() {
    const id = document.getElementById('m-id').value;
    const name = document.getElementById('m-name').value;
    const photo = document.getElementById('m-photo').value;
    
    const namePattern = /^[ก-๙a-zA-Z\s]+$/;
    if (!namePattern.test(name)) return Swal.fire('ข้อผิดพลาด', 'ชื่อต้องไม่มีตัวเลขหรือสัญลักษณ์', 'error');

    Swal.showLoading();
    const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addStudent', id, name, photo, room: currentRoom })
    });
    const result = await res.json();
    if (result.success) {
        Swal.fire('สำเร็จ', 'เพิ่มนักเรียนแล้ว', 'success');
        bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
        selectRoom(currentRoom);
    }
}

function openRoomModal() {
    new bootstrap.Modal(document.getElementById('roomModal')).show();
}

async function saveRoomToSheet() {
    const name = document.getElementById('input-room-name').value;
    const color = document.getElementById('input-room-color').value;
    if(!name) return;

    Swal.showLoading();
    const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'addRoom', roomName: name, roomColor: color })
    });
    const result = await res.json();
    if (result.success) {
        Swal.fire('สำเร็จ', 'เพิ่มห้องเรียนแล้ว', 'success');
        bootstrap.Modal.getInstance(document.getElementById('roomModal')).hide();
        loadRooms();
    }
}

function getStatusClass(status) {
    return status === 'มาเรียน' ? 'text-success bg-success bg-opacity-10' : 'text-muted bg-light';
}

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
