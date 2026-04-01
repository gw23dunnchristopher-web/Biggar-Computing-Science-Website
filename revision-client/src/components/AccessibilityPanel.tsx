import { useState } from "react";
import { useAccessibility } from "./AccessibilityContext";
import {
  SlidersHorizontal,
  Eye,
  Type,
  Volume2,
  Space,
  Palette,
  MousePointer,
  Sparkles,
  Paintbrush,
  RotateCcw,
  X,
} from "lucide-react";

const TEXT_COLOURS = [
  { label: "Default", value: "", color: "" },
  { label: "Black", value: "#000000", color: "#000000" },
  { label: "White", value: "#FFFFFF", color: "#FFFFFF" },
  { label: "Dark Navy", value: "#1a1a2e", color: "#1a1a2e" },
  { label: "Yellow", value: "#FFD700", color: "#FFD700" },
  { label: "Green", value: "#00FF00", color: "#00FF00" },
  { label: "Sky Blue", value: "#00BFFF", color: "#00BFFF" },
];

const BG_COLOURS = [
  { label: "Default", value: "", color: "" },
  { label: "White", value: "#FFFFFF", color: "#FFFFFF" },
  { label: "Black", value: "#000000", color: "#000000" },
  { label: "Dark Navy", value: "#1a1a2e", color: "#1a1a2e" },
  { label: "Cream", value: "#FFFDD0", color: "#FFFDD0" },
  { label: "Alice Blue", value: "#F0F8FF", color: "#F0F8FF" },
  { label: "Dark Grey", value: "#2d2d2d", color: "#2d2d2d" },
];

const OVERLAYS = [
  { label: "None", value: "none", color: "" },
  { label: "Cream", value: "cream", color: "#fff3dc" },
  { label: "Blue", value: "blue", color: "#c8dcff" },
  { label: "Pink", value: "pink", color: "#ffd2dc" },
  { label: "Green", value: "green", color: "#d2ffdc" },
  { label: "Yellow", value: "yellow", color: "#ffffc8" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-red-600" : "bg-neutral-600"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ColourSwatch({ color, active, isDefault, onClick }: { color: string; active: boolean; isDefault?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${active ? "ring-2 ring-red-500 ring-offset-2 ring-offset-neutral-900 border-red-500" : "border-neutral-600 hover:border-neutral-400"}`}
      style={color ? { backgroundColor: color } : undefined}
    >
      {isDefault && <X className="w-4 h-4 text-neutral-400" />}
    </button>
  );
}

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { settings, updateSetting, resetAll, hasChanges } = useAccessibility();

  return (
    <>
      <button
        data-testid="a11y-trigger"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 shadow-lg flex items-center justify-center hover:bg-neutral-700 transition-colors"
        aria-label="Display Settings"
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
        {hasChanges && (
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div
            data-testid="a11y-backdrop"
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => setOpen(false)}
          />
          <div
            data-a11y-panel="true"
            data-testid="a11y-panel"
            className="fixed top-0 right-0 h-full w-80 bg-neutral-900 text-white z-[10000] shadow-2xl flex flex-col overflow-hidden animate-[slideInRight_0.2s_ease-out]"
            style={{ animationFillMode: "forwards" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Display Settings</h2>
              </div>
              <button
                data-testid="a11y-close"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-neutral-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <SettingRow
                icon={<Eye className="w-5 h-5" />}
                label="High Contrast"
                description="Increase colour contrast for better readability"
              >
                <Toggle checked={settings.highContrast} onChange={v => updateSetting("highContrast", v)} />
              </SettingRow>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Type className="w-5 h-5" />
                  <span className="font-medium">Text Colour</span>
                </div>
                <p className="text-xs text-neutral-400 mb-2 ml-7">Choose your preferred text colour</p>
                <div className="flex gap-2 ml-7">
                  {TEXT_COLOURS.map(c => (
                    <ColourSwatch
                      key={c.label}
                      color={c.color}
                      isDefault={!c.value}
                      active={settings.customTextColour === c.value}
                      onClick={() => updateSetting("customTextColour", c.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Paintbrush className="w-5 h-5" />
                  <span className="font-medium">Background Colour</span>
                </div>
                <p className="text-xs text-neutral-400 mb-2 ml-7">Choose your preferred background colour</p>
                <div className="flex gap-2 ml-7">
                  {BG_COLOURS.map(c => (
                    <ColourSwatch
                      key={c.label}
                      color={c.color}
                      isDefault={!c.value}
                      active={settings.customBgColour === c.value}
                      onClick={() => updateSetting("customBgColour", c.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    <span className="font-medium">Text Size</span>
                  </div>
                  <span className="text-sm text-neutral-400">{settings.fontSize}%</span>
                </div>
                <div className="ml-7">
                  <input
                    data-testid="font-size-slider"
                    type="range"
                    min={75}
                    max={200}
                    step={25}
                    value={settings.fontSize}
                    onChange={e => updateSetting("fontSize", Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>75%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Space className="w-5 h-5" />
                    <span className="font-medium">Line Spacing</span>
                  </div>
                  <span className="text-sm text-neutral-400">{settings.lineSpacing}%</span>
                </div>
                <div className="ml-7">
                  <input
                    data-testid="line-spacing-slider"
                    type="range"
                    min={100}
                    max={200}
                    step={25}
                    value={settings.lineSpacing}
                    onChange={e => updateSetting("lineSpacing", Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>

              <SettingRow
                icon={<Type className="w-5 h-5" />}
                label="Dyslexia-Friendly Font"
                description="Use OpenDyslexic for easier reading"
              >
                <Toggle checked={settings.dyslexiaFont} onChange={v => updateSetting("dyslexiaFont", v)} />
              </SettingRow>

              <SettingRow
                icon={<Volume2 className="w-5 h-5" />}
                label="Text-to-Speech"
                description="Click any text to hear it read aloud"
              >
                <Toggle checked={settings.ttsEnabled} onChange={v => updateSetting("ttsEnabled", v)} />
              </SettingRow>

              <SettingRow
                icon={<Sparkles className="w-5 h-5" />}
                label="Reduced Motion"
                description="Disable animations and transitions"
              >
                <Toggle checked={settings.reducedMotion} onChange={v => updateSetting("reducedMotion", v)} />
              </SettingRow>

              <SettingRow
                icon={<MousePointer className="w-5 h-5" />}
                label="Reading Guide"
                description="Highlight bar follows your cursor to track lines"
              >
                <Toggle checked={settings.readingGuide} onChange={v => updateSetting("readingGuide", v)} />
              </SettingRow>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-5 h-5" />
                  <span className="font-medium">Colour Overlay</span>
                </div>
                <p className="text-xs text-neutral-400 mb-2 ml-7">Apply a colour tint to reduce eye strain</p>
                <div className="flex gap-2 ml-7">
                  {OVERLAYS.map(o => (
                    <ColourSwatch
                      key={o.value}
                      color={o.color}
                      isDefault={o.value === "none"}
                      active={settings.colourOverlay === o.value}
                      onClick={() => updateSetting("colourOverlay", o.value)}
                    />
                  ))}
                </div>
              </div>

              {hasChanges && (
                <button
                  data-testid="a11y-reset"
                  onClick={resetAll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All Settings
                </button>
              )}
            </div>

            <div className="p-4 border-t border-neutral-700">
              <p className="text-xs text-neutral-500 text-center">
                Settings are saved automatically and will persist between visits.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SettingRow({ icon, label, description, children }: { icon: React.ReactNode; label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <span className="font-medium block">{label}</span>
          {description && <span className="text-xs text-neutral-400">{description}</span>}
        </div>
      </div>
      <div className="shrink-0 mt-0.5">{children}</div>
    </div>
  );
}
