# Project conventions

- Real Next.js App Router application targeting Vercel. Do not replace it with a static mock or a different framework.
- No credentials are required for demo mode. Preserve this for every route, including `/admin`.
- Distinguish illustrations, simulations and original artworks. Never present demo images as Laura's actual tattoos.
- `HeroScene` is shared between the public hero and the editor. Preserve one rendering implementation.
- Public artwork photographs must not be altered by material shaders.
- Supabase RLS and server-side `app_metadata.role === 'admin'` checks are both required for admin writes.
- Never expose service role or R2 secrets in browser code. Never allow arbitrary executable SVG uploads.
- Configured integration failures must remain visible. Do not silently fall back to demo after a real database error.
- Do not add analytics, external embeds, unsolicited mail sending, or public mutation paths.
- Use design tokens from `globals.css`. Reserve image and animation dimensions. Support reduced motion and WebGL failure.
- Keep dependencies pinned. Update package-lock.json with package.json.
- Before delivery: `npm run typecheck`, `npm test`, `npm run build`. Report browser/live integration verification limits accurately.
