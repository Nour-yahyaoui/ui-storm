/**
 * Writes `index.html` from `index.template.html`, inlining the Golden Army mark
 * and the browser build of bidi-kit.
 *
 * Both are inlined on purpose. The page is deployed as two files with no build
 * step on the far side, and a landing page whose logo depends on a second
 * request is a landing page that shows a broken image when the request fails.
 * Keeping one copy of the PNG in a custom property is what stops the HTML from
 * carrying 150 kB of base64.
 *
 *   node site/build.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const template = readFileSync(join(here, "index.template.html"), "utf8");
const logo = readFileSync(join(here, "golden-army.png")).toString("base64");
const script = readFileSync(join(root, "packages", "bidi-kit", "static", "bidi-kit.js"), "utf8");

if (template.includes("__KIT_SCRIPT__")) {
  throw new Error("the template no longer needs the script inlined; delete this branch");
}

writeFileSync(join(here, "index.html"), template.replaceAll("__LOGO_BASE64__", logo));
writeFileSync(join(here, "bidi-kit.js"), script);

const kilobytes = (readFileSync(join(here, "index.html")).length / 1024).toFixed(0);
console.log(`wrote site/index.html (${kilobytes} kB) and site/bidi-kit.js`);
