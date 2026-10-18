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
import { motifs } from "@/lib/motifs";
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
        aria-label={interactive ? "Motivvorschau auf Glas und Haut" : undefined}
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
        <div className="glass-pane">
          <div className="glass-pane-surface">
            <Canvas
              surface={scene.surface}
              glow={scene.glow}
              speed={scene.speed}
              material={material}
            />
            <div className="skin-surface" aria-hidden="true">
              <img src="/art/skin-cc0.webp" alt="" draggable={false} />
            </div>
            <img
              className="hero-motif custom-motif engraving"
              src={scene.customImage || motifs[scene.motif].engravingImage}
              alt=""
              draggable={false}
            />
            <div className="ink-clip">
              <img
                className="hero-motif custom-motif ink"
                src={scene.customImage || motifs[scene.motif].image}
                alt=""
                draggable={false}
              />
            </div>
            <div className="surface-caustic" aria-hidden="true" />
          </div>
        </div>
        <span className="scene-work-label">
          {scene.customImage ? "Dein Motiv" : motifs[scene.motif].name}
        </span>
      </motion.div>
      <p className="scene-note">
        Motivvorschau auf Glas und echter Hautfotografie.
      </p>
      {interactive && (
        <div className="material-gestures">
          <button onClick={() => target.set(0)}>
            <ArrowLeft size={13} />
            Spiegel
          </button>
          <p id={hint}>
            <span className="desktop-hint">Maus bewegen</span>
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
