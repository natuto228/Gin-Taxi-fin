console.log('Script loaded');

// ===== КАРТА =====
let map;

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
    
    map = L.map('map').setView([59.9343, 30.3351], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 1
    }).addTo(map);
    
    console.log('Карта инициализирована');
}

// Запуск карты после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/') {
        initMap();
    }
});

// Проверка загрузки карты через 2 секунды
setTimeout(function() {
    if (!map && window.location.pathname === '/') {
        console.log('Пробуем перезагрузить карту...');
        initMap();
    }
}, 2000);

// ===== ВХОД ВОДИТЕЛЯ =====
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

// ===== КАБИНЕТ ВОДИТЕЛЯ =====
if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driver')) {
        window.location.href = '/login';
    }
}

// ===== ВХОД ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/login-user') {
    const form = document.getElementById('loginUserForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            localStorage.setItem('user', 'true');
            window.location.href = '/user-profile';
        });
    }
}

// ===== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/user-profile') {
    if (!localStorage.getItem('user')) {
        window.location.href = '/login-user';
    }
}

// ===== ФУНКЦИИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ =====
function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function openOrderForm() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'flex';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

function openCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'flex';
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
}

function submitOrder() {
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    alert(`Заказ оформлен!\n\nОткуда: ${pickup}\nКуда: ${dropoff}\nВодитель скоро прибудет!`);
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

function searchAddress() {
    const query = document.getElementById('addressSearch').value;
    if (!query) return;
    
    if (map) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    map.setView([lat, lon], 15);
                } else {
                    alert('Адрес не найден');
                }
            })
            .catch(error => {
                console.error('Ошибка поиска:', error);
                alert('Ошибка при поиске адреса');
            });
    } else {
        alert('Карта ещё не загружена');
    }
}

function setCurrentLocation() {
    if (!map) {
        alert('Карта ещё не загружена');
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 15);
        }, function() {
            alert('Не удалось определить местоположение');
        });
    } else {
        alert('Геолокация не поддерживается');
    }
}