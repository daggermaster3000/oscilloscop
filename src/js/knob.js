class Knob {
  constructor(container, options = {}) {
    this.value = options.value || 0;
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.label = options.label || '';
    this.onChange = options.onChange || (() => {});
    this.size = options.size || 60;
    this.startAngle = 210;
    this.endAngle = 510;
    this.isDragging = false;
    this.theme = options.theme || {
      glow: "#00FF99",
      border: "lime",
      label: "lime"
    };

    this.createElements(container);
    this.setupEvents();
    this.update();
  }

  createElements(container) {
    this.container = document.createElement('div');
    this.container.className = 'knob-container';
    this.container.style.display = 'inline-block';
    this.container.style.textAlign = 'center';
    this.container.style.margin = '0 10px';

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cursor = 'pointer';

    this.valueDisplay = document.createElement('div');
    this.valueDisplay.className = 'knob-value';
    this.valueDisplay.style.color = this.theme.label;
    this.valueDisplay.style.marginTop = '5px';
    this.valueDisplay.style.fontSize = '12px';

    this.labelElement = document.createElement('div');
    this.labelElement.className = 'knob-label';
    this.labelElement.textContent = this.label;
    this.labelElement.style.color = this.theme.label;
    this.labelElement.style.marginTop = '5px';
    this.labelElement.style.fontSize = '12px';

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.valueDisplay);
    this.container.appendChild(this.labelElement);
    container.appendChild(this.container);

    this.ctx = this.canvas.getContext('2d');
  }

  setupEvents() {
    const getAngleFromEvent = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
      if (angle < 0) angle += 360;
      return angle;
    };

    const updateFromAngle = (angle) => {
      if (angle < this.startAngle - 180) angle += 360;
      angle = Math.max(this.startAngle, Math.min(this.endAngle, angle));
      const normalized = (angle - this.startAngle) / (this.endAngle - this.startAngle);
      const newValue = this.min + normalized * (this.max - this.min);
      this.setValue(Math.round(newValue / this.step) * this.step);
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      updateFromAngle(getAngleFromEvent(e));
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        updateFromAngle(getAngleFromEvent(e));
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse wheel support
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const step = e.shiftKey ? this.step * 10 : this.step;
      this.setValue(this.value + direction * step);
    });
  }

  setValue(newValue) {
    const oldValue = this.value;
    this.value = Math.max(this.min, Math.min(this.max, newValue));
    if (oldValue !== this.value) {
      this.update();
      this.onChange(this.value);
    }
  }

  update() {
    const ctx = this.ctx;
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const radius = (this.size - 20) / 2;

    // Clear
    ctx.clearRect(0, 0, this.size, this.size);

    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, (this.startAngle - 90) * Math.PI / 180, (this.endAngle - 90) * Math.PI / 180);
    ctx.strokeStyle = this.theme.border + "33";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw value arc
    const normalized = (this.value - this.min) / (this.max - this.min);
    const valueAngle = this.startAngle + normalized * (this.endAngle - this.startAngle);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, (this.startAngle - 90) * Math.PI / 180, (valueAngle - 90) * Math.PI / 180);
    ctx.strokeStyle = this.theme.glow;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = this.theme.glow;
    ctx.fill();

    // Draw indicator line
    const angle = (valueAngle - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.strokeStyle = this.theme.glow;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update value display
    this.valueDisplay.textContent = this.value.toFixed(2);
  }

  updateTheme(newTheme) {
    this.theme = newTheme;
    this.valueDisplay.style.color = this.theme.label;
    this.labelElement.style.color = this.theme.label;
    this.update();
  }
} 