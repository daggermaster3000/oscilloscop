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
    // Trigger URL update
    if (typeof window.updateURLDebounced === 'function') {
      window.updateURLDebounced();
    }
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
    // Trigger URL update
    if (typeof window.updateURLDebounced === 'function') {
      window.updateURLDebounced();
    }
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
    // Trigger URL update
    if (typeof window.updateURLDebounced === 'function') {
      window.updateURLDebounced();
    }
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  
  // Audio-driven rotation
  const audioRotSettings = window.audioRotationSettings || { enabled: false, source: 'frequency', intensity: 1.0 };
  let audioRotationModifier = 0;
  
  if (audioRotSettings.enabled) {
    if (audioRotSettings.source === 'frequency') {
      // Use average frequency magnitude
      audioRotationModifier = avgAmp * audioRotSettings.intensity;
    } else {
      // Use amplitude variation
      audioRotationModifier = normMax * audioRotSettings.intensity;
    }
  }
  
  const xAngle = rot.enableX ? now * rot.speedX + audioRotationModifier : 0;
  const yAngle = rot.enableY ? now * rot.speedY + audioRotationModifier * 0.8 : 0;
  const zAngle = rot.enableZ ? now * rot.speedZ + audioRotationModifier * 0.6 : 0;
  const inertia = 1;
  const t = performance.now() / 1000;
  
  // Audio morphing
  const morphSettings = window.audioMorphSettings || { enabled: false, source: 'frequency', intensity: 0.5 };
  let morphModifier = 0;
  
  if (morphSettings.enabled) {
    if (morphSettings.source === 'frequency') {
      morphModifier = avgAmp * morphSettings.intensity;
    } else {
      morphModifier = normMax * morphSettings.intensity;
    }
  }
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // map particle to amplitude bin uniformly
    const ampIndex = Math.floor((i / particles.length) * bufferLength);
    const amp = amplitudeArray[ampIndex];
    const a = normAmp; // average amplitude

    // Apply morphing to the amplitude parameter
    const morphedA = morphSettings.enabled ? a + morphModifier : a;

    // evaluate parametric equations with morphed amplitude
    const xEq = eqXFunc ? eqXFunc(p.u, p.v, t, morphedA) : p.x;
    const yEq = eqYFunc ? eqYFunc(p.u, p.v, t, morphedA) : p.y;
    const zEq = eqZFunc ? eqZFunc(p.u, p.v, t, morphedA) : p.z;

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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
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
  applyAudioReactiveFilter();
}

function draw3DMesh() {
  const settings = window.meshSettings || { responseMode: 'fft', resolution: 30, wireframe: true, filled: false };
  const resolution = settings.resolution;
  
  // Build amplitude array
  const responseMode = settings.responseMode;
  const amplitudeArray = new Float32Array(bufferLength);
  if (responseMode === 'signal') {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const centered = Math.abs(dataArray[i] - 128) / 128;
      amplitudeArray[i] = centered;
      sum += centered;
    }
    var avgAmp = sum / bufferLength;
  } else {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      amplitudeArray[i] = v;
      sum += dataArray[i];
    }
    var avgAmp = sum / bufferLength / 255;
  }

  applyAfterglowEffect();
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  const perspective = 500;
  const radius = 200;

  // Rotation
  const rot = settings.rotation || { enableX: true, enableY: true, enableZ: false, speedX: 0.3, speedY: 0.6, speedZ: 0.2 };
  const now = performance.now() / 1000;
  const xAngle = rot.enableX ? now * rot.speedX : 0;
  const yAngle = rot.enableY ? now * rot.speedY : 0;
  const zAngle = rot.enableZ ? now * rot.speedZ : 0;
  const t = now;

  // Generate mesh vertices
  const vertices = [];
  for (let i = 0; i <= resolution; i++) {
    const row = [];
    for (let j = 0; j <= resolution; j++) {
      const u = i / resolution;
      const v = j / resolution;
      
      // Get audio amplitude for this vertex
      const ampIndex = Math.floor(((i * (resolution + 1) + j) / ((resolution + 1) * (resolution + 1))) * bufferLength);
      const amp = amplitudeArray[ampIndex];
      const a = avgAmp;

      // Evaluate parametric equations
      const xEq = window.meshEqXFunc ? window.meshEqXFunc(u, v, t, a) : Math.sin(Math.PI * v) * Math.cos(2 * Math.PI * u);
      const yEq = window.meshEqYFunc ? window.meshEqYFunc(u, v, t, a) : Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * u);
      const zEq = window.meshEqZFunc ? window.meshEqZFunc(u, v, t, a) : Math.cos(Math.PI * v);

      // Apply rotation
      let xR = xEq;
      let yR = yEq * Math.cos(xAngle) - zEq * Math.sin(xAngle);
      let zR = yEq * Math.sin(xAngle) + zEq * Math.cos(xAngle);
      
      const xR2 = xR * Math.cos(yAngle) + zR * Math.sin(yAngle);
      const zR2 = -xR * Math.sin(yAngle) + zR * Math.cos(yAngle);
      const yR2 = yR;
      
      const xRot = xR2 * Math.cos(zAngle) - yR2 * Math.sin(zAngle);
      const yRot = xR2 * Math.sin(zAngle) + yR2 * Math.cos(zAngle);
      const zRot = zR2;

      // Project to 2D
      const scale = perspective / (perspective + zRot * radius);
      const x2d = xRot * radius * scale;
      const y2d = yRot * radius * scale;

      row.push({ x: x2d, y: y2d, z: zRot, amp: amp });
    }
    vertices.push(row);
  }

  // Draw filled polygons if enabled
  if (settings.filled) {
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const v1 = vertices[i][j];
        const v2 = vertices[i + 1][j];
        const v3 = vertices[i + 1][j + 1];
        const v4 = vertices[i][j + 1];

        // Calculate average z for depth sorting
        const avgZ = (v1.z + v2.z + v3.z + v4.z) / 4;
        
        // Simple back-face culling (skip if facing away)
        if (avgZ < -0.5) continue;

        // Color based on amplitude and theme
        const avgAmpQuad = (v1.amp + v2.amp + v3.amp + v4.amp) / 4;
        
        // Parse theme glow color
        let r = 0, g = 255, b = 153; // Default green
        if (theme.glow) {
          const hex = theme.glow.replace('#', '');
          if (hex.length === 6) {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
          }
        }
        
        // Mix theme color with amplitude
        const intensity = 0.3 + avgAmpQuad * 0.7;
        const finalR = Math.floor(r * intensity);
        const finalG = Math.floor(g * intensity);
        const finalB = Math.floor(b * intensity);
        const alpha = 0.7 + avgAmpQuad * 0.3;
        
        ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.lineTo(v3.x, v3.y);
        ctx.lineTo(v4.x, v4.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Draw wireframe if enabled
  if (settings.wireframe) {
    ctx.strokeStyle = theme.glow;
    ctx.lineWidth = lineWidth;
    ctx.shadowBlur = 5;
    ctx.shadowColor = theme.glow;

    // Draw horizontal lines
    for (let i = 0; i <= resolution; i++) {
      ctx.beginPath();
      for (let j = 0; j <= resolution; j++) {
        const v = vertices[i][j];
        if (j === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.stroke();
    }

    // Draw vertical lines
    for (let j = 0; j <= resolution; j++) {
      ctx.beginPath();
      for (let i = 0; i <= resolution; i++) {
        const v = vertices[i][j];
        if (i === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.stroke();
    }
  }

  ctx.restore();
  drawGrid("3D Mesh");
  drawGrain();
  applyAudioReactiveFilter();
}

// Audio-reactive filter system
let lastBeatTime = 0;
let beatDetected = false;

function applyAudioReactiveFilter() {
  const settings = window.audioFilterSettings;
  
  if (!settings || settings.effect === 'none') {
    //console.log('No filter or effect is none');
    return;
  }

  // Get audio data based on response mode
  let audioLevel = 0;
  if (settings.response === 'frequency') {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    audioLevel = (sum / bufferLength / 255) * settings.responseStrength;
    
    analyser.getByteFrequencyData(dataArray);
    let nonZeroCount = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > 0) nonZeroCount++;
    }
    
  } else if (settings.response === 'beat') {
    // Simple beat detection
    analyser.getByteFrequencyData(dataArray);
    let bass = 0;
    for (let i = 0; i < Math.min(10, bufferLength); i++) {
      bass += dataArray[i];
    }
    bass /= Math.min(10, bufferLength);
    const now = performance.now();
    if (bass > 180 && now - lastBeatTime > 200) {
      beatDetected = true;
      lastBeatTime = now;
    } else if (now - lastBeatTime > 100) {
      beatDetected = false;
    }
    audioLevel = beatDetected ? 1.0 * settings.responseStrength : 0.2 * settings.responseStrength;
  }

  const intensity = settings.intensity * audioLevel;

  // Apply selected filter effect
  switch (settings.effect) {
    case 'grain':
      applyGrainFilter(intensity);
      break;
    case 'scanlines':
      applyScanlinesFilter(intensity);
      break;
    case 'chromatic':
      applyChromaticAberrationFilter(intensity);
      break;
    case 'glitch':
      applyGlitchFilter(intensity);
      break;
    case 'vhs':
      applyVHSNoiseFilter(intensity);
      break;
  }
}

function applyGrainFilter(intensity) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function applyScanlinesFilter(intensity) {
  console.log('applyScanlinesFilter called with intensity:', intensity); // Debug log
  if (intensity <= 0) return;
  
  ctx.save();
  // Make scanlines more visible by increasing opacity
  ctx.globalAlpha = 0.3 + (intensity * 0.7); // Ranges from 0.3 to 1.0
  ctx.fillStyle = '#000000';
  
  // Make scanlines thicker for better visibility
  const lineHeight = 2;
  const gap = Math.max(1, Math.floor(4 - (intensity * 2))); // Adjust gap based on intensity
  
  for (let y = 0; y < canvas.height; y += lineHeight + gap) {
    ctx.fillRect(0, y, canvas.width, lineHeight);
  }
  
  // Add a subtle horizontal blur to make scanlines look more natural
  ctx.filter = `blur(${intensity}px)`;
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = intensity * 0.3;
  ctx.drawImage(canvas, 0, 0);
  
  ctx.restore();
}

function applyChromaticAberrationFilter(intensity) {
  const offset = Math.floor(intensity * 8);
  if (offset < 1) return;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Red channel shifted left
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.8;
  ctx.drawImage(tempCanvas, -offset, 0);
  ctx.restore();
  
  // Green channel normal
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.8;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();
  
  // Blue channel shifted right
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.8;
  ctx.drawImage(tempCanvas, offset, 0);
  ctx.restore();
}

function applyGlitchFilter(intensity) {
  if (Math.random() > intensity) return;
  
  const sliceHeight = Math.floor(Math.random() * 20 + 5);
  const numSlices = Math.floor(intensity * 10);
  
  for (let i = 0; i < numSlices; i++) {
    const y = Math.floor(Math.random() * canvas.height);
    const offset = (Math.random() - 0.5) * 50 * intensity;
    
    const imageData = ctx.getImageData(0, y, canvas.width, sliceHeight);
    ctx.putImageData(imageData, offset, y);
  }
}

// --- Olympic Rings Visualization ---
window.olympicRingsSettings = {
  mode: 'frequency', // 'frequency', 'channel', or 'beat'
  ringFrequencies: [
    { min: 0, max: 200 },   // Ring 1: Low bass
    { min: 200, max: 500 }, // Ring 2: Mid bass
    { min: 500, max: 1000 }, // Ring 3: Low mids
    { min: 1000, max: 3000 }, // Ring 4: Mids
    { min: 3000, max: 8000 }  // Ring 5: Highs
  ],
  ringChannels: [0, 1, 0, 1, 0], // Channel indices for channel mode (0=left, 1=right)
  ringColors: ['#0085C7', '#F4C300', '#000000', '#009F3D', '#DF0024'], // Olympic ring colors
  // Beat detection parameters
  beatThreshold: 0.3, // Beat detection threshold
  beatDecay: 0.95, // How fast beat pulses decay
  beatMinInterval: 100, // Minimum time between beats (ms)
  beatSensitivity: 1.0, // Multiplier for beat mode
  beatSource: 'frequency', // 'frequency' or 'channel' - where to detect beats from
  ringSize: 120,
  ringThickness: 12,
  ringSpacingX: 20,
  ringSpacingY: 60,
  responseSpeed: 0.3,
  rotationSpeed: 0.0,
  // Size and scaling parameters
  sizeMinScale: 0.7, // Minimum size multiplier
  sizeMaxScale: 1.7, // Maximum size multiplier
  sizeSensitivity: 1.0, // How much size responds to audio
  thicknessMinScale: 1.0, // Minimum thickness multiplier
  thicknessMaxScale: 1.5, // Maximum thickness multiplier
  thicknessSensitivity: 0.5, // How much thickness responds to audio
  // Visual parameters
  showFill: false, // Show ring fill
  fillOpacity: 0.3, // Base fill opacity
  fillOpacitySensitivity: 0.4, // How much fill opacity responds
  showGlow: false, // Show ring glow/shadow
  glowIntensity: 15, // Base glow blur
  glowSensitivity: 20, // How much glow responds to audio
  ringOpacity: 1.0, // Overall ring opacity
  // Mode-specific parameters
  frequencySensitivity: 1.0, // Multiplier for frequency mode
  channelSensitivity: 1.0, // Multiplier for channel mode
  // Layout parameters
  layoutScale: 1.0, // Overall layout scale
  verticalOffset: 0, // Vertical offset of entire layout
  horizontalOffset: 0 // Horizontal offset of entire layout
};

let olympicRingLevels = [0, 0, 0, 0, 0]; // Current audio levels for each ring
let olympicRingBeatDetectors = [
  { lastBeatTime: 0, energyHistory: [], threshold: 0.3 },
  { lastBeatTime: 0, energyHistory: [], threshold: 0.3 },
  { lastBeatTime: 0, energyHistory: [], threshold: 0.3 },
  { lastBeatTime: 0, energyHistory: [], threshold: 0.3 },
  { lastBeatTime: 0, energyHistory: [], threshold: 0.3 }
]; // Beat detectors for each ring
let olympicRingBeatPulses = [0, 0, 0, 0, 0]; // Beat pulse values for each ring (0-1)

function drawOlympicRings() {
  analyser.getByteFrequencyData(dataArray);
  const sampleRate = audioCtx.sampleRate;
  const binSize = sampleRate / 2 / bufferLength;
  
  const now = performance.now();
  const settings = window.olympicRingsSettings;
  
  // Calculate levels for each ring
  for (let i = 0; i < 5; i++) {
    let level = 0;
    let energy = 0; // Energy for beat detection
    
    if (settings.mode === 'frequency') {
      // Frequency-based mode
      const freqRange = settings.ringFrequencies[i];
      const startBin = Math.floor(freqRange.min / binSize);
      const endBin = Math.floor(freqRange.max / binSize);
      
      let sum = 0;
      let count = 0;
      for (let j = startBin; j <= endBin && j < bufferLength; j++) {
        sum += dataArray[j];
        count++;
      }
      level = count > 0 ? sum / count / 255 : 0;
      energy = level; // Use same energy for beat detection in frequency mode
    } else if (settings.mode === 'beat') {
      // Beat detection mode - use frequency or channel based on beat source
      if (settings.beatSource === 'frequency') {
        // Frequency-based beat detection
        const freqRange = settings.ringFrequencies[i];
        const startBin = Math.floor(freqRange.min / binSize);
        const endBin = Math.floor(freqRange.max / binSize);
        
        let sum = 0;
        let count = 0;
        for (let j = startBin; j <= endBin && j < bufferLength; j++) {
          sum += dataArray[j];
          count++;
        }
        energy = count > 0 ? sum / count / 255 : 0;
      } else {
        // Channel-based beat detection
        const channel = settings.ringChannels[i];
        
        let channelAnalyser = null;
        let channelData = null;
        
        if (typeof window.channelAnalysers !== 'undefined' && window.channelAnalysers && window.channelAnalysers.length > channel) {
          channelAnalyser = window.channelAnalysers[channel];
          channelData = new Uint8Array(channelAnalyser.frequencyBinCount);
          channelAnalyser.getByteFrequencyData(channelData);
        } else {
          if (channel === 0 && analyserLeft) {
            channelAnalyser = analyserLeft;
            channelData = stereoDataLeft;
            analyserLeft.getByteFrequencyData(stereoDataLeft);
          } else if (channel === 1 && analyserRight) {
            channelAnalyser = analyserRight;
            channelData = stereoDataRight;
            analyserRight.getByteFrequencyData(stereoDataRight);
          }
        }
        
        if (channelData && channelAnalyser) {
          let sum = 0;
          const bufferLength = channelAnalyser.frequencyBinCount;
          for (let j = 0; j < bufferLength; j++) {
            sum += channelData[j];
          }
          energy = bufferLength > 0 ? sum / bufferLength / 255 : 0;
        } else {
          energy = 0;
        }
      }
      
      // Beat detection for this ring
      const detector = olympicRingBeatDetectors[i];
      
      // Add energy to history
      detector.energyHistory.push(energy);
      if (detector.energyHistory.length > 20) {
        detector.energyHistory.shift();
      }
      
      // Calculate dynamic threshold
      if (detector.energyHistory.length >= 5) {
        const recentEnergy = detector.energyHistory.slice(-5);
        const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length;
        const maxEnergy = Math.max(...recentEnergy);
        detector.threshold = avgEnergy + (maxEnergy - avgEnergy) * settings.beatThreshold;
      }
      
      // Detect beat
      const isBeat = energy > detector.threshold && 
                     (now - detector.lastBeatTime) > settings.beatMinInterval;
      
      if (isBeat) {
        detector.lastBeatTime = now;
        olympicRingBeatPulses[i] = 1.0; // Set pulse to maximum
      } else {
        // Decay pulse over time
        olympicRingBeatPulses[i] *= settings.beatDecay;
      }
      
      // Use pulse value for level
      level = olympicRingBeatPulses[i] * settings.beatSensitivity;
    } else {
      // Channel-based mode - use frequency data from selected audio interface channel
      const channel = window.olympicRingsSettings.ringChannels[i];
      
      // Use channelAnalysers array if available (multi-channel audio interface)
      // Otherwise fall back to analyserLeft/Right for backward compatibility
      let channelAnalyser = null;
      let channelData = null;
      
      if (typeof window.channelAnalysers !== 'undefined' && window.channelAnalysers && window.channelAnalysers.length > channel) {
        // Multi-channel mode
        channelAnalyser = window.channelAnalysers[channel];
        channelData = new Uint8Array(channelAnalyser.frequencyBinCount);
        channelAnalyser.getByteFrequencyData(channelData);
      } else {
        // Fallback to stereo mode
        if (channel === 0 && analyserLeft) {
          channelAnalyser = analyserLeft;
          channelData = stereoDataLeft;
          analyserLeft.getByteFrequencyData(stereoDataLeft);
        } else if (channel === 1 && analyserRight) {
          channelAnalyser = analyserRight;
          channelData = stereoDataRight;
          analyserRight.getByteFrequencyData(stereoDataRight);
        } else {
          level = 0;
          continue;
        }
      }
      
      if (channelData && channelAnalyser) {
        let sum = 0;
        const bufferLength = channelAnalyser.frequencyBinCount;
        for (let j = 0; j < bufferLength; j++) {
          sum += channelData[j];
        }
        level = bufferLength > 0 ? sum / bufferLength / 10 :0;
      } else {
        level = 0;
      }
    }
    
  // Apply mode-specific sensitivity (only for frequency and channel modes, beat mode uses pulse directly)
  if (settings.mode !== 'beat') {
    const sensitivity = settings.mode === 'frequency' 
      ? settings.frequencySensitivity 
      : settings.channelSensitivity;
    level *= sensitivity;
    
    // Smooth the level changes
    olympicRingLevels[i] += (level - olympicRingLevels[i]) * settings.responseSpeed;
  } else {
    // For beat mode, use pulse directly without smoothing (beats are instantaneous)
    olympicRingLevels[i] = level;
  }
  }
  
  // Use white background for Olympic theme - skip afterglow effect
  if (theme.background === "#FFFFFF") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    applyAfterglowEffect();
  }
  
  drawGrid("olympic");
  
  ctx.save();
  ctx.translate(
    canvas.width / 2 + window.olympicRingsSettings.horizontalOffset,
    canvas.height / 2 + window.olympicRingsSettings.verticalOffset
  );
  
  const size = window.olympicRingsSettings.ringSize * window.olympicRingsSettings.layoutScale;
  const thickness = window.olympicRingsSettings.ringThickness;
  const spacingX = window.olympicRingsSettings.ringSpacingX || 20;
  const spacingY = window.olympicRingsSettings.ringSpacingY || 60;
  
  // Rotation animation
  const rotation = performance.now() * 0.001 * window.olympicRingsSettings.rotationSpeed;
  ctx.rotate(rotation);
  
  // Olympic rings arrangement:
  // Top row: rings 1, 2, 3 (blue, yellow, black)
  // Bottom row: rings 4, 5 (green, red) - offset
  // When spacingX = 0, all rings are at the same position (x = 0) - complete overlap
  // When spacingX > 0, rings spread out from center
  // When spacingX < 0, rings overlap more (negative values move rings past center)
  const ring1X = -spacingX; // Left ring: negative offset from center
  const ring2X = 0; // Center ring always at 0
  const ring3X = spacingX; // Right ring: positive offset from center
  const ring4X = -spacingX / 2; // Bottom left: halfway between ring 1 and center
  const ring5X = spacingX / 2; // Bottom right: halfway between center and ring 3
  
  const rings = [
    { x: ring1X, y: -spacingY/2, color: window.olympicRingsSettings.ringColors[0] }, // Ring 1 (top left)
    { x: ring2X, y: -spacingY/2, color: window.olympicRingsSettings.ringColors[2] }, // Ring 2 (top center)
    { x: ring3X, y: -spacingY/2, color: window.olympicRingsSettings.ringColors[4] }, // Ring 3 (top right)
    { x: ring4X, y: spacingY/2, color: window.olympicRingsSettings.ringColors[1] }, // Ring 4 (bottom left)
    { x: ring5X, y: spacingY/2, color: window.olympicRingsSettings.ringColors[3] } // Ring 5 (bottom right)
  ];
  
  // Draw rings
  for (let i = 0; i < 5; i++) {
    const ring = rings[i];
    const level = olympicRingLevels[i];
    const settings = window.olympicRingsSettings;
    
    // Calculate dynamic size based on audio level with configurable range
    const sizeRange = settings.sizeMaxScale - settings.sizeMinScale;
    const currentSize = size * (settings.sizeMinScale + level * sizeRange * settings.sizeSensitivity);
    
    // Calculate dynamic thickness based on audio level with configurable range
    const thicknessRange = settings.thicknessMaxScale - settings.thicknessMinScale;
    const currentThickness = thickness * (settings.thicknessMinScale + level * thicknessRange * settings.thicknessSensitivity);
    
    // Set overall ring opacity
    ctx.globalAlpha = settings.ringOpacity;
    
    // Draw ring shadow/glow if enabled
    if (settings.showGlow) {
      ctx.shadowBlur = theme.cartoon ? 0 : settings.glowIntensity + level * settings.glowSensitivity;
      ctx.shadowColor = ring.color;
    } else {
      ctx.shadowBlur = 0;
    }
    
    // Draw ring outline
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = currentThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, currentSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw ring fill if enabled
    if (settings.showFill) {
      ctx.fillStyle = ring.color;
      const fillAlpha = settings.fillOpacity + level * settings.fillOpacitySensitivity;
      ctx.globalAlpha = Math.min(1.0, fillAlpha * settings.ringOpacity);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, currentSize / 2 - currentThickness / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  ctx.restore();
  drawGrain();
  applyAudioReactiveFilter();
}

function applyVHSNoiseFilter(intensity) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Add horizontal noise lines
  for (let y = 0; y < canvas.height; y++) {
    if (Math.random() < intensity * 0.1) {
      const noiseIntensity = Math.random() * intensity;
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const noise = (Math.random() - 0.5) * 100 * noiseIntensity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
    }
  }
  
  // Add color distortion
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < intensity * 0.05) {
      data[i] += (Math.random() - 0.5) * 50 * intensity;     // R shift
      data[i + 1] += (Math.random() - 0.5) * 30 * intensity; // G shift
      data[i + 2] += (Math.random() - 0.5) * 40 * intensity; // B shift
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// --- MFCC Trajectory Visualization ---
let mfccHistory = [];
let mfccPCAModel = null;
const maxMFCCHistory = 200; // Number of frames to keep for trajectory
let mfccTrajectoryPoints = []; // Store projected points for visualization
let mfccDataRange = { min: [-1, -1, -1], max: [1, 1, 1] }; // Track data range for scaling
let mfccPointHistory = []; // Store individual points with timestamps
let mfccCurrentPoint = null; // Current point position

// Function to clear MFCC data when audio is paused
function clearMFCCHistory() {
  mfccHistory = [];
  mfccPointHistory = [];
  mfccPCAModel = null;
  mfccCurrentPoint = null;
  mfccDataRange = { min: [-1, -1, -1], max: [1, 1, 1] };
  // Reset update timer so it starts immediately when audio resumes
  if (window.mfccBeatDetector) {
    window.mfccBeatDetector.lastUpdateTime = 0;
  }
}

// Beat detection for MFCC updates
window.mfccBeatDetector = {
  lastBeatTime: 0,
  beatInterval: 500, // Initial estimate in ms
  beatHistory: [],
  energyHistory: [],
  maxHistory: 20,
  threshold: 0.3,
  subdivision: 1, // 1 = beat, 2 = half-beat, 4 = quarter-beat
  subdivisionMode: 'beat', // 'beat' or 'time'
  timeSubdivision: 100, // ms between updates when in time mode
  lastUpdateTime: 0,
  // Visualization parameters
  pointLifetime: 3000, // How long points stay visible (ms)
  pointSize: 4, // Base point size
  pointGlowSize: 8, // Glow size for new points
  showTrail: false, // Whether to show connecting lines
  maxPoints: 50, // Maximum number of points to show
  fadeSpeed: 0.02, // How fast points fade out
  dimensions: 3, // Number of PCA dimensions (1, 2, or 3)
  visualizationMode: 'points' // 'points', 'radial', 'wave', 'spiral', 'filter'
};

// Simplified MFCC calculation
function calculateMFCC(frequencyData, sampleRate = 44100) {
  const numCoeffs = 40;
  const mfccs = new Array(numCoeffs).fill(0);
  
  // Convert frequency data to power spectrum
  const powerSpectrum = [];
  for (let i = 0; i < frequencyData.length; i++) {
    powerSpectrum.push(Math.pow(frequencyData[i] / 255.0, 2));
  }
  
  // Simplified mel-scale filter bank
  const numFilters = 26;
  const melFilters = createMelFilters(numFilters, powerSpectrum.length, sampleRate);
  
  // Apply mel filters
  const melEnergies = new Array(numFilters).fill(0);
  for (let i = 0; i < numFilters; i++) {
    for (let j = 0; j < powerSpectrum.length; j++) {
      melEnergies[i] += powerSpectrum[j] * melFilters[i][j];
    }
    // Log and avoid log(0)
    melEnergies[i] = Math.log(Math.max(melEnergies[i], 1e-10));
  }
  
  // Apply DCT to get MFCCs
  for (let i = 0; i < numCoeffs; i++) {
    for (let j = 0; j < numFilters; j++) {
      mfccs[i] += melEnergies[j] * Math.cos(Math.PI * i * (j + 0.5) / numFilters);
    }
  }
  
  return mfccs;
}

// Create mel-scale filter bank
function createMelFilters(numFilters, fftSize, sampleRate) {
  const filters = [];
  const nyquist = sampleRate / 2;
  
  // Convert Hz to mel scale
  const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
  const melToHz = (mel) => 700 * (Math.pow(10, mel / 2595) - 1);
  
  // Create mel-scale points
  const melPoints = [];
  const melMax = hzToMel(nyquist);
  for (let i = 0; i <= numFilters + 1; i++) {
    melPoints.push((i * melMax) / (numFilters + 1));
  }
  
  // Convert back to Hz and then to FFT bins
  const hzPoints = melPoints.map(melToHz);
  const binPoints = hzPoints.map(hz => Math.floor((hz / nyquist) * fftSize));
  
  // Create triangular filters
  for (let i = 0; i < numFilters; i++) {
    const filter = new Array(fftSize).fill(0);
    const left = binPoints[i];
    const center = binPoints[i + 1];
    const right = binPoints[i + 2];
    
    // Rising edge
    for (let j = left; j < center; j++) {
      if (j >= 0 && j < fftSize) {
        filter[j] = (j - left) / (center - left);
      }
    }
    
    // Falling edge
    for (let j = center; j < right; j++) {
      if (j >= 0 && j < fftSize) {
        filter[j] = (right - j) / (right - center);
      }
    }
    
    filters.push(filter);
  }
  
  return filters;
}

// Beat detection for MFCC updates
function detectBeatForMFCC(frequencyData) {
  const now = performance.now();
  
  // Calculate energy in bass frequencies (typically 20-250 Hz)
  const bassEnergy = calculateBassEnergy(frequencyData);
  
  // Add to energy history
  window.mfccBeatDetector.energyHistory.push(bassEnergy);
  if (window.mfccBeatDetector.energyHistory.length > window.mfccBeatDetector.maxHistory) {
    window.mfccBeatDetector.energyHistory.shift();
  }
  
  // Calculate dynamic threshold based on recent energy
  if (window.mfccBeatDetector.energyHistory.length >= 5) {
    const recentEnergy = window.mfccBeatDetector.energyHistory.slice(-5);
    const avgEnergy = recentEnergy.reduce((sum, e) => sum + e, 0) / recentEnergy.length;
    const maxEnergy = Math.max(...recentEnergy);
    window.mfccBeatDetector.threshold = avgEnergy + (maxEnergy - avgEnergy) * 0.3;
  }
  
  // Detect beat
  const isBeat = bassEnergy > window.mfccBeatDetector.threshold && 
                 (now - window.mfccBeatDetector.lastBeatTime) > (window.mfccBeatDetector.beatInterval * 0.5);
  
  if (isBeat) {
    // Update beat interval estimation
    if (window.mfccBeatDetector.lastBeatTime > 0) {
      const interval = now - window.mfccBeatDetector.lastBeatTime;
      window.mfccBeatDetector.beatHistory.push(interval);
      if (window.mfccBeatDetector.beatHistory.length > window.mfccBeatDetector.maxHistory) {
        window.mfccBeatDetector.beatHistory.shift();
      }
      
      // Calculate average beat interval
      if (window.mfccBeatDetector.beatHistory.length >= 3) {
        window.mfccBeatDetector.beatInterval = window.mfccBeatDetector.beatHistory.reduce((sum, i) => sum + i, 0) / window.mfccBeatDetector.beatHistory.length;
      }
    }
    
    window.mfccBeatDetector.lastBeatTime = now;
    return true;
  }
  
  return false;
}

// Calculate bass energy from frequency data
function calculateBassEnergy(frequencyData) {
  // Focus on bass frequencies (roughly first 10% of frequency bins)
  const bassBins = Math.floor(frequencyData.length * 0.1);
  let energy = 0;
  
  for (let i = 0; i < bassBins; i++) {
    energy += frequencyData[i] * frequencyData[i];
  }
  
  return energy / bassBins;
}

// Check if it's time to update MFCC based on beat subdivision or time
function shouldUpdateMFCC() {
  const now = performance.now();
  
  if (window.mfccBeatDetector.subdivisionMode === 'time') {
    // Time-based updates
    return (now - window.mfccBeatDetector.lastUpdateTime) >= window.mfccBeatDetector.timeSubdivision;
  } else {
    // Beat-based updates
    const subdivisionInterval = window.mfccBeatDetector.beatInterval / window.mfccBeatDetector.subdivision;
    return (now - window.mfccBeatDetector.lastUpdateTime) >= subdivisionInterval;
  }
}

// Simple PCA implementation
function calculatePCA(data, numComponents = 3) {
  if (data.length < numComponents) return null;
  
  // Center the data
  const mean = new Array(data[0].length).fill(0);
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      mean[j] += data[i][j];
    }
  }
  for (let j = 0; j < mean.length; j++) {
    mean[j] /= data.length;
  }
  
  const centeredData = data.map(row => 
    row.map((val, i) => val - mean[i])
  );
  
  // Calculate covariance matrix
  const covMatrix = [];
  for (let i = 0; i < mean.length; i++) {
    covMatrix[i] = new Array(mean.length).fill(0);
    for (let j = 0; j < mean.length; j++) {
      for (let k = 0; k < centeredData.length; k++) {
        covMatrix[i][j] += centeredData[k][i] * centeredData[k][j];
      }
      covMatrix[i][j] /= centeredData.length;
    }
  }
  
  // Simple eigenvalue decomposition (simplified)
  // For visualization purposes, we'll use a simplified approach
  const eigenvectors = [];
  for (let i = 0; i < numComponents; i++) {
    eigenvectors[i] = new Array(mean.length).fill(0);
    // Simple initialization - in practice, you'd use proper eigenvalue decomposition
    for (let j = 0; j < mean.length; j++) {
      eigenvectors[i][j] = Math.random() - 0.5;
    }
  }
  
  // Normalize eigenvectors
  for (let i = 0; i < eigenvectors.length; i++) {
    const norm = Math.sqrt(eigenvectors[i].reduce((sum, val) => sum + val * val, 0));
    for (let j = 0; j < eigenvectors[i].length; j++) {
      eigenvectors[i][j] /= norm;
    }
  }
  
  // Project data onto principal components
  const projectedData = [];
  for (let i = 0; i < centeredData.length; i++) {
    const projection = new Array(numComponents).fill(0);
    for (let j = 0; j < numComponents; j++) {
      for (let k = 0; k < centeredData[i].length; k++) {
        projection[j] += centeredData[i][k] * eigenvectors[j][k];
      }
    }
    projectedData.push(projection);
  }
  
  return {
    projectedData,
    eigenvectors,
    mean
  };
}

function drawMFCCTrajectory() {
  // Get frequency data
  analyser.getByteFrequencyData(dataArray);
  
  // Detect beat for timing
  const isBeat = detectBeatForMFCC(dataArray);
  
  // Only calculate MFCCs and update PCA on beat subdivisions or time intervals
  // Initialize lastUpdateTime on first run to start immediately
  if (window.mfccBeatDetector.lastUpdateTime === 0) {
    window.mfccBeatDetector.lastUpdateTime = performance.now();
  }
  
  if (shouldUpdateMFCC()) {
    // Calculate MFCCs for current frame
    const mfccs = calculateMFCC(dataArray);
    
    // Add to history
    mfccHistory.unshift(mfccs);
    if (mfccHistory.length > maxMFCCHistory) {
      mfccHistory.pop();
    }
    
    // Update PCA if we have enough data (reduced from 20 to 5 for faster initial display)
    if (mfccHistory.length >= 5) {
      mfccPCAModel = calculatePCA(mfccHistory, window.mfccBeatDetector.dimensions);
      
      // Update data range for proper scaling
      if (mfccPCAModel && mfccPCAModel.projectedData.length > 0) {
        const data = mfccPCAModel.projectedData;
        const dims = window.mfccBeatDetector.dimensions;
        mfccDataRange.min = new Array(dims).fill(Infinity);
        mfccDataRange.max = new Array(dims).fill(-Infinity);
        
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < dims; j++) {
            mfccDataRange.min[j] = Math.min(mfccDataRange.min[j], data[i][j]);
            mfccDataRange.max[j] = Math.max(mfccDataRange.max[j], data[i][j]);
          }
        }
        
        // Add some padding to the range
        for (let j = 0; j < dims; j++) {
          const range = mfccDataRange.max[j] - mfccDataRange.min[j];
          const padding = range * 0.1;
          mfccDataRange.min[j] -= padding;
          mfccDataRange.max[j] += padding;
        }
      }
      
      // Add new point to history
      if (mfccPCAModel && mfccPCAModel.projectedData.length > 0) {
        const currentPoint = mfccPCAModel.projectedData[0];
        const dims = window.mfccBeatDetector.dimensions;
        const normalizedPoint = [];
        
        for (let j = 0; j < dims; j++) {
          normalizedPoint[j] = (currentPoint[j] - mfccDataRange.min[j]) / (mfccDataRange.max[j] - mfccDataRange.min[j]) * 2 - 1;
        }
        
        // Pad with zeros for missing dimensions
        while (normalizedPoint.length < 3) {
          normalizedPoint.push(0);
        }
        
        mfccCurrentPoint = {
          x: normalizedPoint[0],
          y: normalizedPoint[1],
          z: normalizedPoint[2],
          timestamp: performance.now(),
          isBeat: isBeat,
          alpha: 1.0,
          rawData: normalizedPoint.slice(0, dims) // Store original dimension data
        };
        
        mfccPointHistory.unshift(mfccCurrentPoint);
        
        // Limit number of points
        if (mfccPointHistory.length > window.mfccBeatDetector.maxPoints) {
          mfccPointHistory.pop();
        }
      }
    }
    
    window.mfccBeatDetector.lastUpdateTime = performance.now();
  }
  
  // Need at least some data to draw
  if (mfccHistory.length < 5) {
    applyAfterglowEffect();
    drawGrid("mfcc");
    return;
  }
  
  applyAfterglowEffect();
  drawGrid("mfcc");
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  const width = canvas.width;
  const height = canvas.height;
  const maxDimension = Math.min(width, height);
  const scale = maxDimension * 0.4;
  const now = performance.now();
  
  // Update point alphas and remove old points
  mfccPointHistory = mfccPointHistory.filter(point => {
    const age = now - point.timestamp;
    point.alpha = Math.max(0, 1 - (age / window.mfccBeatDetector.pointLifetime));
    return point.alpha > 0.01; // Remove points that are almost invisible
  });
  
  // Choose visualization mode based on dimensions and settings
  const mode = window.mfccBeatDetector.visualizationMode;
  const dims = window.mfccBeatDetector.dimensions;
  
  switch (mode) {
    case 'radial':
      drawRadialVisualization(mfccPointHistory, scale*2, width, height, dims);
      break;
    case 'wave':
      drawWaveVisualization(mfccPointHistory, scale, width, height, dims);
      break;
    case 'spiral':
      drawSpiralVisualization(mfccPointHistory, scale*3, width, height, dims);
      break;
    case 'filter':
      drawFilterVisualization(mfccPointHistory, scale, width, height, dims);
      break;
    case 'points':
    default:
      drawPointsVisualization(mfccPointHistory, scale, width, height, dims);
      break;
  }
  
  // Draw beat indicator
  if (isBeat) {
    ctx.strokeStyle = theme.glow;
    ctx.lineWidth = 3;
    //ctx.beginPath();
    //ctx.arc(0, 0, scale * 0.8, 0, Math.PI * 2);
    //ctx.stroke();
  }
  
  // Draw info
  ctx.fillStyle = theme.label;
  ctx.font = "10px monospace";
  ctx.fillText(`Beat: ${Math.round(60000/window.mfccBeatDetector.beatInterval)} BPM`, -width/2 + 10, -height/2 + 30);
  ctx.fillText(`Subdivision: ${window.mfccBeatDetector.subdivision}`, -width/2 + 10, -height/2 + 45);
  ctx.fillText(`Points: ${mfccPointHistory.length}`, -width/2 + 10, -height/2 + 60);
  ctx.fillText(`Mode: ${window.mfccBeatDetector.visualizationMode}`, -width/2 + 10, -height/2 + 75);
  ctx.fillText(`Dims: ${window.mfccBeatDetector.dimensions}D`, -width/2 + 10, -height/2 + 90);
  
  ctx.restore();
  drawGrain();
  applyAudioReactiveFilter();
}

// 1D Radial Visualization - PC1 controls radius, creates pulsing circles
function drawRadialVisualization(points, scale, width, height, dims) {
  const now = performance.now();
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.timestamp;
    const isNewPoint = age < 200;
    
    ctx.globalAlpha = point.alpha;
    
    // Use PC1 for radius (scaled to 0-1 range)
    const radius = (point.rawData[0] + 1) * 0.5 * scale * 0.3;
    
    // Use PC2 for color hue if available
    const hue = dims > 1 ? (point.rawData[1] + 1) * 0.5 * 360 : 0;
    
    ctx.strokeStyle = dims > 1 ? `hsl(${hue}, 100%, 60%)` : theme.glow;
    ctx.lineWidth = isNewPoint ? 4 : 2;
    ctx.shadowBlur = isNewPoint ? 15 : 8;
    ctx.shadowColor = ctx.strokeStyle;
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
  }
}

// 2D Wave Visualization - PC1 controls amplitude, PC2 controls frequency
function drawWaveVisualization(points, scale, width, height, dims) {
  const now = performance.now();
  
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = 2;
  ctx.shadowBlur = theme.cartoon ? 0 : 8;
  ctx.shadowColor = theme.glow;
  
  ctx.beginPath();
  
  for (let x = -width/2; x < width/2; x += 4) {
    let y = 0;
    
    // Sum contributions from all points
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const age = now - point.timestamp;
      
      if (point.alpha > 0.1) {
        // PC1 controls amplitude, PC2 controls frequency
        const amplitude = dims > 0 ? point.rawData[0] * scale * 0.2 : 0;
        const frequency = dims > 1 ? (point.rawData[1] + 1) * 0.5 * 4 + 1 : 2;
        const phase = age * 0.001; // Time-based phase
        
        y += amplitude * Math.sin(frequency * x * 0.01 + phase) * point.alpha;
      }
    }
    
    if (x === -width/2) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
}

// 3D Spiral Visualization - All dimensions create a 3D spiral
function drawSpiralVisualization(points, scale, width, height, dims) {
  const now = performance.now();
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.timestamp;
    const isNewPoint = age < 200;
    
    ctx.globalAlpha = point.alpha;
    
    // Create spiral based on dimensions
    const t = age * 0.001; // Time parameter
    const radius = dims > 0 ? (point.rawData[0] + 1) * 0.5 * scale * 0.2 : scale * 0.1;
    const heightOffset = dims > 1 ? point.rawData[1] * scale * 0.3 : 0;
    const twist = dims > 2 ? point.rawData[2] * 2 : 0;
    
    const x = radius * Math.cos(t + twist);
    const y = heightOffset + radius * Math.sin(t + twist);
    const z = t * scale * 0.1;
    
    // Perspective projection
    const perspective = 800;
    const scale2d = perspective / (perspective + z);
    const x2d = x * scale2d;
    const y2d = y * scale2d;
    
    if (Math.abs(x2d) < width/2 && Math.abs(y2d) < height/2) {
      const pointSize = isNewPoint ? window.mfccBeatDetector.pointSize : window.mfccBeatDetector.pointSize;
      
      ctx.fillStyle = theme.glow;
      ctx.shadowBlur = isNewPoint ? 15 : 8;
      ctx.shadowColor = theme.glow;
      
      ctx.beginPath();
      ctx.arc(x2d, y2d, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
  }
}

// Filter Visualization - PC1 controls filter parameters
function drawFilterVisualization(points, scale, width, height, dims) {
  const now = performance.now();
  
  // Apply filter effect based on current PC1 value
  if (points.length > 0) {
    const currentPoint = points[0];
    const filterValue = currentPoint.rawData[0]; // PC1 controls filter
    
    // Apply chromatic aberration based on PC1
    const offset = Math.abs(filterValue) * 10;
    if (offset > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.6;
      
      // Red channel
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-offset, 0, width, height);
      
      // Blue channel
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(offset, 0, width, height);
      
      ctx.restore();
    }
  }
  
  // Draw filter visualization bars
  const barCount = 20;
  const barWidth = width / barCount;
  
  for (let i = 0; i < barCount; i++) {
    let height = 0;
    
    // Sum contributions from recent points
    for (let j = 0; j < Math.min(points.length, 10); j++) {
      const point = points[j];
      const age = now - point.timestamp;
      
      if (point.alpha > 0.1) {
        const freq = i / barCount;
        const amplitude = dims > 0 ? point.rawData[0] * 100 : 50;
        const phase = age * 0.001;
        
        height += amplitude * Math.sin(freq * Math.PI * 2 + phase) * point.alpha;
      }
    }
    
    const x = -width/2 + i * barWidth;
    const y = Math.max(0, height);
    
    ctx.fillStyle = theme.glow;
    ctx.fillRect(x, -y, barWidth - 2, y);
  }
}

// Original points visualization
function drawPointsVisualization(points, scale, width, height, dims) {
  const now = performance.now();
  
  // Draw connecting lines if enabled
  if (window.mfccBeatDetector.showTrail && points.length > 1) {
    ctx.strokeStyle = theme.glow;
    ctx.lineWidth = lineWidth * 0.5;
    ctx.shadowBlur = theme.cartoon ? 0 : 5;
    ctx.shadowColor = theme.glow;
    
    ctx.beginPath();
    let hasMovedToFirst = false;
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const x = point.x * scale;
      const y = point.y * scale;
      const z = point.z * scale;
      
      // Simple perspective projection
      const perspective = 800;
      const scale2d = perspective / (perspective + z);
      const x2d = x * scale2d;
      const y2d = y * scale2d;
      
      // Check if point is within viewport bounds
      if (Math.abs(x2d) < width/2 && Math.abs(y2d) < height/2) {
        if (!hasMovedToFirst) {
          ctx.moveTo(x2d, y2d);
          hasMovedToFirst = true;
        } else {
          ctx.lineTo(x2d, y2d);
        }
      }
    }
    ctx.stroke();
  }
  
  // Draw individual points
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = point.x * scale;
    const y = point.y * scale;
    const z = point.z * scale;
    
    // Simple perspective projection
    const perspective = 800;
    const scale2d = perspective / (perspective + z);
    const x2d = x * scale2d;
    const y2d = y * scale2d;
    
    // Only draw if within viewport
    if (Math.abs(x2d) < width/2 && Math.abs(y2d) < height/2) {
      // Determine point size and color based on age and beat
      const age = now - point.timestamp;
      const isNewPoint = age < 200; // Points are "new" for 200ms
      const pointSize = isNewPoint ? window.mfccBeatDetector.pointGlowSize : window.mfccBeatDetector.pointSize;
      
      // Set alpha based on point age
      ctx.globalAlpha = point.alpha;
      
      // Draw glow for new points
      if (isNewPoint) {
        ctx.fillStyle = theme.glow;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.glow;
        ctx.beginPath();
        ctx.arc(x2d, y2d, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw main point
      ctx.fillStyle = theme.glow;
      ctx.shadowBlur = theme.cartoon ? 0 : 8;
      ctx.shadowColor = theme.glow;
      ctx.beginPath();
      ctx.arc(x2d, y2d, window.mfccBeatDetector.pointSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    }
  }
}
