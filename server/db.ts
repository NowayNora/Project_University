import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "@shared/schema";

const pool = createPool({
  host: "127.0.0.1",
  user: "root",
  password: "", // Đảm bảo thêm mật khẩu nếu cần
  database: "db_sinhvien",
});

export const db = drizzle(pool, { schema, mode: "default" });
