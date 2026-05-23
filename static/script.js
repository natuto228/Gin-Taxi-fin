let map;
let userMarker = null;
let carMarker = null;
let simulationInterval = null;

function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    map = L.map('map').setView([55.751244, 37.618423], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    map.on('click', async function(e) {
        const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
        const pickupInput = document.getElementById('orderPickup');
        if (pickupInput) pickupInput.value = address;
        
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
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
                
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([lat, lon]).addTo(map);
                document.getElementById('orderPickup').value = query;
            } else {
                alert('Address not found');
            }
        });
}

function setCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(async function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);
        
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng]).addTo(map);
        
        const address = await getAddressFromCoords(lat, lng);
        document.getElementById('orderPickup').value = address;
    }, function() {
        alert('Could not get location');
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
    
    if (priceDiv) priceDiv.innerHTML = `Estimated price: ${price} RUB`;
}

async function submitOrder() {
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Fill all fields');
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
    alert(`Order confirmed!\nFrom: ${pickup}\nTo: ${dropoff}\nPrice: ${price} RUB`);
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
}

function sendComment() {
    const comment = document.getElementById('driverComment').value;
    if (comment) {
        alert('Comment sent');
        document.getElementById('driverComment').value = '';
        closeCommentModal();
    } else {
        alert('Enter comment');
    }
}

function toggleLanguage() {
    const isRu = document.documentElement.lang === 'ru';
    document.documentElement.lang = isRu ? 'en' : 'ru';
    alert(isRu ? 'Language switched to English' : 'Язык переключен на русский');
}

function initCarSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    
    let step = 0;
    const path = [
        [55.751244, 37.618423],
        [55.761244, 37.628423],
        [55.771244, 37.638423]
    ];
    
    if (!carMarker) {
        carMarker = L.marker(path[0]).addTo(map);
    }
    
    simulationInterval = setInterval(() => {
        step = (step + 1) % path.length;
        carMarker.setLatLng(path[step]);
        map.setView(path[step], 15);
        
        const carDiv = document.getElementById('carLocation');
        if (carDiv) carDiv.style.display = 'block';
    }, 5000);
}

function startSimulation() {
    initCarSimulation();
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/') {
        initMap();
        startSimulation();
        
        document.getElementById('searchBtn')?.addEventListener('click', searchAddress);
        document.getElementById('myLocationBtn')?.addEventListener('click', setCurrentLocation);
        document.getElementById('orderBtn')?.addEventListener('click', openOrderForm);
        document.getElementById('phoneOrderBtn')?.addEventListener('click', makePhoneCall);
        document.getElementById('commentBtn')?.addEventListener('click', openCommentModal);
        document.getElementById('driverLoginBtn')?.addEventListener('click', () => window.location.href = '/login');
        
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
                alert('Invalid SMS code');
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
        container.innerHTML = '<div class="alert alert-info">No new orders</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <div>${order.pickup} → ${order.dropoff}</div>
                <div>Tariff: ${order.tariff} | Price: ${order.price} RUB</div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-warning" onclick="updateStatus(${order.id}, 'Driving to passenger')">Driving to passenger</button>
                    <button class="btn btn-sm btn-info" onclick="updateStatus(${order.id}, 'Passenger in car')">Passenger in car</button>
                    <button class="btn btn-sm btn-success" onclick="updateStatus(${order.id}, 'Completed')">Complete</button>
                    <button class="btn btn-sm btn-primary" onclick="acceptOrder(${order.id})">Accept</button>
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
        container.innerHTML = '<div class="alert alert-info">No completed orders</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <div>${order.pickup_address} → ${order.dropoff_address}</div>
                <div>Tariff: ${order.tariff} | Price: ${order.price} RUB</div>
                <div>Status: ${order.status}</div>
                <div>Date: ${order.created_at}</div>
            </div>
        </div>
    `).join('');
}

async function acceptOrder(orderId) {
    const driverId = localStorage.getItem('driverId');
    const formData = new FormData();
    formData.append('driver_id', driverId);
    
    await fetch(`/assign-order/${orderId}`, { method: 'POST', body: formData });
    alert(`Order ${orderId} accepted`);
    loadDriverOrders();
    loadDriverHistory();
}

async function updateStatus(orderId, status) {
    const formData = new FormData();
    formData.append('status', status);
    await fetch(`/update-order-status/${orderId}`, { method: 'POST', body: formData });
    alert(`Status changed to "${status}"`);
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
                alert(`Welcome, ${result.fullname}!`);
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
                alert('Registration successful. Please login.');
                window.location.href = '/login-user';
            } else {
                alert(result.error || 'Registration error');
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
            container.innerHTML = '<div class="alert alert-info">No orders yet</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="card mb-2">
                <div class="card-body">
                    <div>${order.date}</div>
                    <div>${order.pickup} → ${order.dropoff}</div>
                    <div>${order.tariff} | ${order.price} RUB</div>
                    <div>Status: ${order.status}</div>
                    <a href="/order/${order.id}" class="btn btn-sm btn-info mt-2">Details</a>
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
            alert('Thank you! We will contact you.');
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
            alert('Оценка: ' + rating + ' звезд');
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