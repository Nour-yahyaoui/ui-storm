/**
 * Verifies what `npm publish` would actually upload.
 *
 * The tarball is the only thing a consumer ever sees, so it is worth asserting
 * on: both module formats, the declarations, the CLI, the README and the
 * licence have to be in it, and the sources and dependencies have to be out.
 *
 * Written in JavaScript rather than in a shell one-liner so it behaves the same
 * on Linux, macOS and Windows.
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  "dist/esm/index.js",
  "dist/esm/index.d.ts",
  "dist/cjs/index.js",
  "dist/cjs/package.json",
  "dist/bidi-kit.global.js",
  "bin/bidi-kit.mjs",
  "README.md",
  "LICENSE",
];

const FORBIDDEN_PREFIXES = ["src/", "tests/", "node_modules/", "scripts/"];

function pack() {
  // Inside an npm script, npm_execpath points at npm's own CLI, which can be
  // run with the current Node binary — no `.cmd` shim and no shell involved.
  const npmCli = process.env.npm_execpath;
  const options = { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 };
  const output = npmCli
    ? execFileSync(process.execPath, [npmCli, "pack", "--dry-run", "--json"], options)
    : execFileSync("npm", ["pack", "--dry-run", "--json"], {
        ...options,
        shell: process.platform === "win32",
      });
  // npm prints the JSON last; anything before it is a notice from a hook.
  const start = output.indexOf("[");
  return JSON.parse(output.slice(start));
}

let files;
try {
  files = pack()[0].files.map((file) => file.path);
} catch (error) {
  console.error(`could not read the pack list: ${error.message}`);
  process.exit(1);
}

const missing = REQUIRED.filter((path) => !files.includes(path));
const forbidden = files.filter((path) => FORBIDDEN_PREFIXES.some((prefix) => path.startsWith(prefix)));

if (missing.length > 0) console.error(`missing from the tarball: ${missing.join(", ")}`);
if (forbidden.length > 0) console.error(`should not be published: ${forbidden.join(", ")}`);
if (missing.length > 0 || forbidden.length > 0) process.exit(1);

console.log(`tarball ok: ${files.length} files, no sources, no dependencies`);
