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
  min: 0.5,
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