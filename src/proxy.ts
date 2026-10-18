import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemo } from "@/lib/config";

// Refresh cookies before Server Components read them. Server Components cannot
// persist a renewed session themselves. Authorization remains in requireAdmin.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (isDemo()) return response;
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await db.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|robots.txt|art/|favicon.ico).*)",
  ],
};
