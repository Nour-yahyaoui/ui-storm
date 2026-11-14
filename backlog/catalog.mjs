/**
 * Component catalog.
 *
 * Each entry describes the accessibility contract of one component. The backlog
 * generator turns every entry into four to seven issues (API, keyboard, ARIA,
 * RTL, and optionally docs/tests/stories), so this file is the single source of
 * truth for what the library promises.
 *
 * Fields:
 *   pattern  WAI-ARIA or HTML pattern the component implements
 *   apg      link to the APG pattern (omitted when no public pattern exists)
 *   summary  what the component is and which decisions are already made
 *   scope    the API surface the implementation issue must deliver
 *   keys     keyboard contract, written the way the docs table will state it
 *   aria     roles/attributes/states that must be present and correct
 *   rtl      bidi and Arabic specifics beyond logical properties
 *   deps     slugs of components that must land first
 *   extras   additional tracks beyond the default four (api, keyboard, aria, rtl)
 */

export const COMPONENTS = [
  // ── 01 · Core primitives ────────────────────────────────────────────────
  {
    name: 'Button',
    slug: 'button',
    milestone: 'primitives',
    priority: 'p1',
    pattern: 'Button',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    summary:
      'The reference implementation for every convention in the library: token-only styling, 44px minimum target, ' +
      'a loading state announced with aria-busy, and no icon-only usage without a name. Variants: primary, secondary, ' +
      'ghost, danger. Sizes: sm, md, lg.',
    scope: [
      'Props: variant, size, isLoading, loadingLabel, leadingIcon, trailingIcon, fullWidth, type (defaults to button)',
      'Native button element only — links that look like buttons use the Link component, never role="button"',
      'Loading keeps the button focusable, preserves its width, and sets aria-busy with a visually hidden status',
      'Icons are aria-hidden by default; an icon-only button must receive an accessible name or a type error',
    ],
    keys: 'Tab and Shift+Tab move focus; Enter and Space both activate; disabled buttons are removed from the tab order',
    aria: [
      'Renders a native button; no role attribute, no tabindex management',
      'aria-busy="true" while loading, with the label unchanged so the accessible name is stable',
      'aria-disabled is preferred over the disabled attribute when the action must stay discoverable; the chosen behaviour is documented',
      'Pressed state is out of scope here and belongs to ToggleButton',
    ],
    rtl: [
      'Leading and trailing icon slots follow the writing direction; the icon itself only mirrors when it is directional',
      'Loading spinner direction is inherited, not hard-coded',
      'Arabic labels never receive letter-spacing or uppercase transforms',
    ],
    extras: ['docs', 'tests', 'stories'],
  },
  {
    name: 'IconButton',
    slug: 'icon-button',
    milestone: 'primitives',
    priority: 'p1',
    pattern: 'Icon-only button',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    summary:
      'A square button whose only content is an icon. The accessible name is mandatory, the hit target is never ' +
      'smaller than 44x44 CSS pixels, and the tooltip is a supplement — never the name.',
    scope: [
      'Props: label (required, rendered as visually hidden text), icon, size, variant, isLoading',
      'Square geometry derived from --aui-target-min, with an optional compact size that still meets WCAG 2.5.8',
      'No nested tooltip by default; when a tooltip is used it is wired with aria-describedby, not aria-label',
      'Pressed state reserved for a future ToggleIconButton',
    ],
    keys: 'Tab moves focus; Enter and Space activate; the focus ring is never clipped by the square bounding box',
    aria: [
      'Accessible name comes from visually hidden text inside the button, not from the icon',
      'The icon is aria-hidden="true" and focusable="false"',
      'aria-busy while loading; the name stays available in every state',
      'No aria-label that duplicates visible text (there is none) and no title attribute as a name',
    ],
    rtl: [
      'Mirroring is opt-in per icon; non-directional icons such as a close glyph are identical in both directions',
      'Visually hidden Arabic labels inherit the correct font stack',
      'Focus ring offset uses logical spacing so it does not clip on the inline-end edge',
    ],
    deps: ['button'],
  },
  {
    name: 'Link',
    slug: 'link',
    milestone: 'primitives',
    priority: 'p1',
    pattern: 'Native link',
    summary:
      'An anchor that behaves like a link and a LinkButton that behaves like a button. External links announce that ' +
      'they open a new tab without relying on an icon, and the two components cannot be confused in the API.',
    scope: [
      'Props: href, external, newTabLabel, variant (inline, standalone, unstyled), leadingIcon',
      'Renders an anchor only when href is present; otherwise the caller must use Button',
      'Visually hidden "opens in a new tab" text appended when target="_blank" and no explicit label is given',
      'rel="noreferrer noopener" enforced whenever target="_blank" is set',
    ],
    keys: 'Enter activates the link; Space does not (native anchor behaviour is preserved, not overridden)',
    aria: [
      'No role overrides; the anchor element carries its own semantics',
      'aria-current is passed through for navigation use',
      'External/new-tab state is conveyed in text, not by color or icon alone',
      'Link text is descriptive; "click here" is rejected in the docs and linted in examples',
    ],
    rtl: [
      'Inline links inside Arabic paragraphs are isolated with bdi where the link text is Latin',
      'Trailing external-link icons follow the inline-end edge',
      'Underline offsets use logical spacing so descenders in Arabic are not clipped',
    ],
    deps: ['button'],
  },
  {
    name: 'Text',
    slug: 'text',
    milestone: 'primitives',
    priority: 'p2',
    pattern: 'Native text element',
    summary:
      'Typographic primitive that maps semantic intent to an element: body, caption, label, overline. It never ' +
      'creates a heading and never sets a font size without a matching line height.',
    scope: [
      'Props: as (p, span, div, small, strong, em), size, tone (default, muted, danger, success), truncate',
      'Truncation always pairs with title or expanded text so content never becomes unreachable',
      'Refuses size/tone combinations that break contrast, documented in the prop table',
      'No letter-spacing on Arabic text; the base layer already handles this via lang',
    ],
    keys: 'Not interactive; no keyboard contract',
    aria: [
      'Renders exactly one element with no wrapper and no role',
      'Tone conveys no meaning on its own; error text is accompanied by icon and message text',
      'Strong/em elements are used for emphasis only, never for styling',
    ],
    rtl: [
      'Alignment uses text-start/text-end exclusively',
      'Arabic line height comes from the lang-aware base layer rather than a size override',
      'Truncation direction follows the inline axis with text-overflow: ellipsis',
    ],
  },
  {
    name: 'Heading',
    slug: 'heading',
    milestone: 'primitives',
    priority: 'p2',
    pattern: 'Native heading',
    summary:
      'Heading levels are semantic, not visual. Components expose level (1-6) separately from size so a card title ' +
      'can be visually small and still be an h3.',
    scope: [
      'Props: level (1-6, required), size (visual only), id for aria-labelledby targets',
      'Dev-only warning when level skips more than one level relative to the nearest heading context',
      'No heading inside components that already render one (Dialog, Card) — enforced by docs and tests',
      'Ref forwards to the heading element',
    ],
    keys: 'Not focusable unless tabIndex is passed explicitly; screen reader heading navigation is covered by tests',
    aria: [
      'Renders h1-h6 with no role override',
      'The accessible name is the text content; no aria-label unless the visible text is an icon',
      'Level and size stay independent so visual design never rewrites the outline',
    ],
    rtl: [
      'Heading text alignment follows the document direction',
      'Arabic headings keep the 1.85 line-height to avoid clipped diacritics',
      'Numbers inside Arabic headings are formatted by the caller, not coerced by the component',
    ],
  },
  {
    name: 'VisuallyHidden',
    slug: 'visually-hidden',
    milestone: 'primitives',
    priority: 'p1',
    pattern: 'Visually hidden content',
    summary:
      'The canonical screen-reader-only technique, with a focusable variant for skip links. It must stay readable by ' +
      'screen readers and translation tools while occupying no visual space.',
    scope: [
      'Props: as, focusable (reveals the element when focused)',
      'Implementation based on the clip-path/clip-rect technique that survives zoom and forced colors',
      'CSS lives in the package stylesheet so consumers cannot accidentally re-implement it',
      'Never used to hide content that is also invisible to assistive technology',
    ],
    keys: 'With focusable, the element enters the tab order and becomes visible on focus',
    aria: [
      'Does not set aria-hidden — the content stays in the accessibility tree',
      'No display:none or visibility:hidden, which would remove it from assistive technology',
      'Works inside a live region without breaking announcement order',
    ],
    rtl: [
      'Clipping must not depend on left/right offsets; uses inset-inline-start',
      'Arabic hidden text remains selectable and searchable',
      'Focusable variant reveals content aligned to the inline-start edge',
    ],
  },
  {
    name: 'Spinner',
    slug: 'spinner',
    milestone: 'primitives',
    priority: 'p1',
    pattern: 'Progress indicator (indeterminate)',
    summary:
      'A loading indicator with a label that is announced once, not on every frame. Motion collapses to a static ' +
      'indicator under prefers-reduced-motion.',
    scope: [
      'Props: size, label (defaults to a translated "Loading"), delayMs to avoid flashing on fast requests',
      'role="status" with aria-live="polite" and visually hidden label; no aria-valuenow because it is indeterminate',
      'Animation stops entirely under prefers-reduced-motion, replaced by a pulsing opacity that is also disabled',
      'Usable inside Button (aria-busy) without duplicating announcements',
    ],
    keys: 'Not focusable; the surrounding control keeps focus',
    aria: [
      'Single status region per spinner; nested spinners inherit the outer announcement',
      'Label is programmatically associated, not just visual',
      'aria-hidden on the decorative ring itself',
    ],
    rtl: [
      'Rotation animation is direction-agnostic; the ring never mirrors',
      'Label text uses the Arabic font stack when lang is Arabic',
      'No reliance on left/right for the animation origin',
    ],
  },
  {
    name: 'Badge',
    slug: 'badge',
    milestone: 'primitives',
    priority: 'p2',
    pattern: 'Status badge',
    summary:
      'A compact status token. Color is never the only signal: every tone carries text, and decorative dots are hidden ' +
      'from assistive technology.',
    scope: [
      'Props: tone (neutral, accent, success, warning, danger), size, dot',
      'Dot is aria-hidden; the text always states the status',
      'Optional removable affordance is out of scope (belongs to Chip, tracked separately)',
      'Counts use Intl.NumberFormat with the active locale',
    ],
    keys: 'Not interactive; a clickable badge is a Button or Link with badge styling',
    aria: [
      'No role by default; status semantics come from surrounding text',
      'aria-label is only used when the visible text is an abbreviation',
      'Dot and icons are aria-hidden',
    ],
    rtl: [
      'Dot and text order follows the inline axis',
      'Arabic-Indic digits are rendered when the locale asks for them',
      'Badge text never uppercases Arabic',
    ],
  },
  {
    name: 'Kbd',
    slug: 'kbd',
    milestone: 'primitives',
    priority: 'p3',
    pattern: 'Native kbd element',
    summary:
      'Keyboard hint rendering with correct semantics and RTL-aware key names: the arrow glyph shown for "next tab" ' +
      'depends on the writing direction, and modifier order is locale-aware.',
    scope: [
      'Props: keys (array of key tokens, including modifiers), separator, size',
      'Maps logical keys (Next, Previous, Start, End) to ArrowRight/ArrowLeft per direction',
      'Renders a single kbd element per key with visually hidden separators for screen readers',
      'No use of the literal arrow characters in accessible names without a spelled-out alternative',
    ],
    keys: 'Not interactive',
    aria: [
      'Native kbd semantics; no role',
      'Visually hidden text expands abbreviations such as Ctrl to Control',
      'Sequences are read in the correct order by screen readers',
    ],
    rtl: [
      'Arrow glyphs mirror with the writing direction while the underlying key stays the same physical key',
      'Latin key names inside Arabic text are wrapped in bdi',
      'Separator spacing uses logical margins',
    ],
  },
  {
    name: 'Avatar',
    slug: 'avatar',
    milestone: 'primitives',
    priority: 'p2',
    pattern: 'Decorative image with fallback',
    summary:
      'A person or entity image with initials fallback. Either the image carries a name or the whole avatar is ' +
      'decorative — never both, and never an alt text that duplicates the adjacent label.',
    scope: [
      'Props: src, name (required for alt and fallback), size, decorative, status indicator',
      'Fallback initials derived from the name using Intl.Segmenter so Arabic names work',
      'Image error state falls back without layout shift',
      'Status dot is aria-hidden and paired with visible text elsewhere',
    ],
    keys: 'Not interactive; avatar links wrap the component in a Link with a proper name',
    aria: [
      'Decorative mode sets alt="" and aria-hidden on the wrapper',
      'Named mode uses the person name as alt, not "avatar" or a file name',
      'No role="img" wrapper when the inner image already provides the name',
    ],
    rtl: [
      'Initials for Arabic names use the first letter of the first and last word with correct bidi ordering',
      'Fallback text is centered logically, not with a left offset',
      'Status indicator position mirrors with the writing direction',
    ],
  },

  // ── 02 · Form controls ──────────────────────────────────────────────────
  {
    name: 'Field',
    slug: 'field',
    milestone: 'forms',
    priority: 'p1',
    pattern: 'Labelled form control',
    summary:
      'The primitive that makes labelling automatic: it generates ids, wires label, description and error text with ' +
      'aria-describedby, and marks invalid state with aria-invalid. Every form control consumes it.',
    scope: [
      'Props: label, description, error, required, optionalLabel, children as render function receiving ids and aria props',
      'Generates stable ids with useId; no duplicate ids when multiple instances render',
      'Error text is announced politely and is never the only indicator of failure (icon + text + aria-invalid)',
      'Supports fieldset/legend mode for checkbox and radio groups through Fieldset',
    ],
    keys: 'Passes through to the control; clicking the label focuses the control',
    aria: [
      'label[for] association, or aria-labelledby when the label contains rich content',
      'aria-describedby combines description and error ids in a stable order',
      'aria-invalid="true" only when an error is present and after the field has been touched',
      'Required is conveyed with the required attribute, not an asterisk alone',
    ],
    rtl: [
      'Optional/required markers follow the label text in the inline direction',
      'Error icon sits at the inline-start edge of the message',
      'Arabic labels do not break at the wrong place: bidi isolation on embedded Latin values',
    ],
    extras: ['docs', 'tests'],
  },
  {
    name: 'Input',
    slug: 'input',
    milestone: 'forms',
    priority: 'p1',
    pattern: 'Native text input',
    summary:
      'Text input built on the native element with Field integration, autocomplete passthrough, IME-safe value handling ' +
      'and a border that meets 3:1 contrast in every state.',
    scope: [
      'Props: type (text, email, tel, url, password, search), size, invalid, leadingAddon, trailingAddon, clearable',
      'Autocomplete tokens are typed, not free strings; password managers must keep working',
      'IME composition is respected: controlled value updates do not fight composition events in Arabic input',
      'Password visibility toggle is a real button with pressed state, not an eye icon alone',
    ],
    keys: 'Tab moves focus; typing, selection and clipboard follow native behaviour; clear button is keyboard reachable',
    aria: [
      'Never renders without an accessible name — Field enforces it, and a dev warning fires when neither label nor aria-label exists',
      'aria-invalid and aria-describedby come from Field',
      'Placeholder text is never the only label',
      'Addons are aria-hidden unless interactive',
    ],
    rtl: [
      'Placeholder and value alignment follow the document direction; numeric and email inputs may opt into dir="ltr"',
      'The clear button sits at the inline-end edge in both directions',
      'Arabic input keeps the Arabic font stack while typed',
    ],
    extras: ['docs', 'tests', 'stories'],
  },
  {
    name: 'Textarea',
    slug: 'textarea',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Native textarea',
    summary:
      'Multi-line input with optional auto-resize and a character counter that is announced without interrupting typing.',
    scope: [
      'Props: rows, autoResize, maxLength, showCount, resize (none, vertical, both)',
      'Counter uses polite live announcements and only announces near the limit',
      'Auto-resize measures with a hidden mirror element, not by mutating the DOM on every keystroke',
      'Scrollable overflow must keep the focus ring visible',
    ],
    keys: 'Tab moves focus (Enter inserts a newline); Escape only blurs when the caller opts in',
    aria: [
      'aria-describedby includes the counter id when present',
      'The counter is not a live region that fires on every character by default',
      'maxLength is exposed to assistive technology through the character count text',
    ],
    rtl: [
      'Resize handle position follows the inline-end edge',
      'Auto-resize measurement accounts for Arabic line height differences',
      'Counter reads Arabic-Indic digits for locales that use them',
    ],
  },
  {
    name: 'Checkbox',
    slug: 'checkbox',
    milestone: 'forms',
    priority: 'p1',
    pattern: 'Checkbox',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    summary:
      'Native checkbox input rendered with a custom visual, supporting indeterminate state without lying to assistive ' +
      'technology about the checked value.',
    scope: [
      'Props: checked, defaultChecked, indeterminate, label, description, error, value, disabled, required',
      'Indeterminate sets the DOM property and aria-checked="mixed" only when the native input cannot express it',
      'Label text is clickable; the hit target is at least 44px including the label area',
      'Description and error wired through Field; no nested interactive elements inside the label',
    ],
    keys: 'Space toggles when focused; Tab moves between checkboxes; the label click and the input share one state',
    aria: [
      'Native input carries the state; no role="checkbox" substitute',
      'aria-checked is used only for the mixed state that the native input cannot expose',
      'Required marks the input, and the group-level requirement lives on the fieldset',
      'Error state does not disable the control',
    ],
    rtl: [
      'The visual box sits at the inline-start edge and the label follows in reading order',
      'Check mark glyph is direction-agnostic; the animation origin follows the inline axis',
      'Arabic labels wrap with correct line height and no letter-spacing',
    ],
    extras: ['docs', 'tests', 'stories'],
  },
  {
    name: 'CheckboxGroup',
    slug: 'checkbox-group',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Grouped checkboxes',
    summary:
      'Fieldset/legend wrapper that gives a set of checkboxes one name, one description and one error message — the ' +
      'part most libraries get wrong.',
    scope: [
      'Props: legend, description, error, required, orientation, children',
      'Renders fieldset/legend, not a div with role="group"',
      'Single error region for the group, referenced by every control via aria-describedby',
      'Select-all/none helpers are opt-in and never replace the individual controls',
    ],
    keys: 'Tab enters and leaves the group as a sequence; arrow keys do not move between checkboxes (that is a radio group)',
    aria: [
      'fieldset with legend as the group name; no aria-labelledby duplication',
      'Group error is announced once, not once per checkbox',
      'aria-invalid is applied to the group container and documented in the tests',
    ],
    rtl: [
      'Legend and description align to the inline-start edge',
      'Vertical and horizontal orientations mirror consistently',
      'Arabic legend never inherits uppercase styling',
    ],
    deps: ['checkbox'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'Radio',
    slug: 'radio',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Radio button',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    summary:
      'Native radio input with a custom visual. Arrow-key navigation, roving focus and group semantics come from the ' +
      'browser and are verified rather than reimplemented.',
    scope: [
      'Props: value, label, description, disabled, required',
      'Must be used inside RadioGroup; a dev warning fires when rendered outside one',
      'Custom visual is a sibling of the input, never a replacement for it',
      'Described-by wiring through Field so each option can carry help text',
    ],
    keys: 'Arrow keys move to the next/previous radio and select it; Space selects the focused radio; Tab leaves the group',
    aria: [
      'Native radio semantics preserved, including the implicit group by name attribute',
      'Checked state comes from the input, not from a class',
      'Required is expressed on the group, not on every option',
    ],
    rtl: [
      'Arrow direction mapping stays physical (ArrowRight is next in LTR, previous in RTL per platform conventions) and is documented',
      'Visual dot sits at the inline-start edge',
      'Arabic labels keep correct line height when wrapping to two lines',
    ],
    deps: ['field'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'RadioGroup',
    slug: 'radio-group',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Radio group',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    summary:
      'Fieldset wrapper that owns the group name, requirement and validation, and keeps arrow-key behaviour native.',
    scope: [
      'Props: name, legend, description, error, required, orientation, value, defaultValue, onChange',
      'Controlled and uncontrolled modes share one implementation through useControllableState',
      'Group error is announced once and referenced by the fieldset',
      'Form reset restores the default selection',
    ],
    keys: 'Single tab stop; arrow keys move selection within the group; Home/End are not expected for radio groups',
    aria: [
      'radiogroup semantics come from the fieldset element and shared name',
      'No manual roving tabindex that would fight native behaviour',
      'Error state does not remove options from the tab order',
    ],
    rtl: [
      'Horizontal orientation places the first option at the inline-start edge',
      'Arrow-key behaviour is tested in both directions and documented as physical-key based',
      'Legend spacing uses logical properties',
    ],
    deps: ['radio'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'Switch',
    slug: 'switch',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Switch',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
    summary:
      'An on/off control that commits immediately. It uses role="switch" only where the change is instant, and falls ' +
      'back to a checkbox when the change requires submitting a form.',
    scope: [
      'Props: checked, defaultChecked, onCheckedChange, label, description, size, disabled, loading',
      'Optional loading state that blocks interaction without hiding state from assistive technology',
      'Label and description wiring through Field; label sits at the inline-end edge by default',
      'No "on/off" text baked in; the caller supplies state text where it adds clarity',
    ],
    keys: 'Space toggles; Enter does not (native switch expectation) — verified against platform conventions',
    aria: [
      'Native input with role="switch"; checked state from the DOM property',
      'aria-checked is never set alongside a native checkbox input',
      'Loading uses aria-busy and keeps the control focusable',
    ],
    rtl: [
      'Track fill grows from the inline-start edge; the thumb position mirrors automatically',
      'Label order flips with the writing direction',
      'Arabic labels wrap without clipping the track',
    ],
    deps: ['field'],
  },
  {
    name: 'Select',
    slug: 'select',
    milestone: 'forms',
    priority: 'p1',
    pattern: 'Native select',
    summary:
      'Accessible wrapper over the native select — the right default for forms. It handles placeholders, option groups ' +
      'and RTL rendering while the customizable listbox lives in Combobox.',
    scope: [
      'Props: options or children, placeholder, size, invalid, disabled, required',
      'Placeholder option is disabled and hidden after selection',
      'Optgroup support preserved',
      'Native popup is kept (no custom popup) so mobile and screen reader behaviour stays intact',
    ],
    keys: 'Alt+Down opens the popup on Windows; typing selects by prefix; arrow keys move within the native popup',
    aria: [
      'Native label association through Field; placeholder is not used as the only label',
      'aria-invalid and describedby wired by Field',
      'No custom listbox roles on a select element',
    ],
    rtl: [
      'Placeholder arrow sits at the inline-end edge',
      'Arabic option text renders with the correct font and no truncation of diacritics',
      'Option values keep dir="auto" so Latin values inside Arabic labels stay readable',
    ],
    deps: ['field'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'Combobox',
    slug: 'combobox',
    milestone: 'forms',
    priority: 'p1',
    pattern: 'Combobox with listbox popup',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    summary:
      'The hardest widget in the library: editable and select-only modes, async option loading, aria-activedescendant ' +
      'management, typeahead and correct announcement of the resulting count.',
    scope: [
      'Props: options, value, onValueChange, inputValue, onInputChange, isAsync, loadingMessage, noResultsMessage, multiple',
      'aria-activedescendant points at the highlighted option; focus never leaves the input in editable mode',
      'Async mode announces "3 results available" politely instead of per keystroke',
      'Filtering is caller-controlled; the component owns semantics, not matching strategy',
    ],
    keys: 'ArrowDown/ArrowUp open and move; Enter selects; Escape closes without clearing; Alt+ArrowUp closes; Home/End jump; typing filters',
    aria: [
      'Text input with aria-expanded, aria-controls, aria-autocomplete and aria-activedescendant',
      'Popup uses listbox/option roles; the highlighted option is visually distinct and reported',
      'The count of matches is announced through a dedicated polite live region',
      'Selected value in multi-select mode is removable with Backspace and each token has a name',
    ],
    rtl: [
      'Arrow keys stay physical; the visual list order follows the writing direction',
      'The popup is anchored with logical inset values, not left/right offsets',
      'Arabic filtering is diacritic-insensitive when the caller uses the provided matcher helper',
    ],
    deps: ['field'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'SearchField',
    slug: 'search-field',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Search input',
    summary:
      'A search input with a clear button, an optional result count and correct form semantics. Enter submits the ' +
      'surrounding form; Escape clears only when the caller opts in.',
    scope: [
      'Props: value, onValueChange, onSubmit, clearable, resultCount, loading',
      'role="search" landmark is applied by the caller wrapper, not duplicated per input',
      'Clear button is a labelled IconButton and returns focus to the input',
      'Result count announced via polite live region, debounced',
    ],
    keys: 'Enter submits; Escape clears when enabled and returns focus; Tab reaches the clear button',
    aria: [
      'type="search" with an accessible name from Field',
      'aria-describedby includes the result count when present',
      'Clear button name is localizable and distinct from the field label',
    ],
    rtl: [
      'Search icon sits at the inline-start edge and mirrors only if the design requires it',
      'Clear button sits at the inline-end edge',
      'Arabic query text keeps RTL alignment while Latin queries opt into dir="auto"',
    ],
    deps: ['input'],
  },
  {
    name: 'NumberField',
    slug: 'number-field',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Spinbutton',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/',
    summary:
      'Numeric input with stepper buttons, locale-aware formatting and an explicit decision about Arabic-Indic digits ' +
      'in both display and submitted value.',
    scope: [
      'Props: value, onValueChange, min, max, step, formatOptions, locale, allowWheel',
      'Displayed value can be localized while the submitted value stays a JavaScript number',
      'Stepper buttons are labelled, repeat on long press, and are hidden from the tab order when reaching a bound',
      'Rejects non-numeric input without destroying the user text on every keystroke',
    ],
    keys: 'ArrowUp/ArrowDown increment and decrement; PageUp/PageDown jump by a larger step; Home/End jump to bounds',
    aria: [
      'role="spinbutton" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext when formatted',
      'Stepper buttons have accessible names, not just plus/minus glyphs',
      'Invalid input is announced with aria-invalid and a described error',
    ],
    rtl: [
      'Grouping and decimal separators come from Intl, including Arabic separators',
      'Arabic-Indic digit rendering is opt-in per locale and round-trips on submit',
      'Stepper buttons stack on the inline-end side',
    ],
    deps: ['input'],
  },
  {
    name: 'Slider',
    slug: 'slider',
    milestone: 'forms',
    priority: 'p2',
    pattern: 'Slider',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    summary:
      'Single-thumb and range sliders where pointer, keyboard and assistive technology agree on the value, including ' +
      'a mirrored visual fill in RTL without mirroring the semantics.',
    scope: [
      'Props: value, onValueChange, min, max, step, orientation, showValue, formatValue, marks',
      'Range variant with two labelled thumbs and a minimum-distance constraint',
      'Pointer drag is an enhancement: every change is also reachable with arrow keys (WCAG 2.5.7)',
      'Value bubble is aria-hidden; the thumb carries aria-valuetext',
    ],
    keys: 'Arrow keys change by step; PageUp/PageDown by larger step; Home/End jump to bounds; in RTL the physical arrow mapping is documented and tested',
    aria: [
      'role="slider" per thumb with aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext',
      'Each thumb has a distinct accessible name in the range variant',
      'aria-orientation is set when vertical',
      'No aria-valuetext that contradicts aria-valuenow',
    ],
    rtl: [
      'The visual fill grows from the inline-start edge while aria-valuenow semantics stay absolute',
      'Arrow-key direction mapping is tested in both directions and documented',
      'Arabic-Indic digits appear in value text only when the locale requests them',
    ],
    deps: ['field'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'FileUpload',
    slug: 'file-upload',
    milestone: 'forms',
    priority: 'p3',
    pattern: 'File input with drop zone',
    summary:
      'Drag-and-drop as an enhancement over a real file input. Keyboard users get the same capability, upload progress ' +
      'is announced, and errors name the offending file.',
    scope: [
      'Props: accept, multiple, maxSize, onFilesChange, disabled, progress',
      'Drop zone is a labelled button that opens the native picker; dragging is never the only path',
      'Per-file error list is associated with the input and announced once',
      'Progress uses role="progressbar" per file with an accessible name',
    ],
    keys: 'Enter and Space open the picker from the drop-zone button; the native input remains keyboard reachable',
    aria: [
      'Native input of type file with a real label; the drop zone is not the label by itself',
      'Errors are linked via aria-describedby and summarised in a polite live region',
      'Progress and completion are announced without stealing focus',
    ],
    rtl: [
      'Drop-zone icon and file metadata align to the inline-start edge',
      'File names in Latin script inside Arabic UI are wrapped in bdi',
      'File size units are localized',
    ],
    deps: ['button'],
  },
  {
    name: 'DatePicker',
    slug: 'date-picker',
    milestone: 'overlays',
    priority: 'p2',
    pattern: 'Dialog date picker with text input',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    summary:
      'A text input for typing a date plus a calendar dialog for choosing one. It supports the Hijri (Umm al-Qura) ' +
      'calendar, not just Gregorian, and never assumes Western digits or Sunday-first weeks.',
    scope: [
      'Props: value, onValueChange, locale, calendar (gregory, islamic-umalqura), min, max, disabledDates',
      'Typed input is parsed with the active locale and calendar; invalid text keeps user input and explains the format',
      'Calendar grid uses a real table with row/column headers, roving tabindex and aria-selected',
      'Today is identified textually, not by color; weekends are not assumed to be Saturday/Sunday',
    ],
    keys: 'Arrow keys move by day/week; PageUp/PageDown change month; Shift+PageUp/PageDown change year; Home/End jump within the week; Escape closes and returns focus',
    aria: [
      'Input has an accessible name and format hint; the dialog is labelled by the month and year',
      'Grid cells expose the full date in the accessible name, not just the day number',
      'Selected and disabled dates are conveyed with aria-selected and aria-disabled',
      'Month/year changes are announced politely',
    ],
    rtl: [
      'Week columns run right-to-left and the arrow-key mapping follows the visual grid',
      'Hijri month names and Arabic-Indic digits render in the locale of the calendar',
      'The input stays LTR when the user types a numeric date in Arabic UI, configurable per locale',
    ],
    deps: ['dialog', 'popover', 'field'],
    extras: ['docs', 'tests'],
  },

  // ── 03 · Overlays & messaging ───────────────────────────────────────────
  {
    name: 'Dialog',
    slug: 'dialog',
    milestone: 'overlays',
    priority: 'p1',
    pattern: 'Modal dialog',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    summary:
      'The modal primitive every other overlay reuses: focus trap, background inerting, scroll lock, labelled and ' +
      'described content, focus restoration, and nested-dialog stacking that does not corrupt the tab order.',
    scope: [
      'Props: open, onOpenChange, title, description, size, initialFocusRef, closeOnEscape, closeOnInteractOutside, showCloseButton',
      'Focus is trapped through the shared useFocusTrap primitive; the background is inert, not merely covered',
      'Opening focuses the initial target, falling back to the dialog container; closing restores the previously focused element',
      'Portals render into a layer stack so nested dialogs and toasts keep correct z-order',
    ],
    keys: 'Escape closes when allowed; Tab and Shift+Tab cycle inside; focus never reaches the inert background',
    aria: [
      'role="dialog" with aria-modal="true", aria-labelledby pointing at the title and aria-describedby at the description',
      'A dialog without an accessible name is a test failure, not a warning',
      'Background content receives inert/aria-hidden exactly once, restored on close',
      'The close button has a localized accessible name',
    ],
    rtl: [
      'Panel alignment and close-button placement use logical insets',
      'In RTL the dialog still traps focus identically; only geometry mirrors',
      'Arabic titles keep line height without colliding with the close button',
    ],
    deps: ['button', 'visually-hidden'],
    extras: ['docs', 'tests', 'stories'],
  },
  {
    name: 'AlertDialog',
    slug: 'alert-dialog',
    milestone: 'overlays',
    priority: 'p1',
    pattern: 'Alert dialog',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/',
    summary:
      'A modal for destructive or irreversible decisions. Focus starts on the least destructive action, Escape and ' +
      'backdrop dismissal are opt-in, and the consequence is described in text.',
    scope: [
      'Props: open, onOpenChange, title, description, confirmLabel, cancelLabel, tone, onConfirm, isConfirming',
      'Focus defaults to Cancel; the destructive action is never the initial focus',
      'Confirmation runs with a pending state that keeps the dialog open and announces progress',
      'Backdrop click and Escape are disabled by default for destructive tone',
    ],
    keys: 'Tab cycles between the two actions; Escape cancels when enabled; Enter activates the focused action only',
    aria: [
      'role="alertdialog" with aria-labelledby and aria-describedby both required',
      'The description states what will happen, not "are you sure?"',
      'The pending state uses aria-busy and disables the confirm button without changing focus',
    ],
    rtl: [
      'Action order follows the inline axis; the destructive action is at the inline-end edge',
      'Arabic consequence text wraps without hiding the cancel action',
      'Focus ring offsets remain visible inside the panel padding',
    ],
    deps: ['dialog', 'button'],
  },
  {
    name: 'Drawer',
    slug: 'drawer',
    milestone: 'overlays',
    priority: 'p2',
    pattern: 'Modal dialog (edge placement)',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    summary:
      'A dialog anchored to an inline edge, used for filters and navigation on small screens. Same semantics as Dialog, ' +
      'plus swipe-to-dismiss with a keyboard equivalent.',
    scope: [
      'Props: open, onOpenChange, side (start, end, bottom), size, title, description, resizable',
      'Shares the focus trap, scroll lock and restore-focus behaviour with Dialog',
      'Swipe dismissal is an enhancement; Escape always works (WCAG 2.5.7)',
      'Bottom sheet layout switches to start/end edges in RTL correctly',
    ],
    keys: 'Escape closes; Tab cycles within; the drag handle is not focusable but the close button is',
    aria: [
      'role="dialog" with aria-modal and a name from the title',
      'Resizable edge exposes a labelled separator with aria-orientation',
      'Content behind the drawer is inert while it is open',
    ],
    rtl: [
      'side="start" resolves to the right edge in RTL without a separate prop',
      'Drag gestures invert with the writing direction',
      'Panel shadow is symmetric so it does not imply the wrong elevation',
    ],
    deps: ['dialog'],
  },
  {
    name: 'Popover',
    slug: 'popover',
    milestone: 'overlays',
    priority: 'p1',
    pattern: 'Non-modal popover',
    summary:
      'An anchored, dismissible surface that does not trap focus. It provides the positioning primitive that ' +
      'Combobox, Menu, DatePicker and Tooltip build on.',
    scope: [
      'Props: trigger, open, onOpenChange, placement (start, end, top, bottom, with alignment), offset, matchTriggerWidth, modal',
      'Positioning is RTL-aware: placement "start" resolves with logical insets and flips on collision',
      'Dismissal handles Escape, outside pointer down, scroll and window resize',
      'Focus moves into the popover only when modal or when the caller requests it',
    ],
    keys: 'Trigger toggles with Enter/Space; Escape closes and returns focus to the trigger; Tab can leave the popover',
    aria: [
      'Trigger exposes aria-expanded and aria-controls; the surface is labelled by its title or trigger',
      'No aria-modal unless the modal option is enabled, in which case dialog semantics apply',
      'Dismissal never strands focus in a removed element',
    ],
    rtl: [
      'Placement start/end resolve against the writing direction, including collision flipping',
      'Arrow and offset values use logical coordinates',
      'Transform-origin animation does not slide in from the wrong edge in RTL',
    ],
    deps: ['button'],
  },
  {
    name: 'Tooltip',
    slug: 'tooltip',
    milestone: 'overlays',
    priority: 'p1',
    pattern: 'Tooltip',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    summary:
      'Supplemental text on hover and focus. It uses aria-describedby, dismisses with Escape, stays open while the ' +
      'pointer is over it (WCAG 1.4.13), and never holds interactive content.',
    scope: [
      'Props: content, children, placement, delayMs, closeDelayMs, disabled',
      'Opens on hover and on focus, closes on Escape, blur, pointer leave and scroll',
      'Hoverable: the tooltip itself keeps the pointer-open state so the user can read it',
      'Content is text only; interactive content is rejected by types and documented',
    ],
    keys: 'Focus shows the tooltip; Escape hides it without moving focus; focus stays on the trigger',
    aria: [
      'Trigger receives aria-describedby pointing at the tooltip id',
      'role="tooltip" on the surface; no aria-expanded because this is not a disclosure',
      'The tooltip never becomes the only accessible name of a control',
    ],
    rtl: [
      'Placement resolves logically and flips near viewport edges in both directions',
      'Mixed Arabic/Latin content inside the tooltip is isolated correctly',
      'Text alignment follows the tooltip language, not the page direction',
    ],
    deps: ['popover', 'visually-hidden'],
  },
  {
    name: 'Menu',
    slug: 'menu',
    milestone: 'overlays',
    priority: 'p2',
    pattern: 'Menu and menubar',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    summary:
      'Actions menu with roving tabindex, typeahead, submenus, and checkbox/radio menu items. The keyboard model is ' +
      'the full APG menu model, not a list of buttons in a popover.',
    scope: [
      'Props: trigger, items (item, separator, group, submenu, checkbox, radio), onSelect, placement, loop',
      'Roving tabindex with a single tab stop for the whole menu; typeahead by first characters',
      'Submenus open with ArrowRight/ArrowLeft (mirrored in RTL) and Escape closes one level at a time',
      'Disabled items stay focusable so screen reader users can discover them',
    ],
    keys: 'ArrowUp/Down move, Home/End jump, Enter/Space activate, ArrowRight opens a submenu, ArrowLeft closes it, Escape closes and restores focus, typeahead searches',
    aria: [
      'role="menu" and role="menuitem"/"menuitemcheckbox"/"menuitemradio" with aria-checked where applicable',
      'Trigger has aria-haspopup="menu" and aria-expanded',
      'Separators use role="separator" and are not focusable',
      'Focus returns to the trigger on close',
    ],
    rtl: [
      'Submenu direction keys mirror: ArrowLeft opens a submenu in RTL, ArrowRight closes it',
      'Check indicators sit at the inline-start edge',
      'Menu text and shortcut hints are laid out with logical alignment',
    ],
    deps: ['popover'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'ContextMenu',
    slug: 'context-menu',
    milestone: 'overlays',
    priority: 'p3',
    pattern: 'Context menu',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    summary:
      'Right-click menu with a full keyboard equivalent (Shift+F10 and the Context Menu key). It reuses the menu core ' +
      'and restores focus to the invoking element.',
    scope: [
      'Props: items, onSelect, children (trigger area)',
      'Listens for contextmenu and keyboard invocation, positions at the pointer or the focused element',
      'Adds a visible, keyboard-reachable alternative entry point so the menu is not pointer-only',
      'Reuses MenuItem types and selection semantics',
    ],
    keys: 'Shift+F10 or the Context Menu key opens at the focused element; arrow keys navigate; Escape closes and restores focus',
    aria: [
      'Same menu roles as Menu; the invoking element is not given a fake role',
      'The menu is labelled by the region it applies to',
      'Screen reader users can discover the shortcut through visible hint text',
    ],
    rtl: [
      'Pointer coordinates are physical, submenu direction keys are logical',
      'The menu clamps to the inline-end edge in both directions',
      'Shortcut hints align to the inline-end edge',
    ],
    deps: ['menu'],
  },
  {
    name: 'HoverCard',
    slug: 'hover-card',
    milestone: 'overlays',
    priority: 'p3',
    pattern: 'Non-modal hover card',
    summary:
      'Rich preview on hover or focus for user mentions and link previews. It must never contain the only path to ' +
      'essential information, and it works on touch through an explicit trigger.',
    scope: [
      'Props: content, children, openDelay, closeDelay, placement',
      'Opens on hover and focus; touch users get a tap trigger that is a real button',
      'Dismissible with Escape, and the card stays open while hovered',
      'No focus trap; content is read-only',
    ],
    keys: 'Focus or tap opens; Escape closes; the trigger remains the only tab stop',
    aria: [
      'Trigger is described by the card content, not labelled by it',
      'Content is plain text or links with names; no nested dialogs',
      'Closing never removes focus from the trigger',
    ],
    rtl: [
      'Placement mirrors logically and clamps within the viewport',
      'Arabic names and Latin handles are bidi-isolated',
      'Text alignment follows the card language',
    ],
    deps: ['popover'],
  },
  {
    name: 'Toast',
    slug: 'toast',
    milestone: 'overlays',
    priority: 'p2',
    pattern: 'Status message and alert',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    summary:
      'Transient feedback announced through a live region without stealing focus. Timers pause on hover and focus, ' +
      'and the dismiss action is reachable by keyboard.',
    scope: [
      'Props: title, description, tone, duration, action, dismissible, id; imperative toast() API with provider',
      'Polite live region for informational toasts, assertive only for errors',
      'Timers pause on hover and on focus-within; duration is user-configurable and respects reduced motion',
      'Toasts stack with a limit, and the count is available to screen readers',
    ],
    keys: 'The close button is reachable with F6 or a documented shortcut; Escape dismisses the newest toast',
    aria: [
      'Container is a live region that exists before the first toast (otherwise nothing is announced)',
      'role="status" for info/success, role="alert" only for errors',
      'The toast itself does not receive focus on appearance',
      'Dismissal does not move focus unexpectedly',
    ],
    rtl: [
      'Toasts stack from the inline-end edge and the progress indicator shrinks toward the inline-start edge',
      'Icons that imply direction mirror; status icons do not',
      'Arabic and numeric content stay isolated in the same message',
    ],
    deps: ['button'],
    extras: ['docs', 'tests'],
  },
  {
    name: 'CommandPalette',
    slug: 'command-palette',
    milestone: 'overlays',
    priority: 'p3',
    pattern: 'Dialog with combobox listbox',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    summary:
      'Keyboard-first search over commands. It combines dialog modality with combobox semantics and announces result ' +
      'counts, so it is usable without sighted pointer interaction.',
    scope: [
      'Props: open, onOpenChange, commands, onSelect, shortcut, emptyMessage, groups',
      'Focus starts in the search input; aria-activedescendant tracks the highlighted command',
      'Groups are labelled listbox groups; the count of matches is announced politely',
      'Shortcut hint text is localized and not baked into the component',
    ],
    keys: 'ArrowUp/Down move, Enter runs, Escape closes and restores focus, Home/End jump, typing filters',
    aria: [
      'Dialog provides the label; the combobox owns expanded, controls and activedescendant',
      'Result count announcement is debounced to avoid flooding',
      'Empty state is announced, not just displayed',
    ],
    rtl: [
      'The palette is centered; list order and arrow semantics follow the writing direction',
      'Shortcut keys are shown with RTL-aware separators',
      'Arabic command labels and Latin shortcuts are isolated from each other',
    ],
    deps: ['dialog', 'combobox'],
  },

  // ── 04 · Navigation & structure ─────────────────────────────────────────
  {
    name: 'Tabs',
    slug: 'tabs',
    milestone: 'navigation',
    priority: 'p1',
    pattern: 'Tabs',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    summary:
      'Tabbed panels with roving tabindex, manual and automatic activation, vertical orientation, lazy mounting, and ' +
      'arrow keys that follow the visual order in both writing directions.',
    scope: [
      'Props: value, onValueChange, activationMode (manual, automatic), orientation, loop, lazy, unmountOnHide',
      'Roving tabindex: one tab in the tab order, arrow keys move, Home/End jump to the edges',
      'Panels are labelled by their tab and tabs control their panel; ids are generated, never duplicated',
      'Selection follows focus in automatic mode only; manual mode requires Enter/Space',
    ],
    keys: 'ArrowRight/Left (horizontal) or ArrowUp/Down (vertical) move; Home/End jump; Enter/Space activate in manual mode; Tab moves into the active panel',
    aria: [
      'role="tablist"/"tab"/"tabpanel" with aria-selected, aria-controls and aria-labelledby',
      'Inactive panels are hidden from assistive technology, not merely visually collapsed',
      'Each tab has a stable accessible name; icon-only tabs are rejected unless labelled',
      'aria-orientation is set for vertical tabs',
    ],
    rtl: [
      'ArrowRight moves to the previous tab in RTL; the mapping is tested and documented',
      'The tab indicator slides from the inline-start edge',
      'Arabic tab labels truncate with an ellipsis at the inline-end edge, not mid-word',
    ],
    deps: ['button'],
    extras: ['docs', 'tests', 'stories'],
  },
  {
    name: 'Accordion',
    slug: 'accordion',
    milestone: 'navigation',
    priority: 'p2',
    pattern: 'Accordion',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    summary:
      'Stacked sections whose headers are real headings containing real buttons. Single and multiple expansion, ' +
      'animated height with reduced-motion support, and no loss of focus when a panel collapses.',
    scope: [
      'Props: type (single, multiple), value, defaultValue, collapsible, headingLevel',
      'Header button carries aria-expanded and aria-controls; the panel is a region labelled by the button',
      'Collapsing a panel that contains focus moves focus to the header instead of dropping it',
      'Height animation is skipped under prefers-reduced-motion',
    ],
    keys: 'Enter/Space toggle; ArrowUp/ArrowDown move between headers; Home/End jump; optional Ctrl+PageUp/PageDown per APG',
    aria: [
      'Heading element per header with a button inside, never a div with role="button"',
      'aria-disabled is used instead of disabled so headers stay discoverable',
      'Panels are not aria-hidden while animating open',
    ],
    rtl: [
      'Expand indicators sit at the inline-end edge and rotate without mirroring the glyph',
      'Panel content padding uses logical properties',
      'Arabic text in headers does not get clipped while animating',
    ],
    deps: ['heading', 'button'],
  },
  {
    name: 'Disclosure',
    slug: 'disclosure',
    milestone: 'navigation',
    priority: 'p3',
    pattern: 'Disclosure',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    summary:
      'The single-section primitive the Accordion composes: one button, one region, one aria-expanded. Useful for ' +
      'progressive disclosure inside forms and docs.',
    scope: [
      'Props: defaultOpen, open, onOpenChange, summary, children, iconPosition',
      'Button is the only focusable element; the region is labelled by the button',
      'Content stays mounted unless unmountOnHide is requested',
      'Composable with Form section grouping and docs callouts',
    ],
    keys: 'Enter/Space toggles; Tab moves to the next control inside the expanded region',
    aria: [
      'aria-expanded on the button, aria-controls pointing at the region',
      'The region is not a landmark; role="region" only when it has a name',
      'No aria-hidden on collapsed content if it remains focusable',
    ],
    rtl: [
      'Indicator placement and rotation are direction-safe',
      'Content indentation uses padding-inline-start',
      'Arabic summary text wraps cleanly next to the indicator',
    ],
    deps: ['button'],
  },
  {
    name: 'Breadcrumbs',
    slug: 'breadcrumbs',
    milestone: 'navigation',
    priority: 'p2',
    pattern: 'Breadcrumb navigation',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    summary:
      'Trail navigation marked with aria-current on the final item, an ordered list structure, and separators that are ' +
      'decorative and correctly oriented in RTL.',
    scope: [
      'Props: items (label, href), separator, maxItems with ellipsis collapse, ariaLabel',
      'Renders nav > ol > li with links; the current item is a link or a span with aria-current="page"',
      'Collapsed items are summarized with a menu, not silently dropped',
      'Long Arabic labels truncate at the inline-end edge',
    ],
    keys: 'Tab moves through links in reading order; the collapsed summary opens with Enter/Space',
    aria: [
      'nav with a localized aria-label; the list semantics provide item count',
      'aria-current="page" on the last item only',
      'Separators are aria-hidden so screen readers do not announce slashes',
    ],
    rtl: [
      'Separator glyph mirrors in RTL and its spacing uses logical margins',
      'The trail reads from the inline-start edge',
      'Latin URL segments inside Arabic labels are isolated',
    ],
    deps: ['link'],
  },
  {
    name: 'Pagination',
    slug: 'pagination',
    milestone: 'navigation',
    priority: 'p2',
    pattern: 'Pagination navigation',
    summary:
      'Page navigation with correct current-page semantics, a live summary of the visible range, and previous/next ' +
      'controls whose icons mirror with direction while their meaning does not.',
    scope: [
      'Props: page, pageCount, onPageChange, siblingCount, showFirstLast, disabled, labels',
      'Renders nav > ul > li with aria-current="page" on the active page',
      'Range summary is announced politely ("Showing 21 to 40 of 214 results")',
      'Ellipsis is not focusable and not announced as a page',
    ],
    keys: 'Tab moves through page links; Enter activates; Home/End are optional and documented',
    aria: [
      'Localized nav label and per-button labels ("Go to page 4")',
      'Current page announced through aria-current, not color',
      'Disabled state uses aria-disabled and keeps the control discoverable',
    ],
    rtl: [
      'Previous/next chevrons mirror, their accessible names do not',
      'Page numbers keep Western digits inside RTL layout unless the locale says otherwise',
      'The list lays out from the inline-start edge',
    ],
    deps: ['button', 'link'],
  },
  {
    name: 'Stepper',
    slug: 'stepper',
    milestone: 'navigation',
    priority: 'p3',
    pattern: 'Multi-step progress indicator',
    summary:
      'Ordered steps with current, completed and error states conveyed in text and ARIA — not just color — and a ' +
      'connector line that mirrors correctly in RTL.',
    scope: [
      'Props: steps (label, description, status), currentStep, orientation, onStepClick',
      'Renders an ordered list; the current step has aria-current="step"',
      'Error steps announce their error in the accessible name, not only via a red dot',
      'Mobile layout stacks vertically while preserving reading order',
    ],
    keys: 'Steps are links or buttons only when navigation is allowed; otherwise they are not focusable',
    aria: [
      'ol/li semantics with aria-current on the active step',
      'Completion is conveyed with visually hidden text',
      'A moving transition announces the new step through a polite live region',
    ],
    rtl: [
      'Connector line and chevrons mirror with the writing direction',
      'Step order reads from the inline-start edge',
      'Arabic descriptions wrap without separating the number from its label',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'TreeView',
    slug: 'tree-view',
    milestone: 'navigation',
    priority: 'p3',
    pattern: 'Tree view',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',
    summary:
      'Hierarchical navigation with the full APG tree model: roving tabindex, expand/collapse, single and multi ' +
      'selection, typeahead and RTL-aware horizontal arrows.',
    scope: [
      'Props: nodes, expandedIds, selectedIds, onSelectionChange, selectionMode, defaultExpandAll',
      'Roving tabindex with one tab stop; ArrowRight/Left expand and collapse (mirrored in RTL)',
      'Multi-select with Ctrl/Cmd+Space and Shift+Arrow range selection is documented and tested',
      'Asynchronous children show a loading state on the node without losing focus',
    ],
    keys: 'ArrowDown/Up move, ArrowRight expands or enters, ArrowLeft collapses or leaves, Home/End jump, typeahead searches, Space selects',
    aria: [
      'tree/treeitem roles with aria-expanded, aria-selected and aria-level',
      'Groups are nested with role="group"',
      'The tree has an accessible name and its item count is available',
    ],
    rtl: [
      'Horizontal arrow behaviour mirrors with the writing direction and is covered by tests',
      'Indentation uses padding-inline-start',
      'Latin node names inside Arabic trees stay isolated',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'SidebarNav',
    slug: 'sidebar-nav',
    milestone: 'navigation',
    priority: 'p3',
    pattern: 'Navigation landmark',
    summary:
      'A collapsible navigation landmark that survives small screens by becoming a Drawer, keeps aria-current on the ' +
      'active route, and never traps keyboard users in a collapsed section.',
    scope: [
      'Props: sections, currentPath, collapsible, defaultCollapsed, footer, mobileBreakpoint',
      'Renders nav > ul with labelled sections; collapsed sections keep their toggle focusable',
      'On small screens the sidebar moves into a Drawer with a labelled trigger',
      'Active route uses aria-current="page" plus a visible indicator',
    ],
    keys: 'Tab moves through links; collapse toggles use Enter/Space; Escape closes the mobile drawer',
    aria: [
      'One labelled nav landmark per page (the component refuses to render a second one without a distinct label)',
      'Collapse toggles expose aria-expanded and aria-controls',
      'Icon-only items are rejected unless they have accessible names',
    ],
    rtl: [
      'The sidebar sits at the inline-start edge and moves to the correct side in RTL',
      'Collapse chevrons mirror while their labels do not',
      'Scrollbars and shadows use logical offsets',
    ],
    deps: ['drawer', 'link'],
  },
  {
    name: 'SkipLink',
    slug: 'skip-link',
    milestone: 'navigation',
    priority: 'p1',
    pattern: 'Skip navigation link',
    summary:
      'The first focusable element on the page, hidden until focused, which moves focus to the main content instead ' +
      'of only scrolling to it.',
    scope: [
      'Props: href (target id), label, multiple targets',
      'Uses VisuallyHidden focusable mode and becomes visible with a token-based focus style',
      'Clicking moves focus to the target and sets tabindex="-1" when needed, without breaking browser history',
      'Works with SPA route changes by re-focusing the landmark',
    ],
    keys: 'First Tab reveals the link; Enter moves focus to the main region',
    aria: [
      'The target receives focus so the next Tab continues inside main',
      'The link text names the destination ("Skip to main content")',
      'No aria-hidden on the skip link at any time',
    ],
    rtl: [
      'Revealed link aligns to the inline-start edge and is fully visible, not clipped by the viewport',
      'Arabic label length does not overflow the reveal',
      'Focus ring remains visible in both directions',
    ],
    deps: ['visually-hidden'],
  },

  // ── 05 · Data display ───────────────────────────────────────────────────
  {
    name: 'Table',
    slug: 'table',
    milestone: 'data',
    priority: 'p2',
    pattern: 'Data table',
    summary:
      'Semantic table with caption, scoped headers, sortable columns and a responsive strategy that avoids horizontal ' +
      'scrolling at 320px. Sorting state is announced, not just indicated by an arrow.',
    scope: [
      'Props: caption, columns, rows, sortable, sortBy, onSortChange, stickyHeader, density',
      'th scope="col"/"row" set correctly; header cells contain buttons for sorting with aria-sort on the th',
      'Caption is required for data tables and can be visually hidden, never omitted',
      'Cards-on-mobile transformation preserves header-to-cell pairing in the accessible name',
    ],
    keys: 'Tab reaches sort buttons; Enter/Space sorts; focus stays on the activated header after re-sort',
    aria: [
      'Native table semantics with caption, thead/tbody/th scope',
      'aria-sort="ascending"/"descending" on exactly one header at a time',
      'Empty state is announced and linked to the table through aria-describedby',
    ],
    rtl: [
      'Column order follows the writing direction; numeric columns align logically',
      'Header sort arrows mirror their position but not their meaning',
      'Arabic cell content keeps line height without clipping diacritics',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'DataTable',
    slug: 'data-table',
    milestone: 'data',
    priority: 'p3',
    pattern: 'Interactive data grid',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/',
    summary:
      'Sorting, filtering, selection and pagination on top of Table. Virtualized rows stay reachable, selection is ' +
      'announced, and the row count is always available to assistive technology.',
    scope: [
      'Props: data, columns, sorting, filtering, rowSelection, pagination, virtualized',
      'Selection uses native checkboxes with a group name; "select all" announces the affected count',
      'Filtering announces the new result count through a polite live region',
      'Virtualization keeps a valid row count and aria-rowcount/aria-rowindex',
    ],
    keys: 'Tab enters the toolbar, arrows move within a cell-focused grid if enabled, Space selects a row',
    aria: [
      'aria-rowcount and aria-rowindex when rows are virtualized',
      'Sorting state on headers; filtering results announced',
      'Bulk action toolbar appears with a live announcement, not a silent layout change',
    ],
    rtl: [
      'Column pinning supports both edges logically',
      'Numeric and date columns align to the inline-end edge per locale convention',
      'Row actions menu opens with correct RTL submenu keys',
    ],
    deps: ['table', 'menu', 'pagination'],
  },
  {
    name: 'Progress',
    slug: 'progress',
    milestone: 'data',
    priority: 'p1',
    pattern: 'Progress bar',
    summary:
      'Determinate and indeterminate progress with a name, an optional value text, and a fill that grows from the ' +
      'inline-start edge in both directions.',
    scope: [
      'Props: value, max, label, valueText, indeterminate, tone, size',
      'role="progressbar" with aria-valuenow/min/max only in determinate mode',
      'Value updates are announced at a throttled interval, not on every percentage point',
      'Indeterminate animation collapses to a static striped bar under reduced motion',
    ],
    keys: 'Not focusable; the surrounding operation owns focus',
    aria: [
      'Accessible name required (label or aria-label)',
      'aria-valuetext for formatted values such as "3 of 10 files"',
      'Completion is announced once through a status region',
    ],
    rtl: [
      'Fill transforms from the inline-start edge using logical insets',
      'Arabic percentage formatting follows the locale',
      'No transform that assumes left-to-right growth',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'Meter',
    slug: 'meter',
    milestone: 'data',
    priority: 'p3',
    pattern: 'Meter',
    summary:
      'A bounded measurement (storage used, password strength) whose thresholds are conveyed as text, because color ' +
      'alone cannot carry the meaning.',
    scope: [
      'Props: value, min, max, low, high, optimum, label, valueText, thresholds',
      'role="meter" with aria-valuenow/min/max and an accessible name',
      'Threshold state is stated in text next to the meter and included in aria-valuetext',
      'Distinct from Progress: no aria-busy, no completion announcement',
    ],
    keys: 'Not focusable; the value is available to screen readers on demand',
    aria: [
      'role="meter" with aria-valuetext that names the state',
      'Accessible name is mandatory',
      'No live announcements on value change unless the caller opts in',
    ],
    rtl: [
      'Segment fill direction is logical',
      'Arabic value text and units are localized',
      'Labels align to the inline-start edge',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'Skeleton',
    slug: 'skeleton',
    milestone: 'data',
    priority: 'p2',
    pattern: 'Loading placeholder',
    summary:
      'A placeholder that is invisible to assistive technology, paired with a single loading announcement. It never ' +
      'pretends to be content and never animates for users who asked for less motion.',
    scope: [
      'Props: variant (text, circle, rect), lines, width, animation',
      'Wrapper is aria-hidden with no focusable descendants',
      'One polite "Loading" status region per loading area, not one per skeleton',
      'Shimmer is disabled under prefers-reduced-motion and in forced-colors mode',
    ],
    keys: 'Not focusable',
    aria: [
      'aria-hidden="true" on every shape',
      'No role="img" or placeholder text that a screen reader might read',
      'Announcement lives in the caller-provided status region',
    ],
    rtl: [
      'Shape widths and gaps use logical spacing',
      'Text-line skeletons mirror their ragged edge in RTL',
      'No left/right positioning in the implementation',
    ],
  },
  {
    name: 'EmptyState',
    slug: 'empty-state',
    milestone: 'data',
    priority: 'p2',
    pattern: 'Empty state region',
    summary:
      'The zero-results and zero-data state: a heading, a short explanation and one primary action, with the ' +
      'illustration hidden from assistive technology.',
    scope: [
      'Props: title, description, illustration, primaryAction, secondaryAction, tone',
      'Illustration is decorative by default; informative images require an alt prop',
      'Action is a real Button or Link, never a clickable div',
      'Announced when it replaces content after a search through a polite live region',
    ],
    keys: 'Tab reaches the action; the heading is navigable with H',
    aria: [
      'Section labelled by the title heading',
      'Decorative illustration has aria-hidden and empty alt',
      'Empty results are announced once, not on every keystroke',
    ],
    rtl: [
      'Illustration and text center without directional bias',
      'Action order follows the inline axis',
      'Arabic description keeps readable line length',
    ],
    deps: ['heading', 'button'],
  },
  {
    name: 'Card',
    slug: 'card',
    milestone: 'data',
    priority: 'p3',
    pattern: 'Card with optional link overlay',
    summary:
      'A content container with an optional interactive target. The whole card being clickable is implemented with a ' +
      'single stretched link, never by nesting interactive elements or using role="button" on a div.',
    scope: [
      'Props: as, padding, elevation, interactive (href), header, footer',
      'Interactive mode renders exactly one link and stretches its hit area with a pseudo-element',
      'No nested links or buttons in an interactive card except the stretched target and a documented exception list',
      'Heading level for the card title is explicit, not inferred',
    ],
    keys: 'Tab reaches the stretched link once; the card itself is not a tab stop',
    aria: [
      'article or section semantics only when the card has a heading',
      'No tabindex on the card container',
      'Nested actions inside an interactive card keep their own names',
    ],
    rtl: [
      'Media and action placement use logical insets',
      'Stretched link hit area covers the card in both directions',
      'Arabic titles truncate at the inline-end edge',
    ],
    deps: ['heading', 'link'],
  },
  {
    name: 'Timeline',
    slug: 'timeline',
    milestone: 'data',
    priority: 'p3',
    pattern: 'Ordered event list',
    summary:
      'Chronological events as an ordered list with a decorative connector line, explicit dates in every entry, and ' +
      'no reliance on position to convey order.',
    scope: [
      'Props: items (title, description, timestamp, icon, tone), orientation, label',
      'Renders ol/li; order is semantic, and each item states its date in text',
      'Icons are decorative unless they carry the only status information',
      'Connector line is a pseudo-element at the inline-start edge',
    ],
    keys: 'Not interactive unless items contain links or buttons; those keep their own tab stops',
    aria: [
      'List semantics with an accessible name',
      'Timestamps use a machine-readable datetime attribute',
      'Tone colors are paired with status text',
    ],
    rtl: [
      'Connector line and dots mirror with the writing direction',
      'Arabic date formatting follows the locale and calendar',
      'Mixed Latin identifiers in descriptions are isolated',
    ],
    deps: ['visually-hidden'],
  },
  {
    name: 'CodeBlock',
    slug: 'code-block',
    milestone: 'data',
    priority: 'p3',
    pattern: 'Preformatted code with copy action',
    summary:
      'Code stays LTR inside Arabic documentation, is selectable without dragging, and the copy button confirms with ' +
      'an announcement rather than only a checkmark.',
    scope: [
      'Props: code, language, showLineNumbers, copyable, maxHeight, highlightLines',
      'Forces dir="ltr" and text-align: start on the pre element, independent of page direction',
      'Copy button announces "Copied" politely and keeps focus',
      'Horizontal overflow is keyboard-scrollable and not clipped',
    ],
    keys: 'Tab reaches the copy button; arrow keys scroll the code region when it is focusable',
    aria: [
      'pre > code semantics preserved; language exposed through a caption or aria-label',
      'Line numbers are aria-hidden and excluded from copied text',
      'Copy confirmation is a live region message',
    ],
    rtl: [
      'Inline code inside Arabic prose is wrapped in bdi so punctuation stays correct',
      'Code blocks never mirror, even inside an RTL page',
      'Arabic comments inside code are still readable with the Arabic font stack',
    ],
    deps: ['button'],
  },
];
