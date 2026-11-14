import { AREA_BY_MILESTONE } from './config.mjs';

/**
 * Track generators.
 *
 * Each component produces four issues by default (API, keyboard, ARIA, RTL) and
 * optionally docs/tests/stories tracks. Every issue is a substantial unit of
 * work on its own — no "add a prop" tasks — and its acceptance criteria are
 * derived from the component's declared accessibility contract, not from a
 * generic template with the name swapped in.
 */

const CHANGESET_NOTE =
  'A changeset is added (`minor` for a new component, `patch` for a fix) so the changelog stays honest.';

const DEFINITION_OF_DONE = [
  `- [ ] Exported from \`src/index.ts\` with TSDoc on the public props`,
  `- [ ] \`npm run verify\` passes locally and in CI`,
  `- [ ] ${CHANGESET_NOTE}`,
  `- [ ] Issue closed by a PR that references it (\`Closes #…\`)`,
];

function bullets(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function checklist(items) {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function footer() {
  return ['## Definition of done', '', ...DEFINITION_OF_DONE].join('\n');
}

function references(component, extra = []) {
  const links = [];
  if (component.apg)
    links.push(`- WAI-ARIA Authoring Practices — ${component.pattern}: ${component.apg}`);
  links.push('- WCAG 2.2: https://www.w3.org/TR/WCAG22/');
  links.push(...extra);
  return ['## References', '', ...links].join('\n');
}

function body({ sections }) {
  return sections.filter(Boolean).join('\n\n') + '\n';
}

const TRACKS = {
  api: {
    suffix: 'core implementation and public API',
    type: 'type: feature',
    size: 'size: l',
    title: (component) => `${component.name} — core implementation and public API`,
    build(component) {
      const deps = (component.deps ?? []).map((slug) => `\`${slug}\``).join(', ');

      return body({
        sections: [
          `## Context\n\n${component.summary}`,
          deps ? `This component composes ${deps}, so those issues must land first.` : '',
          `## Scope\n\n${bullets(component.scope)}`,
          `## Accessibility contract\n\n${bullets(component.aria)}`,
          `## Acceptance criteria\n\n${checklist([
            'The public API matches the scope above; every prop is typed and documented',
            '`ref` forwards to the underlying DOM node and `className` is merged rather than replaced',
            'Every color, spacing, radius and duration comes from an `--aui-*` token — no literal values in the source',
            'Controlled and uncontrolled usage both work, including form reset and a changing `defaultValue`',
            'Invalid usage produces a development-only warning naming the offending prop (for example a missing accessible name)',
            'SSR-safe: renders with `renderToString` and hydrates without a mismatch warning',
            'Documentation page and stories are added in the follow-up issues, not stubbed with TODOs',
          ])}`,
          footer(),
          references(component),
        ],
      });
    },
  },

  keyboard: {
    suffix: 'keyboard interaction and focus management',
    type: 'type: a11y',
    size: 'size: m',
    title: (component) => `${component.name} — keyboard interaction and focus management`,
    build(component) {
      return body({
        sections: [
          `## Context\n\nPointer support is not a keyboard contract. This issue makes every path through \`${component.name}\` reachable, operable and visible without a mouse, and proves it with tests.`,
          `## Keyboard contract\n\n${component.keys}`,
          `## Acceptance criteria\n\n${checklist([
            'The documented key map is implemented exactly as written above',
            'Focus is always visible: the token-based ring is never clipped and never removed by a reset',
            'Tab order follows DOM order — no positive `tabindex` values anywhere in the component',
            'Disabled states remain discoverable where WCAG allows it (`aria-disabled` kept focusable) and are documented when removed from the tab order',
            'Focus is not lost when content is conditionally rendered or removed',
            'Directional keys are tested in both LTR and RTL where the pattern requires it',
            'A Playwright spec asserts each key path and the element that ends up focused',
          ])}`,
          footer(),
          references(component, [
            '- WCAG 2.2 SC 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible',
          ]),
        ],
      });
    },
  },

  aria: {
    suffix: 'ARIA semantics and screen reader contract',
    type: 'type: a11y',
    size: 'size: m',
    title: (component) => `${component.name} — ARIA semantics and screen reader contract`,
    build(component) {
      return body({
        sections: [
          `## Context\n\n\`${component.name}\` claims to implement the **${component.pattern}** pattern. This issue makes the claim testable: correct roles, states and names, verified with automation and a manual screen reader pass.`,
          `## Semantics\n\n${bullets(component.aria)}`,
          `## Acceptance criteria\n\n${checklist([
            'Roles, states and properties are exactly those listed above — no extra `role` or `aria-*` attributes "for safety"',
            'The accessible name is correct for every state, including loading and error states',
            'axe-core reports zero WCAG A/AA violations in LTR, RTL and dark mode',
            'Manual screen reader walkthrough completed on VoiceOver + Safari and NVDA + Firefox, with the script and observations pasted in a comment',
            'Live-region announcements (where applicable) are neither duplicated nor cut off mid-sentence',
            'No dangling `aria-describedby` / `aria-controls` references after a state change or unmount',
          ])}`,
          footer(),
          references(component, [
            '- Accessibility Object Model notes: https://wicg.github.io/aom/',
          ]),
        ],
      });
    },
  },

  rtl: {
    suffix: 'RTL, bidi and Arabic content handling',
    type: 'type: i18n',
    size: 'size: m',
    title: (component) => `${component.name} — RTL, bidi and Arabic content handling`,
    build(component) {
      return body({
        sections: [
          `## Context\n\nA component that only flips its layout is not RTL-ready. This issue covers geometry, bidi text, numerals, Arabic typography and the tests that keep them true for \`${component.name}\`.`,
          `## RTL requirements\n\n${bullets(component.rtl)}`,
          `## Acceptance criteria\n\n${checklist([
            'All spacing and positioning uses logical properties; `grep -E "\\b(ml|mr|pl|pr|left|right)-"` returns no hits in the component source',
            'Logical utilities are used for alignment (`text-start` / `text-end`) and icons mirror only when directional',
            'An Arabic story (`lang="ar"`, `dir="rtl"`) renders without clipped diacritics, broken words or overlapping glyphs',
            'Embedded Latin identifiers, numbers and URLs are bidi-isolated (`bdi` or `dir="ltr"` spans)',
            'Numerals follow an explicit decision per locale rather than the font default',
            'Playwright story test runs in the `chromium-rtl-ar` project and the screenshot is added to the visual baseline',
          ])}`,
          footer(),
          references(component, [
            '- Unicode Bidirectional Algorithm: https://www.unicode.org/reports/tr9/',
            '- CSS Logical Properties: https://www.w3.org/TR/css-logical-1/',
          ]),
        ],
      });
    },
  },

  docs: {
    suffix: 'documentation page and usage guidance',
    type: 'type: docs',
    size: 'size: m',
    title: (component) => `${component.name} — documentation page and usage guidance`,
    build(component) {
      return body({
        sections: [
          `## Context\n\nA component that is not documented is not adopted. The docs page for \`${component.name}\` must answer: when to use it, when not to, how to label it, what the keyboard does, and what breaks in Arabic.`,
          `## Required sections\n\n${bullets([
            'When to use / when to use something else, with a link to the alternative',
            'Anatomy diagram with the accessible name and description annotations',
            'Keyboard table generated from the same source the tests use',
            'ARIA contract table (roles, states, properties)',
            'RTL and Arabic notes specific to this component',
            'Three copy-pasteable examples: minimal, realistic, and error/invalid state',
            'Common mistakes, each with the failing markup and the fix',
          ])}`,
          `## Acceptance criteria\n\n${checklist([
            'MDX page builds with no broken links and passes the docs link checker',
            'Every code example compiles and renders in the docs sandbox',
            'Keyboard table matches the Playwright spec verbatim',
            'Arabic examples are written by or reviewed by an Arabic speaker and render correctly in RTL',
            'An "Accessibility" section states what is automated and what is manually verified',
          ])}`,
          footer(),
        ],
      });
    },
  },

  tests: {
    suffix: 'interaction, unit and visual regression tests',
    type: 'type: test',
    size: 'size: m',
    title: (component) => `${component.name} — interaction, unit and visual regression tests`,
    build(component) {
      return body({
        sections: [
          `## Context\n\n\`${component.name}\` needs a test suite that fails when its accessibility contract regresses — not a coverage number that goes up when a trivial assertion is added.`,
          `## Required coverage\n\n${bullets([
            'Rendering: every variant, size and state, in LTR and RTL',
            'Interaction: the full keyboard contract, pointer paths and focus restoration',
            'Forms: controlled/uncontrolled transitions, reset, disabled and invalid states',
            'Async: loading, empty, error and success states with fake timers, no arbitrary sleeps',
            'Accessibility: axe assertion in jsdom plus the Playwright browser project',
          ])}`,
          `## Acceptance criteria\n\n${checklist([
            'Unit tests use `render` from `src/test-utils/render.tsx` so both directions are exercised',
            '`expectNoA11yViolations` runs in LTR and RTL and fails the build on violations',
            'Playwright spec covers the keyboard map and the focus target after each key',
            'Visual baseline screenshots exist for LTR, RTL and dark mode',
            'No `waitForTimeout` in committed tests; fake timers or `findBy*` queries instead',
            'The suite fails when the ARIA contract is deliberately broken (verified once in the PR description)',
          ])}`,
          footer(),
        ],
      });
    },
  },

  stories: {
    suffix: 'Storybook stories for states, RTL and dark mode',
    type: 'type: docs',
    size: 'size: s',
    title: (component) => `${component.name} — Storybook stories for states, RTL and dark mode`,
    build(component) {
      return body({
        sections: [
          `## Context\n\nStories are the review surface for design and accessibility. Every state of \`${component.name}\` that can be reached in production must be visible here, in both writing directions and both themes.`,
          `## Required stories\n\n${bullets([
            'Default, hover, focus-visible, active, disabled and loading/error states (as applicable)',
            'Every variant and size combination, grouped so the toolbar stays usable',
            'Arabic (ar-EG) content with realistic strings, not lorem ipsum',
            'A "long content" story that exercises wrapping and truncation',
            'Composition story showing the component inside its typical parent (form field, toolbar, dialog)',
          ])}`,
          `## Acceptance criteria\n\n${checklist([
            'The Storybook a11y panel reports no violations for every story',
            'Controls are wired to real props and the accessibility addon is enabled',
            'Story ids are stable because Playwright and the docs site reference them',
            'No inline hex colors or magic pixel values in story code — tokens only',
            'Stories render correctly with the Locale and Theme toolbar globals',
          ])}`,
          footer(),
        ],
      });
    },
  },

  DEFAULT_TRACKS: ['api', 'keyboard', 'aria', 'rtl'],
};

export { TRACKS };

/** Builds every component issue for one catalog entry. */
export function componentIssues(component) {
  const area = AREA_BY_MILESTONE[component.milestone];
  const trackNames = [...TRACKS.DEFAULT_TRACKS, ...(component.extras ?? [])];

  return trackNames.map((trackName, index) => {
    const track = TRACKS[trackName];
    const dependsOn = trackName === 'api' ? [] : [`${component.slug}-api`];
    if (trackName === 'tests' || trackName === 'docs' || trackName === 'stories') {
      dependsOn.push(`${component.slug}-aria`);
    }

    return {
      key: `${component.slug}-${trackName}`,
      title: track.title(component),
      milestone: component.milestone,
      labels: [track.type, area, `priority: ${component.priority}`, track.size],
      body: track.build(component),
      dependsOn: [...new Set(dependsOn)],
      order: index,
      component: component.slug,
    };
  });
}
