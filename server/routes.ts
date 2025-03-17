import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq, and, inArray, not, ne, sql } from "drizzle-orm";
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
    lop?: schema.Lop; // Thêm để lưu thông tin lớp
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

          const proposedSchedules = await generateSchedule(
            sinhVien.id,
            lichKhaDung.monHocId ?? 0,
            remainingLyThuyet,
            remainingThucHanh
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
        const conflictingLich = await db
          .select()
          .from(schema.lichhoc)
          .where(
            and(
              eq(schema.lichhoc.sinhVienId, sinhVien.id),
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
    remainingThucHanh: number
  ): Promise<
    Array<{
      thu: string;
      tietBatDau: number;
      soTiet: number;
      phongHoc: string;
      loaiTiet: string;
    }>
  > {
    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];
    const periodsPerDay = 12;
    const maxSoTietPerSession = 2;

    const proposedSchedules: Array<{
      thu: string;
      tietBatDau: number;
      soTiet: number;
      phongHoc: string;
      loaiTiet: string;
    }> = [];

    let remainingLyThuyetToSchedule = Math.min(
      remainingLyThuyet,
      maxSoTietPerSession
    );
    let remainingThucHanhToSchedule = Math.min(
      remainingThucHanh,
      maxSoTietPerSession
    );

    for (const thu of days) {
      if (remainingLyThuyetToSchedule <= 0 && remainingThucHanhToSchedule <= 0)
        break;

      for (
        let tietBatDau = 1;
        tietBatDau <= periodsPerDay - maxSoTietPerSession + 1;
        tietBatDau++
      ) {
        if (remainingLyThuyetToSchedule > 0) {
          const conflict = await db
            .select()
            .from(schema.lichhoc)
            .where(
              and(
                eq(schema.lichhoc.sinhVienId, sinhVienId),
                eq(
                  schema.lichhoc.thu,
                  thu as
                    | "Thứ 2"
                    | "Thứ 3"
                    | "Thứ 4"
                    | "Thứ 5"
                    | "Thứ 6"
                    | "Thứ 7"
                    | "Chủ nhật"
                ),
                sql`${schema.lichhoc.tietBatDau} <= ${
                  tietBatDau + maxSoTietPerSession - 1
                } AND ${schema.lichhoc.tietBatDau} + ${
                  schema.lichhoc.soTiet
                } - 1 >= ${tietBatDau}`
              )
            );

          if (conflict.length === 0) {
            const phongHoc = `PH${thu.charAt(thu.length - 1)}01`;
            const roomConflict = await db
              .select()
              .from(schema.lichhoc)
              .where(
                and(
                  eq(schema.lichhoc.phongHoc, phongHoc),
                  eq(
                    schema.lichhoc.thu,
                    thu as
                      | "Thứ 2"
                      | "Thứ 3"
                      | "Thứ 4"
                      | "Thứ 5"
                      | "Thứ 6"
                      | "Thứ 7"
                      | "Chủ nhật"
                  ),
                  sql`${schema.lichhoc.tietBatDau} <= ${
                    tietBatDau + maxSoTietPerSession - 1
                  } AND ${schema.lichhoc.tietBatDau} + ${
                    schema.lichhoc.soTiet
                  } - 1 >= ${tietBatDau}`
                )
              );

            if (roomConflict.length === 0) {
              proposedSchedules.push({
                thu,
                tietBatDau,
                soTiet: maxSoTietPerSession,
                phongHoc,
                loaiTiet: "lyThuyet",
              });
              remainingLyThuyetToSchedule -= maxSoTietPerSession;
            }
          }
        }

        if (remainingThucHanhToSchedule > 0) {
          const conflict = await db
            .select()
            .from(schema.lichhoc)
            .where(
              and(
                eq(schema.lichhoc.sinhVienId, sinhVienId),
                eq(
                  schema.lichhoc.thu,
                  thu as
                    | "Thứ 2"
                    | "Thứ 3"
                    | "Thứ 4"
                    | "Thứ 5"
                    | "Thứ 6"
                    | "Thứ 7"
                    | "Chủ nhật"
                ),
                sql`${schema.lichhoc.tietBatDau} <= ${
                  tietBatDau + maxSoTietPerSession - 1
                } AND ${schema.lichhoc.tietBatDau} + ${
                  schema.lichhoc.soTiet
                } - 1 >= ${tietBatDau}`
              )
            );

          if (conflict.length === 0) {
            const phongHoc = `TH${thu.charAt(thu.length - 1)}01`;
            const roomConflict = await db
              .select()
              .from(schema.lichhoc)
              .where(
                and(
                  eq(schema.lichhoc.phongHoc, phongHoc),
                  eq(
                    schema.lichhoc.thu,
                    thu as
                      | "Thứ 2"
                      | "Thứ 3"
                      | "Thứ 4"
                      | "Thứ 5"
                      | "Thứ 6"
                      | "Thứ 7"
                      | "Chủ nhật"
                  ),
                  sql`${schema.lichhoc.tietBatDau} <= ${
                    tietBatDau + maxSoTietPerSession - 1
                  } AND ${schema.lichhoc.tietBatDau} + ${
                    schema.lichhoc.soTiet
                  } - 1 >= ${tietBatDau}`
                )
              );

            if (roomConflict.length === 0) {
              proposedSchedules.push({
                thu,
                tietBatDau,
                soTiet: maxSoTietPerSession,
                phongHoc,
                loaiTiet: "thucHanh",
              });
              remainingThucHanhToSchedule -= maxSoTietPerSession;
            }
          }
        }
      }
    }

    return proposedSchedules;
  }
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
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error("Error fetching schedule:", error.stack);
            res.status(500).json({
              message: "Error fetching schedule",
              error: error.message,
            });
          } else {
            console.error("Unknown error fetching schedule:", error);
            res.status(500).json({
              message: "Error fetching schedule",
              error: String(error),
            });
          }
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

    // Route lấy danh sách lớp mà giảng viên phụ trách
    getManagedClasses: app.get(
      "/api/giangvien/lophoc",
      isAuthenticated,
      hasRole("faculty"),
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          // Lấy danh sách môn học mà giảng viên được phân công
          const phanCong = await db
            .select()
            .from(schema.phanconggiangday)
            .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

          // Kiểm tra nếu không có phân công nào
          if (phanCong.length === 0) {
            return res.json([]); // Trả về mảng rỗng nếu không có lớp nào
          }

          // Lọc bỏ các monHocId null và ép kiểu thành number[]
          const monHocIds: number[] = phanCong
            .map((pc) => pc.monHocId)
            .filter((id): id is number => id !== null);

          // Nếu không còn monHocId nào sau khi lọc, trả về mảng rỗng
          if (monHocIds.length === 0) {
            return res.json([]);
          }

          // Lấy danh sách lớp liên quan đến các môn học này
          const lopHoc = await db
            .selectDistinct({ lop: schema.lop })
            .from(schema.lop)
            .innerJoin(
              schema.sinhvien,
              eq(schema.lop.id, schema.sinhvien.lopId)
            )
            .innerJoin(
              schema.lichhoc,
              eq(schema.sinhvien.id, schema.lichhoc.sinhVienId)
            )
            .where(inArray(schema.lichhoc.monHocId, monHocIds));

          const lopWithDetails = await Promise.all(
            lopHoc.map(async (item) => {
              const lop = item.lop;
              const monHocList = await db
                .select({ monHoc: schema.monhoc })
                .from(schema.monhoc)
                .innerJoin(
                  schema.lichhoc,
                  eq(schema.monhoc.id, schema.lichhoc.monHocId)
                )
                .innerJoin(
                  schema.sinhvien,
                  eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
                )
                .where(eq(schema.sinhvien.lopId, lop.id));
              const soLuongSinhVien = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.sinhvien)
                .where(eq(schema.sinhvien.lopId, lop.id))
                .then((res) => res[0].count);
              return {
                ...lop,
                monHoc: monHocList.map((m) => m.monHoc),
                soLuongSinhVien,
              };
            })
          );

          res.json(lopWithDetails);
        } catch (error) {
          console.error("Error fetching managed classes:", error);
          res.status(500).json({ message: "Error fetching managed classes" });
        }
      }
    ),

    // Route xem chi tiết một lớp
    getClassDetails: app.get(
      "/api/giangvien/lophoc/:lopId",
      isAuthenticated,
      hasRole("faculty"),
      attachClassDetails,
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          // Lấy danh sách phân công giảng dạy của giảng viên
          const phanCong = await db
            .select()
            .from(schema.phanconggiangday)
            .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

          // Kiểm tra nếu không có phân công nào
          if (phanCong.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Lọc bỏ monHocId null và ép kiểu thành number[]
          const monHocIds: number[] = phanCong
            .map((pc) => pc.monHocId)
            .filter((id): id is number => id !== null);

          // Nếu không có monHocId hợp lệ, trả về lỗi
          if (monHocIds.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Kiểm tra xem giảng viên có liên quan đến lớp này qua lịch học không
          const lichHoc = await db
            .select()
            .from(schema.lichhoc)
            .innerJoin(
              schema.sinhvien,
              eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
            )
            .where(
              and(
                eq(schema.sinhvien.lopId, req.lop.id),
                inArray(schema.lichhoc.monHocId, monHocIds)
              )
            );

          if (!lichHoc.length) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          const sinhVien = await db
            .select()
            .from(schema.sinhvien)
            .where(eq(schema.sinhvien.lopId, req.lop.id));

          const monHoc = await db
            .selectDistinct({ monHoc: schema.monhoc })
            .from(schema.monhoc)
            .innerJoin(
              schema.lichhoc,
              eq(schema.monhoc.id, schema.lichhoc.monHocId)
            )
            .innerJoin(
              schema.sinhvien,
              eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
            )
            .where(eq(schema.sinhvien.lopId, req.lop.id));

          res.json({
            lop: req.lop,
            monHoc: monHoc.map((m) => m.monHoc),
            sinhVien,
            soLuongSinhVien: sinhVien.length,
          });
        } catch (error) {
          console.error("Error fetching class details:", error);
          res.status(500).json({ message: "Error fetching class details" });
        }
      }
    ),

    // Route thêm sinh viên vào lớp
    addStudentToClass: app.post(
      "/api/giangvien/lophoc/:lopId/sinhvien",
      isAuthenticated,
      hasRole("faculty"),
      attachClassDetails,
      validateRequest(
        z.object({
          sinhVienId: z.number().int().positive("Invalid student ID"),
        })
      ),
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          // Lấy danh sách phân công giảng dạy của giảng viên
          const phanCong = await db
            .select()
            .from(schema.phanconggiangday)
            .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

          // Kiểm tra nếu không có phân công nào
          if (phanCong.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Lọc bỏ monHocId null và ép kiểu thành number[]
          const monHocIds: number[] = phanCong
            .map((pc) => pc.monHocId)
            .filter((id): id is number => id !== null);

          // Nếu không có monHocId hợp lệ, trả về lỗi
          if (monHocIds.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Kiểm tra quyền quản lý lớp qua lịch học
          const lichHoc = await db
            .select()
            .from(schema.lichhoc)
            .innerJoin(
              schema.sinhvien,
              eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
            )
            .where(
              and(
                eq(schema.sinhvien.lopId, req.lop.id),
                inArray(schema.lichhoc.monHocId, monHocIds)
              )
            );

          if (!lichHoc.length) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          const { sinhVienId } = req.validatedBody;
          const sinhVien = await db
            .select()
            .from(schema.sinhvien)
            .where(eq(schema.sinhvien.id, sinhVienId))
            .then((res) => res[0]);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          // Kiểm tra xem sinh viên đã trong lớp chưa
          if (sinhVien.lopId === req.lop.id) {
            return res
              .status(400)
              .json({ message: "Student is already in this class" });
          }

          // Cập nhật lớp cho sinh viên
          await db
            .update(schema.sinhvien)
            .set({ lopId: req.lop.id })
            .where(eq(schema.sinhvien.id, sinhVienId));

          const updatedSinhVien = await db
            .select()
            .from(schema.sinhvien)
            .where(eq(schema.sinhvien.id, sinhVienId))
            .then((res) => res[0]);

          res.status(200).json({
            message: "Student added to class successfully",
            sinhVien: updatedSinhVien,
          });
        } catch (error) {
          console.error("Error adding student to class:", error);
          res.status(500).json({ message: "Error adding student to class" });
        }
      }
    ),

    // Route xóa sinh viên khỏi lớp
    removeStudentFromClass: app.delete(
      "/api/giangvien/lophoc/:lopId/sinhvien/:sinhVienId",
      isAuthenticated,
      hasRole("faculty"),
      attachClassDetails,
      async (req: any, res: any) => {
        try {
          const giangVien = await storage.getGiangVienByUserId(req.user.id);
          if (!giangVien) {
            return res.status(404).json({ message: "Faculty not found" });
          }

          // Lấy danh sách phân công giảng dạy của giảng viên
          const phanCong = await db
            .select()
            .from(schema.phanconggiangday)
            .where(eq(schema.phanconggiangday.giangVienId, giangVien.id));

          // Kiểm tra nếu không có phân công nào
          if (phanCong.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Lọc bỏ monHocId null và ép kiểu thành number[]
          const monHocIds: number[] = phanCong
            .map((pc) => pc.monHocId)
            .filter((id): id is number => id !== null);

          // Nếu không có monHocId hợp lệ, trả về lỗi
          if (monHocIds.length === 0) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          // Kiểm tra quyền quản lý lớp qua lịch học
          const lichHoc = await db
            .select()
            .from(schema.lichhoc)
            .innerJoin(
              schema.sinhvien,
              eq(schema.lichhoc.sinhVienId, schema.sinhvien.id)
            )
            .where(
              and(
                eq(schema.sinhvien.lopId, req.lop.id),
                inArray(schema.lichhoc.monHocId, monHocIds)
              )
            );

          if (!lichHoc.length) {
            return res
              .status(403)
              .json({ message: "You are not assigned to this class" });
          }

          const { sinhVienId } = req.params;
          const sinhVien = await db
            .select()
            .from(schema.sinhvien)
            .where(eq(schema.sinhvien.id, parseInt(sinhVienId)))
            .then((res) => res[0]);
          if (!sinhVien) {
            return res.status(404).json({ message: "Student not found" });
          }

          // Kiểm tra xem sinh viên có trong lớp không
          if (sinhVien.lopId !== req.lop.id) {
            return res
              .status(400)
              .json({ message: "Student is not in this class" });
          }

          // Xóa sinh viên khỏi lớp bằng cách đặt lopId về null
          await db
            .update(schema.sinhvien)
            .set({ lopId: null })
            .where(eq(schema.sinhvien.id, parseInt(sinhVienId)));

          const updatedSinhVien = await db
            .select()
            .from(schema.sinhvien)
            .where(eq(schema.sinhvien.id, parseInt(sinhVienId)))
            .then((res) => res[0]);

          res.status(200).json({
            message: "Student removed from class successfully",
            sinhVien: updatedSinhVien,
          });
        } catch (error) {
          console.error("Error removing student from class:", error);
          res
            .status(500)
            .json({ message: "Error removing student from class" });
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

  const httpServer = createServer(app);
  return httpServer;
}
