"use client";
import dynamic from "next/dynamic";
import { useEffect, useId, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useMotionTemplate,
  type MotionStyle,
} from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Motif } from "./motif";
import {
  clamp,
  gestureIntent,
  surfaceFromPoint,
  surfaceFromSwipe,
} from "@/lib/gesture";
import type { Scene } from "@/lib/schema";
const Canvas = dynamic(() => import("./surface-canvas"), { ssr: false });
type Gesture = {
  id: number;
  x: number;
  y: number;
  start: number;
  intent: "pending" | "horizontal" | "vertical";
};
export function HeroScene({
  scene,
  compact = false,
  interactive = false,
}: {
  scene: Scene;
  compact?: boolean;
  interactive?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const hint = useId(),
    reduced = useReducedMotion();
  const target = useMotionValue(scene.surface);
  const smooth = useSpring(target, { stiffness: 150, damping: 30, mass: 0.65 });
  const material = reduced ? target : smooth;
  const px = useMotionValue(50),
    py = useMotionValue(50);
  const pointerX = useMotionTemplate`${px}%`,
    pointerY = useMotionTemplate`${py}%`;
  useEffect(() => {
    target.set(scene.surface);
  }, [scene.surface, target]);
  function position(e: React.PointerEvent<HTMLDivElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    px.set(clamp(((e.clientX - b.left) / b.width) * 100));
    py.set(clamp(((e.clientY - b.top) / b.height) * 100));
    return b;
  }
  function finish(e: React.PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    gesture.current = null;
  }
  return (
    <div className={`scene-shell ${compact ? "compact-shell" : ""}`}>
      <motion.div
        ref={root}
        className={`scene ${compact ? "compact" : ""} ${interactive ? "interactive-scene" : ""}`}
        style={
          {
            "--material": material,
            "--pointer-x": pointerX,
            "--pointer-y": pointerY,
            "--glow": scene.glow,
            "--duration": `${3 / scene.speed}s`,
          } as MotionStyle
        }
        role={interactive ? "group" : undefined}
        aria-label={
          interactive ? "Materialstudie: Spiegel und Haut" : undefined
        }
        aria-describedby={interactive ? hint : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (!interactive) return;
          const keys: Record<string, number> = {
            ArrowLeft: target.get() - 10,
            ArrowRight: target.get() + 10,
            Home: 0,
            End: 100,
          };
          if (e.key in keys) {
            e.preventDefault();
            target.set(clamp(keys[e.key]));
          }
        }}
        onPointerDown={(e) => {
          if (
            !interactive ||
            !e.isPrimary ||
            (e.pointerType === "mouse" && e.button !== 0)
          )
            return;
          position(e);
          gesture.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            start: target.get(),
            intent: "pending",
          };
        }}
        onPointerMove={(e) => {
          if (!interactive || !e.isPrimary) return;
          const b = position(e);
          if (e.pointerType === "mouse") {
            target.set(surfaceFromPoint(e.clientX, b.left, b.width));
            return;
          }
          const g = gesture.current;
          if (!g || g.id !== e.pointerId) return;
          const dx = e.clientX - g.x,
            dy = e.clientY - g.y;
          if (g.intent === "pending") g.intent = gestureIntent(dx, dy);
          if (g.intent === "horizontal") {
            if (!e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.setPointerCapture(e.pointerId);
            target.set(surfaceFromSwipe(g.start, dx, b.width));
          }
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={() => {
          gesture.current = null;
        }}
      >
        <div className="orb orb-pink" />
        <div className="orb orb-cyan" />
        <div className="scene-grid" aria-hidden="true" />
        <div className="scene-coordinate">
          ALURA / MATERIALSTUDIE{" "}
          {scene.motif === "moth"
            ? "一"
            : scene.motif === "bloom"
              ? "二"
              : "三"}
        </div>
        <div className="mirror-frame">
          <div className="mirror-inner">
            <Canvas
              surface={scene.surface}
              glow={scene.glow}
              speed={scene.speed}
              material={material}
            />
            <div className="fallback-skin" />
            {scene.customImage ? (
              <img
                className="hero-motif custom-motif engraving"
                src={scene.customImage}
                alt=""
                draggable={false}
              />
            ) : (
              <Motif
                key={scene.motif}
                kind={scene.motif}
                className="hero-motif engraving"
                draw
              />
            )}
            <div className="ink-clip">
              {scene.customImage ? (
                <img
                  className="hero-motif custom-motif ink"
                  src={scene.customImage}
                  alt=""
                  draggable={false}
                />
              ) : (
                <Motif
                  key={scene.motif}
                  kind={scene.motif}
                  className="hero-motif ink"
                  draw
                />
              )}
            </div>
            <div className="surface-caustic" aria-hidden="true" />
            <div className="surface-scan" aria-hidden="true" />
          </div>
          <span className="frame-top">A</span>
          <span className="frame-bottom">+</span>
        </div>
        <div className="scene-label glass-label">
          <span className="tiny-dot" />一 / GLAS<span>Linien im Licht.</span>
        </div>
        <div className="scene-label ink-label">
          二 / HAUT
          <span className="tiny-dot" />
          <span>Linien, die bleiben.</span>
        </div>
        <p className="scene-note">
          Illustrative Materialstudie · kein ausgeführtes Tattoo
        </p>
      </motion.div>
      {interactive && (
        <div className="material-gestures">
          <button onClick={() => target.set(0)}>
            <ArrowLeft size={13} />
            Spiegel
          </button>
          <p id={hint}>
            <span className="desktop-hint">Mit der Maus erkunden</span>
            <span className="touch-hint">Nach links oder rechts wischen</span>
            <span className="sr-only">
              . Alternativ Materialknöpfe oder Pfeiltasten verwenden. Pos1 zeigt
              Glas, Ende zeigt Haut.
            </span>
          </p>
          <button onClick={() => target.set(100)}>
            Haut
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
