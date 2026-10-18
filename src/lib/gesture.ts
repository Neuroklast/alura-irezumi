/** Pointer math shared by the material scene and its regression tests. */
export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
export function surfaceFromPoint(clientX: number, left: number, width: number) {
  if (width <= 0) return 50;
  return clamp(((clientX - left) / width) * 100);
}
export function surfaceFromSwipe(start: number, deltaX: number, width: number) {
  if (width <= 0) return clamp(start);
  return clamp(start + (deltaX / width) * 140);
}
export function gestureIntent(deltaX: number, deltaY: number) {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return "pending";
  return Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? "horizontal" : "vertical";
}

/** A deliberate horizontal gallery swipe advances one motif without wrapping. */
export function galleryIndexFromSwipe(
  start: number,
  deltaX: number,
  deltaY: number,
  count: number,
) {
  const last = Math.max(0, count - 1);
  const current = clamp(start, 0, last);
  if (gestureIntent(deltaX, deltaY) !== "horizontal" || Math.abs(deltaX) < 32)
    return current;
  return clamp(current + (deltaX < 0 ? 1 : -1), 0, last);
}
