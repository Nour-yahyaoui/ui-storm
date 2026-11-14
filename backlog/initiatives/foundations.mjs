import { toIssue } from '../initiative.mjs';

export const FOUNDATIONS = [
  {
    key: 'fnd-controllable-state',
    title: 'Implement useControllableState for every dual-mode control',
    type: 'type: feature',
    size: 'm',
    priority: 'p0',
    summary:
      'Every stateful component must work both controlled and uncontrolled. Today that logic would be copy-pasted per component, which is how prop-sync bugs start.',
    criteria: [
      'Hook accepts value, defaultValue, onChange and a name for warnings',
      'Switching from uncontrolled to controlled warns in development, as React does',
      'Changing the controlled value prop updates the rendered state without an extra render',
      'Form reset restores defaultValue, verified by a test using a real <form> reset',
      'Covered by tests that assert the callback fires exactly once per change',
    ],
  },
  {
    key: 'fnd-focus-trap',
    title: 'Build the focus-trap primitive with nested-layer support',
    type: 'type: a11y',
    size: 'l',
    priority: 'p0',
    summary:
      'Dialog, Drawer, AlertDialog, Menu and CommandPalette all need a correct trap. It is subtle: nested traps, portals, dynamic tabbable content, and focus that must never escape to the page.',
    scope: [
      'Tab and Shift+Tab wrap inside the topmost layer only',
      'A paused trap is restored when a nested layer closes',
      'Focus returns to the element that was focused before the trap activated',
    ],
    criteria: [
      'Built on the existing getTabbableElements utility, with tests for dynamic content added after mount',
      'Nested traps: only the top layer keeps focus; closing it restores the parent trap',
      'If the active element is removed from the DOM, focus moves to the container rather than body',
      'No scroll jump when focus is moved',
      'Playwright test proves Tab cannot reach the inert background of an open dialog',
    ],
  },
  {
    key: 'fnd-dismiss',
    title: 'Implement useDismiss for outside pointer, Escape, scroll and route changes',
    type: 'type: feature',
    size: 'm',
    priority: 'p0',
    summary:
      'Dismissal behaviour is currently reinvented in each overlay. A shared hook makes it consistent, testable and correct for touch and keyboard users.',
    criteria: [
      'Pointer-down outside dismisses, but a drag that starts inside and ends outside does not',
      'Escape dismissal is opt-in per surface and never fires for a closed surface',
      'Scroll and resize dismissal are configurable and off by default for modals',
      'Listeners are passive and removed on unmount (verified with a listener count assertion)',
      'Works inside shadow DOM containers, tested with a fixture',
    ],
  },
  {
    key: 'fnd-portal-stack',
    title: 'Add a portal layer stack with deterministic z-index ordering',
    type: 'type: feature',
    size: 'm',
    priority: 'p0',
    summary:
      'Dialog opens a Popover that opens a Menu: without a stack, the newest layer can render below an older one, and closing order breaks.',
    criteria: [
      'A LayerProvider renders portals into a container appended to document.body once per app',
      'Each opened layer receives an incrementing index mapped to a CSS variable, not a hard-coded z-index',
      'Closing a middle layer does not reorder the remaining layers',
      'SSR renders children without touching document, and hydration does not duplicate containers',
      'Toasts always sit above dialogs through an explicit layer type, not a magic number',
    ],
  },
  {
    key: 'fnd-scroll-lock',
    title: 'Implement scroll locking without layout shift',
    type: 'type: feature',
    size: 'm',
    priority: 'p1',
    summary:
      'Opening a modal must not make the page jump by the scrollbar width, and closing it must not leave the page unscrollable on iOS.',
    criteria: [
      'Scrollbar gutter is reserved with scrollbar-gutter or a measured padding, and released on close',
      'Nested locks are reference counted so closing one layer does not unlock the page',
      'iOS Safari does not scroll the background under a modal',
      'Scroll position is preserved exactly after open/close',
      'Behaviour under prefers-reduced-motion is identical (no animation dependency)',
    ],
  },
  {
    key: 'fnd-live-announcer',
    title: 'Add LiveRegionProvider and useAnnounce for screen reader announcements',
    type: 'type: a11y',
    size: 'm',
    priority: 'p0',
    summary:
      'Toasts, form errors and async result counts all need announcements. A single provider prevents duplicate regions and the classic "region inserted with content is never announced" bug.',
    criteria: [
      'Polite and assertive regions are mounted on first render, before any message is queued',
      'Messages are cleared and re-set so identical consecutive messages are announced',
      'Queueing respects a minimum interval to avoid flooding',
      'Hook returns a stable announce function that is safe to call after unmount',
      'Tests assert the region content changes and that no duplicate live regions exist',
    ],
  },
  {
    key: 'fnd-reduced-motion',
    title: 'Add useReducedMotion and a documented motion policy',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'The stylesheet collapses transitions globally, but components that animate with JavaScript (height, FLIP, drag) need to read the preference in code.',
    criteria: [
      'Hook subscribes to matchMedia changes and cleans up on unmount',
      'Returns false during SSR and updates after hydration without a mismatch warning',
      'At least Dialog, Accordion, Drawer and Toast use it to skip JS animation',
      'Policy documented: which effects are removed, which are reduced, which are essential',
      'A test simulates the media query change with matchMedia mock',
    ],
  },
  {
    key: 'fnd-media-query',
    title: 'Add an SSR-safe useMediaQuery hook',
    type: 'type: feature',
    size: 's',
    priority: 'p2',
    summary:
      'Responsive components (SidebarNav, DataTable, Drawer) need media queries in JavaScript without hydration mismatches.',
    criteria: [
      'Returns a caller-provided fallback on the server, then the real value after mount',
      'Uses useSyncExternalStore so concurrent rendering stays consistent',
      'Listener is added once per query regardless of component count',
      'Tests cover the SSR fallback and a simulated breakpoint change',
    ],
  },
  {
    key: 'fnd-stable-id',
    title: 'Standardise id generation with a useStableId wrapper',
    type: 'type: chore',
    size: 's',
    priority: 'p1',
    summary:
      'aria-controls and aria-labelledby require ids that are stable across SSR and hydration. Scattered useId calls make that hard to audit.',
    criteria: [
      'Wrapper around React 19 useId with a prefix option for debuggability',
      'Ids differ between two instances in the same tree (tested)',
      'Server and client output match exactly (tested with renderToString)',
      'All components use the wrapper; a lint rule or test prevents raw useId in src/components',
    ],
  },
  {
    key: 'fnd-popup-positioning',
    title: 'Build the anchored positioning primitive for popups',
    type: 'type: feature',
    size: 'l',
    priority: 'p0',
    summary:
      'Popover, Tooltip, Menu, Combobox and DatePicker all need collision-aware positioning that understands writing direction. Doing it once is the difference between five bugs and one.',
    scope: [
      'Logical placements (start, end, top, bottom) resolved against dir',
      'Flip and shift on collision with the viewport, with a configurable padding',
      'Arrow element positioning that stays within the surface radius',
    ],
    criteria: [
      'Placement start resolves to the right side in RTL without prop changes',
      'Collision flips are tested at all four viewport edges, in both directions',
      'Position updates on scroll and resize are throttled to animation frames',
      'Position is correct inside a transformed container (documented limitation if unsupported)',
      'No layout thrash: single-pass measurement with ResizeObserver',
      'Decide build vs. adopt (floating-ui) in an ADR and record the trade-off',
    ],
    flags: ['needs: decision'],
  },
  {
    key: 'fnd-event-callback',
    title: 'Add useEventCallback and useLatest utilities',
    type: 'type: chore',
    size: 's',
    priority: 'p2',
    summary:
      'Overlay listeners must see the latest props without re-subscribing on every render. Without a stable callback pattern, event handlers resubscribe constantly.',
    criteria: [
      'useEventCallback returns a referentially stable function that always calls the latest handler',
      'Safe when the component unmounts between event registration and invocation',
      'Tests assert the identity is stable across renders and the latest props are used',
      'Documented as internal API, not exported from the package entry point',
    ],
  },
  {
    key: 'fnd-icons',
    title: 'Define the icon foundation and mirroring registry',
    type: 'type: design',
    size: 'm',
    priority: 'p1',
    summary:
      'Icons are 24 aria-hidden SVGs with a registry that states whether each one mirrors in RTL. Without that registry, directional icons silently point the wrong way in Arabic.',
    criteria: [
      'Base Icon component defaults to aria-hidden and focusable="false"',
      'Registry marks each icon as mirror / never-mirror, with a test that fails when a new icon is unclassified',
      'Icons inherit currentColor and scale with the control size',
      'Chevrons, arrows and back/forward mirror; checkmarks, close glyphs and play controls do not',
      'Bundle impact measured: icons are individually importable, not a single barrel',
    ],
  },
  {
    key: 'fnd-scaffold',
    title: 'Add a component scaffolding CLI (npm run gen:component)',
    type: 'type: chore',
    size: 'm',
    priority: 'p1',
    summary:
      'Fifty-three components are coming. A generator that emits the files, tests, stories, docs page and changeset keeps every PR structurally identical.',
    criteria: [
      'Generates component, test, story, MDX docs and changeset with the correct names',
      'Refuses to overwrite existing files and validates the component name',
      'Generated test already uses render/expectNoA11yViolations and fails until implemented',
      'CI check confirms every component directory contains test, story and docs files',
      'Documented in CONTRIBUTING with a worked example',
    ],
    flags: ['good first issue'],
  },
  {
    key: 'fnd-browser-policy',
    title: 'Define and enforce the supported browser baseline',
    type: 'type: chore',
    size: 's',
    priority: 'p1',
    summary:
      'Logical properties, :has, inert and CSS nesting all have different support floors. The library needs a stated baseline and a Browserslist that matches it.',
    criteria: [
      'Browserslist config committed and referenced by the README',
      'Baseline includes Safari 16.4+, Chrome 111+, Firefox 120+ (rationale documented)',
      'inert and logical properties availability verified against the chosen baseline',
      'A CI check fails when a dependency raises the effective baseline unexpectedly',
      'The policy states what happens to older browsers (no polyfill, documented fallback)',
    ],
  },
  {
    key: 'fnd-ssr-harness',
    title: 'Add an SSR and hydration test harness',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Portals, useId and media queries are the usual sources of hydration mismatches. Every component needs a render-to-string-then-hydrate test, not a hope.',
    criteria: [
      'Harness renders a component with renderToString, injects the markup, hydrates and fails on any console error',
      'Applied to DirectionProvider and to every component as it lands (enforced by a test list)',
      'Covers RTL locales and dark theme injection without a mismatch',
      'Wired into the unit test run so it cannot be skipped silently',
    ],
  },
  {
    key: 'fnd-type-tests',
    title: 'Add type-level tests for the public prop contracts',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'Several props are mutually exclusive (loading vs icon-only, single vs multiple). Types must reject invalid combinations before runtime warnings exist.',
    criteria: [
      'expectTypeOf (or tsd) tests cover discriminated unions on at least Button, Tabs and Accordion',
      'Invalid combinations fail type-checking, with an @ts-expect-error assertion in the test',
      'Type tests run in CI as part of typecheck',
      'Exported types are documented in the docs API tables',
    ],
  },
  {
    key: 'fnd-composition-decision',
    title: 'Decide the composition strategy (asChild vs polymorphic as)',
    type: 'type: design',
    size: 'm',
    priority: 'p0',
    summary:
      'Button, Link and Heading all need to render as something else. Choosing between an asChild slot, a polymorphic as prop, and fixed components has consequences for typing, refs and accessibility that must be settled once.',
    scope: [
      'Evaluate asChild (Radix-style), polymorphic as, and explicit components',
      'Consider TypeScript ergonomics, ref forwarding and the risk of losing semantics',
    ],
    criteria: [
      'ADR committed under docs/adr with the decision, alternatives and consequences',
      'Prototype implemented for Button + Link showing the chosen approach',
      'Prototype proves aria attributes and refs survive the composition',
      'Rule documented for when composition is allowed at all (never to fake semantics)',
      'Decision reflected in the scaffolding template',
    ],
    flags: ['needs: decision'],
  },
  {
    key: 'fnd-a11y-lint',
    title: 'Add custom lint rules for accessibility invariants',
    type: 'type: chore',
    size: 'm',
    priority: 'p2',
    summary:
      "jsx-a11y catches standard mistakes, but not this repository's invariants: no positive tabindex, no physical margins, no icon-only control without a name.",
    criteria: [
      'Rule (or script) rejects positive tabindex values in src',
      'Rule rejects ml-/mr-/pl-/pr-/left-/right- utilities in component sources',
      'Rule requires an accessible name prop on icon-only components',
      'Violations include the offending file and a link to the documentation that explains the rule',
      'Rules are tested with the RuleTester where applicable',
    ],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'fnd' }));
