import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as esm from "../dist/esm/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = readFileSync(join(root, "dist", "bidi-kit.global.js"), "utf8");

/** Loads the bundle the way a browser would: one script, no module system. */
const asBrowser = () => {
  const context = vm.createContext({});
  vm.runInContext(bundle, context);
  return context.bidiKit;
};

/** Loads the bundle the way a CommonJS file would, for a copy inside a project. */
const asCommonJs = () => {
  const context = vm.createContext({ module: { exports: {} } });
  vm.runInContext(bundle, context);
  return context.module.exports;
};

test("the classic script sets a global with the same API as the module build", () => {
  const global = asBrowser();
  assert.deepEqual(Object.keys(global).sort(), Object.keys(esm).sort());
  assert.equal(typeof global.paragraph, "function");
  assert.equal(global.CSS, esm.CSS);
  assert.equal(global.FONT_STACKS.arabic, esm.FONT_STACKS.arabic);
});

test("and gives the same answers, string for string", () => {
  for (const load of [asBrowser, asCommonJs]) {
    const kit = load();
    const samples = [
      "Hello أحمد.",
      "Write to أحمد. He is late.",
      "السعر 123.45% فقط",
      "اتصل +971 50 123 4567",
      "Bonjour, أحمد. Ça va ?",
      "«مرحبا» (test)",
      "email: a.mohamed@example.com",
      "",
    ];
    for (const sample of samples) {
      // JSON rather than deepEqual: objects made inside a vm context have that
      // context's Object.prototype, which strict comparison rejects.
      assert.equal(JSON.stringify(kit.segments(sample)), JSON.stringify(esm.segments(sample)), sample);
      assert.equal(kit.resolveDirection(sample), esm.resolveDirection(sample), sample);
      assert.equal(kit.isolate(sample), esm.isolate(sample), sample);
    }
    assert.equal(
      kit.paragraph(["The greeting is ", { text: "مرحبا", dir: "rtl", lang: "ar" }, "."], { lang: "en" }),
      esm.paragraph(["The greeting is ", { text: "مرحبا", dir: "rtl", lang: "ar" }, "."], { lang: "en" }),
    );
    assert.equal(
      JSON.stringify(kit.audit('\u202Ex<span dir="rtl">y</span>')),
      JSON.stringify(esm.audit('\u202Ex<span dir="rtl">y</span>')),
    );
  }
});

test("the bundle carries no module syntax and no node built-in", () => {
  assert.doesNotMatch(bundle, /^\s*(import|export)\s/m);
  assert.doesNotMatch(bundle, /require\(\s*["']node:/);
  assert.doesNotMatch(bundle, /process\.(env|argv)/);
  assert.match(bundle, /globalThis/);
});

test("the bundle stays small enough to sit in a page", () => {
  const kilobytes = Buffer.byteLength(bundle) / 1024;
  assert.ok(kilobytes < 40, `bundle is ${kilobytes.toFixed(1)} kB`);
});
