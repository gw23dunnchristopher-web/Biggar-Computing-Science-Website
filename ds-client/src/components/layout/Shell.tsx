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
    <div className={`flex flex-col h-screen w-screen bg-white overflow-hidden text-sm ${isEmbed ? 'border-4 border-red-500 rounded-xl shadow-2xl m-4 h-[calc(100vh-32px)] w-[calc(100vw-32px)] relative' : ''}`}>
      {isEmbed && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold text-center py-1 z-50">
          STUDENT SANDBOX MODE - Changes do not affect the original database
        </div>
      )}
      {ribbon}
      <div className={`flex flex-1 overflow-hidden ${isEmbed ? 'pt-6' : ''}`}>
        {sidebar}
        <div className="flex-1 bg-[#e6e6e6] overflow-auto flex shadow-inner relative z-0">
          <div className="flex-1 m-2 bg-white shadow-sm border border-gray-300 rounded overflow-hidden flex flex-col">
            {children}
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
