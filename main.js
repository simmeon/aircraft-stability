import * as math from "mathjs";
import { stateSpaceMatrices, aircraftProperties, steadyState1, steadyState2, steadyState3, coeffs as defaultCoeffs } from "./state_space";
import * as SOLVER from "./solver";
import Chart from "chart.js/auto";

// === Constants ===
const RAD2DEG = 180 / math.pi;
const DEG2RAD = math.pi / 180;
const dt = 0.004; // simulation step in seconds
const chartUpdatePeriod = 0.02; // chart update interval in seconds
const historyPeriod = 60; // seconds of history shown on chart
const numStreamlines = 200;

// === HTML Elements ===
const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const perturbButton = document.getElementById("perturbButton");
const resetCoeffsButton = document.getElementById("resetCoeffsButton");
const aircraftCanvas = document.getElementById("aircraftCanvas");
const aircraftCtx = aircraftCanvas.getContext("2d");
const playIcon = document.getElementById('playPauseIcon');

// === Assests ===
const aircraftImg = new Image();
aircraftImg.src = "aircraft.png";
const playImg = new Image();
playImg.src = "play.png";
const pauseImg = new Image();
pauseImg.src = "pause.png";

// Clone defaults so we can modify them
const coeffs = { ...defaultCoeffs };

// Toggle check functions
const showWind = () => document.getElementById("toggleWind").checked;
const showBodyAxes = () => document.getElementById("toggleBodyAxes").checked;
const showInertialAxes = () => document.getElementById("toggleInertialAxes").checked;

// === System Setup ===
let ss = steadyState1;
let { A, B } = stateSpaceMatrices(aircraftProperties, ss, coeffs);
const x0 = [0, 0, 0, 0];
let de = 0;
let x = [...x0];

// === Simulation State ===
let isRunning = true;
let accumulatedTime = 0;
let lastUpdateTime = performance.now();
let lastChartUpdate = performance.now();
const bufferSize = Math.round(historyPeriod / dt);
const stateHistory = new Array(bufferSize).fill([...x0]);
let bufferIndex = 1;
let bufferFull = false;


// === Chart Setup ===
const ctx = document.getElementById("stateChart").getContext("2d");
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: 'black',
      borderColor: 'black',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 6,
      hitRadius: 10, 
    }]
  },
  options: {
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' },
        ticks: { stepSize: 1, maxTicksLimit: 10 }
      },
      y: {
        type: 'linear',
        title: { display: false,},
        ticks: { maxTicksLimit: 5 },
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
          lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1
        }
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false
      },
      legend: { display: false },
      decimation: {
        enabled: true
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    animation: false
  }
});
let activeStateIndex = 0;

// === Pole Chart Setup ===
const poleCtx = document.getElementById("poleChart").getContext("2d");
const poleChart = new Chart(poleCtx, {
  type: 'scatter',
  data: {
    datasets: [{
      label: 'System Poles',
      data: [],
      backgroundColor: 'red',
      borderColor: 'red',
      pointRadius: 6,
      pointStyle: 'crossRot',
      pointHoverRadius: 8,
      pointBorderWidth: 2
    }]
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Real' },
        min: -2,
        max: 1,
        grid: { color: ctx => ctx.tick.value === 0 ? 'black' : 'rgba(0,0,0,0.1)', lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1 }
      },
      y: {
        type: 'linear',
        title: { display: true, text: 'Imag' },
        min: -2,
        max: 2,
        grid: { color: ctx => ctx.tick.value === 0 ? 'black' : 'rgba(0,0,0,0.1)', lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1 }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const x = context.raw.x;
            const y = context.raw.y;
            const omega_n = Math.sqrt(x * x + y * y);
            const freqHz = omega_n / (2 * Math.PI);
            const zeta = -x / omega_n;
            return [
              `λ = ${x.toFixed(2)} ${y >= 0 ? '+' : '-'} ${Math.abs(y).toFixed(2)}j`,
              `fₙ = ${freqHz.toFixed(2)} Hz`,
              `ζ = ${zeta.toFixed(2)}`
            ];
          }
        }
      },
      legend: { display: false }
    }
  }
});

function mainLoop() {
  if (!isRunning) return;
  const now = performance.now();
  let deltaTime = (now - lastUpdateTime) / 1000;
  lastUpdateTime = now;
  accumulatedTime += deltaTime;

  while (accumulatedTime >= dt) {
    x = SOLVER.eulerStep(x, de, A, B, dt);
    stateHistory[bufferIndex] = [...x];
    bufferIndex = (bufferIndex + 1) % bufferSize;
    if (bufferIndex === 0) bufferFull = true;
    accumulatedTime -= dt;
  }

  if ((now - lastChartUpdate) / 1000 > chartUpdatePeriod) {
    updateChart();
    drawAircraft();
    lastChartUpdate = now;
  }

  requestAnimationFrame(mainLoop);
}

function getOrderedStateHistory() {
  return bufferFull ? stateHistory.slice(bufferIndex).concat(stateHistory.slice(0, bufferIndex)) : stateHistory.slice(0, bufferIndex);
}

function updateChart() {
  const orderedHistory = getOrderedStateHistory();
  let dataArray = orderedHistory.map(state => state[activeStateIndex]);
  if (activeStateIndex >= 1) dataArray = dataArray.map(rad => rad * RAD2DEG);

  const padValue = dataArray[0] || 0;
  const padded = new Array(bufferSize - dataArray.length).fill(padValue).concat(dataArray);
  const tArray = Array.from({ length: bufferSize }, (_, i) => (i - bufferSize + 1) * dt);

  chart.data.labels = tArray;
  chart.data.datasets[0].data = padded;

  const maxAbs = Math.max(...padded.map(Math.abs), 0.1);
  chart.options.scales.y.min = -maxAbs * 1.1;
  chart.options.scales.y.max = maxAbs * 1.1;

  // Update label based on selected state
  const stateLabels = ['Δu (m/s)', 'Δα (deg)', 'Δq (deg/s)', 'Δθ (deg)'];
  chart.data.datasets[0].label = stateLabels[activeStateIndex];

  chart.update();
}

// === Visualisation Config ===
let aircraftImgWidth = aircraftCanvas.getBoundingClientRect().width * 0.5;
let aircraftImgHeight = (2 / 3) * aircraftImgWidth;
let metersToPixels = aircraftImgWidth / 8.5344; // 28 ft in meters

// === Streamline Particles ===
const streamlineParticles = Array.from({ length: numStreamlines }, () => ({
  x: Math.random() * aircraftCanvas.getBoundingClientRect().width * 2,
  y: Math.random() * aircraftCanvas.getBoundingClientRect().height,
}));

// === Main Drawing Function ===
function drawAircraft() {
  const ctx = aircraftCtx;
  ctx.clearRect(0, 0, aircraftCanvas.getBoundingClientRect().width, aircraftCanvas.getBoundingClientRect().height);

  // === Aircraft State ===
  const [du, dalpha, , dtheta] = x;
  const u1 = ss.TAS;
  const aph1 = ss.alpha;
  const tht1 = ss.theta;

  const u = u1 + du;
  const alpha = aph1 + dalpha;
  const theta = tht1 + dtheta;
  const w = u1 * alpha; // consistent with EOM assumption

  // === Velocity Vectors ===
  const Vt_body = { x: u, z: w };
  const Vt_inertial = rotateVector(Vt_body, theta); // aircraft velocity in inertial frame
  const windVector = scaleVector(Vt_inertial, -1);   // relative wind = -Vt
  const windMag = magnitude(windVector);

  const bodyX_inertial = {
    x: Math.cos(theta),
    z: -Math.sin(theta),
  };

  const bodyZ_inertial = {
    x: Math.sin(theta),
    z: Math.cos(theta),
  };

  const centerX = aircraftCanvas.getBoundingClientRect().width / 2;
  const centerY = aircraftCanvas.getBoundingClientRect().height / 2;
  const vectorLength = 100;

  const comOffset = rotateVector({x: 0.15 * aircraftImgWidth, z: 0.07 * aircraftImgHeight}, theta);
  const elevatorOffset = rotateVector({x: 0.0 * aircraftImgWidth, z: 0.0 * aircraftImgHeight}, theta);

  const originX = centerX + comOffset.x;
  const originY = centerY + comOffset.z;


  // === Draw Scene ===
  drawStreamlines(ctx, windVector, metersToPixels);
  drawAircraftBody(ctx, centerX, centerY, theta);
  drawElevator(ctx, centerX + elevatorOffset.x, centerY + elevatorOffset.z, theta, de);


  if (showWind()) {
  drawArrow(ctx, originX, originY,
            originX - windVector.x / windMag * vectorLength * 2, 
            originY - windVector.z / windMag * vectorLength * 2, 'blue', true, "V_TAS");
}


  if (showBodyAxes()) {
  drawArrow(ctx, originX, originY, 
            originX + bodyX_inertial.x * vectorLength, originY + bodyX_inertial.z * vectorLength, 'red', true, "X_b");
  drawArrow(ctx, originX, originY, 
            originX + bodyZ_inertial.x * vectorLength, originY + bodyZ_inertial.z * vectorLength, 'green', true, "Z_b");
  }

  if (showInertialAxes()) {
    drawInertialAxes(ctx);
  }

}

// === Helpers ===

function drawInertialAxes(ctx) {
  const originX = 20, originY = 20, axisLen = 100;
  drawArrow(ctx, originX, originY, originX + axisLen, originY, 'black', true, "X_i"); // X
  drawArrow(ctx, originX, originY, originX, originY + axisLen, 'black', true, "Z_i"); // Z
}

function drawStreamlines(ctx, windVec, scale) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 100, 255, 0.15)';
  ctx.lineWidth = 2;

  const wind_vx = windVec.x * scale;
  const wind_vy = windVec.z * scale;
  const len = 50;
  const norm = Math.sqrt(wind_vx ** 2 + wind_vy ** 2);
  const dx = (wind_vx / norm) * len;
  const dy = (wind_vy / norm) * len;

  for (let p of streamlineParticles) {
    p.x += wind_vx * chartUpdatePeriod;
    p.y += wind_vy * chartUpdatePeriod;

    if (p.x < -50) {
      p.x = aircraftCanvas.getBoundingClientRect().width + Math.random() * 300;
      p.y = (Math.random() * 2 - 1) * aircraftCanvas.getBoundingClientRect().height * 2;
    }

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dx, p.y - dy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAircraftBody(ctx, x, y, pitchRad) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-pitchRad); // canvas Y-down
  ctx.drawImage(
    aircraftImg,
    -aircraftImgWidth / 2,
    -aircraftImgHeight / 2,
    aircraftImgWidth,
    aircraftImgHeight
  );
  ctx.restore();
}

function drawElevator(ctx, centerX, centerY, theta, de) {
  const tailOffset = rotateVector({ x: -0.35 * aircraftImgWidth, z: 0.05 * aircraftImgHeight }, theta);
  const tailX = centerX + tailOffset.x;
  const tailY = centerY + tailOffset.z;

  const length = 80;
  const totalAngle = theta + de * 3;

  const dx = length * Math.cos(totalAngle);
  const dz = length * Math.sin(totalAngle);

  ctx.save();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tailX - dx, tailY + dz);
  ctx.stroke();
  ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, color = 'black', hasHead = true, label = "") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const headlen = 10;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (hasHead) {
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Optional label
  if (label) {
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const labelOffset = 6;
    ctx.fillText(
      label,
      x2 + labelOffset * Math.cos(angle),
      y2 + labelOffset * Math.sin(angle) + 10
    );
  }
}

// === Math Utilities ===

function rotateVector(vec, angle) {
  // Passive rotation: body → inertial
  return {
    x: vec.x * Math.cos(angle) + vec.z * Math.sin(angle),
    z: -vec.x * Math.sin(angle) + vec.z * Math.cos(angle),
  };
}

function scaleVector(vec, scale) {
  return { x: vec.x * scale, z: vec.z * scale };
}

function magnitude(vec) {
  return Math.sqrt(vec.x ** 2 + vec.z ** 2);
}


function updatePoles() {
  const eig = math.eigs(A);
  const poles = eig.values.map(val => ({ x: math.re(val), y: math.im(val) }));
  poleChart.data.datasets[0].data = poles;
  poleChart.data.datasets[0].backgroundColor = poles.map(p => p.x < 0 ? 'green' : 'red');
  poleChart.data.datasets[0].borderColor = poles.map(p => p.x < 0 ? 'green' : 'red');

  const realMax = Math.max(1, Math.ceil(Math.max(...poles.map(p => Math.abs(p.x))) * 1.2));
  const imagMax = Math.max(1, Math.ceil(Math.max(...poles.map(p => Math.abs(p.y))) * 1.2));

  poleChart.options.scales.x.min = -realMax;
  poleChart.options.scales.x.max = realMax;
  poleChart.options.scales.y.min = -imagMax;
  poleChart.options.scales.y.max = imagMax;
  poleChart.update();
}

const coeffInputs = ["CD_a", "CL_a", "CL_q", "Cm_a", "Cm_adot", "Cm_q"];
coeffInputs.forEach(id => {
  const input = document.getElementById(id);
  const valInput = document.getElementById(id + "_val");

  input.value = coeffs[id];
  valInput.value = coeffs[id];

  input.step = 0.01;

  // Slider → Textbox
  input.addEventListener("input", () => {
    const value = parseFloat(input.value);
    valInput.value = value.toFixed(2);
    coeffs[id] = value;
    ({ A, B } = stateSpaceMatrices(aircraftProperties, ss, coeffs));
    updatePoles();
  });

  // Textbox → Slider
  valInput.addEventListener("input", () => {
    const value = parseFloat(valInput.value);
    if (!isNaN(value)) {
      coeffs[id] = value;
      input.value = value;
      ({ A, B } = stateSpaceMatrices(aircraftProperties, ss, coeffs));
      updatePoles();
    }
  });
});

resetCoeffsButton.onclick = () => {
  coeffInputs.forEach(id => {
    coeffs[id] = defaultCoeffs[id];
    const slider = document.getElementById(id);
    const numberInput = document.getElementById(id + "_val");
    slider.value = coeffs[id];
    numberInput.value = coeffs[id];
  });
  ({ A, B } = stateSpaceMatrices(aircraftProperties, ss, coeffs));
  updatePoles();
};

function handlePlayButtonPress() {
  isRunning = !isRunning;
  playIcon.src = isRunning ? pauseImg.src : playImg.src;
  playIcon.alt = isRunning ? 'Pause' : 'Play';
  if (isRunning) {
    lastUpdateTime = performance.now();
    lastChartUpdate = performance.now();
    accumulatedTime = 0;
    requestAnimationFrame(mainLoop);
  }
}

function handleResetButtonPress() {
  x = [...x0];
  bufferIndex = 0;
  bufferFull = false;
  for (let i = 0; i < bufferSize; i++) stateHistory[i] = [...x0];
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();
  // Reset streamlines
  for (let p of streamlineParticles) {
    p.x = Math.random() * aircraftCanvas.width;
    p.y = (Math.random() * 2 - 1) * aircraftCanvas.height * 2;
  }
  de = ss.de;
}

function deflectElevator(e) {
  e.preventDefault(); 
  de = ss.de - 2 * DEG2RAD; 
}
function resetElevator(e) { 
  e.preventDefault();
  de = 0;
}

playButton.onclick = handlePlayButtonPress;
resetButton.onclick = handleResetButtonPress;
perturbButton.onmousedown = deflectElevator;
perturbButton.onmouseup = resetElevator;

perturbButton.ontouchstart = deflectElevator;
perturbButton.ontouchend = resetElevator;
perturbButton.ontouchcancel = resetElevator;


const tabButtons = document.querySelectorAll(".tab-button");
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeStateIndex = parseInt(button.dataset.index);
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    updateChart();
  });
});

function updateSteadyStateInfo() {
  document.getElementById('altitude').textContent = ss.altitude.toFixed(0);
  document.getElementById('TAS').textContent = ss.TAS.toFixed(2);
  document.getElementById('alpha').textContent = (ss.alpha * RAD2DEG).toFixed(2);
  document.getElementById('CL').textContent = ss.CL_1.toFixed(3);
  document.getElementById('CD').textContent = ss.CD_1.toFixed(3);
  document.getElementById('theta').textContent = (ss.theta * RAD2DEG).toFixed(2);
  document.getElementById('de').textContent = (ss.de * RAD2DEG).toFixed(2);
}

document.getElementById("steadyStateSelect").addEventListener("change", (e) => {
  const selected = e.target.value;
  if (selected === "1") {
    ss = steadyState1;
  } else if (selected === "2") {
    ss = steadyState2;
  } else {
    ss = steadyState3;
  }
  // Rebuild A and B with new steady state
  ({ A, B } = stateSpaceMatrices(aircraftProperties, ss, coeffs));

  // Reset simulation state
  handleResetButtonPress();
  updatePoles();
  updateSteadyStateInfo();
});

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect(); // ← CSS pixel size
  const scale = window.devicePixelRatio || 1;

  // Set internal resolution
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;

  // Scale the context so drawing works in CSS pixels
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // 👇 Return rect for layout-based calculations
  return rect;
}

function resizeCanvases() {
  const aircraftRect = resizeCanvasToDisplaySize(aircraftCanvas);
  
  // Use CSS pixels, not canvas.width
  aircraftImgWidth = aircraftRect.width * 0.5;
  aircraftImgHeight = (2 / 3) * aircraftImgWidth;
  metersToPixels = aircraftImgWidth / 8.5344; // 28 ft in meters

  drawAircraft();

  resizeCanvasToDisplaySize(document.getElementById('stateChart'));
  resizeCanvasToDisplaySize(document.getElementById('poleChart'));

  requestAnimationFrame(() => {
    chart.update();
    poleChart.update();
  });
}

let resizeTimeout;
window.addEventListener('resize', () => {
  resizeCanvases();
  // Clear any previous timer
  clearTimeout(resizeTimeout);

  // Set a new timer to run 1 second after resizing stops
  resizeTimeout = setTimeout(() => {
    poleChart.update();
  }, 1000);
});

// On loaded — immediately resize all canvases:
document.addEventListener("load", resizeCanvases());


updateSteadyStateInfo();
updatePoles();
requestAnimationFrame(mainLoop);
