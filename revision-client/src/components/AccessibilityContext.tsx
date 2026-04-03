import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

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

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 100,
  lineSpacing: 100,
  dyslexiaFont: false,
  reducedMotion: false,
  colourOverlay: "none",
  readingGuide: false,
  ttsEnabled: false,
  customTextColour: "",
  customBgColour: "",
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetAll: () => void;
  hasChanges: boolean;
}

const AccessibilityCtx = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEY = "a11y-settings";

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch {}
  return { ...defaultSettings };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
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
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applySettings(settings: AccessibilitySettings) {
  const html = document.documentElement;

  if (settings.highContrast) {
    html.classList.add("high-contrast");
  } else {
    html.classList.remove("high-contrast");
  }

  html.style.setProperty("--a11y-font-scale", String(settings.fontSize / 100));
  html.style.setProperty("--a11y-line-scale", String(settings.lineSpacing / 100));

  if (settings.dyslexiaFont) {
    html.classList.add("dyslexia-font");
    let el = document.getElementById("dyslexia-font-style");
    if (!el) {
      el = document.createElement("style");
      el.id = "dyslexia-font-style";
      el.textContent = `
        .dyslexia-font *, .dyslexia-font *::before, .dyslexia-font *::after { font-family: 'OpenDyslexic', sans-serif !important; }
        .dyslexia-font code, .dyslexia-font pre, .dyslexia-font .font-mono { font-family: 'OpenDyslexic', monospace !important; }
      `;
      document.head.appendChild(el);
    }
  } else {
    html.classList.remove("dyslexia-font");
    const el = document.getElementById("dyslexia-font-style");
    if (el) el.remove();
  }

  if (settings.reducedMotion) {
    html.classList.add("reduced-motion");
  } else {
    html.classList.remove("reduced-motion");
  }

  if (settings.readingGuide) {
    html.classList.add("reading-guide-active");
  } else {
    html.classList.remove("reading-guide-active");
  }

  html.setAttribute("data-colour-overlay", settings.colourOverlay);

  if (settings.customTextColour) {
    const hsl = hexToHsl(settings.customTextColour);
    if (hsl) {
      const val = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      html.style.setProperty("--foreground", val);
      html.style.setProperty("--card-foreground", val);
      html.style.setProperty("--popover-foreground", val);
      html.style.setProperty("--secondary-foreground", val);
      html.style.setProperty("--accent-foreground", val);
      const mutedL = Math.min(100, hsl.l + (hsl.l > 50 ? -25 : 25));
      html.style.setProperty("--muted-foreground", `${hsl.h} ${Math.max(0, hsl.s - 10)}% ${mutedL}%`);
    }
    html.setAttribute("data-custom-text", "true");
  } else {
    html.style.removeProperty("--foreground");
    html.style.removeProperty("--card-foreground");
    html.style.removeProperty("--popover-foreground");
    html.style.removeProperty("--secondary-foreground");
    html.style.removeProperty("--accent-foreground");
    html.style.removeProperty("--muted-foreground");
    html.removeAttribute("data-custom-text");
  }

  if (settings.customBgColour) {
    const hsl = hexToHsl(settings.customBgColour);
    if (hsl) {
      const val = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      html.style.setProperty("--background", val);
      html.style.setProperty("--card", val);
      html.style.setProperty("--popover", val);
    }
    html.setAttribute("data-custom-bg", "true");
    document.body.style.backgroundColor = settings.customBgColour;
  } else {
    html.style.removeProperty("--background");
    html.style.removeProperty("--card");
    html.style.removeProperty("--popover");
    html.removeAttribute("data-custom-bg");
    document.body.style.removeProperty("background-color");
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Keep in sync when settings are changed in another tab or the main website
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setSettings({ ...defaultSettings });
  }, []);

  return (
    <AccessibilityCtx.Provider value={{ settings, updateSetting, resetAll, hasChanges }}>
      {children}
    </AccessibilityCtx.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityCtx);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
