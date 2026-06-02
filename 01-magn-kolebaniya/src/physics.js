export const G = 9.81;

export function normalFrequencies(params) {
  const m = positive(params.mass, "mass");
  const L = positive(params.length, "length");
  const L1 = positive(params.springDistance, "springDistance");
  const k = positive(params.springStiffness, "springStiffness");
  const kappa = (k * L1 * L1) / (m * L * L);
  const omega0 = Math.sqrt(G / L);
  return {
    omegaMinus: omega0,
    omegaPlus: Math.sqrt(omega0 * omega0 + 2 * kappa),
    kappa,
  };
}

export function derivatives(state, params) {
  const [theta1, omega1, theta2, omega2] = state;
  const m = positive(params.mass, "mass");
  const L = positive(params.length, "length");
  const L1 = positive(params.springDistance, "springDistance");
  const k = positive(params.springStiffness, "springStiffness");
  const beta = nonNegative(params.damping, "damping");
  const kappa = (k * L1 * L1) / (m * L * L);
  const omega0Sq = G / L;
  const gamma = beta / m;

  const alpha1 = -omega0Sq * theta1 - kappa * (theta1 - theta2) - gamma * omega1;
  const alpha2 = -omega0Sq * theta2 - kappa * (theta2 - theta1) - gamma * omega2;
  return [omega1, alpha1, omega2, alpha2];
}

export function rk4Step(state, dt, params) {
  const k1 = derivatives(state, params);
  const s2 = addScaled(state, k1, dt * 0.5);
  const k2 = derivatives(s2, params);
  const s3 = addScaled(state, k2, dt * 0.5);
  const k3 = derivatives(s3, params);
  const s4 = addScaled(state, k3, dt);
  const k4 = derivatives(s4, params);
  return state.map((value, index) =>
    value + (dt / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]),
  );
}

export function simulateCoupledPendulums(params) {
  const duration = positive(params.duration ?? 30, "duration");
  const sampleCount = Math.max(100, Math.round(params.sampleCount ?? 2000));
  const dt = duration / sampleCount;
  const initial = [
    finite(params.theta1Initial ?? 0.15, "theta1Initial"),
    finite(params.omega1Initial ?? 0, "omega1Initial"),
    finite(params.theta2Initial ?? 0, "theta2Initial"),
    finite(params.omega2Initial ?? 0, "omega2Initial"),
  ];

  const times = new Array(sampleCount + 1);
  const theta1 = new Array(sampleCount + 1);
  const omega1 = new Array(sampleCount + 1);
  const theta2 = new Array(sampleCount + 1);
  const omega2 = new Array(sampleCount + 1);

  let state = initial.slice();
  for (let i = 0; i <= sampleCount; i += 1) {
    times[i] = i * dt;
    theta1[i] = state[0];
    omega1[i] = state[1];
    theta2[i] = state[2];
    omega2[i] = state[3];
    if (i < sampleCount) {
      state = rk4Step(state, dt, params);
    }
  }

  return { times, theta1, omega1, theta2, omega2, dt };
}

export function beatFrequency(params) {
  const { omegaMinus, omegaPlus } = normalFrequencies(params);
  return Math.abs(omegaPlus - omegaMinus) / (2 * Math.PI);
}

function addScaled(state, deriv, scale) {
  return state.map((value, index) => value + scale * deriv[index]);
}

function positive(value, name) {
  const number = finite(value, name);
  if (number <= 0) {
    throw new RangeError(`${name} must be positive`);
  }
  return number;
}

function nonNegative(value, name) {
  const number = finite(value, name);
  if (number < 0) {
    throw new RangeError(`${name} must be non-negative`);
  }
  return number;
}

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return number;
}
