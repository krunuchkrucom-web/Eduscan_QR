// ตั้งค่า URL ของคุณที่นี่
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-_wojFp6rkj_FRyfWo2K1eQvjyiLKeEQbjDTolRcvPzInyC6q5CmWpE0M2cC-pMPIhQ/exec";

let currentRoom = "";
let userData = JSON.parse(localStorage.getItem('userData')) || { name: 'admin', role: 'admin' };
let qrcode = null;

window.onload = loadRooms;

// ดึงรายชื่อห้องเรียน
async function loadRooms() {
    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getRooms', userRole: userData.role, userName: userData.name })
        });
        const rooms = await res.json();
        const container = document.getElementById('roomContainer');
        container.innerHTML = "";
        
        rooms.forEach(room => {
            container.innerHTML += `
                <button class="btn ${room.color} me-2 mb-2 rounded-3" onclick="selectRoom('${room.name}')">
                    <i class="fas fa-graduation-cap me-1"></i> ${room.name}
                </button>`;
        });
    } catch (e) { console.error("Load Rooms Error:", e); }
}

// ดึงรายชื่อนักเรียนเมื่อเลือกห้อง
async function selectRoom(name) {
    currentRoom = name;
    document.getElementById('currentRoomText').innerText = name;
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>กำลังโหลด...</td></tr>';
    
    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudentsByRoom', room: currentRoom })
        });
        let students = await res.json();
        
        students.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, {numeric: true}));

        tbody.innerHTML = "";
        if(students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>';
            return;
        }

        students.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${s.id}</td>
                    <td>${s.name}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="generateQR('${s.id}', '${s.name}')">
                            สร้าง QR
                        </button>
                    </td>
                </tr>`;
        });
    } catch (e) { 
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center py-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>'; 
    }
}

// ฟังก์ชันสร้าง QR และบันทึกลง Google Sheets
async function generateQR(id, name) {
    // 1. จัดการ UI เบื้องต้น
    document.getElementById('qrPlaceholder').style.display = "none";
    const canvas = document.getElementById('canvasQR');
    canvas.innerHTML = '<div class="spinner-border text-primary"></div>'; // แสดง Loading ระหว่างรอ
    document.getElementById('btnDl').disabled = true;

    try {
        // 2. บันทึกประวัติการสร้างลงใน Log_QR Sheet
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'logQRGenerated', 
                id: id, 
                name: name,
                admin: userData.name 
            })
        });

        // 3. สร้างรูป QR Code หลังจากบันทึก Log สำเร็จ
        canvas.innerHTML = ""; // ล้าง Loading
        qrcode = new QRCode(canvas, {
            text: id, // ข้อมูลใน QR คือรหัสนักเรียน
            width: 200,
            height: 200,
            colorDark : "#0d6efd",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // 4. อัปเดตข้อมูลบนหน้าจอ
        document.getElementById('qrName').innerText = name;
        document.getElementById('qrId').innerText = "รหัส: " + id;
        document.getElementById('btnDl').disabled = false;

    } catch (e) {
        console.error("Generate QR Error:", e);
        canvas.innerHTML = '<i class="fas fa-exclamation-triangle text-danger fa-3x"></i><p class="small">บันทึกข้อมูลไม่สำเร็จ</p>';
    }
}

// ดาวน์โหลดรูป QR
function downloadQR() {
    const img = document.querySelector('#canvasQR img');
    if (!img) return;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `QR_${document.getElementById('qrName').innerText}.png`;
    link.click();
}

// ออกจากระบบ
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
