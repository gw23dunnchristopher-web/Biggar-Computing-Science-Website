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

    /* ── helpers ── */
    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

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
            '  <div class="cr-terminal">' +
            '    <pre class="cr-output">Click Run to execute the code\u2026</pre>' +
            '    <div class="cr-input-row" style="display:none;">' +
            '      <span class="cr-cursor">&#9608;</span>' +
            '      <input type="text" class="cr-terminal-input" autocomplete="off" spellcheck="false" placeholder="type and press Enter\u2026">' +
            '      <button class="cr-enter-btn">Enter &#x23CE;</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        var editor   = container.querySelector('.cr-editor');
        var output   = container.querySelector('.cr-output');
        var terminal = container.querySelector('.cr-terminal');
        var inputRow = container.querySelector('.cr-input-row');
        var termIn   = container.querySelector('.cr-terminal-input');
        var runBtn   = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        editor.value = original;

        var collectedInputs = [];  // all answers provided this session

        async function executeCode() {
            /* load pyodide if first time */
            if (!pyodideReady) {
                output.className = 'cr-output cr-loading';
                output.textContent = 'Loading Python\u2026 (first run may take a moment)';
            }

            var pyodide = await getPyodide();

            /* point global queue at this run's inputs */
            _inputQueue = collectedInputs.slice();
            _inputPos   = 0;

            /* redirect stdout */
            pyodide.runPython(
                'import sys, io\n' +
                '_cr_buf = io.StringIO()\n' +
                '_cr_old = sys.stdout\n' +
                'sys.stdout = _cr_buf'
            );

            var succeeded   = false;
            var needsInput  = false;
            var errorText   = '';

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

            /* restore stdout and grab output */
            var captured = '';
            try {
                captured = pyodide.runPython('sys.stdout = _cr_old\n_cr_buf.getvalue()');
            } catch (e) {
                try { pyodide.runPython('sys.stdout = _cr_old'); } catch (_) {}
            }

            /* render */
            output.textContent = captured;

            if (succeeded) {
                output.className = 'cr-output cr-success';
                if (!captured.trim()) output.textContent = '(no output)';
                inputRow.style.display = 'none';
                runBtn.disabled = false;
                runBtn.textContent = '\u25B6 Run';
            } else if (needsInput) {
                output.className = 'cr-output cr-running';
                inputRow.style.display = 'flex';
                termIn.value = '';
                termIn.focus();
                terminal.scrollTop = terminal.scrollHeight;
            } else {
                /* real error */
                output.textContent = (captured || '') + '\n\u274C ' + errorText;
                output.className = 'cr-output cr-error';
                inputRow.style.display = 'none';
                runBtn.disabled = false;
                runBtn.textContent = '\u25B6 Run';
            }
        }

        function submitInput() {
            var val = termIn.value;
            termIn.value = '';
            inputRow.style.display = 'none';
            collectedInputs.push(val);
            output.className = 'cr-output cr-running';
            executeCode();
        }

        termIn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); submitInput(); }
        });
        container.querySelector('.cr-enter-btn').addEventListener('click', submitInput);

        runBtn.addEventListener('click', async function () {
            collectedInputs = [];
            runBtn.disabled = true;
            runBtn.textContent = 'Loading\u2026';
            output.className = 'cr-output cr-loading';
            output.textContent = 'Loading Python\u2026 (first run may take a moment)';
            inputRow.style.display = 'none';
            executeCode();
        });

        resetBtn.addEventListener('click', function () {
            collectedInputs = [];
            editor.value = original;
            output.textContent = 'Click Run to execute the code\u2026';
            output.className = 'cr-output';
            inputRow.style.display = 'none';
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

        var editor  = container.querySelector('.cr-editor');
        var preview = container.querySelector('.cr-preview');
        var runBtn  = container.querySelector('.cr-run-btn');
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
