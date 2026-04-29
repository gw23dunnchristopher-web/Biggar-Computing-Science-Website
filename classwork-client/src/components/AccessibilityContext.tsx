import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

function hexToHsl(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToMutedHsl(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const mutedL = l > 0.5 ? l * 0.65 : l + (1 - l) * 0.35;
  return `${Math.round(h * 360)} ${Math.round(s * 50)}% ${Math.round(mutedL * 100)}%`;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: number;
  lineSpacing: number;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  colourOverlay: string;
  readingGuide: boolean;
  ttsEnabled: boolean;
  customTextColour: string;
  customBgColour: string;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  fontSize: 100,
  lineSpacing: 100,
  dyslexiaFont: false,
  reducedMotion: false,
  colourOverlay: "none",
  ttsEnabled: false,
  readingGuide: false,
  customTextColour: "",
  customBgColour: "",
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetAll: () => void;
  speak: (text: string, onDone?: () => void) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = "a11y-settings";
const THEME_KEY = "vite-ui-theme";

function loadDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    if (stored === "system") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
  } catch {}
  return false;
}

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  const [darkMode, setDarkModeState] = useState<boolean>(loadDarkMode);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Apply / remove the `dark` class on <html> whenever darkMode changes.
  // The same class is toggled by the static site, n5, revision and
  // data-sculptor SPAs so all CSS rules keyed off `html.dark` stay consistent.
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  // Keep in sync when settings are changed in another tab or the main website
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      } else if (e.key === THEME_KEY) {
        // Cross-tab / cross-app dark-mode sync via the shared vite-ui-theme key
        if (e.newValue === "dark") setDarkModeState(true);
        else if (e.newValue === "light") setDarkModeState(false);
        else if (e.newValue === "system") {
          setDarkModeState(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    try {
      localStorage.setItem(THEME_KEY, value ? "dark" : "light");
    } catch {}
    setDarkModeState(value);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (settings.dyslexiaFont) {
      root.classList.add("dyslexia-font");
      root.style.setProperty("--font-sans", "'OpenDyslexic', sans-serif");
      root.style.setProperty("--font-mono", "'OpenDyslexic', monospace");
      root.style.setProperty("font-family", "'OpenDyslexic', sans-serif", "important");
      let dyslexiaStyle = document.getElementById("dyslexia-font-override");
      if (!dyslexiaStyle) {
        dyslexiaStyle = document.createElement("style");
        dyslexiaStyle.id = "dyslexia-font-override";
        document.head.appendChild(dyslexiaStyle);
      }
      dyslexiaStyle.textContent = `
        *, *::before, *::after { font-family: 'OpenDyslexic', sans-serif !important; }
        code, pre, .font-mono, [class*="mono"] { font-family: 'OpenDyslexic', monospace !important; }
      `;
    } else {
      root.classList.remove("dyslexia-font");
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-mono");
      root.style.removeProperty("font-family");
      const dyslexiaStyle = document.getElementById("dyslexia-font-override");
      if (dyslexiaStyle) dyslexiaStyle.remove();
    }

    if (settings.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    root.style.setProperty("--a11y-font-scale", `${settings.fontSize / 100}`);
    root.style.setProperty("--a11y-line-scale", `${settings.lineSpacing / 100}`);

    root.setAttribute("data-colour-overlay", settings.colourOverlay);

    if (settings.readingGuide) {
      root.classList.add("reading-guide-active");
    } else {
      root.classList.remove("reading-guide-active");
    }

    if (settings.customTextColour && /^#[0-9a-fA-F]{6}$/.test(settings.customTextColour)) {
      const hsl = hexToHsl(settings.customTextColour);
      root.style.setProperty("--foreground", hsl);
      root.style.setProperty("--card-foreground", hsl);
      root.style.setProperty("--popover-foreground", hsl);
      root.style.setProperty("--secondary-foreground", hsl);
      root.style.setProperty("--accent-foreground", hsl);
      root.style.setProperty("--muted-foreground", hexToMutedHsl(settings.customTextColour));
      root.setAttribute("data-custom-text", settings.customTextColour);
    } else {
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card-foreground");
      root.style.removeProperty("--popover-foreground");
      root.style.removeProperty("--secondary-foreground");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--muted-foreground");
      root.removeAttribute("data-custom-text");
    }

    if (settings.customBgColour && /^#[0-9a-fA-F]{6}$/.test(settings.customBgColour)) {
      const hsl = hexToHsl(settings.customBgColour);
      root.style.setProperty("--background", hsl);
      root.style.setProperty("--card", hsl);
      root.style.setProperty("--popover", hsl);
      root.setAttribute("data-custom-bg", settings.customBgColour);
    } else {
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--popover");
      root.removeAttribute("data-custom-bg");
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      cachedVoiceRef.current =
        voices.find(v => v.lang === "en-GB" && /natural|neural|premium|enhanced/i.test(v.name))
        || voices.find(v => v.lang === "en-GB")
        || voices.find(v => v.lang.startsWith("en") && /natural|neural|premium|enhanced/i.test(v.name))
        || voices.find(v => v.lang.startsWith("en"))
        || null;
    }
    pickVoice();
    speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => { speechSynthesis.removeEventListener("voiceschanged", pickVoice); };
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    const voices = synth.getVoices();
    const voice = cachedVoiceRef.current
      || voices.find(v => v.lang === "en-GB")
      || voices.find(v => v.lang.startsWith("en"))
      || null;
    if (voice) {
      utterance.voice = voice;
      cachedVoiceRef.current = voice;
    }
    utterance.onstart = () => {
      console.log("[TTS] speech started");
    };
    utterance.onend = () => {
      console.log("[TTS] speech ended");
      setIsSpeaking(false);
      if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
      onDone?.();
    };
    utterance.onerror = (ev) => {
      console.log("[TTS] speech error:", (ev as any).error);
      setIsSpeaking(false);
      if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
      onDone?.();
    };
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    synth.speak(utterance);
    console.log("[TTS] synth.speak() called, pending:", synth.pending, "speaking:", synth.speaking);
    resumeTimerRef.current = window.setInterval(() => {
      if (!synth.speaking && !synth.pending) {
        setIsSpeaking(false);
        if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
        onDone?.();
      } else if (synth.paused) {
        synth.resume();
      }
    }, 5000);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetAll, speak, stopSpeaking, isSpeaking, darkMode, setDarkMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
