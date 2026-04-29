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

### Classwork file storage (Object Storage)
Classwork file uploads (screenshots, project ZIPs, .pptx submissions, teacher-attached resources) are persisted in Replit Object Storage rather than on the local container disk, so files survive every redeploy. The public URL surface is unchanged — all uploads still resolve at `/classwork-uploads/<filename>` so existing references stored in lesson prompts, resource attachments, and `submissions.file_url` rows keep working without any DB rewrite. Implementation: `server/classwork-uploads-store.ts` exposes `saveClassworkUpload(buffer, originalName, mimeType)` (writes to bucket key `classwork-uploads/<timestamp>_<rand>_<safeName>` and returns `{ url }`), `streamClassworkUpload(name, res)` (looks the object up by key, sets `Content-Type` from saved metadata, sends `Content-Length`/`Cache-Control: public, max-age=86400` and pipes the bucket read stream into the response, mapping a missing object to `404`), and `downloadClassworkUploadToTemp(fileUrl)` (resolves a `/classwork-uploads/<name>` URL — or even an absolute origin variant — to a tmp file path plus `cleanup()` callback so the existing JSZip + LibreOffice pipeline in `markPresentation` / `summarisePptx` / `renderPptxToImages` can keep treating things as on-disk paths). `server/classwork-routes.ts` swaps `multer.diskStorage` for `multer.memoryStorage()` and calls `saveClassworkUpload` from the upload handler; the `express.static('/classwork-uploads', …)` mount is replaced by `app.get('/classwork-uploads/:name', streamClassworkUpload)`. `server/classwork-ai.ts` no longer maps URLs onto local disk via `resolveUploadPath`; `markPresentation` opens a `try { … } finally { for (const c of cleanups) await c(); }` envelope, downloads both the pupil's submission and any teacher-supplied starter `.pptx` exactly once into temp files (via `downloadClassworkUploadToTemp`), reuses the same starter temp path for both the text summary and the visual `renderPptxToImages` pass, and lets the `finally` block delete every temp file even if Gemini throws. The bucket is selected via `process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID` and the sidecar credentials wired up in `server/replit_integrations/object_storage/objectStorage.ts`. The legacy `public/classwork-uploads/` directory is no longer written to and is no longer required by the runtime; the single historical asset (`1777386285460_537934139_image.png`, the Milestones unit thumbnail) was copied into the bucket at the same key so the existing prompt reference resolves.

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
- **Site-Wide Dark Mode (classwork SPA):** The classwork SPA now ships with the same dark mode the static site, n5, revision, and data-sculptor SPAs already had, synced cross-app via the shared `vite-ui-theme` localStorage key (values `"dark"` / `"light"` / `"system"`). The implementation lives entirely in `classwork-client/` (no DB changes, settings stored in localStorage only): (1) `AccessibilityContext.tsx` was extended with `darkMode: boolean` + `setDarkMode(value)` exposed through the context value, with its own `useEffect` that adds/removes the `dark` class on `document.documentElement` and a separate `storage` event branch for the `vite-ui-theme` key so toggling dark mode on `/highercs/index.html` (or another tab) instantly flips the open `/classwork/...` page and vice-versa; the `system` value is honoured via `matchMedia("(prefers-color-scheme: dark)")`. (2) `AccessibilityPanel.tsx` got a `Moon`-icon `Dark Mode` toggle row at the top of the panel (above `High Contrast`), and `darkMode` is folded into `hasChanges` so the green dot and `Reset All Settings` button appear when only dark mode is active. (3) `index.html` got an inline anti-flash `<script>` in `<head>` that reads `vite-ui-theme` from localStorage *before* React mounts and adds the `dark` class to `<html>` — this avoids the white flash when reloading a dark-mode page. (4) `index.css` was restructured around a *semantic* set of `--cw-*` vars (`--cw-surface`, `--cw-surface-soft`, `--cw-surface-muted`, `--cw-ink`, `--cw-ink-soft`, `--cw-muted`, `--cw-muted-soft`, `--cw-border`, `--cw-border-strong`, `--cw-bg`, `--cw-card` kept as alias of `--cw-surface` for backwards-compat) plus a single `html.dark { ... }` block that flips both the semantic vars AND the shadcn HSL tokens (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`) plus `color-scheme: dark` for native scrollbars/form chrome. Dark surfaces use slate-800/900 (`#1e293b` cards on `#0b1220` page bg) with slate-100 ink and a brighter `#3b82f6` accent. Plain `<input>`/`<textarea>`/`<select>` get a default dark-mode skin so unstyled forms (e.g. classwork text answers) read correctly. (5) The bulk of the classwork TSX surface (Lesson, Course, Students, Analytics, Jotter, Shell, Modal, etc.) was migrated from hardcoded slate hex codes to the new vars: `'#fff'` / `'#f8fafc'` / `'#f1f5f9'` / `'#fafbfd'` → `var(--cw-surface)` / `var(--cw-surface-soft)` / `var(--cw-surface-muted)` for backgrounds; `'#0f172a'` / `'#475569'` / `'#64748b'` / `'#94a3b8'` → `var(--cw-ink)` / `var(--cw-ink-soft)` / `var(--cw-muted)` / `var(--cw-muted-soft)` for text; `'#e2e8f0'` / `'#cbd5e1'` → `var(--cw-border)` / `var(--cw-border-strong)`. White text *on* accent backgrounds (`color: '#fff'` on navy buttons, status pills, table headers) was deliberately left as `#fff` so it stays legible on the still-coloured accents in dark mode. Status/category accent fills (red/amber/green/cyan/indigo/purple pills, fill-in-blanks amber cells, word-search amber/green selections, video player black `#000`, crossword `#1e293b` black squares) are also intentionally untouched. The `cw-jotter-tab.active`, `cw-jotter-sidebar`, `cw-rte` and `cw-jotter-body` template-literal CSS rules were moved to vars too so the rich-text editor and notes view follow dark mode as well.

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