// ตรวจสอบสิทธิ์ทันทีที่เปิดหน้า
const auth = JSON.parse(localStorage.getItem('auth'));
if (!auth || auth.role !== 'Teacher') {
    window.location.href = 'index.html'; 
}

window.onload = () => {
    document.getElementById('user-display-name').innerHTML = `
        <div class="fw-bold text-dark">${auth.name}</div>
        <small class="text-muted">ครูผู้สอน</small>
    `;
    showDashboard();
};

function showDashboard() {
    const area = document.getElementById('content-area');
    // ... ใส่โค้ด innerHTML ของหน้า Dashboard ครูตรงนี้ ...
    loadClassRoom('ปวช.1/1');
}

async function loadClassRoom(room) {
    const tbody = document.getElementById('student-list-area');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">กำลังดึงข้อมูล ${room}...</td></tr>`;
    // เรียก Fetch ข้อมูลจาก Sheets ต่อไป
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
