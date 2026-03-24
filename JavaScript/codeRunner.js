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

    /* ── shared: folder-tree helpers ── */

    /* Convert a flat list of paths into a nested tree.
       openSet is a plain object used as a Set: { "data": true, "css": true }
       Each node: { isDir, name, path, children, _byName, _open }  (dirs)
                  { isDir:false, name, path }                        (files) */
    function buildFolderTree(paths, openSet) {
        var root = { children: [], _byName: {} };
        paths.forEach(function (fullPath) {
            var parts = fullPath.split('/');
            var node  = root;
            var cumPath = '';
            parts.forEach(function (part, i) {
                if (i === parts.length - 1) {
                    node.children.push({ isDir: false, name: part, path: fullPath });
                } else {
                    cumPath = cumPath ? cumPath + '/' + part : part;
                    if (!node._byName[part]) {
                        var dir = {
                            isDir: true, name: part, path: cumPath,
                            children: [], _byName: {},
                            _open: !!(openSet && openSet[cumPath])
                        };
                        node.children.push(dir);
                        node._byName[part] = dir;
                    }
                    node = node._byName[part];
                    cumPath = node.path; /* keep in sync for deeper nesting */
                }
            });
        });
        return root;
    }

    /* Render tree nodes into HTML <li> strings (depth controls indentation).
       opts.canDel may be a boolean OR a function(filePath) → boolean.
       opts.isReadonly may be a function(filePath) → boolean (adds cr-readonly class). */
    function renderTreeItems(nodes, depth, opts) {
        var pad = depth * 14;
        return nodes.map(function (node) {
            if (node.isDir) {
                var arrow = node._open ? '&#9660;' : '&#9654;';
                var kids  = node._open ? renderTreeItems(node.children, depth + 1, opts) : '';
                return '<li class="cr-folder-item" data-folder-path="' + node.path + '" style="padding-left:' + pad + 'px">' +
                    '<span class="cr-folder-arrow">' + arrow + '</span>' +
                    '<span class="cr-file-icon">&#x1F4C1;</span>' +
                    '<span class="cr-file-name">' + node.name + '</span>' +
                    '</li>' + kids;
            } else {
                var canDel   = typeof opts.canDel === 'function' ? opts.canDel(node.path) : opts.canDel;
                var readOnly = typeof opts.isReadonly === 'function' ? opts.isReadonly(node.path) : false;
                var active   = node.path === opts.activeFile ? ' cr-file-active' : '';
                var roClass  = readOnly ? ' cr-readonly' : '';
                var badge    = opts.mainFile && node.path === opts.mainFile
                    ? '<span style="font-size:0.65rem;color:#888;margin-left:4px;">(runs)</span>' : '';
                var del      = canDel
                    ? '<button class="cr-file-del" data-name="' + node.path + '" title="Delete file">\u00D7</button>'
                    : '';
                return '<li class="cr-file-item' + active + roClass + '" data-name="' + node.path + '" style="padding-left:' + (pad + 4) + 'px">' +
                    '<span class="cr-file-icon">' + opts.iconFn(node.path) + '</span>' +
                    '<span class="cr-file-name">' + node.name + badge + '</span>' +
                    del + '</li>';
            }
        }).join('');
    }

    /* Build an openFolders set with every folder path expanded by default */
    function defaultOpenFolders(paths) {
        var set = {};
        paths.forEach(function (p) {
            var parts = p.split('/');
            var cum = '';
            for (var i = 0; i < parts.length - 1; i++) {
                cum = cum ? cum + '/' + parts[i] : parts[i];
                set[cum] = true;
            }
        });
        return set;
    }

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

        var editorBlock = '<div class="cr-editor-wrap">' +
            '<div class="cr-line-numbers" aria-hidden="true"></div>' +
            '<textarea class="cr-editor" spellcheck="false"></textarea>' +
            '</div>';

        var workspaceWrap = multiFile
            ? '<div class="cr-workspace">' + ftHtml + editorBlock + '</div>'
            : editorBlock;

        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F40D; Python</span>' +
            '  <div class="cr-btns">' +
            '    <label class="cr-toolbar-upload" title="Upload a CSV or TXT data file to use in your code">' +
            '      &#x1F4C2; Upload' +
            '      <input type="file" class="cr-py-file-input" accept=".csv,.txt,.json" multiple style="display:none">' +
            '    </label>' +
            '    <button class="cr-run-btn">&#9654; Run</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            '<div class="cr-data-strip" style="display:none"></div>' +
            workspaceWrap +
            '<div class="cr-output-area">' +
            '  <div class="cr-output-label">Output</div>' +
            '  <textarea class="cr-terminal" readonly spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">Click Run to execute the code\u2026</textarea>' +
            '</div>';

        var editor      = container.querySelector('.cr-editor');
        var lineNums    = container.querySelector('.cr-line-numbers');
        var terminal    = container.querySelector('.cr-terminal');
        var runBtn      = container.querySelector('.cr-run-btn');
        var resetBtn    = container.querySelector('.cr-reset-btn');
        var dataStrip   = container.querySelector('.cr-data-strip');
        var pyFileInput = container.querySelector('.cr-py-file-input');

        /* ── line number sync ── */
        function updateLineNumbers() {
            var count = editor.value.split('\n').length;
            var text  = '';
            for (var i = 1; i <= count; i++) text += i + '\n';
            lineNums.textContent = text;
            lineNums.scrollTop   = editor.scrollTop;
        }
        editor.addEventListener('input',  updateLineNumbers);
        editor.addEventListener('keydown', function () { setTimeout(updateLineNumbers, 0); });
        editor.addEventListener('scroll',  function () { lineNums.scrollTop = editor.scrollTop; });

        /* ── virtual filesystem ── */
        var vfs        = Object.assign({}, originals);
        var activeFile = mainFile;
        var openFolders = defaultOpenFolders(Object.keys(originals));  /* all folders open by default */

        editor.value = vfs[activeFile] || '';
        updateLineNumbers();

        /* ── data-file strip: shown for single-file runners when CSV/TXT are uploaded ── */
        function renderDataStrip() {
            var uploads = Object.keys(vfs).filter(function (k) { return !originals[k]; });
            if (multiFile || !uploads.length) { dataStrip.style.display = 'none'; return; }
            dataStrip.style.display = 'flex';
            dataStrip.innerHTML = '<span class="cr-data-strip-label">Data files:</span>' +
                uploads.map(function (name) {
                    return '<div class="cr-data-chip">' +
                        '<span>&#x1F4C2; ' + name + '</span>' +
                        '<button class="cr-data-chip-remove" data-name="' + name + '" title="Remove">\u00D7</button>' +
                        '</div>';
                }).join('');
            dataStrip.querySelectorAll('.cr-data-chip-remove').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    delete vfs[btn.dataset.name];
                    renderDataStrip();
                });
            });
        }

        /* ── Python file upload handler ── */
        function handlePyUpload(files) {
            var accepted = Array.from(files).filter(function (f) {
                return /\.(csv|txt|json)$/i.test(f.name);
            });
            var pending = accepted.length;
            if (!pending) return;
            accepted.forEach(function (file) {
                var reader = new FileReader();
                reader.onload = function (ev) {
                    vfs[file.name] = ev.target.result;
                    openFolders = Object.assign(openFolders, defaultOpenFolders([file.name]));
                    if (multiFile) renderPyFileTree();
                    else renderDataStrip();
                };
                reader.readAsText(file);
            });
        }

        pyFileInput.addEventListener('change', function () {
            handlePyUpload(pyFileInput.files);
            pyFileInput.value = '';
        });

        /* drag-and-drop CSV/TXT onto the whole Python runner */
        container.addEventListener('dragover', function (e) {
            var hasFile = e.dataTransfer && Array.from(e.dataTransfer.items || []).some(function (i) { return i.kind === 'file'; });
            if (!hasFile) return;
            e.preventDefault();
            container.style.outline = '2px dashed #89b4fa';
            container.style.outlineOffset = '-3px';
        });
        container.addEventListener('dragleave', function (e) {
            if (!container.contains(e.relatedTarget)) {
                container.style.outline = '';
                container.style.outlineOffset = '';
            }
        });
        container.addEventListener('drop', function (e) {
            e.preventDefault();
            container.style.outline = '';
            container.style.outlineOffset = '';
            handlePyUpload(e.dataTransfer.files);
        });

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
            var tree   = buildFolderTree(Object.keys(vfs), openFolders);
            ftList.innerHTML = renderTreeItems(tree.children, 0, {
                activeFile: activeFile,
                mainFile:   mainFile,
                canDel:     function (name) { return !originals[name]; },
                iconFn:     pyFileIcon
            });
            ftList.querySelectorAll('.cr-folder-item').forEach(function (li) {
                li.addEventListener('click', function () {
                    var fp = li.dataset.folderPath;
                    openFolders[fp] = !openFolders[fp];
                    renderPyFileTree();
                });
            });
            ftList.querySelectorAll('.cr-file-item').forEach(function (li) {
                li.addEventListener('click', function (e) {
                    if (e.target.classList.contains('cr-file-del')) return;
                    vfs[activeFile] = editor.value;
                    activeFile = li.dataset.name;
                    editor.value = vfs[activeFile] || '';
                    updateLineNumbers();
                    renderPyFileTree();
                });
            });
            ftList.querySelectorAll('.cr-file-del').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var name = btn.dataset.name;
                    delete vfs[name];
                    if (activeFile === name) {
                        activeFile = mainFile;
                        editor.value = vfs[mainFile] || '';
                        updateLineNumbers();
                    }
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

            /* write data files to Pyodide's virtual filesystem,
               creating any parent directories (e.g. data/scores.csv → mkdir data/) */
            if (multiFile) {
                Object.keys(vfs).forEach(function (name) {
                    if (!name.endsWith('.py')) {
                        var parts = name.split('/');
                        for (var d = 1; d < parts.length; d++) {
                            var dir = parts.slice(0, d).join('/');
                            try { pyodide.FS.mkdir(dir); } catch (_) {}
                        }
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
            updateLineNumbers();
            if (multiFile) renderPyFileTree();
            renderDataStrip();
            terminal.readOnly = true;
            terminal.value = 'Click Run to execute the code\u2026';
            terminal.className = 'cr-terminal';
            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
        });
    }

    /* ── build an HTML runner (multi-file with virtual filesystem) ── */
    function initHtmlRunner(container) {
        var sandbox         = (container.getAttribute('data-sandbox')      || '').trim();
        var dataFiles       = (container.getAttribute('data-files')        || '').trim();
        var dataServerFiles = (container.getAttribute('data-server-files') || '').trim();

        /* build serverFiles map: filename → server path (e.g. "mp3Example.mp3" → "/Files/Audio/mp3Example.mp3") */
        var serverFileMap = {};
        if (dataServerFiles) {
            dataServerFiles.split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (path) {
                var name = path.split('/').pop();
                serverFileMap[name] = path;
            });
        }

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
                    buildHtmlRunner(container, data.files || {}, serverFileMap);
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
                buildHtmlRunner(container, originals, serverFileMap);
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
        buildHtmlRunner(container, originals, serverFileMap);
    }

    function buildHtmlRunner(container, originals, serverFiles) {
        serverFiles = serverFiles || {};
        container.classList.add('code-runner');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F310; HTML</span>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-wrap-btn cr-btn-active" title="Word wrap: on">&#8644; Wrap</button>' +
            '    <div class="cr-view-group">' +
            '      <button class="cr-code-btn cr-btn-active" title="Show code editor">&lt;/&gt; Code</button>' +
            '      <button class="cr-preview-btn cr-btn-active" title="Show preview">&#9654; Preview</button>' +
            '    </div>' +
            '    <button class="cr-run-btn">&#9654; Run</button>' +
            '    <button class="cr-reset-btn">&#8635; Reset</button>' +
            '  </div>' +
            '</div>' +
            '<div class="cr-workspace">' +
            '  <div class="cr-filetree">' +
            '    <button class="cr-ft-toggle" title="Collapse file panel">&#9664; Files</button>' +
            '    <div class="cr-ft-body">' +
            '      <ul class="cr-file-list"></ul>' +
            '      <button class="cr-new-file-btn">+ New file</button>' +
            '      <label class="cr-filetree-upload" title="Upload images, CSS, JS, or data files">' +
            '        &#x1F4C2; Upload' +
            '        <input type="file" class="cr-html-file-input" accept="image/*,audio/*,video/*,.css,.js,.csv,.txt,.html,.json" multiple style="display:none">' +
            '      </label>' +
            '    </div>' +
            '  </div>' +
            '  <div class="cr-hl-wrap">' +
            '    <pre class="cr-hl-bg" aria-hidden="true"><code class="cr-hl-code"></code></pre>' +
            '    <textarea class="cr-editor" spellcheck="false"></textarea>' +
            '  </div>' +
            '  <div class="cr-splitter" title="Drag to resize"></div>' +
            '  <iframe class="cr-preview" sandbox="allow-scripts allow-same-origin"></iframe>' +
            '</div>';

        var editor          = container.querySelector('.cr-editor');
        var preview         = container.querySelector('.cr-preview');
        var runBtn          = container.querySelector('.cr-run-btn');
        var resetBtn        = container.querySelector('.cr-reset-btn');
        var htmlFileInput   = container.querySelector('.cr-html-file-input');
        var fileList        = container.querySelector('.cr-file-list');
        var newFileBtn      = container.querySelector('.cr-new-file-btn');
        var hlWrap          = container.querySelector('.cr-hl-wrap');
        var hlCode          = container.querySelector('.cr-hl-code');
        var wrapBtn         = container.querySelector('.cr-wrap-btn');
        var codeBtn         = container.querySelector('.cr-code-btn');
        var previewBtn      = container.querySelector('.cr-preview-btn');
        var ftToggleBtn     = container.querySelector('.cr-ft-toggle');
        var filetreeDiv     = container.querySelector('.cr-filetree');
        var workspace       = container.querySelector('.cr-workspace');
        var splitterEl      = container.querySelector('.cr-splitter');

        /* ── wrap on by default ── */
        hlWrap.classList.add('cr-wrap-on');

        /* ── syntax highlighting ── */
        function escHl(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        function colorAttrs(str) {
            var out = '', i = 0, len = str.length;
            while (i < len) {
                var c = str[i];
                if (/\s/.test(c)) { out += c; i++; continue; }
                var nm = str.slice(i).match(/^[\w:-]+/);
                if (!nm) { out += escHl(c); i++; continue; }
                out += '<span class="cr-hl-at">' + escHl(nm[0]) + '</span>';
                i += nm[0].length;
                if (str[i] === '=') {
                    out += '<span class="cr-hl-eq">=</span>';
                    i++;
                    if (str[i] === '"' || str[i] === "'") {
                        var q = str[i];
                        var end = str.indexOf(q, i + 1);
                        end = end === -1 ? len - 1 : end;
                        out += '<span class="cr-hl-vl">' + escHl(str.slice(i, end + 1)) + '</span>';
                        i = end + 1;
                    } else {
                        var vm = str.slice(i).match(/^[^\s>]*/);
                        if (vm) { out += '<span class="cr-hl-vl">' + escHl(vm[0]) + '</span>'; i += vm[0].length; }
                    }
                }
            }
            return out;
        }
        function colorTag(tag) {
            if (/^<!DOCTYPE/i.test(tag)) return '<span class="cr-hl-dt">' + escHl(tag) + '</span>';
            var inner = tag.slice(1, -1);
            var isClose = inner.charAt(0) === '/';
            if (isClose) inner = inner.slice(1);
            var isSelf = inner.charAt(inner.length - 1) === '/';
            if (isSelf) inner = inner.slice(0, -1);
            var nm = inner.match(/^([\w-]+)([\s\S]*)$/);
            if (!nm) return '<span class="cr-hl-br">&lt;' + (isClose ? '/' : '') + escHl(inner) + '&gt;</span>';
            return '<span class="cr-hl-br">&lt;' + (isClose ? '/' : '') + '</span>' +
                   '<span class="cr-hl-tn">' + escHl(nm[1]) + '</span>' +
                   colorAttrs(nm[2]) +
                   (isSelf ? '<span class="cr-hl-br">/&gt;</span>' : '<span class="cr-hl-br">&gt;</span>');
        }
        function syntaxHighlightHTML(code) {
            var out = '', i = 0, len = code.length;
            while (i < len) {
                if (code.slice(i, i + 4) === '<!--') {
                    var end = code.indexOf('-->', i + 4);
                    end = end === -1 ? len : end + 3;
                    out += '<span class="cr-hl-cm">' + escHl(code.slice(i, end)) + '</span>';
                    i = end; continue;
                }
                if (code[i] === '<') {
                    var j = i + 1, inQ = null;
                    while (j < len) {
                        var ch = code[j];
                        if (inQ) { if (ch === inQ) inQ = null; }
                        else if (ch === '"' || ch === "'") { inQ = ch; }
                        else if (ch === '>') break;
                        j++;
                    }
                    if (j < len) { out += colorTag(code.slice(i, j + 1)); i = j + 1; }
                    else { out += escHl(code.slice(i)); i = len; }
                    continue;
                }
                out += escHl(code[i]); i++;
            }
            return out;
        }
        function updateHighlight() {
            hlCode.innerHTML = syntaxHighlightHTML(editor.value);
        }
        editor.addEventListener('input', updateHighlight);
        editor.addEventListener('scroll', function () {
            var pre = hlCode.parentElement;
            pre.scrollTop  = editor.scrollTop;
            pre.scrollLeft = editor.scrollLeft;
        });

        /* ── word wrap toggle (targets wrapper so both layers switch together) ── */
        wrapBtn.addEventListener('click', function () {
            var on = hlWrap.classList.toggle('cr-wrap-on');
            wrapBtn.classList.toggle('cr-btn-active', on);
            wrapBtn.title = on ? 'Word wrap: on' : 'Word wrap: off';
        });

        /* ── Code / Preview view toggles ── */
        var codeVisible     = true;
        var previewVisible  = true;
        var savedPreviewW   = null;   /* user-set px width from splitter drag */

        function applyViewState() {
            var splitMode = codeVisible && previewVisible;
            workspace.classList.toggle('cr-code-hidden',    !codeVisible);
            workspace.classList.toggle('cr-preview-hidden', !previewVisible);
            codeBtn.classList.toggle('cr-btn-active',    codeVisible);
            previewBtn.classList.toggle('cr-btn-active', previewVisible);
            /* restore / clear the inline width so CSS rules can take over */
            if (splitMode && savedPreviewW !== null) {
                preview.style.width      = savedPreviewW + 'px';
                preview.style.flexShrink = '0';
                preview.style.flex       = '';
            } else if (!splitMode) {
                preview.style.width      = '';
                preview.style.flexShrink = '';
                preview.style.flex       = '';
            }
        }

        codeBtn.addEventListener('click', function () {
            /* must keep at least one panel visible */
            if (codeVisible && !previewVisible) return;
            codeVisible = !codeVisible;
            applyViewState();
        });

        previewBtn.addEventListener('click', function () {
            if (previewVisible && !codeVisible) return;
            previewVisible = !previewVisible;
            applyViewState();
        });

        /* ── Drag-to-resize splitter ── */
        function startSplitterDrag(startX, startW) {
            splitterEl.classList.add('cr-dragging');
            document.body.style.cursor     = 'col-resize';
            document.body.style.userSelect = 'none';

            function onMove(x) {
                var dx    = startX - x;   /* drag left → bigger preview */
                var total = workspace.getBoundingClientRect().width;
                var minW  = 150;
                var maxW  = total - 250;
                var newW  = Math.max(minW, Math.min(maxW, startW + dx));
                savedPreviewW        = newW;
                preview.style.width      = newW + 'px';
                preview.style.flexShrink = '0';
                preview.style.flex       = '';
            }

            function finish() {
                splitterEl.classList.remove('cr-dragging');
                document.body.style.cursor     = '';
                document.body.style.userSelect = '';
            }

            /* mouse */
            function onMouseMove(e) { onMove(e.clientX); }
            function onMouseUp()    {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup',   onMouseUp);
                finish();
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);

            /* touch */
            function onTouchMove(e) { e.preventDefault(); onMove(e.touches[0].clientX); }
            function onTouchEnd()   {
                splitterEl.removeEventListener('touchmove', onTouchMove);
                splitterEl.removeEventListener('touchend',  onTouchEnd);
                finish();
            }
            splitterEl.addEventListener('touchmove', onTouchMove, { passive: false });
            splitterEl.addEventListener('touchend',  onTouchEnd);
        }

        splitterEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startSplitterDrag(e.clientX, preview.getBoundingClientRect().width);
        });

        splitterEl.addEventListener('touchstart', function (e) {
            startSplitterDrag(e.touches[0].clientX, preview.getBoundingClientRect().width);
        }, { passive: true });

        /* ── file tree collapse ── */
        var ftCollapsed = false;
        ftToggleBtn.addEventListener('click', function () {
            ftCollapsed = !ftCollapsed;
            filetreeDiv.classList.toggle('cr-ft-collapsed', ftCollapsed);
            ftToggleBtn.innerHTML = ftCollapsed ? '&#9654;' : '&#9664; Files';
            ftToggleBtn.title     = ftCollapsed ? 'Expand file panel' : 'Collapse file panel';
        });

        /* virtual filesystem seeded from all starter textareas */
        var vfs = Object.assign({}, originals);
        var activeFile = originals['index.html'] !== undefined
            ? 'index.html'
            : Object.keys(originals)[0];
        var uploadedImages = {};   /* path → dataURL for image, audio and video files */
        var openFolders = defaultOpenFolders(Object.keys(originals));  /* all folders open by default */

        /* ── file tree ── */
        function fileIcon(name) {
            var isBinary = !!uploadedImages[name] || !!serverFiles[name];
            if (isBinary && /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(name)) return '&#x1F3B5;'; /* 🎵 audio */
            if (isBinary && /\.(mp4|webm|mov|avi|mkv)$/i.test(name))     return '&#x1F3AC;'; /* 🎬 video */
            if (isBinary)    return '&#x1F5BC;';   /* 🖼 image */
            if (name.endsWith('.css'))   return '&#x1F3A8;';
            if (name.endsWith('.js'))    return '&#x2699;&#xFE0F;';
            if (name.endsWith('.csv'))   return '&#x1F4CA;';
            if (name.endsWith('.txt'))   return '&#x1F4DD;';
            return '&#x1F4C4;';
        }

        function renderFileTree() {
            var textNames   = Object.keys(vfs);
            var imageNames  = Object.keys(uploadedImages);
            var serverNames = Object.keys(serverFiles);
            var allNames    = textNames.concat(imageNames).concat(serverNames);
            var tree = buildFolderTree(allNames, openFolders);
            fileList.innerHTML = renderTreeItems(tree.children, 0, {
                activeFile: activeFile,
                mainFile:   null,
                canDel: function (name) {
                    return !serverFiles[name] && (!!uploadedImages[name] || textNames.length > 1);
                },
                isReadonly: function (name) { return !!uploadedImages[name] || !!serverFiles[name]; },
                iconFn: fileIcon
            });
            fileList.querySelectorAll('.cr-folder-item').forEach(function (li) {
                li.addEventListener('click', function () {
                    openFolders[li.dataset.folderPath] = !openFolders[li.dataset.folderPath];
                    renderFileTree();
                });
            });
            fileList.querySelectorAll('.cr-file-item:not(.cr-readonly)').forEach(function (li) {
                li.addEventListener('click', function (e) {
                    if (e.target.classList.contains('cr-file-del')) return;
                    switchTo(li.dataset.name);
                });
            });
            fileList.querySelectorAll('.cr-file-del').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var name = btn.dataset.name;
                    if (uploadedImages[name]) {
                        delete uploadedImages[name];
                    } else if (textNames.length > 1) {
                        delete vfs[name];
                        if (activeFile === name) {
                            activeFile = Object.keys(vfs)[0];
                            editor.value = vfs[activeFile] || '';
                            updateHighlight();
                        }
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
            updateHighlight();
            renderFileTree();
        }

        /* ── HTML file upload handler (images → uploadedImages, text → vfs) ── */
        function handleHtmlUpload(files, prefix) {
            prefix = prefix || '';
            Array.from(files).forEach(function (file) {
                var dest = prefix + file.name;
                if (/\.(png|jpe?g|gif|svg|webp|bmp|ico|mp3|wav|ogg|aac|m4a|flac|mp4|webm|mov|avi|mkv)$/i.test(file.name)) {
                    var r = new FileReader();
                    r.onload = function (ev) {
                        uploadedImages[dest] = ev.target.result;
                        openFolders = Object.assign(openFolders, defaultOpenFolders([dest]));
                        renderFileTree();
                        updatePreview();
                    };
                    r.readAsDataURL(file);
                } else if (/\.(html?|css|js|csv|txt|json|xml|md)$/i.test(file.name)) {
                    var r2 = new FileReader();
                    r2.onload = function (ev) {
                        vfs[dest] = ev.target.result;
                        openFolders = Object.assign(openFolders, defaultOpenFolders([dest]));
                        renderFileTree();
                        updatePreview();
                    };
                    r2.readAsText(file);
                }
            });
        }

        /* file-input click upload */
        htmlFileInput.addEventListener('change', function () {
            handleHtmlUpload(htmlFileInput.files, '');
            htmlFileInput.value = '';
        });

        /* drag-and-drop onto the file tree (drop-to-root or drop-to-folder) */
        filetreeDiv.addEventListener('dragover', function (e) {
            var hasFile = e.dataTransfer && Array.from(e.dataTransfer.items || []).some(function (i) { return i.kind === 'file'; });
            if (!hasFile) return;
            e.preventDefault();
            e.stopPropagation();
            var folderItem = e.target.closest('.cr-folder-item');
            filetreeDiv.querySelectorAll('.cr-folder-item.cr-drag-over').forEach(function (el) { el.classList.remove('cr-drag-over'); });
            if (folderItem) {
                folderItem.classList.add('cr-drag-over');
                filetreeDiv.classList.remove('cr-drop-active');
            } else {
                filetreeDiv.classList.add('cr-drop-active');
            }
        });
        filetreeDiv.addEventListener('dragleave', function (e) {
            if (!filetreeDiv.contains(e.relatedTarget)) {
                filetreeDiv.classList.remove('cr-drop-active');
                filetreeDiv.querySelectorAll('.cr-folder-item.cr-drag-over').forEach(function (el) { el.classList.remove('cr-drag-over'); });
            }
        });
        filetreeDiv.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            filetreeDiv.classList.remove('cr-drop-active');
            var folderItem = e.target.closest('.cr-folder-item');
            var prefix = folderItem ? (folderItem.dataset.folderPath + '/') : '';
            filetreeDiv.querySelectorAll('.cr-folder-item.cr-drag-over').forEach(function (el) { el.classList.remove('cr-drag-over'); });
            handleHtmlUpload(e.dataTransfer.files, prefix);
        });

        newFileBtn.addEventListener('click', function () {
            var name = (prompt('File name (e.g. style.css, pages/about.html, js/script.js):') || '').trim();
            if (!name) return;
            var basename = name.split('/').pop();
            if (!basename.includes('.')) name += '.html';
            if (vfs[name]) { switchTo(name); return; }
            vfs[name] = name.endsWith('.css') ? '/* ' + name + ' */\n' :
                        name.endsWith('.js')  ? '// ' + name + '\n' :
                        '<!DOCTYPE html>\n<html>\n<head>\n  <title>' + name + '</title>\n</head>\n<body>\n\n</body>\n</html>';
            switchTo(name);
        });

        /* ── preview rendering ── */
        function resolveAndRender(html) {
            /* inject <base href> so that absolute paths like /Files/Audio/... resolve
               against the server origin inside the srcdoc iframe */
            if (!/<base\b/i.test(html)) {
                var baseTag = '<base href="' + window.location.origin + '/">';
                if (/<head>/i.test(html)) {
                    html = html.replace(/<head>/i, '<head>' + baseTag);
                } else {
                    html = baseTag + html;
                }
            }

            /* inline CSS: <link rel="stylesheet" href="css/style.css"> or href="style.css"
               Try exact VFS path first, then fall back to matching by filename only */
            html = html.replace(
                /<link\b([^>]*)href=["']([^"']+)["']([^>]*)>/gi,
                function (match, pre, href, post) {
                    if (!(/rel=["']stylesheet["']/i.test(pre + post))) return match;
                    var content = vfs[href] !== undefined ? vfs[href]
                        : vfs[href.split('/').pop()];
                    return content !== undefined
                        ? '<style>' + content + '</style>'
                        : match;
                }
            );

            /* inline JS: <script src="js/script.js"></script> or src="script.js"
               Try exact VFS path first, then fall back to matching by filename only */
            html = html.replace(
                /<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
                function (match, pre, src) {
                    var content = vfs[src] !== undefined ? vfs[src]
                        : vfs[src.split('/').pop()];
                    return content !== undefined
                        ? '<script>' + content + '<\/script>'
                        : match;
                }
            );

            /* substitute uploaded images/audio/video with their data URIs */
            Object.keys(uploadedImages).forEach(function (name) {
                var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re = new RegExp('(src=["\'])(?:[^"\']*[\\/])?' + esc + '(["\'])', 'gi');
                html = html.replace(re, '$1' + uploadedImages[name] + '$2');
            });

            /* substitute server-hosted files (name → absolute server path) */
            Object.keys(serverFiles).forEach(function (name) {
                var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var re = new RegExp('(src=["\'])(?:[^"\']*[\\/])?' + esc + '(["\'])', 'gi');
                html = html.replace(re, '$1' + serverFiles[name] + '$2');
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
            var rawPath = e.data.crNav.split('?')[0].split('#')[0];
            /* try exact VFS path first (supports subfolders), then filename-only fallback */
            var target = vfs[rawPath] !== undefined ? rawPath : rawPath.split('/').pop();
            if (vfs[target] !== undefined) {
                vfs[activeFile] = editor.value;
                activeFile = target;
                editor.value = vfs[target];
                updateHighlight();
                renderFileTree();
                resolveAndRender(vfs[target]);
            }
        });

        /* ── init ── */
        renderFileTree();
        editor.value = vfs[activeFile];
        updateHighlight();
        updatePreview();

        runBtn.addEventListener('click', updatePreview);
        resetBtn.addEventListener('click', function () {
            vfs = Object.assign({}, originals);
            activeFile = originals['index.html'] !== undefined
                ? 'index.html'
                : Object.keys(originals)[0];
            editor.value = vfs[activeFile];
            updateHighlight();
            uploadedImages = {};
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
