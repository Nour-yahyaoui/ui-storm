/**
 * Backlog metadata: milestones, label taxonomy and issue conventions.
 *
 * Everything the publish script needs is declared here so labels and milestones
 * are reproducible on a fresh repository.
 */

export const MILESTONES = [
  {
    slug: 'fnd',
    title: '00 · Foundations & tooling',
    description:
      'Everything components depend on: hooks for controlled state, focus traps, dismiss behaviour, portals, ' +
      'live-region announcements, SSR safety and the scaffolds that keep component work uniform.',
  },
  {
    slug: 'primitives',
    title: '01 · Core primitives',
    description:
      'The smallest building blocks — Button, IconButton, Link, Text, Heading, VisuallyHidden, Spinner, Badge, Kbd, Avatar. ' +
      'These set the API, token and testing conventions every later component copies.',
  },
  {
    slug: 'forms',
    title: '02 · Form controls',
    description:
      'Labelled, validated, error-announcing controls that work with screen readers, keyboards, IME composition and RTL input. ' +
      'Includes the Field primitive that makes label/description/error wiring automatic.',
  },
  {
    slug: 'overlays',
    title: '03 · Overlays & messaging',
    description:
      'Layered UI: dialogs, drawers, popovers, tooltips, menus, toasts and a command palette. Focus restoration, ' +
      'scroll locking, portal stacking and Escape semantics are shared primitives, not per-component rewrites.',
  },
  {
    slug: 'navigation',
    title: '04 · Navigation & structure',
    description:
      'Tabs, accordions, disclosure, breadcrumbs, pagination, steppers, tree views and skip links. ' +
      'Roving tabindex and arrow-key semantics must be identical in LTR and RTL.',
  },
  {
    slug: 'data',
    title: '05 · Data display',
    description:
      'Tables, progress, meters, skeletons, empty states, cards and timelines — read correctly by screen readers ' +
      'and reflowed at 320px without horizontal scrolling.',
  },
  {
    slug: 'rtl',
    title: '06 · RTL & Arabic internationalization',
    description:
      'Bidi isolation, Arabic typography, numerals, calendars, pluralization, mirrored icons and a real device ' +
      'and screen-reader matrix for Arabic locales.',
  },
  {
    slug: 'a11y',
    title: '07 · Accessibility conformance',
    description:
      'WCAG 2.2 AA evidence rather than claims: keyboard-only, screen reader, forced-colors, zoom/reflow, ' +
      'text-spacing, reduced-motion and target-size audits, plus the ACR that records the results.',
  },
  {
    slug: 'docs',
    title: '08 · Documentation & Storybook',
    description:
      'A docs site built from the same source as Storybook: usage guidance, keyboard tables, ARIA contracts, ' +
      'RTL notes, code that can be copied and run, and a published accessibility statement.',
  },
  {
    slug: 'quality',
    title: '09 · Quality engineering',
    description:
      'The test strategy: coverage per directory, mutation testing of the tricky primitives, visual regression ' +
      'for LTR/RTL/dark, browser matrix, flake control, SSR and published-tarball tests.',
  },
  {
    slug: 'release',
    title: '10 · Release & distribution',
    description:
      'Changesets, provenance-signed publishing, exports validation, tree-shaking, size budgets, docs deployment ' +
      'and a support policy that states exactly what versions and browsers are covered.',
  },
  {
    slug: 'dx',
    title: '11 · Adoption, theming & DX',
    description:
      'What it takes to adopt the library: theming and dark mode, framework guides (Next.js RSC, Vite, Remix), ' +
      'Figma token sync, codemods and a starter template that ships RTL by default.',
  },
];

export const LABELS = [
  // type
  { name: 'type: feature', color: '0e8a16', description: 'New capability or component' },
  {
    name: 'type: bug',
    color: 'd73a4a',
    description: 'Behaviour that differs from the documentation',
  },
  {
    name: 'type: a11y',
    color: 'b60205',
    description: 'Accessibility semantics, keyboard or screen reader work',
  },
  { name: 'type: i18n', color: '5319e7', description: 'RTL, bidi and Arabic internationalization' },
  { name: 'type: docs', color: '0075ca', description: 'Documentation, examples and guidance' },
  { name: 'type: test', color: 'fbca04', description: 'Test coverage, harnesses and CI gates' },
  { name: 'type: chore', color: 'ededed', description: 'Tooling, dependencies and maintenance' },
  {
    name: 'type: design',
    color: 'd4c5f9',
    description: 'Design tokens, visual language and design decisions',
  },
  { name: 'type: perf', color: 'c2e0c6', description: 'Performance budgets and optimisation' },
  {
    name: 'type: refactor',
    color: 'bfd4f2',
    description: 'Internal restructuring with no behaviour change',
  },

  // area
  { name: 'area: primitives', color: '1d76db', description: 'Core primitive components' },
  { name: 'area: forms', color: '1d76db', description: 'Form controls and validation' },
  { name: 'area: overlays', color: '1d76db', description: 'Dialogs, popovers, menus, toasts' },
  {
    name: 'area: navigation',
    color: '1d76db',
    description: 'Navigation and structural components',
  },
  { name: 'area: data-display', color: '1d76db', description: 'Data display components' },
  { name: 'area: rtl', color: '5319e7', description: 'Bidirectional layout and Arabic support' },
  { name: 'area: a11y-audit', color: 'b60205', description: 'Conformance auditing and evidence' },
  { name: 'area: docs', color: '0075ca', description: 'Documentation site and Storybook' },
  { name: 'area: tooling', color: 'ededed', description: 'Build, lint, types and scaffolding' },
  { name: 'area: testing', color: 'fbca04', description: 'Test infrastructure and CI' },
  { name: 'area: release', color: '0e8a16', description: 'Publishing and distribution' },
  { name: 'area: dx', color: 'c2e0c6', description: 'Consumer experience and theming' },

  // priority
  { name: 'priority: p0', color: 'b60205', description: 'Blocks the foundation or a release' },
  { name: 'priority: p1', color: 'd93f0b', description: 'Required for the current milestone' },
  { name: 'priority: p2', color: 'fbca04', description: 'Important, can follow the milestone' },
  { name: 'priority: p3', color: 'c5def5', description: 'Nice to have' },

  // size
  { name: 'size: s', color: 'c5def5', description: 'Under a day' },
  { name: 'size: m', color: 'bfd4f2', description: 'One to three days' },
  { name: 'size: l', color: 'f9d0c4', description: 'Three to five days' },
  { name: 'size: xl', color: 'e99695', description: 'Needs splitting before starting' },

  // flags
  {
    name: 'good first issue',
    color: '7057ff',
    description: 'Scoped, documented and reviewed quickly',
  },
  { name: 'help wanted', color: '008672', description: 'Maintainers welcome a contribution' },
  { name: 'needs: design', color: 'd4c5f9', description: 'Blocked on a design decision' },
  {
    name: 'needs: decision',
    color: 'd4c5f9',
    description: 'Blocked on an architecture or API decision',
  },
  { name: 'blocked', color: '000000', description: 'Cannot start until a dependency lands' },
  {
    name: 'breaking-change',
    color: 'e11d21',
    description: 'Requires a major version and migration notes',
  },
];

export const AREA_BY_MILESTONE = {
  fnd: 'area: tooling',
  primitives: 'area: primitives',
  forms: 'area: forms',
  overlays: 'area: overlays',
  navigation: 'area: navigation',
  data: 'area: data-display',
  rtl: 'area: rtl',
  a11y: 'area: a11y-audit',
  docs: 'area: docs',
  quality: 'area: testing',
  release: 'area: release',
  dx: 'area: dx',
};
