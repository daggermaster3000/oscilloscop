let bufferLength;
let dataArray;
let stereoDataLeft;
let stereoDataRight;
let smoothedData = [];
let afterglowOpacity = 0.92;
let lineWidth = 2;
let smoothingFactor = 0.2;

// Remove the old afterglow control elements
const oldAfterglowControl = document.getElementById("afterglowControl");
const oldAfterglowValue = document.getElementById("afterglowValue");
if (oldAfterglowControl) oldAfterglowControl.parentElement.remove();

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

