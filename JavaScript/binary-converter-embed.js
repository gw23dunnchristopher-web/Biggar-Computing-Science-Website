// Binary-Decimal Converter Embeddable Version
(function() {
  // Prevent multiple initializations
  if (window.binaryConverterInitialized) return;
  window.binaryConverterInitialized = true;
  // Create stylesheet
  const style = document.createElement('style');
  style.textContent = `
    .binary-converter-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .binary-converter-header {
      background-color: #3b82f6;
      color: white;
      padding: 16px;
      text-align: center;
    }

    .binary-converter-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .binary-converter-header p {
      margin: 4px 0 0 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .binary-converter-body {
      padding: 16px;
    }

    .binary-converter-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .binary-converter-toggle label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
    }

    .binary-converter-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .binary-converter-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .binary-converter-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #e5e7eb;
      transition: .4s;
      border-radius: 24px;
    }

    .binary-converter-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    .binary-converter-switch input:checked + .binary-converter-slider {
      background-color: #3b82f6;
    }

    .binary-converter-switch input:checked + .binary-converter-slider:before {
      transform: translateX(26px);
    }

    .binary-converter-question {
      text-align: center;
      margin-bottom: 16px;
    }

    .binary-converter-question h3 {
      font-size: 1rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .binary-display {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      margin: 12px 0;
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
    }

    .binary-digit {
      width: 2rem;
      height: 2.75rem;
      font-family: 'Courier New', monospace;
      font-size: 1.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 0.25rem;
      border-radius: 0.25rem;
      background-color: #e5e7eb;
    }

    .decimal-display {
      font-size: 1.75rem;
      font-weight: bold;
      background-color: #f9fafb;
      padding: 8px 24px;
      border-radius: 6px;
      display: inline-block;
    }

    .binary-powers {
      display: flex;
      justify-content: center;
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .binary-powers span {
      width: 36px;
      text-align: center;
    }

    .binary-converter-input {
      margin-bottom: 16px;
    }

    .binary-converter-input label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .binary-converter-input input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: inherit;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .binary-converter-input input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    .binary-converter-button {
      display: block;
      width: 100%;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 16px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .binary-converter-button:hover {
      background-color: #2563eb;
    }

    .binary-converter-feedback {
      margin: 16px 0;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }

    .binary-converter-feedback.correct {
      background-color: #ecfdf5;
      border: 1px solid #10b981;
      color: #047857;
    }

    .binary-converter-feedback.incorrect {
      background-color: #fef2f2;
      border: 1px solid #ef4444;
      color: #b91c1c;
    }

    .binary-converter-feedback h4 {
      margin: 0 0 4px 0;
      font-weight: 500;
    }

    .binary-converter-feedback p {
      margin: 0;
      font-size: 0.875rem;
    }

    .binary-converter-score {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .score-correct {
      color: #10b981;
      font-weight: 500;
    }

    .score-incorrect {
      color: #ef4444;
      font-weight: 500;
    }

    .binary-converter-new {
      background: none;
      border: none;
      color: #3b82f6;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }

    .binary-converter-new:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .binary-digit {
        width: 1.75rem;
        height: 2.5rem;
        font-size: 1.5rem;
        margin: 0 0.125rem;
      }

      .binary-powers span {
        width: 28px;
      }
    }
  `;
  document.head.appendChild(style);

  // Main converter class
  class BinaryDecimalConverter {
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        mode: options.mode || 'binary-to-decimal',
        showToggle: options.showToggle !== false,
        primaryColor: options.primaryColor || '#3b82f6',
        className: options.className || '',
      };

      // State
      this.currentBinary = '';
      this.currentDecimal = 0;
      this.userAnswer = '';
      this.showFeedback = false;
      this.isCorrect = false;
      this.scores = {
        binaryToDecimal: { correct: 0, incorrect: 0 },
        decimalToBinary: { correct: 0, incorrect: 0 }
      };

      // Initialize
      this.render();
      this.generateNewQuestion();
    }

    // Render the converter UI
    render() {
      // Apply custom color if specified
      if (this.options.primaryColor !== '#3b82f6') {
        const style = document.createElement('style');
        style.textContent = `
          #${this.container.id} .binary-converter-header,
          #${this.container.id} .binary-converter-switch input:checked + .binary-converter-slider,
          #${this.container.id} .binary-converter-button {
            background-color: ${this.options.primaryColor};
          }
          #${this.container.id} .binary-converter-input input:focus {
            border-color: ${this.options.primaryColor};
            box-shadow: 0 0 0 2px ${this.options.primaryColor}33;
          }
          #${this.container.id} .binary-converter-new {
            color: ${this.options.primaryColor};
          }
        `;
        document.head.appendChild(style);
      }

      // Prepare the container
      this.container.className = 'binary-converter-container ' + this.options.className;

      // Create the header
      const header = document.createElement('div');
      header.className = 'binary-converter-header';
      header.innerHTML = `
        <h2 style="background-color: #3b82f6; border-bottom:none;
      color: white;
      padding: 16px;
      text-align: center;">Binary-Decimal Converter</h2>
        <p>Test your conversion skills</p>
      `;

      // Create the body
      const body = document.createElement('div');
      body.className = 'binary-converter-body';

      // Add mode toggle if enabled
      if (this.options.showToggle) {
        const toggle = document.createElement('div');
        toggle.className = 'binary-converter-toggle';
        toggle.innerHTML = `
          <label>Binary to Decimal</label>
          <label class="binary-converter-switch">
            <input type="checkbox" id="${this.container.id}-mode-toggle" ${this.options.mode === 'decimal-to-binary' ? 'checked' : ''}>
            <span class="binary-converter-slider"></span>
          </label>
          <label>Decimal to Binary</label>
        `;
        body.appendChild(toggle);

        // Add event listener to the toggle
        const toggleInput = toggle.querySelector(`#${this.container.id}-mode-toggle`);
        toggleInput.addEventListener('change', () => {
          this.options.mode = toggleInput.checked ? 'decimal-to-binary' : 'binary-to-decimal';
          this.updateUI();
          this.generateNewQuestion();
        });
      }

      // Create question section
      const question = document.createElement('div');
      question.className = 'binary-converter-question';
      question.innerHTML = `
        <h3>${this.options.mode === 'binary-to-decimal' ? 'Convert this binary number to decimal:' : 'Convert this decimal number to binary:'}</h3>
        <div id="${this.container.id}-display"></div>
        <div id="${this.container.id}-powers" class="binary-powers"></div>
      `;
      body.appendChild(question);

      // Create input section
      const inputSection = document.createElement('div');
      inputSection.className = 'binary-converter-input';
      inputSection.innerHTML = `
        <label for="${this.container.id}-input">${this.options.mode === 'binary-to-decimal' ? 'Enter the decimal value:' : 'Enter the binary value:'}</label>
        <input 
          type="${this.options.mode === 'binary-to-decimal' ? 'number' : 'text'}" 
          id="${this.container.id}-input"
          placeholder="${this.options.mode === 'binary-to-decimal' ? 'Enter decimal number (0-255)' : 'Enter 8-bit binary (e.g., 10110010)'}"
          ${this.options.mode === 'binary-to-decimal' ? 'min="0" max="255"' : 'maxlength="8"'}
        >
      `;
      body.appendChild(inputSection);

      // Add check answer button
      const button = document.createElement('button');
      button.className = 'binary-converter-button';
      button.textContent = 'Check Answer';
      button.id = `${this.container.id}-check`;
      body.appendChild(button);

      // Add feedback area
      const feedback = document.createElement('div');
      feedback.id = `${this.container.id}-feedback`;
      feedback.style.display = 'none';
      body.appendChild(feedback);

      // Add score section
      const score = document.createElement('div');
      score.className = 'binary-converter-score';
      score.innerHTML = `
        <div>Correct: <span class="score-correct" id="${this.container.id}-correct">0</span></div>
        <div>Incorrect: <span class="score-incorrect" id="${this.container.id}-incorrect">0</span></div>
        <button class="binary-converter-new" id="${this.container.id}-new">New Question</button>
      `;
      body.appendChild(score);

      // Append all to container
      this.container.appendChild(header);
      this.container.appendChild(body);

      // Add event listeners
      const input = document.getElementById(`${this.container.id}-input`);
      input.addEventListener('input', (e) => this.handleInputChange(e));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkAnswer();
      });

      document.getElementById(`${this.container.id}-check`).addEventListener('click', () => this.checkAnswer());
      document.getElementById(`${this.container.id}-new`).addEventListener('click', () => this.generateNewQuestion());
    }

    // Generate a new random question
    generateNewQuestion() {
      this.showFeedback = false;
      this.userAnswer = '';

      // Generate random binary between 0-255
      const decimal = Math.floor(Math.random() * 256);
      let binary = decimal.toString(2);
      // Pad with leading zeros to make 8 bits
      binary = binary.padStart(8, '0');

      this.currentBinary = binary;
      this.currentDecimal = decimal;

      this.updateUI();
    }

    // Update the UI based on current state
    updateUI() {
      // Reset input
      const input = document.getElementById(`${this.container.id}-input`);
      input.value = this.userAnswer;

      // Update input type and attributes based on mode
      if (this.options.mode === 'binary-to-decimal') {
        input.type = 'number';
        input.min = '0';
        input.max = '255';
        input.placeholder = 'Enter decimal number (0-255)';
        input.maxLength = '';
      } else {
        input.type = 'text';
        input.min = '';
        input.max = '';
        input.placeholder = 'Enter 8-bit binary (e.g., 10110010)';
        input.maxLength = 8;
      }

      // Update question text
      const questionText = document.querySelector(`#${this.container.id} h3`);
      if (questionText) {
        questionText.textContent = this.options.mode === 'binary-to-decimal' 
          ? 'Convert this binary number to decimal:' 
          : 'Convert this decimal number to binary:';
      }

      // Update input label
      const inputLabel = document.querySelector(`label[for="${this.container.id}-input"]`);
      if (inputLabel) {
        inputLabel.textContent = this.options.mode === 'binary-to-decimal' 
          ? 'Enter the decimal value:' 
          : 'Enter the binary value:';
      }

      // Update display area
      const display = document.getElementById(`${this.container.id}-display`);
      if (this.options.mode === 'binary-to-decimal') {
        // Binary display
        display.innerHTML = '';
        display.className = 'binary-display';
        this.currentBinary.split('').forEach(digit => {
          const digitSpan = document.createElement('div');
          digitSpan.className = 'binary-digit';
          digitSpan.textContent = digit;
          display.appendChild(digitSpan);
        });

        // Show powers of 2
        const powers = document.getElementById(`${this.container.id}-powers`);
        powers.innerHTML = '';
        powers.style.display = 'flex';
        [128, 64, 32, 16, 8, 4, 2, 1].forEach(power => {
          const span = document.createElement('span');
          span.textContent = power;
          powers.appendChild(span);
        });
      } else {
        // Decimal display
        display.className = '';
        display.innerHTML = `<div class="decimal-display">${this.currentDecimal}</div>`;

        // Hide powers
        document.getElementById(`${this.container.id}-powers`).style.display = 'none';
      }

      // Update feedback area
      const feedback = document.getElementById(`${this.container.id}-feedback`);
      feedback.style.display = this.showFeedback ? 'block' : 'none';

      // Update score
      const scoreType = this.options.mode === 'binary-to-decimal' ? 'binaryToDecimal' : 'decimalToBinary';
      document.getElementById(`${this.container.id}-correct`).textContent = this.scores[scoreType].correct;
      document.getElementById(`${this.container.id}-incorrect`).textContent = this.scores[scoreType].incorrect;
    }

    // Handle input changes
    handleInputChange(event) {
      const value = event.target.value;

      if (this.options.mode === 'binary-to-decimal') {
        // Validate decimal input (0-255)
        let num = parseInt(value, 10);
        if (isNaN(num)) {
          this.userAnswer = '';
          event.target.value = '';
        } else {
          num = Math.max(0, Math.min(255, num));
          this.userAnswer = num.toString();
          event.target.value = num.toString();
        }
      } else {
        // Validate binary input (only 0s and 1s)
        const validBinary = value.replace(/[^01]/g, '').slice(0, 8);
        this.userAnswer = validBinary;
        event.target.value = validBinary;
      }
    }

    // Check the user's answer
    checkAnswer() {
      const input = document.getElementById(`${this.container.id}-input`);
      this.userAnswer = input.value.trim();

      if (!this.userAnswer) return; // Don't proceed if input is empty

      // If already answered correctly, just show feedback
      if (this.isCorrect) {
        const feedback = document.getElementById(`${this.container.id}-feedback`);
        feedback.className = 'binary-converter-feedback correct';
        feedback.innerHTML = '<h4>Correct! Well done!</h4>';
        feedback.style.display = 'block';
        return;
      }

      let correct = false;
      const scoreType = this.options.mode === 'binary-to-decimal' ? 'binaryToDecimal' : 'decimalToBinary';

      if (this.options.mode === 'binary-to-decimal') {
        // Binary to decimal mode
        const expectedAnswer = this.currentDecimal.toString();
        correct = this.userAnswer === expectedAnswer;
      } else {
        // Decimal to binary mode
        const normalizedUserAnswer = this.userAnswer.padStart(8, '0');
        correct = normalizedUserAnswer === this.currentBinary;
      }

      // Update score only if not already answered correctly
      if (correct && !this.showFeedback) {
        this.scores[scoreType].correct++;
      } else if (!correct) {
        this.scores[scoreType].incorrect++;
      }

      // Show feedback
      this.isCorrect = correct;
      this.showFeedback = true;

      // Update feedback area
      const feedback = document.getElementById(`${this.container.id}-feedback`);
      feedback.className = `binary-converter-feedback ${correct ? 'correct' : 'incorrect'}`;

      if (correct) {
        feedback.innerHTML = '<h4>Correct! Well done!</h4>';
      } else {
        feedback.innerHTML = `
          <h4>Incorrect. Try again!</h4>
          <p>The correct answer is: <strong>${
            this.options.mode === 'binary-to-decimal' ? this.currentDecimal : this.currentBinary
          }</strong></p>
        `;
      }

      this.updateUI();
    }
  }

  // Globally expose the converter initialization function
  window.initBinaryConverter = function(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    return new BinaryDecimalConverter(container, options);
  };

  // Auto-initialize converters with data attributes
  function initializeAll() {
    const containers = document.querySelectorAll('[data-binary-converter]');

    containers.forEach(container => {
      // Get configuration from data attributes
      const options = {
        mode: container.getAttribute('data-mode') || 'binary-to-decimal',
        showToggle: container.getAttribute('data-show-toggle') !== 'false',
        primaryColor: container.getAttribute('data-primary-color') || '#3b82f6',
        className: container.getAttribute('data-class') || ''
      };

      // Ensure container has ID
      if (!container.id) {
        container.id = 'binary-converter-' + Math.random().toString(36).substring(2, 9);
      }

      // Initialize converter
      window.initBinaryConverter(container.id, options);
    });
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
  } else {
    initializeAll();
  }
})();