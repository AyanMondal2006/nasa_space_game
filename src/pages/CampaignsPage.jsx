import React from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { MISSION_CAMPAIGNS } from '../data/missions.js';
import { 
  Rocket, 
  Orbit, 
  CheckCircle2, 
  Play, 
  DollarSign, 
  Clock, 
  Target, 
  Layers, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function CampaignsPage() {
  const { loadCampaign, currentMission, setActiveTab } = useMission();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Target className="w-3.5 h-3.5" />
          <span>MISSION CAMPAIGNS & OPERATIONAL SCENARIOS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Select a Mission Campaign
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Each scenario presents unique astrodynamics, payload requirements, and environmental challenges.
          Select a campaign below to initialize engineering constraints and start your design.
        </p>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MISSION_CAMPAIGNS.map((campaign) => {
          const isCurrentlyActive = currentMission?.scenarioId === campaign.scenarioId;

          return (
            <div
              key={campaign.id}
              className={`space-panel p-6 flex flex-col justify-between transition border-2 ${
                isCurrentlyActive
                  ? 'border-orbit-cyan bg-space-900/90 shadow-glow-cyan/30'
                  : 'border-space-border/80 hover:border-orbit-cyan/40 bg-space-900/50'
              }`}
            >
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-space-800 text-slate-300 border border-space-border uppercase">
                    {campaign.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Dest: <span className="text-orbit-cyan">{campaign.destination}</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      campaign.difficultyColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      campaign.difficultyColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      campaign.difficultyColor === 'crimson' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {campaign.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    {campaign.title}
                  </h3>
                  <p className="text-xs text-orbit-cyan font-mono mt-0.5">
                    {campaign.tagline}
                  </p>
                </div>

                {/* Story */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {campaign.story}
                </p>

                {/* Constraints bar */}
                <div className="p-3 rounded-lg bg-space-950/70 border border-space-border grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">BUDGET CEILING</span>
                      <span className="text-slate-200 font-bold">{formatCurrency(campaign.budgetLimitUSD)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">MISSION LIFETIME</span>
                      <span className="text-slate-200 font-bold">{campaign.durationDays} Days</span>
                    </div>
                  </div>
                </div>

                {/* Mission Objectives Checklist */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Key Success Criteria:
                  </span>
                  <div className="space-y-1.5">
                    {campaign.objectives.map((obj) => (
                      <div key={obj.id} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${obj.isPrimary ? 'text-orbit-cyan' : 'text-slate-500'}`} />
                        <span>
                          <strong className="text-slate-200">{obj.title}:</strong> {obj.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-space-border/60 flex items-center gap-3">
                <button
                  onClick={() => loadCampaign(campaign.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orbit-cyan text-space-950 font-mono text-xs font-bold hover:bg-sky-300 transition shadow-glow-cyan"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Campaign in Designer</span>
                </button>

                {isCurrentlyActive && (
                  <span className="text-[11px] font-mono text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                    Active Draft
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
