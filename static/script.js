console.log('Script loaded');

// ===== ВХОД ВОДИТЕЛЯ =====
if (window.location.pathname === '/login') {
    console.log('На странице входа водителя');
    
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма отправлена');
            localStorage.setItem('driver', 'true');
            window.location.href = '/driver-dashboard';
        });
    } else {
        console.log('Форма driverLoginForm не найдена');
    }
}

// ===== КАБИНЕТ ВОДИТЕЛЯ =====
if (window.location.pathname === '/driver-dashboard') {
    console.log('На странице кабинета водителя');
    
    if (!localStorage.getItem('driver')) {
        console.log('Нет авторизации, редирект на /login');
        window.location.href = '/login';
    } else {
        console.log('Авторизация есть, показываем кабинет');
    }
}

// ===== ВХОД ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/login-user') {
    console.log('На странице входа пользователя');
    
    const form = document.getElementById('loginUserForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма пользователя отправлена');
            localStorage.setItem('user', 'true');
            window.location.href = '/user-profile';
        });
    }
}

// ===== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ =====
if (window.location.pathname === '/user-profile') {
    console.log('На странице профиля пользователя');
    
    if (!localStorage.getItem('user')) {
        console.log('Нет авторизации пользователя, редирект на /login-user');
        window.location.href = '/login-user';
    }
}

// ===== КНОПКИ НА ГЛАВНОЙ =====
const orderBtn = document.getElementById('orderBtn');
if (orderBtn) {
    orderBtn.onclick = function() {
        alert('Заказ оформлен!');
    };
}

const phoneOrderBtn = document.getElementById('phoneOrderBtn');
if (phoneOrderBtn) {
    phoneOrderBtn.onclick = function() {
        window.location.href = 'tel:+78121234567';
    };
}

const commentBtn = document.getElementById('commentBtn');
if (commentBtn) {
    commentBtn.onclick = function() {
        alert('Комментарий водителю будет добавлен');
    };
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
    alert('Поиск адреса: ' + query + '\n(Функция поиска будет добавлена позже)');
}

function setCurrentLocation() {
    alert('Определение местоположения\n(Функция будет добавлена позже)');
}