#!/usr/bin/env node
/**
 * Publishes backlog/backlog.json to GitHub: labels, milestones, then issues.
 *
 * Idempotent by construction:
 *  - labels are matched by name,
 *  - milestones by title,
 *  - issues by the `<!-- aui-key: ... -->` marker appended to each body.
 *
 * Labels and milestones are attached in a second call, after creation. Some
 * GitHub integrations accept issue creation but reject label/milestone updates
 * (they answer 403 "Resource not accessible by integration"); that is reported
 * per issue and summarised at the end instead of failing silently.
 *
 * Usage:
 *   npm run backlog:publish -- --dry-run     # show what would be created
 *   npm run backlog:publish                   # create missing issues
 *   npm run backlog:repair                    # re-apply labels + milestones only
 *   GITHUB_REPOSITORY=owner/repo npm run backlog:publish
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BACKLOG = JSON.parse(
  readFileSync(fileURLToPath(new URL('../backlog/backlog.json', import.meta.url)), 'utf8'),
);

const REPOSITORY = process.env.GITHUB_REPOSITORY ?? 'Nour-yahyaoui/ui-storm';
const DRY_RUN = process.argv.includes('--dry-run');
const REPAIR_ONLY = process.argv.includes('--repair');
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

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

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
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 6) {
      throw new ApiError(
        `${method} ${path} failed (${response.status}): ${text}`,
        response.status,
        text,
      );
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
const metadataBlocked = [];

/**
 * Attaches labels and milestone to an existing issue.
 * Returns 'applied', 'skipped' (already correct) or 'blocked'.
 */
async function applyMetadata(issueNumber, issue, milestoneNumber, current = {}) {
  let result = 'skipped';
  const labels = issue.labels ?? [];
  const currentLabels = new Set(current.labels ?? []);
  const missingLabels = labels.filter((label) => !currentLabels.has(label));

  if (missingLabels.length > 0) {
    try {
      await api(`/repos/${REPOSITORY}/issues/${issueNumber}/labels`, {
        method: 'POST',
        body: { labels: missingLabels },
      });
      result = 'applied';
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 422)) {
        metadataBlocked.push({ issueNumber, what: 'labels', status: error.status });
      } else {
        throw error;
      }
    }
  }

  if (milestoneNumber && current.milestone !== issue.milestone) {
    try {
      await api(`/repos/${REPOSITORY}/issues/${issueNumber}`, {
        method: 'PATCH',
        body: { milestone: milestoneNumber },
      });
      result = 'applied';
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 422)) {
        metadataBlocked.push({ issueNumber, what: 'milestone', status: error.status });
      } else {
        throw error;
      }
    }
  }

  return result;
}

async function main() {
  console.log(`Repository: ${REPOSITORY}`);
  console.log(`Backlog: ${BACKLOG.issues.length} issues${REPAIR_ONLY ? ' (repair mode)' : ''}`);

  if (DRY_RUN) {
    for (const issue of BACKLOG.issues.slice(0, Math.min(5, LIMIT))) {
      console.log(`\n[${issue.order}] ${issue.title}`);
      console.log(`    labels: ${issue.labels.join(', ')}`);
      console.log(`    milestone: ${issue.milestone}`);
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

  // ── existing issues ──────────────────────────────────────────────────────
  const existingIssues = await paginate(`/repos/${REPOSITORY}/issues?state=all`);
  const published = new Map();

  for (const issue of existingIssues) {
    if (issue.pull_request) continue;
    const match = markerPattern.exec(issue.body ?? '');
    if (match) {
      published.set(match[1], {
        number: issue.number,
        labels: (issue.labels ?? []).map((label) =>
          typeof label === 'string' ? label : label.name,
        ),
        milestone: issue.milestone?.title ?? null,
      });
    }
  }
  console.log(`Issues: ${published.size} of ${BACKLOG.issues.length} already published`);

  let created = 0;
  let skipped = 0;
  let metadataApplied = 0;
  let checked = 0;

  for (const issue of BACKLOG.issues) {
    if (checked >= LIMIT) break;
    checked += 1;

    const existing = published.get(issue.key);
    if (existing) {
      skipped += 1;
      if (REPAIR_ONLY) {
        const result = await applyMetadata(
          existing.number,
          issue,
          milestoneNumbers.get(issue.milestone),
          existing,
        );
        if (result === 'applied') metadataApplied += 1;
        await sleep(DELAY_MS / 2);
      }
      continue;
    }

    if (REPAIR_ONLY) continue;

    const missing = issue.dependsOn.filter((key) => !published.has(key));
    if (missing.length > 0) {
      throw new Error(
        `Refusing to publish "${issue.title}": dependency ${missing.join(', ')} has no issue. ` +
          'The backlog is out of dependency order — run npm run backlog:build.',
      );
    }

    const dependencyLine =
      issue.dependsOn.length > 0
        ? `\n\n**Depends on:** ${issue.dependsOn.map((key) => `#${published.get(key).number}`).join(', ')}`
        : '';

    const body = `${issue.body.trimEnd()}${dependencyLine}\n\n<!-- aui-key: ${issue.key} -->`;

    const createdIssue = await api(`/repos/${REPOSITORY}/issues`, {
      method: 'POST',
      body: { title: issue.title, body },
    });

    published.set(issue.key, { number: createdIssue.number, labels: [], milestone: null });
    created += 1;

    const result = await applyMetadata(
      createdIssue.number,
      issue,
      milestoneNumbers.get(issue.milestone),
      { labels: [], milestone: null },
    );
    if (result === 'applied') metadataApplied += 1;

    if (created % 20 === 0) {
      console.log(`  … ${created} created (last: #${createdIssue.number})`);
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nDone. ${created} created, ${skipped} already present, ${metadataApplied} with metadata applied.`,
  );

  if (metadataBlocked.length > 0) {
    const sample = metadataBlocked
      .slice(0, 5)
      .map((entry) => `#${entry.issueNumber} (${entry.what})`);
    console.warn(
      `\n⚠ ${metadataBlocked.length} metadata update(s) were rejected by the GitHub integration.` +
        `\n  Example: ${sample.join(', ')}` +
        '\n  The issues were created, but labels and milestones were not attached.' +
        '\n  This happens with tokens whose permissions cannot modify issues (403 "Resource not accessible by integration").' +
        '\n  Re-run `npm run backlog:repair` with a token that can edit issues, or use `gh auth login` as the repository owner.' +
        '\n  The authoritative labels and milestone for every issue are in backlog/backlog.json and docs/backlog.md.',
    );
  }

  console.log(`\nBacklog: https://github.com/${REPOSITORY}/issues`);
  console.log(`Milestones: https://github.com/${REPOSITORY}/milestones`);
}

main().catch((error) => {
  console.error(`\nPublishing failed: ${error.message}\n`);
  process.exit(1);
});
