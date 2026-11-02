import React from 'react';
import { AlertCircle, AlertTriangle, Info, ArrowRight, Wrench } from 'lucide-react';

export default function ValidationAlerts({ errors = [], warnings = [], onNavigateToFix }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3 my-4">
      {/* Blocking Errors */}
      {errors.map((err, idx) => (
        <div
          key={`err-${idx}`}
          className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/50 text-slate-200 flex flex-col md:flex-row gap-3 items-start justify-between shadow-lg"
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                  BLOCKING CONSTRAINT
                </span>
                <h4 className="font-semibold text-rose-200 text-sm">{err.title}</h4>
              </div>
              <p className="text-sm text-slate-300">{err.message}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-rose-500/20 text-xs font-mono">
                <div>
                  <span className="text-rose-400 font-semibold">CAUSE: </span>
                  <span className="text-slate-300">{err.cause}</span>
                </div>
                <div>
                  <span className="text-rose-400 font-semibold">PHYSICAL IMPACT: </span>
                  <span className="text-slate-300">{err.whyItMatters}</span>
                </div>
              </div>

              <div className="mt-2 text-xs bg-rose-900/30 p-2 rounded border border-rose-500/20 flex items-start gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">ACTIONABLE REMEDY: </span>
                  <span className="text-slate-200">{err.remedy}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Non-Blocking Warnings */}
      {warnings.map((warn, idx) => (
        <div
          key={`warn-${idx}`}
          className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-slate-200 flex gap-3 items-start"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold uppercase text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                WARNING
              </span>
              <h5 className="font-semibold text-amber-200 text-sm">{warn.title}</h5>
            </div>
            <p className="text-slate-300">{warn.message}</p>
            <p className="text-slate-400 font-mono text-[11px]"><span className="text-amber-400">Fix:</span> {warn.remedy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
