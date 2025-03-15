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
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

declare module "express" {
  interface Request {
    user: schema.TaiKhoan; // Giả sử TaiKhoan là kiểu của user từ schema
    file?: Express.Multer.File; // Thêm kiểu cho file upload
  }
}

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
    if (req.isAuthenticated() && req.user!) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const hasRole = (role: string) => {
    return (req: any, res: any, next: any) => {
      console.log("User role in hasRole:", req.user.role); // Thêm log
      if (req.user!.role !== role)
        return res.status(403).json({ message: "Forbidden" });
      next();
    };
  };

  // const hasRole = (role: string) => {
  //   return (req: any, res: any, next: any) => {
  //     // Lấy ID quyền hạn dựa trên tên vai trò
  //     let roleId: number;

  //     switch (role) {
  //       case "student":
  //         roleId = 3; // Giả định ID cho sinh viên
  //         break;
  //       case "faculty":
  //         roleId = 2; // Giả định ID cho giảng viên
  //         break;
  //       case "admin":
  //         roleId = 1; // Giả định ID cho admin
  //         break;
  //       default:
  //         return res.status(403).json({ message: "Vai trò không hợp lệ" });
  //     }

  //     if (req.user!.quyenHanId !== roleId)
  //       return res.status(403).json({ message: "Forbidden" });

  //     next(); // Quan trọng: Gọi next() nếu quyền hạn phù hợp
  //   };
  // };
  // Cấu hình multer để xử lý upload file
  const storageConfig = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadsPath = resolve(__dirname, "..", "uploads");
      try {
        await fs.access(uploadsPath); // Kiểm tra thư mục uploads tồn tại
      } catch {
        await fs.mkdir(uploadsPath, { recursive: true }); // Tạo thư mục nếu chưa tồn tại
      }
      cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({ storage: storageConfig });

  app.post(
    "/api/upload-avatar",
    isAuthenticated,
    hasRole("student"),
    upload.single("avatar"),
    async (req: any, res: any) => {
      console.log("User in upload-avatar:", req.user); // Thêm log này
      console.log("Request file:", req.file);
      console.log("User:", req.user);
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        }

        // Chuẩn hóa đường dẫn để chỉ lấy tên file
        const relativePath = path.basename(req.file.path); // Lấy tên file thay vì đường dẫn đầy đủ
        console.log("Relative path:", relativePath); // Log để kiểm tra

        await db
          .update(schema.sinhvien)
          .set({ avatar: relativePath })
          .where(eq(schema.sinhvien.id, sinhVien.id));

        res
          .status(200)
          .json({ message: "Upload successful", avatar: relativePath });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Error uploading avatar", error });
      }
    }
  );

  // Cập nhật API /api/profile để trả về avatar
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { role } = req.user;
      if (role === "student") {
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        }
        console.log("SinhVien data:", sinhVien);
        return res.json({ user: req.user, sinhVien });
      } else if (role === "faculty") {
        const giangVien = await storage.getGiangVienByUserId(req.user!.id);
        if (!giangVien) {
          return res.status(404).json({ message: "Không tìm thấy giảng viên" });
        }
        return res.json({ user: req.user, giangVien });
      }
      return res.status(400).json({ message: "Invalid user role" });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching profile" });
    }
  });

  // Lấy danh sách môn học
  app.get("/api/monhoc", isAuthenticated, async (_req, res) => {
    try {
      const monHoc = await storage.getAllMonHoc();
      res.json(monHoc);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách môn học" });
    }
  });

  // Lấy danh sách đăng ký học phần của sinh viên
  app.get(
    "/api/sinhvien/dangkyhocphan",
    isAuthenticated,
    hasRole("student"),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        }
        const dangKy = await storage.getDangKyHocPhanBySinhVien(sinhVien.maSv);
        const dangKyWithDetails = await Promise.all(
          dangKy.map(async (dk) => {
            const monHoc = await storage.getMonHoc(dk.monHocId);
            return { ...dk, monHoc: monHoc || null };
          })
        );
        res.json(dangKyWithDetails);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Lỗi khi lấy danh sách đăng ký học phần" });
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
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        const { maMonHoc } = req.validatedBody;
        const monHoc = await storage.getMonHoc(maMonHoc);
        if (!monHoc)
          return res.status(404).json({ message: "Không tìm thấy môn học" });
        const existingDangKy = await storage.getDangKyHocPhanBySinhVien(
          sinhVien.maSv
        );
        if (existingDangKy.some((dk) => dk.monHocId === monHoc.id)) {
          return res
            .status(400)
            .json({ message: "Đã đăng ký môn học này rồi" });
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
        res.status(500).json({ message: "Lỗi khi đăng ký môn học" });
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
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        }

        const lichHoc = await storage.getLichHocBySinhVien(sinhVien.maSv);
        const lichHocWithDetails = await Promise.all(
          lichHoc.map(async (lh) => {
            const monHoc = await storage.getMonHoc(lh.monHocId);
            return { ...lh, monHoc: monHoc || null };
          })
        );
        res.json(lichHocWithDetails);
      } catch (error) {
        console.error("Lỗi trong lichhoc:", error);
        res.status(500).json({
          message: "Lỗi khi lấy lịch học",
          error: error instanceof Error ? error.message : "Lỗi không xác định",
        });
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
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        const thanhToan = await storage.getThanhToanHocPhiBySinhVien(
          sinhVien.maSv
        );
        res.json(thanhToan);
      } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy thông tin học phí" });
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
        soTien: z.number().positive(), // Thêm kiểm tra số dương
        hocKy: z.string().min(1), // Thêm độ dài tối thiểu
        namHoc: z.string().regex(/^\d{4}-\d{4}$/), // Xác thực định dạng năm
      })
    ),
    async (req, res) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user!.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Không tìm thấy sinh viên" });
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
        res.status(500).json({ message: "Lỗi khi xử lý thanh toán" });
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
        const giangVien = await storage.getGiangVienByUserId(req.user!.id);
        if (!giangVien)
          return res.status(404).json({ message: "Không tìm thấy giảng viên" });
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
        res.status(500).json({ message: "Lỗi khi lấy lịch giảng dạy" });
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
        res
          .status(500)
          .json({ message: "Lỗi khi lấy danh sách nghiên cứu khoa học" });
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
        thoiGianBatDau: z.string().refine((date) => !isNaN(Date.parse(date)), {
          message: "Ngày không hợp lệ",
        }),
        thoiGianKetThuc: z.string(),
        kinhPhi: z.number().optional(),
      })
    ),
    async (req, res) => {
      try {
        const giangVien = await storage.getGiangVienByUserId(req.user!.id);
        if (!giangVien)
          return res.status(404).json({ message: "Không tìm thấy giảng viên" });
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
        res.status(500).json({ message: "Lỗi khi tạo nghiên cứu khoa học" });
      }
    }
  );

  // Lấy danh sách thông báo
  app.get("/api/thongbao", isAuthenticated, async (_req, res) => {
    try {
      const thongBao = await storage.getAllThongBao();
      res.json(thongBao);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách thông báo" });
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
        const giangVien = await storage.getGiangVienByUserId(req.user!.id);
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
