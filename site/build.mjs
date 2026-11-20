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
const logo = readFileSync(join(here, "golden-army.jpg")).toString("base64");
const script = readFileSync(join(root, "static", "bidi-kit.js"), "utf8");

// The version is read from the package rather than typed into the page. It was
// typed in twice before, and both copies still said 0.1.0 after 0.1.1 shipped —
// a landing page is the worst place to keep a second copy of a fact.
const version = JSON.parse(
  readFileSync(join(root, "packages", "bidi-kit", "package.json"), "utf8"),
).version;

if (!/^\d+\.\d+\.\d+/.test(version)) {
  throw new Error(`packages/bidi-kit/package.json has no usable version: ${version}`);
}

if (template.includes("__KIT_SCRIPT__")) {
  throw new Error("the template no longer needs the script inlined; delete this branch");
}

const page = template
  .replaceAll("__LOGO_BASE64__", logo)
  .replaceAll("__VERSION__", version);

if (page.includes("__")) {
  throw new Error("the template still has an unfilled placeholder");
}

writeFileSync(join(here, "index.html"), page);
writeFileSync(join(here, "bidi-kit.js"), script);

const kilobytes = (readFileSync(join(here, "index.html")).length / 1024).toFixed(0);
console.log(`wrote site/index.html (${kilobytes} kB, bidi-kit ${version}) and site/bidi-kit.js`);
