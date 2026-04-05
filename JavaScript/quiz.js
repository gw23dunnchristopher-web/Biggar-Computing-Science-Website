/*
 * BHS Computing Science - Quiz Engine
 *
 * Usage: embed a <div class="quiz-container"> on any lesson page.
 *
 * ── Single quiz (existing behaviour) ──────────────────────────────────────
 * Configure via window.QUIZ_CONFIG before this script runs:
 *
 * window.QUIZ_CONFIG = {
 *   questions: [
 *
 * ── Multiple quizzes on one page ──────────────────────────────────────────
 * Give each container a data-quiz-id attribute and define window.QUIZ_CONFIGS:
 *
 *   <div class="quiz-container" data-quiz-id="past2023"></div>
 *   <div class="quiz-container" data-quiz-id="past2024"></div>
 *
 *   window.QUIZ_CONFIGS = {
 *     past2023: { questions: [...] },
 *     past2024: { questions: [...] }
 *   };
 *
 * ── Config lookup order per container ─────────────────────────────────────
 *   1. data-quiz attribute  (inline JSON on the element)
 *   2. data-quiz-id         → window.QUIZ_CONFIGS[id]
 *   3. window.QUIZ_CONFIG   (single-quiz fallback)
 *
 * ── Question format ───────────────────────────────────────────────────────
 * window.QUIZ_CONFIG = {
 *   // Optional: hide "Q1.", "Q2." … labels on every question in this quiz
 *   hideNumbers: true,
 *
 *   questions: [
 *     {
 *       type: "paragraph",               // "paragraph" | "pseudocode" | "table"
 *
 *       // text can be a plain string:
 *       text: "Question text here.",
 *
 *       // OR an array for multiple paragraphs and/or bullet points:
 *       // text: [
 *       //   "First paragraph of the question.",
 *       //   "Second paragraph.",
 *       //   ["Bullet point one", "Bullet point two", "Bullet point three"]
 *       // ],
 *       // Each string item = paragraph. Each array item = a bullet list.
 *
 *       marks: 2,
 *       markingScheme: "Award 1 mark for X. Award 1 mark for Y.",
 *
 *       // Optional: start the question expanded (default is collapsed)
 *       collapsed: false,
 *
 *       // Optional: number sub-lists instead of using bullet points.
 *       // "1" → 1, 2, 3 …   "a" → a, b, c …   omit for bullets (default)
 *       numbering: "a",
 *
 *       // Optional: hide the "Q1." label on this question
 *       hideNumber: true
 *     },
 *     {
 *       type: "pseudocode",
 *       text: "Write pseudocode to...",
 *       marks: 3,
 *       markingScheme: "Award marks for: correct loop structure (1), ..."
 *     },
 *     {
 *       type: "table",
 *       text: "Complete the table:",
 *       marks: 4,
 *       markingScheme: "1 mark per correct row.",
 *       tableHeaders: ["Term", "Definition"],
 *       columnWidths: ["30%", "70%"],           // optional — omit for equal columns
 *       columnAlignments: ["left", "center"],   // optional — "left" | "center" | "right" per column
 *       tableRows: [
 *         ["Variable", ""],           // "" = blank cell student fills in
 *         ["Constant", ""],
 *         ["", "A named block of code"]  // can have blanks in any column
 *       ]
 *     }
 *   ]
 * };
 */

(function () {
    'use strict';

    /* Unique counter so multiple quiz containers on the same page get distinct IDs. */
    var quizCounter = 0;

    function initQuiz() {
        /* ── Ensure every quiz-container is inside #content ──────────────────
           Some pages place the quiz-container outside #content (e.g. after the
           closing </div> of the content column). If that happens, nav buttons
           appended to #content appear before the quiz visually, and the quiz
           doesn't align with the content column.  Moving the containers in
           fixes both ordering and centering without touching every HTML page. */
        var contentEl = document.getElementById('content');
        if (contentEl) {
            /* Prefer appending into .contentContainer so heading and body styles
               (e.g. .contentContainer h2) apply correctly to any relocated elements. */
            var targetEl = contentEl.querySelector('.contentContainer') || contentEl;
            document.querySelectorAll('.quiz-container').forEach(function (c) {
                if (!contentEl.contains(c)) {
                    /* Also relocate an immediately-preceding heading so it travels
                       with the container rather than being left stranded outside. */
                    var prevSib = c.previousElementSibling;
                    if (prevSib && /^H[2-4]$/.test(prevSib.tagName)) {
                        targetEl.appendChild(prevSib);
                    }
                    targetEl.appendChild(c);
                }
            });
        }

        const containers = document.querySelectorAll('.quiz-container');
        containers.forEach(function (container) {
            var config = null;

            // 1. Inline JSON on the element
            if (container.dataset.quiz) {
                try { config = JSON.parse(container.dataset.quiz); } catch (e) {}
            }

            // 2. Named config via data-quiz-id → window.QUIZ_CONFIGS[id]
            if (!config && container.dataset.quizId && window.QUIZ_CONFIGS) {
                config = window.QUIZ_CONFIGS[container.dataset.quizId] || null;
            }

            // 3. Fallback to single global config (existing behaviour)
            if (!config) {
                config = window.QUIZ_CONFIG || null;
            }

            if (!config || !config.questions || !config.questions.length) {
                container.innerHTML = '<p style="color:#888;font-style:italic;">No quiz questions configured.</p>';
                return;
            }

            var prefix = 'qz-' + (++quizCounter);
            renderQuiz(container, config, prefix);
        });
    }

    function renderQuiz(container, config, prefix) {
        var questions = config.questions;
        /* Auto-expand the sole question when a container has only one. */
        var autoExpand = questions.length === 1;

        var html = '<div class="quiz-section">';

        questions.forEach(function (q, i) {
            var hideNum = !!(config.hideNumbers || q.hideNumber);
            var effectiveQ = autoExpand ? Object.assign({}, q, { collapsed: false }) : q;
            html += renderQuestion(effectiveQ, i, prefix, hideNum);
        });

        html += '<button class="quiz-submit-btn">Submit Answers</button>';
        html += '<div class="quiz-feedback-area"></div>';
        html += '</div>';

        container.innerHTML = html;

        // Attach tab-key behaviour for code areas (insert spaces, not change focus)
        container.querySelectorAll('.quiz-code-area').forEach(function (ta) {
            ta.addEventListener('keydown', function (e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    var start = ta.selectionStart;
                    var end = ta.selectionEnd;
                    ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
                    ta.selectionStart = ta.selectionEnd = start + 4;
                }
            });
        });

        // Toggle question open/closed on header click
        container.querySelectorAll('.quiz-question-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var bodyId = btn.getAttribute('aria-controls');
                var body = container.querySelector('#' + bodyId);
                var isOpen = btn.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    btn.setAttribute('aria-expanded', 'false');
                    body.hidden = true;
                } else {
                    btn.setAttribute('aria-expanded', 'true');
                    body.hidden = false;
                }
            });
        });

        container.querySelector('.quiz-submit-btn').addEventListener('click', function () {
            submitQuiz(container, config, prefix);
        });
    }

    /* Get question text — supports both q.text (N5 format) and q.question (Higher format). */
    function getQuestionText(q) {
        return q.text !== undefined ? q.text : (q.question !== undefined ? q.question : '');
    }

    /* Flatten markingScheme to a plain string for sending to the server.
       Handles both string format and object format {text, points}. */
    function flattenMarkingScheme(ms) {
        if (!ms) return '';
        if (typeof ms === 'string') return ms;
        var result = ms.text ? String(ms.text) : '';
        if (ms.points && Array.isArray(ms.points)) {
            result += '\n' + ms.points.map(function (p) { return '- ' + p; }).join('\n');
        }
        return result;
    }

    /* Render a {type:"table", headers:[...], rows:[[...]]} object as HTML. */
    function renderTextTable(obj) {
        var html = '<table class="quiz-question-table">';
        if (obj.headers && obj.headers.length) {
            html += '<thead><tr>' + obj.headers.map(function (h) {
                return '<th>' + escHtml(String(h)) + '</th>';
            }).join('') + '</tr></thead>';
        }
        html += '<tbody>';
        (obj.rows || []).forEach(function (row) {
            html += '<tr>' + row.map(function (cell) {
                return '<td>' + escHtml(String(cell)) + '</td>';
            }).join('') + '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    /* Strip HTML tags to get plain text (used when sending to the AI marker). */
    function stripHtml(str) {
        return String(str).replace(/<[^>]*>/g, '');
    }

    /* ── Lightweight Python syntax highlighter ───────────────────────────────
     * Character-by-character tokeniser: handles strings, comments, numbers,
     * keywords and builtins without external dependencies.                   */
    var PY_KEYWORDS = ['False','None','True','and','as','assert','async','await',
        'break','class','continue','def','del','elif','else','except','finally',
        'for','from','global','if','import','in','is','lambda','nonlocal','not',
        'or','pass','raise','return','try','while','with','yield'];
    var PY_BUILTINS = ['abs','bool','dict','enumerate','filter','float','format',
        'getattr','hasattr','input','int','isinstance','issubclass','len','list',
        'map','max','min','open','print','range','repr','reversed','self','set',
        'setattr','sorted','str','sum','super','tuple','type','zip'];

    function highlightPyLine(line) {
        var out = '', i = 0;
        while (i < line.length) {
            var ch = line[i];
            /* comment */
            if (ch === '#') {
                out += '<span class="qqh-comment">' + escHtml(line.slice(i)) + '</span>';
                return out;
            }
            /* string */
            if (ch === '"' || ch === "'") {
                var q = ch, j = i + 1;
                while (j < line.length) {
                    if (line[j] === '\\') { j += 2; continue; }
                    if (line[j] === q)    { j++; break; }
                    j++;
                }
                out += '<span class="qqh-string">' + escHtml(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            /* number */
            if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
                var j = i;
                while (j < line.length && /[0-9.]/.test(line[j])) j++;
                out += '<span class="qqh-number">' + escHtml(line.slice(i, j)) + '</span>';
                i = j; continue;
            }
            /* identifier / keyword / builtin */
            if (/[a-zA-Z_]/.test(ch)) {
                var j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                var word = line.slice(i, j);
                if (PY_KEYWORDS.indexOf(word) !== -1) {
                    out += '<span class="qqh-keyword">' + escHtml(word) + '</span>';
                } else if (PY_BUILTINS.indexOf(word) !== -1) {
                    out += '<span class="qqh-builtin">' + escHtml(word) + '</span>';
                } else {
                    out += escHtml(word);
                }
                i = j; continue;
            }
            out += escHtml(ch);
            i++;
        }
        return out;
    }

    function highlightCode(text, language) {
        if (language === 'python') {
            return text.split('\n').map(highlightPyLine).join('\n');
        }
        return escHtml(text);
    }

    function renderText(text, numbering) {
        if (!Array.isArray(text)) {
            return '<p>' + String(text) + '</p>';
        }
        return text.map(function (item) {
            if (Array.isArray(item)) {
                var items = item.map(function (b) {
                    return '<li>' + String(b) + '</li>';
                }).join('');
                if (numbering) {
                    var typeAttr = numbering === 'a' ? ' type="a"' : ' type="1"';
                    return '<ol class="quiz-question-list"' + typeAttr + '>' + items + '</ol>';
                }
                return '<ul class="quiz-question-bullets">' + items + '</ul>';
            }
            if (item && typeof item === 'object' && item.type === 'table') {
                return renderTextTable(item);
            }
            if (item && typeof item === 'object' && item.type === 'image') {
                var wAttr = item.width ? ' style="max-width:' + escHtml(String(item.width)) + '"' : '';
                return '<img class="quiz-question-image" src="' + escHtml(item.src) + '" alt="' + escHtml(item.alt || '') + '"' + wAttr + '>';
            }
            if (item && typeof item === 'object' && item.type === 'code') {
                var lang = item.language ? escHtml(String(item.language)) : '';
                var langBadge = lang ? '<span class="qqc-lang">' + lang + '</span>' : '';
                var rawContent = String(item.content || '');
                var cLines = rawContent.split('\n');
                var nums = cLines.map(function (_, i) { return i + 1; }).join('\n');
                var highlighted = highlightCode(rawContent, item.language || '');
                return '<div class="quiz-question-code">' + langBadge +
                    '<div class="qqc-body">' +
                    '<pre class="qqc-nums" aria-hidden="true">' + nums + '</pre>' +
                    '<pre class="qqc-code">' + highlighted + '</pre>' +
                    '</div></div>';
            }
            return '<p>' + String(item) + '</p>';
        }).join('');
    }

    /* Flatten a text value to plain text for sending to the server. */
    function flattenText(text) {
        if (!Array.isArray(text)) return stripHtml(String(text));
        return text.map(function (item) {
            if (Array.isArray(item)) {
                return item.map(function (b) { return '- ' + stripHtml(String(b)); }).join('\n');
            }
            if (item && typeof item === 'object' && item.type === 'table') {
                var rows = [];
                if (item.headers && item.headers.length) rows.push(item.headers.join(' | '));
                (item.rows || []).forEach(function (row) { rows.push(row.join(' | ')); });
                return rows.join('\n');
            }
            if (item && typeof item === 'object' && item.type === 'image') {
                return '[Image: ' + (item.alt || item.src) + ']';
            }
            if (item && typeof item === 'object' && item.type === 'code') {
                return '```' + (item.language || '') + '\n' + String(item.content || '') + '\n```';
            }
            return stripHtml(String(item));
        }).join('\n');
    }

    function renderQuestion(q, index, prefix, hideNum) {
        var num = index + 1;
        var marksLabel = q.marks === 1 ? '1 mark' : q.marks + ' marks';
        var qId = prefix + '-q-' + index;
        var bodyId = prefix + '-body-' + index;
        var ansId = prefix + '-ans-' + index;

        var html = '<div class="quiz-question" id="' + qId + '">';

        // Determine initial collapsed state — default is collapsed (true) unless explicitly false
        var startCollapsed = q.collapsed !== false;
        var ariaExpanded = startCollapsed ? 'false' : 'true';
        var hiddenAttr = startCollapsed ? ' hidden' : '';

        // Clickable toggle header
        html += '<button type="button" class="quiz-question-toggle" aria-expanded="' + ariaExpanded + '" aria-controls="' + bodyId + '">';
        if (!hideNum) {
            html += '<span class="quiz-question-number">Q' + num + '.</span>';
        }
        html += '<span class="quiz-marks">(' + marksLabel + ')</span>';
        html += '<span class="quiz-chevron" aria-hidden="true">&#9656;</span>';
        html += '</button>';

        // Collapsible body
        html += '<div class="quiz-question-body" id="' + bodyId + '"' + hiddenAttr + '>';
        html += '<div class="quiz-question-text">' + renderText(getQuestionText(q), q.numbering) + '</div>';

        if (q.type === 'pseudocode') {
            var codePlaceholder;
            if (q.language) {
                codePlaceholder = 'Write your ' + q.language + ' here...';
            } else if (flattenText(getQuestionText(q)).toLowerCase().indexOf('using a programming language of your choice') !== -1) {
                codePlaceholder = 'Write your code here...';
            } else {
                codePlaceholder = 'Write your pseudocode here...';
            }
            html += '<textarea class="quiz-code-area" id="' + ansId + '" placeholder="' + codePlaceholder + '" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>';
        } else if (q.type === 'table') {
            html += renderTableInput(q, index, prefix);
        } else {
            html += '<textarea class="quiz-textarea" id="' + ansId + '" placeholder="Type your answer here..."></textarea>';
        }

        html += '</div>';
        html += '</div>';
        return html;
    }

    function renderTableInput(q, index, prefix) {
        var extraClass = q.tableClass ? ' ' + escHtml(q.tableClass) : '';
        var html = '<div class="quiz-table-wrapper"><table class="quiz-table' + extraClass + '">';

        if (q.columnWidths && q.columnWidths.length) {
            html += '<colgroup>';
            q.columnWidths.forEach(function (w) {
                html += '<col style="width:' + escHtml(String(w)) + '">';
            });
            html += '</colgroup>';
        }

        var alignments = q.columnAlignments || [];

        function colAlignStyle(colIndex) {
            var a = alignments[colIndex];
            return a ? ' style="text-align:' + escHtml(a) + '"' : '';
        }

        if (q.tableHeaders && q.tableHeaders.length) {
            html += '<thead><tr>';
            q.tableHeaders.forEach(function (h, colIndex) {
                html += '<th' + colAlignStyle(colIndex) + '>' + escHtml(h) + '</th>';
            });
            html += '</tr></thead>';
        }

        html += '<tbody>';
        (q.tableRows || []).forEach(function (row, rowIndex) {
            html += '<tr>';
            row.forEach(function (cell, colIndex) {
                var alignAttr = colAlignStyle(colIndex);
                if (cell === '') {
                    html += '<td' + alignAttr + '><textarea class="quiz-table-input" data-prefix="' + prefix + '" data-qindex="' + index + '" data-row="' + rowIndex + '" data-col="' + colIndex + '" placeholder="..." rows="3"></textarea></td>';
                } else {
                    html += '<td class="given-cell"' + alignAttr + '>' + escHtml(cell) + '</td>';
                }
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    function collectAnswers(container, questions, prefix) {
        return questions.map(function (q, index) {
            var qText = getQuestionText(q);
            if (q.type === 'table') {
                var inputs = container.querySelectorAll('.quiz-table-input[data-qindex="' + index + '"][data-prefix="' + prefix + '"]');
                var cells = [];
                inputs.forEach(function (inp) {
                    cells.push({
                        row: parseInt(inp.dataset.row),
                        col: parseInt(inp.dataset.col),
                        value: inp.value.trim()
                    });
                });
                var tableStr = buildTableString(q, cells);
                return { type: q.type, text: qText, answer: tableStr };
            } else {
                var ansId = prefix + '-ans-' + index;
                var ta = container.querySelector('#' + ansId);
                return { type: q.type, text: qText, answer: ta ? ta.value.trim() : '' };
            }
        });
    }

    function buildTableString(q, filledCells) {
        // Turn the table back into a readable string for Gemini
        var cellMap = {};
        filledCells.forEach(function (c) {
            cellMap[c.row + ',' + c.col] = c.value;
        });

        var rows = (q.tableRows || []).map(function (row, rowIndex) {
            return row.map(function (cell, colIndex) {
                if (cell === '') {
                    var v = cellMap[rowIndex + ',' + colIndex];
                    return '[Student answer: ' + (v || '(blank)') + ']';
                }
                return cell;
            }).join(' | ');
        });

        var header = q.tableHeaders ? q.tableHeaders.join(' | ') + '\n' : '';
        return header + rows.join('\n');
    }

    function submitQuiz(container, config, prefix) {
        var btn = container.querySelector('.quiz-submit-btn');
        var feedbackArea = container.querySelector('.quiz-feedback-area');

        // Validate — check at least something is filled in
        var answers = collectAnswers(container, config.questions, prefix);
        var allEmpty = answers.every(function (a) { return !a.answer || a.answer.replace(/[\s|:\[\]]/g, '') === ''; });
        if (allEmpty) {
            feedbackArea.innerHTML = '<div class="quiz-error">Please answer at least one question before submitting.</div>';
            return;
        }

        btn.disabled = true;
        feedbackArea.innerHTML = '<div class="quiz-loading"><span class="quiz-spinner"></span>Marking your answers&hellip;</div>';

        var payload = {
            questions: config.questions.map(function (q, i) {
                return {
                    text: flattenText(getQuestionText(q)),
                    type: q.type,
                    marks: q.marks,
                    markingScheme: flattenMarkingScheme(q.markingScheme),
                    answer: answers[i].answer
                };
            })
        };

        fetch('/api/quiz/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Server error ' + res.status);
            return res.json();
        })
        .then(function (data) {
            btn.disabled = false;
            renderResults(feedbackArea, container, data, config.questions);
        })
        .catch(function (err) {
            btn.disabled = false;
            feedbackArea.innerHTML = '<div class="quiz-error">Something went wrong while marking your answers. Please try again.</div>';
            console.error('Quiz marking error:', err);
        });
    }

    function renderResults(feedbackArea, container, data, questions) {
        var results = data.results || [];
        var totalMarks = questions.reduce(function (s, q) { return s + (q.marks || 0); }, 0);
        var awarded = results.reduce(function (s, r) { return s + (r.marksAwarded || 0); }, 0);
        var pct = totalMarks > 0 ? Math.round((awarded / totalMarks) * 100) : 0;

        var badgeClass = pct >= 70 ? 'pass' : pct >= 40 ? 'partial' : 'low';

        var html = '<div class="quiz-results">';
        html += '<div class="quiz-results-header">';
        html += '<span class="quiz-results-title">Your Results</span>';
        html += '<span class="quiz-score-badge ' + badgeClass + '">' + awarded + ' / ' + totalMarks + '</span>';
        html += '</div>';

        results.forEach(function (r, i) {
            var q = questions[i];
            var qMarks = q ? q.marks : 0;
            var scoreClass = r.marksAwarded >= qMarks ? 'full' : r.marksAwarded > 0 ? 'partial' : 'zero';
            var scoreLabel = r.marksAwarded + ' / ' + qMarks;

            html += '<div class="quiz-question-result">';
            html += '<div class="quiz-question-result-header">';
            html += '<span class="quiz-result-q-num">Q' + (i + 1) + '</span>';
            html += '<span class="quiz-result-score ' + scoreClass + '">' + scoreLabel + '</span>';
            html += '</div>';
            html += '<div class="quiz-result-feedback">' + escHtml(r.feedback || 'No feedback available.') + '</div>';
            html += '</div>';
        });

        html += '<button class="quiz-retry-btn">Try Again</button>';
        html += '</div>';

        feedbackArea.innerHTML = html;

        feedbackArea.querySelector('.quiz-retry-btn').addEventListener('click', function () {
            feedbackArea.innerHTML = '';
            var btn = container.querySelector('.quiz-submit-btn');
            if (btn) btn.disabled = false;
            // Clear all answers scoped to this container only
            container.querySelectorAll('.quiz-textarea, .quiz-code-area').forEach(function (ta) {
                ta.value = '';
            });
            container.querySelectorAll('.quiz-table-input').forEach(function (inp) {
                inp.value = '';
            });
            feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Initialise when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuiz);
    } else {
        initQuiz();
    }
})();
