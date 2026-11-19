import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const local = join(root, "node_modules", ".bin", "tsc");
const tsc = existsSync(local) ? local : "npx";
const args = (config) => (tsc === "npx" ? ["tsc", "-p", config] : ["-p", config]);
const run = (config) =>
  execFileSync(tsc, args(config), { cwd: root, stdio: "inherit" });

rmSync(join(root, "dist"), { recursive: true, force: true });
run("tsconfig.esm.json");
run("tsconfig.cjs.json");

// The package is ESM-first, so the CommonJS output needs its own scope.
mkdirSync(join(root, "dist/cjs"), { recursive: true });
writeFileSync(
  join(root, "dist/cjs/package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("built dist/esm and dist/cjs");
