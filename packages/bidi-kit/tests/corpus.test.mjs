import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { detectDirection, resolveDirection, segments } from "../dist/esm/index.js";

/**
 * The shared fixtures.
 *
 * The JavaScript is the reference implementation, so this file checks that the
 * reference still does what it did. `crates/bidi-kit/tests/corpus.rs` reads the
 * same file and checks that the Rust port does the same thing — which is the only
 * form of "the port is faithful" that means anything.
 *
 * A failing line here is a change to behaviour. Decide whether you meant it,
 * then regenerate with `node tools/gen-corpus.mjs`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(here, "corpus.json"), "utf8"));

const shape = (text, base) => segments(text, base ?? undefined).map((run) => [run.dir, run.text]);

for (const { text, base, runs, detect, resolve } of corpus.cases) {
  test(`corpus: ${JSON.stringify(text)}`, () => {
    assert.deepEqual(shape(text, base), runs);
    assert.equal(detectDirection(text), detect);
    assert.equal(resolveDirection(text), resolve);
  });
}

test("every run's offsets slice back to its own text", () => {
  for (const { text, base } of corpus.cases) {
    for (const run of segments(text, base ?? undefined)) {
      assert.equal(text.slice(run.start, run.end), run.text);
    }
  }
});

test("the corpus covers the cases that actually break", () => {
  const texts = corpus.cases.map((entry) => entry.text);
  assert.ok(texts.some((text) => text.includes("+216")), "a phone number with a sign");
  assert.ok(texts.some((text) => text.includes("15%")), "a percentage");
  assert.ok(texts.some((text) => text.includes("\u{1ee00}")), "a character outside the BMP");
  assert.ok(texts.some((text) => text.includes("\u{202e}")), "a bidi override");
  assert.ok(texts.includes(""), "the empty string");
});
