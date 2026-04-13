import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Database, Home, Save, Undo2, Redo2, Printer, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Ribbon size context ───────────────────────────────────────────────────────
// 'large'  = normal tall buttons (≥600px)
// 'medium' = compact horizontal buttons, groups stacked vertically (350–599px)
// 'small'  = entire groups collapse into a dropdown button (<350px)
export type RibbonSize = 'large' | 'medium' | 'small';
const RibbonSizeContext = React.createContext<RibbonSize>('large');

// When true, RibbonButton renders as a plain list-item inside a dropdown
const RibbonInDropdownContext = React.createContext(false);

export function useRibbonSize(): RibbonSize {
  return useContext(RibbonSizeContext);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RibbonTab {
  name: string;
  content: React.ReactNode;
}

export interface RibbonContextSection {
  color: string;
  defaultTab: string;
  tabs: RibbonTab[];
}

interface RibbonProps {
  title: string;
  tabs: RibbonTab[];
  contextSection?: RibbonContextSection;
  activeTab?: string;
  onTabChange?: (name: string) => void;
  homeLink?: string;
  allDatabasesLink?: string;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Always-visible content pinned to the left of every tab's content area */
  pinnedContent?: React.ReactNode;
}

// ── Main Ribbon component ─────────────────────────────────────────────────────
export function Ribbon({
  title, tabs, contextSection, activeTab, onTabChange,
  homeLink, allDatabasesLink, onSave, onUndo, onRedo, pinnedContent
}: RibbonProps) {
  const allTabs = [...tabs, ...(contextSection?.tabs || [])];
  const defaultActive = contextSection ? contextSection.defaultTab : tabs[0]?.name;
  const [localActive, setLocalActive] = useState(defaultActive);
  const active = activeTab ?? localActive;

  useEffect(() => {
    if (contextSection?.defaultTab) {
      setLocalActive(contextSection.defaultTab);
    }
  }, [contextSection?.defaultTab]);

  const handleTabClick = (name: string) => {
    setLocalActive(name);
    onTabChange?.(name);
  };

  const activeContent = allTabs.find(t => t.name === active)?.content;

  // ── Tab-bar overflow detection ────────────────────────────────────────────
  const tabRowRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLAnchorElement>(null);
  const tabBtnRefs  = useRef<(HTMLButtonElement | null)[]>([]);
  const ctxDivRef   = useRef<HTMLDivElement>(null);
  const ctxBtnRefs  = useRef<(HTMLButtonElement | null)[]>([]);

  const [overflowFromTab, setOverflowFromTab] = useState(-1);
  const [overflowFromCtx, setOverflowFromCtx] = useState(-1);

  const recalcTabs = useCallback(() => {
    const container = tabRowRef.current;
    if (!container) return;
    const available = container.clientWidth;
    const MORE_W = 52;
    let used = fileRef.current ? fileRef.current.offsetWidth + 4 : 0;

    let firstOverflowTab = -1;
    for (let i = 0; i < tabs.length; i++) {
      const el = tabBtnRefs.current[i];
      if (!el) continue;
      used += el.scrollWidth + 1;
      if (firstOverflowTab === -1 && used > available - MORE_W) firstOverflowTab = i;
    }

    let firstOverflowCtx = -1;
    if (firstOverflowTab === -1 && contextSection) {
      if (ctxDivRef.current) used += ctxDivRef.current.offsetWidth + 16;
      for (let i = 0; i < (contextSection.tabs || []).length; i++) {
        const el = ctxBtnRefs.current[i];
        if (!el) continue;
        used += el.scrollWidth + 1;
        if (firstOverflowCtx === -1 && used > available - MORE_W) firstOverflowCtx = i;
      }
    } else if (firstOverflowTab !== -1) {
      firstOverflowCtx = 0;
    }

    const noOverflow = firstOverflowTab === -1 && firstOverflowCtx === -1;
    setOverflowFromTab(noOverflow ? -1 : (firstOverflowTab === -1 ? tabs.length : firstOverflowTab));
    setOverflowFromCtx(noOverflow ? -1 : (firstOverflowCtx === -1 && firstOverflowTab !== -1 ? 0 : firstOverflowCtx));
  }, [tabs, contextSection]);

  useEffect(() => {
    const container = tabRowRef.current;
    if (!container) return;
    const ro = new ResizeObserver(recalcTabs);
    ro.observe(container);
    recalcTabs();
    return () => ro.disconnect();
  }, [recalcTabs]);

  const overflowTabs: Array<{ tab: RibbonTab; isCtx: boolean }> = [];
  if (overflowFromTab !== -1) tabs.slice(overflowFromTab).forEach(t => overflowTabs.push({ tab: t, isCtx: false }));
  if (overflowFromCtx !== -1 && contextSection) contextSection.tabs.slice(overflowFromCtx).forEach(t => overflowTabs.push({ tab: t, isCtx: true }));
  const hasOverflow = overflowTabs.length > 0;
  const activeInOverflow = overflowTabs.some(o => o.tab.name === active);

  // ── Ribbon content size (condensing) ─────────────────────────────────────
  const [ribbonSize, setRibbonSize] = useState<RibbonSize>('large');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setRibbonSize(w < 340 ? 'small' : w < 580 ? 'medium' : 'large');
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── QAT helpers ────────────────────────────────────────────────────────────
  const qatBtn = (icon: React.ReactNode, title: string, onClick?: () => void, disabled = false) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-5 h-5 flex items-center justify-center rounded transition-colors
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 active:bg-white/30 cursor-pointer'}`}
    >
      {icon}
    </button>
  );

  // ── Content area height by size ────────────────────────────────────────────
  const contentMinH = ribbonSize === 'large' ? 'min-h-[88px]' : ribbonSize === 'medium' ? 'min-h-[64px]' : 'min-h-[40px]';

  return (
    <div className="flex flex-col bg-[#f3f2f1] border-b border-gray-300 shadow-sm relative z-20 flex-none">
      {/* Title Bar */}
      <div className="h-8 bg-[#C42B1C] flex items-center px-2 text-white text-xs font-medium select-none gap-1 min-w-0">
        {allDatabasesLink && (
          <Link href={allDatabasesLink}
            className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity mr-1 text-white flex-none"
            title="All Databases"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        )}
        <div className="flex items-center gap-0.5 mr-2 border-r border-white/30 pr-2 flex-none">
          {qatBtn(<Save className="w-3 h-3" />, 'Save (Ctrl+S)', onSave)}
          {qatBtn(<Undo2 className="w-3 h-3" />, 'Undo (Ctrl+Z)', onUndo, !onUndo)}
          {qatBtn(<Redo2 className="w-3 h-3" />, 'Redo (Ctrl+Y)', onRedo, !onRedo)}
          {qatBtn(<Printer className="w-3 h-3" />, 'Quick Print', () => window.print())}
          <button title="Customize Quick Access Toolbar" className="w-4 h-5 flex items-center justify-center rounded hover:bg-white/20 cursor-pointer">
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>
        <Database className="w-4 h-4 opacity-80 flex-none" />
        <span className="opacity-90 font-semibold truncate min-w-0">{title}</span>
        <span className="opacity-50 mx-1 flex-none">-</span>
        <span className="opacity-80 flex-none hidden sm:inline">Access Learning Tool</span>
      </div>

      {/* Tab Headers Row */}
      <div ref={tabRowRef} className="flex items-end px-2 border-b border-gray-300 overflow-hidden">
        {homeLink && (
          <Link ref={fileRef} href={homeLink}
            className="flex-none px-4 py-1.5 text-sm font-medium text-white bg-[#C42B1C] hover:bg-[#9B2118] rounded-t transition-colors mr-1 leading-none"
          >
            File
          </Link>
        )}

        {tabs.map((tab, i) => {
          const hidden = overflowFromTab !== -1 && i >= overflowFromTab;
          return (
            <button
              key={tab.name}
              ref={el => { tabBtnRefs.current[i] = el; }}
              onClick={() => handleTabClick(tab.name)}
              className={`flex-none px-4 py-1.5 text-sm transition-colors leading-none
                ${hidden ? 'invisible absolute' : ''}
                ${active === tab.name
                  ? 'bg-white border border-gray-300 border-b-white text-[#C42B1C] font-semibold -mb-px relative z-10 rounded-t'
                  : 'text-gray-600 hover:bg-gray-200 rounded-t border border-transparent'}`}
            >
              {tab.name}
            </button>
          );
        })}

        {contextSection && (() => {
          const ctxAllHidden = overflowFromCtx === 0;
          return (
            <>
              <div
                ref={ctxDivRef}
                className={`self-stretch w-0.5 mx-2 my-0.5 rounded-full flex-none ${ctxAllHidden ? 'invisible absolute' : ''}`}
                style={{ background: contextSection.color }}
              />
              {contextSection.tabs.map((tab, i) => {
                const hidden = overflowFromCtx !== -1 && i >= overflowFromCtx;
                return (
                  <button
                    key={tab.name}
                    ref={el => { ctxBtnRefs.current[i] = el; }}
                    onClick={() => handleTabClick(tab.name)}
                    style={active === tab.name
                      ? { borderTopColor: contextSection.color, color: contextSection.color }
                      : { color: contextSection.color }}
                    className={`flex-none px-4 py-1.5 text-sm transition-colors leading-none font-medium
                      ${hidden ? 'invisible absolute' : ''}
                      ${active === tab.name
                        ? 'bg-white border border-gray-300 border-b-white -mb-px relative z-10 rounded-t border-t-2'
                        : 'opacity-70 hover:opacity-100 hover:bg-orange-50 rounded-t border border-transparent'}`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </>
          );
        })()}

        {hasOverflow && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex-none flex items-center gap-1 px-2 py-1.5 text-sm rounded-t transition-colors leading-none ml-auto border border-transparent
                  ${activeInOverflow
                    ? 'bg-white border-gray-300 border-b-white text-[#C42B1C] font-semibold -mb-px relative z-10'
                    : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {overflowTabs.map(o => (
                <DropdownMenuItem
                  key={o.tab.name}
                  onClick={() => handleTabClick(o.tab.name)}
                  style={o.isCtx ? { color: contextSection?.color } : undefined}
                  className={active === o.tab.name ? 'font-semibold bg-red-50' : ''}
                >
                  {o.tab.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Tab Content — size-aware, no scrollbar */}
      <RibbonSizeContext.Provider value={ribbonSize}>
        <div
          ref={contentRef}
          className={`bg-white px-2 py-1 flex items-start gap-1 overflow-hidden ${contentMinH}`}
        >
          {pinnedContent}
          {activeContent}
        </div>
      </RibbonSizeContext.Provider>
    </div>
  );
}

// ── RibbonGroup ───────────────────────────────────────────────────────────────
export function RibbonGroup({ name, children }: { name: string; children: React.ReactNode }) {
  const size = useRibbonSize();

  if (size === 'small') {
    // Collapse entire group into a dropdown button
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded border border-transparent
            hover:bg-red-50 hover:border-red-200 transition-colors h-[36px] min-w-[44px] cursor-pointer">
            <ChevronDown className="w-3 h-3 text-[#C42B1C]" />
            <span className="text-[9px] font-medium text-gray-600 leading-none text-center whitespace-nowrap">{name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[168px] p-1">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">{name}</div>
          <DropdownMenuSeparator />
          <RibbonInDropdownContext.Provider value={true}>
            {children}
          </RibbonInDropdownContext.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (size === 'medium') {
    // Compact: buttons stacked in a column, group label at bottom
    return (
      <div className="flex flex-col gap-0.5 pr-2 border-r border-gray-200 last:border-r-0 relative pt-1 pb-5 min-w-fit">
        {children}
        <span className="absolute bottom-0 left-0 right-2 text-center text-[10px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {name}
        </span>
      </div>
    );
  }

  // Large: existing side-by-side button layout
  return (
    <div className="flex gap-0 pr-2 border-r border-gray-200 last:border-r-0 relative pt-1 pb-5 h-full min-w-fit justify-start items-start">
      {children}
      <span className="absolute bottom-0 left-0 right-2 text-center text-[10px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {name}
      </span>
    </div>
  );
}

// ── RibbonButton ──────────────────────────────────────────────────────────────
export function RibbonButton({
  icon,
  label,
  onClick,
  disabled,
  active,
  size = 'large',
  title: titleProp,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: 'large' | 'small';
  title?: string;
  wide?: boolean;
}) {
  const ribbonSize = useRibbonSize();
  const inDropdown = useContext(RibbonInDropdownContext);

  // ── Dropdown list item (inside collapsed group dropdown) ──────────────────
  if (inDropdown) {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        title={titleProp || label}
        className={`flex items-center gap-2 px-2 py-1.5 w-full text-left text-xs rounded transition-colors
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 cursor-pointer'}
          ${active ? 'bg-red-100 text-[#9B2118]' : 'text-gray-700'}`}
      >
        <span className={`text-base flex-none ${active ? 'text-[#9B2118]' : 'text-[#C42B1C]'} ${disabled ? 'opacity-40' : ''}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C42B1C] flex-none" />}
      </button>
    );
  }

  // ── Medium: compact horizontal (icon + label) — stacked in column by group ─
  if (ribbonSize === 'medium' || size === 'small') {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        title={titleProp || label}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-150 w-full
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'}
          ${active ? 'bg-red-100 text-[#9B2118]' : 'text-gray-700'}`}
      >
        <span className={`flex-none ${active ? 'text-[#9B2118]' : 'text-[#C42B1C]'}`}>{icon}</span>
        <span className="truncate">{label}</span>
      </button>
    );
  }

  // ── Large: tall vertical button with icon above label ─────────────────────
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={titleProp || label}
      className={`flex flex-col items-center justify-start ${wide ? 'w-[90px]' : 'w-[72px]'} h-[76px] p-0.5 rounded transition-all duration-150
        ${disabled ? 'opacity-35 cursor-not-allowed grayscale' : 'hover:bg-red-50 hover:border-red-200 active:bg-red-100 cursor-pointer'}
        ${active ? 'bg-red-100 border border-red-300' : 'border border-transparent'}
        text-gray-700`}
    >
      <div className={`text-[22px] mb-0.5 mt-0.5 ${active ? 'text-[#9B2118]' : 'text-[#C42B1C]'}`}>{icon}</div>
      <span className="text-[10px] leading-[1.2] text-center w-full line-clamp-3 px-0.5">{label}</span>
    </button>
  );
}

// ── RibbonViewSplitButton ─────────────────────────────────────────────────────
// Icon area = direct navigation; label area = dropdown with all view options.
export interface RibbonViewOption {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function RibbonViewSplitButton({
  icon,
  onIconClick,
  options,
  disabled,
}: {
  icon: React.ReactNode;
  onIconClick?: () => void;
  options: RibbonViewOption[];
  disabled?: boolean;
}) {
  const ribbonSize = useRibbonSize();
  const inDropdown = useContext(RibbonInDropdownContext);

  if (inDropdown || ribbonSize === 'medium') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} asChild>
          <button
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-150 w-full
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'} text-gray-700`}
          >
            <span className="flex-none text-[#C42B1C]">{icon}</span>
            <span className="truncate">View</span>
            <ChevronDown className="w-3 h-3 ml-auto text-gray-400 flex-none" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-1 min-w-[160px]">
          <RibbonInDropdownContext.Provider value={true}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={opt.onClick}
                className={`flex items-center gap-2 px-2 py-1.5 w-full text-left text-xs rounded transition-colors
                  hover:bg-red-50 cursor-pointer ${opt.active ? 'bg-red-100 text-[#9B2118]' : 'text-gray-700'}`}
              >
                <span className={`text-base flex-none ${opt.active ? 'text-[#9B2118]' : 'text-[#C42B1C]'}`}>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
                {opt.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C42B1C] flex-none" />}
              </button>
            ))}
          </RibbonInDropdownContext.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Large: icon half is a direct action button; label half opens dropdown
  return (
    <div
      className={`flex flex-col items-center w-[72px] h-[76px] rounded border border-transparent overflow-hidden
        ${disabled ? 'opacity-35 cursor-not-allowed grayscale' : ''}`}
    >
      {/* Icon — direct navigation */}
      <button
        disabled={disabled}
        onClick={onIconClick}
        title="Switch view"
        className={`flex items-center justify-center w-full flex-1 transition-all duration-150
          ${disabled ? 'cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'}
          text-[#C42B1C]`}
      >
        {icon}
      </button>

      {/* Label + chevron — opens dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} asChild>
          <button
            disabled={disabled}
            className={`flex items-center justify-center gap-0.5 w-full px-1 py-0.5 transition-all duration-150
              ${disabled ? 'cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'}
              text-gray-700`}
          >
            <span className="text-[10px] leading-none">View</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 flex-none" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-1 min-w-[160px]">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.onClick}
              className={`flex items-center gap-2 px-2 py-1.5 w-full text-left text-xs rounded transition-colors
                hover:bg-red-50 cursor-pointer ${opt.active ? 'bg-red-100 text-[#9B2118]' : 'text-gray-700'}`}
            >
              <span className={`text-base flex-none ${opt.active ? 'text-[#9B2118]' : 'text-[#C42B1C]'}`}>{opt.icon}</span>
              <span className="truncate">{opt.label}</span>
              {opt.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C42B1C] flex-none" />}
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── RibbonSeparator ───────────────────────────────────────────────────────────
export function RibbonSeparator() {
  const ribbonSize = useRibbonSize();
  if (ribbonSize === 'small') return null;
  return <div className="w-px bg-gray-200 h-12 self-center mx-1" />;
}

// ── RibbonDropdownButton ──────────────────────────────────────────────────────
// A single ribbon button with a dropdown arrow that shows child RibbonButtons
// as menu items. When already inside a dropdown (e.g. collapsed group) it
// renders as a sub-menu instead.
export function RibbonDropdownButton({
  icon, label, disabled, children, compact,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
  /** Force the compact (small-row) style even in large ribbon mode */
  compact?: boolean;
}) {
  const ribbonSize = useRibbonSize();
  const inDropdown = useContext(RibbonInDropdownContext);

  if (inDropdown) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          disabled={disabled}
          className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 cursor-pointer'} text-gray-700`}
        >
          <span className="text-[#C42B1C] flex-none">{icon}</span>
          <span>{label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-1 min-w-[160px]">
          <RibbonInDropdownContext.Provider value={true}>
            {children}
          </RibbonInDropdownContext.Provider>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  if (ribbonSize === 'medium' || compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} asChild>
          <button
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-150 w-full
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'} text-gray-700`}
          >
            <span className="flex-none text-[#C42B1C]">{icon}</span>
            <span className="truncate">{label}</span>
            <ChevronDown className="w-3 h-3 ml-auto text-gray-400 flex-none" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-1 min-w-[160px]">
          <RibbonInDropdownContext.Provider value={true}>
            {children}
          </RibbonInDropdownContext.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Large: tall button with icon + label + small chevron
  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={disabled} asChild>
        <button
          disabled={disabled}
          className={`flex flex-col items-center justify-start w-[72px] h-[76px] p-0.5 rounded transition-all duration-150
            ${disabled ? 'opacity-35 cursor-not-allowed grayscale' : 'hover:bg-red-50 hover:border-red-200 active:bg-red-100 cursor-pointer'}
            border border-transparent text-gray-700`}
        >
          <div className="text-[22px] mb-0.5 mt-0.5 text-[#C42B1C]">{icon}</div>
          <span className="text-[10px] leading-[1.2] text-center w-full line-clamp-3 px-0.5">{label}</span>
          <ChevronDown className="w-3 h-3 text-gray-400 mt-auto mb-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-1 min-w-[160px]">
        <RibbonInDropdownContext.Provider value={true}>
          {children}
        </RibbonInDropdownContext.Provider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
