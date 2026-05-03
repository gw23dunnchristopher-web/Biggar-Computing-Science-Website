# BHS Computing Science Platform

## Overview
This project is an educational web platform for Biggar High School's Computing Science department. It provides interactive learning materials and tools for various computing science courses (National 5, Higher, Games Development, Cyber Security), aiming to enhance student engagement and understanding. Key capabilities include a Higher CS Revision App, interactive widgets, an AI quiz system, and specialized tools like a Paper Builder, Data Sculptor, and code editors with cloud synchronization. The platform seeks to be a comprehensive and interactive resource for students and teachers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The platform uses a multi-page static website with responsive, mobile-first vanilla CSS. It features dynamic navigation, optimized images, interactive widgets, content search, accessibility panel, syntax-highlighted code blocks, and interactive Python/HTML/CSS code runners.
Separate React + TypeScript SPAs are used for revision apps, the BHS Classwork app, and the Data Sculptor, offering student accounts, teacher dashboards, AI marking, class management, and sandboxed database environments. Code editor tools include personal project dashboards with local and cloud saving. Site-wide accessibility tools and dark mode are synchronized across all SPAs.

### Backend Architecture
A Node.js/Express server, built with TypeScript, serves static content and provides CRUD API endpoints. Security measures include restricted file access, security headers, and disabled Express fingerprinting. A unified database schema manages student and class data. Authentication uses Bearer tokens for students and email/password for teachers, with unified logins and cross-app settings synchronization. The BHS Classwork app integrates AI marking for various question types (text, multiple-choice, code, link, file-upload, presentation, video), supporting manual override and re-marking. Visual marking for presentations optionally uses LibreOffice and Gemini Vision. File uploads for N5/Higher Revision apps, code-runner sandbox JSONs, and Classwork files are persisted in Replit Object Storage for durability across redeploys, with public URLs remaining consistent.

### Core Features
- **Higher/N5 CS Revision Apps:** React SPAs with student accounts, teacher dashboards, AI marking, assignment tracking, and multimodal diagram input/grading.
- **Paper Builder:** Teacher tool for creating, editing, and managing exam papers, questions, and assignments.
- **Data Sculptor:** Sandboxed database tool with personal multi-database dashboards and advanced database design capabilities for teachers, including AI marking for SQL tasks.
- **Code Editor Project Dashboards:** Personal project management for Python and HTML/CSS editors with cloud synchronization.
- **Classwork Features:** View-tracking, auto-saved drafts, and fun activities (crossword, word search, matching, anagrams) with teacher editing and AI assistance.
- **BHS Classwork App:** React SPA for AI-marked classwork with comprehensive teacher tools for class/student management, lesson editing, diverse question types, AI-judged marking, and Excel export. Includes 42 game-style activity types (10 original + 32 new across Internet Safety, Cyber Security, Databases, Web Development, and Computer Systems strands), most built on a shared pick-list pattern (`PickListPupilUI`/`PickListEditor` in `lesson-games.tsx`, `markPickListGeneric` in `classwork-ai.ts`).
- **Per-student activity calendar:** Visualizes student engagement on the Analytics page.
- **BHS Progress Tracker:** Unified SPA for teachers to view student progress across all courses.
- **Site-Wide Student Login:** Vanilla-JS component for consistent student authentication.

## External Dependencies

- **Neon Serverless PostgreSQL**
- **Drizzle ORM**
- **Drizzle Kit**
- **express-session**
- **connect-pg-simple**
- **bcrypt**
- **Express.js**
- **TypeScript (tsx)**
- **CORS**
- **body-parser**
- **Pyodide**
- **CodeMirror**
- **ws**
- **Google Gemini API**
- **Vitest**
- **@testing-library/react**
- **jsdom**