# RTL and Arabic

This library treats right-to-left as a first-class layout and text direction, not a mirrored stylesheet. Below is what the code does, why, and how to verify it.

## 1. Direction resolution

`getDirectionFromLocale` maps a BCP-47 tag to `ltr` or `rtl`:

| Input                                              | Result | Why                                                                          |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `ar`, `ar-EG`, `ar_SA`                             | `rtl`  | base language is RTL; underscores and casing are normalised                  |
| `he-IL`, `fa-IR`, `ur-PK`, `ps-AF`, `ckb-IQ`, `yi` | `rtl`  | RTL scripts                                                                  |
| `az-Arab`                                          | `rtl`  | the **script subtag** overrides the language                                 |
| `ku`                                               | `ltr`  | Kurdish is ambiguous; `ckb` is the RTL (Sorani) tag. Guessing would be wrong |
| `ku-Latn`                                          | `ltr`  | explicit Latin script                                                        |
| unknown or malformed                               | `ltr`  | safe default                                                                 |

`DirectionProvider` turns that into DOM state:

```tsx
<DirectionProvider locale="ar-EG">
  <App />
</DirectionProvider>
// → <div dir="rtl" lang="ar-EG" data-aui-direction="rtl">…</div>
```

Why a wrapper and not only context:

- `dir` is what makes CSS logical properties resolve; context alone changes nothing visually.
- `lang` is what triggers the Arabic typography rules in `base.css` (`:lang(ar)`: font stack, 1.85 line height, no letter spacing).
- `:dir()` and the `rtl:` / `ltr:` variants read the DOM, not React context.

Nested providers inherit unless they override, so an English code block inside an Arabic page is a one-liner:

```tsx
<DirectionProvider dir="ltr" locale="en">
  <pre>{code}</pre>
</DirectionProvider>
```

`useDirection()` also works without a provider, falling back to the nearest `dir` attribute (or the document's). During SSR it returns `ltr` and corrects after hydration — which is why the direction must be resolved **on the server** for RTL apps. See the backlog issue `rtl-nav-direction-resolution`.

## 2. Layout: logical properties only

| Instead of                     | Use                            |
| ------------------------------ | ------------------------------ |
| `ml-4`, `mr-4`                 | `ms-4`, `me-4`                 |
| `pl-4`, `pr-4`                 | `ps-4`, `pe-4`                 |
| `left-0`, `right-0`            | `start-0`, `end-0`             |
| `text-left`, `text-right`      | `text-start`, `text-end`       |
| `border-l`, `border-r`         | `border-s`, `border-e`         |
| `rounded-l-lg`, `rounded-r-lg` | `rounded-s-lg`, `rounded-e-lg` |

Tailwind v4 ships logical utilities; the theme in `src/styles/index.css` exposes the tokens they need, plus `rtl:`/`ltr:` variants for the rare cases where geometry alone is not enough — for example a directional icon, a transform origin, or a background image.

Physical utilities in component source are treated as a bug. An automated check is tracked as `rtl-logical-property-lint`.

## 3. Mirroring: meaning, not habit

Mirror these:

- back/forward and next/previous arrows
- chevrons that indicate inline progression
- indent/outdent, list and quote markers
- progress fills and slider fills (the _far end_ changes, the value does not)

Do not mirror these:

- checkmarks, close (×), plus, minus
- media controls (play, pause, skip-back)
- clocks, refresh, download/upload to a device
- logos, illustrations, photographs
- charts and data visualisations

The rule: **if the glyph describes reading order, mirror it; if it describes an object or a physical action, do not.**

Icon-level decisions live in the icon registry (backlog: `fnd-icons`, `rtl-icon-mirroring-audit`).

## 4. Numerals

Both numeral systems are legitimate:

| Locale                    | Common convention       |
| ------------------------- | ----------------------- |
| `ar-EG`, much of the Gulf | Arabic-Indic: `١٢٣٤٫٥٦` |
| `ar-MA`, `ar-TN`, `ar-DZ` | Western: `1234.56`      |

`Intl.NumberFormat` with a `numberingSystem` option is the only formatter the library will use. Consequences:

- Values are formatted for display and parsed back with the same locale, so a copied value and a submitted value agree.
- Percentages, counts and pagination all use the same helper (backlog: `rtl-number-formatting`).
- A component never coerces digits because "Arabic looks more authentic".

## 5. Dates and calendars

Hijri support is not a formatting toggle. Month lengths vary by convention, Umm al-Qura is not the same as a calculated calendar, and the runtime's ICU data may not include what you expect. The library will:

- expose the calendar system as an explicit prop,
- default `ar-SA` to `islamic-umalqura`,
- derive the week start from the locale rather than hard-coding Sunday or Monday,
- document the limitations instead of implying more precision than exists.

Backlog: `rtl-date-formatting`, `rtl-hijri-calendar-guidance`.

## 6. Bidi text and punctuation

Arabic paragraphs that contain Latin identifiers, numbers or URLs break in predictable ways:

```html
<!-- broken: the trailing period and bracket jump -->
<p dir="rtl" lang="ar">رقم الفاتورة AUI-2041) واتساب +216 55 123 456.</p>

<!-- fixed: each identifier is isolated -->
<p dir="rtl" lang="ar">رقم الفاتورة <bdi>AUI-2041</bdi> واتساب <bdi>+216 55 123 456</bdi>.</p>
```

Rules:

- Wrap embedded Latin identifiers in `<bdi>` (or a `dir="ltr"` span when the content is definitely LTR, such as a URL).
- Code, file paths and email addresses are always `dir="ltr"`.
- Do not use Unicode bidi control characters in user-facing strings; the DOM attributes are reviewable, invisible characters are not.
- Punctuation at the end of a mixed sentence belongs to the paragraph, not the identifier.

See the **Foundations / Writing direction → Bidi isolation** story in Storybook for a live comparison.

## 7. Typography

- Line height for Arabic is `1.85` via `:lang(ar)`; the default `1.5` clips diacritics.
- No `letter-spacing`, no `text-transform: uppercase` on Arabic.
- The font stack is `IBM Plex Sans Arabic, Noto Naskh Arabic, Noto Sans Arabic, Segoe UI, Tahoma, Geeza Pro`.
- Truncation uses `text-overflow: ellipsis` on the inline end; do not clip mid-connection.
- Prefer slightly larger sizes for Arabic at small UI sizes (12px Latin does not map to 12px Arabic).

## 8. Testing in both directions

- Unit tests: `render(ui, { dir: 'rtl', locale: 'ar-EG' })` from `src/test-utils/render.tsx`.
- Browser tests: the `chromium-rtl-ar` Playwright project runs the same specs with an Arabic locale.
- Geometry: `tests/e2e/foundations-a11y.spec.ts` measures an accent marker that uses `inset-inline-start` and asserts it sits on the left in LTR and on the right in RTL.
- Reflow: the same suite asserts `scrollWidth === clientWidth` at 320px in RTL.

## 9. Common mistakes this library will not make

| Mistake                                    | What we do instead                       |
| ------------------------------------------ | ---------------------------------------- |
| `dir="rtl"` on a nested widget to "fix" it | resolve direction once, at the tree root |
| mirroring every icon                       | mirror only directional glyphs           |
| `transform: scaleX(-1)` on media           | never mirror images or video             |
| `text-align: right` for Arabic             | `text-align: start`                      |
| Arabic digits hard-coded                   | locale-driven numbering system           |
| `Array.reverse()` on RTL lists             | correct DOM order; let layout mirror     |
| flex `row-reverse` for RTL                 | logical properties handle it             |
