import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer } from "ws"; // ⬅ Thêm WebSocket
dotenv.config();

// Cấu hình SSL
const sslPath = "D:\\Every\\ssl";
const credentials = {
  key: fs.readFileSync(path.join(sslPath, "localhost.key"), "utf8"),
  cert: fs.readFileSync(path.join(sslPath, "localhost.crt"), "utf8"),
};

// Khởi tạo ứng dụng
const app = express();
const PORT_HTTP = 8080;
const PORT_HTTPS = 8443;
const HOST = "localhost";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { path, method } = req;
  let responseBody: Record<string, any> | undefined;

  const originalJson = res.json;
  res.json = function (body: any, ...args: any[]) {
    responseBody = body;
    return (originalJson as (...params: any[]) => Response).call(
      res,
      body,
      ...args
    );
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${method} ${path} ${res.statusCode} ${duration}ms`;
      if (responseBody) {
        logLine += ` :: ${JSON.stringify(responseBody)}`;
      }

      log(logLine.length > 80 ? `${logLine.slice(0, 79)}…` : logLine);
    }
  });

  next();
});

// Khởi động server
const startServer = async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error ${status}: ${message}`);
      res.status(status).json({ error: message });
    });

    // Cấu hình môi trường
    const isDev = app.get("env") === "development";
    if (isDev) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Tạo servers
    const httpServer = http.createServer(app);
    const httpsServer = https.createServer(credentials, app);
    // ➤ **Tạo WebSocket server**
    const wss = new WebSocketServer({ server: httpsServer });

    wss.on("connection", (ws, req) => {
      console.log("✅ WebSocket client connected");

      ws.on("message", (message) => {
        console.log(`📩 Received: ${message}`);

        try {
          const data = JSON.parse(message.toString()); // Đảm bảo JSON hợp lệ
          ws.send(JSON.stringify({ type: "response", data }));
        } catch (error) {
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid JSON format" })
          );
        }
      });

      ws.on("close", () => {
        console.log("❌ WebSocket client disconnected");
      });
    });

    // Khởi động servers
    httpServer.listen(PORT_HTTP, HOST, () => {
      log(`HTTP Server running at http://${HOST}:${PORT_HTTP}`);
    });

    httpsServer.listen(PORT_HTTPS, HOST, () => {
      log(`HTTPS Server running at https://${HOST}:${PORT_HTTPS}`);
    });

    // Xử lý graceful shutdown
    const shutdown = async (signal: string) => {
      log(`${signal} received. Shutting down servers...`);
      httpServer.close();
      httpsServer.close();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    log(
      `Server startup error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
};

// Khởi động ứng dụng
startServer();
