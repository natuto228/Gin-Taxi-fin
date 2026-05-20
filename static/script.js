console.log('Script loaded');

let map;
let userMarker = null;
let savedComment = '';

function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet не загружен');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Элемент map не найден');
        return;
    }
    
    map = L.map('map').setView([55.751244, 37.618423], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Клик по карте - заполняет адрес подачи
    map.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        const address = await getAddressFromCoords(lat, lng);
        const pickupInput = document.getElementById('orderPickup');
        if (pickupInput) pickupInput.value = address;
        
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup('Точка подачи').openPopup();
    });
    
    console.log('Карта инициализирована');
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

window.searchAddress = function() {
    const query = document.getElementById('addressSearch').value;
    if (!query) {
        alert('Введите адрес');
        return;
    }
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 15);
                
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([lat, lon]).addTo(map).bindPopup(query).openPopup();
                
                const pickupInput = document.getElementById('orderPickup');
                if (pickupInput) pickupInput.value = query;
            } else {
                alert('Адрес не найден');
            }
        })
        .catch(error => {
            console.error('Ошибка поиска:', error);
            alert('Ошибка при поиске адреса');
        });
};

window.setCurrentLocation = function() {
    if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 15);
            
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([lat, lng]).addTo(map).bindPopup('Вы здесь').openPopup();
            
            const address = await getAddressFromCoords(lat, lng);
            const pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = address;
        },
        function(error) {
            console.error('Ошибка геолокации:', error);
            alert('Не удалось определить местоположение. Проверьте разрешения в браузере.');
        }
    );
};

window.makePhoneCall = function() {
    window.location.href = 'tel:+78121234567';
};

window.openOrderForm = function() {
    document.getElementById('orderModal').style.display = 'flex';
};

window.closeOrderModal = function() {
    document.getElementById('orderModal').style.display = 'none';
};

window.openCommentModal = function() {
    document.getElementById('commentModal').style.display = 'flex';
};

window.closeCommentModal = function() {
    const comment = document.getElementById('driverComment').value;
    if (comment) {
        savedComment = comment;
        alert('Комментарий сохранен. Он будет отправлен с заказом.');
    }
    document.getElementById('commentModal').style.display = 'none';
};

window.submitOrder = async function() {
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
    
    if (savedComment) {
        alert(`Комментарий к заказу: ${savedComment}`);
    }
    
    if (userId) {
        formData.append('user_id', userId);
    } else {
        formData.append('guest_name', name);
        formData.append('guest_phone', phone);
        formData.append('guest_email', '');
    }
    
    try {
        await fetch('/save-order', { method: 'POST', body: formData });
        alert(`Заказ оформлен!\n\nОткуда: ${pickup}\nКуда: ${dropoff}\nСтоимость: ${price} ₽`);
        closeOrderModal();
        
        document.getElementById('orderName').value = '';
        document.getElementById('orderPhone').value = '';
        document.getElementById('orderPickup').value = '';
        document.getElementById('orderDropoff').value = '';
        savedComment = '';
        document.getElementById('driverComment').value = '';
    } catch (error) {
        alert('Ошибка при оформлении заказа');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/') {
        initMap();
    }
});

if (window.location.pathname === '/login') {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            localStorage.setItem('driver', 'true');
            window.location.href = '/driver-dashboard';
        });
    }
}

if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driver')) {
        window.location.href = '/login';
    }
    
    loadDriverOrders();
    
    async function loadDriverOrders() {
        try {
            const response = await fetch('/user-orders/all');
            const orders = await response.json();
            const container = document.getElementById('ordersList');
            
            if (orders.length === 0) {
                container.innerHTML = '<div class="alert alert-info">Нет активных заказов</div>';
                return;
            }
            
            let html = '';
            orders.forEach(order => {
                html += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div>${order.pickup} → ${order.dropoff}</div>
                            <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                            <button class="btn btn-sm btn-success mt-2" onclick="acceptOrder(${order.id})">Принять</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
        }
    }
    
    window.acceptOrder = function(id) {
        alert(`Заказ ${id} принят. Еду к пассажиру.`);
        loadDriverOrders();
    };
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
    
    if (!userId) {
        window.location.href = '/login-user';
    }
    
    document.getElementById('userFullname').innerText = userName;
    
    loadUserOrders();
    
    async function loadUserOrders() {
        try {
            const response = await fetch(`/user-orders/${userId}`);
            const orders = await response.json();
            const container = document.getElementById('ordersHistory');
            
            if (orders.length === 0) {
                container.innerHTML = '<div class="alert alert-info">У вас пока нет заказов</div>';
                return;
            }
            
            let html = '';
            orders.forEach(order => {
                html += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div>${order.date}</div>
                            <div>${order.pickup} → ${order.dropoff}</div>
                            <div>${order.tariff} | ${order.price} ₽</div>
                            <div>Статус: ${order.status}</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            document.getElementById('totalOrders').innerText = orders.length;
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        }
    }
    
    document.getElementById('logoutUserBtn').onclick = function() {
        localStorage.clear();
        window.location.href = '/';
    };
}