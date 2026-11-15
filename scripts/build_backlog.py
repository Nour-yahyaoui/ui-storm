#!/usr/bin/env python3
"""Generate the ui-storm backlog.

The backlog is data, not prose typed into GitHub: this script owns the issues,
writes `backlog/issues.json` (canonical) and `docs/backlog.md` (readable index),
and can publish to GitHub. `--check` fails when the files on disk disagree with
the generator, so CI cannot drift.

Usage:
    python3 scripts/build_backlog.py            # write the files
    python3 scripts/build_backlog.py --check    # verify they are current
    python3 scripts/build_backlog.py --publish  # create missing GitHub issues
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ISSUES_JSON = ROOT / "backlog" / "issues.json"
BACKLOG_MD = ROOT / "docs" / "backlog.md"

MILESTONES = [
    ("foundations", "Foundations: tokens, themes, contrast",
     "The colour, type and spacing system, the theming model, and the contrast audit that guards them."),
    ("direction", "Direction and internationalisation",
     "Right-to-left correctness, bidi isolation, locale resolution and everything that follows from a writing direction."),
    ("forms", "Form controls",
     "Everything a form needs after the input, checkbox and button: selects, radios, switches, sliders, dates, files and the error summary."),
    ("overlays", "Overlays and disclosure",
     "Tooltips, popovers, menus, drawers and the command palette: the surfaces where focus management decides whether a product is usable."),
    ("navigation", "Navigation and structure",
     "Links, accordions, breadcrumbs, pagination, steppers and trees: the components that tell a user where they are."),
    ("feedback", "Feedback and status",
     "Alerts, toasts, progress, spinners and empty states — including the live regions that make them audible."),
    ("display", "Data and display",
     "Tables, cards, badges and avatars: reading surfaces, where structure matters more than decoration."),
    ("gallery", "Gallery and Actix surface",
     "The documentation site itself: routes, assets, headers, error pages and the server behaviour behind them."),
    ("testing", "Test harnesses and CI",
     "The machinery that keeps the guarantees honest: markup assertions, axe, keyboard runs, no-JavaScript runs, coverage floors."),
    ("docs", "Documentation and decisions",
     "Guides, recipes, ADRs and the migration story for teams arriving from a React component library."),
    ("release", "Packaging and release",
     "Crate metadata, MSRV policy, semver, changelogs, docs.rs and the supply-chain checks before a publish."),
    ("performance", "Performance budgets",
     "Payload size, render cost and compression: what the library is allowed to cost a page."),
    ("security", "Security",
     "Escaping, CSP compatibility, form security and dependency auditing."),
    ("conformance", "WCAG 2.2 conformance dossier",
     "One entry per A and AA success criterion: what it means here, how it is checked, and what a reviewer must confirm by hand."),
    ("integrations", "Framework integrations",
     "Making the components usable from the server frameworks people actually run, rather than from Actix alone."),
]

LABELS = [
    "type: feature", "type: enhancement", "type: bug", "type: docs", "type: test",
    "type: chore", "type: refactor", "type: performance", "type: security",
    "priority: p0", "priority: p1", "priority: p2", "priority: p3",
    "area: tokens", "area: direction", "area: forms", "area: overlays",
    "area: navigation", "area: feedback", "area: display", "area: gallery",
    "area: testing", "area: docs", "area: release", "area: performance",
    "area: security", "area: conformance", "area: integrations", "area: i18n",
    "good first issue", "help wanted", "a11y", "rtl",
]

COMPONENTS = [
    {"slug": "link", "name": "Link", "milestone": "navigation", "area": "navigation",
     "element": "<a href>", "role": "link, implicit",
     "keyboard": "Enter follows the link; Space does not, and never should.",
     "aria": "The visible text is the name. aria-current marks the current page; external links say so in the text, not only in an icon.",
     "rtl": "External-link and chevron glyphs follow the reading direction; the text stays in the document direction.",
     "why": "Applications need a link that is a link — not a button pretending to navigate."},
    {"slug": "select", "name": "Select", "milestone": "forms", "area": "forms",
     "element": "<select>", "role": "combobox (native)",
     "keyboard": "Native: Up/Down, first-letter typeahead, Alt+Down to open on Windows. The component must not intercept any of it.",
     "aria": "The label is a real <label for>; grouped options use <optgroup label>; a required select announces required.",
     "rtl": "The option list follows the page direction, and long option text truncates at the inline end.",
     "why": "The native select is the most reliable control on mobile and the easiest to break with a custom menu."},
    {"slug": "combobox", "name": "Combobox", "milestone": "forms", "area": "forms",
     "element": "<input role=\"combobox\"> plus a listbox popup", "role": "combobox with listbox and option",
     "keyboard": "Down/Up move through options, Enter selects, Escape closes without clearing, Alt+Down opens, Home/End jump.",
     "aria": "aria-expanded, aria-controls, aria-activedescendant and aria-autocomplete on the input; aria-selected on the active option.",
     "rtl": "The popup aligns to the inline start of the field, and the arrow-key mapping follows the direction of the list.",
     "why": "It is the hardest pattern in ARIA — the one where hand-rolled implementations reliably fail."},
    {"slug": "radio-group", "name": "Radio group", "milestone": "forms", "area": "forms",
     "element": "<fieldset> of <input type=\"radio\">", "role": "radiogroup via fieldset/legend",
     "keyboard": "Arrow keys move and check within the group; Tab enters and leaves the group as one stop; Space checks the focused radio.",
     "aria": "The legend names the group; each radio's label is its name; a group-level error is described on the fieldset.",
     "rtl": "Arrow keys follow the reading direction: in RTL, ArrowRight moves to the previous option.",
     "why": "Radio semantics are easy to get right natively and easy to destroy by rebuilding them with divs."},
    {"slug": "switch", "name": "Switch", "milestone": "forms", "area": "forms",
     "element": "<button role=\"switch\">", "role": "switch",
     "keyboard": "Space and Enter both toggle, which differs from a checkbox: the switch is a button.",
     "aria": "aria-checked is always present, and the label is stable — an on/off label that changes with state makes the control unreadable.",
     "rtl": "The knob travels from inline-start to inline-end; nothing is positioned with left or right.",
     "why": "Settings pages need an immediate-effect control that is honest about being a button."},
    {"slug": "textarea", "name": "Textarea", "milestone": "forms", "area": "forms",
     "element": "<textarea>", "role": "textbox, implicit",
     "keyboard": "Enter inserts a newline; the form submits with the button, not with a stray Enter.",
     "aria": "Label, description and error wiring is identical to the input, including aria-describedby ordering.",
     "rtl": "The resize handle sits at the inline end; the caret and alignment inherit the direction.",
     "why": "Multi-line input is where teams most often swap a label for a placeholder."},
    {"slug": "fieldset", "name": "Field group", "milestone": "forms", "area": "forms",
     "element": "<fieldset> with <legend>", "role": "group",
     "keyboard": "No keyboard behaviour of its own; Tab moves through the fields it contains.",
     "aria": "The legend is the group name. A description is linked with aria-describedby on the fieldset, not on each child.",
     "rtl": "The legend and any group-level help text use logical alignment, so they start on the correct side.",
     "why": "Grouping is the only accessible way to say 'these four fields answer one question'."},
    {"slug": "slider", "name": "Slider", "milestone": "forms", "area": "forms",
     "element": "<input type=\"range\">", "role": "slider, implicit",
     "keyboard": "Left/Right step, Up/Down step, PageUp/PageDown jump, Home/End to the ends.",
     "aria": "A visible label, and aria-valuetext when the number alone is ambiguous (\"3 of 10\", \"Medium\").",
     "rtl": "The track runs inline-start to inline-end: in RTL, increasing values move right to left, and the arrow keys agree.",
     "why": "Volume, price and thresholds are common, and every one of them is broken in RTL in most libraries."},
    {"slug": "date-field", "name": "Date field", "milestone": "forms", "area": "forms",
     "element": "<input type=\"date\"> with a text fallback", "role": "combobox or textbox, depending on the fallback",
     "keyboard": "The native picker keeps its own keys; a text fallback must document segment editing and Escape.",
     "aria": "A hint names the expected format; the value is never announced as an unlabelled number.",
     "rtl": "The field keeps the page direction; a date's internal ordering is locale-defined, not direction-defined.",
     "why": "Dates are a top-three support burden, and the native control is better than most replacements."},
    {"slug": "file-upload", "name": "File upload", "milestone": "forms", "area": "forms",
     "element": "<input type=\"file\">", "role": "button (native file input)",
     "keyboard": "Enter and Space open the picker; the selection is announced when it changes.",
     "aria": "The label describes the action, a description states the constraints, and the chosen file names are listed in text.",
     "rtl": "The selected-file list, including file names, keeps its own direction where the script requires it.",
     "why": "Upload controls hide the real input and then forget to keep it keyboard reachable."},
    {"slug": "error-summary", "name": "Error summary", "milestone": "forms", "area": "forms",
     "element": "<div role=\"alert\"> with a list of links", "role": "alert containing links",
     "keyboard": "Focus lands on the summary after a failed submit; Tab reaches each link; each link moves focus to its field.",
     "aria": "The summary lists every error as text, and each entry links to the field it belongs to.",
     "rtl": "The list marker and the indent follow the reading direction.",
     "why": "A form that reports errors only beside each field is unusable for anyone who submits from the bottom of a long page."},
    {"slug": "tooltip", "name": "Tooltip", "milestone": "overlays", "area": "overlays",
     "element": "<div role=\"tooltip\"> referenced by aria-describedby", "role": "tooltip",
     "keyboard": "Focus and hover both show it; Escape dismisses it; it never contains focusable content.",
     "aria": "aria-describedby on the trigger, never a name; the tooltip text is short and duplicates no visible label.",
     "rtl": "Placement flips from inline-start to inline-end, and the arrow follows.",
     "why": "Tooltips are the most misused overlay: they are a hint, never a place to put required information."},
    {"slug": "popover", "name": "Popover", "milestone": "overlays", "area": "overlays",
     "element": "<div popover> anchored to a trigger", "role": "dialog or none, decided per use",
     "keyboard": "Escape closes and returns focus; opening does not steal focus unless the content is interactive.",
     "aria": "aria-expanded and aria-controls on the trigger, with a name for the surface when it holds interactive content.",
     "rtl": "The surface anchors to the inline-start or inline-end edge; the anchor logic never hard-codes left or right.",
     "why": "Menus are too narrow and dialogs too heavy for the in-between case."},
    {"slug": "menu", "name": "Menu", "milestone": "overlays", "area": "overlays",
     "element": "[role=\"menu\"] of [role=\"menuitem\"]", "role": "menu, menuitem, menuitemcheckbox",
     "keyboard": "Up/Down, Home/End, first-letter typeahead, Enter to activate, Escape to close and return focus.",
     "aria": "Roving tabindex with exactly one menuitem in the tab order; separators are role=\"separator\".",
     "rtl": "Submenu chevrons mirror, and the horizontal arrow that opens a submenu follows the direction.",
     "why": "Action menus are everywhere and almost always missing typeahead and focus return."},
    {"slug": "drawer", "name": "Drawer", "milestone": "overlays", "area": "overlays",
     "element": "<dialog> used as a side sheet", "role": "dialog (modal)",
     "keyboard": "Escape closes, Tab is trapped, focus returns to the trigger.",
     "aria": "Named by its heading; the background is inert while it is open.",
     "rtl": "The sheet opens from the inline-start edge, which means the right side in Arabic and the left in English.",
     "why": "Filters and detail panes need a surface between a popover and a full-page navigation."},
    {"slug": "command-palette", "name": "Command palette", "milestone": "overlays", "area": "overlays",
     "element": "<dialog> containing a combobox", "role": "dialog with a combobox and a listbox",
     "keyboard": "Opens on a shortcut that is advertised, arrows move, Enter runs, Escape closes and restores focus.",
     "aria": "The dialog is named, the input owns the listbox, and the result count is announced.",
     "rtl": "Result rows align to the inline start, and shortcut hints stay left to right inside an RTL row.",
     "why": "It is the fastest path for keyboard users — and the fastest way to break a focus trap."},
    {"slug": "accordion", "name": "Accordion", "milestone": "navigation", "area": "navigation",
     "element": "<details> and <summary>", "role": "group with disclosure buttons",
     "keyboard": "Enter and Space toggle; Tab moves between headers; Home/End are optional and must not conflict with the page.",
     "aria": "aria-expanded on the header control and aria-controls to the region; the region is labelled by the header.",
     "rtl": "The disclosure chevron mirrors; the content padding is inline-start.",
     "why": "The native details element gives most of this for free, so the component must not throw it away."},
    {"slug": "breadcrumb", "name": "Breadcrumb", "milestone": "navigation", "area": "navigation",
     "element": "<nav> with an ordered list", "role": "navigation",
     "keyboard": "Plain links; Tab moves through them; the current page is not a link.",
     "aria": "aria-label names the navigation; aria-current=\"page\" marks the last item.",
     "rtl": "Separator glyphs mirror, and the list reads inline-start to inline-end.",
     "why": "Hierarchy is how users recover from a wrong turn, and it costs almost nothing to render."},
    {"slug": "pagination", "name": "Pagination", "milestone": "navigation", "area": "navigation",
     "element": "<nav> with links", "role": "navigation",
     "keyboard": "Plain links; Tab reaches each page; the current page is not focusable.",
     "aria": "aria-current=\"page\"; previous and next carry rel=\"prev\"/\"next\" and a text label.",
     "rtl": "Previous and next glyphs swap on mirroring, and the page numbers run in the reading direction.",
     "why": "Paging is a link problem, not a widget problem, and search engines need the links."},
    {"slug": "stepper", "name": "Stepper", "milestone": "navigation", "area": "navigation",
     "element": "<nav> with an ordered list", "role": "navigation or list",
     "keyboard": "Completed steps are links; the current step is not.",
     "aria": "aria-current=\"step\" on the current step, and the state of each step is stated in text.",
     "rtl": "The progress line and the connector arrows run inline-start to inline-end.",
     "why": "Multi-step flows need to say how much is left without relying on colour."},
    {"slug": "tree-view", "name": "Tree view", "milestone": "navigation", "area": "navigation",
     "element": "[role=\"tree\"] of [role=\"treeitem\"]", "role": "tree, treeitem, group",
     "keyboard": "Up/Down move, Right expands or enters, Left collapses or exits, Home/End jump, Enter activates.",
     "aria": "aria-expanded on parents, aria-level on every item, one tab stop for the whole tree.",
     "rtl": "Indentation and the expand/collapse arrows follow the direction; the tree's depth is expressed with padding-inline-start.",
     "why": "File browsers and category trees are common, and the arrow-key contract is completely direction-dependent."},
    {"slug": "alert", "name": "Alert", "milestone": "feedback", "area": "feedback",
     "element": "<div role=\"alert\"> or role=\"status\"", "role": "alert, status",
     "keyboard": "Not interactive; if it contains a link, that link is reachable by Tab.",
     "aria": "role=\"alert\" for errors that appear in response to an action, role=\"status\" for polite updates; never both.",
     "rtl": "The icon sits at the inline start and the close button at the inline end.",
     "why": "A message that is only visual is a message that half the users never receive."},
    {"slug": "toast", "name": "Toast", "milestone": "feedback", "area": "feedback",
     "element": "A live region container with polite announcements", "role": "status",
     "keyboard": "Toasts are never required to complete a task; dismissal is reachable if a close button exists.",
     "aria": "The container is a persistent live region so announcements are actually announced; timeouts are generous and pausable.",
     "rtl": "The stack anchors to the inline-end corner, not the right corner.",
     "why": "Transient messages are the easiest thing to make inaccessible and the hardest to debug."},
    {"slug": "progress", "name": "Progress", "milestone": "feedback", "area": "feedback",
     "element": "<progress> or role=\"progressbar\"", "role": "progressbar",
     "keyboard": "Nothing: a progress bar is not focusable.",
     "aria": "A name, and either a determinate aria-valuenow or an explicit indeterminate state.",
     "rtl": "The filled portion grows from the inline start.",
     "why": "Long operations need a determinate signal, and screen readers need a name for it."},
    {"slug": "spinner", "name": "Spinner", "milestone": "feedback", "area": "feedback",
     "element": "An inline decorative glyph with a visually hidden label", "role": "none or status",
     "keyboard": "Nothing: it is decoration with a status message attached.",
     "aria": "Either aria-hidden with adjacent text, or a status with a name. Never a spinning shape with no words.",
     "rtl": "Rotation is direction-neutral; only the inline spacing changes.",
     "why": "Spinners replace content; the replacement must be announced once, not on every frame."},
    {"slug": "empty-state", "name": "Empty state", "milestone": "feedback", "area": "feedback",
     "element": "<section> with a heading", "role": "region",
     "keyboard": "Its action is a normal button or link.",
     "aria": "The heading is a real heading at the right level, and the explanation is a paragraph.",
     "rtl": "The illustration and the copy align to the inline start.",
     "why": "An empty list with no explanation reads as a bug."},
    {"slug": "table", "name": "Table", "milestone": "display", "area": "display",
     "element": "<table> with <caption> and scoped headers", "role": "table, implicit",
     "keyboard": "Static tables need nothing; sortable headers are buttons with aria-sort on the th.",
     "aria": "A caption names the table; scope=\"col\"/\"row\" on headers; aria-sort on the sorted column only.",
     "rtl": "Column order follows the document direction, and numeric columns align consistently.",
     "why": "Tables are the most structure-rich surface, and the one most often rebuilt with divs."},
    {"slug": "card", "name": "Card", "milestone": "display", "area": "display",
     "element": "<article> or <section> with a heading", "role": "region or article",
     "keyboard": "Only the interactive parts are focusable; a card is not one big link unless it is.",
     "aria": "The heading gives the card its name; a whole-card link must not swallow the inner controls.",
     "rtl": "Media and metadata align to the inline start; the layout mirrors with no extra rules.",
     "why": "Cards are containers with the same heading and link-discipline problems as pages."},
    {"slug": "badge", "name": "Badge", "milestone": "display", "area": "display",
     "element": "<span>", "role": "none",
     "keyboard": "Nothing.",
     "aria": "The text is the information; colour is never the only difference between statuses.",
     "rtl": "Inline spacing uses margin-inline-start.",
     "why": "Status chips are read aloud as part of a sentence, so their wording matters more than their colour."},
    {"slug": "avatar", "name": "Avatar", "milestone": "display", "area": "display",
     "element": "<img> or initials in a <span>", "role": "img when it carries meaning",
     "keyboard": "Nothing, unless the avatar is also a link to the profile.",
     "aria": "alt carries the person's name when the avatar conveys identity; decorative avatars are aria-hidden.",
     "rtl": "Initials follow the name's own direction, not the page's.",
     "why": "Two avatars for two people cannot both be announced as 'avatar'."},
]

ASPECTS = [
    ("api", "design the Rust API",
     ["A builder in `crates/ui-storm/src/components/{slug}.rs` with `new(..)` taking every prop that has no safe default.",
      "Enums for variants and states, each with the `as_str()`/`class()` helpers used by `button.rs`.",
      "Borrowed `&'a str` props rather than `String`, so rendering does not allocate for static text.",
      "Rustdoc with a `# Examples` block that is compiled as a doctest.",
      "Re-exported from `crates/ui-storm/src/lib.rs` and listed in `components/mod.rs`."]),
    ("markup", "build the markup and ARIA contract",
     ["Renders {element} with the role the platform already provides: {role}.",
      "Names: {aria}",
      "Every id the component writes is unique and prefixed by the component id, so two instances never collide.",
      "No `aria-label` duplicating visible text; no role invented where an element exists.",
      "Markup assertions added to `crates/ui-storm/tests/components.rs` for each relationship above."]),
    ("keyboard", "implement keyboard interaction and focus",
     ["{keyboard}",
      "Focus is visible on every interactive part via the shared focus ring; nothing sets `outline: none`.",
      "Tab order follows the document order, with exactly one tab stop per composite widget.",
      "Behaviour asserted in `tests/e2e/keyboard.spec.ts` against the gallery page.",
      "Documented in the component page's keyboard table, including what is deliberately not handled."]),
    ("rtl", "make it correct in right-to-left",
     ["{rtl}",
      "Only logical CSS properties: no `left`, `right`, `margin-left`, `padding-right` or `text-align: left`.",
      "Verified in the gallery with `?lang=ar`, where `<html dir=\"rtl\">` is set by the server.",
      "User-supplied content is isolated with bidi controls only where mixing is unavoidable.",
      "Test added to `tests/e2e/gallery.spec.ts` for the direction-specific behaviour above."]),
    ("styles", "style every state with tokens",
     ["States covered: default, hover, focus-visible, active, disabled, invalid, selected, loading — as applicable.",
      "Colours come only from `assets/ui-storm.css` tokens; any new token is added to `src/tokens.rs` too.",
      "Dark theme and `forced-colors: active` both checked, with contrast ratios passing the audit.",
      "Motion is disabled under `prefers-reduced-motion: reduce`, and no state depends on animation.",
      "No inline styles and no `!important` outside the reduced-motion block."]),
    ("docs", "write the gallery page",
     ["Route `/components/{slug}` rendering live demos, wired into `crates/ui-storm-web/src/routes.rs` and the navigation.",
      "Sections: what it is, demos, ARIA contract list, keyboard table, real rendered markup, RTL note.",
      "The markup block is the component's own `render()` output, not a hand-written copy.",
      "Added to the `PAGES` list in `tests/e2e/gallery.spec.ts` so axe runs on it in both themes and both directions.",
      "Cross-linked from the overview table and from the components it commonly partners with."]),
    ("tests", "add the automated tests",
     ["Markup contract tests in `crates/ui-storm/tests/components.rs`: element, role, names, id relationships, escaping.",
      "Exactly-one-tab-stop and id-uniqueness assertions where the component is composite.",
      "axe run in light, dark and RTL with zero serious or critical violations.",
      "No-JavaScript behaviour checked: the component is still readable and operable with scripting off.",
      "Edge cases covered: empty label rejected, very long text, mixed-direction content, and duplicate instances on one page."]),
]

PLATFORM = [
    ("foundations", "tokens", "Publish the token reference as machine-readable JSON",
     "Expose every custom property with its value and purpose, generated from `src/tokens.rs` so the gallery and the crate cannot disagree."),
    ("foundations", "tokens", "Add a high-contrast theme that is not just the dark theme",
     "Some users need maximum separation rather than a dark palette; derive a third theme with the same audit."),
    ("foundations", "tokens", "Audit large-text contrast separately",
     "Body text and 24px text have different WCAG thresholds; split the audit so a large-text pair cannot hide behind 4.5:1."),
    ("foundations", "tokens", "Document the theming contract for consumers",
     "Explain which tokens are public, which are internal, and how to override one without breaking the audit."),
    ("foundations", "tokens", "Add a colour-blind simulation check for status colours",
     "Success, warning and danger must differ in more than hue; verify with simulated deuteranopia and add the text labels."),
    ("foundations", "tokens", "Guard the token sync test against reordering",
     "The CSS and Rust palettes are compared as ordered lists; make the check order-insensitive and report the diff clearly."),
    ("foundations", "tokens", "Add a contrast report endpoint to the gallery",
     "`/foundations` shows the table; add a `?format=json` variant so a downstream service can consume the audit."),
    ("foundations", "tokens", "Type scale rhythm audit",
     "Check every size in the scale against line-height and the 200% zoom requirement."),
    ("foundations", "tokens", "Spacing scale migration notes",
     "Document why the scale is rem-based and what breaks if a consumer switches to px."),
    ("foundations", "tokens", "Focus ring contrast on coloured surfaces",
     "The ring is audited against the page background; verify it against accent and danger fills too."),
    ("foundations", "tokens", "Print stylesheet",
     "A print stylesheet that keeps structure, drops shadows, and never hides content behind `hidden`."),
    ("direction", "direction", "Locale resolution table with tests per language",
     "Cover every RTL base language, the script-subtag override, and the deliberate LTR exceptions, one test each."),
    ("direction", "direction", "Bidi isolation for user-supplied strings",
     "Wrap mixed-direction values (names, file names, addresses) in isolation so punctuation lands on the correct side."),
    ("direction", "direction", "Logical property lint over the whole repository",
     "Fail the build on any physical property in CSS, inline styles or component code, not just the main stylesheet."),
    ("direction", "direction", "Arabic numeral handling",
     "Decide and document whether the library uses Western or Arabic-Indic digits, and test both in inputs and progress values."),
    ("direction", "direction", "Arabic and Hebrew font stacks",
     "Ship a stack that renders correctly without a webfont, and document the optional webfont path."),
    ("direction", "direction", "Mirrored icon catalogue",
     "Classify every glyph as directional or neutral and expose the classification through the API."),
    ("direction", "direction", "Direction-aware arrow keys in every composite widget",
     "One shared helper so tabs, menus, radios, sliders and trees cannot drift apart."),
    ("direction", "direction", "Locale-aware date and number formatting hooks",
     "Accept pre-formatted strings and document where formatting happens — the library must not format."),
    ("direction", "direction", "Translation of the visible library strings",
     "The words the library renders itself (required, loading, close) must be injectable per page."),
    ("direction", "direction", "RTL snapshot tests for every component page",
     "Render each gallery page twice and assert the mirrored geometry where it should differ and nowhere else."),
    ("gallery", "gallery", "Error pages for 500 and 404 with the shared shell",
     "Both use the gallery layout, keep the skip link, and never leak a panic message."),
    ("gallery", "gallery", "Security headers middleware",
     "CSP without inline scripts, `X-Content-Type-Options`, `Referrer-Policy` and a sane `Permissions-Policy`."),
    ("gallery", "gallery", "Compression for HTML, CSS and JS",
     "Enable `Compress` and assert the payload improvement in the performance budget."),
    ("gallery", "gallery", "ETag and cache policy for hashed assets",
     "Static assets get a content hash in the URL and immutable caching; HTML stays `no-store`."),
    ("gallery", "gallery", "Structured request logging",
     "One line per request with method, path, status, duration and request id, without logging query strings verbatim."),
    ("gallery", "gallery", "Graceful shutdown",
     "Drain in-flight requests on SIGTERM so deploys do not cut a response in half."),
    ("gallery", "gallery", "Configurable host, port and base path",
     "Everything the deployment needs comes from the environment; the app also works behind a path prefix."),
    ("gallery", "gallery", "Health and readiness endpoints with build metadata",
     "`/healthz` stays cheap; add `/readyz` and a version string from the build."),
    ("gallery", "gallery", "Sitemap and robots.txt",
     "Every documentation page enumerated from the router, not from a hand-maintained list."),
    ("gallery", "gallery", "Search across the documentation",
     "Server-side search over the component pages with a form that works without JavaScript."),
    ("gallery", "gallery", "Breadcrumb navigation in the gallery",
     "Use the library's own breadcrumb component once it exists — the gallery should eat its own cooking."),
    ("gallery", "gallery", "Partial rendering for htmx-style consumers",
     "Expose each demo fragment at a documented URL so another app can embed one component without cloning the whole gallery."),
    ("gallery", "gallery", "Gallery-specific tests for headers and caching",
     "Assert the header set and the cache-control values for HTML and assets."),
    ("gallery", "gallery", "Server-side 404 for unknown component slugs with suggestions",
     "Suggest the closest component name instead of a bare 404."),
    ("gallery", "gallery", "Embed a coding sandbox per component",
     "Each page links to a runnable snippet so a reader can try the component without cloning."),
    ("testing", "testing", "Property tests for direction resolution",
     "Randomised locale tags must never panic and must always return a valid direction."),
    ("testing", "testing", "HTML validity check on rendered output",
     "Parse every component's markup with an HTML5 parser and fail on nesting errors that browsers silently repair."),
    ("testing", "testing", "Snapshot tests for component markup",
     "Store expected markup per component so an unintended attribute change is visible in review."),
    ("testing", "testing", "Coverage floor per crate",
     "Fail below 90% lines in `ui-storm` and 80% in `ui-storm-web`, measured with a single tool."),
    ("testing", "testing", "MSRV build job",
     "The declared MSRV is built in CI; a dependency that raises it fails the job instead of surprising users."),
    ("testing", "testing", "Beta and nightly channels",
     "Warnings from the next Rust release appear in CI before they break a release."),
    ("testing", "testing", "axe rules audit: what is ignored and why",
     "Any disabled axe rule is listed with a justification and a manual check."),
    ("testing", "testing", "Keyboard-only run through the whole gallery",
     "One test that tabs through every page and asserts no focus trap and no unreachable control."),
    ("testing", "testing", "Zoom to 200% layout test",
     "No content loss and no horizontal scrolling at 200% zoom on every page."),
    ("testing", "testing", "Reduced-motion run",
     "Every page renders and every state change is visible with animations disabled."),
    ("testing", "testing", "Forced-colours run",
     "Every page keeps its boundaries and focus ring in Windows high-contrast mode."),
    ("testing", "testing", "Screen-reader manual matrix",
     "Document the NVDA, VoiceOver and TalkBack passes per component, with date and version."),
    ("testing", "testing", "Flaky test policy and quarantine list",
     "A documented procedure for a flaky test that does not involve deleting it."),
    ("testing", "testing", "Component test helpers in a dev crate",
     "Shared assertion helpers so each component's tests stay short and consistent."),
    ("testing", "testing", "Fuzz the escaping path",
     "Hostile labels, scripts and RTL overrides must never produce executable markup."),
    ("testing", "testing", "Automated id-collision test across a full page",
     "Render every component together and assert global id uniqueness."),
    ("testing", "testing", "Test the noscript contract",
     "Assert that every page is still readable with scripting disabled, not just the tabs page."),
    ("testing", "testing", "Contract test for the public API surface",
     "A compile-only fixture that uses every public type, so a breaking change cannot ship unnoticed."),
    ("testing", "testing", "CI timing budget",
     "Keep the full pipeline under ten minutes and fail the job that exceeds it."),
    ("docs", "docs", "Guides: forms, overlays, navigation, feedback",
     "One guide per family that shows how the pieces combine, not just each component alone."),
    ("docs", "docs", "Recipe: a validated Arabic form",
     "End-to-end example with an error summary, RTL fields and a mixed-direction email input."),
    ("docs", "docs", "Recipe: a modal confirmation flow",
     "Dialog, focus return, and the destructive-action ordering advice."),
    ("docs", "docs", "Recipe: server-side validation with Actix",
     "Show the round trip from form submit to error summary without client JavaScript."),
    ("docs", "docs", "Migration guide from a React component library",
     "Map props to builders, hooks to server state, and client interaction to progressive enhancement."),
    ("docs", "docs", "Accessibility statement template",
     "A page consumers can adapt: conformance level, known gaps, contact route."),
    ("docs", "docs", "ADR: why Maud rather than a template language",
     "Record the trade-offs against Askama and plain `format!`."),
    ("docs", "docs", "ADR: why the dialog is native",
     "Record what the platform provides and what it does not."),
    ("docs", "docs", "ADR: how progressive enhancement is bounded",
     "State the rule: the script may add convenience, never content."),
    ("docs", "docs", "Documentation about documentation",
     "How a new component page is written, reviewed and kept in sync with the code."),
    ("docs", "docs", "Rustdoc example for every public item",
     "`missing_docs` and `# Examples` enforced by lints rather than by review."),
    ("docs", "docs", "Publish the gallery to GitHub Pages",
     "Static export or a hosted binary, with the same tests gating the deploy."),
    ("docs", "docs", "Glossary of accessibility terms used in the docs",
     "Accessible name, live region, roving tabindex — defined once and linked."),
    ("docs", "docs", "Changelog policy",
     "Every user-visible change gets a line, and the format is checked in CI."),
    ("release", "release", "Crate metadata completion",
     "`description`, `keywords`, `categories`, `readme`, `docs.rs` metadata and `#![forbid(unsafe_code)]`."),
    ("release", "release", "MSRV policy in `Cargo.toml` and in CI",
     "The minimum supported Rust version is declared, tested and only raised in a minor release with a note."),
    ("release", "release", "Semver policy for the component API",
     "Say what counts as breaking for a builder-based API, and enforce it with a review checklist."),
    ("release", "release", "Release automation",
     "One workflow that tags, builds, publishes to crates.io and writes the changelog."),
    ("release", "release", "cargo-deny configuration",
     "Licences, advisories and duplicate versions checked on every pull request."),
    ("release", "release", "cargo-audit in CI",
     "Advisories fail the build, with a documented exception process."),
    ("release", "release", "Supply-chain provenance",
     "Publish with a verifiable source and record the dependency tree in the release notes."),
    ("release", "release", "Examples directory with runnable binaries",
     "At least four examples that `cargo run --example` can start without extra setup."),
    ("release", "release", "Docker image for the gallery",
     "A small multi-stage image that runs the same binary the tests ran against."),
    ("release", "release", "Version the CSS and the crate together",
     "A consumer must be able to tell which stylesheet version belongs to which crate version."),
    ("release", "release", "Deprecation path for renamed props",
     "Old builders keep working with a warning for one minor release."),
    ("release", "release", "docs.rs build check",
     "Build the documentation with `--all-features` in CI so a broken link fails before publishing."),
    ("release", "release", "Publish checklist as a pull request template",
     "The checklist lives where the release is done, not in a wiki."),
    ("performance", "performance", "CSS size budget",
     "Cap the stylesheet at 20 kB uncompressed and fail the build when it grows."),
    ("performance", "performance", "JavaScript size budget",
     "Cap the enhancement script at 8 kB and keep it dependency-free."),
    ("performance", "performance", "Render benchmarks with criterion",
     "Measure each component's render cost and keep a baseline in the repository."),
    ("performance", "performance", "Allocation-free rendering where possible",
     "Pre-size strings and avoid `format!` in hot paths; assert with a counting allocator test."),
    ("performance", "performance", "Compression ratio report",
     "Report gzip and brotli sizes per page in CI."),
    ("performance", "performance", "First-byte and render timings for the gallery",
     "Track the server response time for each page and fail on regression beyond a threshold."),
    ("performance", "performance", "No layout shift from the enhancement script",
     "The script must not change geometry when it runs; assert with a CLS check."),
    ("performance", "performance", "Font loading strategy",
     "No invisible text and no layout shift; document the optional webfont path."),
    ("performance", "performance", "Cache-busting asset names",
     "Content-hashed filenames so assets can be cached forever without stale-HTML problems."),
    ("performance", "performance", "Payload report per component page",
     "Each page's CSS and JS cost surfaced in the gallery itself."),
    ("security", "security", "Escaping audit across every component",
     "Every interpolation is escaped by default; `PreEscaped` is used only for the noscript style and is reviewed."),
    ("security", "security", "CSP-compatible by construction",
     "No inline event handlers, no inline styles in components, and the one inline `<style>` moved to a nonce or an asset."),
    ("security", "security", "Hostile input test suite",
     "Labels, ids and descriptions containing markup, quotes and RTL overrides must render inert."),
    ("security", "security", "Form CSRF strategy for Actix consumers",
     "Document and test a token flow that works with the library's forms."),
    ("security", "security", "Rate limiting for form endpoints in the gallery",
     "A documented middleware configuration and a test that it rejects a burst."),
    ("security", "security", "Dependency advisory response plan",
     "Who is notified, within what time, and what a patch release looks like."),
    ("security", "security", "Forbid unsafe code",
     "`#![forbid(unsafe_code)]` in every crate, with a test that the attribute is present."),
    ("security", "security", "Log redaction",
     "Query strings and form values never reach the logs verbatim."),
    ("security", "security", "Secrets in configuration",
     "Nothing secret lives in the repository; the deployment contract is documented."),
    ("security", "security", "Clickjacking and framing policy",
     "`frame-ancestors` set, and the gallery usable when embedded only where intended."),
    ("security", "security", "Error message hygiene",
     "Internal errors render a generic page and log the detail; no stack traces to users."),
    ("security", "security", "Third-party script policy",
     "The gallery ships none; document how a consumer adding one keeps the CSP honest."),
]

HARDENING = [
    ("button", "Button hardening: axe and keyboard coverage in both themes and directions"),
    ("button", "Button hardening: verify the loading announcement in a screen reader"),
    ("button", "Button hardening: network-throttled double-submit protection guidance"),
    ("icon-button", "Icon button hardening: audit every glyph in the gallery for a meaningful name"),
    ("icon-button", "Icon button hardening: mirroring test for directional glyphs"),
    ("icon-button", "Icon button hardening: 44px hit area verification at 320px"),
    ("text-input", "Text input hardening: autofill and password-manager compatibility"),
    ("text-input", "Text input hardening: error announcement ordering test"),
    ("text-input", "Text input hardening: mixed-direction value test"),
    ("checkbox", "Checkbox hardening: indeterminate state announcement test"),
    ("checkbox", "Checkbox hardening: group and fieldset integration"),
    ("checkbox", "Checkbox hardening: label hit-area test at 320px"),
    ("dialog", "Dialog hardening: focus-trap test under nested dialogs"),
    ("dialog", "Dialog hardening: explicit initial-focus option"),
    ("dialog", "Dialog hardening: backdrop-click policy documented and tested"),
    ("tabs", "Tabs hardening: no-JavaScript contract test on every page"),
    ("tabs", "Tabs hardening: RTL arrow-key map test in the gallery"),
    ("tabs", "Tabs hardening: overflow behaviour with eight tabs at 320px"),
]


# --------------------------------------------------------------------------
# Second wave
#
# The first 332 issues covered the 30 planned components (seven aspects each),
# hardening of the six shipped ones, and the platform. The wave below adds work
# that is genuinely new rather than more instances of the same thing:
#
#   * three new per-component aspects (render cost, localisation, examples)
#     for every component, shipped or planned  -> 36 x 3
#   * 22 components the matrix did not contain               -> 22 x 7
#   * a locale-by-locale RTL dossier
#   * one issue per WCAG 2.2 A/AA success criterion
#   * a browser and assistive-technology matrix
#   * framework integrations
#   * guides, references and playbooks
#   * operational work the gallery still needs
# --------------------------------------------------------------------------

EXTRA_ASPECTS = [
    ("perf", "performance", "performance", "measure and cap its render cost", [
        "A criterion benchmark in `crates/ui-storm/benches/{slug}.rs` renders {name} 10,000 times.",
        "The budget is written down before the number: at most one allocation per instance beyond id construction.",
        "The measured cost is recorded in `docs/performance.md` and shown on the gallery page.",
        "CI fails when the benchmark regresses by more than 20% against the recorded baseline.",
    ]),
    ("locale", "direction", "direction", "localise the strings it renders", [
        "Every string {name} renders itself (close labels, loading words, required markers, error prefixes) is injectable.",
        "Nothing English is hard-coded in the template; the English default is documented as a default.",
        "Arabic and Hebrew strings render without clipping, with the label in the page direction.",
        "Pluralisation belongs to the caller: the component takes the finished string, never a count.",
        "A test renders {name} with Arabic strings and asserts the resulting accessible name.",
    ]),
    ("example", "docs", "docs", "ship a runnable example", [
        "`examples/{slug}.rs` starts with `cargo run --example {slug}` and renders {name} in both directions.",
        "The example depends only on the workspace crates and adds no optional Actix features.",
        "It is linked from the component's gallery page and listed in `examples/README.md`.",
        "A CI step builds every example, so one cannot rot unnoticed.",
    ]),
]

NEW_COMPONENTS = [
    {"slug": "menubar", "name": "Menubar", "milestone": "overlays", "area": "overlays",
     "element": "[role=\"menubar\"] of menu buttons", "role": "menubar, menu, menuitem",
     "keyboard": "Left/Right move between top-level menus, Down opens one, Escape closes and returns focus.",
     "aria": "aria-haspopup on each menu button, aria-expanded on the open one, roving tabindex across the bar.",
     "rtl": "Left and Right swap in RTL, and the bar fills from the inline start.",
     "why": "Application menus are the one place where horizontal arrow movement is expected at the top level."},
    {"slug": "toolbar", "name": "Toolbar", "milestone": "overlays", "area": "overlays",
     "element": "[role=\"toolbar\"]", "role": "toolbar",
     "keyboard": "Arrow keys move between controls, Home/End jump, Tab leaves the toolbar as one stop.",
     "aria": "A label on the toolbar, and aria-pressed on toggle buttons that are not menus.",
     "rtl": "Arrow keys follow reading direction; the toolbar wraps from the inline start.",
     "why": "Editor and table toolbars are a single tab stop in every good editor, and a tab-storm in most others."},
    {"slug": "segmented-control", "name": "Segmented control", "milestone": "forms", "area": "forms",
     "element": "<fieldset> of radios styled as segments", "role": "radiogroup",
     "keyboard": "Arrow keys move and select, Tab enters and leaves the group as one stop.",
     "aria": "Each segment is a radio with a label; the group has a legend or an accessible name.",
     "rtl": "Segments fill from the inline start, and the arrow mapping mirrors.",
     "why": "Two to five mutually exclusive options read better as segments than as a select, but only if the radio semantics survive."},
    {"slug": "number-field", "name": "Number field", "milestone": "forms", "area": "forms",
     "element": "<input type=\"number\"> with optional steppers", "role": "spinbutton",
     "keyboard": "Up/Down step, PageUp/PageDown jump, Home/End to the bounds; typing is never blocked.",
     "aria": "A label, aria-valuemin/max/now when steppers are custom, and a hint for the accepted format.",
     "rtl": "The digits and the minus sign keep their own direction; the steppers sit at the inline end.",
     "why": "Quantity and price fields break for people who type, paste or use a screen reader unless the native input is kept."},
    {"slug": "otp-input", "name": "Verification code", "milestone": "forms", "area": "forms",
     "element": "A group of single-character inputs inside a fieldset", "role": "group with six textboxes",
     "keyboard": "Typing advances, Backspace retreats, Left/Right move, paste fills the whole code.",
     "aria": "The group is named 'verification code', autocomplete=\"one-time-code\" is set once, and the code is announced as a whole.",
     "rtl": "The digit boxes run inline-start to inline-end, and each box holds one digit in the page direction.",
     "why": "Six separate inputs are hostile to screen readers and password managers unless the group is designed as one control."},
    {"slug": "tag-input", "name": "Tag input", "milestone": "forms", "area": "forms",
     "element": "An input plus a list of removable chips", "role": "combobox with a list of buttons",
     "keyboard": "Enter adds a tag, Backspace on an empty input removes the last one, Left/Right walk the chips.",
     "aria": "Each chip's remove control has a name that names its tag; the input keeps the group's label.",
     "rtl": "Chips wrap from the inline start and each chip's remove button sits at its inline end.",
     "why": "Labels, recipients and filters are all tag inputs, and the removal control is the part everyone forgets to name."},
    {"slug": "rating", "name": "Rating", "milestone": "forms", "area": "forms",
     "element": "A radiogroup of star radios", "role": "radiogroup",
     "keyboard": "Arrow keys change the value, Tab leaves the group, Space selects the focused star.",
     "aria": "The value is stated in words as well as stars ('3 of 5'), and each radio has a real label.",
     "rtl": "Stars fill from the inline start; the numeric value never mirrors.",
     "why": "A five-star widget made of spans is the classic case of a control that looks obvious and is invisible to assistive technology."},
    {"slug": "color-field", "name": "Colour field", "milestone": "forms", "area": "forms",
     "element": "<input type=\"color\"> paired with a text field", "role": "textbox and a native colour input",
     "keyboard": "The text field takes typed hex values; the native picker keeps its own keys.",
     "aria": "The hex value is the accessible value, and the swatch is never the only way to read it.",
     "rtl": "The hex value stays left to right inside an RTL row.",
     "why": "Theme editors and brand settings need a colour input that a keyboard user can actually set."},
    {"slug": "calendar", "name": "Calendar", "milestone": "forms", "area": "forms",
     "element": "[role=\"grid\"] of day cells", "role": "grid with gridcells",
     "keyboard": "Arrows move by day and week, PageUp/PageDown by month, Home/End to the week's ends, Enter selects.",
     "aria": "A month heading, weekday column headers, aria-selected on the chosen day, and the full date as each cell's name.",
     "rtl": "The weekday columns run right to left; ArrowRight moves to the previous day.",
     "why": "Date pickers are the most-used complex widget in forms, and the grid semantics are what make them usable."},
    {"slug": "time-field", "name": "Time field", "milestone": "forms", "area": "forms",
     "element": "<input type=\"time\"> with a text fallback", "role": "combobox or textbox",
     "keyboard": "The native control keeps its segment editing; the fallback documents its own keys.",
     "aria": "The accepted format is stated in a linked hint, not in a placeholder.",
     "rtl": "The time value keeps its own direction while the label follows the page.",
     "why": "Scheduling needs a time input that respects 12/24-hour locale conventions without inventing a new widget."},
    {"slug": "listbox", "name": "Listbox", "milestone": "forms", "area": "forms",
     "element": "[role=\"listbox\"] of [role=\"option\"]", "role": "listbox, option",
     "keyboard": "Arrows move, Home/End jump, typeahead selects by prefix, Space toggles in a multi-select.",
     "aria": "aria-activedescendant or roving focus, aria-selected per option, aria-multiselectable when it applies.",
     "rtl": "Options align to the inline start, and the arrow mapping follows the list direction.",
     "why": "A standalone listbox is the right control for long option sets where a native select would hide too much."},
    {"slug": "split-button", "name": "Split button", "milestone": "navigation", "area": "navigation",
     "element": "Two adjacent buttons, the second opening a menu", "role": "button plus menu button",
     "keyboard": "Tab reaches both, Down opens the menu, Escape closes and returns focus.",
     "aria": "The primary button and the menu button have distinct names; the menu button announces aria-expanded.",
     "rtl": "The menu aligns to the inline end and the chevron mirrors.",
     "why": "One default action with a few alternatives is common, and merging them into one control is an accessibility mistake."},
    {"slug": "banner", "name": "Banner", "milestone": "feedback", "area": "feedback",
     "element": "<section> with a heading, optionally dismissible", "role": "region",
     "keyboard": "The dismiss control is a normal button; the banner never steals focus on load.",
     "aria": "The banner is named, its dismissal is not required to complete a task, and the state is not colour-only.",
     "rtl": "The icon sits at the inline start and the dismiss control at the inline end.",
     "why": "Site-wide notices are the easiest content to make keyboard-hostile and the hardest to dismiss by accident."},
    {"slug": "notification-center", "name": "Notification centre", "milestone": "feedback", "area": "feedback",
     "element": "A popover with a list of notifications", "role": "dialog with a list",
     "keyboard": "The trigger announces the unread count; Escape closes and returns focus; each item is a link.",
     "aria": "The count is in the trigger's name, and the list is announced as a list, not as a live region on every render.",
     "rtl": "The panel anchors to the inline end and unread dots sit at the inline start of each row.",
     "why": "Unread counts spoken as bare numbers are noise; the count belongs in the name of the control that reveals them."},
    {"slug": "theme-switcher", "name": "Theme switcher", "milestone": "display", "area": "display",
     "element": "A radiogroup or a set of links", "role": "radiogroup or navigation",
     "keyboard": "Arrows within a radiogroup, Tab within links; the choice survives a reload.",
     "aria": "The current theme is announced as checked or as aria-current, never only as a filled swatch.",
     "rtl": "The control mirrors with the page; the theme names do not.",
     "why": "Every product that ships a dark theme ships this control, and half of them make it a colour-only toggle."},
    {"slug": "language-switcher", "name": "Language switcher", "milestone": "navigation", "area": "navigation",
     "element": "A list of links, each with lang and hreflang", "role": "navigation",
     "keyboard": "Plain links; Tab walks them; the current language is not a link.",
     "aria": "Each link carries lang in the target language and hreflang for crawlers; the current one is marked.",
     "rtl": "The list order follows the page, while each label renders in its own direction.",
     "why": "Switching to Arabic is the first thing an Arabic user does, and it is usually the least accessible control on the page."},
    {"slug": "table-of-contents", "name": "Table of contents", "milestone": "navigation", "area": "navigation",
     "element": "<nav> with nested lists of anchors", "role": "navigation",
     "keyboard": "Plain anchors; the current section is not focusable.",
     "aria": "aria-current=\"true\" as the section changes, with a label that distinguishes it from the main navigation.",
     "rtl": "Indentation uses padding-inline-start, so nesting deepens towards the inline end.",
     "why": "Long documentation needs in-page navigation that does not become a second tab order."},
    {"slug": "timeline", "name": "Timeline", "milestone": "display", "area": "display",
     "element": "<ol> of events with time elements", "role": "list",
     "keyboard": "Static content; any action inside an event is a normal control.",
     "aria": "Each event's time is a <time datetime>; the order is in the markup, not only in the layout.",
     "rtl": "The rail and the markers sit at the inline start of the column.",
     "why": "Audit logs and activity feeds must stay readable in linear order, whatever the visual rail does."},
    {"slug": "description-list", "name": "Description list", "milestone": "display", "area": "display",
     "element": "<dl> of <dt> and <dd>", "role": "list with term/definition pairs",
     "keyboard": "Nothing: it is a reading surface.",
     "aria": "Terms and definitions are in the DOM in pairs, which is what makes a summary readable by a screen reader.",
     "rtl": "Pairs stack inline-start; a two-column layout uses logical sizing.",
     "why": "Checkout summaries and settings reviews are key/value data, and divs lose the association."},
    {"slug": "skeleton", "name": "Skeleton", "milestone": "display", "area": "display",
     "element": "A decorative placeholder with a status label", "role": "none or status",
     "keyboard": "Nothing: a skeleton is never focusable.",
     "aria": "aria-hidden when the real content announces its own loading; otherwise one polite status, not one per shape.",
     "rtl": "Shimmer direction is direction-neutral; spacing is logical.",
     "why": "Loading placeholders that are announced ninety times are worse than no placeholder at all."},
    {"slug": "metric-card", "name": "Metric card", "milestone": "display", "area": "display",
     "element": "<section> with a heading, a value and a trend", "role": "region",
     "keyboard": "Nothing unless the card links somewhere; then the link has its own name.",
     "aria": "The trend is stated in words ('up 12 percent'), never by an arrow alone.",
     "rtl": "The value and its unit keep their own direction; the trend arrow mirrors only when it is directional.",
     "why": "Dashboards are read with screen readers too, and '▲ 12%' is announced as 'black up-pointing triangle twelve percent'."},
    {"slug": "inline-edit", "name": "Inline edit", "milestone": "forms", "area": "forms",
     "element": "A button that becomes a text field", "role": "button, then textbox",
     "keyboard": "Enter or Space starts editing, Escape cancels and restores focus, Enter saves.",
     "aria": "The button's name says what will be edited; the field is labelled; the change is announced.",
     "rtl": "The field inherits the row's direction; the action buttons sit at the inline end.",
     "why": "Renaming a file in place is a common need that usually loses the value when the user presses Escape."},
    {"slug": "form-wizard", "name": "Form wizard", "milestone": "navigation", "area": "navigation",
     "element": "A stepper plus one visible form step at a time", "role": "navigation with a form per step",
     "keyboard": "Tab order stays inside the current step; moving forward validates and focuses the error summary.",
     "aria": "The step is announced in the heading, completed steps are links, and the summary is the only alert.",
     "rtl": "Step connectors and back/next glyphs mirror; the step order stays semantic.",
     "why": "Multi-step forms are where validation, focus management and navigation all fail at once."},
    {"slug": "dropzone", "name": "Drop zone", "milestone": "forms", "area": "forms",
     "element": "A labelled file input with a visual drop area", "role": "button (native file input)",
     "keyboard": "The native input is the keyboard path; dragging is never the only way (WCAG 2.5.7).",
     "aria": "The zone is described, not named, and the selected files are listed as text.",
     "rtl": "The zone and the file list align to the inline start.",
     "why": "Drag and drop is the canonical 2.5.7 failure: the only way to do it is with a pointer."},
    {"slug": "resizable-split", "name": "Resizable split", "milestone": "display", "area": "display",
     "element": "Two panels with a [role=\"separator\"] handle", "role": "separator",
     "keyboard": "Arrows resize, Home/End collapse or expand, Enter toggles.",
     "aria": "aria-valuenow/min/max on the separator, orientation declared, and the panes named.",
     "rtl": "Arrow keys move the handle in the reading direction; the collapsed side follows inline-start.",
     "why": "Split views are common in editors, and a divider that only responds to dragging is unusable without a mouse."},
    {"slug": "sortable-list", "name": "Sortable list", "milestone": "display", "area": "display",
     "element": "<ol> with move-up and move-down buttons", "role": "list with buttons",
     "keyboard": "Move buttons are the keyboard equivalent of dragging; the new position is announced.",
     "aria": "Each item's position is announced after a move, and the buttons are named with their item.",
     "rtl": "The move buttons sit at the inline end and the order stays semantic.",
     "why": "Reordering is used in every settings screen with priorities, and pointer-only reordering is another 2.5.7 failure."},
    {"slug": "search-field", "name": "Search field", "milestone": "forms", "area": "forms",
     "element": "<input type=\"search\"> with a clear button and a result count", "role": "searchbox",
     "keyboard": "Enter submits, Escape clears, the clear button is reachable by Tab.",
     "aria": "The result count is a polite status, and the clear button has a name that mentions what it clears.",
     "rtl": "The magnifier is not mirrored; the clear control sits at the inline end.",
     "why": "Search is the most-used control on documentation sites and the one where a 0-result state is most often silent."},
]


LOCALES = [
    ("ar", "Arabic", "Naskh and Kufi stacks, harakat above the baseline, and a line height that does not clip them"),
    ("he", "Hebrew", "niqqud and dagesh marks, and the mirroring of brackets in mixed Hebrew/Latin rows"),
    ("fa", "Persian", "Nastaliq fallbacks, Persian digits (۰۱۲۳), and the ZWNJ that keeps compound words joined"),
    ("ur", "Urdu", "Nastaliq's taller line boxes and English brand names flowing inside Urdu sentences"),
    ("ps", "Pashto", "the additional Pashto letters and its own punctuation (٫ ، ؛)"),
    ("sd", "Sindhi", "the extended Sindhi letter set and the extra diacritic height it needs"),
    ("ug", "Uyghur", "Arabic-script Uyghur letters (ئۆ ۈ) and Latin-script product names inside them"),
    ("yi", "Yiddish", "Hebrew script with wide Latin-influenced vowels and its own numeral conventions"),
    ("dv", "Dhivehi", "Thaana right-to-left letters with left-to-right numerals: the hardest bidi case we support"),
    ("ckb", "Sorani Kurdish", "the Kurdish Arabic letters (ڕ ڵ ێ) and the ZWNJ that distinguishes words"),
    ("prs", "Dari", "digits and phrasing that differ from Iranian Persian inside the same interface"),
    ("az-Arab", "Azerbaijani in Arabic script", "a script subtag that overrides an LTR base language: the case that proves the resolution rule"),
    ("nqo", "N'Ko", "a right-to-left script with its own digits and almost no default font coverage"),
    ("syr", "Syriac", "right-to-left joining behaviour with almost no default font coverage"),
]

LOCALE_SHARED = [
    ("Bidi isolation of user-supplied strings", "Names, file names, addresses and code arrive in the wrong visual order unless they are isolated; pick one mechanism and apply it everywhere."),
    ("RTL geometry baselines", "Snapshots of every component in both directions, so an accidental physical property shows up as a diff rather than as a bug report."),
    ("Digit policy for values", "Arabic-Indic versus Western digits is a locale decision; decide where it is applied (formatting, never layout) and encode it once."),
    ("Table and grid column order", "Columns follow the document direction, and numeric columns stay aligned and readable in both."),
    ("Font stack coverage", "A stack that renders all fourteen scripts without a webfont, and a documented optional webfont path."),
    ("Locale switching without losing state", "Changing language keeps the form values, the scroll position and the current step."),
]

WCAG = [
    ("1.1.1", "Non-text Content", "A", "Every icon that carries meaning has a text alternative; decorative glyphs are aria-hidden."),
    ("1.2.1", "Audio-only and Video-only (Prerecorded)", "A", "Any media the gallery ships has a text alternative beside it."),
    ("1.2.2", "Captions (Prerecorded)", "A", "If a component page ever adds video, captions are part of the page, not an afterthought."),
    ("1.2.3", "Audio Description or Media Alternative (Prerecorded)", "A", "The same rule for the visual track of any example media."),
    ("1.3.1", "Info and Relationships", "A", "Structure lives in the markup: headings, lists, tables, fieldsets, labels."),
    ("1.3.2", "Meaningful Sequence", "A", "DOM order matches the reading order in both directions."),
    ("1.3.3", "Sensory Characteristics", "A", "No instruction relies on 'the round button' or 'the button on the right'."),
    ("1.4.1", "Use of Color", "A", "No state is conveyed by colour alone, in any component."),
    ("1.4.2", "Audio Control", "A", "Nothing in the library plays audio; the rule is documented so an example cannot break it."),
    ("2.1.1", "Keyboard", "A", "Every control is operable from the keyboard, including the ones the gallery itself adds."),
    ("2.1.2", "No Keyboard Trap", "A", "Focus can always leave a widget; a modal dialog returns it to the trigger."),
    ("2.1.4", "Character Key Shortcuts", "A", "Single-key shortcuts are off by default, scoped to a focused widget, or remappable."),
    ("2.2.1", "Timing Adjustable", "A", "Toast timeouts are generous, pausable, and never the only route to information."),
    ("2.2.2", "Pause, Stop, Hide", "A", "Nothing auto-advances; motion is disabled under prefers-reduced-motion."),
    ("2.3.1", "Three Flashes", "A", "No flashing content anywhere, including spinners and skeletons."),
    ("2.4.1", "Bypass Blocks", "A", "Every page has a skip link to a focusable main region."),
    ("2.4.2", "Page Titled", "A", "Every page has a unique, descriptive title."),
    ("2.4.3", "Focus Order", "A", "Focus order follows the visual order, in both directions."),
    ("2.4.4", "Link Purpose (In Context)", "A", "Link text is meaningful in context; no 'click here' and no bare URLs."),
    ("2.5.1", "Pointer Gestures", "A", "No multi-point or path gesture is required for anything."),
    ("2.5.2", "Pointer Cancellation", "A", "Actions fire on the up-event and can be cancelled by moving away."),
    ("2.5.3", "Label in Name", "A", "The visible label is contained in the accessible name of every control."),
    ("2.5.4", "Motion Actuation", "A", "Nothing requires device motion or user gesture to operate."),
    ("3.1.1", "Language of Page", "A", "html lang comes from the request, on every page."),
    ("3.2.1", "On Focus", "A", "Focus never triggers a context change."),
    ("3.2.2", "On Input", "A", "Input never triggers a context change without warning first."),
    ("3.3.1", "Error Identification", "A", "Errors are described in text and linked to the field they belong to."),
    ("3.3.2", "Labels or Instructions", "A", "Every control has a label or instructions; placeholders are never a label."),
    ("4.1.2", "Name, Role, Value", "A", "Every custom widget exposes name, role and state, and the state stays in sync."),
    ("1.2.4", "Captions (Live)", "AA", "Documented as not applicable with a reason, so a reviewer does not have to guess."),
    ("1.2.5", "Audio Description (Prerecorded)", "AA", "The same statement as 1.2.3, with the AA expectation spelled out."),
    ("1.3.4", "Orientation", "AA", "Nothing locks orientation; both orientations are usable at 320px."),
    ("1.3.5", "Identify Input Purpose", "AA", "Autocomplete tokens on every field that collects information about the user."),
    ("1.4.3", "Contrast (Minimum)", "AA", "The token audit: 4.5:1 for text, 3:1 for large text, measured per pair per theme."),
    ("1.4.4", "Resize Text", "AA", "Text scales to 200% without loss of content or function."),
    ("1.4.5", "Images of Text", "AA", "No text is baked into an image or an icon."),
    ("1.4.10", "Reflow", "AA", "Every page works at 320px without horizontal scrolling."),
    ("1.4.11", "Non-text Contrast", "AA", "Control boundaries and focus rings reach 3:1 against their surroundings."),
    ("1.4.12", "Text Spacing", "AA", "Line height, letter spacing and word spacing overrides do not clip content."),
    ("1.4.13", "Content on Hover or Focus", "AA", "Tooltips are dismissible, hoverable and persistent."),
    ("2.4.5", "Multiple Ways", "AA", "The gallery can be navigated by link list, by navigation and by search."),
    ("2.4.6", "Headings and Labels", "AA", "Headings and labels describe the topic or purpose, at a consistent level."),
    ("2.4.7", "Focus Visible", "AA", "One visible ring, on every interactive element, in both themes."),
    ("3.1.2", "Language of Parts", "AA", "lang is set on strings in another language, including the language switcher itself."),
    ("3.2.3", "Consistent Navigation", "AA", "Navigation is in the same place and order on every page."),
    ("3.2.4", "Consistent Identification", "AA", "The same icon means the same thing and carries the same name everywhere."),
    ("3.3.3", "Error Suggestion", "AA", "Errors suggest a correction, they do not only report a failure."),
    ("3.3.4", "Error Prevention (Legal, Financial, Data)", "AA", "Destructive and irreversible actions confirm, and the confirmation is reversible where possible."),
    ("4.1.3", "Status Messages", "AA", "Status is announced without moving focus: loading, saved, count, error."),
    ("2.5.7", "Dragging Movements", "AA", "Every drag interaction has a pointer-free equivalent (2.2 addition)."),
    ("2.5.8", "Target Size (Minimum)", "AA", "Every pointer target is at least 24 by 24 CSS pixels, 44 for the primary controls (2.2 addition)."),
    ("3.2.6", "Consistent Help", "A", "Help and support are reachable from the same place on every page (2.2 addition)."),
    ("3.3.7", "Redundant Entry", "A", "Information already entered is not asked for again in the same process (2.2 addition)."),
    ("3.3.8", "Accessible Authentication (Minimum)", "AA", "No cognitive function test; paste is allowed in every credential field (2.2 addition)."),
]

BROWSERS_AT = [
    ("Safari macOS: dialog focus return", "Escape closes the dialog and focus returns to the trigger, in the same order as Chromium."),
    ("Safari macOS: focus-visible after mouse clicks", "The ring does not appear for pointer users, and always for keyboard users."),
    ("Safari iOS: modal dialog and the on-screen keyboard", "The dialog stays inside the visual viewport when a field at the bottom is focused."),
    ("Firefox: forced-colors focus ring", "The 3px ring survives forced-colors, and control boundaries stay visible."),
    ("Firefox: aria-describedby inside a fieldset", "Field-level descriptions are announced with the right child on focus."),
    ("Chrome: scrollable code blocks", "Regression guard for the focusable code block: overflow is reachable, axe stays quiet."),
    ("Chrome Android: tap targets", "Every target meets 44px at 320px wide, measured in the browser, not in the stylesheet."),
    ("Edge Windows: high contrast", "Every component keeps its boundaries and states in forced-colors mode."),
    ("Samsung Internet: focus-visible fallback", "A working fallback where :focus-visible is missing, without a double ring where it exists."),
    ("Safari iOS: 200% text zoom", "Tabs, dialogs and form rows do not clip or overlap at 200% zoom."),
    ("NVDA + Firefox: tab panel announcement", "The panel is announced after the arrow key, with its label and role."),
    ("NVDA + Chrome: aria-busy on loading buttons", "The busy state is announced once, and the name does not change."),
    ("JAWS + Chrome: dialog title and trap", "The title is read on open, and Tab never leaves the dialog."),
    ("JAWS + Edge: description list reading order", "Term and definition pairs are read as pairs."),
    ("VoiceOver macOS + Safari: visually hidden text", "Names provided by hidden text are computed, including on icon buttons."),
    ("VoiceOver iOS + Safari: indeterminate checkbox", "The mixed state is announced as mixed, not as checked."),
    ("TalkBack + Chrome Android: tab list", "The tab list is entered as one control, with the selected tab announced."),
    ("Narrator + Edge: error summary", "The summary is announced on submit, and each link announces its field."),
    ("Orca + Firefox on Linux: live regions", "Polite and assertive announcements both arrive."),
    ("Voice control and switch access: name matching", "Every control can be activated by saying its visible label."),
]

INTEGRATIONS = [
    ("Axum", "axum handlers returning Maud markup through IntoResponse"),
    ("Rocket", "Rocket responders and a fairing that serves the two assets"),
    ("Poem", "Poem endpoints, including the static assets"),
    ("Warp", "warp filters for pages and assets"),
    ("Leptos", "rendering the components inside a Leptos server function"),
    ("Dioxus", "fullstack rendering with the components as leaf nodes"),
    ("Askama", "using Markup inside an Askama template without double escaping"),
    ("htmx", "partial rendering and swap targets for tabs and dialogs"),
    ("Alpine.js", "coexistence rules with the enhancement script"),
    ("Hotwire/Turbo", "turbo frames plus dialog behaviour that survives a swap"),
    ("Static export", "rendering the whole gallery to HTML for GitHub Pages"),
    ("Tauri", "serving the components from a local Actix instance"),
]

DOCS_EXTRA = [
    ("Cookbook: an Arabic form with server-side validation", "A complete example: RTL fields, a mixed-direction email, and an error summary after a failed submit."),
    ("Cookbook: a settings page with inline edit", "Rows that become fields, saving without a page reload, and focus that comes back where it was."),
    ("Cookbook: a checkout flow with an error summary", "The form pattern that survives a screen reader and a keyboard, start to finish."),
    ("Cookbook: a data table with sorting and pagination", "aria-sort, scoped headers, links for pages, and no JavaScript required."),
    ("Cookbook: an upload flow with a keyboard fallback", "Drag and drop plus the path that does not need a pointer."),
    ("Guide: theming for a brand without breaking the audit", "Which tokens are public, how to override them, and how to keep the contrast tests meaningful."),
    ("Guide: using ui-storm outside Actix", "What the components need from a host, and what the host must provide."),
    ("Reference: every CSS class the library emits", "Generated from the components so it cannot fall behind."),
    ("Reference: every custom property", "Generated from the stylesheet, with the theme each value belongs to."),
    ("Reference: the public API index", "Generated from rustdoc, with links to each component page."),
    ("Concept: how the accessible name is computed here", "Why hidden text beats aria-label, and where the name comes from for each component."),
    ("Concept: live regions and when not to use them", "One region, polite by default, and the reason a toast is not an alert."),
    ("Concept: focus order and the one-tab-stop rule", "Composite widgets, roving tabindex, and what Tab means inside them."),
    ("Concept: what the enhancement script may and may not do", "The rule from ADR 0003, with examples of both sides."),
    ("Playbook: accessibility review before a release", "The checklist a reviewer actually runs, in order, with the commands."),
    ("Playbook: triaging an accessibility report", "How to reproduce, classify, fix and test a barrier report."),
    ("Playbook: writing an issue a contributor can finish", "Acceptance criteria that can be checked, and a definition of done that is not 'it works'."),
    ("Migration: from a Radix-style mental model", "Primitives, composition and state ownership, translated to props structs and HTML."),
    ("Migration: from Bootstrap components", "Where the markup differs, and what Bootstrap did that we deliberately do not."),
    ("Migration: from an in-house component folder", "Auditing an existing folder and mapping it onto the seven aspects."),
    ("Tutorial: build a settings page end to end", "From an Actix handler to a validated, accessible page, in one sitting."),
    ("Tutorial: build an accessible filter panel", "Checkboxes, groups, an applied-filter summary and a clear-all action."),
    ("Docs: versioned documentation", "Every released minor version keeps its own gallery, built from its own tag."),
    ("Docs: translate the gallery itself into Arabic", "The documentation an Arabic-first team deserves, not just the components."),
]

OPS_EXTRA = [
    ("gallery", "Serve assets with content hashes and immutable caching", "Rename the asset URLs by content hash so they can be cached forever."),
    ("gallery", "Request ids in every response and error page", "One id per request, logged and shown on the error page so a user can quote it."),
    ("gallery", "Rate limit the form endpoints", "A documented middleware configuration and a test that a burst is rejected."),
    ("gallery", "CSP with a nonce for the one inline style", "No unsafe-inline: move the noscript style to a nonce or an asset and keep the policy strict."),
    ("gallery", "Brotli compression for HTML and CSS", "Enable compression and record the payload improvement."),
    ("gallery", "A version endpoint with the build commit", "So a running deployment can be identified without reading logs."),
    ("gallery", "Cache rendered documentation for thirty seconds", "Short-lived server-side caching that survives a deploy without serving stale HTML for long."),
    ("gallery", "A panic handler that renders an accessible 500 page", "Same shell, same skip link, no stack trace."),
    ("gallery", "Structured logs with a request id", "Method, path, status, duration, id, and nothing sensitive."),
    ("gallery", "Graceful shutdown on SIGTERM", "In-flight requests finish; the health endpoint reports draining."),
    ("release", "Publish to crates.io behind a dry-run gate", "One command, rehearsed with --dry-run first, then published from a tag."),
    ("release", "Generate the changelog from conventional commits", "The changelog stops depending on memory."),
    ("release", "An MSRV job on 1.82", "The declared minimum is built on every pull request."),
    ("release", "Signed releases and provenance", "Tags signed, artifacts attributable to a commit and a workflow."),
    ("release", "Document the supported Rust versions", "MSRV, stable and beta, and what 'supported' means for each."),
    ("release", "Deprecation policy enforced by a lint", "Renamed builders warn for one minor version before they disappear."),
    ("performance", "Payload report per page in CI", "CSS and JS bytes for every route, recorded and compared."),
    ("performance", "One benchmark suite for all components", "A single criterion binary so the numbers are comparable."),
    ("performance", "Allocation-count test", "A counting allocator proves the render path does not allocate per attribute."),
    ("performance", "First-byte timing per route", "Server render cost tracked, with a regression threshold."),
    ("security", "Write the threat model down", "Assets, actors, trust boundaries and the mitigations the library claims."),
    ("security", "CSRF token flow for Actix consumers", "A tested example, not a paragraph."),
    ("security", "Automated dependency updates", "A bot, a policy, and a review checklist for a major bump."),
    ("testing", "Mutation testing on the components crate", "Prove the tests fail when the markup changes, not just that they pass."),
    ("testing", "A coverage floor measured by one tool", "Per crate, in CI, with the number in the pull request."),
    ("testing", "Property tests for markup invariants", "Random props, deterministic invariants: ids unique, names present, attributes balanced."),
    ("testing", "CI matrix: stable, beta, MSRV", "Warnings from the next release appear before they break a release."),
    ("testing", "Snapshot the rendered gallery pages", "A byte-level diff for every page, reviewed when it changes."),
    ("testing", "A nightly full browser matrix", "Chromium, Firefox and WebKit on a schedule, with the axe runs repeated."),
]


def labels_for(area: str, extra: list[str]) -> list[str]:
    seen: list[str] = []
    for label in [f"area: {area}", *extra]:
        if label in LABELS and label not in seen:
            seen.append(label)
    return seen


def component_issues() -> list[dict]:
    issues = []
    for component in COMPONENTS + NEW_COMPONENTS:
        for key, title_tail, criteria in ASPECTS:
            format_args = {
                "slug": component["slug"],
                "name": component["name"],
                "element": component["element"],
                "role": component["role"],
                "keyboard": component["keyboard"],
                "aria": component["aria"],
                "rtl": component["rtl"],
            }
            body_lines = [
                f"## {component['name']}: {title_tail}",
                "",
                f"- Element: `{component['element']}`",
                f"- Role: {component['role']}",
                f"- Why this component exists: {component['why']}",
                "",
                "### Acceptance criteria",
                "",
                *[f"- {line.format(**format_args)}" for line in criteria],
                "",
                "### Definition of done",
                "",
                "- `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- --deny warnings` and `cargo test --workspace` pass.",
                "- The gallery page for this component shows the behaviour described above.",
                "- No new TODO, no commented-out code, no `unwrap` in library code.",
                "",
                "_Part of the Rust/Actix rewrite; see `docs/adr/0002-rust-rewrite.md`._",
            ]
            issues.append({
                "key": f"{component['slug']}--{key}",
                "title": f"{component['name']}: {title_tail}",
                "milestone": component["milestone"],
                "labels": labels_for(component["area"], ["type: feature", "a11y", "rtl"]),
                "body": "\n".join(body_lines),
            })
    return issues


def hardening_issues() -> list[dict]:
    issues = []
    for slug, title in HARDENING:
        name = next((c["name"] for c in COMPONENTS + SHIPPED if c["slug"] == slug), slug)
        issues.append({
            "key": f"harden--{slug}--{title.split(': ')[1][:40]}",
            "title": title,
            "milestone": "testing",
            "labels": labels_for("testing", ["type: test", "a11y", "priority: p2"]),
            "body": "\n".join([
                f"## {name}",
                "",
                "The component shipped with the first drop of the Rust rewrite. This issue is the follow-up "
                "that turns 'it works in the gallery' into 'it is proven to work'.",
                "",
                "### Acceptance criteria",
                "",
                "- The behaviour named in the title is asserted by an automated test, not by inspection.",
                "- The test runs in CI as part of `cargo test` or `npx playwright test`.",
                "- Any gap found is documented on the component's gallery page under Known limits.",
                "- If the gap cannot be fixed now, a follow-up issue is opened and linked from here.",
                "",
                "_Part of the Rust/Actix rewrite; see `docs/adr/0002-rust-rewrite.md`._",
            ]),
        })
    return issues


SHIPPED = [
    {"slug": "button", "name": "Button"},
    {"slug": "icon-button", "name": "Icon button"},
    {"slug": "text-input", "name": "Text input"},
    {"slug": "checkbox", "name": "Checkbox"},
    {"slug": "dialog", "name": "Dialog"},
    {"slug": "tabs", "name": "Tabs"},
]

MILESTONE_CRITERIA = {
    "foundations": [
        "The change is reflected in both `crates/ui-storm/src/tokens.rs` and `crates/ui-storm/assets/ui-storm.css`, and the sync test passes.",
        "Every affected contrast pair is re-measured and passes its WCAG 2.2 AA threshold in both themes.",
        "The gallery's foundations page shows the result.",
    ],
    "direction": [
        "Direction-specific behaviour is derived from `locale_direction`, never guessed in a template.",
        "Only logical CSS properties are used; the logical-property test still passes.",
        "Covered by a test that sets `dir=\"rtl\"` and asserts the mirrored result.",
    ],
    "gallery": [
        "The change is covered by an HTTP test in `crates/ui-storm-web/tests/gallery.rs`.",
        "Headers, status codes and content types are asserted, not eyeballed.",
        "No page loses the skip link, the single `h1`, or the language and direction on `<html>`.",
    ],
    "testing": [
        "The check fails the build on regression rather than reporting a number nobody reads.",
        "Runs in CI within the existing time budget.",
        "Failure output names the component, the rule and the fix.",
    ],
    "docs": [
        "Written for someone who has read the README but not the source.",
        "Every code sample compiles (doctest or an `examples/` binary).",
        "Linked from the relevant component page and from the index.",
    ],
    "release": [
        "The change is visible in `cargo metadata` or in the published artefacts.",
        "Documented in `CHANGELOG.md` under the release it ships in.",
        "Rehearsed with `--dry-run` before it can affect a real publish.",
    ],
    "performance": [
        "A concrete number and a threshold are recorded in the repository.",
        "The measurement runs in CI and fails on regression.",
        "The gallery shows the number so it cannot silently rot.",
    ],
    "security": [
        "Threat addressed is named, with the attack path written down.",
        "A test demonstrates the hostile input being neutralised.",
        "The mitigation is documented for consumers who deploy the library themselves.",
    ],
}

DEFAULT_CRITERIA = [
    "The behaviour is asserted by a test that fails without the change.",
    "Documented on the relevant gallery page.",
    "No new public API without rustdoc and an example.",
]


def platform_issues() -> list[dict]:
    issues = []
    for index, (milestone, area, title, detail) in enumerate(PLATFORM, start=1):
        criteria = MILESTONE_CRITERIA.get(milestone, DEFAULT_CRITERIA)
        issues.append({
            "key": f"platform--{milestone}--{index:03d}",
            "title": title,
            "milestone": milestone,
            "labels": labels_for(area, ["type: enhancement", "priority: p2"]),
            "body": "\n".join([
                "## Context",
                "",
                detail,
                "",
                "### Acceptance criteria",
                "",
                *[f"- {line}" for line in criteria],
                "",
                "_Part of the Rust/Actix rewrite; see `docs/adr/0002-rust-rewrite.md`._",
            ]),
        })
    return issues


DOD = [
    "- `cargo clippy --workspace --all-targets -- --deny warnings` and `cargo test --workspace` pass.",
    "- Documented on the gallery page for the component or area it belongs to.",
]

FOOTER = "_Part of the Rust/Actix rewrite; see `docs/adr/0002-rust-rewrite.md`._"


def _issue(key: str, title: str, milestone: str, labels: list[str], body: list[str]) -> dict:
    return {
        "key": key,
        "title": title,
        "milestone": milestone,
        "labels": labels,
        "body": "\n".join([*body, "", FOOTER]),
    }


def extra_aspect_issues() -> list[dict]:
    """The three aspects every component owes: cost, localisation, example."""
    issues = []
    for component in COMPONENTS + NEW_COMPONENTS + SHIPPED:
        for key, milestone, area, tail, criteria in EXTRA_ASPECTS:
            placeholders = {"slug": component["slug"], "name": component["name"]}
            body = [f"## {component['name']}: {tail}", ""]
            if component.get("element"):
                body.append(f"- Element: `{component['element']}`")
            body += ["", "### Acceptance criteria", ""]
            body += [f"- {line.format(**placeholders)}" for line in criteria]
            body += ["", "### Definition of done", "", *DOD]
            issues.append(_issue(
                key=f"{component['slug']}--{key}",
                title=f"{component['name']}: {tail}",
                milestone=milestone,
                labels=labels_for(area, ["type: enhancement", "a11y"]),
                body=body,
            ))
    return issues


def locale_issues() -> list[dict]:
    """A dossier per right-to-left locale we claim to support."""
    issues = []
    for tag, name, note in LOCALES:
        issues.append(_issue(
            key=f"locale--{tag}--type",
            title=f"{name} ({tag}): typography, line height and diacritics",
            milestone="direction",
            labels=labels_for("i18n", ["type: enhancement", "rtl", "a11y"]),
            body=[
                f"## {name} (`{tag}`)",
                "",
                f"What makes {name} different: {note}.",
                "",
                "### Acceptance criteria",
                "",
                "- The font stack renders this script with no missing glyphs on a clean system.",
                "- Line height is audited against the tallest diacritic, not against Latin x-height.",
                "- The gallery renders in this locale and every component survives it.",
                "- A native reader reviews the result and their name goes in the conformance dossier.",
                "- A Playwright snapshot pins the result so a later font change is visible in review.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
        issues.append(_issue(
            key=f"locale--{tag}--numbers",
            title=f"{name} ({tag}): numerals, punctuation and bidi defaults",
            milestone="direction",
            labels=labels_for("i18n", ["type: enhancement", "rtl"]),
            body=[
                f"## {name} (`{tag}`) values",
                "",
                f"Text is only half of it: {note}.",
                "",
                "### Acceptance criteria",
                "",
                "- The digit policy for this locale is stated in `docs/direction.md` and applied by formatting, never by layout.",
                "- Its punctuation (commas, semicolons, question marks) renders in the expected position.",
                "- Latin-script brand names and product codes inside the sentence are isolated and do not reorder.",
                "- Numbers, dates and currency are formatted by the caller and only rendered here.",
                "- A test asserts the rendered order of a mixed Arabic/number string.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))

    for title, detail in LOCALE_SHARED:
        issues.append(_issue(
            key="locale--shared--" + title.lower().replace(" ", "-")[:40],
            title=f"RTL shared: {title}",
            milestone="direction",
            labels=labels_for("i18n", ["type: enhancement", "rtl", "a11y"]),
            body=[
                f"## {title}",
                "",
                detail,
                "",
                "### Acceptance criteria",
                "",
                "- One mechanism, applied everywhere, documented in `docs/direction.md`.",
                "- Covered by a test that would fail if a component opted out.",
                "- Checked against at least three locales with different scripts.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def wcag_issues() -> list[dict]:
    """One conformance entry per WCAG 2.2 A/AA success criterion."""
    issues = []
    for identifier, name, level, detail in WCAG:
        issues.append(_issue(
            key=f"wcag--{identifier.replace('.', '-')}",
            title=f"WCAG {identifier} {name} ({level}): conformance entry",
            milestone="conformance",
            labels=labels_for("conformance", ["type: docs", "a11y"]),
            body=[
                f"## {identifier} {name} — level {level}",
                "",
                detail,
                "",
                "### The entry must contain",
                "",
                "- **Applicability**: what in this library the criterion touches, or a stated reason it does not apply.",
                "- **Evidence**: the test, audit or source file that carries the guarantee, linked rather than described.",
                "- **Manual procedure**: the steps a reviewer follows, naming the assistive technology and browser.",
                "- **Gaps**: anything known to fail today, with the issue that tracks it.",
                "",
                "### Acceptance criteria",
                "",
                f"- `docs/conformance/{identifier.replace('.', '-')}.md` exists and follows the template.",
                "- Linked from the accessibility statement and from the relevant component pages.",
                "- Reviewed and signed off with a date and a name.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def browser_issues() -> list[dict]:
    """The browser and assistive-technology matrix."""
    issues = []
    for index, (title, detail) in enumerate(BROWSERS_AT, start=1):
        issues.append(_issue(
            key=f"matrix--{index:02d}",
            title=f"Matrix: {title}",
            milestone="testing",
            labels=labels_for("testing", ["type: test", "a11y"]),
            body=[
                f"## {title}",
                "",
                detail,
                "",
                "### Acceptance criteria",
                "",
                "- The behaviour is verified once by hand, and the result recorded with a date and a version.",
                "- It is automated in `tests/e2e/` where the platform allows it; where it does not, the manual step is written down.",
                "- A regression guard exists for the part that can be asserted in any engine.",
                "- Any divergence between engines is documented on the component page under Known limits.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def integration_issues() -> list[dict]:
    """Each framework gets an example, an adapter note and a documentation page."""
    issues = []
    for name, note in INTEGRATIONS:
        slug = name.lower().replace(".", "").replace("/", "-").replace(" ", "-")
        issues.append(_issue(
            key=f"integration--{slug}--example",
            title=f"{name}: runnable integration example",
            milestone="integrations",
            labels=labels_for("integrations", ["type: feature"]),
            body=[
                f"## {name}",
                "",
                f"Target: {note}.",
                "",
                "### Acceptance criteria",
                "",
                "- `examples/integrations/{slug}/` builds and runs with one command and no undocumented setup.",
                f"- It renders at least four components, in both writing directions.",
                "- It is added to the CI example-build step so it cannot rot.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
        issues.append(_issue(
            key=f"integration--{slug}--adapter",
            title=f"{name}: adapter surface and tests",
            milestone="integrations",
            labels=labels_for("integrations", ["type: feature", "type: test"]),
            body=[
                f"## {name} integration surface",
                "",
                f"Target: {note}.",
                "",
                "### Acceptance criteria",
                "",
                "- The minimum adapter (a responder, a filter or a function) is documented and tested.",
                "- The two assets are served through the framework's own static mechanism.",
                "- An HTTP test asserts a page renders with the right content type and both assets answer.",
                "- Nothing in `ui-storm` itself gains a dependency on this framework.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
        issues.append(_issue(
            key=f"integration--{slug}--docs",
            title=f"{name}: documentation page",
            milestone="integrations",
            labels=labels_for("integrations", ["type: docs"]),
            body=[
                f"## {name}",
                "",
                f"Target: {note}.",
                "",
                "### Acceptance criteria",
                "",
                "- A page in the gallery explains the integration in full, with the code of the example.",
                "- It states what the framework must provide and what the library assumes.",
                "- It links to the example and to the relevant component pages.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def docs_extra_issues() -> list[dict]:
    issues = []
    for index, (title, detail) in enumerate(DOCS_EXTRA, start=1):
        issues.append(_issue(
            key=f"docs--{index:03d}",
            title=title,
            milestone="docs",
            labels=labels_for("docs", ["type: docs"]),
            body=[
                "## Context",
                "",
                detail,
                "",
                "### Acceptance criteria",
                "",
                *[f"- {line}" for line in MILESTONE_CRITERIA["docs"]],
                "- Reachable from the documentation index and from the component pages it mentions.",
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def ops_extra_issues() -> list[dict]:
    issues = []
    for index, (milestone, title, detail) in enumerate(OPS_EXTRA, start=1):
        criteria = MILESTONE_CRITERIA.get(milestone, DEFAULT_CRITERIA)
        issues.append(_issue(
            key=f"ops--{index:03d}",
            title=title,
            milestone=milestone,
            labels=labels_for(milestone, ["type: enhancement", "priority: p2"]),
            body=[
                "## Context",
                "",
                detail,
                "",
                "### Acceptance criteria",
                "",
                *[f"- {line}" for line in criteria],
                "",
                "### Definition of done",
                "",
                *DOD,
            ],
        ))
    return issues


def build() -> list[dict]:
    issues = (
        component_issues()
        + extra_aspect_issues()
        + hardening_issues()
        + platform_issues()
        + locale_issues()
        + wcag_issues()
        + browser_issues()
        + integration_issues()
        + docs_extra_issues()
        + ops_extra_issues()
    )
    keys = [issue["key"] for issue in issues]
    assert len(keys) == len(set(keys)), "duplicate backlog keys"
    titles = [issue["title"] for issue in issues]
    assert len(titles) == len(set(titles)), "duplicate backlog titles"
    milestones = {milestone[0] for milestone in MILESTONES}
    for issue in issues:
        assert issue["milestone"] in milestones, issue["key"]
        assert issue["labels"], issue["key"]
    for label in {label for issue in issues for label in issue["labels"]}:
        assert label in LABELS, label
    return issues


def render_markdown(issues: list[dict]) -> str:
    lines = [
        "# Backlog",
        "",
        "This file is generated by `scripts/build_backlog.py`. Do not edit it by hand:",
        "change the generator and run it again. CI fails when the two disagree.",
        "",
        f"{len(issues)} issues across {len(MILESTONES)} milestones.",
        "",
        "| Milestone | Issues |",
        "| --- | --- |",
    ]
    for milestone_id, title, _ in MILESTONES:
        count = sum(1 for issue in issues if issue["milestone"] == milestone_id)
        lines.append(f"| {title} | {count} |")
    lines.append("")

    for milestone_id, title, description in MILESTONES:
        group = [issue for issue in issues if issue["milestone"] == milestone_id]
        lines.extend([f"## {title}", "", description, "", f"_{len(group)} issues_", ""])
        for issue in group:
            labels = ", ".join(f"`{label}`" for label in issue["labels"])
            lines.append(f"- **{issue['title']}** — {labels}")
        lines.append("")

    lines.extend([
        "## Labels and milestones",
        "",
        "Issues are created with title and body only. The label and milestone vocabulary is",
        "declared above and applied by `scripts/build_backlog.py --publish` when the token has",
        "write access to issue metadata; a token that can only create issues still produces a",
        "complete, readable backlog.",
        "",
    ])
    return "\n".join(lines)


def render_json(issues: list[dict]) -> str:
    payload = {
        "generated_by": "scripts/build_backlog.py",
        "milestones": [{"id": i, "title": t, "description": d} for i, t, d in MILESTONES],
        "labels": LABELS,
        "issues": issues,
    }
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def write(issues: list[dict]) -> None:
    ISSUES_JSON.parent.mkdir(parents=True, exist_ok=True)
    BACKLOG_MD.parent.mkdir(parents=True, exist_ok=True)
    ISSUES_JSON.write_text(render_json(issues), encoding="utf-8")
    BACKLOG_MD.write_text(render_markdown(issues), encoding="utf-8")
    print(f"wrote {ISSUES_JSON.relative_to(ROOT)} and {BACKLOG_MD.relative_to(ROOT)} ({len(issues)} issues)")


def check(issues: list[dict]) -> int:
    expected_json = render_json(issues)
    expected_md = render_markdown(issues)
    problems = 0
    for path, expected in ((ISSUES_JSON, expected_json), (BACKLOG_MD, expected_md)):
        actual = path.read_text(encoding="utf-8") if path.exists() else ""
        if actual != expected:
            print(f"{path.relative_to(ROOT)} is out of date; run python3 scripts/build_backlog.py", file=sys.stderr)
            problems += 1
    return 1 if problems else 0


def publish(issues: list[dict], dry_run: bool, limit: int | None) -> int:
    if dry_run:
        for issue in issues[: limit or len(issues)]:
            print(f"[dry-run] {issue['title']}")
        return 0

    existing = subprocess.run(
        ["gh", "issue", "list", "--limit", "1000", "--state", "all", "--json", "title"],
        capture_output=True, text=True, check=True,
    )
    known = {item["title"] for item in json.loads(existing.stdout or "[]")}
    created = 0

    for issue in issues:
        if issue["title"] in known:
            continue
        if limit is not None and created >= limit:
            break
        result = subprocess.run(
            ["gh", "issue", "create", "--title", issue["title"], "--body", issue["body"]],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"failed: {issue['title']}\n{result.stderr}", file=sys.stderr)
            return 1
        created += 1
        print(f"created: {issue['title']}")

    print(f"{created} issues created, {len(known)} already present")
    return 0


def main(argv: list[str]) -> int:
    issues = build()
    if "--check" in argv:
        return check(issues)
    write(issues)
    if "--publish" in argv:
        limit = None
        for argument in argv:
            if argument.startswith("--limit="):
                limit = int(argument.split("=", 1)[1])
        return publish(issues, "--dry-run" in argv, limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
