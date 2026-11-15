# Architecture

- Next.js 16 App Router and React 19 own public tattoo portfolio presentation and admin UI. UI animations and original artwork remain separate from database concerns.
- Domain/content validation is Zod-based. Server routes/actions perform validation and authorization, never client UI state alone.
- Supabase SSR is configured for session and data access; RLS plus admin-role checks restrict writes.
- No database credentials are required for explicit demo mode. Configured integration failures must not silently turn into fabricated demo state.
- Media storage has an R2-compatible client, but no new storage or migration is authorized by this documentation.
- Admin, artwork/gallery and shop concerns must keep separate domain boundaries and failure handling.

[Security](SECURITY.md), [Data](DATA.md), [Operations](OPERATIONS.md), [quality baseline](ARCHITECTURE_QUALITY.md) are authoritative for their respective topics.
