import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Starts the demo server on a free port and resolves once it reports one. */
function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "scripts", "serve.mjs")], {
      cwd: root,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("the demo server did not report a port within 20s"));
    }, 20_000);
    let output = "";
    const done = (error, value) => {
      clearTimeout(timer);
      child.stdout.destroy();
      child.stderr.destroy();
      if (error) reject(error);
      else resolve(value);
    };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/localhost:(\d+)\//);
      if (match) done(null, { child, port: Number(match[1]) });
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => done(new Error(`the demo server failed: ${chunk}`)));
    child.on("error", (error) => done(error));
  });
}

const get = (port, path) =>
  fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(10_000) });

test("the demo serves the page and the builds, and refuses to leave the package", async (t) => {
  const { child, port } = await startServer();
  const exited = new Promise((resolve) => child.once("exit", resolve));
  t.after(async () => {
    child.kill("SIGKILL");
    await exited;
  });

  const page = await get(port, "/");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await page.text(), /bidi-kit/);

  const esm = await get(port, "/dist/esm/index.js");
  assert.equal(esm.status, 200);
  assert.match(esm.headers.get("content-type") ?? "", /text\/javascript/);
  assert.match(await esm.text(), /export \{/);

  assert.equal((await get(port, "/dist/cjs/index.js")).status, 200);
  assert.equal((await get(port, "/nope.html")).status, 404);

  // `..` segments are collapsed by the URL parser, so these stay inside the
  // package and are simply not found; an encoded separator survives parsing and
  // has to be refused by the server itself.
  assert.equal((await get(port, "/../../etc/passwd")).status, 404);
  assert.equal((await get(port, "/%2e%2e%2f%2e%2e%2fpackage.json")).status, 403);
  // A backslash is a separator on Windows and a filename character on POSIX;
  // either way it must never reach the file.
  assert.notEqual((await get(port, "/..%5c..%5cpackage.json")).status, 200);
});
