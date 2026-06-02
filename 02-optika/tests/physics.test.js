import test from "node:test";
import assert from "node:assert/strict";
import {
  fraunhoferIntensity,
  fringeSpacingM,
  gaussianSpectrum,
  spectralIntensity,
} from "../src/physics.js";

const BASE = {
  slits: 5,
  slitWidth: 20e-6,
  period: 100e-6,
  screenDistance: 1.0,
  wavelengthNm: 550,
  screenHalfWidth: 0.03,
};

test("fringe spacing equals L lambda / d", () => {
  const spacing = fringeSpacingM(BASE);
  assert.ok(Math.abs(spacing - 5.5e-3) < 1e-6);
});

test("single slit removes interference factor", () => {
  const one = fraunhoferIntensity(0.005, { ...BASE, slits: 1 });
  const five = fraunhoferIntensity(0.005, { ...BASE, slits: 5 });
  assert.ok(one > 0);
  assert.ok(five > 0);
  assert.ok(Math.abs(one - 1) < 1e-9);
});

test("central maximum is unity for symmetric grating", () => {
  const center = fraunhoferIntensity(0, BASE);
  assert.ok(Math.abs(center - 1) < 1e-9);
});

test("zero bandwidth spectrum is monochromatic", () => {
  const spectrum = gaussianSpectrum(550, 0, 21);
  assert.equal(spectrum.length, 1);
  const y = 0.004;
  const mono = fraunhoferIntensity(y, BASE);
  const spec = spectralIntensity(y, spectrum, BASE);
  assert.ok(Math.abs(mono - spec) < 1e-12);
});

test("more slits sharpen peaks away from center", () => {
  const y = 0.011;
  const wide = fraunhoferIntensity(y, { ...BASE, slits: 2 });
  const narrow = fraunhoferIntensity(y, { ...BASE, slits: 10 });
  assert.ok(narrow < wide);
});
