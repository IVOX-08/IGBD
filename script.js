/**
 * Sandžak Kassel - Gebetszeiten Logik (Multi-Language & TV-Modus)
 * Stand: April 2026
 */

const iqamahOffsets = { 
    dhuhr: 10, 
    asr: 10, 
    maghrib: 0, 
    isha: 0 
};

const dayNames = {
    'bs': { 'Monday': 'Ponedjeljak', 'Tuesday': 'Utorak', 'Wednesday': 'Srijeda', 'Thursday': 'Četvrtak', 'Friday': 'Petak', 'Saturday': 'Subota', 'Sunday': 'Nedjelja' },
    'tr': { 'Monday': 'Pazartesi', 'Tuesday': 'Salı', 'Wednesday': 'Çarşamba', 'Thursday': 'Perşembe', 'Friday': 'Cuma', 'Saturday': 'Cumartesi', 'Sunday': 'Pazar' },
    'ar': { 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت', 'Sunday': 'الأحد' }
};

let cachedPrayerTimes = []; // Speichert die Zeiten für den Countdown

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
            cachedPrayerTimes = cols; // Für Countdown speichern

            // 1. Adhan Zeiten anzeigen
            updateField('time-fajr', cols[1]);
            updateField('time-sunrise', cols[2]);
            updateField('time-dhuhr', cols[3]);
            updateField('time-asr', cols[4]);
            updateField('time-maghrib', cols[5]);
            updateField('time-isha', cols[6]);
            updateField('time-jumuah', cols[7]);

            // 2. Iqamah Zeiten
            const fajrIqamahEl = document.getElementById('time-iqamah-fajr');
            if (fajrIqamahEl) fajrIqamahEl.innerText = "05:15";

            calcIqamah(cols[3], 'time-iqamah-dhuhr', iqamahOffsets.dhuhr);
            calcIqamah(cols[4], 'time-iqamah-asr', iqamahOffsets.asr);
            calcIqamah(cols[5], 'time-maghrib-iqamah', iqamahOffsets.maghrib);
            calcIqamah(cols[6], 'time-iqamah-isha', iqamahOffsets.isha);

            // 3. Wochentag & Datum
            updateDateAndHijri(now);
        }
    } catch (e) { console.error("Fehler beim Laden:", e); }
}

function updateDateAndHijri(now) {
    const path = window.location.pathname;
    const dayEl = document.getElementById('day-name');
    const dateEl = document.getElementById('current-date');
    const hijriEl = document.getElementById('hijri-date');

    // Normales Datum
    if (dateEl) dateEl.innerText = now.toLocaleDateString('de-DE');

    // Wochentag
    if (dayEl) {
        const englishDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        if (path.includes('bs.html')) dayEl.innerText = dayNames['bs'][englishDay];
        else if (path.includes('tr.html')) dayEl.innerText = dayNames['tr'][englishDay];
        else if (path.includes('ar.html')) dayEl.innerText = dayNames['ar'][englishDay];
        else dayEl.innerText = now.toLocaleDateString('de-DE', { weekday: 'long' });
    }

    // Mondkalender (Hijri)
    if (hijriEl) {
        // Nutzt die Intl-API für die Konvertierung
        const hijriFormatter = new Intl.DateTimeFormat('de-DE-u-ca-islamic-uma', { day: 'numeric', month: 'long', year: 'numeric' });
        hijriEl.innerText = hijriFormatter.format(now);
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
        el.innerText = String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0');
    } catch (e) { el.innerText = "--:--"; }
}

function updateCountdown() {
    if (cachedPrayerTimes.length === 0) return;

    const now = new Date();
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    // Wir prüfen: Fajr(1), Dhuhr(3), Asr(4), Maghrib(5), Isha(6)
    const prayerIndices = [1, 3, 4, 5, 6];
    let nextPrayerTime = null;

    for (let index of prayerIndices) {
        let [h, m] = cachedPrayerTimes[index].split(':').map(Number);
        let pDate = new Date();
        pDate.setHours(h, m, 0);

        if (pDate > now) {
            nextPrayerTime = pDate;
            break;
        }
    }

    // Wenn kein Gebet heute mehr kommt, nimm das Fajr von morgen (vereinfacht)
    if (!nextPrayerTime) {
        let [h, m] = cachedPrayerTimes[1].split(':').map(Number);
        nextPrayerTime = new Date();
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
        nextPrayerTime.setHours(h, m, 0);
    }

    const diff = nextPrayerTime - now;
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timerEl.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startClock() {
    setInterval(() => {
        const clockEl = document.getElementById('current-time');
        if (clockEl) {
            const now = new Date();
            clockEl.innerText = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        updateCountdown();
    }, 1000);
}

function selectLanguage(lang) { window.location.href = lang + '.html'; }
function changeLanguage() { window.location.href = 'index.html'; }

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    loadPrayerTimes();
});