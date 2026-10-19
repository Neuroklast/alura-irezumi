"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
const chapters = [
  { kanji: "一", label: "Anfang", id: "main" },
  { kanji: "二", label: "Arbeiten", id: "selected" },
  { kanji: "三", label: "Spiegel", id: "glass" },
  { kanji: "四", label: "Prints", id: "prints" },
  { kanji: "五", label: "Laura", id: "artist" },
  { kanji: "六", label: "Anfragen", id: "booking" },
];
export function LineSidebar() {
  const path = usePathname();
  const [active, setActive] = useState("main");
  const pointer = useMotionValue(-1000);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (path !== "/") return;
    const update = () => {
      const threshold = innerHeight * 0.42;
      let next = "main";
      for (const chapter of chapters) {
        const element = document.getElementById(chapter.id);
        if (element && element.getBoundingClientRect().top <= threshold)
          next = chapter.id;
      }
      setActive(next);
    };
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [path]);
  return (
    <nav
      ref={root}
      className="chapter-rail"
      aria-label="Seitennavigation"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") pointer.set(e.clientY);
      }}
      onPointerLeave={() => pointer.set(-1000)}
    >
      <span className="rail-caption">ALURA / VERZEICHNIS</span>
      <ol>
        {chapters.map((chapter) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            pointer={pointer}
            active={
              path === "/"
                ? active === chapter.id
                : path === "/work"
                  ? chapter.id === "selected"
                  : path === "/prints"
                    ? chapter.id === "prints"
                    : path === "/contact"
                      ? chapter.id === "booking"
                      : false
            }
          />
        ))}
      </ol>
      <span className="rail-foot">TATTOOS & GRAVUREN</span>
    </nav>
  );
}
function Chapter({
  chapter,
  pointer,
  active,
}: {
  chapter: (typeof chapters)[number];
  pointer: MotionValue<number>;
  active: boolean;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const proximity = useTransform(pointer, (y) => {
    const rect = link.current?.getBoundingClientRect();
    if (!rect || y < 0 || reduced) return 0;
    return Math.max(0, 1 - Math.abs(y - (rect.top + rect.height / 2)) / 115);
  });
  const offset = useSpring(useTransform(proximity, [0, 1], [0, 9]), {
    stiffness: 280,
    damping: 30,
  });
  const width = useTransform(proximity, [0, 1], ["17px", "38px"]);
  return (
    <li>
      <motion.span className="rail-tick" style={{ width }} />
      <motion.div style={{ x: offset }}>
        <Link
          ref={link}
          href={`/#${chapter.id}`}
          scroll={pathname === "/" && !reduced ? false : true}
          className={active ? "active" : ""}
          aria-current={active ? "location" : undefined}
        >
          <span className="rail-kanji" lang="ja" aria-hidden="true">
            {chapter.kanji}
          </span>
          <span>{chapter.label}</span>
        </Link>
      </motion.div>
    </li>
  );
}
