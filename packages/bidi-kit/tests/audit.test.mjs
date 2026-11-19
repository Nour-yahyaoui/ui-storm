import assert from "node:assert/strict";
import test from "node:test";
import { audit, formatAudit } from "../dist/esm/index.js";

const rules = (source) => audit(source).map((issue) => issue.rule);

test("invisible bidi controls are errors", () => {
  const [issue] = audit("invoice\u202Efdp.exe");
  assert.equal(issue.rule, "bidi-control-character");
  assert.equal(issue.severity, "error");
  assert.equal(issue.index, 7);
});

test("an isolated span is flagged, because span does not isolate", () => {
  assert.deepEqual(rules('<span dir="rtl">مرحبا</span>'), ["inline-direction-without-isolation"]);
});

test("physical alignment and physical margins are flagged", () => {
  assert.deepEqual(rules("p { text-align: left; }"), ["physical-text-align"]);
  assert.deepEqual(rules("p { margin-left: 1rem; }"), ["physical-css-property"]);
});

test("a document without a language is flagged", () => {
  assert.deepEqual(rules("<html><body>x</body></html>"), ["document-without-lang"]);
  assert.deepEqual(rules('<html lang="ar"><body>x</body></html>'), []);
});

test("clean markup produces no findings", () => {
  const clean = audit('<html lang="en"><body><p dir="ltr">Hello <bdi lang="ar">أحمد</bdi></p></body></html>');
  assert.deepEqual(clean, []);
  assert.equal(formatAudit([]), "no bidi issues found");
});

test("findings are ordered by position and format as one line each", () => {
  const source = '<html><span dir="rtl">x</span><p style="text-align: left">y</p></html>';
  const findings = audit(source);
  assert.deepEqual(
    findings.map((finding) => finding.index),
    [...findings.map((finding) => finding.index)].sort((a, b) => a - b),
  );
  const text = formatAudit(findings, "page.html");
  assert.equal(text.split("\n").length, findings.length);
  assert.match(text.split("\n")[0], /^page\.html: \[warning\] /);
});
