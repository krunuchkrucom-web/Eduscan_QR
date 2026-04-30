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
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess
    ).catch(err => {
        console.error("Scanner Error:", err);
        const statusLabel = document.getElementById('statusLabel');
        statusLabel.innerText = "ไม่สามารถเปิดกล้องได้ (โปรดตรวจสอบสิทธิ์การเข้าถึง)";
        statusLabel.classList.remove('text-blue-900');
        statusLabel.classList.add('text-red-500');
    });
}

// เมื่อสแกนติด
function onScanSuccess(decodedText, decodedResult) {
    // หยุดการสแกนชั่วคราวเพื่อประมวลผล
    html5QrCode.pause();
    
    // ดึงค่าจากการตั้งค่าหน้าเว็บ
    const className = document.getElementById('classSelect').value;
    const workName = document.getElementById('workTitle').value;
    const score = document.getElementById('fullScore').value;
    const timeStatus = document.getElementById('timeStatus').value;

    // เตรียมข้อมูลให้ตรงกับที่ code.gs รอรับ
    const studentData = {
        action: 'logQRGenerated', // เพิ่ม action เพื่อบอก Server ว่าให้บันทึกลง Log
        id: decodedText,           // ใช้คีย์ 'id' ตามใน code.gs
        name: "นักเรียนรหัส " + decodedText, // กรณีไม่มีฐานข้อมูลชื่อในตัวแปรนี้
        room: className,
        mode: currentMode,
        workName: currentMode === 'assignment' ? workName : 'เช็คชื่อเข้าเรียน',
        score: currentMode === 'assignment' ? score : '-',
        status: timeStatus,
        admin: 'System Scanner', // หรือดึงชื่อครูจากระบบ Login
        timestamp: new Date().toISOString() // ส่ง ISO Format ไปเพื่อให้ Spreadsheet จัดการง่าย
    };

    // แสดง Overlay สำเร็จ
    showSuccessUI(decodedText);
    
    // บันทึกข้อมูล
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
    // แสดงประวัติทันที (Optimistic Update)
    updateScanHistory(studentData);

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // สำคัญ: เพื่อเลี่ยงปัญหา CORS บน Browser บางตัว
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
    })
    .then(() => {
        console.log('Data sent to Server');
    })
    .catch(error => {
        console.error('Error!', error.message);
        Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
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
