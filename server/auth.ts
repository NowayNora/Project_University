import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface User {
      id: number;
      tenDangNhap: string;
      quyenHanId: number; // Thêm quyenHanId
      role: "student" | "faculty" | "admin";
      fullName: string;
      email: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function getRoleFromQuyenHanId(
  quyenHanId: number
): "student" | "faculty" | "admin" {
  switch (quyenHanId) {
    case 1:
      return "admin";
    case 2:
      return "faculty";
    case 3:
      return "student";
    default:
      throw new Error("Invalid quyenHanId");
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "university-management-system-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore, // MemoryStore
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "tenDangNhap", // Chỉ định trường tên đăng nhập
        passwordField: "password", // Trường mật khẩu (có thể bỏ qua vì đã khớp mặc định)
      },
      async (tenDangNhap, password, done) => {
        try {
          const user = await storage.getUserByUsername(tenDangNhap);
          if (!user || !(await comparePasswords(password, user.matKhauHash))) {
            return done(null, false, { message: "Invalid credentials" });
          }

          let fullName = "";
          if (user.sinhVienId) {
            const sinhVien = await storage.getSinhVienByUserId(user.id);
            fullName = sinhVien?.hoTen || "";
          } else if (user.giangVienId) {
            const giangVien = await storage.getGiangVienByUserId(user.id);
            fullName = giangVien?.hoTen || "";
          }

          return done(null, {
            id: user.id,
            tenDangNhap: user.tenDangNhap,
            role: getRoleFromQuyenHanId(user.quyenHanId),
            fullName,
            email: user.email,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(new Error("User not found"));

      let fullName = "";
      if (user.sinhVienId) {
        const sinhVien = await storage.getSinhVienByUserId(user.id);
        fullName = sinhVien?.hoTen || "";
      } else if (user.giangVienId) {
        const giangVien = await storage.getGiangVienByUserId(user.id);
        fullName = giangVien?.hoTen || "";
      }

      done(null, {
        id: user.id,
        tenDangNhap: user.tenDangNhap,
        quyenHanId: user.quyenHanId, // Thêm dòng này
        role: getRoleFromQuyenHanId(user.quyenHanId),
        fullName,
        email: user.email,
      });
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { tenDangNhap, password, role, email, ...data } = req.body;
      const matKhauHash = await hashPassword(password);

      let quyenHanId: number;
      switch (role) {
        case "admin":
          quyenHanId = 1;
          break;
        case "faculty":
          quyenHanId = 2;
          break;
        case "student":
          quyenHanId = 3;
          break;
        default:
          return res.status(400).json({ message: "Invalid role" });
      }

      if (role === "student") {
        const sinhVien = await storage.createSinhVien({
          maSv: data.maSv,
          hoTen: data.fullName,
          ngaySinh: data.ngaySinh ? new Date(data.ngaySinh) : null,
          gioiTinh: data.gioiTinh || "Nam",
          diaChi: data.diaChi || "",
          email,
          soDienThoai: data.soDienThoai || null,
          lopId: data.lopId,
          trangThai: "Đang học",
        });
        const user = await storage.createUser({
          tenDangNhap,
          matKhauHash,
          email,
          quyenHanId,
          sinhVienId: sinhVien.id,
          giangVienId: null,
          ngayTao: new Date(),
          lanDangNhapCuoi: null,
          trangThai: "Hoạt động",
          tokenResetPassword: null,
          tokenExpiry: null,
        });
        req.login(
          {
            id: user.id,
            tenDangNhap,
            role: "student",
            fullName: sinhVien.hoTen,
            email,
          },
          (err) => {
            if (err) return next(err);
            res.status(201).json({
              id: user.id,
              role: "student",
              fullName: sinhVien.hoTen,
              email,
            });
          }
        );
      } else if (role === "faculty") {
        const giangVien = await storage.createGiangVien({
          maGv: data.maGv,
          hoTen: data.fullName,
          ngaySinh: data.ngaySinh ? new Date(data.ngaySinh) : null,
          gioiTinh: data.gioiTinh || "Nam",
          diaChi: data.diaChi || "",
          email,
          soDienThoai: data.soDienThoai || null,
          chuyenMon: data.chuyenMon || "",
          hocVi: data.hocVi || "Cử nhân",
          trangThai: "Đang dạy",
        });
        const user = await storage.createUser({
          tenDangNhap,
          matKhauHash,
          email,
          quyenHanId,
          sinhVienId: null,
          giangVienId: giangVien.id,
          ngayTao: new Date(),
          lanDangNhapCuoi: null,
          trangThai: "Hoạt động",
          tokenResetPassword: null,
          tokenExpiry: null,
        });
        req.login(
          {
            id: user.id,
            tenDangNhap,
            role: "faculty",
            fullName: giangVien.hoTen,
            email,
          },
          (err) => {
            if (err) return next(err);
            res.status(201).json({
              id: user.id,
              role: "faculty",
              fullName: giangVien.hoTen,
              email,
            });
          }
        );
      } else {
        res.status(400).json({ message: "Invalid role" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // console.log("Request body:", JSON.stringify(req.body)); // In chi tiết body
    // console.log("Headers:", req.headers); // In headers để kiểm tra Content-Type
    passport.authenticate(
      "local",
      (err: Error | null, user: any, info: any) => {
        if (err) return next(err);
        if (!user)
          return res
            .status(401)
            .json({ message: info?.message || "Invalid credentials" });
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(200).json({
            id: user.id,
            role: user.role,
            fullName: user.fullName,
            email: user.email,
          });
        });
      }
    )(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({
      id: req.user.id,
      role: req.user.role,
      fullName: req.user.fullName,
      email: req.user.email,
    });
  });

  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { role } = req.user;
      if (role === "student") {
        const sinhVien = await storage.getSinhVienByUserId(req.user.id);
        return res.json({ user: req.user, sinhVien });
      } else if (role === "faculty") {
        const giangVien = await storage.getGiangVienByUserId(req.user.id);
        return res.json({ user: req.user, giangVien });
      }
      return res.status(400).json({ message: "Invalid user role" });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching profile" });
    }
  });
}
