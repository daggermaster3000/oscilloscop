const portAudio = require('naudiodon');
const WebSocket = require('ws');

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
  console.log('Client connected');
});

// Configure audio input
const ai = new portAudio.AudioInput({
  channelCount: 2,
  sampleFormat: portAudio.SampleFormatFloat32,
  sampleRate: 44100,
  deviceId: -1, // default input
  closeOnError: true
});

ai.on('data', buffer => {
  // Broadcast raw PCM to all clients
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(buffer);
    }
  });
});

ai.start();
console.log('🎧 Audio bridge running on ws://localhost:8080');
