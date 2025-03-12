import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const validateRequest = (schema: z.ZodType<any, any>) => {
    return (req: any, res: any, next: any) => {
      try {
        req.validatedBody = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({ message: validationError.message });
        } else {
          next(error);
        }
      }
    };
  };

  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const hasRole = (role: string) => {
    return (req: any, res: any, next: any) => {
      if (req.isAuthenticated() && req.user.role === role) return next();
      res.status(403).json({ message: "Forbidden" });
    };
  };

  // Lấy danh sách môn học
  app.get("/api/monhoc", isAuthenticated, async (_req, res) => {
    try {
      const monHoc = await storage.getAllMonHoc();
      res.json(monHoc);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  // Lấy danh sách đăng ký học phần của sinh viên
  app.get(
    "/api/sinhvien/dangkyhocphan",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });
        const dangKy = await storage.getDangKyHocPhanBySinhVien(sinhVien.maSv);
        const dangKyWithDetails = await Promise.all(
          dangKy.map(async (dk) => {
            const monHoc = await storage.getMonHoc(dk.monHocId);
            return { ...dk, monHoc };
          })
        );
        res.json(dangKyWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching enrollments" });
      }
    }
  );

  // Đăng ký học phần
  app.post(
    "/api/sinhvien/dangky",
    isAuthenticated,
    hasRole("student"),
    validateRequest(
      z.object({
        maMonHoc: z.string(),
      })
    ),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });
        const { maMonHoc } = req.validatedBody;
        const monHoc = await storage.getMonHoc(maMonHoc);
        if (!monHoc)
          return res.status(404).json({ message: "Course not found" });
        const existingDangKy = await storage.getDangKyHocPhanBySinhVien(
          sinhVien.maSv
        );
        if (existingDangKy.some((dk) => dk.monHocId === monHoc.id)) {
          return res
            .status(400)
            .json({ message: "Already enrolled in this course" });
        }
        const dangKy = await storage.createDangKyHocPhan({
          sinhVienId: sinhVien.id,
          monHocId: monHoc.id,
          hocKy: "1",
          namHoc: "2024-2025",
          ngayDangKy: new Date(),
          trangThai: "Đăng ký",
        });
        res.status(201).json(dangKy);
      } catch (error) {
        res.status(500).json({ message: "Error enrolling in course" });
      }
    }
  );

  // Lấy lịch học của sinh viên
  app.get(
    "/api/sinhvien/lichhoc",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });
        const lichHoc = await storage.getLichHocBySinhVien(sinhVien.maSv);
        const lichHocWithDetails = await Promise.all(
          lichHoc.map(async (lh) => {
            const monHoc = await storage.getMonHoc(lh.monHocId);
            return { ...lh, monHoc };
          })
        );
        res.json(lichHocWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching schedule" });
      }
    }
  );

  // Lấy thông tin thanh toán học phí
  app.get(
    "/api/sinhvien/thanhtoanhocphi",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });
        const thanhToan = await storage.getThanhToanHocPhiBySinhVien(
          sinhVien.maSv
        );
        res.json(thanhToan);
      } catch (error) {
        res.status(500).json({ message: "Error fetching tuition fees" });
      }
    }
  );

  // Thanh toán học phí
  app.post(
    "/api/sinhvien/thanhtoan",
    isAuthenticated,
    hasRole("student"),
    validateRequest(
      z.object({
        soTien: z.number(),
        hocKy: z.string(),
        namHoc: z.string(),
      })
    ),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });
        const { soTien, hocKy, namHoc } = req.validatedBody;
        const thanhToan = await storage.createThanhToanHocPhi({
          sinhVienId: sinhVien.id,
          hocKy,
          namHoc,
          soTien,
          ngayThanhToan: new Date(),
          phuongThucThanhToan: "Online",
          trangThai: "Đã thanh toán",
          ghiChu: null,
        });
        res.status(201).json(thanhToan);
      } catch (error) {
        res.status(500).json({ message: "Error processing payment" });
      }
    }
  );

  // Lấy lịch giảng dạy của giảng viên
  app.get(
    "/api/giangvien/lichgiangday",
    isAuthenticated,
    hasRole("faculty"),
    async (req, res) => {
      try {
        const giangVien = await storage.getGiangVienByUserId(req.user.id);
        if (!giangVien)
          return res.status(404).json({ message: "Faculty not found" });
        const lichGiangDay = await db
          .select()
          .from(schema.lichgiangday)
          .innerJoin(
            schema.phanconggiangday,
            eq(schema.lichgiangday.phanCongId, schema.phanconggiangday.id)
          )
          .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));
        const lichWithDetails = await Promise.all(
          lichGiangDay.map(async (lgd) => {
            const monHoc = await storage.getMonHoc(
              lgd.phanconggiangday.monHocId
            );
            return { ...lgd.lichgiangday, monHoc };
          })
        );
        res.json(lichWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching teaching schedule" });
      }
    }
  );

  // Lấy danh sách nghiên cứu khoa học
  app.get(
    "/api/nghiencuu",
    isAuthenticated,
    hasRole("faculty"),
    async (_req, res) => {
      try {
        const nghienCuu = await storage.getAllNghienCuuKhoaHoc();
        res.json(nghienCuu);
      } catch (error) {
        res.status(500).json({ message: "Error fetching research projects" });
      }
    }
  );

  // Tạo nghiên cứu khoa học
  app.post(
    "/api/nghiencuu",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(
      z.object({
        tenDeTai: z.string(),
        moTa: z.string().optional(),
        thoiGianBatDau: z.string(),
        thoiGianKetThuc: z.string(),
        kinhPhi: z.number().optional(),
      })
    ),
    async (req, res) => {
      try {
        const giangVien = await storage.getGiangVienByUserId(req.user.id);
        if (!giangVien)
          return res.status(404).json({ message: "Faculty not found" });
        const { tenDeTai, moTa, thoiGianBatDau, thoiGianKetThuc, kinhPhi } =
          req.validatedBody;
        const nghienCuu = await storage.createNghienCuuKhoaHoc({
          tenDeTai,
          moTa,
          thoiGianBatDau: new Date(thoiGianBatDau),
          thoiGianKetThuc: new Date(thoiGianKetThuc),
          trangThai: "Đang thực hiện",
          kinhPhi,
          ketQua: null,
        });
        res.status(201).json(nghienCuu);
      } catch (error) {
        res.status(500).json({ message: "Error creating research project" });
      }
    }
  );

  // Lấy danh sách thông báo
  app.get("/api/thongbao", isAuthenticated, async (_req, res) => {
    try {
      const thongBao = await storage.getAllThongBao();
      res.json(thongBao);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  // Tạo thông báo
  app.post(
    "/api/thongbao",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(
      z.object({
        tieuDe: z.string(),
        noiDung: z.string().optional(),
        doiTuong: z.enum(["Tất cả", "Sinh viên", "Giảng viên"]),
      })
    ),
    async (req, res) => {
      try {
        const giangVien = await storage.getGiangVienByUserId(req.user.id);
        if (!giangVien)
          return res.status(404).json({ message: "Faculty not found" });
        const { tieuDe, noiDung, doiTuong } = req.validatedBody;
        const thongBao = await storage.createThongBao({
          tieuDe,
          noiDung,
          ngayTao: new Date(),
          nguoiTao: giangVien.hoTen,
          doiTuong,
          trangThai: "Đã đăng",
        });
        res.status(201).json(thongBao);
      } catch (error) {
        res.status(500).json({ message: "Error creating announcement" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
