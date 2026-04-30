// --- การตั้งค่าเบื้องต้น ---
let html5QrCode;
let currentMode = 'attendance';
let scanHistory = [];
// ตรวจสอบให้มั่นใจว่า URL นี้เป็นตัวล่าสุดที่ Deploy จาก Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbxcbhoYr1Yjjv4VDbsqx-66dYMmBg9tNn9_vAkXMoptD-nNoSYqvXAqrDyBuoSVBrP5Yg/exec';

// เริ่มทำงานเมื่อโหลดหน้าจอ
window.onload = () => {
    initScanner();
};

// ฟังก์ชันเปิดกล้อง
function initScanner() {
    // 1. ตรวจสอบว่ามีอุปกรณ์กล้องตัวไหนว่างบ้าง
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
            // สร้างอินสแตนซ์ scanner
            html5QrCode = new Html5Qrcode("reader");
            
            // เลือกใช้กล้องตัวแรกที่ระบบหาเจอ (สำหรับ Notebook/PC คือกล้องหน้า)
            const cameraId = devices[0].id; 
            
            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0 
            };

            // เริ่มการทำงานด้วย ID ของกล้องที่หาเจอ
            html5QrCode.start(
                cameraId, 
                config, 
                onScanSuccess
            ).catch(err => {
                // กรณีเริ่มกล้องไม่ได้ (เช่น โปรแกรมอื่นจองอยู่)
                document.getElementById('statusLabel').innerText = "กล้องถูกใช้งานโดยโปรแกรมอื่น";
                console.error(err);
            });
        } else {
            document.getElementById('statusLabel').innerText = "ไม่พบอุปกรณ์กล้องในเครื่องนี้";
        }
    }).catch(err => {
        document.getElementById('statusLabel').innerText = "เกิดข้อผิดพลาด: " + err;
    });
}

// เมื่อสแกนติด
function onScanSuccess(decodedText, decodedResult) {
    html5QrCode.pause();
    
    const className = document.getElementById('classSelect').value;
    const workName = document.getElementById('workTitle').value;
    const score = document.getElementById('fullScore').value;
    const timeStatus = document.getElementById('timeStatus').value;

    const studentData = {
        action: 'recordScan', // *** ต้องแก้ให้ตรงกับใน code.gs ***
        id: decodedText,
        mode: currentMode,
        room: className,
        workName: currentMode === 'assignment' ? workName : 'เช็คชื่อเข้าเรียน',
        score: currentMode === 'assignment' ? score : '-',
        status: timeStatus,
        admin: "Teacher Admin", // หรือดึงชื่อจาก Session Login
        timestamp: new Date().toISOString()
    };

    showSuccessUI(decodedText);
    saveToSheet(studentData);
}

// แสดง Feedback บนหน้าจอ
function showSuccessUI(id) {
    const overlay = document.getElementById('successOverlay');
    const nameDisplay = document.getElementById('scannedName');
    
    nameDisplay.innerText = "รหัส: " + id;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    // ซ่อน Overlay และเริ่มสแกนต่อหลังจาก 2 วินาที
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        // ตรวจสอบว่ายังมี Object อยู่ก่อน resume
        if(html5QrCode) html5QrCode.resume();
    }, 2000);
}

// บันทึกข้อมูลลง Google Sheet
function saveToSheet(studentData) {
    updateScanHistory(studentData);

    // ใช้ URLSearchParams หรือส่งแบบ JSON ให้ถูกตามที่ Script รอรับ
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // สำคัญมากสำหรับ Google Apps Script
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
    })
    .then(() => {
        console.log('ส่งข้อมูลเรียบร้อย');
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('การเชื่อมต่อมีปัญหา', 'ไม่สามารถส่งข้อมูลไปยัง Server ได้', 'error');
    });
}

// อัปเดตรายการประวัติข้างหน้าจอ
function updateScanHistory(data) {
    const logContainer = document.getElementById('activityLog');
    const emptyPlaceholder = document.getElementById('emptyLog');
    
    if (emptyPlaceholder) emptyPlaceholder.remove();

    const displayTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const newLog = document.createElement('div');
    newLog.className = "p-4 bg-white rounded-2xl border border-gray-100 mb-3 shadow-sm transition hover:border-blue-300 animate-pulse";
    
    newLog.innerHTML = `
        <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 text-xs font-bold">
                ${data.id.substring(0,3)}
            </div>
            <span class="font-bold text-gray-800 text-sm">ID: ${data.id}</span>
        </div>
        <div class="flex justify-between items-center">
            <span class="text-xs text-green-500 font-bold"><i class="fas fa-clock mr-1"></i> ${displayTime} น.</span>
            ${data.mode === 'assignment' 
                ? `<span class="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg">คะแนน: ${data.score}</span>`
                : `<span class="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">เข้าเรียน</span>`
            }
        </div>
    `;

    logContainer.insertBefore(newLog, logContainer.firstChild);
    
    // อัปเดตตัวเลขจำนวนคน
    scanHistory.push(data);
    document.getElementById('scanCount').innerText = `${scanHistory.length}/40`;
    
    setTimeout(() => newLog.classList.remove('animate-pulse'), 1000);
}

// สลับโหมดการทำงาน
function toggleMode(mode) {
    currentMode = mode;
    const btnAtt = document.getElementById('btnAtt');
    const btnAss = document.getElementById('btnAss');
    const detail = document.getElementById('assignmentDetail');
    const statusLabel = document.getElementById('statusLabel');

    if (mode === 'assignment') {
        btnAss.className = "flex-1 py-3 rounded-xl font-bold transition text-blue-600 bg-white shadow-sm";
        btnAtt.className = "flex-1 py-3 rounded-xl font-bold transition text-gray-400";
        detail.classList.remove('hidden');
        statusLabel.innerText = "สแกนเพื่อบันทึกงาน...";
    } else {
        btnAtt.className = "flex-1 py-3 rounded-xl font-bold transition text-blue-600 bg-white shadow-sm";
        btnAss.className = "flex-1 py-3 rounded-xl font-bold transition text-gray-400";
        detail.classList.add('hidden');
        statusLabel.innerText = "สแกนเพื่อเช็คชื่อ...";
    }
}
