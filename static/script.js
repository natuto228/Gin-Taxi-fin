// ========== ПЕРЕМЕННЫЕ ==========
let map;
let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');

// ========== КАРТА ==========
function initMap() {
    if (typeof ymaps === 'undefined') { setTimeout(initMap, 500); return; }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl']
        });
        map.events.add('click', function(e) {
            var coords = e.get('coords');
            var pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
    });
}
initMap();

// ========== ПОИСК ==========
function searchAddress() {
    var query = document.getElementById('addressSearch').value;
    if (!query) return;
    ymaps.geocode(query, { results: 1 }).then(function(res) {
        var coords = res.geoObjects.get(0).geometry.getCoordinates();
        map.setCenter(coords, 15);
    }).catch(function() { alert('Адрес не найден'); });
}

function getMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            map.setCenter([pos.coords.latitude, pos.coords.longitude], 15);
        }, function() { alert('Не удалось определить местоположение'); });
    } else {
        alert('Геолокация не поддерживается');
    }
}

// ========== МОДАЛКИ ==========
function showOverlay() { 
    var el = document.getElementById('overlay');
    if (el) el.style.display = 'block';
}
function hideOverlay() { 
    var el = document.getElementById('overlay');
    if (el) el.style.display = 'none';
}
function closeAllModals() { 
    hideOverlay(); 
    var modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
        modals[i].style.display = 'none';
    }
}

function openOrderModal() { 
    var modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'block';
    showOverlay();
}
function closeOrderModal() { 
    var modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
    hideOverlay();
}
function openCommentModal() { 
    var modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'block';
    showOverlay();
}
function closeCommentModal() { 
    var modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
    hideOverlay();
}
function showLoginModal() { 
    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
    showOverlay();
}
function closeLoginModal() { 
    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
    hideOverlay();
}
function showRegisterModal() { 
    var modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'block';
    showOverlay();
}
function closeRegisterModal() { 
    var modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
    hideOverlay();
}
function showProfileModal() { 
    var modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'block';
        showOverlay();
        loadProfile();
    }
}
function closeProfileModal() { 
    var modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
    hideOverlay();
}

function makePhoneCall() { 
    window.location.href = 'tel:+78121234567';
}

function calculatePrice() {
    var pickup = document.getElementById('orderPickup');
    var dropoff = document.getElementById('orderDropoff');
    var tariff = document.getElementById('orderTariff');
    var priceDiv = document.getElementById('pricePreview');
    if (pickup && dropoff && tariff && priceDiv && pickup.value && dropoff.value) {
        var price = 250;
        if (tariff.value.includes('Комфорт')) price = 350;
        if (tariff.value.includes('Бизнес')) price = 500;
        priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' ₽';
    }
}

function sendComment() {
    var comment = document.getElementById('driverComment');
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

// ========== ЗАКАЗ ==========
async function submitOrder() {
    var name = document.getElementById('orderName');
    var phone = document.getElementById('orderPhone');
    var pickup = document.getElementById('orderPickup');
    var dropoff = document.getElementById('orderDropoff');
    var tariff = document.getElementById('orderTariff');
    
    if (!name.value || !phone.value || !pickup.value || !dropoff.value) {
        alert('Заполните все поля');
        return;
    }
    
    var price = 250;
    if (tariff.value.includes('Комфорт')) price = 350;
    if (tariff.value.includes('Бизнес')) price = 500;
    
    var fd = new FormData();
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

// ========== РЕГИСТРАЦИЯ ==========
async function registerUser() {
    var fd = new FormData();
    fd.append('fullname', document.getElementById('regName').value);
    fd.append('phone', document.getElementById('regPhone').value);
    fd.append('email', document.getElementById('regEmail').value);
    fd.append('password', document.getElementById('regPassword').value);
    
    var res = await fetch('/register', { method: 'POST', body: fd });
    var data = await res.json();
    
    if (data.success) {
        alert('Регистрация успешна! Теперь войдите.');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(data.error || 'Ошибка регистрации');
    }
}

// ========== ВХОД ПОЛЬЗОВАТЕЛЯ ==========
async function loginUser() {
    var fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    
    var res = await fetch('/login-user', { method: 'POST', body: fd });
    var data = await res.json();
    
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        alert('Добро пожаловать, ' + data.fullname);
        location.reload();
    } else {
        alert(data.error);
    }
}

// ========== ПРОФИЛЬ ==========
async function loadProfile() {
    var id = localStorage.getItem('userId');
    if (!id) return;
    
    var res = await fetch('/user-orders/' + id);
    var orders = await res.json();
    
    var profileInfo = document.getElementById('profileInfo');
    var ordersHistory = document.getElementById('ordersHistory');
    
    if (profileInfo) profileInfo.innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    
    if (orders.length === 0) {
        if (ordersHistory) ordersHistory.innerHTML = '<p>У вас пока нет заказов</p>';
    } else {
        var html = '<h4>История заказов</h4>';
        for (var i = 0; i < orders.length; i++) {
            var o = orders[i];
            html += '<div class="order-card"><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong><br>' +
                    o.tariff + ' | ' + o.price + ' ₽<br>' +
                    'Статус: ' + o.status + '<br>' +
                    '<small>' + new Date(o.date).toLocaleString() + '</small></div>';
        }
        if (ordersHistory) ordersHistory.innerHTML = html;
    }
}

// ========== ВХОД ВОДИТЕЛЯ ==========
var driverForm = document.getElementById('driverLoginForm');
if (driverForm) {
    driverForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var login = document.getElementById('driverLogin').value;
        var password = document.getElementById('driverPassword').value;
        
        if (login === 'driver' && password === '12345') {
            localStorage.setItem('driverLoggedIn', 'true');
            window.location.href = '/driver-dashboard';
        } else {
            alert('Неверный логин или пароль');
        }
    });
}

// ========== КАБИНЕТ ВОДИТЕЛЯ ==========
if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driverLoggedIn')) {
        window.location.href = '/login';
    }
    
    var statusBtn = document.getElementById('statusBtn');
    if (statusBtn) {
        var isOnline = true;
        statusBtn.onclick = function() {
            isOnline = !isOnline;
            statusBtn.textContent = isOnline ? 'Онлайн' : 'Офлайн';
            statusBtn.className = isOnline ? 'driver-status-btn online' : 'driver-status-btn offline';
        };
    }
    
    async function loadOrders() {
        var response = await fetch('/user-orders/all');
        var orders = await response.json();
        var container = document.getElementById('ordersList');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="driver-no-orders">Нет новых заказов</div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            html += '<div class="order-item"><div><strong>' + order.pickup + '</strong> → <strong>' + order.dropoff + '</strong></div>' +
                    '<div>Тариф: ' + order.tariff + ' | Цена: ' + order.price + ' ₽</div>' +
                    '<button class="order-accept-btn" data-id="' + order.id + '">Принять</button></div>';
        }
        container.innerHTML = html;
        
        var btns = document.querySelectorAll('.order-accept-btn');
        for (var j = 0; j < btns.length; j++) {
            btns[j].onclick = async function() {
                var orderId = this.getAttribute('data-id');
                var fd = new FormData();
                fd.append('driver_id', 1);
                await fetch('/assign-order/' + orderId, { method: 'POST', body: fd });
                alert('Заказ принят!');
                loadOrders();
                loadHistory();
            };
        }
    }
    
    async function loadHistory() {
        var response = await fetch('/driver-orders/1');
        var orders = await response.json();
        var container = document.getElementById('historyList');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="driver-no-orders">Нет выполненных заказов</div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            html += '<div class="order-item"><div><strong>' + order.pickup_address + '</strong> → <strong>' + order.dropoff_address + '</strong></div>' +
                    '<div>Тариф: ' + order.tariff + ' | Цена: ' + order.price + ' ₽</div>' +
                    '<div>Статус: ' + order.status + '</div>' +
                    '<div><small>' + new Date(order.created_at).toLocaleString() + '</small></div></div>';
        }
        container.innerHTML = html;
    }
    
    loadOrders();
    loadHistory();
    setInterval(loadOrders, 5000);
}

// ========== ФОРМЫ ==========
var loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) {
    loginUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });
}

var registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        registerUser();
    });
}

// ========== НАЗНАЧЕНИЕ КНОПОК НА ГЛАВНОЙ ==========
var orderBtn = document.getElementById('orderBtn');
var phoneBtn = document.getElementById('phoneOrderBtn');
var commentBtn = document.getElementById('commentBtn');
var driverBtn = document.getElementById('driverLoginBtn');
var submitOrderBtn = document.getElementById('submitOrderBtn');
var sendCommentBtn = document.getElementById('sendCommentBtn');
var pickupInput = document.getElementById('orderPickup');
var dropoffInput = document.getElementById('orderDropoff');
var tariffSelect = document.getElementById('orderTariff');

if (orderBtn) orderBtn.onclick = openOrderModal;
if (phoneBtn) phoneBtn.onclick = makePhoneCall;
if (commentBtn) commentBtn.onclick = openCommentModal;
if (driverBtn) driverBtn.onclick = function() { window.location.href = '/login'; };
if (submitOrderBtn) submitOrderBtn.onclick = submitOrder;
if (sendCommentBtn) sendCommentBtn.onclick = sendComment;
if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);

// Обновляем шапку если пользователь авторизован
if (userId) {
    var userStatus = document.getElementById('userStatus');
    if (userStatus) {
        userStatus.innerHTML = '<a href="#" onclick="showProfileModal()">' + userName + '</a> <a href="#" onclick="logout()">Выйти</a>';
    }
}

// Делаем функции глобальными
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
window.searchAddress = searchAddress;
window.getMyLocation = getMyLocation;
window.closeAllModals = closeAllModals;