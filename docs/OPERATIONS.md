# Operations and deployment

- The repository is a Next.js App Router project intended for Vercel with Node 22 or newer.
- Local verification: npm run typecheck, npm test and npm run build. The documentation CI job only uses Node and Git; it does not deploy or run migrations.
- Verify admin login/forbidden access, demo mode, artwork/media display, content validation, and error handling before release.
- Keep environment secrets in the hosting platform, not Markdown, browser assets or Git history.
- Document deployed commit SHA, real smoke-test outcomes and rollback triggers after an operator release.

Required GitHub PR status: Living docs gate, after branch protection is configured.
