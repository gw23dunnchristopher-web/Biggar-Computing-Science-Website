import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Unified student + class tables for BHS Computing Science ────────────────
//
// All students (N5, Higher, and future N4) share one table, distinguished by
// the `course` column ("n5" | "higher" | "n4").
// Course-specific content (questions, results, assignments) stays in its own
// app schema (n5-schema.ts / revision-schema.ts) because the data formats
// differ between courses.
//
// Both revision-storage.ts and n5-storage.ts delegate student/class reads
// and writes here, adding `course` automatically so route handlers need no
// changes.

export const COURSE_N5     = "n5"     as const;
export const COURSE_HIGHER = "higher" as const;
export type  Course = "n5" | "higher" | "n4";

export const bhsClasses = pgTable("bhs_classes", {
  id:        varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name:      text("name").notNull(),
  course:    text("course").notNull(),         // "n5" | "higher" | "n4"
  teacherId: varchar("teacher_id"),            // null for N5, required for Higher
  createdAt: timestamp("created_at").defaultNow(),
});

export const bhsStudents = pgTable("bhs_students", {
  id:                 varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username:           text("username").notNull(),
  password:           text("password").notNull(),
  initialPassword:    text("initial_password"),
  course:             text("course").notNull(),     // "n5" | "higher" | "n4"
  classId:            varchar("class_id").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  createdAt:          timestamp("created_at").defaultNow(),
}, (t) => ({
  usernameCoursePair: uniqueIndex("bhs_students_username_course_unique").on(t.username, t.course),
}));

// ── Insert schemas (course omitted — the storage layer adds it) ─────────────

export const insertBhsClassSchema = createInsertSchema(bhsClasses).omit({
  id: true,
  createdAt: true,
  course: true,
});

export const insertBhsStudentSchema = createInsertSchema(bhsStudents).omit({
  id: true,
  createdAt: true,
  course: true,
});

// ── Types ───────────────────────────────────────────────────────────────────

export type BhsClass         = typeof bhsClasses.$inferSelect;
export type InsertBhsClass   = z.infer<typeof insertBhsClassSchema>;
export type BhsStudent       = typeof bhsStudents.$inferSelect;
export type InsertBhsStudent = z.infer<typeof insertBhsStudentSchema>;
