import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const dsDatabases = pgTable("ds_databases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsTables = pgTable("ds_tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  databaseId: integer("database_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsFields = pgTable("ds_fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fieldType: text("field_type").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  isPrimaryKey: boolean("is_primary_key").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  tableId: integer("table_id").notNull(),
  caption: text("caption"),
  defaultValue: text("default_value"),
  fieldSize: integer("field_size"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsRecords = pgTable("ds_records", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull(),
  databaseId: integer("database_id").notNull(),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsEmbeds = pgTable("ds_embeds", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  databaseId: integer("database_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dsStudentSessions = pgTable("ds_student_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  sessionKey: text("session_key").notNull().unique(),
  sandboxDatabaseId: integer("sandbox_database_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dsQueries = pgTable("ds_queries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  databaseId: integer("database_id").notNull(),
  definition: jsonb("definition").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsForms = pgTable("ds_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  databaseId: integer("database_id").notNull(),
  definition: jsonb("definition").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsReports = pgTable("ds_reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  databaseId: integer("database_id").notNull(),
  definition: jsonb("definition").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dsRelationships = pgTable("ds_relationships", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull(),
  fromTableId: integer("from_table_id").notNull(),
  fromFieldId: integer("from_field_id").notNull(),
  toTableId: integer("to_table_id").notNull(),
  toFieldId: integer("to_field_id").notNull(),
  relationshipType: text("relationship_type").notNull().default("one-to-many"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
