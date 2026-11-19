import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 4173);
// The demo imports the built module, so a first run has to build it once.
if (!existsSync(join(root, "dist/esm/index.js"))) {
  console.log("dist is missing — building it first");
  const built = spawnSync(process.execPath, [join(root, "scripts/build.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (built.status !== 0) process.exit(built.status ?? 1);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname));
  const file = join(root, path === "/" ? "/demo/index.html" : path);
  if (!file.startsWith(root)) {
    response.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`bidi-kit demo on http://0.0.0.0:${port}/`);
});
