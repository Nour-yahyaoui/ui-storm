#!/usr/bin/env node
/**
 * Verifies WCAG contrast ratios for the token palette.
 *
 * jsdom cannot compute contrast, and waiting for a browser run to discover a
 * failing palette is too late. This script reads the real token file, resolves
 * variable references, and asserts each documented pair.
 *
 * Usage: node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS_PATH = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/** Throws if the file changes shape in a way this parser cannot follow. */
export function parseTokens(css) {
  const tokens = new Map();
  // Comments may contain selectors; strip them so the block scanner stays honest.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blockPattern = /([^{}]+)\{([^}]*)\}/g;
  let block;

  while ((block = blockPattern.exec(source))) {
    const [, selector, body] = block;
    const isRootLight = selector.trim() === ':root';
    const isRootDark = selector.trim() === ":root[data-theme='dark']";

    if (!isRootLight && !isRootDark) continue;

    const declPattern = /(--aui-[a-z0-9-]+)\s*:\s*([^;]+);/g;
    let decl;
    while ((decl = declPattern.exec(body))) {
      const [, name, rawValue] = decl;
      const value = rawValue.trim();
      if (isRootLight) tokens.set(name, value);
      else tokens.set(`${name}::dark`, value);
    }
  }

  return tokens;
}

function resolve(tokens, name, depth = 0) {
  if (depth > 10) throw new Error(`Circular token reference at ${name}`);
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`Unknown token: ${name}`);
  const reference = /^var\((--aui-[a-z0-9-]+)\)$/.exec(value);
  return reference ? resolve(tokens, reference[1], depth + 1) : value;
}

function toRgb(color) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const digits = hex[1];
    const full =
      digits.length === 3
        ? digits
            .split('')
            .map((d) => d + d)
            .join('')
        : digits;
    return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16));
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color.trim());
  if (rgb) {
    const [r, g, b] = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [r, g, b];
  }
  throw new Error(`Unsupported color format: ${color}`);
}

export function relativeLuminance(color) {
  const [r, g, b] = toRgb(color).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const PAIRS = [
  // WCAG 1.4.3 — normal text needs 4.5:1, large text 3:1.
  { fg: '--aui-color-text', bg: '--aui-color-surface', min: 4.5, label: 'Body text on surface' },
  { fg: '--aui-color-text', bg: '--aui-color-canvas', min: 4.5, label: 'Body text on canvas' },
  {
    fg: '--aui-color-text-muted',
    bg: '--aui-color-surface',
    min: 4.5,
    label: 'Muted text on surface',
  },
  {
    fg: '--aui-color-text-muted',
    bg: '--aui-color-canvas',
    min: 4.5,
    label: 'Muted text on canvas',
  },
  {
    fg: '--aui-color-text-on-accent',
    bg: '--aui-color-accent',
    min: 4.5,
    label: 'Text on accent fill',
  },
  {
    fg: '--aui-color-danger',
    bg: '--aui-color-surface',
    min: 4.5,
    label: 'Danger text on surface',
  },
  {
    fg: '--aui-color-success',
    bg: '--aui-color-surface',
    min: 4.5,
    label: 'Success text on surface',
  },
  {
    fg: '--aui-color-warning',
    bg: '--aui-color-surface',
    min: 4.5,
    label: 'Warning text on surface',
  },
  { fg: '--aui-color-info', bg: '--aui-color-surface', min: 4.5, label: 'Info text on surface' },
  {
    fg: '--aui-color-accent',
    bg: '--aui-color-surface',
    min: 4.5,
    label: 'Accent text/link on surface',
  },

  // WCAG 1.4.11 — non-text contrast for control boundaries and focus rings: 3:1.
  {
    fg: '--aui-color-border-strong',
    bg: '--aui-color-surface',
    min: 3,
    label: 'Control border on surface',
  },
  {
    fg: '--aui-color-border-strong',
    bg: '--aui-color-canvas',
    min: 3,
    label: 'Control border on canvas',
  },
  {
    fg: '--aui-color-focus-ring',
    bg: '--aui-color-surface',
    min: 3,
    label: 'Focus ring on surface',
  },
  { fg: '--aui-color-focus-ring', bg: '--aui-color-canvas', min: 3, label: 'Focus ring on canvas' },
];

function run() {
  const css = readFileSync(TOKENS_PATH, 'utf8');
  const light = parseTokens(css);

  // Dark tokens fall back to light values for anything not remapped.
  const dark = new Map(light);
  for (const [key, value] of light) {
    if (key.endsWith('::dark')) {
      dark.set(key.replace('::dark', ''), value);
    }
  }

  const failures = [];
  const reports = [];

  for (const theme of ['light', 'dark']) {
    const tokens = theme === 'light' ? light : dark;
    for (const pair of PAIRS) {
      const fg = resolve(tokens, pair.fg);
      const bg = resolve(tokens, pair.bg);
      const ratio = contrastRatio(fg, bg);
      const pass = ratio >= pair.min;
      reports.push(
        `${pass ? 'PASS' : 'FAIL'} ${theme.padEnd(5)} ${ratio.toFixed(2).padStart(5)}:1 (min ${pair.min}) ${pair.label}`,
      );
      if (!pass)
        failures.push(`${theme}: ${pair.label} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`);
    }
  }

  console.log(reports.join('\n'));

  if (failures.length > 0) {
    console.error(`\n${failures.length} contrast failure(s):\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${reports.length} contrast checks passed.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
