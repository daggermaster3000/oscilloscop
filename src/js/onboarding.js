// Onboarding system for first-time users
class Onboarding {
    constructor() {
      this.currentStep = 0;
      this.steps = [
        {
          title: "Welcome to Oscilloscop. 🎵",
          content: "This is a powerful audio visualization tool with multiple display modes and themes. Let's take a quick tour!",
          target: null,
          position: "center"
        },
        {
          title: "Choose Your Audio Source",
          content: "Start by selecting an audio input source. You can upload an audio file or use your microphone/audio interface for live visualization.",
          target: "#inputSource",
          position: "right",
          highlight: true,
          
        },
        
        {
          title: "Upload Audio or Connect Mic",
          content: "If you selected 'Audio File', upload a file here. If you chose 'Microphone', select your audio device and grant permission when prompted.<br><br><strong>Pro Tip:</strong> To route audio from a DAW (like Logic Pro) while keeping speaker output, check out <a href='https://github.com/ExistentialAudio/BlackHole/wiki/Multi-Output-Device' target='_blank' style='color: #00FF99; text-decoration: underline;'>this BlackHole setup guide</a>.",
          target: "#fileLabel",
          position: "right",
          highlight: true
        },
        {
          title: "Explore Display Modes",
          content: "Choose from 12 different visualization modes including Waveform, FFT Spectrum, 3D visualizations, Particle Cloud, and even Game of Life driven by audio!",
          target: "#displayMode",
          position: "right",
          highlight: true
        },
        {
          title: "Pick a Theme",
          content: "Customize the look with 17 different themes ranging from Retro Green to Cyberpunk Glow. Each theme changes the colors and visual style.",
          target: "#themeSelect",
          position: "right",
          highlight: true
        },
        {
          title: "Fine-tune with Controls",
          content: "Use the knobs to adjust Afterglow, Smoothing, and Line Width. These controls affect how the visualizations are rendered and create different visual effects.",
          target: "#knobControls",
          position: "right",
          highlight: true
        },
        {
          title: "Advanced Features",
          content: "Each display mode has unique controls that appear when selected. Try Particle Cloud for 3D parametric equations, or Game of Life for cellular automata tuning!",
          target: "#displayMode",
          position: "right",
          highlight: true,
        //   action: () => setTimeout(() => {
        //     const select = document.getElementById('displayMode');
        //     if (select) {
        //       select.value = '3D Mesh';
        //       select.dispatchEvent(new Event('change'));
        //       select.classList.add('flash'); // Custom CSS animation
        //       setTimeout(() => select.classList.remove('flash'), 1000);
        //     }
        //   }, 300)
        },
        {
            title: "Audio Reactive Filters",
            content: "Use audio reactive filters to add more intensity to the visualizations",
            target: '#filterEffect',
            position: "center",
            highlight: true,
          },
        {
          title: "Share Your Settings",
          content: "Use 'Copy Settings URL' to share your exact configuration with others. The URL preserves all your settings including equations and parameters.",
          target: null,
          position: "center"
        },
        {
          title: "Ready to Go! 🚀",
          content: "You can always access the instructions again by clicking the 'Instructions' button. Now start exploring and enjoy the visualizations!",
          target: "#instructionsBtn",
          position: "bottom",
          highlight: true
        }
      ];
      
      this.overlay = null;
      this.tooltip = null;
      this.hasSeenOnboarding = localStorage.getItem('oscilloscope_onboarding_seen') === 'true';
    }
  
    init() {
      // Check if user has seen onboarding
      if (this.hasSeenOnboarding) {
        return;
      }
  
      // Wait a bit for the page to fully load
      setTimeout(() => {
        this.createOverlay();
        this.showStep(0);
      }, 500);
    }
  
    createOverlay() {
      // Create backdrop
      this.overlay = document.createElement('div');
      this.overlay.id = 'onboarding-overlay';
      this.overlay.className = 'onboarding-overlay';
      document.body.appendChild(this.overlay);
  
      // Create tooltip container
      this.tooltip = document.createElement('div');
      this.tooltip.id = 'onboarding-tooltip';
      this.tooltip.className = 'onboarding-tooltip';
      document.body.appendChild(this.tooltip);
  
      // Create highlight element
      this.highlight = document.createElement('div');
      this.highlight.id = 'onboarding-highlight';
      this.highlight.className = 'onboarding-highlight';
      document.body.appendChild(this.highlight);
    }
  
    showStep(stepIndex) {
      if (stepIndex < 0 || stepIndex >= this.steps.length) {
        this.complete();
        return;
      }
  
      this.currentStep = stepIndex;
      const step = this.steps[stepIndex];
    
      // 🟢 Execute step action if defined
      if (typeof step.action === 'function') {
        try {
          step.action();
        } catch (err) {
          console.warn('Onboarding step action failed:', err);
        }
      }
  
      // Update tooltip content
      this.tooltip.innerHTML = `
        <div class="onboarding-header">
          <h3>${step.title}</h3>
          <button class="onboarding-close" onclick="window.onboardingInstance.skip()">×</button>
        </div>
        <div class="onboarding-content">
          <p>${step.content}</p>
        </div>
        <div class="onboarding-footer">
          <div class="onboarding-progress">
            <span>${stepIndex + 1} of ${this.steps.length}</span>
            <div class="onboarding-dots">
              ${this.steps.map((_, i) => 
                `<span class="dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}"></span>`
              ).join('')}
            </div>
          </div>
          <div class="onboarding-buttons">
            ${stepIndex > 0 ? '<button class="onboarding-btn secondary" onclick="window.onboardingInstance.prev()">Back</button>' : ''}
            <button class="onboarding-btn primary" onclick="window.onboardingInstance.next()">
              ${stepIndex === this.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      `;
  
      // Position tooltip and highlight
      this.positionTooltip(step);
  
      // Show overlay and tooltip
      this.overlay.style.display = 'block';
      this.tooltip.style.display = 'block';
    }
  
    positionTooltip(step) {
      const target = step.target ? document.querySelector(step.target) : null;
  
      if (target && step.highlight) {
        // Highlight the target element
        const rect = target.getBoundingClientRect();
        const padding = 8;
        
        this.highlight.style.display = 'block';
        this.highlight.style.left = `${rect.left - padding}px`;
        this.highlight.style.top = `${rect.top - padding}px`;
        this.highlight.style.width = `${rect.width + padding * 2}px`;
        this.highlight.style.height = `${rect.height + padding * 2}px`;
  
        // Position tooltip relative to target
        this.positionTooltipRelativeToTarget(rect, step.position);
      } else {
        // Center tooltip
        this.highlight.style.display = 'none';
        this.tooltip.style.left = '50%';
        this.tooltip.style.top = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
      }
    }
  
    positionTooltipRelativeToTarget(rect, position) {
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const spacing = 20;
      let left, top;
  
      switch (position) {
        case 'right':
          left = rect.right + spacing;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'left':
          left = rect.left - tooltipRect.width - spacing;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'top':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.top - tooltipRect.height - spacing;
          break;
        case 'bottom':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.bottom + spacing;
          break;
        default:
          left = rect.right + spacing;
          top = rect.top;
      }
  
      // Keep tooltip within viewport
      const maxLeft = window.innerWidth - tooltipRect.width - 20;
      const maxTop = window.innerHeight - tooltipRect.height - 20;
      left = Math.max(20, Math.min(left, maxLeft));
      top = Math.max(20, Math.min(top, maxTop));
  
      this.tooltip.style.left = `${left}px`;
      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.transform = 'none';
    }
  
    next() {
      this.showStep(this.currentStep + 1);
    }
  
    prev() {
      this.showStep(this.currentStep - 1);
    }
  
    skip() {
      if (confirm('Are you sure you want to skip the tutorial? You can access it later from the Instructions button.')) {
        this.complete();
      }
    }
  
    complete() {
      // Mark as seen
      localStorage.setItem('oscilloscope_onboarding_seen', 'true');
      this.hasSeenOnboarding = true;
  
      // Remove elements
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      if (this.tooltip) {
        this.tooltip.style.display = 'none';
      }
      if (this.highlight) {
        this.highlight.style.display = 'none';
      }
    }
  
    restart() {
      this.currentStep = 0;
      if (!this.overlay) {
        this.createOverlay();
      }
      this.showStep(0);
    }
  
    reset() {
      localStorage.removeItem('oscilloscope_onboarding_seen');
      this.hasSeenOnboarding = false;
    }
  }
  
  // Create global instance
  window.onboardingInstance = null;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.onboardingInstance = new Onboarding();
      window.onboardingInstance.init();
    });
  } else {
    window.onboardingInstance = new Onboarding();
    window.onboardingInstance.init();
  }
  