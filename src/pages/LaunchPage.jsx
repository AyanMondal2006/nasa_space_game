import React from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { LAUNCH_VEHICLES } from '../data/launchVehicles.js';
import { 
  Rocket, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  Weight, 
  ShieldCheck, 
  Maximize2 
} from 'lucide-react';
import { formatCurrency, formatMass } from '../utils/formatters.js';

export default function LaunchPage() {
  const { currentMission, updateLaunchVehicle, validationResults } = useMission();

  const activeLV = currentMission?.launchVehicle;
  const destination = currentMission?.destination || 'earth';
  const wetMass = validationResults?.metrics?.mass?.totalLaunchMass || 500;
  const budgetLimit = currentMission?.budgetLimitUSD || 200_000_000;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Rocket className="w-3.5 h-3.5" />
          <span>LAUNCH SERVICE PROCUREMENT & PAYLOAD INTEGRATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Launch & Deployment
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Evaluate launch vehicles against spacecraft wet mass ({formatMass(wetMass)}) and target destination ({destination.toUpperCase()}).
          Ensure adequate lift margin, fairing volume, and funding headroom.
        </p>
      </div>

      {/* Selected Booster Summary Banner */}
      <div className="space-panel p-5 bg-space-900/80 border-orbit-cyan/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orbit-cyan/15 border border-orbit-cyan/40 flex items-center justify-center text-orbit-cyan shrink-0">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">SELECTED LAUNCH VEHICLE</span>
              <h2 className="text-lg font-bold font-mono text-white">{activeLV?.name || 'None Selected'}</h2>
              <span className="text-xs text-slate-300">{activeLV?.manufacturer} ({activeLV?.country})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">DESTINATION CAPACITY</span>
              <span className="text-slate-200 font-bold text-sm">
                {(activeLV?.maxPayloadMassByDestination?.[destination] || 0).toLocaleString()} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">SPACECRAFT WET MASS</span>
              <span className="text-orbit-cyan font-bold text-sm">{formatMass(wetMass)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">LAUNCH CONTRACT</span>
              <span className="text-emerald-400 font-bold text-sm">{formatCurrency(activeLV?.launchCostUSD || 0)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">RELIABILITY</span>
              <span className="text-slate-200 font-bold text-sm">{activeLV?.reliabilityAssumption}</span>
            </div>
          </div>
        </div>

        {/* Visual Lift Capacity Margin Bar */}
        {activeLV && (
          <div className="mt-4 pt-3 border-t border-space-border/60 space-y-1.5">
            {(() => {
              const destCap = activeLV.maxPayloadMassByDestination?.[destination] || 0;
              const usedPercent = destCap > 0 ? Math.min(100, (wetMass / destCap) * 100) : 100;
              const isOver = wetMass > destCap;

              return (
                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Payload Envelope Utilization:</span>
                    <span className={`font-bold ${isOver ? 'text-crimson' : usedPercent > 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {usedPercent.toFixed(1)}% ({isOver ? `EXCEEDED BY +${(wetMass - destCap).toFixed(0)} kg` : `${(destCap - wetMass).toFixed(0)} kg MARGIN`})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-space-950 overflow-hidden border border-space-border p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-crimson' : usedPercent > 90 ? 'bg-amber-400' : 'bg-orbit-cyan'
                      }`}
                      style={{ width: `${Math.min(100, usedPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="space-y-4">
        <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
          Certified Launch Vehicles Fleet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LAUNCH_VEHICLES.map((lv) => {
            const isSelected = activeLV?.id === lv.id;
            const destCap = lv.maxPayloadMassByDestination?.[destination] || 0;
            const canReach = destCap > 0;
            const isMassFeasible = destCap >= wetMass;

            return (
              <div
                key={lv.id}
                className={`space-panel p-5 flex flex-col justify-between transition border-2 ${
                  isSelected ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20' :
                  !canReach ? 'opacity-40 border-space-border bg-space-950/40' :
                  !isMassFeasible ? 'border-rose-500/40 bg-space-900/60' :
                  'border-space-border bg-space-900/60 hover:border-slate-500'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-slate-300 border border-space-border">
                      {lv.country}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Reliability: <span className="text-emerald-400">{lv.reliabilityAssumption}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-mono font-bold text-base text-white">{lv.name}</h4>
                    <span className="text-xs text-orbit-cyan font-mono">{lv.manufacturer}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">{lv.description}</p>

                  <div className="pt-2 border-t border-space-border/50 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lift to {destination.toUpperCase()}:</span>
                      <span className={`font-bold ${!canReach ? 'text-slate-500' : isMassFeasible ? 'text-emerald-400' : 'text-crimson'}`}>
                        {canReach ? `${destCap.toLocaleString()} kg` : 'Unsupported'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payload Fairing (Dia × Ht):</span>
                      <span className="text-slate-200">{lv.fairingDiameterM}m × {lv.fairingHeightM}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Procurement Cost:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(lv.launchCostUSD)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-space-border/50">
                  <button
                    onClick={() => canReach && updateLaunchVehicle(lv)}
                    disabled={!canReach}
                    className={`w-full py-2 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${
                      isSelected ? 'bg-orbit-cyan text-space-950' :
                      !canReach ? 'bg-space-950 text-slate-600 cursor-not-allowed' :
                      'bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-slate-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>CURRENT LAUNCH CONTRACT</span>
                      </>
                    ) : (
                      <span>SELECT THIS BOOSTER</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
