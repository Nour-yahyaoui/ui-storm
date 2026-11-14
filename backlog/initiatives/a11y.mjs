import { toIssue } from '../initiative.mjs';

export const A11Y = [
  {
    key: 'a11y-sr-matrix',
    title: 'Define the screen reader test matrix and per-component scripts',
    type: 'type: a11y',
    size: 'l',
    priority: 'p1',
    summary:
      'Automated rules cover roughly a third of accessibility problems. The rest is verified by a person with a screen reader following a script.',
    scope: [
      'VoiceOver + Safari (macOS), NVDA + Firefox (Windows), TalkBack + Chrome (Android)',
      'Scripts per component: enter, operate, exit, and what must be announced',
    ],
    criteria: [
      'Matrix document names versions, locales and browsers under test',
      'Each shipped component has a script with expected announcements',
      'Results recorded with pass/fail and issue links, dated',
      'Matrix is repeated before every minor release',
    ],
  },
  {
    key: 'a11y-forced-colors',
    title: 'Verify every component in Windows High Contrast (forced-colors)',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'Custom backgrounds and borders disappear in forced-colors mode unless replaced with system colors. The token layer has hooks; components must honour them.',
    criteria: [
      'Playwright project runs with forcedColors: active across foundation and component stories',
      'Focus rings remain visible (Highlight), and state is never conveyed by color alone',
      'Borders that vanish are given forced-color-adjust and system color fallbacks',
      'Findings and fixes documented in the accessibility statement',
    ],
    dependsOn: ['qa-visual-regression'],
  },
  {
    key: 'a11y-reflow',
    title: 'Verify 320px reflow and 400% zoom across components',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'WCAG 1.4.10 requires no two-dimensional scrolling at 320 CSS px (400% zoom). Dense tables and toolbars are where this fails.',
    criteria: [
      'Playwright test asserts no horizontal document overflow at 320px in LTR and RTL',
      'Each component has a documented reflow strategy (stack, scroll region, priority+)',
      'Scrollable regions are keyboard reachable with visible focus and an accessible name',
      'Results recorded per component in the conformance tracker',
    ],
  },
  {
    key: 'a11y-text-spacing',
    title: 'Pass the WCAG 1.4.12 text-spacing override test',
    type: 'type: a11y',
    size: 's',
    priority: 'p2',
    summary:
      'Users can override line height, paragraph spacing, letter and word spacing. Layouts that clip or overlap fail the criterion.',
    criteria: [
      'Test page applies the WCAG bookmarklet values and screenshots every component',
      'No clipping or overlap in buttons, badges, tabs and table headers',
      'Arabic text is included in the test because the override interacts with diacritics',
      'Failures fixed with flexible heights instead of fixed pixel boxes',
    ],
  },
  {
    key: 'a11y-focus-visible',
    title: 'Audit focus appearance and focus not obscured',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'WCAG 2.2 adds 2.4.11 Focus Not Obscured and 2.4.13 Focus Appearance. Sticky headers and overflow containers are the usual offenders.',
    criteria: [
      'Every interactive element shows a ring with at least 3:1 contrast against both adjacent colors',
      'Ring area meets the 2.4.13 minimum (2px perimeter equivalent) as computed for each variant',
      'Focused elements scrolled behind sticky headers are brought fully into view',
      'Documented with screenshots for button, input, checkbox, tab and menu item',
    ],
  },
  {
    key: 'a11y-target-size',
    title: 'Audit and enforce the 24px minimum target size',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'WCAG 2.2 SC 2.5.8 sets a 24px floor; this library targets 44px for touch. Icon buttons, close buttons and table row actions are the risk points.',
    criteria: [
      'Automated measurement for every interactive component in its stories',
      'Every control meets 44x44 except where spacing exemptions apply, and those are documented',
      'Results feed a regression test so a later padding change cannot shrink targets',
      'Documented in the component docs as a guarantee',
    ],
  },
  {
    key: 'a11y-drag-alternatives',
    title: 'Provide keyboard alternatives for every drag interaction',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'WCAG 2.2 SC 2.5.7 requires a single-pointer alternative to dragging. Sliders, drawers, file upload and any reorderable list are affected.',
    criteria: [
      'Each drag interaction lists its non-drag alternative in the docs',
      'Slider changes work with arrow keys; Drawer closes with Escape and a button; FileUpload opens a picker',
      'Tests assert the alternative path reaches every reachable value',
      'Any future drag-only feature is blocked by review until an alternative exists',
    ],
  },
  {
    key: 'a11y-accname',
    title: 'Validate accessible name computation for every component state',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'Names change with state: loading buttons, toggle switches, icon-only actions. Each state must produce a sensible name under the accname algorithm.',
    criteria: [
      'Test helper computes the accessible name and asserts it in component tests',
      'States covered: default, loading, disabled, error, selected, expanded',
      'No name derived from a placeholder, a file name or an icon path',
      'Localized names verified in Arabic as well as English',
    ],
  },
  {
    key: 'a11y-live-region-audit',
    title: 'Audit live-region usage across toasts, errors and async results',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'Duplicate regions, regions inserted with content, or assertive regions used for routine updates all produce a worse experience than no announcement.',
    criteria: [
      'Inventory of every live region in the library with politeness and trigger',
      'Assertive reserved for errors and destructive confirmations',
      'Announcements are complete sentences with the count and target included',
      'Manual verification on NVDA and VoiceOver recorded',
    ],
    dependsOn: ['fnd-live-announcer'],
  },
  {
    key: 'a11y-form-errors',
    title: 'Make form errors identifiable, described and recoverable',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'WCAG 3.3.1 and 3.3.3 require errors to be identified in text and suggestions provided. Wiring must be automatic, not left to each consumer.',
    criteria: [
      'Invalid fields set aria-invalid and reference the message through aria-describedby',
      'An error summary at the top of the form links to each invalid field',
      'Focus moves to the summary on submit, and to the first invalid field on correction',
      'Messages state the problem and the fix, with examples in English and Arabic',
      'Tests assert the described-by relationship and the announcement',
    ],
    dependsOn: ['field-api'],
  },
  {
    key: 'a11y-color-independence',
    title: 'Remove color-only meaning from every component',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'Status badges, error borders and required markers often rely on color alone. Each needs text, icon or shape as a redundant channel.',
    criteria: [
      'Every status uses text plus color; icons are supplementary',
      'Required and invalid states carry programmatic and visible non-color markers',
      'Charts and meters include textual values',
      'Reviewed in grayscale screenshots for the whole component set',
    ],
  },
  {
    key: 'a11y-contrast-states',
    title: 'Verify contrast in hover, active, focus and disabled states',
    type: 'type: a11y',
    size: 'm',
    priority: 'p1',
    summary:
      'Checking the default state is not enough: disabled text, hover fills and focus rings are where contrast quietly fails.',
    criteria: [
      'Contrast matrix for every variant and state, computed from tokens',
      'Disabled exceptions documented explicitly and kept to the minimum necessary',
      'Focus ring contrast measured against both the control and the page background',
      'Automated check fails the build when a token pair drops below its threshold',
    ],
    dependsOn: ['a11y-focus-visible'],
  },
  {
    key: 'a11y-disabled-pattern',
    title: 'Decide and document aria-disabled versus native disabled',
    type: 'type: design',
    size: 's',
    priority: 'p2',
    summary:
      'Native disabled removes controls from the tab order and from screen reader discovery, which is often the wrong choice in forms and toolbars.',
    criteria: [
      'ADR states the rule, with the exceptions for form submission and destructive actions',
      'Every component documents which mechanism it uses and why',
      'Focusable aria-disabled controls prevent activation in all input paths, tested',
      'Consumers can opt into the other behaviour where reasonable',
    ],
    flags: ['needs: decision'],
  },
  {
    key: 'a11y-axe-baseline',
    title: 'Pin the axe rule set and triage every suppressed rule',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Silently skipping rules turns an a11y suite into decoration. Each exclusion must be justified, scoped and revisited.',
    criteria: [
      'Rule set pinned in one module and shared by unit and Playwright scans',
      'Every allowlisted rule has a comment naming the reason and the manual test that replaces it',
      'color-contrast is never skipped in the browser suite',
      'A report lists rules disabled globally and per component',
    ],
  },
  {
    key: 'a11y-manual-plan',
    title: 'Publish the manual accessibility test plan',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'Contributors need a concrete checklist with steps, not "check accessibility". The plan is what makes the conformance claims reproducible.',
    criteria: [
      'Plan covers keyboard, screen reader, zoom/reflow, forced colors, reduced motion and contrast',
      'Each check names the tool, the steps and the expected result',
      'Template issue created for release testing, with a results table',
      'Linked from CONTRIBUTING and the pull request template',
    ],
  },
  {
    key: 'a11y-route-change-focus',
    title: 'Handle focus and announcements on SPA route changes',
    type: 'type: a11y',
    size: 'm',
    priority: 'p2',
    summary:
      'In single-page apps a route change is silent: focus stays on the clicked link and nothing is announced. The library should make the correct pattern one line.',
    criteria: [
      'Router-agnostic hook moves focus to the main heading or landmark after navigation',
      'Page title updates and is announced once, without double announcements',
      'Works with Next.js App Router and React Router examples',
      'Test asserts focus target and single announcement',
    ],
  },
  {
    key: 'a11y-landmarks',
    title: 'Standardise landmarks and skip-link integration',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'Landmark structure should be consistent across docs, fixture apps and consumer guidance: one banner, one main, labelled navigation regions.',
    criteria: [
      'Guidance documents the expected landmark structure with example markup',
      'SkipLink integrates with the main landmark and moves focus, not just scroll',
      'Duplicate landmark labels are detected in tests',
      'Fixture app and docs site follow the same structure',
    ],
    dependsOn: ['skip-link-api'],
  },
  {
    key: 'a11y-async-announcements',
    title: 'Announce asynchronous state changes exactly once',
    type: 'type: a11y',
    size: 'm',
    priority: 'p2',
    summary:
      'Loading, empty, error and success transitions are invisible to screen reader users unless announced — and annoying if announced twice by nested components.',
    criteria: [
      'Documented state machine for async UI with the announcement for each transition',
      'Nested spinners and status components do not duplicate the parent announcement',
      'Debounce rules prevent announcements during rapid typing',
      'Tests assert one announcement per transition using the live-region test helper',
    ],
    dependsOn: ['a11y-live-region-audit'],
  },
  {
    key: 'a11y-keyboard-trap-audit',
    title: 'Prove no keyboard traps outside intentional modals',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'A focus trap is legitimate inside a modal dialog and a defect everywhere else. The audit separates the two deliberately.',
    criteria: [
      'Keyboard walkthrough of every component story, recording where focus goes',
      'Every exit path from an overlay is reachable with Escape or a visible control',
      'Traps are only active inside modal layers, verified by Playwright',
      'Findings filed and fixed before the milestone closes',
    ],
  },
  {
    key: 'a11y-label-in-name',
    title: 'Ensure visible labels match accessible names',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'WCAG 2.5.3 requires the accessible name to contain the visible label, otherwise speech input users cannot activate controls by name.',
    criteria: [
      'Audit of every component where visible and programmatic names differ (clear buttons, close buttons, icons)',
      'Accessible names include the visible text verbatim',
      'Localized visible strings and aria-labels come from the same message source',
      'Automated test compares visible text to the computed name where practical',
    ],
  },
  {
    key: 'a11y-status-messages',
    title: 'Verify status messages are announced without focus',
    type: 'type: a11y',
    size: 'm',
    priority: 'p2',
    summary:
      'WCAG 4.1.3 covers messages that appear without a focus change: saved, uploaded, copied, 3 results. Each must reach a live region.',
    criteria: [
      'Inventory of status messages per component with the region that carries them',
      'Copy, save, upload, filter and sort confirmations all announce',
      'Messages are not lost when they replace each other quickly',
      'Manual verification recorded on two screen readers',
    ],
    dependsOn: ['fnd-live-announcer'],
  },
  {
    key: 'a11y-acr',
    title: 'Publish an Accessibility Conformance Report (ACR/VPAT)',
    type: 'type: docs',
    size: 'l',
    priority: 'p2',
    summary:
      'Public sector and enterprise adoption requires a documented conformance statement with evidence, not a badge.',
    criteria: [
      'ACR generated from the WCAG 2.2 AA criteria with per-criterion status and evidence links',
      'Manual test results and known limitations listed honestly',
      'Statement names the versions and components covered',
      'Reissued for each minor release with a change note',
    ],
    dependsOn: ['a11y-manual-plan', 'a11y-sr-matrix'],
  },
  {
    key: 'a11y-per-story-axe-gate',
    title: 'Run axe against every Storybook story in CI',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Per-component axe checks are not enough: composition stories catch violations that unit tests miss, and they catch them before review.',
    criteria: [
      'Playwright iterates the built story index and scans every story in LTR and RTL',
      'Dark mode and forced-colors passes included',
      'Failures report the story id and the violation target',
      'The gate blocks merging and cannot be skipped by an empty allowlist',
    ],
    dependsOn: ['qa-visual-regression'],
  },
  {
    key: 'a11y-motion-safety',
    title: 'Audit motion for flashing, parallax and auto-play',
    type: 'type: a11y',
    size: 's',
    priority: 'p2',
    summary:
      'Spinners, shimmers and toasts are the only motion in the library, but they must not flash, loop indefinitely without control, or ignore reduced motion.',
    criteria: [
      'No animation exceeds three flashes per second (WCAG 2.3.1)',
      'Every non-essential animation is disabled under reduced motion',
      'Auto-dismissing toasts can be paused and their timeout extended',
      'Verified in a story with the emulated media feature',
    ],
    dependsOn: ['fnd-reduced-motion'],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'a11y' }));
