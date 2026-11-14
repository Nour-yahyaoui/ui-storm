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
]

LABELS = [
    "type: feature", "type: enhancement", "type: bug", "type: docs", "type: test",
    "type: chore", "type: refactor", "type: performance", "type: security",
    "priority: p0", "priority: p1", "priority: p2", "priority: p3",
    "area: tokens", "area: direction", "area: forms", "area: overlays",
    "area: navigation", "area: feedback", "area: display", "area: gallery",
    "area: testing", "area: docs", "area: release", "area: performance",
    "area: security", "good first issue", "help wanted", "a11y", "rtl",
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


def labels_for(area: str, extra: list[str]) -> list[str]:
    seen: list[str] = []
    for label in [f"area: {area}", *extra]:
        if label in LABELS and label not in seen:
            seen.append(label)
    return seen


def component_issues() -> list[dict]:
    issues = []
    for component in COMPONENTS:
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


def build() -> list[dict]:
    issues = component_issues() + hardening_issues() + platform_issues()
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
