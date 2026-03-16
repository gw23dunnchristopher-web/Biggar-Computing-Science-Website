# BHS Computing Science Platform

## Overview

This is an educational web platform for Biggar High School's Computing Science department. The system provides:

- **Educational Content**: Interactive learning materials for National 5, Higher, Games Development, and Cyber Security courses
- **Interactive Widgets**: Binary converter, floating-point converter, and two's complement converter for learning data representation

The platform is a static educational website with interactive learning tools.

## Recent Changes

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