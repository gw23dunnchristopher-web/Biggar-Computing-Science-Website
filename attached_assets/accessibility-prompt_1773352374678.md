# Accessibility / Display Settings System - Implementation Prompt

Add a comprehensive accessibility and display settings system to this app. The system should be a floating panel accessible from any page, with all settings persisted to localStorage. Here is exactly what to build:

---

## Architecture Overview

Create these components (React + TypeScript + Tailwind CSS):

1. **AccessibilityContext** - React Context provider that manages all settings state, applies CSS changes to the document, and persists to localStorage
2. **AccessibilityPanel** - Slide-out settings panel UI triggered by a floating button
3. **ReadingGuide** - Yellow highlight bar that follows the mouse cursor
4. **TTSHandler** - Click-to-speak handler that sends text to a server-side TTS endpoint

Wrap the entire app in `<AccessibilityProvider>`. Render `<AccessibilityPanel />`, `<ReadingGuide />`, and `<TTSHandler />` at the top level inside the provider.

---

## Settings Model

```typescript
interface AccessibilitySettings {
  highContrast: boolean;       // Toggle high-contrast colour scheme
  fontSize: number;            // Body font scale percentage (75-200, step 25)
  lineSpacing: number;         // Line height scale percentage (100-200, step 25)
  dyslexiaFont: boolean;       // Toggle OpenDyslexic font
  reducedMotion: boolean;      // Disable all animations/transitions
  colourOverlay: string;       // "none" | "cream" | "blue" | "pink" | "green" | "yellow"
  readingGuide: boolean;       // Yellow highlight bar follows cursor
  ttsEnabled: boolean;         // Click any text to hear it read aloud
  customTextColour: string;    // Hex colour string or "" for default
  customBgColour: string;      // Hex colour string or "" for default
}
```

Default values: all booleans false, fontSize 100, lineSpacing 100, colourOverlay "none", customTextColour "", customBgColour "".

Persist to localStorage under key `a11y-settings`. Load on mount, save on every change.

---

## Feature Details

### 1. High Contrast Mode

Add/remove class `high-contrast` on `<html>`. Define CSS variable overrides:

**Light mode** (`.high-contrast`):
- Background pure white, foreground pure black
- Primary colour: deep blue (hsl 240 100% 35%)
- All borders solid black
- Muted text forced to near-black (opacity 0.9)

**Dark mode** (`.high-contrast.dark`):
- Background pure black, foreground pure white
- Primary colour: yellow (hsl 54 100% 50%)
- All borders solid white

Force muted/grey text classes to use full foreground colour with `!important`.

### 2. Custom Text Colour

Provide preset colour swatches (no free colour picker): Default, Black, White, Dark Navy (#1a1a2e), Yellow (#FFD700), Green (#00FF00), Sky Blue (#00BFFF).

When a colour is selected, convert hex to HSL and set CSS custom properties: `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground`. Also compute a muted variant for `--muted-foreground`.

Set `data-custom-text` attribute on `<html>` and add CSS rules that force text elements (p, h1-h6, span, label, li, and utility text classes) to use `hsl(var(--foreground)) !important`.

### 3. Custom Background Colour

Preset swatches: Default, White, Black, Dark Navy (#1a1a2e), Cream (#FFFDD0), Alice Blue (#F0F8FF), Dark Grey (#2d2d2d).

Set CSS custom properties: `--background`, `--card`, `--popover`. Set `data-custom-bg` attribute on `<html>` with CSS rules forcing background utility classes to use `hsl(var(--background)) !important`.

### 4. Text Size

Range slider from 75% to 200% (step 25). Set CSS custom property `--a11y-font-scale` on `<html>`. In the body CSS rule:
```css
font-size: calc(1rem * var(--a11y-font-scale, 1));
```

### 5. Line Spacing

Range slider from 100% to 200% (step 25). Set CSS custom property `--a11y-line-scale` on `<html>`. In the body CSS rule:
```css
line-height: calc(1.5 * var(--a11y-line-scale, 1));
```

### 6. Dyslexia-Friendly Font

Download OpenDyslexic font files (Regular and Bold .woff2) and place in the public fonts directory. Define @font-face rules in CSS.

When enabled, add class `dyslexia-font` on `<html>` and inject a `<style>` element that forces all elements to use OpenDyslexic with `!important`:
```css
*, *::before, *::after { font-family: 'OpenDyslexic', sans-serif !important; }
code, pre, .font-mono { font-family: 'OpenDyslexic', monospace !important; }
```

When disabled, remove the class and the injected style element.

### 7. Text-to-Speech (Click to Speak)

When enabled, clicking any text element reads it aloud. Architecture:

**Server endpoint** (`POST /api/tts`):
- Accepts `{ text: string }` (max 2000 characters)
- Calls Google Cloud Text-to-Speech API: `https://texttospeech.googleapis.com/v1/text:synthesize?key=YOUR_API_KEY`
- Voice: `en-GB-Neural2-A` (British English, female, neural)
- Audio encoding: MP3, speaking rate: 0.95
- Include retry logic (3 attempts with 200ms delay) to handle intermittent API failures
- Returns the MP3 audio as a binary response with `Content-Type: audio/mpeg`

**Prerequisites**: Enable the "Cloud Text-to-Speech API" in Google Cloud Console for the project associated with your API key. Also ensure the API key is not restricted to block the TTS API.

**Client TTSHandler component**:
- Listens for click events on the document when TTS is enabled
- Ignores clicks on interactive elements (inputs, textareas, buttons, the settings panel itself)
- If already speaking, clicking stops playback
- Extracts readable text from the clicked element (walks up to the nearest block-level parent like p, h1-h6, li, td, th, label)
- Also reads selected text if the user has highlighted something
- Sends text to `/api/tts`, plays the returned MP3 audio via `new Audio()`
- Falls back to browser's built-in `speechSynthesis` (Web Speech API) if the server request fails - use local voices only (`voice.localService === true`), prefer en-GB voices
- Important: Do NOT call `speechSynthesis.cancel()` before `speechSynthesis.speak()` - Chrome silently drops the utterance if you do
- Shows a dark status banner fixed at the top of the screen while speaking: "Speaking: [first 80 chars of text]..."
- Banner dismisses when audio finishes or on error

### 8. Reduced Motion

Add/remove class `reduced-motion` on `<html>`. CSS:
```css
.reduced-motion,
.reduced-motion * {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}
```

Also suppress any confetti or celebration animations when this is active.

### 9. Reading Guide

A React component that renders a fixed-position, full-width yellow highlight bar that follows the mouse cursor vertically.

- 40px tall with a soft yellow gradient background: `rgba(255, 220, 50, 0.15)` to `rgba(255, 220, 50, 0.2)`
- Subtle yellow borders top and bottom
- `pointer-events: none` so it doesn't interfere with clicks
- High z-index (9990)
- Smooth tracking with `transition: top 0.05s linear`
- Hides when mouse leaves the window
- Set cursor to crosshair when active via `.reading-guide-active` class on `<html>`

### 10. Colour Overlay

Semi-transparent colour tint applied over the entire page using `<html>::after` pseudo-element. Options: None, Cream, Blue, Pink, Green, Yellow.

Set `data-colour-overlay` attribute on `<html>`. CSS for each overlay:
```css
[data-colour-overlay="cream"]::after,
[data-colour-overlay="blue"]::after,
/* etc. */ {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9989;
  mix-blend-mode: multiply;
}

[data-colour-overlay="cream"]::after { background-color: rgba(255, 243, 220, 0.3); }
[data-colour-overlay="blue"]::after { background-color: rgba(200, 220, 255, 0.25); }
[data-colour-overlay="pink"]::after { background-color: rgba(255, 210, 220, 0.25); }
[data-colour-overlay="green"]::after { background-color: rgba(210, 255, 220, 0.25); }
[data-colour-overlay="yellow"]::after { background-color: rgba(255, 255, 200, 0.25); }

html[data-colour-overlay="none"]::after { display: none; }
```

UI: Row of small coloured circular buttons. Active selection shown with a ring highlight.

---

## Panel UI Design

- **Floating trigger button**: Fixed bottom-right corner, circular, 48x48px, with a sliders icon. Shows a small green dot indicator when any settings are changed from defaults.
- **Panel**: Slides in from the right edge, 320px wide, full height, with backdrop overlay. Contains:
  - Header with title "Display Settings" and close button
  - Scrollable content area with each setting as a row
  - Toggle rows: icon + label + description + toggle switch
  - Slider rows: icon + label + current value + range input
  - Colour rows: icon + label + description + row of circular swatch buttons
  - Overlay row: row of coloured circle buttons
  - "Reset All Settings" button (only visible when settings have been changed)
  - Footer note: "Settings are saved automatically and will persist between visits."

Use lucide-react icons: SlidersHorizontal, Eye, Type, Volume2, Space, Palette, MousePointer, Sparkles, Paintbrush, RotateCcw, X.

---

## CSP Notes

If your server uses Content Security Policy headers, ensure:
- `mediaSrc` includes `'self'`, `blob:` (for TTS audio playback)
- `connectSrc` includes your TTS API domain

---

## Summary of Files to Create/Modify

1. `AccessibilityContext.tsx` - Context provider with settings state, CSS application logic, localStorage persistence
2. `AccessibilityPanel.tsx` - Settings panel UI component
3. `ReadingGuide.tsx` - Mouse-following highlight bar
4. `TTSHandler.tsx` - Click-to-speak with server TTS + local fallback
5. CSS file - Add @font-face for OpenDyslexic, high-contrast overrides, custom colour overrides, reduced-motion rules, colour overlay pseudo-elements, reading guide cursor, font-scale and line-scale variables
6. Server route - `POST /api/tts` endpoint calling Google Cloud TTS with retry logic
7. Font files - OpenDyslexic Regular and Bold .woff2 in the public fonts directory
8. App root - Wrap in `<AccessibilityProvider>`, render `<AccessibilityPanel />`, `<ReadingGuide />`, `<TTSHandler />`

