import { serve } from "bun";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { parse as parseJSONC } from "jsonc-parser";

const CONFIG_PATH = join(process.cwd(), "olimpus.jsonc");
const WEB_DIST = join(process.cwd(), "web/dist");
const PORT = 3000;

function readConfig(): unknown {
  if (!existsSync(CONFIG_PATH)) return {};
  const text = readFileSync(CONFIG_PATH, "utf-8");
  return parseJSONC(text);
}

function writeConfig(data: unknown): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname === "/api/health") {
      return Response.json({ status: "ok" });
    }
    if (pathname === "/api/config" && req.method === "GET") {
      return Response.json(readConfig());
    }
    if (pathname === "/api/config" && req.method === "PUT") {
      const body = await req.json();
      writeConfig(body);
      return Response.json({ ok: true });
    }
    if (pathname === "/api/config/validate" && req.method === "POST") {
      return Response.json({ valid: true });
    }

    // Serve static files from web/dist
    let filePath = join(WEB_DIST, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(filePath)) filePath = join(WEB_DIST, "index.html");
    const file = Bun.file(filePath);
    return new Response(file);
  },
});

console.log(`Olimpus Config Editor running at http://localhost:${PORT}`);
