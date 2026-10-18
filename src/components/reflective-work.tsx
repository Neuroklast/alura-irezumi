"use client";
import {
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
  motion,
  type MotionStyle,
} from "motion/react";
export function ReflectiveWork({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const x = useMotionValue(50),
    y = useMotionValue(50);
  const rx = useSpring(0, { stiffness: 170, damping: 24 }),
    ry = useSpring(0, { stiffness: 170, damping: 24 });
  const lightX = useMotionTemplate`${x}%`,
    lightY = useMotionTemplate`${y}%`;
  return (
    <motion.div
      className={`reflective-work ${className}`}
      style={
        {
          rotateX: rx,
          rotateY: ry,
          "--light-x": lightX,
          "--light-y": lightY,
        } as MotionStyle
      }
      onPointerMove={(e) => {
        if (!e.isPrimary) return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
          py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        x.set(px * 100);
        y.set(py * 100);
        if (!reduced) {
          rx.set((0.5 - py) * 9);
          ry.set((px - 0.5) * 12);
        }
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") {
          rx.set(0);
          ry.set(0);
        }
      }}
      onPointerCancel={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      <span className="reflective-glare" aria-hidden="true" />
      <span className="reflective-edge" aria-hidden="true" />
    </motion.div>
  );
}
