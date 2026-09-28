// ============================================================
// TRACK.JS — отслеживание посылки по номеру из localStorage
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    const btn = document.getElementById('trackButton');
    const input = document.getElementById('trackNumber');
    const result = document.getElementById('trackResult');

    // Интервал «жизни» статуса в минутах (для демо)
    // Каждые 2 минуты — новый статус
    const STEP_MIN = 2;

    btn.addEventListener('click', () => {
        const value = input.value.trim();

        if (!value) {
            input.focus();
            alert('Введите номер посылки');
            return;
        }

        // Ищем заказ
        const orders = JSON.parse(localStorage.getItem('dostaffkin_orders') || '{}');
        const order = orders[value];

        if (!order) {
            alert('Заказ не найден. Проверьте номер или оформите доставку.');
            return;
        }

        // Заполняем данные
        document.getElementById('trackIdValue').textContent = `ID: ${order.id}`;
        document.getElementById('trackFromValue').textContent = `Откуда: ${order.from}`;
        document.getElementById('trackToValue').textContent = `Куда: ${order.to}`;

        // Рендерим статусы
        renderStatuses(order);

        // Показываем
        result.classList.add('is-visible');
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Enter в поле = клик
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    // ============================================================
    // Рендер статусов
    // ============================================================
    function renderStatuses(order) {
        // Сколько минут прошло с момента создания
        const elapsedMin = (Date.now() - order.createdAt) / 60000;
        // На каком этапе сейчас (0–3)
        const stage = Math.min(3, Math.floor(elapsedMin / STEP_MIN));

        // Город отправки — берём из адреса «Откуда»
        const fromCity = extractCity(order.from);
        const toCity = extractCity(order.to);

        const stages = [
            {
                cls: 'created',
                label: 'Создан',
                date: order.createdAt
            },
            {
                cls: 'in-way',
                label: `В пути: ${fromCity}`,
                date: order.createdAt + STEP_MIN * 60 * 1000
            },
            {
                cls: 'ready',
                label: `Готов к выдаче: ${toCity}`,
                date: order.createdAt + STEP_MIN * 2 * 60 * 1000
            },
            {
                cls: 'done',
                label: 'Вручен',
                date: order.createdAt + STEP_MIN * 3 * 60 * 1000
            }
        ];

        const list = document.getElementById('trackStatusList');
        list.innerHTML = '';

        stages.forEach((s, i) => {
            const active = i <= stage;
            const row = document.createElement('div');
            row.className = `track-status ${s.cls}`;
            if (!active) row.style.opacity = '0.35';

            row.innerHTML = `
                <img src="./images/icons/${s.cls}.svg" class="track-status-icon" alt="${s.label}">
                <div class="track-status-text">
                    <div class="track-status-text-state">${s.label}</div>
                    <div class="track-status-text-date">${active ? formatDate(s.date) : '—'}</div>
                </div>
            `;
            list.appendChild(row);
        });
    }

    // Извлекаем название города из адреса
    function extractCity(address) {
        if (!address) return '—';
        // Первое слово обычно город
        const match = address.match(/^(?:г\.?\s*)?([А-ЯЁ][а-яё-]+)/);
        return match ? match[1] : address.split(',')[0];
    }

    // Форматируем дату в ДД.ММ.ГГГГ
    function formatDate(timestamp) {
        const d = new Date(timestamp);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
    }
});