# BHS Code Runner — Teacher Guide

---

## Overview

The site has two types of interactive code runner:

- **Python runner** (`py-runner`) — runs Python entirely in the browser using Pyodide (WebAssembly). No server involved. Supports `input()`, file I/O, and most of the standard library.
- **HTML runner** (`html-runner`) — renders HTML/CSS/JS live inside a sandboxed iframe. Supports multiple files, page navigation between HTML pages, image uploads, and inlined external CSS/JS.

Both runners show a **file tree** on the left when there is more than one file, letting students switch between and edit each file independently.

---

## Recommended workflow — the Sandbox Builder

For anything beyond a single short code snippet, the recommended approach is to **build and save a sandbox** using the teacher tool, then embed it in the lesson page with one line.

### Step 1 — Open the builder

Go to `/tools/sandbox-builder.html` and log in with the teacher password (default: `bhs-computing`; can be changed via the `TEACHER_PASSWORD` environment variable).

### Step 2 — Create a sandbox

Click **+ New** in the left panel. Fill in:

| Field | Purpose |
|---|---|
| **ID** | URL-safe name used in the embed code, e.g. `higher-filehandling-read`. Only letters, numbers, hyphens and underscores. |
| **Title** | Human-readable label shown in the sandbox list. |
| **Type** | `HTML / CSS / JS` or `Python + data files`. |

### Step 3 — Add your files

Use the file tree panel to build the sandbox:

- **+ file** — creates a new file. Name it with the correct extension (`.py`, `.html`, `.css`, `.js`, `.csv`, `.txt`). The builder provides a sensible starter template for each type.
- **⬆ Upload file** — imports a file from your computer directly. Ideal for CSV/TXT data files or images you have already prepared. The file content is stored verbatim.
- Click any filename to switch to it and edit it in the code editor.
- Hover over a filename to reveal the delete button.

**For Python sandboxes:** the file named `main.py` (or the first `.py` file if there is no `main.py`) is the one that runs when the student clicks Run. All other files (CSV, TXT, etc.) are written to Pyodide's virtual filesystem automatically before execution, so `open("data.csv", "r")` works exactly as expected.

**Folders are supported.** Name a file `data/scores.csv` and the runner creates the `data/` directory automatically. Students write `open("data/scores.csv", "r")` in their code and learn real file path syntax.

**For HTML sandboxes:** `index.html` is loaded first in the preview. Any `<link rel="stylesheet" href="style.css">` or `<script src="css/style.css">` tags are resolved against the other files in the sandbox — both flat filenames and folder paths work.

Folders are supported here too. Name a file `css/style.css` and the file tree shows a `css/` folder in the runner.

### Step 4 — Save

Click **💾 Save**. The sandbox is stored on the server in the `starters/` folder as a JSON file.

### Step 5 — Copy the embed code

After saving, the embed code appears at the bottom of the builder:

```html
<div class="py-runner" data-sandbox="your-sandbox-id"></div>
```

or

```html
<div class="html-runner" data-sandbox="your-sandbox-id"></div>
```

Paste this single line into your lesson page wherever you want the runner to appear. The runner fetches all the files from the server when the page loads — the lesson page itself stays clean.

### Managing existing sandboxes

The left panel lists every saved sandbox. Click one to open and edit it. Hover over it and click the bin icon to delete it. Changes are only saved when you click **💾 Save**.

---

## Embedding a sandbox in a lesson page

### Required includes (already in every lesson page)

In `<head>`:
```html
<link rel="stylesheet" href="/CSS/codeRunner.css">
```

Before `</body>`:
```html
<script src="/JavaScript/codeRunner.js"></script>
```

### The embed line

```html
<!-- Python sandbox -->
<div class="py-runner" data-sandbox="sandbox-id-here"></div>

<!-- HTML/CSS/JS sandbox -->
<div class="html-runner" data-sandbox="sandbox-id-here"></div>
```

That is the entire lesson-page change needed. You can embed as many sandboxes as you like on the same page — each is fully independent.

---

## Alternative — inline starter code (simple cases)

For short, single-file examples with no supporting data files, you can embed the starter code directly in the lesson page without using the sandbox builder. This avoids a network request and keeps everything in one file.

### Simple Python example

```html
<div class="py-runner">
    <textarea class="cr-code" style="display:none">
name = input("Enter your name: ")
print("Hello,", name)
    </textarea>
</div>
```

### Simple HTML example

```html
<div class="html-runner">
    <textarea class="cr-code" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Edit me and click Preview.</p>
</body>
</html>
    </textarea>
</div>
```

### Multiple inline files

Add one `<textarea>` per file, each with a `data-filename` attribute:

```html
<div class="html-runner">
    <textarea class="cr-code" data-filename="index.html" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>Styled Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome</h1>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="style.css" style="display:none">
body { font-family: Arial, sans-serif; background: #f0f4f8; }
h1   { color: #003366; }
    </textarea>
</div>
```

Each textarea becomes a separate file in the file tree. If `data-filename` is omitted, the file defaults to `index.html` (HTML runner) or `main.py` (Python runner).

**Use this approach for:** short demos, single-file examples, and cases where the code is simple enough to read comfortably in the HTML source.

**Use the sandbox builder for:** multi-file projects, examples that need data files (CSV, TXT), exercises you want to reuse across multiple pages, or anything where embedding the content inline would make the lesson page hard to read.

---

## Alternative — reference external files directly

If you have built a set of HTML/CSS/JS files locally and uploaded them to the server, you can reference them by path without going through the sandbox builder:

```html
<div class="html-runner"
     data-files="starters/my-lesson/index.html,
                 starters/my-lesson/style.css,
                 starters/my-lesson/about.html">
</div>
```

The runner fetches each URL in order, builds the virtual filesystem from their contents, and starts with the first `.html` file. This is useful when you already have a folder of static files on the server and just want to point at them directly.

---

## How the Python runner works

### `input()`

Python's `input()` is synchronous but browsers cannot block. The runner works around this with a **replay approach**:

1. The program runs. When `input()` is called and the queue is empty, execution stops and the terminal becomes editable.
2. The student types an answer and presses Enter.
3. The answer is queued and the **entire program re-runs from scratch**, this time with the answer available.
4. This repeats until the program finishes.

The student sees output and input interleaved naturally, exactly like a real terminal. Programs that rely on side-effects persisting between `input()` calls (very rare at this level) may behave unexpectedly.

### File I/O

Pyodide has an in-memory virtual filesystem. `open("data.csv", "r")` works exactly as in normal Python, but the file only exists in memory for the duration of the page session. When using a sandbox with data files, those files are written to the virtual filesystem before each run, so they are always available.

Subdirectories are fully supported. A sandbox file named `data/scores.csv` is created in the `data/` subdirectory automatically, and students access it with `open("data/scores.csv", "r")`. The file tree in the runner shows a collapsible `data/` folder — click it to expand and inspect the file.

Files written during execution (e.g. `open("results.txt", "w")`) also work and can be read back in the same session.

### Available libraries

Standard library — everything works including:
`random`, `math`, `datetime`, `json`, `csv`, `os`, `sys`, `re`, `collections`, `itertools`, `dataclasses`

Third-party (auto-loaded on first import):
`numpy`, `pandas`, `matplotlib`, `scipy`

### File tree

The file tree is shown automatically whenever a sandbox (or inline runner) has more than one file. The file marked **(runs)** is the main Python script. All other files can be clicked and edited — they are written to the virtual filesystem before each run.

---

## How the HTML runner works

### Layout

Three panels: **file tree** (left) · **code editor** (middle) · **live preview** (right).

Click **▶ Preview** to re-render. Click **⟳ Reset** to restore all files to their original starter content.

### CSS and JavaScript inlining

Before rendering, the runner scans `index.html` for:
- `<link rel="stylesheet" href="style.css">` → replaced by an inline `<style>` block using the contents of `style.css` from the virtual filesystem.
- `<script src="script.js"></script>` → replaced by an inline `<script>` block using the contents of `script.js`.

Only the filename is matched — path prefixes like `css/style.css` are stripped automatically.

### Page navigation and links

| Link type | Example | Behaviour in the preview |
|---|---|---|
| **Internal page link** | `<a href="about.html">` | Loads `about.html` from the virtual filesystem and re-renders the preview. Both files must exist in the runner. |
| **Jump / anchor link** | `<a href="#section2">` | Scrolls within the current preview page normally. |
| **External link** | `<a href="https://bbc.co.uk">` | Opens the URL in a new browser tab. The preview itself does not navigate away. |
| **Mailto link** | `<a href="mailto:a@b.com">` | Passes through to the browser's default mail handler. |

External links always open in a new tab regardless of whether `target="_blank"` is present — the preview iframe cannot navigate to external sites directly.

### Student additions

Students can add extra files using **+ New file** in the file tree and delete existing ones by hovering and clicking ×. The last remaining file cannot be deleted. The **⟳ Reset** button restores the sandbox to its original files.

### Image uploads

The **📷 Image** button in the toolbar lets students upload image files from their device. Any `<img src="photo.jpg">` in the HTML that matches an uploaded filename is automatically substituted with a data URL — no server upload required. Path prefixes are stripped, so only the filename needs to match.

---

## Existing sandboxes on this site

| Sandbox ID | Type | Used on |
|---|---|---|
| `higher-filehandling-read` | Python | Higher SDD / File Handling — reads `sample.txt` into parallel arrays |
| `higher-filehandling-write` | Python | Higher SDD / File Handling — writes user input to `results.txt`, reads it back |
| `higher-filehandling-csv` | Python | Higher SDD / File Handling — reads `marks.csv` with header row, calculates average |

---

## Limitations

| Limitation | Detail |
|---|---|
| **No real networking** | `import requests` loads, but actual HTTP calls are blocked by the browser's security model |
| **No GUI libraries** | `tkinter`, `pygame` etc. do not work — there is no display |
| **Input replay** | Programs re-run from scratch each time a new `input()` answer is given |
| **First load time** | Pyodide (~10 MB) loads from a CDN on the first Run click. Subsequent runs on the same page are instant. The browser caches it after the first visit |
| **Virtual filesystem is temporary** | Files written during a session are lost on page refresh. Sandbox data files are re-written before each run |

---

## Key files

| File | Purpose |
|---|---|
| `JavaScript/codeRunner.js` | All runner logic — Pyodide loading, input system, file tree, HTML runner, sandbox loading |
| `CSS/codeRunner.css` | Styling for both runner types |
| `tools/sandbox-builder.html` | Teacher tool for creating and managing sandboxes |
| `tools/runner-builder.html` | Utility to generate inline textarea code from uploaded files |
| `starters/*.json` | Saved sandbox files (one JSON per sandbox) |
| `server/index.ts` | Sandbox API routes (`GET/POST/DELETE /api/sandboxes/:name`) |
