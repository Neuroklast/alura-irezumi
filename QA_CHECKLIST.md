# QA checklist

## Architecture and living documentation

- [ ] Code-only PR fails without a dated quality journal and mapped owner docs.
- [ ] Invalid newly added journal fields fail; docs-only changes do not need fake change entries.
- [ ] Verify both demo and configured Supabase paths, including unavailable/rejected reads.
- [ ] Verify admin role, normal logout, forbidden API mutations, artwork safety and media recovery separately from source tests.
