// ============================================================
// ORDER.JS — оформление доставки (стабильная версия)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // ---------- Константы ----------
    const RATES = { xs: 9, s: 13, m: 20, l: 27, xl: 35, max: 70 };

    // ---------- Состояние ----------
    const state = {
        from: null,
        to: null,
        size: 'xs',
        distance: 0,
        total: 0
    };

    // ---------- Элементы ----------
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const calcBtn = document.getElementById('calc');
    const submitBtn = document.getElementById('submit');
    const sizeCards = document.querySelectorAll('.main-size-card');
    const distanceEl = document.getElementById('distanceValue');
    const durationEl = document.getElementById('durationValue');
    const rateEl = document.getElementById('rateValue');
    const totalEl = document.getElementById('totalValue');
    const orderForm = document.getElementById('orderForm');
    const orderSuccess = document.getElementById('orderSuccess');
    const orderIdEl = document.getElementById('orderId');
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');

    let myMap;
    let markerFrom = null;
    let markerTo = null;

    // ============================================================
    // 1. ИНИЦИАЛИЗАЦИЯ КАРТЫ
    // ============================================================
    ymaps.ready(() => {
        myMap = new ymaps.Map('map', {
            center: [48.707267, 44.516688],
            zoom: 6,
            controls: ['zoomControl', 'fullscreenControl']
        });

        new ymaps.SuggestView('from');
        new ymaps.SuggestView('to');

        attachFieldHandlers(fromInput, 'from');
        attachFieldHandlers(toInput, 'to');
    });

    // ============================================================
    // 2. ОБРАБОТЧИКИ ПОЛЕЙ
    // ============================================================
    function attachFieldHandlers(input, type) {
        input.addEventListener('blur', () => {
            if (input.value.trim().length > 3) {
                geocodeAndSet(input.value, type);
            }
        });

        input.addEventListener('input', () => {
            if (type === 'from') state.from = null;
            if (type === 'to') state.to = null;
            updateCalculateButton();
        });

        // Enter в поле = blur
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
        });
    }

    // ============================================================
    // 3. ГЕОКОДИРОВАНИЕ
    // ============================================================
    function geocodeAndSet(address, type) {
        ymaps.geocode(address, { results: 1, kind: 'house' })
            .then(res => {
                let first = res.geoObjects.get(0);
                // Если с kind:'house' ничего не нашли — пробуем без него
                if (!first) {
                    return ymaps.geocode(address, { results: 1 });
                }
                return { geoObjects: res.geoObjects };
            })
            .then(res => {
                const first = res.geoObjects.get(0);
                if (!first) {
                    console.warn('Адрес не найден:', address);
                    alert('Адрес не найден: ' + address);
                    return;
                }
                const coords = first.geometry.getCoordinates();
                const pretty = first.getAddressLine();

                if (type === 'from') {
                    state.from = coords;
                    fromInput.value = pretty;
                    markerFrom = setMarker(markerFrom, coords, 'orange', 'Откуда');
                } else {
                    state.to = coords;
                    toInput.value = pretty;
                    markerTo = setMarker(markerTo, coords, 'green', 'Куда');
                }

                fitMapToMarkers();
                updateCalculateButton();
                console.log(`[${type}]`, coords, pretty);
            })
            .catch(err => console.error('Ошибка геокодирования:', err));
    }

    // ============================================================
    // 4. МЕТКИ И КАРТА
    // ============================================================
    function setMarker(oldMarker, coords, color, hint) {
        if (oldMarker) myMap.geoObjects.remove(oldMarker);

        const marker = new ymaps.Placemark(coords, {
            hintContent: hint,
            balloonContent: hint
        }, {
            preset: `islands#${color}Icon`
        });
        myMap.geoObjects.add(marker);
        return marker;
    }

    function fitMapToMarkers() {
        if (!myMap) return;

        if (state.from && state.to) {
            // Без checkZoomRange — он иногда мешает
            myMap.setBounds([state.from, state.to], {
                zoomMargin: [60, 60, 60, 60]
            });
        } else if (state.from) {
            myMap.setCenter(state.from, 14);
        } else if (state.to) {
            myMap.setCenter(state.to, 14);
        }
    }

    // ============================================================
    // 5. РАЗМЕР ПОСЫЛКИ
    // ============================================================
    sizeCards.forEach(card => {
        card.addEventListener('click', () => {
            sizeCards.forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active');
            state.size = card.dataset.value;
            updateCalculateButton();
        });
    });

    // ============================================================
    // 6. АКТИВАЦИЯ КНОПКИ
    // ============================================================
    function updateCalculateButton() {
        const ready = Boolean(state.from && state.to && state.size);
        calcBtn.disabled = !ready;
    }

    // ============================================================
    // 7. РАСЧЁТ РАССТОЯНИЯ ПО ФОРМУЛЕ ГАВЕРСИНУСА
    // ============================================================
    function haversineKm([lat1, lon1], [lat2, lon2]) {
        const R = 6371; // радиус Земли, км
        const toRad = (d) => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        return Math.round(2 * R * Math.asin(Math.sqrt(a)));
    }

    // ============================================================
    // 8. РАСЧЁТ СТОИМОСТИ
    // ============================================================
    calcBtn.addEventListener('click', () => {
        if (!state.from || !state.to) {
            alert('Выберите оба адреса');
            return;
        }

        // Расстояние по прямой (в км)
        const distanceKm = haversineKm(state.from, state.to);

        // Коэффициент извилистости дорог ≈ 1.3
        const roadDistance = Math.round(distanceKm * 1.3);

        const rate = RATES[state.size];
        const total = roadDistance * rate;

        state.distance = roadDistance;
        state.total = total;

        // Вывод
        distanceEl.textContent = `${roadDistance} км`;
        durationEl.textContent = `${Math.max(1, Math.round(roadDistance / 60))} ч`;
        rateEl.textContent = `${rate} ₽/км`;
        totalEl.textContent = `${total.toLocaleString('ru-RU')} ₽`;

        // Показываем блок результата (если был скрыт)
        document.getElementById('result').style.display = 'block';

        // Кнопка
        calcBtn.classList.add('is-calculated');
        calcBtn.textContent = 'Пересчитать';

        // Отправка
        updateSubmitButton();
    });

    // ============================================================
    // 9. ВАЛИДАЦИЯ ФОРМЫ
    // ============================================================
    function isNameValid(v) {
        return /^[А-ЯЁа-яёA-Za-z\s-]{2,50}$/.test(v.trim());
    }
    function isPhoneValid(v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    }
    function updateSubmitButton() {
        const valid =
            isNameValid(nameInput.value) &&
            isPhoneValid(phoneInput.value) &&
            state.total > 0;
        submitBtn.disabled = !valid;
    }

    nameInput.addEventListener('input', updateSubmitButton);
    phoneInput.addEventListener('input', updateSubmitButton);

    // ============================================================
    // 10. ОТПРАВКА + СОХРАНЕНИЕ ЗАКАЗА
    // ============================================================
    submitBtn.addEventListener('click', () => {
        const orderNumber = 'DST-' + Date.now().toString().slice(-8);
        orderIdEl.textContent = orderNumber;

        // Формируем объект заказа
        const orderData = {
            id: orderNumber,
            from: fromInput.value,
            to: toInput.value,
            size: state.size,
            distance: state.distance,
            total: state.total,
            name: nameInput.value,
            phone: phoneInput.value,
            createdAt: Date.now()
        };

        // Сохраняем в localStorage (все заказы в одном объекте)
        const orders = JSON.parse(localStorage.getItem('dostaffkin_orders') || '{}');
        orders[orderNumber] = orderData;
        localStorage.setItem('dostaffkin_orders', JSON.stringify(orders));

        // Показываем success-блок
        orderForm.style.display = 'none';
        orderSuccess.classList.add('is-visible');

        console.log('Заказ сохранён:', orderData);
    });
});