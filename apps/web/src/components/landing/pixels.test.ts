import { expect, test } from "vitest";
import {
  createSim,
  FIELD_COLS,
  FIELD_ROWS,
  fieldPixels,
  frameSim,
  mix,
  tickSim,
} from "./pixels";

test("mix interpolates hex channels", () => {
  expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
});

test("sim fills an edition, holds it, then starts the next one", () => {
  const sim = createSim();
  for (let i = 0; i < 8; i++) tickSim(sim);
  expect(sim.commits).toHaveLength(12);
  tickSim(sim);
  expect(sim.sentTicks).toBe(0);
  for (let i = 0; i < 3; i++) tickSim(sim);
  expect(sim.edition).toBe(15);
  expect(sim.commits).toHaveLength(0);
});

test("dropped pulses die at the filter column, kept ones cross it", () => {
  const sim = createSim();
  sim.pulses = [
    { row: 8, x: 36, speed: 1.3, dropped: true },
    { row: 9, x: 36, speed: 1.6, dropped: false },
  ];
  for (let i = 0; i < 3; i++) frameSim(sim);
  expect(sim.pulses.map((p) => p.dropped)).toEqual([false]);
  expect(fieldPixels(sim)).toHaveLength(FIELD_COLS * FIELD_ROWS);
});
