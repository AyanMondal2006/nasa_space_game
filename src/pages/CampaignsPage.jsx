import React, { useState } from 'react';

import { useMission } from '../state/MissionContext.jsx';
import { MISSION_CAMPAIGNS } from '../data/missions.js';

import {
  applyDifficultyToObjectives,
  GAMEPLAY_DIFFICULTY,
  GAMEPLAY_DIFFICULTY_OPTIONS,
} from '../data/difficultyProfiles.js';

import {
  Target,
  CheckCircle2,
  Play,
  DollarSign,
  Clock,
} from 'lucide-react';

import { formatCurrency } from '../utils/formatters.js';

export default function CampaignsPage() {
  const {
    loadCampaign,
    currentMission,
  } = useMission();

  const [gameplayDifficulty, setGameplayDifficulty] = useState(
    GAMEPLAY_DIFFICULTY.STANDARD
  );

  const selectedDifficultyInfo =
    GAMEPLAY_DIFFICULTY_OPTIONS.find(
      (option) => option.value === gameplayDifficulty
    ) || GAMEPLAY_DIFFICULTY_OPTIONS[1];

  return (
    <div className="space-y-6 pb-12">

      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Target className="w-3.5 h-3.5" />
          <span>MISSION CAMPAIGNS & OPERATIONAL SCENARIOS</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Select a Mission Campaign
        </h1>

        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Each scenario presents unique astrodynamics, payload requirements,
          and environmental challenges. Select a campaign and gameplay
          difficulty to initialize your mission.
        </p>
      </div>

      {/* Gameplay Difficulty Selector */}
      <div className="space-panel p-5 border border-orbit-cyan/30 bg-space-900/80">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orbit-cyan" />

              <h2 className="text-sm font-bold text-white font-mono uppercase">
                Gameplay Difficulty
              </h2>
            </div>

            <p className="text-xs text-slate-400 max-w-2xl">
              Select how demanding the mission objectives should be.
              This changes supported objective targets, not the spacecraft's
              physical specifications or orbital mechanics.
            </p>
          </div>

          <div className="w-full md:w-64 shrink-0">
            <label
              htmlFor="gameplay-difficulty"
              className="block text-[10px] text-slate-500 font-mono mb-1.5 uppercase"
            >
              Select Difficulty Mode
            </label>

            <select
              id="gameplay-difficulty"
              value={gameplayDifficulty}
              onChange={(event) =>
                setGameplayDifficulty(event.target.value)
              }
              className="w-full px-3 py-2.5 rounded-lg bg-space-950 border border-orbit-cyan/40 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orbit-cyan/40"
            >
              {GAMEPLAY_DIFFICULTY_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-space-950 text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-4 p-3 rounded-lg bg-space-950/70 border border-space-border">
          <span className="text-xs font-mono font-bold text-orbit-cyan">
            {selectedDifficultyInfo.label.toUpperCase()} MODE
          </span>

          <p className="text-xs text-slate-300 mt-1">
            {selectedDifficultyInfo.description}
          </p>
        </div>

      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {MISSION_CAMPAIGNS.map((campaign) => {

          const isCurrentlyActive =
            currentMission?.scenarioId === campaign.scenarioId;

          // Generate a separate difficulty-adjusted objective preview.
          // The original campaign definition is never modified.
          const displayedObjectives = applyDifficultyToObjectives(
            campaign.objectives,
            gameplayDifficulty
          );

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

                {/* Campaign Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">

                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-space-800 text-slate-300 border border-space-border uppercase">
                    {campaign.category}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">

                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Dest:{' '}
                      <span className="text-orbit-cyan">
                        {campaign.destination}
                      </span>
                    </span>

                    {/* Original campaign difficulty */}
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        campaign.difficultyColor === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : campaign.difficultyColor === 'amber'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : campaign.difficultyColor === 'crimson'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      Campaign: {campaign.difficulty}
                    </span>

                  </div>
                </div>

                {/* Campaign Title */}
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    {campaign.title}
                  </h3>

                  <p className="text-xs text-orbit-cyan font-mono mt-0.5">
                    {campaign.tagline}
                  </p>
                </div>

                {/* Campaign Story */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {campaign.story}
                </p>

                {/* Mission Constraints */}
                <div className="p-3 rounded-lg bg-space-950/70 border border-space-border grid grid-cols-2 gap-3 text-xs font-mono">

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />

                    <div>
                      <span className="text-[10px] text-slate-500 block">
                        BUDGET CEILING
                      </span>

                      <span className="text-slate-200 font-bold">
                        {formatCurrency(campaign.budgetLimitUSD)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />

                    <div>
                      <span className="text-[10px] text-slate-500 block">
                        MISSION LIFETIME
                      </span>

                      <span className="text-slate-200 font-bold">
                        {campaign.durationDays} Days
                      </span>
                    </div>
                  </div>

                </div>

                {/* Difficulty-Adjusted Objectives */}
                <div className="space-y-2">

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Mission Success Criteria
                    </span>

                    <span className="text-[10px] font-mono font-bold text-orbit-cyan px-2 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30">
                      {gameplayDifficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">

                    {displayedObjectives.map((obj) => (

                      <div
                        key={obj.id}
                        className="flex items-start gap-2 text-xs text-slate-300"
                      >

                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            obj.isPrimary
                              ? 'text-orbit-cyan'
                              : 'text-slate-500'
                          }`}
                        />

                        <div className="min-w-0">

                          <div>
                            <strong className="text-slate-200">
                              {obj.title}
                            </strong>

                            {obj.description && (
                              <span className="text-slate-400">
                                {' '}
                                {obj.description}
                              </span>
                            )}
                          </div>

                          {obj.difficultyTargetLabel && (
                            <p className="text-[10px] text-orbit-cyan font-mono mt-1">
                              {obj.difficultyTargetLabel}
                            </p>
                          )}

                        </div>
                      </div>

                    ))}

                  </div>
                </div>

              </div>

              {/* Campaign Launch */}
              <div className="pt-5 mt-4 border-t border-space-border/60 flex items-center gap-3">

                <button
                  onClick={() =>
                    loadCampaign(campaign.id, gameplayDifficulty)
                  }
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