(function () {
    /* Load CSS immediately, before anything else */
    (function() {
        if (!document.getElementById('a11y-css')) {
            var link = document.createElement('link');
            link.id = 'a11y-css';
            link.rel = 'stylesheet';
            link.href = '/CSS/accessibility.css';
            document.head.appendChild(link);
        }
        /* Inject @font-face directly so it's available immediately */
        if (!document.getElementById('a11y-font-style')) {
            var style = document.createElement('style');
            style.id = 'a11y-font-style';
            style.textContent = [
                "@font-face {",
                "  font-family: 'OpenDyslexic';",
                "  src: url('/Fonts/OpenDyslexic-Regular.woff2') format('woff2'),",
                "       url('/Fonts/OpenDyslexic-Regular.otf') format('opentype');",
                "  font-weight: normal; font-style: normal; font-display: swap;",
                "}",
                "@font-face {",
                "  font-family: 'OpenDyslexic';",
                "  src: url('/Fonts/OpenDyslexic-Bold.woff2') format('woff2'),",
                "       url('/Fonts/OpenDyslexic-Bold.otf') format('opentype');",
                "  font-weight: bold; font-style: normal; font-display: swap;",
                "}",
                "html.dyslexia-font, html.dyslexia-font * {",
                "  font-family: 'OpenDyslexic', sans-serif !important;",
                "}"
            ].join('\n');
            document.head.appendChild(style);
        }
    })();

    var STORAGE_KEY = 'a11y-settings';
    var DEFAULT_SETTINGS = {
        highContrast: false,
        fontSize: 100,
        lineSpacing: 100,
        dyslexiaFont: false,
        reducedMotion: false,
        colourOverlay: 'none',
        readingGuide: false,
        ttsEnabled: false,
        customTextColour: '',
        customBgColour: ''
    };

    var settings = {};
    var ttsAudio = null;
    var ttsSpeaking = false;
    var panelOpen = false;
    var ttsSourceEl = null;
    var ttsWordSpans = [];
    var highlightTimers = [];

    function loadSettings() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
            } else {
                settings = Object.assign({}, DEFAULT_SETTINGS);
            }
        } catch (e) {
            settings = Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    function saveSettings() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
    }

    function isChanged() {
        return Object.keys(DEFAULT_SETTINGS).some(function (k) {
            return settings[k] !== DEFAULT_SETTINGS[k];
        });
    }

    /* ---- Apply functions ---- */

    function applyHighContrast() {
        if (settings.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }

    function applyFontSize() {
        var scale = settings.fontSize / 100;
        /* Zoom each .contentContainer so hardcoded px sizes scale too.
           Header, sidebar and h1 headings sit outside contentContainer and are unaffected. */
        document.querySelectorAll('.contentContainer').forEach(function (el) {
            if (scale === 1) {
                el.style.removeProperty('zoom');
            } else {
                el.style.zoom = scale;
            }
        });
    }

    function applyLineSpacing() {
        document.documentElement.style.setProperty('--a11y-line-scale', settings.lineSpacing / 100);
    }

    var openDyslexicLoaded = false;

    function loadOpenDyslexicFonts(callback) {
        if (openDyslexicLoaded) { if (callback) callback(); return; }
        if (!window.FontFace) { if (callback) callback(); return; }
        try {
            var f1 = new FontFace('OpenDyslexic',
                "url('/Fonts/OpenDyslexic-Regular.woff2') format('woff2')," +
                "url('/Fonts/OpenDyslexic-Regular.otf') format('opentype')",
                { weight: 'normal', style: 'normal' });
            var f2 = new FontFace('OpenDyslexic',
                "url('/Fonts/OpenDyslexic-Bold.woff2') format('woff2')," +
                "url('/Fonts/OpenDyslexic-Bold.otf') format('opentype')",
                { weight: 'bold', style: 'normal' });
            Promise.all([f1.load(), f2.load()]).then(function (fonts) {
                fonts.forEach(function (f) { document.fonts.add(f); });
                openDyslexicLoaded = true;
                if (callback) callback();
            }).catch(function (err) {
                console.warn('OpenDyslexic load error:', err);
                if (callback) callback();
            });
        } catch (e) {
            console.warn('FontFace API error:', e);
            if (callback) callback();
        }
    }

    function applyDyslexiaFont() {
        if (settings.dyslexiaFont) {
            document.documentElement.classList.add('dyslexia-font');
            loadOpenDyslexicFonts();
        } else {
            document.documentElement.classList.remove('dyslexia-font');
        }
    }

    function applyReducedMotion() {
        if (settings.reducedMotion) {
            document.documentElement.classList.add('reduced-motion');
        } else {
            document.documentElement.classList.remove('reduced-motion');
        }
    }

    function applyColourOverlay() {
        document.documentElement.setAttribute('data-colour-overlay', settings.colourOverlay);
    }

    function applyCustomTextColour() {
        if (settings.customTextColour) {
            document.documentElement.setAttribute('data-custom-text', '1');
            document.documentElement.style.setProperty('--a11y-text-colour', settings.customTextColour);
        } else {
            document.documentElement.removeAttribute('data-custom-text');
            document.documentElement.style.removeProperty('--a11y-text-colour');
        }
    }

    function applyCustomBgColour() {
        if (settings.customBgColour) {
            document.documentElement.setAttribute('data-custom-bg', '1');
            document.documentElement.style.setProperty('--a11y-bg-colour', settings.customBgColour);
        } else {
            document.documentElement.removeAttribute('data-custom-bg');
            document.documentElement.style.removeProperty('--a11y-bg-colour');
        }
    }

    function applyReadingGuide() {
        var guide = document.getElementById('a11y-reading-guide');
        if (settings.readingGuide) {
            document.documentElement.classList.add('reading-guide-active');
            if (guide) guide.style.display = 'block';
        } else {
            document.documentElement.classList.remove('reading-guide-active');
            if (guide) guide.style.display = 'none';
        }
    }

    function applyAllSettings() {
        applyHighContrast();
        applyFontSize();
        applyLineSpacing();
        applyDyslexiaFont();
        applyReducedMotion();
        applyColourOverlay();
        applyCustomTextColour();
        applyCustomBgColour();
        applyReadingGuide();
    }

    /* ---- TTS ---- */

    function showTTSBanner(text) {
        var banner = document.getElementById('a11y-tts-banner');
        if (!banner) return;
        var preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
        banner.textContent = 'Speaking: ' + preview;
        banner.classList.add('visible');
    }

    function hideTTSBanner() {
        var banner = document.getElementById('a11y-tts-banner');
        if (banner) banner.classList.remove('visible');
    }

    /* ---- Word-highlight helpers ---- */

    function wrapWordsInElement(el) {
        if (!el) return [];
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        var node;
        while ((node = walker.nextNode())) { textNodes.push(node); }

        var allSpans = [];
        textNodes.forEach(function (textNode) {
            if (!textNode.textContent.trim()) return;
            var parent = textNode.parentNode;
            if (!parent) return;
            /* skip script/style descendants */
            var anc = parent;
            while (anc && anc !== el) {
                if (anc.tagName === 'SCRIPT' || anc.tagName === 'STYLE') return;
                anc = anc.parentElement;
            }
            var text = textNode.textContent;
            var frag = document.createDocumentFragment();
            var regex = /(\S+)/g;
            var match, lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                var span = document.createElement('span');
                span.className = 'a11y-word';
                span.textContent = match[1];
                allSpans.push(span);
                frag.appendChild(span);
                lastIndex = match.index + match[1].length;
            }
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            parent.replaceChild(frag, textNode);
        });
        return allSpans;
    }

    function unwrapWords(el) {
        if (!el) return;
        var spans = el.querySelectorAll('span.a11y-word');
        spans.forEach(function (span) {
            span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
        });
        el.normalize();
    }

    function clearWordHighlights() {
        ttsWordSpans.forEach(function (s) { s.classList.remove('a11y-word-active'); });
    }

    /* Build a map of utterance charIndex → span, for browser boundary events */
    function buildCharMap(fullText, allSpans) {
        var map = [];
        var regex = /\S+/g;
        var m, i = 0;
        while ((m = regex.exec(fullText)) !== null && i < allSpans.length) {
            map.push({ charStart: m.index, charEnd: m.index + m[0].length, span: allSpans[i] });
            i++;
        }
        return map;
    }

    function clearHighlightTimers() {
        highlightTimers.forEach(function (t) { clearTimeout(t); });
        highlightTimers = [];
    }

    function stopTTS() {
        if (ttsAudio) { ttsAudio.pause(); ttsAudio = null; }
        if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
        ttsSpeaking = false;
        hideTTSBanner();
        clearHighlightTimers();
        clearWordHighlights();
        if (ttsSourceEl) { unwrapWords(ttsSourceEl); ttsSourceEl = null; }
        ttsWordSpans = [];
    }

    /* Pre-load voices as early as possible so Chrome has them ready */
    var _voicesReady = false;
    var _voicesCallbacks = [];
    function _ensureVoices(cb) {
        if (!window.speechSynthesis) return;
        var voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) { _voicesReady = true; return cb(voices); }
        var handler = function () {
            var v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                _voicesReady = true;
                window.speechSynthesis.removeEventListener('voiceschanged', handler);
                cb(v);
            }
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
    }
    /* Kick off voice loading immediately */
    if (window.speechSynthesis) {
        _ensureVoices(function () {});
    }

    function _doSpeak(text, voices, allSpans, charMap) {
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        if (voices) {
            var enGB = voices.filter(function (v) { return v.lang.startsWith('en-GB') && v.localService; });
            if (enGB.length === 0) enGB = voices.filter(function (v) { return v.lang.startsWith('en') && v.localService; });
            if (enGB.length === 0) enGB = voices.filter(function (v) { return v.lang.startsWith('en'); });
            if (enGB.length > 0) utterance.voice = enGB[0];
        }
        if (charMap && charMap.length > 0) {
            utterance.addEventListener('boundary', function (e) {
                if (e.name !== 'word') return;
                var ci = e.charIndex;
                clearWordHighlights();
                for (var i = 0; i < charMap.length; i++) {
                    if (ci >= charMap[i].charStart && ci < charMap[i].charEnd) {
                        charMap[i].span.classList.add('a11y-word-active');
                        charMap[i].span.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        break;
                    }
                }
            });
        }
        utterance.onend = function () {
            clearWordHighlights();
            if (ttsSourceEl) { unwrapWords(ttsSourceEl); ttsSourceEl = null; }
            ttsWordSpans = [];
            ttsSpeaking = false;
            hideTTSBanner();
        };
        utterance.onerror = function () {
            clearWordHighlights();
            if (ttsSourceEl) { unwrapWords(ttsSourceEl); ttsSourceEl = null; }
            ttsWordSpans = [];
            ttsSpeaking = false;
            hideTTSBanner();
        };
        ttsSpeaking = true;
        showTTSBanner(text);
        window.speechSynthesis.speak(utterance);
    }

    function speakWithBrowser(text, sourceEl) {
        if (!window.speechSynthesis) return;
        ttsSourceEl = sourceEl || null;
        var allSpans = ttsSourceEl ? wrapWordsInElement(ttsSourceEl) : [];
        ttsWordSpans = allSpans;
        var charMap = allSpans.length > 0 ? buildCharMap(text, allSpans) : [];
        _ensureVoices(function (voices) {
            _doSpeak(text, voices, allSpans, charMap);
        });
    }

    function speakText(text, sourceEl) {
        if (!text || !text.trim()) return;
        text = text.trim();

        if (ttsSpeaking) { stopTTS(); return; }

        fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text.substring(0, 2000) })
        }).then(function (res) {
            if (!res.ok) throw new Error('TTS server unavailable');
            return res.json();
        }).then(function (data) {
            /* Decode base64 audio */
            var raw = atob(data.audioContent);
            var buf = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) { buf[i] = raw.charCodeAt(i); }
            var blob = new Blob([buf], { type: 'audio/mpeg' });
            var url = URL.createObjectURL(blob);
            ttsAudio = new Audio(url);

            /* Wrap words and store spans */
            ttsSourceEl = sourceEl || null;
            var allSpans = ttsSourceEl ? wrapWordsInElement(ttsSourceEl) : [];
            ttsWordSpans = allSpans;

            /* Schedule word highlights from timepoints */
            var timepoints = data.timepoints || [];
            ttsAudio.addEventListener('playing', function () {
                var started = performance.now();
                clearHighlightTimers();
                timepoints.forEach(function (tp) {
                    var wordIdx = parseInt(tp.markName.slice(1), 10);
                    var delay = Math.max(0, tp.timeSeconds * 1000 - (performance.now() - started));
                    var t = setTimeout(function () {
                        clearWordHighlights();
                        if (allSpans[wordIdx]) {
                            allSpans[wordIdx].classList.add('a11y-word-active');
                            allSpans[wordIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                    }, delay);
                    highlightTimers.push(t);
                });
            });

            ttsSpeaking = true;
            showTTSBanner(text);
            ttsAudio.play();
            ttsAudio.onended = function () {
                clearHighlightTimers();
                clearWordHighlights();
                if (ttsSourceEl) { unwrapWords(ttsSourceEl); ttsSourceEl = null; }
                ttsWordSpans = [];
                ttsSpeaking = false;
                hideTTSBanner();
                URL.revokeObjectURL(url);
            };
            ttsAudio.onerror = function () {
                clearHighlightTimers();
                clearWordHighlights();
                if (ttsSourceEl) { unwrapWords(ttsSourceEl); ttsSourceEl = null; }
                ttsWordSpans = [];
                ttsSpeaking = false;
                hideTTSBanner();
                URL.revokeObjectURL(url);
            };
        }).catch(function () {
            speakWithBrowser(text, sourceEl);
        });
    }

    function getReadableBlock(el) {
        var BLOCK = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'LABEL', 'BLOCKQUOTE'];
        var node = el;
        while (node && node !== document.body) {
            if (BLOCK.indexOf(node.tagName) !== -1) return node;
            node = node.parentElement;
        }
        return el;
    }

    function getReadableText(el) {
        var selected = window.getSelection ? window.getSelection().toString().trim() : '';
        if (selected) return selected;
        var block = getReadableBlock(el);
        return (block.innerText || block.textContent || '').trim();
    }

    function initTTS() {
        document.addEventListener('click', function (e) {
            if (!settings.ttsEnabled) return;
            var panel = document.getElementById('a11y-panel');
            var trigger = document.getElementById('a11y-trigger');
            if (panel && panel.contains(e.target)) return;
            if (trigger && trigger.contains(e.target)) return;
            var IGNORE = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A'];
            if (IGNORE.indexOf(e.target.tagName) !== -1) return;
            var selected = window.getSelection ? window.getSelection().toString().trim() : '';
            var sourceEl = selected ? null : getReadableBlock(e.target);
            var text = selected || (sourceEl ? (sourceEl.innerText || sourceEl.textContent || '').trim() : '');
            if (text) speakText(text, sourceEl);
        });
    }

    /* ---- Reading guide ---- */

    function initReadingGuide() {
        var guide = document.createElement('div');
        guide.id = 'a11y-reading-guide';
        document.body.appendChild(guide);

        document.addEventListener('mousemove', function (e) {
            if (!settings.readingGuide) return;
            guide.style.top = (e.clientY - 20) + 'px';
        });

        document.addEventListener('mouseleave', function () {
            guide.style.display = 'none';
        });

        document.addEventListener('mouseenter', function () {
            if (settings.readingGuide) guide.style.display = 'block';
        });

        /* Touch support for mobile */
        document.addEventListener('touchmove', function (e) {
            if (!settings.readingGuide) return;
            var touch = e.touches[0];
            if (touch) guide.style.top = (touch.clientY - 20) + 'px';
        }, { passive: true });

        document.addEventListener('touchstart', function (e) {
            if (!settings.readingGuide) return;
            var touch = e.touches[0];
            if (touch) {
                guide.style.top = (touch.clientY - 20) + 'px';
                guide.style.display = 'block';
            }
        }, { passive: true });

        document.addEventListener('touchend', function () {
            if (!settings.readingGuide) return;
            guide.style.display = 'none';
        }, { passive: true });

        applyReadingGuide();
    }

    /* ---- Panel UI ---- */

    var TEXT_COLOURS = [
        { label: 'Default', value: '', display: 'default' },
        { label: 'Black', value: '#000000', display: '#000000' },
        { label: 'White', value: '#ffffff', display: '#ffffff' },
        { label: 'Dark Navy', value: '#1a1a2e', display: '#1a1a2e' },
        { label: 'Yellow', value: '#FFD700', display: '#FFD700' },
        { label: 'Green', value: '#00FF00', display: '#00FF00' },
        { label: 'Sky Blue', value: '#00BFFF', display: '#00BFFF' }
    ];

    var BG_COLOURS = [
        { label: 'Default', value: '', display: 'default' },
        { label: 'White', value: '#ffffff', display: '#ffffff' },
        { label: 'Black', value: '#000000', display: '#000000' },
        { label: 'Dark Navy', value: '#1a1a2e', display: '#1a1a2e' },
        { label: 'Cream', value: '#FFFDD0', display: '#FFFDD0' },
        { label: 'Alice Blue', value: '#F0F8FF', display: '#F0F8FF' },
        { label: 'Dark Grey', value: '#2d2d2d', display: '#2d2d2d' }
    ];

    var OVERLAYS = [
        { label: 'None', value: 'none', display: 'overlay-none' },
        { label: 'Cream', value: 'cream', display: '#FFFDD0' },
        { label: 'Blue', value: 'blue', display: '#C8DCFF' },
        { label: 'Pink', value: 'pink', display: '#FFD2DC' },
        { label: 'Green', value: 'green', display: '#D2FFDC' },
        { label: 'Yellow', value: 'yellow', display: '#FFFFC8' }
    ];

    function makeToggleRow(label, desc, key) {
        var row = document.createElement('div');
        row.className = 'a11y-row';

        var header = document.createElement('div');
        header.className = 'a11y-row-header';

        var lbl = document.createElement('span');
        lbl.className = 'a11y-row-label';
        lbl.textContent = label;

        var tog = document.createElement('label');
        tog.className = 'a11y-toggle';
        var inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.checked = settings[key];
        inp.addEventListener('change', function () {
            settings[key] = inp.checked;
            saveSettings();
            applyAllSettings();
            updateIndicator();
            updateResetBtn();
        });
        var slider = document.createElement('span');
        slider.className = 'a11y-toggle-slider';
        tog.appendChild(inp);
        tog.appendChild(slider);

        header.appendChild(lbl);
        header.appendChild(tog);
        row.appendChild(header);

        if (desc) {
            var d = document.createElement('div');
            d.className = 'a11y-row-desc';
            d.textContent = desc;
            row.appendChild(d);
        }

        return { row: row, input: inp };
    }

    function makeSliderRow(label, key, min, max, step, unit) {
        var row = document.createElement('div');
        row.className = 'a11y-row';

        var header = document.createElement('div');
        header.className = 'a11y-row-header';

        var lbl = document.createElement('span');
        lbl.className = 'a11y-row-label';
        lbl.textContent = label;

        var val = document.createElement('span');
        val.className = 'a11y-slider-value';
        val.textContent = settings[key] + (unit || '%');

        header.appendChild(lbl);
        header.appendChild(val);
        row.appendChild(header);

        var sliderRow = document.createElement('div');
        sliderRow.className = 'a11y-slider-row';

        var labels = document.createElement('div');
        labels.className = 'a11y-slider-labels';
        labels.innerHTML = '<span>' + min + (unit || '%') + '</span><span>' + max + (unit || '%') + '</span>';

        var range = document.createElement('input');
        range.type = 'range';
        range.className = 'a11y-range';
        range.min = min;
        range.max = max;
        range.step = step;
        range.value = settings[key];

        range.addEventListener('input', function () {
            settings[key] = parseInt(range.value);
            val.textContent = settings[key] + (unit || '%');
            saveSettings();
            applyAllSettings();
            updateIndicator();
            updateResetBtn();
        });

        sliderRow.appendChild(labels);
        sliderRow.appendChild(range);
        row.appendChild(sliderRow);

        return { row: row, range: range, val: val };
    }

    function makeSwatchRow(label, desc, colours, currentKey, onChange) {
        var row = document.createElement('div');
        row.className = 'a11y-row';

        var lbl = document.createElement('div');
        lbl.className = 'a11y-row-label';
        lbl.textContent = label;
        row.appendChild(lbl);

        if (desc) {
            var d = document.createElement('div');
            d.className = 'a11y-row-desc';
            d.textContent = desc;
            row.appendChild(d);
        }

        var swatches = document.createElement('div');
        swatches.className = 'a11y-swatches';

        colours.forEach(function (c) {
            var sw = document.createElement('button');
            sw.className = 'a11y-swatch' + (settings[currentKey] === c.value ? ' active' : '');
            sw.title = c.label;
            sw.setAttribute('data-colour', c.display);
            if (c.display === 'default' || c.display === 'overlay-none') {
                sw.style.background = 'linear-gradient(135deg, #fff 50%, #ccc 50%)';
            } else {
                sw.style.background = c.display;
                if (c.display === '#ffffff' || c.display === '#FFFDD0' || c.display === '#F0F8FF' || c.display === '#FFFFC8') {
                    sw.style.border = '2px solid #666';
                }
            }
            sw.addEventListener('click', function () {
                settings[currentKey] = c.value;
                swatches.querySelectorAll('.a11y-swatch').forEach(function (s) { s.classList.remove('active'); });
                sw.classList.add('active');
                saveSettings();
                onChange(c.value);
                updateIndicator();
                updateResetBtn();
            });
            swatches.appendChild(sw);
        });

        row.appendChild(swatches);
        return row;
    }

    var indicatorEl, resetEl;
    var toggleInputs = {};
    var sliderInputs = {};

    function updateIndicator() {
        if (!indicatorEl) return;
        if (isChanged()) {
            indicatorEl.classList.add('visible');
        } else {
            indicatorEl.classList.remove('visible');
        }
    }

    function updateResetBtn() {
        if (!resetEl) return;
        if (isChanged()) {
            resetEl.classList.add('visible');
        } else {
            resetEl.classList.remove('visible');
        }
    }

    function createPanel() {
        /* TTS banner */
        var banner = document.createElement('div');
        banner.id = 'a11y-tts-banner';
        document.body.appendChild(banner);

        /* Trigger button */
        var trigger = document.createElement('button');
        trigger.id = 'a11y-trigger';
        trigger.title = 'Display Settings';
        trigger.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="16" y1="4" x2="16" y2="8"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="12" y1="16" x2="12" y2="20"/></svg>';

        var dot = document.createElement('span');
        dot.id = 'a11y-trigger-dot';
        indicatorEl = dot;
        trigger.appendChild(dot);

        trigger.addEventListener('click', function () { openPanel(); });
        document.body.appendChild(trigger);

        /* Backdrop */
        var backdrop = document.createElement('div');
        backdrop.id = 'a11y-backdrop';
        backdrop.addEventListener('click', function () { closePanel(); });
        document.body.appendChild(backdrop);

        /* Panel */
        var panel = document.createElement('div');
        panel.id = 'a11y-panel';

        /* Header */
        var header = document.createElement('div');
        header.id = 'a11y-panel-header';
        header.innerHTML = '<h2>&#9881; Display Settings</h2>';
        var closeBtn = document.createElement('button');
        closeBtn.id = 'a11y-panel-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Close';
        closeBtn.addEventListener('click', function () { closePanel(); });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        /* Body */
        var body = document.createElement('div');
        body.id = 'a11y-panel-body';

        /* High contrast toggle */
        var hcRow = makeToggleRow('High Contrast', 'Increase colour contrast for better readability', 'highContrast');
        toggleInputs.highContrast = hcRow.input;
        body.appendChild(hcRow.row);

        /* Text colour swatches */
        body.appendChild(makeSwatchRow('Text Colour', 'Choose your preferred text colour', TEXT_COLOURS, 'customTextColour', function () {
            applyCustomTextColour();
        }));

        /* Background colour swatches */
        body.appendChild(makeSwatchRow('Background Colour', 'Choose your preferred background colour', BG_COLOURS, 'customBgColour', function () {
            applyCustomBgColour();
        }));

        /* Font size slider */
        var fsRow = makeSliderRow('Text Size', 'fontSize', 75, 200, 25, '%');
        sliderInputs.fontSize = fsRow;
        body.appendChild(fsRow.row);

        /* Line spacing slider */
        var lsRow = makeSliderRow('Line Spacing', 'lineSpacing', 100, 200, 25, '%');
        sliderInputs.lineSpacing = lsRow;
        body.appendChild(lsRow.row);

        /* Dyslexia font toggle */
        var dfRow = makeToggleRow('Dyslexia-Friendly Font', 'Use OpenDyslexic font for easier reading', 'dyslexiaFont');
        toggleInputs.dyslexiaFont = dfRow.input;
        body.appendChild(dfRow.row);

        /* TTS toggle */
        var ttsRow = makeToggleRow('Text-to-Speech', 'Click any text to hear it read aloud', 'ttsEnabled');
        toggleInputs.ttsEnabled = ttsRow.input;
        body.appendChild(ttsRow.row);

        /* Reduced motion toggle */
        var rmRow = makeToggleRow('Reduced Motion', 'Disable animations and transitions', 'reducedMotion');
        toggleInputs.reducedMotion = rmRow.input;
        body.appendChild(rmRow.row);

        /* Reading guide toggle */
        var rgRow = makeToggleRow('Reading Guide', 'Highlight bar follows your cursor to track lines', 'readingGuide');
        toggleInputs.readingGuide = rgRow.input;
        body.appendChild(rgRow.row);

        /* Colour overlay swatches */
        body.appendChild(makeSwatchRow('Colour Overlay', 'Apply a colour tint to reduce eye strain', OVERLAYS, 'colourOverlay', function () {
            applyColourOverlay();
        }));

        panel.appendChild(body);

        /* Reset button */
        resetEl = document.createElement('button');
        resetEl.id = 'a11y-reset';
        resetEl.innerHTML = '&#8635; Reset All Settings';
        resetEl.addEventListener('click', function () {
            settings = Object.assign({}, DEFAULT_SETTINGS);
            saveSettings();
            applyAllSettings();
            updateIndicator();
            updateResetBtn();
            syncPanelToSettings();
        });
        panel.appendChild(resetEl);

        /* Footer */
        var footer = document.createElement('div');
        footer.id = 'a11y-panel-footer';
        footer.textContent = 'Settings are saved automatically and will persist between visits.';
        panel.appendChild(footer);

        document.body.appendChild(panel);

        updateIndicator();
        updateResetBtn();
    }

    function syncPanelToSettings() {
        Object.keys(toggleInputs).forEach(function (k) {
            toggleInputs[k].checked = settings[k];
        });
        Object.keys(sliderInputs).forEach(function (k) {
            sliderInputs[k].range.value = settings[k];
            sliderInputs[k].val.textContent = settings[k] + '%';
        });
        document.querySelectorAll('.a11y-swatch').forEach(function (sw) {
            sw.classList.remove('active');
        });
    }

    function openPanel() {
        panelOpen = true;
        var panel = document.getElementById('a11y-panel');
        var backdrop = document.getElementById('a11y-backdrop');
        if (panel) panel.classList.add('open');
        if (backdrop) backdrop.classList.add('visible');
    }

    function closePanel() {
        panelOpen = false;
        var panel = document.getElementById('a11y-panel');
        var backdrop = document.getElementById('a11y-backdrop');
        if (panel) panel.classList.remove('open');
        if (backdrop) backdrop.classList.remove('visible');
    }

    /* ---- Init ---- */

    function init() {
        loadSettings();
        applyAllSettings();
        createPanel();
        initReadingGuide();
        initTTS();
        updateIndicator();
        updateResetBtn();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
