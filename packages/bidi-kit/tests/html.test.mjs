import assert from "node:assert/strict";
import test from "node:test";
import { apply, bdi, escapeHtml, inline, paragraph } from "../dist/esm/index.js";

test("bdi emits an isolate and leaves the direction to the browser", () => {
  assert.equal(bdi("أحمد"), "<bdi>أحمد</bdi>");
  assert.equal(bdi("أحمد", { dir: "rtl", lang: "ar" }), '<bdi dir="rtl" lang="ar">أحمد</bdi>');
});

test("inline emits a span that isolates by style", () => {
  assert.equal(inline("Ahmed"), '<span dir="auto">Ahmed</span>');
});

test("text is escaped, never trusted", () => {
  assert.equal(escapeHtml('<script>&"\''), "&lt;script&gt;&amp;&quot;&#39;");
  assert.equal(bdi("<img onerror=x>"), "<bdi>&lt;img onerror=x&gt;</bdi>");
  assert.equal(
    inline("x", { class: 'a" onclick="y' }),
    '<span dir="auto" class="a&quot; onclick=&quot;y">x</span>',
  );
});

test("a paragraph resolves its own direction from its content", () => {
  assert.equal(paragraph(["Hello"]), '<p dir="ltr">Hello</p>');
  assert.equal(paragraph(["مرحبا"]), '<p dir="rtl">مرحبا</p>');
  assert.equal(paragraph(["مرحبا"], { lang: "ar" }), '<p dir="rtl" lang="ar">مرحبا</p>');
  assert.equal(paragraph(["مرحبا"], { dir: "ltr" }), '<p dir="ltr">مرحبا</p>');
});

test("named parts are isolated, with their own direction, language and font", () => {
  const html = paragraph(
    [
      "Hello ",
      { text: "أحمد", dir: "rtl", lang: "ar", font: '"Noto Naskh Arabic", serif' },
      ", can you review this?",
    ],
    { lang: "en" },
  );
  assert.equal(
    html,
    '<p dir="ltr" lang="en">Hello <bdi dir="rtl" lang="ar" style="font-family: &quot;Noto Naskh Arabic&quot;, serif">أحمد</bdi>, can you review this?</p>',
  );
});

test("an Arabic paragraph holds a French quotation without breaking", () => {
  const html = paragraph(
    [
      { text: "يقول:", dir: "rtl", lang: "ar" },
      " ",
      { text: "« Bonjour à tous »", dir: "ltr", lang: "fr" },
    ],
    { lang: "ar" },
  );
  assert.equal(
    html,
    '<p dir="rtl" lang="ar"><bdi dir="rtl" lang="ar">يقول:</bdi> <bdi dir="ltr" lang="fr">« Bonjour à tous »</bdi></p>',
  );
});

test("html:true passes strings through, for content that was already sanitised", () => {
  assert.equal(paragraph(["<b>bold</b>"], { html: true }), '<p dir="ltr"><b>bold</b></p>');
  assert.equal(paragraph(["<b>أحمد</b>"], { html: true }), '<p dir="rtl"><b>أحمد</b></p>');
});

test("apply sets text and direction on any element-shaped object", () => {
  const element = {
    textContent: "",
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  apply(element, "مرحبا بكم");
  assert.equal(element.textContent, "مرحبا بكم");
  assert.equal(element.attributes.dir, "rtl");
  apply(element, "Hello", { dir: "ltr" });
  assert.equal(element.attributes.dir, "ltr");
});
