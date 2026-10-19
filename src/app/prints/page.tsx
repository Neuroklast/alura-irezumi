import { PrintShop } from "@/components/print-shop";
import { checkoutEnabled } from "@/lib/shop/server";
export const metadata = { title: "Kunstdrucke" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  return (
    <PrintShop enabled={checkoutEnabled()} checkoutResult={params.checkout} />
  );
}
