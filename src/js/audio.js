const audioElement = new Audio();
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioCtx.createAnalyser();
let analyserLeft = audioCtx.createAnalyser();
let analyserRight = audioCtx.createAnalyser();
let source = null;
let micStream = null;
let ws = null;
let isPlaying = false;
let splitter = audioCtx.createChannelSplitter(2);

const playPauseBtn = document.getElementById("playPauseBtn");
const fileInput = document.getElementById("audioFile");
const inputSourceSelect = document.getElementById("inputSource");
const fileLabel = document.getElementById("fileLabel");
const deviceLabel = document.getElementById("deviceLabel");
const audioDevicesSelect = document.getElementById("audioDevices");

// ------------------ Helpers ------------------
async function ensureMicPermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (e) {
    alert("Microphone permission is required: " + e.message);
    return false;
  }
}

function disconnectSource() {
  if (source) source.disconnect();
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}

// ------------------ WebSocket bridge ------------------
function connectAudioBridge(url = "ws://localhost:8080") {
  disconnectSource();
  ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => console.log("✅ Connected to AudioBridge");
  ws.onclose = () => console.log("❌ AudioBridge disconnected");
  ws.onerror = (err) => console.error("WebSocket error:", err);

  ws.onmessage = (event) => {
    const rawBuffer = event.data;
    const floatArray = new Float32Array(rawBuffer);
    handleRawAudio(floatArray);
  };
}

function handleRawAudio(floatArray) {
  const buffer = audioCtx.createBuffer(1, floatArray.length, 44100);
  buffer.copyToChannel(floatArray, 0, 0);

  const sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.connect(analyser);
  sourceNode.connect(splitter);
  splitter.connect(analyserLeft, 0);
  splitter.connect(analyserRight, 1);

  sourceNode.start();
}

// ------------------ BlackHole Stream ------------------
async function getBlackHoleStream() {
  const ok = await ensureMicPermission();
  if (!ok) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  const blackholeDevice = devices.find(
    d => d.kind === "audioinput" && d.label.includes("BlackHole")
  );

  if (!blackholeDevice) {
    alert("❌ BlackHole input not found. Make sure it's installed and selected in Audio MIDI Setup.");
    return;
  }

  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: blackholeDevice.deviceId }, channelCount: 2 }
  });

  source = audioCtx.createMediaStreamSource(micStream);
  source.connect(analyser);
  source.connect(splitter);
  splitter.connect(analyserLeft, 0);
  splitter.connect(analyserRight, 1);

  if (audioCtx.state === "suspended") await audioCtx.resume();
  isPlaying = true;
  console.log("🎧 Capturing system audio via BlackHole");
}

// ------------------ Source selection ------------------
inputSourceSelect.addEventListener("change", async () => {
  disconnectSource();
  const inputType = inputSourceSelect.value;

  if (inputType === "file") {
    fileLabel.style.display = "block";
    deviceLabel.style.display = "none";
    playPauseBtn.disabled = !audioElement.src;
  } 
  else if (inputType === "mic") {
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
  else if (inputType === "blackhole") {
    fileLabel.style.display = "none";
    deviceLabel.style.display = "none";
    getBlackHoleStream();
  } 
  else if (inputType === "bridge") {
    fileLabel.style.display = "none";
    deviceLabel.style.display = "none";
    connectAudioBridge("ws://localhost:8080");
  }
});

// ------------------ Mic device selection ------------------
audioDevicesSelect.addEventListener("change", async () => {
  disconnectSource();
  const selectedDeviceId = audioDevicesSelect.value;

  try {
    const ok = await ensureMicPermission();
    if (!ok) return;

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: selectedDeviceId }, channelCount: 2 }
    });

    source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyser);
    source.connect(splitter);
    splitter.connect(analyserLeft, 0);
    splitter.connect(analyserRight, 1);

    if (audioCtx.state === "suspended") await audioCtx.resume();
    isPlaying = true;
  } catch (err) {
    alert("Audio input access failed: " + err.message);
  }
});

// ------------------ File input ------------------
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  audioElement.src = url;
  audioElement.load();
  playPauseBtn.disabled = false;

  disconnectSource();
  source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  source.connect(splitter);
  splitter.connect(analyserLeft, 0);
  splitter.connect(analyserRight, 1);
});

// ------------------ Play / Pause ------------------
playPauseBtn.addEventListener("click", async () => {
  if (audioCtx.state === "suspended") await audioCtx.resume();

  if (inputSourceSelect.value === "file") {
    if (!isPlaying) {
      audioElement.play();
      playPauseBtn.textContent = "Pause";
    } else {
      audioElement.pause();
      playPauseBtn.textContent = "Play";
    }
  }
  isPlaying = !isPlaying;
});
