/**
 * device-detect.js
 * Erkennt automatisch ob Fernseher oder Handy
 * und lädt die richtige CSS-Datei.
 *
 * Dieses Script muss im <head> ALLER HTML-Dateien
 * als ERSTES <script> stehen (vor style.css).
 */
(function () {
    'use strict';

    function isTV() {
        var ua = navigator.userAgent.toLowerCase();

        // 1. User-Agent: bekannte TV/SmartTV Browser
        var tvKeywords = [
            'smart-tv', 'smarttv', 'googletv', 'appletv', 'hbbtv',
            'netcast', 'viera', 'nettv', 'opera tv', 'bravia', 'web0s',
            'webos', 'tizen', 'philipstv', 'aquos', 'tvbrowser',
            'crkey', 'roku', 'firetv', 'fire tv'
        ];
        if (tvKeywords.some(function (kw) { return ua.indexOf(kw) !== -1; })) {
            return true;
        }

        // 2. Kein Touch + sehr großer Bildschirm → Fernseher
        var noTouch = !('ontouchstart' in window) &&
                      !(navigator.maxTouchPoints > 0) &&
                      !(navigator.msMaxTouchPoints > 0);

        // Bildschirmbreite: echte physische Breite (nicht Viewport)
        var bigScreen = window.screen.width >= 1280;

        if (noTouch && bigScreen) {
            return true;
        }

        return false;
    }

    // CSS-Datei dynamisch in <head> einfügen
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';

    if (isTV()) {
        link.href = 'style-tv.css';
        document.documentElement.setAttribute('data-device', 'tv');
    } else {
        link.href = 'style-mobile.css';
        document.documentElement.setAttribute('data-device', 'mobile');
    }

    // Als allererstes CSS einfügen
    var firstLink = document.head.querySelector('link[rel="stylesheet"]');
    if (firstLink) {
        document.head.insertBefore(link, firstLink);
    } else {
        document.head.appendChild(link);
    }

    // Debug-Info (kann später entfernt werden)
    console.log('[DeviceDetect] Gerät erkannt:', isTV() ? 'TV' : 'Mobile/Handy');
    console.log('[DeviceDetect] Screen:', window.screen.width + 'x' + window.screen.height);
    console.log('[DeviceDetect] Touch:', ('ontouchstart' in window));

})();
