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

### Revision Sub-App
- **React + TypeScript SPA** at `/revision/` — Higher CS past-paper revision tool with student accounts, teacher dashboard, AI marking, class management, and assignment tracking.
- **Build**: `npm run build:revision` (Vite, `vite.revision.config.ts`, output to `public/revision/`).
- **Routes**: `server/revision-routes.ts` + `server/revision-storage.ts`, registered via `registerRevisionRoutes(app)` in `server/index.ts`.
- **DB Schema**: `shared/revision-schema.ts` — tables prefixed `rev_` where names conflict with existing tables.
- **Auth**: Bearer token stored in `rev_sessions`; no cookies (fully separate from BHS teacher auth).

### AI Services
- **Google Gemini API**: For AI quiz marking and feedback.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: Secret for session encryption.
- `GOOGLE_TTS_KEY`: Optional, for Google Cloud Text-to-Speech.
- `TEACHER_EMAIL`: Optional, default teacher account email.
- `TEACHER_PASSWORD`: Optional, default teacher account password.