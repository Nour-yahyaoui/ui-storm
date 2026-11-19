import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import * as esm from "../dist/esm/index.js";

const root = new URL("..", import.meta.url).pathname;
const require = createRequire(import.meta.url);

test("the CommonJS build exposes the same API as the ES module build", () => {
  const cjs = require("../dist/cjs/index.js");
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
  assert.equal(cjs.bdi("أحمد"), esm.bdi("أحمد"));
  assert.equal(cjs.CSS, esm.CSS);
});

test("the published package has no runtime dependencies", async () => {
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.type, "module");
  assert.equal(manifest.exports["."].import, "./dist/esm/index.js");
  assert.equal(manifest.exports["."].require, "./dist/cjs/index.js");
  assert.equal(manifest.exports["."].types, "./dist/esm/index.d.ts");
});

test("the browser build imports nothing from node", async () => {
  const files = await readdir(join(root, "dist/esm"));
  for (const file of files.filter((name) => name.endsWith(".js"))) {
    const source = await readFile(join(root, "dist/esm", file), "utf8");
    assert.doesNotMatch(source, /(from|require\()\s*["']node:/, file);
    assert.doesNotMatch(source, /process\.(env|argv)/, file);
  }
});

test("declarations ship for both entry points", async () => {
  const files = await readdir(join(root, "dist/esm"));
  assert.ok(files.includes("index.d.ts"));
  const declaration = await readFile(join(root, "dist/esm/index.d.ts"), "utf8");
  assert.match(declaration, /export \{[^}]*\bbdi\b[^}]*\} from "\.\/html\.js"/);
  const html = await readFile(join(root, "dist/esm/html.d.ts"), "utf8");
  assert.match(html, /export declare function bdi\(text: string, options\?: HtmlOptions\): string;/);
  assert.match(html, /export declare function paragraph\(/);
});
