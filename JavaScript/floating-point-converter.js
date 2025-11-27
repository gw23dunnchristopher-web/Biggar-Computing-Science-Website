/**
 * Binary to Floating-Point Converter
 * Embeddable JavaScript Widget
 */

(function() {
  // Create the styles
  const styles = document.createElement('style');
  styles.textContent = `
    :root {
      --primary-color: #0d6efd;
      --secondary-color: #6c757d;
      --light-blue: #e9f0ff;
      --medium-blue: #cfe2ff;
      --white: #ffffff;
    }

    .fp-converter-container {
      background-color: var(--white);
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      padding: 25px;
      margin: 20px auto;
      max-width: 1000px;
      font-family: 'Roboto', sans-serif;
    }

    .fp-converter-container * {
      box-sizing: border-box;
    }

    .fp-converter-card {
      border: 1px solid var(--primary-color);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .fp-converter-card-header {
      background-color: var(--primary-color);
      color: var(--white);
      font-weight: bold;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .fp-converter-card-title {
      margin: 0;
      font-size: 1.25rem;
    }

    .fp-converter-card-body {
      padding: 15px;
    }

    .fp-converter-alert {
      padding: 12px 15px;
      border-radius: 5px;
      margin-bottom: 1rem;
    }

    .fp-converter-alert-info {
      background-color: var(--medium-blue);
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
    }

    .fp-converter-alert-success {
      background-color: #d1e7dd;
      border: 1px solid #badbcc;
      color: #0f5132;
    }

    .fp-converter-alert-danger {
      background-color: #f8d7da;
      border: 1px solid #f5c2c7;
      color: #842029;
    }

    .fp-converter-alert-warning {
      background-color: #fff3cd;
      border: 1px solid #ffecb5;
      color: #664d03;
    }

    .fp-converter-text-success {
      color: #28a745;
    }

    .fp-converter-text-danger {
      color: #dc3545;
    }

    .fp-converter-mb-2 {
      margin-bottom: 0.5rem;
    }

    .fp-converter-row {
      display: flex;
      flex-wrap: wrap;
      margin-right: -15px;
      margin-left: -15px;
    }

    .fp-converter-col {
      flex: 0 0 100%;
      padding-right: 15px;
      padding-left: 15px;
    }

    @media (min-width: 768px) {
      .fp-converter-col-md-2 {
        flex: 0 0 16.66667%;
        max-width: 16.66667%;
      }

      .fp-converter-col-md-4 {
        flex: 0 0 33.33333%;
        max-width: 33.33333%;
      }

      .fp-converter-col-md-5 {
        flex: 0 0 41.66667%;
        max-width: 41.66667%;
      }

      .fp-converter-col-md-6 {
        flex: 0 0 50%;
        max-width: 50%;
      }
    }

    .fp-converter-form-group {
      margin-bottom: 1rem;
    }

    .fp-converter-form-label {
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .fp-converter-form-control {
      display: block;
      width: 100%;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .fp-converter-form-control:focus {
      border-color: var(--primary-color);
      outline: 0;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }

    .fp-converter-form-select {
      display: block;
      width: 100%;
      padding: 0.375rem 2.25rem 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
      background-color: #fff;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 16px 12px;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
      appearance: none;
    }

    .fp-converter-form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .fp-converter-btn {
      display: inline-block;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      user-select: none;
      border: 1px solid transparent;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      border-radius: 0.25rem;
      transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      cursor: pointer;
    }

    .fp-converter-btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
      border-radius: 0.2rem;
    }

    .fp-converter-btn-primary {
      color: #fff;
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .fp-converter-btn-primary:hover {
      color: #fff;
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }

    .fp-converter-btn-outline-primary {
      color: var(--primary-color);
      border-color: var(--primary-color);
      background-color: transparent;
    }

    .fp-converter-btn-outline-primary:hover {
      color: #fff;
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .fp-converter-btn-light {
      color: var(--primary-color);
      background-color: #ffffff;
      border-color: #ffffff;
      font-weight: bold;
    }

    .fp-converter-btn-light:hover {
      background-color: #f8f9fa;
      border-color: #f8f9fa;
    }

    .fp-converter-btn-secondary {
      color: var(--primary-color);
      background-color: var(--medium-blue);
      border-color: var(--medium-blue);
    }

    .fp-converter-btn-secondary:hover {
      background-color: var(--light-blue);
      border-color: var(--light-blue);
    }

    .fp-converter-btn-outline-secondary {
      color: var(--secondary-color);
      border-color: var(--secondary-color);
      background-color: transparent;
    }

    .fp-converter-full-width {
      width: 100%;
    }

    .fp-converter-mb-1 {
      margin-bottom: 0.25rem;
    }

    .fp-converter-mb-2 {
      margin-bottom: 0.5rem;
    }

    .fp-converter-mb-3 {
      margin-bottom: 1rem;
    }

    .fp-converter-mb-4 {
      margin-bottom: 1.5rem;
    }

    .fp-converter-mt-2 {
      margin-top: 0.5rem;
    }

    .fp-converter-mt-3 {
      margin-top: 1rem;
    }

    .fp-converter-mt-4 {
      margin-top: 1.5rem;
    }

    .fp-converter-ms-2 {
      margin-left: 0.5rem;
    }

    .fp-converter-me-3 {
      margin-right: 1rem;
    }

    .fp-converter-score-container {
      font-size: 0.95rem;
      font-weight: 500;
      padding: 5px 10px;
      background-color: #ffffff;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .fp-converter-score-correct {
      color: #28a745;
      font-weight: bold;
    }

    .fp-converter-score-incorrect {
      color: #dc3545;
      font-weight: bold;
    }

    .fp-converter-score-divider {
      color: #6c757d;
      margin: 0 8px;
    }

    .fp-converter-font-monospace {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      letter-spacing: 0.1em;
    }

    .fp-converter-pre {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0.9rem;
      line-height: 1.5;
      max-height: 400px;
      overflow-y: auto;
      background-color: var(--medium-blue) !important;
      color: var(--primary-color) !important;
      border: 1px solid var(--primary-color);
      padding: 1rem;
      border-radius: 0.25rem;
    }

    .fp-converter-d-flex {
      display: flex;
    }

    .fp-converter-align-items-center {
      align-items: center;
    }

    .fp-converter-justify-content-between {
      justify-content: space-between;
    }

    .fp-converter-d-none {
      display: none;
    }

    .fp-converter-sign-bit {
      max-width: 60px;
    }
  `;
  document.head.appendChild(styles);

  // Add Font Awesome for icons if not already included
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }

  // Add Roboto font if not already included
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Roboto"]')) {
    const robotoFont = document.createElement('link');
    robotoFont.rel = 'stylesheet';
    robotoFont.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
    document.head.appendChild(robotoFont);
  }

  // Create the HTML structure
  function createConverterHTML() {
    return `
      <div class="fp-converter-container">
        <div class="fp-converter-card fp-converter-mb-4">
          <div class="fp-converter-card-header fp-converter-d-flex fp-converter-justify-content-between fp-converter-align-items-center">
            <h3 class="fp-converter-card-title" style="color:white; text-decoration:none;"">
              <i class="fas fa-calculator fp-converter-me-2"></i>
              Binary to Floating-Point Conversion
            </h3>
            <div class="fp-converter-d-flex fp-converter-align-items-center">
              <div class="fp-converter-score-container fp-converter-me-3">
                <span class="fp-converter-score-correct">Points: <span id="fp-correct-count">0</span></span>
                <span class="fp-converter-score-divider">|</span>
                <span class="fp-converter-score-incorrect">Missed: <span id="fp-incorrect-count">0</span></span>
              </div>
              <button id="fp-generate-btn" class="fp-converter-btn fp-converter-btn-light">
                <i class="fas fa-sync-alt"></i> New Question
              </button>
            </div>
          </div>
          <div class="fp-converter-card-body">


            <div id="fp-question-container">
              <div class="fp-converter-card fp-converter-mb-3">
                <div class="fp-converter-card-body">
                  <h5 class="fp-converter-card-title">Question:</h5>
                  <p>Convert the binary number below into floating-point representation.</p>

                  <div class="fp-converter-d-flex fp-converter-align-items-center fp-converter-mb-3">
                    <h3 id="fp-binary-number" class="fp-converter-font-monospace">Loading...</h3>
                    <button id="fp-copy-btn" class="fp-converter-btn fp-converter-btn-sm fp-converter-btn-outline-secondary fp-converter-ms-2" title="Copy to clipboard">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                  <p id="fp-question-details">
                    There are <span id="fp-mantissa-bits">16</span> bits for the mantissa (including the sign bit) and <span id="fp-exponent-bits">8</span> bits for the exponent.
                  </p>
                </div>
              </div>
            </div>

            <form id="fp-answer-form">
              <input type="hidden" id="fp-original-binary" name="original_binary">
              <input type="hidden" id="fp-mantissa-bits-input" name="mantissa_bits" value="16">
              <input type="hidden" id="fp-exponent-bits-input" name="exponent_bits" value="8">

              <div class="fp-converter-row fp-converter-mb-3">
                <div class="fp-converter-col fp-converter-col-md-2">
                  <div class="fp-converter-form-group">
                    <label for="fp-sign-bit" class="fp-converter-form-label">Sign Bit:</label>
                    <input type="text" class="fp-converter-form-control fp-converter-font-monospace fp-converter-sign-bit" id="fp-sign-bit" name="sign_bit" placeholder="0/1" required pattern="[01]" maxlength="1">
                  </div>
                </div>
                <div class="fp-converter-col fp-converter-col-md-5">
                  <div class="fp-converter-form-group">
                    <label for="fp-mantissa" class="fp-converter-form-label">Mantissa:</label>
                    <input type="text" class="fp-converter-form-control fp-converter-font-monospace" id="fp-mantissa" name="mantissa" placeholder="e.g., 0101000011110000" required pattern="[01]+" maxlength="64">
                  </div>
                </div>
                <div class="fp-converter-col fp-converter-col-md-5">
                  <div class="fp-converter-form-group">
                    <label for="fp-exponent" class="fp-converter-form-label">Exponent:</label>
                    <input type="text" class="fp-converter-form-control fp-converter-font-monospace" id="fp-exponent" name="exponent" placeholder="e.g., 10000011" required pattern="[01]+" maxlength="16">
                  </div>
                </div>
              </div>

              <button type="submit" class="fp-converter-btn fp-converter-btn-primary fp-converter-full-width">
                <i class="fas fa-check-circle"></i> Check Answer
              </button>
            </form>
          </div>
        </div>

        <!-- Result card, initially hidden -->
        <div id="fp-result-container" class="fp-converter-card fp-converter-mb-4 fp-converter-d-none">
          <div class="fp-converter-card-header">
            <h4 class="fp-converter-card-title">
              <i class="fas fa-lightbulb"></i>
              Result
            </h4>
          </div>
          <div class="fp-converter-card-body">
            <div id="fp-result-content"></div>
            <div id="fp-explanation-container" class="fp-converter-mt-4">
              <h5>Explanation:</h5>
              <pre id="fp-explanation" class="fp-converter-pre"></pre>
            </div>
          </div>
        </div>

        <!-- Configuration card -->
        <div class="fp-converter-card fp-converter-mb-4">
          <div class="fp-converter-card-header">
            <h4 class="fp-converter-card-title">
              <i class="fas fa-cog"></i>
              Configuration
            </h4>
          </div>
          <div class="fp-converter-card-body">
            <form id="fp-config-form">
              <div class="fp-converter-row">
                <div class="fp-converter-col fp-converter-col-md-6">
                  <div class="fp-converter-form-group">
                    <label for="fp-config-mantissa-bits" class="fp-converter-form-label">Mantissa Bits (including sign bit):</label>
                    <select class="fp-converter-form-select" id="fp-config-mantissa-bits">
                      <option value="8">8 bits</option>
                      <option value="16" selected>16 bits</option>
                      <option value="24">24 bits</option>
                      <option value="32">32 bits</option>
                    </select>
                  </div>
                </div>
                <div class="fp-converter-col fp-converter-col-md-6">
                  <div class="fp-converter-form-group">
                    <label for="fp-config-exponent-bits" class="fp-converter-form-label">Exponent Bits:</label>
                    <select class="fp-converter-form-select" id="fp-config-exponent-bits">
                      <option value="4">4 bits</option>
                      <option value="8" selected>8 bits</option>
                      <option value="11">11 bits</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" class="fp-converter-btn fp-converter-btn-secondary fp-converter-full-width fp-converter-mt-3">
                <i class="fas fa-save"></i> Apply Configuration
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Create and inject the HTML
  function initConverter(targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`Target element with ID '${targetElementId}' not found.`);
      return;
    }

    targetElement.innerHTML = createConverterHTML();

    // Get DOM elements
    const generateBtn = document.getElementById('fp-generate-btn');
    const answerForm = document.getElementById('fp-answer-form');
    const configForm = document.getElementById('fp-config-form');
    const binaryNumber = document.getElementById('fp-binary-number');
    const resultContainer = document.getElementById('fp-result-container');
    const resultContent = document.getElementById('fp-result-content');
    const explanationEl = document.getElementById('fp-explanation');
    const copyBtn = document.getElementById('fp-copy-btn');

    // Configuration elements
    const configMantissaBits = document.getElementById('fp-config-mantissa-bits');
    const configExponentBits = document.getElementById('fp-config-exponent-bits');
    const mantissaBitsInput = document.getElementById('fp-mantissa-bits-input');
    const exponentBitsInput = document.getElementById('fp-exponent-bits-input');
    const mantissaBitsDisplay = document.getElementById('fp-mantissa-bits');
    const exponentBitsDisplay = document.getElementById('fp-exponent-bits');

    // Form inputs
    const originalBinaryInput = document.getElementById('fp-original-binary');
    const signBitInput = document.getElementById('fp-sign-bit');
    const exponentInput = document.getElementById('fp-exponent');
    const mantissaInput = document.getElementById('fp-mantissa');

    // Score tracking variables
    let correctCount = 0;
    let incorrectCount = 0;

    // Current question points tracking
    let currentQuestionPoints = 0;

    // Score counter elements
    const correctCountEl = document.getElementById('fp-correct-count');
    const incorrectCountEl = document.getElementById('fp-incorrect-count');

    // Generate a question when initialized
    generateQuestion();

    // Event listeners
    generateBtn.addEventListener('click', generateQuestion);
    answerForm.addEventListener('submit', checkAnswer);
    configForm.addEventListener('submit', updateConfiguration);
    copyBtn.addEventListener('click', copyBinaryToClipboard);

    // Function to update the score display
    function updateScoreDisplay() {
      correctCountEl.textContent = correctCount;
      incorrectCountEl.textContent = incorrectCount;
    }

    /**
     * Generate a random binary number in the specified format
     */
    function generateBinaryNumber(mantissaBits, exponentBits) {
        // Decide if the number is positive or negative
        const sign = Math.random() > 0.5 ? '-' : '';

        // Generate a random number of binary digits between 5 and 16
        const digitCount = Math.floor(Math.random() * 12) + 5; // 5 to 16 digits

        // Make sure we have at least one '1' in the binary representation
        const binaryDigits = Array(digitCount).fill('0');
        const onesCount = Math.min(Math.floor(Math.random() * 8) + 1, digitCount);

        // Place 1's at random positions
        for (let i = 0; i < onesCount; i++) {
            const pos = Math.floor(Math.random() * digitCount);
            binaryDigits[pos] = '1';
        }

        // Decide where to place the decimal point to allow for positive exponents
        // This allows numbers greater than 1, like 1010.110
        let decimalPosition;

        if (Math.random() < 0.7) {
            // 70% chance of negative exponent (decimal before first digit or somewhere in the middle)
            decimalPosition = Math.floor(Math.random() * Math.min(3, digitCount));
        } else {
            // 30% chance of positive exponent (decimal point after some leading digits)
            decimalPosition = Math.floor(Math.random() * (digitCount - 1)) + 1;
        }

        // Create the binary number with the decimal point at the determined position
        let binaryWithDecimal = '';
        for (let i = 0; i < digitCount; i++) {
            if (i === decimalPosition) {
                binaryWithDecimal += '.';
            }
            binaryWithDecimal += binaryDigits[i];
        }

        // If the decimal point wasn't added (it would be at the end), add it now
        if (decimalPosition >= digitCount) {
            binaryWithDecimal += '.0';
        }

        // Format with spaces for readability (every 4 digits)
        let parts = binaryWithDecimal.split('.');
        let beforeDecimal = parts[0];
        let afterDecimal = parts[1];

        // Handle the part before the decimal point
        if (beforeDecimal === '') {
            // If there's nothing before the decimal point, add a 0
            beforeDecimal = '0';
        } else {
            // Remove leading zeros for numbers above 0, but keep at least one digit
            beforeDecimal = beforeDecimal.replace(/^0+/, '');
            if (beforeDecimal === '') {
                beforeDecimal = '0';
            }
        }

        // Format the part before decimal
        let formattedBeforeDecimal = '';
        for (let i = 0; i < beforeDecimal.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedBeforeDecimal += ' ';
            }
            formattedBeforeDecimal += beforeDecimal[i];
        }

        // Format the part after decimal
        let formattedAfterDecimal = '';
        for (let i = 0; i < afterDecimal.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedAfterDecimal += ' ';
            }
            formattedAfterDecimal += afterDecimal[i];
        }

        return `${sign}${formattedBeforeDecimal}.${formattedAfterDecimal}`;
    }

    /**
     * Parse a binary string with possible spaces and returns a clean version
     */
    function parseBinary(binaryString) {
        // Remove spaces and handle the sign
        const cleanBinary = binaryString.replace(/\s+/g, '');
        const sign = cleanBinary.startsWith('-') ? '-' : '';
        const binary = sign ? cleanBinary.substring(1) : cleanBinary;

        return { sign, binary };
    }

    /**
     * Extract the mantissa and calculate exponent
     * Returns the mantissa and the exponent
     */
    function processBinary(binaryString) {
        const { sign, binary } = parseBinary(binaryString);

        // Find the position of the decimal point
        let decimalIndex = binary.indexOf('.');
        if (decimalIndex === -1) {
            decimalIndex = binary.length;
        }

        // Create a clean version of the binary without the decimal point
        let cleanBinary = binary.replace('.', '');

        // Find the first '1' in the binary representation
        let firstOnePos = cleanBinary.indexOf('1');

        // If no '1' is found, return 0
        if (firstOnePos === -1) {
            return { sign, mantissa: '0', exponent: 0 };
        }

        // For IEEE format, the normalized scientific notation should have the form 1.xxxx
        // The exponent represents how many places to move the decimal point to get this form
        let exponent;

        // Calculate exponent: count how many places the decimal point moves 
        // to get it just to the left of the first 1
        if (firstOnePos < decimalIndex) {
            // Case: First 1 comes before the decimal point (e.g., 10.11, 100.01)
            // The decimal point moves left, so exponent is positive
            // Example: 10.011 -> move decimal 2 places left -> exponent = 2
            exponent = decimalIndex - firstOnePos;
        } else {
            // Case: First 1 comes after the decimal point (e.g., 0.01, 0.001) 
            // The decimal point moves right, so exponent is negative
            // Example: 0.0001 -> move decimal 3 places right -> exponent = -3
            exponent = -(firstOnePos - decimalIndex);
        }

        // Get the mantissa by starting from the first '1' and taking the next digits
        // Include the first 1 and all following digits
        let mantissa = cleanBinary.substring(firstOnePos);

        return { sign, mantissa, exponent };
    }

    /**
     * Convert a binary string to IEEE floating-point representation
     */
    function getIEEERepresentation(binaryString, mantissaBits, exponentBits) {
        const { sign, mantissa, exponent } = processBinary(binaryString);

        // The sign bit is 1 for negative, 0 for positive
        const signBit = sign === '-' ? '1' : '0';

        // Convert unbiased exponent to binary and ensure it has the correct number of bits
        let exponentBinary;

        // Special case: If decimal point is already right before the first 1 (e.g., 0.1xxx)
        if (exponent < 0) {
            // For negative exponents, we need to use two's complement
            const absoluteValue = Math.abs(exponent);
            const binaryAbsValue = absoluteValue.toString(2).padStart(exponentBits, '0');

            // Create two's complement
            let inverted = '';
            for (let i = 0; i < binaryAbsValue.length; i++) {
                inverted += binaryAbsValue[i] === '0' ? '1' : '0';
            }

            // Add 1 to the inverted bits
            let carry = 1;
            let result = '';
            for (let i = inverted.length - 1; i >= 0; i--) {
                const sum = (inverted[i] === '1' ? 1 : 0) + carry;
                result = (sum % 2) + result;
                carry = sum > 1 ? 1 : 0;
            }

            exponentBinary = result;
        } else {
            // For positive exponents, just convert to binary
            exponentBinary = exponent.toString(2).padStart(exponentBits, '0');
        }

        if (exponentBinary.length > exponentBits) {
            exponentBinary = exponentBinary.substring(exponentBinary.length - exponentBits); // Truncate if too long
        }

        // Ensure mantissa has the correct number of bits (mantissaBits - 1 for sign bit)
        // According to the rules: start from first 1 and take digits, padding with zeros if needed
        let mantissaValue = mantissa;
        const mantissaFieldBits = mantissaBits - 1; // Subtract 1 for the sign bit
        if (mantissaValue.length < mantissaFieldBits) {
            mantissaValue = mantissaValue.padEnd(mantissaFieldBits, '0');
        } else {
            mantissaValue = mantissaValue.substring(0, mantissaFieldBits); // Truncate if too long
        }

        return {
            sign_bit: signBit,
            exponent: exponentBinary,
            mantissa: mantissaValue,
            original_form: binaryString,
            exponent_value: exponent
        };
    }

    /**
     * Generate a question for floating-point conversion practice
     */
    function generateQuestion() {
        // Hide the result container
        resultContainer.classList.add('fp-converter-d-none');

        // Reset the form
        answerForm.reset();

        // Get the current configuration
        const mantissaBits = parseInt(mantissaBitsInput.value);
        const exponentBits = parseInt(exponentBitsInput.value);

        // Show loading state
        binaryNumber.textContent = 'Generating...';

        // Generate a binary number
        const binaryNumber_value = generateBinaryNumber(mantissaBits, exponentBits);

        // Update the question display
        binaryNumber.textContent = binaryNumber_value;
        originalBinaryInput.value = binaryNumber_value;

        // Focus on the first input field
        signBitInput.focus();
    }

    /**
     * Check the user's answer
     */
    function checkAnswer(e) {
        e.preventDefault();

        // Get user's answers
        const userAnswer = {
            sign_bit: signBitInput.value,
            exponent: exponentInput.value,
            mantissa: mantissaInput.value
        };

        // Get question details
        const originalBinary = originalBinaryInput.value;
        const mantissaBits = parseInt(mantissaBitsInput.value);
        const exponentBits = parseInt(exponentBitsInput.value);

        // Calculate the correct answer
        const correctAnswer = getIEEERepresentation(originalBinary, mantissaBits, exponentBits);

        // Check each part individually and award points
        const isSignBitCorrect = userAnswer.sign_bit === correctAnswer.sign_bit;
        const isExponentCorrect = userAnswer.exponent === correctAnswer.exponent;
        const isMantissaCorrect = userAnswer.mantissa === correctAnswer.mantissa;

        // Calculate points for this question (1 point for each correct part)
        let pointsEarned = 0;
        if (isSignBitCorrect) pointsEarned++;
        if (isExponentCorrect) pointsEarned++;
        if (isMantissaCorrect) pointsEarned++;

        // Update total points
        correctCount += pointsEarned;
        incorrectCount += (3 - pointsEarned); // missed points

        // Check if all parts are correct
        const isAllCorrect = isSignBitCorrect && isExponentCorrect && isMantissaCorrect;

        // Generate explanation
        const explanation = generateExplanation(originalBinary, mantissaBits, exponentBits);

        // Show the result container
        resultContainer.classList.remove('fp-converter-d-none');

        // Prepare feedback about which parts were correct
        let partialFeedback = '';
        if (pointsEarned > 0 && pointsEarned < 3) {
            partialFeedback = '<ul class="fp-converter-mb-2">';
            partialFeedback += isSignBitCorrect ? 
                '<li><span class="fp-converter-text-success"><i class="fas fa-check"></i> Sign bit is correct</span></li>' : 
                '<li><span class="fp-converter-text-danger"><i class="fas fa-times"></i> Sign bit is incorrect</span></li>';

            partialFeedback += isMantissaCorrect ? 
                '<li><span class="fp-converter-text-success"><i class="fas fa-check"></i> Mantissa is correct</span></li>' : 
                '<li><span class="fp-converter-text-danger"><i class="fas fa-times"></i> Mantissa is incorrect</span></li>';

            partialFeedback += isExponentCorrect ? 
                '<li><span class="fp-converter-text-success"><i class="fas fa-check"></i> Exponent is correct</span></li>' : 
                '<li><span class="fp-converter-text-danger"><i class="fas fa-times"></i> Exponent is incorrect</span></li>';

            partialFeedback += '</ul>';
        }

        // Display the result and update score
        if (isAllCorrect) {
            resultContent.innerHTML = `
                <div class="fp-converter-alert fp-converter-alert-success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Perfect!</strong> Your answer is 100% correct. +3 points!
                </div>
            `;
        } else if (pointsEarned > 0) {
            resultContent.innerHTML = `
                <div class="fp-converter-alert fp-converter-alert-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Partially correct.</strong> You earned ${pointsEarned} out of 3 points.
                    ${partialFeedback}
                </div>

                <div class="fp-converter-card">
                    <div class="fp-converter-card-header">
                        Correct Answer:
                    </div>
                    <div class="fp-converter-card-body">
                        <div class="fp-converter-row">
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Sign Bit:</strong> 
                                <span class="fp-converter-font-monospace">${correctAnswer.sign_bit}</span>
                            </div>
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Mantissa:</strong>
                                <span class="fp-converter-font-monospace">${correctAnswer.mantissa}</span>
                            </div>
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Exponent:</strong>
                                <span class="fp-converter-font-monospace">${correctAnswer.exponent}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultContent.innerHTML = `
                <div class="fp-converter-alert fp-converter-alert-danger">
                    <i class="fas fa-times-circle"></i>
                    <strong>Incorrect.</strong> You earned 0 out of 3 points.
                </div>

                <div class="fp-converter-card">
                    <div class="fp-converter-card-header">
                        Correct Answer:
                    </div>
                    <div class="fp-converter-card-body">
                        <div class="fp-converter-row">
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Sign Bit:</strong> 
                                <span class="fp-converter-font-monospace">${correctAnswer.sign_bit}</span>
                            </div>
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Mantissa:</strong>
                                <span class="fp-converter-font-monospace">${correctAnswer.mantissa}</span>
                            </div>
                            <div class="fp-converter-col fp-converter-col-md-4">
                                <strong>Exponent:</strong>
                                <span class="fp-converter-font-monospace">${correctAnswer.exponent}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update the score display
        updateScoreDisplay();

        // Display the explanation
        explanationEl.textContent = explanation;

        // Scroll to the result
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Generate a step-by-step explanation of the conversion process
     */
    function generateExplanation(binaryString, mantissaBits, exponentBits) {
        const { sign, mantissa, exponent } = processBinary(binaryString);
        const signText = sign === '-' ? 'negative' : 'positive';

        // Step 1: Identify the sign bit
        let step1 = `Step 1: Identify the sign bit\n`;
        step1 += `The number ${binaryString} is ${signText}, so the sign bit is ${sign === '-' ? '1' : '0'}.`;

        // Step 2: Extract the mantissa
        let step2 = `\n\nStep 2: Extract the mantissa\n`;
        step2 += `The mantissa is all the binary digits: ${mantissa}\n`;

        let formattedMantissa = mantissa;
        if (formattedMantissa.length < mantissaBits - 1) {
            formattedMantissa = formattedMantissa.padEnd(mantissaBits - 1, '0');
            step2 += `Padding with zeros to get ${mantissaBits-1} bits: ${formattedMantissa}`;
        } else if (formattedMantissa.length > mantissaBits - 1) {
            formattedMantissa = formattedMantissa.substring(0, mantissaBits - 1);
            step2 += `Truncating to get ${mantissaBits-1} bits: ${formattedMantissa}`;
        }

        // Step 3: Calculate the exponent
        let step3 = `\n\nStep 3: Calculate the exponent\n`;

        // Parse the binary again to get the first '1' position for the explanation
        const { binary: binForExplain } = parseBinary(binaryString);
        const decimalPos = binForExplain.indexOf('.');
        const cleanBinForExplain = binForExplain.replace('.', '');
        const firstOneForExplain = cleanBinForExplain.indexOf('1');

        // Describe the normalization process
        step3 += `For IEEE representation, we need to normalize to the form 1.xxxx × 2^e\n`;

        // Add visual explanation based on the input
        if (decimalPos === -1 || firstOneForExplain < decimalPos) {
            // Case: Binary has no decimal point or first 1 is before decimal (e.g., 10.11, 101)
            const originalForm = binForExplain.includes('.') ? binForExplain : binForExplain + '.0';
            const normalizedForm = `1.${cleanBinForExplain.substring(firstOneForExplain + 1)}`;

            if (exponent > 0) {
                step3 += `Original: ${originalForm}\n`;
                step3 += `Normalized: ${normalizedForm} × 2^${exponent}\n`;
                step3 += `The decimal point moves ${exponent} place(s) to the left to get the normalized form.\n`;
            } else {
                step3 += `Original: ${originalForm}\n`;
                step3 += `Normalized: ${normalizedForm} × 2^${exponent}\n`;
                step3 += `The decimal point doesn't need to move for normalization.\n`;
            }
        } else {
            // Case: First 1 is after decimal point (e.g., 0.01, 0.001)
            const normalizedForm = `1.${cleanBinForExplain.substring(firstOneForExplain + 1)}`;

            step3 += `Original: ${binForExplain}\n`;
            step3 += `Normalized: ${normalizedForm} × 2^${exponent}\n`;
            step3 += `The decimal point moves ${Math.abs(exponent)} place(s) to the right to get the normalized form.\n`;
        }

        // Convert to binary (using two's complement for negative numbers)
        let exponentBinary;
        if (exponent < 0) {
            // For negative exponents, we need to use two's complement
            const absoluteValue = Math.abs(exponent);
            const binaryAbsValue = absoluteValue.toString(2).padStart(exponentBits, '0');

            step3 += `For negative exponent ${exponent}, use two's complement representation:\n`;
            step3 += `1. Convert absolute value ${absoluteValue} to binary: ${binaryAbsValue}\n`;

            // Create two's complement
            let inverted = '';
            for (let i = 0; i < binaryAbsValue.length; i++) {
                inverted += binaryAbsValue[i] === '0' ? '1' : '0';
            }
            step3 += `2. Invert all bits: ${inverted}\n`;

            // Add 1 to the inverted bits
            let carry = 1;
            let result = '';
            for (let i = inverted.length - 1; i >= 0; i--) {
                const sum = (inverted[i] === '1' ? 1 : 0) + carry;
                result = (sum % 2) + result;
                carry = sum > 1 ? 1 : 0;
            }

            exponentBinary = result;
            step3 += `3. Add 1 to get final two's complement: ${exponentBinary}`;
        } else {
            // For positive exponents, just convert to binary
            exponentBinary = exponent.toString(2).padStart(exponentBits, '0');
            step3 += `In binary with ${exponentBits} bits: ${exponentBinary}`;
        }

        // Step 4: Final representation
        const ieeeRep = getIEEERepresentation(binaryString, mantissaBits, exponentBits);
        let step4 = `\n\nStep 4: Combine the parts\n`;
        step4 += `Sign bit: ${ieeeRep.sign_bit}\n`;
        step4 += `Exponent bits: ${ieeeRep.exponent}\n`;
        step4 += `Mantissa bits: ${ieeeRep.mantissa}\n`;

        return step1 + step2 + step3 + step4;
    }

    /**
     * Update the configuration settings
     */
    function updateConfiguration(e) {
        e.preventDefault();

        // Update the hidden inputs with the new values
        const newMantissaBits = configMantissaBits.value;
        const newExponentBits = configExponentBits.value;

        mantissaBitsInput.value = newMantissaBits;
        exponentBitsInput.value = newExponentBits;

        // Update the display values
        mantissaBitsDisplay.textContent = newMantissaBits;
        exponentBitsDisplay.textContent = newExponentBits;

        // Generate a new question with the updated settings
        generateQuestion();
    }

    /**
     * Copy the binary number to clipboard
     */
    function copyBinaryToClipboard() {
        const textToCopy = binaryNumber.textContent;
        navigator.clipboard.writeText(textToCopy).then(
            function() {
                // Show a temporary success message
                const originalTitle = copyBtn.getAttribute('title');
                copyBtn.setAttribute('title', 'Copied!');
                setTimeout(function() {
                    copyBtn.setAttribute('title', originalTitle);
                }, 2000);
            }
        );
    }
  }

  // Expose the init function to the global scope
  window.initFloatingPointConverter = function(targetElementId) {
    initConverter(targetElementId);
  };
})();