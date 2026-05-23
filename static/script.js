// ===== КАРТА =====
var map;
var userMarker = null;

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
        
        map.events.add('click', function(e) {
            var coords = e.get('coords');
            var pickupInput = document.getElementById('orderPickup');
            if (pickupInput) {
                pickupInput.value = coords[0].toFixed(4) + ', ' + coords[1].toFixed(4);
            }
            
            if (userMarker) map.geoObjects.remove(userMarker);
            userMarker = new ymaps.Placemark(coords);
            map.geoObjects.add(userMarker);
        });
    });
}

initMap();

// ===== ФУНКЦИИ КНОПОК =====
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

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function calculatePrice() {
    var pickup = document.getElementById('orderPickup').value;
    var dropoff = document.getElementById('orderDropoff').value;
    var tariff = document.getElementById('orderTariff').value;
    var priceDiv = document.getElementById('pricePreview');
    
    if (!pickup || !dropoff) {
        if (priceDiv) priceDiv.innerHTML = '';
        return;
    }
    
    var pricePerKm = 25;
    if (tariff.includes('Комфорт')) pricePerKm = 35;
    if (tariff.includes('Бизнес')) pricePerKm = 50;
    
    var price = 10 * pricePerKm;
    if (priceDiv) priceDiv.innerHTML = 'Примерная стоимость: ' + price + ' ₽';
}

async function submitOrder() {
    var name = document.getElementById('orderName').value;
    var phone = document.getElementById('orderPhone').value;
    var pickup = document.getElementById('orderPickup').value;
    var dropoff = document.getElementById('orderDropoff').value;
    var tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    var price = 250;
    if (tariff.includes('Эконом')) price = 250;
    if (tariff.includes('Комфорт')) price = 350;
    if (tariff.includes('Бизнес')) price = 500;
    
    var userId = localStorage.getItem('userId');
    var formData = new FormData();
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
    alert('Заказ оформлен!\nОткуда: ' + pickup + '\nКуда: ' + dropoff + '\nСтоимость: ' + price + ' ₽');
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
}

function sendComment() {
    var comment = document.getElementById('driverComment').value;
    if (comment) {
        alert('Комментарий отправлен');
        document.getElementById('driverComment').value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

// ===== НАЗНАЧЕНИЕ КНОПОК =====
document.getElementById('orderBtn').onclick = openOrderForm;
document.getElementById('phoneOrderBtn').onclick = makePhoneCall;
document.getElementById('commentBtn').onclick = openCommentModal;
document.getElementById('driverLoginBtn').onclick = function() { window.location.href = '/login'; };
document.getElementById('submitOrderBtn').onclick = submitOrder;
document.getElementById('sendCommentBtn').onclick = sendComment;

window.closeOrderModal = closeOrderModal;
window.closeCommentModal = closeCommentModal;

// Расчёт цены при вводе
document.getElementById('orderPickup').addEventListener('input', calculatePrice);
document.getElementById('orderDropoff').addEventListener('input', calculatePrice);
document.getElementById('orderTariff').addEventListener('change', calculatePrice);