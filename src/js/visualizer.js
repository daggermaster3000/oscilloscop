let bufferLength;
let dataArray;
let stereoDataLeft;
let stereoDataRight;
let smoothedData = [];
let afterglowOpacity = 0.92;
let lineWidth = 2;
let smoothingFactor = 0.2;

// Keep existing afterglow controls intact for settings URL and UI

// Create knob controls
const knobContainer = document.getElementById("knobControls");

const afterglowKnob = new Knob(knobContainer, {
  label: 'Afterglow',
  min: 0,
  max: 1.5,
  step: 0.01,
  value: afterglowOpacity,
  onChange: (value) => {
    afterglowOpacity = value;
  }
});

const lineWidthKnob = new Knob(knobContainer, {
  label: 'Line Width',
  min: 1,
  max: 10,
  step: 0.5,
  value: lineWidth,
  onChange: (value) => {
    lineWidth = value;
  }
});

const smoothingKnob = new Knob(knobContainer, {
  label: 'Smoothing',
  min: 0,
  max: 0.95,
  step: 0.05,
  value: smoothingFactor,
  onChange: (value) => {
    smoothingFactor = value;
  }
});

// Update knob themes when the main theme changes
function updateKnobThemes(newTheme) {
  afterglowKnob.updateTheme(newTheme);
  lineWidthKnob.updateTheme(newTheme);
  smoothingKnob.updateTheme(newTheme);
}

function clearBackground() {
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function applyAfterglowEffect() {
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - afterglowOpacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid(mode) {
  const stepX = 100;
  const stepY = 100;
  const width = canvas.width;
  const height = canvas.height;

  // Save the current canvas state
  ctx.save();
  
  // Reset canvas transformations and settings
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  
  ctx.strokeStyle = theme.border + "33";
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.fillStyle = theme.label;
    ctx.fillText(mode === "fft" ? `${Math.round(x / width * audioCtx.sampleRate / 2)} Hz` : `${Math.round(x * 1000 / audioCtx.sampleRate)} ms`, x + 4, 12);
  }

  for (let y = 0; y <= height; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = theme.border + "66";
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Restore the previous canvas state
  ctx.restore();
}

function drawGrain() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 10;
    data[i] += grain;
    data[i + 1] += grain;
    data[i + 2] += grain;
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawWaveform() {
  analyser.getByteTimeDomainData(dataArray);

  const width = canvas.width;
  const height = canvas.height;
  const sliceWidth = width / bufferLength;

  applyAfterglowEffect();
  drawGrid("waveform");

  if (smoothedData.length !== bufferLength) {
    smoothedData = new Array(bufferLength).fill(height / 2);
  }

  const points = [];
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const targetY = (dataArray[i] / 128.0) * (height / 2);
    smoothedData[i] += (targetY - smoothedData[i]) * smoothingFactor;
    const y = smoothedData[i];
    points.push({ x, y });
    x += sliceWidth;
  }

  ctx.save();

  if (theme.cartoon) {
    ctx.fillStyle = "#C8F4FF";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FFD5D5";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.lineWidth = theme.cartoon ? lineWidth + 1 : lineWidth;
  ctx.strokeStyle = theme.cartoon ? "black" : theme.glow;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  ctx.restore();
  drawGrain();
}

function drawFFT() {
  analyser.getByteFrequencyData(dataArray);
  applyAfterglowEffect();
  drawGrid("fft");

  ctx.save();

  const width = canvas.width;
  const height = canvas.height;
  const barWidth = (width / bufferLength) * lineWidth;

  ctx.fillStyle = theme.glow;
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] * 1.2;
    ctx.fillRect(i * (width / bufferLength), height - barHeight, barWidth, barHeight);
  }

  ctx.restore();
  drawGrain();
}

function drawStereoPhase() {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) * 0.4;

  applyAfterglowEffect();
  drawGrid("stereo");

  ctx.save();

  analyserLeft.getByteTimeDomainData(stereoDataLeft);
  analyserRight.getByteTimeDomainData(stereoDataRight);

  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = theme.cartoon ? lineWidth + 1 : lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;
  ctx.beginPath();

  for (let i = 0; i < bufferLength; i++) {
    const x = ((stereoDataLeft[i] / 128.0) - 1) * scale + centerX;
    const y = ((stereoDataRight[i] / 128.0) - 1) * scale + centerY;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();

  ctx.fillStyle = theme.label;
  ctx.font = "12px monospace";
  ctx.fillText("Left Channel", 10, height - 10);
  ctx.fillText("Right Channel", width - 100, height - 10);

  ctx.restore();
  drawGrain();
}

analyserLeft.fftSize = 2048;
analyserRight.fftSize = 2048;
stereoDataLeft = new Uint8Array(analyserLeft.frequencyBinCount);
stereoDataRight = new Uint8Array(analyserRight.frequencyBinCount); 

// Store previous waveforms to make a sheet
const waveformHistory = [];
const maxHistory = 50; // number of slices in the sheet

function draw3DWaveformflat() {
  analyser.getByteTimeDomainData(dataArray);

  

  // Save current waveform snapshot
  const snapshot = Array.from(dataArray);
  waveformHistory.unshift(snapshot);
  if (waveformHistory.length > maxHistory) {
    waveformHistory.pop();
  }

  applyAfterglowEffect();
  drawGrid("3dsheet");

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  const perspective = 600;   // camera distance
  const amplitude = canvas.height / 4; 
  const sliceWidth = canvas.width / bufferLength;
  const depthSpacing = 10;   // distance between sheets in Z

  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;

  // Loop through history and draw each waveform as a layer in Z
  for (let h = 0; h < waveformHistory.length; h++) {
    const waveform = waveformHistory[h];
    const z3d = -h * depthSpacing;

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${(h * 6) % 360}, 100%, 60%, 0.7)`; // rainbow fade by depth

    for (let i = 0; i < bufferLength; i++) {
      const v = (waveform[i] / 128.0) - 1.0;
      const x3d = (i - bufferLength / 2) * sliceWidth * 0.6;
      const y3d = v * amplitude * smoothingFactor;

      // optional rotation around Y axis
      const angle = performance.now() * 0.0003;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const xRot = x3d * cosA - z3d * sinA;
      const zRot = x3d * sinA + z3d * cosA;

      // perspective projection
      const scale = perspective / (perspective - zRot);
      const x2d = xRot //* scale;
      const y2d = y3d //* scale;

      if (i === 0) ctx.moveTo(x2d, y2d);
      else ctx.lineTo(x2d, y2d);
    }
    ctx.stroke();
  }

  ctx.restore();
  drawGrain();
}


function draw3DWaveformtop() {
  analyser.getByteTimeDomainData(dataArray);

  // Save current waveform snapshot
  const snapshot = Array.from(dataArray);
  waveformHistory.unshift(snapshot);
  if (waveformHistory.length > maxHistory) {
    waveformHistory.pop();
  }

  applyAfterglowEffect();
  drawGrid("3dsheet");

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  const perspective = 600;   // camera distance
  const amplitude = canvas.height / 4; 
  const sliceWidth = canvas.width / bufferLength;
  const depthSpacing = 10;   // distance between sheets in Z

  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;

  // Loop through history and draw each waveform as a layer in Z
  for (let h = 0; h < waveformHistory.length; h++) {
  const waveform = waveformHistory[h];
  const z3d = -h * depthSpacing;

  ctx.beginPath();
  ctx.strokeStyle = `hsla(${(h * 6) % 360}, 100%, 60%, 0.7)`; // rainbow fade by depth

  for (let i = 0; i < bufferLength; i++) {
    const v = (waveform[i] / 128.0) - 1.0;
    const x3d = (i - bufferLength / 2) * sliceWidth * 0.6;
    const y3d = v * amplitude * smoothingFactor;

    // --- tilt view around X-axis (top-down skew) ---
    const tilt = -Math.PI / 3; // adjust: -90° is full top view, -60°/-45° looks nicer
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    const yTilt = y3d * cosT - z3d * sinT;
    const zTilt = y3d * sinT + z3d * cosT;

    // perspective projection
    const scale = perspective / (perspective - zTilt);
    const x2d = x3d * scale;
    const y2d = yTilt * scale;

    if (i === 0) ctx.moveTo(x2d, y2d);
    else ctx.lineTo(x2d, y2d);
  }

  ctx.stroke();
}


  ctx.restore();
  drawGrain();
}

function draw3DSpectrogram() {
  analyser.getByteFrequencyData(dataArray);

  const snapshot = Array.from(dataArray);
  waveformHistory.unshift(snapshot);
  if (waveformHistory.length > maxHistory) waveformHistory.pop();

  applyAfterglowEffect();
  drawGrid("3dsheet");

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 1.5);

  const perspective = 750;
  const amplitude = canvas.height / 3; 
  const sliceWidth = canvas.width / bufferLength / 2;
  const depthSpacing = 20;
  const tilt = -Math.PI / 4;

  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const step = Math.floor(bufferLength / 256); // draw fewer points

  ctx.lineWidth = 2;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;

 

  for (let h = 0; h < waveformHistory.length; h++) {
    const spectrum = waveformHistory[h];
    const z3d = -h * depthSpacing;

    ctx.beginPath();

    for (let i = 0; i < bufferLength; i += step) {
      const freqAmp = spectrum[i] / 255.0;
      const x3d = (i - bufferLength / 2) * sliceWidth;
      const y3d = -freqAmp * amplitude * smoothingFactor;

      const yTilt = y3d * cosT - z3d * sinT;
      const zTilt = y3d * sinT + z3d * cosT;
      const scale = perspective / (perspective - zTilt);
      const x2d = x3d * scale;
      const y2d = yTilt * scale;

      ctx.strokeStyle = theme.glow;

      if (i === 0) ctx.moveTo(x2d, y2d);
      else ctx.lineTo(x2d, y2d);
    }

    ctx.stroke();
  }

  ctx.restore();
  drawGrain();
}

function draw2DSpectrogram() {
  // Get current frequency data
  analyser.getByteFrequencyData(dataArray);

  const width = canvas.width;
  const height = canvas.height;
  const barHeight = height / bufferLength;

  // Shift existing image left by 1px to make space for new column
  const imageData = ctx.getImageData(1, 0, width - 1, height);
  ctx.putImageData(imageData, 0, 0);

  // Draw the new column on the right
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i] / 255.0;
    ctx.fillStyle = amplitudeToColor(value);
    const y = height - i * barHeight;
    ctx.fillRect(width - 1, y, 1, barHeight);
  }

  //drawGrid("2dsheet");
  //drawGrain();
}

// Map amplitude → heatmap color (blue → cyan → yellow → red)
function amplitudeToColor(a) {
  const hue = (240 - a * 240) % 360; // 240=blue, 0=red
  const lightness = 40 + a * 40;
  return `hsl(${hue}, 100%, ${lightness}%)`;
}

function drawParticleCloud() {
  // Build amplitude array in [0,1] using either FFT or signal
  const responseMode = window.particleResponseMode || 'fft';
  const amplitudeArray = new Float32Array(bufferLength);
  if (responseMode === 'signal') {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    let maxAmp = 0;
    for (let i = 0; i < bufferLength; i++) {
      const centered = Math.abs(dataArray[i] - 128) / 128; // 0..1
      amplitudeArray[i] = centered;
      sum += centered;
      if (centered > maxAmp) maxAmp = centered;
    }
    var avgAmp = sum / bufferLength;
    var normMax = maxAmp;
  } else {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    let maxAmp = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      amplitudeArray[i] = v;
      sum += dataArray[i];
      if (dataArray[i] > maxAmp) maxAmp = dataArray[i];
    }
    var avgAmp = sum / bufferLength / 255;
    var normMax = maxAmp / 255;
  }
  const normAmp = avgAmp;
  const beatThreshold = 0.9;
  const isBeat = normMax > beatThreshold;

  ctx.fillStyle = theme.background || "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
    
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  const perspective = 500;
  const radius = 200;

  // Rotation angles
  const rot = window.particleRotation || { enableX:true, enableY:true, enableZ:false, speedX:0.3, speedY:0.6, speedZ:0.2 };
  const now = performance.now() / 1000;
  const xAngle = rot.enableX ? now * rot.speedX : 0;
  const yAngle = rot.enableY ? now * rot.speedY : 0;
  const zAngle = rot.enableZ ? now * rot.speedZ : 0;
  const inertia = 1;
  const t = performance.now() / 1000;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // map particle to amplitude bin uniformly
    const ampIndex = Math.floor((i / particles.length) * bufferLength);
    const amp = amplitudeArray[ampIndex];
    const a = normAmp; // average amplitude

    // evaluate parametric equations
    const xEq = eqXFunc ? eqXFunc(p.u, p.v, t, a) : p.x;
    const yEq = eqYFunc ? eqYFunc(p.u, p.v, t, a) : p.y;
    const zEq = eqZFunc ? eqZFunc(p.u, p.v, t, a) : p.z;

    // radius modulation by instantaneous bin amplitude
    const r = radius * (1 + 0.5 * amp);

    // rotate around X, then Y, then Z
    // X rotation
    let xR = xEq;
    let yR = yEq * Math.cos(xAngle) - zEq * Math.sin(xAngle);
    let zR = yEq * Math.sin(xAngle) + zEq * Math.cos(xAngle);
    // Y rotation
    const xR2 = xR * Math.cos(yAngle) + zR * Math.sin(yAngle);
    const zR2 = -xR * Math.sin(yAngle) + zR * Math.cos(yAngle);
    const yR2 = yR;
    // Z rotation
    const xRot = xR2 * Math.cos(zAngle) - yR2 * Math.sin(zAngle);
    const yRot = xR2 * Math.sin(zAngle) + yR2 * Math.cos(zAngle);
    const zRot = zR2;

    const scale = perspective / (perspective + zRot * r);
    const size = p.size;

    ctx.fillStyle = theme.glow;
    ctx.beginPath();
    ctx.arc(xRot * r * scale, yRot * r * scale, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawGrid("2dsheet");
  drawGrain();
}

// --- New Modes ---
function drawFourierSeriesShape() {
  analyser.getByteTimeDomainData(dataArray);

  applyAfterglowEffect();
  drawGrid("fourier");

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.25;

  // Build Fourier-like series coefficients from audio
  const settings = window.fourierSettings || { harmonics: 16, contribution: 0.2 };
  const HARMONICS = Math.max(1, Math.min(128, settings.harmonics | 0));
  const CONTRIB = Math.max(0, Math.min(1, settings.contribution));
  const coeffs = new Array(HARMONICS).fill(0);
  for (let k = 1; k <= HARMONICS; k++) {
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const tt = i / bufferLength;
      const v = (dataArray[i] - 128) / 128;
      sum += v * Math.sin(2 * Math.PI * k * tt);
    }
    coeffs[k - 1] = sum / bufferLength;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const t = i / 360;
    let r = radius;
    for (let k = 1; k <= HARMONICS; k++) {
      r += coeffs[k - 1] * (radius * CONTRIB) / k;
    }
    const angle = 2 * Math.PI * t;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;
  ctx.stroke();
  ctx.restore();
  drawGrain();
}

function drawPolygonMorph() {
  analyser.getByteTimeDomainData(dataArray);
  applyAfterglowEffect();
  drawGrid("poly");

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.3;

  // Number of sides morphs with average amplitude
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) sum += Math.abs(dataArray[i] - 128) / 128;
  const avg = sum / bufferLength;
  const sides = Math.max(3, Math.floor(3 + avg * 9)); // 3 .. 12

  // Rotation animates over time
  const angleOffset = performance.now() * 0.0008 * (1 + avg);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const t = i / sides;
    // radius warps slightly by instantaneous signal
    const idx = Math.min(bufferLength - 1, Math.floor(t * (bufferLength - 1)));
    const warp = (Math.abs(dataArray[idx] - 128) / 128) * 0.25;
    const r = baseR * (0.8 + warp);
    const angle = angleOffset + t * Math.PI * 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;
  ctx.stroke();
  ctx.restore();
  drawGrain();
}

function drawHarmonicOrbitals() {
  // Use frequency magnitudes for orbital radii
  analyser.getByteFrequencyData(dataArray);
  applyAfterglowEffect();
  drawGrid("orbitals");

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.12;

  // Number of orbitals tied to Fourier harmonics setting for consistency
  const settings = window.fourierSettings || { harmonics: 16 };
  const N = Math.max(4, Math.min(48, settings.harmonics));
  const t = performance.now() / 1000;

  const orbitals = window.orbitalsSettings || { enable3D:true, tiltDeg:-30, depth:700, spin:0.4, showPaths:true, planetSize:3 };
  const enable3D = !!orbitals.enable3D;
  const tilt = (orbitals.tiltDeg || -30) * Math.PI / 180;
  const depth = orbitals.depth || 700;
  const spin = orbitals.spin || 0.4;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = theme.cartoon ? 0 : 10;
  ctx.shadowColor = theme.glow;

  const showPaths = (window.orbitalsSettings && window.orbitalsSettings.showPaths) ? true : false;
  const planetSizeBase = (window.orbitalsSettings && window.orbitalsSettings.planetSize) ? window.orbitalsSettings.planetSize : 3;
  for (let k = 1; k <= N; k++) {
    const idx = Math.floor((k / N) * (bufferLength - 1));
    const amp = (dataArray[idx] / 255);
    const orbitR = baseR * (k * 0.5) * (0.8 + amp);
    const speed = spin * (0.2 + 0.05 * k);
    const angle = t * speed * 2 * Math.PI;

    // orbit path
    if (showPaths) {
      if (!enable3D) {
        ctx.beginPath();
        ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // draw elliptical path due to tilt
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const a2 = (i / steps) * Math.PI * 2;
          const x3 = orbitR * Math.cos(a2);
          const y3 = orbitR * Math.sin(a2) * Math.cos(tilt);
          const z3 = orbitR * Math.sin(a2) * Math.sin(tilt);
          const scale = depth / (depth - z3);
          const x2 = x3 * scale;
          const y2 = y3 * scale;
          if (i === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }
    }

    // planet position
    const px3 = orbitR * Math.cos(angle);
    const py3 = orbitR * Math.sin(angle) * (enable3D ? Math.cos(tilt) : 1);
    const pz3 = enable3D ? orbitR * Math.sin(angle) * Math.sin(tilt) : 0;
    const scaleP = depth / (depth - pz3);
    const px = px3 * scaleP;
    const py = py3 * scaleP;
    ctx.beginPath();
    ctx.fillStyle = theme.glow;
    ctx.arc(px, py, Math.max(1.0, planetSizeBase * (0.6 + amp)) * scaleP, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawGrain();
}

// --- Game of Life influenced by audio ---
let golGrid = null;
let golCols = 0;
let golRows = 0;
let golCellSize = 3; // px
function initGameOfLife() {
  golCols = Math.floor(canvas.width / golCellSize);
  golRows = Math.floor(canvas.height / golCellSize);
  golGrid = new Array(golRows);
  for (let y = 0; y < golRows; y++) {
    golGrid[y] = new Array(golCols).fill(0);
  }
  // dense initial seed for visibility
  for (let y = 0; y < golRows; y++) {
    for (let x = 0; x < golCols; x++) {
      if (Math.random() < 0.18) golGrid[y][x] = 1;
    }
  }
}

function drawGameOfLife() {
  // allow runtime change in cell size via settings
  if (window.golSettings && window.golSettings.cellSize && golCellSize !== window.golSettings.cellSize) {
    golCellSize = window.golSettings.cellSize;
    golGrid = null;
  }
  if (!golGrid || golCols !== Math.floor(canvas.width / golCellSize) || golRows !== Math.floor(canvas.height / golCellSize)) {
    initGameOfLife();
  }

  // get audio amplitude to influence randomness
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) sum += Math.abs(dataArray[i] - 128) / 128;
  const avg = sum / bufferLength;

  // occasional reseed or noise injection proportional to audio
  const reseedBase = window.golSettings ? window.golSettings.reseed : 0.3;
  const seedProb = Math.min(0.6, reseedBase + avg * 0.5);
  for (let y = 0; y < golRows; y++) {
    for (let x = 0; x < golCols; x++) {
      if (Math.random() < seedProb * 0.003) golGrid[y][x] = 1;
    }
  }

  // apply GoL rules
  const next = new Array(golRows);
  for (let y = 0; y < golRows; y++) {
    next[y] = new Array(golCols).fill(0);
    for (let x = 0; x < golCols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const yy = (y + dy + golRows) % golRows;
          const xx = (x + dx + golCols) % golCols;
          n += golGrid[yy][xx];
        }
      }
      const alive = golGrid[y][x] === 1;
      // S23/B3 with audio-driven boosts to prolong life
      if (alive) {
        const survivalThresh = window.golSettings ? window.golSettings.survivalBoost : 0.45;
        if (n === 2 || n === 3 || (avg > survivalThresh && n === 1)) next[y][x] = 1;
      } else {
        const birthThresh = window.golSettings ? window.golSettings.birthBoost : 0.3;
        if (n === 3 || (avg > birthThresh && n === 2)) next[y][x] = 1;
      }
    }
  }
  golGrid = next;

  applyAfterglowEffect();
  // draw
  ctx.save();
  ctx.fillStyle = theme.glow;
  for (let y = 0; y < golRows; y++) {
    for (let x = 0; x < golCols; x++) {
      if (golGrid[y][x]) {
        ctx.fillRect(x * golCellSize, y * golCellSize, golCellSize - 1, golCellSize - 1);
      }
    }
  }
  ctx.restore();
  drawGrain();
}

// --- Mood-Based Visualizations ---

function drawMoodVisualization() {
  const mood = window.yamnetClassifier ? window.yamnetClassifier.getCurrentMood() : { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
  
  applyAfterglowEffect();
  drawGrid("mood");
  
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Draw mood circle with intensity-based size
  const baseRadius = Math.min(width, height) * 0.15;
  const radius = baseRadius * (1 + mood.intensity * 2);
  
  // Create gradient
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, mood.color + '80');
  gradient.addColorStop(0.7, mood.color + '40');
  gradient.addColorStop(1, mood.color + '10');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw mood text
  ctx.fillStyle = theme.glow;
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(mood.mood.toUpperCase(), 0, -10);
  
  // Draw confidence bar
  const barWidth = radius * 1.5;
  const barHeight = 8;
  const barY = 20;
  
  ctx.fillStyle = theme.border + '40';
  ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
  
  ctx.fillStyle = mood.color;
  ctx.fillRect(-barWidth/2, barY, barWidth * mood.confidence, barHeight);
  
  // Draw intensity rings
  for (let i = 1; i <= 3; i++) {
    const ringRadius = radius * (1 + i * 0.3);
    const alpha = (1 - i * 0.3) * mood.intensity * 0.3;
    ctx.strokeStyle = mood.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
  drawGrain();
}

function drawMoodResponsiveWaveform() {
  const mood = window.yamnetClassifier ? window.yamnetClassifier.getCurrentMood() : { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
  
  analyser.getByteTimeDomainData(dataArray);
  
  const width = canvas.width;
  const height = canvas.height;
  const sliceWidth = width / bufferLength;
  
  applyAfterglowEffect();
  drawGrid("waveform");
  
  if (smoothedData.length !== bufferLength) {
    smoothedData = new Array(bufferLength).fill(height / 2);
  }
  
  const points = [];
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const targetY = (dataArray[i] / 128.0) * (height / 2);
    smoothedData[i] += (targetY - smoothedData[i]) * smoothingFactor;
    const y = smoothedData[i];
    points.push({ x, y });
    x += sliceWidth;
  }
  
  ctx.save();
  
  // Mood-responsive styling
  const moodIntensity = mood.intensity;
  const lineWidth = 2 + moodIntensity * 6;
  const glowIntensity = 5 + moodIntensity * 15;
  
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = mood.color;
  ctx.shadowBlur = glowIntensity;
  ctx.shadowColor = mood.color;
  
  // Draw main waveform
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  
  // Draw mood-responsive overlay
  if (moodIntensity > 0.7) {
    ctx.strokeStyle = mood.color + '60';
    ctx.lineWidth = lineWidth * 0.5;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const offset = Math.sin(i * 0.1 + performance.now() * 0.005) * 10 * moodIntensity;
      if (i === 0) ctx.moveTo(p.x, p.y + offset);
      else ctx.lineTo(p.x, p.y + offset);
    });
    ctx.stroke();
  }
  
  ctx.restore();
  drawGrain();
}

function drawMoodResponsiveParticles() {
  const mood = window.yamnetClassifier ? window.yamnetClassifier.getCurrentMood() : { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
  
  // Build amplitude array using FFT
  const amplitudeArray = new Float32Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  let maxAmp = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 255;
    amplitudeArray[i] = v;
    sum += dataArray[i];
    if (dataArray[i] > maxAmp) maxAmp = dataArray[i];
  }
  const avgAmp = sum / bufferLength / 255;
  const normMax = maxAmp / 255;
  
  ctx.fillStyle = theme.background || "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  const perspective = 500;
  const baseRadius = 200;
  const moodRadius = baseRadius * (1 + mood.intensity * 1.5);
  
  // Mood-responsive rotation
  const rot = window.particleRotation || { enableX:true, enableY:true, enableZ:false, speedX:0.3, speedY:0.6, speedZ:0.2 };
  const moodMultiplier = 1 + mood.intensity * 2;
  const now = performance.now() / 1000;
  const xAngle = rot.enableX ? now * rot.speedX * moodMultiplier : 0;
  const yAngle = rot.enableY ? now * rot.speedY * moodMultiplier : 0;
  const zAngle = rot.enableZ ? now * rot.speedZ * moodMultiplier : 0;
  
  const t = performance.now() / 1000;
  
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const ampIndex = Math.floor((i / particles.length) * bufferLength);
    const amp = amplitudeArray[ampIndex];
    const a = avgAmp;
    
    // Mood-responsive equations
    let xEq, yEq, zEq;
    if (mood.mood === 'energetic' || mood.mood === 'intense') {
      xEq = Math.sin(Math.PI * p.v) * Math.cos(2 * Math.PI * p.u + t * 2);
      yEq = Math.sin(Math.PI * p.v) * Math.sin(2 * Math.PI * p.u + t * 2);
      zEq = Math.cos(Math.PI * p.v) + Math.sin(t * 3) * 0.5;
    } else if (mood.mood === 'ambient' || mood.mood === 'peaceful') {
      xEq = Math.sin(Math.PI * p.v) * Math.cos(2 * Math.PI * p.u) * (1 + Math.sin(t * 0.5) * 0.1);
      yEq = Math.sin(Math.PI * p.v) * Math.sin(2 * Math.PI * p.u) * (1 + Math.sin(t * 0.5) * 0.1);
      zEq = Math.cos(Math.PI * p.v) + Math.sin(t * 0.3) * 0.2;
    } else {
      // Default sphere with mood influence
      xEq = Math.sin(Math.PI * p.v) * Math.cos(2 * Math.PI * p.u);
      yEq = Math.sin(Math.PI * p.v) * Math.sin(2 * Math.PI * p.u);
      zEq = Math.cos(Math.PI * p.v);
    }
    
    const r = moodRadius * (1 + 0.5 * amp);
    
    // Apply rotations
    let xR = xEq;
    let yR = yEq * Math.cos(xAngle) - zEq * Math.sin(xAngle);
    let zR = yEq * Math.sin(xAngle) + zEq * Math.cos(xAngle);
    
    const xR2 = xR * Math.cos(yAngle) + zR * Math.sin(yAngle);
    const zR2 = -xR * Math.sin(yAngle) + zR * Math.cos(yAngle);
    const yR2 = yR;
    
    const xRot = xR2 * Math.cos(zAngle) - yR2 * Math.sin(zAngle);
    const yRot = xR2 * Math.sin(zAngle) + yR2 * Math.cos(zAngle);
    const zRot = zR2;
    
    const scale = perspective / (perspective + zRot * r);
    const size = p.size * (1 + mood.intensity * 0.5);
    
    // Mood-responsive color
    const hue = mood.color.includes('#') ? mood.color : '#74b9ff';
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.arc(xRot * r * scale, yRot * r * scale, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  drawGrid("2dsheet");
  drawGrain();
}
