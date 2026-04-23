/* Site-wide login component for the BHS Computing Science platform.
   Shares the studentToken/studentTokenExpires localStorage keys with the
   Higher and N5 revision apps, so signing in here also signs the student
   into those apps and vice versa.

   Exposes window.SiteAuth:
     getUser()        → { studentId, username, className, mustChangePassword } | null
     getToken()       → string | null
     isAuthenticated()→ boolean
     onChange(cb)     → () => unsubscribe; cb(user)
     requireLogin(opts) → Promise<user>   (resolves once signed in; opens modal if needed)
     openLogin()      → opens the login modal
     logout()         → Promise<void>
*/
(function () {
    'use strict';

    if (window.SiteAuth) return; // guard against double-load

    var TOKEN_KEY = 'studentToken';
    var EXPIRES_KEY = 'studentTokenExpires';
    var USER_CACHE_KEY = 'siteAuthUserCache';
    var TEACHER_TOKEN_KEY = 'bhscs-teacher-token';
    var TEACHER_EMAIL_KEY = 'bhscs-teacher-auth-email';
    var TEACHER_EXPIRES_KEY = 'teacher_token_expires';

    function getTeacherSession() {
        try {
            var tok = localStorage.getItem(TEACHER_TOKEN_KEY) || localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken');
            if (!tok) return null;
            var exp = parseInt(localStorage.getItem(TEACHER_EXPIRES_KEY) || localStorage.getItem('teacherTokenExpires') || '0', 10);
            if (exp && Date.now() > exp) {
                clearTeacherSession();
                return null;
            }
            var email = localStorage.getItem(TEACHER_EMAIL_KEY) || 'Teacher';
            return { isTeacher: true, username: email };
        } catch (_) { return null; }
    }

    function clearTeacherSession() {
        try {
            localStorage.removeItem(TEACHER_TOKEN_KEY);
            localStorage.removeItem(TEACHER_EMAIL_KEY);
            localStorage.removeItem(TEACHER_EXPIRES_KEY);
            localStorage.removeItem('teacher_token');
            localStorage.removeItem('teacherToken');
            localStorage.removeItem('teacherTokenExpires');
        } catch (_) {}
    }

    var listeners = [];
    var currentUser = null;       // { studentId, username, className, mustChangePassword }
    var verifyPromise = null;     // dedupes verify() calls
    var loaded = false;           // becomes true after first verify completes

    /* ---------- CSS injection ---------- */
    function ensureCss() {
        if (document.getElementById('sa-css')) return;
        var link = document.createElement('link');
        link.id = 'sa-css';
        link.rel = 'stylesheet';
        link.href = '/CSS/siteAuth.css';
        document.head.appendChild(link);
    }

    /* ---------- helpers ---------- */
    function getToken() {
        try {
            var t = localStorage.getItem(TOKEN_KEY);
            if (!t) return null;
            var exp = parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10);
            if (exp && Date.now() > exp) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(EXPIRES_KEY);
                localStorage.removeItem(USER_CACHE_KEY);
                return null;
            }
            return t;
        } catch (_) { return null; }
    }

    function setSession(token, expiresAt, user) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(EXPIRES_KEY, String(expiresAt));
            if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        } catch (_) {}
    }

    function clearSession() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRES_KEY);
            localStorage.removeItem(USER_CACHE_KEY);
        } catch (_) {}
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](currentUser); } catch (_) {}
        }
    }

    function setUser(u) {
        var changed = JSON.stringify(currentUser) !== JSON.stringify(u);
        currentUser = u;
        if (changed) {
            renderBar();
            notify();
        }
    }

    /* ---------- network ---------- */
    function api(path, opts) {
        opts = opts || {};
        var headers = opts.headers || {};
        headers['Content-Type'] = 'application/json';
        var token = getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return fetch(path, {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
        }).then(function (res) {
            return res.json().then(function (data) {
                return { ok: res.ok, status: res.status, data: data };
            }).catch(function () {
                return { ok: res.ok, status: res.status, data: {} };
            });
        });
    }

    function verify() {
        if (verifyPromise) return verifyPromise;
        var token = getToken();
        if (!token) {
            loaded = true;
            setUser(null);
            return Promise.resolve(null);
        }
        verifyPromise = api('/api/student/verify', { method: 'POST' })
            .then(function (r) {
                verifyPromise = null;
                loaded = true;
                if (r.ok && r.data && r.data.valid) {
                    var u = {
                        studentId: r.data.studentId,
                        username: r.data.username,
                        className: r.data.className,
                        mustChangePassword: !!r.data.mustChangePassword,
                    };
                    try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)); } catch (_) {}
                    setUser(u);
                    return u;
                }
                clearSession();
                setUser(null);
                return null;
            })
            .catch(function () {
                verifyPromise = null;
                loaded = true;
                // Network failure: keep cached user if any so the UI stays usable.
                return currentUser;
            });
        return verifyPromise;
    }

    /* ---------- bar UI ---------- */
    var barEl = null;
    var menuEl = null;

    function ensureBar() {
        if (barEl && document.body.contains(barEl)) return;
        if (!document.body) return;
        barEl = document.createElement('div');
        barEl.className = 'sa-bar';
        document.body.appendChild(barEl);
        // Click-outside closes menu
        document.addEventListener('click', function (e) {
            if (!menuEl) return;
            if (barEl && barEl.contains(e.target)) return;
            menuEl.classList.remove('open');
        });
    }

    function renderBar() {
        ensureBar();
        if (!barEl) return;
        // Don't render anything until we've finished the initial verify;
        // avoids a "Log in" flash for already-signed-in students.
        if (!loaded) {
            barEl.innerHTML = '';
            return;
        }
        var teacher = !currentUser ? getTeacherSession() : null;
        if (teacher) {
            barEl.innerHTML =
                '<div style="position:relative; display:flex; gap:8px; align-items:center;">' +
                '  <a class="sa-pill sa-classwork-link" href="/classwork/" title="Open BHS Classwork" style="background:#1e40af;color:#fff;border:none;">' +
                '    <span>BHS Classwork</span>' +
                '  </a>' +
                '  <button class="sa-pill" id="saUserBtn" aria-haspopup="true">' +
                '    <span class="sa-dot"></span>' +
                '    <span>' + escapeHtml(teacher.username) + '</span>' +
                '  </button>' +
                '  <div class="sa-menu" id="saMenu" role="menu">' +
                '    <div class="sa-menu-meta">Signed in as <strong>' + escapeHtml(teacher.username) + '</strong><br>Teacher</div>' +
                '    <a class="sa-menu-item" href="/classwork/" style="display:block;text-decoration:none;color:inherit;">Open BHS Classwork</a>' +
                '    <button class="sa-menu-item" id="saLogout">Log out</button>' +
                '  </div>' +
                '</div>';
            menuEl = barEl.querySelector('#saMenu');
            barEl.querySelector('#saUserBtn').addEventListener('click', function (e) {
                e.stopPropagation();
                menuEl.classList.toggle('open');
            });
            barEl.querySelector('#saLogout').addEventListener('click', function () {
                logout();
            });
            return;
        }
        if (currentUser) {
            barEl.innerHTML =
                '<div style="position:relative; display:flex; gap:8px; align-items:center;">' +
                '  <a class="sa-pill sa-classwork-link" href="/classwork/" title="Open BHS Classwork" style="background:#1e40af;color:#fff;border:none;">' +
                '    <span>BHS Classwork</span>' +
                '  </a>' +
                '  <button class="sa-pill" id="saUserBtn" aria-haspopup="true">' +
                '    <span class="sa-dot"></span>' +
                '    <span>' + escapeHtml(currentUser.username) + '</span>' +
                '  </button>' +
                '  <div class="sa-menu" id="saMenu" role="menu">' +
                '    <div class="sa-menu-meta">' +
                '      Signed in as <strong>' + escapeHtml(currentUser.username) + '</strong>' +
                (currentUser.className ? '<br>Class: ' + escapeHtml(currentUser.className) : '') +
                '    </div>' +
                '    <a class="sa-menu-item" href="/classwork/" style="display:block;text-decoration:none;color:inherit;">Open BHS Classwork</a>' +
                '    <button class="sa-menu-item" id="saLogout">Log out</button>' +
                '  </div>' +
                '</div>';
            menuEl = barEl.querySelector('#saMenu');
            barEl.querySelector('#saUserBtn').addEventListener('click', function (e) {
                e.stopPropagation();
                menuEl.classList.toggle('open');
            });
            barEl.querySelector('#saLogout').addEventListener('click', function () {
                logout();
            });
        } else {
            barEl.innerHTML = '<button id="saLoginBtn">Log in</button>';
            barEl.querySelector('#saLoginBtn').addEventListener('click', function () {
                openLogin();
            });
            menuEl = null;
        }
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* ---------- modal ---------- */
    var pendingResolve = null;   // for requireLogin()
    var pendingReject = null;

    function closeModal() {
        var ov = document.getElementById('saOverlay');
        if (ov) ov.remove();
        if (pendingReject) {
            var r = pendingReject; pendingReject = null; pendingResolve = null;
            r(new Error('cancelled'));
        }
    }

    function openLogin(opts) {
        opts = opts || {};
        // If already signed in, just resolve the requireLogin promise (if any).
        if (currentUser) {
            if (pendingResolve) {
                var ok = pendingResolve; pendingResolve = null; pendingReject = null;
                ok(currentUser);
            }
            return;
        }
        var existing = document.getElementById('saOverlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.className = 'sa-overlay';
        overlay.id = 'saOverlay';
        overlay.innerHTML =
            '<div class="sa-modal" role="dialog" aria-modal="true" aria-labelledby="saTitle">' +
            '  <h2 id="saTitle">Log in</h2>' +
            '  <p class="sa-sub">' + escapeHtml(opts.message || 'Students: use your revision-app username and password. Teachers: use your Sandbox dashboard email and password.') + '</p>' +
            '  <form id="saLoginForm" autocomplete="on">' +
            '    <label for="saUsername">Username or email</label>' +
            '    <input id="saUsername" name="username" type="text" autocomplete="username" required>' +
            '    <label for="saPassword">Password</label>' +
            '    <input id="saPassword" name="password" type="password" autocomplete="current-password" required>' +
            '    <div class="sa-error" id="saError"></div>' +
            '    <div class="sa-actions">' +
            '      <button type="button" id="saCancel">Cancel</button>' +
            '      <button type="submit" class="sa-primary" id="saSubmit">Log in</button>' +
            '    </div>' +
            '  </form>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });
        overlay.querySelector('#saCancel').addEventListener('click', closeModal);
        overlay.querySelector('#saUsername').focus();

        overlay.querySelector('#saLoginForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var username = overlay.querySelector('#saUsername').value.trim();
            var password = overlay.querySelector('#saPassword').value;
            var errEl = overlay.querySelector('#saError');
            var btn = overlay.querySelector('#saSubmit');
            errEl.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Logging in…';

            var looksLikeEmail = username.indexOf('@') !== -1;

            function tryStudent() {
                return api('/api/student/login', {
                    method: 'POST',
                    body: { username: username, password: password }
                }).then(function (r) {
                    if (!r.ok) return false;
                    var d = r.data;
                    var expires = Date.now() + 24 * 60 * 60 * 1000;
                    var user = {
                        studentId: d.studentId,
                        username: d.username,
                        className: d.className,
                        mustChangePassword: !!d.mustChangePassword,
                    };
                    setSession(d.token, expires, user);
                    setUser(user);
                    if (user.mustChangePassword) {
                        renderChangePassword();
                    } else {
                        if (pendingResolve) {
                            var ok = pendingResolve; pendingResolve = null; pendingReject = null;
                            ok(user);
                        }
                        overlay.remove();
                    }
                    return true;
                });
            }

            function tryTeacher() {
                return api('/api/teacher-auth', {
                    method: 'POST',
                    body: { email: username, password: password }
                }).then(function (r) {
                    if (!r.ok || !r.data || !r.data.ok || !r.data.token) return false;
                    var tok = r.data.token;
                    var expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
                    try {
                        // Same keys the Sandbox dashboard / Classwork SPA use.
                        localStorage.setItem('bhscs-teacher-token', tok);
                        localStorage.setItem('bhscs-teacher-auth-email', username.toLowerCase());
                        localStorage.setItem('teacher_token', tok);
                        localStorage.setItem('teacher_token_expires', String(expires));
                        localStorage.setItem('teacherToken', tok);
                        localStorage.setItem('teacherTokenExpires', String(expires));
                    } catch (_) {}
                    overlay.remove();
                    // Reload so the host page can pick up the teacher state.
                    window.location.reload();
                    return true;
                });
            }

            var order = looksLikeEmail ? [tryTeacher, tryStudent] : [tryStudent, tryTeacher];

            function runOrder(i) {
                if (i >= order.length) {
                    errEl.textContent = 'Invalid username or password.';
                    btn.disabled = false;
                    btn.textContent = 'Log in';
                    return;
                }
                order[i]().then(function (ok) {
                    if (!ok) runOrder(i + 1);
                }).catch(function () {
                    runOrder(i + 1);
                });
            }
            runOrder(0);
        });

        function renderChangePassword() {
            overlay.querySelector('.sa-modal').innerHTML =
                '<h2>Set a new password</h2>' +
                '<p class="sa-sub">For your security, please choose a new password before continuing.</p>' +
                '<form id="saPwForm">' +
                '  <label for="saNewPw">New password</label>' +
                '  <input id="saNewPw" type="password" autocomplete="new-password" required>' +
                '  <label for="saNewPw2">Confirm new password</label>' +
                '  <input id="saNewPw2" type="password" autocomplete="new-password" required>' +
                '  <div class="sa-error" id="saPwError"></div>' +
                '  <div class="sa-actions">' +
                '    <button type="submit" class="sa-primary" id="saPwSubmit">Save</button>' +
                '  </div>' +
                '</form>';
            overlay.querySelector('#saNewPw').focus();
            overlay.querySelector('#saPwForm').addEventListener('submit', function (e) {
                e.preventDefault();
                var pw1 = overlay.querySelector('#saNewPw').value;
                var pw2 = overlay.querySelector('#saNewPw2').value;
                var err = overlay.querySelector('#saPwError');
                var b = overlay.querySelector('#saPwSubmit');
                err.textContent = '';
                if (pw1.length < 4) { err.textContent = 'Password must be at least 4 characters.'; return; }
                if (pw1 !== pw2) { err.textContent = 'Passwords do not match.'; return; }
                b.disabled = true; b.textContent = 'Saving…';
                api('/api/student/change-password', { method: 'POST', body: { newPassword: pw1 } })
                    .then(function (r) {
                        if (!r.ok) {
                            err.textContent = (r.data && r.data.error) || 'Could not save password.';
                            b.disabled = false; b.textContent = 'Save';
                            return;
                        }
                        var u = currentUser ? Object.assign({}, currentUser, { mustChangePassword: false }) : null;
                        if (u) {
                            try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)); } catch (_) {}
                            setUser(u);
                        }
                        if (pendingResolve) {
                            var ok = pendingResolve; pendingResolve = null; pendingReject = null;
                            ok(u);
                        }
                        overlay.remove();
                    })
                    .catch(function () {
                        err.textContent = 'Network error — please try again.';
                        b.disabled = false; b.textContent = 'Save';
                    });
            });
        }
    }

    function logout() {
        var token = getToken();
        var p = token
            ? api('/api/student/logout', { method: 'POST' }).catch(function () { /* ignore */ })
            : Promise.resolve();
        return p.then(function () {
            clearSession();
            clearTeacherSession();
            setUser(null);
            renderBar();
        });
    }

    function requireLogin(opts) {
        if (currentUser) return Promise.resolve(currentUser);
        return new Promise(function (resolve, reject) {
            pendingResolve = resolve;
            pendingReject = reject;
            openLogin(opts);
        });
    }

    /* ---------- cross-tab sync ---------- */
    window.addEventListener('storage', function (e) {
        if (!e || !e.key) return;
        if (e.key === TOKEN_KEY || e.key === EXPIRES_KEY) {
            verifyPromise = null;
            verify();
        }
    });

    /* ---------- public API ---------- */
    window.SiteAuth = {
        getUser: function () { return currentUser; },
        getToken: getToken,
        isAuthenticated: function () { return !!currentUser; },
        onChange: function (cb) {
            listeners.push(cb);
            // Fire immediately if we already have a known state
            if (loaded) { try { cb(currentUser); } catch (_) {} }
            return function () {
                listeners = listeners.filter(function (l) { return l !== cb; });
            };
        },
        requireLogin: requireLogin,
        openLogin: openLogin,
        logout: logout,
    };

    /* ---------- bootstrap ---------- */
    function init() {
        ensureCss();
        // Pre-populate from cached user so the bar renders correctly before verify completes
        try {
            var raw = localStorage.getItem(USER_CACHE_KEY);
            if (raw && getToken()) currentUser = JSON.parse(raw);
        } catch (_) {}
        ensureBar();
        renderBar();   // will be empty until loaded=true
        verify().then(renderBar);
        // Re-render when other tabs (e.g. the Classwork SPA) sign a teacher in/out
        window.addEventListener('storage', function (e) {
            if (!e || !e.key) return;
            if (e.key === TEACHER_TOKEN_KEY || e.key === 'teacher_token' || e.key === 'teacherToken') {
                renderBar();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
