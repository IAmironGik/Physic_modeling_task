import {
  buildProfile,
  fraunhoferIntensity,
  fringeSpacingM,
  spectralIntensity,
  wavelengthToRgb,
  gaussianSpectrum,
} from "./physics.js";

const state = {
  slits: 5,
  slitWidthUm: 20,
  periodUm: 100,
  screenDistance: 1.0,
  wavelengthNm: 550,
  bandwidthNm: 0,
  screenHalfWidthMm: 30,
};

const profileCanvas = document.querySelector("#profileCanvas");
const profileContext = profileCanvas.getContext("2d");
const colorCanvas = document.querySelector("#colorCanvas");
const colorContext = colorCanvas.getContext("2d");

const outputs = {
  fringeSpacing: document.querySelector("#fringeSpacing"),
  lightKind: document.querySelector("#lightKind"),
};

bindControl("slits", "slitsRange", "slits", true);
bindControl("slitWidthUm", "slitWidthRange", "slitWidthUm");
bindControl("periodUm", "periodUmRange", "periodUm");
bindControl("screenDistance", "screenDistanceRange", "screenDistance");
bindControl("wavelengthNm", "wavelengthRange", "wavelengthNm", true);
bindControl("bandwidthNm", "bandwidthRange", "bandwidthNm", true);
bindControl("screenHalfWidthMm", "screenHalfWidthRange", "screenHalfWidthMm", true);

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

function paramsFromState() {
  return {
    slits: state.slits,
    slitWidth: state.slitWidthUm * 1e-6,
    period: state.periodUm * 1e-6,
    screenDistance: state.screenDistance,
    wavelengthNm: state.wavelengthNm,
    bandwidthNm: state.bandwidthNm,
    screenHalfWidth: state.screenHalfWidthMm * 1e-3,
  };
}

function render() {
  const params = paramsFromState();
  const spacingMm = fringeSpacingM(params) * 1e3;
  outputs.fringeSpacing.textContent = `${spacingMm.toFixed(2)} мм`;
  outputs.lightKind.textContent = params.bandwidthNm <= 0 ? "монохроматический" : "квазимонохроматический";

  const profile = buildProfile(params, 720);
  drawProfile(profileCanvas, profileContext, profile, params);
  drawColorStrip(colorCanvas, colorContext, profile, params);
}

function drawProfile(canvas, context, profile, params) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width * devicePixelRatio));
  const height = Math.max(180, Math.floor(rect.height * devicePixelRatio));
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  const pad = { left: 56, right: 16, top: 16, bottom: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yMin = -params.screenHalfWidth;
  const yMax = params.screenHalfWidth;
  let iMin = 0;
  let iMax = Math.max(...profile.values, 1e-9);

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#cbd5e1";
  context.strokeRect(pad.left, pad.top, plotW, plotH);

  context.strokeStyle = "#2563eb";
  context.lineWidth = 2 * devicePixelRatio;
  context.beginPath();
  profile.ys.forEach((y, index) => {
    const x = pad.left + ((y - yMin) / (yMax - yMin)) * plotW;
    const v = profile.values[index];
    const py = pad.top + (1 - v / iMax) * plotH;
    if (index === 0) context.moveTo(x, py);
    else context.lineTo(x, py);
  });
  context.stroke();

  context.fillStyle = "#334155";
  context.font = `${12 * devicePixelRatio}px sans-serif`;
  context.fillText("I(y)", 8, pad.top + 14);
  context.fillText(`${(yMin * 1e3).toFixed(0)} мм`, pad.left, height - 8);
  context.fillText(`${(yMax * 1e3).toFixed(0)} мм`, pad.left + plotW - 28, height - 8);
}

function drawColorStrip(canvas, context, profile, params) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width * devicePixelRatio));
  const height = Math.max(100, Math.floor(rect.height * devicePixelRatio));
  canvas.width = width;
  canvas.height = height;
  const image = context.createImageData(width, height);
  const spectrum = profile.spectrum;
  const yMin = -params.screenHalfWidth;
  const yMax = params.screenHalfWidth;

  for (let x = 0; x < width; x += 1) {
    const y = yMin + ((x / (width - 1)) * (yMax - yMin));
    let r = 0;
    let g = 0;
    let b = 0;
    if (params.bandwidthNm <= 0) {
      const I = fraunhoferIntensity(y, params);
      const rgb = wavelengthToRgb(params.wavelengthNm);
      r = I * rgb[0];
      g = I * rgb[1];
      b = I * rgb[2];
    } else {
      for (const sample of spectrum) {
        const I = fraunhoferIntensity(y, { ...params, wavelengthNm: sample.wavelengthNm });
        const rgb = wavelengthToRgb(sample.wavelengthNm);
        r += I * sample.weight * rgb[0];
        g += I * sample.weight * rgb[1];
        b += I * sample.weight * rgb[2];
      }
    }
    const max = Math.max(r, g, b, 1e-9);
    for (let row = 0; row < height; row += 1) {
      const idx = (row * width + x) * 4;
      image.data[idx] = Math.round((255 * r) / max);
      image.data[idx + 1] = Math.round((255 * g) / max);
      image.data[idx + 2] = Math.round((255 * b) / max);
      image.data[idx + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
}
