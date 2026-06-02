import test from "node:test";
import assert from "node:assert/strict";
import { beatFrequency, normalFrequencies, simulateCoupledPendulums } from "../src/physics.js";

const BASE = {
  mass: 0.5,
  length: 1.0,
  springDistance: 0.6,
  springStiffness: 20,
  damping: 0,
  duration: 10,
  sampleCount: 4000,
};

test("symmetric mode frequency equals sqrt(g/L)", () => {
  const { omegaMinus } = normalFrequencies(BASE);
  assert.ok(Math.abs(omegaMinus - Math.sqrt(9.81)) < 1e-12);
});

test("anti-symmetric mode grows with spring stiffness", () => {
  const soft = normalFrequencies({ ...BASE, springStiffness: 5 });
  const stiff = normalFrequencies({ ...BASE, springStiffness: 80 });
  assert.ok(stiff.omegaPlus > soft.omegaPlus);
  assert.ok(Math.abs(soft.omegaMinus - stiff.omegaMinus) < 1e-12);
});

test("in-phase initial conditions keep theta1 equal to theta2 without damping", () => {
  const sim = simulateCoupledPendulums({
    ...BASE,
    theta1Initial: 0.1,
    theta2Initial: 0.1,
  });
  const maxDiff = Math.max(...sim.theta1.map((v, i) => Math.abs(v - sim.theta2[i])));
  assert.ok(maxDiff < 1e-6);
});

test("anti-phase initial conditions keep theta1 equal to minus theta2 without damping", () => {
  const sim = simulateCoupledPendulums({
    ...BASE,
    theta1Initial: 0.12,
    theta2Initial: -0.12,
  });
  const maxDiff = Math.max(...sim.theta1.map((v, i) => Math.abs(v + sim.theta2[i])));
  assert.ok(maxDiff < 1e-6);
});

test("beat frequency matches difference of normal modes", () => {
  const freqs = normalFrequencies(BASE);
  const beat = beatFrequency(BASE);
  const expected = Math.abs(freqs.omegaPlus - freqs.omegaMinus) / (2 * Math.PI);
  assert.ok(Math.abs(beat - expected) < 1e-12);
});
