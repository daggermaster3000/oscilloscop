const canvas = document.getElementById("oscilloscope");
const ctx = canvas.getContext("2d");
const themeSelect = document.getElementById("themeSelect");
const displayModeSelect = document.getElementById("displayMode");

// Set initial canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize analyser
analyser.fftSize = 2048;
bufferLength = analyser.frequencyBinCount;
dataArray = new Uint8Array(bufferLength);

// Theme handling
themeSelect.addEventListener("change", () => {
  updateTheme(themeSelect.value);
});

// Display mode handling
function updateModeSpecificControls(mode) {
  // Get control sections
  const particleControls = document.getElementById('particleControls');
  const meshControls = document.getElementById('meshControls');
  const fourierControls = document.getElementById('fourierControls');
  const orbitalsControls = document.getElementById('orbitalsControls');
  const golControls = document.getElementById('golControls');
  
  // Hide all mode-specific controls by default
  if (particleControls) particleControls.style.display = 'none';
  if (meshControls) meshControls.style.display = 'none';
  if (fourierControls) fourierControls.style.display = 'none';
  if (orbitalsControls) orbitalsControls.style.display = 'none';
  if (golControls) golControls.style.display = 'none';
  
  // Show controls based on selected mode
  if (mode === 'Particle Cloud' && particleControls) {
    particleControls.style.display = 'block';
  } else if (mode === '3D Mesh' && meshControls) {
    meshControls.style.display = 'block';
  } else if (mode === 'Fourier Series Shape' && fourierControls) {
    fourierControls.style.display = 'block';
  } else if (mode === 'Harmonic Orbital Systems' && orbitalsControls) {
    orbitalsControls.style.display = 'block';
  } else if (mode === 'Game of Life' && golControls) {
    golControls.style.display = 'block';
  }
}

displayModeSelect.addEventListener("change", () => {
  const mode = displayModeSelect.value;
  if (mode === "fft") {
    analyser.fftSize = 256;
  } else {
    analyser.fftSize = 2048;
  }
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  // Update visibility of mode-specific controls
  updateModeSpecificControls(mode);
});

// Initialize control visibility on page load
updateModeSpecificControls(displayModeSelect.value);

// --- Particle Cloud State & Controls ---
const particles = [];
let particleCount = 2000;
let particleBaseSize = 2;
let eqXFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.cos(2 * Math.PI * u);
let eqYFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * u);
let eqZFunc = (u, v, t, a) => Math.cos(Math.PI * v);

function compileEquation(expr, fallback) {
  try {
    // Function of (u, v, t, a)
    // eslint-disable-next-line no-new-func
    const fn = new Function('u', 'v', 't', 'a', `return (${expr});`);
    // quick sanity check
    const test = fn(0.3, 0.7, 0.0, 0.5);
    if (!Number.isFinite(test)) return fallback;
    return fn;
  } catch (_) {
    return fallback;
  }
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

// Bind UI controls if present
const particleCountInput = document.getElementById('particleCount');
const particleSizeInput = document.getElementById('particleSize');
const particleSizeValue = document.getElementById('particleSizeValue');
const eqXInput = document.getElementById('eqX');
const eqYInput = document.getElementById('eqY');
const eqZInput = document.getElementById('eqZ');
const eqPresetSelect = document.getElementById('equationPreset');
const eqResetBtn = document.getElementById('equationResetBtn');
const responseModeSelect = document.getElementById('particleResponse');
const fourierHarmonicsInput = document.getElementById('fourierHarmonics');
const fourierHarmonicsValue = document.getElementById('fourierHarmonicsValue');
const fourierContributionInput = document.getElementById('fourierContribution');
const fourierContributionValue = document.getElementById('fourierContributionValue');
const orbitalsShowPathsInput = document.getElementById('orbitalsShowPaths');
const orbitalsPlanetSizeInput = document.getElementById('orbitalsPlanetSize');
const orbitalsPlanetSizeValue = document.getElementById('orbitalsPlanetSizeValue');
const orbitals3DInput = document.getElementById('orbitals3D');
const orbitalsTiltInput = document.getElementById('orbitalsTilt');
const orbitalsTiltValue = document.getElementById('orbitalsTiltValue');
const orbitalsDepthInput = document.getElementById('orbitalsDepth');
const orbitalsDepthValue = document.getElementById('orbitalsDepthValue');
const orbitalsSpinInput = document.getElementById('orbitalsSpin');
const orbitalsSpinValue = document.getElementById('orbitalsSpinValue');
// GoL controls
const golCellSizeInput = document.getElementById('golCellSize');
const golCellSizeValue = document.getElementById('golCellSizeValue');
const golReseedInput = document.getElementById('golReseed');
const golReseedValue = document.getElementById('golReseedValue');
const golBirthBoostInput = document.getElementById('golBirthBoost');
const golBirthBoostValue = document.getElementById('golBirthBoostValue');
const golSurvivalBoostInput = document.getElementById('golSurvivalBoost');
const golSurvivalBoostValue = document.getElementById('golSurvivalBoostValue');
const rotateXInput = document.getElementById('rotateX');
const rotateYInput = document.getElementById('rotateY');
const rotateZInput = document.getElementById('rotateZ');
const rotateXSpeedInput = document.getElementById('rotateXSpeed');
const rotateYSpeedInput = document.getElementById('rotateYSpeed');
const rotateZSpeedInput = document.getElementById('rotateZSpeed');
const rotateXSpeedValue = document.getElementById('rotateXSpeedValue');
const rotateYSpeedValue = document.getElementById('rotateYSpeedValue');
const rotateZSpeedValue = document.getElementById('rotateZSpeedValue');

// shared rotation state
window.particleRotation = {
  enableX: rotateXInput ? rotateXInput.checked : true,
  enableY: rotateYInput ? rotateYInput.checked : true,
  enableZ: rotateZInput ? rotateZInput.checked : false,
  speedX: rotateXSpeedInput ? parseFloat(rotateXSpeedInput.value) : 0.3,
  speedY: rotateYSpeedInput ? parseFloat(rotateYSpeedInput.value) : 0.6,
  speedZ: rotateZSpeedInput ? parseFloat(rotateZSpeedInput.value) : 0.2
};

if (particleCountInput) {
  particleCount = Math.max(100, Math.min(20000, parseInt(particleCountInput.value || '2000', 10)));
}
if (particleSizeInput) {
  particleBaseSize = parseFloat(particleSizeInput.value || '2');
  if (particleSizeValue) particleSizeValue.textContent = String(particleBaseSize);
}

regenerateParticles();

function updateEquationsFromUI() {
  if (!eqXInput || !eqYInput || !eqZInput) return;
  eqXFunc = compileEquation(eqXInput.value, eqXFunc);
  eqYFunc = compileEquation(eqYInput.value, eqYFunc);
  eqZFunc = compileEquation(eqZInput.value, eqZFunc);
}

updateEquationsFromUI();

if (particleCountInput) {
  particleCountInput.addEventListener('change', () => {
    const next = Math.max(100, Math.min(20000, parseInt(particleCountInput.value || '2000', 10)));
    particleCount = Number.isFinite(next) ? next : particleCount;
    regenerateParticles();
  });
}

if (particleSizeInput) {
  const onSize = () => {
    particleBaseSize = parseFloat(particleSizeInput.value || '2');
    if (particleSizeValue) particleSizeValue.textContent = String(particleBaseSize);
    // Update existing particle sizes lazily
    for (let i = 0; i < particles.length; i++) particles[i].size = particleBaseSize;
  };
  particleSizeInput.addEventListener('input', onSize);
  particleSizeInput.addEventListener('change', onSize);
}

if (eqXInput) eqXInput.addEventListener('change', updateEquationsFromUI);
if (eqYInput) eqYInput.addEventListener('change', updateEquationsFromUI);
if (eqZInput) eqZInput.addEventListener('change', updateEquationsFromUI);

function applyPreset(name) {
  if (!eqXInput || !eqYInput || !eqZInput) return;
  if (name === 'sphere') {
    eqXInput.value = 'Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u)';
    eqYInput.value = 'Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)';
    eqZInput.value = 'Math.cos(Math.PI*v)';
  } else if (name === 'torus') {
    // R=1, r=0.4, centered on origin
    eqXInput.value = '(1+0.4*Math.cos(2*Math.PI*v))*Math.cos(2*Math.PI*u)';
    eqYInput.value = '(1+0.4*Math.cos(2*Math.PI*v))*Math.sin(2*Math.PI*u)';
    eqZInput.value = '0.4*Math.sin(2*Math.PI*v)';
  } else if (name === 'helix') {
    eqXInput.value = 'Math.cos(4*Math.PI*u)';
    eqYInput.value = 'Math.sin(4*Math.PI*u)';
    eqZInput.value = '2*(v-0.5)';
  } else if (name === 'lissajous') {
    eqXInput.value = 'Math.sin(3*2*Math.PI*u + Math.PI/2)';
    eqYInput.value = 'Math.sin(4*2*Math.PI*v)';
    eqZInput.value = 'Math.sin(5*2*Math.PI*(u+v))';
  } else if (name === 'torusKnot') {
    // Torus knot p=2, q=3
    eqXInput.value = '(2+Math.cos(3*2*Math.PI*u))*Math.cos(2*2*Math.PI*u)';
    eqYInput.value = '(2+Math.cos(3*2*Math.PI*u))*Math.sin(2*2*Math.PI*u)';
    eqZInput.value = 'Math.sin(3*2*Math.PI*u)';
  } else if (name === 'mobius') {
    // Möbius strip parameterization (u in [0,1] as angle, v in [-0.5,0.5])
    eqXInput.value = '(1 + (v-0.5)*Math.cos(0.5*2*Math.PI*u))*Math.cos(2*Math.PI*u)';
    eqYInput.value = '(1 + (v-0.5)*Math.cos(0.5*2*Math.PI*u))*Math.sin(2*Math.PI*u)';
    eqZInput.value = '(v-0.5)*Math.sin(0.5*2*Math.PI*u)';
  } else if (name === 'highway') {
    // Highway: particles stream towards camera along -Z with slight lateral noise
    eqXInput.value = '0.8*(v-0.5)';
    eqYInput.value = '0.2*Math.sin(10*(u+v)+t)';
    eqZInput.value = '-(u)';
  }
  updateEquationsFromUI();
}

if (eqPresetSelect) {
  eqPresetSelect.addEventListener('change', () => applyPreset(eqPresetSelect.value));
}
if (eqResetBtn) {
  eqResetBtn.addEventListener('click', () => applyPreset(eqPresetSelect ? eqPresetSelect.value : 'sphere'));
}

// rotation presets
const rotatePresetSelect = document.getElementById('rotatePreset');
function applyRotatePreset(preset) {
  if (!rotatePresetSelect) return;
  const set = (ex, sx, ey, sy, ez, sz) => {
    if (rotateXInput) rotateXInput.checked = ex;
    if (rotateYInput) rotateYInput.checked = ey;
    if (rotateZInput) rotateZInput.checked = ez;
    if (rotateXSpeedInput) rotateXSpeedInput.value = sx;
    if (rotateYSpeedInput) rotateYSpeedInput.value = sy;
    if (rotateZSpeedInput) rotateZSpeedInput.value = sz;
  };
  switch (preset) {
    case 'spinY': set(false, 0, true, 0.8, false, 0); break;
    case 'spinX': set(true, 0.8, false, 0, false, 0); break;
    case 'spinZ': set(false, 0, false, 0, true, 0.8); break;
    case 'tumble': set(true, 0.7, true, 0.9, true, 1.1); break;
    case 'orbitXY': set(true, 0.6, true, 0.6, false, 0); break;
    default: set(false, 0, false, 0, false, 0); break;
  }
  bindRotationControl(rotateXInput, rotateXSpeedInput, rotateXSpeedValue, 'enableX', 'speedX');
  bindRotationControl(rotateYInput, rotateYSpeedInput, rotateYSpeedValue, 'enableY', 'speedY');
  bindRotationControl(rotateZInput, rotateZSpeedInput, rotateZSpeedValue, 'enableZ', 'speedZ');
}
if (rotatePresetSelect) {
  rotatePresetSelect.addEventListener('change', () => applyRotatePreset(rotatePresetSelect.value));
}

// response mode
window.particleResponseMode = responseModeSelect ? responseModeSelect.value : 'fft';
if (responseModeSelect) {
  responseModeSelect.addEventListener('change', () => {
    window.particleResponseMode = responseModeSelect.value;
  });
}

// Audio-driven rotation controls
const audioRotationInput = document.getElementById('audioRotation');
const audioRotationSourceSelect = document.getElementById('audioRotationSource');
const audioRotationIntensityInput = document.getElementById('audioRotationIntensity');
const audioRotationIntensityValue = document.getElementById('audioRotationIntensityValue');

window.audioRotationSettings = {
  enabled: false,
  source: 'frequency',
  intensity: 1.0
};

if (audioRotationInput) {
  audioRotationInput.addEventListener('change', () => {
    window.audioRotationSettings.enabled = audioRotationInput.checked;
  });
}

if (audioRotationSourceSelect) {
  audioRotationSourceSelect.addEventListener('change', () => {
    window.audioRotationSettings.source = audioRotationSourceSelect.value;
  });
}

if (audioRotationIntensityInput) {
  const updateIntensity = () => {
    const v = parseFloat(audioRotationIntensityInput.value);
    window.audioRotationSettings.intensity = v;
    if (audioRotationIntensityValue) audioRotationIntensityValue.textContent = v.toFixed(1);
  };
  audioRotationIntensityInput.addEventListener('input', updateIntensity);
  audioRotationIntensityInput.addEventListener('change', updateIntensity);
  updateIntensity();
}

// Audio morphing controls
const audioMorphInput = document.getElementById('audioMorph');
const audioMorphSourceSelect = document.getElementById('audioMorphSource');
const audioMorphIntensityInput = document.getElementById('audioMorphIntensity');
const audioMorphIntensityValue = document.getElementById('audioMorphIntensityValue');

window.audioMorphSettings = {
  enabled: false,
  source: 'frequency',
  intensity: 0.5
};

if (audioMorphInput) {
  audioMorphInput.addEventListener('change', () => {
    window.audioMorphSettings.enabled = audioMorphInput.checked;
  });
}

if (audioMorphSourceSelect) {
  audioMorphSourceSelect.addEventListener('change', () => {
    window.audioMorphSettings.source = audioMorphSourceSelect.value;
  });
}

if (audioMorphIntensityInput) {
  const updateIntensity = () => {
    const v = parseFloat(audioMorphIntensityInput.value);
    window.audioMorphSettings.intensity = v;
    if (audioMorphIntensityValue) audioMorphIntensityValue.textContent = v.toFixed(2);
  };
  audioMorphIntensityInput.addEventListener('input', updateIntensity);
  audioMorphIntensityInput.addEventListener('change', updateIntensity);
  updateIntensity();
}

// fourier settings
window.fourierSettings = {
  harmonics: fourierHarmonicsInput ? parseInt(fourierHarmonicsInput.value, 10) : 16,
  contribution: fourierContributionInput ? parseFloat(fourierContributionInput.value) : 0.2
};

function bindFourierControls() {
  if (fourierHarmonicsInput) {
    const onH = () => {
      const v = Math.max(1, Math.min(128, parseInt(fourierHarmonicsInput.value || '16', 10)));
      window.fourierSettings.harmonics = v;
      if (fourierHarmonicsValue) fourierHarmonicsValue.textContent = String(v);
    };
    fourierHarmonicsInput.addEventListener('input', onH);
    fourierHarmonicsInput.addEventListener('change', onH);
    onH();
  }
  if (fourierContributionInput) {
    const onC = () => {
      const v = Math.max(0, Math.min(1, parseFloat(fourierContributionInput.value || '0.2')));
      window.fourierSettings.contribution = v;
      if (fourierContributionValue) fourierContributionValue.textContent = v.toFixed(2);
    };
    fourierContributionInput.addEventListener('input', onC);
    fourierContributionInput.addEventListener('change', onC);
    onC();
  }
}

bindFourierControls();

// orbitals settings
window.orbitalsSettings = {
  showPaths: orbitalsShowPathsInput ? orbitalsShowPathsInput.checked : true,
  planetSize: orbitalsPlanetSizeInput ? parseFloat(orbitalsPlanetSizeInput.value) : 3,
  enable3D: orbitals3DInput ? orbitals3DInput.checked : true,
  tiltDeg: orbitalsTiltInput ? parseFloat(orbitalsTiltInput.value) : -30,
  depth: orbitalsDepthInput ? parseFloat(orbitalsDepthInput.value) : 700,
  spin: orbitalsSpinInput ? parseFloat(orbitalsSpinInput.value) : 0.4
};

function bindOrbitalsControls() {
  if (orbitalsShowPathsInput) {
    orbitalsShowPathsInput.addEventListener('change', () => {
      window.orbitalsSettings.showPaths = orbitalsShowPathsInput.checked;
    });
  }
  if (orbitalsPlanetSizeInput) {
    const onS = () => {
      const v = parseFloat(orbitalsPlanetSizeInput.value || '3');
      window.orbitalsSettings.planetSize = v;
      if (orbitalsPlanetSizeValue) orbitalsPlanetSizeValue.textContent = v.toFixed(1);
    };
    orbitalsPlanetSizeInput.addEventListener('input', onS);
    orbitalsPlanetSizeInput.addEventListener('change', onS);
    onS();
  }
  if (orbitals3DInput) {
    orbitals3DInput.addEventListener('change', () => {
      window.orbitalsSettings.enable3D = orbitals3DInput.checked;
    });
  }
  if (orbitalsTiltInput) {
    const onT = () => {
      const v = parseFloat(orbitalsTiltInput.value || '-30');
      window.orbitalsSettings.tiltDeg = v;
      if (orbitalsTiltValue) orbitalsTiltValue.textContent = String(v);
    };
    orbitalsTiltInput.addEventListener('input', onT);
    orbitalsTiltInput.addEventListener('change', onT);
    onT();
  }
  if (orbitalsDepthInput) {
    const onD = () => {
      const v = parseFloat(orbitalsDepthInput.value || '700');
      window.orbitalsSettings.depth = v;
      if (orbitalsDepthValue) orbitalsDepthValue.textContent = String(v);
    };
    orbitalsDepthInput.addEventListener('input', onD);
    orbitalsDepthInput.addEventListener('change', onD);
    onD();
  }
  if (orbitalsSpinInput) {
    const onSp = () => {
      const v = parseFloat(orbitalsSpinInput.value || '0.4');
      window.orbitalsSettings.spin = v;
      if (orbitalsSpinValue) orbitalsSpinValue.textContent = v.toFixed(2);
    };
    orbitalsSpinInput.addEventListener('input', onSp);
    orbitalsSpinInput.addEventListener('change', onSp);
    onSp();
  }
}

bindOrbitalsControls();

// GoL state
window.golSettings = {
  cellSize: golCellSizeInput ? parseInt(golCellSizeInput.value, 10) : 3,
  reseed: golReseedInput ? parseFloat(golReseedInput.value) : 0.3,
  birthBoost: golBirthBoostInput ? parseFloat(golBirthBoostInput.value) : 0.3,
  survivalBoost: golSurvivalBoostInput ? parseFloat(golSurvivalBoostInput.value) : 0.45
};

function bindGolControls() {
  if (golCellSizeInput) {
    const onS = () => {
      const v = Math.max(1, Math.min(24, parseInt(golCellSizeInput.value || '3', 10)));
      window.golSettings.cellSize = v;
      if (golCellSizeValue) golCellSizeValue.textContent = String(v);
    };
    golCellSizeInput.addEventListener('input', onS);
    golCellSizeInput.addEventListener('change', onS);
    onS();
  }
  if (golReseedInput) {
    const onR = () => {
      const v = Math.max(0, Math.min(1, parseFloat(golReseedInput.value || '0.3')));
      window.golSettings.reseed = v;
      if (golReseedValue) golReseedValue.textContent = v.toFixed(2);
    };
    golReseedInput.addEventListener('input', onR);
    golReseedInput.addEventListener('change', onR);
    onR();
  }
  if (golBirthBoostInput) {
    const onB = () => {
      const v = Math.max(0, Math.min(1, parseFloat(golBirthBoostInput.value || '0.3')));
      window.golSettings.birthBoost = v;
      if (golBirthBoostValue) golBirthBoostValue.textContent = v.toFixed(2);
    };
    golBirthBoostInput.addEventListener('input', onB);
    golBirthBoostInput.addEventListener('change', onB);
    onB();
  }
  if (golSurvivalBoostInput) {
    const onSv = () => {
      const v = Math.max(0, Math.min(1, parseFloat(golSurvivalBoostInput.value || '0.45')));
      window.golSettings.survivalBoost = v;
      if (golSurvivalBoostValue) golSurvivalBoostValue.textContent = v.toFixed(2);
    };
    golSurvivalBoostInput.addEventListener('input', onSv);
    golSurvivalBoostInput.addEventListener('change', onSv);
    onSv();
  }
}

bindGolControls();

function bindRotationControl(chk, speedInput, valueLabel, keyEnable, keySpeed) {
  if (!chk || !speedInput) return;
  const update = () => {
    window.particleRotation[keyEnable] = chk.checked;
    const sp = parseFloat(speedInput.value || '0');
    window.particleRotation[keySpeed] = Number.isFinite(sp) ? sp : 0;
    if (valueLabel) valueLabel.textContent = String(window.particleRotation[keySpeed].toFixed(2));
  };
  chk.addEventListener('change', update);
  speedInput.addEventListener('input', update);
  speedInput.addEventListener('change', update);
  update();
}

bindRotationControl(rotateXInput, rotateXSpeedInput, rotateXSpeedValue, 'enableX', 'speedX');
bindRotationControl(rotateYInput, rotateYSpeedInput, rotateYSpeedValue, 'enableY', 'speedY');
bindRotationControl(rotateZInput, rotateZSpeedInput, rotateZSpeedValue, 'enableZ', 'speedZ');

// --- 3D Mesh Controls ---
const meshResponseSelect = document.getElementById('meshResponse');
const meshResolutionInput = document.getElementById('meshResolution');
const meshResolutionValue = document.getElementById('meshResolutionValue');
const meshWireframeInput = document.getElementById('meshWireframe');
const meshFilledInput = document.getElementById('meshFilled');
const meshEqXInput = document.getElementById('meshEqX');
const meshEqYInput = document.getElementById('meshEqY');
const meshEqZInput = document.getElementById('meshEqZ');
const meshEqPresetSelect = document.getElementById('meshEquationPreset');
const meshEqResetBtn = document.getElementById('meshEquationResetBtn');
const meshRotateXInput = document.getElementById('meshRotateX');
const meshRotateYInput = document.getElementById('meshRotateY');
const meshRotateZInput = document.getElementById('meshRotateZ');
const meshRotateXSpeedInput = document.getElementById('meshRotateXSpeed');
const meshRotateYSpeedInput = document.getElementById('meshRotateYSpeed');
const meshRotateZSpeedInput = document.getElementById('meshRotateZSpeed');
const meshRotateXSpeedValue = document.getElementById('meshRotateXSpeedValue');
const meshRotateYSpeedValue = document.getElementById('meshRotateYSpeedValue');
const meshRotateZSpeedValue = document.getElementById('meshRotateZSpeedValue');

// Mesh state
window.meshSettings = {
  responseMode: 'fft',
  resolution: 30,
  wireframe: true,
  filled: false,
  rotation: { enableX: true, enableY: true, enableZ: false, speedX: 0.3, speedY: 0.6, speedZ: 0.2 }
};

window.meshEqXFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.cos(2 * Math.PI * u);
window.meshEqYFunc = (u, v, t, a) => Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * u);
window.meshEqZFunc = (u, v, t, a) => Math.cos(Math.PI * v);

function compileMeshEquation(expr, fallback) {
  try {
    const fn = new Function('u', 'v', 't', 'a', `return (${expr});`);
    const test = fn(0.3, 0.7, 0.0, 0.5);
    if (!Number.isFinite(test)) return fallback;
    return fn;
  } catch (_) {
    return fallback;
  }
}

function updateMeshEquationsFromUI() {
  if (!meshEqXInput || !meshEqYInput || !meshEqZInput) return;
  window.meshEqXFunc = compileMeshEquation(meshEqXInput.value, window.meshEqXFunc);
  window.meshEqYFunc = compileMeshEquation(meshEqYInput.value, window.meshEqYFunc);
  window.meshEqZFunc = compileMeshEquation(meshEqZInput.value, window.meshEqZFunc);
}

if (meshEqXInput) meshEqXInput.addEventListener('change', updateMeshEquationsFromUI);
if (meshEqYInput) meshEqYInput.addEventListener('change', updateMeshEquationsFromUI);
if (meshEqZInput) meshEqZInput.addEventListener('change', updateMeshEquationsFromUI);

function applyMeshPreset(name) {
  if (!meshEqXInput || !meshEqYInput || !meshEqZInput) return;
  if (name === 'sphere') {
    meshEqXInput.value = 'Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u)';
    meshEqYInput.value = 'Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)';
    meshEqZInput.value = 'Math.cos(Math.PI*v)';
  } else if (name === 'torus') {
    meshEqXInput.value = '(1+0.4*Math.cos(2*Math.PI*v))*Math.cos(2*Math.PI*u)';
    meshEqYInput.value = '(1+0.4*Math.cos(2*Math.PI*v))*Math.sin(2*Math.PI*u)';
    meshEqZInput.value = '0.4*Math.sin(2*Math.PI*v)';
  } else if (name === 'wave') {
    meshEqXInput.value = '(u-0.5)*2';
    meshEqYInput.value = '(v-0.5)*2';
    meshEqZInput.value = '0.3*Math.sin(4*Math.PI*u + t)*Math.cos(4*Math.PI*v + t)*a';
  } else if (name === 'ripple') {
    meshEqXInput.value = '(u-0.5)*2';
    meshEqYInput.value = '(v-0.5)*2';
    meshEqZInput.value = '0.3*Math.sin(8*Math.PI*Math.sqrt((u-0.5)**2 + (v-0.5)**2) - t*2)*a';
  } else if (name === 'terrain') {
    meshEqXInput.value = '(u-0.5)*2';
    meshEqYInput.value = '(v-0.5)*2';
    meshEqZInput.value = '0.2*(Math.sin(6*Math.PI*u)*Math.cos(6*Math.PI*v) + Math.sin(3*Math.PI*u+t)*a)';
  } else if (name === 'morphSphere') {
    meshEqXInput.value = 'Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u)*(1 + 0.8*a*Math.sin(t*3))';
    meshEqYInput.value = 'Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)*(1 + 0.8*a*Math.sin(t*3))';
    meshEqZInput.value = 'Math.cos(Math.PI*v)*(1 + 0.8*a*Math.sin(t*3))';
  } else if (name === 'morphTorus') {
    meshEqXInput.value = '(1+0.4*Math.cos(2*Math.PI*v)*(1+1.2*a))*Math.cos(2*Math.PI*u)';
    meshEqYInput.value = '(1+0.4*Math.cos(2*Math.PI*v)*(1+1.2*a))*Math.sin(2*Math.PI*u)';
    meshEqZInput.value = '0.4*Math.sin(2*Math.PI*v)*(1+0.8*a*Math.cos(t*4))';
  } else if (name === 'morphWave') {
    meshEqXInput.value = '(u-0.5)*2*(1+0.5*a*Math.sin(t*2))';
    meshEqYInput.value = '(v-0.5)*2*(1+0.5*a*Math.cos(t*2))';
    meshEqZInput.value = '0.6*Math.sin(4*Math.PI*u + t*3)*Math.cos(4*Math.PI*v + t*3)*a + 0.4*Math.sin(t*6)*a';
  }
  updateMeshEquationsFromUI();
}

if (meshEqPresetSelect) {
  meshEqPresetSelect.addEventListener('change', () => applyMeshPreset(meshEqPresetSelect.value));
}
if (meshEqResetBtn) {
  meshEqResetBtn.addEventListener('click', () => applyMeshPreset(meshEqPresetSelect ? meshEqPresetSelect.value : 'sphere'));
}

if (meshResponseSelect) {
  meshResponseSelect.addEventListener('change', () => {
    window.meshSettings.responseMode = meshResponseSelect.value;
  });
}

if (meshResolutionInput) {
  const updateRes = () => {
    const v = parseInt(meshResolutionInput.value);
    window.meshSettings.resolution = v;
    if (meshResolutionValue) meshResolutionValue.textContent = String(v);
  };
  meshResolutionInput.addEventListener('input', updateRes);
  meshResolutionInput.addEventListener('change', updateRes);
  updateRes();
}

if (meshWireframeInput) {
  meshWireframeInput.addEventListener('change', () => {
    window.meshSettings.wireframe = meshWireframeInput.checked;
  });
}

if (meshFilledInput) {
  meshFilledInput.addEventListener('change', () => {
    window.meshSettings.filled = meshFilledInput.checked;
  });
}

function bindMeshRotationControl(chk, speedInput, valueLabel, keyEnable, keySpeed) {
  if (!chk || !speedInput) return;
  const update = () => {
    window.meshSettings.rotation[keyEnable] = chk.checked;
    const sp = parseFloat(speedInput.value || '0');
    window.meshSettings.rotation[keySpeed] = Number.isFinite(sp) ? sp : 0;
    if (valueLabel) valueLabel.textContent = String(window.meshSettings.rotation[keySpeed].toFixed(2));
  };
  chk.addEventListener('change', update);
  speedInput.addEventListener('input', update);
  speedInput.addEventListener('change', update);
  update();
}

bindMeshRotationControl(meshRotateXInput, meshRotateXSpeedInput, meshRotateXSpeedValue, 'enableX', 'speedX');
bindMeshRotationControl(meshRotateYInput, meshRotateYSpeedInput, meshRotateYSpeedValue, 'enableY', 'speedY');
bindMeshRotationControl(meshRotateZInput, meshRotateZSpeedInput, meshRotateZSpeedValue, 'enableZ', 'speedZ');

// --- Audio-Reactive Filters ---
const filterEffectSelect = document.getElementById('filterEffect');
const filterIntensityInput = document.getElementById('filterIntensity');
const filterIntensityValue = document.getElementById('filterIntensityValue');
const filterResponseSelect = document.getElementById('filterResponse');
const filterResponseStrengthInput = document.getElementById('filterResponseStrength');
const filterResponseStrengthValue = document.getElementById('filterResponseStrengthValue');

window.audioFilterSettings = {
  effect: 'none',
  intensity: 0.5,
  response: 'frequency',
  responseStrength: 1.0
};

if (filterEffectSelect) {
  filterEffectSelect.addEventListener('change', () => {
    window.audioFilterSettings.effect = filterEffectSelect.value;
  });
}

if (filterIntensityInput) {
  const updateIntensity = () => {
    const v = parseFloat(filterIntensityInput.value);
    window.audioFilterSettings.intensity = v;
    if (filterIntensityValue) filterIntensityValue.textContent = v.toFixed(2);
  };
  filterIntensityInput.addEventListener('input', updateIntensity);
  filterIntensityInput.addEventListener('change', updateIntensity);
  updateIntensity();
}

if (filterResponseSelect) {
  filterResponseSelect.addEventListener('change', () => {
    window.audioFilterSettings.response = filterResponseSelect.value;
  });
}

if (filterResponseStrengthInput) {
  const updateStrength = () => {
    const v = parseFloat(filterResponseStrengthInput.value);
    window.audioFilterSettings.responseStrength = v;
    if (filterResponseStrengthValue) filterResponseStrengthValue.textContent = v.toFixed(2);
  };
  filterResponseStrengthInput.addEventListener('input', updateStrength);
  filterResponseStrengthInput.addEventListener('change', updateStrength);
  updateStrength();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const mode = displayModeSelect.value;
  switch (mode) {
    case "fft":
      drawFFT();
      break;
    case "stereo":
      drawStereoPhase();
      break;
    case "3D Waveform flat":
      draw3DWaveformflat();
      break;
    case "3D Waveform top":
        draw3DWaveformtop();
        break;
    case "3D Spectrogram":
      draw3DSpectrogram();
        break;
    case "2D Spectrogram":
      draw2DSpectrogram();
        break;
    case "Particle Cloud":
      drawParticleCloud();
        break;
    case "3D Mesh":
      draw3DMesh();
        break;
    case "Fourier Series Shape":
      drawFourierSeriesShape();
      break;
    case "Polygon Morph":
      drawPolygonMorph();
      break;
    case "Harmonic Orbital Systems":
      drawHarmonicOrbitals();
      break;
    case "Game of Life":
      drawGameOfLife();
      break;
    default:
      drawWaveform();
  }
}

// Initialize theme and start animation
updateTheme("green");
animate(); 