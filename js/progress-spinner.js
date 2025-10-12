/**
 * Progress Spinner - Provides loading states with percentage display
 * Creates animated progress indicators for better UX during data loading
 */

class ProgressSpinner {
  constructor() {
    this.activeSpinners = new Map();
    this.animationFrame = null;
  }

  /**
   * Show progress spinner with percentage
   * @param {string} elementId - DOM element ID to show spinner in
   * @param {string} text - Loading text (optional)
   * @param {number} initialProgress - Initial progress percentage (0-100)
   */
  show(elementId, text = 'Loading...', initialProgress = 0) {
    console.log(`[ProgressSpinner] Attempting to show spinner in: ${elementId}`);
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[ProgressSpinner] Element not found: ${elementId}`);
      return;
    }

    console.log(`[ProgressSpinner] Element found, showing spinner`);

    // Store original content
    if (!element.dataset.originalContent) {
      element.dataset.originalContent = element.innerHTML;
    }

    // Create spinner HTML
    const spinnerHTML = `
      <div class="progress-spinner-container">
        <div class="progress-spinner">
          <div class="progress-circle">
            <svg class="progress-svg" viewBox="0 0 100 100">
              <circle class="progress-bg" cx="50" cy="50" r="45"></circle>
              <circle class="progress-bar" cx="50" cy="50" r="45" style="stroke-dasharray: ${2 * Math.PI * 45}; stroke-dashoffset: ${2 * Math.PI * 45 * (1 - initialProgress / 100)};"></circle>
            </svg>
            <div class="progress-text">${Math.round(initialProgress)}%</div>
          </div>
        </div>
        <div class="progress-message">${text}</div>
        <div class="progress-details">Please wait while we load your data...</div>
      </div>
    `;

    element.innerHTML = spinnerHTML;
    element.classList.add('progress-loading');

    // Store spinner data
    this.activeSpinners.set(elementId, {
      element,
      progress: initialProgress,
      text,
      startTime: Date.now()
    });

    console.log(`[ProgressSpinner] Showing progress spinner in ${elementId} at ${initialProgress}%`);
  }

  /**
   * Update progress percentage
   * @param {string} elementId - DOM element ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} text - Optional text update
   */
  update(elementId, progress, text = null) {
    const spinnerData = this.activeSpinners.get(elementId);
    if (!spinnerData) {
      console.warn(`[ProgressSpinner] No active spinner found for: ${elementId}`);
      return;
    }

    // Clamp progress between 0 and 100
    progress = Math.max(0, Math.min(100, progress));
    
    // Update spinner data
    spinnerData.progress = progress;
    if (text) {
      spinnerData.text = text;
    }

    // Update DOM
    const progressBar = spinnerData.element.querySelector('.progress-bar');
    const progressText = spinnerData.element.querySelector('.progress-text');
    const progressMessage = spinnerData.element.querySelector('.progress-message');

    if (progressBar) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference * (1 - progress / 100);
      progressBar.style.strokeDashoffset = offset;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }

    if (progressMessage && text) {
      progressMessage.textContent = text;
    }

    console.log(`[ProgressSpinner] Updated ${elementId} to ${Math.round(progress)}%`);
  }

  /**
   * Hide progress spinner and restore original content
   * @param {string} elementId - DOM element ID
   */
  hide(elementId) {
    const spinnerData = this.activeSpinners.get(elementId);
    if (!spinnerData) {
      console.warn(`[ProgressSpinner] No active spinner found for: ${elementId}`);
      return;
    }

    const element = spinnerData.element;

    // Restore original content
    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
    }

    element.classList.remove('progress-loading');
    this.activeSpinners.delete(elementId);

    console.log(`[ProgressSpinner] Hidden progress spinner in ${elementId}`);
  }

  /**
   * Simulate progress loading with automatic updates
   * @param {string} elementId - DOM element ID
   * @param {string} text - Loading text
   * @param {number} duration - Duration in milliseconds (default: 2000)
   * @param {Function} onComplete - Callback when complete
   */
  simulateProgress(elementId, text = 'Loading...', duration = 2000, onComplete = null) {
    this.show(elementId, text, 0);

    const startTime = Date.now();
    const spinnerData = this.activeSpinners.get(elementId);

    if (!spinnerData) return;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      this.update(elementId, progress, text);

      if (progress < 100) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        if (onComplete) {
          setTimeout(() => {
            this.hide(elementId);
            onComplete();
          }, 300); // Small delay before hiding
        } else {
          setTimeout(() => this.hide(elementId), 300);
        }
      }
    };

    animate();
  }

  /**
   * Show spinner with step-by-step progress
   * @param {string} elementId - DOM element ID
   * @param {Array} steps - Array of step objects {text: string, duration: number}
   * @param {Function} onComplete - Callback when complete
   */
  showSteps(elementId, steps, onComplete = null) {
    if (!steps || steps.length === 0) return;

    this.show(elementId, steps[0].text, 0);

    let currentStep = 0;
    let currentProgress = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    const updateStep = () => {
      if (currentStep >= steps.length) {
        if (onComplete) {
          setTimeout(() => {
            this.hide(elementId);
            onComplete();
          }, 300);
        } else {
          setTimeout(() => this.hide(elementId), 300);
        }
        return;
      }

      const step = steps[currentStep];
      const stepProgress = (currentStep + 1) / steps.length * 100;

      this.update(elementId, stepProgress, step.text);

      setTimeout(() => {
        currentStep++;
        updateStep();
      }, step.duration);
    };

    updateStep();
  }

  /**
   * Hide all active spinners
   */
  hideAll() {
    this.activeSpinners.forEach((spinnerData, elementId) => {
      this.hide(elementId);
    });
  }

  /**
   * Get current progress for an element
   * @param {string} elementId - DOM element ID
   * @returns {number} Current progress percentage
   */
  getProgress(elementId) {
    const spinnerData = this.activeSpinners.get(elementId);
    return spinnerData ? spinnerData.progress : 0;
  }

  /**
   * Check if spinner is active for an element
   * @param {string} elementId - DOM element ID
   * @returns {boolean} True if spinner is active
   */
  isActive(elementId) {
    return this.activeSpinners.has(elementId);
  }
}

// Create global instance
window.ProgressSpinner = new ProgressSpinner();

console.log('[ProgressSpinner] Module loaded');
