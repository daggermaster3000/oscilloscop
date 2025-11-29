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
  const themeName = themeSelect.value;
  updateTheme(themeName);
  
  // Broadcast theme change to settings window
  if (settingsWindow && !settingsWindow.closed) {
    settingsWindow.postMessage({
      type: 'theme_change',
      themeName: themeName
    }, '*');
  }
  broadcastChannel.postMessage({
    type: 'theme_change',
    themeName: themeName
  });
});

// Display mode handling
function updateModeSpecificControls(mode) {
  // Get control sections
  const particleControls = document.getElementById('particleControls');
  const meshControls = document.getElementById('meshControls');
  const fourierControls = document.getElementById('fourierControls');
  const orbitalsControls = document.getElementById('orbitalsControls');
  const golControls = document.getElementById('golControls');
  const mfccControls = document.getElementById('mfccControls');
  const olympicRingsControls = document.getElementById('olympicRingsControls');
  
  // Hide all mode-specific controls by default
  if (particleControls) particleControls.style.display = 'none';
  if (meshControls) meshControls.style.display = 'none';
  if (fourierControls) fourierControls.style.display = 'none';
  if (orbitalsControls) orbitalsControls.style.display = 'none';
  if (golControls) golControls.style.display = 'none';
  if (mfccControls) mfccControls.style.display = 'none';
  if (olympicRingsControls) olympicRingsControls.style.display = 'none';
  
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
  } else if (mode === 'MFCC Trajectory' && mfccControls) {
    mfccControls.style.display = 'block';
  } else if (mode === 'Olympic Rings' && olympicRingsControls) {
    olympicRingsControls.style.display = 'block';
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

// --- MFCC Controls ---
const mfccSubdivisionSelect = document.getElementById('mfccSubdivision');
const mfccBeatSensitivityInput = document.getElementById('mfccBeatSensitivity');
const mfccBeatSensitivityValue = document.getElementById('mfccBeatSensitivityValue');
const mfccPointLifetimeInput = document.getElementById('mfccPointLifetime');
const mfccPointLifetimeValue = document.getElementById('mfccPointLifetimeValue');
const mfccPointSizeInput = document.getElementById('mfccPointSize');
const mfccPointSizeValue = document.getElementById('mfccPointSizeValue');
const mfccMaxPointsInput = document.getElementById('mfccMaxPoints');
const mfccMaxPointsValue = document.getElementById('mfccMaxPointsValue');
const mfccShowTrailInput = document.getElementById('mfccShowTrail');
const mfccDimensionsSelect = document.getElementById('mfccDimensions');
const mfccVisualizationModeSelect = document.getElementById('mfccVisualizationMode');
const mfccSubdivisionModeSelect = document.getElementById('mfccSubdivisionMode');
const mfccTimeSubdivisionInput = document.getElementById('mfccTimeSubdivision');
const mfccTimeSubdivisionValue = document.getElementById('mfccTimeSubdivisionValue');

if (mfccSubdivisionSelect) {
  mfccSubdivisionSelect.addEventListener('change', () => {
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.subdivision = parseInt(mfccSubdivisionSelect.value);
    }
  });
}

if (mfccBeatSensitivityInput) {
  const updateSensitivity = () => {
    const v = parseFloat(mfccBeatSensitivityInput.value);
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.threshold = v;
    }
    if (mfccBeatSensitivityValue) mfccBeatSensitivityValue.textContent = v.toFixed(1);
  };
  mfccBeatSensitivityInput.addEventListener('input', updateSensitivity);
  mfccBeatSensitivityInput.addEventListener('change', updateSensitivity);
  updateSensitivity();
}

if (mfccPointLifetimeInput) {
  const updateLifetime = () => {
    const v = parseInt(mfccPointLifetimeInput.value);
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.pointLifetime = v;
    }
    if (mfccPointLifetimeValue) mfccPointLifetimeValue.textContent = v;
  };
  mfccPointLifetimeInput.addEventListener('input', updateLifetime);
  mfccPointLifetimeInput.addEventListener('change', updateLifetime);
  updateLifetime();
}

if (mfccPointSizeInput) {
  const updatePointSize = () => {
    const v = parseInt(mfccPointSizeInput.value);
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.pointSize = v;
    }
    if (mfccPointSizeValue) mfccPointSizeValue.textContent = v;
  };
  mfccPointSizeInput.addEventListener('input', updatePointSize);
  mfccPointSizeInput.addEventListener('change', updatePointSize);
  updatePointSize();
}

if (mfccMaxPointsInput) {
  const updateMaxPoints = () => {
    const v = parseInt(mfccMaxPointsInput.value);
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.maxPoints = v;
    }
    if (mfccMaxPointsValue) mfccMaxPointsValue.textContent = v;
  };
  mfccMaxPointsInput.addEventListener('input', updateMaxPoints);
  mfccMaxPointsInput.addEventListener('change', updateMaxPoints);
  updateMaxPoints();
}

if (mfccShowTrailInput) {
  mfccShowTrailInput.addEventListener('change', () => {
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.showTrail = mfccShowTrailInput.checked;
    }
  });
}

if (mfccDimensionsSelect) {
  mfccDimensionsSelect.addEventListener('change', () => {
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.dimensions = parseInt(mfccDimensionsSelect.value);
    }
  });
}

if (mfccVisualizationModeSelect) {
  mfccVisualizationModeSelect.addEventListener('change', () => {
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.visualizationMode = mfccVisualizationModeSelect.value;
    }
  });
}

if (mfccSubdivisionModeSelect) {
  mfccSubdivisionModeSelect.addEventListener('change', () => {
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.subdivisionMode = mfccSubdivisionModeSelect.value;
    }
  });
}

if (mfccTimeSubdivisionInput) {
  const updateTimeSubdivision = () => {
    const v = parseInt(mfccTimeSubdivisionInput.value);
    if (window.mfccBeatDetector) {
      window.mfccBeatDetector.timeSubdivision = v;
    }
    if (mfccTimeSubdivisionValue) mfccTimeSubdivisionValue.textContent = v;
  };
  mfccTimeSubdivisionInput.addEventListener('input', updateTimeSubdivision);
  mfccTimeSubdivisionInput.addEventListener('change', updateTimeSubdivision);
  updateTimeSubdivision();
}

// --- Olympic Rings Controls ---
const olympicRingsModeSelect = document.getElementById('olympicRingsMode');
const olympicRingsSizeInput = document.getElementById('olympicRingsSize');
const olympicRingsSizeValue = document.getElementById('olympicRingsSizeValue');
const olympicRingsThicknessInput = document.getElementById('olympicRingsThickness');
const olympicRingsThicknessValue = document.getElementById('olympicRingsThicknessValue');
const olympicRingsResponseSpeedInput = document.getElementById('olympicRingsResponseSpeed');
const olympicRingsResponseSpeedValue = document.getElementById('olympicRingsResponseSpeedValue');
const olympicRingsRotationSpeedInput = document.getElementById('olympicRingsRotationSpeed');
const olympicRingsRotationSpeedValue = document.getElementById('olympicRingsRotationSpeedValue');

if (olympicRingsModeSelect) {
  const updateControlVisibility = () => {
    const mode = olympicRingsModeSelect.value;
    const beatControls = document.getElementById('olympicRingsBeatControls');
    const freqControls = document.getElementById('olympicRingsFrequencyControls');
    const channelControls = document.getElementById('olympicRingsChannelControls');
    
    // Show/hide beat controls
    if (beatControls) beatControls.style.display = mode === 'beat' ? 'block' : 'none';
    
    if (mode === 'beat') {
      // In beat mode, show frequency/channel controls based on beat source
      const beatSourceSelect = document.getElementById('olympicRingsBeatSource');
      const beatSource = beatSourceSelect ? beatSourceSelect.value : 'frequency';
      if (freqControls) freqControls.style.display = beatSource === 'frequency' ? 'block' : 'none';
      if (channelControls) channelControls.style.display = beatSource === 'channel' ? 'block' : 'none';
      
      // Initialize channel controls if needed
      if (beatSource === 'channel') {
        updateOlympicRingsChannelControls();
      }
    } else {
      // In frequency/channel mode, show respective controls
      if (freqControls) freqControls.style.display = mode === 'frequency' ? 'block' : 'none';
      if (channelControls) channelControls.style.display = mode === 'channel' ? 'block' : 'none';
      
      // Initialize channel controls if switching to channel mode
      if (mode === 'channel') {
        updateOlympicRingsChannelControls();
      }
    }
  };
  
  olympicRingsModeSelect.addEventListener('change', () => {
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.mode = olympicRingsModeSelect.value;
      updateControlVisibility();
    }
  });
  
  // Initialize channel controls on page load if needed
  if (window.olympicRingsSettings) {
    if (window.olympicRingsSettings.mode === 'channel' || 
        (window.olympicRingsSettings.mode === 'beat' && window.olympicRingsSettings.beatSource === 'channel')) {
      updateOlympicRingsChannelControls();
    }
    updateControlVisibility();
  }
}

// Function to update channel mapping controls based on available channels
function updateOlympicRingsChannelControls() {
  const channelInputs = document.getElementById('olympicRingsChannelInputs');
  if (!channelInputs) return;
  
  // Get available channel count (from global maxChannels or default to 2)
  const availableChannels = typeof window.maxChannels !== 'undefined' ? window.maxChannels : 2;
  
  const ringNames = ['Ring 1 (Blue)', 'Ring 2 (Yellow)', 'Ring 3 (Black)', 'Ring 4 (Green)', 'Ring 5 (Red)'];
  channelInputs.innerHTML = '';
  
  // Add info about available channels
  const infoLabel = document.createElement('div');
  infoLabel.style.marginBottom = '10px';
  infoLabel.style.fontSize = '12px';
  infoLabel.style.color = theme.label;
  infoLabel.textContent = `Available Channels: ${availableChannels}`;
  channelInputs.appendChild(infoLabel);
  
  for (let i = 0; i < 5; i++) {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '10px';
    
    const ringLabel = document.createElement('span');
    ringLabel.textContent = `${ringNames[i]}: `;
    ringLabel.style.marginRight = '10px';
    
    const select = document.createElement('select');
    select.id = `olympicRingsChannel${i}`;
    select.style.marginLeft = '5px';
    
    // Create options for each available channel
    for (let ch = 0; ch < availableChannels; ch++) {
      const option = document.createElement('option');
      option.value = ch.toString();
      
      // Use friendly names for first two channels, then channel numbers
      if (ch === 0) {
        option.textContent = 'Channel 1 (Left)';
      } else if (ch === 1) {
        option.textContent = 'Channel 2 (Right)';
      } else {
        option.textContent = `Channel ${ch + 1}`;
      }
      
      // Set selected based on current setting (clamp to available channels)
      const currentChannel = window.olympicRingsSettings.ringChannels[i];
      if (ch === Math.min(currentChannel, availableChannels - 1)) {
        option.selected = true;
        // Update settings to ensure it's within bounds
        window.olympicRingsSettings.ringChannels[i] = Math.min(currentChannel, availableChannels - 1);
      }
      
      select.appendChild(option);
    }
    
    select.addEventListener('change', () => {
      if (window.olympicRingsSettings) {
        window.olympicRingsSettings.ringChannels[i] = parseInt(select.value);
      }
    });
    
    label.appendChild(ringLabel);
    label.appendChild(select);
    channelInputs.appendChild(label);
  }
}

if (olympicRingsSizeInput) {
  const updateSize = () => {
    const v = parseInt(olympicRingsSizeInput.value);
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.ringSize = v;
    }
    if (olympicRingsSizeValue) olympicRingsSizeValue.textContent = v;
  };
  olympicRingsSizeInput.addEventListener('input', updateSize);
  olympicRingsSizeInput.addEventListener('change', updateSize);
  updateSize();
}

if (olympicRingsThicknessInput) {
  const updateThickness = () => {
    const v = parseInt(olympicRingsThicknessInput.value);
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.ringThickness = v;
    }
    if (olympicRingsThicknessValue) olympicRingsThicknessValue.textContent = v;
  };
  olympicRingsThicknessInput.addEventListener('input', updateThickness);
  olympicRingsThicknessInput.addEventListener('change', updateThickness);
  updateThickness();
}

if (olympicRingsResponseSpeedInput) {
  const updateResponseSpeed = () => {
    const v = parseFloat(olympicRingsResponseSpeedInput.value);
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.responseSpeed = v;
    }
    if (olympicRingsResponseSpeedValue) olympicRingsResponseSpeedValue.textContent = v.toFixed(1);
  };
  olympicRingsResponseSpeedInput.addEventListener('input', updateResponseSpeed);
  olympicRingsResponseSpeedInput.addEventListener('change', updateResponseSpeed);
  updateResponseSpeed();
}

if (olympicRingsRotationSpeedInput) {
  const updateRotationSpeed = () => {
    const v = parseFloat(olympicRingsRotationSpeedInput.value);
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.rotationSpeed = v;
    }
    if (olympicRingsRotationSpeedValue) olympicRingsRotationSpeedValue.textContent = v.toFixed(1);
  };
  olympicRingsRotationSpeedInput.addEventListener('input', updateRotationSpeed);
  olympicRingsRotationSpeedInput.addEventListener('change', updateRotationSpeed);
  updateRotationSpeed();
}

// Additional Olympic Rings controls
const olympicRingsSpacingXInput = document.getElementById('olympicRingsSpacingX');
const olympicRingsSpacingXValue = document.getElementById('olympicRingsSpacingXValue');
const olympicRingsSpacingYInput = document.getElementById('olympicRingsSpacingY');
const olympicRingsSpacingYValue = document.getElementById('olympicRingsSpacingYValue');
const olympicRingsLayoutScaleInput = document.getElementById('olympicRingsLayoutScale');
const olympicRingsLayoutScaleValue = document.getElementById('olympicRingsLayoutScaleValue');
const olympicRingsHorizontalOffsetInput = document.getElementById('olympicRingsHorizontalOffset');
const olympicRingsHorizontalOffsetValue = document.getElementById('olympicRingsHorizontalOffsetValue');
const olympicRingsVerticalOffsetInput = document.getElementById('olympicRingsVerticalOffset');
const olympicRingsVerticalOffsetValue = document.getElementById('olympicRingsVerticalOffsetValue');
const olympicRingsSizeMinScaleInput = document.getElementById('olympicRingsSizeMinScale');
const olympicRingsSizeMinScaleValue = document.getElementById('olympicRingsSizeMinScaleValue');
const olympicRingsSizeMaxScaleInput = document.getElementById('olympicRingsSizeMaxScale');
const olympicRingsSizeMaxScaleValue = document.getElementById('olympicRingsSizeMaxScaleValue');
const olympicRingsSizeSensitivityInput = document.getElementById('olympicRingsSizeSensitivity');
const olympicRingsSizeSensitivityValue = document.getElementById('olympicRingsSizeSensitivityValue');
const olympicRingsThicknessMinScaleInput = document.getElementById('olympicRingsThicknessMinScale');
const olympicRingsThicknessMinScaleValue = document.getElementById('olympicRingsThicknessMinScaleValue');
const olympicRingsThicknessMaxScaleInput = document.getElementById('olympicRingsThicknessMaxScale');
const olympicRingsThicknessMaxScaleValue = document.getElementById('olympicRingsThicknessMaxScaleValue');
const olympicRingsThicknessSensitivityInput = document.getElementById('olympicRingsThicknessSensitivity');
const olympicRingsThicknessSensitivityValue = document.getElementById('olympicRingsThicknessSensitivityValue');
const olympicRingsShowFillInput = document.getElementById('olympicRingsShowFill');
const olympicRingsFillOpacityInput = document.getElementById('olympicRingsFillOpacity');
const olympicRingsFillOpacityValue = document.getElementById('olympicRingsFillOpacityValue');
const olympicRingsFillOpacitySensitivityInput = document.getElementById('olympicRingsFillOpacitySensitivity');
const olympicRingsFillOpacitySensitivityValue = document.getElementById('olympicRingsFillOpacitySensitivityValue');
const olympicRingsShowGlowInput = document.getElementById('olympicRingsShowGlow');
const olympicRingsGlowIntensityInput = document.getElementById('olympicRingsGlowIntensity');
const olympicRingsGlowIntensityValue = document.getElementById('olympicRingsGlowIntensityValue');
const olympicRingsGlowSensitivityInput = document.getElementById('olympicRingsGlowSensitivity');
const olympicRingsGlowSensitivityValue = document.getElementById('olympicRingsGlowSensitivityValue');
const olympicRingsRingOpacityInput = document.getElementById('olympicRingsRingOpacity');
const olympicRingsRingOpacityValue = document.getElementById('olympicRingsRingOpacityValue');
const olympicRingsFrequencySensitivityInput = document.getElementById('olympicRingsFrequencySensitivity');
const olympicRingsFrequencySensitivityValue = document.getElementById('olympicRingsFrequencySensitivityValue');
const olympicRingsChannelSensitivityInput = document.getElementById('olympicRingsChannelSensitivity');
const olympicRingsChannelSensitivityValue = document.getElementById('olympicRingsChannelSensitivityValue');

// Helper function to bind slider controls
function bindOlympicRingsSlider(input, valueLabel, settingKey, formatFn = (v) => v.toFixed(1)) {
  if (!input) return;
  const update = () => {
    const v = parseFloat(input.value);
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings[settingKey] = v;
    }
    if (valueLabel) valueLabel.textContent = formatFn(v);
  };
  input.addEventListener('input', update);
  input.addEventListener('change', update);
  update();
}

// Helper function to bind checkbox controls
function bindOlympicRingsCheckbox(input, settingKey) {
  if (!input) return;
  const update = () => {
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings[settingKey] = input.checked;
    }
  };
  input.addEventListener('change', update);
  update();
}

// Bind all new controls
bindOlympicRingsSlider(olympicRingsSpacingXInput, olympicRingsSpacingXValue, 'ringSpacingX', (v) => parseFloat(v).toFixed(1));
bindOlympicRingsSlider(olympicRingsSpacingYInput, olympicRingsSpacingYValue, 'ringSpacingY', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsLayoutScaleInput, olympicRingsLayoutScaleValue, 'layoutScale');
bindOlympicRingsSlider(olympicRingsHorizontalOffsetInput, olympicRingsHorizontalOffsetValue, 'horizontalOffset', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsVerticalOffsetInput, olympicRingsVerticalOffsetValue, 'verticalOffset', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsSizeMinScaleInput, olympicRingsSizeMinScaleValue, 'sizeMinScale');
bindOlympicRingsSlider(olympicRingsSizeMaxScaleInput, olympicRingsSizeMaxScaleValue, 'sizeMaxScale');
bindOlympicRingsSlider(olympicRingsSizeSensitivityInput, olympicRingsSizeSensitivityValue, 'sizeSensitivity');
bindOlympicRingsSlider(olympicRingsThicknessMinScaleInput, olympicRingsThicknessMinScaleValue, 'thicknessMinScale');
bindOlympicRingsSlider(olympicRingsThicknessMaxScaleInput, olympicRingsThicknessMaxScaleValue, 'thicknessMaxScale');
bindOlympicRingsSlider(olympicRingsThicknessSensitivityInput, olympicRingsThicknessSensitivityValue, 'thicknessSensitivity');
bindOlympicRingsCheckbox(olympicRingsShowFillInput, 'showFill');
bindOlympicRingsSlider(olympicRingsFillOpacityInput, olympicRingsFillOpacityValue, 'fillOpacity');
bindOlympicRingsSlider(olympicRingsFillOpacitySensitivityInput, olympicRingsFillOpacitySensitivityValue, 'fillOpacitySensitivity');
bindOlympicRingsCheckbox(olympicRingsShowGlowInput, 'showGlow');
bindOlympicRingsSlider(olympicRingsGlowIntensityInput, olympicRingsGlowIntensityValue, 'glowIntensity', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsGlowSensitivityInput, olympicRingsGlowSensitivityValue, 'glowSensitivity', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsRingOpacityInput, olympicRingsRingOpacityValue, 'ringOpacity');
bindOlympicRingsSlider(olympicRingsFrequencySensitivityInput, olympicRingsFrequencySensitivityValue, 'frequencySensitivity');
bindOlympicRingsSlider(olympicRingsChannelSensitivityInput, olympicRingsChannelSensitivityValue, 'channelSensitivity');

// Beat detection controls
const olympicRingsBeatSourceInput = document.getElementById('olympicRingsBeatSource');
const olympicRingsBeatThresholdInput = document.getElementById('olympicRingsBeatThreshold');
const olympicRingsBeatThresholdValue = document.getElementById('olympicRingsBeatThresholdValue');
const olympicRingsBeatDecayInput = document.getElementById('olympicRingsBeatDecay');
const olympicRingsBeatDecayValue = document.getElementById('olympicRingsBeatDecayValue');
const olympicRingsBeatMinIntervalInput = document.getElementById('olympicRingsBeatMinInterval');
const olympicRingsBeatMinIntervalValue = document.getElementById('olympicRingsBeatMinIntervalValue');
const olympicRingsBeatSensitivityInput = document.getElementById('olympicRingsBeatSensitivity');
const olympicRingsBeatSensitivityValue = document.getElementById('olympicRingsBeatSensitivityValue');

if (olympicRingsBeatSourceInput) {
  olympicRingsBeatSourceInput.addEventListener('change', () => {
    if (window.olympicRingsSettings) {
      window.olympicRingsSettings.beatSource = olympicRingsBeatSourceInput.value;
      // Update control visibility
      const mode = olympicRingsModeSelect ? olympicRingsModeSelect.value : 'frequency';
      if (mode === 'beat') {
        const freqControls = document.getElementById('olympicRingsFrequencyControls');
        const channelControls = document.getElementById('olympicRingsChannelControls');
        if (freqControls) freqControls.style.display = olympicRingsBeatSourceInput.value === 'frequency' ? 'block' : 'none';
        if (channelControls) channelControls.style.display = olympicRingsBeatSourceInput.value === 'channel' ? 'block' : 'none';
        
        if (olympicRingsBeatSourceInput.value === 'channel') {
          updateOlympicRingsChannelControls();
        }
      }
    }
  });
}

bindOlympicRingsSlider(olympicRingsBeatThresholdInput, olympicRingsBeatThresholdValue, 'beatThreshold');
bindOlympicRingsSlider(olympicRingsBeatDecayInput, olympicRingsBeatDecayValue, 'beatDecay');
bindOlympicRingsSlider(olympicRingsBeatMinIntervalInput, olympicRingsBeatMinIntervalValue, 'beatMinInterval', (v) => v.toString());
bindOlympicRingsSlider(olympicRingsBeatSensitivityInput, olympicRingsBeatSensitivityValue, 'beatSensitivity');

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
    case "MFCC Trajectory":
      drawMFCCTrajectory();
      break;
    case "Olympic Rings":
      drawOlympicRings();
      break;
    default:
      drawWaveform();
  }
}

// Initialize theme and start animation (only if not in settings window)
if (!window.isSettingsWindow) {
  updateTheme("green");
  animate();
}

// --- Dual Window / Projector Mode ---
let settingsWindow = null;
const broadcastChannel = new BroadcastChannel('oscilloscope_settings');

// Settings window management
const openSettingsWindowBtn = document.getElementById('openSettingsWindowBtn');
const hideControlsBtn = document.getElementById('hideControlsBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const controlsPanel = document.getElementById('controls');

if (openSettingsWindowBtn) {
  openSettingsWindowBtn.addEventListener('click', () => {
    if (settingsWindow && !settingsWindow.closed) {
      settingsWindow.focus();
      return;
    }
    
    // Open settings window
    const width = 600;
    const height = window.screen.height - 100;
    const left = window.screen.width - width - 20;
    const top = 50;
    
    settingsWindow = window.open(
      'settings.html',
      'oscilloscopeSettings',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (settingsWindow) {
      // Reset initialization flag when opening new window
      settingsWindowInitialized = false;
      
      // Wait for window to load, then send controls HTML
      settingsWindow.addEventListener('load', () => {
        setTimeout(() => {
          sendInitialSettingsToWindow();
        }, 500);
      });
      
      // Send settings when window opens
      setTimeout(() => {
        sendInitialSettingsToWindow();
      }, 500);
    }
  });
}

function sendSettingsToWindow() {
  if (settingsWindow && !settingsWindow.closed) {
    const controlsHTML = controlsPanel.innerHTML;
    const currentTheme = themeSelect ? themeSelect.value : 'green';
    
    settingsWindow.postMessage({
      type: 'settings_html',
      html: controlsHTML,
      currentTheme: currentTheme,
      isInitial: !settingsWindowInitialized
    }, '*');
    
    broadcastChannel.postMessage({
      type: 'settings_html',
      html: controlsHTML,
      currentTheme: currentTheme,
      isInitial: !settingsWindowInitialized
    });
  }
}

// Hide/show controls panel (button)
if (hideControlsBtn) {
  hideControlsBtn.addEventListener('click', () => {
    toggleControlsVisibility();
  });
}

// Helper to toggle controls visibility
function toggleControlsVisibility() {
  if (!controlsPanel) return;
  const isHidden = controlsPanel.style.display === 'none';
  controlsPanel.style.display = isHidden ? 'block' : 'none';
  if (hideControlsBtn) {
    hideControlsBtn.textContent = isHidden ? 'Hide Controls' : 'Show Controls';
  }
}

// Keyboard shortcut: 's' to hide/show settings (main window only)
if (!window.isSettingsWindow) {
  window.addEventListener('keydown', (e) => {
    // Ignore when typing in inputs or textareas
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.altKey || e.metaKey || e.ctrlKey) {
      return;
    }
    // Key 's' or 'S'
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      toggleControlsVisibility();
    }
  });
}

// Fullscreen mode
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  });
  
  // Update button text based on fullscreen state
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenBtn.textContent = 'Exit Fullscreen';
      // Optionally hide controls when entering fullscreen
      if (settingsWindow && !settingsWindow.closed) {
        controlsPanel.style.display = 'none';
      }
    } else {
      fullscreenBtn.textContent = 'Fullscreen';
    }
  });
}

// Listen for control changes from settings window
window.addEventListener('message', (event) => {
  if (event.data.type === 'request_settings') {
    sendSettingsToWindow();
  } else if (event.data.type === 'control_change') {
    // Update control value in main window
    const control = document.getElementById(event.data.id);
    if (control) {
      const oldValue = control.type === 'checkbox' ? control.checked : control.value;
      if (control.type === 'checkbox') {
        control.checked = event.data.value;
      } else {
        control.value = event.data.value;
      }
      // Special handling for theme select - ensure theme is applied
      if (control.id === 'themeSelect' && control.value !== oldValue) {
        const themeName = control.value;
        updateTheme(themeName);
        // Broadcast theme change to settings window
        if (settingsWindow && !settingsWindow.closed) {
          settingsWindow.postMessage({
            type: 'theme_change',
            themeName: themeName
          }, '*');
        }
        broadcastChannel.postMessage({
          type: 'theme_change',
          themeName: themeName
        });
      } else {
        // Trigger change event to update visualization
        const eventType = control.type === 'range' ? 'input' : 'change';
        control.dispatchEvent(new Event(eventType, { bubbles: true }));
      }
    }
  } else if (event.data.type === 'button_click') {
    // Trigger button click in main window
    const button = document.getElementById(event.data.id);
    if (button) {
      button.click();
    }
  } else if (event.data.type === 'file_selected') {
    // Handle file selection from settings window
    handleFileFromSettings(event.data);
  }
});

// Handle file selection from settings window
function handleFileFromSettings(fileData) {
  const fileInput = document.getElementById(fileData.id);
  if (!fileInput) return;
  
  // Create a Blob from the ArrayBuffer
  const blob = new Blob([fileData.fileData], { type: fileData.fileType });
  const file = new File([blob], fileData.fileName, { type: fileData.fileType });
  
  // Create a DataTransfer object to set files
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  
  // Trigger change event on file input
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

// Listen for broadcast channel messages
broadcastChannel.addEventListener('message', (event) => {
  if (event.data.type === 'control_change') {
    const control = document.getElementById(event.data.id);
    if (control) {
      const oldValue = control.type === 'checkbox' ? control.checked : control.value;
      if (control.type === 'checkbox') {
        control.checked = event.data.value;
      } else {
        control.value = event.data.value;
      }
      // Special handling for theme select - ensure theme is applied
      if (control.id === 'themeSelect' && control.value !== oldValue) {
        const themeName = control.value;
        updateTheme(themeName);
        // Broadcast theme change to settings window
        if (settingsWindow && !settingsWindow.closed) {
          settingsWindow.postMessage({
            type: 'theme_change',
            themeName: themeName
          }, '*');
        }
        broadcastChannel.postMessage({
          type: 'theme_change',
          themeName: themeName
        });
      } else {
        const eventType = control.type === 'range' ? 'input' : 'change';
        control.dispatchEvent(new Event(eventType, { bubbles: true }));
      }
    }
  } else if (event.data.type === 'button_click') {
    const button = document.getElementById(event.data.id);
    if (button) {
      button.click();
    }
  } else if (event.data.type === 'file_selected') {
    handleFileFromSettings(event.data);
  } else if (event.data.type === 'theme_change') {
    // Sync theme to settings window
    if (settingsWindow && !settingsWindow.closed) {
      settingsWindow.postMessage({
        type: 'theme_change',
        themeName: event.data.themeName
      }, '*');
    }
  }
});

// Send settings HTML when controls are updated (for settings window)
function syncSettingsToWindow() {
  if (settingsWindow && !settingsWindow.closed) {
    sendSettingsToWindow();
  }
}

// Track if settings window has received initial HTML
let settingsWindowInitialized = false;

// Send initial settings HTML to settings window (only once per window instance)
function sendInitialSettingsToWindow() {
  if (settingsWindow && !settingsWindow.closed) {
    if (!settingsWindowInitialized) {
      sendSettingsToWindow();
      settingsWindowInitialized = true;
    }
  }
}

// Monitor for changes in controls and sync to settings window
// Only send HTML updates if the structure actually changed (new controls added/removed)
// For value changes, we rely on the control_change messages instead
setInterval(() => {
  if (settingsWindow && !settingsWindow.closed && settingsWindowInitialized) {
    // Check if controls HTML structure has changed (not just values)
    const currentHTML = controlsPanel.innerHTML;
    // Only update if structure changed significantly (more than just value attributes)
    // This is a simple check - we could make it more sophisticated
    if (currentHTML !== lastControlsHTML) {
      // Check if it's just value changes or actual structure changes
      const currentControls = Array.from(controlsPanel.querySelectorAll('input, select, button')).map(el => ({
        id: el.id,
        type: el.type,
        tag: el.tagName
      }));
      const lastControls = Array.from(controlsPanel.querySelectorAll('input, select, button')).map(el => ({
        id: el.id,
        type: el.type,
        tag: el.tagName
      }));
      
      // Only send HTML if structure changed (new/removed controls)
      const structureChanged = JSON.stringify(currentControls) !== JSON.stringify(lastControls);
      if (structureChanged) {
        sendSettingsToWindow();
        lastControlsHTML = currentHTML;
      }
    }
  }
}, 5000); // Check less frequently - every 5 seconds instead of 1 second

let lastControlsHTML = controlsPanel ? controlsPanel.innerHTML : '';

// --- URL Parameter Management ---
// This system syncs all settings to URL parameters for easy sharing and bookmarking

// Serialize all settings to URL parameters
function serializeSettingsToURL() {
  const params = new URLSearchParams();
  
  // Basic settings
  if (displayModeSelect) params.set('mode', displayModeSelect.value);
  if (themeSelect) params.set('theme', themeSelect.value);
  if (inputSourceSelect) params.set('inputSource', inputSourceSelect.value);
  
  // Global visual settings (knobs)
  params.set('afterglow', afterglowOpacity.toFixed(2));
  params.set('lineWidth', lineWidth.toFixed(1));
  params.set('smoothing', smoothingFactor.toFixed(2));
  
  // Particle Cloud settings
  if (particleCountInput) params.set('particleCount', particleCountInput.value);
  if (particleSizeInput) params.set('particleSize', particleSizeInput.value);
  if (eqXInput) params.set('eqX', encodeURIComponent(eqXInput.value));
  if (eqYInput) params.set('eqY', encodeURIComponent(eqYInput.value));
  if (eqZInput) params.set('eqZ', encodeURIComponent(eqZInput.value));
  if (eqPresetSelect) params.set('eqPreset', eqPresetSelect.value);
  if (responseModeSelect) params.set('particleResponse', responseModeSelect.value);
  if (rotateXInput) params.set('rotateX', rotateXInput.checked ? '1' : '0');
  if (rotateYInput) params.set('rotateY', rotateYInput.checked ? '1' : '0');
  if (rotateZInput) params.set('rotateZ', rotateZInput.checked ? '1' : '0');
  if (rotateXSpeedInput) params.set('rotateXSpeed', rotateXSpeedInput.value);
  if (rotateYSpeedInput) params.set('rotateYSpeed', rotateYSpeedInput.value);
  if (rotateZSpeedInput) params.set('rotateZSpeed', rotateZSpeedInput.value);
  if (rotatePresetSelect) params.set('rotatePreset', rotatePresetSelect.value);
  
  // Audio rotation settings
  if (audioRotationInput) params.set('audioRotation', audioRotationInput.checked ? '1' : '0');
  if (audioRotationSourceSelect) params.set('audioRotationSource', audioRotationSourceSelect.value);
  if (audioRotationIntensityInput) params.set('audioRotationIntensity', audioRotationIntensityInput.value);
  
  // Audio morph settings
  if (audioMorphInput) params.set('audioMorph', audioMorphInput.checked ? '1' : '0');
  if (audioMorphSourceSelect) params.set('audioMorphSource', audioMorphSourceSelect.value);
  if (audioMorphIntensityInput) params.set('audioMorphIntensity', audioMorphIntensityInput.value);
  
  // Fourier settings
  if (fourierHarmonicsInput) params.set('fourierHarmonics', fourierHarmonicsInput.value);
  if (fourierContributionInput) params.set('fourierContribution', fourierContributionInput.value);
  
  // Orbitals settings
  if (orbitalsShowPathsInput) params.set('orbitalsShowPaths', orbitalsShowPathsInput.checked ? '1' : '0');
  if (orbitalsPlanetSizeInput) params.set('orbitalsPlanetSize', orbitalsPlanetSizeInput.value);
  if (orbitals3DInput) params.set('orbitals3D', orbitals3DInput.checked ? '1' : '0');
  if (orbitalsTiltInput) params.set('orbitalsTilt', orbitalsTiltInput.value);
  if (orbitalsDepthInput) params.set('orbitalsDepth', orbitalsDepthInput.value);
  if (orbitalsSpinInput) params.set('orbitalsSpin', orbitalsSpinInput.value);
  
  // GoL settings
  if (golCellSizeInput) params.set('golCellSize', golCellSizeInput.value);
  if (golReseedInput) params.set('golReseed', golReseedInput.value);
  if (golBirthBoostInput) params.set('golBirthBoost', golBirthBoostInput.value);
  if (golSurvivalBoostInput) params.set('golSurvivalBoost', golSurvivalBoostInput.value);
  
  // Mesh settings
  if (meshResponseSelect) params.set('meshResponse', meshResponseSelect.value);
  if (meshResolutionInput) params.set('meshResolution', meshResolutionInput.value);
  if (meshWireframeInput) params.set('meshWireframe', meshWireframeInput.checked ? '1' : '0');
  if (meshFilledInput) params.set('meshFilled', meshFilledInput.checked ? '1' : '0');
  if (meshEqXInput) params.set('meshEqX', encodeURIComponent(meshEqXInput.value));
  if (meshEqYInput) params.set('meshEqY', encodeURIComponent(meshEqYInput.value));
  if (meshEqZInput) params.set('meshEqZ', encodeURIComponent(meshEqZInput.value));
  if (meshEqPresetSelect) params.set('meshEqPreset', meshEqPresetSelect.value);
  if (meshRotateXInput) params.set('meshRotateX', meshRotateXInput.checked ? '1' : '0');
  if (meshRotateYInput) params.set('meshRotateY', meshRotateYInput.checked ? '1' : '0');
  if (meshRotateZInput) params.set('meshRotateZ', meshRotateZInput.checked ? '1' : '0');
  if (meshRotateXSpeedInput) params.set('meshRotateXSpeed', meshRotateXSpeedInput.value);
  if (meshRotateYSpeedInput) params.set('meshRotateYSpeed', meshRotateYSpeedInput.value);
  if (meshRotateZSpeedInput) params.set('meshRotateZSpeed', meshRotateZSpeedInput.value);
  
  // MFCC settings
  if (mfccSubdivisionModeSelect) params.set('mfccSubdivisionMode', mfccSubdivisionModeSelect.value);
  if (mfccSubdivisionSelect) params.set('mfccSubdivision', mfccSubdivisionSelect.value);
  if (mfccTimeSubdivisionInput) params.set('mfccTimeSubdivision', mfccTimeSubdivisionInput.value);
  if (mfccBeatSensitivityInput) params.set('mfccBeatSensitivity', mfccBeatSensitivityInput.value);
  if (mfccPointLifetimeInput) params.set('mfccPointLifetime', mfccPointLifetimeInput.value);
  if (mfccPointSizeInput) params.set('mfccPointSize', mfccPointSizeInput.value);
  if (mfccMaxPointsInput) params.set('mfccMaxPoints', mfccMaxPointsInput.value);
  if (mfccShowTrailInput) params.set('mfccShowTrail', mfccShowTrailInput.checked ? '1' : '0');
  if (mfccDimensionsSelect) params.set('mfccDimensions', mfccDimensionsSelect.value);
  if (mfccVisualizationModeSelect) params.set('mfccVisualizationMode', mfccVisualizationModeSelect.value);
  
  // Olympic Rings settings
  if (olympicRingsModeSelect) params.set('olympicRingsMode', olympicRingsModeSelect.value);
  if (olympicRingsBeatSourceInput) params.set('olympicRingsBeatSource', olympicRingsBeatSourceInput.value);
  if (olympicRingsBeatThresholdInput) params.set('olympicRingsBeatThreshold', olympicRingsBeatThresholdInput.value);
  if (olympicRingsBeatDecayInput) params.set('olympicRingsBeatDecay', olympicRingsBeatDecayInput.value);
  if (olympicRingsBeatMinIntervalInput) params.set('olympicRingsBeatMinInterval', olympicRingsBeatMinIntervalInput.value);
  if (olympicRingsBeatSensitivityInput) params.set('olympicRingsBeatSensitivity', olympicRingsBeatSensitivityInput.value);
  if (olympicRingsSizeInput) params.set('olympicRingsSize', olympicRingsSizeInput.value);
  if (olympicRingsThicknessInput) params.set('olympicRingsThickness', olympicRingsThicknessInput.value);
  if (olympicRingsResponseSpeedInput) params.set('olympicRingsResponseSpeed', olympicRingsResponseSpeedInput.value);
  if (olympicRingsRotationSpeedInput) params.set('olympicRingsRotationSpeed', olympicRingsRotationSpeedInput.value);
  if (olympicRingsSpacingXInput) params.set('olympicRingsSpacingX', olympicRingsSpacingXInput.value);
  if (olympicRingsSpacingYInput) params.set('olympicRingsSpacingY', olympicRingsSpacingYInput.value);
  if (olympicRingsLayoutScaleInput) params.set('olympicRingsLayoutScale', olympicRingsLayoutScaleInput.value);
  if (olympicRingsHorizontalOffsetInput) params.set('olympicRingsHorizontalOffset', olympicRingsHorizontalOffsetInput.value);
  if (olympicRingsVerticalOffsetInput) params.set('olympicRingsVerticalOffset', olympicRingsVerticalOffsetInput.value);
  if (olympicRingsSizeMinScaleInput) params.set('olympicRingsSizeMinScale', olympicRingsSizeMinScaleInput.value);
  if (olympicRingsSizeMaxScaleInput) params.set('olympicRingsSizeMaxScale', olympicRingsSizeMaxScaleInput.value);
  if (olympicRingsSizeSensitivityInput) params.set('olympicRingsSizeSensitivity', olympicRingsSizeSensitivityInput.value);
  if (olympicRingsThicknessMinScaleInput) params.set('olympicRingsThicknessMinScale', olympicRingsThicknessMinScaleInput.value);
  if (olympicRingsThicknessMaxScaleInput) params.set('olympicRingsThicknessMaxScale', olympicRingsThicknessMaxScaleInput.value);
  if (olympicRingsThicknessSensitivityInput) params.set('olympicRingsThicknessSensitivity', olympicRingsThicknessSensitivityInput.value);
  if (olympicRingsShowFillInput) params.set('olympicRingsShowFill', olympicRingsShowFillInput.checked ? '1' : '0');
  if (olympicRingsFillOpacityInput) params.set('olympicRingsFillOpacity', olympicRingsFillOpacityInput.value);
  if (olympicRingsFillOpacitySensitivityInput) params.set('olympicRingsFillOpacitySensitivity', olympicRingsFillOpacitySensitivityInput.value);
  if (olympicRingsShowGlowInput) params.set('olympicRingsShowGlow', olympicRingsShowGlowInput.checked ? '1' : '0');
  if (olympicRingsGlowIntensityInput) params.set('olympicRingsGlowIntensity', olympicRingsGlowIntensityInput.value);
  if (olympicRingsGlowSensitivityInput) params.set('olympicRingsGlowSensitivity', olympicRingsGlowSensitivityInput.value);
  if (olympicRingsRingOpacityInput) params.set('olympicRingsRingOpacity', olympicRingsRingOpacityInput.value);
  if (olympicRingsFrequencySensitivityInput) params.set('olympicRingsFrequencySensitivity', olympicRingsFrequencySensitivityInput.value);
  if (olympicRingsChannelSensitivityInput) params.set('olympicRingsChannelSensitivity', olympicRingsChannelSensitivityInput.value);
  
  // Olympic Rings frequency ranges (stored as JSON)
  if (window.olympicRingsSettings) {
    params.set('olympicRingsFrequencies', JSON.stringify(window.olympicRingsSettings.ringFrequencies));
    params.set('olympicRingsChannels', JSON.stringify(window.olympicRingsSettings.ringChannels));
  }
  
  // Audio Filter settings
  if (filterEffectSelect) params.set('filterEffect', filterEffectSelect.value);
  if (filterIntensityInput) params.set('filterIntensity', filterIntensityInput.value);
  if (filterResponseSelect) params.set('filterResponse', filterResponseSelect.value);
  if (filterResponseStrengthInput) params.set('filterResponseStrength', filterResponseStrengthInput.value);
  
  // Update URL without page reload
  const newURL = window.location.pathname + '?' + params.toString();
  window.history.replaceState({}, '', newURL);
}

// Make function globally accessible for copy button
window.serializeSettingsToURL = serializeSettingsToURL;

// ===== PRESET SYSTEM =====
// Serialize all settings to a JSON object
function serializeSettingsToJSON() {
  const settings = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    // Basic settings
    displayMode: displayModeSelect ? displayModeSelect.value : '',
    theme: themeSelect ? themeSelect.value : '',
    inputSource: inputSourceSelect ? inputSourceSelect.value : '',
    // Global visual settings
    afterglow: afterglowOpacity,
    smoothing: smoothingFactor,
    lineWidth: lineWidth,
    // Particle Cloud settings
    particleResponse: document.getElementById('particleResponse')?.value || '',
    particleCount: document.getElementById('particleCount')?.value || '',
    particleSize: document.getElementById('particleSize')?.value || '',
    equationPreset: document.getElementById('equationPreset')?.value || '',
    eqX: document.getElementById('eqX')?.value || '',
    eqY: document.getElementById('eqY')?.value || '',
    eqZ: document.getElementById('eqZ')?.value || '',
    rotatePreset: document.getElementById('rotatePreset')?.value || '',
    rotateX: document.getElementById('rotateX')?.checked || false,
    rotateY: document.getElementById('rotateY')?.checked || false,
    rotateZ: document.getElementById('rotateZ')?.checked || false,
    rotateXSpeed: document.getElementById('rotateXSpeed')?.value || '',
    rotateYSpeed: document.getElementById('rotateYSpeed')?.value || '',
    rotateZSpeed: document.getElementById('rotateZSpeed')?.value || '',
    // Audio rotation
    audioRotation: document.getElementById('audioRotation')?.checked || false,
    audioRotationSource: document.getElementById('audioRotationSource')?.value || '',
    audioRotationIntensity: document.getElementById('audioRotationIntensity')?.value || '',
    // Audio morph
    audioMorph: document.getElementById('audioMorph')?.checked || false,
    audioMorphSource: document.getElementById('audioMorphSource')?.value || '',
    audioMorphIntensity: document.getElementById('audioMorphIntensity')?.value || '',
    // Mesh settings
    meshResponse: document.getElementById('meshResponse')?.value || '',
    meshResolution: document.getElementById('meshResolution')?.value || '',
    meshWireframe: document.getElementById('meshWireframe')?.checked || false,
    meshFilled: document.getElementById('meshFilled')?.checked || false,
    meshEquationPreset: document.getElementById('meshEquationPreset')?.value || '',
    meshEqX: document.getElementById('meshEqX')?.value || '',
    meshEqY: document.getElementById('meshEqY')?.value || '',
    meshEqZ: document.getElementById('meshEqZ')?.value || '',
    meshRotateX: document.getElementById('meshRotateX')?.checked || false,
    meshRotateY: document.getElementById('meshRotateY')?.checked || false,
    meshRotateZ: document.getElementById('meshRotateZ')?.checked || false,
    meshRotateXSpeed: document.getElementById('meshRotateXSpeed')?.value || '',
    meshRotateYSpeed: document.getElementById('meshRotateYSpeed')?.value || '',
    meshRotateZSpeed: document.getElementById('meshRotateZSpeed')?.value || '',
    // Fourier settings
    fourierHarmonics: document.getElementById('fourierHarmonics')?.value || '',
    fourierContribution: document.getElementById('fourierContribution')?.value || '',
    // Orbitals settings
    orbitalsShowPaths: document.getElementById('orbitalsShowPaths')?.checked || false,
    orbitalsPlanetSize: document.getElementById('orbitalsPlanetSize')?.value || '',
    orbitals3D: document.getElementById('orbitals3D')?.checked || false,
    orbitalsTilt: document.getElementById('orbitalsTilt')?.value || '',
    orbitalsDepth: document.getElementById('orbitalsDepth')?.value || '',
    orbitalsSpin: document.getElementById('orbitalsSpin')?.value || '',
    // Game of Life settings
    golCellSize: document.getElementById('golCellSize')?.value || '',
    golReseed: document.getElementById('golReseed')?.value || '',
    golBirthBoost: document.getElementById('golBirthBoost')?.value || '',
    golSurvivalBoost: document.getElementById('golSurvivalBoost')?.value || '',
    // MFCC settings
    mfccSubdivisionMode: document.getElementById('mfccSubdivisionMode')?.value || '',
    mfccSubdivision: document.getElementById('mfccSubdivision')?.value || '',
    mfccTimeSubdivision: document.getElementById('mfccTimeSubdivision')?.value || '',
    mfccBeatSensitivity: document.getElementById('mfccBeatSensitivity')?.value || '',
    mfccPointLifetime: document.getElementById('mfccPointLifetime')?.value || '',
    mfccPointSize: document.getElementById('mfccPointSize')?.value || '',
    mfccMaxPoints: document.getElementById('mfccMaxPoints')?.value || '',
    mfccShowTrail: document.getElementById('mfccShowTrail')?.checked || false,
    mfccDimensions: document.getElementById('mfccDimensions')?.value || '',
    mfccVisualizationMode: document.getElementById('mfccVisualizationMode')?.value || '',
    // Olympic Rings settings
    olympicRingsMode: document.getElementById('olympicRingsMode')?.value || '',
    olympicRingsBeatSource: document.getElementById('olympicRingsBeatSource')?.value || '',
    olympicRingsBeatThreshold: document.getElementById('olympicRingsBeatThreshold')?.value || '',
    olympicRingsBeatDecay: document.getElementById('olympicRingsBeatDecay')?.value || '',
    olympicRingsBeatMinInterval: document.getElementById('olympicRingsBeatMinInterval')?.value || '',
    olympicRingsBeatSensitivity: document.getElementById('olympicRingsBeatSensitivity')?.value || '',
    olympicRingsSize: document.getElementById('olympicRingsSize')?.value || '',
    olympicRingsThickness: document.getElementById('olympicRingsThickness')?.value || '',
    olympicRingsResponseSpeed: document.getElementById('olympicRingsResponseSpeed')?.value || '',
    olympicRingsRotationSpeed: document.getElementById('olympicRingsRotationSpeed')?.value || '',
    olympicRingsSpacingX: document.getElementById('olympicRingsSpacingX')?.value || '',
    olympicRingsSpacingY: document.getElementById('olympicRingsSpacingY')?.value || '',
    olympicRingsLayoutScale: document.getElementById('olympicRingsLayoutScale')?.value || '',
    olympicRingsHorizontalOffset: document.getElementById('olympicRingsHorizontalOffset')?.value || '',
    olympicRingsVerticalOffset: document.getElementById('olympicRingsVerticalOffset')?.value || '',
    olympicRingsSizeMinScale: document.getElementById('olympicRingsSizeMinScale')?.value || '',
    olympicRingsSizeMaxScale: document.getElementById('olympicRingsSizeMaxScale')?.value || '',
    olympicRingsSizeSensitivity: document.getElementById('olympicRingsSizeSensitivity')?.value || '',
    olympicRingsThicknessMinScale: document.getElementById('olympicRingsThicknessMinScale')?.value || '',
    olympicRingsThicknessMaxScale: document.getElementById('olympicRingsThicknessMaxScale')?.value || '',
    olympicRingsThicknessSensitivity: document.getElementById('olympicRingsThicknessSensitivity')?.value || '',
    olympicRingsShowFill: document.getElementById('olympicRingsShowFill')?.checked || false,
    olympicRingsFillOpacity: document.getElementById('olympicRingsFillOpacity')?.value || '',
    olympicRingsFillOpacitySensitivity: document.getElementById('olympicRingsFillOpacitySensitivity')?.value || '',
    olympicRingsShowGlow: document.getElementById('olympicRingsShowGlow')?.checked || false,
    olympicRingsGlowIntensity: document.getElementById('olympicRingsGlowIntensity')?.value || '',
    olympicRingsGlowSensitivity: document.getElementById('olympicRingsGlowSensitivity')?.value || '',
    olympicRingsRingOpacity: document.getElementById('olympicRingsRingOpacity')?.value || '',
    olympicRingsFrequencySensitivity: document.getElementById('olympicRingsFrequencySensitivity')?.value || '',
    olympicRingsChannelSensitivity: document.getElementById('olympicRingsChannelSensitivity')?.value || '',
    // Olympic Rings frequency ranges and channels (from settings object)
    olympicRingsFrequencies: window.olympicRingsSettings ? JSON.stringify(window.olympicRingsSettings.ringFrequencies) : '',
    olympicRingsChannels: window.olympicRingsSettings ? JSON.stringify(window.olympicRingsSettings.ringChannels) : '',
    // Filter settings
    filterEffect: document.getElementById('filterEffect')?.value || '',
    filterIntensity: document.getElementById('filterIntensity')?.value || '',
    filterResponse: document.getElementById('filterResponse')?.value || '',
    filterResponseStrength: document.getElementById('filterResponseStrength')?.value || ''
  };
  
  return settings;
}

// Deserialize and apply settings from JSON object
function deserializeSettingsFromJSON(settings) {
  if (!settings || typeof settings !== 'object') {
    console.error('Invalid settings object');
    return false;
  }
  
  try {
    // Basic settings
    if (settings.displayMode && displayModeSelect) {
      displayModeSelect.value = settings.displayMode;
      displayModeSelect.dispatchEvent(new Event('change'));
    }
    if (settings.theme && themeSelect) {
      themeSelect.value = settings.theme;
      themeSelect.dispatchEvent(new Event('change'));
    }
    if (settings.inputSource && inputSourceSelect) {
      inputSourceSelect.value = settings.inputSource;
      inputSourceSelect.dispatchEvent(new Event('change'));
    }
    
    // Global visual settings
    if (settings.afterglow !== undefined) {
      afterglowOpacity = parseFloat(settings.afterglow);
      if (afterglowKnob) afterglowKnob.setValue(afterglowOpacity);
    }
    if (settings.smoothing !== undefined) {
      smoothingFactor = parseFloat(settings.smoothing);
      if (smoothingKnob) smoothingKnob.setValue(smoothingFactor);
    }
    if (settings.lineWidth !== undefined) {
      lineWidth = parseFloat(settings.lineWidth);
      if (lineWidthKnob) lineWidthKnob.setValue(lineWidth);
    }
    
    // Helper function to set input value and trigger event
    const setInputValue = (id, value, isCheckbox = false) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== '') {
        if (isCheckbox) {
          el.checked = value === true || value === '1' || value === 1;
        } else {
          el.value = value;
        }
        const eventType = (el.tagName === 'INPUT' && el.type === 'range') ? 'input' : 'change';
        el.dispatchEvent(new Event(eventType));
      }
    };
    
    // Apply all settings
    setInputValue('particleResponse', settings.particleResponse);
    setInputValue('particleCount', settings.particleCount);
    setInputValue('particleSize', settings.particleSize);
    setInputValue('equationPreset', settings.equationPreset);
    if (settings.equationPreset && document.getElementById('equationPreset')) {
      document.getElementById('equationPreset').dispatchEvent(new Event('change'));
    }
    setInputValue('eqX', settings.eqX);
    setInputValue('eqY', settings.eqY);
    setInputValue('eqZ', settings.eqZ);
    setInputValue('rotatePreset', settings.rotatePreset);
    if (settings.rotatePreset && document.getElementById('rotatePreset')) {
      document.getElementById('rotatePreset').dispatchEvent(new Event('change'));
    }
    setInputValue('rotateX', settings.rotateX, true);
    setInputValue('rotateY', settings.rotateY, true);
    setInputValue('rotateZ', settings.rotateZ, true);
    setInputValue('rotateXSpeed', settings.rotateXSpeed);
    setInputValue('rotateYSpeed', settings.rotateYSpeed);
    setInputValue('rotateZSpeed', settings.rotateZSpeed);
    
    setInputValue('audioRotation', settings.audioRotation, true);
    setInputValue('audioRotationSource', settings.audioRotationSource);
    setInputValue('audioRotationIntensity', settings.audioRotationIntensity);
    setInputValue('audioMorph', settings.audioMorph, true);
    setInputValue('audioMorphSource', settings.audioMorphSource);
    setInputValue('audioMorphIntensity', settings.audioMorphIntensity);
    
    setInputValue('meshResponse', settings.meshResponse);
    setInputValue('meshResolution', settings.meshResolution);
    setInputValue('meshWireframe', settings.meshWireframe, true);
    setInputValue('meshFilled', settings.meshFilled, true);
    setInputValue('meshEquationPreset', settings.meshEquationPreset);
    if (settings.meshEquationPreset && document.getElementById('meshEquationPreset')) {
      document.getElementById('meshEquationPreset').dispatchEvent(new Event('change'));
    }
    setInputValue('meshEqX', settings.meshEqX);
    setInputValue('meshEqY', settings.meshEqY);
    setInputValue('meshEqZ', settings.meshEqZ);
    setInputValue('meshRotateX', settings.meshRotateX, true);
    setInputValue('meshRotateY', settings.meshRotateY, true);
    setInputValue('meshRotateZ', settings.meshRotateZ, true);
    setInputValue('meshRotateXSpeed', settings.meshRotateXSpeed);
    setInputValue('meshRotateYSpeed', settings.meshRotateYSpeed);
    setInputValue('meshRotateZSpeed', settings.meshRotateZSpeed);
    
    setInputValue('fourierHarmonics', settings.fourierHarmonics);
    setInputValue('fourierContribution', settings.fourierContribution);
    
    setInputValue('orbitalsShowPaths', settings.orbitalsShowPaths, true);
    setInputValue('orbitalsPlanetSize', settings.orbitalsPlanetSize);
    setInputValue('orbitals3D', settings.orbitals3D, true);
    setInputValue('orbitalsTilt', settings.orbitalsTilt);
    setInputValue('orbitalsDepth', settings.orbitalsDepth);
    setInputValue('orbitalsSpin', settings.orbitalsSpin);
    
    setInputValue('golCellSize', settings.golCellSize);
    setInputValue('golReseed', settings.golReseed);
    setInputValue('golBirthBoost', settings.golBirthBoost);
    setInputValue('golSurvivalBoost', settings.golSurvivalBoost);
    
    setInputValue('mfccSubdivisionMode', settings.mfccSubdivisionMode);
    setInputValue('mfccSubdivision', settings.mfccSubdivision);
    setInputValue('mfccTimeSubdivision', settings.mfccTimeSubdivision);
    setInputValue('mfccBeatSensitivity', settings.mfccBeatSensitivity);
    setInputValue('mfccPointLifetime', settings.mfccPointLifetime);
    setInputValue('mfccPointSize', settings.mfccPointSize);
    setInputValue('mfccMaxPoints', settings.mfccMaxPoints);
    setInputValue('mfccShowTrail', settings.mfccShowTrail, true);
    setInputValue('mfccDimensions', settings.mfccDimensions);
    setInputValue('mfccVisualizationMode', settings.mfccVisualizationMode);
    
    // Olympic Rings settings
    setInputValue('olympicRingsMode', settings.olympicRingsMode);
    if (settings.olympicRingsMode && document.getElementById('olympicRingsMode')) {
      document.getElementById('olympicRingsMode').dispatchEvent(new Event('change'));
    }
    setInputValue('olympicRingsBeatSource', settings.olympicRingsBeatSource);
    setInputValue('olympicRingsBeatThreshold', settings.olympicRingsBeatThreshold);
    setInputValue('olympicRingsBeatDecay', settings.olympicRingsBeatDecay);
    setInputValue('olympicRingsBeatMinInterval', settings.olympicRingsBeatMinInterval);
    setInputValue('olympicRingsBeatSensitivity', settings.olympicRingsBeatSensitivity);
    setInputValue('olympicRingsSize', settings.olympicRingsSize);
    setInputValue('olympicRingsThickness', settings.olympicRingsThickness);
    setInputValue('olympicRingsResponseSpeed', settings.olympicRingsResponseSpeed);
    setInputValue('olympicRingsRotationSpeed', settings.olympicRingsRotationSpeed);
    setInputValue('olympicRingsSpacingX', settings.olympicRingsSpacingX);
    setInputValue('olympicRingsSpacingY', settings.olympicRingsSpacingY);
    setInputValue('olympicRingsLayoutScale', settings.olympicRingsLayoutScale);
    setInputValue('olympicRingsHorizontalOffset', settings.olympicRingsHorizontalOffset);
    setInputValue('olympicRingsVerticalOffset', settings.olympicRingsVerticalOffset);
    setInputValue('olympicRingsSizeMinScale', settings.olympicRingsSizeMinScale);
    setInputValue('olympicRingsSizeMaxScale', settings.olympicRingsSizeMaxScale);
    setInputValue('olympicRingsSizeSensitivity', settings.olympicRingsSizeSensitivity);
    setInputValue('olympicRingsThicknessMinScale', settings.olympicRingsThicknessMinScale);
    setInputValue('olympicRingsThicknessMaxScale', settings.olympicRingsThicknessMaxScale);
    setInputValue('olympicRingsThicknessSensitivity', settings.olympicRingsThicknessSensitivity);
    setInputValue('olympicRingsShowFill', settings.olympicRingsShowFill, true);
    setInputValue('olympicRingsFillOpacity', settings.olympicRingsFillOpacity);
    setInputValue('olympicRingsFillOpacitySensitivity', settings.olympicRingsFillOpacitySensitivity);
    setInputValue('olympicRingsShowGlow', settings.olympicRingsShowGlow, true);
    setInputValue('olympicRingsGlowIntensity', settings.olympicRingsGlowIntensity);
    setInputValue('olympicRingsGlowSensitivity', settings.olympicRingsGlowSensitivity);
    setInputValue('olympicRingsRingOpacity', settings.olympicRingsRingOpacity);
    setInputValue('olympicRingsFrequencySensitivity', settings.olympicRingsFrequencySensitivity);
    setInputValue('olympicRingsChannelSensitivity', settings.olympicRingsChannelSensitivity);
    
    // Olympic Rings frequency ranges and channels
    if (settings.olympicRingsFrequencies && window.olympicRingsSettings) {
      try {
        window.olympicRingsSettings.ringFrequencies = JSON.parse(settings.olympicRingsFrequencies);
      } catch (e) {
        console.error('Error parsing Olympic Rings frequencies:', e);
      }
    }
    if (settings.olympicRingsChannels && window.olympicRingsSettings) {
      try {
        window.olympicRingsSettings.ringChannels = JSON.parse(settings.olympicRingsChannels);
      } catch (e) {
        console.error('Error parsing Olympic Rings channels:', e);
      }
    }
    
    setInputValue('filterEffect', settings.filterEffect);
    setInputValue('filterIntensity', settings.filterIntensity);
    setInputValue('filterResponse', settings.filterResponse);
    setInputValue('filterResponseStrength', settings.filterResponseStrength);
    
    return true;
  } catch (error) {
    console.error('Error deserializing settings:', error);
    return false;
  }
}

// Save preset to localStorage
function savePresetToLocalStorage() {
  try {
    const settings = serializeSettingsToJSON();
    localStorage.setItem('oscilloscope_preset', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving preset to localStorage:', error);
    return false;
  }
}

// Load preset from localStorage
function loadPresetFromLocalStorage() {
  try {
    const presetData = localStorage.getItem('oscilloscope_preset');
    if (presetData) {
      const settings = JSON.parse(presetData);
      return deserializeSettingsFromJSON(settings);
    }
    return false;
  } catch (error) {
    console.error('Error loading preset from localStorage:', error);
    return false;
  }
}

// Download preset as JSON file
function downloadPreset() {
  try {
    const settings = serializeSettingsToJSON();
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oscilloscope-preset-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading preset:', error);
    return false;
  }
}

// Upload preset from JSON file
function uploadPreset(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        if (deserializeSettingsFromJSON(settings)) {
          resolve(true);
        } else {
          reject(new Error('Failed to apply settings'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

// Make functions globally accessible
window.serializeSettingsToJSON = serializeSettingsToJSON;
window.deserializeSettingsFromJSON = deserializeSettingsFromJSON;
window.savePresetToLocalStorage = savePresetToLocalStorage;
window.loadPresetFromLocalStorage = loadPresetFromLocalStorage;
window.downloadPreset = downloadPreset;
window.uploadPreset = uploadPreset;

// Deserialize URL parameters and apply to settings
function deserializeSettingsFromURL() {
  const params = new URLSearchParams(window.location.search);
  let hasParams = false;
  
  // Basic settings
  if (params.has('mode') && displayModeSelect) {
    displayModeSelect.value = params.get('mode');
    displayModeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('theme') && themeSelect) {
    themeSelect.value = params.get('theme');
    themeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('inputSource') && inputSourceSelect) {
    inputSourceSelect.value = params.get('inputSource');
    inputSourceSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  
  // Global visual settings
  if (params.has('afterglow')) {
    const val = parseFloat(params.get('afterglow'));
    if (!isNaN(val)) {
      afterglowOpacity = val;
      if (afterglowKnob) afterglowKnob.setValue(val);
      hasParams = true;
    }
  }
  if (params.has('lineWidth')) {
    const val = parseFloat(params.get('lineWidth'));
    if (!isNaN(val)) {
      lineWidth = val;
      if (lineWidthKnob) lineWidthKnob.setValue(val);
      hasParams = true;
    }
  }
  if (params.has('smoothing')) {
    const val = parseFloat(params.get('smoothing'));
    if (!isNaN(val)) {
      smoothingFactor = val;
      if (smoothingKnob) smoothingKnob.setValue(val);
      hasParams = true;
    }
  }
  
  // Particle Cloud settings
  if (params.has('particleCount') && particleCountInput) {
    particleCountInput.value = params.get('particleCount');
    particleCountInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('particleSize') && particleSizeInput) {
    particleSizeInput.value = params.get('particleSize');
    particleSizeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('eqX') && eqXInput) {
    eqXInput.value = decodeURIComponent(params.get('eqX'));
    eqXInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('eqY') && eqYInput) {
    eqYInput.value = decodeURIComponent(params.get('eqY'));
    eqYInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('eqZ') && eqZInput) {
    eqZInput.value = decodeURIComponent(params.get('eqZ'));
    eqZInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('eqPreset') && eqPresetSelect) {
    eqPresetSelect.value = params.get('eqPreset');
    eqPresetSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('particleResponse') && responseModeSelect) {
    responseModeSelect.value = params.get('particleResponse');
    responseModeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('rotateX') && rotateXInput) {
    rotateXInput.checked = params.get('rotateX') === '1';
    rotateXInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('rotateY') && rotateYInput) {
    rotateYInput.checked = params.get('rotateY') === '1';
    rotateYInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('rotateZ') && rotateZInput) {
    rotateZInput.checked = params.get('rotateZ') === '1';
    rotateZInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('rotateXSpeed') && rotateXSpeedInput) {
    rotateXSpeedInput.value = params.get('rotateXSpeed');
    rotateXSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('rotateYSpeed') && rotateYSpeedInput) {
    rotateYSpeedInput.value = params.get('rotateYSpeed');
    rotateYSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('rotateZSpeed') && rotateZSpeedInput) {
    rotateZSpeedInput.value = params.get('rotateZSpeed');
    rotateZSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('rotatePreset') && rotatePresetSelect) {
    rotatePresetSelect.value = params.get('rotatePreset');
    rotatePresetSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  
  // Audio rotation settings
  if (params.has('audioRotation') && audioRotationInput) {
    audioRotationInput.checked = params.get('audioRotation') === '1';
    audioRotationInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('audioRotationSource') && audioRotationSourceSelect) {
    audioRotationSourceSelect.value = params.get('audioRotationSource');
    audioRotationSourceSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('audioRotationIntensity') && audioRotationIntensityInput) {
    audioRotationIntensityInput.value = params.get('audioRotationIntensity');
    audioRotationIntensityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // Audio morph settings
  if (params.has('audioMorph') && audioMorphInput) {
    audioMorphInput.checked = params.get('audioMorph') === '1';
    audioMorphInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('audioMorphSource') && audioMorphSourceSelect) {
    audioMorphSourceSelect.value = params.get('audioMorphSource');
    audioMorphSourceSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('audioMorphIntensity') && audioMorphIntensityInput) {
    audioMorphIntensityInput.value = params.get('audioMorphIntensity');
    audioMorphIntensityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // Fourier settings
  if (params.has('fourierHarmonics') && fourierHarmonicsInput) {
    fourierHarmonicsInput.value = params.get('fourierHarmonics');
    fourierHarmonicsInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('fourierContribution') && fourierContributionInput) {
    fourierContributionInput.value = params.get('fourierContribution');
    fourierContributionInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // Orbitals settings
  if (params.has('orbitalsShowPaths') && orbitalsShowPathsInput) {
    orbitalsShowPathsInput.checked = params.get('orbitalsShowPaths') === '1';
    orbitalsShowPathsInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('orbitalsPlanetSize') && orbitalsPlanetSizeInput) {
    orbitalsPlanetSizeInput.value = params.get('orbitalsPlanetSize');
    orbitalsPlanetSizeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('orbitals3D') && orbitals3DInput) {
    orbitals3DInput.checked = params.get('orbitals3D') === '1';
    orbitals3DInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('orbitalsTilt') && orbitalsTiltInput) {
    orbitalsTiltInput.value = params.get('orbitalsTilt');
    orbitalsTiltInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('orbitalsDepth') && orbitalsDepthInput) {
    orbitalsDepthInput.value = params.get('orbitalsDepth');
    orbitalsDepthInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('orbitalsSpin') && orbitalsSpinInput) {
    orbitalsSpinInput.value = params.get('orbitalsSpin');
    orbitalsSpinInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // GoL settings
  if (params.has('golCellSize') && golCellSizeInput) {
    golCellSizeInput.value = params.get('golCellSize');
    golCellSizeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('golReseed') && golReseedInput) {
    golReseedInput.value = params.get('golReseed');
    golReseedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('golBirthBoost') && golBirthBoostInput) {
    golBirthBoostInput.value = params.get('golBirthBoost');
    golBirthBoostInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('golSurvivalBoost') && golSurvivalBoostInput) {
    golSurvivalBoostInput.value = params.get('golSurvivalBoost');
    golSurvivalBoostInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // Mesh settings
  if (params.has('meshResponse') && meshResponseSelect) {
    meshResponseSelect.value = params.get('meshResponse');
    meshResponseSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshResolution') && meshResolutionInput) {
    meshResolutionInput.value = params.get('meshResolution');
    meshResolutionInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('meshWireframe') && meshWireframeInput) {
    meshWireframeInput.checked = params.get('meshWireframe') === '1';
    meshWireframeInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshFilled') && meshFilledInput) {
    meshFilledInput.checked = params.get('meshFilled') === '1';
    meshFilledInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshEqX') && meshEqXInput) {
    meshEqXInput.value = decodeURIComponent(params.get('meshEqX'));
    meshEqXInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshEqY') && meshEqYInput) {
    meshEqYInput.value = decodeURIComponent(params.get('meshEqY'));
    meshEqYInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshEqZ') && meshEqZInput) {
    meshEqZInput.value = decodeURIComponent(params.get('meshEqZ'));
    meshEqZInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshEqPreset') && meshEqPresetSelect) {
    meshEqPresetSelect.value = params.get('meshEqPreset');
    meshEqPresetSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshRotateX') && meshRotateXInput) {
    meshRotateXInput.checked = params.get('meshRotateX') === '1';
    meshRotateXInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshRotateY') && meshRotateYInput) {
    meshRotateYInput.checked = params.get('meshRotateY') === '1';
    meshRotateYInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshRotateZ') && meshRotateZInput) {
    meshRotateZInput.checked = params.get('meshRotateZ') === '1';
    meshRotateZInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('meshRotateXSpeed') && meshRotateXSpeedInput) {
    meshRotateXSpeedInput.value = params.get('meshRotateXSpeed');
    meshRotateXSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('meshRotateYSpeed') && meshRotateYSpeedInput) {
    meshRotateYSpeedInput.value = params.get('meshRotateYSpeed');
    meshRotateYSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('meshRotateZSpeed') && meshRotateZSpeedInput) {
    meshRotateZSpeedInput.value = params.get('meshRotateZSpeed');
    meshRotateZSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // MFCC settings
  if (params.has('mfccSubdivisionMode') && mfccSubdivisionModeSelect) {
    mfccSubdivisionModeSelect.value = params.get('mfccSubdivisionMode');
    mfccSubdivisionModeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('mfccSubdivision') && mfccSubdivisionSelect) {
    mfccSubdivisionSelect.value = params.get('mfccSubdivision');
    mfccSubdivisionSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('mfccTimeSubdivision') && mfccTimeSubdivisionInput) {
    mfccTimeSubdivisionInput.value = params.get('mfccTimeSubdivision');
    mfccTimeSubdivisionInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('mfccBeatSensitivity') && mfccBeatSensitivityInput) {
    mfccBeatSensitivityInput.value = params.get('mfccBeatSensitivity');
    mfccBeatSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('mfccPointLifetime') && mfccPointLifetimeInput) {
    mfccPointLifetimeInput.value = params.get('mfccPointLifetime');
    mfccPointLifetimeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('mfccPointSize') && mfccPointSizeInput) {
    mfccPointSizeInput.value = params.get('mfccPointSize');
    mfccPointSizeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('mfccMaxPoints') && mfccMaxPointsInput) {
    mfccMaxPointsInput.value = params.get('mfccMaxPoints');
    mfccMaxPointsInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('mfccShowTrail') && mfccShowTrailInput) {
    mfccShowTrailInput.checked = params.get('mfccShowTrail') === '1';
    mfccShowTrailInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('mfccDimensions') && mfccDimensionsSelect) {
    mfccDimensionsSelect.value = params.get('mfccDimensions');
    mfccDimensionsSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('mfccVisualizationMode') && mfccVisualizationModeSelect) {
    mfccVisualizationModeSelect.value = params.get('mfccVisualizationMode');
    mfccVisualizationModeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  
  // Olympic Rings settings
  if (params.has('olympicRingsMode') && olympicRingsModeSelect) {
    olympicRingsModeSelect.value = params.get('olympicRingsMode');
    olympicRingsModeSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('olympicRingsBeatSource') && olympicRingsBeatSourceInput) {
    olympicRingsBeatSourceInput.value = params.get('olympicRingsBeatSource');
    olympicRingsBeatSourceInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('olympicRingsBeatThreshold') && olympicRingsBeatThresholdInput) {
    olympicRingsBeatThresholdInput.value = params.get('olympicRingsBeatThreshold');
    olympicRingsBeatThresholdInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsBeatDecay') && olympicRingsBeatDecayInput) {
    olympicRingsBeatDecayInput.value = params.get('olympicRingsBeatDecay');
    olympicRingsBeatDecayInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsBeatMinInterval') && olympicRingsBeatMinIntervalInput) {
    olympicRingsBeatMinIntervalInput.value = params.get('olympicRingsBeatMinInterval');
    olympicRingsBeatMinIntervalInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsBeatSensitivity') && olympicRingsBeatSensitivityInput) {
    olympicRingsBeatSensitivityInput.value = params.get('olympicRingsBeatSensitivity');
    olympicRingsBeatSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSize') && olympicRingsSizeInput) {
    olympicRingsSizeInput.value = params.get('olympicRingsSize');
    olympicRingsSizeInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsThickness') && olympicRingsThicknessInput) {
    olympicRingsThicknessInput.value = params.get('olympicRingsThickness');
    olympicRingsThicknessInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsResponseSpeed') && olympicRingsResponseSpeedInput) {
    olympicRingsResponseSpeedInput.value = params.get('olympicRingsResponseSpeed');
    olympicRingsResponseSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsRotationSpeed') && olympicRingsRotationSpeedInput) {
    olympicRingsRotationSpeedInput.value = params.get('olympicRingsRotationSpeed');
    olympicRingsRotationSpeedInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSpacingX') && olympicRingsSpacingXInput) {
    olympicRingsSpacingXInput.value = params.get('olympicRingsSpacingX');
    olympicRingsSpacingXInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSpacingY') && olympicRingsSpacingYInput) {
    olympicRingsSpacingYInput.value = params.get('olympicRingsSpacingY');
    olympicRingsSpacingYInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  // Backward compatibility: if old 'olympicRingsSpacing' parameter exists, use it for both X and Y
  if (params.has('olympicRingsSpacing') && !params.has('olympicRingsSpacingX') && !params.has('olympicRingsSpacingY')) {
    const oldSpacing = params.get('olympicRingsSpacing');
    if (olympicRingsSpacingXInput) {
      olympicRingsSpacingXInput.value = oldSpacing;
      olympicRingsSpacingXInput.dispatchEvent(new Event('input'));
    }
    if (olympicRingsSpacingYInput) {
      olympicRingsSpacingYInput.value = oldSpacing;
      olympicRingsSpacingYInput.dispatchEvent(new Event('input'));
    }
    hasParams = true;
  }
  if (params.has('olympicRingsLayoutScale') && olympicRingsLayoutScaleInput) {
    olympicRingsLayoutScaleInput.value = params.get('olympicRingsLayoutScale');
    olympicRingsLayoutScaleInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsHorizontalOffset') && olympicRingsHorizontalOffsetInput) {
    olympicRingsHorizontalOffsetInput.value = params.get('olympicRingsHorizontalOffset');
    olympicRingsHorizontalOffsetInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsVerticalOffset') && olympicRingsVerticalOffsetInput) {
    olympicRingsVerticalOffsetInput.value = params.get('olympicRingsVerticalOffset');
    olympicRingsVerticalOffsetInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSizeMinScale') && olympicRingsSizeMinScaleInput) {
    olympicRingsSizeMinScaleInput.value = params.get('olympicRingsSizeMinScale');
    olympicRingsSizeMinScaleInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSizeMaxScale') && olympicRingsSizeMaxScaleInput) {
    olympicRingsSizeMaxScaleInput.value = params.get('olympicRingsSizeMaxScale');
    olympicRingsSizeMaxScaleInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsSizeSensitivity') && olympicRingsSizeSensitivityInput) {
    olympicRingsSizeSensitivityInput.value = params.get('olympicRingsSizeSensitivity');
    olympicRingsSizeSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsThicknessMinScale') && olympicRingsThicknessMinScaleInput) {
    olympicRingsThicknessMinScaleInput.value = params.get('olympicRingsThicknessMinScale');
    olympicRingsThicknessMinScaleInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsThicknessMaxScale') && olympicRingsThicknessMaxScaleInput) {
    olympicRingsThicknessMaxScaleInput.value = params.get('olympicRingsThicknessMaxScale');
    olympicRingsThicknessMaxScaleInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsThicknessSensitivity') && olympicRingsThicknessSensitivityInput) {
    olympicRingsThicknessSensitivityInput.value = params.get('olympicRingsThicknessSensitivity');
    olympicRingsThicknessSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsShowFill') && olympicRingsShowFillInput) {
    olympicRingsShowFillInput.checked = params.get('olympicRingsShowFill') === '1';
    olympicRingsShowFillInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('olympicRingsFillOpacity') && olympicRingsFillOpacityInput) {
    olympicRingsFillOpacityInput.value = params.get('olympicRingsFillOpacity');
    olympicRingsFillOpacityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsFillOpacitySensitivity') && olympicRingsFillOpacitySensitivityInput) {
    olympicRingsFillOpacitySensitivityInput.value = params.get('olympicRingsFillOpacitySensitivity');
    olympicRingsFillOpacitySensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsShowGlow') && olympicRingsShowGlowInput) {
    olympicRingsShowGlowInput.checked = params.get('olympicRingsShowGlow') === '1';
    olympicRingsShowGlowInput.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('olympicRingsGlowIntensity') && olympicRingsGlowIntensityInput) {
    olympicRingsGlowIntensityInput.value = params.get('olympicRingsGlowIntensity');
    olympicRingsGlowIntensityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsGlowSensitivity') && olympicRingsGlowSensitivityInput) {
    olympicRingsGlowSensitivityInput.value = params.get('olympicRingsGlowSensitivity');
    olympicRingsGlowSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsRingOpacity') && olympicRingsRingOpacityInput) {
    olympicRingsRingOpacityInput.value = params.get('olympicRingsRingOpacity');
    olympicRingsRingOpacityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsFrequencySensitivity') && olympicRingsFrequencySensitivityInput) {
    olympicRingsFrequencySensitivityInput.value = params.get('olympicRingsFrequencySensitivity');
    olympicRingsFrequencySensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('olympicRingsChannelSensitivity') && olympicRingsChannelSensitivityInput) {
    olympicRingsChannelSensitivityInput.value = params.get('olympicRingsChannelSensitivity');
    olympicRingsChannelSensitivityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  // Olympic Rings frequency ranges and channels
  if (params.has('olympicRingsFrequencies') && window.olympicRingsSettings) {
    try {
      const frequencies = JSON.parse(params.get('olympicRingsFrequencies'));
      if (Array.isArray(frequencies) && frequencies.length === 5) {
        window.olympicRingsSettings.ringFrequencies = frequencies;
        hasParams = true;
      }
    } catch (e) {
      console.warn('Failed to parse olympicRingsFrequencies:', e);
    }
  }
  if (params.has('olympicRingsChannels') && window.olympicRingsSettings) {
    try {
      const channels = JSON.parse(params.get('olympicRingsChannels'));
      if (Array.isArray(channels) && channels.length === 5) {
        window.olympicRingsSettings.ringChannels = channels;
        hasParams = true;
      }
    } catch (e) {
      console.warn('Failed to parse olympicRingsChannels:', e);
    }
  }
  
  // Audio Filter settings
  if (params.has('filterEffect') && filterEffectSelect) {
    filterEffectSelect.value = params.get('filterEffect');
    filterEffectSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('filterIntensity') && filterIntensityInput) {
    filterIntensityInput.value = params.get('filterIntensity');
    filterIntensityInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  if (params.has('filterResponse') && filterResponseSelect) {
    filterResponseSelect.value = params.get('filterResponse');
    filterResponseSelect.dispatchEvent(new Event('change'));
    hasParams = true;
  }
  if (params.has('filterResponseStrength') && filterResponseStrengthInput) {
    filterResponseStrengthInput.value = params.get('filterResponseStrength');
    filterResponseStrengthInput.dispatchEvent(new Event('input'));
    hasParams = true;
  }
  
  return hasParams;
}

// Debounce function to avoid too frequent URL updates
let urlUpdateTimeout = null;
function updateURLDebounced() {
  if (urlUpdateTimeout) clearTimeout(urlUpdateTimeout);
  urlUpdateTimeout = setTimeout(() => {
    serializeSettingsToURL();
  }, 300); // Update URL 300ms after last change
}

// Make function globally accessible for knob controls
window.updateURLDebounced = updateURLDebounced;

// Attach URL update listeners to all controls
function attachURLUpdateListeners() {
  // Get all input, select, and checkbox elements in controls
  const controls = document.getElementById('controls');
  if (!controls) return;
  
  // Use event delegation to catch all changes
  controls.addEventListener('change', updateURLDebounced);
  controls.addEventListener('input', updateURLDebounced);
}

// Initialize URL parameter system
if (!window.isSettingsWindow) {
  // Load settings from URL on page load
  // Auto-save preset when settings change (debounced)
  let autoSaveTimeout = null;
  function autoSavePreset() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      if (typeof window.savePresetToLocalStorage === 'function') {
        window.savePresetToLocalStorage();
      }
    }, 2000); // Save 2 seconds after last change
  }

  // Enhanced attachURLUpdateListeners to also trigger auto-save
  const originalAttachURLUpdateListeners = attachURLUpdateListeners;
  attachURLUpdateListeners = function() {
    originalAttachURLUpdateListeners();
    // Also attach auto-save listeners to all controls
    const controls = document.getElementById('controls');
    if (controls) {
      controls.addEventListener('input', autoSavePreset);
      controls.addEventListener('change', autoSavePreset);
    }
    // Knobs trigger URL updates which will be caught by the controls listeners
    // But we can also add auto-save to the URL update function
    const originalUpdateURLDebounced = window.updateURLDebounced;
    if (originalUpdateURLDebounced) {
      window.updateURLDebounced = function() {
        originalUpdateURLDebounced();
        autoSavePreset();
      };
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all controls to be initialized
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const hasURLParams = params.toString().length > 0;
      
      // Load from URL if present, otherwise load from localStorage
      if (hasURLParams) {
        deserializeSettingsFromURL();
      } else {
        // Try to load preset from localStorage
        if (typeof window.loadPresetFromLocalStorage === 'function') {
          window.loadPresetFromLocalStorage();
        }
      }
      attachURLUpdateListeners();
    }, 100);
  });
  
  // Also try immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const hasURLParams = params.toString().length > 0;
        
        if (hasURLParams) {
          deserializeSettingsFromURL();
        } else {
          if (typeof window.loadPresetFromLocalStorage === 'function') {
            window.loadPresetFromLocalStorage();
          }
        }
        attachURLUpdateListeners();
      }, 100);
    });
  } else {
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const hasURLParams = params.toString().length > 0;
      
      if (hasURLParams) {
        deserializeSettingsFromURL();
      } else {
        if (typeof window.loadPresetFromLocalStorage === 'function') {
          window.loadPresetFromLocalStorage();
        }
      }
      attachURLUpdateListeners();
    }, 100);
  }
} 