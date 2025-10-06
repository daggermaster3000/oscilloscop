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
displayModeSelect.addEventListener("change", () => {
  const mode = displayModeSelect.value;
  if (mode === "fft") {
    analyser.fftSize = 256;
  } else {
    analyser.fftSize = 2048;
  }
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
});

// Initialize particles in a sphere
const particles = [];
const numParticles = 2000;
const maxDepth = 500;
const sphereRadius = 200;

for (let i = 0; i < numParticles; i++) {
  const theta = Math.random() * 2 * Math.PI; // azimuthal angle
  const phi = Math.acos(2 * Math.random() - 1); // polar angle
  //const r = sphereRadius * Math.cbrt(Math.random()); // cube root for uniform density

  particles.push({
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi),
    size: 2,
    hue: Math.random() * 360
  });
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
    default:
      drawWaveform();
  }
}

// Initialize theme and start animation
updateTheme("green");
animate(); 