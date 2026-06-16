// ========== ПЕРЕМЕННЫЕ ==========
let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');
let map;

// ========== ШАПКА (ОДНА КНОПКА) ==========
function updateAuthButton() {
    let link = document.getElementById('authLink');
    if (!link) return;
    
    let uId = localStorage.getItem('userId');
    let uName = localStorage.getItem('userName');
    
    if (uId && uName) {
        link.textContent = uName;
        link.href = '/user-profile';
    } else {
        link.textContent = 'Войти';
        link.href = '/login-user';
    }
}
updateAuthButton();

// ========== МОДАЛЬНЫЕ ОКНА ==========
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function showProfileModal() {
    document.getElementById('profileModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    loadProfile();
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.getElementById('overlay').style.display = 'none';
}

function openOrderModal() {
    document.getElementById('orderModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function openCommentModal() {
    document.getElementById('commentModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeCommentModal() {
    document.getElementById('commentModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// ========== ОБЩИЕ ФУНКЦИИ ==========
function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function sendComment() {
    let comment = document.getElementById('driverComment');
    if (comment && comment.value) {
        alert('Комментарий: ' + comment.value);
        comment.value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

function calculatePrice() {
    let tariff = document.getElementById('orderTariff').value;
    let price = 250;
    if (tariff === 'Комфорт') price = 350;
    if (tariff === 'Бизнес') price = 500;
    document.getElementById('pricePreview').innerHTML = 'Стоимость: ' + price + ' руб';
}

// ========== ЗАКАЗ ==========
async function submitOrder() {
    let tariff = document.getElementById('orderTariff').value;
    let price = 250;
    if (tariff === 'Комфорт') price = 350;
    if (tariff === 'Бизнес') price = 500;
    
    let fd = new FormData();
    fd.append('pickup', document.getElementById('orderPickup').value);
    fd.append('dropoff', document.getElementById('orderDropoff').value);
    fd.append('tariff', tariff);
    fd.append('price', price);
    
    let uId = localStorage.getItem('userId');
    if (uId) fd.append('user_id', uId);
    
    await fetch('/save-order', { method: 'POST', body: fd });
    alert('Заказ оформлен на сумму ' + price + ' ₽');
    closeOrderModal();
}

// ========== ВХОД ==========
async function loginUser() {
    let fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    let res = await fetch('/login-user', { method: 'POST', body: fd });
    let data = await res.json();
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        updateAuthButton();
        alert('Добро пожаловать, ' + data.fullname);
        closeLoginModal();
        window.location.href = '/user-profile';
    } else {
        alert(data.error);
    }
}

// ========== РЕГИСТРАЦИЯ ==========
async function registerUser() {
    let fd = new FormData();
    fd.append('fullname', document.getElementById('regName').value);
    fd.append('phone', document.getElementById('regPhone').value);
    fd.append('email', document.getElementById('regEmail').value);
    fd.append('password', document.getElementById('regPassword').value);
    let res = await fetch('/register', { method: 'POST', body: fd });
    let data = await res.json();
    if (data.success) {
        alert('Регистрация успешна');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(data.error);
    }
}

// ========== ВЫХОД ==========
function logout() {
    localStorage.clear();
    updateAuthButton();
    window.location.href = '/';
}

// ========== ПРОФИЛЬ ==========
async function loadProfile() {
    let id = localStorage.getItem('userId');
    if (!id) return;
    let res = await fetch('/user-orders/' + id);
    let orders = await res.json();
    let info = document.getElementById('profileInfo');
    let history = document.getElementById('ordersHistory');
    
    if (info) info.innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    if (orders.length === 0) {
        if (history) history.innerHTML = '<p>Нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        orders.forEach(o => {
            html += '<div class="order-card"><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong><br>' + o.tariff + ' | ' + o.price + ' ₽<br>Статус: ' + o.status + '<br><small>' + new Date(o.date).toLocaleString() + '</small></div>';
        });
        if (history) history.innerHTML = html;
    }
}

// ========== КАРТА ==========
function initMap() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initMap, 500);
        return;
    }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
        });
        
        let geolocationControl = new ymaps.control.GeolocationControl({
            options: { float: 'right' }
        });
        map.controls.add(geolocationControl);
        
        map.events.add('click', function(e) {
            let coords = e.get('coords');
            let pickupInput = document.getElementById('orderPickup');
            if (pickupInput) pickupInput.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
        });
    });
}
initMap();

// ========== ВХОД ВОДИТЕЛЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // ОСТАНАВЛИВАЕТ ПЕРЕЗАГРУЗКУ
            
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
});

// ========== ОБРАБОТЧИКИ ==========
document.getElementById('orderTariff')?.addEventListener('change', calculatePrice);
document.getElementById('orderPickup')?.addEventListener('input', calculatePrice);
document.getElementById('orderDropoff')?.addEventListener('input', calculatePrice);

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML ==========
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
window.closeAllModals = closeAllModals;
window.calculatePrice = calculatePrice;
window.updateAuthButton = updateAuthButton;