# Customizable Oscilloscope with AI Mood Detection

A web-based oscilloscope visualization tool that can display audio input from either a file or microphone/audio interface. The oscilloscope features multiple visualization modes, AI-powered mood detection using YAMNet, and themes for a customizable experience.

## Features

- Audio input from files or microphone/audio interface
- **AI-Powered Mood Detection**: Real-time audio classification using YAMNet (TensorFlow.js)
- Multiple visualization modes:
  - Waveform display
  - FFT spectrum analyzer
  - Stereo phase visualization
  - 3D waveform (flat/top view)
  - 3D/2D spectrogram
  - Particle cloud with parametric equations
  - Fourier series shape
  - Polygon morphing
  - Harmonic orbital systems
  - Game of Life (audio-influenced)
  - **Mood Visualization**: AI-detected mood with intensity rings
  - **Mood-Responsive Waveform**: Waveform that adapts to detected mood
  - **Mood-Responsive Particles**: Particle cloud that changes based on mood
- 18+ Customizable themes:
  - Retro Green, Sci-fi Blue, Amber Orange, Night Vision Red
  - Cartoon Split, Scientific Neon, Modern Blue, Retro Magenta
  - Viking Bronze, Cyberpunk Glow, Space Horizon, Magma Core
  - Aurora Sky, Electric Storm, Ocean Deep, Lava Flow
  - Pastel Dream, Minimal Contrast
- Real-time audio visualization
- Responsive design
- Grain effect for vintage feel
- **Mood Classification Controls**: Adjustable sensitivity and classification interval

## Setup

1. Clone the repository
2. Open the `src/index.html` file in a modern web browser
3. Select your preferred input source (audio file or microphone)
4. Choose a theme and display mode
5. Enable mood detection in the controls panel
6. Try the new mood-based visualization modes!
7. Enjoy the AI-powered visualization!

## Mood Detection

The oscilloscope now includes AI-powered mood detection using YAMNet (TensorFlow.js):

- **Automatic Classification**: Analyzes audio in real-time to detect mood and intensity
- **Mood Categories**: Music genres, speech, ambient sounds, silence, and more
- **Visual Response**: Visualizations adapt color, intensity, and animation based on detected mood
- **Controls**: Adjustable classification interval (500ms-5s) and sensitivity
- **Fallback Mode**: Works even if YAMNet model fails to load (uses mock classification)

### Mood-Responsive Features

- **Mood Visualization**: Shows current mood with intensity rings and confidence bars
- **Mood-Responsive Waveform**: Traditional waveform that changes color and effects based on mood
- **Mood-Responsive Particles**: Particle cloud that adapts shape, rotation, and color to mood

## Browser Support

This application uses modern Web Audio API features and requires a recent version of Chrome, Firefox, Safari, or Edge.

## Project Structure

```
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── audio.js
│       ├── main.js
│       ├── themes.js
│       ├── visualizer.js
│       ├── yamnet.js          # AI mood detection
│       └── knob.js            # UI controls
├── public/                    # Static assets
├── *.wav                     # Sample audio files
└── README.md
```

## License

MIT License 