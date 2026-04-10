import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Unified student + class tables for BHS Computing Science ────────────────
//
// All students (N5, Higher, and future N4) share one table, distinguished by
// the `course` column ("n5" | "higher" | "n4").
//
// All exam content (questions, past papers, assignments) also shares unified
// tables below, so the Paper Builder in the sandbox editor can manage content
// for either course from one place.
//
// Both revision-storage.ts and n5-storage.ts delegate their reads/writes here,
// adding `course` automatically so route handlers need no changes.

export const COURSE_N5     = "n5"     as const;
export const COURSE_HIGHER = "higher" as const;
export type  Course = "n5" | "higher" | "n4";

// ── Students & Classes ───────────────────────────────────────────────────────

export const bhsClasses = pgTable("bhs_classes", {
  id:        varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name:      text("name").notNull(),
  course:    text("course").notNull(),
  teacherId: varchar("teacher_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bhsStudents = pgTable("bhs_students", {
  id:                 varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username:           text("username").notNull(),
  password:           text("password").notNull(),
  initialPassword:    text("initial_password"),
  course:             text("course").notNull(),
  classId:            varchar("class_id").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  createdAt:          timestamp("created_at").defaultNow(),
}, (t) => ({
  usernameCoursePair: uniqueIndex("bhs_students_username_course_unique").on(t.username, t.course),
}));

// ── Exam Content ─────────────────────────────────────────────────────────────
//
// bhs_papers     — past paper / additional exam headers (was: additional_exams / n5_additional_papers)
// bhs_questions  — individual exam questions  (was: questions / n5_questions)
// bhs_custom_quizzes — teacher-curated question sets (was: custom_quizzes / n5_custom_quizzes)

export const bhsPapers = pgTable("bhs_papers", {
  id:          varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  course:      text("course").notNull(),            // "higher" | "n5"
  title:       text("title").notNull(),             // N5 "name" field maps here
  isPublished: boolean("is_published").default(false),
  createdAt:   timestamp("created_at").defaultNow(),
});

export const bhsQuestions = pgTable("bhs_questions", {
  id:               varchar("id").primaryKey(),     // custom ID set by caller
  course:           text("course").notNull(),
  year:             integer("year"),
  topic:            text("topic").notNull(),
  title:            text("title").notNull(),
  isPractice:       boolean("is_practice").default(false),
  isQuizOnly:       boolean("is_quiz_only").default(false),
  isAdditionalExam: boolean("is_additional_exam").default(false),
  additionalPaperId: varchar("additional_paper_id"),  // FK → bhs_papers.id
  scenario:         jsonb("scenario"),
  subQuestions:     jsonb("sub_questions").notNull(),
});

export const bhsCustomQuizzes = pgTable("bhs_custom_quizzes", {
  id:               varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  course:           text("course").notNull(),
  name:             text("name").notNull(),
  description:      text("description"),
  timeLimitMinutes: integer("time_limit_minutes").default(60),
  questionIds:      text("question_ids").array().notNull(),
  isActive:         boolean("is_active").default(true),
  createdAt:        timestamp("created_at").defaultNow(),
});

// ── Assignments ──────────────────────────────────────────────────────────────
//
// bhs_assignments, bhs_assignment_sections, bhs_assignment_parts, bhs_assignment_resources
// (replaces rev_assignments/assignment_* and n5_assignments/n5_assignment_*)

export const bhsAssignments = pgTable("bhs_assignments", {
  id:               varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  course:           text("course").notNull(),
  year:             integer("year").notNull(),
  title:            text("title").notNull(),
  totalMarks:       integer("total_marks").default(40),
  totalTimeMinutes: integer("total_time_minutes").default(360),
  isPublished:      boolean("is_active").default(false),
  evidenceChecklist: jsonb("evidence_checklist"),
  createdAt:        timestamp("created_at").defaultNow(),
});

export const bhsAssignmentSections = pgTable("bhs_assignment_sections", {
  id:              varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId:    varchar("assignment_id").notNull(),
  sectionType:     text("section_type").notNull(),
  title:           text("title").notNull(),
  isCompulsory:    boolean("is_compulsory").default(false),
  orderIndex:      integer("order_index").default(0),
  informationSheet: jsonb("information_sheet"),
});

export const bhsAssignmentParts = pgTable("bhs_assignment_parts", {
  id:               varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId:        varchar("section_id").notNull(),
  partLabel:        text("part_label").notNull(),
  title:            text("title"),
  instructions:     text("instructions"),
  contentBlocks:    jsonb("content_blocks"),
  maxMarks:         integer("max_marks").default(0),
  orderIndex:       integer("order_index").default(0),
  isPractical:      boolean("is_practical").default(false),
  aiGradingGuidance: text("ai_grading_guidance"),
  subQuestions:     jsonb("sub_questions"),
  requiresUpload:   boolean("requires_upload").default(true),
  inputStyle:       text("input_style").default("text"),
});

export const bhsAssignmentResources = pgTable("bhs_assignment_resources", {
  id:          varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId:      varchar("part_id").notNull(),
  fileName:    text("file_name").notNull(),
  fileUrl:     text("file_url").notNull(),
  fileType:    text("file_type"),
  description: text("description"),
  uploadedAt:  timestamp("uploaded_at").defaultNow(),
});

// ── Insert schemas ───────────────────────────────────────────────────────────

export const insertBhsClassSchema = createInsertSchema(bhsClasses).omit({
  id: true, createdAt: true, course: true,
});

export const insertBhsStudentSchema = createInsertSchema(bhsStudents).omit({
  id: true, createdAt: true, course: true,
});

export const insertBhsPaperSchema = createInsertSchema(bhsPapers).omit({
  id: true, createdAt: true,
});

export const insertBhsQuestionSchema = createInsertSchema(bhsQuestions);

export const insertBhsAssignmentSchema = createInsertSchema(bhsAssignments).omit({
  id: true, createdAt: true,
});

export const insertBhsAssignmentSectionSchema = createInsertSchema(bhsAssignmentSections).omit({
  id: true,
});

export const insertBhsAssignmentPartSchema = createInsertSchema(bhsAssignmentParts).omit({
  id: true,
});

export const insertBhsAssignmentResourceSchema = createInsertSchema(bhsAssignmentResources).omit({
  id: true, uploadedAt: true,
});

// ── Types ────────────────────────────────────────────────────────────────────

export type BhsClass         = typeof bhsClasses.$inferSelect;
export type InsertBhsClass   = z.infer<typeof insertBhsClassSchema>;
export type BhsStudent       = typeof bhsStudents.$inferSelect;
export type InsertBhsStudent = z.infer<typeof insertBhsStudentSchema>;

export type BhsPaper         = typeof bhsPapers.$inferSelect;
export type InsertBhsPaper   = z.infer<typeof insertBhsPaperSchema>;
export type BhsQuestion      = typeof bhsQuestions.$inferSelect;
export type InsertBhsQuestion = z.infer<typeof insertBhsQuestionSchema>;
export type BhsCustomQuiz    = typeof bhsCustomQuizzes.$inferSelect;

export type BhsAssignment        = typeof bhsAssignments.$inferSelect;
export type InsertBhsAssignment  = z.infer<typeof insertBhsAssignmentSchema>;
export type BhsAssignmentSection = typeof bhsAssignmentSections.$inferSelect;
export type BhsAssignmentPart    = typeof bhsAssignmentParts.$inferSelect;
export type BhsAssignmentResource = typeof bhsAssignmentResources.$inferSelect;
