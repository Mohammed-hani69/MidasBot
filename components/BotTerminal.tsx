import React, { useEffect, useRef } from 'react';

interface BotTerminalProps {
  logs: string[];
  isOpen: boolean;
}

export const BotTerminal: React.FC<BotTerminalProps> = ({ logs, isOpen }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-2xl rounded-lg border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-xs font-mono text-gray-400">MidasBot Executable - v2.4.0</span>
          </div>
          <div className="text-blue-400 animate-pulse text-xs uppercase font-bold tracking-wider">
            Processing
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 bg-black p-4 font-mono text-sm overflow-y-auto text-green-500">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 break-words">
              <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('ERROR') ? 'text-red-500' : log.includes('SUCCESS') ? 'text-blue-400 font-bold' : ''}>
                {log.startsWith('>') ? <span className="mr-1">$</span> : ''} {log}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};