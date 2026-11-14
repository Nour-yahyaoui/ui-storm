#!/usr/bin/env node
/**
 * Builds backlog/backlog.json from the catalog, tracks and initiatives.
 *
 * The build is deterministic (no timestamps) so `--check` can verify that the
 * committed file matches the generators, and so publishing twice is a no-op.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPONENTS } from '../backlog/catalog.mjs';
import { LABELS, MILESTONES } from '../backlog/config.mjs';
import { A11Y } from '../backlog/initiatives/a11y.mjs';
import { DOCS } from '../backlog/initiatives/docs.mjs';
import { DX } from '../backlog/initiatives/dx.mjs';
import { FOUNDATIONS } from '../backlog/initiatives/foundations.mjs';
import { QUALITY } from '../backlog/initiatives/quality.mjs';
import { RELEASE } from '../backlog/initiatives/release.mjs';
import { RTL } from '../backlog/initiatives/rtl.mjs';
import { componentIssues } from '../backlog/tracks.mjs';

const OUTPUT = fileURLToPath(new URL('../backlog/backlog.json', import.meta.url));
const SUMMARY = fileURLToPath(new URL('../docs/backlog.md', import.meta.url));
const CHECK = process.argv.includes('--check');

const MILESTONE_ORDER = new Map(MILESTONES.map((milestone, index) => [milestone.slug, index]));
const LABEL_NAMES = new Set(LABELS.map((label) => label.name));

function fail(message) {
  console.error(`\nBacklog generation failed: ${message}\n`);
  process.exit(1);
}

// ── collect ────────────────────────────────────────────────────────────────
const initiatives = [...FOUNDATIONS, ...RTL, ...A11Y, ...DOCS, ...QUALITY, ...RELEASE, ...DX];
const issues = [...COMPONENTS.flatMap(componentIssues), ...initiatives];

// ── validate ──────────────────────────────────────────────────────────────
const keys = new Set();
const titles = new Map();
for (const issue of issues) {
  if (!issue.key) fail(`issue without key: ${issue.title}`);
  if (keys.has(issue.key)) fail(`duplicate key: ${issue.key}`);
  keys.add(issue.key);

  const normalised = issue.title.toLowerCase().replace(/\s+/g, ' ').trim();
  if (titles.has(normalised))
    fail(`duplicate title: "${issue.title}" (${titles.get(normalised)} and ${issue.key})`);
  titles.set(normalised, issue.key);

  if (issue.title.length > 200) fail(`title too long (${issue.title.length}): ${issue.title}`);
  if (!issue.body || issue.body.length < 200) fail(`body too short for ${issue.key}`);
  if (issue.body.length > 60_000)
    fail(`body too long for ${issue.key} (${issue.body.length} chars)`);
  if (!MILESTONE_ORDER.has(issue.milestone))
    fail(`unknown milestone "${issue.milestone}" on ${issue.key}`);
  if (!issue.labels.length) fail(`issue without labels: ${issue.key}`);

  for (const label of issue.labels) {
    if (!LABEL_NAMES.has(label)) fail(`unknown label "${label}" on ${issue.key}`);
  }
  if (issue.labels.filter((label) => label.startsWith('priority: ')).length !== 1)
    fail(`missing/duplicate priority on ${issue.key}`);
  if (issue.labels.filter((label) => label.startsWith('type: ')).length !== 1)
    fail(`missing/duplicate type on ${issue.key}`);
  if (issue.labels.filter((label) => label.startsWith('size: ')).length !== 1)
    fail(`missing/duplicate size on ${issue.key}`);
}

// Dependencies are validated after every key is known, so an issue may point at
// a component that appears later in the catalog.
for (const issue of issues) {
  for (const dependency of issue.dependsOn) {
    if (!keys.has(dependency)) fail(`unknown dependency "${dependency}" on ${issue.key}`);
    if (dependency === issue.key) fail(`self dependency on ${issue.key}`);
  }
}

// ── order: dependencies first, then milestone, then declared order ─────────
const byKey = new Map(issues.map((issue) => [issue.key, issue]));
const dependenciesOf = new Map(issues.map((issue) => [issue.key, issue.dependsOn]));
const dependents = new Map(issues.map((issue) => [issue.key, []]));
for (const issue of issues) {
  for (const dependency of issue.dependsOn) dependents.get(dependency).push(issue.key);
}

const sortKey = (issue) =>
  `${String(MILESTONE_ORDER.get(issue.milestone)).padStart(2, '0')}·${issue.component ?? 'zz'}-${String(issue.order ?? 0)}·${issue.key}`;

const ready = issues
  .filter((issue) => issue.dependsOn.length === 0)
  .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
const ordered = [];

while (ready.length > 0) {
  const issue = ready.shift();
  ordered.push(issue);

  for (const dependentKey of dependents.get(issue.key)) {
    const remaining = dependenciesOf
      .get(dependentKey)
      .filter((dependency) => dependency !== issue.key);
    dependenciesOf.set(dependentKey, remaining);
    if (remaining.length === 0) {
      ready.push(byKey.get(dependentKey));
      ready.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    }
  }
}

if (ordered.length !== issues.length) {
  const stuck = issues.filter((issue) => !ordered.includes(issue)).map((issue) => issue.key);
  fail(`dependency cycle detected among: ${stuck.join(', ')}`);
}

// ── emit ──────────────────────────────────────────────────────────────────
const payload = {
  description:
    'Generated by scripts/build-backlog.mjs — do not edit by hand. Run `npm run backlog:build`.',
  milestones: MILESTONES,
  labels: LABELS,
  summary: {
    issues: ordered.length,
    components: COMPONENTS.length,
    byMilestone: Object.fromEntries(
      MILESTONES.map((milestone) => [
        milestone.slug,
        ordered.filter((issue) => issue.milestone === milestone.slug).length,
      ]),
    ),
  },
  issues: ordered.map((issue, index) => ({
    order: index + 1,
    key: issue.key,
    title: issue.title,
    milestone: issue.milestone,
    labels: [...issue.labels].sort(),
    dependsOn: issue.dependsOn,
    body: issue.body,
  })),
};

const json = `${JSON.stringify(payload, null, 2)}\n`;

// ── markdown summary for humans ────────────────────────────────────────────
const lines = [
  '# Backlog',
  '',
  '> Generated by `scripts/build-backlog.mjs`. Edit `backlog/catalog.mjs`, `backlog/config.mjs` or',
  '> `backlog/initiatives/*` and run `npm run backlog:build`. The canonical source is `backlog/backlog.json`.',
  '',
  `**${payload.summary.issues} issues** across **${MILESTONES.length} milestones**, covering ` +
    `**${COMPONENTS.length} components**. Every issue carries acceptance criteria, a type, an area, ` +
    'a priority and a size.',
  '',
  '| Milestone | Issues |',
  '| --- | ---: |',
  ...MILESTONES.map(
    (milestone) => `| ${milestone.title} | ${payload.summary.byMilestone[milestone.slug]} |`,
  ),
  '',
];

for (const milestone of MILESTONES) {
  const milestoneIssues = ordered.filter((issue) => issue.milestone === milestone.slug);
  lines.push(`## ${milestone.title}`, '', milestone.description, '');
  for (const issue of milestoneIssues) {
    // Show the full intended metadata: it is the authoritative record when a
    // GitHub integration cannot attach labels to issues.
    const labels = issue.labels
      .map((label) => label.replace(/^(type|area|priority|size): /, ''))
      .join(' · ');
    lines.push(`- ${issue.title} _(${labels})_`);
  }
  lines.push('');
}

const markdown = `${lines.join('\n')}\n`;

// ── compare / write ───────────────────────────────────────────────────────
if (CHECK) {
  const current = readFileSync(OUTPUT, 'utf8');
  if (current !== json) {
    console.error(
      'backlog/backlog.json is out of date. Run `npm run backlog:build` and commit the result.',
    );
    process.exit(1);
  }
  console.log(`backlog/backlog.json is up to date (${payload.summary.issues} issues).`);
  process.exit(0);
}

writeFileSync(OUTPUT, json);
writeFileSync(SUMMARY, markdown);

console.log(`Wrote ${payload.summary.issues} issues to backlog/backlog.json`);
for (const milestone of MILESTONES) {
  console.log(
    `  ${milestone.title.padEnd(42)} ${String(payload.summary.byMilestone[milestone.slug]).padStart(3)}`,
  );
}
console.log(`\nSummary written to docs/backlog.md`);
