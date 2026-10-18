import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "./globals.css";
import { getContent } from "@/lib/content";
import { isDemo, integrationStatus } from "@/lib/config";
import { StudioProvider } from "@/components/studio-provider";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "ALURA IREZUMI · Ink & Glass",
    template: "%s · ALURA IREZUMI",
  },
  description:
    "Tattoos und Spiegelgravuren von Laura. Kunst zwischen Haut, Glas und Fantasie.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initial = await getContent();
  return (
    <html lang="de">
      <body>
        <StudioProvider
          initial={initial.content}
          version={initial.version}
          demo={isDemo()}
          integrations={integrationStatus()}
        >
          {children}
        </StudioProvider>
      </body>
    </html>
  );
}
