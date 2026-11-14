# Security policy

## Reporting a vulnerability

Do **not** open a public issue.

Use GitHub's private vulnerability reporting:
<https://github.com/Nour-yahyaoui/ui-storm/security/advisories/new>

Include the affected version or commit, a reproduction, and the impact. If the issue is an accessibility barrier rather than a security issue, use the accessibility issue template instead.

## What counts as security-relevant here

A component library has an unusual threat model. Examples that qualify:

- XSS through a prop that renders raw HTML or an unsanitised `href`
- a focus trap or portal that leaks a private view after a dialog closes
- a prop that writes attacker-controlled values into the DOM or a URL
- a dependency with a known vulnerability that reaches the published bundle
- a release or publishing workflow weakness (provenance, tokens, protected branches)

## Response targets

| Severity     | Acknowledgement | Fix or mitigation  |
| ------------ | --------------- | ------------------ |
| Critical     | 48 hours        | 7 days             |
| High         | 3 days          | 30 days            |
| Medium / Low | 7 days          | next minor release |

## Supported versions

During 0.x, only the latest minor receives security fixes. The support policy is expanded at 1.0 (tracked as `rel-support-policy`).

## Dependency hygiene

- `npm audit` runs in CI; advisories open an issue automatically.
- The published tarball is asserted to contain no tests, stories or CI files (`rel-npm-pack-assert`).
- Releases are intended to be published with provenance from CI, not from a laptop (`rel-publish-provenance`).
