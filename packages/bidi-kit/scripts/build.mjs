import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Run the compiler the way npm would, but without the `.bin` shim: on Windows
// that shim is `tsc.cmd`, which cannot be spawned without a shell, and the
// package should build the same way on every platform.
const compiler = join(root, "node_modules", "typescript", "bin", "tsc");
if (!existsSync(compiler)) {
  console.error(
    "TypeScript is not installed. Run `npm install` (or `npm ci`) in packages/bidi-kit first.",
  );
  process.exit(1);
}

const run = (config) =>
  execFileSync(process.execPath, [compiler, "-p", config], { cwd: root, stdio: "inherit" });

rmSync(join(root, "dist"), { recursive: true, force: true });
run("tsconfig.esm.json");
run("tsconfig.cjs.json");

// The package is ESM-first, so the CommonJS output needs its own scope.
mkdirSync(join(root, "dist", "cjs"), { recursive: true });
writeFileSync(
  join(root, "dist", "cjs", "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("built dist/esm and dist/cjs");
