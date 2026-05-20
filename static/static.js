// ===== КАРТА И ОБЩИЕ ФУНКЦИИ =====
let map;
let dropoffMarker = null;
let pickupMarker = null;

const centerLat = 59.9343;
const centerLon = 30.3351;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/') {
        initMap();
        
        const searchBtn = document.getElementById('searchBtn');
        const myLocationBtn = document.getElementById('myLocationBtn');
        const orderBtn = document.getElementById('orderBtn');
        const phoneOrderBtn = document.getElementById('phoneOrderBtn');
        const commentBtn = document.getElementById('commentBtn');
        const sendCommentBtn = document.getElementById('sendCommentBtn');
        const closeCommentBtn = document.getElementById('closeCommentBtn');
        const driverLoginBtn = document.getElementById('driverLoginBtn');
        
        if (searchBtn) searchBtn.onclick = searchAddress;
        if (myLocationBtn) myLocationBtn.onclick = setCurrentLocation;
        if (orderBtn) orderBtn.onclick = orderTaxi;
        if (phoneOrderBtn) phoneOrderBtn.onclick = makePhoneCall;
        if (commentBtn) commentBtn.onclick = openCommentModal;
        if (sendCommentBtn) sendCommentBtn.onclick = sendComment;
        if (closeCommentBtn) closeCommentBtn.onclick = closeCommentModal;
        if (driverLoginBtn) driverLoginBtn.onclick = function() { window.location.href = '/login'; };
        
        const userName = localStorage.getItem('userName');
        if (userName) {
            const userNameHeader = document.getElementById('userNameHeader');
            if (userNameHeader) {
                userNameHeader.innerHTML = userName + ' | <a href="/user-profile">Профиль</a> | <a href="/" onclick="localStorage.clear()">Выйти</a>';
            }
        }
    }
});

function initMap() {
    map = L.map('map').setView([centerLat, centerLon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', async function(e) {
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        dropoffMarker = L.marker([e.latlng.lat, e.latlng.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map).bindPopup('Точка назначения').openPopup();
        
        const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
        const dropoffInput = document.getElementById('orderDropoff');
        if (dropoffInput) dropoffInput.value = address;
    });
}

async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
        const data = await response.json();
        return data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

function searchAddress() {
    const query = document.getElementById('addressSearch').value;
    if (!query) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 15);
                if (dropoffMarker) map.removeLayer(dropoffMarker);
                dropoffMarker = L.marker([lat, lon], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    })
                }).addTo(map).bindPopup('Точка назначения').openPopup();
                document.getElementById('orderDropoff').value = query;
            } else {
                alert('Адрес не найден');
            }
        });
}

function setCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 15);
            if (pickupMarker) map.removeLayer(pickupMarker);
            pickupMarker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }).addTo(map).bindPopup('Вы здесь').openPopup();
            const address = await getAddressFromCoords(lat, lng);
            document.getElementById('pickupAddress').value = address;
        });
    } else {
        alert('Геолокация не поддерживается');
    }
}

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function orderTaxi() {
    const pickup = document.getElementById('pickupAddress').value;
    const dropoff = document.getElementById('dropoffAddress').value;
    const tariffSelect = document.getElementById('tariffSelect');
    
    if (!pickup || !dropoff) {
        alert('Укажите адрес отправления и назначения');
        return;
    }
    
    let tariffName = '';
    let pricePerKm = 0;
    if (tariffSelect) {
        const tariff = tariffSelect.value;
        if (tariff === 'econom') { tariffName = 'Эконом'; pricePerKm = 25; }
        if (tariff === 'comfort') { tariffName = 'Комфорт'; pricePerKm = 35; }
        if (tariff === 'business') { tariffName = 'Бизнес'; pricePerKm = 50; }
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Пожалуйста, войдите в аккаунт');
        window.location.href = '/login-user';
        return;
    }
    
    const estimatedPrice = pricePerKm * 10;
    
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('pickup', pickup);
    formData.append('dropoff', dropoff);
    formData.append('tariff', tariffName);
    formData.append('price', estimatedPrice);
    
    fetch('/save-order', { method: 'POST', body: formData });
    
    alert(`Заказ оформлен!\n\nТариф: ${tariffName}\nОткуда: ${pickup}\nКуда: ${dropoff}\nСтоимость: ${estimatedPrice} ₽`);
    
    document.getElementById('pickupAddress').value = '';
    document.getElementById('dropoffAddress').value = '';
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function openCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'flex';
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
}

function sendComment() {
    const comment = document.getElementById('driverComment').value;
    if (comment) {
        alert('Комментарий отправлен');
        document.getElementById('driverComment').value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

function openOrderForm() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'flex';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

function submitOrder() {
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
    if (tariff.includes('Эконом')) price = 250;
    if (tariff.includes('Комфорт')) price = 350;
    if (tariff.includes('Бизнес')) price = 500;
    
    const userId = localStorage.getItem('userId');
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
    
    fetch('/save-order', { method: 'POST', body: formData });
    
    alert('Заказ оформлен');
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
}

// ===== ЛОГИКА ДЛЯ СТРАНИЦЫ ВХОДА ВОДИТЕЛЯ =====
if (window.location.pathname === '/login') {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            localStorage.setItem('driverLoggedIn', 'true');
            window.location.href = '/driver-dashboard';
        });
    }
}

// ===== ЛОГИКА ДЛЯ КАБИНЕТА ВОДИТЕЛЯ =====
if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driverLoggedIn')) {
        window.location.href = '/login';
    }
    
    let isOnline = true;
    let earnings = 0;
    
    const statusBtn = document.getElementById('statusBtn');
    const earningsSpan = document.getElementById('earnings');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (statusBtn) {
        statusBtn.onclick = function() {
            isOnline = !isOnline;
            if (isOnline) {
                statusBtn.textContent = 'Онлайн';
                statusBtn.classList.remove('offline');
                statusBtn.classList.add('online');
            } else {
                statusBtn.textContent = 'Офлайн';
                statusBtn.classList.remove('online');
                statusBtn.classList.add('offline');
            }
        };
    }
    
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('driverLoggedIn');
        };
    }
    
    async function loadOrders() {
        try {
            const response = await fetch('/user-orders/all');
            if (response.ok) {
                const orders = await response.json();
                const container = document.getElementById('ordersList');
                if (orders.length === 0) {
                    container.innerHTML = '<div class="driver-no-orders">Нет новых заказов</div>';
                    return;
                }
                let html = '';
                orders.forEach(order => {
                    html += `
                        <div class="order-item">
                            <div class="row align-items-center">
                                <div class="col-6">
                                    <div class="order-pickup"><strong>Откуда:</strong> ${order.pickup}</div>
                                    <div class="order-dropoff"><strong>Куда:</strong> ${order.dropoff}</div>
                                </div>
                                <div class="col-3">
                                    <span class="order-tariff">${order.tariff}</span>
                                    <div class="order-price">${order.price} ₽</div>
                                </div>
                                <div class="col-3">
                                    <button class="order-accept-btn" data-order-id="${order.id}">Принять</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
                
                document.querySelectorAll('.order-accept-btn').forEach(btn => {
                    btn.onclick = function() {
                        earnings += 200;
                        if (earningsSpan) earningsSpan.textContent = earnings + ' ₽';
                        alert('Заказ принят! Еду к пассажиру.');
                        loadOrders();
                    };
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
        }
    }
    
    loadOrders();
    setInterval(loadOrders, 5000);
}

// ===== ЛОГИКА ДЛЯ ВХОДА ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/login-user') {
    const form = document.getElementById('loginUserForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            
            const response = await fetch('/login-user', { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('userId', result.user_id);
                localStorage.setItem('userName', result.fullname);
                localStorage.setItem('userPhone', result.phone);
                localStorage.setItem('userEmail', result.email);
                alert('Добро пожаловать, ' + result.fullname + '!');
                window.location.href = '/user-profile';
            } else {
                alert(result.error);
            }
        });
    }
}

// ===== ЛОГИКА ДЛЯ РЕГИСТРАЦИИ =====
if (window.location.pathname === '/register') {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
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
}

// ===== ЛОГИКА ДЛЯ ЛИЧНОГО КАБИНЕТА ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/user-profile') {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) window.location.href = '/login-user';
    
    const fullnameSpan = document.getElementById('userFullname');
    const displaySpan = document.getElementById('userNameDisplay');
    
    if (fullnameSpan) fullnameSpan.innerText = userName;
    if (displaySpan) displaySpan.innerText = userName;
    
    async function loadOrders() {
        const response = await fetch('/user-orders/' + userId);
        const orders = await response.json();
        const container = document.getElementById('ordersHistory');
        
        const totalOrdersSpan = document.getElementById('totalOrders');
        if (totalOrdersSpan) totalOrdersSpan.innerText = orders.length;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="profile-loading">У вас пока нет заказов</div>';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="order-item">
                    <div class="row">
                        <div class="col-5">
                            <small style="color: #999;">${order.date}</small>
                            <div class="order-pickup"><strong>Откуда:</strong> ${order.pickup}</div>
                            <div class="order-dropoff"><strong>Куда:</strong> ${order.dropoff}</div>
                        </div>
                        <div class="col-3">
                            <span class="order-tariff">${order.tariff}</span>
                            <div class="order-price">${order.price} ₽</div>
                        </div>
                        <div class="col-4">
                            <span class="badge" style="background: ${order.status === 'Новый' ? '#ffc107' : '#28a745'}; color: ${order.status === 'Новый' ? '#000' : '#fff'};">${order.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    loadOrders();
}

// ===== ЛОГИКА ДЛЯ АНКЕТЫ =====
if (window.location.pathname === '/application') {
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('fullname', document.getElementById('appFullname').value);
            formData.append('phone', document.getElementById('appPhone').value);
            formData.append('email', document.getElementById('appEmail').value);
            formData.append('role', document.getElementById('appRole').value);
            
            await fetch('/save-application', { method: 'POST', body: formData });
            alert('Спасибо! Мы свяжемся с вами.');
            window.location.href = '/login';
        });
    }
}