import { useState } from "react";
import { useAccessibility } from "./AccessibilityContext";
import {
  X,
  RotateCcw,
  Eye,
  Type,
  Volume2,
  Space,
  Palette,
  MousePointer,
  Sparkles,
  SlidersHorizontal,
  Paintbrush,
} from "lucide-react";

const OVERLAY_OPTIONS = [
  { value: "none", label: "None", color: "" },
  { value: "cream", label: "Cream", color: "bg-amber-100" },
  { value: "blue", label: "Blue", color: "bg-blue-100" },
  { value: "pink", label: "Pink", color: "bg-pink-100" },
  { value: "green", label: "Green", color: "bg-green-100" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-100" },
];

const TEXT_COLOUR_PRESETS = [
  { value: "", label: "Default", swatch: "" },
  { value: "#000000", label: "Black", swatch: "#000000" },
  { value: "#FFFFFF", label: "White", swatch: "#FFFFFF" },
  { value: "#1a1a2e", label: "Dark Navy", swatch: "#1a1a2e" },
  { value: "#FFD700", label: "Yellow", swatch: "#FFD700" },
  { value: "#00FF00", label: "Green", swatch: "#00FF00" },
  { value: "#00BFFF", label: "Sky Blue", swatch: "#00BFFF" },
];

const BG_COLOUR_PRESETS = [
  { value: "", label: "Default", swatch: "" },
  { value: "#FFFFFF", label: "White", swatch: "#FFFFFF" },
  { value: "#000000", label: "Black", swatch: "#000000" },
  { value: "#1a1a2e", label: "Dark Navy", swatch: "#1a1a2e" },
  { value: "#FFFDD0", label: "Cream", swatch: "#FFFDD0" },
  { value: "#F0F8FF", label: "Alice Blue", swatch: "#F0F8FF" },
  { value: "#2d2d2d", label: "Dark Grey", swatch: "#2d2d2d" },
];

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting, resetAll } = useAccessibility();

  const hasChanges = settings.highContrast || settings.fontSize !== 100 || settings.lineSpacing !== 100 ||
    settings.dyslexiaFont || settings.reducedMotion || settings.colourOverlay !== "none" ||
    settings.ttsEnabled || settings.readingGuide || settings.customTextColour !== "" || settings.customBgColour !== "";

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9998] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Display settings"
        data-testid="button-accessibility-toggle"
      >
        <SlidersHorizontal className="w-6 h-6" />
        {hasChanges && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-80 bg-background border-l border-border shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Display settings panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Display Settings</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Close display settings panel"
            data-testid="button-accessibility-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-5">
          <ToggleRow
            icon={<Eye className="w-4 h-4" />}
            label="High Contrast"
            description="Increase colour contrast for better readability"
            checked={settings.highContrast}
            onChange={(v) => updateSetting("highContrast", v)}
            testId="toggle-high-contrast"
          />

          <ColourPresetRow
            icon={<Paintbrush className="w-4 h-4" />}
            label="Text Colour"
            description="Choose your preferred text colour"
            value={settings.customTextColour}
            onChange={(v) => updateSetting("customTextColour", v)}
            presets={TEXT_COLOUR_PRESETS}
            testId="picker-text-colour"
          />

          <ColourPresetRow
            icon={<Palette className="w-4 h-4" />}
            label="Background Colour"
            description="Choose your preferred background colour"
            value={settings.customBgColour}
            onChange={(v) => updateSetting("customBgColour", v)}
            presets={BG_COLOUR_PRESETS}
            testId="picker-bg-colour"
          />

          <SliderRow
            icon={<Type className="w-4 h-4" />}
            label="Text Size"
            description={`${settings.fontSize}%`}
            min={75}
            max={200}
            step={25}
            value={settings.fontSize}
            onChange={(v) => updateSetting("fontSize", v)}
            testId="slider-font-size"
          />

          <SliderRow
            icon={<Space className="w-4 h-4" />}
            label="Line Spacing"
            description={`${settings.lineSpacing}%`}
            min={100}
            max={200}
            step={25}
            value={settings.lineSpacing}
            onChange={(v) => updateSetting("lineSpacing", v)}
            testId="slider-line-spacing"
          />

          <ToggleRow
            icon={<Type className="w-4 h-4 font-bold" />}
            label="Dyslexia-Friendly Font"
            description="Use OpenDyslexic font for easier reading"
            checked={settings.dyslexiaFont}
            onChange={(v) => updateSetting("dyslexiaFont", v)}
            testId="toggle-dyslexia-font"
          />

          <ToggleRow
            icon={<Volume2 className="w-4 h-4" />}
            label="Text-to-Speech"
            description="Click any text to hear it read aloud"
            checked={settings.ttsEnabled}
            onChange={(v) => updateSetting("ttsEnabled", v)}
            testId="toggle-tts"
          />

          <ToggleRow
            icon={<Sparkles className="w-4 h-4" />}
            label="Reduced Motion"
            description="Disable animations and transitions"
            checked={settings.reducedMotion}
            onChange={(v) => updateSetting("reducedMotion", v)}
            testId="toggle-reduced-motion"
          />

          <ToggleRow
            icon={<MousePointer className="w-4 h-4" />}
            label="Reading Guide"
            description="Highlight bar follows your cursor to track lines"
            checked={settings.readingGuide}
            onChange={(v) => updateSetting("readingGuide", v)}
            testId="toggle-reading-guide"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Colour Overlay</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Apply a colour tint to reduce eye strain
            </p>
            <div className="flex gap-2 ml-6 flex-wrap" data-testid="colour-overlay-options">
              {OVERLAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting("colourOverlay", opt.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-medium ${
                    opt.value === "none"
                      ? "bg-background border-border"
                      : opt.color + " border-transparent"
                  } ${
                    settings.colourOverlay === opt.value
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  }`}
                  aria-label={`${opt.label} overlay`}
                  data-testid={`button-overlay-${opt.value}`}
                  title={opt.label}
                >
                  {opt.value === "none" ? <X className="w-3 h-3" /> : null}
                </button>
              ))}
            </div>
          </div>

          {hasChanges && (
            <button
              onClick={resetAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              data-testid="button-reset-accessibility"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Settings
            </button>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Settings are saved automatically and will persist between visits.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <span className="text-sm font-medium block">{label}</span>
          <span className="text-xs text-muted-foreground block">{description}</span>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        data-testid={testId}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SliderRow({
  icon,
  label,
  description,
  min,
  max,
  step,
  value,
  onChange,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  testId: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{description}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        data-testid={testId}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

function ColourPresetRow({
  icon,
  label,
  description,
  value,
  onChange,
  presets,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  presets: Array<{ value: string; label: string; swatch: string }>;
  testId: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground ml-6">{description}</p>
      <div className="flex gap-2 ml-6 flex-wrap items-center">
        {presets.map((preset) => (
          <button
            key={preset.value || "default"}
            onClick={() => onChange(preset.value)}
            className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
              value === preset.value
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                : "hover:scale-105"
            } ${!preset.swatch ? "border-border" : "border-transparent"}`}
            style={preset.swatch ? { backgroundColor: preset.swatch } : undefined}
            aria-label={preset.label}
            data-testid={`${testId}-${preset.label.toLowerCase().replace(/\s/g, "-")}`}
            title={preset.label}
          >
            {!preset.swatch && <X className="w-3 h-3 text-muted-foreground" />}
          </button>
        ))}
        <label
          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
            value && !presets.some(p => p.value === value)
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 border-transparent"
              : "border-border hover:scale-105"
          }`}
          style={
            value && !presets.some(p => p.value === value)
              ? { backgroundColor: value }
              : undefined
          }
          title="Custom colour"
          data-testid={`${testId}-custom`}
        >
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          {!(value && !presets.some(p => p.value === value)) && (
            <span className="text-[10px] font-bold text-muted-foreground">+</span>
          )}
        </label>
      </div>
    </div>
  );
}
