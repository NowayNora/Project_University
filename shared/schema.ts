// @shared/schema.ts
import {
  mysqlTable,
  varchar,
  int,
  serial,
  text,
  float,
  decimal,
  timestamp,
  mysqlEnum,
  date,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bảng cauhinh_taikhoan
export const cauhinhTaikhoan = mysqlTable("cauhinh_taikhoan", {
  id: serial("id").primaryKey(),
  taikhoanId: int("taikhoan_id")
    .notNull()
    .references(() => taikhoan.id),
  xacThucHaiYeuTo: boolean("xac_thuc_hai_yeu_to").default(false),
  soDienThoaiXacThuc: varchar("so_dien_thoai_xac_thuc", { length: 20 }),
  emailXacThuc: varchar("email_xac_thuc", { length: 100 }),
  khoaTaiKhoanSauDangNhapThatBai: int(
    "khoa_tai_khoan_sau_dang_nhap_that_bai"
  ).default(5),
});

// Bảng dangkyhocphan
export const dangkyhocphan = mysqlTable("dangkyhocphan", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
  ngayDangKy: datetime("ngay_dang_ky"), // Sửa ở đây
  trangThai: mysqlEnum("trang_thai", ["Đăng ký", "Đã duyệt", "Hủy"]).default(
    "Đăng ký"
  ),
});

// Bảng dethi
export const dethi = mysqlTable("dethi", {
  id: serial("id").primaryKey(),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  loaiDe: mysqlEnum("loai_de", ["Giữa kỳ", "Cuối kỳ", "Bảo vệ"]),
  namHoc: varchar("nam_hoc", { length: 20 }),
  hocKy: varchar("hoc_ky", { length: 20 }),
  thoiGianLam: int("thoi_gian_lam"),
  moTa: text("mo_ta"),
});

// Bảng diemdanh
export const diemdanh = mysqlTable("diemdanh", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  ngayDiemDanh: date("ngay_diem_danh"),
  trangThai: mysqlEnum("trang_thai", ["Có mặt", "Vắng mặt", "Đi muộn"]),
  ghiChu: text("ghi_chu"),
});

// Bảng giangvien
export const giangvien = mysqlTable("giangvien", {
  id: serial("id").primaryKey(),
  maGv: varchar("ma_gv", { length: 10 }).notNull().unique(),
  hoTen: varchar("ho_ten", { length: 100 }).notNull(),
  ngaySinh: date("ngay_sinh"),
  gioiTinh: mysqlEnum("gioi_tinh", ["Nam", "Nữ", "Khác"]),
  diaChi: text("dia_chi"),
  email: varchar("email", { length: 100 }),
  soDienThoai: varchar("so_dien_thoai", { length: 20 }),
  chuyenMon: varchar("chuyen_mon", { length: 100 }),
  hocVi: varchar("hoc_vi", { length: 50 }),
  trangThai: mysqlEnum("trang_thai", [
    "Đang dạy",
    "Nghỉ phép",
    "Đã nghỉ việc",
  ]).default("Đang dạy"),
});

// Bảng ketquahoctap
export const ketquahoctap = mysqlTable("ketquahoctap", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
  diemTrungBinh: float("diem_trung_binh"),
  tongTinChiDat: int("tong_tin_chi_dat"),
  trangThai: mysqlEnum("trang_thai", ["Đạt", "Không đạt"]),
});

// Bảng khoaluandoan
export const khoaluandoan = mysqlTable("khoaluandoan", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  giangVienHuongDanId: int("giang_vien_huong_dan_id").references(
    () => giangvien.id
  ),
  tenDeTai: varchar("ten_de_tai", { length: 200 }).notNull(),
  moTa: text("mo_ta"),
  thoiGianBatDau: date("thoi_gian_bat_dau"),
  thoiGianKetThuc: date("thoi_gian_ket_thuc"),
  diemSo: float("diem_so"),
  trangThai: mysqlEnum("trang_thai", [
    "Đang thực hiện",
    "Đã bảo vệ",
    "Chưa hoàn thành",
  ]),
});

// Bảng lichgiangday
export const lichgiangday = mysqlTable("lichgiangday", {
  id: serial("id").primaryKey(),
  phanCongId: int("phan_cong_id").references(() => phanconggiangday.id),
  phongHoc: varchar("phong_hoc", { length: 20 }),
  thu: mysqlEnum("thu", [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ]),
  tietBatDau: int("tiet_bat_dau"),
  soTiet: int("so_tiet"),
});

// Bảng lichhoc
export const lichhoc = mysqlTable("lichhoc", {
  id: serial("id").primaryKey(),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  phongHoc: varchar("phong_hoc", { length: 20 }),
  thu: mysqlEnum("thu", [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ]),
  tietBatDau: int("tiet_bat_dau"),
  soTiet: int("so_tiet"),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
});

// Bảng lichsudangnhap
export const lichsudangnhap = mysqlTable("lichsudangnhap", {
  id: serial("id").primaryKey(),
  taikhoanId: int("taikhoan_id")
    .notNull()
    .references(() => taikhoan.id),
  thoiGian: datetime("thoi_gian"), // Sửa ở đây
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  trangThai: mysqlEnum("trang_thai", ["Thành công", "Thất bại"]),
});

// Bảng lop
export const lop = mysqlTable("lop", {
  id: serial("id").primaryKey(),
  maLop: varchar("ma_lop", { length: 10 }).notNull().unique(),
  tenLop: varchar("ten_lop", { length: 50 }).notNull(),
  nganhId: int("nganh_id").references(() => nganh.id),
  namNhapHoc: int("nam_nhap_hoc"),
});

// Bảng monhoc
export const monhoc = mysqlTable("monhoc", {
  id: serial("id").primaryKey(),
  maMon: varchar("ma_mon", { length: 10 }).notNull().unique(),
  tenMon: varchar("ten_mon", { length: 100 }).notNull(),
  soTinChi: int("so_tin_chi").notNull(),
  moTa: text("mo_ta"),
});

// Bảng nganh
export const nganh = mysqlTable("nganh", {
  id: serial("id").primaryKey(),
  maNganh: varchar("ma_nganh", { length: 10 }).notNull().unique(),
  tenNganh: varchar("ten_nganh", { length: 100 }).notNull(),
  moTa: text("mo_ta"),
});

// Bảng nghiencuukhoahoc
export const nghiencuukhoahoc = mysqlTable("nghiencuukhoahoc", {
  id: serial("id").primaryKey(),
  tenDeTai: varchar("ten_de_tai", { length: 200 }).notNull(),
  moTa: text("mo_ta"),
  thoiGianBatDau: date("thoi_gian_bat_dau"),
  thoiGianKetThuc: date("thoi_gian_ket_thuc"),
  trangThai: mysqlEnum("trang_thai", [
    "Đang thực hiện",
    "Đã hoàn thành",
    "Đã hủy",
  ]),
  kinhPhi: decimal("kinh_phi", { precision: 10, scale: 2 }),
  ketQua: text("ket_qua"),
});

// Bảng phanconggiangday
export const phanconggiangday = mysqlTable("phanconggiangday", {
  id: serial("id").primaryKey(),
  giangVienId: int("giang_vien_id").references(() => giangvien.id),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
  ngayPhanCong: datetime("ngay_phan_cong"),
});

// Bảng phien_lam_viec
export const phienLamViec = mysqlTable("phien_lam_viec", {
  id: serial("id").primaryKey(),
  taikhoanId: int("taikhoan_id")
    .notNull()
    .references(() => taikhoan.id),
  sessionToken: varchar("session_token", { length: 100 }).notNull(),
  thoiGianBatDau: datetime("thoi_gian_bat_dau"),
  thoiGianHetHan: datetime("thoi_gian_het_han"),
  ipAddress: varchar("ip_address", { length: 50 }),
  trangThai: mysqlEnum("trang_thai", ["Hoạt động", "Đã kết thúc", "Hết hạn"]),
});

// Bảng quanlydiem
export const quanlydiem = mysqlTable("quanlydiem", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  diemChuyenCan: float("diem_chuyen_can"),
  diemGiuaKy: float("diem_giua_ky"),
  diemCuoiKy: float("diem_cuoi_ky"),
  diemTongKet: float("diem_tong_ket"),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
});

// Bảng quyenhan
export const quyenhan = mysqlTable("quyenhan", {
  id: serial("id").primaryKey(),
  tenQuyen: varchar("ten_quyen", { length: 50 }).notNull(),
  moTa: text("mo_ta"),
});

// Bảng sinhvien
export const sinhvien = mysqlTable("sinhvien", {
  id: serial("id").primaryKey(),
  maSv: varchar("ma_sv", { length: 10 }).notNull().unique(),
  hoTen: varchar("ho_ten", { length: 100 }).notNull(),
  ngaySinh: date("ngay_sinh"),
  gioiTinh: mysqlEnum("gioi_tinh", ["Nam", "Nữ", "Khác"]),
  diaChi: text("dia_chi"),
  email: varchar("email", { length: 100 }),
  soDienThoai: varchar("so_dien_thoai", { length: 20 }),
  lopId: int("lop_id").references(() => lop.id),
  trangThai: mysqlEnum("trang_thai", [
    "Đang học",
    "Đã tốt nghiệp",
    "Nghỉ học",
    "Đình chỉ",
  ]).default("Đang học"),
});

// Bảng taikhoan
export const taikhoan = mysqlTable("taikhoan", {
  id: serial("id").primaryKey(),
  tenDangNhap: varchar("ten_dang_nhap", { length: 50 }).notNull().unique(),
  matKhauHash: varchar("mat_khau_hash", { length: 256 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  quyenHanId: int("quyen_han_id")
    .notNull()
    .references(() => quyenhan.id),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  giangVienId: int("giang_vien_id").references(() => giangvien.id),
  ngayTao: datetime("ngay_tao"),
  lanDangNhapCuoi: datetime("lan_dang_nhap_cuoi"),
  trangThai: mysqlEnum("trang_thai", [
    "Hoạt động",
    "Khóa",
    "Chờ xác nhận",
  ]).default("Hoạt động"),
  tokenResetPassword: varchar("token_reset_password", { length: 100 }),
  tokenExpiry: datetime("token_expiry"),
});

// Bảng tailieugiangday
export const tailieugiangday = mysqlTable("tailieugiangday", {
  id: serial("id").primaryKey(),
  monHocId: int("mon_hoc_id").references(() => monhoc.id),
  tenTaiLieu: varchar("ten_tai_lieu", { length: 200 }).notNull(),
  moTa: text("mo_ta"),
  duongDan: varchar("duong_dan", { length: 255 }),
  loaiTaiLieu: varchar("loai_tai_lieu", { length: 50 }),
  ngayTao: datetime("ngay_tao"),
  ngayCapNhat: datetime("ngay_cap_nhat").$onUpdate(() => new Date()), // Sửa ở đây
});

// Bảng thanhtoanhocphi
export const thanhtoanhocphi = mysqlTable("thanhtoanhocphi", {
  id: serial("id").primaryKey(),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  hocKy: varchar("hoc_ky", { length: 20 }),
  namHoc: varchar("nam_hoc", { length: 20 }),
  soTien: decimal("so_tien", { precision: 10, scale: 2 }),
  ngayThanhToan: datetime("ngay_thanh_toan"),
  phuongThucThanhToan: varchar("phuong_thuc_thanh_toan", { length: 50 }),
  trangThai: mysqlEnum("trang_thai", [
    "Đã thanh toán",
    "Chưa thanh toán",
    "Thanh toán một phần",
  ]),
  ghiChu: text("ghi_chu"),
});

// Bảng thanhviennghiencuu
export const thanhviennghiencuu = mysqlTable("thanhviennghiencuu", {
  id: serial("id").primaryKey(),
  nghienCuuId: int("nghien_cuu_id").references(() => nghiencuukhoahoc.id),
  sinhVienId: int("sinh_vien_id").references(() => sinhvien.id),
  giangVienId: int("giang_vien_id").references(() => giangvien.id),
  vaiTro: varchar("vai_tro", { length: 50 }),
  ngayThamGia: date("ngay_tham_gia"),
});

// Bảng thongbao
export const thongbao = mysqlTable("thongbao", {
  id: serial("id").primaryKey(),
  tieuDe: varchar("tieu_de", { length: 200 }).notNull(),
  noiDung: text("noi_dung"),
  ngayTao: datetime("ngay_tao"),
  nguoiTao: varchar("nguoi_tao", { length: 100 }),
  doiTuong: mysqlEnum("doi_tuong", ["Tất cả", "Sinh viên", "Giảng viên"]),
  trangThai: mysqlEnum("trang_thai", ["Đã đăng", "Nháp", "Đã gỡ"]),
});

// Bảng thongbaogiangvien
export const thongbaogiangvien = mysqlTable("thongbaogiangvien", {
  id: serial("id").primaryKey(),
  giangVienId: int("giang_vien_id").references(() => giangvien.id),
  tieuDe: varchar("tieu_de", { length: 200 }).notNull(),
  noiDung: text("noi_dung"),
  ngayTao: datetime("ngay_tao"),
  doiTuong: varchar("doi_tuong", { length: 100 }),
  trangThai: mysqlEnum("trang_thai", ["Đã đăng", "Nháp", "Đã gỡ"]),
});

// Bảng thongbao_taikhoan
export const thongbaoTaikhoan = mysqlTable("thongbao_taikhoan", {
  id: serial("id").primaryKey(),
  taikhoanId: int("taikhoan_id")
    .notNull()
    .references(() => taikhoan.id),
  tieuDe: varchar("tieu_de", { length: 200 }).notNull(),
  noiDung: text("noi_dung"),
  ngayTao: datetime("ngay_tao"),
  daDoc: boolean("da_doc").default(false),
  loaiThongBao: mysqlEnum("loai_thong_bao", [
    "Hệ thống",
    "Bảo mật",
    "Thông tin",
  ]),
});

// Các quan hệ (relations)
export const taikhoanRelations = relations(taikhoan, ({ one }) => ({
  sinhVien: one(sinhvien, {
    fields: [taikhoan.sinhVienId],
    references: [sinhvien.id],
  }),
  giangVien: one(giangvien, {
    fields: [taikhoan.giangVienId],
    references: [giangvien.id],
  }),
  quyenHan: one(quyenhan, {
    fields: [taikhoan.quyenHanId],
    references: [quyenhan.id],
  }),
}));

// Các schema và type
export const insertCauhinhTaikhoanSchema = createInsertSchema(cauhinhTaikhoan);
export const insertDangKyHocPhanSchema = createInsertSchema(dangkyhocphan);
export const insertDeThiSchema = createInsertSchema(dethi);
export const insertDiemDanhSchema = createInsertSchema(diemdanh);
export const insertGiangVienSchema = createInsertSchema(giangvien);
export const insertKetQuaHocTapSchema = createInsertSchema(ketquahoctap);
export const insertKhoaLuanDoAnSchema = createInsertSchema(khoaluandoan);
export const insertLichGiangDaySchema = createInsertSchema(lichgiangday);
export const insertLichHocSchema = createInsertSchema(lichhoc);
export const insertLichSuDangNhapSchema = createInsertSchema(lichsudangnhap);
export const insertLopSchema = createInsertSchema(lop);
export const insertMonHocSchema = createInsertSchema(monhoc);
export const insertNganhSchema = createInsertSchema(nganh);
export const insertNghienCuuKhoaHocSchema =
  createInsertSchema(nghiencuukhoahoc);
export const insertPhanCongGiangDaySchema =
  createInsertSchema(phanconggiangday);
export const insertPhienLamViecSchema = createInsertSchema(phienLamViec);
export const insertQuanLyDiemSchema = createInsertSchema(quanlydiem);
export const insertQuyenHanSchema = createInsertSchema(quyenhan);
export const insertSinhVienSchema = createInsertSchema(sinhvien);
export const insertTaiKhoanSchema = createInsertSchema(taikhoan);
export const insertTaiLieuGiangDaySchema = createInsertSchema(tailieugiangday);
export const insertThanhToanHocPhiSchema = createInsertSchema(thanhtoanhocphi);
export const insertThanhVienNghienCuuSchema =
  createInsertSchema(thanhviennghiencuu);
export const insertThongBaoSchema = createInsertSchema(thongbao);
export const insertThongBaoGiangVienSchema =
  createInsertSchema(thongbaogiangvien);
export const insertThongBaoTaiKhoanSchema =
  createInsertSchema(thongbaoTaikhoan);

export type CauhinhTaikhoan = typeof cauhinhTaikhoan.$inferSelect;
export type InsertCauhinhTaikhoan = z.infer<typeof insertCauhinhTaikhoanSchema>;
export type DangKyHocPhan = typeof dangkyhocphan.$inferSelect;
export type InsertDangKyHocPhan = z.infer<typeof insertDangKyHocPhanSchema>;
export type DeThi = typeof dethi.$inferSelect;
export type InsertDeThi = z.infer<typeof insertDeThiSchema>;
export type DiemDanh = typeof diemdanh.$inferSelect;
export type InsertDiemDanh = z.infer<typeof insertDiemDanhSchema>;
export type GiangVien = typeof giangvien.$inferSelect;
export type InsertGiangVien = z.infer<typeof insertGiangVienSchema>;
export type KetQuaHocTap = typeof ketquahoctap.$inferSelect;
export type InsertKetQuaHocTap = z.infer<typeof insertKetQuaHocTapSchema>;
export type KhoaLuanDoAn = typeof khoaluandoan.$inferSelect;
export type InsertKhoaLuanDoAn = z.infer<typeof insertKhoaLuanDoAnSchema>;
export type LichGiangDay = typeof lichgiangday.$inferSelect;
export type InsertLichGiangDay = z.infer<typeof insertLichGiangDaySchema>;
export type LichHoc = typeof lichhoc.$inferSelect;
export type InsertLichHoc = z.infer<typeof insertLichHocSchema>;
export type LichSuDangNhap = typeof lichsudangnhap.$inferSelect;
export type InsertLichSuDangNhap = z.infer<typeof insertLichSuDangNhapSchema>;
export type Lop = typeof lop.$inferSelect;
export type InsertLop = z.infer<typeof insertLopSchema>;
export type MonHoc = typeof monhoc.$inferSelect;
export type InsertMonHoc = z.infer<typeof insertMonHocSchema>;
export type Nganh = typeof nganh.$inferSelect;
export type InsertNganh = z.infer<typeof insertNganhSchema>;
export type NghienCuuKhoaHoc = typeof nghiencuukhoahoc.$inferSelect;
export type InsertNghienCuuKhoaHoc = z.infer<
  typeof insertNghienCuuKhoaHocSchema
>;
export type PhanCongGiangDay = typeof phanconggiangday.$inferSelect;
export type InsertPhanCongGiangDay = z.infer<
  typeof insertPhanCongGiangDaySchema
>;
export type PhienLamViec = typeof phienLamViec.$inferSelect;
export type InsertPhienLamViec = z.infer<typeof insertPhienLamViecSchema>;
export type QuanLyDiem = typeof quanlydiem.$inferSelect;
export type InsertQuanLyDiem = z.infer<typeof insertQuanLyDiemSchema>;
export type QuyenHan = typeof quyenhan.$inferSelect;
export type InsertQuyenHan = z.infer<typeof insertQuyenHanSchema>;
export type SinhVien = typeof sinhvien.$inferSelect;
export type InsertSinhVien = z.infer<typeof insertSinhVienSchema>;
export type TaiKhoan = typeof taikhoan.$inferSelect;
export type InsertTaiKhoan = z.infer<typeof insertTaiKhoanSchema>;
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
export type ThongBaoTaiKhoan = typeof thongbaoTaikhoan.$inferSelect;
export type InsertThongBaoTaiKhoan = z.infer<
  typeof insertThongBaoTaiKhoanSchema
>;
