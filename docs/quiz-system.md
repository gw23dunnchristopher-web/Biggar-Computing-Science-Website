# BHS Computing Science — Quiz System

AI-marked quiz questions can be added to any lesson page. Students type their answer and click **Submit Answers**; the answer is sent to Gemini and feedback is shown immediately. No login is required.

---

## How it works

1. You add a `<div class="quiz-container">` anywhere inside the page's `<div class="contentContainer">`.
2. You define the questions in a `<script>` block using `window.QUIZ_CONFIG` (or `window.QUIZ_CONFIGS` for multiple quizzes — see below).
3. `quiz.js` reads the config, renders the questions, and handles submission.
4. On submit, answers are sent to `/api/quiz/mark` where Gemini marks them against your marking scheme and returns feedback.

---

## Basic setup — single quiz

Add the container div where you want the quiz to appear:

```html
<div class="quiz-container"></div>
```

Then add a `<script>` block (inside `<head>` or anywhere before `</body>`) with your questions:

```html
<script>
window.QUIZ_CONFIG = {
    questions: [
        {
            type: "paragraph",
            text: "What is an algorithm?",
            marks: 2,
            markingScheme: "Award 1 mark for 'a step-by-step solution to a problem'. Award 1 mark for stating it can be written in pseudocode, flowchart or structure diagram."
        }
    ]
};
</script>
```

---

## Multiple quizzes on one page

Give each container a unique `data-quiz-id` and use `window.QUIZ_CONFIGS` (plural):

```html
<div class="quiz-container" data-quiz-id="section1"></div>
<div class="quiz-container" data-quiz-id="section2"></div>

<script>
window.QUIZ_CONFIGS = {
    section1: {
        questions: [ /* ... */ ]
    },
    section2: {
        questions: [ /* ... */ ]
    }
};
</script>
```

Each quiz is fully independent — separate submit buttons and separate feedback areas.

---

## Question types

Every question object must have a `type`, `text`, `marks`, and `markingScheme`.

### `"paragraph"` — written answer

The student types a free-text answer in a plain textarea.

```javascript
{
    type: "paragraph",
    text: "Describe one advantage of using a structure diagram over a flowchart.",
    marks: 1,
    markingScheme: "Award 1 mark for any valid advantage, e.g. easier to read, less complex, shows hierarchy clearly."
}
```

### `"pseudocode"` — code / pseudocode answer

The student types in a code editor (monospaced font, Tab key inserts spaces).

```javascript
{
    type: "pseudocode",
    text: "Write pseudocode for a program that asks the user for two numbers and displays their sum.",
    marks: 3,
    markingScheme: "Award 1 mark for INPUT of two numbers. Award 1 mark for adding them together. Award 1 mark for displaying the result."
}
```

If the question text contains the phrase **"using a programming language of your choice"**, the textarea placeholder changes from *"Write your pseudocode here..."* to *"Write your code here..."* automatically.

### `"table"` — fill-in-the-table answer

The student fills in blank cells in a pre-built table. Cells with an empty string `""` become editable; all other cells are shown as fixed labels.

```javascript
{
    type: "table",
    text: "Complete the table to show the purpose of each construct.",
    marks: 3,
    markingScheme: "Award 1 mark per correct definition.",
    tableHeaders: ["Construct", "Purpose"],
    columnWidths: ["35%", "65%"],   // optional — omit for equal columns
    tableRows: [
        ["Variable",  ""],
        ["Constant",  ""],
        ["Loop",      ""]
    ]
}
```

Blanks can appear in any column — you can have the student fill in the left column instead:

```javascript
tableRows: [
    ["", "Stores a value that can change"],
    ["", "Stores a value that cannot change"]
]
```

---

## Question text formats

The `text` property is flexible. It supports four formats that can be combined freely in an array.

### Plain string

```javascript
text: "What does CPU stand for?"
```

Renders as a single paragraph.

### Array of paragraphs

```javascript
text: [
    "Read the program description below.",
    "A shop sells items at different prices. The program asks the user for the item name and price, then displays a receipt."
]
```

Each string in the array becomes a separate paragraph.

### Bullet list

Nest an array inside the outer array to create a bullet list:

```javascript
text: [
    "A program is needed that will:",
    ["Ask the user for a number", "Double the number", "Display the result"]
]
```

Renders as a paragraph followed by an unordered list.

### Table in question text

Use `{ type: "table", headers, rows }` to display a read-only table as part of the question. This is useful for showing a trace table or data that the student must refer to.

```javascript
text: [
    "Look at the trace table below and answer the question.",
    {
        type: "table",
        headers: ["Step", "Action", "total"],
        rows: [
            ["1", "total = 0",       "0"],
            ["2", "total = total + 5", "5"],
            ["3", "total = total + 3", "8"]
        ]
    },
    "What will be the value of total after step 3?"
]
```

### Image in question text

Use `{ type: "image", src, alt }` to embed an image as part of the question:

```javascript
text: [
    "Look at the flowchart below.",
    { type: "image", src: "/Images/N4/SDD/Design/flowExample.png", alt: "Calorie Counter Flowchart" },
    "Identify one input shown in the flowchart."
]
```

The image scales to fit on any screen size. Its `alt` text is sent to Gemini so the AI understands what the image represents when marking the answer.

#### Changing the image size

By default the image fills the full width of the question area. To make it smaller, add a `width` property using any valid CSS size:

```javascript
// Half width
{ type: "image", src: "/Images/N5/SDD/example.png", alt: "Example diagram", width: "50%" }

// Fixed pixel width
{ type: "image", src: "/Images/N5/SDD/example.png", alt: "Example diagram", width: "300px" }
```

The `width` value becomes a `max-width` on the image, so it will never exceed that size but will still shrink on smaller screens.

### Code block in question text

Use `{ type: "code", language, content }` to show a styled code box as part of the question. The code is also sent to Gemini as a fenced code block so the AI can reference it when marking.

```javascript
text: [
    "Study the Python code below and answer the question that follows.",
    {
        type: "code",
        language: "python",
        content: "total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)"
    },
    "What value will be displayed when this program runs?"
]
```

The `language` field adds a small label at the top of the box and is optional. Common values: `python`, `javascript`, `html`, `css`, `sql`. Leave it out for plain/pseudocode:

```javascript
{ type: "code", content: "SET total TO 0\nFOR i FROM 1 TO 5\n    SET total TO total + i\nEND FOR" }
```

---

## Marking scheme format

The `markingScheme` is a plain string sent directly to Gemini. Write it the same way you would on a teacher's mark scheme — Gemini follows it closely.

**Tips:**
- Be explicit: *"Award 1 mark for..."* rather than vague descriptions.
- List acceptable alternative answers: *"Accept: loop / iteration / repetition."*
- Specify what to ignore: *"Do not penalise incorrect spelling of technical terms."*
- For multi-mark questions, state what each mark is for separately.

You can also use the structured format with bullet points for clarity:

```javascript
markingScheme: "Award 1 mark for identifying the input (number of calories). Award 1 mark for describing the process (adding all values together). Award 1 mark for describing the output (displaying the total). Do not accept vague answers such as 'it does the calculation'."
```

---

## Complete example

Here is a full working example showing all three question types on one page:

```html
<!-- In the page body, inside .contentContainer -->
<div class="quiz-container"></div>

<!-- In <head> or before </body> -->
<script>
window.QUIZ_CONFIG = {
    questions: [
        {
            type: "paragraph",
            text: [
                "A program is required that will:",
                ["Ask the user for the price of an item", "Apply a 10% discount if the price is over £50", "Display the final price"]
            ],
            marks: 2,
            markingScheme: "Award 1 mark for identifying the input (item price). Award 1 mark for describing the process (checking if price > 50 and applying 10% discount). Award 1 mark for identifying the output (final price)."
        },
        {
            type: "pseudocode",
            text: "Write pseudocode for the program described above.",
            marks: 4,
            markingScheme: "Award 1 mark for INPUT of price. Award 1 mark for correct IF condition (price > 50). Award 1 mark for correct discount calculation (price = price * 0.9 or equivalent). Award 1 mark for OUTPUT of final price."
        },
        {
            type: "table",
            text: "Complete the table to identify the inputs, processes and outputs of the program.",
            marks: 3,
            markingScheme: "Award 1 mark each: Input = item price. Process = check if price > 50 and apply 10% discount. Output = final price.",
            tableHeaders: ["Category", "Description"],
            tableRows: [
                ["Input",   ""],
                ["Process", ""],
                ["Output",  ""]
            ]
        }
    ]
};
</script>
```

---

## Which pages already have quizzes

81 pages across N4, N5, and Higher have quizzes. Pages that cannot have quizzes are those that require the student to draw something (e.g. ERD diagrams, wireframes, website structure diagrams) — these have been left without a quiz intentionally.

---

## Limitations

| Limitation | Detail |
|---|---|
| No login required | Answers are not saved. Students must submit in one session. |
| Gemini marks the answer | Marking quality depends on the marking scheme you write. Vague schemes produce vague feedback. |
| Images sent as alt text | Gemini sees the image's `alt` description, not the actual image. Write a detailed `alt` so the AI understands the context. |
| No diagrams | Questions that require drawing (flowcharts, ERDs, wireframes) cannot be marked automatically. |
