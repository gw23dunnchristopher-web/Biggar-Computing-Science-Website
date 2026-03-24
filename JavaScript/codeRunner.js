(function () {
    'use strict';

    /* ── Pyodide singleton ── */
    var pyodideReady = false;
    var pyodideLoading = false;
    var pyodideInstance = null;
    var pyodideCallbacks = [];

    function getPyodide() {
        return new Promise(function (resolve) {
            if (pyodideReady) { resolve(pyodideInstance); return; }
            pyodideCallbacks.push(resolve);
            if (pyodideLoading) return;
            pyodideLoading = true;

            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
            script.onload = async function () {
                pyodideInstance = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/'
                });
                pyodideInstance.runPython([
                    'import sys, io, builtins',
                    '',
                    'def _custom_input(prompt=""):',
                    '    import js',
                    '    if prompt:',
                    '        print(str(prompt), end="", flush=True)',
                    '    val = js._pyGetInput()',
                    '    print(val)',
                    '    return val',
                    '',
                    'builtins.input = _custom_input'
                ].join('\n'));
                pyodideReady = true;
                pyodideCallbacks.forEach(function (cb) { cb(pyodideInstance); });
            };
            document.head.appendChild(script);
        });
    }

    /* ── Global input queue (one runner active at a time) ── */
    var _inputQueue = [];
    var _inputPos   = 0;

    window._pyGetInput = function () {
        if (_inputPos < _inputQueue.length) {
            return _inputQueue[_inputPos++];
        }
        throw new Error('__INPUT_REQUIRED__');
    };

    /* ── build a Python runner ── */
    function initPyRunner(container) {
        var stored = container.querySelector('textarea.cr-code');
        if (!stored) return;
        var original = stored.value.replace(/^\n/, '').replace(/\n$/, '');

        container.classList.add('code-runner');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F40D; Python</span>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-run-btn">&#9654; Run</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            '<textarea class="cr-editor" spellcheck="false"></textarea>' +
            '<div class="cr-output-area">' +
            '  <div class="cr-output-label">Output</div>' +
            '  <textarea class="cr-terminal" readonly spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">Click Run to execute the code\u2026</textarea>' +
            '</div>';

        var editor   = container.querySelector('.cr-editor');
        var terminal = container.querySelector('.cr-terminal');
        var runBtn   = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        editor.value = original;

        /* state */
        var collectedInputs = [];
        var awaitingInput   = false;
        var baselineLen     = 0;

        /* ── protect baseline content when awaiting input ── */
        terminal.addEventListener('input', function () {
            if (!awaitingInput) return;
            if (terminal.value.length < baselineLen) {
                terminal.value = terminal.value.substring(0, baselineLen);
            }
        });

        terminal.addEventListener('keydown', function (e) {
            if (!awaitingInput) { e.preventDefault(); return; }

            /* prevent moving cursor before the baseline */
            if (e.key === 'ArrowLeft' || e.key === 'Home' ||
                e.key === 'ArrowUp'   || e.key === 'PageUp') {
                var pos = terminal.selectionStart;
                if (pos <= baselineLen) { e.preventDefault(); }
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                var typed = terminal.value.substring(baselineLen);
                /* append newline to terminal so output continues on next line */
                terminal.value += '\n';
                /* lock terminal again */
                awaitingInput = false;
                terminal.readOnly = true;
                terminal.classList.remove('cr-waiting');
                /* queue input and re-run */
                collectedInputs.push(typed);
                executeCode();
            }
        });

        /* keep cursor at/after baseline when clicking */
        terminal.addEventListener('click', function () {
            if (!awaitingInput) return;
            if (terminal.selectionStart < baselineLen) {
                terminal.selectionStart = baselineLen;
                terminal.selectionEnd   = baselineLen;
            }
        });

        async function executeCode() {
            if (!pyodideReady) {
                terminal.readOnly = true;
                terminal.value = 'Loading Python\u2026 (first run may take a moment)';
                terminal.className = 'cr-terminal cr-loading';
            }

            var pyodide = await getPyodide();

            _inputQueue = collectedInputs.slice();
            _inputPos   = 0;

            /* redirect stdout */
            pyodide.runPython(
                'import sys, io\n' +
                '_cr_buf = io.StringIO()\n' +
                '_cr_old = sys.stdout\n' +
                'sys.stdout = _cr_buf'
            );

            var succeeded  = false;
            var needsInput = false;
            var errorText  = '';

            try {
                await pyodide.runPythonAsync(editor.value);
                succeeded = true;
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                if (msg.indexOf('__INPUT_REQUIRED__') !== -1) {
                    needsInput = true;
                } else {
                    errorText = msg;
                }
            }

            /* restore stdout and grab captured text */
            var captured = '';
            try {
                captured = pyodide.runPython('sys.stdout = _cr_old\n_cr_buf.getvalue()');
            } catch (e) {
                try { pyodide.runPython('sys.stdout = _cr_old'); } catch (_) {}
            }

            if (succeeded) {
                terminal.readOnly = true;
                terminal.value = captured || '(no output)';
                terminal.className = 'cr-terminal cr-success';
                runBtn.disabled = false;
                runBtn.textContent = '\u25B6 Run';
            } else if (needsInput) {
                /* show output so far, then open terminal for typing */
                terminal.value = captured;
                terminal.className = 'cr-terminal cr-waiting';
                baselineLen = terminal.value.length;
                awaitingInput = true;
                terminal.readOnly = false;
                terminal.focus();
                terminal.selectionStart = baselineLen;
                terminal.selectionEnd   = baselineLen;
                /* scroll to bottom */
                terminal.scrollTop = terminal.scrollHeight;
            } else {
                terminal.readOnly = true;
                var prefix = captured ? captured + '\n' : '';
                terminal.value = prefix + '\u274C ' + errorText;
                terminal.className = 'cr-terminal cr-error';
                runBtn.disabled = false;
                runBtn.textContent = '\u25B6 Run';
            }
        }

        runBtn.addEventListener('click', function () {
            collectedInputs = [];
            awaitingInput   = false;
            runBtn.disabled = true;
            runBtn.textContent = 'Loading\u2026';
            terminal.readOnly = true;
            terminal.value = 'Loading Python\u2026 (first run may take a moment)';
            terminal.className = 'cr-terminal cr-loading';
            executeCode();
        });

        resetBtn.addEventListener('click', function () {
            collectedInputs = [];
            awaitingInput   = false;
            editor.value    = original;
            terminal.readOnly = true;
            terminal.value  = 'Click Run to execute the code\u2026';
            terminal.className = 'cr-terminal';
            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
        });
    }

    /* ── build an HTML runner ── */
    function initHtmlRunner(container) {
        var stored = container.querySelector('textarea.cr-code');
        if (!stored) return;
        var original = stored.value.replace(/^\n/, '').replace(/\n$/, '');

        container.classList.add('code-runner');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F310; HTML</span>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-run-btn">&#9654; Preview</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            '<div class="cr-split">' +
            '  <textarea class="cr-editor" spellcheck="false"></textarea>' +
            '  <iframe class="cr-preview" sandbox="allow-scripts allow-same-origin"></iframe>' +
            '</div>';

        var editor   = container.querySelector('.cr-editor');
        var preview  = container.querySelector('.cr-preview');
        var runBtn   = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        editor.value = original;

        function updatePreview() { preview.srcdoc = editor.value; }
        updatePreview();

        runBtn.addEventListener('click', updatePreview);
        resetBtn.addEventListener('click', function () {
            editor.value = original;
            updatePreview();
        });
    }

    /* ── initialise all runners on the page ── */
    function init() {
        document.querySelectorAll('.py-runner').forEach(initPyRunner);
        document.querySelectorAll('.html-runner').forEach(initHtmlRunner);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
