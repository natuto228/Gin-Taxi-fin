// ========== ПЕРЕМЕННЫЕ ==========
let map;
let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');

// ========== КАРТА ==========
function initMap() {
    if (typeof ymaps === 'undefined') { setTimeout(initMap, 500); return; }
    ymaps.ready(() => {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl']
        });
        map.events.add('click', (e) => {
            const coords = e.get('coords');
            document.getElementById('orderPickup').value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
    });
}
initMap();

// ========== ПОИСК ==========
function searchAddress() {
    const query = document.getElementById('addressSearch').value;
    if (!query) return;
    ymaps.geocode(query, { results: 1 }).then(res => {
        const coords = res.geoObjects.get(0).geometry.getCoordinates();
        map.setCenter(coords, 15);
    }).catch(() => alert('Адрес не найден'));
}

function getMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            map.setCenter([pos.coords.latitude, pos.coords.longitude], 15);
        }, () => alert('Не удалось определить местоположение'));
    } else {
        alert('Геолокация не поддерживается');
    }
}

// ========== МОДАЛКИ ==========
function showOverlay() { document.getElementById('overlay').style.display = 'block'; }
function hideOverlay() { document.getElementById('overlay').style.display = 'none'; }
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
    const p = document.getElementById('orderPickup').value;
    const d = document.getElementById('orderDropoff').value;
    const t = document.getElementById('orderTariff').value;
    if (p && d) {
        let price = 250;
        if (t.includes('Комфорт')) price = 350;
        if (t.includes('Бизнес')) price = 500;
        document.getElementById('pricePreview').innerHTML = 'Примерная стоимость: ' + price + ' ₽';
    }
}
document.getElementById('orderPickup').addEventListener('input', calculatePrice);
document.getElementById('orderDropoff').addEventListener('input', calculatePrice);
document.getElementById('orderTariff').addEventListener('change', calculatePrice);

function sendComment() {
    const c = document.getElementById('driverComment').value;
    alert(c ? 'Комментарий: ' + c : 'Введите комментарий');
    closeCommentModal();
}

async function submitOrder() {
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    let price = 250;
    if (tariff.includes('Комфорт')) price = 350;
    if (tariff.includes('Бизнес')) price = 500;
    
    const fd = new FormData();
    fd.append('pickup', pickup);
    fd.append('dropoff', dropoff);
    fd.append('tariff', tariff);
    fd.append('price', price);
    
    if (userId) {
        fd.append('user_id', userId);
    } else {
        fd.append('guest_name', name);
        fd.append('guest_phone', phone);
        fd.append('guest_email', '');
    }
    
    await fetch('/save-order', { method: 'POST', body: fd });
    alert('Заказ оформлен!');
    closeOrderModal();
}

async function registerUser() {
    const fd = new FormData();
    fd.append('fullname', document.getElementById('regName').value);
    fd.append('phone', document.getElementById('regPhone').value);
    fd.append('email', document.getElementById('regEmail').value);
    fd.append('password', document.getElementById('regPassword').value);
    
    const res = await fetch('/register', { method: 'POST', body: fd });
    const data = await res.json();
    
    if (data.success) {
        alert('Регистрация успешна! Теперь войдите.');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(data.error || 'Ошибка регистрации');
    }
}

async function loginUser() {
    const fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    
    const res = await fetch('/login-user', { method: 'POST', body: fd });
    const data = await res.json();
    
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        alert('Добро пожаловать, ' + data.fullname);
        location.reload();
    } else {
        alert(data.error);
    }
}

async function loadProfile() {
    const id = localStorage.getItem('userId');
    if (!id) return;
    
    const res = await fetch('/user-orders/' + id);
    const orders = await res.json();
    
    document.getElementById('profileInfo').innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    
    if (orders.length === 0) {
        document.getElementById('ordersHistory').innerHTML = '<p>У вас пока нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        orders.forEach(o => {
            html += `<div class="order-card">
                <strong>${o.pickup}</strong> → <strong>${o.dropoff}</strong><br>
                ${o.tariff} | ${o.price} ₽<br>
                Статус: ${o.status}<br>
                <small>${new Date(o.date).toLocaleString()}</small>
            </div>`;
        });
        document.getElementById('ordersHistory').innerHTML = html;
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// Обновляем шапку если пользователь авторизован
if (userId) {
    document.getElementById('userStatus').innerHTML = `<a href="#" onclick="showProfileModal()">${userName}</a> <a href="#" onclick="logout()">Выйти</a>`;
}

// Делаем функции глобальными для onclick
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