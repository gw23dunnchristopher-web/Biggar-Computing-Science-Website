/*
 * BHS Computing Science - Quiz Engine
 *
 * Usage: embed a <div class="quiz-container"> on any lesson page.
 * Configure it via window.QUIZ_CONFIG before this script runs, or via
 * a data-quiz attribute containing JSON.
 *
 * window.QUIZ_CONFIG = {
 *   title: "Check Your Understanding",   // optional, default shown
 *   questions: [
 *     {
 *       type: "paragraph",               // "paragraph" | "pseudocode" | "table"
 *       text: "Question text here",
 *       marks: 2,
 *       markingScheme: "Award 1 mark for X. Award 1 mark for Y."
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

    function initQuiz() {
        const containers = document.querySelectorAll('.quiz-container');
        containers.forEach(function (container) {
            var config = window.QUIZ_CONFIG;

            // Also support inline JSON via data attribute
            if (!config && container.dataset.quiz) {
                try { config = JSON.parse(container.dataset.quiz); } catch (e) {}
            }

            if (!config || !config.questions || !config.questions.length) {
                container.innerHTML = '<p style="color:#888;font-style:italic;">No quiz questions configured.</p>';
                return;
            }

            renderQuiz(container, config);
        });
    }

    function renderQuiz(container, config) {
        var title = config.title || 'Check Your Understanding';
        var questions = config.questions;

        var html = '<div class="quiz-section">';
        html += '<h2>' + escHtml(title) + '</h2>';

        questions.forEach(function (q, i) {
            html += renderQuestion(q, i);
        });

        html += '<button class="quiz-submit-btn" id="quiz-submit-btn">Submit Answers</button>';
        html += '<div id="quiz-feedback-area"></div>';
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

        document.getElementById('quiz-submit-btn').addEventListener('click', function () {
            submitQuiz(container, config);
        });
    }

    function renderQuestion(q, index) {
        var num = index + 1;
        var marksLabel = q.marks === 1 ? '1 mark' : q.marks + ' marks';
        var html = '<div class="quiz-question" id="quiz-q-' + index + '">';
        html += '<div class="quiz-question-header">';
        html += '<span class="quiz-question-number">Q' + num + '.</span>';
        html += '<span class="quiz-question-text">' + escHtml(q.text) + '</span>';
        html += '<span class="quiz-marks">(' + marksLabel + ')</span>';
        html += '</div>';

        if (q.type === 'pseudocode') {
            html += '<textarea class="quiz-code-area" id="quiz-ans-' + index + '" placeholder="Write your pseudocode here..." spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>';
        } else if (q.type === 'table') {
            html += renderTableInput(q, index);
        } else {
            // default: paragraph
            html += '<textarea class="quiz-textarea" id="quiz-ans-' + index + '" placeholder="Type your answer here..."></textarea>';
        }

        html += '</div>';
        return html;
    }

    function renderTableInput(q, index) {
        var html = '<div class="quiz-table-wrapper"><table class="quiz-table">';

        if (q.tableHeaders && q.tableHeaders.length) {
            html += '<thead><tr>';
            q.tableHeaders.forEach(function (h) {
                html += '<th>' + escHtml(h) + '</th>';
            });
            html += '</tr></thead>';
        }

        html += '<tbody>';
        (q.tableRows || []).forEach(function (row, rowIndex) {
            html += '<tr>';
            row.forEach(function (cell, colIndex) {
                if (cell === '') {
                    html += '<td><input type="text" class="quiz-table-input" data-qindex="' + index + '" data-row="' + rowIndex + '" data-col="' + colIndex + '" placeholder="..."></td>';
                } else {
                    html += '<td class="given-cell">' + escHtml(cell) + '</td>';
                }
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    function collectAnswers(container, questions) {
        return questions.map(function (q, index) {
            if (q.type === 'table') {
                // Collect all blank cells for this question
                var inputs = container.querySelectorAll('.quiz-table-input[data-qindex="' + index + '"]');
                var cells = [];
                inputs.forEach(function (inp) {
                    cells.push({
                        row: parseInt(inp.dataset.row),
                        col: parseInt(inp.dataset.col),
                        value: inp.value.trim()
                    });
                });
                // Build a full table for Gemini to see
                var tableStr = buildTableString(q, cells);
                return { type: q.type, text: q.text, answer: tableStr };
            } else {
                var ta = document.getElementById('quiz-ans-' + index);
                return { type: q.type, text: q.text, answer: ta ? ta.value.trim() : '' };
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

    function submitQuiz(container, config) {
        var btn = document.getElementById('quiz-submit-btn');
        var feedbackArea = document.getElementById('quiz-feedback-area');

        // Validate — check at least something is filled in
        var answers = collectAnswers(container, config.questions);
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
                    text: q.text,
                    type: q.type,
                    marks: q.marks,
                    markingScheme: q.markingScheme,
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
            renderResults(feedbackArea, data, config.questions);
        })
        .catch(function (err) {
            btn.disabled = false;
            feedbackArea.innerHTML = '<div class="quiz-error">Something went wrong while marking your answers. Please try again.</div>';
            console.error('Quiz marking error:', err);
        });
    }

    function renderResults(feedbackArea, data, questions) {
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

        html += '<button class="quiz-retry-btn" id="quiz-retry-btn">Try Again</button>';
        html += '</div>';

        feedbackArea.innerHTML = html;

        document.getElementById('quiz-retry-btn').addEventListener('click', function () {
            feedbackArea.innerHTML = '';
            var btn = document.getElementById('quiz-submit-btn');
            if (btn) btn.disabled = false;
            // Clear all answers
            document.querySelectorAll('.quiz-textarea, .quiz-code-area').forEach(function (ta) {
                ta.value = '';
            });
            document.querySelectorAll('.quiz-table-input').forEach(function (inp) {
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
