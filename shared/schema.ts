import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level").notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classStudents = pgTable("class_students", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  starterCode: text("starter_code"),
  classId: integer("class_id").references(() => classes.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  code: text("code").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  feedback: text("feedback"),
  feedbackBy: integer("feedback_by").references(() => users.id),
  feedbackAt: timestamp("feedback_at"),
});

export const usersRelations = relations(users, ({ many }) => ({
  taughtClasses: many(classes),
  classEnrollments: many(classStudents),
  createdAssignments: many(assignments),
  submissions: many(submissions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  students: many(classStudents),
  assignments: many(assignments),
}));

export const classStudentsRelations = relations(classStudents, ({ one }) => ({
  class: one(classes, {
    fields: [classStudents.classId],
    references: [classes.id],
  }),
  student: one(users, {
    fields: [classStudents.studentId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  class: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  creator: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
