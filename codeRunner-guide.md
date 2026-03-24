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

## How to add an HTML runner to a page

The HTML runner has three panels: a **file tree** on the left, a **code editor** in the middle, and a **live preview** on the right.

Each file in the runner is defined by a `<textarea class="cr-code">` element inside the runner div. The `data-filename` attribute sets the filename. The runner reads all of them on page load — nothing is packed together.

### Required includes

In `<head>`:
```html
<link rel="stylesheet" href="/CSS/codeRunner.css">
```

Before `</body>`:
```html
<script src="/JavaScript/codeRunner.js"></script>
```

---

### Example 1 — Single HTML file

The simplest case. One textarea, no `data-filename` needed (defaults to `index.html`).

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
    <p>This is my first web page.</p>
</body>
</html>
    </textarea>
</div>
```

---

### Example 2 — HTML + external CSS file

Two textareas, each with `data-filename`. The HTML references the CSS file by name with a `<link>` tag — the runner automatically inlines `style.css` into the preview before rendering.

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
    <p class="intro">This paragraph is styled using an external CSS file.</p>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="style.css" style="display:none">
body {
    font-family: Arial, sans-serif;
    background-color: #f0f4f8;
    margin: 40px;
}

h1 {
    color: #003366;
}

p.intro {
    color: #555;
    font-size: 1.1em;
}
    </textarea>
</div>
```

The file tree will show both `index.html` and `style.css`. Students click between them to edit each one.

---

### Example 3 — HTML + CSS + JavaScript

Three files. The HTML links to both a stylesheet and a script file. Both are inlined automatically before previewing.

```html
<div class="html-runner">
    <textarea class="cr-code" data-filename="index.html" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>Interactive Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Click Counter</h1>
    <p>You have clicked <span id="count">0</span> times.</p>
    <button onclick="increment()">Click me</button>
    <script src="script.js"></script>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="style.css" style="display:none">
body {
    font-family: Arial, sans-serif;
    text-align: center;
    margin-top: 60px;
}

button {
    padding: 10px 24px;
    font-size: 1em;
    cursor: pointer;
}
    </textarea>
    <textarea class="cr-code" data-filename="script.js" style="display:none">
var clicks = 0;

function increment() {
    clicks++;
    document.getElementById("count").textContent = clicks;
}
    </textarea>
</div>
```

---

### Example 4 — Multi-page website (HTML + CSS + second page)

Four files: a home page, an about page, a shared stylesheet, and a nav that links between pages. Clicking links inside the preview navigates between pages — the runner intercepts the click and loads the correct file.

```html
<div class="html-runner">
    <textarea class="cr-code" data-filename="index.html" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
    </nav>
    <main>
        <h1>Home Page</h1>
        <p>Welcome to my website. Click About to learn more.</p>
    </main>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="about.html" style="display:none">
<!DOCTYPE html>
<html>
<head>
    <title>About</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
    </nav>
    <main>
        <h1>About Page</h1>
        <p>This is the about page. Click Home to go back.</p>
    </main>
</body>
</html>
    </textarea>
    <textarea class="cr-code" data-filename="style.css" style="display:none">
body {
    font-family: Arial, sans-serif;
    margin: 0;
}

nav {
    background: #003366;
    padding: 12px 20px;
    display: flex;
    gap: 20px;
}

nav a {
    color: white;
    text-decoration: none;
    font-weight: bold;
}

nav a:hover {
    text-decoration: underline;
}

main {
    padding: 40px;
}
    </textarea>
</div>
```

---

### Rules and notes

| Rule | Detail |
|---|---|
| **Entry point** | The preview always renders `index.html` first. If there is no `index.html`, the first `.html` file in the list is used. |
| **No `data-filename`** | A textarea without `data-filename` is treated as `index.html`. |
| **File naming** | Use `.html`, `.css`, or `.js` extensions. The file tree icon changes automatically based on extension. |
| **CSS inlining** | `<link rel="stylesheet" href="name.css">` is replaced by an inline `<style>` block before rendering. Only filename is matched — path prefixes like `css/style.css` are stripped. |
| **JS inlining** | `<script src="name.js"></script>` is replaced by an inline `<script>` block before rendering. Same path-stripping rule applies. |
| **Page navigation** | `<a href="page2.html">` clicks inside the preview are intercepted and load the matching file. Anchor links (`#section`) and external URLs work normally. |
| **Reset button** | Returns all files to their original starter content and removes any uploaded images. |
| **Student additions** | Students can add extra files with **+ New file** and delete files by hovering and clicking ×. The last file cannot be deleted. |

### Image uploads

Students click **📷 Image** in the toolbar to select one or more image files from their device. Uploaded images appear as thumbnails in a strip below the toolbar. Any `<img src="filename.jpg">` in the HTML that matches an uploaded filename is automatically substituted with a data URL before rendering — no server upload required. Path prefixes (`images/cat.jpg`) are stripped, so only the filename needs to match.

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
