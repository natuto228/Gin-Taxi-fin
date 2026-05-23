// ========== ПЕРЕМЕННЫЕ ==========
var map;
var userId = localStorage.getItem('userId');
var userName = localStorage.getItem('userName');
var currentLang = 'ru';

// ========== КАРТА ==========
function initMap() {
    if (typeof ymaps === 'undefined') { setTimeout(initMap, 500); return; }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
        });
        map.events.add('click', function(e) {
            var coords = e.get('coords');
            var pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
    });
}
initMap();

// ========== ПОИСК АДРЕСА ==========
var searchBtn = document.getElementById('searchAddressBtn');
if (searchBtn) {
    searchBtn.onclick = function() {
        var query = document.getElementById('searchAddressInput').value;
        if (!query) return;
        ymaps.geocode(query, { results: 1 }).then(function(res) {
            var coords = res.geoObjects.get(0).geometry.getCoordinates();
            map.setCenter(coords, 15);
        }).catch(function() { alert('Адрес не найден'); });
    };
}

// ========== ГЕОЛОКАЦИЯ ==========
var geoBtn = document.getElementById('geolocationBtn');
if (geoBtn) {
    geoBtn.onclick = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                map.setCenter([pos.coords.latitude, pos.coords.longitude], 15);
            }, function() {
                alert('Не удалось определить местоположение');
            });
        } else {
            alert('Геолокация не поддерживается');
        }
    };
}

// ========== АНГЛИЙСКИЙ ЯЗЫК ==========
var langBtn = document.getElementById('langBtn');
if (langBtn) {
    langBtn.onclick = function() {
        currentLang = (currentLang === 'ru') ? 'en' : 'ru';
        alert(currentLang === 'ru' ? 'Язык переключен на русский' : 'Language switched to English');
    };
}

// ========== ОБЩИЕ ФУНКЦИИ ==========
function showOverlay() { document.getElementById('overlay').style.display = 'block'; }
function hideOverlay() { document.getElementById('overlay').style.display = 'none'; }

function openOrderModal() { document.getElementById('orderModal').style.display = 'block'; showOverlay(); }
function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; hideOverlay(); }

function openCommentModal() { document.getElementById('commentModal').style.display = 'block'; showOverlay(); }
function closeCommentModal() { document.getElementById('commentModal').style.display = 'none'; hideOverlay(); }

function showLoginModal() { document.getElementById('loginModal').style.display = 'block'; showOverlay(); }
function closeLoginModal() { document.getElementById('loginModal').style.display = 'none'; hideOverlay(); }

function showRegisterModal() { document.getElementById('registerModal').style.display = 'block'; showOverlay(); }
function closeRegisterModal() { document.getElementById('registerModal').style.display = 'none'; hideOverlay(); }

function showProfileModal() { 
    var modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'block';
        showOverlay();
        loadProfile();
    }
}
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; hideOverlay(); }

function makePhoneCall() { window.location.href = 'tel:+78121234567'; }

function calculatePrice() {
    var pickup = document.getElementById('orderPickup').value;
    var dropoff = document.getElementById('orderDropoff').value;
    var tariff = document.getElementById('orderTariff').value;
    var priceDiv = document.getElementById('pricePreview');
    if (pickup && dropoff && priceDiv) {
        var pricePerKm = 25;
        if (tariff === 'Комфорт') pricePerKm = 35;
        if (tariff === 'Бизнес') pricePerKm = 50;
        var price = 10 * pricePerKm;
        priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' ₽';
    }
}

function sendComment() {
    var comment = document.getElementById('driverComment').value;
    if (comment) {
        alert('Комментарий отправлен: ' + comment);
        document.getElementById('driverComment').value = '';
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
    var name = document.getElementById('orderName').value;
    var phone = document.getElementById('orderPhone').value;
    var pickup = document.getElementById('orderPickup').value;
    var dropoff = document.getElementById('orderDropoff').value;
    var tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    var pricePerKm = 25;
    if (tariff === 'Комфорт') pricePerKm = 35;
    if (tariff === 'Бизнес') pricePerKm = 50;
    var price = 10 * pricePerKm;
    
    var formData = new FormData();
    formData.append('pickup', pickup);
    formData.append('dropoff', dropoff);
    formData.append('tariff', tariff);
    formData.append('price', price);
    
    if (userId) {
        formData.append('user_id', userId);
    } else {
        formData.append('guest_name', name);
        formData.append('guest_phone', phone);
        formData.append('guest_email', '');
    }
    
    await fetch('/save-order', { method: 'POST', body: formData });
    alert('Заказ оформлен!\nОткуда: ' + pickup + '\nКуда: ' + dropoff + '\nСтоимость: ' + price + ' ₽');
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
}

// ========== РЕГИСТРАЦИЯ ==========
async function register() {
    var formData = new FormData();
    formData.append('fullname', document.getElementById('regName').value);
    formData.append('phone', document.getElementById('regPhone').value);
    formData.append('email', document.getElementById('regEmail').value);
    formData.append('password', document.getElementById('regPassword').value);
    
    var response = await fetch('/register', { method: 'POST', body: formData });
    var result = await response.json();
    if (result.success) {
        alert('Регистрация успешна! Теперь войдите.');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(result.error || 'Ошибка регистрации');
    }
}

// ========== ВХОД ПОЛЬЗОВАТЕЛЯ ==========
async function login() {
    var formData = new FormData();
    formData.append('email', document.getElementById('loginEmail').value);
    formData.append('password', document.getElementById('loginPassword').value);
    
    var response = await fetch('/login-user', { method: 'POST', body: formData });
    var result = await response.json();
    if (result.success) {
        localStorage.setItem('userId', result.user_id);
        localStorage.setItem('userName', result.fullname);
        alert('Добро пожаловать, ' + result.fullname + '!');
        location.reload();
    } else {
        alert(result.error);
    }
}

// ========== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ==========
async function loadProfile() {
    var id = localStorage.getItem('userId');
    if (!id) return;
    var response = await fetch('/user-orders/' + id);
    var orders = await response.json();
    var profileInfo = document.getElementById('profileInfo');
    var ordersHistory = document.getElementById('ordersHistory');
    
    if (profileInfo) profileInfo.innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    var html = '<h4 style="margin: 10px 0;">История заказов</h4>';
    if (orders.length === 0) {
        html += '<p>У вас пока нет заказов</p>';
    } else {
        orders.forEach(function(order) {
            html += '<div class="order-card"><strong>' + order.pickup + '</strong> → <strong>' + order.dropoff + '</strong><br>' +
                    'Тариф: ' + order.tariff + ' | Цена: ' + order.price + ' ₽<br>' +
                    'Статус: ' + order.status + '<br>' +
                    '<small>' + new Date(order.date).toLocaleString() + '</small></div>';
        });
    }
    if (ordersHistory) ordersHistory.innerHTML = html;
}

// ========== НАЗНАЧЕНИЕ КНОПОК ==========
var orderBtn = document.getElementById('orderBtn');
var phoneBtn = document.getElementById('phoneOrderBtn');
var commentBtn = document.getElementById('commentBtn');
var driverBtn = document.getElementById('driverLoginBtn');
var submitBtn = document.getElementById('submitOrderBtn');
var sendBtn = document.getElementById('sendCommentBtn');
var doLoginBtn = document.getElementById('doLoginBtn');
var doRegisterBtn = document.getElementById('doRegisterBtn');
var pickupInput = document.getElementById('orderPickup');
var dropoffInput = document.getElementById('orderDropoff');
var tariffSelect = document.getElementById('orderTariff');

if (orderBtn) orderBtn.onclick = openOrderModal;
if (phoneBtn) phoneBtn.onclick = makePhoneCall;
if (commentBtn) commentBtn.onclick = openCommentModal;
if (driverBtn) driverBtn.onclick = function() { window.location.href = '/login'; };
if (submitBtn) submitBtn.onclick = submitOrder;
if (sendBtn) sendBtn.onclick = sendComment;
if (doLoginBtn) doLoginBtn.onclick = login;
if (doRegisterBtn) doRegisterBtn.onclick = register;
if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);

if (userId && document.getElementById('userStatus')) {
    var userStatus = document.getElementById('userStatus');
    userStatus.innerHTML = '<button class="lang-btn" id="langBtn">English</button><a href="#" onclick="showProfileModal()">' + userName + '</a> <a href="#" onclick="logout()">Выйти</a>';
    var newLangBtn = document.getElementById('langBtn');
    if (newLangBtn) {
        newLangBtn.onclick = function() {
            currentLang = (currentLang === 'ru') ? 'en' : 'ru';
            alert(currentLang === 'ru' ? 'Язык переключен на русский' : 'Language switched to English');
        };
    }
}

window.closeOrderModal = closeOrderModal;
window.closeCommentModal = closeCommentModal;
window.closeLoginModal = closeLoginModal;
window.closeRegisterModal = closeRegisterModal;
window.closeProfileModal = closeProfileModal;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showProfileModal = showProfileModal;
window.logout = logout;

// ========== АДМИН-ПАНЕЛЬ ==========
if (window.location.pathname === '/admin') {
    document.body.innerHTML = '<div class="admin-container" style="padding:20px; font-family: SouthGhetto; max-width:1200px; margin:0 auto;"><h1>Админ-панель</h1><div style="display: flex; gap: 20px; flex-wrap: wrap;"><div style="flex: 1;"><h3>Заказы</h3><div id="adminOrders"></div></div><div style="flex: 1;"><h3>Водители</h3><div id="adminDrivers"></div></div></div><a href="/" style="display: inline-block; margin-top: 20px; color: #87CEFA;">На главную</a></div>';
    
    fetch('/api/all-orders').then(r => r.json()).then(orders => {
        document.getElementById('adminOrders').innerHTML = orders.map(o => `<div class="order-card">Заказ ${o.id}: ${o.pickup_address} → ${o.dropoff_address} (${o.status})</div>`).join('');
    });
    fetch('/api/all-drivers').then(r => r.json()).then(drivers => {
        document.getElementById('adminDrivers').innerHTML = drivers.map(d => `<div class="order-card">${d.fullname} (${d.phone})</div>`).join('');
    });
}