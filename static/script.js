let map;
let userMarker = null;
let carMarker = null;
let simulationInterval = null;

function initMap() {
    if (typeof ymaps === 'undefined') {
        console.log('Яндекс.Карты не загружены, повтор через 0.5 сек');
        setTimeout(initMap, 500);
        return;
    }
    
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
        });
        
        map.events.add('click', async function(e) {
            const coords = e.get('coords');
            const address = await getAddressFromCoords(coords[0], coords[1]);
            const pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = address;
            
            if (userMarker) map.geoObjects.remove(userMarker);
            userMarker = new ymaps.Placemark(coords);
            map.geoObjects.add(userMarker);
        });
        
        console.log('Яндекс карта готова');
        setTimeout(startSimulation, 2000);
    });
}

async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?geocode=${lng},${lat}&format=json`);
        const data = await response.json();
        const address = data.response.GeoObjectCollection.featureMember[0]?.GeoObject.metaDataProperty.GeocoderMetaData.text;
        return address || `${lat}, ${lng}`;
    } catch (error) {
        return `${lat}, ${lng}`;
    }
}

function searchAddress() {
    const query = document.getElementById('addressSearch').value;
    if (!query) return;
    
    ymaps.geocode(query, { results: 1 }).then(function(res) {
        const firstGeoObject = res.geoObjects.get(0);
        const coords = firstGeoObject.geometry.getCoordinates();
        const address = firstGeoObject.getAddressLine();
        
        map.setCenter(coords, 15);
        
        if (userMarker) map.geoObjects.remove(userMarker);
        userMarker = new ymaps.Placemark(coords);
        map.geoObjects.add(userMarker);
        
        document.getElementById('orderPickup').value = address;
    }).catch(function() {
        alert('Адрес не найден');
    });
}

function setCurrentLocation() {
    if (!ymaps.geolocation) {
        alert('Геолокация не поддерживается');
        return;
    }
    
    ymaps.geolocation.get({
        mapStateAutoApply: true
    }).then(function(result) {
        const coords = result.geoObjects.position;
        map.setCenter(coords, 15);
        
        if (userMarker) map.geoObjects.remove(userMarker);
        userMarker = new ymaps.Placemark(coords);
        map.geoObjects.add(userMarker);
        
        getAddressFromCoords(coords[0], coords[1]).then(address => {
            document.getElementById('orderPickup').value = address;
        });
    }).catch(function() {
        alert('Не удалось определить местоположение');
    });
}

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function openOrderForm() {
    document.getElementById('orderModal').style.display = 'flex';
    calculatePrice();
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function openCommentModal() {
    document.getElementById('commentModal').style.display = 'flex';
}

function closeCommentModal() {
    document.getElementById('commentModal').style.display = 'none';
}

function calculatePrice() {
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    const priceDiv = document.getElementById('pricePreview');
    
    if (!pickup || !dropoff) {
        if (priceDiv) priceDiv.innerHTML = '';
        return;
    }
    
    let pricePerKm = 25;
    if (tariff.includes('Комфорт')) pricePerKm = 35;
    if (tariff.includes('Бизнес')) pricePerKm = 50;
    
    const distance = 10;
    const price = distance * pricePerKm;
    
    if (priceDiv) priceDiv.innerHTML = `Примерная стоимость: ${price} ₽`;
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
    
    await fetch('/save-order', { method: 'POST', body: formData });
    alert(`Заказ оформлен!\nОткуда: ${pickup}\nКуда: ${dropoff}\nСтоимость: ${price} ₽`);
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
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

function toggleLanguage() {
    const isRu = document.documentElement.lang === 'ru';
    document.documentElement.lang = isRu ? 'en' : 'ru';
    
    const translations = {
        'Заказ по телефону': 'Phone order',
        'Выбрать тариф': 'Choose tariff',
        'Комментарий водителю': 'Comment to driver',
        'Войти в профиль': 'Login',
        'Работа в такси': 'Work as taxi',
        'Заказать такси': 'Order taxi',
        'Отмена': 'Cancel',
        'Отправить': 'Send',
        'Войти': 'Login',
        'English': 'Russian',
        'Поиск адреса': 'Search address',
        'Найти': 'Find',
        'ФИО': 'Full name',
        'Телефон': 'Phone',
        'Адрес подачи': 'Pickup address',
        'Адрес назначения': 'Dropoff address',
        'Эконом - 25 руб/км': 'Econom - 25 RUB/km',
        'Комфорт - 35 руб/км': 'Comfort - 35 RUB/km',
        'Бизнес - 50 руб/км': 'Business - 50 RUB/km',
        'Примерная стоимость': 'Estimated price'
    };
    
    for (const [ru, en] of Object.entries(translations)) {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.innerText === ru && isRu) {
                el.innerText = en;
            } else if (el.innerText === en && !isRu) {
                el.innerText = ru;
            }
        });
    }
    
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.innerText = isRu ? 'Russian' : 'English';
    }
}

function initCarSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    
    let step = 0;
    const path = [
        [55.751244, 37.618423],
        [55.761244, 37.628423],
        [55.771244, 37.638423]
    ];
    
    if (!carMarker && map) {
        carMarker = new ymaps.Placemark(path[0], {
            preset: 'islands#carIcon'
        });
        map.geoObjects.add(carMarker);
    }
    
    simulationInterval = setInterval(() => {
        if (!carMarker || !map) return;
        step = (step + 1) % path.length;
        carMarker.geometry.setCoordinates(path[step]);
        map.setCenter(path[step], 15);
        
        const carDiv = document.getElementById('carLocation');
        if (carDiv) carDiv.style.display = 'block';
    }, 5000);
}

function startSimulation() {
    if (map) initCarSimulation();
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/') {
        initMap();
        
        document.getElementById('searchBtn')?.addEventListener('click', searchAddress);
        document.getElementById('myLocationBtn')?.addEventListener('click', setCurrentLocation);
        document.getElementById('orderBtn')?.addEventListener('click', openOrderForm);
        document.getElementById('phoneOrderBtn')?.addEventListener('click', makePhoneCall);
        document.getElementById('commentBtn')?.addEventListener('click', openCommentModal);
        document.getElementById('driverLoginBtn')?.addEventListener('click', () => window.location.href = '/login');
        
        const langBtn = document.getElementById('langBtn');
        if (langBtn) langBtn.addEventListener('click', toggleLanguage);
        
        const pickupInput = document.getElementById('orderPickup');
        const dropoffInput = document.getElementById('orderDropoff');
        const tariffSelect = document.getElementById('orderTariff');
        
        if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
        if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
        if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);
    }
});

if (window.location.pathname === '/login') {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const smsCode = document.getElementById('smsCode').value;
            if (smsCode !== '123456') {
                alert('Неверный SMS код');
                return;
            }
            localStorage.setItem('driver', 'true');
            localStorage.setItem('driverId', '2');
            window.location.href = '/driver-dashboard';
        });
    }
}

if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driver')) window.location.href = '/login';
    loadDriverOrders();
    loadDriverHistory();
}

async function loadDriverOrders() {
    const response = await fetch('/user-orders/all');
    const orders = await response.json();
    const container = document.getElementById('ordersList');
    
    if (!orders.length) {
        container.innerHTML = '<div class="alert alert-info">Нет новых заказов</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <div>${order.pickup} → ${order.dropoff}</div>
                <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-warning" onclick="updateStatus(${order.id}, 'Еду к пассажиру')">Еду к пассажиру</button>
                    <button class="btn btn-sm btn-info" onclick="updateStatus(${order.id}, 'Пассажир в машине')">Пассажир в машине</button>
                    <button class="btn btn-sm btn-success" onclick="updateStatus(${order.id}, 'Завершена')">Завершить</button>
                    <button class="btn btn-sm btn-primary" onclick="acceptOrder(${order.id})">Принять</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadDriverHistory() {
    const driverId = localStorage.getItem('driverId');
    const response = await fetch(`/driver-orders/${driverId}`);
    const orders = await response.json();
    const container = document.getElementById('historyList');
    
    if (!orders.length) {
        container.innerHTML = '<div class="alert alert-info">Нет выполненных заказов</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <div>${order.pickup_address} → ${order.dropoff_address}</div>
                <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                <div>Статус: ${order.status}</div>
                <div>Дата: ${order.created_at}</div>
            </div>
        </div>
    `).join('');
}

async function acceptOrder(orderId) {
    const driverId = localStorage.getItem('driverId');
    const formData = new FormData();
    formData.append('driver_id', driverId);
    
    await fetch(`/assign-order/${orderId}`, { method: 'POST', body: formData });
    alert(`Заказ ${orderId} принят`);
    loadDriverOrders();
    loadDriverHistory();
}

async function updateStatus(orderId, status) {
    const formData = new FormData();
    formData.append('status', status);
    await fetch(`/update-order-status/${orderId}`, { method: 'POST', body: formData });
    alert(`Статус изменён на "${status}"`);
    loadDriverOrders();
    loadDriverHistory();
}

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
                alert(`Добро пожаловать, ${result.fullname}!`);
                window.location.href = '/user-profile';
            } else {
                alert(result.error);
            }
        });
    }
}

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
                alert('Регистрация успешна. Теперь войдите.');
                window.location.href = '/login-user';
            } else {
                alert(result.error || 'Ошибка регистрации');
            }
        });
    }
}

if (window.location.pathname === '/user-profile') {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) window.location.href = '/login-user';
    
    document.getElementById('userFullname').innerText = userName;
    
    loadUserOrders();
    
    async function loadUserOrders() {
        const response = await fetch(`/user-orders/${userId}`);
        const orders = await response.json();
        const container = document.getElementById('ordersHistory');
        
        if (!orders.length) {
            container.innerHTML = '<div class="alert alert-info">У вас пока нет заказов</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="card mb-2">
                <div class="card-body">
                    <div>${order.date}</div>
                    <div>${order.pickup} → ${order.dropoff}</div>
                    <div>${order.tariff} | ${order.price} ₽</div>
                    <div>Статус: ${order.status}</div>
                    <a href="/order/${order.id}" class="btn btn-sm btn-info mt-2">Детали</a>
                </div>
            </div>
        `).join('');
        document.getElementById('totalOrders').innerText = orders.length;
    }
    
    document.getElementById('logoutUserBtn').onclick = () => {
        localStorage.clear();
        window.location.href = '/';
    };
}

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

if (window.location.pathname.includes('/order/')) {
    const statusSpan = document.getElementById('status');
    if (statusSpan && statusSpan.innerText === 'Завершена') {
        const ratingBlock = document.getElementById('ratingBlock');
        if (ratingBlock) ratingBlock.style.display = 'block';
    }
    
    const stars = document.querySelectorAll('.stars span');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            alert('Оценка: ' + rating + ' звёзд');
        });
    });
    
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', function() {
            const review = document.getElementById('review').value;
            alert(review ? 'Спасибо за отзыв: ' + review : 'Спасибо за оценку!');
        });
    }
    
    const simulatePaymentBtn = document.getElementById('simulatePaymentBtn');
    if (simulatePaymentBtn) {
        simulatePaymentBtn.addEventListener('click', function() {
            alert('Оплата прошла успешно (тестовый режим)');
        });
    }
}

if (window.location.pathname === '/admin') {
    let drivers = [];
    
    fetch('/api/all-drivers').then(r => r.json()).then(data => {
        drivers = data;
        document.getElementById('driversList').innerHTML = drivers.map(d => 
            `<div class="card mb-2 p-2">${d.fullname} (${d.phone})</div>`
        ).join('');
        
        fetch('/api/all-orders').then(r => r.json()).then(data => {
            document.getElementById('ordersList').innerHTML = data.map(o => `
                <div class="card mb-2 p-2">
                    Заказ ${o.id}: ${o.pickup_address} → ${o.dropoff_address} (${o.status})
                    <select id="driver_${o.id}" class="form-select mt-2">
                        <option value="">Выберите водителя</option>
                        ${drivers.map(d => `<option value="${d.id}">${d.fullname}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-primary mt-2" onclick="assignOrder(${o.id})">Назначить</button>
                </div>
            `).join('');
        });
    });
    
    window.assignOrder = function(orderId) {
        const driverId = document.getElementById(`driver_${orderId}`).value;
        if (!driverId) return alert('Выберите водителя');
        const formData = new FormData();
        formData.append('order_id', orderId);
        formData.append('driver_id', driverId);
        fetch('/api/assign-order', { method: 'POST', body: formData }).then(() => {
            alert('Назначено');
            location.reload();
        });
    };
}