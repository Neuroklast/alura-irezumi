"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { contentSchema, type Content } from "@/lib/schema";
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
            const oldTitles: Record<string, string> = {
              "00000000-0000-4000-8000-000000000001": "Midnight wings",
              "00000000-0000-4000-8000-000000000002":
                "Through the looking glass",
              "00000000-0000-4000-8000-000000000003": "The serpent",
              "00000000-0000-4000-8000-000000000004": "Night garden",
              "00000000-0000-4000-8000-000000000005": "Lunar reflection",
              "00000000-0000-4000-8000-000000000006": "Wild bloom",
            };
            setContent({
              ...parsed.data,
              works: parsed.data.works.map((work) =>
                work.title === oldTitles[work.id]
                  ? {
                      ...work,
                      title:
                        initial.works.find((w) => w.id === work.id)?.title ??
                        work.title,
                    }
                  : work,
              ),
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
