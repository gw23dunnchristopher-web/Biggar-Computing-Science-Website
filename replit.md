# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department. It provides interactive learning materials and tools for various computing science courses (National 5, Higher, Games Development, Cyber Security), aiming to enhance student engagement and understanding. Key capabilities include a Higher CS Revision App, interactive widgets, an AI quiz system, and specialized tools like a Paper Builder, Data Sculptor, and code editors with cloud synchronization. The platform seeks to be a comprehensive and interactive resource for students and teachers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform features a multi-page static website with a responsive, mobile-first design using vanilla CSS. It includes dynamic sidebar navigation, image optimization, interactive educational widgets, content search, and an accessibility panel. Code blocks have syntax highlighting, and interactive Python/HTML/CSS code runners are implemented using Pyodide and srcdoc iframes.
Separate React + TypeScript Single Page Applications (SPAs) are used for revision apps (`/revision/`, `/revision-n5/`), the BHS Classwork app (`/classwork/`), and the Data Sculptor (`/data-sculptor/`). These SPAs offer student accounts, teacher dashboards, AI marking, class management, and sandboxed database environments with Access-style design views. Code editor tools include personal project dashboards with local and cloud saving, and auto-save functionality.

### Backend Architecture
A Node.js/Express server, built with TypeScript, serves static content and provides CRUD API endpoints for content management and code projects. Security measures include blocking sensitive file access, implementing security headers, and disabling Express fingerprinting. A unified database schema manages student and class data, with content tables shared across course levels. Authentication uses Bearer tokens for students and email/password for teachers, with unified logins and cross-app settings synchronization via localStorage. The BHS Classwork app integrates AI marking for various question types (text, multiple-choice, code, link, file-upload, presentation, video), supporting manual override and re-marking. It also includes features for managing student classes (move/copy, archive, rename) and lesson resources (images, documents, YouTube, links, embeds) with robust CRUD operations. Visual marking for presentations is optionally supported using LibreOffice and Gemini Vision.

### Core Features
- **Higher/N5 CS Revision Apps:** React SPAs with student accounts, teacher dashboards, AI marking, and assignment tracking.
- **Paper Builder:** Teacher tool for creating, editing, and managing exam papers, questions, and assignments.
- **Data Sculptor:** Sandboxed database tool with personal multi-database dashboards and advanced database design capabilities for teachers, including AI marking for SQL tasks.
- **Code Editor Project Dashboards:** Personal project management for Python and HTML/CSS editors with cloud synchronization.
- **BHS Classwork App:** A React SPA for AI-marked classwork across multiple year levels. It includes comprehensive teacher tools for class and student management (move, copy, archive, rename), lesson editing (learning intentions, success criteria), and per-question resource attachment (images, documents, YouTube, links, embeds; the legacy lesson-level resource panel has been retired — every resource now lives on a specific question). Supports various question types, including specific integrations for Python, HTML, and SQL tasks, and introduces "extension activity" flagging. Also supports general-purpose types ported from the revision apps: **info_only** (non-interactive note, no answer area, no marks, hidden from analytics), **fill_in_blanks** (prompt with `{{id}}` placeholders rendered as inline inputs; config: `{ blanks: [{ id, accept: [...] }] }`), **table** (a 2D grid where teachers mark cells as fixed text or blank-with-accepted-answers; config: `{ table: { headers: [...], rows: [[{ value } | { blank: true, accept: [...] }]] } }`), and **labeled_inputs** (multiple labelled fields per question; config: `{ fields: [{ label, accept: [...] }] }`). All three are marked in `server/classwork-ai.ts` via a shared `gradeCellList` engine: each cell is either exact-match (case- and whitespace-insensitive against `accept[]`) or AI-judged (teacher writes a per-cell `aiGuidance` note instead of an accept list — all such cells in one submission are batched into a single Gemini call returning `{ <cellKey>: { correct, feedback } }`). Final mark is scaled `correct/total * max_marks`; pupils submit a JSON object in `text_answer` keyed by blank id / `"r,c"` / field index. The Analytics page has a **Download Excel** button that calls a teacher-only `GET /api/classwork/:course/analytics/export.xlsx` endpoint (in `server/classwork-export.ts`, dynamically imported, built with `exceljs`) returning a multi-sheet workbook (Overview, Lessons, Students, Questions, Lesson scores) with frozen headers, navy header styling, and green data-bar conditional formatting on every "Average %" / "Percent" column so each cell renders as a built-in horizontal bar chart. Native Excel chart objects are not generated (exceljs doesn't write them) — teachers can use Excel's *Insert → Chart* on the formatted tables for further pivots.
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