/* Project store for the Python and HTML/CSS editor tools.
   Two backends are selected automatically based on the site-wide login:
     - SiteAuth signed-in  → cloud  (POST/GET/PUT/DELETE /api/code-projects/:kind[/:id])
     - SiteAuth signed-out → local  (localStorage key 'bhs_code_projects_<kind>')

   All public methods now return Promises. Editor pages should `await`.

     CodeProjects.list(kind)            → Promise<[{id, name, updatedAt}]>
     CodeProjects.get(kind, id)         → Promise<project | null>
     CodeProjects.create(kind, name, starterCode) → Promise<project>
     CodeProjects.updateCode(kind, id, code)      → Promise<void>
     CodeProjects.updateName(kind, id, name)      → Promise<void>
     CodeProjects.remove(kind, id)                → Promise<void>

   Helpers used by the dashboard:
     CodeProjects.isCloud()             → boolean
     CodeProjects.onChange(cb)          → unsubscribe; cb({mode}) when backend changes
     CodeProjects.maybePromptImport(kind, prompter)
        - prompter({count, doImport, skip}) is called when there are local
          guest projects waiting to be imported after a sign-in.

   `kind` is 'python' or 'html'.
*/
(function (root) {
    'use strict';

    /* ---------- local-storage backend (guests) ---------- */
    function lkey(kind) { return 'bhs_code_projects_' + kind; }
    function readAll(kind) {
        try {
            var raw = localStorage.getItem(lkey(kind));
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }
    function writeAll(kind, list) {
        try { localStorage.setItem(lkey(kind), JSON.stringify(list)); }
        catch (e) { /* quota - silent */ }
    }
    function uid() {
        return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }
    var LocalBackend = {
        list: function (kind) {
            var arr = readAll(kind).slice();
            arr.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
            return Promise.resolve(arr.map(function (p) {
                return { id: p.id, name: p.name, updatedAt: p.updatedAt };
            }));
        },
        get: function (kind, id) {
            var found = readAll(kind).find(function (p) { return p.id === id; });
            return Promise.resolve(found || null);
        },
        create: function (kind, name, starter) {
            var p = {
                id: uid(),
                name: (name || 'Untitled').trim() || 'Untitled',
                code: starter || '',
                updatedAt: Date.now(),
            };
            var arr = readAll(kind);
            arr.push(p);
            writeAll(kind, arr);
            return Promise.resolve(p);
        },
        updateCode: function (kind, id, code) {
            var arr = readAll(kind);
            var i = arr.findIndex(function (p) { return p.id === id; });
            if (i < 0) return Promise.resolve();
            arr[i].code = code;
            arr[i].updatedAt = Date.now();
            writeAll(kind, arr);
            return Promise.resolve();
        },
        updateName: function (kind, id, name) {
            var arr = readAll(kind);
            var i = arr.findIndex(function (p) { return p.id === id; });
            if (i < 0) return Promise.resolve();
            arr[i].name = (name || '').trim() || arr[i].name;
            arr[i].updatedAt = Date.now();
            writeAll(kind, arr);
            return Promise.resolve();
        },
        remove: function (kind, id) {
            var arr = readAll(kind).filter(function (p) { return p.id !== id; });
            writeAll(kind, arr);
            return Promise.resolve();
        },
    };

    /* ---------- cloud backend (signed-in students) ---------- */
    function authHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var t = window.SiteAuth && window.SiteAuth.getToken && window.SiteAuth.getToken();
        if (t) h['Authorization'] = 'Bearer ' + t;
        return h;
    }
    function api(method, url, body) {
        return fetch(url, {
            method: method,
            headers: authHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        }).then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok) {
                    var err = new Error((data && data.error) || ('HTTP ' + res.status));
                    err.status = res.status;
                    throw err;
                }
                return data;
            }).catch(function (e) {
                if (e && e.status) throw e;
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return {};
            });
        });
    }
    var CloudBackend = {
        list: function (kind) { return api('GET', '/api/code-projects/' + kind); },
        get: function (kind, id) {
            return api('GET', '/api/code-projects/' + kind + '/' + encodeURIComponent(id))
                .catch(function (e) { if (e.status === 404) return null; throw e; });
        },
        create: function (kind, name, starter) {
            return api('POST', '/api/code-projects/' + kind, { name: name, code: starter || '' });
        },
        updateCode: function (kind, id, code) {
            return api('PUT', '/api/code-projects/' + kind + '/' + encodeURIComponent(id), { code: code });
        },
        updateName: function (kind, id, name) {
            return api('PUT', '/api/code-projects/' + kind + '/' + encodeURIComponent(id), { name: name });
        },
        remove: function (kind, id) {
            return api('DELETE', '/api/code-projects/' + kind + '/' + encodeURIComponent(id));
        },
        bulkImport: function (kind, projects) {
            return api('POST', '/api/code-projects/' + kind + '/import', { projects: projects });
        },
    };

    /* ---------- backend selection + change broadcasting ---------- */
    function isCloud() {
        return !!(window.SiteAuth && window.SiteAuth.isAuthenticated && window.SiteAuth.isAuthenticated());
    }
    function backend() { return isCloud() ? CloudBackend : LocalBackend; }

    var listeners = [];
    // Track the last broadcast mode so we only notify subscribers when the
    // backend actually flips between cloud and local. Without this, every
    // SiteAuth change (including the initial verify() resolving with the
    // same cached user) would re-fire onChange and bounce open editors back
    // to the dashboard mid-session — see PythonEditor.html / HTMLEditor.html
    // which use onChange to redirect when the backend switches.
    var lastMode = isCloud() ? 'cloud' : 'local';
    function emit() {
        var mode = isCloud() ? 'cloud' : 'local';
        if (mode === lastMode) return;
        lastMode = mode;
        var info = { mode: mode };
        listeners.slice().forEach(function (cb) { try { cb(info); } catch (_) {} });
    }

    if (window.SiteAuth && window.SiteAuth.onChange) {
        window.SiteAuth.onChange(function () { emit(); });
    } else {
        // SiteAuth might not have loaded yet; poll briefly.
        var tries = 0;
        var t = setInterval(function () {
            if (window.SiteAuth && window.SiteAuth.onChange) {
                clearInterval(t);
                // Re-sync lastMode now that SiteAuth has loaded — the cached
                // currentUser may have flipped isCloud() during the poll.
                lastMode = isCloud() ? 'cloud' : 'local';
                window.SiteAuth.onChange(function () { emit(); });
            } else if (++tries > 50) {
                clearInterval(t);
            }
        }, 100);
    }

    /* ---------- import-from-guest flow ---------- */
    function importFlagKey(kind) { return 'bhs_code_import_handled_' + kind; }

    function maybePromptImport(kind, prompter) {
        if (!isCloud()) return;
        var local = readAll(kind);
        if (!local.length) return;
        try { if (sessionStorage.getItem(importFlagKey(kind)) === '1') return; } catch (_) {}
        if (typeof prompter !== 'function') return;
        prompter({
            count: local.length,
            doImport: function () {
                try { sessionStorage.setItem(importFlagKey(kind), '1'); } catch (_) {}
                return CloudBackend.bulkImport(kind, local.map(function (p) {
                    return { name: p.name, code: p.code };
                })).then(function (r) {
                    // Only clear local copies that successfully transferred.
                    if (r && r.created && r.created.length === local.length) {
                        writeAll(kind, []);
                    }
                    return r;
                });
            },
            skip: function () {
                try { sessionStorage.setItem(importFlagKey(kind), '1'); } catch (_) {}
            },
        });
    }

    /* ---------- public API (all async) ---------- */
    root.CodeProjects = {
        list:       function (kind)             { return backend().list(kind); },
        get:        function (kind, id)         { return backend().get(kind, id); },
        create:     function (kind, name, code) { return backend().create(kind, name, code); },
        updateCode: function (kind, id, code)   { return backend().updateCode(kind, id, code); },
        updateName: function (kind, id, name)   { return backend().updateName(kind, id, name); },
        remove:     function (kind, id)         { return backend().remove(kind, id); },

        isCloud: isCloud,
        onChange: function (cb) {
            listeners.push(cb);
            return function () { listeners = listeners.filter(function (l) { return l !== cb; }); };
        },
        maybePromptImport: maybePromptImport,
    };
})(window);
