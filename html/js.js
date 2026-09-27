document.addEventListener('DOMContentLoaded', function() {

    const trackButton = document.getElementById('trackButton');
    const trackNumberInput = document.getElementById('trackNumber');
    const trackResult = document.getElementById('trackResult');

    trackButton.addEventListener('click', function() {
        const trackNumber = trackNumberInput.value.trim();

        if (trackNumber === '') {
            alert('Пожалуйста, введите номер посылки');
            return;
        }

        if (!/^\d+$/.test(trackNumber)) {
            alert('Номер посылки должен содержать только цифры');
            return;
        }

        trackResult.style.display = 'block';
        
        document.getElementById('trackIdValue').textContent = `ID: ${trackNumber}`;
    });
});