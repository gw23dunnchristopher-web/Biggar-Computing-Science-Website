// Two's Complement Converter Embeddable Version
(function() {
  // Prevent multiple initializations
  if (window.twosComplementInitialized) return;
  window.twosComplementInitialized = true;
  // Create stylesheet
  const style = document.createElement('style');
  style.textContent = `
    .tc-converter-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tc-converter-header {
      background-color: #3b82f6;
      color: white;
      padding: 16px;
      text-align: center;
    }

    .tc-converter-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .tc-converter-header p {
      margin: 4px 0 0 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .tc-converter-body {
      padding: 16px;
    }

    .tc-converter-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tc-converter-toggle label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
    }

    .tc-converter-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .tc-converter-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .tc-converter-slider {
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

    .tc-converter-slider:before {
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

    .tc-converter-switch input:checked + .tc-converter-slider {
      background-color: #3b82f6;
    }

    .tc-converter-switch input:checked + .tc-converter-slider:before {
      transform: translateX(26px);
    }

    .tc-converter-question {
      text-align: center;
      margin-bottom: 16px;
    }

    .tc-converter-question h3 {
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

    .binary-digit:first-child {
      background-color: #fee2e2;
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

    .tc-converter-input {
      margin-bottom: 16px;
    }

    .tc-converter-input label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .tc-converter-input input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: inherit;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .tc-converter-input input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    .tc-converter-button {
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

    .tc-converter-button:hover {
      background-color: #2563eb;
    }

    .tc-converter-feedback {
      margin: 16px 0;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }

    .tc-converter-feedback.correct {
      background-color: #ecfdf5;
      border: 1px solid #10b981;
      color: #047857;
    }

    .tc-converter-feedback.incorrect {
      background-color: #fef2f2;
      border: 1px solid #ef4444;
      color: #b91c1c;
    }

    .tc-converter-feedback h4 {
      margin: 0 0 4px 0;
      font-weight: 500;
    }

    .tc-converter-feedback p {
      margin: 0;
      font-size: 0.875rem;
    }

    .tc-converter-score {
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

    .tc-converter-new {
      background: none;
      border: none;
      color: #3b82f6;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }

    .tc-converter-new:hover {
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

  // Helper functions for two's complement conversions
  const twosComplementUtils = {
    // Convert 8-bit two's complement binary string to decimal number
    twosComplementToDecimal: function(binary) {
      // Ensure we have 8 bits by padding with zeros
      const paddedBinary = binary.padStart(8, '0');

      // Check if this is a negative number (first bit is 1)
      if (paddedBinary[0] === '1') {
        // For negative numbers in two's complement:
        // 1. Take the ones' complement (flip all bits)
        // 2. Add 1
        // 3. Make the result negative
        const onesComplement = paddedBinary
          .split('')
          .map(bit => bit === '0' ? '1' : '0')
          .join('');

        // Convert to decimal and make it negative
        return -(parseInt(onesComplement, 2) + 1);
      } else {
        // For positive numbers, just convert to decimal
        return parseInt(paddedBinary, 2);
      }
    },

    // Convert decimal number to 8-bit two's complement binary string
    decimalToTwosComplement: function(decimal) {
      // Ensure the number is within valid range
      if (decimal < -128 || decimal > 127) {
        throw new Error('Number out of range for 8-bit two\'s complement (-128 to 127)');
      }

      if (decimal >= 0) {
        // For positive numbers, just convert to binary and pad to 8 bits
        return decimal.toString(2).padStart(8, '0');
      } else {
        // For negative numbers in two's complement:
        // 1. Take the absolute value
        // 2. Convert to binary
        // 3. Take the ones' complement (flip all bits)
        // 4. Add 1 (which is equivalent to subtract 1 from the absolute value, then flip)

        // Get absolute value and subtract 1
        const absValue = Math.abs(decimal) - 1;

        // Convert to binary and pad to 8 bits
        const binaryAbsValue = absValue.toString(2).padStart(8, '0');

        // Flip all bits (ones' complement)
        return binaryAbsValue
          .split('')
          .map(bit => bit === '0' ? '1' : '0')
          .join('');
      }
    },

    // Generate a random 8-bit two's complement binary number
    generateRandomTwosComplement: function() {
      // Generate a random decimal number between -128 and 127
      const decimal = Math.floor(Math.random() * 256) - 128;

      // Convert to binary two's complement representation
      const binary = this.decimalToTwosComplement(decimal);

      return { binary, decimal };
    },

    // Validate binary input
    validateBinaryInput: function(value) {
      // Only allow 0s and 1s, max 8 chars
      return value.replace(/[^01]/g, '').slice(0, 8);
    },

    // Validate decimal input
    validateDecimalInput: function(value) {
      const num = parseInt(value, 10);
      if (isNaN(num)) return '';
      if (num < -128) return '-128';
      if (num > 127) return '127';
      return num.toString();
    }
  };

  // Main converter class
  class TwosComplementConverter {
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        mode: options.mode || 'binary-to-decimal',
        primaryColor: options.primaryColor || '#3b82f6',
        showHeader: options.showHeader !== false,
        showScores: options.showScores !== false,
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
          #${this.container.id} .tc-converter-header,
          #${this.container.id} .tc-converter-switch input:checked + .tc-converter-slider,
          #${this.container.id} .tc-converter-button {
            background-color: ${this.options.primaryColor};
          }
          #${this.container.id} .tc-converter-input input:focus {
            border-color: ${this.options.primaryColor};
            box-shadow: 0 0 0 2px ${this.options.primaryColor}33;
          }
          #${this.container.id} .tc-converter-new {
            color: ${this.options.primaryColor};
          }
        `;
        document.head.appendChild(style);
      }

      // Prepare the container
      this.container.className = 'tc-converter-container';

      // Create the header if enabled
      if (this.options.showHeader) {
        const header = document.createElement('div');
        header.className = 'tc-converter-header';
        header.innerHTML = `
          <h2 style="background-color: #3b82f6;color: white;padding: 16px;text-align: center; margin: 0;font-size: 1.25rem;font-weight: bold; border-bottom:none;">Two's Complement Converter</h2>
          <p>8-bit signed binary: range -128 to 127</p>
        `;
        this.container.appendChild(header);
      }

      // Create the body
      const body = document.createElement('div');
      body.className = 'tc-converter-body';

      // Add mode toggle
      const toggle = document.createElement('div');
      toggle.className = 'tc-converter-toggle';
      toggle.innerHTML = `
        <label>Binary to Decimal</label>
        <label class="tc-converter-switch">
          <input type="checkbox" id="${this.container.id}-mode-toggle" ${this.options.mode === 'decimal-to-binary' ? 'checked' : ''}>
          <span class="tc-converter-slider"></span>
        </label>
        <label>Decimal to Binary</label>
      `;
      body.appendChild(toggle);

      // Create question section
      const question = document.createElement('div');
      question.className = 'tc-converter-question';
      question.innerHTML = `
        <h3 id="${this.container.id}-question-title">Convert this two's complement binary to decimal:</h3>
        <div id="${this.container.id}-display"></div>
        <div id="${this.container.id}-powers" class="binary-powers"></div>
      `;
      body.appendChild(question);

      // Create input section
      const inputSection = document.createElement('div');
      inputSection.className = 'tc-converter-input';
      inputSection.innerHTML = `
        <label for="${this.container.id}-input" id="${this.container.id}-input-label">Enter the decimal value:</label>
        <input 
          type="number" 
          id="${this.container.id}-input"
          placeholder="Enter decimal number (-128 to 127)"
          min="-128"
          max="127"
        >
      `;
      body.appendChild(inputSection);

      // Add check answer button
      const button = document.createElement('button');
      button.className = 'tc-converter-button';
      button.textContent = 'Check Answer';
      button.id = `${this.container.id}-check`;
      body.appendChild(button);

      // Add feedback area
      const feedback = document.createElement('div');
      feedback.id = `${this.container.id}-feedback`;
      feedback.style.display = 'none';
      body.appendChild(feedback);

      // Add score section if enabled
      if (this.options.showScores) {
        const score = document.createElement('div');
        score.className = 'tc-converter-score';
        score.innerHTML = `
          <div>Correct: <span class="score-correct" id="${this.container.id}-correct">0</span></div>
          <div>Incorrect: <span class="score-incorrect" id="${this.container.id}-incorrect">0</span></div>
          <button class="tc-converter-new" id="${this.container.id}-new">New Question</button>
        `;
        body.appendChild(score);
      } else {
        // Just add new question button
        const newBtn = document.createElement('div');
        newBtn.className = 'text-center mt-4';
        newBtn.innerHTML = `<button class="tc-converter-new" id="${this.container.id}-new">New Question</button>`;
        body.appendChild(newBtn);
      }

      // Append all to container
      this.container.appendChild(body);

      // Add event listeners
      const input = document.getElementById(`${this.container.id}-input`);
      input.addEventListener('input', (e) => this.handleInputChange(e));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkAnswer();
      });

      const toggleInput = document.getElementById(`${this.container.id}-mode-toggle`);
      toggleInput.addEventListener('change', () => {
        this.options.mode = toggleInput.checked ? 'decimal-to-binary' : 'binary-to-decimal';
        this.updateUI();
        this.generateNewQuestion();
      });

      document.getElementById(`${this.container.id}-check`).addEventListener('click', () => this.checkAnswer());
      document.getElementById(`${this.container.id}-new`).addEventListener('click', () => this.generateNewQuestion());
    }

    // Generate a new random question
    generateNewQuestion() {
      this.showFeedback = false;
      this.userAnswer = '';

      const result = twosComplementUtils.generateRandomTwosComplement();
      this.currentBinary = result.binary;
      this.currentDecimal = result.decimal;

      this.updateUI();
    }

    // Update the UI based on current state
    updateUI() {
      // Reset input
      const input = document.getElementById(`${this.container.id}-input`);
      input.value = this.userAnswer;

      // Update question title
      const questionTitle = document.getElementById(`${this.container.id}-question-title`);
      questionTitle.textContent = this.options.mode === 'binary-to-decimal' 
        ? 'Convert this two\'s complement binary to decimal:' 
        : 'Convert this decimal to two\'s complement binary:';

      // Update input type and label
      const inputLabel = document.getElementById(`${this.container.id}-input-label`);

      if (this.options.mode === 'binary-to-decimal') {
        input.type = 'number';
        input.min = '-128';
        input.max = '127';
        input.placeholder = 'Enter decimal number (-128 to 127)';
        input.maxLength = '';
        inputLabel.textContent = 'Enter the decimal value:';
      } else {
        input.type = 'text';
        input.min = '';
        input.max = '';
        input.placeholder = 'Enter 8-bit binary (e.g., 10110010)';
        input.maxLength = 8;
        inputLabel.textContent = 'Enter the binary value:';
      }

      // Update display area
      const display = document.getElementById(`${this.container.id}-display`);

      if (this.options.mode === 'binary-to-decimal') {
        // Binary display
        display.innerHTML = '';
        display.className = 'binary-display';

        const paddedBinary = this.currentBinary.padStart(8, '0');
        paddedBinary.split('').forEach((digit, index) => {
          const digitSpan = document.createElement('div');
          digitSpan.className = 'binary-digit';
          if (index === 0) digitSpan.style.backgroundColor = '#fee2e2'; // Red for sign bit
          digitSpan.textContent = digit;
          display.appendChild(digitSpan);
        });

        // Show powers of 2
        const powers = document.getElementById(`${this.container.id}-powers`);
        powers.innerHTML = '';
        powers.style.display = 'flex';

        // In two's complement, the first bit is -2^7 (-128)
        const powerValues = ['-128', '64', '32', '16', '8', '4', '2', '1'];
        powerValues.forEach(power => {
          const span = document.createElement('span');
          span.textContent = power;
          if (power === '-128') span.style.color = '#ef4444'; // Red for negative power
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

      // Update score if enabled
      if (this.options.showScores) {
        const scoreType = this.options.mode === 'binary-to-decimal' ? 'binaryToDecimal' : 'decimalToBinary';
        document.getElementById(`${this.container.id}-correct`).textContent = this.scores[scoreType].correct;
        document.getElementById(`${this.container.id}-incorrect`).textContent = this.scores[scoreType].incorrect;
      }
    }

    // Handle input changes
    handleInputChange(event) {
      const value = event.target.value;

      if (this.options.mode === 'binary-to-decimal') {
        this.userAnswer = twosComplementUtils.validateDecimalInput(value);
      } else {
        this.userAnswer = twosComplementUtils.validateBinaryInput(value);
      }

      event.target.value = this.userAnswer;
    }

    // Check the user's answer
    checkAnswer() {
      if (this.showFeedback && this.isCorrect) return; // Don't process if already answered correctly
      
      const input = document.getElementById(`${this.container.id}-input`);
      this.userAnswer = input.value.trim();

      if (!this.userAnswer) return; // Don't proceed if input is empty

      let correct = false;
      const scoreType = this.options.mode === 'binary-to-decimal' ? 'binaryToDecimal' : 'decimalToBinary';

      if (this.options.mode === 'binary-to-decimal') {
        // Binary to decimal mode
        const expectedAnswer = this.currentDecimal.toString();
        correct = this.userAnswer === expectedAnswer;
      } else {
        // Decimal to binary mode
        // Normalize binary answer to ensure it's 8 bits
        let normalizedUserAnswer = this.userAnswer.padStart(8, '0');
        correct = normalizedUserAnswer === this.currentBinary;
      }

      // Update score if enabled and not already answered correctly
      if (this.options.showScores) {
        if (correct && !this.showFeedback) {
          this.scores[scoreType].correct++;
        } else if (!correct) {
          this.scores[scoreType].incorrect++;
        }
      }

      // Show feedback
      this.isCorrect = correct;
      this.showFeedback = true;

      // Update feedback area
      const feedback = document.getElementById(`${this.container.id}-feedback`);
      feedback.className = `tc-converter-feedback ${correct ? 'correct' : 'incorrect'}`;

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
  window.initTwosComplementConverter = function(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    return new TwosComplementConverter(container, options);
  };

  // Auto-initialize converters with data attributes
  function initializeAll() {
    const containers = document.querySelectorAll('[data-twos-complement-converter]');

    containers.forEach(container => {
      // Get configuration from data attributes
      const options = {
        mode: container.getAttribute('data-mode') || 'binary-to-decimal',
        primaryColor: container.getAttribute('data-primary-color') || '#3b82f6',
        showHeader: container.getAttribute('data-show-header') !== 'false',
        showScores: container.getAttribute('data-show-scores') !== 'false'
      };

      // Ensure container has ID
      if (!container.id) {
        container.id = 'twos-complement-converter-' + Math.random().toString(36).substring(2, 9);
      }

      // Initialize converter
      window.initTwosComplementConverter(container.id, options);
    });
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
  } else {
    initializeAll();
  }
})();