# Oscilloscop.

A web-based oscilloscope visualization tool that can display audio input from either a file or microphone/audio interface. The oscilloscope features multiple visualization modes and themes for a customizable experience.

## Features

- Audio input from files or microphone/audio interface
- Multiple visualization modes:
  - Waveform display
  - FFT spectrum analyzer
- Customizable themes:
  - Retro Green
  - Sci-fi Blue
  - Amber Orange
  - Night Vision Red
  - Cartoon Split
- Real-time audio visualization
- Responsive design
- Grain effect for vintage feel

## Setup

1. Clone the repository
2. Open the `public/index.html` file in a modern web browser
3. Select your preferred input source (audio file or microphone)
4. Choose a theme and display mode
5. Enjoy the visualization!

## Browser Support

This application uses modern Web Audio API features and requires a recent version of Chrome, Firefox, Safari, or Edge.

## Project Structure

```
├── public/
│   └── index.html
├── src/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── audio.js
│       ├── main.js
│       ├── themes.js
│       └── visualizer.js
└── README.md
```

## License

MIT License 