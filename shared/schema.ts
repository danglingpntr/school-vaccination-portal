import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("coordinator"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// STUDENTS
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  dateOfBirth: date("date_of_birth"),
  grade: text("grade").notNull(),
  address: text("address"),
  parentContact: text("parent_contact"),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// VACCINATION DRIVES
export const vaccinationDrives = pgTable("vaccination_drives", {
  id: serial("id").primaryKey(),
  driveId: text("drive_id").notNull().unique(),
  vaccineName: text("vaccine_name").notNull(),
  driveDate: date("drive_date").notNull(),
  applicableGrades: text("applicable_grades").notNull(), // Comma-separated list of grades
  availableDoses: integer("available_doses").notNull(),
  usedDoses: integer("used_doses").default(0).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVaccinationDriveSchema = createInsertSchema(vaccinationDrives).omit({
  id: true,
  usedDoses: true,
  createdAt: true,
});

export type InsertVaccinationDrive = z.infer<typeof insertVaccinationDriveSchema>;
export type VaccinationDrive = typeof vaccinationDrives.$inferSelect;

// VACCINATION RECORDS
export const vaccinationRecords = pgTable("vaccination_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  driveId: integer("drive_id").notNull().references(() => vaccinationDrives.id),
  vaccinationDate: date("vaccination_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    studentDriveIdx: uniqueIndex("student_drive_idx").on(table.studentId, table.driveId),
  };
});

export const insertVaccinationRecordSchema = createInsertSchema(vaccinationRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertVaccinationRecord = z.infer<typeof insertVaccinationRecordSchema>;
export type VaccinationRecord = typeof vaccinationRecords.$inferSelect;

// ACTIVITY LOG
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
