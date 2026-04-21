// ตั้งค่า URL ของคุณที่นี่
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-_wojFp6rkj_FRyfWo2K1eQvjyiLKeEQbjDTolRcvPzInyC6q5CmWpE0M2cC-pMPIhQ/exec";

let currentRoom = "";
let userData = JSON.parse(localStorage.getItem('userData')) || { name: 'admin', role: 'admin' };
let qrcode = null;

window.onload = loadRooms;

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
    } catch (e) { console.error(e); }
}

async function selectRoom(name) {
    currentRoom = name;
    document.getElementById('currentRoomText').innerText = name;
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">กำลังโหลด...</td></tr>';
    
    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudentsByRoom', room: currentRoom })
        });
        let students = await res.json();
        
        // เรียงลำดับรหัสก่อนแสดงผล
        students.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, {numeric: true}));

        tbody.innerHTML = "";
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
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center">โหลดล้มเหลว</td></tr>'; }
}

function generateQR(id, name) {
    document.getElementById('qrPlaceholder').style.display = "none";
    const canvas = document.getElementById('canvasQR');
    canvas.innerHTML = ""; // ล้างค่าเก่า
    
    // สร้าง QR Code (ข้อมูลใน QR คือรหัสนักเรียน)
    qrcode = new QRCode(canvas, {
        text: id,
        width: 200,
        height: 200,
        colorDark : "#0d6efd",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById('qrName').innerText = name;
    document.getElementById('qrId').innerText = "ID: " + id;
    document.getElementById('btnDl').disabled = false;
}

function downloadQR() {
    const img = document.querySelector('#canvasQR img');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `QR_${document.getElementById('qrName').innerText}.png`;
    link.click();
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
