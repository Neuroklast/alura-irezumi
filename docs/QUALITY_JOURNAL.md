# Quality journal

Append-only dated evidence for implementation changes. Never invent completed tests, migrations or deployment.

## 2026-11-15 | Establish living architecture documentation
- Scope: Alura Irezumi project documentation owners, architectural baseline and GitHub source-diff validation.
- Root cause: Previously code changes could pass ordinary CI without updating their corresponding Markdown.
- Owner: Maintainers responsible for admin security, content and media contracts and tests.
- Tests: Node-only contract tests cover changed-path mapping and malformed journal fields.
- Failure path: Missing required Markdown or unknown git base causes a failing status, not a silent success.
- Docs updated: Architecture, security, data, operations, quality baseline, QA and changelog.
- Residual risk: Production RLS, media, shop and UX behavior require independent integration review; branch rules are separate.
