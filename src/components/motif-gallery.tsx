"use client";
import { useRef } from "react";
import { motifs, type MotifKey } from "@/lib/motifs";
import { galleryIndexFromSwipe, gestureIntent } from "@/lib/gesture";

const keys = Object.keys(motifs) as MotifKey[];
type Gesture = {
  id: number;
  x: number;
  y: number;
  index: number;
  intent: ReturnType<typeof gestureIntent>;
};

export function MotifGallery({
  value,
  onChange,
}: {
  value: MotifKey;
  onChange: (value: MotifKey) => void;
}) {
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  return (
    <div
      className="motif-gallery"
      role="group"
      aria-label="Motiv auswählen"
      onPointerDown={(event) => {
        if (
          !event.isPrimary ||
          (event.pointerType === "mouse" && event.button !== 0)
        )
          return;
        suppressClick.current = false;
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          index: keys.indexOf(value),
          intent: "pending",
        };
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        if (current.intent === "pending")
          current.intent = gestureIntent(
            event.clientX - current.x,
            event.clientY - current.y,
          );
        if (current.intent !== "pending") suppressClick.current = true;
        if (
          current.intent === "horizontal" &&
          !event.currentTarget.hasPointerCapture(event.pointerId)
        )
          event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        gesture.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        if (current.intent !== "horizontal") return;
        const next = galleryIndexFromSwipe(
          current.index,
          event.clientX - current.x,
          event.clientY - current.y,
          keys.length,
        );
        if (next !== current.index) onChange(keys[next]);
      }}
      onPointerCancel={() => {
        gesture.current = null;
        suppressClick.current = true;
      }}
      onLostPointerCapture={() => {
        gesture.current = null;
      }}
      onClickCapture={(event) => {
        if (event.detail > 0 && suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={motifs[key].name}
          aria-pressed={key === value}
          title={motifs[key].name}
          onClick={() => onChange(key)}
        >
          <img
            src={motifs[key].engravingImage}
            alt=""
            draggable={false}
            width={32}
            height={60}
          />
        </button>
      ))}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Ausgewähltes Motiv: {motifs[value].name}
      </span>
    </div>
  );
}
