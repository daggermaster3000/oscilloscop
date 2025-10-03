const audioElement = new Audio();
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioCtx.createAnalyser();
let analyserLeft = audioCtx.createAnalyser();
let analyserRight = audioCtx.createAnalyser();
let source = null;
let micStream = null;
let isPlaying = false;
let splitter = audioCtx.createChannelSplitter(2);

const playPauseBtn = document.getElementById("playPauseBtn");
const fileInput = document.getElementById("audioFile");
const inputSourceSelect = document.getElementById("inputSource");
const fileLabel = document.getElementById("fileLabel");
const deviceLabel = document.getElementById("deviceLabel");
const audioDevicesSelect = document.getElementById("audioDevices");

async function ensureMicPermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (e) {
    alert("Microphone permission is required: " + e.message);
    return false;
  }
}

inputSourceSelect.addEventListener("change", async () => {
  if (source) source.disconnect();
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  const inputType = inputSourceSelect.value;

  if (inputType === "file") {
    fileLabel.style.display = "block";
    deviceLabel.style.display = "none";
    playPauseBtn.disabled = !audioElement.src;
  } else if (inputType === "mic") {
    fileLabel.style.display = "none";
    deviceLabel.style.display = "block";
    playPauseBtn.disabled = true;

    const ok = await ensureMicPermission();
    if (!ok) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === "audioinput");

    audioDevicesSelect.innerHTML = "";
    audioInputs.forEach(device => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Device ${device.deviceId}`;
      audioDevicesSelect.appendChild(option);
    });
  }
});

audioDevicesSelect.addEventListener("change", async () => {
  if (source) source.disconnect();
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  const selectedDeviceId = audioDevicesSelect.value;

  try {
    const ok = await ensureMicPermission();
    if (!ok) return;

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        deviceId: { exact: selectedDeviceId },
        channelCount: 2
      }
    });

    source = audioCtx.createMediaStreamSource(micStream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0;

    source.connect(analyser);
    source.connect(gainNode);
    source.connect(splitter);
    splitter.connect(analyserLeft, 0);
    splitter.connect(analyserRight, 1);

    if (audioCtx.state === "suspended") await audioCtx.resume();
    isPlaying = true;
  } catch (err) {
    alert("Audio input access failed: " + err.message);
  }
});

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  audioElement.src = url;
  audioElement.load();
  playPauseBtn.disabled = false;

  if (source) source.disconnect();
  source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  source.connect(splitter);
  splitter.connect(analyserLeft, 0);
  splitter.connect(analyserRight, 1);
});

playPauseBtn.addEventListener("click", async () => {
  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!isPlaying) {
    audioElement.play();
    playPauseBtn.textContent = "Pause";
  } else {
    audioElement.pause();
    playPauseBtn.textContent = "Play";
  }
  isPlaying = !isPlaying;
}); 