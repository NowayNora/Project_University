import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 8443, // Chạy Vite trên cùng cổng với server Express
    https: {
      key: fs.readFileSync("D:\\Every\\ssl\\localhost.key"), // Đường dẫn đến file key
      cert: fs.readFileSync("D:\\Every\\ssl\\localhost.crt"), // Đường dẫn đến file cert
    },
    hmr: {
      protocol: "wss", // Sử dụng WebSocket Secure cho HMR
      host: "localhost",
    },
    proxy: {
      "/api": {
        target: "https://localhost:8443", // Chuyển tiếp yêu cầu API đến server
        changeOrigin: true,
        secure: false, // Bỏ qua kiểm tra chứng chỉ tự ký
      },
      "/uploads": {
        target: "https://localhost:8443", // Chuyển tiếp yêu cầu ảnh đến server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
