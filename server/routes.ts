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
    user: schema.TaiKhoan; // User từ schema
    file?: Express.Multer.File;
    validatedBody?: any;
    sinhVien?: schema.SinhVien; // Thêm để lưu thông tin sinh viên
    giangVien?: schema.GiangVien; // Thêm để lưu thông tin giảng viên
  }
}

// Middleware xác thực và phân quyền
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

const attachUserDetails = async (req: any, res: any, next: any) => {
  try {
    if (req.user.role === "student") {
      const sinhVien = await storage.getSinhVienByUserId(req.user.id);
      if (!sinhVien)
        return res.status(404).json({ message: "Student not found" });
      req.sinhVien = sinhVien;
    } else if (req.user.role === "faculty") {
      const giangVien = await storage.getGiangVienByUserId(req.user.id);
      if (!giangVien)
        return res.status(404).json({ message: "Faculty not found" });
      req.giangVien = giangVien;
    }
    next();
  } catch (error) {
    console.error("Error attaching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }
};

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user) return next();
  res.status(401).json({ message: "Unauthorized" });
};

const hasRole = (role: "student" | "faculty" | "admin") => {
  return (req: any, res: any, next: any) => {
    if (req.user!.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// Cấu hình multer cho upload file
const storageConfig = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadsPath = resolve(__dirname, "..", "uploads");
    try {
      await fs.access(uploadsPath);
    } catch {
      await fs.mkdir(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images (JPEG, PNG, GIF) are allowed"));
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Route lấy kết quả học tập của sinh viên
  app.get(
    "/api/sinhvien/ketquahoctap",
    isAuthenticated,
    hasRole("student"),
    attachUserDetails,
    async (req: any, res: any) => {
      try {
        const ketQua = await db
          .select()
          .from(schema.ketquahoctap)
          .where(eq(schema.ketquahoctap.sinhVienId, req.sinhVien!.id));

        const gpa = ketQua.length
          ? ketQua.reduce((sum, kq) => sum + (kq.diemTrungBinh || 0), 0) /
            ketQua.length
          : 0;
        const creditsCompleted = ketQua.reduce(
          (sum, kq) => sum + (kq.tongTinChiDat || 0),
          0
        );

        res.json({
          gpa: gpa.toFixed(2),
          creditsCompleted,
          totalCreditsRequired: 120, // Có thể thay đổi từ cấu hình hệ thống
          ketQua,
        });
      } catch (error) {
        console.error("Error fetching academic results:", error);
        res.status(500).json({ message: "Error fetching academic results" });
      }
    }
  );

  // Route lấy thông tin profile
  app.get("/api/profile", isAuthenticated, async (req: any, res: any) => {
    try {
      const { role } = req.user;
      if (role === "student") {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien)
          return res.status(404).json({ message: "Student not found" });

        const ketQua = await db
          .select()
          .from(schema.ketquahoctap)
          .where(eq(schema.ketquahoctap.sinhVienId, sinhVien.id));
        const gpa = ketQua.length
          ? ketQua.reduce((sum, kq) => sum + (kq.diemTrungBinh || 0), 0) /
            ketQua.length
          : 0;
        const creditsCompleted = ketQua.reduce(
          (sum, kq) => sum + (kq.tongTinChiDat || 0),
          0
        );

        const lop = sinhVien.lopId
          ? await storage.getLop(sinhVien.lopId.toString()) // Chuyển sang string nếu cần
          : null;
        const nganh = lop?.nganhId
          ? await db
              .select()
              .from(schema.nganh)
              .where(eq(schema.nganh.id, lop.nganhId))
              .then((res) => res[0])
          : null;

        return res.json({
          user: req.user,
          sinhVien,
          lop,
          nganh,
          gpa: gpa.toFixed(2),
          creditsCompleted,
          totalCreditsRequired: 120,
        });
      } else if (role === "faculty") {
        const giangVien = await storage.getGiangVienByUserId(req.user.id);
        if (!giangVien)
          return res.status(404).json({ message: "Faculty not found" });
        return res.json({ user: req.user, giangVien });
      }
      return res.status(400).json({ message: "Invalid user role" });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  });

  // Nhóm route cho sinh viên
  const studentRoutes = {
    uploadAvatar: app.post(
      "/api/upload-avatar",
      isAuthenticated,
      hasRole("student"),
      upload.single("avatar"),
      async (req: any, res: any) => {
        try {
          if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
          }

          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const relativePath = path.basename(req.file.path);
          const updatedSinhVien = await storage.updateSinhVien(sinhVien.id, {
            avatar: relativePath,
          });

          res.status(200).json({
            message: "Upload successful",
            avatar: updatedSinhVien.avatar,
          });
        } catch (error) {
          console.error("Upload error:", error);
          res.status(500).json({ message: "Error uploading avatar" });
        }
      }
    ),

    updateProfile: app.put(
      "/api/profile",
      isAuthenticated,
      hasRole("student"),
      validateRequest(
        z
          .object({
            hoTen: z.string().min(1, "Full name cannot be empty").optional(),
            ngaySinh: z.string().datetime().optional(),
            gioiTinh: z.enum(["Nam", "Nữ", "Khác"]).optional(),
            diaChi: z.string().optional(),
            email: z.string().email("Invalid email").optional(),
            soDienThoai: z.string().optional(),
            danToc: z.string().optional(),
            tonGiao: z.string().optional(),
            truongTHPT: z.string().optional(),
            namTotNghiepTHPT: z.number().int().optional(),
            phuongXaTHPT: z.string().optional(),
            quanHuyenTHPT: z.string().optional(),
            tinhThanhTHPT: z.string().optional(),
            hoTenPhuHuynh: z.string().optional(),
            diaChiPhuHuynh: z.string().optional(),
            sdtPhuHuynh: z.string().optional(),
          })
          .strict()
      ),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const validatedData = req.validatedBody;
          const updateData: Partial<schema.InsertSinhVien> = {
            ...(validatedData.hoTen && { hoTen: validatedData.hoTen }),
            ...(validatedData.ngaySinh && {
              ngaySinh: new Date(validatedData.ngaySinh),
            }),
            ...(validatedData.gioiTinh && { gioiTinh: validatedData.gioiTinh }),
            ...(validatedData.diaChi && { diaChi: validatedData.diaChi }),
            ...(validatedData.email && { email: validatedData.email }),
            ...(validatedData.soDienThoai && {
              soDienThoai: validatedData.soDienThoai,
            }),
            ...(validatedData.danToc && { danToc: validatedData.danToc }),
            ...(validatedData.tonGiao && { tonGiao: validatedData.tonGiao }),
            ...(validatedData.truongTHPT && {
              truongTHPT: validatedData.truongTHPT,
            }),
            ...(validatedData.namTotNghiepTHPT && {
              namTotNghiepTHPT: validatedData.namTotNghiepTHPT,
            }),
            ...(validatedData.phuongXaTHPT && {
              phuongXaTHPT: validatedData.phuongXaTHPT,
            }),
            ...(validatedData.quanHuyenTHPT && {
              quanHuyenTHPT: validatedData.quanHuyenTHPT,
            }),
            ...(validatedData.tinhThanhTHPT && {
              tinhThanhTHPT: validatedData.tinhThanhTHPT,
            }),
            ...(validatedData.hoTenPhuHuynh && {
              hoTenPhuHuynh: validatedData.hoTenPhuHuynh,
            }),
            ...(validatedData.diaChiPhuHuynh && {
              diaChiPhuHuynh: validatedData.diaChiPhuHuynh,
            }),
            ...(validatedData.sdtPhuHuynh && {
              sdtPhuHuynh: validatedData.sdtPhuHuynh,
            }),
          };

          const updatedSinhVien = await storage.updateSinhVien(
            sinhVien.id,
            updateData
          );

          res.status(200).json({
            message: "Profile updated successfully",
            sinhVien: updatedSinhVien,
          });
        } catch (error) {
          console.error("Update profile error:", error);
          res.status(500).json({ message: "Error updating profile" });
        }
      }
    ),

    getRegisteredCourses: app.get(
      "/api/sinhvien/dangkyhocphan",
      isAuthenticated,
      hasRole("student"),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }
          const dangKy = await storage.getDangKyHocPhanBySinhVien(
            sinhVien.maSv
          );
          const dangKyWithDetails = await Promise.all(
            dangKy.map(async (dk) => {
              const monHoc = dk.monHocId
                ? await storage.getMonHoc(dk.monHocId)
                : null;
              return { ...dk, monHoc };
            })
          );
          res.json(dangKyWithDetails);
        } catch (error) {
          console.error("Error fetching registered courses:", error);
          res
            .status(500)
            .json({ message: "Error fetching registered courses" });
        }
      }
    ),

    registerCourse: app.post(
      "/api/sinhvien/dangky",
      isAuthenticated,
      hasRole("student"),
      validateRequest(
        z.object({
          monHocId: z.number().int().positive("Invalid course ID"), // Sửa maMonHoc -> monHocId
        })
      ),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const { monHocId } = req.validatedBody;
          const monHoc = await storage.getMonHoc(monHocId);
          if (!monHoc) {
            return res.status(404).json({ message: "Course not found" });
          }

          const existingDangKy = await storage.getDangKyHocPhanBySinhVien(
            sinhVien.maSv
          );
          if (existingDangKy.some((dk) => dk.monHocId === monHoc.id)) {
            return res
              .status(400)
              .json({ message: "Course already registered" });
          }

          // Lấy học kỳ và năm học hiện tại từ database
          const currentHocKyNamHoc = await storage.getCurrentHocKyNamHoc();
          if (!currentHocKyNamHoc) {
            return res.status(400).json({
              message:
                "No active semester found. Please contact administrator.",
            });
          }

          const dangKy = await storage.createDangKyHocPhan({
            sinhVienId: sinhVien.id,
            monHocId: monHoc.id,
            hocKy: currentHocKyNamHoc.hocKy,
            namHoc: currentHocKyNamHoc.namHoc,
            ngayDangKy: new Date(),
            trangThai: "Đăng ký",
          });

          res
            .status(201)
            .json({ message: "Course registered successfully", dangKy });
        } catch (error) {
          console.error("Course registration error:", error);
          res.status(500).json({ message: "Error registering course" });
        }
      }
    ),

    getSchedule: app.get(
      "/api/sinhvien/lichhoc",
      isAuthenticated,
      hasRole("student"),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const lichHoc = await storage.getLichHocBySinhVien(sinhVien.maSv);
          const lichHocWithDetails = await Promise.all(
            lichHoc.map(async (lh) => {
              const monHoc = lh.monHocId
                ? await storage.getMonHoc(lh.monHocId)
                : null;
              return { ...lh, monHoc };
            })
          );
          res.json(lichHocWithDetails);
        } catch (error) {
          console.error("Error fetching schedule:", error);
          res.status(500).json({ message: "Error fetching schedule" });
        }
      }
    ),

    getPayments: app.get(
      "/api/sinhvien/thanhtoanhocphi",
      isAuthenticated,
      hasRole("student"),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }
          const thanhToan = await storage.getThanhToanHocPhiBySinhVien(
            sinhVien.maSv
          );
          const thanhToanWithRemaining = thanhToan.map((tt) => ({
            ...tt,
            status: tt.trangThai === "Đã thanh toán" ? "paid" : "unpaid",
            remaining: tt.trangThai === "Đã thanh toán" ? 0 : tt.soTien,
          }));
          res.json(thanhToanWithRemaining);
        } catch (error) {
          console.error("Error fetching payments:", error);
          res.status(500).json({ message: "Error fetching payment records" });
        }
      }
    ),

    makePayment: app.post(
      "/api/sinhvien/thanhtoan",
      isAuthenticated,
      hasRole("student"),
      validateRequest(
        z.object({
          soTien: z.number().positive("Amount must be positive"),
          hocKy: z.string().min(1, "Semester is required"),
          namHoc: z
            .string()
            .regex(/^\d{4}-\d{4}$/, "Invalid academic year format"),
        })
      ),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const { soTien, hocKy, namHoc } = req.validatedBody;
          const thanhToan = await storage.createThanhToanHocPhi({
            sinhVienId: sinhVien.id,
            hocKy,
            namHoc,
            soTien: soTien.toString(), // Chuyển số thành string vì schema yêu cầu decimal
            ngayThanhToan: new Date(),
            phuongThucThanhToan: "Online",
            trangThai: "Đã thanh toán",
            ghiChu: null,
          });

          res.status(201).json({ message: "Payment successful", thanhToan });
        } catch (error) {
          console.error("Payment error:", error);
          res.status(500).json({ message: "Error processing payment" });
        }
      }
    ),
  };

  // Nhóm route cho giảng viên
  const facultyRoutes = {
    getTeachingSchedule: app.get(
      "/api/giangvien/lichgiangday",
      isAuthenticated,
      hasRole("faculty"),
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }
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
              const monHoc = lgd.phanconggiangday.monHocId
                ? await storage.getMonHoc(lgd.phanconggiangday.monHocId)
                : null;
              return { ...lgd.lichgiangday, monHoc };
            })
          );
          res.json(lichWithDetails);
        } catch (error) {
          console.error("Error fetching teaching schedule:", error);
          res.status(500).json({ message: "Error fetching teaching schedule" });
        }
      }
    ),

    getResearchProjects: app.get(
      "/api/nghiencuu",
      isAuthenticated,
      hasRole("faculty"),
      async (_req, res) => {
        try {
          const nghienCuu = await storage.getAllNghienCuuKhoaHoc();
          res.json(nghienCuu);
        } catch (error) {
          console.error("Error fetching research projects:", error);
          res.status(500).json({ message: "Error fetching research projects" });
        }
      }
    ),

    createResearchProject: app.post(
      "/api/nghiencuu",
      isAuthenticated,
      hasRole("faculty"),
      validateRequest(
        z.object({
          tenDeTai: z.string().min(1, "Project title is required"),
          moTa: z.string().optional(),
          thoiGianBatDau: z
            .string()
            .datetime({ message: "Invalid start date" }),
          thoiGianKetThuc: z.string().datetime({ message: "Invalid end date" }),
          kinhPhi: z.number().optional(),
        })
      ),
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          const { tenDeTai, moTa, thoiGianBatDau, thoiGianKetThuc, kinhPhi } =
            req.validatedBody;
          const nghienCuu = await storage.createNghienCuuKhoaHoc({
            tenDeTai,
            moTa,
            thoiGianBatDau: new Date(thoiGianBatDau),
            thoiGianKetThuc: new Date(thoiGianKetThuc),
            trangThai: "Đang thực hiện",
            kinhPhi: kinhPhi ? kinhPhi.toString() : undefined, // Chuyển số thành string
            ketQua: null,
          });

          res
            .status(201)
            .json({ message: "Research project created", nghienCuu });
        } catch (error) {
          console.error("Error creating research project:", error);
          res.status(500).json({ message: "Error creating research project" });
        }
      }
    ),

    createAnnouncement: app.post(
      "/api/thongbao",
      isAuthenticated,
      hasRole("faculty"),
      validateRequest(
        z.object({
          tieuDe: z.string().min(1, "Title is required"),
          noiDung: z.string().optional(),
          doiTuong: z.enum(["Tất cả", "Sinh viên", "Giảng viên"]),
        })
      ),
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          const { tieuDe, noiDung, doiTuong } = req.validatedBody;
          const thongBao = await storage.createThongBao({
            tieuDe,
            noiDung,
            ngayTao: new Date(),
            nguoiTao: giangVien.hoTen,
            doiTuong,
            trangThai: "Đã đăng",
          });

          res.status(201).json({ message: "Announcement created", thongBao });
        } catch (error) {
          console.error("Error creating announcement:", error);
          res.status(500).json({ message: "Error creating announcement" });
        }
      }
    ),
  };

  // Nhóm route chung
  app.get("/api/monhoc", isAuthenticated, async (_req, res) => {
    try {
      const monHoc = await storage.getAllMonHoc();
      res.json(monHoc);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  app.get("/api/thongbao", isAuthenticated, async (_req, res) => {
    try {
      const thongBao = await storage.getAllThongBao();
      res.json(thongBao);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
