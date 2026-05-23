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
            const coords = e.get('coords');
            const pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
    });
}
initMap();

// ========== ПОИСК АДРЕСА (ОТДЕЛЬНО) ==========
const searchAddressBtn = document.getElementById('searchAddressBtn');
if (searchAddressBtn) {
    searchAddressBtn.onclick = function() {
        const query = document.getElementById('searchAddressInput').value;
        if (!query) return;
        ymaps.geocode(query, { results: 1 }).then(function(res) {
            const coords = res.geoObjects.get(0).geometry.getCoordinates();
            map.setCenter(coords, 15);
        }).catch(function() { alert('Адрес не найден'); });
    };
}

// ========== ГЕОЛОКАЦИЯ ==========
const geolocationBtn = document.getElementById('geolocationBtn');
if (geolocationBtn) {
    geolocationBtn.onclick = function() {
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
    document.getElementById('profileModal').style.display = 'block'; 
    showOverlay();
    loadProfile();
}
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; hideOverlay(); }

function makePhoneCall() { window.location.href = 'tel:+78121234567'; }

function calculatePrice() {
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    const priceDiv = document.getElementById('pricePreview');
    if (pickup && dropoff && priceDiv) {
        let pricePerKm = 25;
        if (tariff === 'Комфорт') pricePerKm = 35;
        if (tariff === 'Бизнес') pricePerKm = 50;
        priceDiv.innerHTML = 'Примерная стоимость: ' + (10 * pricePerKm) + ' ₽';
    }
}

function sendComment() {
    const comment = document.getElementById('driverComment').value;
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
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    let pricePerKm = 25;
    if (tariff === 'Комфорт') pricePerKm = 35;
    if (tariff === 'Бизнес') pricePerKm = 50;
    const price = 10 * pricePerKm;
    
    const formData = new FormData();
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
    const formData = new FormData();
    formData.append('fullname', document.getElementById('regName').value);
    formData.append('phone', document.getElementById('regPhone').value);
    formData.append('email', document.getElementById('regEmail').value);
    formData.append('password', document.getElementById('regPassword').value);
    
    const response = await fetch('/register', { method: 'POST', body: formData });
    const result = await response.json();
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
    const formData = new FormData();
    formData.append('email', document.getElementById('loginEmail').value);
    formData.append('password', document.getElementById('loginPassword').value);
    
    const response = await fetch('/login-user', { method: 'POST', body: formData });
    const result = await response.json();
    if (result.success) {
        localStorage.setItem('userId', result.user_id);
        localStorage.setItem('userName', result.fullname);
        alert('Добро пожаловать, ' + result.fullname + '!');
        window.location.href = '/';
    } else {
        alert(result.error);
    }
}

// ========== ПРОФИЛЬ ==========
async function loadProfile() {
    const id = localStorage.getItem('userId');
    if (!id) return;
    const response = await fetch('/user-orders/' + id);
    const orders = await response.json();
    
    document.getElementById('profileInfo').innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    
    if (orders.length === 0) {
        document.getElementById('ordersHistory').innerHTML = '<p>У вас пока нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        orders.forEach(order => {
            html += `<div class="order-card">
                <strong>${order.pickup}</strong> → <strong>${order.dropoff}</strong><br>
                Тариф: ${order.tariff} | Цена: ${order.price} ₽<br>
                Статус: ${order.status}<br>
                <small>${new Date(order.date).toLocaleString()}</small>
            </div>`;
        });
        document.getElementById('ordersHistory').innerHTML = html;
    }
}

// ========== ВХОД ВОДИТЕЛЯ ==========
const driverForm = document.getElementById('driverLoginForm');
if (driverForm) {
    driverForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const login = document.getElementById('driverLogin').value;
        const password = document.getElementById('driverPassword').value;
        
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
    
    let isOnline = true;
    let earnings = 0;
    
    const statusBtn = document.getElementById('statusBtn');
    if (statusBtn) {
        statusBtn.onclick = function() {
            isOnline = !isOnline;
            statusBtn.textContent = isOnline ? 'Онлайн' : 'Офлайн';
            statusBtn.className = isOnline ? 'driver-status-btn online' : 'driver-status-btn offline';
        };
    }
    
    async function loadOrders() {
        const response = await fetch('/user-orders/all');
        const orders = await response.json();
        const container = document.getElementById('ordersList');
        
        if (!orders.length) {
            container.innerHTML = '<div class="driver-no-orders">Нет новых заказов</div>';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="order-item">
                    <div><strong>${order.pickup}</strong> → <strong>${order.dropoff}</strong></div>
                    <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                    <button class="order-accept-btn" data-id="${order.id}">Принять</button>
                </div>
            `;
        });
        container.innerHTML = html;
        
        document.querySelectorAll('.order-accept-btn').forEach(btn => {
            btn.onclick = async function() {
                const orderId = this.dataset.id;
                const formData = new FormData();
                formData.append('driver_id', 1);
                await fetch(`/assign-order/${orderId}`, { method: 'POST', body: formData });
                earnings += 200;
                document.getElementById('earnings').innerText = earnings + ' ₽';
                alert('Заказ принят!');
                loadOrders();
                loadHistory();
            };
        });
    }
    
    async function loadHistory() {
        const response = await fetch('/driver-orders/1');
        const orders = await response.json();
        const container = document.getElementById('historyList');
        
        if (!orders.length) {
            container.innerHTML = '<div class="driver-no-orders">Нет выполненных заказов</div>';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="order-item">
                    <div><strong>${order.pickup_address}</strong> → <strong>${order.dropoff_address}</strong></div>
                    <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                    <div>Статус: ${order.status}</div>
                    <div><small>${new Date(order.created_at).toLocaleString()}</small></div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    loadOrders();
    loadHistory();
    setInterval(loadOrders, 5000);
}

// ========== ФОРМА ВХОДА ПОЛЬЗОВАТЕЛЯ ==========
const loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) {
    loginUserForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('email', document.getElementById('email').value);
        formData.append('password', document.getElementById('password').value);
        
        const response = await fetch('/login-user', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('userId', result.user_id);
            localStorage.setItem('userName', result.fullname);
            alert('Добро пожаловать, ' + result.fullname);
            window.location.href = '/';
        } else {
            alert(result.error);
        }
    });
}

// ========== ФОРМА РЕГИСТРАЦИИ ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('fullname', document.getElementById('fullname').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('password', document.getElementById('password').value);
        
        const response = await fetch('/register', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            alert('Регистрация успешна! Теперь войдите.');
            window.location.href = '/login-user';
        } else {
            alert(result.error || 'Ошибка регистрации');
        }
    });
}

// ========== НАЗНАЧЕНИЕ КНОПОК НА ГЛАВНОЙ ==========
const orderBtn = document.getElementById('orderBtn');
const phoneBtn = document.getElementById('phoneOrderBtn');
const commentBtn = document.getElementById('commentBtn');
const driverBtn = document.getElementById('driverLoginBtn');
const submitOrderBtn = document.getElementById('submitOrderBtn');
const sendCommentBtn = document.getElementById('sendCommentBtn');
const closeOrderBtn = document.getElementById('closeOrderBtn');
const closeCommentBtn = document.getElementById('closeCommentBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const closeRegisterBtn = document.getElementById('closeRegisterBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showLoginLink = document.getElementById('showLoginBtn');
const showRegisterLink = document.getElementById('showRegisterBtn');
const switchToRegisterLink = document.getElementById('switchToRegister');
const switchToLoginLink = document.getElementById('switchToLogin');

if (orderBtn) orderBtn.onclick = openOrderModal;
if (phoneBtn) phoneBtn.onclick = makePhoneCall;
if (commentBtn) commentBtn.onclick = openCommentModal;
if (driverBtn) driverBtn.onclick = () => window.location.href = '/login';
if (submitOrderBtn) submitOrderBtn.onclick = submitOrder;
if (sendCommentBtn) sendCommentBtn.onclick = sendComment;
if (closeOrderBtn) closeOrderBtn.onclick = closeOrderModal;
if (closeCommentBtn) closeCommentBtn.onclick = closeCommentModal;
if (closeLoginBtn) closeLoginBtn.onclick = closeLoginModal;
if (closeRegisterBtn) closeRegisterBtn.onclick = closeRegisterModal;
if (closeProfileBtn) closeProfileBtn.onclick = closeProfileModal;
if (logoutBtn) logoutBtn.onclick = logout;
if (showLoginLink) showLoginLink.onclick = showLoginModal;
if (showRegisterLink) showRegisterLink.onclick = showRegisterModal;
if (switchToRegisterLink) switchToRegisterLink.onclick = () => { closeLoginModal(); showRegisterModal(); };
if (switchToLoginLink) switchToLoginLink.onclick = () => { closeRegisterModal(); showLoginModal(); };

const pickupInput = document.getElementById('orderPickup');
const dropoffInput = document.getElementById('orderDropoff');
const tariffSelect = document.getElementById('orderTariff');
if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);

// Обновляем шапку если пользователь авторизован
if (userId && document.getElementById('userStatus')) {
    const userStatus = document.getElementById('userStatus');
    userStatus.innerHTML = '<button class="lang-btn" id="langBtn">English</button><a href="#" id="profileLink">' + userName + '</a> <a href="#" id="logoutLink">Выйти</a>';
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    if (profileLink) profileLink.onclick = showProfileModal;
    if (logoutLink) logoutLink.onclick = logout;
}

// ========== АНГЛИЙСКИЙ ЯЗЫК ==========
let currentLang = 'ru';
const langBtn = document.getElementById('langBtn');
if (langBtn) {
    langBtn.onclick = function() {
        currentLang = (currentLang === 'ru') ? 'en' : 'ru';
        alert(currentLang === 'ru' ? 'Язык переключен на русский' : 'Language switched to English');
    };
}

// ========== АДМИН-ПАНЕЛЬ ==========
if (window.location.pathname === '/admin') {
    document.body.innerHTML = '<div style="padding:20px; font-family: SouthGhetto; max-width:1200px; margin:0 auto;"><h1>Админ-панель</h1><div style="display: flex; gap: 20px;"><div style="flex:1"><h3>Заказы</h3><div id="adminOrders"></div></div><div style="flex:1"><h3>Водители</h3><div id="adminDrivers"></div></div></div><a href="/">На главную</a></div>';
    fetch('/api/all-orders').then(r => r.json()).then(orders => {
        document.getElementById('adminOrders').innerHTML = orders.map(o => `<div style="border:1px solid #ddd; padding:10px; margin:5px;">Заказ ${o.id}: ${o.pickup_address} → ${o.dropoff_address} (${o.status})</div>`).join('');
    });
    fetch('/api/all-drivers').then(r => r.json()).then(drivers => {
        document.getElementById('adminDrivers').innerHTML = drivers.map(d => `<div style="border:1px solid #ddd; padding:10px; margin:5px;">${d.fullname} (${d.phone})</div>`).join('');
    });
}