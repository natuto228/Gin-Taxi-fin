let map;
let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');
let userEmail = localStorage.getItem('userEmail');

function initHeader() {
    let userStatus = document.getElementById('userStatus');
    if (!userStatus) return;
    
    if (userId && userName) {
        let letter = userName.charAt(0).toUpperCase();
        userStatus.innerHTML = `
            <div style="position:relative">
                <div class="user-avatar" onclick="toggleMenu()">
                    <div class="avatar-circle">${letter}</div>
                    <span class="user-name-header">${userName}</span>
                </div>
                <div id="userMenu" style="display:none; position:absolute; right:0; top:45px; background:white; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); min-width:160px; z-index:1000">
                    <div style="padding:10px 15px; border-bottom:1px solid #eee">${userEmail || ''}</div>
                    <div onclick="showProfileModal()" style="padding:10px 15px; cursor:pointer; hover:background:#f0f2f5">Личный кабинет</div>
                    <div onclick="logout()" style="padding:10px 15px; cursor:pointer; color:red">Выйти</div>
                </div>
            </div>
        `;
    } else {
        userStatus.innerHTML = `
            <div class="auth-buttons">
                <a href="#" class="btn-outline-auth" onclick="showLoginModal(); return false;">Вход</a>
                <a href="#" class="btn-primary-auth" onclick="showRegisterModal(); return false;">Регистрация</a>
            </div>
        `;
    }
}

function toggleMenu() {
    let menu = document.getElementById('userMenu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-avatar')) {
        let menu = document.getElementById('userMenu');
        if (menu) menu.style.display = 'none';
    }
});

function initMap() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initMap, 500);
        return;
    }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'searchControl']
        });
    });
}
initMap();

function showOverlay() { 
    let el = document.getElementById('overlay');
    if (el) el.style.display = 'block';
}
function hideOverlay() { 
    let el = document.getElementById('overlay');
    if (el) el.style.display = 'none';
}
function closeAllModals() { 
    hideOverlay(); 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    hideOverlay();
}

function openOrderModal() { 
    document.getElementById('orderModal').style.display = 'block';
    showOverlay();
}
function closeOrderModal() { 
    document.getElementById('orderModal').style.display = 'none';
    hideOverlay();
}
function openCommentModal() { 
    document.getElementById('commentModal').style.display = 'block';
    showOverlay();
}
function closeCommentModal() { 
    document.getElementById('commentModal').style.display = 'none';
    hideOverlay();
}
function showLoginModal() { 
    document.getElementById('loginModal').style.display = 'block';
    showOverlay();
}
function closeLoginModal() { 
    document.getElementById('loginModal').style.display = 'none';
    hideOverlay();
}
function showRegisterModal() { 
    document.getElementById('registerModal').style.display = 'block';
    showOverlay();
}
function closeRegisterModal() { 
    document.getElementById('registerModal').style.display = 'none';
    hideOverlay();
}
function showProfileModal() { 
    document.getElementById('profileModal').style.display = 'block';
    showOverlay();
    loadProfile();
}

function makePhoneCall() { 
    window.location.href = 'tel:+78121234567';
}

function calculatePrice() {
    let pickup = document.getElementById('orderPickup');
    let dropoff = document.getElementById('orderDropoff');
    let tariff = document.getElementById('orderTariff');
    let priceDiv = document.getElementById('pricePreview');
    if (pickup && dropoff && tariff && priceDiv && pickup.value && dropoff.value) {
        let price = 250;
        if (tariff.value.includes('Комфорт')) price = 350;
        if (tariff.value.includes('Бизнес')) price = 500;
        priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' ₽';
    }
}

function sendComment() {
    let comment = document.getElementById('driverComment');
    if (comment && comment.value) {
        alert('Комментарий: ' + comment.value);
        comment.value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function submitOrder() {
    let name = document.getElementById('orderName');
    let phone = document.getElementById('orderPhone');
    let pickup = document.getElementById('orderPickup');
    let dropoff = document.getElementById('orderDropoff');
    let tariff = document.getElementById('orderTariff');
    
    if (!name.value || !phone.value || !pickup.value || !dropoff.value) {
        alert('Заполните все поля');
        return;
    }
    
    let price = 250;
    if (tariff.value.includes('Комфорт')) price = 350;
    if (tariff.value.includes('Бизнес')) price = 500;
    
    let fd = new FormData();
    fd.append('pickup', pickup.value);
    fd.append('dropoff', dropoff.value);
    fd.append('tariff', tariff.value);
    fd.append('price', price);
    
    if (userId) {
        fd.append('user_id', userId);
    } else {
        fd.append('guest_name', name.value);
        fd.append('guest_phone', phone.value);
        fd.append('guest_email', '');
    }
    
    await fetch('/save-order', { method: 'POST', body: fd });
    alert('Заказ оформлен!');
    closeOrderModal();
}

async function registerUser() {
    let fd = new FormData();
    fd.append('fullname', document.getElementById('regName').value);
    fd.append('phone', document.getElementById('regPhone').value);
    fd.append('email', document.getElementById('regEmail').value);
    fd.append('password', document.getElementById('regPassword').value);
    
    let res = await fetch('/register', { method: 'POST', body: fd });
    let data = await res.json();
    
    if (data.success) {
        alert('Регистрация успешна! Теперь войдите.');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(data.error || 'Ошибка регистрации');
    }
}

async function loginUser() {
    let fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    
    let res = await fetch('/login-user', { method: 'POST', body: fd });
    let data = await res.json();
    
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        localStorage.setItem('userEmail', data.email);
        alert('Добро пожаловать, ' + data.fullname);
        location.reload();
    } else {
        alert(data.error);
    }
}

async function loadProfile() {
    let id = localStorage.getItem('userId');
    if (!id) return;
    
    let res = await fetch('/user-orders/' + id);
    let orders = await res.json();
    
    let profileInfo = document.getElementById('profileInfo');
    let ordersHistory = document.getElementById('ordersHistory');
    
    if (profileInfo) profileInfo.innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    
    if (orders.length === 0) {
        if (ordersHistory) ordersHistory.innerHTML = '<p>У вас пока нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        orders.forEach(o => {
            html += '<div class="order-card"><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong><br>' +
                    o.tariff + ' | ' + o.price + ' ₽<br>' +
                    'Статус: ' + o.status + '<br>' +
                    '<small>' + new Date(o.date).toLocaleString() + '</small></div>';
        });
        if (ordersHistory) ordersHistory.innerHTML = html;
    }
}

let driverForm = document.getElementById('driverLoginForm');
if (driverForm) {
    driverForm.addEventListener('submit', function(e) {
        e.preventDefault();
        localStorage.setItem('driverLoggedIn', 'true');
        window.location.href = '/driver-dashboard';
    });
}

if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driverLoggedIn')) window.location.href = '/login';
    
    let statusBtn = document.getElementById('statusBtn');
    let isOnline = true;
    if (statusBtn) {
        statusBtn.onclick = () => {
            isOnline = !isOnline;
            statusBtn.textContent = isOnline ? 'Онлайн' : 'Офлайн';
            statusBtn.className = isOnline ? 'driver-status-btn online' : 'driver-status-btn offline';
        };
    }
    
    async function loadOrders() {
        let res = await fetch('/user-orders/all');
        let orders = await res.json();
        let container = document.getElementById('ordersList');
        if (!container) return;
        if (orders.length === 0) {
            container.innerHTML = '<div class="driver-no-orders">Нет новых заказов</div>';
            return;
        }
        let html = '';
        orders.forEach(order => {
            html += '<div class="order-item"><div><strong>' + order.pickup + '</strong> → <strong>' + order.dropoff + '</strong></div>' +
                    '<div>Тариф: ' + order.tariff + ' | Цена: ' + order.price + ' ₽</div>' +
                    '<button class="order-accept-btn" data-id="' + order.id + '">Принять</button></div>';
        });
        container.innerHTML = html;
        document.querySelectorAll('.order-accept-btn').forEach(btn => {
            btn.onclick = async function() {
                let fd = new FormData();
                fd.append('driver_id', 1);
                await fetch('/assign-order/' + this.dataset.id, { method: 'POST', body: fd });
                alert('Заказ принят!');
                loadOrders();
                loadHistory();
            };
        });
    }
    
    async function loadHistory() {
        let res = await fetch('/driver-orders/1');
        let orders = await res.json();
        let container = document.getElementById('historyList');
        if (!container) return;
        if (orders.length === 0) {
            container.innerHTML = '<div class="driver-no-orders">Нет выполненных заказов</div>';
            return;
        }
        let html = '';
        let total = 0;
        orders.forEach(order => {
            total += order.price;
            html += '<div class="order-item"><div><strong>' + order.pickup_address + '</strong> → <strong>' + order.dropoff_address + '</strong></div>' +
                    '<div>Тариф: ' + order.tariff + ' | Цена: ' + order.price + ' ₽</div>' +
                    '<div>Статус: ' + order.status + '</div>' +
                    '<div><small>' + new Date(order.created_at).toLocaleString() + '</small></div></div>';
        });
        container.innerHTML = html;
        document.getElementById('earnings').innerText = total + ' ₽';
    }
    
    loadOrders();
    loadHistory();
    setInterval(loadOrders, 5000);
}

let loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) loginUserForm.addEventListener('submit', (e) => { e.preventDefault(); loginUser(); });
let registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); registerUser(); });

document.getElementById('orderPickup')?.addEventListener('input', calculatePrice);
document.getElementById('orderDropoff')?.addEventListener('input', calculatePrice);
document.getElementById('orderTariff')?.addEventListener('change', calculatePrice);

document.addEventListener('DOMContentLoaded', initHeader);

window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openCommentModal = openCommentModal;
window.closeCommentModal = closeCommentModal;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.closeProfileModal = closeProfileModal;
window.makePhoneCall = makePhoneCall;
window.submitOrder = submitOrder;
window.sendComment = sendComment;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logout = logout;
window.closeAllModals = closeAllModals;
window.toggleMenu = toggleMenu;