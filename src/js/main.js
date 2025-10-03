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
    default:
      drawWaveform();
  }
}

// Initialize theme and start animation
updateTheme("green");
animate(); 