/**
 * Copies the built browser bundle to `static/bidi-kit.js`, the copy that is
 * committed so a static page can load it from a CDN without npm.
 *
 * The file has to live in the repository, because the CDN in front of GitHub
 * serves the repository, not a build. `--check` fails when the committed copy
 * and a fresh build disagree, which is the only thing keeping a two-month-old
 * bundle from being served with a new version number.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const built = join(root, "dist", "bidi-kit.global.js");
const committed = join(root, "static", "bidi-kit.js");
const check = process.argv.includes("--check");

if (!existsSync(built)) {
  console.error("dist/bidi-kit.global.js is missing. Run `npm run build` first.");
  process.exit(1);
}

const source = readFileSync(built, "utf8");
const banner = `/* static copy of dist/bidi-kit.global.js — do not edit; run \`npm run static:sync\` */\n`;
const wanted = banner + source;

if (check) {
  if (!existsSync(committed)) {
    console.error("static/bidi-kit.js is missing. Run `npm run static:sync`.");
    process.exit(1);
  }
  if (readFileSync(committed, "utf8") !== wanted) {
    console.error("static/bidi-kit.js is stale. Run `npm run static:sync` and commit the result.");
    process.exit(1);
  }
  console.log("static/bidi-kit.js matches the build");
} else {
  mkdirSync(dirname(committed), { recursive: true });
  writeFileSync(committed, wanted);
  const kilobytes = (Buffer.byteLength(wanted) / 1024).toFixed(1);
  console.log(`wrote static/bidi-kit.js — ${kilobytes} kB`);
}
