# BHS Code Runner — Developer Guide

## What is it?

The code runner is built on **Pyodide** — a full Python interpreter compiled to **WebAssembly** and run entirely inside the browser. There is no server involved when a student clicks Run. The Python code executes locally on the student's own device, inside the browser's sandboxed JavaScript environment.

For HTML/CSS examples, the runner uses a **sandboxed `<iframe>`** with the `srcdoc` attribute, which renders the student's HTML directly in the browser without any server round-trip.

---

## Is Python sandboxed?

Yes — in two layers:

1. **Browser sandbox** — WebAssembly runs inside the browser's security model. It cannot access the operating system, the network, other tabs, or any server files.
2. **Pyodide virtual filesystem** — Pyodide has its own in-memory virtual filesystem. Any file I/O (reading and writing files) happens in memory only and is wiped when the page is refreshed. No real files are ever created on the student's machine.

Students cannot use the runner to do anything harmful. It is equivalent in safety to any other JavaScript running on a web page.

---

## Available Python libraries

Because Pyodide includes CPython's full standard library, the following all work out of the box:

- `random`, `math`, `datetime`, `json`, `csv`, `os`, `sys`
- `dataclasses` (including `@dataclass`, `field`)
- `collections`, `itertools`, `functools`, `re`
- File I/O via Pyodide's virtual filesystem (`open`, `read`, `write`)

Third-party packages that Pyodide bundles (loaded automatically when imported):

- `numpy`, `pandas`, `matplotlib`, `scipy`
- `requests` (limited — no real network access)

The runner calls `pyodide.loadPackagesFromImports()` before every execution, so packages are downloaded and cached automatically the first time they are needed.

---

## How `input()` works

Python's built-in `input()` is synchronous (it blocks until the user types). Browsers cannot block JavaScript. To work around this, the runner uses a **replay approach**:

1. Code runs with a queue of previously-collected inputs.
2. When `input("Enter name: ")` is called:
   - The prompt is printed to the terminal.
   - If there is a queued answer, it is returned immediately.
   - If the queue is empty, a special error (`__INPUT_REQUIRED__`) is thrown.
3. The terminal catches the error, shows all output so far, and makes itself **editable** — the cursor appears at the end of the output text.
4. The student types their answer and presses Enter.
5. The answer is added to the queue and the **entire program re-runs from the beginning**, now with one more queued input available.
6. This repeats until the program completes.

The result is a seamless terminal experience where output and input appear interleaved in a single window, identical to how a real Python terminal looks.

---

## How to add a Python runner to an HTML page

### 1. Add the stylesheet in `<head>`

```html
<link rel="stylesheet" href="/CSS/codeRunner.css">
```

### 2. Add the script before `</body>`

```html
<script src="/JavaScript/codeRunner.js"></script>
```

### 3. Add the runner div anywhere in the page body

```html
<div class="py-runner">
    <textarea class="cr-code" style="display:none">
# Your Python code goes here
name = input("Enter your name: ")
print("Hello", name)
    </textarea>
</div>
```

The `<textarea>` holds the starter code. It is hidden from the user — `codeRunner.js` reads it on page load and builds the editor and terminal automatically.

**Full minimal page example:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Python Example</title>
    <link rel="stylesheet" href="/CSS/codeRunner.css">
</head>
<body>

    <h2>Try it out</h2>

    <div class="py-runner">
        <textarea class="cr-code" style="display:none">
total = 0
for i in range(1, 6):
    num = int(input("Enter number " + str(i) + ": "))
    total += num
print("Total:", total)
print("Average:", total / 5)
        </textarea>
    </div>

    <script src="/JavaScript/codeRunner.js"></script>
</body>
</html>
```

---

## How to add an HTML/CSS runner to a page

The HTML runner has three panels: a **file tree** on the left, a **code editor** in the middle, and a **live preview** on the right. The starter code in the `<textarea>` becomes `index.html` in the virtual filesystem.

**Single file** (starter code becomes `index.html`):

```html
<div class="html-runner">
    <textarea class="cr-code" style="display:none">
<!DOCTYPE html>
<html>
<head><title>My Page</title></head>
<body>
    <h1>Hello!</h1>
</body>
</html>
    </textarea>
</div>
```

**Multiple starter files** — add one `<textarea>` per file, each with a `data-filename` attribute:

```html
<div class="html-runner">
    <textarea class="cr-code" data-filename="index.html" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This page uses an external stylesheet.</p>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="style.css" style="display:none">
body {
    font-family: Arial, sans-serif;
    background: #f0f0f0;
}
h1 {
    color: navy;
}
    </textarea>
</div>
```

Each `<textarea>` becomes a separate file in the file tree. Students can see and edit all files, add more, and delete any they don't need. The `data-filename` attribute determines both the filename shown in the tree and the name used when resolving `<link href="...">` and `<script src="...">` references.

If no `data-filename` is given, the file defaults to `index.html`.

The same `codeRunner.css` and `codeRunner.js` files cover both runner types. You can have multiple runners of either type on the same page.

### Multi-file features

Students can create additional files using the **+ New file** button in the file tree panel:

- Typing `style.css` creates a CSS file — any `<link rel="stylesheet" href="style.css">` in the HTML is automatically inlined into the preview
- Typing `script.js` creates a JS file — any `<script src="script.js">` is automatically inlined
- Typing `page2.html` creates a second HTML page — `<a href="page2.html">` links inside the preview navigate to it

Files can be deleted by hovering over them in the file tree and clicking the × button (the last remaining file cannot be deleted).

### Image uploads

Students click **📷 Image** in the toolbar to upload image files from their device. Uploaded images appear as thumbnails in a strip below the toolbar. Writing `<img src="cat.jpg">` in the HTML will automatically use the uploaded `cat.jpg` — path prefixes like `images/cat.jpg` are also matched by filename alone.

---

## Multiple runners on one page

You can place as many `py-runner` and `html-runner` divs on a page as you like. Each one is independent — it has its own editor, its own terminal/preview, and its own input history. Pyodide itself is loaded only once (on the first Run click anywhere on the page) and then shared between all runners.

---

## Limitations

| Limitation | Detail |
|---|---|
| **No real networking** | `import requests` loads, but actual HTTP calls are blocked by the browser's security model |
| **No GUI libraries** | `tkinter`, `pygame` etc. do not work — there is no display |
| **Input replay** | Programs re-run from the beginning each time a new `input()` answer is given. Code with persistent side-effects between runs may behave unexpectedly, though this is rare in student-level code |
| **First load time** | Pyodide (~10 MB WebAssembly) loads from a CDN on the first Run click. Subsequent runs on the same page are instant. The CDN is cached by the browser after the first visit |
| **One active input at a time** | Only one runner can accept keyboard input at a time — this is handled automatically |

---

## Files

| File | Purpose |
|---|---|
| `JavaScript/codeRunner.js` | All runner logic — Pyodide loading, input system, terminal behaviour, HTML iframe runner |
| `CSS/codeRunner.css` | Styling for both runner types |

Both files are self-contained. They have no dependencies other than Pyodide itself (loaded from CDN).
