import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// All SQL table names use "n5_" prefix to avoid conflicts with the
// existing BHS tables and the Higher revision app tables (rev_ prefix).
// JS variable names are kept the same so N5 storage/routes code
// can import without modification.

export const users = pgTable("n5_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
});

export const passwordResetTokens = pgTable("n5_password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const classes = pgTable("n5_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("n5_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  initialPassword: text("initial_password"),
  classId: varchar("class_id").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentSessions = pgTable("n5_student_sessions", {
  token: varchar("token").primaryKey(),
  studentId: varchar("student_id").notNull(),
  username: text("username").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const additionalPapers = pgTable("n5_additional_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("n5_questions", {
  id: varchar("id").primaryKey(),
  year: integer("year").notNull(),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  isPractice: boolean("is_practice").default(false),
  isQuizOnly: boolean("is_quiz_only").default(false),
  isAdditionalExam: boolean("is_additional_exam").default(false),
  additionalPaperId: varchar("additional_paper_id"),
  scenario: jsonb("scenario"),
  subQuestions: jsonb("sub_questions").notNull(),
});

export const customQuizzes = pgTable("n5_custom_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes").notNull().default(60),
  questionIds: text("question_ids").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("n5_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  totalMarks: integer("total_marks").notNull().default(40),
  totalTimeMinutes: integer("total_time_minutes").notNull().default(360),
  isPublished: boolean("is_active").default(false),
  evidenceChecklist: jsonb("evidence_checklist"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentSections = pgTable("n5_assignment_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  sectionType: text("section_type").notNull(),
  title: text("title").notNull(),
  isCompulsory: boolean("is_compulsory").default(false),
  orderIndex: integer("order_index").notNull().default(0),
  informationSheet: jsonb("information_sheet"),
});

export const assignmentParts = pgTable("n5_assignment_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  partLabel: text("part_label").notNull(),
  title: text("title"),
  instructions: text("instructions"),
  contentBlocks: jsonb("content_blocks"),
  maxMarks: integer("max_marks").notNull().default(0),
  orderIndex: integer("order_index").notNull().default(0),
  isPractical: boolean("is_practical").default(false),
  aiGradingGuidance: text("ai_grading_guidance"),
  subQuestions: jsonb("sub_questions"),
  requiresUpload: boolean("requires_upload").default(true),
  inputStyle: text("input_style").default("text"),
});

export const assignmentResources = pgTable("n5_assignment_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const examResults = pgTable("n5_exam_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id"),
  year: integer("year").notNull(),
  optionalSection: text("optional_section"),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  grade: text("grade"),
  breakdown: jsonb("breakdown"),
  additionalPaperId: varchar("additional_paper_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const assignmentAttempts = pgTable("n5_assignment_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  localStudentId: text("local_student_id").notNull(),
  studentId: varchar("student_id"),
  chosenOptionalSection: text("chosen_optional_section").notNull(),
  status: text("status").notNull().default("in_progress"),
  timeRemainingSeconds: integer("time_remaining_seconds").notNull(),
  currentSectionId: varchar("current_section_id"),
  currentPartId: varchar("current_part_id"),
  completedPartIds: text("completed_part_ids").array().default(sql`'{}'::text[]`),
  startedAt: timestamp("started_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
});

export const assignmentResponses = pgTable("n5_assignment_responses", {
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

export const activeExamProgress = pgTable("n5_active_exam_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  year: integer("year").notNull(),
  optionalSection: text("optional_section"),
  timeLeft: integer("time_left").notNull(),
  currentQuestion: integer("current_question").notNull().default(0),
  answeredCount: integer("answered_count").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  answeredQuestionIds: jsonb("answered_question_ids"),
  userInputs: jsonb("user_inputs"),
  examType: text("exam_type").default("past-paper"),
  examIdentifier: text("exam_identifier"),
  extraTimeAdded: text("extra_time_added"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Insert schemas ──────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAdditionalPaperSchema = createInsertSchema(additionalPapers).omit({
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

export const insertActiveExamProgressSchema = createInsertSchema(activeExamProgress).omit({
  id: true,
  updatedAt: true,
});

export const insertExamResultSchema = createInsertSchema(examResults).omit({
  id: true,
  timestamp: true,
});

// ── Types ───────────────────────────────────────────────────────────────────

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type AdditionalPaper = typeof additionalPapers.$inferSelect;
export type InsertAdditionalPaper = z.infer<typeof insertAdditionalPaperSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type DbQuestion = typeof questions.$inferSelect;
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
export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type ActiveExamProgress = typeof activeExamProgress.$inferSelect;
export type InsertActiveExamProgress = z.infer<typeof insertActiveExamProgressSchema>;
