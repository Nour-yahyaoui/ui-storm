import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const port = Number(process.env.PORT ?? 4173);

// The demo imports the built module, so a first run has to build it once.
if (!existsSync(join(root, "dist", "esm", "index.js"))) {
  console.log("dist is missing — building it first");
  const built = spawnSync(process.execPath, [join(root, "scripts", "build.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (built.status !== 0) process.exit(built.status ?? 1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/** Maps a request path to a file inside the package, or null when it escapes. */
export function resolveRequest(rootDirectory, pathname) {
  const relative = pathname === "/" || pathname === "" ? "demo/index.html" : pathname.replace(/^\/+/, "");
  const file = resolve(rootDirectory, relative);
  if (file !== rootDirectory && !file.startsWith(rootDirectory + sep)) return null;
  return file;
}

const server = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end("bad request");
    return;
  }

  const file = resolveRequest(root, pathname);
  if (file === null) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" }).end("forbidden");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  const bound = server.address();
  const shown = typeof bound === "object" && bound ? bound.port : port;
  console.log(`bidi-kit demo on http://localhost:${shown}/`);
});
