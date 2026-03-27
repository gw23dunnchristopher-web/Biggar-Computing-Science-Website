(function () {

    var PY_KW = ['False','None','True','and','as','assert','async','await',
        'break','class','continue','def','del','elif','else','except','finally',
        'for','from','global','if','import','in','is','lambda','nonlocal','not',
        'or','pass','raise','return','try','while','with','yield'];
    var PY_BI = ['abs','bool','dict','enumerate','filter','float','format',
        'getattr','hasattr','input','int','isinstance','issubclass','len','list',
        'map','max','min','open','print','range','repr','reversed','self','set',
        'setattr','sorted','str','sum','super','tuple','type','zip'];

    var SQL_KW = ['SELECT','FROM','WHERE','UPDATE','SET','CREATE','INSERT',
        'DELETE','DROP','TABLE','INTO','VALUES','JOIN','INNER','OUTER','LEFT',
        'RIGHT','ORDER','BY','GROUP','HAVING','AS','DISTINCT','AND','OR','NOT',
        'IN','IS','NULL','COUNT','SUM','AVG','MAX','MIN','LIKE','BETWEEN',
        'EXISTS','ON','PRIMARY','KEY','FOREIGN','REFERENCES','ALTER','ADD'];

    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ── Python line tokeniser ─────────────────────────────────────────── */
    function hlPyLine(line) {
        var out = '', i = 0;
        while (i < line.length) {
            var ch = line[i];
            if (ch === '#') {
                out += '<span class="cbh-comment">' + esc(line.slice(i)) + '</span>';
                return out;
            }
            if (ch === '"' || ch === "'") {
                var q = ch, j = i + 1;
                while (j < line.length) {
                    if (line[j] === '\\') { j += 2; continue; }
                    if (line[j] === q)    { j++; break; }
                    j++;
                }
                out += '<span class="cbh-string">' + esc(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
                var j = i;
                while (j < line.length && /[0-9.]/.test(line[j])) j++;
                out += '<span class="cbh-number">' + esc(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            if (/[a-zA-Z_]/.test(ch)) {
                var j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                var word = line.slice(i, j);
                if (PY_KW.indexOf(word) !== -1) {
                    out += '<span class="cbh-keyword">' + esc(word) + '</span>';
                } else if (PY_BI.indexOf(word) !== -1) {
                    out += '<span class="cbh-builtin">' + esc(word) + '</span>';
                } else {
                    out += esc(word);
                }
                i = j; continue;
            }
            out += esc(ch);
            i++;
        }
        return out;
    }

    /* ── SQL line tokeniser ────────────────────────────────────────────── */
    function hlSqlLine(line) {
        var out = '', i = 0;
        while (i < line.length) {
            var ch = line[i];
            if (ch === "'" || ch === '"') {
                var q = ch, j = i + 1;
                while (j < line.length && line[j] !== q) j++;
                j++;
                out += '<span class="cbh-string">' + esc(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            if ((ch === '-' && line[i + 1] === '-') || ch === '#') {
                out += '<span class="cbh-comment">' + esc(line.slice(i)) + '</span>';
                return out;
            }
            if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
                var j = i;
                while (j < line.length && /[0-9.]/.test(line[j])) j++;
                out += '<span class="cbh-number">' + esc(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            if (/[a-zA-Z_]/.test(ch)) {
                var j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                var word = line.slice(i, j);
                if (SQL_KW.indexOf(word.toUpperCase()) !== -1) {
                    out += '<span class="cbh-keyword">' + esc(word) + '</span>';
                } else {
                    out += esc(word);
                }
                i = j; continue;
            }
            out += esc(ch);
            i++;
        }
        return out;
    }

    /* ── Language auto-detection ───────────────────────────────────────── */
    function detectLang(text) {
        var u = text.toUpperCase();
        var sqlHits = 0;
        ['SELECT ', 'FROM ', 'WHERE ', 'UPDATE ', 'CREATE TABLE',
         'INSERT INTO', 'DELETE FROM', 'SET '].forEach(function (kw) {
            if (u.indexOf(kw) !== -1) sqlHits++;
        });
        if (sqlHits >= 2) return 'sql';

        var pyHits = 0;
        ['print(', 'input(', 'def ', 'import ', 'elif ', 'True', 'False',
         'None', ':\n', ':  ', ': #'].forEach(function (kw) {
            if (text.indexOf(kw) !== -1) pyHits++;
        });
        if (pyHits >= 1) return 'python';

        return 'plain';
    }

    /* ── Extract indent from padding-left style (20 px = 4 spaces) ─────── */
    function getIndent(el) {
        var pl = el.style.paddingLeft;
        if (!pl) return '';
        var px = parseInt(pl, 10);
        if (isNaN(px) || px <= 0) return '';
        var n = Math.round(px / 5);
        var s = '';
        for (var k = 0; k < n; k++) s += ' ';
        return s;
    }

    /* ── Safely extract one line of code from a <p> element ─────────────
     * Handles two problems in the source HTML:
     *   1. Content wrapped across multiple lines for HTML readability
     *      → split on \n, trim each segment, rejoin with a space
     *   2. &nbsp; used for indentation (stored as \u00a0 in textContent)
     *      → replaced with regular spaces so the highlighter sees them      */
    function extractLineText(el) {
        var parts = el.textContent.split('\n')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
        return parts.join(' ').replace(/\u00a0/g, ' ');
    }

    /* ── Transform a single .codeBox div ──────────────────────────────── */
    function transform(box) {
        if (box.querySelector('.cb-body')) return; /* already done */
        var paras = box.querySelectorAll('p');
        if (!paras.length) return;

        var lines = [];
        Array.from(box.children).forEach(function (el) {
            if (el.tagName === 'P') {
                lines.push(getIndent(el) + extractLineText(el));
            } else if (el.tagName === 'BR') {
                lines.push('');
            }
        });

        var lang = box.dataset.language || detectLang(lines.join('\n'));
        var hlLine = lang === 'python' ? hlPyLine
                   : lang === 'sql'    ? hlSqlLine
                   : esc;

        var nums = lines.map(function (_, i) { return i + 1; }).join('\n');
        var code = lines.map(hlLine).join('\n');

        box.innerHTML =
            '<div class="cb-body">' +
            '<pre class="cb-nums" aria-hidden="true">' + nums + '</pre>' +
            '<pre class="cb-code">' + code + '</pre>' +
            '</div>';
    }

    function init() {
        document.querySelectorAll('.codeBox').forEach(transform);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
