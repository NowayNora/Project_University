import express, { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq, and, inArray, not, ne, sql, lte, gte, desc } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

// Reuse middleware from main routes file
import { isAuthenticated, hasRole, validateRequest } from "./routes";

/**
 * Register admin-specific routes
 * @param app Express application
 */

export function registerAdminRoutes(app: Express): void {
  // ===== Class Management Routes =====

  // Get all classes
  app.get(
    "/api/admin/lop",
    isAuthenticated,
    hasRole("admin"),
    async (req, res) => {
      try {
        const lops = await db.select().from(schema.lop);
        res.json(lops);
      } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ message: "Error fetching classes" });
      }
    }
  );

  // Get class by ID
  app.get(
    "/api/admin/lop/:lopId",
    isAuthenticated,
    hasRole("admin"),
    async (req: any, res: any) => {
      try {
        const { lopId } = req.params;
        const lop = await db
          .select()
          .from(schema.lop)
          .where(eq(schema.lop.id, parseInt(lopId)))
          .then((res) => res[0]);

        if (!lop) {
          return res.status(404).json({ message: "Class not found" });
        }

        res.json(lop);
        return res.status(200).json({ message: "Class found" });
      } catch (error) {
        console.error("Error fetching class details:", error);
        res.status(500).json({ message: "Error fetching class details" });
      }
    }
  );

  // Create new class
  app.post(
    "/api/admin/lop",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        tenLop: z.string().min(1, "Class name is required"),
        maLop: z.string().min(1, "Class code is required"),
        khoaId: z.number().int().positive("Invalid department ID"),
        nienKhoa: z.string().min(1, "Academic year is required"),
        siSoToiDa: z.number().int().positive().default(50),
        coVanId: z.number().int().positive().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const newLop = await storage.createLop(req.validatedBody);
        res.status(201).json(newLop);
      } catch (error) {
        console.error("Error creating class:", error);
        res.status(500).json({ message: "Error creating class" });
      }
    }
  );

  // Update class
  app.put(
    "/api/admin/lop/:lopId",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        tenLop: z.string().min(1, "Class name is required").optional(),
        maLop: z.string().min(1, "Class code is required").optional(),
        khoaId: z.number().int().positive("Invalid department ID").optional(),
        nienKhoa: z.string().min(1, "Academic year is required").optional(),
        siSoToiDa: z.number().int().positive().optional(),
        coVanId: z.number().int().positive().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const { lopId } = req.params;

        // Check if class exists
        const existingLop = await db
          .select()
          .from(schema.lop)
          .where(eq(schema.lop.id, parseInt(lopId)))
          .then((res) => res[0]);

        if (!existingLop) {
          return res.status(404).json({ message: "Class not found" });
        }

        // Update class
        await db
          .update(schema.lop)
          .set(req.validatedBody)
          .where(eq(schema.lop.id, parseInt(lopId)));

        // Get updated class
        const updatedLop = await db
          .select()
          .from(schema.lop)
          .where(eq(schema.lop.id, parseInt(lopId)))
          .then((res) => res[0]);

        res.json(updatedLop);
      } catch (error) {
        console.error("Error updating class:", error);
        res.status(500).json({ message: "Error updating class" });
      }
    }
  );

  // Delete class
  app.delete(
    "/api/admin/lop/:lopId",
    isAuthenticated,
    hasRole("admin"),
    async (req: any, res: any) => {
      try {
        const { lopId } = req.params;

        // Check if class exists
        const existingLop = await db
          .select()
          .from(schema.lop)
          .where(eq(schema.lop.id, parseInt(lopId)))
          .then((res) => res[0]);

        if (!existingLop) {
          return res.status(404).json({ message: "Class not found" });
        }

        // Check if class has students
        const students = await db
          .select()
          .from(schema.sinhvien)
          .where(eq(schema.sinhvien.lopId, parseInt(lopId)));

        if (students.length > 0) {
          return res.status(400).json({
            message:
              "Cannot delete class with students. Please remove students first.",
          });
        }

        // Delete class
        await db.delete(schema.lop).where(eq(schema.lop.id, parseInt(lopId)));

        res.status(200).json({ message: "Class deleted successfully" });
      } catch (error) {
        console.error("Error deleting class:", error);
        res.status(500).json({ message: "Error deleting class" });
      }
    }
  );

  // ===== User Management Routes =====

  // Get all users
  app.get(
    "/api/admin/users",
    isAuthenticated,
    hasRole("admin"),
    async (req, res) => {
      try {
        const users = await db.select().from(schema.taikhoan);
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
      }
    }
  );

  // Create new user
  app.post(
    "/api/admin/users",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        email: z.string().email("Invalid email format"),
        role: z.enum(["student", "faculty", "admin"], {
          errorMap: () => ({
            message: "Role must be student, faculty, or admin",
          }),
        }),
        fullName: z.string().min(1, "Full name is required"),
      })
    ),
    async (req: any, res: any) => {
      try {
        // Check if username already exists
        const existingUser = await db
          .select()
          .from(schema.taikhoan)
          .where(eq(schema.taikhoan.tenDangNhap, req.validatedBody.username))
          .then((res) => res[0]);

        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = await storage.createUser(req.validatedBody);
        res.status(201).json(newUser);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user" });
      }
    }
  );

  // ===== Registration Period Management =====

  // Get all registration periods
  app.get(
    "/api/admin/registration-periods",
    isAuthenticated,
    hasRole("admin"),
    async (req, res) => {
      try {
        const periods = await db
          .select()
          .from(schema.thoigiandangky)
          .orderBy(desc(schema.thoigiandangky.thoiGianBatDau));

        res.json(periods);
      } catch (error) {
        console.error("Error fetching registration periods:", error);
        res
          .status(500)
          .json({ message: "Error fetching registration periods" });
      }
    }
  );

  // Create new registration period
  app.post(
    "/api/admin/registration-periods",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        hoc_ky: z.string().min(1, "Semester is required"),
        nam_hoc: z.string().min(1, "Academic year is required"),
        thoi_gian_bat_dau: z.string().datetime({ offset: true }),
        thoi_gian_ket_thuc: z.string().datetime({ offset: true }),
        trang_thai: z.enum(["Hoạt động", "Kết thúc", "Chưa bắt đầu"]),
        // mo_ta: z.string().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const { thoiGianBatDau, thoiGianKetThuc } = req.validatedBody;

        // Validate start time is before end time
        if (new Date(thoiGianBatDau) >= new Date(thoiGianKetThuc)) {
          return res.status(400).json({
            message: "Start time must be before end time",
          });
        }

        // Create registration period
        const [result] = await db
          .insert(schema.thoigiandangky)
          .values(req.validatedBody);

        const newPeriod = await db
          .select()
          .from(schema.thoigiandangky)
          .where(eq(schema.thoigiandangky.id, result.insertId))
          .then((res) => res[0]);

        res.status(201).json(newPeriod);
      } catch (error) {
        console.error("Error creating registration period:", error);
        res.status(500).json({ message: "Error creating registration period" });
      }
    }
  );

  // Update registration period status
  app.patch(
    "/api/admin/registration-periods/:periodId/status",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        trangThai: z.enum(["Hoạt động", "Kết thúc", "Chưa bắt đầu"]),
      })
    ),
    async (req: any, res: any) => {
      try {
        const { periodId } = req.params;
        const { trangThai } = req.validatedBody;

        // If setting to "Active", deactivate all other active periods
        if (trangThai === "Hoạt động") {
          await db
            .update(schema.thoigiandangky)
            .set({ trangThai: "Kết thúc" })
            .where(
              and(
                eq(schema.thoigiandangky.trangThai, "Hoạt động"),
                ne(schema.thoigiandangky.id, parseInt(periodId))
              )
            );
        }

        // Update the specified period
        await db
          .update(schema.thoigiandangky)
          .set({ trangThai })
          .where(eq(schema.thoigiandangky.id, parseInt(periodId)));

        const updatedPeriod = await db
          .select()
          .from(schema.thoigiandangky)
          .where(eq(schema.thoigiandangky.id, parseInt(periodId)))
          .then((res) => res[0]);

        res.json(updatedPeriod);
      } catch (error) {
        console.error("Error updating registration period status:", error);
        res
          .status(500)
          .json({ message: "Error updating registration period status" });
      }
    }
  );

  // ===== Dashboard Statistics =====

  // Get admin dashboard statistics
  app.get(
    "/api/admin/dashboard/stats",
    isAuthenticated,
    hasRole("admin"),
    async (req, res) => {
      try {
        // Get total counts
        const [
          studentCount,
          facultyCount,
          classCount,
          courseCount,
          activeRegistrationPeriod,
        ] = await Promise.all([
          db
            .select({ count: sql`count(*)` })
            .from(schema.sinhvien)
            .then((res) => res[0].count),
          db
            .select({ count: sql`count(*)` })
            .from(schema.giangvien)
            .then((res) => res[0].count),
          db
            .select({ count: sql`count(*)` })
            .from(schema.lop)
            .then((res) => res[0].count),
          db
            .select({ count: sql`count(*)` })
            .from(schema.monhoc)
            .then((res) => res[0].count),
          db
            .select()
            .from(schema.thoigiandangky)
            .where(eq(schema.thoigiandangky.trangThai, "Hoạt động"))
            .then((res) => res[0]),
        ]);

        res.json({
          studentCount,
          facultyCount,
          classCount,
          courseCount,
          activeRegistrationPeriod,
        });
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res
          .status(500)
          .json({ message: "Error fetching dashboard statistics" });
      }
    }
  );
}
