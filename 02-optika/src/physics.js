export const VISIBLE_MIN_NM = 380;
export const VISIBLE_MAX_NM = 780;

export function sincSquared(x) {
  if (Math.abs(x) < 1e-12) return 1;
  const s = Math.sin(x) / x;
  return s * s;
}

export function fraunhoferIntensity(y, params) {
  const L = positive(params.screenDistance, "screenDistance");
  const a = positive(params.slitWidth, "slitWidth");
  const d = positive(params.period, "period");
  const lambdaM = positive(params.wavelengthNm, "wavelengthNm") * 1e-9;
  const nSlits = clampInt(params.slits ?? 1, 1, 10);

  const sinTheta = y / Math.sqrt(y * y + L * L);
  const beta = (Math.PI * a * sinTheta) / lambdaM;
  const gamma = (Math.PI * d * sinTheta) / lambdaM;
  const single = sincSquared(beta);
  let multi = 1;
  if (nSlits > 1) {
    const denom = nSlits * Math.sin(gamma);
    multi = Math.abs(denom) < 1e-12 ? 1 : Math.pow(Math.sin(nSlits * gamma) / denom, 2);
  }
  return single * multi;
}

export function fringeSpacingM(params) {
  const L = positive(params.screenDistance, "screenDistance");
  const d = positive(params.period, "period");
  const lambdaM = positive(params.wavelengthNm, "wavelengthNm") * 1e-9;
  return (L * lambdaM) / d;
}

export function gaussianSpectrum(centerNm, fwhmNm, count = 31) {
  if (fwhmNm <= 0) {
    return [{ wavelengthNm: centerNm, weight: 1 }];
  }
  const sigma = fwhmNm / (2 * Math.sqrt(2 * Math.LN2));
  const half = Math.max(1, Math.floor(count / 2));
  const samples = [];
  let total = 0;
  for (let i = -half; i <= half; i += 1) {
    const wavelengthNm = centerNm + (i * 2.5 * sigma) / half;
    const weight = Math.exp(-0.5 * Math.pow((wavelengthNm - centerNm) / sigma, 2));
    samples.push({ wavelengthNm, weight });
    total += weight;
  }
  return samples.map((item) => ({ ...item, weight: item.weight / total }));
}

export function spectralIntensity(y, spectrum, params) {
  let value = 0;
  for (const sample of spectrum) {
    value += sample.weight * fraunhoferIntensity(y, { ...params, wavelengthNm: sample.wavelengthNm });
  }
  return value;
}

export function wavelengthToRgb(wavelengthNm) {
  const wl = clamp(wavelengthNm, VISIBLE_MIN_NM, VISIBLE_MAX_NM);
  let r = 0;
  let g = 0;
  let b = 0;
  if (wl < 440) {
    r = -(wl - 440) / 60;
    b = 1;
  } else if (wl < 490) {
    g = (wl - 440) / 50;
    b = 1;
  } else if (wl < 510) {
    g = 1;
    b = -(wl - 510) / 20;
  } else if (wl < 580) {
    r = (wl - 510) / 70;
    g = 1;
  } else if (wl < 645) {
    r = 1;
    g = -(wl - 645) / 65;
  } else {
    r = 1;
  }
  let factor = 1;
  if (wl < 420) factor = 0.3 + 0.7 * (wl - 380) / 40;
  else if (wl > 700) factor = 0.3 + 0.7 * (780 - wl) / 80;
  return [Math.max(r, 0) * factor, Math.max(g, 0) * factor, Math.max(b, 0) * factor];
}

export function buildProfile(params, sampleCount = 640) {
  const halfWidth = positive(params.screenHalfWidth ?? 0.03, "screenHalfWidth");
  const values = new Array(sampleCount);
  const ys = new Array(sampleCount);
  const spectrum = gaussianSpectrum(params.wavelengthNm, params.bandwidthNm ?? 0, 41);
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / (sampleCount - 1);
    const y = -halfWidth + 2 * halfWidth * t;
    ys[i] = y;
    values[i] = spectralIntensity(y, spectrum, params);
  }
  return { ys, values, spectrum };
}

function positive(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
  return number;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(Number(value))));
}
