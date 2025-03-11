// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { SinhVien, GiangVien } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: "student" | "faculty";
      fullName: string;
      email: string;
      password?: string;
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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "university-management-system-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Kiểm tra sinh viên trước
        const sinhVien = await storage.getSinhVien(username);
        if (sinhVien) {
          // Giả sử sinh viên có mật khẩu trong hệ thống (cần thêm cột password vào bảng sinhvien nếu muốn dùng)
          return done(null, {
            id: sinhVien.MSSV,
            role: "student",
            fullName: sinhVien.HoTen,
            email: "",
          });
        }

        // Kiểm tra giảng viên
        const giangVien = await storage.getGiangVien(username);
        if (giangVien) {
          return done(null, {
            id: giangVien.MaGV,
            role: "faculty",
            fullName: giangVien.HoTen,
            email: giangVien.Email,
          });
        }

        return done(null, false, { message: "Invalid credentials" });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) =>
    done(null, { id: user.id, role: user.role })
  );
  passport.deserializeUser(
    async ({ id, role }: { id: string; role: string }, done) => {
      try {
        if (role === "student") {
          const sinhVien = await storage.getSinhVien(id);
          if (sinhVien) {
            return done(null, {
              id: sinhVien.MSSV,
              role: "student",
              fullName: sinhVien.HoTen,
              email: "",
            });
          }
        } else if (role === "faculty") {
          const giangVien = await storage.getGiangVien(id);
          if (giangVien) {
            return done(null, {
              id: giangVien.MaGV,
              role: "faculty",
              fullName: giangVien.HoTen,
              email: giangVien.Email,
            });
          }
        }
        done(new Error("User not found"));
      } catch (err) {
        done(err);
      }
    }
  );

  app.post("/api/register", async (req, res, next) => {
    try {
      const { role, fullName, email, password, ...data } = req.body;

      if (role === "student") {
        const sinhVien = await storage.createSinhVien({
          MSSV: data.MSSV,
          HoTen: fullName,
          GioiTinh: data.GioiTinh || "Nam",
          NgaySinh: data.NgaySinh,
          NoiSinh: data.NoiSinh || "",
          TrangThai: "Đang học",
          LopHoc: data.LopHoc,
          KhoaHoc: data.KhoaHoc,
          BacDaoTao: data.BacDaoTao || "Đại học",
          LoaiHinhDaoTao: data.LoaiHinhDaoTao || "Chính quy",
          Nganh: data.Nganh,
        });
        req.login(
          {
            id: sinhVien.MSSV,
            role: "student",
            fullName: sinhVien.HoTen,
            email: "",
          },
          (err) => {
            if (err) return next(err);
            res
              .status(201)
              .json({
                id: sinhVien.MSSV,
                role: "student",
                fullName: sinhVien.HoTen,
              });
          }
        );
      } else if (role === "faculty") {
        const hashedPassword = await hashPassword(password);
        const giangVien = await storage.createGiangVien({
          MaGV: data.MaGV,
          HoTen: fullName,
          GioiTinh: data.GioiTinh || "Nam",
          NgaySinh: data.NgaySinh,
          DiaChi: data.DiaChi || "",
          Email: email,
          SoDienThoai: data.SoDienThoai,
          HocVi: data.HocVi || "Cử nhân",
          ChucDanh: data.ChucDanh,
          BoMon: data.BoMon,
          Khoa: data.Khoa,
          TrangThai: "Đang công tác",
          NgayVaoLam: data.NgayVaoLam || new Date().toISOString().split("T")[0],
        });
        req.login(
          {
            id: giangVien.MaGV,
            role: "faculty",
            fullName: giangVien.HoTen,
            email: giangVien.Email,
          },
          (err) => {
            if (err) return next(err);
            res
              .status(201)
              .json({
                id: giangVien.MaGV,
                role: "faculty",
                fullName: giangVien.HoTen,
                email: giangVien.Email,
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
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return next(err);
        return res
          .status(200)
          .json({
            id: user.id,
            role: user.role,
            fullName: user.fullName,
            email: user.email,
          });
      });
    })(req, res, next);
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
      const { id, role } = req.user;

      if (role === "student") {
        const sinhVien = await storage.getSinhVien(id);
        if (!sinhVien) {
          return res.status(404).json({ message: "Student profile not found" });
        }
        return res.json({ user: req.user, sinhVien });
      } else if (role === "faculty") {
        const giangVien = await storage.getGiangVien(id);
        if (!giangVien) {
          return res.status(404).json({ message: "Faculty profile not found" });
        }
        return res.json({ user: req.user, giangVien });
      }

      return res.status(400).json({ message: "Invalid user role" });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching profile" });
    }
  });
}
