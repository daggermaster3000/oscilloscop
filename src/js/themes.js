const themes = {
  green: { glow: "#00FF99", border: "lime", label: "lime" },
  blue:  { glow: "#00CFFF", border: "#00CFFF", label: "#00CFFF" },
  amber: { glow: "#FFB347", border: "#FFB347", label: "#FFB347" },
  red:   { glow: "#FF4444", border: "#FF4444", label: "#FF4444" },
  cartoon: { glow: "black", border: "black", label: "white", cartoon: true }
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
} 