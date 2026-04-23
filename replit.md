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
- **BHS Classwork App:** A React SPA for AI-marked classwork across multiple year levels. It includes comprehensive teacher tools for class and student management (move, copy, archive, rename), lesson editing (learning intentions, success criteria), and resource attachment (images, documents, YouTube, links, embeds). Supports various question types, including specific integrations for Python, HTML, and SQL tasks, and introduces "extension activity" flagging.
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