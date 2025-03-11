import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCourseSchema, insertCourseSectionSchema, insertEnrollmentSchema, insertPaymentSchema, insertResearchProjectSchema, insertResearchMemberSchema, insertAnnouncementSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  /**
   * Error handling middleware for Zod validation
   */
  const validateRequest = (schema: z.ZodType<any, any>) => {
    return (req: any, res: any, next: any) => {
      try {
        req.validatedBody = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({
            message: validationError.message,
          });
        } else {
          next(error);
        }
      }
    };
  };

  /**
   * Middleware to check if user is authenticated
   */
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  /**
   * Middleware to check if user has specific role
   */
  const hasRole = (role: string) => {
    return (req: any, res: any, next: any) => {
      if (req.isAuthenticated() && req.user.role === role) {
        return next();
      }
      res.status(403).json({ message: "Forbidden" });
    };
  };

  /**
   * Student Routes
   */
  // Get course list
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  // Get available course sections
  app.get("/api/course-sections", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let sections = [];
      
      if (courseId) {
        sections = await storage.getCourseSectionsByCourseId(courseId);
      } else {
        // Get all course sections from all courses
        const courses = await storage.getAllCourses();
        for (const course of courses) {
          const courseSections = await storage.getCourseSectionsByCourseId(course.id);
          sections.push(...courseSections);
        }
      }
      
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course sections" });
    }
  });

  // Get student's enrolled courses
  app.get("/api/student/enrollments", isAuthenticated, hasRole("student"), async (req, res) => {
    try {
      const studentProfile = await storage.getStudentByUserId(req.user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const enrollments = await storage.getEnrollmentsByStudentId(studentProfile.id);
      
      // Fetch course section and course details for each enrollment
      const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const section = await storage.getCourseSection(enrollment.sectionId);
          const course = section ? await storage.getCourse(section.courseId) : null;
          const classSchedules = section ? await storage.getClassSchedulesBySectionId(section.id) : [];
          
          return {
            ...enrollment,
            section,
            course,
            classSchedules
          };
        })
      );
      
      res.json(enrollmentsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments" });
    }
  });

  // Enroll in a course
  app.post(
    "/api/student/enroll", 
    isAuthenticated, 
    hasRole("student"), 
    validateRequest(insertEnrollmentSchema), 
    async (req, res) => {
      try {
        const studentProfile = await storage.getStudentByUserId(req.user.id);
        if (!studentProfile) {
          return res.status(404).json({ message: "Student profile not found" });
        }
        
        const { sectionId } = req.validatedBody;
        
        // Check if section exists
        const section = await storage.getCourseSection(sectionId);
        if (!section) {
          return res.status(404).json({ message: "Course section not found" });
        }
        
        // Check if already enrolled
        const existingEnrollments = await storage.getEnrollmentsByStudentId(studentProfile.id);
        const alreadyEnrolled = existingEnrollments.some(e => e.sectionId === sectionId);
        
        if (alreadyEnrolled) {
          return res.status(400).json({ message: "Already enrolled in this course section" });
        }
        
        // Create enrollment
        const enrollment = await storage.createEnrollment({
          studentId: studentProfile.id,
          sectionId,
          status: "enrolled"
        });
        
        // Update course section current students count
        if (section) {
          const updatedSection = {
            ...section,
            currentStudents: section.currentStudents + 1
          };
          // Note: Normally we would update the course section here
        }
        
        res.status(201).json(enrollment);
      } catch (error) {
        res.status(500).json({ message: "Error enrolling in course" });
      }
    }
  );

  // Get student's grades
  app.get("/api/student/grades", isAuthenticated, hasRole("student"), async (req, res) => {
    try {
      const studentProfile = await storage.getStudentByUserId(req.user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const enrollments = await storage.getEnrollmentsByStudentId(studentProfile.id);
      
      // Fetch course details for each enrollment
      const gradesWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const section = await storage.getCourseSection(enrollment.sectionId);
          const course = section ? await storage.getCourse(section.courseId) : null;
          
          return {
            enrollmentId: enrollment.id,
            grade: enrollment.grade,
            status: enrollment.status,
            courseCode: course?.courseCode,
            courseName: course?.courseName,
            credits: course?.credits,
            semester: section?.semester,
            year: section?.year
          };
        })
      );
      
      res.json(gradesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades" });
    }
  });

  // Get student's class schedule
  app.get("/api/student/schedule", isAuthenticated, hasRole("student"), async (req, res) => {
    try {
      const studentProfile = await storage.getStudentByUserId(req.user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const enrollments = await storage.getEnrollmentsByStudentId(studentProfile.id);
      
      // Only consider active enrollments
      const activeEnrollments = enrollments.filter(e => e.status === "enrolled");
      
      // Fetch schedule for each enrollment
      const schedule = [];
      
      for (const enrollment of activeEnrollments) {
        const section = await storage.getCourseSection(enrollment.sectionId);
        if (section) {
          const course = await storage.getCourse(section.courseId);
          const classSchedules = await storage.getClassSchedulesBySectionId(section.id);
          
          for (const classSchedule of classSchedules) {
            schedule.push({
              ...classSchedule,
              courseCode: course?.courseCode,
              courseName: course?.courseName,
              sectionId: section.id,
              faculty: section.facultyId,
              location: classSchedule.room
            });
          }
        }
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule" });
    }
  });

  // Get student's tuition fees
  app.get("/api/student/tuition", isAuthenticated, hasRole("student"), async (req, res) => {
    try {
      const studentProfile = await storage.getStudentByUserId(req.user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const tuitionFees = await storage.getTuitionFeesByStudentId(studentProfile.id);
      
      // Fetch payment details for each tuition fee
      const tuitionWithPayments = await Promise.all(
        tuitionFees.map(async (fee) => {
          const payments = await storage.getPaymentsByTuitionFeeId(fee.id);
          const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remaining = fee.amount - totalPaid;
          
          return {
            ...fee,
            payments,
            totalPaid,
            remaining
          };
        })
      );
      
      res.json(tuitionWithPayments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tuition fees" });
    }
  });

  // Make tuition payment
  app.post(
    "/api/student/payment",
    isAuthenticated,
    hasRole("student"),
    validateRequest(insertPaymentSchema),
    async (req, res) => {
      try {
        const { tuitionFeeId, amount, method, transactionId } = req.validatedBody;
        
        // Check if fee exists and belongs to student
        const fee = await storage.getTuitionFee(tuitionFeeId);
        const studentProfile = await storage.getStudentByUserId(req.user.id);
        
        if (!fee || !studentProfile || fee.studentId !== studentProfile.id) {
          return res.status(404).json({ message: "Tuition fee not found" });
        }
        
        // Create payment
        const payment = await storage.createPayment({
          tuitionFeeId,
          amount,
          method,
          transactionId
        });
        
        // Update tuition fee status
        const payments = await storage.getPaymentsByTuitionFeeId(tuitionFeeId);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        let status: "unpaid" | "partial" | "paid" = "unpaid";
        
        if (totalPaid >= fee.amount) {
          status = "paid";
        } else if (totalPaid > 0) {
          status = "partial";
        }
        
        await storage.updateTuitionFee(fee.id, { status });
        
        res.status(201).json(payment);
      } catch (error) {
        res.status(500).json({ message: "Error processing payment" });
      }
    }
  );

  /**
   * Faculty Routes
   */
  // Get teaching schedule
  app.get("/api/faculty/schedule", isAuthenticated, hasRole("faculty"), async (req, res) => {
    try {
      const facultyProfile = await storage.getFacultyByUserId(req.user.id);
      if (!facultyProfile) {
        return res.status(404).json({ message: "Faculty profile not found" });
      }
      
      const sections = await storage.getCourseSectionsByFacultyId(facultyProfile.id);
      
      // Fetch schedule for each section
      const schedule = [];
      
      for (const section of sections) {
        const course = await storage.getCourse(section.courseId);
        const classSchedules = await storage.getClassSchedulesBySectionId(section.id);
        
        for (const classSchedule of classSchedules) {
          schedule.push({
            ...classSchedule,
            courseCode: course?.courseCode,
            courseName: course?.courseName,
            sectionId: section.id,
            location: classSchedule.room
          });
        }
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teaching schedule" });
    }
  });

  // Get faculty's classes
  app.get("/api/faculty/classes", isAuthenticated, hasRole("faculty"), async (req, res) => {
    try {
      const facultyProfile = await storage.getFacultyByUserId(req.user.id);
      if (!facultyProfile) {
        return res.status(404).json({ message: "Faculty profile not found" });
      }
      
      const sections = await storage.getCourseSectionsByFacultyId(facultyProfile.id);
      
      // Fetch course details for each section
      const classesWithDetails = await Promise.all(
        sections.map(async (section) => {
          const course = await storage.getCourse(section.courseId);
          const enrollments = await storage.getEnrollmentsBySectionId(section.id);
          const classSchedules = await storage.getClassSchedulesBySectionId(section.id);
          
          return {
            ...section,
            course,
            enrollments,
            classSchedules,
            studentCount: enrollments.length
          };
        })
      );
      
      res.json(classesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching classes" });
    }
  });

  // Get class students
  app.get("/api/faculty/class/:sectionId/students", isAuthenticated, hasRole("faculty"), async (req, res) => {
    try {
      const { sectionId } = req.params;
      const facultyProfile = await storage.getFacultyByUserId(req.user.id);
      
      if (!facultyProfile) {
        return res.status(404).json({ message: "Faculty profile not found" });
      }
      
      // Check if section belongs to faculty
      const section = await storage.getCourseSection(parseInt(sectionId));
      if (!section || section.facultyId !== facultyProfile.id) {
        return res.status(403).json({ message: "Not authorized to access this class" });
      }
      
      const enrollments = await storage.getEnrollmentsBySectionId(parseInt(sectionId));
      
      // Fetch student details for each enrollment
      const studentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await storage.getStudent(enrollment.studentId);
          if (student) {
            const user = await storage.getUser(student.userId);
            return {
              enrollment,
              student,
              user: user ? { 
                id: user.id,
                username: user.username, 
                fullName: user.fullName,
                email: user.email
              } : null
            };
          }
          return null;
        })
      );
      
      res.json(studentsWithDetails.filter(s => s !== null));
    } catch (error) {
      res.status(500).json({ message: "Error fetching class students" });
    }
  });

  // Update student grade
  app.patch(
    "/api/faculty/enrollment/:enrollmentId", 
    isAuthenticated, 
    hasRole("faculty"), 
    async (req, res) => {
      try {
        const { enrollmentId } = req.params;
        const { grade, attendance } = req.body;
        
        const facultyProfile = await storage.getFacultyByUserId(req.user.id);
        if (!facultyProfile) {
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        
        // Check if enrollment exists
        const enrollment = await storage.getEnrollment(parseInt(enrollmentId));
        if (!enrollment) {
          return res.status(404).json({ message: "Enrollment not found" });
        }
        
        // Check if section belongs to faculty
        const section = await storage.getCourseSection(enrollment.sectionId);
        if (!section || section.facultyId !== facultyProfile.id) {
          return res.status(403).json({ message: "Not authorized to update this enrollment" });
        }
        
        // Update enrollment
        const updatedEnrollment = await storage.updateEnrollment(
          parseInt(enrollmentId), 
          { grade, attendance }
        );
        
        res.json(updatedEnrollment);
      } catch (error) {
        res.status(500).json({ message: "Error updating grade" });
      }
    }
  );

  // Get faculty's research projects
  app.get("/api/faculty/research", isAuthenticated, hasRole("faculty"), async (req, res) => {
    try {
      const facultyProfile = await storage.getFacultyByUserId(req.user.id);
      if (!facultyProfile) {
        return res.status(404).json({ message: "Faculty profile not found" });
      }
      
      const memberships = await storage.getResearchMembersByFacultyId(facultyProfile.id);
      
      // Fetch project details for each membership
      const projectsWithDetails = await Promise.all(
        memberships.map(async (membership) => {
          const project = await storage.getResearchProject(membership.projectId);
          const members = await storage.getResearchMembersByProjectId(membership.projectId);
          
          // Count members
          const memberCount = members.length;
          
          return {
            ...project,
            role: membership.role,
            memberCount
          };
        })
      );
      
      res.json(projectsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching research projects" });
    }
  });

  // Create research project
  app.post(
    "/api/faculty/research",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(insertResearchProjectSchema),
    async (req, res) => {
      try {
        const facultyProfile = await storage.getFacultyByUserId(req.user.id);
        if (!facultyProfile) {
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        
        // Create project
        const project = await storage.createResearchProject(req.validatedBody);
        
        // Add faculty as a member (leader)
        await storage.createResearchMember({
          projectId: project.id,
          facultyId: facultyProfile.id,
          role: "Leader"
        });
        
        res.status(201).json(project);
      } catch (error) {
        res.status(500).json({ message: "Error creating research project" });
      }
    }
  );

  // Add member to research project
  app.post(
    "/api/faculty/research/:projectId/members",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(insertResearchMemberSchema),
    async (req, res) => {
      try {
        const { projectId } = req.params;
        const facultyProfile = await storage.getFacultyByUserId(req.user.id);
        
        if (!facultyProfile) {
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        
        // Check if project exists
        const project = await storage.getResearchProject(parseInt(projectId));
        if (!project) {
          return res.status(404).json({ message: "Research project not found" });
        }
        
        // Check if faculty is a member of the project
        const members = await storage.getResearchMembersByProjectId(parseInt(projectId));
        const isMember = members.some(m => m.facultyId === facultyProfile.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to add members to this project" });
        }
        
        // Create member
        const member = await storage.createResearchMember({
          ...req.validatedBody,
          projectId: parseInt(projectId)
        });
        
        res.status(201).json(member);
      } catch (error) {
        res.status(500).json({ message: "Error adding research project member" });
      }
    }
  );

  // Create announcement
  app.post(
    "/api/faculty/announcements",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(insertAnnouncementSchema),
    async (req, res) => {
      try {
        const facultyProfile = await storage.getFacultyByUserId(req.user.id);
        if (!facultyProfile) {
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        
        // Create announcement
        const announcement = await storage.createAnnouncement({
          ...req.validatedBody,
          facultyId: facultyProfile.id
        });
        
        res.status(201).json(announcement);
      } catch (error) {
        res.status(500).json({ message: "Error creating announcement" });
      }
    }
  );

  /**
   * Common Routes
   */
  // Get announcements
  app.get("/api/announcements", isAuthenticated, async (req, res) => {
    try {
      // Filter options
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const department = req.query.department as string | undefined;
      const facultyId = req.query.facultyId ? parseInt(req.query.facultyId as string) : undefined;
      
      let announcements = [];
      
      if (courseId) {
        announcements = await storage.getAnnouncementsByCourseId(courseId);
      } else if (department) {
        announcements = await storage.getAnnouncementsByDepartment(department);
      } else if (facultyId) {
        announcements = await storage.getAnnouncementsByFacultyId(facultyId);
      } else {
        // Get public announcements
        announcements = await storage.getPublicAnnouncements();
      }
      
      // Fetch faculty details for each announcement
      const announcementsWithDetails = await Promise.all(
        announcements.map(async (announcement) => {
          const faculty = await storage.getFaculty(announcement.facultyId);
          const user = faculty ? await storage.getUser(faculty.userId) : null;
          
          return {
            ...announcement,
            facultyName: user ? user.fullName : "Unknown"
          };
        })
      );
      
      res.json(announcementsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
