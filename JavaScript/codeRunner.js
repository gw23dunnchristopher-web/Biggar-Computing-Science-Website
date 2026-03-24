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
                    'def _input(prompt=""):',
                    '    from js import prompt as jp',
                    '    r = jp(str(prompt))',
                    '    return "" if r is None else r',
                    'builtins.input = _input'
                ].join('\n'));
                pyodideReady = true;
                pyodideCallbacks.forEach(function (cb) { cb(pyodideInstance); });
            };
            document.head.appendChild(script);
        });
    }

    /* ── run Python and return {ok, text} ── */
    async function runPython(pyodide, code) {
        try {
            pyodide.runPython(
                'import sys, io\n' +
                '_buf = io.StringIO()\n' +
                '_old = sys.stdout\n' +
                'sys.stdout = _buf'
            );
        } catch (e) { /* ignore */ }

        try {
            await pyodide.runPythonAsync(code);
            var out = pyodide.runPython(
                'sys.stdout = _old\n' +
                '_buf.getvalue()'
            );
            return { ok: true, text: out || '(no output)' };
        } catch (err) {
            try { pyodide.runPython('sys.stdout = _old'); } catch (e) { /* ignore */ }
            return { ok: false, text: err.message };
        }
    }

    /* ── build a Python runner ── */
    function initPyRunner(container) {
        var stored = container.querySelector('textarea.cr-code');
        if (!stored) return;
        var original = stored.value.replace(/^\n/, '').replace(/\n\s*$/, '');

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
            '  <pre class="cr-output">Click Run to execute the code...</pre>' +
            '</div>';

        var editor = container.querySelector('.cr-editor');
        var output = container.querySelector('.cr-output');
        var runBtn = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        editor.value = original;

        runBtn.addEventListener('click', async function () {
            runBtn.disabled = true;
            runBtn.textContent = 'Loading\u2026';
            output.className = 'cr-output cr-loading';
            output.textContent = 'Loading Python\u2026 (first run may take a moment)';

            var pyodide = await getPyodide();
            runBtn.textContent = 'Running\u2026';

            var result = await runPython(pyodide, editor.value);
            output.textContent = result.text;
            output.className = 'cr-output ' + (result.ok ? 'cr-success' : 'cr-error');

            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
        });

        resetBtn.addEventListener('click', function () {
            editor.value = original;
            output.textContent = 'Click Run to execute the code\u2026';
            output.className = 'cr-output';
            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
        });
    }

    /* ── build an HTML runner ── */
    function initHtmlRunner(container) {
        var stored = container.querySelector('textarea.cr-code');
        if (!stored) return;
        var original = stored.value.replace(/^\n/, '').replace(/\n\s*$/, '');

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

        var editor = container.querySelector('.cr-editor');
        var preview = container.querySelector('.cr-preview');
        var runBtn = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        editor.value = original;

        function updatePreview() {
            preview.srcdoc = editor.value;
        }

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
