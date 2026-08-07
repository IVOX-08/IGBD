(function () {
  'use strict';

  const CONFIG = {
    // HIER GEÄNDERT: Dein neuer GitHub Raw-Link
    csvUrl: 'https://raw.githubusercontent.com/IVOX-08/juply6202/refs/heads/main/Gebetszeiten.csv',
    iqamahOffsets: { dhuhr: 10, asr: 10, maghrib: 5, isha: 0 },
    fajrIqamahFixed: "05:15",
    updateInterval: 1000
  };

  let cachedPrayerTimes = [];
  const pad = (n) => String(n).padStart(2, '0');
  const currentLang = document.documentElement.lang || 'bs';

  // ── Bosnisch ────────────────────────────────────────────────
  const BS_DAYS = ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'];
  const BS_MONTHS = [
    'januara','februara','marta','aprila','maja','juna',
    'jula','augusta','septembra','oktobra','novembra','decembra'
  ];
  const BS_HIJRI_MONTHS = [
    "Muharrem","Safer","Rebi'ul-evvel","Rebi'ul-ahir",
    "Džumadel-ula","Džumadel-uhra","Redžeb","Ša'ban",
    "Ramazan","Ševval","Zul-ka'de","Zul-hidždže"
  ];

  // ── Deutsch ─────────────────────────────────────────────────
  const DE_HIJRI_MONTHS = [
    "Muharram","Safar","Rabi al-Awwal","Rabi al-Thani",
    "Dschumada l-Ula","Dschumada l-Ukhra","Radschab","Schaban",
    "Ramadan","Schawwal","Dhul-Qaida","Dhul-Hiddscha"
  ];

  const LOCALE_MAP = {
    'bs': ['bs-BA','hr-HR','sr-Latn','de-DE'],
    'de': ['de-DE'],
    'ar': ['ar-SA'],
    'tr': ['tr-TR']
  };

  const HIJRI_LOCALE_MAP = {
    'bs': null,
    'de': null,
    'ar': 'ar-SA-u-ca-islamic-umalqura',
    'tr': 'tr-TR-u-ca-islamic-umalqura'
  };

  function getLocales() {
    return LOCALE_MAP[currentLang] || [currentLang, 'de-DE'];
  }

  function parseTimeToDate(timeStr, baseDate = new Date()) {
    if (!timeStr) return null;
    const [hh, mm] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  // ── GEÄNDERT: CSV LADEN & OFFLINE LOGIK ──────────────────────
  async function loadVaktijaData() {
    try {
      // Cache-Buster (?t=...) sorgt für immer frische Daten
      const url = CONFIG.csvUrl + '?t=' + Date.now();
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Download Fehler');
      
      const text = await response.text();
      
      // Backup im LocalStorage speichern
      localStorage.setItem('vaktija_cache', text);
      
      processVaktijaText(text);

    } catch (error) {
      console.warn("Offline-Modus: Lade gespeicherten Cache...");
      const backup = localStorage.getItem('vaktija_cache');
      if (backup) {
        processVaktijaText(backup);
      }
    }
  }

  function processVaktijaText(text) {
    const rows = text.replace(/\r/g, "").split('\n').filter(row => row.length > 10);
    const now = new Date();
    // Sucht Format: 2026-05-11
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const todayRow = rows.find(row => row.trim().startsWith(todayKey));
    
    if (todayRow) {
      cachedPrayerTimes = todayRow.split(';');
      renderPrayerTimes(cachedPrayerTimes);
    }
  }
  // ────────────────────────────────────────────────────────────

  function renderPrayerTimes(cols) {
    const fields = {
      'time-fajr': cols[1], 'time-sunrise': cols[2], 'time-dhuhr': cols[3],
      'time-asr': cols[4], 'time-maghrib': cols[5], 'time-isha': cols[6], 'time-jumuah': cols[7]
    };
    for (const [id, val] of Object.entries(fields)) {
      const el = document.getElementById(id);
      // .substring(0, 5) schneidet die Sekunden (:00) ab
      if (el && val) el.textContent = val.trim().substring(0, 5);
    }
    setIqamah('time-iqamah-fajr', CONFIG.fajrIqamahFixed);
    calcAndSetIqamah('time-iqamah-dhuhr',  cols[3], CONFIG.iqamahOffsets.dhuhr);
    calcAndSetIqamah('time-iqamah-asr',    cols[4], CONFIG.iqamahOffsets.asr);
    calcAndSetIqamah('time-maghrib-iqamah',cols[5], CONFIG.iqamahOffsets.maghrib);
    calcAndSetIqamah('time-iqamah-isha',   cols[6], CONFIG.iqamahOffsets.isha);
  }

  function setIqamah(id, time) {
    const el = document.getElementById(id);
    if (el) el.textContent = time;
  }

  function calcAndSetIqamah(id, adhanStr, offsetMin) {
    const el = document.getElementById(id);
    if (!el || !adhanStr) return;
    const adhanDate = parseTimeToDate(adhanStr);
    if (adhanDate) {
      const iqDate = new Date(adhanDate.getTime() + offsetMin * 60000);
      el.textContent = `${pad(iqDate.getHours())}:${pad(iqDate.getMinutes())}`;
    }
  }

  // ── Bosnisch: Datum ──────────────────────────────────────────
  function formatDateBosnian(now) {
    return {
      dayName: BS_DAYS[now.getDay()],
      dateStr: `${now.getDate()}. ${BS_MONTHS[now.getMonth()]} ${now.getFullYear()}.`
    };
  }

  // ── Hijri-Zahlen aus EN holen ────────────────────────────────
  function getHijriParts(now) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
      }).formatToParts(now);
      const day   = parts.find(p => p.type === 'day')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const year  = parts.find(p => p.type === 'year')?.value;
      if (day && month && year) return { day, monthIndex: parseInt(month,10)-1, year };
    } catch(e) {}
    return null;
  }

  function formatHijriBosnian(now) {
    const p = getHijriParts(now);
    if (!p) return '';
    return `${p.day}. ${BS_HIJRI_MONTHS[p.monthIndex] || p.monthIndex+1} ${p.year}. h.`;
  }

  function formatHijriGerman(now) {
    const p = getHijriParts(now);
    if (!p) return '';
    return `${p.day}. ${DE_HIJRI_MONTHS[p.monthIndex] || p.monthIndex+1} ${p.year} n. H.`;
  }

  // ── Haupt-Engine (läuft jede Sekunde) ───────────────────────
  function runEngine() {
    const now = new Date();

    // 1. Uhrzeit
    const clockEl = document.getElementById('current-time');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }

    // 2. Datum & Wochentag
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      let dayName, dateStr;
      if (currentLang === 'bs') {
        const f = formatDateBosnian(now);
        dayName = f.dayName; dateStr = f.dateStr;
      } else {
        const locales = getLocales();
        dayName = new Intl.DateTimeFormat(locales, { weekday: 'long' }).format(now);
        dateStr = new Intl.DateTimeFormat(locales, { day: '2-digit', month: 'long', year: 'numeric' }).format(now);
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      }
      dateEl.innerHTML = `${dayName}<br><span style="font-size:0.8em;opacity:0.85;">${dateStr}</span>`;
    }

    // 3. Hijri-Datum
    const hijriEl = document.getElementById('hijri-date');
    if (hijriEl) {
      if (currentLang === 'bs') {
        hijriEl.textContent = formatHijriBosnian(now);
      } else if (currentLang === 'de') {
        hijriEl.textContent = formatHijriGerman(now);
      } else {
        const locale = HIJRI_LOCALE_MAP[currentLang];
        try {
          hijriEl.textContent = new Intl.DateTimeFormat(locale || 'ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric', month: 'long', year: 'numeric'
          }).format(now);
        } catch(e) {
          hijriEl.textContent = '';
        }
      }
    }

    updateCountdown(now);
    highlightNextPrayer(now);
  }

  // ── Countdown ────────────────────────────────────────────────
  function updateCountdown(now) {
    if (cachedPrayerTimes.length < 7) return;
    const indices = [1,3,4,5,6];
    let next = null;
    for (const idx of indices) {
      const d = parseTimeToDate(cachedPrayerTimes[idx], now);
      if (d && d > now) { next = d; break; }
    }
    if (!next) {
      next = parseTimeToDate(cachedPrayerTimes[1], now);
      if (next) next.setDate(next.getDate() + 1);
    }
    if (!next) return;
    const diff = next - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const el = document.getElementById('countdown-timer');
    if (el) el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // ── Aktive Gebetsbox hervorheben ─────────────────────────────
  function highlightNextPrayer(now) {
    if (cachedPrayerTimes.length < 7) return;
    const map = [
      {key:'fajr',idx:1},{key:'dhuhr',idx:3},
      {key:'asr',idx:4},{key:'maghrib',idx:5},{key:'isha',idx:6}
    ];
    let nextKey = 'fajr';
    for (const p of map) {
      const d = parseTimeToDate(cachedPrayerTimes[p.idx], now);
      if (d && d > now) { nextKey = p.key; break; }
    }
    document.querySelectorAll('.prayer-group').forEach(el => {
      el.classList.toggle('prayer-group--active', el.dataset.prayer === nextKey);
    });
  }

  // ── PWA Install Prompt ───────────────────────────────────────
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const dismissed = localStorage.getItem('pwa_dismissed');
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !dismissed) banner.style.display = 'flex';
  });

  document.addEventListener('click', async (e) => {
    if (e.target.id === 'pwa-install-btn' && deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      const b = document.getElementById('pwa-install-banner');
      if (b) b.style.display = 'none';
    }
    if (e.target.id === 'pwa-dismiss-btn') {
      const b = document.getElementById('pwa-install-banner');
      if (b) b.style.display = 'none';
      localStorage.setItem('pwa_dismissed', Date.now() + 7*24*60*60*1000);
    }
  });

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    loadVaktijaData();
    runEngine();
    setInterval(runEngine, CONFIG.updateInterval);
    setInterval(loadVaktijaData, 10 * 60 * 1000); // Alle 10 Min prüfen
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
