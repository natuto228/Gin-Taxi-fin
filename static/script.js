let userId = localStorage.getItem('userId');
let userName = localStorage.getItem('userName');

function updateHeader() {
    let container = document.getElementById('userStatus');
    if (!container) return;
    let uId = localStorage.getItem('userId');
    let uName = localStorage.getItem('userName');
    
    if (uId && uName) {
        container.innerHTML = '<span style="color:white; margin-right:15px;">' + uName + '</span> <a href="#" onclick="showProfileModal()" style="color:white;">Профиль</a> <a href="#" onclick="logout()" style="color:white; margin-left:15px;">Выйти</a>';
    } else {
        container.innerHTML = '<a href="#" onclick="showLoginModal()" style="color:white; margin-left:15px;">Войти</a> <a href="#" onclick="showRegisterModal()" style="color:white; margin-left:15px;">Регистрация</a>';
    }
}

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

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function sendComment() {
    let comment = document.getElementById('driverComment');
    alert('Комментарий: ' + comment.value);
    closeCommentModal();
}

function calculatePrice() {
    let tariff = document.getElementById('orderTariff').value;
    let price = 250;
    if (tariff === 'Комфорт') price = 350;
    if (tariff === 'Бизнес') price = 500;
    document.getElementById('pricePreview').innerHTML = 'Стоимость: ' + price + ' руб';
}

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
    if (userId) fd.append('user_id', userId);
    await fetch('/save-order', { method: 'POST', body: fd });
    alert('Заказ оформлен на сумму ' + price + ' ₽');
    closeOrderModal();
}

async function loginUser() {
    let fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    let res = await fetch('/login-user', { method: 'POST', body: fd });
    let data = await res.json();
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        updateHeader();
        alert('Добро пожаловать, ' + data.fullname);
        closeLoginModal();
    } else {
        alert(data.error);
    }
}

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

function logout() {
    localStorage.clear();
    updateHeader();
    location.reload();
}

async function loadProfile() {
    let id = localStorage.getItem('userId');
    if (!id) return;
    let res = await fetch('/user-orders/' + id);
    let orders = await res.json();
    document.getElementById('profileInfo').innerHTML = '<p><strong>Пользователь:</strong> ' + localStorage.getItem('userName') + '</p><hr>';
    if (orders.length === 0) {
        document.getElementById('ordersHistory').innerHTML = '<p>Нет заказов</p>';
    } else {
        let html = '<h4>История заказов</h4>';
        orders.forEach(o => {
            html += '<div class="order-card"><strong>' + o.pickup + '</strong> → <strong>' + o.dropoff + '</strong><br>' + o.tariff + ' | ' + o.price + ' ₽<br>Статус: ' + o.status + '<br><small>' + new Date(o.date).toLocaleString() + '</small></div>';
        });
        document.getElementById('ordersHistory').innerHTML = html;
    }
}

let map;
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

document.getElementById('orderTariff')?.addEventListener('change', calculatePrice);
document.getElementById('orderPickup')?.addEventListener('input', calculatePrice);
document.getElementById('orderDropoff')?.addEventListener('input', calculatePrice);

updateHeader();

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