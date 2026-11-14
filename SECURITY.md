# Security policy

## Reporting a vulnerability

Do **not** open a public issue.

Use GitHub's private vulnerability reporting:
<https://github.com/Nour-yahyaoui/ui-storm/security/advisories/new>

Include the affected version or commit, a reproduction, and the impact. If the issue is an accessibility barrier rather than a security issue, use the accessibility issue template instead.

## What counts as security-relevant here

A server-rendered component library has an unusual threat model. Examples that qualify:

- XSS through a value that reaches markup unescaped, or a `PreEscaped` splice that accepts input
- an `href` or `src` builder that allows a `javascript:` URL
- a focus trap or modal that leaks a private view after a dialog closes
- a form pattern in the library that invites cross-site request forgery
- a dependency advisory that reaches the published crate
- a release or publishing workflow weakness (provenance, tokens, protected branches)

## Response targets

| Severity     | Acknowledgement | Fix or mitigation  |
| ------------ | --------------- | ------------------ |
| Critical     | 48 hours        | 7 days             |
| High         | 3 days          | 30 days            |
| Medium / Low | 7 days          | next minor release |

## In the repository

- `#![forbid(unsafe_code)]` in every crate.
- Escaping is the default in Maud; `PreEscaped` is used in one place (the `<noscript>` style block)
  and is covered by a test that asserts the stylesheet it inlines contains no markup.
- `cargo-audit` and `cargo-deny` are wired into CI; see the `security` milestone in
  `docs/backlog.md` for the remaining hardening work.

## Supported versions

During 0.x, only the latest minor receives security fixes. The support policy is expanded at 1.0 (tracked as `rel-support-policy`).

## Dependency hygiene

- `npm audit` runs in CI; advisories open an issue automatically.
- The published tarball is asserted to contain no tests, stories or CI files (`rel-npm-pack-assert`).
- Releases are intended to be published with provenance from CI, not from a laptop (`rel-publish-provenance`).
