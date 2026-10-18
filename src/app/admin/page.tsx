import { Admin, Login } from "@/components/admin";
import { isDemo } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase";
export const metadata = {
  title: "Atelier",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (isDemo()) return <Admin />;
  const db = await requireAdmin();
  if (!db) return <Login />;
  const { data, error } = await db
    .from("enquiries")
    .select("id,name,email,type,motif,placement,size,message,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Anfragen konnten nicht geladen werden.");
  return <Admin enquiries={data || []} />;
}
