// ตั้งค่า URL ของคุณที่นี่
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz7N0cfEGWZWVMC4Pjenxne4zHkFarqlj2qDIO6rGtXYi2zSWH-2wAUxmVCtyM4ysrOVA/exec";

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
    
    // ปิดปุ่มปริ้นห้องไว้ก่อนจนกว่าจะโหลดเสร็จ
    document.getElementById('btnPrintAll').disabled = true;

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

        // โหลดเสร็จแล้ว เปิดปุ่มปริ้นทั้งห้อง
        document.getElementById('btnPrintAll').disabled = false;

    } catch (e) { 
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center py-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>'; 
    }
}

// ฟังก์ชันสร้าง QR และบันทึกลง Google Sheets
async function generateQR(id, name) {
    document.getElementById('qrPlaceholder').style.display = "none";
    const canvas = document.getElementById('canvasQR');
    canvas.innerHTML = '<div class="spinner-border text-primary"></div>';
    
    // ปิดปุ่มต่างๆ ระหว่างรอ
    document.getElementById('btnDl').disabled = true;
    document.getElementById('btnPrintSingle').disabled = true;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'logQRGenerated', 
                id: id, 
                name: name,
                admin: userData.name 
            })
        });

        canvas.innerHTML = ""; 
        qrcode = new QRCode(canvas, {
            text: id,
            width: 200,
            height: 200,
            colorDark : "#0d6efd",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        document.getElementById('qrName').innerText = name;
        document.getElementById('qrId').innerText = "รหัส: " + id;
        
        // เปิดปุ่มใช้งาน
        document.getElementById('btnDl').disabled = false;
        document.getElementById('btnPrintSingle').disabled = false;

    } catch (e) {
        console.error("Generate QR Error:", e);
        canvas.innerHTML = '<i class="fas fa-exclamation-triangle text-danger fa-3x"></i><p class="small">บันทึกข้อมูลไม่สำเร็จ</p>';
    }
}

// --- เพิ่มฟังก์ชันสำหรับการปริ้น ---

// 1. ปริ้นเฉพาะใบที่เลือก
function printSingleQR() {
    const qrImg = document.querySelector('#canvasQR img');
    const name = document.getElementById('qrName').innerText;
    const id = document.getElementById('qrId').innerText;

    if (!qrImg) return;

    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `
        <div style="text-align: center; padding-top: 50px; font-family: 'Sarabun', sans-serif;">
            <h2 style="color: #0d6efd;">EduTrack QR System</h2>
            <div style="margin: 30px 0;">
                <img src="${qrImg.src}" style="width: 300px; border: 1px solid #eee;">
            </div>
            <h1 style="margin: 10px 0;">${name}</h1>
            <p style="font-size: 24px; color: #666;">${id}</p>
        </div>
    `;
    window.print();
}

// 2. ปริ้นทั้งห้องเรียน
async function printAllRoom() {
    const tbody = document.getElementById('studentTableBody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || rows[0].innerText.includes("กรุณาเลือก")) return;

    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `<h3 style="text-align:center; margin-bottom: 20px;">รายชื่อ QR Code ห้อง: ${currentRoom}</h3>`;
    
    let grid = '<div style="display: flex; flex-wrap: wrap; justify-content: flex-start; font-family: \'Sarabun\', sans-serif;">';

    // สร้างพื้นที่จำลองเพื่อเจน QR
    const tempContainer = document.createElement('div');
    tempContainer.style.display = "none";
    document.body.appendChild(tempContainer);

    for (const row of rows) {
        const id = row.cells[0].innerText;
        const name = row.cells[1].innerText;

        const qrDiv = document.createElement('div');
        new QRCode(qrDiv, { text: id, width: 120, height: 120 });
        
        // รอให้ QRCode Library เจนภาพเสร็จแป๊บนึง
        await new Promise(res => setTimeout(res, 50));
        const imgData = qrDiv.querySelector('img').src;

        grid += `
            <div style="width: 30%; border: 1px solid #eee; margin: 5px; padding: 10px; text-align: center; page-break-inside: avoid;">
                <img src="${imgData}" style="width: 100px;">
                <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${name}</div>
                <div style="font-size: 10px; color: #888;">${id}</div>
            </div>
        `;
    }

    grid += '</div>';
    printSection.innerHTML += grid;
    document.body.removeChild(tempContainer);
    window.print();
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
