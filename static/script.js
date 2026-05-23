// ============================================
// GIN TAXI - РАБОЧАЯ ВЕРСИЯ (ТОЛЬКО КНОПКИ)
// ============================================

// Функции для кнопок
function openOrderForm() {
    var modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'flex';
}

function closeOrderModal() {
    var modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

function openCommentModal() {
    var modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'flex';
}

function closeCommentModal() {
    var modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
}

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function submitOrder() {
    alert('Заказ оформлен');
    closeOrderModal();
}

function sendComment() {
    var comment = document.getElementById('driverComment').value;
    alert('Комментарий отправлен: ' + comment);
    closeCommentModal();
}

// Инициализация кнопок после загрузки страницы
window.onload = function() {
    var orderBtn = document.getElementById('orderBtn');
    var phoneBtn = document.getElementById('phoneOrderBtn');
    var commentBtn = document.getElementById('commentBtn');
    var driverBtn = document.getElementById('driverLoginBtn');
    var submitBtn = document.getElementById('submitOrderBtn');
    var sendBtn = document.getElementById('sendCommentBtn');
    
    if (orderBtn) orderBtn.onclick = openOrderForm;
    if (phoneBtn) phoneBtn.onclick = makePhoneCall;
    if (commentBtn) commentBtn.onclick = openCommentModal;
    if (driverBtn) driverBtn.onclick = function() { window.location.href = '/login'; };
    if (submitBtn) submitBtn.onclick = submitOrder;
    if (sendBtn) sendBtn.onclick = sendComment;
    
    console.log('Кнопки инициализированы');
};

// Делаем функции глобальными для onclick в HTML
window.closeOrderModal = closeOrderModal;
window.closeCommentModal = closeCommentModal;