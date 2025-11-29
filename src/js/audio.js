const audioElement = new Audio();
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioCtx.createAnalyser();
let analyserLeft = audioCtx.createAnalyser();
let analyserRight = audioCtx.createAnalyser();
let source = null;
let micStream = null;
let isPlaying = false;
let splitter = audioCtx.createChannelSplitter(2);
window.channelAnalysers = []; // Array to hold analysers for multiple channels (global for access)
window.maxChannels = 2; // Current maximum number of channels available (global for access)

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

// Setup multi-channel audio analysis
function setupChannelAnalysers(numChannels) {
  window.maxChannels = numChannels;
  
  // Disconnect existing analysers
  window.channelAnalysers.forEach(analyser => {
    if (splitter) {
      try {
        splitter.disconnect(analyser);
      } catch (e) {}
    }
  });
  
  // Disconnect old splitter
  if (splitter && source) {
    try {
      source.disconnect(splitter);
    } catch (e) {}
  }
  
  // Create new splitter for the number of channels
  splitter = audioCtx.createChannelSplitter(numChannels);
  
  // Create analysers for each channel
  window.channelAnalysers = [];
  for (let i = 0; i < numChannels; i++) {
    const channelAnalyser = audioCtx.createAnalyser();
    channelAnalyser.fftSize = 2048;
    window.channelAnalysers.push(channelAnalyser);
    splitter.connect(channelAnalyser, i);
  }
  
  // Keep backward compatibility - assign first two to analyserLeft/Right
  if (window.channelAnalysers.length > 0) {
    analyserLeft = window.channelAnalysers[0];
  }
  if (window.channelAnalysers.length > 1) {
    analyserRight = window.channelAnalysers[1];
  }
  
  // Trigger UI update for channel selection
  if (typeof updateOlympicRingsChannelControls === 'function') {
    updateOlympicRingsChannelControls();
  }
}

// Get available channel count from audio source
function getAudioChannelCount(audioSource) {
  if (!audioSource) return 2;
  
  // For MediaStreamSource (microphone/interface)
  if (audioSource.mediaStream) {
    const audioTracks = audioSource.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const settings = audioTracks[0].getSettings();
      return settings.channelCount || 2;
    }
  }
  
  // For MediaElementSource (audio file)
  if (audioSource.mediaElement) {
    // Audio files typically have 2 channels, but could have more
    return 2; // Default for files
  }
  
  return 2; // Default fallback
}

inputSourceSelect.addEventListener("change", async () => {
  if (source) source.disconnect();
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  // Clear MFCC history when switching input sources
  if (typeof clearMFCCHistory === 'function') {
    clearMFCCHistory();
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
  
  // Clear MFCC history when switching audio devices
  if (typeof clearMFCCHistory === 'function') {
    clearMFCCHistory();
  }

  const selectedDeviceId = audioDevicesSelect.value;

  try {
    const ok = await ensureMicPermission();
    if (!ok) return;

    // Try to request multiple channels (up to 8 for most audio interfaces)
    let channelCount = 8;
    let micStreamAttempt = null;
    
    // Try to get maximum channels, fall back if not supported
    try {
      micStreamAttempt = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { exact: selectedDeviceId },
          channelCount: { ideal: channelCount, max: channelCount }
        }
      });
    } catch (e) {
      // Fall back to stereo if multi-channel not supported
      try {
        channelCount = 2;
        micStreamAttempt = await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: { exact: selectedDeviceId },
            channelCount: 2
          }
        });
      } catch (e2) {
        throw e2;
      }
    }
    
    micStream = micStreamAttempt;
    
    // Detect actual channel count from the stream
    const audioTracks = micStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const settings = audioTracks[0].getSettings();
      channelCount = settings.channelCount || channelCount;
    }

    source = audioCtx.createMediaStreamSource(micStream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0;

    source.connect(analyser);
    source.connect(gainNode);
    
    // Setup multi-channel analysers
    setupChannelAnalysers(channelCount);
    source.connect(splitter);

    if (audioCtx.state === "suspended") await audioCtx.resume();
    isPlaying = true;
    
    // Update UI to show available channels
    console.log(`Audio interface connected with ${channelCount} channels`);
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
  
  // Setup stereo channel analysers for audio files (typically 2 channels)
  setupChannelAnalysers(2);
  source.connect(splitter);
});

playPauseBtn.addEventListener("click", async () => {
  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!isPlaying) {
    audioElement.play();
    playPauseBtn.textContent = "Pause";
  } else {
    audioElement.pause();
    playPauseBtn.textContent = "Play";
    // Clear MFCC history when paused to stop visualization immediately
    if (typeof clearMFCCHistory === 'function') {
      clearMFCCHistory();
    }
  }
  isPlaying = !isPlaying;
}); 