import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import {
  TaiKhoan,
  InsertTaiKhoan,
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
  getUser(id: number): Promise<TaiKhoan | undefined>;
  getUserByUsername(username: string): Promise<TaiKhoan | undefined>;
  createUser(user: InsertTaiKhoan): Promise<TaiKhoan>;
  getSinhVienByUserId(userId: number): Promise<SinhVien | undefined>;
  getGiangVienByUserId(userId: number): Promise<GiangVien | undefined>;
  getSinhVien(maSv: string): Promise<SinhVien | undefined>;
  createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien>;
  getGiangVien(maGv: string): Promise<GiangVien | undefined>;
  createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien>;
  getMonHoc(maMon: string): Promise<MonHoc | undefined>;
  getAllMonHoc(): Promise<MonHoc[]>;
  createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc>;
  getLop(maLop: string): Promise<Lop | undefined>;
  createLop(lop: InsertLop): Promise<Lop>;
  getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined>;
  getDangKyHocPhanBySinhVien(maSv: string): Promise<DangKyHocPhan[]>;
  createDangKyHocPhan(dangky: InsertDangKyHocPhan): Promise<DangKyHocPhan>;
  getLichHoc(id: number): Promise<LichHoc | undefined>;
  getLichHocBySinhVien(maSv: string): Promise<LichHoc[]>;
  createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc>;
  getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined>;
  getThanhToanHocPhiBySinhVien(maSv: string): Promise<ThanhToanHocPhi[]>;
  createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi>;
  getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined>;
  getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]>;
  createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc>;
  getThanhVienNghienCuu(id: number): Promise<ThanhVienNghienCuu | undefined>;
  getThanhVienNghienCuuByNghienCuu(
    maNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]>;
  createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu>;
  getThongBao(id: number): Promise<ThongBao | undefined>;
  getAllThongBao(): Promise<ThongBao[]>;
  createThongBao(thongbao: InsertThongBao): Promise<ThongBao>;
  sessionStore: session.Store;
}

export class MySQLStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<TaiKhoan | undefined> {
    const result = await db
      .select()
      .from(schema.taikhoan)
      .where(eq(schema.taikhoan.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<TaiKhoan | undefined> {
    const result = await db
      .select()
      .from(schema.taikhoan)
      .where(eq(schema.taikhoan.tenDangNhap, username))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertTaiKhoan): Promise<TaiKhoan> {
    const [insertResult] = await db.insert(schema.taikhoan).values(user);
    const result = await db
      .select()
      .from(schema.taikhoan)
      .where(eq(schema.taikhoan.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getSinhVienByUserId(userId: number): Promise<SinhVien | undefined> {
    const user = await this.getUser(userId);
    if (!user?.sinhVienId) return undefined;
    const result = await db
      .select()
      .from(schema.sinhvien)
      .where(eq(schema.sinhvien.id, user.sinhVienId))
      .limit(1);
    return result[0];
  }

  async getGiangVienByUserId(userId: number): Promise<GiangVien | undefined> {
    const user = await this.getUser(userId);
    if (!user?.giangVienId) return undefined;
    const result = await db
      .select()
      .from(schema.giangvien)
      .where(eq(schema.giangvien.id, user.giangVienId))
      .limit(1);
    return result[0];
  }

  async getSinhVien(maSv: string): Promise<SinhVien | undefined> {
    const result = await db
      .select()
      .from(schema.sinhvien)
      .where(eq(schema.sinhvien.maSv, maSv))
      .limit(1);
    return result[0];
  }

  async createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien> {
    const [insertResult] = await db.insert(schema.sinhvien).values(sinhvien);
    const result = await db
      .select()
      .from(schema.sinhvien)
      .where(eq(schema.sinhvien.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getGiangVien(maGv: string): Promise<GiangVien | undefined> {
    const result = await db
      .select()
      .from(schema.giangvien)
      .where(eq(schema.giangvien.maGv, maGv))
      .limit(1);
    return result[0];
  }

  async createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien> {
    const [insertResult] = await db.insert(schema.giangvien).values(giangvien);
    const result = await db
      .select()
      .from(schema.giangvien)
      .where(eq(schema.giangvien.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getMonHoc(maMon: string): Promise<MonHoc | undefined> {
    const result = await db
      .select()
      .from(schema.monhoc)
      .where(eq(schema.monhoc.id, maMon))
      .limit(1);
    return result[0];
  }

  async getAllMonHoc(): Promise<MonHoc[]> {
    return await db.select().from(schema.monhoc);
  }

  async createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc> {
    const [insertResult] = await db.insert(schema.monhoc).values(monhoc);
    const result = await db
      .select()
      .from(schema.monhoc)
      .where(eq(schema.monhoc.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getLop(maLop: string): Promise<Lop | undefined> {
    const result = await db
      .select()
      .from(schema.lop)
      .where(eq(schema.lop.maLop, maLop))
      .limit(1);
    return result[0];
  }

  async createLop(lop: InsertLop): Promise<Lop> {
    const [insertResult] = await db.insert(schema.lop).values(lop);
    const result = await db
      .select()
      .from(schema.lop)
      .where(eq(schema.lop.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined> {
    const result = await db
      .select()
      .from(schema.dangkyhocphan)
      .where(eq(schema.dangkyhocphan.id, id))
      .limit(1);
    return result[0];
  }

  async getDangKyHocPhanBySinhVien(maSv: string): Promise<DangKyHocPhan[]> {
    const sinhVien = await this.getSinhVien(maSv);
    if (!sinhVien) return [];
    return await db
      .select()
      .from(schema.dangkyhocphan)
      .where(eq(schema.dangkyhocphan.sinhVienId, sinhVien.id));
  }

  async createDangKyHocPhan(
    dangky: InsertDangKyHocPhan
  ): Promise<DangKyHocPhan> {
    const [insertResult] = await db.insert(schema.dangkyhocphan).values(dangky);
    const result = await db
      .select()
      .from(schema.dangkyhocphan)
      .where(eq(schema.dangkyhocphan.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getLichHoc(id: number): Promise<LichHoc | undefined> {
    const result = await db
      .select()
      .from(schema.lichhoc)
      .where(eq(schema.lichhoc.id, id))
      .limit(1);
    return result[0];
  }

  async getLichHocBySinhVien(maSv: string): Promise<LichHoc[]> {
    const sinhVien = await this.getSinhVien(maSv);
    if (!sinhVien) return [];
    const dangKy = await this.getDangKyHocPhanBySinhVien(maSv);
    const monHocIds = dangKy.map((dk) => dk.monHocId);
    return await db
      .select()
      .from(schema.lichhoc)
      .where(
        monHocIds.length
          ? eq(schema.lichhoc.monHocId, monHocIds[0])
          : eq(schema.lichhoc.id, -1)
      );
  }

  async createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc> {
    const [insertResult] = await db.insert(schema.lichhoc).values(lichhoc);
    const result = await db
      .select()
      .from(schema.lichhoc)
      .where(eq(schema.lichhoc.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined> {
    const result = await db
      .select()
      .from(schema.thanhtoanhocphi)
      .where(eq(schema.thanhtoanhocphi.id, id))
      .limit(1);
    return result[0];
  }

  async getThanhToanHocPhiBySinhVien(maSv: string): Promise<ThanhToanHocPhi[]> {
    const sinhVien = await this.getSinhVien(maSv);
    if (!sinhVien) return [];
    return await db
      .select()
      .from(schema.thanhtoanhocphi)
      .where(eq(schema.thanhtoanhocphi.sinhVienId, sinhVien.id));
  }

  async createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi> {
    const [insertResult] = await db
      .insert(schema.thanhtoanhocphi)
      .values(thanhToan);
    const result = await db
      .select()
      .from(schema.thanhtoanhocphi)
      .where(eq(schema.thanhtoanhocphi.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined> {
    const result = await db
      .select()
      .from(schema.nghiencuukhoahoc)
      .where(eq(schema.nghiencuukhoahoc.id, id))
      .limit(1);
    return result[0];
  }

  async getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]> {
    return await db.select().from(schema.nghiencuukhoahoc);
  }

  async createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc> {
    const [insertResult] = await db
      .insert(schema.nghiencuukhoahoc)
      .values(project);
    const result = await db
      .select()
      .from(schema.nghiencuukhoahoc)
      .where(eq(schema.nghiencuukhoahoc.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getThanhVienNghienCuu(
    id: number
  ): Promise<ThanhVienNghienCuu | undefined> {
    const result = await db
      .select()
      .from(schema.thanhviennghiencuu)
      .where(eq(schema.thanhviennghiencuu.id, id))
      .limit(1);
    return result[0];
  }

  async getThanhVienNghienCuuByNghienCuu(
    maNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]> {
    return await db
      .select()
      .from(schema.thanhviennghiencuu)
      .where(eq(schema.thanhviennghiencuu.nghienCuuId, maNghienCuu));
  }

  async createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu> {
    const [insertResult] = await db
      .insert(schema.thanhviennghiencuu)
      .values(member);
    const result = await db
      .select()
      .from(schema.thanhviennghiencuu)
      .where(eq(schema.thanhviennghiencuu.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }

  async getThongBao(id: number): Promise<ThongBao | undefined> {
    const result = await db
      .select()
      .from(schema.thongbao)
      .where(eq(schema.thongbao.id, id))
      .limit(1);
    return result[0];
  }

  async getAllThongBao(): Promise<ThongBao[]> {
    return await db.select().from(schema.thongbao);
  }

  async createThongBao(thongbao: InsertThongBao): Promise<ThongBao> {
    const [insertResult] = await db.insert(schema.thongbao).values(thongbao);
    const result = await db
      .select()
      .from(schema.thongbao)
      .where(eq(schema.thongbao.id, insertResult.insertId))
      .limit(1);
    return result[0];
  }
}

export const storage = new MySQLStorage();
