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

    /* ── Python syntax highlighter ── */
    var _PY_KW = new Set(['False','None','True','and','as','assert','async','await',
        'break','class','continue','def','del','elif','else','except','finally',
        'for','from','global','if','import','in','is','lambda','nonlocal','not',
        'or','pass','raise','return','try','while','with','yield']);
    var _PY_BI = new Set(['abs','all','any','bin','bool','breakpoint','bytearray',
        'bytes','callable','chr','classmethod','compile','complex','delattr','dict',
        'dir','divmod','enumerate','eval','exec','filter','float','format',
        'frozenset','getattr','globals','hasattr','hash','help','hex','id','input',
        'int','isinstance','issubclass','iter','len','list','locals','map','max',
        'memoryview','min','next','object','oct','open','ord','pow','print',
        'property','range','repr','reversed','round','set','setattr','slice',
        'sorted','staticmethod','str','sum','super','tuple','type','vars','zip']);

    function syntaxHighlightPython(code) {
        function esc(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        var out = '', i = 0, n = code.length;
        while (i < n) {
            var ch = code[i];
            /* comments */
            if (ch === '#') {
                var ec = code.indexOf('\n', i);
                if (ec === -1) ec = n;
                out += '<span class="py-cm">' + esc(code.slice(i, ec)) + '</span>';
                i = ec; continue;
            }
            /* triple-quoted strings */
            var tri = code.slice(i, i + 3);
            if (tri === '"""' || tri === "'''") {
                var e3 = code.indexOf(tri, i + 3);
                if (e3 === -1) e3 = n - 3;
                out += '<span class="py-st">' + esc(code.slice(i, e3 + 3)) + '</span>';
                i = e3 + 3; continue;
            }
            /* single/double-quoted strings */
            if (ch === '"' || ch === "'") {
                var j = i + 1;
                while (j < n && code[j] !== ch && code[j] !== '\n') {
                    if (code[j] === '\\') j++;
                    j++;
                }
                out += '<span class="py-st">' + esc(code.slice(i, Math.min(j + 1, n))) + '</span>';
                i = j + 1; continue;
            }
            /* numbers */
            if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1] || ''))) {
                var nm = code.slice(i).match(/^(?:0[xXbBoO][\da-fA-F_]+|[0-9][\d_]*\.?[\d_]*(?:[eEjJ][-+]?[\d_]*)?|\.[\d_]+)/);
                if (nm) { out += '<span class="py-nu">' + esc(nm[0]) + '</span>'; i += nm[0].length; continue; }
            }
            /* identifiers: keywords, builtins, function calls, names */
            if (/[a-zA-Z_]/.test(ch)) {
                var id = code.slice(i).match(/^[a-zA-Z_]\w*/)[0];
                var nx = code[i + id.length] || '';
                if (_PY_KW.has(id)) {
                    out += '<span class="py-kw">' + esc(id) + '</span>';
                } else if (_PY_BI.has(id) && nx !== '.') {
                    out += '<span class="py-bi">' + esc(id) + '</span>';
                } else if (nx === '(') {
                    out += '<span class="py-fn">' + esc(id) + '</span>';
                } else {
                    out += esc(id);
                }
                i += id.length; continue;
            }
            /* decorators */
            if (ch === '@') {
                var dm = code.slice(i).match(/^@[\w.]+/);
                if (dm) { out += '<span class="py-dc">' + esc(dm[0]) + '</span>'; i += dm[0].length; continue; }
            }
            /* operators */
            if (/[+\-*/%=<>!&|^~]/.test(ch)) {
                var op = code.slice(i).match(/^(?:\*\*=?|\/\/=?|<<=?|>>=?|[+\-*/%=<>!&|^~]=?|~)/);
                if (op) { out += '<span class="py-op">' + esc(op[0]) + '</span>'; i += op[0].length; continue; }
            }
            /* brackets */
            if (/[()[\]{}]/.test(ch)) { out += '<span class="py-br">' + esc(ch) + '</span>'; i++; continue; }
            out += esc(ch); i++;
        }
        return out;
    }

    /* ── Shared quiz prompt helpers ── */
    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* Convert plain-text prompt (with newlines and "- bullet" lines) to HTML */
    function formatPromptHTML(text) {
        if (!text || !text.trim()) return '';
        var lines = text.split('\n');
        var html = '', inList = false;
        lines.forEach(function (line) {
            var bullet = /^[-•*]\s+/.exec(line.trim());
            if (bullet) {
                if (!inList) { html += '<ul class="pq-prompt-list">'; inList = true; }
                html += '<li>' + escHtml(line.trim().slice(bullet[0].length)) + '</li>';
            } else {
                if (inList) { html += '</ul>'; inList = false; }
                if (line.trim() === '') {
                    html += '<div class="pq-prompt-gap"></div>';
                } else {
                    html += '<p>' + escHtml(line.trim()) + '</p>';
                }
            }
        });
        if (inList) html += '</ul>';
        return html;
    }

    /* Build the collapsible header inside promptBar and wire the toggle */
    function initPromptBar(promptBar, sandboxName) {
        var lsKey = 'bhscs-qi-' + sandboxName;
        var collapsed = localStorage.getItem(lsKey) === '1';
        promptBar.innerHTML =
            '<div class="pq-prompt-header">' +
            '  <span class="pq-prompt-label">&#x1F4CB; Instructions</span>' +
            '  <button class="pq-prompt-toggle" type="button"></button>' +
            '</div>' +
            '<div class="pq-prompt-body"></div>';
        var toggleBtn = promptBar.querySelector('.pq-prompt-toggle');
        function applyCollapsed(c) {
            promptBar.classList.toggle('pq-collapsed', c);
            toggleBtn.textContent = c ? '\u25B6 Show' : '\u25BC Hide';
        }
        applyCollapsed(collapsed);
        toggleBtn.addEventListener('click', function () {
            var nowCollapsed = !promptBar.classList.contains('pq-collapsed');
            applyCollapsed(nowCollapsed);
            localStorage.setItem(lsKey, nowCollapsed ? '1' : '0');
        });
    }

    /* Update only the body content (called when switching questions) */
    function setPromptText(promptBar, text) {
        var body = promptBar.querySelector('.pq-prompt-body');
        if (!body) { promptBar.textContent = text; return; }
        var html = formatPromptHTML(text);
        body.innerHTML = html;
        promptBar.style.display = html ? '' : 'none';
    }

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
            '<div class="cr-py-hl-wrap">' +
            '  <pre class="cr-hl-bg" aria-hidden="true"><code class="cr-hl-code"></code></pre>' +
            '  <textarea class="cr-editor" spellcheck="false"></textarea>' +
            '</div>' +
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
        var hlWrap      = container.querySelector('.cr-py-hl-wrap');
        var hlPre       = container.querySelector('.cr-hl-bg');
        var hlCode      = container.querySelector('.cr-hl-code');
        var terminal    = container.querySelector('.cr-terminal');
        var runBtn      = container.querySelector('.cr-run-btn');
        var resetBtn    = container.querySelector('.cr-reset-btn');
        var dataStrip   = container.querySelector('.cr-data-strip');
        var pyFileInput = container.querySelector('.cr-py-file-input');

        /* ── syntax highlight + line number sync ── */
        function updateHighlight() {
            hlCode.innerHTML = syntaxHighlightPython(editor.value);
        }
        function updateLineNumbers() {
            var count = editor.value.split('\n').length;
            var text  = '';
            for (var i = 1; i <= count; i++) text += i + '\n';
            lineNums.textContent = text;
            updateHighlight();
            /* sync line-numbers height to match the highlight wrapper after reflow */
            requestAnimationFrame(function () {
                var h = hlWrap.offsetHeight;
                if (h > 0) lineNums.style.height = h + 'px';
            });
        }
        editor.addEventListener('input',  updateLineNumbers);
        editor.addEventListener('keydown', function () { setTimeout(updateLineNumbers, 0); });
        editor.addEventListener('scroll', function () { hlPre.scrollLeft = editor.scrollLeft; });

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

            /* Overlay blocks the preview iframe from stealing mouse events
               while dragging — without it the drag breaks the moment the
               cursor enters the iframe. */
            var dragOverlay = document.createElement('div');
            dragOverlay.style.cssText =
                'position:fixed;top:0;left:0;right:0;bottom:0;' +
                'z-index:99999;cursor:col-resize;';
            document.body.appendChild(dragOverlay);
            document.body.style.userSelect = 'none';

            function onMove(x) {
                var dx    = startX - x;   /* drag left → bigger preview */
                var total = workspace.getBoundingClientRect().width;
                var newW  = Math.max(150, Math.min(total - 250, startW + dx));
                savedPreviewW            = newW;
                preview.style.width      = newW + 'px';
                preview.style.flexShrink = '0';
                preview.style.flex       = '';
            }

            function finish() {
                splitterEl.classList.remove('cr-dragging');
                document.body.removeChild(dragOverlay);
                document.body.style.userSelect = '';
            }

            /* mouse — check buttons in case release happened outside window */
            function onMouseMove(e) {
                if (!(e.buttons & 1)) { onMouseUp(); return; }
                onMove(e.clientX);
            }
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup',   onMouseUp);
                finish();
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);

            /* touch */
            function onTouchMove(e) { e.preventDefault(); onMove(e.touches[0].clientX); }
            function onTouchEnd() {
                dragOverlay.removeEventListener('touchmove', onTouchMove);
                dragOverlay.removeEventListener('touchend',  onTouchEnd);
                finish();
            }
            dragOverlay.addEventListener('touchmove', onTouchMove, { passive: false });
            dragOverlay.addEventListener('touchend',  onTouchEnd);
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

    /* ═══════════════════════════════════════════════════════════════
       Python Quiz (coding exercise) runner
       Usage: <div class="py-quiz" data-sandbox="sandbox-name"></div>
       ═══════════════════════════════════════════════════════════════ */

    function initPyQuizRunner(container) {
        var sandbox = (container.getAttribute('data-sandbox') || '').trim();
        if (!sandbox) return;
        container.classList.add('code-runner');
        container.innerHTML = '<div style="padding:16px;color:#6c7086;font-family:Arial,sans-serif;">Loading exercise\u2026</div>';
        fetch('/api/sandboxes/' + encodeURIComponent(sandbox))
            .then(function (r) {
                if (!r.ok) throw new Error('Exercise not found: ' + sandbox);
                return r.json();
            })
            .then(function (data) {
                container.innerHTML = '';
                container.classList.remove('code-runner');
                buildPyQuizRunner(container, data, sandbox);
            })
            .catch(function (err) {
                container.innerHTML = '<div style="padding:16px;color:#f38ba8;font-family:Arial,sans-serif;">\u26A0 ' + err.message + '</div>';
            });
    }

    function buildPyQuizRunner(container, data, sandboxName) {
        var questions = data.questions || [];
        if (!questions.length) {
            container.innerHTML = '<div style="padding:16px;color:#6c7086;font-family:Arial,sans-serif;">No questions defined for this exercise.</div>';
            return;
        }
        var title = data.title || 'Coding Exercise';
        var activeIdx = 0;

        /* ── per-question localStorage state ── */
        function lsKey(i) { return 'bhscs-pyq-' + sandboxName + '-q' + i; }
        function loadQState(i) {
            try { return JSON.parse(localStorage.getItem(lsKey(i)) || 'null'); } catch (e) { return null; }
        }
        function saveQState(i, st) { localStorage.setItem(lsKey(i), JSON.stringify(st)); }
        function clearQState(i) { localStorage.removeItem(lsKey(i)); }

        var qStates = questions.map(function (q, i) {
            var saved = loadQState(i);
            return {
                code:     saved ? saved.code     : (q.starter || ''),
                feedback: saved ? saved.feedback  : '',
                done:     saved ? (saved.done === true) : false
            };
        });

        /* ── HTML helpers ── */
        function eH(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function renderTabsHtml() {
            return questions.map(function (q, i) {
                var active = i === activeIdx ? ' pq-tab-active' : '';
                var done   = qStates[i].done  ? ' pq-tab-done'   : '';
                var label  = eH(q.label || ('Q' + (i + 1)));
                var tick   = qStates[i].done  ? ' \u2713' : '';
                return '<button class="pq-tab-btn' + active + done + '" data-qi="' + i + '">' + label + tick + '</button>';
            }).join('');
        }

        container.classList.add('code-runner', 'pq-quiz');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">\uD83D\uDC0D ' + eH(title) + '</span>' +
            '  <div class="pq-tabs">' + renderTabsHtml() + '</div>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-run-btn">\u25B6 Run</button>' +
            '  </div>' +
            '</div>' +
            '<div class="pq-prompt-bar"></div>' +
            '<div class="cr-editor-wrap">' +
            '  <div class="cr-line-numbers" aria-hidden="true"></div>' +
            '  <div class="cr-py-hl-wrap">' +
            '    <pre class="cr-hl-bg" aria-hidden="true"><code class="cr-hl-code"></code></pre>' +
            '    <textarea class="cr-editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>' +
            '  </div>' +
            '</div>' +
            '<div class="cr-output-area">' +
            '  <div class="cr-output-label">Output</div>' +
            '  <textarea class="cr-terminal" readonly spellcheck="false">Click Run to execute the code\u2026</textarea>' +
            '</div>' +
            '<div class="pq-action-bar">' +
            '  <button class="pq-submit-btn">\uD83D\uDCE4 Submit for Feedback</button>' +
            '  <button class="pq-reset-btn">\u21BA Reset question</button>' +
            '</div>' +
            '<div class="pq-feedback-area" style="display:none;">' +
            '  <div class="pq-feedback-text"></div>' +
            '</div>';

        var tabsDiv      = container.querySelector('.pq-tabs');
        var promptBar    = container.querySelector('.pq-prompt-bar');
        var editor       = container.querySelector('.cr-editor');
        var lineNums     = container.querySelector('.cr-line-numbers');
        var hlWrap       = container.querySelector('.cr-py-hl-wrap');
        var hlPre        = container.querySelector('.cr-hl-bg');
        var hlCode       = container.querySelector('.cr-hl-code');
        var terminal     = container.querySelector('.cr-terminal');
        var runBtn       = container.querySelector('.cr-run-btn');
        var submitBtn    = container.querySelector('.pq-submit-btn');
        var resetBtn     = container.querySelector('.pq-reset-btn');
        var feedbackArea = container.querySelector('.pq-feedback-area');
        var feedbackText = container.querySelector('.pq-feedback-text');

        initPromptBar(promptBar, sandboxName);

        /* ── syntax highlight + line numbers ── */
        function updateHighlight() {
            hlCode.innerHTML = syntaxHighlightPython(editor.value);
        }
        function updateLineNums() {
            var count = editor.value.split('\n').length;
            var out = '';
            for (var n = 1; n <= count; n++) out += n + '\n';
            lineNums.textContent = out;
            updateHighlight();
            requestAnimationFrame(function () {
                var h = hlWrap.offsetHeight;
                if (h > 0) lineNums.style.height = h + 'px';
            });
        }
        editor.addEventListener('input', updateLineNums);
        editor.addEventListener('scroll', function () { hlPre.scrollLeft = editor.scrollLeft; });

        editor.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                var s = editor.selectionStart, end = editor.selectionEnd;
                editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(end);
                editor.selectionStart = editor.selectionEnd = s + 4;
                updateLineNums();
            }
        });

        /* ── run logic (mirrors buildPyRunner's executeCode) ── */
        var collectedInputs = [];
        var awaitingInput   = false;
        var baselineLen     = 0;

        terminal.addEventListener('input', function () {
            if (!awaitingInput) return;
            if (terminal.value.length < baselineLen) terminal.value = terminal.value.substring(0, baselineLen);
        });
        terminal.addEventListener('keydown', function (e) {
            if (!awaitingInput) { e.preventDefault(); return; }
            if (e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                if (terminal.selectionStart <= baselineLen) e.preventDefault();
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
                terminal.selectionStart = terminal.selectionEnd = baselineLen;
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

            var code = editor.value;
            try { await pyodide.loadPackagesFromImports(code); } catch (_) {}

            pyodide.runPython('import sys, io\n_cr_buf = io.StringIO()\n_cr_old = sys.stdout\nsys.stdout = _cr_buf');

            var succeeded = false, needsInput = false, errorText = '';
            try {
                await pyodide.runPythonAsync(code);
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
                terminal.selectionStart = terminal.selectionEnd = baselineLen;
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

        /* ── submit for AI feedback ── */
        submitBtn.addEventListener('click', function () {
            var q    = questions[activeIdx];
            var code = editor.value;
            submitBtn.disabled = true;
            feedbackArea.style.display = 'block';
            feedbackText.textContent   = '\u23F3 Marking your code\u2026';
            feedbackText.className     = 'pq-feedback-text pq-fb-loading';

            fetch('/api/quiz/mark-code', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    questions: [{
                        text:          q.prompt  || '',
                        marks:         q.marks   || 1,
                        markingScheme: q.scheme  || '',
                        answer:        code,
                        example:       q.example || ''
                    }]
                })
            })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var result   = d.results && d.results[0];
                var fb       = result ? result.feedback : (d.error || 'No feedback received.');
                var marks    = result ? ('\u2714 Marks: ' + result.marksAwarded + '/' + (q.marks || 1) + '\n\n') : '';
                var fullText = marks + fb;

                qStates[activeIdx].code     = editor.value;
                qStates[activeIdx].feedback = fullText;
                qStates[activeIdx].done     = true;
                saveQState(activeIdx, qStates[activeIdx]);

                feedbackText.textContent = fullText;
                feedbackText.className   = 'pq-feedback-text';
                submitBtn.classList.add('pq-submitted');
                submitBtn.textContent = '\u2714 Submitted';

                tabsDiv.innerHTML = renderTabsHtml();
                wireTabBtns();
            })
            .catch(function (err) {
                feedbackText.textContent = 'Could not get feedback: ' + err.message;
                feedbackText.className   = 'pq-feedback-text pq-fb-error';
                submitBtn.disabled = false;
            });
        });

        /* ── reset current question ── */
        resetBtn.addEventListener('click', function () {
            if (!confirm('Reset this question? Your code and feedback will be cleared.')) return;
            var q = questions[activeIdx];
            qStates[activeIdx] = { code: q.starter || '', feedback: '', done: false };
            clearQState(activeIdx);

            editor.value = qStates[activeIdx].code;
            updateLineNums();
            terminal.readOnly = true;
            terminal.value = 'Click Run to execute the code\u2026';
            terminal.className = 'cr-terminal';
            runBtn.disabled = false;
            runBtn.textContent = '\u25B6 Run';
            collectedInputs = [];
            awaitingInput   = false;

            feedbackArea.style.display = 'none';
            feedbackText.textContent   = '';
            feedbackText.className     = 'pq-feedback-text';
            submitBtn.disabled = false;
            submitBtn.classList.remove('pq-submitted');
            submitBtn.innerHTML = '\uD83D\uDCE4 Submit for Feedback';

            tabsDiv.innerHTML = renderTabsHtml();
            wireTabBtns();
        });

        /* ── switch question ── */
        function switchQuestion(newIdx) {
            qStates[activeIdx].code = editor.value;
            saveQState(activeIdx, qStates[activeIdx]);
            activeIdx = newIdx;

            var q  = questions[activeIdx];
            var st = qStates[activeIdx];

            tabsDiv.innerHTML = renderTabsHtml();
            wireTabBtns();
            setPromptText(promptBar, q.prompt || '');
            editor.value          = st.code;
            updateLineNums();
            terminal.readOnly = true;
            terminal.value    = 'Click Run to execute the code\u2026';
            terminal.className = 'cr-terminal';
            runBtn.disabled   = false;
            runBtn.textContent = '\u25B6 Run';
            collectedInputs   = [];
            awaitingInput     = false;

            if (st.done) {
                submitBtn.disabled = true;
                submitBtn.classList.add('pq-submitted');
                submitBtn.textContent  = '\u2714 Submitted';
                feedbackArea.style.display = 'block';
                feedbackText.textContent   = st.feedback;
                feedbackText.className     = 'pq-feedback-text';
            } else {
                submitBtn.disabled = false;
                submitBtn.classList.remove('pq-submitted');
                submitBtn.innerHTML        = '\uD83D\uDCE4 Submit for Feedback';
                feedbackArea.style.display = 'none';
                feedbackText.textContent   = '';
            }
        }

        function wireTabBtns() {
            tabsDiv.querySelectorAll('.pq-tab-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var qi = parseInt(btn.getAttribute('data-qi'), 10);
                    if (qi !== activeIdx) switchQuestion(qi);
                });
            });
        }

        /* ── initialise ── */
        setPromptText(promptBar, questions[0].prompt || '');
        editor.value          = qStates[0].code;
        updateLineNums();
        wireTabBtns();

        if (qStates[0].done) {
            submitBtn.disabled = true;
            submitBtn.classList.add('pq-submitted');
            submitBtn.textContent      = '\u2714 Submitted';
            feedbackArea.style.display = 'block';
            feedbackText.textContent   = qStates[0].feedback;
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       HTML Quiz (coding exercise) runner
       Usage: <div class="html-quiz" data-sandbox="sandbox-name"></div>
       ═══════════════════════════════════════════════════════════════ */

    function initHtmlQuizRunner(container) {
        var sandbox = (container.getAttribute('data-sandbox') || '').trim();
        if (!sandbox) return;
        container.classList.add('code-runner');
        container.innerHTML = '<div style="padding:16px;color:#6c7086;font-family:Arial,sans-serif;">Loading exercise\u2026</div>';
        fetch('/api/sandboxes/' + encodeURIComponent(sandbox))
            .then(function (r) {
                if (!r.ok) throw new Error('Exercise not found: ' + sandbox);
                return r.json();
            })
            .then(function (data) {
                container.innerHTML = '';
                container.classList.remove('code-runner');
                buildHtmlQuizRunner(container, data, sandbox);
            })
            .catch(function (err) {
                container.innerHTML = '<div style="padding:16px;color:#f38ba8;font-family:Arial,sans-serif;">\u26A0 ' + err.message + '</div>';
            });
    }

    function buildHtmlQuizRunner(container, data, sandboxName) {
        var questions = data.questions || [];
        if (!questions.length) {
            container.innerHTML = '<div style="padding:16px;color:#6c7086;font-family:Arial,sans-serif;">No questions defined for this exercise.</div>';
            return;
        }
        var title    = data.title || 'HTML Exercise';
        var activeIdx = 0;

        /* ── per-question localStorage state ── */
        function lsKey(i) { return 'bhscs-hq-' + sandboxName + '-q' + i; }
        function loadQState(i) {
            try { return JSON.parse(localStorage.getItem(lsKey(i)) || 'null'); } catch (e) { return null; }
        }
        function saveQState(i, st) { localStorage.setItem(lsKey(i), JSON.stringify(st)); }
        function clearQState(i) { localStorage.removeItem(lsKey(i)); }

        var qStates = questions.map(function (q, i) {
            var saved = loadQState(i);
            return {
                code:     saved ? saved.code     : (q.starter || ''),
                feedback: saved ? saved.feedback  : '',
                done:     saved ? (saved.done === true) : false
            };
        });

        /* ── HTML-escape ── */
        function eH(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        /* ── Syntax highlighting (mirrors buildHtmlRunner) ── */
        function escHl(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
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
                    out += '<span class="cr-hl-eq">=</span>'; i++;
                    if (str[i] === '"' || str[i] === "'") {
                        var q2 = str[i], end2 = str.indexOf(q2, i + 1);
                        end2 = end2 === -1 ? len - 1 : end2;
                        out += '<span class="cr-hl-vl">' + escHl(str.slice(i, end2 + 1)) + '</span>'; i = end2 + 1;
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
            var inner = tag.slice(1, -1), isClose = inner.charAt(0) === '/', isSelf;
            if (isClose) inner = inner.slice(1);
            isSelf = inner.charAt(inner.length - 1) === '/';
            if (isSelf) inner = inner.slice(0, -1);
            var nm = inner.match(/^([\w-]+)([\s\S]*)$/);
            if (!nm) return '<span class="cr-hl-br">&lt;' + (isClose ? '/' : '') + escHl(inner) + '&gt;</span>';
            return '<span class="cr-hl-br">&lt;' + (isClose ? '/' : '') + '</span>' +
                   '<span class="cr-hl-tn">' + escHl(nm[1]) + '</span>' +
                   colorAttrs(nm[2]) +
                   (isSelf ? '<span class="cr-hl-br">/&gt;</span>' : '<span class="cr-hl-br">&gt;</span>');
        }
        function hlHtml(code) {
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
                        else if (ch === '>') { break; }
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

        /* ── tab rendering ── */
        function renderTabsHtml() {
            return questions.map(function (q, i) {
                var active = i === activeIdx ? ' pq-tab-active' : '';
                var done   = qStates[i].done  ? ' pq-tab-done'   : '';
                var label  = eH(q.label || ('Q' + (i + 1)));
                var tick   = qStates[i].done  ? ' \u2713' : '';
                return '<button class="pq-tab-btn' + active + done + '" data-qi="' + i + '">' + label + tick + '</button>';
            }).join('');
        }

        container.classList.add('code-runner', 'hq-quiz');
        container.innerHTML =
            '<div class="cr-toolbar">' +
            '  <span class="cr-lang">&#x1F310; ' + eH(title) + '</span>' +
            '  <div class="pq-tabs">' + renderTabsHtml() + '</div>' +
            '  <div class="cr-btns">' +
            '    <button class="cr-wrap-btn cr-btn-active" title="Word wrap: on">&#8644; Wrap</button>' +
            '    <div class="cr-view-group">' +
            '      <button class="cr-code-btn cr-btn-active" title="Show code editor">&lt;/&gt; Code</button>' +
            '      <button class="cr-preview-btn cr-btn-active" title="Show preview">&#9654; Preview</button>' +
            '    </div>' +
            '    <button class="cr-run-btn">&#9654; Run</button>' +
            '  </div>' +
            '</div>' +
            '<div class="pq-prompt-bar"></div>' +
            '<div class="cr-workspace">' +
            '  <div class="cr-hl-wrap">' +
            '    <pre class="cr-hl-bg" aria-hidden="true"><code class="cr-hl-code"></code></pre>' +
            '    <textarea class="cr-editor" spellcheck="false"></textarea>' +
            '  </div>' +
            '  <div class="cr-splitter" title="Drag to resize"></div>' +
            '  <iframe class="cr-preview" sandbox="allow-scripts allow-same-origin"></iframe>' +
            '</div>' +
            '<div class="pq-action-bar">' +
            '  <button class="pq-submit-btn">&#x1F4E4; Submit for Feedback</button>' +
            '  <button class="pq-reset-btn">&#8635; Reset question</button>' +
            '</div>' +
            '<div class="pq-feedback-area" style="display:none;">' +
            '  <div class="pq-feedback-text"></div>' +
            '</div>';

        var tabsDiv      = container.querySelector('.pq-tabs');
        var promptBar    = container.querySelector('.pq-prompt-bar');
        var hlWrap       = container.querySelector('.cr-hl-wrap');
        var hlCode       = container.querySelector('.cr-hl-code');
        var editor       = container.querySelector('.cr-editor');
        var preview      = container.querySelector('.cr-preview');
        var workspace    = container.querySelector('.cr-workspace');
        var splitterEl   = container.querySelector('.cr-splitter');
        var runBtn       = container.querySelector('.cr-run-btn');
        var wrapBtn      = container.querySelector('.cr-wrap-btn');
        var codeBtn      = container.querySelector('.cr-code-btn');
        var previewBtn   = container.querySelector('.cr-preview-btn');
        var submitBtn    = container.querySelector('.pq-submit-btn');
        var resetBtn     = container.querySelector('.pq-reset-btn');
        var feedbackArea = container.querySelector('.pq-feedback-area');
        var feedbackText = container.querySelector('.pq-feedback-text');

        initPromptBar(promptBar, sandboxName);

        /* ── word wrap ── */
        hlWrap.classList.add('cr-wrap-on');
        wrapBtn.addEventListener('click', function () {
            var on = hlWrap.classList.toggle('cr-wrap-on');
            wrapBtn.classList.toggle('cr-btn-active', on);
            wrapBtn.title = on ? 'Word wrap: on' : 'Word wrap: off';
        });

        /* ── syntax highlighting + scroll sync ── */
        function updateHighlight() { hlCode.innerHTML = hlHtml(editor.value); }
        editor.addEventListener('input', updateHighlight);
        editor.addEventListener('scroll', function () {
            var pre = hlCode.parentElement;
            pre.scrollTop  = editor.scrollTop;
            pre.scrollLeft = editor.scrollLeft;
        });

        /* ── Code / Preview view toggles ── */
        var codeVisible = true, previewVisible = true, savedPreviewW = null;
        function applyViewState() {
            var splitMode = codeVisible && previewVisible;
            workspace.classList.toggle('cr-code-hidden',    !codeVisible);
            workspace.classList.toggle('cr-preview-hidden', !previewVisible);
            codeBtn.classList.toggle('cr-btn-active',    codeVisible);
            previewBtn.classList.toggle('cr-btn-active', previewVisible);
            if (splitMode && savedPreviewW !== null) {
                preview.style.width = savedPreviewW + 'px'; preview.style.flexShrink = '0'; preview.style.flex = '';
            } else if (!splitMode) {
                preview.style.width = ''; preview.style.flexShrink = ''; preview.style.flex = '';
            }
        }
        codeBtn.addEventListener('click', function () {
            if (codeVisible && !previewVisible) return;
            codeVisible = !codeVisible; applyViewState();
        });
        previewBtn.addEventListener('click', function () {
            if (previewVisible && !codeVisible) return;
            previewVisible = !previewVisible; applyViewState();
        });

        /* ── Drag-to-resize splitter ── */
        function startSplitterDrag(startX, startW) {
            splitterEl.classList.add('cr-dragging');
            var dragOverlay = document.createElement('div');
            dragOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;cursor:col-resize;';
            document.body.appendChild(dragOverlay);
            document.body.style.userSelect = 'none';
            function onMove(x) {
                var dx = startX - x, total = workspace.getBoundingClientRect().width;
                var newW = Math.max(150, Math.min(total - 250, startW + dx));
                savedPreviewW = newW; preview.style.width = newW + 'px'; preview.style.flexShrink = '0'; preview.style.flex = '';
            }
            function finish() {
                splitterEl.classList.remove('cr-dragging');
                document.body.removeChild(dragOverlay);
                document.body.style.userSelect = '';
            }
            function onMouseMove(e) { if (!(e.buttons & 1)) { onMouseUp(); return; } onMove(e.clientX); }
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup',   onMouseUp);
                finish();
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
            function onTouchMove(e) { e.preventDefault(); onMove(e.touches[0].clientX); }
            function onTouchEnd() {
                dragOverlay.removeEventListener('touchmove', onTouchMove);
                dragOverlay.removeEventListener('touchend',  onTouchEnd);
                finish();
            }
            dragOverlay.addEventListener('touchmove', onTouchMove, { passive: false });
            dragOverlay.addEventListener('touchend',  onTouchEnd);
        }
        splitterEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startSplitterDrag(e.clientX, preview.getBoundingClientRect().width);
        });
        splitterEl.addEventListener('touchstart', function (e) {
            startSplitterDrag(e.touches[0].clientX, preview.getBoundingClientRect().width);
        }, { passive: true });

        /* ── run → update preview ── */
        function updatePreview() { preview.srcdoc = editor.value; }
        runBtn.addEventListener('click', updatePreview);

        /* ── submit for AI feedback ── */
        submitBtn.addEventListener('click', function () {
            var q    = questions[activeIdx];
            var code = editor.value;
            submitBtn.disabled = true;
            feedbackArea.style.display = 'block';
            feedbackText.textContent   = '\u23F3 Marking your code\u2026';
            feedbackText.className     = 'pq-feedback-text pq-fb-loading';

            fetch('/api/quiz/mark-code', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    questions: [{
                        text:          q.prompt  || '',
                        marks:         q.marks   || 1,
                        markingScheme: q.scheme  || '',
                        answer:        code,
                        codeType:      'html',
                        example:       q.example || ''
                    }]
                })
            })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var result   = d.results && d.results[0];
                var fb       = result ? result.feedback : (d.error || 'No feedback received.');
                var marks    = result ? ('\u2714 Marks: ' + result.marksAwarded + '/' + (q.marks || 1) + '\n\n') : '';
                var fullText = marks + fb;

                qStates[activeIdx].code     = editor.value;
                qStates[activeIdx].feedback = fullText;
                qStates[activeIdx].done     = true;
                saveQState(activeIdx, qStates[activeIdx]);

                feedbackText.textContent = fullText;
                feedbackText.className   = 'pq-feedback-text';
                submitBtn.classList.add('pq-submitted');
                submitBtn.textContent = '\u2714 Submitted';

                tabsDiv.innerHTML = renderTabsHtml();
                wireTabBtns();
            })
            .catch(function (err) {
                feedbackText.textContent = 'Could not get feedback: ' + err.message;
                feedbackText.className   = 'pq-feedback-text pq-fb-error';
                submitBtn.disabled = false;
            });
        });

        /* ── reset current question ── */
        resetBtn.addEventListener('click', function () {
            if (!confirm('Reset this question? Your code and feedback will be cleared.')) return;
            var q = questions[activeIdx];
            qStates[activeIdx] = { code: q.starter || '', feedback: '', done: false };
            clearQState(activeIdx);

            editor.value = qStates[activeIdx].code;
            updateHighlight();
            updatePreview();
            feedbackArea.style.display = 'none';
            feedbackText.textContent   = '';
            feedbackText.className     = 'pq-feedback-text';
            submitBtn.disabled = false;
            submitBtn.classList.remove('pq-submitted');
            submitBtn.innerHTML = '\uD83D\uDCE4 Submit for Feedback';

            tabsDiv.innerHTML = renderTabsHtml();
            wireTabBtns();
        });

        /* ── switch question ── */
        function switchQuestion(newIdx) {
            qStates[activeIdx].code = editor.value;
            saveQState(activeIdx, qStates[activeIdx]);
            activeIdx = newIdx;

            var q  = questions[activeIdx];
            var st = qStates[activeIdx];

            tabsDiv.innerHTML = renderTabsHtml();
            wireTabBtns();
            setPromptText(promptBar, q.prompt || '');
            editor.value          = st.code;
            updateHighlight();
            updatePreview();

            if (st.done) {
                submitBtn.disabled = true;
                submitBtn.classList.add('pq-submitted');
                submitBtn.textContent      = '\u2714 Submitted';
                feedbackArea.style.display = 'block';
                feedbackText.textContent   = st.feedback;
                feedbackText.className     = 'pq-feedback-text';
            } else {
                submitBtn.disabled = false;
                submitBtn.classList.remove('pq-submitted');
                submitBtn.innerHTML        = '\uD83D\uDCE4 Submit for Feedback';
                feedbackArea.style.display = 'none';
                feedbackText.textContent   = '';
            }
        }

        function wireTabBtns() {
            tabsDiv.querySelectorAll('.pq-tab-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var qi = parseInt(btn.getAttribute('data-qi'), 10);
                    if (qi !== activeIdx) switchQuestion(qi);
                });
            });
        }

        /* ── initialise ── */
        setPromptText(promptBar, questions[0].prompt || '');
        editor.value          = qStates[0].code;
        updateHighlight();
        updatePreview();
        applyViewState();
        wireTabBtns();

        if (qStates[0].done) {
            submitBtn.disabled = true;
            submitBtn.classList.add('pq-submitted');
            submitBtn.textContent      = '\u2714 Submitted';
            feedbackArea.style.display = 'block';
            feedbackText.textContent   = qStates[0].feedback;
        }
    }

    /* ── initialise all runners on the page ── */
    function init() {
        document.querySelectorAll('.py-runner').forEach(initPyRunner);
        document.querySelectorAll('.html-runner').forEach(initHtmlRunner);
        document.querySelectorAll('.py-quiz').forEach(initPyQuizRunner);
        document.querySelectorAll('.html-quiz').forEach(initHtmlQuizRunner);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
