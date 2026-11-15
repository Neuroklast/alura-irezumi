# Data and storage contracts

- Content and portfolio definitions are validated against the repository schemas. New data shapes require schema and consumer tests.
- Supabase is a distinct configured source of truth. A failed configured read must not be treated as intentionally missing records.
- Demo content is a separate explicit mode and is not evidence of persisted production content.
- R2-compatible object storage must not delete a valid media object before replacement is durably verified.
- Changes to payments, artworks or user data require a documented persistence contract, consistent failure behavior and rollback.

Schema migration and production state were not verified by this document.
