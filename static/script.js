var map;
var userId = localStorage.getItem('userId');
var userName = localStorage.getItem('userName');
var userEmail = localStorage.getItem('userEmail');
var dropdownOpen = false;

function initHeader() {
    var userStatus = document.getElementById('userStatus');
    if (!userStatus) return;
    
    if (userId && userName) {
        var firstLetter = userName.charAt(0).toUpperCase();
        
        userStatus.innerHTML = `
            <div class="user-dropdown">
                <div class="user-avatar" onclick="toggleDropdown()">
                    <div class="avatar-circle">${firstLetter}</div>
                    <div class="user-info-header">
                        <div class="user-name-header">${userName}</div>
                        <div class="user-role-header">Пассажир</div>
                    </div>
                </div>
                <div id="userDropdown" class="dropdown-menu-custom" style="display: none;">
                    <div class="dropdown-header-custom">
                        <div><strong>${userName}</strong></div>
                        <div class="dropdown-email">${userEmail || 'user@gin.ru'}</div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item-custom" onclick="showModernProfile()">
                        Личный кабинет
                    </div>
                    <div class="dropdown-item-custom" onclick="showOrderHistory()">
                        История заказов
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item-custom logout-item" onclick="logout()">
                        Выйти
                    </div>
                </div>
            </div>
        `;
    } else {
        userStatus.innerHTML = `
            <div class="auth-buttons">
                <a href="#" class="btn-outline-auth" onclick="showLoginModal(); return false;">Вход</a>
                <a href="#" class="btn-primary-auth" onclick="showRegisterModal(); return false;">Регистрация</a>
            </div>
        `;
    }
}

function toggleDropdown() {
    var dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    
    dropdownOpen = !dropdownOpen;
    dropdown.style.display = dropdownOpen ? 'block' : 'none';
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-dropdown')) {
        var dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdownOpen = false;
        }
    }
});

function showModernProfile() {
    closeAllModals();
    var userId = localStorage.getItem('userId');
    if (!userId) {
        showLoginModal();
        return;
    }
    
    var existingModal = document.getElementById('modernProfileModal');
    if (existingModal) existingModal.remove();
    
    var modal = document.createElement('div');
    modal.id = 'modernProfileModal';
    modal.className = 'profile-modal-modern';
    modal.innerHTML = `
        <div class="profile-header-modern">
            <div class="profile-avatar-modern" id="profileAvatarModal">${(localStorage.getItem('userName') || 'U').charAt(0).toUpperCase()}</div>
            <div class="profile-name-modern" id="profileNameModal">${localStorage.getItem('userName') || 'Пользователь'}</div>
            <div class="profile-role-modern">Пассажир</div>
        </div>
        <div class="profile-stats-modern">
            <div class="stat-item-modern">
                <div class="stat-number-modern" id="totalOrdersModal">0</div>
                <div class="stat-label-modern">Поездок</div>
            </div>
            <div class="stat-item-modern">
                <div class="stat-number-modern" id="totalSpentModal">0</div>
                <div class="stat-label-modern">Потрачено RUB</div>
            </div>
        </div>
        <div class="profile-body-modern">
            <div class="orders-title-modern">
                История заказов
            </div>
            <div id="profileOrdersList" class="profile-orders-list">
                <div class="empty-orders">Загрузка...</div>
            </div>
        </div>
        <div class="profile-footer-modern">
            <button class="btn-logout-modern" onclick="logout()">Выйти из аккаунта</button>
            <button class="btn-close-modern" onclick="closeModernProfile()">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    showOverlay();
    
    loadUserOrdersToProfile(userId);
}

function closeModernProfile() {
    var modal = document.getElementById('modernProfileModal');
    if (modal) modal.remove();
    hideOverlay();
}

async function loadUserOrdersToProfile(userId) {
    try {
        var res = await fetch('/user-orders/' + userId);
        var orders = await res.json();
        
        var container = document.getElementById('profileOrdersList');
        var totalSpan = document.getElementById('totalOrdersModal');
        var spentSpan = document.getElementById('totalSpentModal');
        
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-orders">У вас пока нет заказов</div>';
            if (totalSpan) totalSpan.innerText = '0';
            if (spentSpan) spentSpan.innerText = '0';
            return;
        }
        
        var totalOrders = orders.length;
        var totalSpent = orders.reduce(function(sum, o) { return sum + (parseFloat(o.price) || 0); }, 0);
        
        if (totalSpan) totalSpan.innerText = totalOrders;
        if (spentSpan) spentSpan.innerText = totalSpent;
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            var statusClass = '';
            if (order.status === 'Новый') statusClass = 'status-new';
            else if (order.status === 'В пути') statusClass = 'status-progress';
            else statusClass = 'status-completed';
            
            html += `
                <div class="order-card-modern">
                    <div class="order-route-modern">${order.pickup || 'Не указан'} → ${order.dropoff || 'Не указан'}</div>
                    <div class="order-details-modern">
                        <span>${order.price || 0} RUB</span>
                        <span>${order.tariff || 'Эконом'}</span>
                        <span>${new Date(order.date).toLocaleDateString()}</span>
                        <span class="order-status-modern ${statusClass}">${order.status || 'Новый'}</span>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

function showOrderHistory() {
    showModernProfile();
}

function initMap() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initMap, 500);
        return;
    }
    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'searchControl']
        });
        console.log('Карта загружена');
    });
}
initMap();

function showOverlay() { 
    var el = document.getElementById('overlay');
    if (el) el.style.display = 'block';
}
function hideOverlay() { 
    var el = document.getElementById('overlay');
    if (el) el.style.display = 'none';
}
function closeAllModals() { 
    hideOverlay(); 
    var modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
        modals[i].style.display = 'none';
    }
    closeModernProfile();
}

function openOrderModal() { 
    document.getElementById('orderModal').style.display = 'block';
    showOverlay();
}
function closeOrderModal() { 
    document.getElementById('orderModal').style.display = 'none';
    hideOverlay();
}
function openCommentModal() { 
    document.getElementById('commentModal').style.display = 'block';
    showOverlay();
}
function closeCommentModal() { 
    document.getElementById('commentModal').style.display = 'none';
    hideOverlay();
}
function showLoginModal() { 
    document.getElementById('loginModal').style.display = 'block';
    showOverlay();
}
function closeLoginModal() { 
    document.getElementById('loginModal').style.display = 'none';
    hideOverlay();
}
function showRegisterModal() { 
    document.getElementById('registerModal').style.display = 'block';
    showOverlay();
}
function closeRegisterModal() { 
    document.getElementById('registerModal').style.display = 'none';
    hideOverlay();
}
function makePhoneCall() { 
    window.location.href = 'tel:+78121234567';
}

function calculatePrice() {
    var pickup = document.getElementById('orderPickup');
    var dropoff = document.getElementById('orderDropoff');
    var tariff = document.getElementById('orderTariff');
    var priceDiv = document.getElementById('pricePreview');
    if (pickup && dropoff && tariff && priceDiv && pickup.value && dropoff.value) {
        var price = 250;
        if (tariff.value.includes('Комфорт')) price = 350;
        if (tariff.value.includes('Бизнес')) price = 500;
        priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' RUB';
    }
}

function sendComment() {
    var comment = document.getElementById('driverComment');
    if (comment && comment.value) {
        alert('Комментарий: ' + comment.value);
        comment.value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

function logout() {
    localStorage.clear();
    userId = null;
    userName = null;
    userEmail = null;
    initHeader();
    closeAllModals();
    location.reload();
}

async function submitOrder() {
    var name = document.getElementById('orderName');
    var phone = document.getElementById('orderPhone');
    var pickup = document.getElementById('orderPickup');
    var dropoff = document.getElementById('orderDropoff');
    var tariff = document.getElementById('orderTariff');
    
    if (!name.value || !phone.value || !pickup.value || !dropoff.value) {
        alert('Заполните все поля');
        return;
    }
    
    var price = 250;
    if (tariff.value.includes('Комфорт')) price = 350;
    if (tariff.value.includes('Бизнес')) price = 500;
    
    var fd = new FormData();
    fd.append('pickup', pickup.value);
    fd.append('dropoff', dropoff.value);
    fd.append('tariff', tariff.value);
    fd.append('price', price);
    
    if (userId) {
        fd.append('user_id', userId);
    } else {
        fd.append('guest_name', name.value);
        fd.append('guest_phone', phone.value);
        fd.append('guest_email', '');
    }
    
    await fetch('/save-order', { method: 'POST', body: fd });
    alert('Заказ оформлен!');
    closeOrderModal();
}

async function registerUser() {
    var fd = new FormData();
    fd.append('fullname', document.getElementById('regName').value);
    fd.append('phone', document.getElementById('regPhone').value);
    fd.append('email', document.getElementById('regEmail').value);
    fd.append('password', document.getElementById('regPassword').value);
    
    var res = await fetch('/register', { method: 'POST', body: fd });
    var data = await res.json();
    
    if (data.success) {
        alert('Регистрация успешна! Теперь войдите.');
        closeRegisterModal();
        showLoginModal();
    } else {
        alert(data.error || 'Ошибка регистрации');
    }
}

async function loginUser() {
    var fd = new FormData();
    fd.append('email', document.getElementById('loginEmail').value);
    fd.append('password', document.getElementById('loginPassword').value);
    
    var res = await fetch('/login-user', { method: 'POST', body: fd });
    var data = await res.json();
    
    if (data.success) {
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.fullname);
        localStorage.setItem('userEmail', data.email);
        userId = data.user_id;
        userName = data.fullname;
        userEmail = data.email;
        alert('Добро пожаловать, ' + data.fullname);
        initHeader();
        closeLoginModal();
        location.reload();
    } else {
        alert(data.error);
    }
}

if (window.location.pathname === '/driver-dashboard') {
    if (!localStorage.getItem('driverLoggedIn')) window.location.href = '/login';
    
    async function initDriverDashboard() {
        var statusBtn = document.getElementById('statusToggle');
        var isOnline = true;
        
        if (statusBtn) {
            statusBtn.addEventListener('change', function() {
                isOnline = this.checked;
                var statusText = document.getElementById('statusText');
                var statusIndicator = document.getElementById('statusIndicator');
                if (statusText) statusText.textContent = isOnline ? 'Онлайн' : 'Офлайн';
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator ' + (isOnline ? 'online' : 'offline');
                }
            });
        }
        
        await loadDriverOrders();
        await loadDriverHistory();
        
        setInterval(loadDriverOrders, 5000);
    }
    
    async function loadDriverOrders() {
        var res = await fetch('/user-orders/all');
        var orders = await res.json();
        var container = document.getElementById('newOrdersList');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state-modern">Новых заказов пока нет</div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            html += `
                <div class="order-item-modern">
                    <div class="order-route">${order.pickup} → ${order.dropoff}</div>
                    <div class="order-meta">
                        <span>${order.tariff}</span>
                        <span>${order.price} RUB</span>
                    </div>
                    <button class="accept-btn-modern" data-id="${order.id}">Принять заказ</button>
                </div>
            `;
        }
        container.innerHTML = html;
        
        var buttons = document.querySelectorAll('.accept-btn-modern');
        for (var j = 0; j < buttons.length; j++) {
            var btn = buttons[j];
            btn.onclick = async function() {
                var fd = new FormData();
                fd.append('driver_id', 1);
                await fetch('/assign-order/' + this.dataset.id, { method: 'POST', body: fd });
                alert('Заказ принят!');
                loadDriverOrders();
                loadDriverHistory();
            };
        }
    }
    
    async function loadDriverHistory() {
        var res = await fetch('/driver-orders/1');
        var orders = await res.json();
        var container = document.getElementById('historyList');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state-modern">Нет выполненных заказов</div>';
            return;
        }
        
        var html = '';
        var totalEarned = 0;
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            totalEarned += parseFloat(order.price) || 0;
            html += `
                <div class="order-item-modern">
                    <div class="order-route">${order.pickup_address} → ${order.dropoff_address}</div>
                    <div class="order-meta">
                        <span>${order.price} RUB</span>
                        <span>${new Date(order.created_at).toLocaleDateString()}</span>
                        <span>${order.status}</span>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        
        var earningsSpan = document.getElementById('driverEarnings');
        if (earningsSpan) earningsSpan.innerText = totalEarned.toLocaleString() + ' RUB';
    }
    
    initDriverDashboard();
}

var loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) loginUserForm.addEventListener('submit', function(e) { e.preventDefault(); loginUser(); });
var registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', function(e) { e.preventDefault(); registerUser(); });

var pickupInput = document.getElementById('orderPickup');
var dropoffInput = document.getElementById('orderDropoff');
var tariffSelect = document.getElementById('orderTariff');
if (pickupInput) pickupInput.addEventListener('input', calculatePrice);
if (dropoffInput) dropoffInput.addEventListener('input', calculatePrice);
if (tariffSelect) tariffSelect.addEventListener('change', calculatePrice);

document.addEventListener('DOMContentLoaded', initHeader);

window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openCommentModal = openCommentModal;
window.closeCommentModal = closeCommentModal;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.makePhoneCall = makePhoneCall;
window.submitOrder = submitOrder;
window.sendComment = sendComment;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logout = logout;
window.closeAllModals = closeAllModals;
window.showModernProfile = showModernProfile;
window.closeModernProfile = closeModernProfile;
window.showOrderHistory = showOrderHistory;
window.toggleDropdown = toggleDropdown;