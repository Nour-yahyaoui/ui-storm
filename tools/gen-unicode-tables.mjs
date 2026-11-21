/**
 * Generates `crates/bidi-kit/src/tables.rs` from the Unicode properties the
 * JavaScript package uses, read through the same engine that runs it.
 *
 * The Rust port must classify characters exactly as `packages/bidi-kit` does,
 * or the two implementations disagree on text nobody thought to test. Taking the
 * ranges from Node's own `\p{…}` support rather than from a table file means the
 * reference is the engine that runs the JavaScript, at the Unicode version it
 * actually ships — not a snapshot of a different edition.
 *
 *   node tools/gen-unicode-tables.mjs           # rewrite the file
 *   node tools/gen-unicode-tables.mjs --check   # fail if it is out of date
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const target = join(root, "crates", "bidi-kit", "src", "tables.rs");

const LAST = 0x10ffff;

const categories = {
  LETTER: /\p{L}/u,
  MARK: /\p{M}/u,
  FORMAT: /\p{Cf}/u,
  SEPARATOR: /\p{Z}/u,
  DECIMAL_DIGIT: /\p{Nd}/u,
};

function ranges(test) {
  const out = [];
  let start = null;
  for (let code = 0; code <= LAST; code += 1) {
    const hit = test(code);
    if (hit && start === null) start = code;
    else if (!hit && start !== null) {
      out.push([start, code - 1]);
      start = null;
    }
  }
  if (start !== null) out.push([start, LAST]);
  return out;
}

function is(test) {
  // One string allocation per code point is enough at this size, and a
  // surrogate half needs guarding: fromCodePoint accepts 0xD800.
  return (code) => {
    if (code >= 0xd800 && code <= 0xdfff) return false;
    return test.test(String.fromCodePoint(code));
  };
}

const blocks = Object.entries(categories).map(([name, test]) => [
  name,
  ranges(is(test)),
]);

const lines = [];
lines.push("//! Unicode general-category ranges, generated — do not edit.");
lines.push("//!");
lines.push("//! Produced by `tools/gen-unicode-tables.mjs` from the properties the");
lines.push("//! JavaScript package tests with, so both implementations classify a");
lines.push(`//! character the same way. Generated against Unicode ${process.versions.unicode}.`);
lines.push("//!");
lines.push("//! Regenerate after a Node upgrade that changes its Unicode version:");
lines.push("//!");
lines.push("//! ```text");
lines.push("//! node tools/gen-unicode-tables.mjs");
lines.push("//! ```");
lines.push("");
lines.push("/// The code point is inside one of the sorted, inclusive ranges.");
lines.push("pub(crate) fn in_table(table: &[(u32, u32)], code: u32) -> bool {");
lines.push("    table");
lines.push("        .binary_search_by(|&(start, end)| {");
lines.push("            if code < start {");
lines.push("                std::cmp::Ordering::Greater");
lines.push("            } else if code > end {");
lines.push("                std::cmp::Ordering::Less");
lines.push("            } else {");
lines.push("                std::cmp::Ordering::Equal");
lines.push("            }");
lines.push("        })");
lines.push("        .is_ok()");
lines.push("}");
lines.push("");
for (const [name, list] of blocks) {
  const property = { LETTER: "L", MARK: "M", FORMAT: "Cf", SEPARATOR: "Z", DECIMAL_DIGIT: "Nd" }[name];
  lines.push("/// `\\p{" + property + "}` — " + list.length + " ranges.");
  lines.push(`pub(crate) const ${name}: &[(u32, u32)] = &[`);
  let row = "   ";
  for (const [start, end] of list) {
    const piece = ` (0x${start.toString(16)}, 0x${end.toString(16)}),`;
    if ((row + piece).length > 96) {
      lines.push(row);
      row = "   ";
    }
    row += piece;
  }
  if (row.trim()) lines.push(row);
  lines.push("];");
  lines.push("");
}

const output = lines.join("\n");

if (process.argv.includes("--check")) {
  const current = readFileSync(target, "utf8");
  if (current !== output) {
    console.error("crates/bidi-kit/src/tables.rs is stale; run node tools/gen-unicode-tables.mjs");
    process.exit(1);
  }
  console.log("tables.rs matches the generator");
} else {
  writeFileSync(target, output);
  const summary = blocks.map(([name, list]) => `${name} ${list.length}`).join(", ");
  console.log(`wrote ${target} — ${summary} ranges, Unicode ${process.versions.unicode}`);
}
