# Direction and internationalisation

Right-to-left support is not a translation task and not a stylesheet flip. It is a small number of
decisions made once, and then never made again.

## Resolve the direction once

`ui_storm::locale_direction` turns a BCP-47 tag into a `Direction`:

```rust
use ui_storm::{locale_direction, Direction};

assert_eq!(locale_direction("ar"), Direction::Rtl);
assert_eq!(locale_direction("ar-EG"), Direction::Rtl);
assert_eq!(locale_direction("ku"), Direction::Ltr);      // Kurdish (Latin) is LTR by design
assert_eq!(locale_direction("az-Arab"), Direction::Rtl); // a script subtag wins over the base
```

The resolution rules:

1. Normalise: trim, lowercase, and accept `_` as a subtag separator (`ar_SA` is common in practice).
2. If a four-letter script subtag is present, it decides: `Arab`, `Aran`, `Hebr`, `Syrc`, `Thaa`,
   `Nkoo` and `Adlm` are right to left; anything else is left to right.
3. Otherwise the base language decides, from the table `ar arc ckb dv fa he iw ji khw ks ps sd ug
   ur yi`.
4. Unknown tags are left to right, which is the safe default: a wrong LTR page is readable, a wrong
   RTL page is not.

Every page writes the result to `<html dir>` alongside `<html lang>`. Components never look at
direction themselves.

## Only logical properties

`crates/ui-storm/assets/ui-storm.css` contains no `left`, `right`, `margin-left`, `padding-right`,
`border-left` or `text-align: left`. A test asserts it, so the rule survives contributors who have
not read this page.

| Instead of | Use |
| --- | --- |
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left` | `inset-inline-start` |
| `border-left` | `border-inline-start` |
| `text-align: left` | `text-align: start` |
| `width` / `height` | `inline-size` / `block-size` |
| `margin-top` / `margin-bottom` | `margin-block-start` / `margin-block-end` |

## Mirror only what points somewhere

Directional glyphs — arrows, chevrons, "next" — must mirror. Everything else must not: a magnifier,
a bin and a paperclip mean the same thing in both directions, and flipping them is a bug users
notice immediately.

The API makes the distinction explicit:

```rust
use ui_storm::IconButton;

IconButton::new("Next page", "›").directional(true).render();  // mirrored in RTL
IconButton::new("Search", "⌕").render();                        // never mirrored
```

The rule in CSS is a single line, `[dir="rtl"] .ui-icon--directional { scale: -1 1; }`.

## Arrow keys follow the reading direction

In an RTL interface, ArrowRight moves to the *previous* item, because the arrow that goes forward in
reading order points left. Composite widgets handle this through the computed `direction` of the
widget, not through a global flag:

```js
const step = getComputedStyle(root).direction === "rtl" ? -1 : 1;
```

This applies to tabs, menus, radio groups, sliders, trees and toolbars. It is the single most
commonly broken RTL behaviour in component libraries, and the one most visible to keyboard users.

## Isolate user content

Punctuation in a mixed-direction string lands on the wrong side unless the string is isolated. Wrap
values that come from users — names, file names, addresses, code — with `dir` and, where needed, the
Unicode isolation characters:

```rust
use maud::html;
use ui_storm::Direction;

html! {
    span dir=(Direction::Ltr.as_str()) { (user_supplied_token) }
}
```

For an email field inside an Arabic page, the field's value is LTR while its label stays in the page
direction. `Input::dir` exists exactly for this.

## Numerals and formats

The library does not format dates, numbers or currency. Pass formatted strings in, chosen by the
caller's locale, and the component renders them with the right direction. Arabic-Indic versus
Western digits is a locale decision, and encoding it in a component would take that decision away
from the product.

## Testing

- `locale_direction` has a test per rule, including the `ku` and `az-Arab` exceptions.
- Every gallery page is rendered with `?lang=ar` and run through axe.
- The Playwright keyboard run asserts the mirrored arrow-key behaviour on tabs.
- The logical-property test fails on any physical property in the stylesheet.
