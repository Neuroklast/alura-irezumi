import { galleryIndexFromSwipe } from "../src/lib/gesture";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  gestureIntent,
  surfaceFromPoint,
  surfaceFromSwipe,
} from "../src/lib/gesture";
test("horizontal exploration maps the full viewport and clamps pointer capture outside it", () => {
  assert.equal(surfaceFromPoint(100, 100, 400), 0);
  assert.equal(surfaceFromPoint(300, 100, 400), 50);
  assert.equal(surfaceFromPoint(500, 100, 400), 100);
  assert.equal(surfaceFromPoint(-200, 100, 400), 0);
  assert.equal(surfaceFromPoint(800, 100, 400), 100);
});
test("mobile swipes start at the current material without jumping to the touch-down location", () => {
  assert.equal(surfaceFromSwipe(35, 0, 400), 35);
  assert.equal(surfaceFromSwipe(35, 100, 400), 70);
  assert.equal(surfaceFromSwipe(35, -200, 400), 0);
  assert.equal(surfaceFromSwipe(85, 100, 400), 100);
});
test("vertical and diagonal scrolling are not hijacked by a horizontal material gesture", () => {
  assert.equal(gestureIntent(3, 5), "pending");
  assert.equal(gestureIntent(40, 5), "horizontal");
  assert.equal(gestureIntent(4, 40), "vertical");
  assert.equal(gestureIntent(40, 40), "vertical");
  assert.equal(gestureIntent(-50, 7), "horizontal");
});
test("zero-width scenes never produce NaN or Infinity during resize", () => {
  assert.equal(surfaceFromPoint(300, 100, 0), 50);
  assert.equal(surfaceFromSwipe(35, 100, 0), 35);
  assert.equal(clamp(-50), 0);
  assert.equal(clamp(150), 100);
});

test("gallery swipes advance exactly one motif and remain bounded", () => {
  assert.equal(galleryIndexFromSwipe(1, -60, 4, 4), 2);
  assert.equal(galleryIndexFromSwipe(2, 60, 4, 4), 1);
  assert.equal(galleryIndexFromSwipe(3, -200, 0, 4), 3);
  assert.equal(galleryIndexFromSwipe(0, 200, 0, 4), 0);
  assert.equal(galleryIndexFromSwipe(0, -60, 0, 0), 0);
});
test("gallery taps, vertical scrolling and diagonal scrolling do not select another motif", () => {
  assert.equal(galleryIndexFromSwipe(1, 6, 1, 4), 1);
  assert.equal(galleryIndexFromSwipe(1, 31, 0, 4), 1);
  assert.equal(galleryIndexFromSwipe(1, 5, 70, 4), 1);
  assert.equal(galleryIndexFromSwipe(1, 50, 50, 4), 1);
});
