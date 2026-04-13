import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export interface DatabaseTheme {
  themeName: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  text: string;
  headerText: string;
  controlBg: string;
  controlBorder: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#4472C4',
  accent: '#ED7D31',
  background: '#ffffff',
  text: '#333333',
  headerText: '#ffffff',
  controlBg: '#ffffff',
  controlBorder: '#ced4da',
};

const DEFAULT_FONTS: ThemeFonts = {
  heading: 'Calibri Light',
  body: 'Calibri',
};

export const THEME_PRESETS: DatabaseTheme[] = [
  {
    themeName: 'Office',
    colors: { ...DEFAULT_COLORS },
    fonts: { heading: 'Calibri Light', body: 'Calibri' },
  },
  {
    themeName: 'Facet',
    colors: {
      primary: '#2C6B6F',
      accent: '#E8B54D',
      background: '#f5f5f0',
      text: '#333333',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#b8c4c4',
    },
    fonts: { heading: 'Trebuchet MS', body: 'Trebuchet MS' },
  },
  {
    themeName: 'Integral',
    colors: {
      primary: '#C44545',
      accent: '#D4915E',
      background: '#faf8f5',
      text: '#3b3b3b',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#d4c4b8',
    },
    fonts: { heading: 'Tw Cen MT', body: 'Tw Cen MT' },
  },
  {
    themeName: 'Ion',
    colors: {
      primary: '#B4A76C',
      accent: '#8DB4AD',
      background: '#1e1e1e',
      text: '#e0e0e0',
      headerText: '#ffffff',
      controlBg: '#2d2d2d',
      controlBorder: '#555555',
    },
    fonts: { heading: 'Century Gothic', body: 'Century Gothic' },
  },
  {
    themeName: 'Retrospect',
    colors: {
      primary: '#C0504D',
      accent: '#F79646',
      background: '#fff8f0',
      text: '#333333',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#d4bfb0',
    },
    fonts: { heading: 'Calibri Light', body: 'Calibri' },
  },
  {
    themeName: 'Organic',
    colors: {
      primary: '#6B8E23',
      accent: '#CD853F',
      background: '#f5f5ee',
      text: '#3b3b3b',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#c4c4a8',
    },
    fonts: { heading: 'Garamond', body: 'Garamond' },
  },
  {
    themeName: 'Slice',
    colors: {
      primary: '#2E75B6',
      accent: '#BF4B28',
      background: '#f0f4f8',
      text: '#2d3748',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#b8c8d8',
    },
    fonts: { heading: 'Century Gothic', body: 'Century Gothic' },
  },
  {
    themeName: 'Wisp',
    colors: {
      primary: '#A1A858',
      accent: '#E2C564',
      background: '#fafaf5',
      text: '#454545',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#d4d4ba',
    },
    fonts: { heading: 'Century Gothic', body: 'Century Gothic' },
  },
  {
    themeName: 'Metropolitan',
    colors: {
      primary: '#4B5A68',
      accent: '#7BA0B4',
      background: '#f8f9fa',
      text: '#333333',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#c4ccd4',
    },
    fonts: { heading: 'Consolas', body: 'Consolas' },
  },
  {
    themeName: 'Berlin',
    colors: {
      primary: '#AA3939',
      accent: '#AA6C39',
      background: '#fff5f5',
      text: '#333333',
      headerText: '#ffffff',
      controlBg: '#ffffff',
      controlBorder: '#d4b8b8',
    },
    fonts: { heading: 'Trebuchet MS', body: 'Trebuchet MS' },
  },
];

export const COLOR_SCHEMES: { name: string; colors: ThemeColors }[] = [
  { name: 'Blue', colors: { primary: '#4472C4', accent: '#ED7D31', background: '#ffffff', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#ced4da' } },
  { name: 'Blue Green', colors: { primary: '#2C6B6F', accent: '#E8B54D', background: '#f5f5f0', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#b8c4c4' } },
  { name: 'Green', colors: { primary: '#548235', accent: '#BF8F00', background: '#f5faf5', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#b8d4b8' } },
  { name: 'Green Yellow', colors: { primary: '#6B8E23', accent: '#DAA520', background: '#fafaf0', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#c8d4a8' } },
  { name: 'Yellow', colors: { primary: '#BF8F00', accent: '#548235', background: '#fffaf0', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#d4c8a8' } },
  { name: 'Orange', colors: { primary: '#C55A11', accent: '#4472C4', background: '#fff8f0', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#d4c0a8' } },
  { name: 'Red', colors: { primary: '#C0504D', accent: '#4472C4', background: '#fff5f5', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#d4b8b8' } },
  { name: 'Red Orange', colors: { primary: '#AA3939', accent: '#ED7D31', background: '#faf5f0', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#d4bfb0' } },
  { name: 'Purple', colors: { primary: '#7B68A5', accent: '#4472C4', background: '#f8f5ff', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#c8b8d8' } },
  { name: 'Violet', colors: { primary: '#9B59B6', accent: '#3498DB', background: '#faf5ff', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#d0b8d8' } },
  { name: 'Grayscale', colors: { primary: '#5a5a5a', accent: '#808080', background: '#f5f5f5', text: '#333333', headerText: '#ffffff', controlBg: '#ffffff', controlBorder: '#cccccc' } },
  { name: 'Dark', colors: { primary: '#333333', accent: '#777777', background: '#1e1e1e', text: '#e0e0e0', headerText: '#ffffff', controlBg: '#2d2d2d', controlBorder: '#555555' } },
];

export const FONT_PAIRINGS: { name: string; fonts: ThemeFonts }[] = [
  { name: 'Calibri', fonts: { heading: 'Calibri Light', body: 'Calibri' } },
  { name: 'Arial', fonts: { heading: 'Arial', body: 'Arial' } },
  { name: 'Times New Roman', fonts: { heading: 'Times New Roman', body: 'Times New Roman' } },
  { name: 'Trebuchet MS', fonts: { heading: 'Trebuchet MS', body: 'Trebuchet MS' } },
  { name: 'Verdana', fonts: { heading: 'Verdana', body: 'Verdana' } },
  { name: 'Georgia', fonts: { heading: 'Georgia', body: 'Georgia' } },
  { name: 'Century Gothic', fonts: { heading: 'Century Gothic', body: 'Century Gothic' } },
  { name: 'Garamond', fonts: { heading: 'Garamond', body: 'Garamond' } },
  { name: 'Consolas', fonts: { heading: 'Consolas', body: 'Consolas' } },
  { name: 'Tahoma', fonts: { heading: 'Tahoma', body: 'Tahoma' } },
  { name: 'Segoe UI', fonts: { heading: 'Segoe UI Light', body: 'Segoe UI' } },
  { name: 'Cambria', fonts: { heading: 'Cambria', body: 'Cambria' } },
];

function ThemeSwatch({ colors, size = 40 }: { colors: ThemeColors; size?: number }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', flexWrap: 'wrap', borderRadius: 3, overflow: 'hidden', border: '1px solid #ccc' }}>
      <div style={{ width: '50%', height: '50%', backgroundColor: colors.primary }} />
      <div style={{ width: '50%', height: '50%', backgroundColor: colors.accent }} />
      <div style={{ width: '50%', height: '50%', backgroundColor: colors.background, borderTop: `1px solid ${colors.controlBorder}` }} />
      <div style={{ width: '50%', height: '50%', backgroundColor: colors.controlBg, borderTop: `1px solid ${colors.controlBorder}` }} />
    </div>
  );
}

function ThemePreviewCard({ theme, isSelected, onClick }: { theme: DatabaseTheme; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors relative"
      style={{ borderColor: isSelected ? '#4472C4' : '#e5e7eb', backgroundColor: isSelected ? '#f0f4ff' : undefined, width: 100 }}
    >
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-[#4472C4] rounded-full w-4 h-4 flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
      <div style={{ width: 80, height: 50, backgroundColor: theme.colors.background, borderRadius: 4, border: `1px solid ${theme.colors.controlBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 14, backgroundColor: theme.colors.primary, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
          <span style={{ fontSize: 7, color: theme.colors.headerText, fontFamily: theme.fonts.heading }}>Header</span>
        </div>
        <div style={{ flex: 1, padding: '3px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 6, color: theme.colors.text, fontFamily: theme.fonts.body }}>Label:</span>
            <div style={{ flex: 1, height: 8, backgroundColor: theme.colors.controlBg, border: `1px solid ${theme.colors.controlBorder}`, borderRadius: 1 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 6, color: theme.colors.text, fontFamily: theme.fonts.body }}>Field:</span>
            <div style={{ flex: 1, height: 8, backgroundColor: theme.colors.controlBg, border: `1px solid ${theme.colors.controlBorder}`, borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ height: 6, backgroundColor: theme.colors.accent, opacity: 0.6 }} />
      </div>
      <span className="text-[10px] text-gray-700 font-medium truncate w-full text-center">{theme.themeName}</span>
    </button>
  );
}

interface ThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: DatabaseTheme | null;
  onApply: (theme: DatabaseTheme) => void;
}

export function ThemePickerModal({ open, onOpenChange, currentTheme, onApply }: ThemeModalProps) {
  const [selected, setSelected] = useState<DatabaseTheme | null>(null);
  const activeTheme = selected || currentTheme;
  const activeName = activeTheme?.themeName || 'Office';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose Theme</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-2">
          A theme applies a complete design package — colours, fonts, and effects — to all forms and reports in this database.
        </p>
        <div className="flex flex-wrap gap-2 py-2 max-h-[350px] overflow-y-auto">
          {THEME_PRESETS.map(t => (
            <ThemePreviewCard
              key={t.themeName}
              theme={t}
              isSelected={activeName === t.themeName}
              onClick={() => setSelected(t)}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { if (selected) { onApply(selected); onOpenChange(false); } }}
            disabled={!selected}
          >
            Apply Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ColorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: DatabaseTheme | null;
  onApply: (colors: ThemeColors) => void;
}

export function ColorPickerModal({ open, onOpenChange, currentTheme, onApply }: ColorsModalProps) {
  const [selected, setSelected] = useState<ThemeColors | null>(null);
  const currentColors = currentTheme?.colors || DEFAULT_COLORS;
  const activeColors = selected || currentColors;
  const activeName = COLOR_SCHEMES.find(c =>
    c.colors.primary === activeColors.primary && c.colors.accent === activeColors.accent
  )?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Choose Colours</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-2">
          Change only the colour scheme. The current fonts and layout stay the same.
        </p>
        <div className="grid grid-cols-4 gap-3 py-2 max-h-[320px] overflow-y-auto">
          {COLOR_SCHEMES.map(c => (
            <button
              key={c.name}
              onClick={() => setSelected(c.colors)}
              className="flex flex-col items-center gap-1.5 p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors relative"
              style={{ borderColor: activeName === c.name ? '#4472C4' : '#e5e7eb', backgroundColor: activeName === c.name ? '#f0f4ff' : undefined }}
            >
              {activeName === c.name && (
                <div className="absolute -top-1 -right-1 bg-[#4472C4] rounded-full w-4 h-4 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <ThemeSwatch colors={c.colors} size={36} />
              <span className="text-[9px] text-gray-600 truncate w-full text-center">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { if (selected) { onApply(selected); onOpenChange(false); } }}
            disabled={!selected}
          >
            Apply Colours
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FontsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: DatabaseTheme | null;
  onApply: (fonts: ThemeFonts) => void;
}

export function FontPickerModal({ open, onOpenChange, currentTheme, onApply }: FontsModalProps) {
  const [selected, setSelected] = useState<ThemeFonts | null>(null);
  const currentFonts = currentTheme?.fonts || DEFAULT_FONTS;
  const activeFonts = selected || currentFonts;
  const activeName = FONT_PAIRINGS.find(f =>
    f.fonts.heading === activeFonts.heading && f.fonts.body === activeFonts.body
  )?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Choose Fonts</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-2">
          Change only the font pairing. Colours and layout stay the same.
        </p>
        <div className="flex flex-col gap-1 py-2 max-h-[350px] overflow-y-auto">
          {FONT_PAIRINGS.map(f => (
            <button
              key={f.name}
              onClick={() => setSelected(f.fonts)}
              className="flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer hover:bg-blue-50 transition-colors text-left relative"
              style={{ borderColor: activeName === f.name ? '#4472C4' : '#e5e7eb', backgroundColor: activeName === f.name ? '#f0f4ff' : undefined }}
            >
              {activeName === f.name && (
                <div className="absolute top-1 right-1 bg-[#4472C4] rounded-full w-4 h-4 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <div className="flex flex-col gap-0.5 flex-1">
                <span style={{ fontFamily: f.fonts.heading, fontSize: 15 }} className="text-gray-800">{f.name}</span>
                <div className="flex gap-4 text-[11px] text-gray-500">
                  <span>Heading: <span style={{ fontFamily: f.fonts.heading }}>{f.fonts.heading}</span></span>
                  <span>Body: <span style={{ fontFamily: f.fonts.body }}>{f.fonts.body}</span></span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { if (selected) { onApply(selected); onOpenChange(false); } }}
            disabled={!selected}
          >
            Apply Fonts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getDefaultTheme(): DatabaseTheme {
  return {
    themeName: 'Office',
    colors: { ...DEFAULT_COLORS },
    fonts: { ...DEFAULT_FONTS },
  };
}
