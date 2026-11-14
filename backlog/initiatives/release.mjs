import { toIssue } from '../initiative.mjs';

export const RELEASE = [
  {
    key: 'rel-changesets',
    title: 'Adopt Changesets with an explicit 0.x versioning policy',
    type: 'type: chore',
    size: 'm',
    priority: 'p0',
    summary:
      'Before 1.0, a "minor" bump may still break consumers. The policy has to say what semver means during 0.x, or every release is a gamble.',
    criteria: [
      'Changesets installed and configured with a base branch and access: public',
      'Policy documented: during 0.x, breaking changes bump the minor and are labelled breaking-change',
      'CI fails a pull request that changes exported API without a changeset',
      'A summary block is required in each changeset so the changelog reads like prose',
    ],
  },
  {
    key: 'rel-publish-provenance',
    title: 'Publish to npm with provenance and a protected release workflow',
    type: 'type: chore',
    size: 'm',
    priority: 'p1',
    summary:
      'Consumers should be able to verify that the tarball came from this repository and this commit, and nobody should be able to publish by accident.',
    criteria: [
      'Release workflow uses npm publish --provenance with the GitHub OIDC token',
      'Publishing requires a signed tag and a green CI run on main',
      'No long-lived npm token stored in secrets where OIDC can be used',
      'Release notes generated and attached to the GitHub release',
      'A failed publish leaves no partial release and can be retried safely',
    ],
    dependsOn: ['rel-changesets'],
  },
  {
    key: 'rel-publint-attw',
    title: 'Validate the package with publint and Are The Types Wrong',
    type: 'type: test',
    size: 's',
    priority: 'p1',
    summary:
      'Exports maps and declaration layout break silently across bundlers and module systems. Two linters catch nearly all of it before publishing.',
    criteria: [
      'publint and attw run on the packed tarball in CI',
      'ESM-only consumption verified in Node, Vite and webpack fixtures',
      'CSS subpath export resolves and is documented',
      'Failures block the release workflow',
    ],
  },
  {
    key: 'rel-tree-shaking',
    title: 'Verify tree-shaking per component import',
    type: 'type: perf',
    size: 'm',
    priority: 'p2',
    summary:
      'If importing Button pulls in Dialog and the toast system, the package is unusable in performance-sensitive apps.',
    criteria: [
      'Consumer fixture imports a single component and the output contains only that component and shared helpers',
      'sideEffects correctly marks CSS only, so JS can be dropped',
      'Per-component bundle report committed and checked in CI',
      'Findings applied to the entry point (no barrel of everything where avoidable)',
    ],
  },
  {
    key: 'rel-peer-deps',
    title: 'Define the React and React DOM peer dependency policy',
    type: 'type: chore',
    size: 's',
    priority: 'p1',
    summary:
      'Supporting React 18 and 19 doubles the test matrix; supporting only 19 excludes most existing apps. The decision must be explicit.',
    criteria: [
      'Policy documented with the tested version matrix',
      'Peer ranges match what CI actually tests (no untested ranges claimed)',
      'React 19 useId/useOptimistic assumptions recorded',
      'Upgrade path documented for consumers on the older supported major',
    ],
  },
  {
    key: 'rel-css-distribution',
    title: 'Decide and document how CSS reaches consumers',
    type: 'type: design',
    size: 'm',
    priority: 'p1',
    summary:
      'Consumers need to know whether to import a stylesheet, whether Tailwind is required, and how to override tokens without fighting specificity.',
    criteria: [
      'Documented options: import the compiled stylesheet, or consume tokens and write your own utilities',
      'No Tailwind requirement for consumers; the compiled CSS is the contract',
      'Token overrides documented through the CSS layer and @theme, with an example',
      'A test fixture imports only the stylesheet and renders correctly without a Tailwind build',
    ],
    flags: ['needs: decision'],
  },
  {
    key: 'rel-deep-imports',
    title: 'Expose stable per-component subpath exports',
    type: 'type: chore',
    size: 'm',
    priority: 'p2',
    summary:
      'Deep imports let consumers avoid pulling the whole library, but they become a support surface. They need to exist deliberately, with types and CSS.',
    criteria: [
      'exports map lists each component subpath with types and import conditions',
      'A test imports every documented subpath from the packed tarball',
      'Subpath CSS strategy documented (single stylesheet vs per-component CSS)',
      'Deprecation policy for subpaths included in the support policy',
    ],
    dependsOn: ['rel-publint-attw'],
  },
  {
    key: 'rel-sourcemaps',
    title: 'Ship correct source maps and declaration maps',
    type: 'type: chore',
    size: 's',
    priority: 'p3',
    summary:
      'Consumers debugging a component should land in the real source. Maps that point at missing files are noise.',
    criteria: [
      'JS source maps and .d.ts.map files published and referenced correctly',
      'Sources are included or inlined so devtools can resolve them',
      'Tarball size impact measured and accepted',
      'Verified once with a consumer fixture debugging a component',
    ],
  },
  {
    key: 'rel-canary',
    title: 'Add a canary release channel for pull requests',
    type: 'type: chore',
    size: 'm',
    priority: 'p2',
    summary:
      'Reviewers of downstream apps need to try a fix before it is released. Canary versions keyed to commits solve that without polluting the stable line.',
    criteria: [
      'Canary publishes as 0.0.0-canary.<sha> from a label on the pull request',
      'Canary versions never move the latest dist-tag',
      'Install instructions posted as a pull request comment',
      'Canary packages are excluded from provenance-attested stable releases',
    ],
    dependsOn: ['rel-publish-provenance'],
  },
  {
    key: 'rel-release-notes',
    title: 'Generate release notes that highlight accessibility impact',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'An accessibility fix can change behaviour in ways consumers must know: focus order, announcements, aria attributes. Release notes should surface that.',
    criteria: [
      'Release notes group changes and add an Accessibility section automatically from labels',
      'Breaking changes include a before/after snippet',
      'Each note links to the docs page and the issue',
      'Published to GitHub Releases and the docs changelog',
    ],
    dependsOn: ['rel-changesets'],
  },
  {
    key: 'rel-storybook-deploy',
    title: 'Deploy Storybook to Vercel for main and pull requests',
    type: 'type: chore',
    size: 'm',
    priority: 'p1',
    summary:
      'Reviewers, designers and Arabic-speaking testers need a URL. Storybook previews are the cheapest way to get feedback before merge.',
    criteria: [
      'Production deployment on main and preview deployment per pull request',
      'Preview URL posted automatically on the pull request',
      'Deployments excluded from PRs labelled skip-deploy',
      'The deployed build is the same static build the E2E suite tests',
    ],
  },
  {
    key: 'rel-support-policy',
    title: 'Write the version and browser support policy',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Consumers need to know how long a version is supported, when breaking changes can land, and which browsers are explicitly out of scope.',
    criteria: [
      'Policy states the support window for the current and previous minor',
      'Browser baseline linked to Browserslist and stated in the README',
      'Security fix commitment and disclosure process described',
      'Policy reviewed at each minor release',
    ],
  },
  {
    key: 'rel-security',
    title: 'Add SECURITY.md and a private disclosure process',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      "A component library is a dependency in other people's products. Vulnerability reports need a private channel and a response commitment.",
    criteria: [
      'SECURITY.md documents private reporting and expected response times',
      'GitHub private vulnerability reporting enabled',
      'Dependency audit runs in CI and on a schedule',
      'Advisory process described, including coordinated disclosure',
    ],
  },
  {
    key: 'rel-license-audit',
    title: 'Audit licenses of the runtime dependency tree',
    type: 'type: chore',
    size: 's',
    priority: 'p2',
    summary:
      'A permissive library that pulls in a copyleft transitive dependency is a problem for adopters. The audit must cover runtime dependencies only.',
    criteria: [
      'License report generated for production dependencies',
      'Allowed list (MIT, Apache-2.0, BSD, ISC) enforced; exceptions require an ADR',
      'Fonts and icons have their licenses recorded in the repository',
      'Report regenerated on every dependency change',
    ],
  },
  {
    key: 'rel-post-release-smoke',
    title: 'Smoke-test each published release from the registry',
    type: 'type: test',
    size: 'm',
    priority: 'p2',
    summary:
      'The tarball test proves local packing works. The registry can still serve a different artifact, and dist-tags can be wrong.',
    criteria: [
      'Post-release job installs the exact published version into a fixture and builds it',
      'Checks the dist-tag points at the expected version and the provenance attestation exists',
      'Failure opens an issue automatically with the release link',
      'Results recorded in the release notes',
    ],
    dependsOn: ['rel-publish-provenance', 'qa-tarball-test'],
  },
  {
    key: 'rel-npm-pack-assert',
    title: 'Assert the published file list on every pack',
    type: 'type: chore',
    size: 's',
    priority: 'p3',
    summary:
      'Tests, stories and stray config files in a published package are a smell and a supply-chain surface. The file list should be asserted, not eyeballed.',
    criteria: [
      'Allowed file list committed and checked against npm pack output',
      'No test, story, docs source or CI file can enter the tarball',
      'Size report printed on each pack and compared to the budget',
      'Check runs in CI and blocks publishing',
    ],
    flags: ['good first issue'],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'release' }));
