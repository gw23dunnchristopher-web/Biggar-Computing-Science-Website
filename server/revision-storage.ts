import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, inArray, or, isNull, isNotNull } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import {
  type User, type InsertUser, type DbQuestion, type PasswordResetToken,
  type CustomQuiz, type InsertCustomQuiz,
  type Assignment, type InsertAssignment,
  type AssignmentSection, type InsertAssignmentSection,
  type AssignmentPart, type InsertAssignmentPart,
  type AssignmentResource, type InsertAssignmentResource,
  type AssignmentAttempt, type InsertAssignmentAttempt,
  type AssignmentResponse, type InsertAssignmentResponse,
  type AdditionalExam, type InsertAdditionalExam,
  type Class, type InsertClass,
  type Student, type InsertStudent,
  type StudentSession,
  type StudentExamResult, type InsertStudentExamResult,
  type StudentExamProgress, type InsertStudentExamProgress,
  users, questions, passwordResetTokens, customQuizzes,
  additionalExams, assignments, assignmentSections, assignmentParts,
  assignmentResources, assignmentAttempts, assignmentResponses,
  studentSessions, studentExamResults, studentExamProgress
} from "@shared/revision-schema";
import { bhsStudents as students, bhsClasses as classes } from "@shared/bhs-schema";
import { Question } from "../revision-client/src/lib/past-papers";
import bcrypt from "bcryptjs";

function getDatabaseUrl(): string | undefined {
  if (process.env.NEON_DATABASE_URL) {
    const neonUrl = process.env.NEON_DATABASE_URL;
    const safeUrl = neonUrl.replace(/:([^:@]+)@/, ':***@');
    console.log("Using NEON_DATABASE_URL:", safeUrl);
    return neonUrl;
  }
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    console.log("DATABASE_URL environment variable not set");
    return undefined;
  }
  if (process.env.NODE_ENV === 'production' && envUrl.includes('helium')) {
    console.log("Production detected with development database URL (helium)");
    return undefined;
  }
  const safeUrl = envUrl.replace(/:([^:@]+)@/, ':***@');
  console.log("Using DATABASE_URL:", safeUrl);
  return envUrl;
}

let databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.warn("DATABASE_URL not found - using in-memory fallback");
} else {
  console.log("Database URL found, attempting connection...");
}


let pool: pkg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let dbAvailable = false;

if (databaseUrl) {
  try {
    const needsSSL = databaseUrl.includes('neon') ||
                     databaseUrl.includes('pooler') ||
                     databaseUrl.includes('.us-east-2') ||
                     databaseUrl.includes('.neon.tech') ||
                     process.env.NODE_ENV === 'production';
    const sslConfig = needsSSL ? { rejectUnauthorized: false } : undefined;
    console.log(`Database config: SSL=${needsSSL ? 'enabled' : 'disabled'}, NODE_ENV=${process.env.NODE_ENV}`);

    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      ssl: sslConfig,
      max: 5,
    });
    pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
    });
    db = drizzle(pool);
    dbAvailable = true;
    console.log('Database pool initialized');
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
  }
}

async function testConnection(timeoutMs: number = 5000): Promise<boolean> {
  if (!pool) return false;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error('Database connection test: TIMEOUT after', timeoutMs, 'ms');
      resolve(false);
    }, timeoutMs);
    pool!.connect()
      .then(client => {
        clearTimeout(timeout);
        client.query('SELECT 1')
          .then(() => { client.release(); console.log('Database connection test: SUCCESS'); resolve(true); })
          .catch((err) => { client.release(); console.error('Database connection test: QUERY FAILED -', err.message); resolve(false); });
      })
      .catch((err) => { clearTimeout(timeout); console.error('Database connection test: CONNECT FAILED -', err.message); resolve(false); });
  });
}

export { db };

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  updateUserEmail(id: string, email: string): Promise<void>;
  getAllQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: Question): Promise<Question>;
  updateQuestion(question: Question): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;

  listCustomQuizzes(): Promise<CustomQuiz[]>;
  getCustomQuiz(id: string): Promise<CustomQuiz | undefined>;
  createCustomQuiz(quiz: InsertCustomQuiz): Promise<CustomQuiz>;
  updateCustomQuiz(id: string, quiz: Partial<InsertCustomQuiz>): Promise<CustomQuiz>;
  deleteCustomQuiz(id: string): Promise<void>;

  listAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(a: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, a: Partial<InsertAssignment>): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;

  getFullAssignment(id: string): Promise<any>;
  listAllAssignmentsFull(): Promise<any[]>;
  listAssignmentSections(assignmentId: string): Promise<AssignmentSection[]>;
  getAssignmentSection(id: string): Promise<AssignmentSection | undefined>;
  createAssignmentSection(s: InsertAssignmentSection): Promise<AssignmentSection>;
  updateAssignmentSection(id: string, s: Partial<InsertAssignmentSection>): Promise<AssignmentSection>;
  deleteAssignmentSection(id: string): Promise<void>;

  listAssignmentParts(sectionId: string): Promise<AssignmentPart[]>;
  getAssignmentPart(id: string): Promise<AssignmentPart | undefined>;
  createAssignmentPart(p: InsertAssignmentPart): Promise<AssignmentPart>;
  updateAssignmentPart(id: string, p: Partial<InsertAssignmentPart>): Promise<AssignmentPart>;
  deleteAssignmentPart(id: string): Promise<void>;

  listAssignmentResources(partId: string): Promise<AssignmentResource[]>;
  createAssignmentResource(r: InsertAssignmentResource): Promise<AssignmentResource>;
  deleteAssignmentResource(id: string): Promise<void>;

  listAssignmentAttempts(assignmentId: string): Promise<AssignmentAttempt[]>;
  listAssignmentAttemptsByStudent(studentId: string): Promise<AssignmentAttempt[]>;
  getAssignmentAttempt(id: string): Promise<AssignmentAttempt | undefined>;
  getAssignmentAttemptByStudent(assignmentId: string, studentId: string): Promise<AssignmentAttempt | undefined>;
  createAssignmentAttempt(a: InsertAssignmentAttempt): Promise<AssignmentAttempt>;
  updateAssignmentAttempt(id: string, a: Partial<AssignmentAttempt>): Promise<AssignmentAttempt>;
  deleteAssignmentAttempt(id: string): Promise<void>;

  listAssignmentResponses(attemptId: string): Promise<AssignmentResponse[]>;
  getAssignmentResponse(id: string): Promise<AssignmentResponse | undefined>;
  createAssignmentResponse(r: InsertAssignmentResponse): Promise<AssignmentResponse>;
  updateAssignmentResponse(id: string, r: Partial<AssignmentResponse>): Promise<AssignmentResponse>;

  listAdditionalExams(): Promise<AdditionalExam[]>;
  getAdditionalExam(id: string): Promise<AdditionalExam | undefined>;
  createAdditionalExam(e: InsertAdditionalExam): Promise<AdditionalExam>;
  updateAdditionalExam(id: string, data: Partial<InsertAdditionalExam & { isPublished: boolean }>): Promise<AdditionalExam>;
  deleteAdditionalExam(id: string): Promise<void>;

  createClass(c: InsertClass): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  listClassesByTeacher(teacherId: string): Promise<Class[]>;
  updateClass(id: string, data: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: string): Promise<void>;

  createStudent(s: InsertStudent): Promise<Student>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  listStudentsByClass(classId: string): Promise<Student[]>;
  updateStudentPassword(id: string, password: string, mustChangePassword?: boolean): Promise<void>;
  updateStudentUsername(id: string, username: string): Promise<void>;
  deleteStudent(id: string): Promise<void>;

  createStudentSession(token: string, studentId: string, username: string, expiresAt: Date): Promise<StudentSession>;
  getStudentSession(token: string): Promise<StudentSession | undefined>;
  getLatestStudentSession(studentId: string): Promise<StudentSession | undefined>;
  deleteStudentSession(token: string): Promise<void>;
  deleteStudentSessionsByStudentId(studentId: string): Promise<void>;

  saveStudentExamResult(result: InsertStudentExamResult): Promise<StudentExamResult>;
  getStudentExamResults(studentId: string): Promise<StudentExamResult[]>;
  getStudentExamResultById(id: string): Promise<StudentExamResult | undefined>;
  updateStudentExamResult(id: string, data: Partial<StudentExamResult>): Promise<StudentExamResult | undefined>;
  getStudentExamResultsByClass(classId: string): Promise<StudentExamResult[]>;
  getExamResultsByExamIdentifier(examIdentifier: string): Promise<StudentExamResult[]>;

  upsertExamProgress(studentId: string, examType: string, examIdentifier: string, data: Partial<InsertStudentExamProgress>): Promise<StudentExamProgress>;
  getExamProgressByStudent(studentId: string): Promise<StudentExamProgress[]>;
  getExamProgressForStudent(studentId: string, examType: string, examIdentifier: string): Promise<StudentExamProgress | undefined>;
  deleteExamProgress(studentId: string, examType: string, examIdentifier: string): Promise<void>;
  deleteStudentExamResult(id: string): Promise<void>;
  getOrphanedExamResults(): Promise<StudentExamResult[]>;
  linkExamResultToStudent(examResultId: string, studentId: string): Promise<void>;
  getStudentCompletedAdditionalPaperIds(studentId: string): Promise<string[]>;
}

class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private questionList: Question[] = [];
  private resetTokens: Map<string, PasswordResetToken> = new Map();
  private quizzes: Map<string, CustomQuiz> = new Map();
  private assignmentMap: Map<string, Assignment> = new Map();
  private sectionMap: Map<string, AssignmentSection> = new Map();
  private partMap: Map<string, AssignmentPart> = new Map();
  private resourceMap: Map<string, AssignmentResource> = new Map();
  private attemptMap: Map<string, AssignmentAttempt> = new Map();
  private responseMap: Map<string, AssignmentResponse> = new Map();
  private additionalExamMap: Map<string, AdditionalExam> = new Map();
  private classMap: Map<string, Class> = new Map();
  private studentMap: Map<string, Student> = new Map();
  private studentSessionMap: Map<string, StudentSession> = new Map();
  private studentExamResultMap: Map<string, StudentExamResult> = new Map();
  private examProgressMap: Map<string, StudentExamProgress> = new Map();
  private initialized = false;

  private async ensureInit() {
    if (!this.initialized) {
      const hashedPassword = await bcrypt.hash("Computing2025", 10);
      const teacher: User = { id: "teacher-1", username: "teacher", password: hashedPassword, email: null };
      this.users.set(teacher.id, teacher);
      this.initialized = true;
    }
  }

  async getUser(id: string) { await this.ensureInit(); return this.users.get(id); }
  async getUserByUsername(username: string) { await this.ensureInit(); return Array.from(this.users.values()).find(u => u.username === username); }
  async getUserByEmail(email: string) { await this.ensureInit(); return Array.from(this.users.values()).find(u => u.email === email); }
  async createUser(insertUser: InsertUser) { await this.ensureInit(); const user: User = { id: genId("user"), ...insertUser, email: null }; this.users.set(user.id, user); return user; }
  async updateUserPassword(id: string, password: string) { await this.ensureInit(); const u = this.users.get(id); if (u) u.password = password; }
  async updateUserEmail(id: string, email: string) { await this.ensureInit(); const u = this.users.get(id); if (u) u.email = email; }

  async getAllQuestions() { return this.questionList; }
  async getQuestion(id: string) { return this.questionList.find(q => q.id === id); }
  async createQuestion(question: Question) { this.questionList.push(question); return question; }
  async updateQuestion(question: Question) { const i = this.questionList.findIndex(q => q.id === question.id); if (i >= 0) this.questionList[i] = question; return question; }
  async deleteQuestion(id: string) { const i = this.questionList.findIndex(q => q.id === id); if (i >= 0) this.questionList.splice(i, 1); }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) { const rt: PasswordResetToken = { id: genId("token"), userId, token, expiresAt, usedAt: null }; this.resetTokens.set(token, rt); return rt; }
  async getPasswordResetToken(token: string) { return this.resetTokens.get(token); }
  async markPasswordResetTokenUsed(token: string) { const rt = this.resetTokens.get(token); if (rt) rt.usedAt = new Date(); }

  async listCustomQuizzes() { return Array.from(this.quizzes.values()); }
  async getCustomQuiz(id: string) { return this.quizzes.get(id); }
  async createCustomQuiz(quiz: InsertCustomQuiz) { const q: CustomQuiz = { id: genId("quiz"), ...quiz, createdAt: new Date(), isActive: quiz.isActive ?? true, timeLimitMinutes: quiz.timeLimitMinutes ?? 60, description: quiz.description ?? null }; this.quizzes.set(q.id, q); return q; }
  async updateCustomQuiz(id: string, data: Partial<InsertCustomQuiz>) { const q = this.quizzes.get(id); if (!q) throw new Error("Quiz not found"); Object.assign(q, data); return q; }
  async deleteCustomQuiz(id: string) { this.quizzes.delete(id); }

  async listAssignments() { return Array.from(this.assignmentMap.values()); }
  async getAssignment(id: string) { return this.assignmentMap.get(id); }
  async createAssignment(a: InsertAssignment) { const ass: Assignment = { id: genId("asgn"), ...a, createdAt: new Date(), isPublished: a.isPublished ?? false, totalMarks: a.totalMarks ?? 40, totalTimeMinutes: a.totalTimeMinutes ?? 360, evidenceChecklist: a.evidenceChecklist ?? null }; this.assignmentMap.set(ass.id, ass); return ass; }
  async updateAssignment(id: string, data: Partial<InsertAssignment>) { const a = this.assignmentMap.get(id); if (!a) throw new Error("Assignment not found"); Object.assign(a, data); return a; }
  async deleteAssignment(id: string) { this.assignmentMap.delete(id); }
  async getFullAssignment(id: string) {
    const assignment = this.assignmentMap.get(id);
    if (!assignment) return undefined;
    const sections = await this.listAssignmentSections(id);
    const sectionsWithParts = await Promise.all(sections.map(async (section) => {
      const parts = await this.listAssignmentParts(section.id);
      const partsWithResources = await Promise.all(parts.map(async (part) => {
        const resources = await this.listAssignmentResources(part.id);
        return { ...part, resources };
      }));
      return { ...section, parts: partsWithResources };
    }));
    return { ...assignment, sections: sectionsWithParts };
  }
  async listAllAssignmentsFull() {
    const all = Array.from(this.assignmentMap.values());
    const results = await Promise.all(all.map(a => this.getFullAssignment(a.id)));
    return results.filter(Boolean);
  }

  async listAssignmentSections(assignmentId: string) { return Array.from(this.sectionMap.values()).filter(s => s.assignmentId === assignmentId).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); }
  async getAssignmentSection(id: string) { return this.sectionMap.get(id); }
  async createAssignmentSection(s: InsertAssignmentSection) { const sec: AssignmentSection = { id: genId("sec"), ...s, isCompulsory: s.isCompulsory ?? false, orderIndex: s.orderIndex ?? 0, informationSheet: s.informationSheet ?? null }; this.sectionMap.set(sec.id, sec); return sec; }
  async updateAssignmentSection(id: string, data: Partial<InsertAssignmentSection>) { const s = this.sectionMap.get(id); if (!s) throw new Error("Section not found"); Object.assign(s, data); return s; }
  async deleteAssignmentSection(id: string) { this.sectionMap.delete(id); }

  async listAssignmentParts(sectionId: string) { return Array.from(this.partMap.values()).filter(p => p.sectionId === sectionId).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); }
  async getAssignmentPart(id: string) { return this.partMap.get(id); }
  async createAssignmentPart(p: InsertAssignmentPart) { const part: AssignmentPart = { id: genId("part"), ...p, title: p.title ?? null, instructions: p.instructions ?? null, contentBlocks: p.contentBlocks ?? null, maxMarks: p.maxMarks ?? 0, orderIndex: p.orderIndex ?? 0, isPractical: p.isPractical ?? false, aiGradingGuidance: p.aiGradingGuidance ?? null, subQuestions: p.subQuestions ?? null, requiresUpload: p.requiresUpload ?? true, inputStyle: p.inputStyle ?? "text" }; this.partMap.set(part.id, part); return part; }
  async updateAssignmentPart(id: string, data: Partial<InsertAssignmentPart>) { const p = this.partMap.get(id); if (!p) throw new Error("Part not found"); Object.assign(p, data); return p; }
  async deleteAssignmentPart(id: string) { this.partMap.delete(id); }

  async listAssignmentResources(partId: string) { return Array.from(this.resourceMap.values()).filter(r => r.partId === partId); }
  async createAssignmentResource(r: InsertAssignmentResource) { const res: AssignmentResource = { id: genId("res"), ...r, fileType: r.fileType ?? null, description: r.description ?? null, uploadedAt: new Date() }; this.resourceMap.set(res.id, res); return res; }
  async deleteAssignmentResource(id: string) { this.resourceMap.delete(id); }

  async listAssignmentAttempts(assignmentId: string) { return Array.from(this.attemptMap.values()).filter(a => a.assignmentId === assignmentId); }
  async listAssignmentAttemptsByStudent(studentId: string) { return Array.from(this.attemptMap.values()).filter(a => a.localStudentId === studentId); }
  async getAssignmentAttemptByStudent(assignmentId: string, studentId: string) { return Array.from(this.attemptMap.values()).find(a => a.assignmentId === assignmentId && a.localStudentId === studentId); }
  async getAssignmentAttempt(id: string) { return this.attemptMap.get(id); }
  async createAssignmentAttempt(a: InsertAssignmentAttempt) { const att: AssignmentAttempt = { id: genId("att"), ...a, status: a.status ?? "in_progress", completedPartIds: a.completedPartIds ?? [], currentSectionId: a.currentSectionId ?? null, currentPartId: a.currentPartId ?? null, startedAt: new Date(), pausedAt: null, completedAt: null }; this.attemptMap.set(att.id, att); return att; }
  async updateAssignmentAttempt(id: string, data: Partial<AssignmentAttempt>) { const a = this.attemptMap.get(id); if (!a) throw new Error("Attempt not found"); Object.assign(a, data); return a; }
  async deleteAssignmentAttempt(id: string) { for (const [k, r] of this.responseMap) { if (r.attemptId === id) this.responseMap.delete(k); } this.attemptMap.delete(id); }

  async listAssignmentResponses(attemptId: string) { return Array.from(this.responseMap.values()).filter(r => r.attemptId === attemptId); }
  async getAssignmentResponse(id: string) { return this.responseMap.get(id); }
  async createAssignmentResponse(r: InsertAssignmentResponse) { const resp: AssignmentResponse = { id: genId("resp"), ...r, subQuestionId: r.subQuestionId ?? null, textAnswer: r.textAnswer ?? null, codeAnswer: r.codeAnswer ?? null, screenshotUrls: r.screenshotUrls ?? [], drawingData: r.drawingData ?? null, userInputs: r.userInputs ?? null, marksAwarded: r.marksAwarded ?? null, aiFeedback: r.aiFeedback ?? null, submittedAt: new Date() }; this.responseMap.set(resp.id, resp); return resp; }
  async updateAssignmentResponse(id: string, data: Partial<AssignmentResponse>) { const r = this.responseMap.get(id); if (!r) throw new Error("Response not found"); Object.assign(r, data); return r; }

  async listAdditionalExams() { return Array.from(this.additionalExamMap.values()); }
  async getAdditionalExam(id: string) { return this.additionalExamMap.get(id); }
  async createAdditionalExam(e: InsertAdditionalExam) { const exam: AdditionalExam = { id: genId("ae"), ...e, isPublished: e.isPublished ?? false, createdAt: new Date() }; this.additionalExamMap.set(exam.id, exam); return exam; }
  async updateAdditionalExam(id: string, data: Partial<InsertAdditionalExam & { isPublished: boolean }>) { const exam = this.additionalExamMap.get(id); if (!exam) throw new Error("Not found"); Object.assign(exam, data); return exam; }
  async deleteAdditionalExam(id: string) { this.additionalExamMap.delete(id); }

  async createClass(c: InsertClass) { const cls: Class = { id: genId("cls"), ...c, createdAt: new Date() }; this.classMap.set(cls.id, cls); return cls; }
  async getClass(id: string) { return this.classMap.get(id); }
  async listClassesByTeacher(teacherId: string) { return Array.from(this.classMap.values()).filter(c => c.teacherId === teacherId); }
  async updateClass(id: string, data: Partial<InsertClass>) { const c = this.classMap.get(id); if (!c) throw new Error("Class not found"); Object.assign(c, data); return c; }
  async deleteClass(id: string) {
    const studentsInClass = Array.from(this.studentMap.values()).filter(s => s.classId === id);
    for (const s of studentsInClass) {
      this.deleteStudentSessionsByStudentId(s.id);
      this.studentMap.delete(s.id);
    }
    this.classMap.delete(id);
  }

  async createStudent(s: InsertStudent) { const student: Student = { id: genId("stu"), ...s, mustChangePassword: s.mustChangePassword ?? true, createdAt: new Date() }; this.studentMap.set(student.id, student); return student; }
  async getStudent(id: string) { return this.studentMap.get(id); }
  async getStudentByUsername(username: string) { return Array.from(this.studentMap.values()).find(s => s.username === username); }
  async listStudentsByClass(classId: string) { return Array.from(this.studentMap.values()).filter(s => s.classId === classId); }
  async updateStudentPassword(id: string, password: string, mustChangePassword?: boolean) { const s = this.studentMap.get(id); if (s) { s.password = password; s.mustChangePassword = mustChangePassword ?? false; } }
  async updateStudentUsername(id: string, username: string) { const s = this.studentMap.get(id); if (s) { s.username = username; } }
  async deleteStudent(id: string) { await this.deleteStudentSessionsByStudentId(id); this.studentMap.delete(id); }

  async createStudentSession(token: string, studentId: string, username: string, expiresAt: Date) { const session: StudentSession = { token, studentId, username, expiresAt }; this.studentSessionMap.set(token, session); return session; }
  async getStudentSession(token: string) { const session = this.studentSessionMap.get(token); if (session && session.expiresAt < new Date()) { this.studentSessionMap.delete(token); return undefined; } return session; }
  async getLatestStudentSession(studentId: string) { let latest: StudentSession | undefined; this.studentSessionMap.forEach(session => { if (session.studentId === studentId && (!latest || session.expiresAt > latest.expiresAt)) latest = session; }); return latest; }
  async deleteStudentSession(token: string) { this.studentSessionMap.delete(token); }
  async deleteStudentSessionsByStudentId(studentId: string) { const toDelete: string[] = []; this.studentSessionMap.forEach((session, token) => { if (session.studentId === studentId) toDelete.push(token); }); toDelete.forEach(token => this.studentSessionMap.delete(token)); }

  async saveStudentExamResult(result: InsertStudentExamResult) { const r: StudentExamResult = { id: genId("ser"), ...result, examTitle: result.examTitle ?? null, timeSpentSeconds: result.timeSpentSeconds ?? null, answers: result.answers ?? null, completedAt: new Date() }; this.studentExamResultMap.set(r.id, r); return r; }
  async getStudentExamResults(studentId: string) { return Array.from(this.studentExamResultMap.values()).filter(r => r.studentId === studentId).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)); }
  async getStudentExamResultById(id: string) { return this.studentExamResultMap.get(id); }
  async updateStudentExamResult(id: string, data: Partial<StudentExamResult>) { const r = this.studentExamResultMap.get(id); if (!r) return undefined; Object.assign(r, data); return r; }
  async getStudentExamResultsByClass(classId: string) { const classStudentIds = new Set(Array.from(this.studentMap.values()).filter(s => s.classId === classId).map(s => s.id)); return Array.from(this.studentExamResultMap.values()).filter(r => classStudentIds.has(r.studentId)); }
  async getExamResultsByExamIdentifier(examIdentifier: string) { return Array.from(this.studentExamResultMap.values()).filter(r => r.examIdentifier === examIdentifier); }

  async upsertExamProgress(studentId: string, examType: string, examIdentifier: string, data: Partial<InsertStudentExamProgress>) {
    const key = `${studentId}:${examType}:${examIdentifier}`;
    const existing = this.examProgressMap.get(key);
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
      return existing;
    }
    const p: StudentExamProgress = { id: genId("sep"), studentId, examType, examIdentifier, examTitle: data.examTitle ?? null, totalQuestions: data.totalQuestions ?? 0, answeredQuestions: data.answeredQuestions ?? 0, currentAnswers: data.currentAnswers ?? null, status: data.status ?? "in_progress", startedAt: new Date(), updatedAt: new Date() };
    this.examProgressMap.set(key, p);
    return p;
  }
  async getExamProgressByStudent(studentId: string) { return Array.from(this.examProgressMap.values()).filter(p => p.studentId === studentId); }
  async getExamProgressForStudent(studentId: string, examType: string, examIdentifier: string) { return this.examProgressMap.get(`${studentId}:${examType}:${examIdentifier}`); }
  async deleteExamProgress(studentId: string, examType: string, examIdentifier: string) { this.examProgressMap.delete(`${studentId}:${examType}:${examIdentifier}`); }
  async deleteStudentExamResult(id: string) { this.studentExamResultMap.delete(id); }
  async getOrphanedExamResults() { return Array.from(this.studentExamResultMap.values()).filter(r => !r.studentId || r.studentId === ""); }
  async linkExamResultToStudent(examResultId: string, studentId: string) { const r = this.studentExamResultMap.get(examResultId); if (r) r.studentId = studentId; }
  async getStudentCompletedAdditionalPaperIds(studentId: string) { return Array.from(this.studentExamResultMap.values()).filter(r => r.studentId === studentId && r.additionalPaperId).map(r => r.additionalPaperId!); }
}

class DatabaseStorage implements IStorage {
  private initialized = false;

  private checkDb() {
    if (!db) throw new Error("Database not available");
    return db;
  }

  async ensureTablesExist(): Promise<boolean> {
    if (this.initialized) return true;
    if (!pool) return false;
    try {
      const client = await pool.connect();
      try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, username VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, email TEXT)`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`);
        await client.query(`CREATE TABLE IF NOT EXISTS questions (id VARCHAR(255) PRIMARY KEY, year INTEGER NOT NULL, topic VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, is_practice BOOLEAN DEFAULT false, is_quiz_only BOOLEAN DEFAULT false, scenario JSONB, sub_questions JSONB NOT NULL)`);
        await client.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_quiz_only BOOLEAN DEFAULT false`);
        await client.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, user_id VARCHAR(255) NOT NULL REFERENCES users(id), token TEXT NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, used_at TIMESTAMP)`);
        await client.query(`CREATE TABLE IF NOT EXISTS custom_quizzes (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, name TEXT NOT NULL, description TEXT, time_limit_minutes INTEGER DEFAULT 60, question_ids TEXT[] NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignments (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, year INTEGER NOT NULL, title TEXT NOT NULL, total_marks INTEGER DEFAULT 40, total_time_minutes INTEGER DEFAULT 360, is_active BOOLEAN DEFAULT false, evidence_checklist JSONB, created_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignment_sections (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, assignment_id VARCHAR(255) NOT NULL, section_type TEXT NOT NULL, title TEXT NOT NULL, is_compulsory BOOLEAN DEFAULT false, order_index INTEGER DEFAULT 0, information_sheet JSONB)`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignment_parts (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, section_id VARCHAR(255) NOT NULL, part_label TEXT NOT NULL, title TEXT, instructions TEXT, content_blocks JSONB, max_marks INTEGER DEFAULT 0, order_index INTEGER DEFAULT 0, is_practical BOOLEAN DEFAULT false, ai_grading_guidance TEXT, sub_questions JSONB, requires_upload BOOLEAN DEFAULT true, input_style TEXT DEFAULT 'text')`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignment_resources (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, part_id VARCHAR(255) NOT NULL, file_name TEXT NOT NULL, file_url TEXT NOT NULL, file_type TEXT, description TEXT, uploaded_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignment_attempts (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, assignment_id VARCHAR(255) NOT NULL, local_student_id TEXT NOT NULL, chosen_optional_section TEXT NOT NULL, status TEXT DEFAULT 'in_progress', time_remaining_seconds INTEGER NOT NULL, current_section_id VARCHAR(255), current_part_id VARCHAR(255), completed_part_ids TEXT[] DEFAULT '{}', started_at TIMESTAMP DEFAULT NOW(), paused_at TIMESTAMP, completed_at TIMESTAMP)`);
        await client.query(`CREATE TABLE IF NOT EXISTS assignment_responses (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, attempt_id VARCHAR(255) NOT NULL, part_id VARCHAR(255) NOT NULL, sub_question_id TEXT, text_answer TEXT, code_answer TEXT, screenshot_urls TEXT[] DEFAULT '{}', drawing_data TEXT, user_inputs JSONB, marks_awarded INTEGER, ai_feedback TEXT, submitted_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS classes (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, name TEXT NOT NULL, teacher_id VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS students (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, class_id VARCHAR(255) NOT NULL, must_change_password BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS student_sessions (token VARCHAR(255) PRIMARY KEY, student_id VARCHAR(255) NOT NULL, username TEXT NOT NULL, expires_at TIMESTAMP NOT NULL)`);
        await client.query(`CREATE TABLE IF NOT EXISTS student_exam_results (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, student_id VARCHAR(255) NOT NULL, exam_type TEXT NOT NULL, exam_identifier TEXT NOT NULL, exam_title TEXT, score INTEGER NOT NULL, max_marks INTEGER NOT NULL, percentage REAL NOT NULL, time_spent_seconds INTEGER, answers JSONB, completed_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS student_exam_progress (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, student_id VARCHAR(255) NOT NULL, exam_type TEXT NOT NULL, exam_identifier TEXT NOT NULL, exam_title TEXT, total_questions INTEGER DEFAULT 0, answered_questions INTEGER DEFAULT 0, answered_question_ids JSONB, current_answers JSONB, status TEXT DEFAULT 'in_progress', started_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await client.query(`ALTER TABLE student_exam_progress ADD COLUMN IF NOT EXISTS answered_question_ids JSONB`);
        await client.query(`ALTER TABLE student_exam_progress ADD COLUMN IF NOT EXISTS time_left INTEGER`);
        await client.query(`ALTER TABLE student_exam_progress ADD COLUMN IF NOT EXISTS current_question_index INTEGER`);
        await client.query(`ALTER TABLE student_exam_progress ADD COLUMN IF NOT EXISTS extra_time_added TEXT`);
        await client.query(`ALTER TABLE student_exam_results ADD COLUMN IF NOT EXISTS additional_paper_id TEXT`);
        await client.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_additional_exam BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS additional_exam_id VARCHAR(255)`);
        await client.query(`CREATE TABLE IF NOT EXISTS additional_exams (id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar, title TEXT NOT NULL, is_published BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
        console.log("Database tables verified/created");
        this.initialized = true;
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Failed to create tables:", error);
      return false;
    }
  }

  async getUser(id: string) { const database = this.checkDb(); const result = await database.select().from(users).where(eq(users.id, id)); return result[0]; }
  async getUserByUsername(username: string) { const database = this.checkDb(); const result = await database.select().from(users).where(eq(users.username, username)); return result[0]; }
  async getUserByEmail(email: string) { const database = this.checkDb(); const result = await database.select().from(users).where(eq(users.email, email)); return result[0]; }
  async createUser(insertUser: InsertUser) { const database = this.checkDb(); const result = await database.insert(users).values({ id: genId("user"), ...insertUser }).returning(); return result[0]; }
  async updateUserPassword(id: string, password: string) { const database = this.checkDb(); await database.update(users).set({ password }).where(eq(users.id, id)); }
  async updateUserEmail(id: string, email: string) { const database = this.checkDb(); await database.update(users).set({ email }).where(eq(users.id, id)); }

  async getAllQuestions() { const database = this.checkDb(); const result = await database.select().from(questions); return result.map(this.dbToQuestion); }
  async getQuestion(id: string) { const database = this.checkDb(); const result = await database.select().from(questions).where(eq(questions.id, id)); return result[0] ? this.dbToQuestion(result[0]) : undefined; }
  async createQuestion(question: Question) { const database = this.checkDb(); await database.insert(questions).values(this.questionToDb(question)); return question; }
  async updateQuestion(question: Question) { const database = this.checkDb(); await database.update(questions).set(this.questionToDb(question)).where(eq(questions.id, question.id)); return question; }
  async deleteQuestion(id: string) { const database = this.checkDb(); await database.delete(questions).where(eq(questions.id, id)); }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) { const database = this.checkDb(); const result = await database.insert(passwordResetTokens).values({ id: genId("token"), userId, token, expiresAt, usedAt: null }).returning(); return result[0]; }
  async getPasswordResetToken(token: string) { const database = this.checkDb(); const result = await database.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)); return result[0]; }
  async markPasswordResetTokenUsed(token: string) { const database = this.checkDb(); await database.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token)); }

  async listCustomQuizzes() { const database = this.checkDb(); return database.select().from(customQuizzes).orderBy(desc(customQuizzes.createdAt)); }
  async getCustomQuiz(id: string) { const database = this.checkDb(); const result = await database.select().from(customQuizzes).where(eq(customQuizzes.id, id)); return result[0]; }
  async createCustomQuiz(quiz: InsertCustomQuiz) { const database = this.checkDb(); const result = await database.insert(customQuizzes).values({ id: genId("quiz"), ...quiz }).returning(); return result[0]; }
  async updateCustomQuiz(id: string, data: Partial<InsertCustomQuiz>) { const database = this.checkDb(); const result = await database.update(customQuizzes).set(data).where(eq(customQuizzes.id, id)).returning(); return result[0]; }
  async deleteCustomQuiz(id: string) { const database = this.checkDb(); await database.delete(customQuizzes).where(eq(customQuizzes.id, id)); }

  async listAssignments() { const database = this.checkDb(); return database.select().from(assignments).orderBy(desc(assignments.createdAt)); }
  async getAssignment(id: string) { const database = this.checkDb(); const result = await database.select().from(assignments).where(eq(assignments.id, id)); return result[0]; }
  async createAssignment(a: InsertAssignment) { const database = this.checkDb(); const result = await database.insert(assignments).values({ id: genId("asgn"), ...a }).returning(); return result[0]; }
  async updateAssignment(id: string, data: Partial<InsertAssignment>) { const database = this.checkDb(); const result = await database.update(assignments).set(data).where(eq(assignments.id, id)).returning(); return result[0]; }
  async deleteAssignment(id: string) {
    const database = this.checkDb();
    const sections = await this.listAssignmentSections(id);
    for (const sec of sections) {
      const parts = await this.listAssignmentParts(sec.id);
      for (const part of parts) {
        await database.delete(assignmentResources).where(eq(assignmentResources.partId, part.id));
      }
      await database.delete(assignmentParts).where(eq(assignmentParts.sectionId, sec.id));
    }
    await database.delete(assignmentSections).where(eq(assignmentSections.assignmentId, id));
    await database.delete(assignments).where(eq(assignments.id, id));
  }

  async getFullAssignment(id: string) {
    const database = this.checkDb();
    const [assignmentResult, allSections] = await Promise.all([
      database.select().from(assignments).where(eq(assignments.id, id)),
      database.select().from(assignmentSections).where(eq(assignmentSections.assignmentId, id)).orderBy(assignmentSections.orderIndex),
    ]);
    const assignment = assignmentResult[0];
    if (!assignment) return undefined;
    if (allSections.length === 0) return { ...assignment, sections: [] };
    const sectionIds = allSections.map(s => s.id);
    const [allParts, ] = await Promise.all([
      database.select().from(assignmentParts).where(inArray(assignmentParts.sectionId, sectionIds)).orderBy(assignmentParts.orderIndex),
    ]);
    let allResources: AssignmentResource[] = [];
    const partIds = allParts.map(p => p.id);
    if (partIds.length > 0) {
      allResources = await database.select().from(assignmentResources).where(inArray(assignmentResources.partId, partIds));
    }
    const resourcesByPart = new Map<string, AssignmentResource[]>();
    for (const r of allResources) {
      const list = resourcesByPart.get(r.partId) || [];
      list.push(r);
      resourcesByPart.set(r.partId, list);
    }
    const partsBySection = new Map<string, any[]>();
    for (const p of allParts) {
      const list = partsBySection.get(p.sectionId) || [];
      list.push({ ...p, resources: resourcesByPart.get(p.id) || [] });
      partsBySection.set(p.sectionId, list);
    }
    const sectionsWithParts = allSections.map(s => ({
      ...s,
      parts: partsBySection.get(s.id) || [],
    }));
    return { ...assignment, sections: sectionsWithParts };
  }

  async listAllAssignmentsFull() {
    const database = this.checkDb();
    const [allAssignments, allSections] = await Promise.all([
      database.select().from(assignments).orderBy(desc(assignments.createdAt)),
      database.select().from(assignmentSections).orderBy(assignmentSections.orderIndex),
    ]);
    if (allAssignments.length === 0) return [];
    const sectionIds = allSections.map(s => s.id);
    let allParts: any[] = [];
    let allResources: AssignmentResource[] = [];
    if (sectionIds.length > 0) {
      allParts = await database.select().from(assignmentParts).where(inArray(assignmentParts.sectionId, sectionIds)).orderBy(assignmentParts.orderIndex);
      const partIds = allParts.map(p => p.id);
      if (partIds.length > 0) {
        allResources = await database.select().from(assignmentResources).where(inArray(assignmentResources.partId, partIds));
      }
    }
    const resourcesByPart = new Map<string, AssignmentResource[]>();
    for (const r of allResources) {
      const list = resourcesByPart.get(r.partId) || [];
      list.push(r);
      resourcesByPart.set(r.partId, list);
    }
    const partsBySection = new Map<string, any[]>();
    for (const p of allParts) {
      const list = partsBySection.get(p.sectionId) || [];
      list.push({ ...p, resources: resourcesByPart.get(p.id) || [] });
      partsBySection.set(p.sectionId, list);
    }
    const sectionsByAssignment = new Map<string, any[]>();
    for (const s of allSections) {
      const list = sectionsByAssignment.get(s.assignmentId) || [];
      list.push({ ...s, parts: partsBySection.get(s.id) || [] });
      sectionsByAssignment.set(s.assignmentId, list);
    }
    return allAssignments.map(a => ({
      ...a,
      sections: sectionsByAssignment.get(a.id) || [],
    }));
  }

  async listAssignmentSections(assignmentId: string) { const database = this.checkDb(); return database.select().from(assignmentSections).where(eq(assignmentSections.assignmentId, assignmentId)).orderBy(assignmentSections.orderIndex); }
  async getAssignmentSection(id: string) { const database = this.checkDb(); const result = await database.select().from(assignmentSections).where(eq(assignmentSections.id, id)); return result[0]; }
  async createAssignmentSection(s: InsertAssignmentSection) { const database = this.checkDb(); const result = await database.insert(assignmentSections).values({ id: genId("sec"), ...s }).returning(); return result[0]; }
  async updateAssignmentSection(id: string, data: Partial<InsertAssignmentSection>) { const database = this.checkDb(); const result = await database.update(assignmentSections).set(data).where(eq(assignmentSections.id, id)).returning(); return result[0]; }
  async deleteAssignmentSection(id: string) {
    const database = this.checkDb();
    const parts = await this.listAssignmentParts(id);
    for (const part of parts) {
      await database.delete(assignmentResources).where(eq(assignmentResources.partId, part.id));
    }
    await database.delete(assignmentParts).where(eq(assignmentParts.sectionId, id));
    await database.delete(assignmentSections).where(eq(assignmentSections.id, id));
  }

  async listAssignmentParts(sectionId: string) { const database = this.checkDb(); return database.select().from(assignmentParts).where(eq(assignmentParts.sectionId, sectionId)).orderBy(assignmentParts.orderIndex); }
  async getAssignmentPart(id: string) { const database = this.checkDb(); const result = await database.select().from(assignmentParts).where(eq(assignmentParts.id, id)); return result[0]; }
  async createAssignmentPart(p: InsertAssignmentPart) { const database = this.checkDb(); const result = await database.insert(assignmentParts).values({ id: genId("part"), ...p }).returning(); return result[0]; }
  async updateAssignmentPart(id: string, data: Partial<InsertAssignmentPart>) { const database = this.checkDb(); const result = await database.update(assignmentParts).set(data).where(eq(assignmentParts.id, id)).returning(); return result[0]; }
  async deleteAssignmentPart(id: string) { const database = this.checkDb(); await database.delete(assignmentResources).where(eq(assignmentResources.partId, id)); await database.delete(assignmentParts).where(eq(assignmentParts.id, id)); }

  async listAssignmentResources(partId: string) { const database = this.checkDb(); return database.select().from(assignmentResources).where(eq(assignmentResources.partId, partId)); }
  async createAssignmentResource(r: InsertAssignmentResource) { const database = this.checkDb(); const result = await database.insert(assignmentResources).values({ id: genId("res"), ...r }).returning(); return result[0]; }
  async deleteAssignmentResource(id: string) { const database = this.checkDb(); await database.delete(assignmentResources).where(eq(assignmentResources.id, id)); }

  async listAssignmentAttempts(assignmentId: string) { const database = this.checkDb(); return database.select().from(assignmentAttempts).where(eq(assignmentAttempts.assignmentId, assignmentId)).orderBy(desc(assignmentAttempts.startedAt)); }
  async listAssignmentAttemptsByStudent(studentId: string) { const database = this.checkDb(); return database.select().from(assignmentAttempts).where(eq(assignmentAttempts.localStudentId, studentId)).orderBy(desc(assignmentAttempts.startedAt)); }
  async getAssignmentAttemptByStudent(assignmentId: string, studentId: string) { const database = this.checkDb(); const result = await database.select().from(assignmentAttempts).where(and(eq(assignmentAttempts.assignmentId, assignmentId), eq(assignmentAttempts.localStudentId, studentId))); return result[0]; }
  async getAssignmentAttempt(id: string) { const database = this.checkDb(); const result = await database.select().from(assignmentAttempts).where(eq(assignmentAttempts.id, id)); return result[0]; }
  async createAssignmentAttempt(a: InsertAssignmentAttempt) { const database = this.checkDb(); const result = await database.insert(assignmentAttempts).values({ id: genId("att"), ...a }).returning(); return result[0]; }
  async updateAssignmentAttempt(id: string, data: Partial<AssignmentAttempt>) { const database = this.checkDb(); const { id: _id, ...updateData } = data; const result = await database.update(assignmentAttempts).set(updateData).where(eq(assignmentAttempts.id, id)).returning(); return result[0]; }
  async deleteAssignmentAttempt(id: string) { const database = this.checkDb(); await database.delete(assignmentResponses).where(eq(assignmentResponses.attemptId, id)); await database.delete(assignmentAttempts).where(eq(assignmentAttempts.id, id)); }

  async listAssignmentResponses(attemptId: string) { const database = this.checkDb(); return database.select().from(assignmentResponses).where(eq(assignmentResponses.attemptId, attemptId)); }
  async getAssignmentResponse(id: string) { const database = this.checkDb(); const result = await database.select().from(assignmentResponses).where(eq(assignmentResponses.id, id)); return result[0]; }
  async createAssignmentResponse(r: InsertAssignmentResponse) { const database = this.checkDb(); const result = await database.insert(assignmentResponses).values({ id: genId("resp"), ...r }).returning(); return result[0]; }
  async updateAssignmentResponse(id: string, data: Partial<AssignmentResponse>) { const database = this.checkDb(); const { id: _id, ...updateData } = data; const result = await database.update(assignmentResponses).set(updateData).where(eq(assignmentResponses.id, id)).returning(); return result[0]; }

  async listAdditionalExams() { const database = this.checkDb(); return database.select().from(additionalExams).orderBy(desc(additionalExams.createdAt)); }
  async getAdditionalExam(id: string) { const database = this.checkDb(); const result = await database.select().from(additionalExams).where(eq(additionalExams.id, id)); return result[0]; }
  async createAdditionalExam(e: InsertAdditionalExam) { const database = this.checkDb(); const result = await database.insert(additionalExams).values(e).returning(); return result[0]; }
  async updateAdditionalExam(id: string, data: Partial<InsertAdditionalExam & { isPublished: boolean }>) { const database = this.checkDb(); const result = await database.update(additionalExams).set(data).where(eq(additionalExams.id, id)).returning(); return result[0]; }
  async deleteAdditionalExam(id: string) { const database = this.checkDb(); await database.delete(questions).where(eq(questions.additionalExamId, id)); await database.delete(additionalExams).where(eq(additionalExams.id, id)); }

  async createClass(c: InsertClass) { const database = this.checkDb(); const result = await database.insert(classes).values({ id: genId("cls"), course: 'higher', ...c } as any).returning(); return result[0] as unknown as Class; }
  async getClass(id: string) { const database = this.checkDb(); const result = await database.select().from(classes).where(eq(classes.id, id)); return result[0] as unknown as Class | undefined; }
  async listClassesByTeacher(teacherId: string) { const database = this.checkDb(); return database.select().from(classes).where(and(eq(classes.course, 'higher'), eq(classes.teacherId, teacherId))).orderBy(desc(classes.createdAt)) as unknown as Promise<Class[]>; }
  async updateClass(id: string, data: Partial<InsertClass>) { const database = this.checkDb(); const result = await database.update(classes).set(data as any).where(eq(classes.id, id)).returning(); return result[0] as unknown as Class; }
  async deleteClass(id: string) {
    const database = this.checkDb();
    const classStudents = await this.listStudentsByClass(id);
    for (const s of classStudents) {
      await database.delete(studentSessions).where(eq(studentSessions.studentId, s.id));
      await database.delete(studentExamResults).where(eq(studentExamResults.studentId, s.id));
    }
    await database.delete(students).where(eq(students.classId, id));
    await database.delete(classes).where(eq(classes.id, id));
  }

  async createStudent(s: InsertStudent) { const database = this.checkDb(); const result = await database.insert(students).values({ id: genId("stu"), course: 'higher', ...s } as any).returning(); return result[0] as unknown as Student; }
  async getStudent(id: string) { const database = this.checkDb(); const result = await database.select().from(students).where(eq(students.id, id)); return result[0] as unknown as Student | undefined; }
  async getStudentByUsername(username: string) { const database = this.checkDb(); const result = await database.select().from(students).where(and(eq(students.course, 'higher'), eq(students.username, username))); return result[0] as unknown as Student | undefined; }
  async listStudentsByClass(classId: string) { const database = this.checkDb(); return database.select().from(students).where(eq(students.classId, classId)) as unknown as Promise<Student[]>; }
  async updateStudentPassword(id: string, password: string, mustChangePassword?: boolean) { const database = this.checkDb(); await database.update(students).set({ password, mustChangePassword: mustChangePassword ?? false }).where(eq(students.id, id)); }
  async updateStudentUsername(id: string, username: string) { const database = this.checkDb(); await database.update(students).set({ username }).where(eq(students.id, id)); }
  async deleteStudent(id: string) { const database = this.checkDb(); await database.delete(studentSessions).where(eq(studentSessions.studentId, id)); await database.delete(studentExamResults).where(eq(studentExamResults.studentId, id)); await database.delete(students).where(eq(students.id, id)); }

  async createStudentSession(token: string, studentId: string, username: string, expiresAt: Date) { const database = this.checkDb(); const result = await database.insert(studentSessions).values({ token, studentId, username, expiresAt }).returning(); return result[0]; }
  async getStudentSession(token: string) { const database = this.checkDb(); const result = await database.select().from(studentSessions).where(eq(studentSessions.token, token)); const session = result[0]; if (session && session.expiresAt < new Date()) { await this.deleteStudentSession(token); return undefined; } return session; }
  async getLatestStudentSession(studentId: string) { const database = this.checkDb(); const result = await database.select().from(studentSessions).where(eq(studentSessions.studentId, studentId)).orderBy(desc(studentSessions.expiresAt)).limit(1); return result[0]; }
  async deleteStudentSession(token: string) { const database = this.checkDb(); await database.delete(studentSessions).where(eq(studentSessions.token, token)); }
  async deleteStudentSessionsByStudentId(studentId: string) { const database = this.checkDb(); await database.delete(studentSessions).where(eq(studentSessions.studentId, studentId)); }

  async saveStudentExamResult(result: InsertStudentExamResult) { const database = this.checkDb(); const r = await database.insert(studentExamResults).values({ id: genId("ser"), ...result }).returning(); return r[0]; }
  async getStudentExamResults(studentId: string) { const database = this.checkDb(); return database.select().from(studentExamResults).where(eq(studentExamResults.studentId, studentId)).orderBy(desc(studentExamResults.completedAt)); }
  async getStudentExamResultById(id: string) { const database = this.checkDb(); const r = await database.select().from(studentExamResults).where(eq(studentExamResults.id, id)); return r[0]; }
  async updateStudentExamResult(id: string, data: Partial<StudentExamResult>) { const database = this.checkDb(); const r = await database.update(studentExamResults).set(data).where(eq(studentExamResults.id, id)).returning(); return r[0]; }
  async getStudentExamResultsByClass(classId: string) {
    const database = this.checkDb();
    const classStudents = await this.listStudentsByClass(classId);
    if (classStudents.length === 0) return [];
    const studentIds = classStudents.map(s => s.id);
    return database.select().from(studentExamResults).where(inArray(studentExamResults.studentId, studentIds)).orderBy(desc(studentExamResults.completedAt));
  }
  async getExamResultsByExamIdentifier(examIdentifier: string) { const database = this.checkDb(); return database.select().from(studentExamResults).where(eq(studentExamResults.examIdentifier, examIdentifier)).orderBy(desc(studentExamResults.completedAt)); }

  async upsertExamProgress(studentId: string, examType: string, examIdentifier: string, data: Partial<InsertStudentExamProgress>) {
    const database = this.checkDb();
    const existing = await database.select().from(studentExamProgress).where(and(eq(studentExamProgress.studentId, studentId), eq(studentExamProgress.examType, examType), eq(studentExamProgress.examIdentifier, examIdentifier)));
    if (existing[0]) {
      const result = await database.update(studentExamProgress).set({ ...data, updatedAt: new Date() }).where(eq(studentExamProgress.id, existing[0].id)).returning();
      return result[0];
    }
    const result = await database.insert(studentExamProgress).values({ id: genId("sep"), studentId, examType, examIdentifier, ...data }).returning();
    return result[0];
  }
  async getExamProgressByStudent(studentId: string) { const database = this.checkDb(); return database.select().from(studentExamProgress).where(eq(studentExamProgress.studentId, studentId)).orderBy(desc(studentExamProgress.updatedAt)); }
  async getExamProgressForStudent(studentId: string, examType: string, examIdentifier: string) { const database = this.checkDb(); const result = await database.select().from(studentExamProgress).where(and(eq(studentExamProgress.studentId, studentId), eq(studentExamProgress.examType, examType), eq(studentExamProgress.examIdentifier, examIdentifier))); return result[0]; }
  async deleteExamProgress(studentId: string, examType: string, examIdentifier: string) { const database = this.checkDb(); await database.delete(studentExamProgress).where(and(eq(studentExamProgress.studentId, studentId), eq(studentExamProgress.examType, examType), eq(studentExamProgress.examIdentifier, examIdentifier))); }
  async deleteStudentExamResult(id: string) { const database = this.checkDb(); await database.delete(studentExamResults).where(eq(studentExamResults.id, id)); }
  async getOrphanedExamResults() { const database = this.checkDb(); return database.select().from(studentExamResults).where(or(eq(studentExamResults.studentId, ""), isNull(studentExamResults.studentId))).orderBy(desc(studentExamResults.completedAt)); }
  async linkExamResultToStudent(examResultId: string, studentId: string) { const database = this.checkDb(); await database.update(studentExamResults).set({ studentId }).where(eq(studentExamResults.id, examResultId)); }
  async getStudentCompletedAdditionalPaperIds(studentId: string) { const database = this.checkDb(); const results = await database.select({ additionalPaperId: studentExamResults.additionalPaperId }).from(studentExamResults).where(and(eq(studentExamResults.studentId, studentId), isNotNull(studentExamResults.additionalPaperId))); return results.map(r => r.additionalPaperId!).filter(Boolean); }

  private dbToQuestion(dbQ: DbQuestion): Question {
    return {
      id: dbQ.id, year: dbQ.year ?? 0, topic: dbQ.topic as Question["topic"], title: dbQ.title,
      isPractice: dbQ.isPractice || false, isQuizOnly: dbQ.isQuizOnly || false,
      isAdditionalExam: (dbQ as any).isAdditionalExam || false,
      additionalExamId: (dbQ as any).additionalExamId || null,
      scenario: dbQ.scenario as Question["scenario"], subQuestions: dbQ.subQuestions as Question["subQuestions"],
    };
  }

  private questionToDb(q: Question): typeof questions.$inferInsert {
    return {
      id: q.id, year: q.year, topic: q.topic, title: q.title,
      isPractice: q.isPractice || false, isQuizOnly: (q as any).isQuizOnly || false,
      isAdditionalExam: (q as any).isAdditionalExam || false,
      additionalExamId: (q as any).additionalExamId || null,
      scenario: q.scenario || null, subQuestions: q.subQuestions,
    };
  }
}

const databaseStorage = dbAvailable ? new DatabaseStorage() : null;
const memoryStorage = new MemoryStorage();
let activeStorage: IStorage = databaseStorage || memoryStorage;
let usingDatabase = !!databaseStorage;

export const storage: IStorage = {
  getUser: (id) => activeStorage.getUser(id),
  getUserByUsername: (username) => activeStorage.getUserByUsername(username),
  getUserByEmail: (email) => activeStorage.getUserByEmail(email),
  createUser: (user) => activeStorage.createUser(user),
  updateUserPassword: (id, password) => activeStorage.updateUserPassword(id, password),
  updateUserEmail: (id, email) => activeStorage.updateUserEmail(id, email),
  getAllQuestions: () => activeStorage.getAllQuestions(),
  getQuestion: (id) => activeStorage.getQuestion(id),
  createQuestion: (question) => activeStorage.createQuestion(question),
  updateQuestion: (question) => activeStorage.updateQuestion(question),
  deleteQuestion: (id) => activeStorage.deleteQuestion(id),
  createPasswordResetToken: (userId, token, expiresAt) => activeStorage.createPasswordResetToken(userId, token, expiresAt),
  getPasswordResetToken: (token) => activeStorage.getPasswordResetToken(token),
  markPasswordResetTokenUsed: (token) => activeStorage.markPasswordResetTokenUsed(token),

  listCustomQuizzes: () => activeStorage.listCustomQuizzes(),
  getCustomQuiz: (id) => activeStorage.getCustomQuiz(id),
  createCustomQuiz: (quiz) => activeStorage.createCustomQuiz(quiz),
  updateCustomQuiz: (id, quiz) => activeStorage.updateCustomQuiz(id, quiz),
  deleteCustomQuiz: (id) => activeStorage.deleteCustomQuiz(id),

  listAssignments: () => activeStorage.listAssignments(),
  getAssignment: (id) => activeStorage.getAssignment(id),
  getFullAssignment: (id) => activeStorage.getFullAssignment(id),
  listAllAssignmentsFull: () => activeStorage.listAllAssignmentsFull(),
  createAssignment: (a) => activeStorage.createAssignment(a),
  updateAssignment: (id, a) => activeStorage.updateAssignment(id, a),
  deleteAssignment: (id) => activeStorage.deleteAssignment(id),

  listAssignmentSections: (assignmentId) => activeStorage.listAssignmentSections(assignmentId),
  getAssignmentSection: (id) => activeStorage.getAssignmentSection(id),
  createAssignmentSection: (s) => activeStorage.createAssignmentSection(s),
  updateAssignmentSection: (id, s) => activeStorage.updateAssignmentSection(id, s),
  deleteAssignmentSection: (id) => activeStorage.deleteAssignmentSection(id),

  listAssignmentParts: (sectionId) => activeStorage.listAssignmentParts(sectionId),
  getAssignmentPart: (id) => activeStorage.getAssignmentPart(id),
  createAssignmentPart: (p) => activeStorage.createAssignmentPart(p),
  updateAssignmentPart: (id, p) => activeStorage.updateAssignmentPart(id, p),
  deleteAssignmentPart: (id) => activeStorage.deleteAssignmentPart(id),

  listAssignmentResources: (partId) => activeStorage.listAssignmentResources(partId),
  createAssignmentResource: (r) => activeStorage.createAssignmentResource(r),
  deleteAssignmentResource: (id) => activeStorage.deleteAssignmentResource(id),

  listAssignmentAttempts: (assignmentId) => activeStorage.listAssignmentAttempts(assignmentId),
  listAssignmentAttemptsByStudent: (studentId) => activeStorage.listAssignmentAttemptsByStudent(studentId),
  getAssignmentAttempt: (id) => activeStorage.getAssignmentAttempt(id),
  getAssignmentAttemptByStudent: (assignmentId, studentId) => activeStorage.getAssignmentAttemptByStudent(assignmentId, studentId),
  createAssignmentAttempt: (a) => activeStorage.createAssignmentAttempt(a),
  updateAssignmentAttempt: (id, a) => activeStorage.updateAssignmentAttempt(id, a),
  deleteAssignmentAttempt: (id) => activeStorage.deleteAssignmentAttempt(id),

  listAssignmentResponses: (attemptId) => activeStorage.listAssignmentResponses(attemptId),
  getAssignmentResponse: (id) => activeStorage.getAssignmentResponse(id),
  createAssignmentResponse: (r) => activeStorage.createAssignmentResponse(r),
  updateAssignmentResponse: (id, r) => activeStorage.updateAssignmentResponse(id, r),

  listAdditionalExams: () => activeStorage.listAdditionalExams(),
  getAdditionalExam: (id) => activeStorage.getAdditionalExam(id),
  createAdditionalExam: (e) => activeStorage.createAdditionalExam(e),
  updateAdditionalExam: (id, data) => activeStorage.updateAdditionalExam(id, data),
  deleteAdditionalExam: (id) => activeStorage.deleteAdditionalExam(id),

  createClass: (c) => activeStorage.createClass(c),
  getClass: (id) => activeStorage.getClass(id),
  listClassesByTeacher: (teacherId) => activeStorage.listClassesByTeacher(teacherId),
  updateClass: (id, data) => activeStorage.updateClass(id, data),
  deleteClass: (id) => activeStorage.deleteClass(id),

  createStudent: (s) => activeStorage.createStudent(s),
  getStudent: (id) => activeStorage.getStudent(id),
  getStudentByUsername: (username) => activeStorage.getStudentByUsername(username),
  listStudentsByClass: (classId) => activeStorage.listStudentsByClass(classId),
  updateStudentPassword: (id, password, mustChangePassword) => activeStorage.updateStudentPassword(id, password, mustChangePassword),
  updateStudentUsername: (id, username) => activeStorage.updateStudentUsername(id, username),
  deleteStudent: (id) => activeStorage.deleteStudent(id),

  createStudentSession: (token, studentId, username, expiresAt) => activeStorage.createStudentSession(token, studentId, username, expiresAt),
  getStudentSession: (token) => activeStorage.getStudentSession(token),
  getLatestStudentSession: (studentId) => activeStorage.getLatestStudentSession(studentId),
  deleteStudentSession: (token) => activeStorage.deleteStudentSession(token),
  deleteStudentSessionsByStudentId: (studentId) => activeStorage.deleteStudentSessionsByStudentId(studentId),

  saveStudentExamResult: (result) => activeStorage.saveStudentExamResult(result),
  getStudentExamResults: (studentId) => activeStorage.getStudentExamResults(studentId),
  getStudentExamResultById: (id) => activeStorage.getStudentExamResultById(id),
  updateStudentExamResult: (id, data) => activeStorage.updateStudentExamResult(id, data),
  getStudentExamResultsByClass: (classId) => activeStorage.getStudentExamResultsByClass(classId),
  getExamResultsByExamIdentifier: (examIdentifier) => activeStorage.getExamResultsByExamIdentifier(examIdentifier),

  upsertExamProgress: (studentId, examType, examIdentifier, data) => activeStorage.upsertExamProgress(studentId, examType, examIdentifier, data),
  getExamProgressByStudent: (studentId) => activeStorage.getExamProgressByStudent(studentId),
  getExamProgressForStudent: (studentId, examType, examIdentifier) => activeStorage.getExamProgressForStudent(studentId, examType, examIdentifier),
  deleteExamProgress: (studentId, examType, examIdentifier) => activeStorage.deleteExamProgress(studentId, examType, examIdentifier),
  deleteStudentExamResult: (id) => activeStorage.deleteStudentExamResult(id),
  getOrphanedExamResults: () => activeStorage.getOrphanedExamResults(),
  linkExamResultToStudent: (examResultId, studentId) => activeStorage.linkExamResultToStudent(examResultId, studentId),
  getStudentCompletedAdditionalPaperIds: (studentId) => activeStorage.getStudentCompletedAdditionalPaperIds(studentId),
};

export async function initializeDatabase(): Promise<boolean> {
  if (databaseStorage) {
    try {
      console.log("Testing database connection...");
      const connected = await testConnection(5000);
      if (!connected) {
        console.error("Database connection failed - switching to in-memory storage");
        activeStorage = memoryStorage;
        usingDatabase = false;
        return false;
      }
      const success = await databaseStorage.ensureTablesExist();
      if (success) {
        console.log("Database initialized successfully - data will persist");
        usingDatabase = true;
        return true;
      } else {
        console.error("Failed to create tables - switching to in-memory storage");
        activeStorage = memoryStorage;
        usingDatabase = false;
        return false;
      }
    } catch (error) {
      console.error("Database initialization failed:", error);
      activeStorage = memoryStorage;
      usingDatabase = false;
      return false;
    }
  }
  console.log("No database configured - using in-memory storage");
  return false;
}

export function isUsingDatabase(): boolean {
  return usingDatabase;
}

console.log(`Initial storage mode: ${dbAvailable ? 'Database (pending connection test)' : 'In-Memory'}`);
