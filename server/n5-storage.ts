import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, and, isNull, or, inArray } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { 
  type User, type InsertUser, type DbQuestion, type CustomQuiz, type InsertCustomQuiz, 
  type Assignment, type InsertAssignment, type AssignmentSection, type InsertAssignmentSection,
  type AssignmentPart, type InsertAssignmentPart, type AssignmentResource, type InsertAssignmentResource,
  type AssignmentAttempt, type InsertAssignmentAttempt, type AssignmentResponse, type InsertAssignmentResponse,
  type Class, type InsertClass, type Student, type InsertStudent, type ExamResult, type InsertExamResult,
  type AdditionalPaper, type InsertAdditionalPaper,
  type ActiveExamProgress, type InsertActiveExamProgress,
  users, questions, customQuizzes, passwordResetTokens,
  assignments, assignmentSections, assignmentParts, assignmentResources, assignmentAttempts, assignmentResponses,
  classes, students, examResults, additionalPapers, activeExamProgress
} from "@shared/n5-schema";
import { gt } from "drizzle-orm";
import { Question } from "../n5-client/src/lib/past-papers";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;
  
  if (!envUrl) {
    console.log("DATABASE_URL environment variable not set");
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
                     databaseUrl.includes('.neon.tech') ||
                     databaseUrl.includes('sslmode=require') ||
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

// Test database connection with a short timeout
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
          .then(() => {
            client.release();
            console.log('Database connection test: SUCCESS');
            resolve(true);
          })
          .catch((err) => {
            client.release();
            console.error('Database connection test: QUERY FAILED -', err.message);
            resolve(false);
          });
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('Database connection test: CONNECT FAILED -', err.message);
        resolve(false);
      });
  });
}

export { db };

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  updateUserEmail(id: string, email: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; usedAt: Date | null } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  getAllQuestions(): Promise<Question[]>;
  getRegularQuestions(): Promise<Question[]>;
  getQuizOnlyQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: Question): Promise<Question>;
  updateQuestion(question: Question): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  getAllCustomQuizzes(): Promise<CustomQuiz[]>;
  getActiveCustomQuizzes(): Promise<CustomQuiz[]>;
  getCustomQuiz(id: string): Promise<CustomQuiz | undefined>;
  createCustomQuiz(quiz: InsertCustomQuiz): Promise<CustomQuiz>;
  updateCustomQuiz(id: string, quiz: Partial<InsertCustomQuiz>): Promise<CustomQuiz>;
  deleteCustomQuiz(id: string): Promise<void>;
  // Assignment methods
  getAllAssignments(): Promise<Assignment[]>;
  getPublishedAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;
  getAssignmentSections(assignmentId: string): Promise<AssignmentSection[]>;
  createAssignmentSection(section: InsertAssignmentSection): Promise<AssignmentSection>;
  updateAssignmentSection(id: string, section: Partial<InsertAssignmentSection>): Promise<AssignmentSection>;
  deleteAssignmentSection(id: string): Promise<void>;
  getAssignmentParts(sectionId: string): Promise<AssignmentPart[]>;
  getAssignmentPart(id: string): Promise<AssignmentPart | undefined>;
  createAssignmentPart(part: InsertAssignmentPart): Promise<AssignmentPart>;
  updateAssignmentPart(id: string, part: Partial<InsertAssignmentPart>): Promise<AssignmentPart>;
  deleteAssignmentPart(id: string): Promise<void>;
  getAssignmentResources(partId: string): Promise<AssignmentResource[]>;
  createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource>;
  deleteAssignmentResource(id: string): Promise<void>;
  getAssignmentAttempt(id: string): Promise<AssignmentAttempt | undefined>;
  getAssignmentAttemptByStudent(assignmentId: string, localStudentId: string): Promise<AssignmentAttempt | undefined>;
  getAssignmentAttemptsByStudent(localStudentId: string): Promise<AssignmentAttempt[]>;
  createAssignmentAttempt(attempt: InsertAssignmentAttempt): Promise<AssignmentAttempt>;
  updateAssignmentAttempt(id: string, attempt: Partial<AssignmentAttempt>): Promise<AssignmentAttempt>;
  getAssignmentResponses(attemptId: string): Promise<AssignmentResponse[]>;
  getAssignmentResponse(attemptId: string, partId: string, subQuestionId?: string): Promise<AssignmentResponse | undefined>;
  getAssignmentResponseById(id: string): Promise<AssignmentResponse | undefined>;
  createAssignmentResponse(response: InsertAssignmentResponse): Promise<AssignmentResponse>;
  updateAssignmentResponse(id: string, response: Partial<AssignmentResponse>): Promise<AssignmentResponse>;
  // Class methods
  createClass(cls: InsertClass): Promise<Class>;
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  deleteClass(id: string): Promise<void>;
  // Student methods
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsByClass(classId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  updateStudentPassword(id: string, password: string, mustChangePassword?: boolean, initialPassword?: string | null): Promise<void>;
  deleteStudent(id: string): Promise<void>;
  // Exam result methods
  saveExamResult(result: InsertExamResult): Promise<ExamResult>;
  getExamResult(id: string): Promise<ExamResult | undefined>;
  updateExamResult(id: string, updates: { score: number; maxScore: number; grade: string; breakdown: any }): Promise<ExamResult>;
  getOrphanedExamResults(): Promise<ExamResult[]>;
  linkExamResultToStudent(examResultId: string, studentId: string): Promise<ExamResult>;
  getExamResultsByStudent(studentId: string): Promise<ExamResult[]>;
  getExamResultsByYear(year: number): Promise<ExamResult[]>;
  getExamResultsByClass(classId: string): Promise<ExamResult[]>;
  deleteExamResult(id: string): Promise<void>;
  deleteAssignmentAttempt(id: string): Promise<void>;
  // Assignment attempts by student account
  getAssignmentAttemptsByStudentAccount(studentId: string): Promise<AssignmentAttempt[]>;
  // Additional papers
  createAdditionalPaper(paper: InsertAdditionalPaper): Promise<AdditionalPaper>;
  getAdditionalPapers(): Promise<AdditionalPaper[]>;
  getAdditionalPaper(id: string): Promise<AdditionalPaper | undefined>;
  updateAdditionalPaper(id: string, paper: Partial<InsertAdditionalPaper & { isPublished: boolean }>): Promise<AdditionalPaper>;
  deleteAdditionalPaper(id: string): Promise<void>;
  getPublishedAdditionalPapers(): Promise<AdditionalPaper[]>;
  upsertActiveExamProgress(progress: InsertActiveExamProgress): Promise<ActiveExamProgress>;
  getActiveExamProgressByStudent(studentId: string): Promise<ActiveExamProgress | undefined>;
  deleteActiveExamProgress(studentId: string): Promise<void>;
  getActiveExamProgressByClass(classId: string): Promise<ActiveExamProgress[]>;
}

// In-memory fallback storage for when database is unavailable
class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private questionList: Question[] = [];
  private quizList: CustomQuiz[] = [];
  private initialized = false;

  private async ensureInit() {
    if (!this.initialized) {
      // Create default teacher account
      const hashedPassword = await bcrypt.hash("Computing2025", 10);
      const teacher: User = {
        id: "teacher-1",
        username: "teacher",
        password: hashedPassword,
        email: null
      };
      this.users.set(teacher.id, teacher);
      this.initialized = true;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInit();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInit();
    const userList = Array.from(this.users.values());
    for (const user of userList) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInit();
    const userList = Array.from(this.users.values());
    for (const user of userList) {
      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInit();
    const user: User = {
      id: `user-${Date.now()}`,
      username: insertUser.username,
      password: insertUser.password,
      email: null
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await this.ensureInit();
    const user = this.users.get(id);
    if (user) {
      user.password = password;
    }
  }

  async updateUserEmail(id: string, email: string): Promise<void> {
    await this.ensureInit();
    const user = this.users.get(id);
    if (user) {
      user.email = email;
    }
  }

  private resetTokens: Map<string, { userId: string; expiresAt: Date; usedAt: Date | null }> = new Map();

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expiresAt, usedAt: null });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; usedAt: Date | null } | undefined> {
    return this.resetTokens.get(token);
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const tokenData = this.resetTokens.get(token);
    if (tokenData) {
      tokenData.usedAt = new Date();
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.questionList;
  }

  async getRegularQuestions(): Promise<Question[]> {
    return this.questionList.filter(q => !q.isQuizOnly);
  }

  async getQuizOnlyQuestions(): Promise<Question[]> {
    return this.questionList.filter(q => q.isQuizOnly === true);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questionList.find(q => q.id === id);
  }

  async createQuestion(question: Question): Promise<Question> {
    this.questionList.push(question);
    return question;
  }

  async updateQuestion(question: Question): Promise<Question> {
    const index = this.questionList.findIndex(q => q.id === question.id);
    if (index >= 0) {
      this.questionList[index] = question;
    }
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    const index = this.questionList.findIndex(q => q.id === id);
    if (index >= 0) {
      this.questionList.splice(index, 1);
    }
  }

  async getAllCustomQuizzes(): Promise<CustomQuiz[]> {
    return this.quizList;
  }

  async getActiveCustomQuizzes(): Promise<CustomQuiz[]> {
    return this.quizList.filter(q => q.isActive);
  }

  async getCustomQuiz(id: string): Promise<CustomQuiz | undefined> {
    return this.quizList.find(q => q.id === id);
  }

  async createCustomQuiz(quiz: InsertCustomQuiz): Promise<CustomQuiz> {
    const newQuiz: CustomQuiz = {
      id: `quiz-${Date.now()}`,
      name: quiz.name,
      description: quiz.description || null,
      timeLimitMinutes: quiz.timeLimitMinutes || 60,
      questionIds: quiz.questionIds,
      isActive: quiz.isActive ?? true,
      createdAt: new Date(),
    };
    this.quizList.push(newQuiz);
    return newQuiz;
  }

  async updateCustomQuiz(id: string, quiz: Partial<InsertCustomQuiz>): Promise<CustomQuiz> {
    const index = this.quizList.findIndex(q => q.id === id);
    if (index >= 0) {
      this.quizList[index] = { ...this.quizList[index], ...quiz };
    }
    return this.quizList[index];
  }

  async deleteCustomQuiz(id: string): Promise<void> {
    const index = this.quizList.findIndex(q => q.id === id);
    if (index >= 0) {
      this.quizList.splice(index, 1);
    }
  }

  // Assignment methods - in-memory implementation
  private assignmentList: Assignment[] = [];
  private sectionList: AssignmentSection[] = [];
  private partList: AssignmentPart[] = [];
  private resourceList: AssignmentResource[] = [];
  private attemptList: AssignmentAttempt[] = [];
  private responseList: AssignmentResponse[] = [];

  async getAllAssignments(): Promise<Assignment[]> { return this.assignmentList; }
  async getPublishedAssignments(): Promise<Assignment[]> { return this.assignmentList.filter(a => a.isPublished); }
  async getAssignment(id: string): Promise<Assignment | undefined> { return this.assignmentList.find(a => a.id === id); }
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const newA: Assignment = { 
      id: `assign-${Date.now()}`, 
      year: assignment.year,
      title: assignment.title,
      totalMarks: assignment.totalMarks ?? 40,
      totalTimeMinutes: assignment.totalTimeMinutes ?? 360,
      isPublished: assignment.isPublished ?? false,
      evidenceChecklist: assignment.evidenceChecklist ?? null,
      createdAt: new Date() 
    };
    this.assignmentList.push(newA);
    return newA;
  }
  async updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment> {
    const idx = this.assignmentList.findIndex(a => a.id === id);
    if (idx >= 0) this.assignmentList[idx] = { ...this.assignmentList[idx], ...assignment };
    return this.assignmentList[idx];
  }
  async deleteAssignment(id: string): Promise<void> {
    const idx = this.assignmentList.findIndex(a => a.id === id);
    if (idx >= 0) this.assignmentList.splice(idx, 1);
  }
  async getAssignmentSections(assignmentId: string): Promise<AssignmentSection[]> {
    return this.sectionList.filter(s => s.assignmentId === assignmentId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async createAssignmentSection(section: InsertAssignmentSection): Promise<AssignmentSection> {
    const newS: AssignmentSection = { 
      id: `sec-${Date.now()}`, 
      assignmentId: section.assignmentId,
      sectionType: section.sectionType,
      title: section.title,
      isCompulsory: section.isCompulsory ?? false,
      orderIndex: section.orderIndex ?? 0,
      informationSheet: section.informationSheet ?? null,
    };
    this.sectionList.push(newS);
    return newS;
  }
  async updateAssignmentSection(id: string, section: Partial<InsertAssignmentSection>): Promise<AssignmentSection> {
    const idx = this.sectionList.findIndex(s => s.id === id);
    if (idx >= 0) this.sectionList[idx] = { ...this.sectionList[idx], ...section };
    return this.sectionList[idx];
  }
  async deleteAssignmentSection(id: string): Promise<void> {
    const idx = this.sectionList.findIndex(s => s.id === id);
    if (idx >= 0) this.sectionList.splice(idx, 1);
  }
  async getAssignmentParts(sectionId: string): Promise<AssignmentPart[]> {
    return this.partList.filter(p => p.sectionId === sectionId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async getAssignmentPart(id: string): Promise<AssignmentPart | undefined> { return this.partList.find(p => p.id === id); }
  async createAssignmentPart(part: InsertAssignmentPart): Promise<AssignmentPart> {
    const newP: AssignmentPart = { 
      id: `part-${Date.now()}`, 
      sectionId: part.sectionId,
      partLabel: part.partLabel,
      title: part.title ?? null,
      instructions: part.instructions ?? null,
      contentBlocks: part.contentBlocks ?? null,
      maxMarks: part.maxMarks ?? 0,
      orderIndex: part.orderIndex ?? 0,
      isPractical: part.isPractical ?? false,
      requiresUpload: part.requiresUpload ?? true,
      inputStyle: part.inputStyle ?? "text",
      aiGradingGuidance: part.aiGradingGuidance ?? null,
      subQuestions: part.subQuestions ?? null
    };
    this.partList.push(newP);
    return newP;
  }
  async updateAssignmentPart(id: string, part: Partial<InsertAssignmentPart>): Promise<AssignmentPart> {
    const idx = this.partList.findIndex(p => p.id === id);
    if (idx >= 0) this.partList[idx] = { ...this.partList[idx], ...part };
    return this.partList[idx];
  }
  async deleteAssignmentPart(id: string): Promise<void> {
    const idx = this.partList.findIndex(p => p.id === id);
    if (idx >= 0) this.partList.splice(idx, 1);
  }
  async getAssignmentResources(partId: string): Promise<AssignmentResource[]> {
    return this.resourceList.filter(r => r.partId === partId);
  }
  async createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource> {
    const newR: AssignmentResource = { 
      id: `res-${Date.now()}`, 
      partId: resource.partId,
      fileName: resource.fileName,
      fileUrl: resource.fileUrl,
      fileType: resource.fileType ?? null,
      description: resource.description ?? null,
      uploadedAt: new Date() 
    };
    this.resourceList.push(newR);
    return newR;
  }
  async deleteAssignmentResource(id: string): Promise<void> {
    const idx = this.resourceList.findIndex(r => r.id === id);
    if (idx >= 0) this.resourceList.splice(idx, 1);
  }
  async getAssignmentAttempt(id: string): Promise<AssignmentAttempt | undefined> { return this.attemptList.find(a => a.id === id); }
  async getAssignmentAttemptByStudent(assignmentId: string, localStudentId: string): Promise<AssignmentAttempt | undefined> {
    return this.attemptList.find(a => a.assignmentId === assignmentId && a.localStudentId === localStudentId);
  }
  async getAssignmentAttemptsByStudent(localStudentId: string): Promise<AssignmentAttempt[]> {
    return this.attemptList.filter(a => a.localStudentId === localStudentId);
  }
  async createAssignmentAttempt(attempt: InsertAssignmentAttempt): Promise<AssignmentAttempt> {
    const newA: AssignmentAttempt = { 
      id: `attempt-${Date.now()}`, 
      assignmentId: attempt.assignmentId,
      localStudentId: attempt.localStudentId,
      chosenOptionalSection: attempt.chosenOptionalSection,
      status: attempt.status ?? "in_progress",
      timeRemainingSeconds: attempt.timeRemainingSeconds,
      currentSectionId: attempt.currentSectionId ?? null,
      currentPartId: attempt.currentPartId ?? null,
      completedPartIds: attempt.completedPartIds ?? [],
      startedAt: new Date(),
      pausedAt: attempt.pausedAt ?? null,
      completedAt: attempt.completedAt ?? null
    };
    this.attemptList.push(newA);
    return newA;
  }
  async updateAssignmentAttempt(id: string, attempt: Partial<AssignmentAttempt>): Promise<AssignmentAttempt> {
    const idx = this.attemptList.findIndex(a => a.id === id);
    if (idx >= 0) this.attemptList[idx] = { ...this.attemptList[idx], ...attempt };
    return this.attemptList[idx];
  }
  async getAssignmentResponses(attemptId: string): Promise<AssignmentResponse[]> {
    return this.responseList.filter(r => r.attemptId === attemptId);
  }
  async getAssignmentResponse(attemptId: string, partId: string, subQuestionId?: string): Promise<AssignmentResponse | undefined> {
    return this.responseList.find(r => r.attemptId === attemptId && r.partId === partId && r.subQuestionId === (subQuestionId || null));
  }
  async getAssignmentResponseById(id: string): Promise<AssignmentResponse | undefined> {
    return this.responseList.find(r => r.id === id);
  }
  async createAssignmentResponse(response: InsertAssignmentResponse): Promise<AssignmentResponse> {
    const newR: AssignmentResponse = { 
      id: `resp-${Date.now()}`, 
      attemptId: response.attemptId,
      partId: response.partId,
      subQuestionId: response.subQuestionId ?? null,
      textAnswer: response.textAnswer ?? null,
      codeAnswer: response.codeAnswer ?? null,
      screenshotUrls: response.screenshotUrls ?? [],
      drawingData: response.drawingData ?? null,
      userInputs: response.userInputs ?? null,
      marksAwarded: response.marksAwarded ?? null,
      aiFeedback: response.aiFeedback ?? null,
      submittedAt: new Date() 
    };
    this.responseList.push(newR);
    return newR;
  }
  async updateAssignmentResponse(id: string, response: Partial<AssignmentResponse>): Promise<AssignmentResponse> {
    const idx = this.responseList.findIndex(r => r.id === id);
    if (idx >= 0) this.responseList[idx] = { ...this.responseList[idx], ...response };
    return this.responseList[idx];
  }
  async createClass(cls: InsertClass): Promise<Class> { throw new Error("Not supported in memory mode"); }
  async getClasses(): Promise<Class[]> { return []; }
  async getClass(id: string): Promise<Class | undefined> { return undefined; }
  async deleteClass(id: string): Promise<void> {}
  async createStudent(student: InsertStudent): Promise<Student> { throw new Error("Not supported in memory mode"); }
  async getStudentsByClass(classId: string): Promise<Student[]> { return []; }
  async getStudent(id: string): Promise<Student | undefined> { return undefined; }
  async getStudentByUsername(username: string): Promise<Student | undefined> { return undefined; }
  async updateStudentPassword(id: string, password: string, mustChangePassword?: boolean): Promise<void> {}
  async deleteStudent(id: string): Promise<void> {}
  async saveExamResult(result: InsertExamResult): Promise<ExamResult> { throw new Error("Not supported in memory mode"); }
  async getExamResult(id: string): Promise<ExamResult | undefined> { return undefined; }
  async updateExamResult(id: string, updates: { score: number; maxScore: number; grade: string; breakdown: any }): Promise<ExamResult> { throw new Error("Not supported in memory mode"); }
  async getOrphanedExamResults(): Promise<ExamResult[]> { return []; }
  async linkExamResultToStudent(examResultId: string, studentId: string): Promise<ExamResult> { throw new Error("Not supported in memory mode"); }
  async getExamResultsByStudent(studentId: string): Promise<ExamResult[]> { return []; }
  async getExamResultsByYear(year: number): Promise<ExamResult[]> { return []; }
  async getExamResultsByClass(classId: string): Promise<ExamResult[]> { return []; }
  async deleteExamResult(id: string): Promise<void> {}
  async deleteAssignmentAttempt(id: string): Promise<void> {}
  async getAssignmentAttemptsByStudentAccount(studentId: string): Promise<AssignmentAttempt[]> { return []; }
  async createAdditionalPaper(paper: InsertAdditionalPaper): Promise<AdditionalPaper> { throw new Error("Not supported in memory mode"); }
  async getAdditionalPapers(): Promise<AdditionalPaper[]> { return []; }
  async getAdditionalPaper(id: string): Promise<AdditionalPaper | undefined> { return undefined; }
  async updateAdditionalPaper(id: string, paper: Partial<InsertAdditionalPaper & { isPublished: boolean }>): Promise<AdditionalPaper> { throw new Error("Not supported in memory mode"); }
  async deleteAdditionalPaper(id: string): Promise<void> {}
  async getPublishedAdditionalPapers(): Promise<AdditionalPaper[]> { return []; }
  private examProgressMap: Map<string, ActiveExamProgress> = new Map();
  async upsertActiveExamProgress(progress: InsertActiveExamProgress): Promise<ActiveExamProgress> {
    const existing = this.examProgressMap.get(progress.studentId);
    const record: ActiveExamProgress = {
      id: existing?.id || `progress-${Date.now()}`,
      studentId: progress.studentId,
      year: progress.year,
      optionalSection: progress.optionalSection ?? null,
      timeLeft: progress.timeLeft,
      currentQuestion: progress.currentQuestion ?? 0,
      answeredCount: progress.answeredCount ?? 0,
      totalQuestions: progress.totalQuestions ?? 0,
      answeredQuestionIds: progress.answeredQuestionIds ?? null,
      userInputs: progress.userInputs ?? null,
      examType: progress.examType ?? "past-paper",
      examIdentifier: progress.examIdentifier ?? null,
      extraTimeAdded: progress.extraTimeAdded ?? null,
      updatedAt: new Date(),
    };
    this.examProgressMap.set(progress.studentId, record);
    return record;
  }
  async getActiveExamProgressByStudent(studentId: string): Promise<ActiveExamProgress | undefined> {
    return this.examProgressMap.get(studentId);
  }
  async deleteActiveExamProgress(studentId: string): Promise<void> {
    this.examProgressMap.delete(studentId);
  }
  async getActiveExamProgressByClass(classId: string): Promise<ActiveExamProgress[]> { return []; }
}

function fixAttemptArrays(attempt: any): AssignmentAttempt {
  if (!attempt) return attempt;
  if (attempt.assignment_id !== undefined && attempt.assignmentId === undefined) {
    attempt = {
      id: attempt.id,
      assignmentId: attempt.assignment_id,
      localStudentId: attempt.local_student_id,
      studentId: attempt.student_id || null,
      chosenOptionalSection: attempt.chosen_optional_section,
      status: attempt.status,
      timeRemainingSeconds: attempt.time_remaining_seconds,
      currentSectionId: attempt.current_section_id,
      currentPartId: attempt.current_part_id,
      completedPartIds: attempt.completed_part_ids,
      startedAt: attempt.started_at,
      pausedAt: attempt.paused_at,
      completedAt: attempt.completed_at,
    };
  }
  if (typeof attempt.completedPartIds === 'string') {
    try {
      attempt.completedPartIds = attempt.completedPartIds === '{}' ? [] : 
        attempt.completedPartIds.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
    } catch { attempt.completedPartIds = []; }
  }
  if (!Array.isArray(attempt.completedPartIds)) {
    attempt.completedPartIds = [];
  }
  return attempt as AssignmentAttempt;
}

function fixResponseArrays(response: any): AssignmentResponse {
  if (!response) return response;
  if (response.attempt_id !== undefined && response.attemptId === undefined) {
    response = {
      id: response.id,
      attemptId: response.attempt_id,
      partId: response.part_id,
      subQuestionId: response.sub_question_id,
      textAnswer: response.text_answer,
      codeAnswer: response.code_answer,
      screenshotUrls: response.screenshot_urls,
      drawingData: response.drawing_data,
      userInputs: response.user_inputs,
      marksAwarded: response.marks_awarded,
      aiFeedback: response.ai_feedback,
      submittedAt: response.submitted_at,
    };
  }
  if (typeof response.screenshotUrls === 'string') {
    try {
      response.screenshotUrls = response.screenshotUrls === '{}' ? [] :
        response.screenshotUrls.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
    } catch { response.screenshotUrls = []; }
  }
  if (!Array.isArray(response.screenshotUrls)) {
    response.screenshotUrls = [];
  }
  return response as AssignmentResponse;
}

class DatabaseStorage implements IStorage {
  private initialized = false;

  private checkDb() {
    if (!db) {
      throw new Error("Database not available");
    }
    return db;
  }

  async ensureTablesExist(): Promise<boolean> {
    if (this.initialized) return true;
    if (!pool) return false;
    
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
          )
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS questions (
            id VARCHAR(255) PRIMARY KEY,
            year INTEGER NOT NULL,
            topic VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            is_practice BOOLEAN DEFAULT false,
            scenario JSONB,
            sub_questions JSONB NOT NULL
          )
        `);
        await client.query(`
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_quiz_only BOOLEAN DEFAULT false
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS active_exam_progress (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
            student_id VARCHAR(255) NOT NULL,
            year INTEGER NOT NULL,
            optional_section TEXT,
            time_left INTEGER NOT NULL,
            current_question INTEGER NOT NULL DEFAULT 0,
            answered_count INTEGER NOT NULL DEFAULT 0,
            total_questions INTEGER NOT NULL DEFAULT 0,
            answered_question_ids JSONB,
            user_inputs JSONB,
            exam_type TEXT DEFAULT 'past-paper',
            exam_identifier TEXT,
            extra_time_added TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        await client.query(`ALTER TABLE active_exam_progress ADD COLUMN IF NOT EXISTS answered_question_ids JSONB`);
        await client.query(`ALTER TABLE active_exam_progress ADD COLUMN IF NOT EXISTS user_inputs JSONB`);
        await client.query(`ALTER TABLE active_exam_progress ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'past-paper'`);
        await client.query(`ALTER TABLE active_exam_progress ADD COLUMN IF NOT EXISTS exam_identifier TEXT`);
        await client.query(`ALTER TABLE active_exam_progress ADD COLUMN IF NOT EXISTS extra_time_added TEXT`);
        await client.query(`ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS additional_paper_id VARCHAR`);
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

  async getUser(id: string): Promise<User | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(users).where(
      eq(sql`LOWER(${users.email})`, email.toLowerCase())
    );
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const database = this.checkDb();
    const userWithId = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...insertUser
    };
    const result = await database.insert(users).values(userWithId).returning();
    return result[0];
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const database = this.checkDb();
    await database.update(users).set({ password }).where(eq(users.id, id));
  }

  async updateUserEmail(id: string, email: string): Promise<void> {
    const database = this.checkDb();
    await database.update(users).set({ email }).where(eq(users.id, id));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const database = this.checkDb();
    await database.insert(passwordResetTokens).values({
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; usedAt: Date | null } | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    if (result[0]) {
      return {
        userId: result[0].userId,
        expiresAt: result[0].expiresAt,
        usedAt: result[0].usedAt,
      };
    }
    return undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const database = this.checkDb();
    await database.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
  }

  async getAllQuestions(): Promise<Question[]> {
    const database = this.checkDb();
    const result = await database.select().from(questions);
    return result.map(this.dbToQuestion);
  }

  async getRegularQuestions(): Promise<Question[]> {
    const database = this.checkDb();
    const result = await database.select().from(questions).where(eq(questions.isQuizOnly, false));
    return result.map(this.dbToQuestion);
  }

  async getQuizOnlyQuestions(): Promise<Question[]> {
    const database = this.checkDb();
    const result = await database.select().from(questions).where(eq(questions.isQuizOnly, true));
    return result.map(this.dbToQuestion);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(questions).where(eq(questions.id, id));
    if (result[0]) {
      return this.dbToQuestion(result[0]);
    }
    return undefined;
  }

  async createQuestion(question: Question): Promise<Question> {
    const database = this.checkDb();
    const dbQuestion = this.questionToDb(question);
    await database.insert(questions).values(dbQuestion);
    return question;
  }

  async updateQuestion(question: Question): Promise<Question> {
    const database = this.checkDb();
    const dbQuestion = this.questionToDb(question);
    await database.update(questions).set(dbQuestion).where(eq(questions.id, question.id));
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(questions).where(eq(questions.id, id));
  }

  async getAllCustomQuizzes(): Promise<CustomQuiz[]> {
    const database = this.checkDb();
    const result = await database.select().from(customQuizzes);
    return result;
  }

  async getActiveCustomQuizzes(): Promise<CustomQuiz[]> {
    const database = this.checkDb();
    const result = await database.select().from(customQuizzes).where(eq(customQuizzes.isActive, true));
    return result;
  }

  async getCustomQuiz(id: string): Promise<CustomQuiz | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(customQuizzes).where(eq(customQuizzes.id, id));
    return result[0];
  }

  async createCustomQuiz(quiz: InsertCustomQuiz): Promise<CustomQuiz> {
    const database = this.checkDb();
    const result = await database.insert(customQuizzes).values(quiz).returning();
    return result[0];
  }

  async updateCustomQuiz(id: string, quiz: Partial<InsertCustomQuiz>): Promise<CustomQuiz> {
    const database = this.checkDb();
    const result = await database.update(customQuizzes).set(quiz).where(eq(customQuizzes.id, id)).returning();
    return result[0];
  }

  async deleteCustomQuiz(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(customQuizzes).where(eq(customQuizzes.id, id));
  }

  // Assignment methods - database implementation
  async getAllAssignments(): Promise<Assignment[]> {
    const database = this.checkDb();
    return await database.select().from(assignments);
  }
  async getPublishedAssignments(): Promise<Assignment[]> {
    const database = this.checkDb();
    return await database.select().from(assignments).where(eq(assignments.isPublished, true));
  }
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(assignments).where(eq(assignments.id, id));
    return result[0];
  }
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const database = this.checkDb();
    const result = await database.insert(assignments).values(assignment).returning();
    return result[0];
  }
  async updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment> {
    const database = this.checkDb();
    const result = await database.update(assignments).set(assignment).where(eq(assignments.id, id)).returning();
    return result[0];
  }
  async deleteAssignment(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(assignments).where(eq(assignments.id, id));
  }
  async getAssignmentSections(assignmentId: string): Promise<AssignmentSection[]> {
    const database = this.checkDb();
    return await database.select().from(assignmentSections).where(eq(assignmentSections.assignmentId, assignmentId));
  }
  async createAssignmentSection(section: InsertAssignmentSection): Promise<AssignmentSection> {
    const database = this.checkDb();
    const result = await database.insert(assignmentSections).values(section).returning();
    return result[0];
  }
  async updateAssignmentSection(id: string, section: Partial<InsertAssignmentSection>): Promise<AssignmentSection> {
    const database = this.checkDb();
    try {
      const result = await database.update(assignmentSections).set(section).where(eq(assignmentSections.id, id)).returning();
      return result[0];
    } catch (error: any) {
      if (error?.message?.includes('does not exist')) {
        console.log("Fallback: column missing, using raw SQL update for orderIndex only");
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (section.orderIndex !== undefined) {
          setClauses.push(`order_index = $${paramIndex++}`);
          values.push(section.orderIndex);
        }
        if (section.title !== undefined) {
          setClauses.push(`title = $${paramIndex++}`);
          values.push(section.title);
        }
        if ((section as any).informationSheet !== undefined) {
          setClauses.push(`information_sheet = $${paramIndex++}`);
          values.push(JSON.stringify((section as any).informationSheet));
        }
        
        if (setClauses.length > 0) {
          values.push(id);
          const query = `UPDATE assignment_sections SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, assignment_id as "assignmentId", title, order_index as "orderIndex", information_sheet as "informationSheet"`;
          console.log("Raw SQL query:", query, values);
          const rawResult = await database.execute(sql.raw(query.replace(/\$(\d+)/g, (_, n) => `'${values[parseInt(n) - 1]}'`)));
          const row = (rawResult as any).rows?.[0] || (rawResult as any)[0];
          if (row) {
            return { ...row, description: null } as AssignmentSection;
          }
        }
        
        const current = await database.execute(sql.raw(`SELECT id, assignment_id as "assignmentId", title, order_index as "orderIndex", information_sheet as "informationSheet" FROM assignment_sections WHERE id = '${id}'`));
        const currentRow = (current as any).rows?.[0] || (current as any)[0];
        return { ...currentRow, description: null } as AssignmentSection;
      }
      throw error;
    }
  }
  async deleteAssignmentSection(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(assignmentSections).where(eq(assignmentSections.id, id));
  }
  async getAssignmentParts(sectionId: string): Promise<AssignmentPart[]> {
    const database = this.checkDb();
    return await database.select().from(assignmentParts).where(eq(assignmentParts.sectionId, sectionId));
  }
  async getAssignmentPart(id: string): Promise<AssignmentPart | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(assignmentParts).where(eq(assignmentParts.id, id));
    return result[0];
  }
  async createAssignmentPart(part: InsertAssignmentPart): Promise<AssignmentPart> {
    const database = this.checkDb();
    const result = await database.insert(assignmentParts).values(part).returning();
    return result[0];
  }
  async updateAssignmentPart(id: string, part: Partial<InsertAssignmentPart>): Promise<AssignmentPart> {
    const database = this.checkDb();
    const result = await database.update(assignmentParts).set(part).where(eq(assignmentParts.id, id)).returning();
    return result[0];
  }
  async deleteAssignmentPart(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(assignmentParts).where(eq(assignmentParts.id, id));
  }
  async getAssignmentResources(partId: string): Promise<AssignmentResource[]> {
    const database = this.checkDb();
    // Use raw SQL to handle missing 'description' column in older database schemas
    try {
      return await database.select().from(assignmentResources).where(eq(assignmentResources.partId, partId));
    } catch (error: any) {
      // If the description column doesn't exist, query without it
      if (error.message?.includes('column "description" does not exist')) {
        const result = await database.execute(sql`
          SELECT id, part_id as "partId", file_name as "fileName", file_url as "fileUrl", 
                 file_type as "fileType", NULL as description, uploaded_at as "uploadedAt"
          FROM assignment_resources 
          WHERE part_id = ${partId}
        `);
        return (result.rows || []) as AssignmentResource[];
      }
      throw error;
    }
  }
  async createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource> {
    const database = this.checkDb();
    const result = await database.insert(assignmentResources).values(resource).returning();
    return result[0];
  }
  async deleteAssignmentResource(id: string): Promise<void> {
    const database = this.checkDb();
    await database.delete(assignmentResources).where(eq(assignmentResources.id, id));
  }
  async getAssignmentAttempt(id: string): Promise<AssignmentAttempt | undefined> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentAttempts).where(eq(assignmentAttempts.id, id));
      return result[0] ? fixAttemptArrays(result[0]) : undefined;
    } catch (e: any) {
      if (e?.message?.includes('map is not a function')) {
        const rows = await database.execute(sql`SELECT * FROM assignment_attempts WHERE id = ${id} LIMIT 1`);
        const row = (rows as any).rows?.[0] || (rows as any)[0];
        return row ? fixAttemptArrays(row) : undefined;
      }
      throw e;
    }
  }
  async getAssignmentAttemptByStudent(assignmentId: string, localStudentId: string): Promise<AssignmentAttempt | undefined> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentAttempts)
        .where(and(
          eq(assignmentAttempts.assignmentId, assignmentId),
          eq(assignmentAttempts.localStudentId, localStudentId)
        ));
      return result[0] ? fixAttemptArrays(result[0]) : undefined;
    } catch (e: any) {
      if (e?.message?.includes('map is not a function')) {
        const rows = await database.execute(sql`SELECT * FROM assignment_attempts WHERE assignment_id = ${assignmentId} AND local_student_id = ${localStudentId} LIMIT 1`);
        const row = (rows as any).rows?.[0] || (rows as any)[0];
        return row ? fixAttemptArrays(row) : undefined;
      }
      throw e;
    }
  }
  async getAssignmentAttemptsByStudent(localStudentId: string): Promise<AssignmentAttempt[]> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentAttempts)
        .where(eq(assignmentAttempts.localStudentId, localStudentId));
      return result.map(fixAttemptArrays);
    } catch (e: any) {
      if (e?.message?.includes('map is not a function')) {
        const rows = await database.execute(sql`SELECT * FROM assignment_attempts WHERE local_student_id = ${localStudentId}`);
        const rawRows = (rows as any).rows || rows;
        return (rawRows as any[]).map(fixAttemptArrays);
      }
      throw e;
    }
  }
  async createAssignmentAttempt(attempt: InsertAssignmentAttempt): Promise<AssignmentAttempt> {
    const database = this.checkDb();
    try {
      const result = await database.insert(assignmentAttempts).values(attempt).returning();
      return fixAttemptArrays(result[0]);
    } catch (e: any) {
      if (e?.message?.includes('map is not a function')) {
        const rows = await database.execute(sql`INSERT INTO assignment_attempts (assignment_id, local_student_id, chosen_optional_section, status, time_remaining_seconds, current_section_id, current_part_id, completed_part_ids) VALUES (${attempt.assignmentId}, ${attempt.localStudentId}, ${attempt.chosenOptionalSection}, ${attempt.status || 'in_progress'}, ${attempt.timeRemainingSeconds}, ${attempt.currentSectionId || null}, ${attempt.currentPartId || null}, ${"{}"}::text[]) RETURNING *`);
        const row = (rows as any).rows?.[0] || (rows as any)[0];
        return fixAttemptArrays(row);
      }
      throw e;
    }
  }
  async updateAssignmentAttempt(id: string, attempt: Partial<AssignmentAttempt>): Promise<AssignmentAttempt> {
    const database = this.checkDb();
    try {
      const result = await database.update(assignmentAttempts).set(attempt).where(eq(assignmentAttempts.id, id)).returning();
      return fixAttemptArrays(result[0]);
    } catch (e: any) {
      if (e?.message?.includes('map is not a function')) {
        const result = await database.select().from(assignmentAttempts).where(eq(assignmentAttempts.id, id));
        return fixAttemptArrays(result[0]);
      }
      throw e;
    }
  }
  async getAssignmentResponses(attemptId: string): Promise<AssignmentResponse[]> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentResponses).where(eq(assignmentResponses.attemptId, attemptId));
      return result.map(fixResponseArrays);
    } catch (e: any) {
      const rows = await database.execute(sql`SELECT * FROM assignment_responses WHERE attempt_id = ${attemptId}`);
      const rawRows = (rows as any).rows || rows;
      return (rawRows as any[]).map(fixResponseArrays);
    }
  }
  async getAssignmentResponse(attemptId: string, partId: string, subQuestionId?: string): Promise<AssignmentResponse | undefined> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentResponses)
        .where(and(
          eq(assignmentResponses.attemptId, attemptId),
          eq(assignmentResponses.partId, partId)
        ));
      const fixed = result.map(fixResponseArrays);
      if (subQuestionId) {
        return fixed.find((r: AssignmentResponse) => r.subQuestionId === subQuestionId);
      }
      return fixed[0];
    } catch (e: any) {
      const rows = await database.execute(sql`SELECT * FROM assignment_responses WHERE attempt_id = ${attemptId} AND part_id = ${partId}`);
      const rawRows = ((rows as any).rows || rows) as any[];
      const fixed = rawRows.map(fixResponseArrays);
      if (subQuestionId) {
        return fixed.find((r: any) => r.subQuestionId === subQuestionId || r.sub_question_id === subQuestionId);
      }
      return fixed[0];
    }
  }
  async getAssignmentResponseById(id: string): Promise<AssignmentResponse | undefined> {
    const database = this.checkDb();
    try {
      const result = await database.select().from(assignmentResponses).where(eq(assignmentResponses.id, id));
      return result[0] ? fixResponseArrays(result[0]) : undefined;
    } catch (e: any) {
      const rows = await database.execute(sql`SELECT * FROM assignment_responses WHERE id = ${id}`);
      const rawRows = ((rows as any).rows || rows) as any[];
      return rawRows[0] ? fixResponseArrays(rawRows[0]) : undefined;
    }
  }
  async createAssignmentResponse(response: InsertAssignmentResponse): Promise<AssignmentResponse> {
    const database = this.checkDb();
    const screenshotArr = Array.isArray(response.screenshotUrls) && response.screenshotUrls.length > 0
      ? `{${response.screenshotUrls.map(u => `"${u}"`).join(",")}}`
      : "{}";
    try {
      const result = await database.insert(assignmentResponses).values(response).returning();
      return fixResponseArrays(result[0]);
    } catch (e: any) {
      const rows = await database.execute(sql`INSERT INTO assignment_responses (attempt_id, part_id, sub_question_id, text_answer, code_answer, screenshot_urls, drawing_data, user_inputs) VALUES (${response.attemptId}, ${response.partId}, ${response.subQuestionId || null}, ${response.textAnswer || null}, ${response.codeAnswer || null}, ${screenshotArr}::text[], ${response.drawingData || null}, ${response.userInputs ? JSON.stringify(response.userInputs) : null}::jsonb) RETURNING *`);
      const row = (rows as any).rows?.[0] || (rows as any)[0];
      return fixResponseArrays(row);
    }
  }
  async updateAssignmentResponse(id: string, response: Partial<AssignmentResponse>): Promise<AssignmentResponse> {
    const database = this.checkDb();
    try {
      const result = await database.update(assignmentResponses).set(response).where(eq(assignmentResponses.id, id)).returning();
      return fixResponseArrays(result[0]);
    } catch (e: any) {
      const screenshotArr = Array.isArray(response.screenshotUrls) && response.screenshotUrls.length > 0
        ? `{${response.screenshotUrls.map(u => `"${u}"`).join(",")}}`
        : "{}";
      await database.execute(sql`UPDATE assignment_responses SET
        text_answer = ${response.textAnswer ?? null},
        code_answer = ${response.codeAnswer ?? null},
        screenshot_urls = ${screenshotArr}::text[],
        drawing_data = ${response.drawingData ?? null},
        user_inputs = ${response.userInputs ? JSON.stringify(response.userInputs) : null}::jsonb
        WHERE id = ${id}`);
      const rows = await database.execute(sql`SELECT * FROM assignment_responses WHERE id = ${id}`);
      const row = (rows as any).rows?.[0] || (rows as any)[0];
      return fixResponseArrays(row);
    }
  }

  // Class methods
  async createClass(cls: InsertClass): Promise<Class> {
    const d = this.checkDb();
    const [row] = await d.insert(classes).values(cls).returning();
    return row;
  }
  async getClasses(): Promise<Class[]> {
    const d = this.checkDb();
    return d.select().from(classes);
  }
  async getClass(id: string): Promise<Class | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(classes).where(eq(classes.id, id));
    return row;
  }
  async deleteClass(id: string): Promise<void> {
    const d = this.checkDb();
    await d.delete(students).where(eq(students.classId, id));
    await d.delete(classes).where(eq(classes.id, id));
  }
  // Student methods
  async createStudent(student: InsertStudent): Promise<Student> {
    const d = this.checkDb();
    const [row] = await d.insert(students).values(student).returning();
    return row;
  }
  async getStudentsByClass(classId: string): Promise<Student[]> {
    const d = this.checkDb();
    return d.select().from(students).where(eq(students.classId, classId));
  }
  async getStudent(id: string): Promise<Student | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(students).where(eq(students.id, id));
    return row;
  }
  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(students).where(eq(students.username, username));
    return row;
  }
  async updateStudentPassword(id: string, password: string, mustChangePassword: boolean = false, initialPassword?: string | null): Promise<void> {
    const d = this.checkDb();
    const updateData: any = { password, mustChangePassword };
    if (initialPassword !== undefined) {
      updateData.initialPassword = initialPassword;
    }
    await d.update(students).set(updateData).where(eq(students.id, id));
  }
  async deleteStudent(id: string): Promise<void> {
    const d = this.checkDb();
    await d.delete(students).where(eq(students.id, id));
  }
  // Exam result methods
  async saveExamResult(result: InsertExamResult): Promise<ExamResult> {
    const d = this.checkDb();
    const [row] = await d.insert(examResults).values(result).returning();
    return row;
  }
  async getExamResult(id: string): Promise<ExamResult | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(examResults).where(eq(examResults.id, id));
    return row;
  }
  async updateExamResult(id: string, updates: { score: number; maxScore: number; grade: string; breakdown: any }): Promise<ExamResult> {
    const d = this.checkDb();
    const [row] = await d.update(examResults).set({
      score: updates.score,
      maxScore: updates.maxScore,
      grade: updates.grade,
      breakdown: updates.breakdown,
    }).where(eq(examResults.id, id)).returning();
    return row;
  }
  async getOrphanedExamResults(): Promise<ExamResult[]> {
    const d = this.checkDb();
    return d.select().from(examResults).where(
      or(isNull(examResults.studentId), eq(examResults.studentId, ""))
    );
  }
  async linkExamResultToStudent(examResultId: string, studentId: string): Promise<ExamResult> {
    const d = this.checkDb();
    const [row] = await d.update(examResults).set({
      studentId,
    }).where(eq(examResults.id, examResultId)).returning();
    return row;
  }
  async getExamResultsByStudent(studentId: string): Promise<ExamResult[]> {
    const d = this.checkDb();
    return d.select().from(examResults).where(eq(examResults.studentId, studentId));
  }
  async getExamResultsByYear(year: number): Promise<ExamResult[]> {
    const d = this.checkDb();
    return d.select().from(examResults).where(eq(examResults.year, year));
  }
  async getExamResultsByClass(classId: string): Promise<ExamResult[]> {
    const d = this.checkDb();
    const classStudents = await d.select().from(students).where(eq(students.classId, classId));
    const studentIds = classStudents.map(s => s.id);
    if (studentIds.length === 0) return [];
    return d.select().from(examResults).where(sql`${examResults.studentId} = ANY(${studentIds})`);
  }
  async deleteExamResult(id: string): Promise<void> {
    const d = this.checkDb();
    await d.delete(examResults).where(eq(examResults.id, id));
  }
  async deleteAssignmentAttempt(id: string): Promise<void> {
    const d = this.checkDb();
    await d.transaction(async (tx) => {
      await tx.delete(assignmentResponses).where(eq(assignmentResponses.attemptId, id));
      await tx.delete(assignmentAttempts).where(eq(assignmentAttempts.id, id));
    });
  }
  // Assignment attempts by student account
  async getAssignmentAttemptsByStudentAccount(studentId: string): Promise<AssignmentAttempt[]> {
    const d = this.checkDb();
    const rows = await d.select().from(assignmentAttempts).where(eq(assignmentAttempts.studentId, studentId));
    return rows.map(fixAttemptArrays);
  }

  private dbToQuestion(dbQ: DbQuestion): Question {
    return {
      id: dbQ.id,
      year: dbQ.year,
      topic: dbQ.topic as Question["topic"],
      title: dbQ.title,
      isPractice: dbQ.isPractice || false,
      isQuizOnly: dbQ.isQuizOnly || false,
      isAdditionalExam: dbQ.isAdditionalExam || false,
      additionalPaperId: dbQ.additionalPaperId || null,
      scenario: dbQ.scenario as Question["scenario"],
      subQuestions: dbQ.subQuestions as Question["subQuestions"],
    };
  }

  private questionToDb(q: Question): typeof questions.$inferInsert {
    return {
      id: q.id,
      year: q.year,
      topic: q.topic,
      title: q.title,
      isPractice: q.isPractice || false,
      isQuizOnly: q.isQuizOnly || false,
      isAdditionalExam: (q as any).isAdditionalExam || false,
      additionalPaperId: (q as any).additionalPaperId || null,
      scenario: q.scenario || null,
      subQuestions: q.subQuestions,
    };
  }

  async createAdditionalPaper(paper: InsertAdditionalPaper): Promise<AdditionalPaper> {
    const d = this.checkDb();
    const [row] = await d.insert(additionalPapers).values(paper).returning();
    return row;
  }
  async getAdditionalPapers(): Promise<AdditionalPaper[]> {
    const d = this.checkDb();
    return d.select().from(additionalPapers).orderBy(additionalPapers.createdAt);
  }
  async getAdditionalPaper(id: string): Promise<AdditionalPaper | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(additionalPapers).where(eq(additionalPapers.id, id));
    return row;
  }
  async updateAdditionalPaper(id: string, paper: Partial<InsertAdditionalPaper & { isPublished: boolean }>): Promise<AdditionalPaper> {
    const d = this.checkDb();
    const [row] = await d.update(additionalPapers).set(paper).where(eq(additionalPapers.id, id)).returning();
    return row;
  }
  async deleteAdditionalPaper(id: string): Promise<void> {
    const d = this.checkDb();
    await d.update(questions).set({ additionalPaperId: null, isAdditionalExam: false }).where(eq(questions.additionalPaperId, id));
    await d.delete(additionalPapers).where(eq(additionalPapers.id, id));
  }
  async getPublishedAdditionalPapers(): Promise<AdditionalPaper[]> {
    const d = this.checkDb();
    return d.select().from(additionalPapers).where(eq(additionalPapers.isPublished, true)).orderBy(additionalPapers.createdAt);
  }
  async upsertActiveExamProgress(progress: InsertActiveExamProgress): Promise<ActiveExamProgress> {
    const d = this.checkDb();
    const existing = await d.select().from(activeExamProgress).where(eq(activeExamProgress.studentId, progress.studentId));
    if (existing.length > 0) {
      const [row] = await d.update(activeExamProgress).set({
        year: progress.year,
        optionalSection: progress.optionalSection ?? null,
        timeLeft: progress.timeLeft,
        currentQuestion: progress.currentQuestion ?? 0,
        answeredCount: progress.answeredCount ?? 0,
        totalQuestions: progress.totalQuestions ?? 0,
        answeredQuestionIds: progress.answeredQuestionIds ?? null,
        userInputs: progress.userInputs ?? null,
        examType: progress.examType ?? "past-paper",
        examIdentifier: progress.examIdentifier ?? null,
        extraTimeAdded: progress.extraTimeAdded ?? null,
        updatedAt: new Date(),
      }).where(eq(activeExamProgress.studentId, progress.studentId)).returning();
      return row;
    }
    const [row] = await d.insert(activeExamProgress).values(progress).returning();
    return row;
  }
  async getActiveExamProgressByStudent(studentId: string): Promise<ActiveExamProgress | undefined> {
    const d = this.checkDb();
    const [row] = await d.select().from(activeExamProgress).where(eq(activeExamProgress.studentId, studentId));
    return row;
  }
  async deleteActiveExamProgress(studentId: string): Promise<void> {
    const d = this.checkDb();
    await d.delete(activeExamProgress).where(eq(activeExamProgress.studentId, studentId));
  }
  async getActiveExamProgressByClass(classId: string): Promise<ActiveExamProgress[]> {
    const d = this.checkDb();
    const classStudents = await d.select().from(students).where(eq(students.classId, classId));
    const studentIds = classStudents.map(s => s.id);
    if (studentIds.length === 0) return [];
    return d.select().from(activeExamProgress).where(inArray(activeExamProgress.studentId, studentIds));
  }
}

// Create storage instances
const databaseStorage = dbAvailable ? new DatabaseStorage() : null;
const memoryStorage = new MemoryStorage();

// Dynamic storage reference - starts with database if available, can fall back to memory
let activeStorage: IStorage = databaseStorage || memoryStorage;
let usingDatabase = !!databaseStorage;

// Export a proxy that uses the active storage
export const storage: IStorage = {
  getUser: (id) => activeStorage.getUser(id),
  getUserByUsername: (username) => activeStorage.getUserByUsername(username),
  getUserByEmail: (email) => activeStorage.getUserByEmail(email),
  createUser: (user) => activeStorage.createUser(user),
  updateUserPassword: (id, password) => activeStorage.updateUserPassword(id, password),
  updateUserEmail: (id, email) => activeStorage.updateUserEmail(id, email),
  createPasswordResetToken: (userId, token, expiresAt) => activeStorage.createPasswordResetToken(userId, token, expiresAt),
  getPasswordResetToken: (token) => activeStorage.getPasswordResetToken(token),
  markPasswordResetTokenUsed: (token) => activeStorage.markPasswordResetTokenUsed(token),
  getAllQuestions: () => activeStorage.getAllQuestions(),
  getRegularQuestions: () => activeStorage.getRegularQuestions(),
  getQuizOnlyQuestions: () => activeStorage.getQuizOnlyQuestions(),
  getQuestion: (id) => activeStorage.getQuestion(id),
  createQuestion: (question) => activeStorage.createQuestion(question),
  updateQuestion: (question) => activeStorage.updateQuestion(question),
  deleteQuestion: (id) => activeStorage.deleteQuestion(id),
  getAllCustomQuizzes: () => activeStorage.getAllCustomQuizzes(),
  getActiveCustomQuizzes: () => activeStorage.getActiveCustomQuizzes(),
  getCustomQuiz: (id) => activeStorage.getCustomQuiz(id),
  createCustomQuiz: (quiz) => activeStorage.createCustomQuiz(quiz),
  updateCustomQuiz: (id, quiz) => activeStorage.updateCustomQuiz(id, quiz),
  deleteCustomQuiz: (id) => activeStorage.deleteCustomQuiz(id),
  // Assignment methods
  getAllAssignments: () => activeStorage.getAllAssignments(),
  getPublishedAssignments: () => activeStorage.getPublishedAssignments(),
  getAssignment: (id) => activeStorage.getAssignment(id),
  createAssignment: (assignment) => activeStorage.createAssignment(assignment),
  updateAssignment: (id, assignment) => activeStorage.updateAssignment(id, assignment),
  deleteAssignment: (id) => activeStorage.deleteAssignment(id),
  getAssignmentSections: (assignmentId) => activeStorage.getAssignmentSections(assignmentId),
  createAssignmentSection: (section) => activeStorage.createAssignmentSection(section),
  updateAssignmentSection: (id, section) => activeStorage.updateAssignmentSection(id, section),
  deleteAssignmentSection: (id) => activeStorage.deleteAssignmentSection(id),
  getAssignmentParts: (sectionId) => activeStorage.getAssignmentParts(sectionId),
  getAssignmentPart: (id) => activeStorage.getAssignmentPart(id),
  createAssignmentPart: (part) => activeStorage.createAssignmentPart(part),
  updateAssignmentPart: (id, part) => activeStorage.updateAssignmentPart(id, part),
  deleteAssignmentPart: (id) => activeStorage.deleteAssignmentPart(id),
  getAssignmentResources: (partId) => activeStorage.getAssignmentResources(partId),
  createAssignmentResource: (resource) => activeStorage.createAssignmentResource(resource),
  deleteAssignmentResource: (id) => activeStorage.deleteAssignmentResource(id),
  getAssignmentAttempt: (id) => activeStorage.getAssignmentAttempt(id),
  getAssignmentAttemptByStudent: (assignmentId, localStudentId) => activeStorage.getAssignmentAttemptByStudent(assignmentId, localStudentId),
  getAssignmentAttemptsByStudent: (localStudentId) => activeStorage.getAssignmentAttemptsByStudent(localStudentId),
  createAssignmentAttempt: (attempt) => activeStorage.createAssignmentAttempt(attempt),
  updateAssignmentAttempt: (id, attempt) => activeStorage.updateAssignmentAttempt(id, attempt),
  getAssignmentResponses: (attemptId) => activeStorage.getAssignmentResponses(attemptId),
  getAssignmentResponse: (attemptId, partId, subQuestionId) => activeStorage.getAssignmentResponse(attemptId, partId, subQuestionId),
  getAssignmentResponseById: (id) => activeStorage.getAssignmentResponseById(id),
  createAssignmentResponse: (response) => activeStorage.createAssignmentResponse(response),
  updateAssignmentResponse: (id, response) => activeStorage.updateAssignmentResponse(id, response),
  createClass: (cls) => activeStorage.createClass(cls),
  getClasses: () => activeStorage.getClasses(),
  getClass: (id) => activeStorage.getClass(id),
  deleteClass: (id) => activeStorage.deleteClass(id),
  createStudent: (student) => activeStorage.createStudent(student),
  getStudentsByClass: (classId) => activeStorage.getStudentsByClass(classId),
  getStudent: (id) => activeStorage.getStudent(id),
  getStudentByUsername: (username) => activeStorage.getStudentByUsername(username),
  updateStudentPassword: (id, password, mustChangePassword, initialPassword) => activeStorage.updateStudentPassword(id, password, mustChangePassword, initialPassword),
  deleteStudent: (id) => activeStorage.deleteStudent(id),
  saveExamResult: (result) => activeStorage.saveExamResult(result),
  getExamResult: (id) => activeStorage.getExamResult(id),
  updateExamResult: (id, updates) => activeStorage.updateExamResult(id, updates),
  getOrphanedExamResults: () => activeStorage.getOrphanedExamResults(),
  linkExamResultToStudent: (examResultId, studentId) => activeStorage.linkExamResultToStudent(examResultId, studentId),
  getExamResultsByStudent: (studentId) => activeStorage.getExamResultsByStudent(studentId),
  getExamResultsByYear: (year) => activeStorage.getExamResultsByYear(year),
  getExamResultsByClass: (classId) => activeStorage.getExamResultsByClass(classId),
  deleteExamResult: (id) => activeStorage.deleteExamResult(id),
  deleteAssignmentAttempt: (id) => activeStorage.deleteAssignmentAttempt(id),
  getAssignmentAttemptsByStudentAccount: (studentId) => activeStorage.getAssignmentAttemptsByStudentAccount(studentId),
  createAdditionalPaper: (paper) => activeStorage.createAdditionalPaper(paper),
  getAdditionalPapers: () => activeStorage.getAdditionalPapers(),
  getAdditionalPaper: (id) => activeStorage.getAdditionalPaper(id),
  updateAdditionalPaper: (id, paper) => activeStorage.updateAdditionalPaper(id, paper),
  deleteAdditionalPaper: (id) => activeStorage.deleteAdditionalPaper(id),
  getPublishedAdditionalPapers: () => activeStorage.getPublishedAdditionalPapers(),
  upsertActiveExamProgress: (progress) => activeStorage.upsertActiveExamProgress(progress),
  getActiveExamProgressByStudent: (studentId) => activeStorage.getActiveExamProgressByStudent(studentId),
  deleteActiveExamProgress: (studentId) => activeStorage.deleteActiveExamProgress(studentId),
  getActiveExamProgressByClass: (classId) => activeStorage.getActiveExamProgressByClass(classId),
};

async function seedDatabaseIfEmpty(): Promise<void> {
  if (!pool) return;
  
  try {
    const result = await pool.query('SELECT count(*)::int as cnt FROM questions');
    const questionCount = result.rows[0]?.cnt || 0;
    
    if (questionCount > 0) {
      console.log(`Database already has ${questionCount} questions - skipping seed`);
      return;
    }
    
    console.log("Database is empty - seeding with initial data...");
    
    const seedPaths = [
      path.join(process.cwd(), 'server', 'seed.sql'),
      path.join(process.cwd(), 'dist', 'seed.sql'),
      path.join(__dirname, 'seed.sql'),
    ];
    
    let seedSql = '';
    for (const seedPath of seedPaths) {
      try {
        if (fs.existsSync(seedPath)) {
          seedSql = fs.readFileSync(seedPath, 'utf8');
          console.log(`Loaded seed file from: ${seedPath}`);
          break;
        }
      } catch (e) {
      }
    }
    
    if (!seedSql) {
      console.log("No seed.sql file found - skipping seed");
      return;
    }
    
    const statements = seedSql.split('\n').filter(line => line.trim().startsWith('INSERT INTO'));
    let successCount = 0;
    let errorCount = 0;
    
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        successCount++;
      } catch (e: any) {
        if (e.message?.includes('duplicate key')) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Seed error: ${e.message?.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`Database seeded: ${successCount} rows inserted, ${errorCount} errors`);
  } catch (error: any) {
    console.error("Seed check failed:", error.message);
  }
}

async function ensureAdditionalPapersExist(): Promise<void> {
  if (!pool) return;
  
  try {
    const paperCheck = await pool.query('SELECT count(*)::int as cnt FROM additional_papers');
    const additionalQuestionCheck = await pool.query(
      "SELECT count(*)::int as cnt FROM questions WHERE is_additional_exam = true"
    );
    
    if (paperCheck.rows[0]?.cnt > 0 && additionalQuestionCheck.rows[0]?.cnt > 0) {
      console.log("Additional papers and exam questions already exist");
      return;
    }
    
    console.log("Missing additional exam data - seeding from additional_exam_seed.sql...");
    
    const seedPaths = [
      path.join(process.cwd(), 'server', 'additional_exam_seed.sql'),
      path.join(process.cwd(), 'dist', 'additional_exam_seed.sql'),
      path.join(__dirname, 'additional_exam_seed.sql'),
    ];
    
    let seedSql = '';
    for (const seedPath of seedPaths) {
      try {
        if (fs.existsSync(seedPath)) {
          seedSql = fs.readFileSync(seedPath, 'utf8');
          console.log(`Loaded additional exam seed from: ${seedPath}`);
          break;
        }
      } catch (e) {}
    }
    
    if (!seedSql) {
      console.log("No additional_exam_seed.sql found - skipping");
      return;
    }
    
    const statements = seedSql.split('\n').filter(line => line.trim().startsWith('INSERT INTO'));
    let successCount = 0;
    let errorCount = 0;
    
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        successCount++;
      } catch (e: any) {
        if (e.message?.includes('duplicate key')) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Additional exam seed error: ${e.message?.substring(0, 200)}`);
        }
      }
    }
    
    console.log(`Additional exam data seeded: ${successCount} rows inserted, ${errorCount} errors`);
  } catch (error: any) {
    console.error("Error ensuring additional papers exist:", error.message);
  }
}

// Initialize the database tables (for production deployments where schema push doesn't work)
export async function initializeDatabase(): Promise<boolean> {
  if (databaseStorage) {
    try {
      // First test the connection with a 5 second timeout
      console.log("Testing database connection...");
      const connected = await testConnection(5000);
      if (!connected) {
        console.error("Database connection failed - switching to in-memory storage");
        console.warn("WARNING: Data will NOT persist across restarts!");
        activeStorage = memoryStorage;
        usingDatabase = false;
        return false;
      }
      
      const success = await databaseStorage.ensureTablesExist();
      if (success) {
        console.log("Database initialized successfully - data will persist");
        usingDatabase = true;
        await seedDatabaseIfEmpty();
        await ensureAdditionalPapersExist();
        return true;
      } else {
        console.error("Failed to create tables - switching to in-memory storage");
        activeStorage = memoryStorage;
        usingDatabase = false;
        return false;
      }
    } catch (error) {
      console.error("Database initialization failed:", error);
      console.error("Switching to in-memory storage - data will NOT persist!");
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
