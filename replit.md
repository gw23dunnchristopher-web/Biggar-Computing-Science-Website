# BHS Computing Science Platform

## Overview

This is an educational web platform for Biggar High School's Computing Science department. The system provides:

- **Educational Content**: Interactive learning materials for National 5, Higher, Games Development, and Cyber Security courses
- **Interactive Widgets**: Binary converter, floating-point converter, and two's complement converter for learning data representation

The platform is a static educational website with interactive learning tools.

## Recent Changes

- **March 26, 2026**: Added syntax highlighting and line numbers to all `.codeBox` divs site-wide. New `JavaScript/codeBoxHighlight.js` is auto-injected by `N4Script.js`, `script.js`, and `higherScript.js`. Transformer reads `<p>` elements and inline `padding-left` for indentation, auto-detects Python vs SQL, and rebuilds the box as a two-column layout (line numbers | highlighted code). Python colours: green keywords, blue builtins, yellow strings, red numbers, muted italic comments. SQL colours: same scheme for SQL keywords/strings/numbers.
- **March 25, 2026**: Teacher login upgraded to email + password. New `teachers` database table stores hashed credentials (bcrypt). On first run, a default teacher account is auto-created from `TEACHER_EMAIL` (default: `teacher@bhs.sch.uk`) and `TEACHER_PASSWORD` (default: `bhs-computing`). Sidebar login modal now shows email + password fields; Enter in email field moves focus to password, Enter in password field submits. New `/api/teacher-auth` POST endpoint checks email + bcrypt hash against the database.
- **March 25, 2026**: Added teacher login button (🔒 Teacher Tools) pinned to the bottom of all three sidebars (N5, Higher, N4). Clicking opens a password modal; on success, reveals a Sandbox Builder link. Login persists in localStorage. New `/api/teacher-auth` endpoint and new `teachers` database table.
- **March 25, 2026**: Added HTML Quiz runner (`html-quiz` class). Tabbed HTML/CSS coding exercises — per-question HTML editor with syntax highlighting, live preview iframe, drag-to-resize splitter, Code/Preview toggle, AI feedback via `/api/quiz/mark-code` (sends `codeType:"html"` so Gemini sees an HTML code fence), per-question reset, localStorage persistence. Sandbox builder supports "HTML / CSS Quiz Exercise" type (📋 icon) with same card-based editor; new questions default to a basic HTML template starter. Embed: `<div class="html-quiz" data-sandbox="name"></div>`. JSON format: `{type:"html-quiz", title, questions:[{label, prompt, starter, scheme, marks}]}`. Server `/api/quiz/mark-code` updated to use `codeType` per question for the correct language label in the AI prompt.
- **March 25, 2026**: Added Python Quiz runner (`py-quiz` class). Tabbed coding exercises where each question has a Python editor, Run button (Pyodide), AI feedback submission, and per-question reset. State persists in localStorage per sandbox+question. New `/api/quiz/mark-code` endpoint with a code-specific AI prompt. Sandbox builder now supports "Python Quiz Exercise" type — shows a card-based question editor (label, prompt, marks, starter code, marking scheme) instead of the file tree. JSON format: `{type:"python-quiz", title, questions:[{label, prompt, starter, scheme, marks}]}`. Embed code: `<div class="py-quiz" data-sandbox="name"></div>`.
- **March 24, 2026**: Completed full Trinket replacement across all pages. Zero Trinket embeds remain. Pages updated: All 8 Higher SDD Implementation pages (ParallelArrays, LinearSearch, CountOccurences, FindMinMax, PredefinedFunctions, FileHandling, Substrings, Subroutines), all N5 WDD HTML pages (BasicTags, ImageTags, audioVideo, Links, lists), Higher WDD HTML/JS pages (JavaScript ×4, Forms, SemanticTags), Higher WDD CSS pages (boxModel, selectors, float ×2, display ×2, navBar, heightWidth), N5 WDD pages (JavaScript, ids-classes-divs), additional N5 SDD pages (RunningTotal, InputVal, Arithemtic, AssignConcat), and N4/Start/DigitalToolkit (text reference updated). All pages now include CSS/codeRunner.css and JS/codeRunner.js. Python pages use py-runner divs with Pyodide; HTML/CSS pages use html-runner divs with srcdoc iframes.
- **March 20, 2026**: Converted all remaining compatible N5 pages to AI quiz format (15 more pages): DDD/Access/Queries, DDD/Access/RelationalDatabases, SDD/Design/pseudocode, SDD/Design/flowcharts, SDD/Design/structureDiagrams, SDD/Implementation/1DArrays, SDD/Implementation/DataTypes, SDD/Implementation/InputVal, SDD/Implementation/RunningTotal, SDD/Implementation/Traversing1DArray, WDD/Design/copyright, WDD/Design/fileFormats, WDD/Design/mediaFormats, WDD/Design/prototyping, plus 2 extra questions added to SDD/analysis. Total now 81 pages with AI quiz. Incompatible pages (require drawing/diagram): ERD, userInterface, websiteStructure, wireframes, lists.html.
- **March 20, 2026**: Converted ALL compatible Higher pages to AI quiz format (44 pages). Covers Higher SDD (Analysis, DevMethodologies, evaluation, testing, pseudocode, 10 Implementation pages), Higher DDD (analysis, testing, typesOfKeys, queryDesign, aggFunctions, groupBy, multiUpdate, queryInQuery, wildcards), Higher WDD (analysis, testing, 5 CSS pages, SemanticTags, JavaScript), Higher CS (fetchExecute, performance, Environmental, 5 DataRep pages, 3 Security pages). Old Show Answer buttons removed and replaced with AI quiz questions.
- **March 20, 2026**: Added Gemini AI quiz system. Students can answer paragraph, pseudocode, and table-fill questions on any lesson page. Answers are sent to /api/quiz/mark, marked by gemini-2.5-flash against a teacher-defined marking scheme, and feedback shown immediately. No login required. Files: CSS/quiz.css, JavaScript/quiz.js, /api/quiz/mark endpoint in server/index.ts.
- **March 18, 2026**: Fixed OpenDyslexic font not applying on N4/N5/Higher pages. Root cause: font files in /Fonts/ were corrupted (all bytes were 0x0A). Replaced with valid WOFF2 files from CDN. Removed broken OTF fallback references from CSS and JS. Added early font preload in accessibility.js that reads localStorage and applies the dyslexia-font class before DOMContentLoaded for instant rendering.
- **March 16, 2026**: Mobile accessibility fixes — OpenDyslexic now uses FontFace JavaScript API for reliable font loading on mobile (programmatic load + document.fonts.add, with @font-face as backup). Reading guide now responds to touch events (touchmove/touchstart/touchend) in addition to mouse. Accessibility panel has larger touch targets on mobile (56px trigger button, wider toggles) and goes full-width on screens ≤360px. Font size slider uses CSS zoom on #content for reliable scaling of all text including hardcoded px values. Both @font-face declarations updated to use WOFF2 as primary format with OTF fallback.
- **March 12, 2026**: Added comprehensive accessibility panel (Display Settings) - floating button on all pages with: high contrast mode, custom text/background colours, font size slider (75-200%), line spacing slider, OpenDyslexic font, text-to-speech (browser Web Speech API + optional Google Cloud TTS via GOOGLE_TTS_KEY env var), reduced motion, reading guide, colour overlays. Settings persisted to localStorage. Loaded dynamically from script.js/higherScript.js. Fonts in /Fonts/, styles in CSS/accessibility.css, logic in JavaScript/accessibility.js.
- **February 25, 2026**: Added security hardening - blocked access to server source/config files, added security headers (X-Frame-Options, X-Content-Type-Options, XSS protection, Referrer-Policy, Permissions-Policy), disabled Express fingerprinting, blocked dotfiles
- **February 25, 2026**: Fixed broken images (wrong file extensions for LookupWizard7 and PPEvaluation)
- **February 25, 2026**: Fixed white screen issue on IONOS server - showMainContent now defers to DOM ready, loadSidebarContent calls showMainContent, added error handling and timeout fallbacks
- **February 25, 2026**: Added Next/Back navigation buttons to all N5 and Higher lesson pages via pageNavigation.js
- **February 25, 2026**: Reduced footer to 50px height with light grey text, fixed sidebar height to reach footer
- **November 25, 2025**: Upgraded search to content-based search - now fetches and searches through actual page content, not just sidebar titles. Results show clickable links to matching pages.
- **November 11, 2025**: Mobile landscape sidebar now uses dropdown menu (hamburger button) like portrait mode for better horizontal space management
- **November 11, 2025**: Added mobile landscape optimization - header and footer now reduce to 50px height when phones are in landscape mode for better content visibility
- **November 11, 2025**: Added sidebar search functionality - separate search bars for N5 and Higher sections with real-time filtering, scoped search, and auto-expanding parent menus

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Static Educational Content**
- Multi-page static website organized by course level (N5, Higher, Games Dev, Cyber Security)
- Responsive design with mobile-first approach using vanilla CSS
- Dynamic sidebar navigation loaded via fetch API
- Image optimization with srcset for responsive images
- Interactive educational widgets (binary converter, floating-point converter, two's complement converter)
- Content-based page search with scoped filtering (N5 search only searches N5 pages, Higher search only searches Higher pages)
- Search fetches and indexes actual page content, displays matching pages as clickable results

**Responsive Design**
- Mobile portrait: Collapsible sidebar with hamburger menu, optimized layouts
- Mobile landscape: Collapsible sidebar with hamburger menu (same as portrait), reduced header (50px) and footer (50px) for maximum content visibility, full-width content area
- Tablet and desktop: Fixed sidebar always visible, full-size header (100px) and footer (100px)

**UI Components**
- Fixed header with school branding
- Collapsible sidebar navigation with nested menus
- Sidebar search bars with case-insensitive, real-time filtering
- Loading states and content transitions
- Responsive layouts adapting to mobile/tablet/desktop orientations

### Backend Architecture

**Note**: Backend assignment system infrastructure exists in the codebase but is currently unused. The platform operates as a static educational content site served by Express.

**Technology Stack**
- Node.js/Express server for serving static content
- TypeScript for type safety
- PostgreSQL database via Neon serverless (for potential future features)

**Current Function**
- Express.js serves static HTML/CSS/JavaScript files
- No active authentication or database operations
- Port 5000 configured for Replit webview deployment

**Security**
- Sensitive files blocked: server source, .git, .env, node_modules, config files all return 404
- Security headers: X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff), X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Express fingerprinting disabled (X-Powered-By removed)
- Dotfiles denied by static file server

## External Dependencies

**Database & ORM**
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Database migrations and schema management CLI

**Authentication & Sessions**
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store
- **bcrypt**: Password hashing and verification

**Server Framework**
- **Express.js**: Web application framework
- **TypeScript (tsx)**: Runtime TypeScript execution
- **CORS**: Cross-origin resource sharing
- **body-parser**: Request body parsing

**Client-Side Code Execution**
- **Pyodide**: WebAssembly-based Python runtime for browsers
- **CodeMirror**: In-browser code editor with syntax highlighting

**WebSocket Communication**
- **ws**: WebSocket library for real-time features (server-side infrastructure present)

**Development Tools**
- **tsx**: TypeScript execution and watch mode
- **drizzle-kit**: Database schema management and studio UI

**Environment Variables Required**
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret key for session encryption

**Environment Variables Optional**
- `GOOGLE_TTS_KEY`: Google Cloud Text-to-Speech API key. If set, TTS uses Google's Neural2 voice (en-GB-Neural2-A). If not set, TTS falls back to browser's Web Speech API.
- `TEACHER_EMAIL`: Email address for the default teacher account created in the database on first run. Defaults to `teacher@bhs.sch.uk` if not set. After the first run, the account exists in the database and this env var is only used for new server instances where no teacher accounts exist yet.
- `TEACHER_PASSWORD`: Password for the teacher account and sandbox builder. Defaults to `bhs-computing` if not set. Used both for bcrypt-hashing the database teacher account and for the sandbox builder `X-Teacher-Password` header check.