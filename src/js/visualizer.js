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
  drawGrain();
  applyAudioReactiveFilter();
}

// Audio-reactive filter system
let lastBeatTime = 0;
let beatDetected = false;

function applyAudioReactiveFilter() {
  const settings = window.audioFilterSettings;
  console.log('Current filter settings:', {
    effect: settings?.effect,
    intensity: settings?.intensity,
    response: settings?.response,
    responseStrength: settings?.responseStrength
  });

  if (!settings || settings.effect === 'none') {
    console.log('No filter or effect is none');
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
    console.log('Frequency audio level:', audioLevel, 'Data sum:', sum, 'Buffer length:', bufferLength);
    analyser.getByteFrequencyData(dataArray);
    let nonZeroCount = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > 0) nonZeroCount++;
    }
    console.log(`Non-zero frequency bins: ${nonZeroCount}/${bufferLength}`);
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
