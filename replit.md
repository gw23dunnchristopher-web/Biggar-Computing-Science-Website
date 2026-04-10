# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department. Its primary purpose is to provide interactive learning materials and tools for National 5, Higher, Games Development, and Cyber Security courses. The platform aims to be a comprehensive resource, including a Higher CS Revision App, to enhance students' understanding and engagement with computing science concepts.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform is a multi-page static website, organized by course level, featuring a responsive design with a mobile-first approach using vanilla CSS. It includes dynamic sidebar navigation, image optimization, and interactive educational widgets for data representation (binary, floating-point, two's complement converters). A content-based search with scoped filtering allows users to find information efficiently.

**UI Components:**
- Fixed header with school branding.
- Collapsible sidebar navigation with nested menus.
- Sidebar search bars with case-insensitive, real-time filtering.
- Loading states and content transitions.
- Responsive layouts adapting to mobile, tablet, and desktop orientations.
- Accessibility panel with high contrast, custom colors, font size, line spacing, OpenDyslexic font, text-to-speech, reduced motion, reading guide, and color overlays, with settings persisted in localStorage.
- Syntax highlighting and line numbers for code blocks.
- Integrated AI quiz system for interactive question answering with immediate feedback.
- Python and HTML/CSS interactive code runners using Pyodide and srcdoc iframes.
- Next/Back navigation buttons on lesson pages.

### Backend Architecture
The platform uses a Node.js/Express server to serve static content. While infrastructure for an assignment system exists, it currently operates primarily as a static educational content site. TypeScript is used for type safety.

**Security:**
- Blocked access to sensitive files (server source, .git, .env, node_modules, config).
- Implemented security headers (X-Frame-Options, X-Content-Type-Options, XSS protection, Referrer-Policy, Permissions-Policy).
- Express fingerprinting is disabled.
- Dotfiles are denied by the static file server.

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

### Unified Student & Class Database
- `shared/bhs-schema.ts` defines `bhs_students` and `bhs_classes` — one table pair for all year groups, separated by a `course` column (`"n5"` | `"higher"` | `"n4"`).
- `revision-storage.ts` (Higher) imports `bhsStudents as students, bhsClasses as classes` from `bhs-schema`. All class/student reads/writes use the unified table with `course: 'higher'` automatically added.
- `n5-storage.ts` (N5) imports the same aliases. All class/student reads/writes use `course: 'n5'`. `getClasses()` filters by `course = 'n5'`; `getStudentByUsername` filters by `course = 'n5'`.
- Unique constraint: `(username, course)` pair — so Higher and N5 students can share the same username without conflict.
- Data migration: all rows from `rev_classes`/`rev_students` (Higher) and `n5_classes`/`n5_students` (N5) were copied into `bhs_classes`/`bhs_students` on 2026-04-10.

### Revision Sub-Apps
- **Higher CS Revision** at `/revision/` — React + TypeScript SPA; student accounts, teacher dashboard, AI marking, class management, assignment tracking. Build: `npm run build:revision` (Vite, `vite.revision.config.ts`, output `public/revision/`). Routes: `server/revision-routes.ts` + `server/revision-storage.ts`. DB schema: `shared/revision-schema.ts` (tables prefixed `rev_`). Auth: Bearer token in `rev_sessions`.
- **N5 CS Revision** at `/revision-n5/` — React + TypeScript SPA; same features as Higher app but for National 5. Build: `npm run build:n5` (Vite, `vite.n5.config.ts`, output `public/revision-n5/`). Routes: `server/n5-routes.ts` + `server/n5-storage.ts`, registered via `registerN5Routes(app)`. DB schema: `shared/n5-schema.ts` (tables prefixed `n5_`). N5 sidebar link updated to `/revision-n5/`. Questions need seeding.
- **Auth (both apps)**: Bearer token; no cookies (fully separate from BHS teacher auth).
- **Auth routing note**: Both apps originally registered `/api/teacher/login` — Higher's wins (first-registered). N5 has `/api/n5/teacher/login` and `/api/n5/teacher/verify`. N5 teacher sessions are DB-backed (written to `rev_sessions` table) and restored on server startup. N5's duplicate non-namespaced `GET /api/teacher/verify` was removed so that Higher's DB-based handler is the sole handler — both Higher and N5 SSO tokens live in `rev_sessions`, so both verify correctly through the same endpoint.
- **Unified dashboard login**: Logging in to the Teacher Dashboard (`/api/teacher-auth`) automatically also logs in to both the Higher (`/api/teacher/login`) and N5 (`/api/n5/teacher/login`) revision APIs using the same credentials, storing `teacher_token`/`teacher_token_expires` and `teacherToken`/`teacherTokenExpires` in localStorage. Sign Out clears all three. The class manager login forms still exist as a fallback.
- **Teacher Dashboard** (`tools/sandbox-builder.html`): Simplified nav with four icons. Tool-nav items:
  - **Sandbox Builder** — file-tree editor + preview for Python/HTML sandbox exercises.
  - **Higher CS** — Full-page lazy-loaded iframe: `/revision/teacher/classes` (the entire Higher teacher dashboard embedded).
  - **N5 CS** — Full-page lazy-loaded iframe: `/revision-n5/teacher/classes` (the entire N5 teacher dashboard embedded).
  - **Analytics** — Tabbed panel: Higher → `/revision/teacher/progress`; N5 → `/revision-n5/teacher/analytics`.
  - The old Classes/Assignments/Past Papers separate nav items and the NP native question panel have been removed.
  - Auth tokens: Higher `teacher_token`/`teacher_token_expires`; N5 `teacherToken`/`teacherTokenExpires`. iframes load lazily after token-exchange resolves.
- **SSO**: Logging into the dashboard auto-logs into both revision apps via token exchange (`/api/revision-auth`, `/api/n5/revision-auth`). Reverse SSO: if already logged into the Higher Revision App (`teacher_token` present in localStorage), the dashboard auto-exchanges it for an outer token via `/api/teacher-auth/from-revision`, which also issues a fresh N5 token.
- **N5 active-exam bug fix**: `getActiveExamProgressByClass` in `server/n5-storage.ts` switched from raw SQL `ANY()` to Drizzle `inArray()` to avoid PostgreSQL array-type error.
- **N5 rename student**: `PATCH /api/teacher/students/:id/username` added to N5 routes and `updateStudentUsername` to N5 storage. N5 ClassManager UI unified to match Higher (two-panel layout, same dialogs, red accent, rename feature).
- **Data Sculptor** at `/data-sculptor/` — MS Access-style sandboxed database tool. Build: `npm run build:ds` (Vite, `vite.ds.config.ts`, output `public/data-sculptor/`). Routes: `server/ds-routes.ts`. DB schema: `shared/ds-schema.ts` (tables prefixed `ds_`). Frontend: `ds-client/`. Colours match BHS red scheme; dark/light mode synced via `vite-ui-theme` localStorage key (same as revision apps).
  - **Sandboxes**: Home page has two tabs — "My Databases" (personal work) and "Student Sandboxes". Sandboxes tab uses `ds-client/src/pages/SandboxesPage.tsx`. Creating a sandbox (`POST /api/ds/sandboxes`) creates a `dsDatabases` row with `taskDescription` and immediately generates a `dsEmbeds` token. The sandbox card shows the embed link and iframe code with copy buttons. Listing: `GET /api/ds/sandboxes?userId=...` joins databases with their embed tokens. Delete: `DELETE /api/ds/sandboxes/:dbId` removes everything atomically.
  - **EmbedView** (`ds-client/src/pages/EmbedView.tsx`): Fixed API URL (`/api/ds/embeds/:token`). Task description shown as a fixed amber banner at the top. "Submit for Marking" floating button (bottom-right) posts to `/api/ds/grade-database`. AI feedback shown in a collapsible panel above the button.
- **Teacher Dashboard Data Sculptor nav**: "Data Sculptor" icon added to `tools/sandbox-builder.html` sidebar. Higher CS and N5 CS iframes load `/teacher/dashboard` (not `/teacher/classes`).
- **Unified settings (cross-tab sync)**: Both revision apps and Data Sculptor share `"vite-ui-theme"` (dark/light) and `"a11y-settings"` localStorage keys. `storage` event listeners in all `theme-provider.tsx` files and `AccessibilityContext.tsx` propagate changes instantly across all tabs/apps including the main website. Default theme is `"light"` across all apps; `"system"` values are treated as `"light"` to prevent OS dark mode causing mismatches with the main site.
- **Main website dark mode**: `JavaScript/accessibility.js` now reads `vite-ui-theme` on startup and applies the `dark` class to `<html>`. The accessibility panel has a new "Dark Mode" toggle that writes to `vite-ui-theme`, keeping it in sync with the revision apps. Dark mode CSS added to `CSS/accessibility.css`.
- **Teacher SSO between revision apps**: Both `TeacherLogin.tsx` files now store tokens under both key-pairs (`teacher_token`/`teacher_token_expires` and `teacherToken`/`teacherTokenExpires`) on login. Both `App.tsx` files run a one-time startup sync to mirror whichever key-pair is already set. `getAuthHeaders` in `ClassProgress.tsx` and `TeacherAnalytics.tsx` also fall back to the other app's key. This means logging in once works in both apps.
- **Analytics unified design**: N5 `TeacherAnalytics.tsx` updated to match Higher's `ClassProgress.tsx` visual style — header now uses ghost back button + title (same layout), indigo accent colours replaced with neutral to match Higher's red/neutral theme.
- **Analytics bar charts**: Both `ClassProgress.tsx` (Higher) and `TeacherAnalytics.tsx` (N5) now include an SVG `ExamBarChart` component showing each student's average score as colour-coded vertical bars (green ≥70%, amber ≥40%, red otherwise). The chart appears between the stat summary cards and the student table, sorted by score descending.
- **Diagram answer input**: All `DiagramEditor` blocks in TimedExam.tsx and Revision.tsx (both apps) replaced with `DiagramImageInput` component — paste zone or file upload storing the image as a base64 `diagram_image` field. Server grading endpoint accepts `studentDiagramImage`. Component lives at `revision-client/src/components/ui/diagram-image-input.tsx` and `n5-client/src/components/ui/diagram-image-input.tsx`.
- **DS Sandbox AI Marking**: `dsDatabases` schema has `task_description` (nullable text) column. `POST /api/ds/grade-sandbox` endpoint accepts `{ databaseId, sql, results, taskDescription? }`, looks up the task description from the DB if not supplied, and calls Gemini to return feedback and a mark. `SQLView.tsx` shows a task description banner in student mode (if set), a purple "Submit for Marking" button (visible after running a query in student mode), and an AI Marking Feedback panel with the Gemini response. Teacher settings dialog in `DatabaseView.tsx` includes a textarea to set the task description.
- **DS SQL syntax highlighting**: Both `QueryDesignView.tsx` (light theme: blue keywords, dark-red strings, green numbers) and `SQLView.tsx` (dark VS Code theme: #569cd6 keywords, #ce9178 strings, #b5cea8 numbers) use a `highlightSQL()` tokeniser with an overlay pattern — a positioned `<div>` renders coloured HTML behind a transparent `<textarea>`, with scroll sync via `onScroll`. Line numbers gutter in `SQLView.tsx` stays in sync too.
- **DS EmbedView startup fix**: Embed sandboxes always start in `'datasheet'` view (no longer auto-opening the SQL editor). A new "SQL Query" button (Code2 icon) in the Create tab of `AccessRibbonTabs.tsx` calls `onCreateSqlQuery`, which creates a temporary query and navigates to the SQL editor on demand. This prop is optional; it is wired in `EmbedView.tsx` but absent in `DatabaseView.tsx` (teachers still use the Database Tools tab or direct URL).
- **CSS SQLImage fix**: Added `.SQLImage { width: 100%; max-width: 100%; height: auto }` to `CSS/styles.css` to override the global `table img { width: 120px }` rule that was shrinking SQL diagram images on tutorial pages.
- **Flowcharts.html heading**: Added missing `<h2>Past Paper Question</h2>` above the quiz container in `HTML/N5/SDD/Design/flowcharts.html`.

### AI Services
- **Google Gemini API**: For AI quiz marking and feedback.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: Secret for session encryption.
- `GOOGLE_TTS_KEY`: Optional, for Google Cloud Text-to-Speech.
- `TEACHER_EMAIL`: Optional, default teacher account email.
- `TEACHER_PASSWORD`: Optional, default teacher account password.