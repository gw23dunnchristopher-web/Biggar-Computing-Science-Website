# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department. It provides interactive learning materials and tools for various computing science courses (National 5, Higher, Games Development, Cyber Security), aiming to enhance student engagement and understanding. Key capabilities include a Higher CS Revision App, interactive widgets, an AI quiz system, and specialized tools like a Paper Builder, Data Sculptor, and code editors with cloud synchronization. The platform seeks to be a comprehensive and interactive resource for students and teachers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform utilizes a multi-page static website with a responsive, mobile-first design using vanilla CSS. It includes dynamic navigation, optimized images, interactive widgets, content search, and an accessibility panel. Code blocks feature syntax highlighting, and interactive Python/HTML/CSS code runners are implemented.
Separate React + TypeScript Single Page Applications (SPAs) are used for revision apps, the BHS Classwork app, and the Data Sculptor. These SPAs offer student accounts, teacher dashboards, AI marking, class management, and sandboxed database environments. Code editor tools include personal project dashboards with local and cloud saving.

### Backend Architecture
A Node.js/Express server, built with TypeScript, serves static content and provides CRUD API endpoints. Security measures include restricted file access, security headers, and disabled Express fingerprinting. A unified database schema manages student and class data. Authentication uses Bearer tokens for students and email/password for teachers, with unified logins and cross-app settings synchronization. The BHS Classwork app integrates AI marking for various question types (text, multiple-choice, code, link, file-upload, presentation, video), supporting manual override and re-marking. It also includes features for managing student classes and lesson resources. Visual marking for presentations is optionally supported using LibreOffice and Gemini Vision.

### Core Features
- **Higher/N5 CS Revision Apps:** React SPAs with student accounts, teacher dashboards, AI marking, assignment tracking, and multimodal diagram input/grading.
- **Paper Builder:** Teacher tool for creating, editing, and managing exam papers, questions, and assignments.
- **Data Sculptor:** Sandboxed database tool with personal multi-database dashboards and advanced database design capabilities for teachers, including AI marking for SQL tasks.
- **Code Editor Project Dashboards:** Personal project management for Python and HTML/CSS editors with cloud synchronization.
- **Classwork view-tracking + auto-saved drafts:** Pupils' lesson pages report viewed questions and auto-save in-progress answers across various question types.
- **Classwork fun activities:** Self-marked, in-lesson question types including crossword, word search, matching, and anagrams, with teacher editing and AI assistance for clue generation.
- **BHS Classwork App:** A React SPA for AI-marked classwork with comprehensive teacher tools for class/student management, lesson editing, per-unit thumbnails, and per-question resource attachment. It supports diverse question types including info_only, section_header, text_only, fill_in_blanks, table, and labeled_inputs, with AI-judged marking and Excel export functionality for analytics.
- **Per-student activity calendar:** An activity calendar on the Analytics page to visualize student engagement.
- **BHS Progress Tracker:** A unified SPA for teachers to view student progress across all courses.
- **Site-Wide Student Login:** A vanilla-JS component for consistent student authentication.
- **Site-Wide Accessibility Tools (classwork SPA):** The same floating Display-Settings button + slide-out panel that exists on the static site (`JavaScript/accessibility.js` + `CSS/accessibility.css`) and the n5 / revision / data-sculptor SPAs is now also mounted in the classwork SPA. The four React pieces (`AccessibilityContext.tsx`, `AccessibilityPanel.tsx`, `TTSHandler.tsx`, `ReadingGuide.tsx` in `classwork-client/src/components/`) are verbatim copies of the n5-client originals so the contract and behaviour stay identical across SPAs. They are wired in once at the root in `classwork-client/src/main.tsx` (wrapping `<App/>` in `<AccessibilityProvider>` and rendering the panel + TTS + reading-guide siblings outside the router so they survive route changes). All settings — `highContrast`, `fontSize`, `lineSpacing`, `dyslexiaFont`, `reducedMotion`, `colourOverlay`, `readingGuide`, `ttsEnabled`, `customTextColour`, `customBgColour` — are persisted in the shared `a11y-settings` localStorage key and the context's `storage` event listener immediately re-applies any change made on another page or another tab, so toggling e.g. dyslexia font on `/highercs/index.html` instantly takes effect on `/classwork/lesson/123` and vice-versa. `classwork-client/src/index.css` was extended to host the supporting CSS the panel needs: a Tailwind 4 `@theme inline` block that maps the shadcn-style HSL tokens (`--background`, `--foreground`, `--primary`, `--border`, `--muted`, `--muted-foreground`, `--ring`, `--card`, `--popover`, `--accent`, `--secondary`, `--destructive`) so utilities like `bg-primary` / `text-primary-foreground` / `border-border` resolve; `:root` defaults that match the existing classwork palette (navy `--primary`, slate `--muted-foreground`, etc) so the panel feels native; an `@font-face` for OpenDyslexic served from `/Fonts/` by Express; `html.dyslexia-font *` / `html.high-contrast` / `html.reduced-motion` / `html[data-colour-overlay="…"]::after` / `html.reading-guide-active` rules using exactly the same selectors as the rest of the site; and bridges from `data-custom-bg` / `data-custom-text` to the bespoke `--cw-bg` / `--cw-ink` / `--cw-card` / `--cw-muted` vars so custom user colours flow through to classwork's hand-styled buttons and cards rather than only the shadcn-themed bits. `body` font-size and line-height now scale via `var(--a11y-font-scale, 1)` and `var(--a11y-line-scale, 1)`. TTS uses the same fallback chain as n5 (POST `/api/tts` first, then browser `speechSynthesis`).

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

### Testing
- **Vitest**
- **@testing-library/react**
- **jsdom**