import React from 'react';
import { X, Table, List, LayoutTemplate, FileText, Code } from 'lucide-react';
import { DatasheetViewIcon } from '@/components/ui/design-view-icon';

export type ObjectTab = {
  key: string;
  url: string;
  label: string;
  objectType: 'table' | 'query' | 'form' | 'report' | 'sql';
};

interface ObjectTabBarProps {
  tabs: ObjectTab[];
  activeKey: string | null;
  onSelect: (tab: ObjectTab) => void;
  onClose: (key: string) => void;
}

function TabIcon({ type }: { type: ObjectTab['objectType'] }) {
  switch (type) {
    case 'table':   return <DatasheetViewIcon size={12} />;
    case 'query':   return <List className="w-3 h-3" />;
    case 'form':    return <LayoutTemplate className="w-3 h-3" />;
    case 'report':  return <FileText className="w-3 h-3" />;
    case 'sql':     return <Code className="w-3 h-3" />;
    default:        return <Table className="w-3 h-3" />;
  }
}

export function ObjectTabBar({ tabs, activeKey, onSelect, onClose }: ObjectTabBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end bg-[#dcdad8] border-b border-gray-400 px-1 pt-1 gap-px overflow-x-auto flex-none select-none"
      style={{ minHeight: 28 }}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey;
        return (
          <div
            key={tab.key}
            onClick={() => onSelect(tab)}
            className={`flex items-center gap-1.5 px-3 text-[11px] cursor-pointer border border-b-0 rounded-t-sm transition-colors flex-none
              ${isActive
                ? 'bg-white border-gray-400 text-gray-800 font-medium'
                : 'bg-[#ece9e4] border-gray-400 text-gray-600 hover:bg-[#f0eeeb]'
              }`}
            style={{ paddingTop: 4, paddingBottom: isActive ? 5 : 4, marginBottom: isActive ? -1 : 0 }}
          >
            <span className={isActive ? 'text-[#C42B1C]' : 'text-gray-500'}>
              <TabIcon type={tab.objectType} />
            </span>
            <span className="max-w-[140px] truncate">{tab.label}</span>
            <button
              onClick={e => { e.stopPropagation(); onClose(tab.key); }}
              className="ml-0.5 rounded hover:bg-gray-300 p-0.5 text-gray-400 hover:text-gray-700 flex items-center"
              title="Close"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
