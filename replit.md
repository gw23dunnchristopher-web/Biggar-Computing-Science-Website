# BHS Computing Science Platform

## Overview

This is an educational web platform for Biggar High School's Computing Science department. The system provides:

- **Educational Content**: Interactive learning materials for National 5, Higher, Games Development, and Cyber Security courses
- **Assignment System**: Teachers can create coding assignments and students can submit solutions with real-time Python execution
- **User Management**: Role-based authentication system supporting teachers and students
- **Class Management**: Teachers can create classes, add students, and manage assignments

The platform combines static educational content with a dynamic assignment submission system, featuring client-side Python execution using Pyodide and server-side data persistence.

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

**Assignment Interface**
- CodeMirror-based code editor for Python programming
- Pyodide integration for client-side Python execution
- Real-time code execution and output display
- Separate views for teachers (assignment creation, feedback) and students (submission, viewing feedback)

**UI Components**
- Fixed header with school branding
- Collapsible sidebar navigation with nested menus
- Loading states and content transitions
- Responsive layouts adapting to mobile/tablet/desktop

### Backend Architecture

**Technology Stack**
- Node.js/Express server
- TypeScript for type safety
- Session-based authentication using express-session
- PostgreSQL database via Neon serverless

**API Design Pattern**
- RESTful API endpoints under `/api` namespace
- Session-based authentication middleware
- Role-based access control (teacher/student)
- CRUD operations for users, classes, assignments, and submissions

**Key API Routes**
- `/api/auth/*` - Authentication (login, register, logout, session check)
- `/api/classes/*` - Class management
- `/api/assignments/*` - Assignment CRUD operations
- `/api/submissions/*` - Student submission handling
- `/api/feedback/*` - Teacher feedback system

**Security Model**
- Password hashing using bcrypt
- HTTP-only session cookies
- Server-side session storage in PostgreSQL
- Authorization checks for class/assignment ownership

### Data Architecture

**Database Schema (Drizzle ORM)**

**Users Table**
- Authentication credentials (username, hashed password)
- User profile (full name, role)
- Role-based access (teacher/student)

**Classes Table**
- Class metadata (name, level)
- Teacher ownership via foreign key

**Class-Student Junction Table**
- Many-to-many relationship between classes and students
- Enrollment tracking with timestamps

**Assignments Table**
- Assignment details (title, description, starter code)
- Class association
- Due date tracking
- Creator reference

**Submissions Table**
- Student code submissions
- Assignment association
- Teacher feedback with timestamps
- Feedback author tracking

**Session Storage**
- PostgreSQL-backed sessions via connect-pg-simple
- Automatic session table creation

**Data Relationships**
- One-to-many: Teacher → Classes
- Many-to-many: Classes ↔ Students (via junction table)
- One-to-many: Class → Assignments
- One-to-many: Assignment → Submissions
- Optional one-to-many: Teacher → Feedback entries

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