#!/usr/bin/env node
/**
 * Publishes backlog/backlog.json to GitHub: labels, milestones, then issues.
 *
 * Idempotent by construction:
 *  - labels are matched by name,
 *  - milestones by title,
 *  - issues by the `<!-- aui-key: ... -->` marker appended to each body.
 *
 * Creating an issue needs the issue's dependencies to exist already, so the
 * build script emits a topological order and this script publishes strictly
 * sequentially (also staying inside GitHub's content-creation rate limits).
 *
 * Usage:
 *   npm run backlog:publish -- --dry-run
 *   npm run backlog:publish
 *   GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... npm run backlog:publish
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BACKLOG = JSON.parse(
  readFileSync(fileURLToPath(new URL('../backlog/backlog.json', import.meta.url)), 'utf8'),
);

const REPOSITORY = process.env.GITHUB_REPOSITORY ?? 'Nour-yahyaoui/ui-storm';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((argument) => argument.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number.parseInt(LIMIT_ARG.split('=')[1], 10) : Number.POSITIVE_INFINITY;
const DELAY_MS = Number.parseInt(process.env.PUBLISH_DELAY_MS ?? '800', 10);

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    console.error(
      'No GitHub token found. Set GITHUB_TOKEN or authenticate the gh CLI (`gh auth login`).',
    );
    process.exit(1);
  }
}

const TOKEN = getToken();

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function api(path, { method = 'GET', body } = {}) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'accessible-ui-lab-backlog',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      const cause = error?.cause?.message ?? error.message;
      if (String(cause).includes('certificate')) {
        throw new Error(
          `TLS verification failed (${cause}). This environment intercepts TLS; run with ` +
            'NODE_EXTRA_CA_CERTS pointed at the system bundle, e.g. ' +
            'NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt npm run backlog:publish',
        );
      }
      throw new Error(`${method} ${path} failed: ${cause}`);
    }

    if (response.ok) {
      if (response.status === 204) return null;
      return response.json();
    }

    const text = await response.text();
    const retryable = response.status === 403 || response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 6) {
      const hint =
        response.status === 403
          ? '\nHint: the token needs issues:write on this repository, and secondary rate limits apply to rapid issue creation.'
          : '';
      throw new Error(`${method} ${path} failed (${response.status}): ${text}${hint}`);
    }

    const retryAfter = Number.parseInt(response.headers.get('retry-after') ?? '', 10);
    const backoff = Number.isNaN(retryAfter) ? attempt * 8000 : retryAfter * 1000;
    console.warn(`  ↻ ${response.status} on ${method} ${path} — retrying in ${backoff / 1000}s`);
    await sleep(backoff);
  }

  throw new Error('unreachable');
}

async function paginate(path) {
  const results = [];
  for (let page = 1; page <= 50; page += 1) {
    const batch = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    results.push(...batch);
    if (batch.length < 100) break;
  }
  return results;
}

const markerPattern = /<!-- aui-key: ([a-z0-9-]+) -->/;

async function main() {
  console.log(`Repository: ${REPOSITORY}`);
  console.log(`Issues: ${Math.min(backlogIssues.length, LIMIT)} of ${backlogIssues.length}`);

  if (DRY_RUN) {
    const milestonesSeen = new Set();
    for (const issue of backlogIssues.slice(0, Math.min(5, LIMIT))) {
      console.log(`\n[${issue.order}] ${issue.title}`);
      console.log(`    labels: ${issue.labels.join(', ')}`);
      console.log(
        `    milestone: ${issue.milestone}${milestonesSeen.has(issue.milestone) ? '' : ' (new)'}`,
      );
      milestonesSeen.add(issue.milestone);
    }
    console.log('\nDry run: nothing was written.');
    return;
  }

  // ── labels ───────────────────────────────────────────────────────────────
  const existingLabels = new Map(
    (await paginate(`/repos/${REPOSITORY}/labels`)).map((label) => [label.name, label]),
  );
  let createdLabels = 0;

  for (const label of BACKLOG.labels) {
    if (existingLabels.has(label.name)) continue;
    await api(`/repos/${REPOSITORY}/labels`, {
      method: 'POST',
      body: { name: label.name, color: label.color, description: label.description },
    });
    createdLabels += 1;
    await sleep(250);
  }
  console.log(
    `Labels: ${createdLabels} created, ${BACKLOG.labels.length - createdLabels} already present`,
  );

  // ── milestones ───────────────────────────────────────────────────────────
  const existingMilestones = new Map(
    (await paginate(`/repos/${REPOSITORY}/milestones?state=all`)).map((milestone) => [
      milestone.title,
      milestone,
    ]),
  );
  const milestoneNumbers = new Map();
  let createdMilestones = 0;

  for (const milestone of BACKLOG.milestones) {
    const existing = existingMilestones.get(milestone.title);
    if (existing) {
      milestoneNumbers.set(milestone.slug, existing.number);
      continue;
    }
    const created = await api(`/repos/${REPOSITORY}/milestones`, {
      method: 'POST',
      body: { title: milestone.title, description: milestone.description, state: 'open' },
    });
    milestoneNumbers.set(milestone.slug, created.number);
    createdMilestones += 1;
    await sleep(400);
  }
  console.log(
    `Milestones: ${createdMilestones} created, ${BACKLOG.milestones.length - createdMilestones} already present`,
  );

  // ── issues ───────────────────────────────────────────────────────────────
  const existingIssues = await paginate(`/repos/${REPOSITORY}/issues?state=all`);
  const issueNumbers = new Map();

  for (const issue of existingIssues) {
    if (issue.pull_request) continue;
    const match = markerPattern.exec(issue.body ?? '');
    if (match) issueNumbers.set(match[1], issue.number);
  }
  console.log(
    `Issues: ${issueNumbers.size} already published, ${backlogIssues.length} in the backlog`,
  );

  let created = 0;
  let skipped = 0;
  let checked = 0;

  for (const issue of backlogIssues) {
    if (checked >= LIMIT) break;
    checked += 1;

    if (issueNumbers.has(issue.key)) {
      skipped += 1;
      continue;
    }

    const missing = issue.dependsOn.filter((key) => !issueNumbers.has(key));
    if (missing.length > 0) {
      throw new Error(
        `Refusing to publish "${issue.title}": dependency ${missing.join(', ')} has no issue number. ` +
          'The backlog is out of dependency order — run npm run backlog:build.',
      );
    }

    const dependencyLine =
      issue.dependsOn.length > 0
        ? `\n\n**Depends on:** ${issue.dependsOn.map((key) => `#${issueNumbers.get(key)}`).join(', ')}`
        : '';

    const body = `${issue.body.trimEnd()}${dependencyLine}\n\n<!-- aui-key: ${issue.key} -->`;

    const createdIssue = await api(`/repos/${REPOSITORY}/issues`, {
      method: 'POST',
      body: {
        title: issue.title,
        body,
        labels: issue.labels,
        milestone: milestoneNumbers.get(issue.milestone),
      },
    });

    issueNumbers.set(issue.key, createdIssue.number);
    created += 1;

    if (created % 20 === 0) {
      console.log(`  … ${created} created (last: #${createdIssue.number})`);
    }

    await sleep(DELAY_MS);
  }

  const url = `https://github.com/${REPOSITORY}/issues`;
  console.log(`\nDone. ${created} created, ${skipped} already present.`);
  console.log(`Backlog: ${url}  ·  Milestones: https://github.com/${REPOSITORY}/milestones`);
}

const backlogIssues = BACKLOG.issues;

main().catch((error) => {
  console.error(`\nPublishing failed: ${error.message}\n`);
  process.exit(1);
});
