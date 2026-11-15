# Architecture quality programme

Status: **Living docs governance introduced, full audit and production certification NOT completed.** Date: 2026-11-15.

## Invariants

- Server authorization plus RLS for any administration or personal-data mutation.
- No executable artwork uploads, leaked keys or disguised failed configured database reads.
- Explicit demo mode remains read-only where intended, and never replaces production state after errors.
- Canonical schema and domain ownership for content, shop, media and account actions.
- Real negative-path and integration tests for login, rejected writes, partial storage errors and external providers.
- No migrations or object-store scans during GET, module import or runtime startup.

## Owners

[Architecture](ARCHITECTURE.md), [Security](SECURITY.md), [Data](DATA.md), [Operations](OPERATIONS.md), [Journal](QUALITY_JOURNAL.md), [Trigger map](living-docs.json).

## Acceptance evidence

| Gate | Current result |
| --- | --- |
| Complete dependency/data-flow and privacy map | Not established |
| All P0/P1 defects fixed with behavioral regression tests | Not established |
| Real RLS and partial failure injection | Not fully verified |
| Monitoring, accessibility and performance SLO validation | Not established |
| PR living-docs gate | Added in PR; required branch protection is separate |

Every source/config PR updates its canonical docs and appends a factual seven-field journal entry. Human review is responsible for semantic truth.
