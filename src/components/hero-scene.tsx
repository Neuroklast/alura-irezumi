"use client";
import dynamic from "next/dynamic";
import { Motif } from "./motif";
import type { Scene } from "@/lib/schema";
const Canvas = dynamic(() => import("./surface-canvas"), { ssr: false });
export function HeroScene({
  scene,
  compact = false,
}: {
  scene: Scene;
  compact?: boolean;
}) {
  return (
    <div
      className={`scene ${compact ? "compact" : ""}`}
      style={
        {
          "--surface": `${scene.surface}%`,
          "--glow": scene.glow,
          "--duration": `${3 / scene.speed}s`,
        } as React.CSSProperties
      }
    >
      <div className="orb orb-pink" />
      <div className="orb orb-cyan" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="scene-coordinate top">
        STUDY 0{scene.motif === "moth" ? 1 : scene.motif === "bloom" ? 2 : 3} /
        MATERIAL EXPLORATION
      </div>
      <div className="mirror-frame">
        <div className="mirror-inner">
          <Canvas
            surface={scene.surface}
            glow={scene.glow}
            speed={scene.speed}
          />
          <div
            className="fallback-skin"
            style={{ clipPath: `inset(0 ${100 - scene.surface}% 0 0)` }}
          />
          {scene.customImage ? (
            <img
              className="hero-motif custom-motif engraving"
              src={scene.customImage}
              alt=""
            />
          ) : (
            <Motif
              key={scene.motif}
              kind={scene.motif}
              className="hero-motif engraving"
              draw
            />
          )}
          <div
            className="ink-clip"
            style={{ clipPath: `inset(0 ${100 - scene.surface}% 0 0)` }}
          >
            {scene.customImage ? (
              <img
                className="hero-motif custom-motif ink"
                src={scene.customImage}
                alt=""
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
          <div
            className="reflection-line"
            style={{ left: `${scene.surface}%` }}
          />
        </div>
        <span className="frame-top">A</span>
        <span className="frame-bottom">+</span>
      </div>
      <div className="scene-label ink-label">
        <span className="tiny-dot" /> 01 / INK<span>Auf der Haut.</span>
      </div>
      <div className="scene-label glass-label">
        02 / GLASS <span className="tiny-dot" />
        <span>Im Licht.</span>
      </div>
      <p className="scene-note">
        Illustrative Materialstudie · kein ausgeführtes Tattoo
      </p>
    </div>
  );
}
