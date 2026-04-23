# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department. It provides interactive learning materials and tools for various computing science courses (National 5, Higher, Games Development, Cyber Security), aiming to enhance student engagement and understanding. Key capabilities include a Higher CS Revision App, interactive widgets, an AI quiz system, and specialized tools like a Paper Builder, Data Sculptor, and code editors with cloud synchronization. The platform seeks to be a comprehensive and interactive resource for students and teachers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform is a multi-page static website with a responsive, mobile-first design using vanilla CSS. It features dynamic sidebar navigation, image optimization, interactive educational widgets, and a content-based search. An accessibility panel provides customizable settings (high contrast, font size, OpenDyslexic font, text-to-speech). Code blocks include syntax highlighting, and interactive Python/HTML/CSS code runners are implemented using Pyodide and srcdoc iframes. Separate React + TypeScript SPAs are used for revision apps (`/revision/`, `/revision-n5/`) and the BHS Classwork app (`/classwork/`), offering student accounts, teacher dashboards, AI marking, and class management. The Data Sculptor (`/data-sculptor/`) provides a sandboxed database environment with Access-style design views for tables, forms, and reports, including a Lookup Wizard and Relationships View. Code editor tools (Python, HTML/CSS) feature personal project dashboards with local and cloud saving, and auto-save functionality.

### Backend Architecture
A Node.js/Express server serves static content, utilizing TypeScript for type safety. Security measures include blocking sensitive file access, implementing security headers, and disabling Express fingerprinting. A unified database schema manages student and class data, and content tables are shared across course levels using a `course` column. CRUD API endpoints are provided for content management and code projects. Authentication uses Bearer tokens for students and email/password for teachers, with a unified teacher dashboard login and site-wide student login managing sessions across different applications. Cross-app settings synchronization is handled via localStorage. The BHS Classwork app integrates AI marking for various question types, with support for manual override and re-marking.

### Core Features
- **Higher/N5 CS Revision Apps:** Separate React SPAs with student accounts, teacher dashboards, AI marking, and assignment tracking.
- **Paper Builder:** A native panel for teachers to create, edit, and manage exam papers, questions, and assignments.
- **Data Sculptor:** A sandboxed database tool providing personal multi-database dashboards for students (workspace mode) and advanced database design capabilities for teachers, including AI marking for SQL tasks.
- **Code Editor Project Dashboards:** Personal project management for Python and HTML/CSS editors with cloud synchronization.
- **BHS Classwork App:** A React SPA at `/classwork/` for AI-marked classwork across S1, S2, S3, N4, N5 and Higher. The teacher "Students & classes" page reads classes from BOTH `bhs_classes` (Higher revision app) and `n5_classes` (N5 revision app) — every class row carries a `source: 'bhs' | 'n5'` tag and per-class/student mutations dispatch to the correct table pair (`bhs_students` vs `n5_students`). When a teacher chooses a target class in the **same** year, the pupil is moved (record updated). When the target is a **different** year (e.g. promoting from N5 to Higher), the SPA automatically switches to a "copy" action: `POST /api/classwork/teacher/students/:id/copy-to-class` creates a brand-new login (fresh username + password) in the target class, leaving the original pupil and all their submissions intact in the source class so the old class can be archived. The "Move or copy" modal shows contextual helper text and a button that re-labels itself ("Move student" vs "Copy to new class") based on the chosen target. Cross-source same-year moves still work; cross-source moves are no longer blocked because they go through the copy path. Each class also has an `is_archived` boolean (added via idempotent `ALTER TABLE` to both `bhs_classes` and `n5_classes`); the SPA splits the Classes panel into an Active list and a separate collapsible Archived section, both year-grouped (Higher → N5 → N4 → S3 → S2 → S1 → No year set), all groups starting collapsed. Archive/unarchive is a per-row button on each class that PATCHes the existing `/api/classwork/teacher/classes/:id` endpoint with `{archived: true|false}`. Each class row also has a **Rename** button that opens a modal and PATCHes `{name}` to the same endpoint, and each student row has a **Rename** button that opens a username-input modal which PATCHes `/api/classwork/teacher/students/:id` with `{username}`. The student PATCH route now accepts either `{classId}` (move — same-year) and/or `{username}` (rename); usernames must match `^[a-z0-9][a-z0-9-]{2,31}$` and are checked against `usernameTakenAnywhere` so the same name cannot collide across `bhs_students` and `n5_students` (the underlying helper is `setStudentUsername` in `classwork-storage.ts`). Renaming a username never touches the password. Each lesson row in the teacher's Course view also has an **Edit** button that opens a modal with three fields — title, **learning intentions** and **success criteria** (free-form TEXT, one bullet per line). They live on `bhs_classwork_lessons` as new nullable columns `learning_intentions` and `success_criteria` (added via idempotent `ALTER TABLE` in `ensureClassworkSchema`), are written through the existing `PATCH /api/classwork/lessons/:id` route (now also accepts `learningIntentions` and `successCriteria`, with `null` clearing the field), and are fetched by the SPA via a new `GET /api/classwork/lessons/:id` endpoint (gated to published lessons for non-teachers). The Lesson page renders them at the top in a header card — LI in a blue panel and SC in a green one, side-by-side when both exist — visible to both teachers and students. The same lesson Edit modal also has a **Resources** section that lets teachers attach images, documents (PDF/DOCX/PPTX/etc.), YouTube videos and plain web links to a lesson; resources live on a new `bhs_classwork_lesson_resources` table (`id`, `lesson_id` FK with `ON DELETE CASCADE`, `kind ∈ {image,document,youtube,link}`, `title`, `url`, `order_index`) created idempotently in `ensureClassworkSchema`. Files are uploaded via a new teacher-only endpoint `POST /api/classwork/teacher/upload/resource` which reuses the broader 20 MB `projectUpload` multer preset and the existing `/classwork-uploads/` static dir; YouTube/link items are added by URL with no upload. Resource CRUD lives at `GET /api/classwork/lessons/:id/resources` (gated by published-lesson rule for non-teachers), `POST /api/classwork/lessons/:id/resources`, `PATCH /api/classwork/resources/:id`, `DELETE /api/classwork/resources/:id`. The Lesson page renders a `LessonResources` panel between the header card and "Questions" — YouTube items become a 16:9 embedded iframe (video ID extracted from watch?v=, youtu.be/, embed/, shorts/ URLs), images render inline with optional captions, and documents/links render as a single labelled action card that opens in a new tab. Supports text, multiple-choice, code, link (Scratch / MakeCode / Google Sites), file-upload (screenshot, project) and **presentation (.pptx)** question types with real-time AI feedback. Presentation questions accept a `.pptx` upload (sent through the existing `/api/classwork/upload/project` endpoint, 20 MB cap), with an optional rubric stored as `config.rubric: [{label, marks}]` (defaults to `[{label: 'Overall presentation quality', marks: max_marks}]` when omitted). The AI marker (`markPresentation` in `server/classwork-ai.ts`) reads the .pptx as a zip via `jszip`, extracts text from `ppt/slides/slide*.xml` and speaker notes from `ppt/notesSlides/notesSlide*.xml`, counts `<p:pic>` and `ppt/media/*` references, then sends a per-slide structured prompt to Gemini with the rubric and total cap. The marker honestly reports it cannot see slide layout, fonts or colours — only text, speaker notes and image counts. Uploads land in `public/classwork-uploads/` via `POST /api/classwork/upload/screenshot` and `POST /api/classwork/upload/project` (both require a student bearer token; 8 MB images / 20 MB project files). Teacher analytics live at `/classwork/#/analytics/:course` and call three teacher-only endpoints: `GET /api/classwork/:course/analytics/overview` (course-wide totals plus per-lesson and per-student stats), `GET /api/classwork/lessons/:lessonId/analytics` (per-question stats and best-attempt scores), and `GET /api/classwork/:course/students/:studentId/analytics` (one student's full submission history).
- **BHS Progress Tracker:** A unified SPA for teachers to view student progress across all courses.
- **Site-Wide Student Login:** A vanilla-JS component for consistent student authentication across the main site and SPAs.

## External Dependencies

### Database & ORM
- **Neon Serverless PostgreSQL**
- **Drizzle ORM**
- **Drizzle Kit**

### Authentication & Sessions
- **express-session**
- **connect-pg-simple**
- **bcrypt**

### Server Framework
- **Express.js**
- **TypeScript (tsx)**
- **CORS**
- **body-parser**

### Client-Side Code Execution
- **Pyodide**
- **CodeMirror**

### WebSocket Communication
- **ws**

### AI Services
- **Google Gemini API**