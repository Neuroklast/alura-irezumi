# Security contracts

- Authentication is deliberate POST; logout is explicit DELETE. Server checks same-origin requests and validates input with Zod.
- Admin status is derived from a server-checked user app_metadata role and Supabase RLS, not visible UI affordances.
- Normal and rejected-login sign-out are local-scoped, so other sessions are preserved.
- Keep service-role and R2 secrets server-only; never expose arbitrary executable SVG uploads.
- Content and images are subject to bounds and validation. Demo mode must not authorize production writes.
- Security changes require tests for rejection/permission errors and documentation of residual risks.

This file documents intended boundaries, not an independent authorization audit.
