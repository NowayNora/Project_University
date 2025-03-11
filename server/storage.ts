import { 
  User, InsertUser,
  Student, InsertStudent,
  Faculty, InsertFaculty,
  Course, InsertCourse,
  CourseSection, InsertCourseSection,
  Enrollment, InsertEnrollment,
  ClassSchedule, InsertClassSchedule,
  TuitionFee, InsertTuitionFee,
  Payment, InsertPayment,
  ResearchProject, InsertResearchProject,
  ResearchMember, InsertResearchMember,
  Announcement, InsertAnnouncement
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Student related operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Faculty related operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByUserId(userId: number): Promise<Faculty | undefined>;
  getFacultyByFacultyId(facultyId: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  
  // Course related operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(courseCode: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // CourseSection related operations
  getCourseSection(id: number): Promise<CourseSection | undefined>;
  getCourseSectionsByCourseId(courseId: number): Promise<CourseSection[]>;
  getCourseSectionsByFacultyId(facultyId: number): Promise<CourseSection[]>;
  createCourseSection(section: InsertCourseSection): Promise<CourseSection>;
  
  // Enrollment related operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudentId(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsBySectionId(sectionId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;
  
  // ClassSchedule related operations
  getClassSchedule(id: number): Promise<ClassSchedule | undefined>;
  getClassSchedulesBySectionId(sectionId: number): Promise<ClassSchedule[]>;
  createClassSchedule(schedule: InsertClassSchedule): Promise<ClassSchedule>;
  
  // TuitionFee related operations
  getTuitionFee(id: number): Promise<TuitionFee | undefined>;
  getTuitionFeesByStudentId(studentId: number): Promise<TuitionFee[]>;
  createTuitionFee(fee: InsertTuitionFee): Promise<TuitionFee>;
  updateTuitionFee(id: number, fee: Partial<TuitionFee>): Promise<TuitionFee>;
  
  // Payment related operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByTuitionFeeId(tuitionFeeId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // ResearchProject related operations
  getResearchProject(id: number): Promise<ResearchProject | undefined>;
  getResearchProjectByCode(projectCode: string): Promise<ResearchProject | undefined>;
  getAllResearchProjects(): Promise<ResearchProject[]>;
  createResearchProject(project: InsertResearchProject): Promise<ResearchProject>;
  updateResearchProject(id: number, project: Partial<ResearchProject>): Promise<ResearchProject>;
  
  // ResearchMember related operations
  getResearchMember(id: number): Promise<ResearchMember | undefined>;
  getResearchMembersByProjectId(projectId: number): Promise<ResearchMember[]>;
  getResearchMembersByFacultyId(facultyId: number): Promise<ResearchMember[]>;
  getResearchMembersByStudentId(studentId: number): Promise<ResearchMember[]>;
  createResearchMember(member: InsertResearchMember): Promise<ResearchMember>;
  
  // Announcement related operations
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAnnouncementsByFacultyId(facultyId: number): Promise<Announcement[]>;
  getAnnouncementsByCourseId(courseId: number): Promise<Announcement[]>;
  getAnnouncementsByDepartment(department: string): Promise<Announcement[]>;
  getPublicAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private faculty: Map<number, Faculty>;
  private courses: Map<number, Course>;
  private courseSections: Map<number, CourseSection>;
  private enrollments: Map<number, Enrollment>;
  private classSchedules: Map<number, ClassSchedule>;
  private tuitionFees: Map<number, TuitionFee>;
  private payments: Map<number, Payment>;
  private researchProjects: Map<number, ResearchProject>;
  private researchMembers: Map<number, ResearchMember>;
  private announcements: Map<number, Announcement>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private studentIdCounter: number = 1;
  private facultyIdCounter: number = 1;
  private courseIdCounter: number = 1;
  private sectionIdCounter: number = 1;
  private enrollmentIdCounter: number = 1;
  private scheduleIdCounter: number = 1;
  private feeIdCounter: number = 1;
  private paymentIdCounter: number = 1;
  private projectIdCounter: number = 1;
  private memberIdCounter: number = 1;
  private announcementIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.faculty = new Map();
    this.courses = new Map();
    this.courseSections = new Map();
    this.enrollments = new Map();
    this.classSchedules = new Map();
    this.tuitionFees = new Map();
    this.payments = new Map();
    this.researchProjects = new Map();
    this.researchMembers = new Map();
    this.announcements = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Add sample data for development if needed
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.userId === userId
    );
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.studentId === studentId
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  // Faculty methods
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculty.get(id);
  }

  async getFacultyByUserId(userId: number): Promise<Faculty | undefined> {
    return Array.from(this.faculty.values()).find(
      (faculty) => faculty.userId === userId
    );
  }

  async getFacultyByFacultyId(facultyId: string): Promise<Faculty | undefined> {
    return Array.from(this.faculty.values()).find(
      (faculty) => faculty.facultyId === facultyId
    );
  }

  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const id = this.facultyIdCounter++;
    const faculty: Faculty = { ...insertFaculty, id };
    this.faculty.set(id, faculty);
    return faculty;
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(courseCode: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.courseCode === courseCode
    );
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  // CourseSection methods
  async getCourseSection(id: number): Promise<CourseSection | undefined> {
    return this.courseSections.get(id);
  }

  async getCourseSectionsByCourseId(courseId: number): Promise<CourseSection[]> {
    return Array.from(this.courseSections.values()).filter(
      (section) => section.courseId === courseId
    );
  }

  async getCourseSectionsByFacultyId(facultyId: number): Promise<CourseSection[]> {
    return Array.from(this.courseSections.values()).filter(
      (section) => section.facultyId === facultyId
    );
  }

  async createCourseSection(insertSection: InsertCourseSection): Promise<CourseSection> {
    const id = this.sectionIdCounter++;
    const section: CourseSection = { ...insertSection, id };
    this.courseSections.set(id, section);
    return section;
  }

  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByStudentId(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );
  }

  async getEnrollmentsBySectionId(sectionId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.sectionId === sectionId
    );
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const enrollment: Enrollment = { 
      ...insertEnrollment, 
      id, 
      enrollmentDate: new Date() 
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, enrollmentUpdate: Partial<Enrollment>): Promise<Enrollment> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) {
      throw new Error(`Enrollment with id ${id} not found`);
    }
    
    const updatedEnrollment = { ...enrollment, ...enrollmentUpdate };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // ClassSchedule methods
  async getClassSchedule(id: number): Promise<ClassSchedule | undefined> {
    return this.classSchedules.get(id);
  }

  async getClassSchedulesBySectionId(sectionId: number): Promise<ClassSchedule[]> {
    return Array.from(this.classSchedules.values()).filter(
      (schedule) => schedule.sectionId === sectionId
    );
  }

  async createClassSchedule(insertSchedule: InsertClassSchedule): Promise<ClassSchedule> {
    const id = this.scheduleIdCounter++;
    const schedule: ClassSchedule = { ...insertSchedule, id };
    this.classSchedules.set(id, schedule);
    return schedule;
  }

  // TuitionFee methods
  async getTuitionFee(id: number): Promise<TuitionFee | undefined> {
    return this.tuitionFees.get(id);
  }

  async getTuitionFeesByStudentId(studentId: number): Promise<TuitionFee[]> {
    return Array.from(this.tuitionFees.values()).filter(
      (fee) => fee.studentId === studentId
    );
  }

  async createTuitionFee(insertFee: InsertTuitionFee): Promise<TuitionFee> {
    const id = this.feeIdCounter++;
    const fee: TuitionFee = { ...insertFee, id };
    this.tuitionFees.set(id, fee);
    return fee;
  }

  async updateTuitionFee(id: number, feeUpdate: Partial<TuitionFee>): Promise<TuitionFee> {
    const fee = this.tuitionFees.get(id);
    if (!fee) {
      throw new Error(`TuitionFee with id ${id} not found`);
    }
    
    const updatedFee = { ...fee, ...feeUpdate };
    this.tuitionFees.set(id, updatedFee);
    return updatedFee;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByTuitionFeeId(tuitionFeeId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.tuitionFeeId === tuitionFeeId
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      paymentDate: new Date() 
    };
    this.payments.set(id, payment);
    return payment;
  }

  // ResearchProject methods
  async getResearchProject(id: number): Promise<ResearchProject | undefined> {
    return this.researchProjects.get(id);
  }

  async getResearchProjectByCode(projectCode: string): Promise<ResearchProject | undefined> {
    return Array.from(this.researchProjects.values()).find(
      (project) => project.projectCode === projectCode
    );
  }

  async getAllResearchProjects(): Promise<ResearchProject[]> {
    return Array.from(this.researchProjects.values());
  }

  async createResearchProject(insertProject: InsertResearchProject): Promise<ResearchProject> {
    const id = this.projectIdCounter++;
    const project: ResearchProject = { ...insertProject, id };
    this.researchProjects.set(id, project);
    return project;
  }

  async updateResearchProject(id: number, projectUpdate: Partial<ResearchProject>): Promise<ResearchProject> {
    const project = this.researchProjects.get(id);
    if (!project) {
      throw new Error(`ResearchProject with id ${id} not found`);
    }
    
    const updatedProject = { ...project, ...projectUpdate };
    this.researchProjects.set(id, updatedProject);
    return updatedProject;
  }

  // ResearchMember methods
  async getResearchMember(id: number): Promise<ResearchMember | undefined> {
    return this.researchMembers.get(id);
  }

  async getResearchMembersByProjectId(projectId: number): Promise<ResearchMember[]> {
    return Array.from(this.researchMembers.values()).filter(
      (member) => member.projectId === projectId
    );
  }

  async getResearchMembersByFacultyId(facultyId: number): Promise<ResearchMember[]> {
    return Array.from(this.researchMembers.values()).filter(
      (member) => member.facultyId === facultyId
    );
  }

  async getResearchMembersByStudentId(studentId: number): Promise<ResearchMember[]> {
    return Array.from(this.researchMembers.values()).filter(
      (member) => member.studentId === studentId
    );
  }

  async createResearchMember(insertMember: InsertResearchMember): Promise<ResearchMember> {
    const id = this.memberIdCounter++;
    const member: ResearchMember = { 
      ...insertMember, 
      id, 
      joinDate: new Date() 
    };
    this.researchMembers.set(id, member);
    return member;
  }

  // Announcement methods
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async getAnnouncementsByFacultyId(facultyId: number): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(
      (announcement) => announcement.facultyId === facultyId
    );
  }

  async getAnnouncementsByCourseId(courseId: number): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(
      (announcement) => announcement.targetCourse === courseId
    );
  }

  async getAnnouncementsByDepartment(department: string): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(
      (announcement) => announcement.targetDepartment === department
    );
  }

  async getPublicAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(
      (announcement) => announcement.isPublic
    );
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.announcementIdCounter++;
    const announcement: Announcement = { 
      ...insertAnnouncement, 
      id, 
      publishDate: new Date() 
    };
    this.announcements.set(id, announcement);
    return announcement;
  }
}

export const storage = new MemStorage();
