import { AREA_BY_MILESTONE } from './config.mjs';

/**
 * Converts a hand-written initiative into a backlog issue.
 *
 * `criteria` is deliberately required: an issue without acceptance criteria is
 * a wish, not work.
 */
export function toIssue(initiative) {
  const area = initiative.area ?? AREA_BY_MILESTONE[initiative.milestone];

  const sections = [
    `## Context\n\n${initiative.summary}`,
    initiative.scope?.length
      ? `## What is in scope\n\n${initiative.scope.map((item) => `- ${item}`).join('\n')}`
      : '',
    `## Acceptance criteria\n\n${initiative.criteria.map((item) => `- [ ] ${item}`).join('\n')}`,
    `## Definition of done\n\n${[
      '- [ ] Documented in the repository (README, docs page or ADR) where a consumer or contributor will look for it',
      '- [ ] A changeset is added when the change is user-facing',
      '- [ ] CI is green and the PR references this issue',
    ].join('\n')}`,
  ].filter(Boolean);

  return {
    key: initiative.key,
    title: initiative.title,
    milestone: initiative.milestone,
    labels: [
      initiative.type,
      area,
      `priority: ${initiative.priority ?? 'p2'}`,
      `size: ${initiative.size ?? 'm'}`,
      ...(initiative.flags ?? []),
    ],
    body: sections.join('\n\n') + '\n',
    dependsOn: initiative.dependsOn ?? [],
    component: null,
  };
}
