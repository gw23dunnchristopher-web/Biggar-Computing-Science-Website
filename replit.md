# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department, designed to provide interactive learning materials and tools for National 5, Higher, Games Development, and Cyber Security courses. It aims to be a comprehensive resource, enhancing students' understanding and engagement with computing science concepts through features like a Higher CS Revision App, interactive widgets, and an AI quiz system.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform is a multi-page static website with a responsive, mobile-first design using vanilla CSS. Key UI components include dynamic sidebar navigation, image optimization, interactive educational widgets (e.g., data representation converters), and a content-based search with scoped filtering. An accessibility panel with customizable settings (high contrast, font size, OpenDyslexic font, text-to-speech) is integrated. The platform supports syntax highlighting for code blocks, an AI quiz system, and interactive Python/HTML/CSS code runners using Pyodide and srcdoc iframes.

### Backend Architecture
The platform utilizes a Node.js/Express server to serve static content. TypeScript is used for type safety. Security measures include blocking access to sensitive files, implementing security headers, disabling Express fingerprinting, and denying dotfiles.

### Unified Student & Class Database
A unified database schema (`bhs_students`, `bhs_classes`) manages student and class data across different course levels (National 5, Higher) using a `course` column for separation. A unique constraint on `(username, course)` allows shared usernames.

### Unified Content Tables
All exam content (questions, papers, custom quizzes, assignments, sections, parts, resources) is stored in shared `bhs_*` tables with a `course` column (`'higher'` or `'n5'`). Both `revision-storage.ts` (Higher) and `n5-storage.ts` (N5) read/write these tables with appropriate `WHERE course=` filters. A shared `content-routes.ts` exposes `/api/content/*` CRUD endpoints (papers, questions, assignments, sections, parts) guarded by `requireTeacher`, consumed by the Paper Builder panel.

### Paper Builder (Sandbox Builder → Paper Builder tab)
A native panel in `tools/sandbox-builder.html` reachable via the "Paper Builder" nav item. Features a Higher/N5 course toggle and three sub-tabs: Papers (list, create, edit title, publish/unpublish, delete), Questions (read-only list with year/topic filters and expandable sub-question view), and Assignments (list, create with title+unit, edit, publish/unpublish, delete with cascade).

### Revision Sub-Apps
Separate React + TypeScript SPAs are provided for Higher CS Revision and N5 CS Revision, located at `/revision/` and `/revision-n5/` respectively. These apps include student accounts, teacher dashboards, AI marking, class management, and assignment tracking. Authentication for these apps uses Bearer tokens and is separate from the main site's authentication. A unified teacher dashboard login system allows single sign-on across all revision and data sculptor apps, with token exchange mechanisms.

### Data Sculptor
A sandboxed database tool, "Data Sculptor," is available at `/data-sculptor/`. The Database Sandbox tool page (`HTML/Tools/DatabaseSandbox.html`) embeds it in **workspace mode** (`/data-sculptor/?workspace=1`), which gives students a personal multi-database dashboard (create/open/delete blank databases). Workspace mode is detected in `ds-client/src/hooks/use-local-user.ts` via the `?workspace=1` URL flag (persisted to `sessionStorage` so navigation within the iframe keeps the mode), and uses a separate `student_workspace_id` localStorage UUID prefixed `student-workspace-` as the `userId` for all existing endpoints. The teacher-only "Student Sandboxes" tab is hidden when workspace mode is active. Single-template embed tokens (`?embed=<token>`) still work for assigned tasks with AI marking. It offers MS Access-style functionality, allowing teachers to create and manage student sandboxes, embed databases, and utilize AI marking for SQL tasks. It features SQL syntax highlighting and a focused embed view for student interaction. The Lookup Wizard (in Table Design View) supports both value-list dropdowns and table-based lookups with field selection, sort order, column width preview (shows real sample data fetched from the source table), and referential integrity (creates relationships via `ds_relationships`). When integrity is being enforced, the wizard refuses to finish if the source table is open in another tab (cross-tab "open tables" registry in `ds-client/src/lib/openTables.ts`). Lookup fields render as dropdowns in the datasheet view for both value-list and table-based sources. The Relationships View shows 1/∞ symbols at each table end of connector lines, supports right-click on a relationship line for "Edit Relationship…" / "Delete", and provides an Access-style Edit Relationships modal with Table/Field selectors, Enforce Referential Integrity / Cascade Update / Cascade Delete checkboxes, a Relationship Type selector, and a Join Type sub-dialog (3 inner/left/right options). Edits are persisted via `PUT /api/ds/databases/:dbId/relationships/:relId`. The `ds_relationships` table now stores `enforce_integrity`, `cascade_update`, `cascade_delete`, and `join_type` per relationship. Deleting a relationship is blocked if either endpoint table is open in another tab. Form and Report Design Views use a shared `AccessDesignCanvas` component (`access-design-canvas.tsx`) that replicates the Access design experience: sectioned layout (Form/Report Header, Page Header, Detail, Page Footer, Report Footer), dot-grid background, ruler, drag-and-drop labels and controls with 8-point resize handles, double-click inline label editing, section resize handles, and a Property Sheet panel. The View dropdown matches Access with Form View / Layout View / Design View for forms and Report View / Print Preview / Layout View / Design View for reports. Design ribbons include a Controls group (Label, Text Box, Image).

### Code Editor Project Dashboards
The Python Editor (`HTML/Tools/PythonEditor.html`) and HTML/CSS Editor (`HTML/Tools/HTMLEditor.html`) tool pages show a personal project dashboard when no `?project=<id>` query parameter is present. Students can create as many named projects as they like; each project is a single primary file (`main.py` or `index.html`). Opening a project navigates to `?project=<id>`, which loads the saved code into a runner element built dynamically and initialised via `window.CodeRunner.initPy` / `window.CodeRunner.initHtml` in `JavaScript/codeRunner.js`. The editor auto-saves on `input` (600 ms debounce). The tool header shows a "← Projects" back link and the project name (click to rename). Dashboard styles live in `CSS/codeProjects.css`.

`JavaScript/codeProjects.js` provides a single async API (`list`, `get`, `create`, `updateCode`, `updateName`, `remove`) backed by two interchangeable stores:
- **Local** (guests / signed-out users): `localStorage` keys `bhs_code_projects_python` / `bhs_code_projects_html`.
- **Cloud** (signed-in students): `/api/code-projects/:kind` CRUD endpoints in `server/code-projects-routes.ts`, persisted to the `bhs_code_projects` table (caps: 100 projects per kind per student, 1 MB per project, guarded by `requireStudent` Bearer auth).

Backend selection is driven by `window.SiteAuth.isAuthenticated()`. The helper subscribes to `SiteAuth.onChange` and re-broadcasts via `CodeProjects.onChange(cb)` so the editor pages re-render the dashboard (or bounce out of the editor) when the student signs in or out in any tab. After sign-in, `CodeProjects.maybePromptImport(kind, prompter)` offers a one-time prompt to copy the student's local guest projects into their account via `POST /api/code-projects/:kind/import`; the answer is remembered via a `sessionStorage` flag.

### Data Sculptor Workspace Cloud Sync
In workspace mode (the embed used by the Database Sandbox tool page), `ds-client/src/hooks/use-local-user.ts` first looks for `studentToken` in `localStorage`. If present and verified via `POST /api/student/verify`, the active `userId` becomes `student-<studentId>` so the same dashboard follows the student across devices. Without a token the existing per-browser `student-workspace-<uuid>` id is used (guests still work without an account). The hook also listens for `studentToken` `storage` events so logging in/out in another tab re-resolves the active id.

A companion hook `useWorkspaceTransfer(activeUserId)` checks whether any guest databases are still sitting under the old `student-workspace-<uuid>` id; if so, the Home page shows a one-time prompt offering to copy them onto the student's account. The transfer is performed by `POST /api/ds/workspace/transfer` (registered by `server/ds-workspace-routes.ts`), which requires student auth, only accepts a `fromUserId` starting with `student-workspace-`, and updates `ds_databases.user_id` and `ds_embeds.user_id` to `student-<studentId>` derived from the bearer token. A `GET /api/ds/workspace/transfer-info` endpoint returns the count without modifying anything. A `sessionStorage` flag prevents the prompt from re-appearing once answered.

### BHS Progress Tracker
A unified progress tracking SPA at `/progress/` provides teachers with a consolidated view of student progress across all courses, including class lists, student result timelines, and visual bar charts.

### Site-Wide Student Login (`JavaScript/siteAuth.js`, `CSS/siteAuth.css`)
A small vanilla-JS component that mounts a fixed login pill in the top-right of every static page on the main site. It is auto-loaded by the existing bootstrap scripts (`script.js`, `higherScript.js`, `N4Script.js`, `indexScript.js`) — no per-page edits required. It reuses the existing `/api/student/login`, `/api/student/verify`, `/api/student/change-password`, `/api/student/logout` endpoints and stores the session under the same `studentToken` / `studentTokenExpires` localStorage keys the Higher and N5 revision SPAs use, so signing in on the main site automatically signs the student into the revision apps and vice versa (cross-tab `storage` event keeps the bar in sync). The login modal handles the "must change password" first-login flow. Exposes a global `window.SiteAuth` API (`getUser`, `getToken`, `isAuthenticated`, `onChange`, `requireLogin`, `openLogin`, `logout`) for tool pages to gate cloud-sync features behind a logged-in student. Login remains entirely optional — guests (e.g. visitors from other schools) can use every tool without an account.

### Cross-App Settings Synchronization
Settings like dark/light mode (`vite-ui-theme`) and accessibility settings (`a11y-settings`) are synchronized across the main website, revision apps, and Data Sculptor using localStorage and `storage` event listeners for a consistent user experience.

## External Dependencies

### Database & ORM
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL.
- **Drizzle ORM**: Type-safe database queries.
- **Drizzle Kit**: Database migrations and schema management.

### Authentication & Sessions
- **express-session**: Session management middleware.
- **connect-pg-simple**: PostgreSQL session store.
- **bcrypt**: Password hashing.

### Server Framework
- **Express.js**: Web application framework.
- **TypeScript (tsx)**: Runtime TypeScript execution.
- **CORS**: Cross-origin resource sharing.
- **body-parser**: Request body parsing.

### Client-Side Code Execution
- **Pyodide**: WebAssembly-based Python runtime for browser-side execution.
- **CodeMirror**: In-browser code editor with syntax highlighting.

### WebSocket Communication
- **ws**: WebSocket library (server-side infrastructure).

### AI Services
- **Google Gemini API**: For AI quiz marking and feedback.