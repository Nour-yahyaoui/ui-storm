#!/usr/bin/env node
/**
 * bidi-kit on the command line.
 *
 * The three things that are hard to see in a browser — which run is which
 * direction, what an invisible control character is doing, and whether a
 * template has a physical `text-align` — are all easy to print in a terminal.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const entry = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "esm", "index.js");
if (!existsSync(entry)) {
  console.error("bidi-kit is not built: run `npm run build` first.");
  process.exit(2);
}
const { audit, formatAudit, segments, isolateRunsText, resolveDirection } = await import(entry);

const USAGE = `bidi-kit — mixed-direction text, checked from the terminal

Usage
  bidi-kit check <file...>     report bidi hazards in HTML or CSS (exit 1 on errors)
  bidi-kit runs <file>         print each run with its direction
  bidi-kit isolate <file>      print the text with every run isolated
  bidi-kit dir <file>          print the resolved paragraph direction

  Use - to read stdin. With no file, stdin is read.`;

const [, , command = "check", ...rest] = process.argv;

async function readInputs(files) {
  if (files.length === 0 || files.includes("-")) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return [{ name: "<stdin>", text: Buffer.concat(chunks).toString("utf8") }];
  }
  return Promise.all(
    files.map(async (file) => ({ name: file, text: await readFile(file, "utf8") })),
  );
}

if (command === "--help" || command === "-h" || command === "help") {
  console.log(USAGE);
  process.exit(0);
}

if (!["check", "runs", "isolate", "dir"].includes(command)) {
  console.error(`unknown command: ${command}\n\n${USAGE}`);
  process.exit(2);
}

const inputs = await readInputs(rest);
let failed = false;

for (const { name, text } of inputs) {
  if (command === "check") {
    const issues = audit(text);
    if (issues.length === 0) continue;
    console.log(formatAudit(issues, name === "<stdin>" ? undefined : name));
    if (issues.some((issue) => issue.severity === "error")) failed = true;
  }
  if (command === "runs") {
    for (const run of segments(text)) {
      console.log(`${run.dir.padEnd(4)} ${String(run.start).padStart(4)}  ${JSON.stringify(run.text)}`);
    }
  }
  if (command === "isolate") {
    console.log(isolateRunsText(text));
  }
  if (command === "dir") {
    console.log(resolveDirection(text));
  }
}

process.exit(failed ? 1 : 0);
