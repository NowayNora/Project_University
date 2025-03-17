import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
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
  HocKyNamHoc, // Thêm type HocKyNamHoc
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User
  getUser(id: number): Promise<TaiKhoan | undefined>;
  getUserByUsername(username: string): Promise<TaiKhoan | undefined>;
  createUser(user: InsertTaiKhoan): Promise<TaiKhoan>;
  updateUser(id: number, user: Partial<InsertTaiKhoan>): Promise<TaiKhoan>;

  // SinhVien
  getSinhVienByUserId(userId: number): Promise<SinhVien | undefined>;
  getSinhVien(maSv: string): Promise<SinhVien | undefined>;
  createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien>;
  updateSinhVien(
    id: number,
    sinhvien: Partial<InsertSinhVien>
  ): Promise<SinhVien>;

  // GiangVien
  getGiangVienByUserId(userId: number): Promise<GiangVien | undefined>;
  getGiangVien(maGv: string): Promise<GiangVien | undefined>;
  createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien>;

  // MonHoc
  getMonHoc(id: number): Promise<MonHoc | undefined>;
  getAllMonHoc(): Promise<MonHoc[]>;
  createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc>;

  // Lop
  getLop(maLop: string): Promise<Lop | undefined>;
  createLop(lop: InsertLop): Promise<Lop>;

  // DangKyHocPhan
  getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined>;
  getDangKyHocPhanBySinhVien(maSv: string): Promise<DangKyHocPhan[]>;
  createDangKyHocPhan(dangky: InsertDangKyHocPhan): Promise<DangKyHocPhan>;

  // LichHoc
  getLichHoc(id: number): Promise<LichHoc | undefined>;
  getLichHocBySinhVien(maSv: string): Promise<LichHoc[]>;
  createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc>;

  // ThanhToanHocPhi
  getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined>;
  getThanhToanHocPhiBySinhVien(maSv: string): Promise<ThanhToanHocPhi[]>;
  createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi>;

  // NghienCuuKhoaHoc
  getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined>;
  getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]>;
  createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc>;

  // ThanhVienNghienCuu
  getThanhVienNghienCuu(id: number): Promise<ThanhVienNghienCuu | undefined>;
  getThanhVienNghienCuuByNghienCuu(
    maNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]>;
  createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu>;

  // ThongBao
  getThongBao(id: number): Promise<ThongBao | undefined>;
  getAllThongBao(): Promise<ThongBao[]>;
  createThongBao(thongbao: InsertThongBao): Promise<ThongBao>;

  getCurrentHocKyNamHoc(): Promise<HocKyNamHoc | undefined>;

  sessionStore: session.Store;
}

export class MySQLStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  // Hàm trợ giúp chung để lấy bản ghi đơn
  private async getSingle<T>(
    table: any,
    condition: any
  ): Promise<T | undefined> {
    try {
      const result = await db.select().from(table).where(condition).limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error fetching from ${table.name}:`, error);
      throw new Error(`Failed to fetch from ${table.name}`);
    }
  }

  // Hàm trợ giúp chung để tạo bản ghi
  private async createSingle<T>(table: any, data: any): Promise<T> {
    try {
      const [insertResult] = await db.insert(table).values(data);
      const result = await this.getSingle<T>(
        table,
        eq(table.id, insertResult.insertId)
      );
      if (!result) throw new Error("Failed to retrieve created record");
      return result;
    } catch (error) {
      console.error(`Error creating in ${table.name}:`, error);
      throw new Error(`Failed to create in ${table.name}`);
    }
  }

  // Hàm trợ giúp chung để cập nhật bản ghi
  private async updateSingle<T>(
    table: any,
    id: number,
    data: Partial<T>
  ): Promise<T> {
    try {
      await db.update(table).set(data).where(eq(table.id, id));
      const result = await this.getSingle<T>(table, eq(table.id, id));
      if (!result) throw new Error("Record not found after update");
      return result;
    } catch (error) {
      console.error(`Error updating in ${table.name}:`, error);
      throw new Error(`Failed to update in ${table.name}`);
    }
  }

  // User
  async getUser(id: number): Promise<TaiKhoan | undefined> {
    return this.getSingle<TaiKhoan>(
      schema.taikhoan,
      eq(schema.taikhoan.id, id)
    );
  }

  async getUserByUsername(username: string): Promise<TaiKhoan | undefined> {
    return this.getSingle<TaiKhoan>(
      schema.taikhoan,
      eq(schema.taikhoan.tenDangNhap, username)
    );
  }

  async createUser(user: InsertTaiKhoan): Promise<TaiKhoan> {
    return this.createSingle<TaiKhoan>(schema.taikhoan, user);
  }

  async updateUser(
    id: number,
    user: Partial<InsertTaiKhoan>
  ): Promise<TaiKhoan> {
    return this.updateSingle<TaiKhoan>(schema.taikhoan, id, user);
  }

  // SinhVien
  async getSinhVienByUserId(userId: number): Promise<SinhVien | undefined> {
    const user = await this.getUser(userId);
    if (!user?.sinhVienId) return undefined;
    return this.getSingle<SinhVien>(
      schema.sinhvien,
      eq(schema.sinhvien.id, user.sinhVienId)
    );
  }

  async getSinhVien(maSv: string): Promise<SinhVien | undefined> {
    return this.getSingle<SinhVien>(
      schema.sinhvien,
      eq(schema.sinhvien.maSv, maSv)
    );
  }

  async createSinhVien(sinhvien: InsertSinhVien): Promise<SinhVien> {
    return this.createSingle<SinhVien>(schema.sinhvien, sinhvien);
  }

  async updateSinhVien(
    id: number,
    sinhvien: Partial<InsertSinhVien>
  ): Promise<SinhVien> {
    return this.updateSingle<SinhVien>(schema.sinhvien, id, sinhvien);
  }

  // GiangVien
  async getGiangVienByUserId(userId: number): Promise<GiangVien | undefined> {
    const user = await this.getUser(userId);
    if (!user?.giangVienId) return undefined;
    return this.getSingle<GiangVien>(
      schema.giangvien,
      eq(schema.giangvien.id, user.giangVienId)
    );
  }

  async getGiangVien(maGv: string): Promise<GiangVien | undefined> {
    return this.getSingle<GiangVien>(
      schema.giangvien,
      eq(schema.giangvien.maGv, maGv)
    );
  }

  async createGiangVien(giangvien: InsertGiangVien): Promise<GiangVien> {
    return this.createSingle<GiangVien>(schema.giangvien, giangvien);
  }

  // MonHoc
  async getMonHoc(id: number): Promise<MonHoc | undefined> {
    return this.getSingle<MonHoc>(schema.monhoc, eq(schema.monhoc.id, id));
  }

  async getAllMonHoc(): Promise<MonHoc[]> {
    try {
      return await db.select().from(schema.monhoc);
    } catch (error) {
      console.error("Error fetching all MonHoc:", error);
      throw new Error("Failed to fetch all courses");
    }
  }

  // Thêm phương thức getCurrentHocKyNamHoc
  async getCurrentHocKyNamHoc(): Promise<HocKyNamHoc | undefined> {
    try {
      const currentDate = new Date();
      const result = await db
        .select()
        .from(schema.hockyNamHoc)
        .where(
          and(
            eq(schema.hockyNamHoc.trangThai, "Hoạt động"),
            lte(schema.hockyNamHoc.ngayBatDau, currentDate),
            gte(schema.hockyNamHoc.ngayKetThuc, currentDate)
          )
        )
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching current HocKyNamHoc:", error);
      throw new Error("Failed to fetch current semester and year");
    }
  }

  async createMonHoc(monhoc: InsertMonHoc): Promise<MonHoc> {
    return this.createSingle<MonHoc>(schema.monhoc, monhoc);
  }

  // Lop
  async getLop(maLop: string): Promise<Lop | undefined> {
    return this.getSingle<Lop>(schema.lop, eq(schema.lop.maLop, maLop));
  }

  async createLop(lop: InsertLop): Promise<Lop> {
    return this.createSingle<Lop>(schema.lop, lop);
  }

  // DangKyHocPhan
  async getDangKyHocPhan(id: number): Promise<DangKyHocPhan | undefined> {
    return this.getSingle<DangKyHocPhan>(
      schema.dangkyhocphan,
      eq(schema.dangkyhocphan.id, id)
    );
  }

  async getDangKyHocPhanBySinhVien(maSv: string): Promise<DangKyHocPhan[]> {
    const sinhVien = await this.getSinhVien(maSv);
    if (!sinhVien) return [];
    try {
      return await db
        .select()
        .from(schema.dangkyhocphan)
        .where(eq(schema.dangkyhocphan.sinhVienId, sinhVien.id));
    } catch (error) {
      console.error("Error fetching DangKyHocPhan by SinhVien:", error);
      throw new Error("Failed to fetch course registrations");
    }
  }

  async createDangKyHocPhan(
    dangky: InsertDangKyHocPhan
  ): Promise<DangKyHocPhan> {
    return this.createSingle<DangKyHocPhan>(schema.dangkyhocphan, dangky);
  }

  // LichHoc
  async getLichHoc(id: number): Promise<LichHoc | undefined> {
    return this.getSingle<LichHoc>(schema.lichhoc, eq(schema.lichhoc.id, id));
  }

  async getLichHocBySinhVien(maSv: string): Promise<LichHoc[]> {
    try {
      const sinhVien = await this.getSinhVien(maSv);
      if (!sinhVien) return [];

      const lichHoc = await db
        .select({
          id: schema.lichhoc.id,
          monHocId: schema.lichhoc.monHocId,
          phongHoc: schema.lichhoc.phongHoc,
          thu: schema.lichhoc.thu,
          tietBatDau: schema.lichhoc.tietBatDau,
          soTiet: schema.lichhoc.soTiet,
          buoiHoc: schema.lichhoc.buoiHoc,
          hocKy: schema.lichhoc.hocKy,
          namHoc: schema.lichhoc.namHoc,
          lichHocKhaDungId: schema.lichhoc.lichHocKhaDungId,
          sinhVienId: schema.lichhoc.sinhVienId,
          loaiTiet: schema.lichhoc.loaiTiet, // Bổ sung thuộc tính này
        })
        .from(schema.lichhoc)
        .where(eq(schema.lichhoc.sinhVienId, sinhVien.id));

      return lichHoc.length ? lichHoc : [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching LichHoc by SinhVien:", error.stack);
        throw new Error(
          `Failed to fetch schedule for maSv ${maSv}: ${error.message}`
        );
      } else {
        console.error("Unknown error fetching LichHoc by SinhVien:", error);
        throw new Error(
          `Failed to fetch schedule for maSv ${maSv}: Unknown error`
        );
      }
    }
  }

  // async createLichHoc(lichhoc: InsertLichHoc): Promise<LichHoc> {
  //   return this.createSingle<LichHoc>(schema.lichhoc, lichhoc);
  // }

  // Trong storage.ts
  async getLichHocKhaDung(monHocId: number): Promise<schema.LichHocKhaDung[]> {
    try {
      return await db
        .select()
        .from(schema.lichHocKhaDung)
        .where(eq(schema.lichHocKhaDung.monHocId, monHocId));
    } catch (error) {
      console.error("Error fetching available schedules:", error);
      throw new Error("Failed to fetch available schedules");
    }
  }

  async getLichHocKhaDungById(
    id: number
  ): Promise<schema.LichHocKhaDung | undefined> {
    try {
      const result = await db
        .select()
        .from(schema.lichHocKhaDung)
        .where(eq(schema.lichHocKhaDung.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching schedule by ID:", error);
      throw new Error("Failed to fetch schedule by ID");
    }
  }

  async createLichHoc(lichhoc: schema.InsertLichHoc): Promise<schema.LichHoc> {
    return this.createSingle<schema.LichHoc>(schema.lichhoc, lichhoc);
  }

  // ThanhToanHocPhi
  async getThanhToanHocPhi(id: number): Promise<ThanhToanHocPhi | undefined> {
    return this.getSingle<ThanhToanHocPhi>(
      schema.thanhtoanhocphi,
      eq(schema.thanhtoanhocphi.id, id)
    );
  }

  async getThanhToanHocPhiBySinhVien(maSv: string): Promise<ThanhToanHocPhi[]> {
    const sinhVien = await this.getSinhVien(maSv);
    if (!sinhVien) return [];
    try {
      return await db
        .select()
        .from(schema.thanhtoanhocphi)
        .where(eq(schema.thanhtoanhocphi.sinhVienId, sinhVien.id));
    } catch (error) {
      console.error("Error fetching ThanhToanHocPhi by SinhVien:", error);
      throw new Error("Failed to fetch payment records");
    }
  }

  async createThanhToanHocPhi(
    thanhToan: InsertThanhToanHocPhi
  ): Promise<ThanhToanHocPhi> {
    return this.createSingle<ThanhToanHocPhi>(
      schema.thanhtoanhocphi,
      thanhToan
    );
  }

  // NghienCuuKhoaHoc
  async getNghienCuuKhoaHoc(id: number): Promise<NghienCuuKhoaHoc | undefined> {
    return this.getSingle<NghienCuuKhoaHoc>(
      schema.nghiencuukhoahoc,
      eq(schema.nghiencuukhoahoc.id, id)
    );
  }

  async getAllNghienCuuKhoaHoc(): Promise<NghienCuuKhoaHoc[]> {
    try {
      return await db.select().from(schema.nghiencuukhoahoc);
    } catch (error) {
      console.error("Error fetching all NghienCuuKhoaHoc:", error);
      throw new Error("Failed to fetch all research projects");
    }
  }

  async createNghienCuuKhoaHoc(
    project: InsertNghienCuuKhoaHoc
  ): Promise<NghienCuuKhoaHoc> {
    return this.createSingle<NghienCuuKhoaHoc>(
      schema.nghiencuukhoahoc,
      project
    );
  }

  // ThanhVienNghienCuu
  async getThanhVienNghienCuu(
    id: number
  ): Promise<ThanhVienNghienCuu | undefined> {
    return this.getSingle<ThanhVienNghienCuu>(
      schema.thanhviennghiencuu,
      eq(schema.thanhviennghiencuu.id, id)
    );
  }

  async getThanhVienNghienCuuByNghienCuu(
    maNghienCuu: number
  ): Promise<ThanhVienNghienCuu[]> {
    try {
      return await db
        .select()
        .from(schema.thanhviennghiencuu)
        .where(eq(schema.thanhviennghiencuu.nghienCuuId, maNghienCuu));
    } catch (error) {
      console.error("Error fetching ThanhVienNghienCuu by NghienCuu:", error);
      throw new Error("Failed to fetch research members");
    }
  }

  async createThanhVienNghienCuu(
    member: InsertThanhVienNghienCuu
  ): Promise<ThanhVienNghienCuu> {
    return this.createSingle<ThanhVienNghienCuu>(
      schema.thanhviennghiencuu,
      member
    );
  }

  // ThongBao
  async getThongBao(id: number): Promise<ThongBao | undefined> {
    return this.getSingle<ThongBao>(
      schema.thongbao,
      eq(schema.thongbao.id, id)
    );
  }

  async getAllThongBao(): Promise<ThongBao[]> {
    try {
      return await db.select().from(schema.thongbao);
    } catch (error) {
      console.error("Error fetching all ThongBao:", error);
      throw new Error("Failed to fetch all announcements");
    }
  }

  async createThongBao(thongbao: InsertThongBao): Promise<ThongBao> {
    return this.createSingle<ThongBao>(schema.thongbao, thongbao);
  }
}

export const storage = new MySQLStorage();
