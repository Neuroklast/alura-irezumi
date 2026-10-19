"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { contentSchema, type Content } from "@/lib/schema";
import { upgradeSeededContent } from "@/lib/content-migration";
const key = "alura-demo-v1";
type Studio = {
  content: Content;
  setContent: (c: Content) => void;
  demo: boolean;
  integrations: { supabase: boolean; r2: boolean };
  save: () => Promise<string>;
  reset: () => void;
  ready: boolean;
};
const Context = createContext<Studio | null>(null);
export function StudioProvider({
  initial,
  version: initialVersion,
  demo,
  integrations,
  children,
}: {
  initial: Content;
  version: number;
  demo: boolean;
  integrations: Studio["integrations"];
  children: React.ReactNode;
}) {
  const [content, setContent] = useState(initial);
  const [version, setVersion] = useState(initialVersion);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (demo) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = contentSchema.safeParse(JSON.parse(raw));
          if (parsed.success) {
            setContent({
              ...upgradeSeededContent(parsed.data),
              shop: JSON.parse(raw).shop ? parsed.data.shop : initial.shop,
            });
          }
        }
      } catch {
        /* Unavailable storage keeps the demo usable in memory. */
      }
    }
    setReady(true);
  }, [demo]);
  async function save() {
    const valid = contentSchema.parse(content);
    if (demo) {
      try {
        localStorage.setItem(key, JSON.stringify(valid));
        return "Demo lokal in diesem Browser gespeichert.";
      } catch {
        throw new Error(
          "Browserspeicher voll oder gesperrt. Nicht gespeichert. Änderungen gelten nur bis zum Neuladen.",
        );
      }
    }
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: valid, version }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Speichern fehlgeschlagen.");
    setVersion(json.version);
    return "Änderungen veröffentlicht.";
  }
  function reset() {
    if (demo) {
      try {
        localStorage.removeItem(key);
      } catch {}
      setContent(initial);
    }
  }
  return (
    <Context.Provider
      value={{ content, setContent, demo, integrations, save, reset, ready }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStudio() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("StudioProvider fehlt");
  return ctx;
}
