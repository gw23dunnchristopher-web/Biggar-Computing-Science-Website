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
A sandboxed database tool, "Data Sculptor," is available at `/data-sculptor/`. The Database Sandbox tool page (`HTML/Tools/DatabaseSandbox.html`) embeds it in **workspace mode** (`/data-sculptor/?workspace=1`), which gives students a personal multi-database dashboard (create/open/delete blank databases). Workspace mode is detected in `ds-client/src/hooks/use-local-user.ts` via the `?workspace=1` URL flag (persisted to `sessionStorage` so navigation within the iframe keeps the mode), and uses a separate `student_workspace_id` localStorage UUID prefixed `student-workspace-` as the `userId` for all existing endpoints. The teacher-only "Student Sandboxes" tab is hidden when workspace mode is active. Single-template embed tokens (`?embed=<token>`) still work for assigned tasks with AI marking. It offers MS Access-style functionality, allowing teachers to create and manage student sandboxes, embed databases, and utilize AI marking for SQL tasks. It features SQL syntax highlighting and a focused embed view for student interaction. The Lookup Wizard (in Table Design View) supports both value-list dropdowns and table-based lookups with field selection, sort order, column width preview, and referential integrity (creates relationships via `ds_relationships`). Lookup fields render as dropdowns in the datasheet view for both value-list and table-based sources. The Relationships View shows 1/∞ symbols at each table end of connector lines. Form and Report Design Views use a shared `AccessDesignCanvas` component (`access-design-canvas.tsx`) that replicates the Access design experience: sectioned layout (Form/Report Header, Page Header, Detail, Page Footer, Report Footer), dot-grid background, ruler, drag-and-drop labels and controls with 8-point resize handles, double-click inline label editing, section resize handles, and a Property Sheet panel. The View dropdown matches Access with Form View / Layout View / Design View for forms and Report View / Print Preview / Layout View / Design View for reports. Design ribbons include a Controls group (Label, Text Box, Image).

### BHS Progress Tracker
A unified progress tracking SPA at `/progress/` provides teachers with a consolidated view of student progress across all courses, including class lists, student result timelines, and visual bar charts.

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