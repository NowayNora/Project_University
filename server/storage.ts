// server/storage.ts
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import {
  SinhVien,
  InsertSinhVien,
  GiangVien,
  InsertGiangVien,
  MonHoc,
  InsertMonHoc,
  Lop,
  InsertLop,
  DangKyHocPhan,
  InsertDangKyHocPhan,
  LichHoc,
  InsertLichHoc,
  ThanhToanHocPhi,
  InsertThanhToanHocPhi,
  NghienCuuKhoaHoc,
  InsertNghienCuuKhoaHoc,
  ThanhVienNghienCuu,
  InsertThanhVienNghienCuu,
  ThongBao,
  InsertThongBao,
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Sinh viên (Student) related operations
  getSinhVien(MSSV: string): Promise<SinhVien | undefined>;
  createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien>;

  // Giảng viên (Faculty) related operations
  getGiangVien(MaGV: string): Promise<GiangVien | undefined>;
  createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien>;

  // Môn học (Course) related operations
  getMonHoc(MaMonHoc: string): Promise<MonHoc | undefined>;
  getAllMonHoc(): Promise<MonHoc[]>;
  createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc>;

  // Lớp (Class) related operations
  getLop(MaLop: string): Promise<Lop | undefined>;
  createLop(lop: InsertLop): Promise<Lop>;

  // Đăng ký học phần (Enrollment) related operations
  getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined>;
  getDangKyHocPhanBySinhVien(MSSV: string): Promise<DangKyHocPhan[]>;
  createDangKyHocPhan(dangky: InsertDangKyHocPhan): Promise<DangKyHocPhan>;

  // Lịch học (Schedule) related operations
  getLichHoc(id: number): Promise<LichHoc | undefined>;
  getLichHocBySinhVien(MSSV: string): Promise<LichHoc[]>;
  createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc>;

  // Thanh toán học phí (Tuition Fee) related operations
  getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined>;
  getThanhToanHocPhiBySinhVien(MSSV: string): Promise<ThanhToanHocPhi[]>;
  createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi>;

  // Nghiên cứu khoa học (Research Project) related operations
  getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined>;
  getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]>;
  createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc>;

  // Thành viên nghiên cứu (Research Member) related operations
  getThanhVienNghienCuu(id: number): Promise<ThanhVienNghienCuu | undefined>;
  getThanhVienNghienCuuByNghienCuu(
    MaNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]>;
  createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu>;

  // Thông báo (Announcement) related operations
  getThongBao(id: number): Promise<ThongBao | undefined>;
  getAllThongBao(): Promise<ThongBao[]>;
  createThongBao(thongbao: InsertThongBao): Promise<ThongBao>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MySQLStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // Sinh viên methods
  async getSinhVien(MSSV: string): Promise<SinhVien | undefined> {
    const result = await db
      .select()
      .from(schema.sinhvien)
      .where(eq(schema.sinhvien.MSSV, MSSV))
      .limit(1);
    return result[0];
  }

  async createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien> {
    const result = await db
      .insert(schema.sinhvien)
      .values(sinhvien)
      .returning();
    return result[0];
  }

  // Giảng viên methods
  async getGiangVien(MaGV: string): Promise<GiangVien | undefined> {
    const result = await db
      .select()
      .from(schema.giangvien)
      .where(eq(schema.giangvien.MaGV, MaGV))
      .limit(1);
    return result[0];
  }

  async createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien> {
    const result = await db
      .insert(schema.giangvien)
      .values(giangvien)
      .returning();
    return result[0];
  }

  // Môn học methods
  async getMonHoc(MaMonHoc: string): Promise<MonHoc | undefined> {
    const result = await db
      .select()
      .from(schema.monhoc)
      .where(eq(schema.monhoc.MaMonHoc, MaMonHoc))
      .limit(1);
    return result[0];
  }

  async getAllMonHoc(): Promise<MonHoc[]> {
    return await db.select().from(schema.monhoc);
  }

  async createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc> {
    const result = await db.insert(schema.monhoc).values(monhoc).returning();
    return result[0];
  }

  // Lớp methods
  async getLop(MaLop: string): Promise<Lop | undefined> {
    const result = await db
      .select()
      .from(schema.lop)
      .where(eq(schema.lop.MaLop, MaLop))
      .limit(1);
    return result[0];
  }

  async createLop(lop: InsertLop): Promise<Lop> {
    const result = await db.insert(schema.lop).values(lop).returning();
    return result[0];
  }

  // Đăng ký học phần methods
  async getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined> {
    const result = await db
      .select()
      .from(schema.dangkyhocphan)
      .where(eq(schema.dangkyhocphan.ID, id))
      .limit(1);
    return result[0];
  }

  async getDangKyHocPhanBySinhVien(MSSV: string): Promise<DangKyHocPhan[]> {
    return await db
      .select()
      .from(schema.dangkyhocphan)
      .where(eq(schema.dangkyhocphan.MSSV, MSSV));
  }

  async createDangKyHocPhan(
    dangky: InsertDangKyHocPhan
  ): Promise<DangKyHocPhan> {
    const result = await db
      .insert(schema.dangkyhocphan)
      .values(dangky)
      .returning();
    return result[0];
  }

  // Lịch học methods
  async getLichHoc(id: number): Promise<LichHoc | undefined> {
    const result = await db
      .select()
      .from(schema.lichhoc)
      .where(eq(schema.lichhoc.ID, id))
      .limit(1);
    return result[0];
  }

  async getLichHocBySinhVien(MSSV: string): Promise<LichHoc[]> {
    return await db
      .select()
      .from(schema.lichhoc)
      .where(eq(schema.lichhoc.MSSV, MSSV));
  }

  async createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc> {
    const result = await db.insert(schema.lichhoc).values(lichhoc).returning();
    return result[0];
  }

  // Thanh toán học phí methods
  async getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined> {
    const result = await db
      .select()
      .from(schema.thanhtoanhocphi)
      .where(eq(schema.thanhtoanhocphi.ID, id))
      .limit(1);
    return result[0];
  }

  async getThanhToanHocPhiBySinhVien(MSSV: string): Promise<ThanhToanHocPhi[]> {
    return await db
      .select()
      .from(schema.thanhtoanhocphi)
      .where(eq(schema.thanhtoanhocphi.MSSV, MSSV));
  }

  async createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi> {
    const result = await db
      .insert(schema.thanhtoanhocphi)
      .values(thanhToan)
      .returning();
    return result[0];
  }

  // Nghiên cứu khoa học methods
  async getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined> {
    const result = await db
      .select()
      .from(schema.nghiencuukhoahoc)
      .where(eq(schema.nghiencuukhoahoc.ID, id))
      .limit(1);
    return result[0];
  }

  async getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]> {
    return await db.select().from(schema.nghiencuukhoahoc);
  }

  async createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc> {
    const result = await db
      .insert(schema.nghiencuukhoahoc)
      .values(project)
      .returning();
    return result[0];
  }

  // Thành viên nghiên cứu methods
  async getThanhVienNghienCuu(
    id: number
  ): Promise<ThanhVienNghienCuu | undefined> {
    const result = await db
      .select()
      .from(schema.thanhviennghiencuu)
      .where(eq(schema.thanhviennghiencuu.ID, id))
      .limit(1);
    return result[0];
  }

  async getThanhVienNghienCuuByNghienCuu(
    MaNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]> {
    return await db
      .select()
      .from(schema.thanhviennghiencuu)
      .where(eq(schema.thanhviennghiencuu.MaNghienCuu, MaNghienCuu));
  }

  async createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu> {
    const result = await db
      .insert(schema.thanhviennghiencuu)
      .values(member)
      .returning();
    return result[0];
  }

  // Thông báo methods
  async getThongBao(id: number): Promise<ThongBao | undefined> {
    const result = await db
      .select()
      .from(schema.thongbao)
      .where(eq(schema.thongbao.ID, id))
      .limit(1);
    return result[0];
  }

  async getAllThongBao(): Promise<ThongBao[]> {
    return await db.select().from(schema.thongbao);
  }

  async createThongBao(thongbao: InsertThongBao): Promise<ThongBao> {
    const result = await db
      .insert(schema.thongbao)
      .values(thongbao)
      .returning();
    return result[0];
  }
}

export const storage = new MySQLStorage();
