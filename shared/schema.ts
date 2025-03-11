import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for both students and faculty
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "faculty"] }).notNull(),
  fullName: text("full_name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student specific information
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  studentId: text("student_id").notNull().unique(),
  placeOfBirth: text("place_of_birth"),
  major: text("major").notNull(),
  program: text("program").notNull(),
  enrollmentYear: integer("enrollment_year").notNull(),
  status: text("status", { enum: ["active", "on_leave", "withdrawn"] }).default("active").notNull(),
  gpa: real("gpa").default(0),
  creditsCompleted: integer("credits_completed").default(0),
  totalCreditsRequired: integer("total_credits_required").default(120),
});

// Faculty specific information
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  facultyId: text("faculty_id").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  officeLocation: text("office_location"),
  officeHours: text("office_hours"),
  teachingHours: integer("teaching_hours").default(0),
  researchFocus: text("research_focus"),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: text("course_code").notNull().unique(),
  courseName: text("course_name").notNull(),
  department: text("department").notNull(),
  credits: integer("credits").notNull(),
  description: text("description"),
});

// Course sections (instances of courses being taught)
export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  schedule: text("schedule"),
  location: text("location"),
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  status: text("status", { enum: ["scheduled", "ongoing", "completed", "cancelled"] }).default("scheduled").notNull(),
});

// Student enrollments in course sections
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  sectionId: integer("section_id").references(() => courseSections.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  grade: real("grade"),
  attendance: integer("attendance").default(0),
  status: text("status", { enum: ["enrolled", "withdrawn", "completed"] }).default("enrolled").notNull(),
});

// Class schedules
export const classSchedules = pgTable("class_schedules", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => courseSections.id).notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room").notNull(),
});

// Tuition fees
export const tuitionFees = pgTable("tuition_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  amount: real("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status", { enum: ["unpaid", "partial", "paid"] }).default("unpaid").notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tuitionFeeId: integer("tuition_fee_id").references(() => tuitionFees.id).notNull(),
  amount: real("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  method: text("method").notNull(),
  transactionId: text("transaction_id"),
});

// Research projects
export const researchProjects = pgTable("research_projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status", { enum: ["planning", "ongoing", "completed", "cancelled"] }).default("planning").notNull(),
  progress: integer("progress").default(0),
});

// Research project members
export const researchMembers = pgTable("research_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => researchProjects.id).notNull(),
  facultyId: integer("faculty_id").references(() => faculty.id),
  studentId: integer("student_id").references(() => students.id),
  role: text("role").notNull(),
  joinDate: timestamp("join_date").defaultNow().notNull(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishDate: timestamp("publish_date").defaultNow().notNull(),
  targetCourse: integer("target_course").references(() => courses.id),
  targetDepartment: text("target_department"),
  isPublic: boolean("is_public").default(false),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertFacultySchema = createInsertSchema(faculty).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertCourseSectionSchema = createInsertSchema(courseSections).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true });
export const insertClassScheduleSchema = createInsertSchema(classSchedules).omit({ id: true });
export const insertTuitionFeeSchema = createInsertSchema(tuitionFees).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paymentDate: true });
export const insertResearchProjectSchema = createInsertSchema(researchProjects).omit({ id: true });
export const insertResearchMemberSchema = createInsertSchema(researchMembers).omit({ id: true, joinDate: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, publishDate: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseSection = typeof courseSections.$inferSelect;
export type InsertCourseSection = z.infer<typeof insertCourseSectionSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type ClassSchedule = typeof classSchedules.$inferSelect;
export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;

export type TuitionFee = typeof tuitionFees.$inferSelect;
export type InsertTuitionFee = z.infer<typeof insertTuitionFeeSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type ResearchProject = typeof researchProjects.$inferSelect;
export type InsertResearchProject = z.infer<typeof insertResearchProjectSchema>;

export type ResearchMember = typeof researchMembers.$inferSelect;
export type InsertResearchMember = z.infer<typeof insertResearchMemberSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Login type for both students and faculty
export type LoginData = {
  username: string;
  password: string;
};
