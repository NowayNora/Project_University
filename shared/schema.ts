// @shared/schema.ts
import {
  mysqlTable,
  varchar,
  int,
  serial,
  text,
  timestamp,
  float,
  decimal,
  boolean,
  mysqlEnum, // Sử dụng mysqlEnum thay vì enum
  date,
  time,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sinh viên
export const sinhvien = mysqlTable("sinhvien", {
  MSSV: varchar("MSSV", { length: 10 }).primaryKey(),
  HoTen: varchar("HoTen", { length: 100 }).notNull(),
  GioiTinh: mysqlEnum("GioiTinh", ["Nam", "Nữ"]).notNull(),
  NgaySinh: date("NgaySinh").notNull(),
  NoiSinh: varchar("NoiSinh", { length: 100 }).notNull(),
  TrangThai: mysqlEnum("TrangThai", [
    "Đang học",
    "Bảo lưu",
    "Tốt nghiệp",
  ]).notNull(),
  LopHoc: varchar("LopHoc", { length: 20 }).notNull(),
  KhoaHoc: varchar("KhoaHoc", { length: 50 }).notNull(),
  BacDaoTao: mysqlEnum("BacDaoTao", [
    "Đại học",
    "Cao đẳng",
    "Thạc sĩ",
    "Tiến sĩ",
  ]).notNull(),
  LoaiHinhDaoTao: mysqlEnum("LoaiHinhDaoTao", [
    "Chính quy",
    "Liên thông",
    "Vừa học vừa làm",
  ]).notNull(),
  Nganh: varchar("Nganh", { length: 20 }).notNull(),
});

// Giảng viên
export const giangvien = mysqlTable("giangvien", {
  MaGV: varchar("MaGV", { length: 10 }).primaryKey(),
  HoTen: varchar("HoTen", { length: 100 }).notNull(),
  GioiTinh: mysqlEnum("GioiTinh", ["Nam", "Nữ"]).notNull(),
  NgaySinh: date("NgaySinh").notNull(),
  DiaChi: varchar("DiaChi", { length: 200 }).notNull(),
  Email: varchar("Email", { length: 100 }).notNull().unique(),
  SoDienThoai: varchar("SoDienThoai", { length: 15 }).notNull().unique(),
  HocVi: mysqlEnum("HocVi", [
    "Cử nhân",
    "Thạc sĩ",
    "Tiến sĩ",
    "Phó Giáo sư",
    "Giáo sư",
  ]).notNull(),
  ChucDanh: varchar("ChucDanh", { length: 100 }),
  BoMon: varchar("BoMon", { length: 100 }).notNull(),
  Khoa: varchar("Khoa", { length: 100 }).notNull(),
  TrangThai: mysqlEnum("TrangThai", [
    "Đang công tác",
    "Nghỉ hưu",
    "Nghỉ việc",
  ]).notNull(),
  NgayVaoLam: date("NgayVaoLam").notNull(),
});

// Ngành học
export const nganh = mysqlTable("nganh", {
  MaNganh: varchar("MaNganh", { length: 20 }).primaryKey(),
  TenNganh: varchar("TenNganh", { length: 100 }).notNull().unique(),
  Khoa: varchar("Khoa", { length: 100 }).notNull(),
});

// Môn học
export const monhoc = mysqlTable("monhoc", {
  MaMonHoc: varchar("MaMonHoc", { length: 12 }).primaryKey(),
  TenMonHoc: varchar("TenMonHoc", { length: 200 }).notNull(),
  SoTinChi: int("SoTinChi").notNull(),
  ThuocNganh: varchar("ThuocNganh", { length: 100 }).notNull(),
});

// Lớp học
export const lop = mysqlTable("lop", {
  MaLop: varchar("MaLop", { length: 20 }).primaryKey(),
  TenLop: varchar("TenLop", { length: 100 }).notNull(),
  NienKhoa: varchar("NienKhoa", { length: 20 }).notNull(),
});

// Đăng ký học phần
export const dangkyhocphan = mysqlTable("dangkyhocphan", {
  ID: serial("ID").primaryKey(),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 20 }).notNull(),
  NgayDangKy: date("NgayDangKy").notNull(),
  TrangThaiDangKy: varchar("TrangThaiDangKy", { length: 50 }).notNull(),
});

// Đề thi
export const dethi = mysqlTable("dethi", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  TenDeThi: varchar("TenDeThi", { length: 200 }).notNull(),
  LoaiDeThi: varchar("LoaiDeThi", { length: 50 }).notNull(),
  ThoiGianLamBai: int("ThoiGianLamBai").notNull(),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 20 }).notNull(),
  NgayTao: date("NgayTao").notNull(),
  DuongDanFile: varchar("DuongDanFile", { length: 255 }).notNull(),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Điểm danh
export const diemdanh = mysqlTable("diemdanh", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  MaLop: varchar("MaLop", { length: 20 })
    .notNull()
    .references(() => lop.MaLop),
  NgayDiemDanh: date("NgayDiemDanh").notNull(),
  TrangThai: mysqlEnum("TrangThai", [
    "Có mặt",
    "Vắng có phép",
    "Vắng không phép",
    "Đi muộn",
  ]).notNull(),
  GhiChu: varchar("GhiChu", { length: 200 }),
});

// Kết quả học tập
export const ketquahoctap = mysqlTable("ketquahoctap", {
  ID: serial("ID").primaryKey(),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  DiemSo: float("DiemSo"),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 20 }).notNull(),
  TrangThaiHoc: varchar("TrangThaiHoc", { length: 50 }).notNull(),
});

// Khóa luận đồ án
export const khoaluandoan = mysqlTable("khoaluandoan", {
  ID: serial("ID").primaryKey(),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  TenDeTai: varchar("TenDeTai", { length: 500 }).notNull(),
  LoaiDeTai: varchar("LoaiDeTai", { length: 50 }).notNull(),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 20 }).notNull(),
  NgayBatDau: date("NgayBatDau").notNull(),
  NgayKetThuc: date("NgayKetThuc").notNull(),
  MoTa: varchar("MoTa", { length: 1000 }),
  DiemSo: float("DiemSo"),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Lịch giảng dạy
export const lichgiangday = mysqlTable("lichgiangday", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  MaLop: varchar("MaLop", { length: 20 })
    .notNull()
    .references(() => lop.MaLop),
  NgayDay: date("NgayDay").notNull(),
  GioBatDau: time("GioBatDau").notNull(),
  GioKetThuc: time("GioKetThuc").notNull(),
  PhongHoc: varchar("PhongHoc", { length: 50 }).notNull(),
  NoiDungBaiGiang: varchar("NoiDungBaiGiang", { length: 500 }),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Lịch học
export const lichhoc = mysqlTable("lichhoc", {
  ID: serial("ID").primaryKey(),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  NgayHoc: date("NgayHoc").notNull(),
  GioBatDau: time("GioBatDau").notNull(),
  GioKetThuc: time("GioKetThuc").notNull(),
  PhongHoc: varchar("PhongHoc", { length: 50 }).notNull(),
  GiangVien: varchar("GiangVien", { length: 100 }).notNull(),
});

// Nghiên cứu khoa học
export const nghiencuukhoahoc = mysqlTable("nghiencuukhoahoc", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  TenDeTai: varchar("TenDeTai", { length: 500 }).notNull(),
  CapDeTai: varchar("CapDeTai", { length: 100 }).notNull(),
  KinhPhi: decimal("KinhPhi", { precision: 10, scale: 2 }).notNull(),
  NgayBatDau: date("NgayBatDau").notNull(),
  NgayKetThuc: date("NgayKetThuc").notNull(),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
  KetQuaNghiemThu: varchar("KetQuaNghiemThu", { length: 50 }),
});

// Phân công giảng dạy
export const phanconggiangday = mysqlTable("phanconggiangday", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  MaLop: varchar("MaLop", { length: 20 })
    .notNull()
    .references(() => lop.MaLop),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 20 }).notNull(),
  SoTietLyThuyet: int("SoTietLyThuyet").notNull(),
  SoTietThucHanh: int("SoTietThucHanh").notNull(),
  GhiChu: varchar("GhiChu", { length: 200 }),
});

// Quản lý điểm
export const quanlydiem = mysqlTable("quanlydiem", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 9 }).notNull(),
  DiemChuyenCan: decimal("DiemChuyenCan", { precision: 4, scale: 2 }),
  DiemGiuaKy: decimal("DiemGiuaKy", { precision: 4, scale: 2 }),
  DiemThucHanh: decimal("DiemThucHanh", { precision: 4, scale: 2 }),
  DiemCuoiKy: decimal("DiemCuoiKy", { precision: 4, scale: 2 }),
  DiemTongKet: decimal("DiemTongKet", { precision: 4, scale: 2 }),
  NgayNhap: date("NgayNhap").notNull(),
  NgayCapNhatCuoi: date("NgayCapNhatCuoi"),
  GhiChu: varchar("GhiChu", { length: 200 }),
});

// Tài liệu giảng dạy
export const tailieugiangday = mysqlTable("tailieugiangday", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  MaMonHoc: varchar("MaMonHoc", { length: 12 })
    .notNull()
    .references(() => monhoc.MaMonHoc),
  TenTaiLieu: varchar("TenTaiLieu", { length: 200 }).notNull(),
  MoTa: varchar("MoTa", { length: 500 }),
  DuongDanFile: varchar("DuongDanFile", { length: 255 }).notNull(),
  NgayTao: date("NgayTao").notNull(),
  NgayCapNhat: date("NgayCapNhat"),
  LoaiTaiLieu: varchar("LoaiTaiLieu", { length: 50 }).notNull(),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Thanh toán học phí
export const thanhtoanhocphi = mysqlTable("thanhtoanhocphi", {
  ID: serial("ID").primaryKey(),
  MSSV: varchar("MSSV", { length: 10 })
    .notNull()
    .references(() => sinhvien.MSSV),
  SoTien: decimal("SoTien", { precision: 10, scale: 2 }).notNull(),
  NgayThanhToan: date("NgayThanhToan").notNull(),
  TrangThaiThanhToan: mysqlEnum("TrangThaiThanhToan", [
    "Chưa thanh toán",
    "Đã thanh toán",
  ]).notNull(),
  HocKy: int("HocKy").notNull(),
  NamHoc: varchar("NamHoc", { length: 9 }).notNull(),
  GhiChu: varchar("GhiChu", { length: 200 }),
});

// Thành viên nghiên cứu
export const thanhviennghiencuu = mysqlTable("thanhviennghiencuu", {
  ID: serial("ID").primaryKey(),
  MaNghienCuu: int("MaNghienCuu")
    .notNull()
    .references(() => nghiencuukhoahoc.ID),
  MaGV: varchar("MaGV", { length: 10 }).references(() => giangvien.MaGV),
  MSSV: varchar("MSSV", { length: 10 }).references(() => sinhvien.MSSV),
  VaiTro: varchar("VaiTro", { length: 100 }).notNull(),
});

// Thông báo
export const thongbao = mysqlTable("thongbao", {
  ID: serial("ID").primaryKey(),
  TieuDe: varchar("TieuDe", { length: 200 }).notNull(),
  NoiDung: varchar("NoiDung", { length: 2000 }).notNull(),
  NgayThongBao: date("NgayThongBao").notNull(),
  DoiTuong: varchar("DoiTuong", { length: 100 }).notNull(),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Thông báo giảng viên
export const thongbaogiangvien = mysqlTable("thongbaogiangvien", {
  ID: serial("ID").primaryKey(),
  MaGV: varchar("MaGV", { length: 10 })
    .notNull()
    .references(() => giangvien.MaGV),
  TieuDe: varchar("TieuDe", { length: 200 }).notNull(),
  NoiDung: varchar("NoiDung", { length: 2000 }).notNull(),
  NgayThongBao: date("NgayThongBao").notNull(),
  DoiTuong: varchar("DoiTuong", { length: 255 }).notNull(),
  TrangThai: varchar("TrangThai", { length: 50 }).notNull(),
});

// Create insert schemas
export const insertSinhVienSchema = createInsertSchema(sinhvien);
export const insertGiangVienSchema = createInsertSchema(giangvien);
export const insertNganhSchema = createInsertSchema(nganh);
export const insertMonHocSchema = createInsertSchema(monhoc);
export const insertLopSchema = createInsertSchema(lop);
export const insertDangKyHocPhanSchema = createInsertSchema(dangkyhocphan);
export const insertDeThiSchema = createInsertSchema(dethi);
export const insertDiemDanhSchema = createInsertSchema(diemdanh);
export const insertKetQuaHocTapSchema = createInsertSchema(ketquahoctap);
export const insertKhoaLuanDoAnSchema = createInsertSchema(khoaluandoan);
export const insertLichGiangDaySchema = createInsertSchema(lichgiangday);
export const insertLichHocSchema = createInsertSchema(lichhoc);
export const insertNghienCuuKhoaHocSchema =
  createInsertSchema(nghiencuukhoahoc);
export const insertPhanCongGiangDaySchema =
  createInsertSchema(phanconggiangday);
export const insertQuanLyDiemSchema = createInsertSchema(quanlydiem);
export const insertTaiLieuGiangDaySchema = createInsertSchema(tailieugiangday);
export const insertThanhToanHocPhiSchema = createInsertSchema(thanhtoanhocphi);
export const insertThanhVienNghienCuuSchema =
  createInsertSchema(thanhviennghiencuu);
export const insertThongBaoSchema = createInsertSchema(thongbao);
export const insertThongBaoGiangVienSchema =
  createInsertSchema(thongbaogiangvien);

// Define types
export type SinhVien = typeof sinhvien.$inferSelect;
export type InsertSinhVien = z.infer<typeof insertSinhVienSchema>;

export type GiangVien = typeof giangvien.$inferSelect;
export type InsertGiangVien = z.infer<typeof insertGiangVienSchema>;

export type Nganh = typeof nganh.$inferSelect;
export type InsertNganh = z.infer<typeof insertNganhSchema>;

export type MonHoc = typeof monhoc.$inferSelect;
export type InsertMonHoc = z.infer<typeof insertMonHocSchema>;

export type Lop = typeof lop.$inferSelect;
export type InsertLop = z.infer<typeof insertLopSchema>;

export type DangKyHocPhan = typeof dangkyhocphan.$inferSelect;
export type InsertDangKyHocPhan = z.infer<typeof insertDangKyHocPhanSchema>;

export type DeThi = typeof dethi.$inferSelect;
export type InsertDeThi = z.infer<typeof insertDeThiSchema>;

export type DiemDanh = typeof diemdanh.$inferSelect;
export type InsertDiemDanh = z.infer<typeof insertDiemDanhSchema>;

export type KetQuaHocTap = typeof ketquahoctap.$inferSelect;
export type InsertKetQuaHocTap = z.infer<typeof insertKetQuaHocTapSchema>;

export type KhoaLuanDoAn = typeof khoaluandoan.$inferSelect;
export type InsertKhoaLuanDoAn = z.infer<typeof insertKhoaLuanDoAnSchema>;

export type LichGiangDay = typeof lichgiangday.$inferSelect;
export type InsertLichGiangDay = z.infer<typeof insertLichGiangDaySchema>;

export type LichHoc = typeof lichhoc.$inferSelect;
export type InsertLichHoc = z.infer<typeof insertLichHocSchema>;

export type NghienCuuKhoaHoc = typeof nghiencuukhoahoc.$inferSelect;
export type InsertNghienCuuKhoaHoc = z.infer<
  typeof insertNghienCuuKhoaHocSchema
>;

export type PhanCongGiangDay = typeof phanconggiangday.$inferSelect;
export type InsertPhanCongGiangDay = z.infer<
  typeof insertPhanCongGiangDaySchema
>;

export type QuanLyDiem = typeof quanlydiem.$inferSelect;
export type InsertQuanLyDiem = z.infer<typeof insertQuanLyDiemSchema>;

export type TaiLieuGiangDay = typeof tailieugiangday.$inferSelect;
export type InsertTaiLieuGiangDay = z.infer<typeof insertTaiLieuGiangDaySchema>;

export type ThanhToanHocPhi = typeof thanhtoanhocphi.$inferSelect;
export type InsertThanhToanHocPhi = z.infer<typeof insertThanhToanHocPhiSchema>;

export type ThanhVienNghienCuu = typeof thanhviennghiencuu.$inferSelect;
export type InsertThanhVienNghienCuu = z.infer<
  typeof insertThanhVienNghienCuuSchema
>;

export type ThongBao = typeof thongbao.$inferSelect;
export type InsertThongBao = z.infer<typeof insertThongBaoSchema>;

export type ThongBaoGiangVien = typeof thongbaogiangvien.$inferSelect;
export type InsertThongBaoGiangVien = z.infer<
  typeof insertThongBaoGiangVienSchema
>;
