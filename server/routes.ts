import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq, and, inArray, not, ne, sql, lte, gte, desc } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { lichhoc } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

declare module "express" {
  interface Request {
    user: schema.TaiKhoan; // User từ schema
    file?: Express.Multer.File;
    validatedBody?: any;
    sinhVien?: schema.SinhVien; // Thêm để lưu thông tin sinh viên
    giangVien?: schema.GiangVien; // Thêm để lưu thông tin giảng viên
    lop?: schema.Lop; // Thêm để lưu thông tin lớp
  }
}

// Middleware xác thực và phân quyền
export const validateRequest = (schema: z.ZodType<any, any>) => {
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

// Middleware để lấy thông tin lớp
const attachClassDetails = async (req: any, res: any, next: any) => {
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
    req.lop = lop;
    next();
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({ message: "Error fetching class details" });
  }
};

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export const hasRole = (role: "student" | "faculty" | "admin") => {
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

// Thêm hàm kiểm tra thời gian đăng ký hợp lệ
const isRegistrationPeriodValid = async () => {
  const activeRegistrationPeriods = await db
    .select()
    .from(schema.thoigiandangky)
    .where(
      and(
        eq(schema.thoigiandangky.trangThai, "Hoạt động"),
        lte(schema.thoigiandangky.thoiGianBatDau, new Date()),
        gte(schema.thoigiandangky.thoiGianKetThuc, new Date())
      )
    );

  if (activeRegistrationPeriods.length === 0) {
    return {
      valid: false,
      message: "Ngoài thời gian đăng ký học phần",
    };
  }

  return { valid: true, period: activeRegistrationPeriods[0] };
};

// 1. Thêm validation chi tiết hơn
const validateSchedulingRequest = async (
  sinhVienId: number,
  monHocId: number
) => {
  // Kiểm tra thời gian đăng ký hợp lệ
  const registrationPeriod = await isRegistrationPeriodValid();
  if (!registrationPeriod.valid) {
    return {
      valid: false,
      message: registrationPeriod.message,
    };
  }
  try {
    // Kiểm tra số môn đã đăng ký trong học kỳ hiện tại
    const hocKyHienTai = await storage.getCurrentHocKyNamHoc();
    if (!hocKyHienTai) {
      throw new Error("Không tìm thấy học kỳ hiện tại");
    }

    const dangKyHienTai = await db
      .select()
      .from(schema.dangkyhocphan)
      .where(
        and(
          eq(schema.dangkyhocphan.sinhVienId, sinhVienId),
          eq(schema.dangkyhocphan.hocKy, hocKyHienTai.hocKy),
          eq(schema.dangkyhocphan.namHoc, hocKyHienTai.namHoc)
        )
      );

    if (dangKyHienTai.length >= 8) {
      // Giới hạn 8 môn/học kỳ
      throw new Error("Đã đạt giới hạn số môn có thể đăng ký trong học kỳ");
    }

    // Kiểm tra điều kiện tiên quyết
    const monHoc = await storage.getMonHoc(monHocId);
    if (!monHoc) {
      throw new Error("Không tìm thấy môn học");
    }

    if (monHoc.monHocTienQuyet) {
      const daDangKyMonTienQuyet = await db
        .select()
        .from(schema.dangkyhocphan)
        .where(
          and(
            eq(schema.dangkyhocphan.sinhVienId, sinhVienId),
            eq(schema.dangkyhocphan.monHocId, monHoc.monHocTienQuyet)
          )
        );

      if (!daDangKyMonTienQuyet.length) {
        throw new Error("Chưa hoàn thành môn học tiên quyết");
      }
    }

    // Kiểm tra thời gian đăng ký
    const thoiGianDangKy = await db
      .select()
      .from(schema.thoigiandangky)
      .where(
        and(
          eq(schema.thoigiandangky.hocKy, hocKyHienTai.hocKy),
          eq(schema.thoigiandangky.namHoc, hocKyHienTai.namHoc),
          lte(schema.thoigiandangky.thoiGianBatDau, new Date()),
          gte(schema.thoigiandangky.thoiGianKetThuc, new Date())
        )
      );

    if (!thoiGianDangKy.length) {
      throw new Error("Ngoài thời gian đăng ký học phần");
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// 2. Thêm logic ưu tiên sắp xếp
const sortByPriority = (slots: any[]) => {
  return slots.sort((a, b) => {
    // Điểm ưu tiên cho mỗi slot
    let priorityA = 0;
    let priorityB = 0;

    // 1. Ưu tiên buổi sáng (tiết 1-6)
    if (a.tietBatDau <= 6) priorityA += 3;
    if (b.tietBatDau <= 6) priorityB += 3;

    // 2. Ưu tiên các ngày trong tuần (thứ 2-6)
    const weekDayPriority: Record<string, number> = {
      "Thứ 2": 1,
      "Thứ 3": 2,
      "Thứ 4": 3,
      "Thứ 5": 4,
      "Thứ 6": 5,
      "Thứ 7": 6,
      "Chủ nhật": -1,
    };
    priorityA += weekDayPriority[a.thu as keyof typeof weekDayPriority] || 0;
    priorityB += weekDayPriority[b.thu as keyof typeof weekDayPriority] || 0;

    // 3. Ưu tiên phòng học phù hợp
    if (a.loaiTiet === "lyThuyet" && a.phongHoc.startsWith("LT"))
      priorityA += 2;
    if (a.loaiTiet === "thucHanh" && a.phongHoc.startsWith("TH"))
      priorityA += 2;
    if (b.loaiTiet === "lyThuyet" && b.phongHoc.startsWith("LT"))
      priorityB += 2;
    if (b.loaiTiet === "thucHanh" && b.phongHoc.startsWith("TH"))
      priorityB += 2;

    // 4. Ưu tiên slot có ít người đăng ký
    priorityA += (1 - (a.soLuongDaDangKy || 0) / (a.soLuongToiDa || 50)) * 2;
    priorityB += (1 - (b.soLuongDaDangKy || 0) / (b.soLuongToiDa || 50)) * 2;

    return priorityB - priorityA; // Sắp xếp giảm dần theo điểm ưu tiên
  });
};

// 3. Thêm logging và monitoring
const logSchedulingActivity = async (
  sinhVienId: number,
  monHocId: number,
  result: any
) => {
  try {
    const currentTime = new Date();
    const logData = {
      thoiGian: currentTime,
      sinhVienId: sinhVienId,
      monHocId: monHocId,
      hanhDong: "dangKyLichHoc",
      ketQua: result.success ? "thanhCong" : "thatBai",
      chiTiet: JSON.stringify({
        thoiGianDangKy: currentTime,
        lichHocDuocChon: result.lichHoc || null,
        loiNeuCo: result.error || null,
      }),
    };

    await db.insert(schema.lichsudangky).values(logData);

    // Log ra console để debug
    console.log("Scheduling Activity Log:", {
      timestamp: currentTime,
      studentId: sinhVienId,
      courseId: monHocId,
      action: "schedule_registration",
      result: result,
    });
  } catch (error) {
    console.error("Error logging scheduling activity:", error);
  }
};

// Thêm định nghĩa giới hạn tiết học cho từng buổi
const BUOI_HOC_LIMITS = {
  Sáng: 5,
  Chiều: 5,
  Tối: 3,
};

// Add a type for days and sessions near the BUOI_HOC_LIMITS constant
type DayOfWeek =
  | "Thứ 2"
  | "Thứ 3"
  | "Thứ 4"
  | "Thứ 5"
  | "Thứ 6"
  | "Thứ 7"
  | "Chủ nhật";
type SessionType = "Sáng" | "Chiều" | "Tối";

// Kiểm tra sinh viên đã hoàn thành môn tiên quyết chưa
async function checkPrerequisitePassed(
  sinhVienId: number,
  monHocTienQuyetId: number
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(schema.quanlydiem)
      .where(
        and(
          eq(schema.quanlydiem.sinhVienId, sinhVienId),
          eq(schema.quanlydiem.monHocId, monHocTienQuyetId)
        )
      );

    if (result.length === 0) return false;

    // Kiểm tra điểm tổng kết >= 5.0
    return (result[0].diemTongKet || 0) >= 5.0;
  } catch (error) {
    console.error("Error checking prerequisite:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get(
    "/api/sinhvien/lichhoc/kha-dung",
    isAuthenticated,
    hasRole("student"),
    async (req: any, res: any) => {
      try {
        const { monHocId } = req.query;
        if (!monHocId) {
          return res.status(400).json({ message: "Course ID is required" });
        }

        const lichKhaDung = await storage.getLichHocKhaDung(parseInt(monHocId));
        res.json(lichKhaDung);
      } catch (error) {
        console.error("Error fetching available schedules:", error);
        res.status(500).json({ message: "Error fetching available schedules" });
      }
    }
  );

  // Route để chọn lịch học
  app.post(
    "/api/sinhvien/lichhoc/chon",
    isAuthenticated,
    hasRole("student"),
    validateRequest(
      z.object({
        lichHocKhaDungId: z.number().int().positive("Invalid schedule ID"),
        thu: z
          .enum([
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
            "Chủ nhật",
          ])
          .optional(),
        tietBatDau: z
          .number()
          .int()
          .min(1)
          .max(12, "Invalid period")
          .optional(),
        soTiet: z
          .number()
          .int()
          .min(1)
          .max(6, "Invalid number of periods")
          .optional(),
        phongHoc: z.string().min(1, "Room is required").optional(),
        loaiTiet: z.enum(["lyThuyet", "thucHanh"]).optional(),
        autoSchedule: z.boolean().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Student not found" });
        }

        const {
          lichHocKhaDungId,
          thu,
          tietBatDau,
          soTiet,
          phongHoc,
          loaiTiet,
          autoSchedule,
        } = req.validatedBody;

        // Lấy thông tin lịch học khả dụng
        const lichKhaDung = await storage.getLichHocKhaDungById(
          lichHocKhaDungId
        );
        if (!lichKhaDung) {
          return res.status(404).json({ message: "Schedule not found" });
        }

        // Lấy thông tin môn học để tính số tiết
        const monHoc = await (async () => {
          if (!lichKhaDung.monHocId) {
            return res
              .status(400)
              .json({ message: "Invalid monHocId: null or undefined" });
          }
          const monHocResult = await storage.getMonHoc(lichKhaDung.monHocId);
          if (!monHocResult) {
            return res.status(400).json({ message: "Course not found" });
          }
          return monHocResult;
        })();

        if (!monHoc) {
          return res
            .status(500)
            .json({ message: "Internal server error while fetching course" });
        }

        const soTinChi = monHoc.soTinChi || 1;
        const tongTietLyThuyet = 15 * soTinChi;
        const tongTietThucHanh = 15 * soTinChi;
        const tongTiet = tongTietLyThuyet + tongTietThucHanh;

        // Kiểm tra xem còn chỗ không
        const soLuongDaDangKy = lichKhaDung.soLuongDaDangKy ?? 0;
        const soLuongToiDa = lichKhaDung.soLuongToiDa ?? 50;
        if (soLuongDaDangKy >= soLuongToiDa) {
          return res.status(400).json({ message: "Schedule is full" });
        }

        // Kiểm tra số tiết lý thuyết và thực hành đã đăng ký
        const existingLich = await (async () => {
          if (!lichKhaDung.monHocId) {
            return res
              .status(400)
              .json({ message: "Invalid monHocId: null or undefined" });
          }
          return await db
            .select()
            .from(schema.lichhoc)
            .where(
              and(
                eq(schema.lichhoc.sinhVienId, sinhVien.id),
                eq(schema.lichhoc.monHocId, lichKhaDung.monHocId)
              )
            );
        })();

        if (!Array.isArray(existingLich)) {
          return; // Trả về sớm nếu existingLich không phải là mảng (do lỗi đã được xử lý trong IIFE)
        }

        const tietLyThuyetDaDangKy = existingLich
          .filter((lh) => lh.loaiTiet === "lyThuyet")
          .reduce((sum, lh) => sum + (lh.soTiet || 0), 0);
        const tietThucHanhDaDangKy = existingLich
          .filter((lh) => lh.loaiTiet === "thucHanh")
          .reduce((sum, lh) => sum + (lh.soTiet || 0), 0);

        // Nếu tự động sắp lịch
        if (autoSchedule) {
          const remainingLyThuyet = tongTietLyThuyet - tietLyThuyetDaDangKy;
          const remainingThucHanh = tongTietThucHanh - tietThucHanhDaDangKy;

          if (remainingLyThuyet <= 0 && remainingThucHanh <= 0) {
            return res.status(400).json({
              message:
                "You have already completed all required sessions for this course.",
            });
          }

          // if (lichKhaDung.monHocId === null) {
          //   throw new Error("monHocId cannot be null");
          // }
          const hocKyNamHoc = {
            hocKy: lichKhaDung.hocKy || "Học kỳ 1",
            namHoc: lichKhaDung.namHoc || "2024-2025",
          };

          const proposedSchedules = await generateSchedule(
            sinhVien.id,
            lichKhaDung.monHocId ?? 0,
            remainingLyThuyet,
            remainingThucHanh,
            hocKyNamHoc.hocKy, // Truyền học kỳ
            hocKyNamHoc.namHoc // Truyền năm học
          );

          if (proposedSchedules.length === 0) {
            return res.status(400).json({
              message:
                "Unable to generate a schedule. Please try manual scheduling.",
            });
          }

          const newLichHocs = [];
          for (const schedule of proposedSchedules) {
            const lichHoc = await storage.createLichHoc({
              sinhVienId: sinhVien.id,
              lichHocKhaDungId: lichKhaDung.id,
              monHocId: lichKhaDung.monHocId,
              phongHoc: schedule.phongHoc,
              thu: schedule.thu as
                | "Thứ 2"
                | "Thứ 3"
                | "Thứ 4"
                | "Thứ 5"
                | "Thứ 6"
                | "Thứ 7"
                | "Chủ nhật"
                | null,
              tietBatDau: schedule.tietBatDau,
              soTiet: schedule.soTiet,
              buoiHoc: lichKhaDung.buoiHoc,
              hocKy: lichKhaDung.hocKy,
              namHoc: lichKhaDung.namHoc,
              loaiTiet: schedule.loaiTiet,
            });
            newLichHocs.push(lichHoc);
          }

          // Cập nhật số lượng đã đăng ký
          await db
            .update(schema.lichHocKhaDung)
            .set({ soLuongDaDangKy: soLuongDaDangKy + 1 })
            .where(eq(schema.lichHocKhaDung.id, lichHocKhaDungId));

          return res.status(201).json({
            message: "Schedule automatically generated successfully",
            lichHocs: newLichHocs,
          });
        }

        // Nếu không tự động sắp lịch, sử dụng thông tin thủ công
        let finalThu = thu || lichKhaDung.thu;
        let finalTietBatDau = tietBatDau || lichKhaDung.tietBatDau;
        let finalSoTiet = soTiet || Math.min(tongTiet / 15, 2);
        let finalPhongHoc = phongHoc || lichKhaDung.phongHoc;
        let finalLoaiTiet = loaiTiet || "lyThuyet";

        // Kiểm tra giới hạn số tiết lý thuyết và thực hành
        if (finalLoaiTiet === "lyThuyet") {
          if (tietLyThuyetDaDangKy + finalSoTiet > tongTietLyThuyet) {
            return res.status(400).json({
              message: `Maximum theory sessions (${tongTietLyThuyet} sessions) exceeded. You have already scheduled ${tietLyThuyetDaDangKy} theory sessions.`,
            });
          }
        } else if (finalLoaiTiet === "thucHanh") {
          if (tietThucHanhDaDangKy + finalSoTiet > tongTietThucHanh) {
            return res.status(400).json({
              message: `Maximum practical sessions (${tongTietThucHanh} sessions) exceeded. You have already scheduled ${tietThucHanhDaDangKy} practical sessions.`,
            });
          }
        }

        // Kiểm tra xung đột lịch học của sinh viên
        // const conflictingLich = await db
        //   .select()
        //   .from(schema.lichhoc)
        //   .where(
        //     and(
        //       eq(schema.lichhoc.sinhVienId, sinhVien.id),
        //       eq(schema.lichhoc.thu, finalThu),
        //       eq(schema.lichhoc.hocKy, lichKhaDung.hocKy), // Thêm điều kiện học kỳ
        //       eq(schema.lichhoc.namHoc, lichKhaDung.namHoc), // Thêm điều kiện năm học
        //       sql`${schema.lichhoc.tietBatDau} <= ${
        //         finalTietBatDau + finalSoTiet - 1
        //       } AND ${schema.lichhoc.tietBatDau} + ${
        //         schema.lichhoc.soTiet
        //       } - 1 >= ${finalTietBatDau}`,
        //       existingLich.length > 0
        //         ? ne(schema.lichhoc.id, existingLich[0].id)
        //         : sql`TRUE`
        //     )
        //   );

        const conflictingLich = await db
          .select()
          .from(schema.lichhoc)
          .where(
            and(
              eq(schema.lichhoc.sinhVienId, sinhVien.id),
              eq(schema.lichhoc.thu, finalThu),
              eq(schema.lichhoc.hocKy, lichKhaDung.hocKy as string),
              eq(schema.lichhoc.namHoc, lichKhaDung.namHoc as string),
              lte(schema.lichhoc.tietBatDau, finalTietBatDau + finalSoTiet - 1),
              gte(
                sql`${schema.lichhoc.tietBatDau} + ${schema.lichhoc.soTiet} - 1`,
                finalTietBatDau
              ),
              existingLich.length > 0
                ? ne(schema.lichhoc.id, existingLich[0].id)
                : sql`TRUE`
            )
          );

        if (conflictingLich.length > 0) {
          return res.status(400).json({
            message:
              "Schedule conflict: You have another class at this time. Please choose a different day or period.",
          });
        }

        // Kiểm tra phòng học có trống không
        const conflictingPhong = await db
          .select()
          .from(schema.lichhoc)
          .where(
            and(
              eq(schema.lichhoc.phongHoc, finalPhongHoc),
              eq(schema.lichhoc.thu, finalThu),
              sql`${schema.lichhoc.tietBatDau} <= ${
                finalTietBatDau + finalSoTiet - 1
              } AND ${schema.lichhoc.tietBatDau} + ${
                schema.lichhoc.soTiet
              } - 1 >= ${finalTietBatDau}`,
              existingLich.length > 0
                ? ne(schema.lichhoc.id, existingLich[0].id)
                : sql`TRUE`
            )
          );

        if (conflictingPhong.length > 0) {
          return res.status(400).json({
            message:
              "Room is not available at this time. Please choose a different room or time.",
          });
        }

        // Nếu sinh viên đã đăng ký môn học này, xóa lịch học cũ
        if (existingLich.length > 0) {
          await db
            .delete(schema.lichhoc)
            .where(eq(schema.lichhoc.id, existingLich[0].id));

          // Giảm số lượng đã đăng ký của lịch học khả dụng cũ
          if (existingLich[0].lichHocKhaDungId) {
            const oldLichKhaDung = await storage.getLichHocKhaDungById(
              existingLich[0].lichHocKhaDungId
            );
            if (oldLichKhaDung && oldLichKhaDung.soLuongDaDangKy) {
              await db
                .update(schema.lichHocKhaDung)
                .set({ soLuongDaDangKy: oldLichKhaDung.soLuongDaDangKy - 1 })
                .where(
                  eq(schema.lichHocKhaDung.id, existingLich[0].lichHocKhaDungId)
                );
            }
          }
        }

        // Thêm lịch học mới cho sinh viên
        const lichHoc = await storage.createLichHoc({
          sinhVienId: sinhVien.id,
          lichHocKhaDungId: lichKhaDung.id,
          monHocId: lichKhaDung.monHocId,
          phongHoc: finalPhongHoc,
          thu: finalThu,
          tietBatDau: finalTietBatDau,
          soTiet: finalSoTiet,
          buoiHoc: lichKhaDung.buoiHoc,
          hocKy: lichKhaDung.hocKy,
          namHoc: lichKhaDung.namHoc,
          loaiTiet: finalLoaiTiet,
        });

        // Cập nhật số lượng đã đăng ký
        await db
          .update(schema.lichHocKhaDung)
          .set({ soLuongDaDangKy: soLuongDaDangKy + 1 })
          .where(eq(schema.lichHocKhaDung.id, lichHocKhaDungId));

        res.status(201).json({
          message:
            existingLich.length > 0
              ? "Schedule updated successfully"
              : "Schedule selected successfully",
          lichHoc,
        });
      } catch (error) {
        console.error("Error selecting/updating schedule:", error);
        res.status(500).json({ message: "Error selecting/updating schedule" });
      }
    }
  );

  // Hàm generateSchedule
  async function generateSchedule(
    sinhVienId: number,
    monHocId: number,
    remainingLyThuyet: number,
    remainingThucHanh: number,
    hocKy?: string,
    namHoc?: string
  ): Promise<
    Array<{
      thu: string;
      tietBatDau: number;
      soTiet: number;
      phongHoc: string;
      loaiTiet: string;
    }>
  > {
    const hocKyNamHoc =
      hocKy && namHoc
        ? { hocKy, namHoc }
        : await storage.getCurrentHocKyNamHoc();

    // Lấy danh sách lịch học khả dụng cho môn học
    const lichKhaDungList = await storage.getLichHocKhaDung(monHocId);
    console.log("Lich kha dung:", lichKhaDungList);
    if (!lichKhaDungList.length) {
      console.log(
        `Không tìm thấy lịch học khả dụng cho môn học ID=${monHocId}`
      );
      return []; // Không có slot nào khả dụng
    }

    // Lấy lịch học hiện tại của sinh viên trong học kỳ này
    const existingLich = await db
      .select()
      .from(schema.lichhoc)
      .where(
        and(
          eq(schema.lichhoc.sinhVienId, sinhVienId),
          eq(schema.lichhoc.hocKy, hocKyNamHoc?.hocKy || "Học kỳ 1"),
          eq(schema.lichhoc.namHoc, hocKyNamHoc?.namHoc || "2024-2025")
        )
      );

    // Kiểm tra thời gian đăng ký hợp lệ
    const registrationCheck = await isRegistrationPeriodValid();
    if (!registrationCheck.valid) {
      console.log(`Ngoài thời gian đăng ký: ${registrationCheck.message}`);
      throw new Error(registrationCheck.message);
    }

    // Tính số tiết tối đa mỗi phiên (giới hạn 2 tiết/phiên để tránh lịch quá dài)
    const maxSoTietPerSession = 2;

    // Danh sách lịch học được đề xuất
    const proposedSchedules: Array<{
      thu: string;
      tietBatDau: number;
      soTiet: number;
      phongHoc: string;
      loaiTiet: string;
    }> = [];

    // Chia nhỏ số tiết còn lại thành các phiên tối đa 2 tiết
    let lyThuyetToSchedule = remainingLyThuyet;
    let thucHanhToSchedule = remainingThucHanh;

    // Lưu thông tin về tiết học theo ngày để phân bổ đều
    const dayScheduleInfo = {
      "Thứ 2": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Thứ 3": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Thứ 4": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Thứ 5": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Thứ 6": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Thứ 7": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
      "Chủ nhật": { total: 0, buoi: { Sáng: 0, Chiều: 0, Tối: 0 } },
    };

    // Tính toán số tiết đã có trên lịch hiện tại
    existingLich.forEach((lich) => {
      if (lich.thu && lich.buoiHoc) {
        dayScheduleInfo[lich.thu].total += lich.soTiet || 0;
        dayScheduleInfo[lich.thu].buoi[lich.buoiHoc] += lich.soTiet || 0;
      }
    });

    console.log(
      "Thông tin lịch hiện tại:",
      JSON.stringify(dayScheduleInfo, null, 2)
    );

    // Thêm bước map dữ liệu sau khi lấy lichKhaDungList
    const mappedSlots = lichKhaDungList.map((slot) => ({
      ...slot,
      loaiTiet:
        (slot as any).loaiTiet ||
        (slot.phongHoc?.startsWith("TH") ? "thucHanh" : "lyThuyet"),
    }));

    // Sử dụng mappedSlots thay cho lichKhaDungList
    const sortedSlots = sortByPriority(mappedSlots);

    // Thêm logic ưu tiên dựa trên số tiết hiện có trong ngày
    sortedSlots.sort((a, b) => {
      // Ưu tiên ngày có ít tiết học hơn
      const totalA = dayScheduleInfo[a.thu as DayOfWeek]?.total || 0;
      const totalB = dayScheduleInfo[b.thu as DayOfWeek]?.total || 0;

      if (totalA !== totalB) return totalA - totalB;

      // Nếu cùng tổng số tiết, ưu tiên buổi có ít tiết hơn
      const buoiA =
        dayScheduleInfo[a.thu as DayOfWeek]?.buoi[a.buoiHoc as SessionType] ||
        0;
      const buoiB =
        dayScheduleInfo[b.thu as DayOfWeek]?.buoi[b.buoiHoc as SessionType] ||
        0;

      return buoiA - buoiB;
    });

    // Hàm kiểm tra xung đột lịch học
    const hasConflict = (
      slot: (typeof sortedSlots)[0],
      soTiet: number,
      existing: typeof existingLich
    ) => {
      const hasConflicts = existing.some(
        (lich) =>
          lich.thu === slot.thu &&
          lich.hocKy === slot.hocKy &&
          lich.namHoc === slot.namHoc &&
          // Thêm kiểm tra null và giá trị mặc định
          (lich.tietBatDau ?? 0) <= slot.tietBatDau + soTiet - 1 &&
          (lich.tietBatDau ?? 0) + (lich.soTiet || 0) - 1 >= slot.tietBatDau
      );

      if (hasConflicts) {
        console.log(
          `Xung đột lịch học: ${slot.thu}, tiết ${slot.tietBatDau}, buổi ${slot.buoiHoc}`
        );
      }

      return hasConflicts;
    };

    // Hàm kiểm tra xung đột phòng học
    const hasRoomConflict = async (
      slot: (typeof sortedSlots)[0],
      soTiet: number
    ) => {
      const conflictingPhong = await db
        .select()
        .from(schema.lichhoc)
        .where(
          and(
            eq(schema.lichhoc.phongHoc, slot.phongHoc),
            eq(schema.lichhoc.thu, slot.thu),
            eq(schema.lichhoc.hocKy, slot.hocKy),
            eq(schema.lichhoc.namHoc, slot.namHoc),
            lte(schema.lichhoc.tietBatDau, slot.tietBatDau + soTiet - 1),
            gte(
              sql`${schema.lichhoc.tietBatDau} + ${schema.lichhoc.soTiet} - 1`,
              slot.tietBatDau
            )
          )
        );

      if (conflictingPhong.length > 0) {
        console.log(
          `Xung đột phòng học: ${slot.phongHoc}, ${slot.thu}, tiết ${slot.tietBatDau}`
        );
      }

      return conflictingPhong.length > 0;
    };

    // Thêm hàm kiểm tra giới hạn số tiết trong buổi học
    const exceedsBuoiHocLimit = (
      slot: (typeof sortedSlots)[0],
      soTiet: number
    ) => {
      // Số tiết đã có trong buổi này
      const existingTiets =
        dayScheduleInfo[slot.thu as DayOfWeek]?.buoi[
          slot.buoiHoc as SessionType
        ] || 0;

      // Kiểm tra nếu thêm tiết mới có vượt quá giới hạn không
      const limit = BUOI_HOC_LIMITS[slot.buoiHoc as SessionType] || 5;
      const wouldExceed = existingTiets + soTiet > limit;

      if (wouldExceed) {
        console.log(
          `Vượt quá giới hạn buổi học: ${slot.buoiHoc} hiện có ${existingTiets} tiết, thêm ${soTiet} sẽ vượt quá giới hạn ${limit} tiết`
        );
      }

      return wouldExceed;
    };

    console.log(
      "Sorted Slots:",
      sortedSlots.map((s) => ({
        id: s.id,
        thu: s.thu,
        tietBatDau: s.tietBatDau,
        soTiet: s.soTiet,
        buoiHoc: s.buoiHoc,
        loaiTiet: s.loaiTiet,
        soLuongDaDangKy: s.soLuongDaDangKy,
      }))
    );

    // Log số tiết cần đăng ký
    console.log(
      `Cần đăng ký: ${lyThuyetToSchedule} tiết lý thuyết, ${thucHanhToSchedule} tiết thực hành`
    );
    console.log(`Tìm thấy ${sortedSlots.length} lịch học khả dụng`);

    // Xếp lịch cho lý thuyết
    while (lyThuyetToSchedule > 0) {
      const soTiet = Math.min(lyThuyetToSchedule, maxSoTietPerSession);

      // Tìm slot phù hợp với các điều kiện
      const availableSlot = sortedSlots.find(
        (slot) =>
          slot.loaiTiet === "lyThuyet" &&
          (slot.soLuongDaDangKy ?? 0) < (slot.soLuongToiDa ?? Infinity) &&
          !hasConflict(slot, soTiet, existingLich) &&
          !exceedsBuoiHocLimit(slot, soTiet)
      );

      if (!availableSlot) {
        console.log("Không tìm thấy slot phù hợp cho lý thuyết");
        break; // Không còn slot nào khả dụng
      }

      if (!(await hasRoomConflict(availableSlot, soTiet))) {
        // Thêm lịch học vào danh sách đề xuất
        proposedSchedules.push({
          thu: availableSlot.thu,
          tietBatDau: availableSlot.tietBatDau,
          soTiet,
          phongHoc: availableSlot.phongHoc,
          loaiTiet: "lyThuyet",
        });

        // Cập nhật số tiết còn lại
        lyThuyetToSchedule -= soTiet;

        // Cập nhật thông tin lịch theo ngày
        dayScheduleInfo[availableSlot.thu as DayOfWeek].total += soTiet;
        dayScheduleInfo[availableSlot.thu as DayOfWeek].buoi[
          availableSlot.buoiHoc as SessionType
        ] += soTiet;

        // Cập nhật danh sách existingLich để kiểm tra xung đột tiếp theo
        existingLich.push({
          ...availableSlot,
          sinhVienId,
          soTiet,
          loaiTiet: "lyThuyet",
        });

        console.log(
          `Đã thêm lịch lý thuyết: ${availableSlot.thu}, tiết ${availableSlot.tietBatDau}, buổi ${availableSlot.buoiHoc}, số tiết ${soTiet}`
        );
      } else {
        console.log(`Phòng học ${availableSlot.phongHoc} đã có người sử dụng`);
      }

      // Loại slot đã dùng ra khỏi danh sách
      const index = sortedSlots.indexOf(availableSlot);
      if (index !== -1) {
        sortedSlots.splice(index, 1);
      }
    }

    // Xếp lịch cho thực hành (tương tự như lý thuyết)
    while (thucHanhToSchedule > 0) {
      const soTiet = Math.min(thucHanhToSchedule, maxSoTietPerSession);

      // Tìm slot phù hợp với các điều kiện
      const availableSlot = sortedSlots.find(
        (slot) =>
          slot.loaiTiet === "thucHanh" &&
          (slot.soLuongDaDangKy ?? 0) < (slot.soLuongToiDa ?? Infinity) &&
          !hasConflict(slot, soTiet, existingLich) &&
          !exceedsBuoiHocLimit(slot, soTiet)
      );

      if (!availableSlot) {
        console.log("Không tìm thấy slot phù hợp cho thực hành");
        break; // Không còn slot nào khả dụng
      }

      if (!(await hasRoomConflict(availableSlot, soTiet))) {
        // Thêm lịch học vào danh sách đề xuất
        proposedSchedules.push({
          thu: availableSlot.thu,
          tietBatDau: availableSlot.tietBatDau,
          soTiet,
          phongHoc: availableSlot.phongHoc,
          loaiTiet: "thucHanh",
        });

        // Cập nhật số tiết còn lại
        thucHanhToSchedule -= soTiet;

        // Cập nhật thông tin lịch theo ngày
        dayScheduleInfo[availableSlot.thu as DayOfWeek].total += soTiet;
        dayScheduleInfo[availableSlot.thu as DayOfWeek].buoi[
          availableSlot.buoiHoc as SessionType
        ] += soTiet;

        // Cập nhật danh sách existingLich để kiểm tra xung đột tiếp theo
        existingLich.push({
          ...availableSlot,
          sinhVienId,
          soTiet,
          loaiTiet: "thucHanh",
        });

        console.log(
          `Đã thêm lịch thực hành: ${availableSlot.thu}, tiết ${availableSlot.tietBatDau}, buổi ${availableSlot.buoiHoc}, số tiết ${soTiet}`
        );
      }

      // Loại slot đã dùng ra khỏi danh sách
      const index = sortedSlots.indexOf(availableSlot);
      if (index !== -1) {
        sortedSlots.splice(index, 1);
      }
    }

    // Kiểm tra kết quả
    if (lyThuyetToSchedule > 0 || thucHanhToSchedule > 0) {
      console.log(
        `Không thể sắp xếp đủ tiết: còn thiếu ${lyThuyetToSchedule} tiết lý thuyết và ${thucHanhToSchedule} tiết thực hành`
      );
    }

    console.log(
      `Kết quả sắp lịch: ${proposedSchedules.length} lịch học đã được sắp xếp`
    );
    return proposedSchedules;
  }

  // Route lịch học week
  app.get(
    "/api/sinhvien/lichhoc/tuan",
    isAuthenticated,
    hasRole("student"),
    async (req: any, res: any) => {
      try {
        const { offset } = req.query; // offset = -1 (tuần trước), 1 (tuần sau), 0 (tuần hiện tại)
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Student not found" });
        }

        // 🔹 Lấy học kỳ và năm học hiện tại
        const hocKyNamHoc = await storage.getCurrentHocKyNamHoc();
        if (!hocKyNamHoc) {
          return res.status(404).json({ message: "No active semester found" });
        }

        // 🔹 Xác định danh sách các ngày trong tuần
        const weekdays: (
          | "Thứ 2"
          | "Thứ 3"
          | "Thứ 4"
          | "Thứ 5"
          | "Thứ 6"
          | "Thứ 7"
          | "Chủ nhật"
        )[] = [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "Chủ nhật",
        ];

        // 🔹 Lấy lịch học theo thứ trong tuần & học kỳ hiện tại
        const lichHoc = await db
          .select()
          .from(schema.lichhoc)
          .where(
            and(
              eq(schema.lichhoc.sinhVienId, sinhVien.id),
              inArray(schema.lichhoc.thu, weekdays),
              eq(schema.lichhoc.hocKy, hocKyNamHoc.hocKy), // ✅ Lọc theo học kỳ
              eq(schema.lichhoc.namHoc, hocKyNamHoc.namHoc) // ✅ Lọc theo năm học
            )
          );

        res.json(lichHoc);
      } catch (error) {
        console.error("Error fetching weekly schedule:", error);
        res.status(500).json({ message: "Error fetching schedule" });
      }
    }
  );

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
    // Route để sắp lịch học tự động
    autoSchedule: app.post(
      "/api/sinhvien/lichhoc/tudong",
      isAuthenticated,
      hasRole("student"),
      validateRequest(
        z.object({
          monHocId: z.number().int().positive("Invalid course ID"),
          hocKy: z.string().optional(), // Thêm hocKy optional
          namHoc: z.string().optional(), // Thêm namHoc optional
        })
      ),
      async (req: any, res: any) => {
        try {
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          const { monHocId, hocKy, namHoc } = req.validatedBody;

          // Lấy học kỳ và năm học - ưu tiên từ request, nếu không có thì lấy hiện tại
          let hocKyNamHoc;
          if (hocKy && namHoc) {
            // Kiểm tra học kỳ và năm học hợp lệ
            hocKyNamHoc = await db
              .select()
              .from(schema.hockyNamHoc)
              .where(
                and(
                  eq(schema.hockyNamHoc.hocKy, hocKy),
                  eq(schema.hockyNamHoc.namHoc, namHoc)
                )
              )
              .limit(1)
              .then((results) => results[0]);
            if (!hocKyNamHoc) {
              return res.status(400).json({
                message: "Invalid semester or year specified",
              });
            }
          } else {
            // Sử dụng học kỳ hiện tại nếu không được chỉ định
            hocKyNamHoc = await storage.getCurrentHocKyNamHoc();
            if (!hocKyNamHoc) {
              return res.status(404).json({
                message: "No active semester found",
              });
            }
          }

          // Kiểm tra môn học
          const monHoc = await storage.getMonHoc(monHocId);
          if (!monHoc) {
            return res.status(404).json({ message: "Course not found" });
          }

          // Lấy danh sách lịch học khả dụng cho môn học trong học kỳ cụ thể
          const availableSlots = await db
            .select()
            .from(schema.lichHocKhaDung)
            .where(
              and(
                eq(schema.lichHocKhaDung.monHocId, monHocId),
                eq(schema.lichHocKhaDung.hocKy, hocKyNamHoc.hocKy),
                eq(schema.lichHocKhaDung.namHoc, hocKyNamHoc.namHoc)
              )
            );

          // Kiểm tra nếu không có lịch học khả dụng
          if (!availableSlots.length) {
            return res.status(400).json({
              message:
                "No available schedules found for this course in the selected semester",
            });
          }

          // Tiếp tục logic hiện tại với validateSchedulingRequest
          const validationResult = await validateSchedulingRequest(
            sinhVien.id,
            monHocId
          );

          if (!validationResult) {
            await logSchedulingActivity(sinhVien.id, monHocId, {
              success: false,
              error: "Failed to validate scheduling request",
            });
            return res.status(400).json({
              message: "Failed to validate scheduling request",
            });
          }

          // Tính toán số tiết lý thuyết và thực hành còn lại
          const soTinChi = monHoc.soTinChi || 1;
          const tongTietLyThuyet = 15 * soTinChi;
          const tongTietThucHanh = 15 * soTinChi;

          // Lấy lịch học hiện tại của sinh viên cho môn học
          const existingLich = await db
            .select()
            .from(schema.lichhoc)
            .where(
              and(
                eq(schema.lichhoc.sinhVienId, sinhVien.id),
                eq(schema.lichhoc.monHocId, monHocId),
                eq(schema.lichhoc.hocKy, hocKyNamHoc.hocKy),
                eq(schema.lichhoc.namHoc, hocKyNamHoc.namHoc)
              )
            );

          const tietLyThuyetDaDangKy = existingLich
            .filter((lh) => lh.loaiTiet === "lyThuyet")
            .reduce((sum, lh) => sum + (lh.soTiet || 0), 0);
          const tietThucHanhDaDangKy = existingLich
            .filter((lh) => lh.loaiTiet === "thucHanh")
            .reduce((sum, lh) => sum + (lh.soTiet || 0), 0);

          const remainingLyThuyet = tongTietLyThuyet - tietLyThuyetDaDangKy;
          const remainingThucHanh = tongTietThucHanh - tietThucHanhDaDangKy;

          if (remainingLyThuyet <= 0 && remainingThucHanh <= 0) {
            return res.status(400).json({
              message:
                "You have already completed all required sessions for this course.",
            });
          }

          // Gọi hàm generateSchedule với học kỳ và năm học cụ thể

          const proposedSchedules = await generateSchedule(
            sinhVien.id,
            monHocId,
            remainingLyThuyet,
            remainingThucHanh,
            hocKyNamHoc.hocKy, // Truyền học kỳ
            hocKyNamHoc.namHoc // Truyền năm học
          );

          if (proposedSchedules.length === 0) {
            await logSchedulingActivity(sinhVien.id, monHocId, {
              success: false,
              error: "No available schedules found",
            });
            return res.status(400).json({
              message: "Unable to generate schedule due to no available slots",
            });
          }

          // Tạo lịch học mới
          const newLichHocs = [];
          for (const schedule of proposedSchedules) {
            const lichHocKhaDung = availableSlots.find(
              (slot) =>
                slot.thu === schedule.thu &&
                slot.tietBatDau === schedule.tietBatDau &&
                slot.phongHoc === schedule.phongHoc
            );
            if (!lichHocKhaDung) continue;

            const lichHoc = await storage.createLichHoc({
              sinhVienId: sinhVien.id,
              lichHocKhaDungId: lichHocKhaDung.id,
              monHocId,
              phongHoc: schedule.phongHoc,
              thu: schedule.thu as
                | "Thứ 2"
                | "Thứ 3"
                | "Thứ 4"
                | "Thứ 5"
                | "Thứ 6"
                | "Thứ 7"
                | "Chủ nhật",
              tietBatDau: schedule.tietBatDau,
              soTiet: schedule.soTiet,
              buoiHoc: lichHocKhaDung.buoiHoc,
              hocKy: hocKyNamHoc.hocKy,
              namHoc: hocKyNamHoc.namHoc,
              loaiTiet: schedule.loaiTiet,
            });
            newLichHocs.push(lichHoc);

            // Cập nhật số lượng đã đăng ký
            await db
              .update(schema.lichHocKhaDung)
              .set({
                soLuongDaDangKy: (lichHocKhaDung.soLuongDaDangKy || 0) + 1,
              })
              .where(eq(schema.lichHocKhaDung.id, lichHocKhaDung.id));
          }

          // Ghi log thành công
          await logSchedulingActivity(sinhVien.id, monHocId, {
            success: true,
            lichHoc: newLichHocs,
          });

          res.status(201).json({
            message: "Schedule generated successfully",
            lichHocs: newLichHocs,
          });
        } catch (error) {
          console.error("Error generating automatic schedule:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      }
    ),

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
          const { weekStartDate } = req.query;
          const sinhVien = await storage.getSinhVienByUserId(req.user.id);

          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          // Chuyển đổi ngày bắt đầu tuần từ tham số
          const startDate = weekStartDate
            ? new Date(weekStartDate)
            : new Date();

          // Xác định học kỳ và năm học dựa trên startDate
          const hocKyNamHoc = await storage.getCurrentHocKyNamHoc();

          if (!hocKyNamHoc) {
            // Nếu không tìm thấy học kỳ năm học phù hợp, trả về mảng rỗng
            return res.json([]);
          }

          console.log(
            `Lấy lịch học kỳ ${hocKyNamHoc.hocKy} năm học ${hocKyNamHoc.namHoc}`
          );

          // Query lịch học theo học kỳ và năm học
          const lichHoc = await db
            .select({
              id: schema.lichhoc.id,
              monHocId: schema.lichhoc.monHocId,
              thu: schema.lichhoc.thu,
              tietBatDau: schema.lichhoc.tietBatDau,
              soTiet: schema.lichhoc.soTiet,
              phongHoc: schema.lichhoc.phongHoc,
              loaiTiet: schema.lichhoc.loaiTiet,
              tenMon: schema.monhoc.tenMon,
            })
            .from(schema.lichhoc)
            .leftJoin(
              schema.monhoc,
              eq(schema.lichhoc.monHocId, schema.monhoc.id)
            )
            .where(
              and(
                eq(schema.lichhoc.sinhVienId, sinhVien.id),
                eq(schema.lichhoc.hocKy, hocKyNamHoc.hocKy),
                eq(schema.lichhoc.namHoc, hocKyNamHoc.namHoc)
              )
            );

          const formattedSchedule = lichHoc.map((item) => ({
            ...item,
            monHoc: {
              tenMon: item.tenMon,
            },
          }));

          res.json(formattedSchedule);
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
  // const facultyRoutes = {
  //   getTeachingSchedule: app.get(
  //     "/api/giangvien/lichgiangday",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }
  //         const lichGiangDay = await db
  //           .select()
  //           .from(schema.lichgiangday)
  //           .innerJoin(
  //             schema.phanconggiangday,
  //             eq(schema.lichgiangday.phanCongId, schema.phanconggiangday.id)
  //           )
  //           .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));
  //         const lichWithDetails = await Promise.all(
  //           lichGiangDay.map(async (lgd) => {
  //             const monHoc = lgd.phanconggiangday.monHocId
  //               ? await storage.getMonHoc(lgd.phanconggiangday.monHocId)
  //               : null;
  //             return { ...lgd.lichgiangday, monHoc };
  //           })
  //         );
  //         res.json(lichWithDetails);
  //       } catch (error) {
  //         console.error("Error fetching teaching schedule:", error);
  //         res.status(500).json({ message: "Error fetching teaching schedule" });
  //       }
  //     }
  //   ),

  //   // Route lấy danh sách lớp mà giảng viên phụ trách
  //   getManagedClasses: app.get(
  //     "/api/giangvien/lophoc",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         // Lấy danh sách môn học mà giảng viên được phân công
  //         const phanCong = await db
  //           .select()
  //           .from(schema.phanconggiangday)
  //           .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

  //         // Kiểm tra nếu không có phân công nào
  //         if (phanCong.length === 0) {
  //           return res.json([]); // Trả về mảng rỗng nếu không có lớp nào
  //         }

  //         // Lọc bỏ các monHocId null và ép kiểu thành number[]
  //         const monHocIds: number[] = phanCong
  //           .map((pc) => pc.monHocId)
  //           .filter((id): id is number => id !== null);

  //         // Nếu không còn monHocId nào sau khi lọc, trả về mảng rỗng
  //         if (monHocIds.length === 0) {
  //           return res.json([]);
  //         }

  //         // Lấy danh sách lớp liên quan đến các môn học này
  //         const lopHoc = await db
  //           .selectDistinct({ lop: schema.lop })
  //           .from(schema.lop)
  //           .innerJoin(
  //             schema.sinhvien,
  //             eq(schema.lop.id, schema.sinhvien.lopId)
  //           )
  //           .innerJoin(
  //             schema.lichhoc,
  //             eq(schema.sinhvien.id, schema.lichhoc.sinhVienId)
  //           )
  //           .where(inArray(schema.lichhoc.monHocId, monHocIds));

  //         const lopWithDetails = await Promise.all(
  //           lopHoc.map(async (item) => {
  //             const lop = item.lop;
  //             const monHocList = await db
  //               .select({ monHoc: schema.monhoc })
  //               .from(schema.monhoc)
  //               .innerJoin(
  //                 schema.lichhoc,
  //                 eq(schema.monhoc.id, schema.lichhoc.monHocId)
  //               )
  //               .innerJoin(
  //                 schema.sinhvien,
  //                 eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
  //               )
  //               .where(eq(schema.sinhvien.lopId, lop.id));
  //             const soLuongSinhVien = await db
  //               .select({ count: sql<number>`count(*)` })
  //               .from(schema.sinhvien)
  //               .where(eq(schema.sinhvien.lopId, lop.id))
  //               .then((res) => res[0].count);
  //             return {
  //               ...lop,
  //               monHoc: monHocList.map((m) => m.monHoc),
  //               soLuongSinhVien,
  //             };
  //           })
  //         );

  //         res.json(lopWithDetails);
  //       } catch (error) {
  //         console.error("Error fetching managed classes:", error);
  //         res.status(500).json({ message: "Error fetching managed classes" });
  //       }
  //     }
  //   ),

  //   // Route xem chi tiết một lớp
  //   getClassDetails: app.get(
  //     "/api/giangvien/lophoc/:lopId",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     attachClassDetails,
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         // Lấy danh sách phân công giảng dạy của giảng viên
  //         const phanCong = await db
  //           .select()
  //           .from(schema.phanconggiangday)
  //           .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

  //         // Kiểm tra nếu không có phân công nào
  //         if (phanCong.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Lọc bỏ monHocId null và ép kiểu thành number[]
  //         const monHocIds: number[] = phanCong
  //           .map((pc) => pc.monHocId)
  //           .filter((id): id is number => id !== null);

  //         // Nếu không có monHocId hợp lệ, trả về lỗi
  //         if (monHocIds.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Kiểm tra xem giảng viên có liên quan đến lớp này qua lịch học không
  //         const lichHoc = await db
  //           .select()
  //           .from(schema.lichhoc)
  //           .innerJoin(
  //             schema.sinhvien,
  //             eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
  //           )
  //           .where(
  //             and(
  //               eq(schema.sinhvien.lopId, req.lop.id),
  //               inArray(schema.lichhoc.monHocId, monHocIds)
  //             )
  //           );

  //         if (!lichHoc.length) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         const sinhVien = await db
  //           .select()
  //           .from(schema.sinhvien)
  //           .where(eq(schema.sinhvien.lopId, req.lop.id));

  //         const monHoc = await db
  //           .selectDistinct({ monHoc: schema.monhoc })
  //           .from(schema.monhoc)
  //           .innerJoin(
  //             schema.lichhoc,
  //             eq(schema.monhoc.id, schema.lichhoc.monHocId)
  //           )
  //           .innerJoin(
  //             schema.sinhvien,
  //             eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
  //           )
  //           .where(eq(schema.sinhvien.lopId, req.lop.id));

  //         res.json({
  //           lop: req.lop,
  //           monHoc: monHoc.map((m) => m.monHoc),
  //           sinhVien,
  //           soLuongSinhVien: sinhVien.length,
  //         });
  //       } catch (error) {
  //         console.error("Error fetching class details:", error);
  //         res.status(500).json({ message: "Error fetching class details" });
  //       }
  //     }
  //   ),

  //   // Route thêm sinh viên vào lớp
  //   addStudentToClass: app.post(
  //     "/api/giangvien/lophoc/:lopId/sinhvien",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     attachClassDetails,
  //     validateRequest(
  //       z.object({
  //         sinhVienId: z.number().int().positive("Invalid student ID"),
  //       })
  //     ),
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         // Lấy danh sách phân công giảng dạy của giảng viên
  //         const phanCong = await db
  //           .select()
  //           .from(schema.phanconggiangday)
  //           .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

  //         // Kiểm tra nếu không có phân công nào
  //         if (phanCong.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Lọc bỏ monHocId null và ép kiểu thành number[]
  //         const monHocIds: number[] = phanCong
  //           .map((pc) => pc.monHocId)
  //           .filter((id): id is number => id !== null);

  //         // Nếu không có monHocId hợp lệ, trả về lỗi
  //         if (monHocIds.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Kiểm tra quyền quản lý lớp qua lịch học
  //         const lichHoc = await db
  //           .select()
  //           .from(schema.lichhoc)
  //           .innerJoin(
  //             schema.sinhvien,
  //             eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
  //           )
  //           .where(
  //             and(
  //               eq(schema.sinhvien.lopId, req.lop.id),
  //               inArray(schema.lichhoc.monHocId, monHocIds)
  //             )
  //           );

  //         if (!lichHoc.length) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         const { sinhVienId } = req.validatedBody;
  //         const sinhVien = await db
  //           .select()
  //           .from(schema.sinhvien)
  //           .where(eq(schema.sinhvien.id, sinhVienId))
  //           .then((res) => res[0]);
  //         if (!sinhVien) {
  //           return res.status(404).json({ message: "Student not found" });
  //         }

  //         // Kiểm tra xem sinh viên đã trong lớp chưa
  //         if (sinhVien.lopId === req.lop.id) {
  //           return res
  //             .status(400)
  //             .json({ message: "Student is already in this class" });
  //         }

  //         // Cập nhật lớp cho sinh viên
  //         await db
  //           .update(schema.sinhvien)
  //           .set({ lopId: req.lop.id })
  //           .where(eq(schema.sinhvien.id, sinhVienId));

  //         const updatedSinhVien = await db
  //           .select()
  //           .from(schema.sinhvien)
  //           .where(eq(schema.sinhvien.id, sinhVienId))
  //           .then((res) => res[0]);

  //         res.status(200).json({
  //           message: "Student added to class successfully",
  //           sinhVien: updatedSinhVien,
  //         });
  //       } catch (error) {
  //         console.error("Error adding student to class:", error);
  //         res.status(500).json({ message: "Error adding student to class" });
  //       }
  //     }
  //   ),

  //   // Route xóa sinh viên khỏi lớp
  //   removeStudentFromClass: app.delete(
  //     "/api/giangvien/lophoc/:lopId/sinhvien/:sinhVienId",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     attachClassDetails,
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         // Lấy danh sách phân công giảng dạy của giảng viên
  //         const phanCong = await db
  //           .select()
  //           .from(schema.phanconggiangday)
  //           .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

  //         // Kiểm tra nếu không có phân công nào
  //         if (phanCong.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Lọc bỏ monHocId null và ép kiểu thành number[]
  //         const monHocIds: number[] = phanCong
  //           .map((pc) => pc.monHocId)
  //           .filter((id): id is number => id !== null);

  //         // Nếu không có monHocId hợp lệ, trả về lỗi
  //         if (monHocIds.length === 0) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         // Kiểm tra quyền quản lý lớp qua lịch học
  //         const lichHoc = await db
  //           .select()
  //           .from(schema.lichhoc)
  //           .innerJoin(
  //             schema.sinhvien,
  //             eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
  //           )
  //           .where(
  //             and(
  //               eq(schema.sinhvien.lopId, req.lop.id),
  //               inArray(schema.lichhoc.monHocId, monHocIds)
  //             )
  //           );

  //         if (!lichHoc.length) {
  //           return res
  //             .status(403)
  //             .json({ message: "You are not assigned to this class" });
  //         }

  //         const { sinhVienId } = req.params;
  //         const sinhVien = await db
  //           .select()
  //           .from(schema.sinhvien)
  //           .where(eq(schema.sinhvien.id, parseInt(sinhVienId)))
  //           .then((res) => res[0]);
  //         if (!sinhVien) {
  //           return res.status(404).json({ message: "Student not found" });
  //         }

  //         // Kiểm tra xem sinh viên có trong lớp không
  //         if (sinhVien.lopId !== req.lop.id) {
  //           return res
  //             .status(400)
  //             .json({ message: "Student is not in this class" });
  //         }

  //         // Xóa sinh viên khỏi lớp bằng cách đặt lopId về null
  //         await db
  //           .update(schema.sinhvien)
  //           .set({ lopId: null })
  //           .where(eq(schema.sinhvien.id, parseInt(sinhVienId)));

  //         const updatedSinhVien = await db
  //           .select()
  //           .from(schema.sinhvien)
  //           .where(eq(schema.sinhvien.id, parseInt(sinhVienId)))
  //           .then((res) => res[0]);

  //         res.status(200).json({
  //           message: "Student removed from class successfully",
  //           sinhVien: updatedSinhVien,
  //         });
  //       } catch (error) {
  //         console.error("Error removing student from class:", error);
  //         res
  //           .status(500)
  //           .json({ message: "Error removing student from class" });
  //       }
  //     }
  //   ),

  //   getResearchProjects: app.get(
  //     "/api/nghiencuu",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     async (_req, res) => {
  //       try {
  //         const nghienCuu = await storage.getAllNghienCuuKhoaHoc();
  //         res.json(nghienCuu);
  //       } catch (error) {
  //         console.error("Error fetching research projects:", error);
  //         res.status(500).json({ message: "Error fetching research projects" });
  //       }
  //     }
  //   ),

  //   createResearchProject: app.post(
  //     "/api/nghiencuu",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     validateRequest(
  //       z.object({
  //         tenDeTai: z.string().min(1, "Project title is required"),
  //         moTa: z.string().optional(),
  //         thoiGianBatDau: z
  //           .string()
  //           .datetime({ message: "Invalid start date" }),
  //         thoiGianKetThuc: z.string().datetime({ message: "Invalid end date" }),
  //         kinhPhi: z.number().optional(),
  //       })
  //     ),
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         const { tenDeTai, moTa, thoiGianBatDau, thoiGianKetThuc, kinhPhi } =
  //           req.validatedBody;
  //         const nghienCuu = await storage.createNghienCuuKhoaHoc({
  //           tenDeTai,
  //           moTa,
  //           thoiGianBatDau: new Date(thoiGianBatDau),
  //           thoiGianKetThuc: new Date(thoiGianKetThuc),
  //           trangThai: "Đang thực hiện",
  //           kinhPhi: kinhPhi ? kinhPhi.toString() : undefined, // Chuyển số thành string
  //           ketQua: null,
  //         });

  //         res
  //           .status(201)
  //           .json({ message: "Research project created", nghienCuu });
  //       } catch (error) {
  //         console.error("Error creating research project:", error);
  //         res.status(500).json({ message: "Error creating research project" });
  //       }
  //     }
  //   ),

  //   createAnnouncement: app.post(
  //     "/api/thongbao",
  //     isAuthenticated,
  //     hasRole("faculty"),
  //     validateRequest(
  //       z.object({
  //         tieuDe: z.string().min(1, "Title is required"),
  //         noiDung: z.string().optional(),
  //         doiTuong: z.enum(["Tất cả", "Sinh viên", "Giảng viên"]),
  //       })
  //     ),
  //     async (req: any, res: any) => {
  //       try {
  //         const giangVien = await storage.getGiangVienByUserId(req.user.id);
  //         if (!giangVien) {
  //           return res.status(404).json({ message: "Faculty not found" });
  //         }

  //         const { tieuDe, noiDung, doiTuong } = req.validatedBody;
  //         const thongBao = await storage.createThongBao({
  //           tieuDe,
  //           noiDung,
  //           ngayTao: new Date(),
  //           nguoiTao: giangVien.hoTen,
  //           doiTuong,
  //           trangThai: "Đã đăng",
  //         });

  //         res.status(201).json({ message: "Announcement created", thongBao });
  //       } catch (error) {
  //         console.error("Error creating announcement:", error);
  //         res.status(500).json({ message: "Error creating announcement" });
  //       }
  //     }
  //   ),
  // };

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

  // 1. Cấu hình tài khoản (cauhinh_taikhoan) - Admin hoặc người dùng
  app.get(
    "/api/taikhoan/cauhinh",
    isAuthenticated,
    async (req: any, res: any) => {
      try {
        const cauhinh = await db
          .select()
          .from(schema.cauhinhTaikhoan)
          .where(eq(schema.cauhinhTaikhoan.taikhoanId, req.user.id));
        res.json(cauhinh[0] || {});
      } catch (error) {
        console.error("Error fetching account config:", error);
        res
          .status(500)
          .json({ message: "Error fetching account configuration" });
      }
    }
  );

  app.put(
    "/api/taikhoan/cauhinh",
    isAuthenticated,
    validateRequest(
      z.object({
        xacThucHaiYeuTo: z.boolean().optional(),
        soDienThoaiXacThuc: z.string().max(20).optional(),
        emailXacThuc: z.string().email().max(100).optional(),
        khoaTaiKhoanSauDangNhapThatBai: z.number().int().min(1).optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const existingConfig = await db
          .select()
          .from(schema.cauhinhTaikhoan)
          .where(eq(schema.cauhinhTaikhoan.taikhoanId, req.user.id));
        const data = { taikhoanId: req.user.id, ...req.validatedBody };
        let result;
        if (existingConfig.length) {
          result = await db
            .update(schema.cauhinhTaikhoan)
            .set(data)
            .where(eq(schema.cauhinhTaikhoan.taikhoanId, req.user.id));
        } else {
          result = await db.insert(schema.cauhinhTaikhoan).values(data);
        }
        res.json({ message: "Account config updated", cauhinh: result[0] });
      } catch (error) {
        console.error("Error updating account config:", error);
        res
          .status(500)
          .json({ message: "Error updating account configuration" });
      }
    }
  );

  // 2. Đề thi (dethi) - Giảng viên
  app.post(
    "/api/giangvien/dethi",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(
      z.object({
        monHocId: z.number().int().positive(),
        loaiDe: z.enum(["Giữa kỳ", "Cuối kỳ", "Bảo vệ"]),
        namHoc: z.string().max(20),
        hocKy: z.string().max(20),
        thoiGianLam: z.number().int().positive(),
        moTa: z.string().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const giangVien = req.giangVien;
        const data = { giangVien: giangVien.hoTen, ...req.validatedBody };
        const dethi = await db.insert(schema.dethi).values(data);
        res.status(201).json({ message: "Exam created", dethi: dethi[0] });
      } catch (error) {
        console.error("Error creating exam:", error);
        res.status(500).json({ message: "Error creating exam" });
      }
    }
  );

  app.get(
    "/api/giangvien/dethi",
    isAuthenticated,
    hasRole("faculty"),
    async (req: any, res: any) => {
      try {
        const dethi = await db
          .select()
          .from(schema.dethi)
          .where(eq(schema.dethi.giangVien, req.giangVien.hoTen));
        res.json(dethi);
      } catch (error) {
        console.error("Error fetching exams:", error);
        res.status(500).json({ message: "Error fetching exams" });
      }
    }
  );

  // 3. Điểm danh (diemdanh) - Giảng viên
  app.post(
    "/api/giangvien/diemdanh",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(
      z.object({
        sinhVienId: z.number().int().positive(),
        monHocId: z.number().int().positive(),
        ngayDiemDanh: z.string().transform((val) => new Date(val)),
        trangThai: z.enum(["Có mặt", "Vắng mặt", "Đi muộn"]),
        ghiChu: z.string().optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const diemdanh = await db
          .insert(schema.diemdanh)
          .values(req.validatedBody);
        res
          .status(201)
          .json({ message: "Attendance recorded", diemdanh: diemdanh[0] });
      } catch (error) {
        console.error("Error recording attendance:", error);
        res.status(500).json({ message: "Error recording attendance" });
      }
    }
  );

  app.get(
    "/api/sinhvien/diemdanh",
    isAuthenticated,
    hasRole("student"),
    async (req: any, res: any) => {
      try {
        const diemdanh = await db
          .select()
          .from(schema.diemdanh)
          .where(eq(schema.diemdanh.sinhVienId, req.sinhVien.id));
        res.json(diemdanh);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Error fetching attendance" });
      }
    }
  );

  // 4. Khóa luận/đồ án (khoaluandoan) - Sinh viên & Giảng viên
  app.post(
    "/api/sinhvien/khoaluandoan",
    isAuthenticated,
    hasRole("student"),
    validateRequest(
      z.object({
        giangVienHuongDanId: z.number().int().positive(),
        tenDeTai: z.string().max(200),
        moTa: z.string().optional(),
        thoiGianBatDau: z.string().transform((val) => new Date(val)),
        thoiGianKetThuc: z.string().transform((val) => new Date(val)),
      })
    ),
    async (req: any, res: any) => {
      try {
        const data = {
          sinhVienId: req.sinhVien.id,
          trangThai: "Đang thực hiện",
          ...req.validatedBody,
        };
        const khoaluan = await db.insert(schema.khoaluandoan).values(data);
        res
          .status(201)
          .json({ message: "Thesis registered", khoaluan: khoaluan[0] });
      } catch (error) {
        console.error("Error registering thesis:", error);
        res.status(500).json({ message: "Error registering thesis" });
      }
    }
  );

  app.get(
    "/api/giangvien/khoaluandoan",
    isAuthenticated,
    hasRole("faculty"),
    async (req: any, res: any) => {
      try {
        const khoaluan = await db
          .select()
          .from(schema.khoaluandoan)
          .where(eq(schema.khoaluandoan.giangVienHuongDanId, req.giangVien.id));
        res.json(khoaluan);
      } catch (error) {
        console.error("Error fetching theses:", error);
        res.status(500).json({ message: "Error fetching theses" });
      }
    }
  );

  // 5. Quản lý điểm (quanlydiem) - Giảng viên
  app.post(
    "/api/giangvien/quanlydiem",
    isAuthenticated,
    hasRole("faculty"),
    validateRequest(
      z.object({
        sinhVienId: z.number().int().positive(),
        monHocId: z.number().int().positive(),
        diemChuyenCan: z.number().min(0).max(10).optional(),
        diemGiuaKy: z.number().min(0).max(10).optional(),
        diemCuoiKy: z.number().min(0).max(10).optional(),
        diemTongKet: z.number().min(0).max(10).optional(),
        hocKy: z.string().max(20),
        namHoc: z.string().max(20),
      })
    ),
    async (req: any, res: any) => {
      try {
        const diem = await db
          .insert(schema.quanlydiem)
          .values(req.validatedBody);
        res.status(201).json({ message: "Grades recorded", diem: diem[0] });
      } catch (error) {
        console.error("Error recording grades:", error);
        res.status(500).json({ message: "Error recording grades" });
      }
    }
  );

  app.get(
    "/api/sinhvien/quanlydiem",
    isAuthenticated,
    hasRole("student"),
    async (req: any, res: any) => {
      try {
        const diem = await db
          .select()
          .from(schema.quanlydiem)
          .where(eq(schema.quanlydiem.sinhVienId, req.sinhVien.id));
        res.json(diem);
      } catch (error) {
        console.error("Error fetching grades:", error);
        res.status(500).json({ message: "Error fetching grades" });
      }
    }
  );

  // 6. Tài liệu giảng dạy (tailieugiangday) - Giảng viên
  app.post(
    "/api/giangvien/tailieu",
    isAuthenticated,
    hasRole("faculty"),
    upload.single("file"),
    validateRequest(
      z.object({
        monHocId: z.number().int().positive(),
        tenTaiLieu: z.string().max(200),
        moTa: z.string().optional(),
        loaiTaiLieu: z.string().max(50).optional(),
      })
    ),
    async (req: any, res: any) => {
      try {
        if (!req.file)
          return res.status(400).json({ message: "No file uploaded" });
        const data = {
          monHocId: req.validatedBody.monHocId,
          tenTaiLieu: req.validatedBody.tenTaiLieu,
          moTa: req.validatedBody.moTa,
          duongDan: path.basename(req.file.path),
          loaiTaiLieu: req.validatedBody.loaiTaiLieu,
          ngayTao: new Date(),
        };
        const tailieu = await db.insert(schema.tailieugiangday).values(data);
        res
          .status(201)
          .json({ message: "Document uploaded", tailieu: tailieu[0] });
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ message: "Error uploading document" });
      }
    }
  );

  app.get("/api/tailieu", isAuthenticated, async (req: any, res: any) => {
    try {
      const tailieu = await db.select().from(schema.tailieugiangday);
      res.json(tailieu);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Error fetching documents" });
    }
  });

  // 7. Lịch sử đăng nhập (lichsudangnhap) - Người dùng
  app.get(
    "/api/lichsudangnhap",
    isAuthenticated,
    async (req: any, res: any) => {
      try {
        const lichsu = await db
          .select()
          .from(schema.lichsudangnhap)
          .where(eq(schema.lichsudangnhap.taikhoanId, req.user.id));
        res.json(lichsu);
      } catch (error) {
        console.error("Error fetching login history:", error);
        res.status(500).json({ message: "Error fetching login history" });
      }
    }
  );

  // 8. Phân công giảng dạy (phanconggiangday) - Admin
  app.post(
    "/api/admin/phanconggiangday",
    isAuthenticated,
    hasRole("admin"),
    validateRequest(
      z.object({
        giangVienId: z.number().int().positive(),
        monHocId: z.number().int().positive(),
        hocKy: z.string().max(20),
        namHoc: z.string().max(20),
      })
    ),
    async (req: any, res: any) => {
      try {
        const data = { ngayPhanCong: new Date(), ...req.validatedBody };
        const phancong = await db.insert(schema.phanconggiangday).values(data);
        res
          .status(201)
          .json({ message: "Assignment created", phancong: phancong[0] });
      } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ message: "Error creating assignment" });
      }
    }
  );

  app.get(
    "/api/thoigiandangky",
    isAuthenticated,
    async (req: any, res: any) => {
      try {
        const currentPeriods = await db
          .select()
          .from(schema.thoigiandangky)
          .where(eq(schema.thoigiandangky.trangThai, "Hoạt động"));

        res.json(currentPeriods);
      } catch (error) {
        console.error("Error fetching registration periods:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Thêm API endpoint sau các route sẵn có

  // API endpoint để lấy danh sách học kỳ - năm học
  app.get("/api/hocky-namhoc", isAuthenticated, async (req: any, res: any) => {
    try {
      const hocKyNamHocList = await db.select().from(schema.hockyNamHoc);

      res.json(hocKyNamHocList);
    } catch (error) {
      console.error("Error fetching hocKyNamHoc list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API endpoint để kiểm tra thời gian đăng ký
  app.get(
    "/api/thoigiandangky/status",
    isAuthenticated,
    async (req: any, res: any) => {
      try {
        const { hocKy, namHoc } = req.query;

        // Nếu có học kỳ và năm học, kiểm tra cụ thể cho học kỳ đó
        if (hocKy && namHoc) {
          const thoiGianDangKy = await db
            .select()
            .from(schema.thoigiandangky)
            .where(
              and(
                eq(schema.thoigiandangky.trangThai, "Hoạt động"),
                eq(schema.thoigiandangky.hocKy, hocKy),
                eq(schema.thoigiandangky.namHoc, namHoc),
                lte(schema.thoigiandangky.thoiGianBatDau, new Date()),
                gte(schema.thoigiandangky.thoiGianKetThuc, new Date())
              )
            );

          if (thoiGianDangKy.length === 0) {
            return res.json({
              valid: false,
              message: "Ngoài thời gian đăng ký học phần cho học kỳ này",
            });
          }

          return res.json({
            valid: true,
            period: thoiGianDangKy[0],
          });
        }

        // Nếu không có tham số, kiểm tra tất cả các thời gian đăng ký đang hoạt động
        const result = await isRegistrationPeriodValid();
        res.json(result);
      } catch (error) {
        console.error("Error checking registration period:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // API đăng ký học phần với sắp lịch học tự động
  app.post(
    "/api/sinhvien/dangky-hocphan-auto",
    isAuthenticated,
    hasRole("student"),
    validateRequest(
      z.object({
        monHocId: z.number(),
      })
    ),
    async (req: any, res: any) => {
      try {
        const { monHocId } = req.validatedBody;
        const sinhVienId = req.sinhVien?.id;

        if (!sinhVienId) {
          return res
            .status(400)
            .json({ message: "Không tìm thấy thông tin sinh viên" });
        }

        // 1. Kiểm tra thời gian đăng ký
        const isValidRegistrationPeriod = await isRegistrationPeriodValid();
        if (!isValidRegistrationPeriod.valid) {
          return res
            .status(403)
            .json({ message: isValidRegistrationPeriod.message });
        }

        // 2. Kiểm tra môn học có tồn tại không
        const monHoc = await storage.getMonHoc(monHocId);
        if (!monHoc) {
          return res.status(404).json({ message: "Không tìm thấy môn học" });
        }

        // 3. Kiểm tra điều kiện tiên quyết
        if (monHoc.monHocTienQuyet) {
          const prerequisitePassed = await checkPrerequisitePassed(
            sinhVienId,
            monHoc.monHocTienQuyet
          );
          if (!prerequisitePassed) {
            return res
              .status(403)
              .json({ message: "Chưa hoàn thành môn học tiên quyết" });
          }
        }

        // 4. Lấy học kỳ hiện tại
        const currentHocKy = await storage.getCurrentHocKyNamHoc();
        if (!currentHocKy) {
          return res
            .status(400)
            .json({ message: "Không tìm thấy học kỳ hiện tại" });
        }

        // 5. Kiểm tra chi tiết môn học
        const chiTietMonHoc = await storage.getChiTietMonHoc(monHocId);
        if (!chiTietMonHoc) {
          return res
            .status(404)
            .json({ message: "Không tìm thấy chi tiết môn học" });
        }

        // 6. Lấy danh sách tuần học trong học kỳ
        const danhSachTuan = await storage.getTuanHocByHocKy(currentHocKy.id);

        if (!danhSachTuan.length) {
          return res
            .status(400)
            .json({ message: "Chưa thiết lập tuần học cho học kỳ này" });
        }

        // 7. Đăng ký học phần
        const dangKy = await storage.createDangKyHocPhan({
          sinhVienId,
          monHocId,
          hocKy: currentHocKy.hocKy,
          namHoc: currentHocKy.namHoc,
          ngayDangKy: new Date(),
          trangThai: "Đăng ký",
        });

        // 8. Sắp xếp lịch học tự động
        const scheduleResult = await generateSchedule(
          sinhVienId,
          monHocId,
          chiTietMonHoc.soTietLyThuyet,
          chiTietMonHoc.soTietThucHanh,
          currentHocKy.hocKy,
          currentHocKy.namHoc
        );

        if (!scheduleResult.length) {
          // Nếu không sắp xếp được lịch, hủy đăng ký
          await db
            .delete(schema.dangkyhocphan)
            .where(eq(schema.dangkyhocphan.id, dangKy.id));
          return res
            .status(400)
            .json({ message: "Không thể sắp xếp lịch học cho môn này" });
        }

        // 9. Tạo các bản ghi lịch học
        const lichHocCreated = [];
        for (const schedule of scheduleResult) {
          const lichHoc = await storage.createLichHoc({
            sinhVienId,
            lichHocKhaDungId: 0, // Sẽ cập nhật sau khi có thông tin đầy đủ
            monHocId,
            phongHoc: schedule.phongHoc,
            thu: schedule.thu as any,
            tietBatDau: schedule.tietBatDau,
            soTiet: schedule.soTiet,
            hocKy: currentHocKy.hocKy,
            namHoc: currentHocKy.namHoc,
            buoiHoc: getBuoiHoc(schedule.tietBatDau),
            loaiTiet: schedule.loaiTiet,
          });

          lichHocCreated.push(lichHoc);

          // 10. Phân bổ kế hoạch giảng dạy theo tuần
          const soTuanHoc = danhSachTuan.filter(
            (tuan) => tuan.trangThai === "Học"
          ).length;
          const tietPerWeek = Math.max(
            1,
            Math.ceil(schedule.soTiet / soTuanHoc)
          );
          let remainingTiet = schedule.soTiet;

          for (const tuan of danhSachTuan) {
            if (tuan.trangThai !== "Học" || remainingTiet <= 0) continue;

            const tietCount = Math.min(tietPerWeek, remainingTiet);
            const loaiTiet =
              schedule.loaiTiet === "thucHanh" ? "thucHanh" : "lyThuyet";

            await storage.createKeHoachGiangDay({
              lichHocId: lichHoc.id,
              tuanHocId: tuan.id,
              loaiTiet: loaiTiet as any,
              noiDung: `${
                loaiTiet === "lyThuyet" ? "Lý thuyết" : "Thực hành"
              } - Tuần ${tuan.tuanThu}`,
            });

            remainingTiet -= tietCount;
          }

          // 11. Tạo nhóm thực hành nếu cần
          if (
            schedule.loaiTiet === "thucHanh" &&
            chiTietMonHoc.soNhomThucHanh &&
            chiTietMonHoc.soNhomThucHanh > 0
          ) {
            const nhom = await storage.createNhomThucHanh({
              lichHocId: lichHoc.id,
              tenNhom: "Nhóm 1",
              soLuongToiDa: 25,
            });

            await storage.createPhanNhomSinhVien({
              sinhVienId,
              nhomThucHanhId: nhom.id,
            });
          }
        }

        // 12. Ghi log hoạt động đăng ký
        await logSchedulingActivity(sinhVienId, monHocId, { success: true });

        return res.status(201).json({
          message: "Đăng ký môn học thành công",
          dangKy,
          lichHoc: lichHocCreated,
        });
      } catch (error) {
        console.error("Lỗi đăng ký học phần:", error);
        return res
          .status(500)
          .json({ message: "Lỗi hệ thống khi đăng ký học phần" });
      }
    }
  );

  // Hàm trợ giúp xác định buổi học dựa vào tiết bắt đầu
  function getBuoiHoc(tietBatDau: number): "Sáng" | "Chiều" | "Tối" {
    if (tietBatDau <= 5) return "Sáng";
    if (tietBatDau <= 10) return "Chiều";
    return "Tối";
  }

  const httpServer = createServer(app);
  return httpServer;
}
