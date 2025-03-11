// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
          res.status(400).json({
            message: validationError.message,
          });
        } else {
          next(error);
        }
      }
    };
  };

  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const hasRole = (role: string) => {
    return (req: any, res: any, next: any) => {
      if (req.isAuthenticated() && req.user.role === role) {
        return next();
      }
      res.status(403).json({ message: "Forbidden" });
    };
  };

  app.get("/api/monhoc", isAuthenticated, async (req, res) => {
    try {
      const monHoc = await storage.getAllMonHoc();
      res.json(monHoc);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  app.get(
    "/api/sinhvien/dangkyhocphan",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const dangKy = await storage.getDangKyHocPhanBySinhVien(req.user.id);
        const dangKyWithDetails = await Promise.all(
          dangKy.map(async (dk) => {
            const monHoc = await storage.getMonHoc(dk.MaMonHoc);
            return { ...dk, monHoc };
          })
        );
        res.json(dangKyWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching enrollments" });
      }
    }
  );

  app.post(
    "/api/sinhvien/dangky",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const { MaMonHoc } = req.body;
        const monHoc = await storage.getMonHoc(MaMonHoc);
        if (!monHoc) {
          return res.status(404).json({ message: "Course not found" });
        }
        const existingDangKy = await storage.getDangKyHocPhanBySinhVien(
          req.user.id
        );
        if (existingDangKy.some((dk) => dk.MaMonHoc === MaMonHoc)) {
          return res
            .status(400)
            .json({ message: "Already enrolled in this course" });
        }
        const dangKy = await storage.createDangKyHocPhan({
          MSSV: req.user.id,
          MaMonHoc,
          HocKy: 1, // Giá trị mặc định, cần điều chỉnh theo logic
          NamHoc: "2024-2025", // Giá trị mặc định
          NgayDangKy: new Date().toISOString().split("T")[0],
          TrangThaiDangKy: "Đã đăng ký",
        });
        res.status(201).json(dangKy);
      } catch (error) {
        res.status(500).json({ message: "Error enrolling in course" });
      }
    }
  );

  app.get(
    "/api/sinhvien/lichhoc",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const lichHoc = await storage.getLichHocBySinhVien(req.user.id);
        const lichHocWithDetails = await Promise.all(
          lichHoc.map(async (lh) => {
            const monHoc = await storage.getMonHoc(lh.MaMonHoc);
            return { ...lh, monHoc };
          })
        );
        res.json(lichHocWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching schedule" });
      }
    }
  );

  app.get(
    "/api/sinhvien/thanhtoanhocphi",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const thanhToan = await storage.getThanhToanHocPhiBySinhVien(
          req.user.id
        );
        res.json(thanhToan);
      } catch (error) {
        res.status(500).json({ message: "Error fetching tuition fees" });
      }
    }
  );

  app.post(
    "/api/sinhvien/thanhtoan",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const { SoTien, HocKy, NamHoc } = req.body;
        const thanhToan = await storage.createThanhToanHocPhi({
          MSSV: req.user.id,
          SoTien,
          NgayThanhToan: new Date().toISOString().split("T")[0],
          TrangThaiThanhToan: "Đã thanh toán",
          HocKy,
          NamHoc,
        });
        res.status(201).json(thanhToan);
      } catch (error) {
        res.status(500).json({ message: "Error processing payment" });
      }
    }
  );

  app.get(
    "/api/giangvien/lichgiangday",
    isAuthenticated,
    hasRole("faculty"),
    async (req, res) => {
      try {
        const lichGiangDay = await db
          .select()
          .from(schema.lichgiangday)
          .where(eq(schema.lichgiangday.MaGV, req.user.id));
        const lichWithDetails = await Promise.all(
          lichGiangDay.map(async (lgd) => {
            const monHoc = await storage.getMonHoc(lgd.MaMonHoc);
            const lop = await storage.getLop(lgd.MaLop);
            return { ...lgd, monHoc, lop };
          })
        );
        res.json(lichWithDetails);
      } catch (error) {
        res.status(500).json({ message: "Error fetching teaching schedule" });
      }
    }
  );

  app.get(
    "/api/nghiencuu",
    isAuthenticated,
    hasRole("faculty"),
    async (req, res) => {
      try {
        const nghienCuu = await storage.getAllNghienCuuKhoaHoc();
        res.json(nghienCuu);
      } catch (error) {
        res.status(500).json({ message: "Error fetching research projects" });
      }
    }
  );

  app.post(
    "/api/nghiencuu",
    isAuthenticated,
    hasRole("faculty"),
    async (req, res) => {
      try {
        const nghienCuu = await storage.createNghienCuuKhoaHoc({
          MaGV: req.user.id,
          TenDeTai: req.body.TenDeTai,
          CapDeTai: req.body.CapDeTai,
          KinhPhi: req.body.KinhPhi,
          NgayBatDau: req.body.NgayBatDau,
          NgayKetThuc: req.body.NgayKetThuc,
          TrangThai: "Đang thực hiện",
        });
        res.status(201).json(nghienCuu);
      } catch (error) {
        res.status(500).json({ message: "Error creating research project" });
      }
    }
  );

  app.get("/api/thongbao", isAuthenticated, async (req, res) => {
    try {
      const thongBao = await storage.getAllThongBao();
      res.json(thongBao);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  app.post(
    "/api/thongbao",
    isAuthenticated,
    hasRole("faculty"),
    async (req, res) => {
      try {
        const thongBao = await storage.createThongBao({
          TieuDe: req.body.TieuDe,
          NoiDung: req.body.NoiDung,
          NgayThongBao: new Date().toISOString().split("T")[0],
          DoiTuong: req.body.DoiTuong,
          TrangThai: "Đã đăng",
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
