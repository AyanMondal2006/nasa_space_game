import React, { useState } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { generateRecommendations } from '../engine/optimization/recommendations.js';
import { 
  GitCompare, 
  Wrench, 
  Check, 
  Plus, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Copy,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatMass, formatPower } from '../utils/formatters.js';

export default function ComparisonPage() {
  const { 
    savedMissions, 
    currentMission, 
    validationResults, 
    updateSpacecraft, 
    updateLaunchVehicle, 
    loadSavedMission, 
    duplicateSavedMission, 
    setActiveTab 
  } = useMission();

  // Selected missions for side-by-side comparison
  const [selectedIds, setSelectedIds] = useState(() => {
    return savedMissions.slice(0, 3).map(m => m.id);
  });

  // Generate automated recommendations for active mission
  const recommendations = generateRecommendations(currentMission, validationResults);

  const handleApplyRecommendation = (rec) => {
    if (rec.actionType === 'SET_LAUNCH_VEHICLE') {
      updateLaunchVehicle(rec.targetValue);
    } else if (rec.actionType === 'SET_BATTERY') {
      updateSpacecraft('battery', rec.targetValue);
    } else if (rec.actionType === 'SET_POWER') {
      updateSpacecraft('power', rec.targetValue);
    } else if (rec.actionType === 'SET_COMPUTING') {
      updateSpacecraft('computing', rec.targetValue);
    } else if (rec.actionType === 'SET_COMMS') {
      updateSpacecraft('comms', rec.targetValue);
    }
  };

  const toggleSelectMission = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return;
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 3) return;
      setSelectedIds([...selectedIds, id]);
    }
  };

  const missionsToCompare = savedMissions.filter(m => selectedIds.includes(m.id));

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <GitCompare className="w-3.5 h-3.5" />
          <span>MULTI-MISSION COMPARISON & ARCHITECTURE OPTIMIZER</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Design Comparison & Optimizer
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Evaluate saved mission architectures side-by-side and review rule-based optimization recommendations.
        </p>
      </div>

      {/* Automated Recommendation Engine Section */}
      <div className="space-panel p-6 border-orbit-cyan/30 space-y-4 bg-space-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orbit-cyan" />
            <h2 className="text-base font-bold font-mono text-white">
              Automated Design Recommendations for "{currentMission?.title}"
            </h2>
          </div>
          <span className="text-xs font-mono text-orbit-cyan px-2 py-0.5 rounded bg-orbit-cyan/10 border border-orbit-cyan/30">
            {recommendations.length} Suggestions
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Optimal Architecture: No immediate constraint violations or subsystem bottlenecks detected.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-lg bg-space-950/80 border border-space-border space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30 uppercase">
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-mono font-bold text-sm text-white">{rec.title}</h4>
                  <p className="text-xs text-slate-400">{rec.reason}</p>
                  <p className="text-xs font-mono text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {rec.impactDescription}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleApplyRecommendation(rec)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded bg-space-850 hover:bg-orbit-cyan hover:text-space-950 text-slate-200 font-mono text-xs font-bold transition border border-space-border"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Apply This Suggestion</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="space-panel p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            Architecture Specification Matrix (Up to 3 Missions)
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {savedMissions.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleSelectMission(m.id)}
                className={`px-2.5 py-1 rounded border transition ${
                  selectedIds.includes(m.id)
                    ? 'bg-orbit-cyan text-space-950 border-orbit-cyan font-bold'
                    : 'bg-space-900 border-space-border text-slate-400 hover:text-white'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        {missionsToCompare.length === 0 ? (
          <p className="text-xs text-slate-400 font-mono py-8 text-center">
            Save designs in the Mission Designer or Saved Missions page to enable side-by-side comparison.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-space-border text-slate-400">
                  <th className="py-3 px-3">METRIC / SPECIFICATION</th>
                  {missionsToCompare.map((m) => (
                    <th key={m.id} className="py-3 px-3 text-orbit-cyan font-bold">
                      {m.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border/50 text-slate-200">
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Target Destination</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 uppercase font-bold text-white">
                      {m.destination}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Chassis / Bus</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3">
                      {m.spacecraft?.bus?.name || 'Standard'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Power Source</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-amber-400 font-bold">
                      {m.spacecraft?.power?.name || 'Solar'} ({m.spacecraft?.power?.generationW} W)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Battery Storage</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-orbit-cyan">
                      {m.spacecraft?.battery?.capacityWh} Wh
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Instruments Installed</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-emerald-400">
                      {m.spacecraft?.instruments?.length || 0} Sensors
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Launch Vehicle</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3">
                      {m.launchVehicle?.name}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Budget Ceiling</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-emerald-400 font-bold">
                      {formatCurrency(m.budgetLimitUSD)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Action</td>
                  {missionsToCompare.map((m) => (
                    <td key={m.id} className="py-2.5 px-3">
                      <button
                        onClick={() => loadSavedMission(m)}
                        className="px-3 py-1 rounded bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-xs font-mono transition"
                      >
                        Load Into Designer
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
