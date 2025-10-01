// api/index.ts (only add the marked block)
import 'dotenv/config';
import express from "express";
import path from "path"; // <--- add
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

(async () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // --- ADD: serve /uploads upfront (works in prod + dev) ---
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
  // ---------------------------------------------------------

  // Load API endpoints and get server (HTTP)
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5001', 10);
  const host = process.env.HOST || '127.0.0.1';

  server.listen(port, host, () => {
    log(`Server listening on http://${host}:${port}`);
  });
})();
