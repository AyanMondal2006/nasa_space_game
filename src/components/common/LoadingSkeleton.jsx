import React from 'react';
import { Orbit } from 'lucide-react';

export default function LoadingSkeleton({ message = 'INITIALIZING TELEMETRY STREAM...' }) {
  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer spinning radar pulse ring */}
        <div className="absolute inset-0 rounded-full border border-orbit-cyan/30 border-t-orbit-cyan animate-spin" />
        <div className="absolute inset-2 rounded-full border border-orbit-cyan/20 border-b-orbit-cyan animate-orbit-rotate" />
        <div className="w-8 h-8 rounded-full bg-orbit-cyan/15 flex items-center justify-center text-orbit-cyan shadow-glow-cyan">
          <Orbit className="w-4 h-4 animate-pulse-slow" />
        </div>
      </div>
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-orbit-cyan tracking-widest cursor-blink uppercase">
          {message}
        </span>
        <div className="text-[10px] font-mono text-slate-500">
          ASTRAJECT GROUND STATION LINK ESTABLISHED
        </div>
      </div>
    </div>
  );
}

