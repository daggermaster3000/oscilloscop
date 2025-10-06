const themes = {
  // Existing
  green:  { glow: "#00FF99", border: "lime", label: "lime", gradient: ['#003300', '#00FF99', '#FFFFFF'] },
  blue:   { glow: "#00CFFF", border: "#00CFFF", label: "#00CFFF", gradient: ['#001133', '#00CFFF', '#FFFFFF'] },
  amber:  { glow: "#FFB347", border: "#FFB347", label: "#FFB347", gradient: ['#331a00', '#FFB347', '#FFFFFF'] },
  red:    { glow: "#FF4444", border: "#FF4444", label: "#FF4444", gradient: ['#330000', '#FF4444', '#FFFFFF'] },
  cartoon:{ glow: "black", border: "black", label: "white", cartoon: true, gradient: ['#000000', '#FFD700', '#FFFFFF'] },

  // New
  scientific: { 
    glow: "#39FF14", border: "#1BFF00", label: "#A9FFB0", grid: "#00FF9966",
    gradient: ['#2fa02fff', '#39FF14', '#FFFFFF']
  },
  modern: { 
    glow: "#00E0FF", border: "#0FF", label: "#D0F7FF", background: "#0A0A0A",
    gradient: ['#001F33', '#00E0FF', '#FFFFFF']
  },
  retro: { 
    glow: "#FF6EC7", border: "#FF4FD8", label: "#FFD6F5", background: "#240024",
    gradient: ['#240024', '#FF6EC7', '#FFFFFF']
  },
  viking: { 
    glow: "#C19A6B", border: "#8B5A2B", label: "#FFDFA6", background: "#1A0F07",
    gradient: ['#1A0F07', '#C19A6B', '#FFDFA6']
  },
  cyberpunk: { 
    glow: "#FF00FF", border: "#00FFFF", label: "#FFEA00", background: "#0A0014",
    gradient: ['#0A0014', '#FF00FF', '#00FFFF']
  },
  space: { 
    glow: "#7DF9FF", border: "#2B65EC", label: "#A3D5FF", background: "#000814",
    gradient: ['#000814', '#2B65EC', '#7DF9FF']
  },
  magma: { 
    glow: "#FF4500", border: "#FF2400", label: "#FFD580", background: "#1B0000",
    gradient: ['#1B0000', '#FF2400', '#FFD580']
  },
  aurora: { 
    glow: "#76FF7A", border: "#4DEEEA", label: "#F2F2F2", background: "#001F33",
    gradient: ['#001F33', '#4DEEEA', '#76FF7A']
  },
  storm: { 
    glow: "#C0C0C0", border: "#E0E0E0", label: "#FFFFFF", background: "#1C1C1C",
    gradient: ['#1C1C1C', '#808080', '#FFFFFF']
  },
  ocean: { 
    glow: "#00BFFF", border: "#0077BE", label: "#E0FFFF", background: "#001F3F",
    gradient: ['#001F3F', '#0077BE', '#00BFFF']
  },
  lava: { 
    glow: "#FF2400", border: "#FF7F00", label: "#FFD580", background: "#200000",
    gradient: ['#200000', '#FF2400', '#FF7F00']
  },
  pastel: { 
    glow: "#FFC3A0", border: "#FFB6C1", label: "#FFF0F5", background: "#2A2A2A",
    gradient: ['#2A2A2A', '#FFB6C1', '#FFF0F5']
  },
  minimal: { 
    glow: "#FFFFFF", border: "#FFFFFF", label: "#FFFFFF", background: "#000000",
    gradient: ['#000000', '#888888', '#FFFFFF']
  },
};



let theme = {
  glow: "#00FF99",
  border: "lime",
  label: "lime"
};

function updateTheme(name) {
  theme = themes[name];
  document.getElementById("controls").style.borderColor = theme.border;
  document.getElementById("controls").style.color = theme.label;
  
  document.querySelectorAll("#controls input, #controls select, #controls button").forEach(el => {
    el.style.borderColor = theme.border;
    el.style.color = theme.label;
  });

  // Update knob themes
  if (typeof updateKnobThemes === 'function') {
    updateKnobThemes(theme);
  }

  // CSS vars for consistent slider theming
  const root = document.documentElement;
  root.style.setProperty('--ui-border', theme.border);
  root.style.setProperty('--ui-label', theme.label);
  root.style.setProperty('--ui-glow', theme.glow);
} 