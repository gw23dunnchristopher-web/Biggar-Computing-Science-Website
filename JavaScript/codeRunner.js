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

    /* ── Python runner entry point ── */
    function initPyRunner(container) {
        var sandbox = (container.getAttribute('data-sandbox') || '').trim();

        if (sandbox) {
            /* fetch from saved sandbox */
            container.classList.add('code-runner');
            container.innerHTML = '<div style="padding:16px;color:#aaa;font-family:Arial,sans-serif;">Loading\u2026</div>';
            fetch('/api/sandboxes/' + sandbox)
                .then(function (r) {
                    if (!r.ok) throw new Error('Sandbox not found: ' + sandbox);
                    return r.json();
                })
                .then(function (data) {
                    container.innerHTML = '';
                    container.classList.remove('code-runner');
                    buildPyRunner(container, data.files || {});
                })
                .catch(function (err) {
                    container.innerHTML = '<div style="padding:16px;color:#c00;font-family:Arial,sans-serif;">\u26A0 ' + err.message + '</div>';
                });
            return;
        }

        /* textarea-based (single or multi file) */
        var storedAll = container.querySelectorAll('textarea.cr-code');
        if (!storedAll.length) return;
        var originals = {};
        storedAll.forEach(function (ta) {
            var name = (ta.dataset.filename || 'main.py').trim();
            originals[name] = ta.value.replace(/^\n/, '').replace(/\n$/, '');
        });
        buildPyRunner(container, originals);
    }

    function buildPyRunner(container, originals) {
        /* determine if multi-file layout needed */
        var fileNames  = Object.keys(originals);
        var multiFile  = fileNames.length > 1;
        /* pick the main python file to run */
        var mainFile   = originals['main.py'] !== undefined ? 'main.py'
                       : fileNames.find(function (f) { return f.endsWith('.py'); })
                       || fileNames[0];

        /* ── build HTML ── */
        container.classList.add('code-runner');

        var ftHtml = multiFile
            ? '<div class="cr-filetree">' +
              '  <div class="cr-filetree-hdr">Files</div>' +
              '  <ul class="cr-file-list"></ul>' +
              '</div>'
            : '';

        var workspaceWrap = multiFile
            ? '<div class="cr-workspace">' + ftHtml + '<textarea class="cr-editor" spellcheck="false"></textarea></div>'
            : '<textarea class="cr-editor" spellcheck="false"></textarea>';

        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F40D; Python</span>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-run-btn">&#9654; Run</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            workspaceWrap +
            '<div class="cr-output-area">' +
            '  <div class="cr-output-label">Output</div>' +
            '  <textarea class="cr-terminal" readonly spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">Click Run to execute the code\u2026</textarea>' +
            '</div>';

        var editor   = container.querySelector('.cr-editor');
        var terminal = container.querySelector('.cr-terminal');
        var runBtn   = container.querySelector('.cr-run-btn');
        var resetBtn = container.querySelector('.cr-reset-btn');

        /* ── virtual filesystem ── */
        var vfs        = Object.assign({}, originals);
        var activeFile = mainFile;

        editor.value = vfs[activeFile] || '';

        /* ── file tree (multi-file only) ── */
        function pyFileIcon(name) {
            if (name.endsWith('.py'))  return '&#x1F40D;';
            if (name.endsWith('.csv')) return '&#x1F4CA;';
            if (name.endsWith('.txt')) return '&#x1F4DD;';
            if (name.endsWith('.json')) return '&#x1F4CB;';
            return '&#x1F4C4;';
        }

        function renderPyFileTree() {
            if (!multiFile) return;
            var ftList = container.querySelector('.cr-file-list');
            ftList.innerHTML = Object.keys(vfs).map(function (name) {
                var active = name === activeFile ? ' cr-file-active' : '';
                var badge  = name === mainFile ? ' <span style="font-size:0.65rem;color:#888;margin-left:4px;">(runs)</span>' : '';
                return '<li class="cr-file-item' + active + '" data-name="' + name + '">' +
                    '<span class="cr-file-icon">' + pyFileIcon(name) + '</span>' +
                    '<span class="cr-file-name">' + name + badge + '</span>' +
                    '</li>';
            }).join('');

            ftList.querySelectorAll('.cr-file-item').forEach(function (li) {
                li.addEventListener('click', function () {
                    vfs[activeFile] = editor.value;
                    activeFile = li.dataset.name;
                    editor.value = vfs[activeFile] || '';
                    renderPyFileTree();
                });
            });
        }

        if (multiFile) renderPyFileTree();

        /* ── input state ── */
        var collectedInputs = [];
        var awaitingInput   = false;
        var baselineLen     = 0;

        terminal.addEventListener('input', function () {
            if (!awaitingInput) return;
            if (terminal.value.length < baselineLen) {
                terminal.value = terminal.value.substring(0, baselineLen);
            }
        });

        terminal.addEventListener('keydown', function (e) {
            if (!awaitingInput) { e.preventDefault(); return; }

            if (e.key === 'ArrowLeft' || e.key === 'Home' ||
                e.key === 'ArrowUp'   || e.key === 'PageUp') {
                var pos = terminal.selectionStart;
                if (pos <= baselineLen) { e.preventDefault(); }
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                var typed = terminal.value.substring(baselineLen);
                terminal.value += '\n';
                awaitingInput = false;
                terminal.readOnly = true;
                terminal.classList.remove('cr-waiting');
                collectedInputs.push(typed);
                executeCode();
            }
        });

        terminal.addEventListener('click', function () {
            if (!awaitingInput) return;
            if (terminal.selectionStart < baselineLen) {
                terminal.selectionStart = baselineLen;
                terminal.selectionEnd   = baselineLen;
            }
        });

        /* ── execute ── */
        async function executeCode() {
            if (!pyodideReady) {
                terminal.readOnly = true;
                terminal.value = 'Loading Python\u2026 (first run may take a moment)';
                terminal.className = 'cr-terminal cr-loading';
            }

            /* save current editor content */
            vfs[activeFile] = editor.value;

            var pyodide = await getPyodide();
            _inputQueue = collectedInputs.slice();
            _inputPos   = 0;

            /* write data files to Pyodide's virtual filesystem */
            if (multiFile) {
                Object.keys(vfs).forEach(function (name) {
                    if (!name.endsWith('.py')) {
                        try { pyodide.FS.writeFile(name, vfs[name], { encoding: 'utf8' }); } catch (_) {}
                    }
                });
            }

            var codeToRun = vfs[mainFile] || '';

            try { await pyodide.loadPackagesFromImports(codeToRun); } catch (_) {}

            pyodide.runPython(
                'import sys, io\n_cr_buf = io.StringIO()\n_cr_old = sys.stdout\nsys.stdout = _cr_buf'
            );

            var succeeded = false, needsInput = false, errorText = '';
            try {
                await pyodide.runPythonAsync(codeToRun);
                succeeded = true;
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                if (msg.indexOf('__INPUT_REQUIRED__') !== -1) { needsInput = true; }
                else { errorText = msg; }
            }

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
                terminal.value = captured;
                terminal.className = 'cr-terminal cr-waiting';
                baselineLen = terminal.value.length;
                awaitingInput = true;
                terminal.readOnly = false;
                terminal.focus();
                terminal.selectionStart = baselineLen;
                terminal.selectionEnd   = baselineLen;
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
            vfs = Object.assign({}, originals);
            activeFile = mainFile;
            editor.value = vfs[activeFile] || '';
            if (multiFile) renderPyFileTree();
            terminal.readOnly = true;
            terminal.value = 'Click Run to execute the code\u2026';
            terminal.className = 'cr-terminal';
            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
        });
    }

    /* ── build an HTML runner (multi-file with virtual filesystem) ── */
    function initHtmlRunner(container) {
        var sandbox   = (container.getAttribute('data-sandbox') || '').trim();
        var dataFiles = (container.getAttribute('data-files')   || '').trim();

        function showLoading() {
            container.classList.add('code-runner');
            container.innerHTML = '<div style="padding:16px;color:#666;font-family:Arial,sans-serif;">Loading\u2026</div>';
        }
        function showError(msg) {
            container.innerHTML = '<div style="padding:16px;color:#c00;font-family:Arial,sans-serif;">&#x26A0; ' + msg + '</div>';
        }

        if (sandbox) {
            /* ── load from saved sandbox via API ── */
            showLoading();
            fetch('/api/sandboxes/' + sandbox)
                .then(function (r) {
                    if (!r.ok) throw new Error('Sandbox not found: ' + sandbox);
                    return r.json();
                })
                .then(function (data) {
                    container.innerHTML = '';
                    container.classList.remove('code-runner');
                    buildHtmlRunner(container, data.files || {});
                })
                .catch(function (err) { showError(err.message); });
            return;
        }

        if (dataFiles) {
            /* ── fetch individual files by URL ── */
            var urls = dataFiles.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            showLoading();
            Promise.all(urls.map(function (url) {
                return fetch(url).then(function (r) {
                    if (!r.ok) throw new Error('Could not load ' + url + ' (' + r.status + ')');
                    return r.text().then(function (text) { return { name: url.split('/').pop(), content: text }; });
                });
            })).then(function (loaded) {
                var originals = {};
                loaded.forEach(function (f) { originals[f.name] = f.content; });
                container.innerHTML = '';
                container.classList.remove('code-runner');
                buildHtmlRunner(container, originals);
            }).catch(function (err) { showError(err.message); });
            return;
        }

        /* ── textarea-based init (inline starter files) ── */
        var storedAll = container.querySelectorAll('textarea.cr-code');
        if (!storedAll.length) return;
        var originals = {};
        storedAll.forEach(function (ta) {
            var name = (ta.dataset.filename || 'index.html').trim();
            originals[name] = ta.value.replace(/^\n/, '').replace(/\n$/, '');
        });
        buildHtmlRunner(container, originals);
    }

    function buildHtmlRunner(container, originals) {
        container.classList.add('code-runner');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F310; HTML</span>' +
            '  <div class="cr-btns">' +
            '    <label class="cr-upload-btn" title="Upload images to use in your HTML">' +
            '      &#x1F4F7; Image' +
            '      <input type="file" class="cr-file-input" accept="image/*" multiple style="display:none">' +
            '    </label>' +
            '    <button class="cr-run-btn">&#9654; Preview</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            '<div class="cr-img-strip" style="display:none"></div>' +
            '<div class="cr-workspace">' +
            '  <div class="cr-filetree">' +
            '    <div class="cr-filetree-hdr">Files</div>' +
            '    <ul class="cr-file-list"></ul>' +
            '    <button class="cr-new-file-btn">+ New file</button>' +
            '  </div>' +
            '  <textarea class="cr-editor" spellcheck="false"></textarea>' +
            '  <iframe class="cr-preview" sandbox="allow-scripts allow-same-origin"></iframe>' +
            '</div>';

        var editor      = container.querySelector('.cr-editor');
        var preview     = container.querySelector('.cr-preview');
        var runBtn      = container.querySelector('.cr-run-btn');
        var resetBtn    = container.querySelector('.cr-reset-btn');
        var fileInput   = container.querySelector('.cr-file-input');
        var imgStrip    = container.querySelector('.cr-img-strip');
        var fileList    = container.querySelector('.cr-file-list');
        var newFileBtn  = container.querySelector('.cr-new-file-btn');

        /* virtual filesystem seeded from all starter textareas */
        var vfs = Object.assign({}, originals);
        var activeFile = originals['index.html'] !== undefined
            ? 'index.html'
            : Object.keys(originals)[0];
        var uploadedImages = {};

        /* ── file tree ── */
        function fileIcon(name) {
            if (name.endsWith('.css')) return '&#x1F3A8;';
            if (name.endsWith('.js'))  return '&#x2699;&#xFE0F;';
            return '&#x1F4C4;';
        }

        function renderFileTree() {
            var names = Object.keys(vfs);
            fileList.innerHTML = names.map(function (name) {
                var active = name === activeFile ? ' cr-file-active' : '';
                var del = names.length > 1
                    ? '<button class="cr-file-del" data-name="' + name + '" title="Delete file">\u00D7</button>'
                    : '';
                return '<li class="cr-file-item' + active + '" data-name="' + name + '">' +
                    '<span class="cr-file-icon">' + fileIcon(name) + '</span>' +
                    '<span class="cr-file-name">' + name + '</span>' +
                    del + '</li>';
            }).join('');

            fileList.querySelectorAll('.cr-file-item').forEach(function (li) {
                li.addEventListener('click', function (e) {
                    if (e.target.classList.contains('cr-file-del')) return;
                    switchTo(li.dataset.name);
                });
            });
            fileList.querySelectorAll('.cr-file-del').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var name = btn.dataset.name;
                    delete vfs[name];
                    if (activeFile === name) {
                        activeFile = Object.keys(vfs)[0];
                        editor.value = vfs[activeFile];
                    }
                    renderFileTree();
                    updatePreview();
                });
            });
        }

        function switchTo(name) {
            vfs[activeFile] = editor.value;   /* save current */
            activeFile = name;
            editor.value = vfs[name] || '';
            renderFileTree();
        }

        newFileBtn.addEventListener('click', function () {
            var name = (prompt('File name (e.g. style.css or page2.html):') || '').trim();
            if (!name) return;
            if (!name.includes('.')) name += '.html';
            if (vfs[name]) { switchTo(name); return; }
            vfs[name] = name.endsWith('.css') ? '/* ' + name + ' */\n' :
                        name.endsWith('.js')  ? '// ' + name + '\n' :
                        '<!DOCTYPE html>\n<html>\n<head>\n  <title>' + name + '</title>\n</head>\n<body>\n\n</body>\n</html>';
            switchTo(name);
        });

        /* ── preview rendering ── */
        function resolveAndRender(html) {
            /* inline CSS: <link rel="stylesheet" href="style.css"> */
            html = html.replace(
                /<link\b([^>]*)href=["']([^"']+)["']([^>]*)>/gi,
                function (match, pre, href, post) {
                    if (!(/rel=["']stylesheet["']/i.test(pre + post))) return match;
                    var fname = href.split('/').pop();
                    return vfs[fname] !== undefined
                        ? '<style>' + vfs[fname] + '</style>'
                        : match;
                }
            );

            /* inline JS: <script src="script.js"></script> */
            html = html.replace(
                /<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
                function (match, pre, src) {
                    var fname = src.split('/').pop();
                    return vfs[fname] !== undefined
                        ? '<script>' + vfs[fname] + '<\/script>'
                        : match;
                }
            );

            /* substitute uploaded images */
            Object.keys(uploadedImages).forEach(function (name) {
                var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re = new RegExp('(src=["\'])(?:[^"\']*[\\/])?' + esc + '(["\'])', 'gi');
                html = html.replace(re, '$1' + uploadedImages[name] + '$2');
            });

            /* inject page-navigation interceptor so <a href="page2.html"> works
               and external https:// links open in a new tab via the parent     */
            var interceptor = '<script>(function(){' +
                'document.addEventListener("click",function(e){' +
                '  var a=e.target.closest("a[href]");if(!a)return;' +
                '  var h=a.getAttribute("href");if(!h)return;' +
                '  if(/^https?:/i.test(h)){' +
                '    e.preventDefault();' +
                '    window.parent.postMessage({crExternal:h},"*");' +
                '  } else if(!/^(mailto:|javascript:|#)/i.test(h)){' +
                '    e.preventDefault();' +
                '    window.parent.postMessage({crNav:h},"*");' +
                '  }' +
                '});' +
                '}());<\/script>';
            html = /<\/body>/i.test(html)
                ? html.replace(/<\/body>/i, interceptor + '</body>')
                : html + interceptor;

            preview.srcdoc = html;
        }

        function updatePreview() {
            vfs[activeFile] = editor.value;   /* save current before rendering */
            /* find the entry-point HTML file */
            var entry = vfs['index.html'] !== undefined ? 'index.html'
                : Object.keys(vfs).find(function (f) { return f.endsWith('.html'); })
                || Object.keys(vfs)[0];
            resolveAndRender(vfs[entry] || '');
        }

        /* handle in-preview navigation (links between pages) and external links */
        window.addEventListener('message', function (e) {
            if (!e.data) return;
            if (e.source !== preview.contentWindow) return;  /* only our iframe */
            if (e.data.crExternal) {
                window.open(e.data.crExternal, '_blank', 'noopener,noreferrer');
                return;
            }
            if (!e.data.crNav) return;
            var fname = e.data.crNav.split('?')[0].split('#')[0].split('/').pop();
            if (vfs[fname] !== undefined) {
                vfs[activeFile] = editor.value;
                activeFile = fname;
                editor.value = vfs[fname];
                renderFileTree();
                resolveAndRender(vfs[fname]);
            }
        });

        /* ── image upload ── */
        function renderStrip() {
            var names = Object.keys(uploadedImages);
            if (names.length === 0) {
                imgStrip.style.display = 'none';
                imgStrip.innerHTML = '';
                return;
            }
            imgStrip.style.display = 'flex';
            imgStrip.innerHTML = '<span class="cr-strip-label">Images:</span>' +
                names.map(function (name) {
                    return '<div class="cr-img-chip">' +
                        '<img src="' + uploadedImages[name] + '" class="cr-img-thumb" alt="">' +
                        '<span class="cr-img-name">' + name + '</span>' +
                        '<button class="cr-img-remove" data-name="' + name + '" title="Remove">\u00D7</button>' +
                        '</div>';
                }).join('');
            imgStrip.querySelectorAll('.cr-img-remove').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    delete uploadedImages[btn.dataset.name];
                    renderStrip();
                    updatePreview();
                });
            });
        }

        fileInput.addEventListener('change', function () {
            var pending = fileInput.files.length;
            if (!pending) return;
            Array.from(fileInput.files).forEach(function (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    uploadedImages[file.name] = e.target.result;
                    if (--pending === 0) { renderStrip(); updatePreview(); }
                };
                reader.readAsDataURL(file);
            });
            fileInput.value = '';
        });

        /* ── init ── */
        renderFileTree();
        editor.value = vfs[activeFile];
        updatePreview();

        runBtn.addEventListener('click', updatePreview);
        resetBtn.addEventListener('click', function () {
            vfs = Object.assign({}, originals);
            activeFile = originals['index.html'] !== undefined
                ? 'index.html'
                : Object.keys(originals)[0];
            editor.value = vfs[activeFile];
            uploadedImages = {};
            renderStrip();
            renderFileTree();
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
