// ตั้งค่า URL ของคุณที่นี่
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-_wojFp6rkj_FRyfWo2K1eQvjyiLKeEQbjDTolRcvPzInyC6q5CmWpE0M2cC-pMPIhQ/exec";

let currentRoom = "";
let userData = JSON.parse(localStorage.getItem('userData')) || { name: 'admin', role: 'admin' };
let qrcode = null;

window.onload = loadRooms;

// 1. ดึงรายชื่อห้องเรียน
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

// 2. ดึงรายชื่อนักเรียนเมื่อเลือกห้อง
async function selectRoom(name) {
    currentRoom = name;
    document.getElementById('currentRoomText').innerText = name;
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>กำลังโหลด...</td></tr>';
    
    // ปิดปุ่มปริ้นชั่วคราวก่อนโหลดเสร็จ
    if (document.getElementById('btnPrintAll')) document.getElementById('btnPrintAll').disabled = true;

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

        // เปิดใช้งานปุ่มปริ้นทั้งห้องเมื่อโหลดข้อมูลเสร็จ
        const btnPrintAll = document.getElementById('btnPrintAll');
        if (btnPrintAll) btnPrintAll.disabled = false;

    } catch (e) { 
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center py-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>'; 
    }
}

// 3. ฟังก์ชันสร้าง QR และบันทึกลง Google Sheets
async function generateQR(id, name) {
    document.getElementById('qrPlaceholder').style.display = "none";
    const canvas = document.getElementById('canvasQR');
    canvas.innerHTML = '<div class="spinner-border text-primary"></div>';
    document.getElementById('btnDl').disabled = true;
    if (document.getElementById('btnPrintSingle')) document.getElementById('btnPrintSingle').disabled = true;

    try {
        // บันทึกลง Sheet
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'logQRGenerated', 
                id: id, 
                name: name,
                admin: userData.name 
            })
        });

        // สร้าง QR บนจอ
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
        document.getElementById('qrId').innerText = "ID: " + id;
        document.getElementById('btnDl').disabled = false;
        if (document.getElementById('btnPrintSingle')) document.getElementById('btnPrintSingle').disabled = false;

    } catch (e) {
        console.error("Generate QR Error:", e);
        canvas.innerHTML = '<i class="fas fa-exclamation-triangle text-danger fa-3x"></i>';
    }
}

// 4. ฟังก์ชันปริ้นเฉพาะคนที่เลือก
function printSingleQR() {
    const name = document.getElementById('qrName').innerText;
    const id = document.getElementById('qrId').innerText;
    const canvasImg = document.querySelector('#canvasQR img');
    
    if (!canvasImg) {
        alert("กรุณาสร้าง QR Code ก่อนสั่งปริ้น");
        return;
    }

    const qrImg = canvasImg.src;
    const printArea = document.getElementById('printSection');
    printArea.innerHTML = `
        <div style="text-align:center; padding-top: 50px;">
            <h2 style="margin-bottom:20px;">QR Code สำหรับนักเรียน</h2>
            <div style="border: 2px solid #333; display:inline-block; padding:30px; border-radius:15px;">
                <img src="${qrImg}" style="width: 300px;">
                <h2 style="margin-top:20px; font-size: 28px;">${name}</h2>
                <h3 style="color:#666;">รหัสนักเรียน: ${id.replace('ID: ', '')}</h3>
            </div>
        </div>
    `;
    window.print();
}

// 5. ฟังก์ชันปริ้นทั้งห้อง
async function printAllRoom() {
    if (!currentRoom) return;
    
    const printArea = document.getElementById('printSection');
    printArea.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="text-align:center; margin-bottom:30px;">ชุด QR Code ทั้งห้องเรียน: ${currentRoom}</h2>
            <div id="printGrid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;"></div>
        </div>
    `;
    const grid = printArea.querySelector('#printGrid');
    const btn = document.getElementById('btnPrintAll');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเตรียม...';

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudentsByRoom', room: currentRoom })
        });
        const students = await res.json();

        for (const s of students) {
            const div = document.createElement('div');
            div.style = "width: 180px; border: 1px solid #ccc; padding: 15px; text-align: center; border-radius: 10px;";
            div.innerHTML = `
                <div id="tempQR_${s.id}" style="display: flex; justify-content: center;"></div>
                <div style="font-weight:bold; margin-top:10px;">${s.name}</div>
                <div style="font-size:12px; color: #666;">ID: ${s.id}</div>
            `;
            grid.appendChild(div);

            new QRCode(document.getElementById(`tempQR_${s.id}`), {
                text: s.id,
                width: 140,
                height: 140
            });
        }

        btn.innerHTML = originalText;
        setTimeout(() => { window.print(); }, 800);

    } catch (e) {
        btn.innerHTML = originalText;
        alert("ไม่สามารถโหลดข้อมูลเพื่อปริ้นได้");
    }
}

// 6. ฟังก์ชันทั่วไป
function downloadQR() {
    const img = document.querySelector('#canvasQR img');
    if (!img) return;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `QR_${document.getElementById('qrName').innerText}.png`;
    link.click();
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
