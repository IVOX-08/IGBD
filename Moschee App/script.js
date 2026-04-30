/**
 * Sandžak Kassel - Gebetszeiten Logik
 * Stand: April 2026
 */

// 1. Konfiguration: Minuten für Iqamah nach dem Adhan
const iqamahOffsets = { 
    dhuhr: 10,   // 10 Minuten nach Adhan
    asr: 10,     // 10 Minuten nach Adhan
    maghrib: 0,  // Direkt nach Adhan
    isha: 0      // Direkt nach Adhan
};

// Liste für bosnische Wochentage (verhindert "Thu")
const bosnianDays = {
    'Monday': 'Ponedjeljak',
    'Tuesday': 'Utorak',
    'Wednesday': 'Srijeda',
    'Thursday': 'Četvrtak',
    'Friday': 'Petak',
    'Saturday': 'Subota',
    'Sunday': 'Nedjelja'
};

async function loadPrayerTimes() {
    try {
        const response = await fetch('Gebetszeiten.csv');
        if (!response.ok) throw new Error('CSV nicht gefunden');
        
        const data = await response.text();
        const rows = data.replace(/\r/g, "").split('\n').map(row => row.trim()).filter(row => row.length > 10);
        
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; 
        const todayData = rows.find(row => row.startsWith(todayStr));

        if (todayData) {
            const cols = todayData.split(';');

            // 2. Adhan Zeiten aus Excel anzeigen
            updateField('time-fajr', cols[1]);
            updateField('time-sunrise', cols[2]);
            updateField('time-dhuhr', cols[3]);
            updateField('time-asr', cols[4]);
            updateField('time-maghrib', cols[5]);
            updateField('time-isha', cols[6]);
            updateField('time-jumuah', cols[7]);

            // 3. Iqamah Zeiten
            // Fajr ist FEST um 05:15 Uhr
            const fajrIqamahEl = document.getElementById('time-iqamah-fajr');
            if (fajrIqamahEl) fajrIqamahEl.innerText = "05:15";

            // Restliche Iqamah Zeiten berechnen
            calcIqamah(cols[3], 'time-iqamah-dhuhr', iqamahOffsets.dhuhr);
            calcIqamah(cols[4], 'time-iqamah-asr', iqamahOffsets.asr);
            calcIqamah(cols[5], 'time-maghrib-iqamah', iqamahOffsets.maghrib);
            calcIqamah(cols[6], 'time-iqamah-isha', iqamahOffsets.isha);

            // 4. Wochentag & Datum Logik (Sicherer Fix)
            const isBosnian = window.location.pathname.includes('bs.html');
            const dayEl = document.getElementById('day-name');

            if (dayEl) {
                if (isBosnian) {
                    // Holt den englischen Namen und tauscht ihn gegen den bosnischen aus der Liste oben
                    const englishDay = now.toLocaleDateString('en-US', { weekday: 'long' });
                    dayEl.innerText = bosnianDays[englishDay];
                } else {
                    // Normales Deutsch
                    dayEl.innerText = now.toLocaleDateString('de-DE', { weekday: 'long' });
                }
            }

            const dateEl = document.getElementById('current-date');
            if (dateEl) dateEl.innerText = now.toLocaleDateString('de-DE');
            
        }
    } catch (e) { 
        console.error("Fehler:", e); 
    }
}

function updateField(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.innerText = val.trim().substring(0, 5);
}

function calcIqamah(adhanTime, targetId, offset) {
    const el = document.getElementById(targetId);
    if (!el || !adhanTime) return;
    
    try {
        let [h, m] = adhanTime.split(':').map(Number);
        let d = new Date();
        d.setHours(h, m + offset);
        el.innerText = String(d.getHours()).padStart(2, '0') + ":" + 
                       String(d.getMinutes()).padStart(2, '0');
    } catch (e) { el.innerText = "--:--"; }
}

function startClock() {
    setInterval(() => {
        const clockEl = document.getElementById('current-time');
        if (clockEl) clockEl.innerText = new Date().toLocaleTimeString('de-DE');
    }, 1000);
}

function selectLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
    window.location.href = lang + '.html';
}

function changeLanguage() {
    localStorage.removeItem('selectedLanguage');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    loadPrayerTimes();
});