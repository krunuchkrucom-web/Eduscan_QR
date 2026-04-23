const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzzuu8xj-iuY8z7tEka-iAJU7s2X4zcniHeMXFjPvf_sFnqKgSMaJrySvyFx6lwVexSoA/exec";

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
    } catch (e) { console.error("Load Rooms Error:", e); }
}

async function selectRoom(name) {
    currentRoom = name;
    document.getElementById('currentRoomText').innerText = name;
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>กำลังโหลด...</td></tr>';
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
        document.getElementById('btnPrintAll').disabled = false;
    } catch (e) { 
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center py-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>'; 
    }
}

async function generateQR(id, name) {
    document.getElementById('qrPlaceholder').style.display = "none";
    const canvas = document.getElementById('canvasQR');
    canvas.innerHTML = '<div class="spinner-border text-primary"></div>';
    
    document.getElementById('btnDl').disabled = true;
    document.getElementById('btnPrintSingle').disabled = true;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'logQRGenerated', id: id, name: name, admin: userData.name })
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
        document.getElementById('btnDl').disabled = false;
        document.getElementById('btnPrintSingle').disabled = false;
    } catch (e) {
        canvas.innerHTML = '<i class="fas fa-exclamation-triangle text-danger fa-3x"></i>';
    }
}

function downloadQR() {
    const canvas = document.querySelector('#canvasQR canvas');
    const img = document.querySelector('#canvasQR img');
    const dataURL = (img && img.src && img.src.startsWith('data')) ? img.src : (canvas ? canvas.toDataURL("image/png") : "");
    
    if (!dataURL) return alert("กรุณาสร้าง QR Code ก่อน");
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `QR_${document.getElementById('qrName').innerText}.png`;
    link.click();
}

function printSingleQR() {
    const canvas = document.querySelector('#canvasQR canvas');
    const img = document.querySelector('#canvasQR img');
    const dataURL = (img && img.src && img.src.startsWith('data')) ? img.src : (canvas ? canvas.toDataURL("image/png") : "");
    
    if (!dataURL) return;
    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `
        <div style="text-align: center; padding-top: 50px; font-family: 'Sarabun', sans-serif;">
            <h2 style="color: #0d6efd;">EduTrack QR System</h2>
            <img src="${dataURL}" style="width: 250px; margin: 20px 0; border: 1px solid #eee;">
            <h1>${document.getElementById('qrName').innerText}</h1>
            <p style="font-size: 20px;">${document.getElementById('qrId').innerText}</p>
        </div>`;
    window.print();
}

async function printAllRoom() {
    const rows = document.querySelectorAll('#studentTableBody tr');
    if (rows.length === 0 || rows[0].cells.length < 3) return;

    const printSection = document.getElementById('printSection');
    printSection.innerHTML = `<h3 style="text-align:center; margin-bottom: 20px;">QR Code ห้อง: ${currentRoom}</h3><div style="display: flex; flex-wrap: wrap;">`;
    
    const temp = document.createElement('div');
    for (const row of rows) {
        const id = row.cells[0].innerText;
        const name = row.cells[1].innerText;
        temp.innerHTML = "";
        new QRCode(temp, { text: id, width: 120, height: 120 });
        await new Promise(r => setTimeout(r, 100));
        const img = temp.querySelector('img').src || temp.querySelector('canvas').toDataURL();
        
        printSection.innerHTML += `
            <div style="width: 30%; border: 1px solid #eee; margin: 5px; padding: 10px; text-align: center; page-break-inside: avoid;">
                <img src="${img}" style="width: 100px;">
                <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${name}</div>
                <div style="font-size: 10px;">${id}</div>
            </div>`;
    }
    printSection.innerHTML += '</div>';
    window.print();
}

function logout() { localStorage.clear(); window.location.href = "index.html"; }
