import { beatFrequency, normalFrequencies, simulateCoupledPendulums } from "./physics.js";

const state = {
  mass: 0.5,
  length: 1.0,
  springDistance: 0.6,
  springStiffness: 20,
  damping: 0.05,
  theta1Initial: 0.15,
  theta2Initial: 0,
  duration: 30,
};

const angleCanvas = document.querySelector("#angleCanvas");
const angleContext = angleCanvas.getContext("2d");
const speedCanvas = document.querySelector("#speedCanvas");
const speedContext = speedCanvas.getContext("2d");

const outputs = {
  omegaMinus: document.querySelector("#omegaMinus"),
  omegaPlus: document.querySelector("#omegaPlus"),
  beatFreq: document.querySelector("#beatFreq"),
};

bindControl("mass", "massRange", "mass");
bindControl("length", "lengthRange", "length");
bindControl("springDistance", "springDistanceRange", "springDistance");
bindControl("springStiffness", "springStiffnessRange", "springStiffness");
bindControl("damping", "dampingRange", "damping");
bindControl("theta1Initial", "theta1InitialRange", "theta1Initial");
bindControl("theta2Initial", "theta2InitialRange", "theta2Initial");
bindControl("duration", "durationRange", "duration", true);

new ResizeObserver(render).observe(document.querySelector(".plot-panel"));
render();

function bindControl(numberId, rangeId, key, integer = false) {
  const numberInput = document.querySelector(`#${numberId}`);
  const rangeInput = document.querySelector(`#${rangeId}`);
  const apply = (raw, source) => {
    const value = clamp(Number(raw), source);
    state[key] = integer ? Math.round(value) : value;
    numberInput.value = String(state[key]);
    rangeInput.value = String(state[key]);
    render();
  };
  numberInput.addEventListener("input", () => apply(numberInput.value, numberInput));
  rangeInput.addEventListener("input", () => apply(rangeInput.value, rangeInput));
}

function clamp(value, input) {
  const min = Number(input.min);
  const max = Number(input.max);
  if (!Number.isFinite(value)) return Number(input.value);
  return Math.min(max, Math.max(min, value));
}

function render() {
  const freqs = normalFrequencies(state);
  outputs.omegaMinus.textContent = `${freqs.omegaMinus.toFixed(3)} рад/с (${(freqs.omegaMinus / (2 * Math.PI)).toFixed(3)} Гц)`;
  outputs.omegaPlus.textContent = `${freqs.omegaPlus.toFixed(3)} рад/с (${(freqs.omegaPlus / (2 * Math.PI)).toFixed(3)} Гц)`;
  outputs.beatFreq.textContent = `${beatFrequency(state).toFixed(3)} Гц`;

  const sim = simulateCoupledPendulums({ ...state, sampleCount: 2500 });
  drawSeries(angleCanvas, angleContext, sim.times, [
    { values: sim.theta1.map((v) => (v * 180) / Math.PI), color: "#2563eb", label: "θ₁" },
    { values: sim.theta2.map((v) => (v * 180) / Math.PI), color: "#dc2626", label: "θ₂" },
  ], "Угол, °");

  drawSeries(speedCanvas, speedContext, sim.times, [
    { values: sim.omega1, color: "#2563eb", label: "ω₁" },
    { values: sim.omega2, color: "#dc2626", label: "ω₂" },
  ], "Угловая скорость, рад/с");
}

function drawSeries(canvas, context, times, series, yLabel) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width * devicePixelRatio));
  const height = Math.max(180, Math.floor(rect.height * devicePixelRatio));
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  const pad = { left: 56, right: 16, top: 16, bottom: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const tMin = times[0];
  const tMax = times[times.length - 1];
  let yMin = Infinity;
  let yMax = -Infinity;
  series.forEach((item) => {
    item.values.forEach((value) => {
      yMin = Math.min(yMin, value);
      yMax = Math.max(yMax, value);
    });
  });
  if (Math.abs(yMax - yMin) < 1e-9) {
    yMin -= 1;
    yMax += 1;
  }
  const yPad = 0.08 * (yMax - yMin);
  yMin -= yPad;
  yMax += yPad;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 1;
  context.strokeRect(pad.left, pad.top, plotW, plotH);

  context.fillStyle = "#334155";
  context.font = `${12 * devicePixelRatio}px sans-serif`;
  context.fillText(yLabel, 8, pad.top + 14);
  context.fillText(`${tMin.toFixed(0)} с`, pad.left, height - 8);
  context.fillText(`${tMax.toFixed(0)} с`, pad.left + plotW - 24, height - 8);

  series.forEach((item) => {
    context.strokeStyle = item.color;
    context.lineWidth = 2 * devicePixelRatio;
    context.beginPath();
    item.values.forEach((value, index) => {
      const x = pad.left + ((times[index] - tMin) / (tMax - tMin)) * plotW;
      const y = pad.top + (1 - (value - yMin) / (yMax - yMin)) * plotH;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  });
}
