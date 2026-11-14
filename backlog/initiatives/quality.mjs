import { toIssue } from '../initiative.mjs';

export const QUALITY = [
  {
    key: 'qa-visual-regression',
    title: 'Set up Playwright visual regression for LTR, RTL and dark mode',
    type: 'type: test',
    size: 'l',
    priority: 'p1',
    summary:
      'Direction and theme regressions are visual. Baselines per story in three configurations turn "looks fine" into a diff.',
    scope: [
      'Playwright toHaveScreenshot with a documented threshold and platform handling',
      'Stories enumerated from the built story index, not a hand-maintained list',
    ],
    criteria: [
      'Baselines committed for foundations and the five starter components',
      'Projects cover LTR light, RTL Arabic light and LTR dark',
      'Failures upload actual, expected and diff images as CI artifacts',
      'An update script regenerates baselines and its diff is reviewed in the pull request',
      'Font rendering differences documented so Linux CI and macOS agree or are scoped out',
    ],
  },
  {
    key: 'qa-coverage-per-directory',
    title: 'Enforce coverage thresholds per directory, not globally',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'A global 80% hides an untested overlay behind a heavily tested utility. Thresholds belong to the directories that matter.',
    criteria: [
      'Thresholds: focus/direction utilities 100%, components 90% lines/branches, test-utils excluded',
      'Coverage report comments the delta on each pull request',
      'Failures name the file and the uncovered branch',
      'Thresholds ratchet upward and never downward without an ADR',
    ],
  },
  {
    key: 'qa-mutation-testing',
    title: 'Run mutation testing on the accessibility primitives',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Coverage says code ran; mutation testing says tests would notice if it broke. Focus trapping, direction resolution and the axe harness are worth the effort.',
    criteria: [
      'Stryker configured for src/lib/focus.ts, src/lib/direction.ts and src/test-utils/axe.ts',
      'Mutation score at least 80% on those files',
      'Surviving mutants reviewed: each either gets a test or is documented as equivalent',
      'Runs on a schedule rather than every pull request to keep CI fast',
    ],
  },
  {
    key: 'qa-storybook-test-runner',
    title: 'Run stories as tests with the Storybook test runner',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Every story is a rendering contract. Executing them in CI catches broken stories before a human opens Storybook.',
    criteria: [
      'All stories render without console errors or failing play functions',
      'The a11y addon runs as part of the test run and fails on violations',
      'Failures report the story id and a link to the built story',
      'Runs in parallel and completes within the CI budget',
    ],
  },
  {
    key: 'qa-flake-control',
    title: 'Define the flake policy: retries, quarantine and ownership',
    type: 'type: chore',
    size: 's',
    priority: 'p2',
    summary:
      'Retries hide real races. A written policy keeps the suite trustworthy: retry on infrastructure, quarantine with an owner and a deadline.',
    criteria: [
      'Retries limited to two in CI and zero locally',
      'Quarantined tests are skipped explicitly with an issue link and an expiry date',
      'A weekly report lists tests that needed a retry',
      'Any test quarantined longer than two weeks blocks the milestone',
    ],
  },
  {
    key: 'qa-timer-convention',
    title: 'Standardise fake-timer usage for animation and debounce tests',
    type: 'type: test',
    size: 's',
    priority: 'p2',
    summary:
      'Overlay tests that wait for real timers are slow and flaky. A convention for advancing timers and flushing microtasks fixes both.',
    criteria: [
      'Documented pattern using userEvent with advanceTimers and act',
      'No waitForTimeout in committed unit or Playwright tests (lint rule)',
      'Timer-based components (Toast, Tooltip, debounced search) covered with the pattern',
      'Tests complete without real delays; suite runtime measured before and after',
    ],
  },
  {
    key: 'qa-fixtures',
    title: 'Create Arabic and mixed-script test fixtures',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Tests that use "test test" in Arabic prove nothing. Fixtures with real names, diacritics, mixed identifiers and long strings make RTL tests meaningful.',
    criteria: [
      'Fixture module with Arabic names, sentences with tashkeel, mixed Latin identifiers and numerals',
      'At least one pathological string per fixture set (very long, RTL+emoji, bidi control characters)',
      'Fixtures used by stories and tests so both cover the same content',
      'Documented so contributors know which fixture to use where',
    ],
    flags: ['good first issue'],
  },
  {
    key: 'qa-public-api-snapshot',
    title: 'Snapshot the public API surface',
    type: 'type: test',
    size: 's',
    priority: 'p2',
    summary:
      'Accidental exports become support commitments. A committed snapshot makes every addition to the public surface a reviewed decision.',
    criteria: [
      'Script writes a sorted snapshot of exported names and types',
      'CI fails when the snapshot changes without the snapshot file being updated',
      'Breaking removals are visible in the diff and require a major changeset',
      'Snapshot is referenced by the release checklist',
    ],
  },
  {
    key: 'qa-bundle-budget',
    title: 'Add bundle size budgets and per-import measurement',
    type: 'type: perf',
    size: 'm',
    priority: 'p2',
    summary:
      'A component library that adds 80 kB to a consumer page gets removed. Budgets must be measured per import path, not for the whole package.',
    criteria: [
      'Budgets defined for the entry point and for each shipped component path',
      'CI reports the delta on every pull request and fails on budget breaches',
      'Sizes measured with a real consumer fixture, minified and gzipped',
      'Icons and overlays documented as opt-in imports',
    ],
  },
  {
    key: 'qa-renovate',
    title: 'Automate dependency updates with a review policy',
    type: 'type: chore',
    size: 's',
    priority: 'p2',
    summary:
      'Storybook, Playwright and Vite move fast. Updates need to be routine, grouped and gated, not a quarterly crisis.',
    criteria: [
      'Renovate groups major updates separately and automerges patch updates that pass CI',
      'Peer dependency changes are labelled breaking-change automatically',
      'Lockfile policy documented: committed, updated only through PRs',
      'Security advisories open an issue immediately with a severity label',
    ],
  },
  {
    key: 'qa-browser-matrix',
    title: 'Run the browser matrix: Chromium, Firefox and WebKit',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Safari and Firefox disagree about focus, inert, scrollbars and RTL scrolling. Testing only Chromium would ship those bugs.',
    criteria: [
      'Playwright projects for all three engines, with the keyboard and axe suites running on each',
      'Engine-specific quirks documented with a link to the failing test',
      'CI runs the full matrix on pull requests to main and nightly otherwise',
      'Known engine bugs get a skip with an issue link and an expiry',
    ],
  },
  {
    key: 'qa-playwright-sharding',
    title: 'Shard the Playwright suite to keep CI under ten minutes',
    type: 'type: perf',
    size: 's',
    priority: 'p2',
    summary:
      'A slow suite stops being run. Sharding the story scans across runners is the cheapest way to keep feedback fast.',
    criteria: [
      'Suite sharded across at least four CI jobs with --shard',
      'Merged report published as a single artifact',
      'Runtime measured before and after, reported in the pull request',
      'No test depends on execution order (verified by a shuffled run)',
    ],
  },
  {
    key: 'qa-ssr-tests',
    title: 'Render every component on the server in CI',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Portals, ids and media queries are hydration hazards. The SSR harness must run over every component, not just the foundation.',
    criteria: [
      'Every component is included in the SSR/hydration suite automatically',
      'Warnings and errors are treated as failures',
      'RTL locales included in the server render',
      'A test explicitly covers a component opened in a dialog and closed during hydration',
    ],
    dependsOn: ['fnd-ssr-harness'],
  },
  {
    key: 'qa-tarball-test',
    title: 'Test the published tarball, not the source tree',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Exports maps, CSS paths and type declarations can be wrong even when the source builds. Installing the tarball in a fixture app is the only real check.',
    criteria: [
      'npm pack output installed in a Vite fixture and built in CI',
      'Import from the package root, the styles subpath and one deep component path all work',
      'TypeScript resolves declarations in the fixture with strict mode',
      'Tarball contents asserted: no tests, no stories, no source maps pointing at missing files',
    ],
    dependsOn: ['rel-publint-attw'],
  },
  {
    key: 'qa-type-tests',
    title: 'Gate type-level regressions in CI',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Without type tests, a widened prop union silently breaks consumer compilation. Types are part of the API and deserve tests.',
    criteria: [
      'Type tests run in CI against the built declarations, not the source',
      'Coverage for discriminated unions, generic inference and ref types',
      'A deliberate breaking type change fails the suite',
      'Runtime stays short (type tests only compile what they assert)',
    ],
    dependsOn: ['fnd-type-tests'],
  },
  {
    key: 'qa-render-budget',
    title: 'Add render-count and interaction-latency budgets for overlays',
    type: 'type: perf',
    size: 'm',
    priority: 'p3',
    summary:
      'Overlays re-render the tree behind them if context updates are careless. Measuring renders keeps the fix permanent.',
    criteria: [
      'Tests count renders for Dialog open/close and Tabs activation',
      'Opening a dialog does not re-render the page content (measured)',
      'Interaction latency for opening a menu stays under 100ms on the CI runner',
      'Budgets documented next to the components they constrain',
    ],
  },
  {
    key: 'qa-browser-mode-component-tests',
    title: 'Move layout-dependent component tests to browser mode',
    type: 'type: test',
    size: 'm',
    priority: 'p3',
    summary:
      'jsdom has no layout, so focus-visibility, scroll and overflow behaviour cannot be tested there. Browser mode covers what jsdom fakes.',
    criteria: [
      'Vitest browser mode enabled for tests that need layout (scroll lock, focus ring, target size)',
      'jsdom remains the default for fast unit tests',
      'Suite split documented so contributors know where a new test belongs',
      'Runtime cost measured and kept within the CI budget',
    ],
    dependsOn: ['qa-browser-matrix'],
  },
  {
    key: 'qa-ci-caching',
    title: 'Cache dependencies and Playwright browsers in CI',
    type: 'type: chore',
    size: 's',
    priority: 'p3',
    summary:
      'Reinstalling browsers on every job wastes minutes and money. Caching keyed by lockfile and Playwright version is a small, permanent win.',
    criteria: [
      'npm cache and Playwright browser cache configured',
      'Cache keys invalidate correctly on lockfile and version changes',
      'Median CI duration reduced and reported',
      'Cache restore failures fall back to a normal install without failing the job',
    ],
    flags: ['good first issue'],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'quality' }));
