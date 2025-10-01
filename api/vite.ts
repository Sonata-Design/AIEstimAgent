// api/vite.ts
import express, { type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import type { Server } from "http";
import {
  createServer as createViteServer,
  loadConfigFromFile,
  mergeConfig,
  type ViteDevServer,
} from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(msg: string) {
  const now = new Date();
  console.log(
    `\x1b[90m${now.toLocaleTimeString()}\x1b[0m \x1b[36m[vite]\x1b[0m \x1b[97m${msg}\x1b[0m`
  );
}

export async function setupVite(app: Express, server: Server) {
  // 1) Serve /uploads as plain static FIRST (avoid Vite proxy/self-loop)
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  app.use("/uploads", express.static(uploadsDir));
  log(`Serving /uploads from ${uploadsDir}`);

  // 2) Load vite.config.ts (reuse root/aliases/plugins), but STRIP proxy in middleware mode
  const configFile = path.resolve(__dirname, "..", "vite.config.ts");
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    configFile
  );

  const finalConfig = mergeConfig(loaded?.config ?? {}, {
    server: {
      middlewareMode: true,
      hmr: { server },
      proxy: undefined, // disable to prevent loops
    },
    appType: "spa",
  });

  const vite: ViteDevServer = await createViteServer(finalConfig);
  app.use(vite.middlewares);

  log("Vite dev server running");
}

export function serveStatic(app: Express) {
  const clientDist = path.resolve(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  log(`Serving static files from ${clientDist}`);
}
