import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// NOTE: SQL table names use "rev_" prefix where they would conflict with
// the existing project's scaffolding tables (users, assignments, classes, sessions).
// The JS variable names are unchanged so the revision app's storage/routes
// code imports without modification.

export const users = pgTable("rev_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const sessions = pgTable("rev_sessions", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const additionalExams = pgTable("additional_exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey(),
  year: integer("year"),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  isPractice: boolean("is_practice").default(false),
  isQuizOnly: boolean("is_quiz_only").default(false),
  isAdditionalExam: boolean("is_additional_exam").default(false),
  additionalExamId: varchar("additional_exam_id"),
  scenario: jsonb("scenario"),
  subQuestions: jsonb("sub_questions").notNull(),
});

export const customQuizzes = pgTable("custom_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes").default(60),
  questionIds: text("question_ids").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("rev_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  totalMarks: integer("total_marks").default(40),
  totalTimeMinutes: integer("total_time_minutes").default(360),
  isPublished: boolean("is_active").default(false),
  evidenceChecklist: jsonb("evidence_checklist"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentSections = pgTable("assignment_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  sectionType: text("section_type").notNull(),
  title: text("title").notNull(),
  isCompulsory: boolean("is_compulsory").default(false),
  orderIndex: integer("order_index").default(0),
  informationSheet: jsonb("information_sheet"),
});

export const assignmentParts = pgTable("assignment_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  partLabel: text("part_label").notNull(),
  title: text("title"),
  instructions: text("instructions"),
  contentBlocks: jsonb("content_blocks"),
  maxMarks: integer("max_marks").default(0),
  orderIndex: integer("order_index").default(0),
  isPractical: boolean("is_practical").default(false),
  aiGradingGuidance: text("ai_grading_guidance"),
  subQuestions: jsonb("sub_questions"),
  requiresUpload: boolean("requires_upload").default(true),
  inputStyle: text("input_style").default("text"),
});

export const assignmentResources = pgTable("assignment_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const assignmentAttempts = pgTable("assignment_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  localStudentId: text("local_student_id").notNull(),
  chosenOptionalSection: text("chosen_optional_section").notNull(),
  status: text("status").default("in_progress"),
  timeRemainingSeconds: integer("time_remaining_seconds").notNull(),
  currentSectionId: varchar("current_section_id"),
  currentPartId: varchar("current_part_id"),
  completedPartIds: text("completed_part_ids").array().default(sql`'{}'::text[]`),
  startedAt: timestamp("started_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
});

export const assignmentResponses = pgTable("assignment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull(),
  partId: varchar("part_id").notNull(),
  subQuestionId: text("sub_question_id"),
  textAnswer: text("text_answer"),
  codeAnswer: text("code_answer"),
  screenshotUrls: text("screenshot_urls").array().default(sql`'{}'::text[]`),
  drawingData: text("drawing_data"),
  userInputs: jsonb("user_inputs"),
  marksAwarded: integer("marks_awarded"),
  aiFeedback: text("ai_feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const classes = pgTable("rev_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("rev_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  classId: varchar("class_id").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentSessions = pgTable("student_sessions", {
  token: varchar("token").primaryKey(),
  studentId: varchar("student_id").notNull(),
  username: text("username").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const studentExamResults = pgTable("student_exam_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  examType: text("exam_type").notNull(),
  examIdentifier: text("exam_identifier").notNull(),
  examTitle: text("exam_title"),
  additionalPaperId: text("additional_paper_id"),
  score: integer("score").notNull(),
  maxMarks: integer("max_marks").notNull(),
  percentage: real("percentage").notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const studentExamProgress = pgTable("student_exam_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  examType: text("exam_type").notNull(),
  examIdentifier: text("exam_identifier").notNull(),
  examTitle: text("exam_title"),
  totalQuestions: integer("total_questions").default(0),
  answeredQuestions: integer("answered_questions").default(0),
  answeredQuestionIds: jsonb("answered_question_ids"),
  currentAnswers: jsonb("current_answers"),
  timeLeft: integer("time_left"),
  currentQuestionIndex: integer("current_question_index"),
  extraTimeAdded: text("extra_time_added"),
  status: text("status").default("in_progress"),
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Insert schemas ──────────────────────────────────────────────────────────

export const insertStudentExamProgressSchema = createInsertSchema(studentExamProgress).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const updateUserEmailSchema = z.object({
  email: z.string().email().optional().nullable(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  usedAt: true,
});

export const insertAdditionalExamSchema = createInsertSchema(additionalExams).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions);

export const insertCustomQuizSchema = createInsertSchema(customQuizzes).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSectionSchema = createInsertSchema(assignmentSections).omit({
  id: true,
});

export const insertAssignmentPartSchema = createInsertSchema(assignmentParts).omit({
  id: true,
});

export const insertAssignmentResourceSchema = createInsertSchema(assignmentResources).omit({
  id: true,
  uploadedAt: true,
});

export const insertAssignmentAttemptSchema = createInsertSchema(assignmentAttempts).omit({
  id: true,
  startedAt: true,
  pausedAt: true,
  completedAt: true,
});

export const insertAssignmentResponseSchema = createInsertSchema(assignmentResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertStudentExamResultSchema = createInsertSchema(studentExamResults).omit({
  id: true,
  completedAt: true,
});

// ── Types ───────────────────────────────────────────────────────────────────

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserEmail = z.infer<typeof updateUserEmailSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type DbQuestion = typeof questions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type CustomQuiz = typeof customQuizzes.$inferSelect;
export type InsertCustomQuiz = z.infer<typeof insertCustomQuizSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentSection = typeof assignmentSections.$inferSelect;
export type InsertAssignmentSection = z.infer<typeof insertAssignmentSectionSchema>;
export type AssignmentPart = typeof assignmentParts.$inferSelect;
export type InsertAssignmentPart = z.infer<typeof insertAssignmentPartSchema>;
export type AssignmentResource = typeof assignmentResources.$inferSelect;
export type InsertAssignmentResource = z.infer<typeof insertAssignmentResourceSchema>;
export type AssignmentAttempt = typeof assignmentAttempts.$inferSelect;
export type InsertAssignmentAttempt = z.infer<typeof insertAssignmentAttemptSchema>;
export type AssignmentResponse = typeof assignmentResponses.$inferSelect;
export type InsertAssignmentResponse = z.infer<typeof insertAssignmentResponseSchema>;
export type AdditionalExam = typeof additionalExams.$inferSelect;
export type InsertAdditionalExam = z.infer<typeof insertAdditionalExamSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type StudentSession = typeof studentSessions.$inferSelect;
export type StudentExamResult = typeof studentExamResults.$inferSelect;
export type InsertStudentExamResult = z.infer<typeof insertStudentExamResultSchema>;
export type StudentExamProgress = typeof studentExamProgress.$inferSelect;
export type InsertStudentExamProgress = z.infer<typeof insertStudentExamProgressSchema>;
