
let stereoDataLeft;
let stereoDataRight;
let smoothedData = [];
let afterglowOpacity = 0.92;
let lineWidth = 2;
let smoothingFactor = 0.2;

const canvas = document.getElementById("oscilloscope");
const ctx = canvas.getContext("2d");
const themeSelect = document.getElementById("themeSelect");
const displayModeSelect = document.getElementById("displayMode");

// Set initial canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight//3;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
// create web audio api context
const audioCtx = new AudioContext();

// create Oscillator node
const oscillator = audioCtx.createOscillator();

oscillator.type = "sine";
oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // value in hertz
//oscillator.connect(audioCtx.destination);
oscillator.start();

const gain = new GainNode(audioCtx);
const analyser = new AnalyserNode(audioCtx, {
    fftSize: 1024,
    smoothingTimeConstant: 0.8,
});
oscillator.connect(gain).connect(analyser)

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function applyAfterglowEffect() {
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - 0.92})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
function drawGrid(mode) {
//   const stepX = 100;
//   const stepY = 100;
//   const width = canvas.width;
//   const height = canvas.height;

//   // Save the current canvas state
//   ctx.save();
  
//   // Reset canvas transformations and settings
//   ctx.setTransform(1, 0, 0, 1, 0, 0);
//   ctx.globalCompositeOperation = 'source-over';
  
//   ctx.strokeStyle = theme.border + "33";
//   ctx.lineWidth = 0.5;

//   for (let x = 0; x <= width; x += stepX) {
//     ctx.beginPath();
//     ctx.moveTo(x, 0);
//     ctx.lineTo(x, height);
//     ctx.stroke();

//     ctx.fillStyle = theme.label;
//     ctx.fillText(mode === "fft" ? `${Math.round(x / width * audioCtx.sampleRate / 2)} Hz` : `${Math.round(x * 1000 / audioCtx.sampleRate)} ms`, x + 4, 12);
//   }

//   for (let y = 0; y <= height; y += stepY) {
//     ctx.beginPath();
//     ctx.moveTo(0, y);
//     ctx.lineTo(width, y);
//     ctx.stroke();
//   }

//   ctx.strokeStyle = theme.border + "66";
//   ctx.beginPath();
//   ctx.moveTo(width / 2, 0);
//   ctx.lineTo(width / 2, height);
//   ctx.moveTo(0, height / 2);
//   ctx.lineTo(width, height / 2);
//   ctx.stroke();

//   // Restore the previous canvas state
//   ctx.restore();
}

function drawWaveform() {


    analyser.getByteTimeDomainData(dataArray);

    const width = canvas.width;
    const height = canvas.height;
    const sliceWidth = width / bufferLength;

    applyAfterglowEffect();
    //drawGrid("waveform");

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



    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = theme.glow;
    ctx.shadowBlur = 10;
    ctx.shadowColor = theme.glow;

    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.restore();
    drawGrain();
    drawGrid("2dsheet");
   // applyAudioReactiveFilter();
}

function regenerateParticles() {
  particles.length = 0;
  for (let i = 0; i < particleCount; i++) {
    const u = Math.random();
    const v = Math.random();
    particles.push({
      u,
      v,
      x: 0,
      y: 0,
      z: 0,
      size: particleBaseSize,
      hue: Math.random() * 360
    });
  }
}
const particles = [];
let particleCount = 2000;
let particleBaseSize = 2;
let eqXFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.cos(2 * Math.PI * u);
let eqYFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * u);
let eqZFunc = (u, v, t, a) => Math.cos(Math.PI * v);

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
  //applyAudioReactiveFilter();
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
  //applyAudioReactiveFilter();
}
// Put them in an array
const modes = [drawWaveform, drawParticleCloud, drawPolygonMorph];
let currentIndex = 0;
const switchInterval = 4000; // switch every 4 seconds

function animate() {
  requestAnimationFrame(animate);
  modes[currentIndex](); // call the current drawing function
}

setInterval(() => {
  currentIndex = (currentIndex + 1) % modes.length; // move to next function cyclically
  regenerateParticles(); // optional reset
}, switchInterval);

animate();
