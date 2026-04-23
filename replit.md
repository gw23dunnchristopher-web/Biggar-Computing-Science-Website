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
- **BHS Classwork App:** A React SPA at `/classwork/` for AI-marked classwork across S1, S2, S3, N4, N5 and Higher. The teacher "Students & classes" page reads classes from BOTH `bhs_classes` (Higher revision app) and `n5_classes` (N5 revision app) — every class row carries a `source: 'bhs' | 'n5'` tag and per-class/student mutations dispatch to the correct table pair (`bhs_students` vs `n5_students`). When a teacher chooses a target class in the **same** year, the pupil is moved (record updated). When the target is a **different** year (e.g. promoting from N5 to Higher), the SPA automatically switches to a "copy" action: `POST /api/classwork/teacher/students/:id/copy-to-class` creates a brand-new login (fresh username + password) in the target class, leaving the original pupil and all their submissions intact in the source class so the old class can be archived. The "Move or copy" modal shows contextual helper text and a button that re-labels itself ("Move student" vs "Copy to new class") based on the chosen target. Cross-source same-year moves still work; cross-source moves are no longer blocked because they go through the copy path. Supports text, multiple-choice, code, link (Scratch / MakeCode / Google Sites) and file-upload (screenshot, project) question types with real-time AI feedback. Uploads land in `public/classwork-uploads/` via `POST /api/classwork/upload/screenshot` and `POST /api/classwork/upload/project` (both require a student bearer token; 8 MB images / 20 MB project files). Teacher analytics live at `/classwork/#/analytics/:course` and call three teacher-only endpoints: `GET /api/classwork/:course/analytics/overview` (course-wide totals plus per-lesson and per-student stats), `GET /api/classwork/lessons/:lessonId/analytics` (per-question stats and best-attempt scores), and `GET /api/classwork/:course/students/:studentId/analytics` (one student's full submission history).
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