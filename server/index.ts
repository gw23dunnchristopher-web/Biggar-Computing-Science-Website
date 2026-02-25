import express from 'express';
import path from 'path';
import { db, pool, hasDatabase } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.use((req, res, next) => {
  const blocked = /\/(\.git|\.env|server|shared|node_modules|drizzle|\.config|\.local|\.replit|replit\.md|package\.json|package-lock\.json|tsconfig\.json|drizzle\.config\.ts)/i;
  if (blocked.test(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

const publicRoot = path.resolve('.');
app.use(express.static(publicRoot, {
  dotfiles: 'deny',
  index: ['index.html']
}));

if (hasDatabase) {
  const session = require('express-session');
  const bcrypt = require('bcrypt');
  const connectPgSimple = require('connect-pg-simple');
  const { users, classes, classStudents, assignments, submissions } = require('../shared/schema');
  const { eq, and, desc } = require('drizzle-orm');

  const PgSession = connectPgSimple(session);

  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable must be set');
  }

  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      },
    })
  );

} // end if (hasDatabase)

declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
  }
}

if (hasDatabase) {
  const { users, classes, classStudents, assignments, submissions } = require('../shared/schema');
  const { eq, and, desc } = require('drizzle-orm');
  const bcrypt = require('bcrypt');

async function isClassOwner(userId: number, classId: number): Promise<boolean> {
  const [cls] = await db.select().from(classes).where(eq(classes.id, classId));
  return cls && cls.teacherId === userId;
}

async function isStudentInClass(userId: number, classId: number): Promise<boolean> {
  const enrollment = await db
    .select()
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, userId)));
  return enrollment.length > 0;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      fullName,
      role: 'student',
    }).returning();

    req.session.userId = newUser.id;
    req.session.role = newUser.role;
    
    res.json({ user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    
    res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
});

app.get('/api/classes', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    if (req.session.role === 'teacher') {
      const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, req.session.userId));
      res.json({ classes: teacherClasses });
    } else {
      const studentClasses = await db
        .select({
          id: classes.id,
          name: classes.name,
          level: classes.level,
          teacherId: classes.teacherId,
          createdAt: classes.createdAt,
        })
        .from(classStudents)
        .innerJoin(classes, eq(classStudents.classId, classes.id))
        .where(eq(classStudents.studentId, req.session.userId));
      
      res.json({ classes: studentClasses });
    }
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

app.post('/api/classes', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create classes' });
  }

  try {
    const { name, level } = req.body;
    const [newClass] = await db.insert(classes).values({
      name,
      level,
      teacherId: req.session.userId,
    }).returning();

    res.json({ class: newClass });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

app.get('/api/classes/:classId/students', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    const isOwner = await isClassOwner(req.session.userId, classId);
    const isEnrolled = await isStudentInClass(req.session.userId, classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const enrolledStudents = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        enrolledAt: classStudents.enrolledAt,
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.studentId, users.id))
      .where(eq(classStudents.classId, classId));

    res.json({ students: enrolledStudents });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

app.post('/api/classes/:classId/students', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can add students' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    if (!(await isClassOwner(req.session.userId, classId))) {
      return res.status(403).json({ error: 'Only class owner can add students' });
    }
    
    const { studentUsername } = req.body;

    const [student] = await db.select().from(users).where(eq(users.username, studentUsername));
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    const existing = await db
      .select()
      .from(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, student.id)));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    await db.insert(classStudents).values({
      classId,
      studentId: student.id,
    });

    res.json({ message: 'Student added successfully' });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

app.get('/api/classes/:classId/assignments', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const classId = parseInt(req.params.classId);
    
    const isOwner = await isClassOwner(req.session.userId, classId);
    const isEnrolled = await isStudentInClass(req.session.userId, classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const classAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.classId, classId))
      .orderBy(desc(assignments.createdAt));

    res.json({ assignments: classAssignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

app.post('/api/assignments', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create assignments' });
  }

  try {
    const { title, description, starterCode, classId, dueDate } = req.body;
    
    if (!(await isClassOwner(req.session.userId, classId))) {
      return res.status(403).json({ error: 'Only class owner can create assignments' });
    }

    const [newAssignment] = await db.insert(assignments).values({
      title,
      description,
      starterCode: starterCode || '',
      classId,
      createdBy: req.session.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();

    res.json({ assignment: newAssignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

app.get('/api/assignments/:assignmentId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const isOwner = await isClassOwner(req.session.userId, assignment.classId);
    const isEnrolled = await isStudentInClass(req.session.userId, assignment.classId);
    
    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to get assignment' });
  }
});

app.post('/api/submissions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { assignmentId, code } = req.body;
    
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    if (!(await isStudentInClass(req.session.userId, assignment.classId))) {
      return res.status(403).json({ error: 'You must be enrolled in this class to submit' });
    }
    
    const existing = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, req.session.userId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(submissions)
        .set({ code, submittedAt: new Date() })
        .where(eq(submissions.id, existing[0].id))
        .returning();
      
      return res.json({ submission: updated });
    }

    const [newSubmission] = await db.insert(submissions).values({
      assignmentId,
      studentId: req.session.userId,
      code,
    }).returning();

    res.json({ submission: newSubmission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const assignmentId = parseInt(req.params.assignmentId);
    
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (req.session.role === 'teacher') {
      if (!(await isClassOwner(req.session.userId, assignment.classId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const allSubmissions = await db
        .select({
          id: submissions.id,
          code: submissions.code,
          submittedAt: submissions.submittedAt,
          feedback: submissions.feedback,
          feedbackAt: submissions.feedbackAt,
          studentId: users.id,
          studentName: users.fullName,
          studentUsername: users.username,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .where(eq(submissions.assignmentId, assignmentId));

      res.json({ submissions: allSubmissions });
    } else {
      if (!(await isStudentInClass(req.session.userId, assignment.classId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const [studentSubmission] = await db
        .select()
        .from(submissions)
        .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, req.session.userId)));

      res.json({ submission: studentSubmission || null });
    }
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

app.post('/api/submissions/:submissionId/feedback', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can provide feedback' });
  }

  try {
    const submissionId = parseInt(req.params.submissionId);
    const { feedback } = req.body;

    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, submission.assignmentId));
    if (!assignment || !(await isClassOwner(req.session.userId, assignment.classId))) {
      return res.status(403).json({ error: 'Only class owner can provide feedback' });
    }

    const [updated] = await db
      .update(submissions)
      .set({
        feedback,
        feedbackBy: req.session.userId,
        feedbackAt: new Date(),
      })
      .where(eq(submissions.id, submissionId))
      .returning();

    res.json({ submission: updated });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({ error: 'Failed to provide feedback' });
  }
});

app.get('/api/users/students', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view students' });
  }

  try {
    const allStudents = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.role, 'student'));

    res.json({ students: allStudents });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

} // end if (hasDatabase) for API routes

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
