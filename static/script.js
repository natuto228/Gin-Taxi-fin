let map;
let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');

// КАРТА
function initMap() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initMap, 500);
        return;
    }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl']
        });
        map.events.add('click', function(e) {
            let coords = e.get('coords');
            let pickup = document.getElementById('orderPickup');
            if (pickup) pickup.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
        console.log('Карта готова');
    });
}
initMap();

// ПОИСК АДРЕСА (РАБОТАЕТ)
function searchAddress() {
    let query = document.getElementById('addressSearch').value;
    if (!query) {
        alert('Введите адрес');
        return;
    }
    if (!map) {
        alert('Карта не загружена');
        return;
    }
    ymaps.geocode(query, { results: 1 }).then(function(res) {
        let obj = res.geoObjects.get(0);
        if (obj) {
            let coords = obj.geometry.getCoordinates();
            map.setCenter(coords, 15);
            if (window.searchMarker) map.geoObjects.remove(window.searchMarker);
            window.searchMarker = new ymaps.Placemark(coords);
            map.geoObjects.add(window.searchMarker);
        } else {
            alert('Адрес не найден');
        }
    }).catch(function(e) {
        console.error(e);
        alert('Ошибка поиска');
    });
}

// ГЕОЛОКАЦИЯ
function getMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            map.setCenter([pos.coords.latitude, pos.coords.longitude], 15);
        }, function() {
            alert('Не удалось определить местоположение');
        });
    } else {
        alert('Геолокация не поддерживается');
    }
}

// МОДАЛКИ
function showOverlay() { let el = document.getElementById('overlay'); if (el) el.style.display = 'block'; }
function hideOverlay() { let el = document.getElementById('overlay'); if (el) el.style.display = 'none'; }
function closeAllModals() { hideOverlay(); document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }

function openOrderModal() { document.getElementById('orderModal').style.display = 'block'; showOverlay(); }
function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; hideOverlay(); }
function openCommentModal() { document.getElementById('commentModal').style.display = 'block'; showOverlay(); }
function closeCommentModal() { document.getElementById('commentModal').style.display = 'none'; hideOverlay(); }
function showLoginModal() { document.getElementById('loginModal').style.display = 'block'; showOverlay(); }
function closeLoginModal() { document.getElementById('loginModal').style.display = 'none'; hideOverlay(); }
function showRegisterModal() { document.getElementById('registerModal').style.display = 'block'; showOverlay(); }
function closeRegisterModal() { document.getElementById('registerModal').style.display = 'none'; hideOverlay(); }
function showProfileModal() { document.getElementById('profileModal').style.display = 'block'; showOverlay(); loadProfile(); }
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; hideOverlay(); }

function makePhoneCall() { window.location.href = 'tel:+78121234567'; }

function calculatePrice() {
    let p = document.getElementById('orderPickup');
    let d = document.getElementById('orderDropoff');
    let t = document.getElementById('orderTariff');
    let priceDiv = document.getElementById('pricePreview');
    if (p && d && t && p.value && d.value) {
        let price = 250;
        if (t.value.includes('Комфорт')) price = 350;
        if (t.value.includes('Бизнес')) price = 500;
        priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' ₽';
    }
}

function sendComment() {
    let c = document.getElementById('driverComment');
    if (c && c.value) {
        alert('Комментарий: ' + c.value);
        c.value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

function logout() { localStorage.clear(); location.reload(); }

// ЗАКАЗ
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

// РЕГИСТРАЦИЯ
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

// ВХОД ПОЛЬЗОВАТЕЛЯ
async function loginUser() {
    let fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    let res = await fetch('/login-user', { method: 'POST', body: fd });
    let data = await res.json();
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        alert('Добро пожаловать, ' + data.fullname);
        location.reload();
    } else {
        alert(data.error);
    }
}

// ПРОФИЛЬ
async function loadProfile() {
    let id = localStorage.getItem('userId');
    if (!id) return;
    let res = await fetch('/user-orders/' + id);
    let orders = await res.json();
    let info = document.getElementById('profileInfo');
    let history = document.getElementById('ordersHistory');
    if (info) info.innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    if (orders.length === 0) {
        if (history) history.innerHTML = '<p>У вас пока нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        for (let o of orders) {
            html += '<div class="order-card"><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong><br>' +
                    o.tariff + ' | ' + o.price + ' ₽<br>' +
                    'Статус: ' + o.status + '<br>' +
                    '<small>' + new Date(o.date).toLocaleString() + '</small></div>';
        }
        if (history) history.innerHTML = html;
    }
}

// ВХОД ВОДИТЕЛЯ
let driverForm = document.getElementById('driverLoginForm');
if (driverForm) {
    driverForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let login = document.getElementById('driverLogin').value;
        let password = document.getElementById('driverPassword').value;
        if (login === 'driver' && password === '12345') {
            localStorage.setItem('driverLoggedIn', 'true');
            window.location.href = '/driver-dashboard';
        } else {
            alert('Неверный логин или пароль');
        }
    });
}

// КАБИНЕТ ВОДИТЕЛЯ
if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driverLoggedIn')) window.location.href = '/login';
    let statusBtn = document.getElementById('statusBtn');
    if (statusBtn) {
        let isOnline = true;
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
        for (let o of orders) {
            html += '<div class="order-item"><div><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong></div>' +
                    '<div>Тариф: ' + o.tariff + ' | Цена: ' + o.price + ' ₽</div>' +
                    '<button class="order-accept-btn" data-id="' + o.id + '">Принять</button></div>';
        }
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
        for (let o of orders) {
            html += '<div class="order-item"><div><strong>' + o.pickup_address + '</strong> → <strong>' + o.dropoff_address + '</strong></div>' +
                    '<div>Тариф: ' + o.tariff + ' | Цена: ' + o.price + ' ₽</div>' +
                    '<div>Статус: ' + o.status + '</div>' +
                    '<div><small>' + new Date(o.created_at).toLocaleString() + '</small></div></div>';
        }
        container.innerHTML = html;
    }
    loadOrders();
    loadHistory();
    setInterval(loadOrders, 5000);
}

// ФОРМЫ
let loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) loginUserForm.addEventListener('submit', (e) => { e.preventDefault(); loginUser(); });
let registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); registerUser(); });

// КНОПКИ НА ГЛАВНОЙ
let orderBtn = document.getElementById('orderBtn');
let phoneBtn = document.getElementById('phoneOrderBtn');
let commentBtn = document.getElementById('commentBtn');
let driverBtn = document.getElementById('driverLoginBtn');
let submitOrderBtn = document.getElementById('submitOrderBtn');
let sendCommentBtn = document.getElementById('sendCommentBtn');
let pickupInput = document.getElementById('orderPickup');
let dropoffInput = document.getElementById('orderDropoff');
let tariffSelect = document.getElementById('orderTariff');

if (orderBtn) orderBtn.onclick = openOrderModal;
if (phoneBtn) phoneBtn.onclick = makePhoneCall;
if (commentBtn) commentBtn.onclick = openCommentModal;
if (driverBtn) driverBtn.onclick = () => window.location.href = '/login';
if (submitOrderBtn) submitOrderBtn.onclick = submitOrder;
if (sendCommentBtn) sendCommentBtn.onclick = sendComment;
if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);

if (userId) {
    let userStatus = document.getElementById('userStatus');
    if (userStatus) {
        userStatus.innerHTML = '<a href="#" onclick="showProfileModal()">' + userName + '</a> <a href="#" onclick="logout()">Выйти</a>';
    }
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ
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