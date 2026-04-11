import React from 'react';

interface ShellProps {
  title: string;
  ribbon: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  isEmbed?: boolean;
  statusBar?: React.ReactNode;
}

export function Shell({ title, ribbon, sidebar, children, isEmbed, statusBar }: ShellProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-sm">
      {ribbon}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 bg-[#e6e6e6] overflow-auto flex shadow-inner relative z-0">
            <div className="flex-1 m-2 bg-white shadow-sm border border-gray-300 rounded overflow-hidden flex flex-col">
              {children}
            </div>
          </div>
        </div>
      </div>
      {statusBar && (
        <div className="h-5 bg-[#f3f2f1] border-t border-gray-300 flex items-center px-3 text-[10px] text-gray-500 select-none flex-none z-10">
          {statusBar}
        </div>
      )}
    </div>
  );
}
