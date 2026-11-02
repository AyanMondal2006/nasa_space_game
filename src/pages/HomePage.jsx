import React from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { MISSION_CAMPAIGNS } from '../data/missions.js';
import { 
  Rocket, 
  Orbit, 
  ArrowRight, 
  Play, 
  Award, 
  ShieldCheck, 
  Layers, 
  Zap, 
  DollarSign, 
  Weight, 
  Database, 
  Radio, 
  Clock, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';
import SpaceVisualization3D from '../components/visualization/SpaceVisualization3D.jsx';
import { formatCurrency, formatMass } from '../utils/formatters.js';

export default function HomePage() {
  const { 
    currentMission, 
    setActiveTab, 
    loadCampaign, 
    completedReports, 
    savedMissions 
  } = useMission();

  // Find personal best score
  const personalBest = completedReports.length > 0 
    ? Math.max(...completedReports.map(r => r.score?.finalScore || 0))
    : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-space-border bg-gradient-to-br from-space-900 via-space-950 to-space-900 p-6 md:p-10 shadow-2xl">
        <div className="absolute inset-0 telemetry-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA SPACE APPS CHALLENGE — MISSION ARCHITECTURE SIMULATOR</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Design the Mission. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orbit-cyan via-blue-400 to-indigo-400">
                Engineer the Future.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              ASTRAJECT is a rigorous, interactive space mission simulator. Balance orbital mechanics,
              spacecraft subsystems, power generation, telemetry downlink, and financial constraints
              to plan and fly high-stakes planetary exploration campaigns.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('campaigns')}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-orbit-cyan text-space-950 font-mono font-bold text-sm hover:bg-sky-300 transition shadow-glow-cyan"
              >
                <Rocket className="w-4 h-4" />
                <span>Create New Mission</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {currentMission && (
                <button
                  onClick={() => setActiveTab('designer')}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg bg-space-850 hover:bg-space-800 border border-space-border text-slate-200 font-mono text-sm transition"
                >
                  <Layers className="w-4 h-4 text-orbit-cyan" />
                  <span>Continue Mission Draft</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('control')}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-space-900/80 hover:bg-space-850 border border-emerald-500/30 text-emerald-400 font-mono text-sm transition"
              >
                <Play className="w-4 h-4" />
                <span>Open Flight Console</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Orbit Preview */}
          <div className="lg:col-span-5 h-[340px] rounded-xl overflow-hidden border border-space-border shadow-2xl relative">
            <SpaceVisualization3D
              bodyId={currentMission?.destination || 'earth'}
              altitudeKm={currentMission?.orbit?.altitudeKm || 705}
              inclinationDeg={currentMission?.orbit?.inclinationDeg || 98.2}
              orbitAngleRad={1.2}
              isInEclipse={false}
              isContacting={true}
              subSatelliteCoords={{ latitude: 28.5, longitude: -80.6 }}
            />
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-space-950/80 px-2 py-0.5 rounded border border-space-border backdrop-blur">
              Real-Time Astrodynamics Render
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Personal Best Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-panel p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Personal Best Score</div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {personalBest != null ? `${personalBest} / 100` : '—'}
            </div>
          </div>
        </div>

        <div className="space-panel p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orbit-cyan/10 border border-orbit-cyan/30 flex items-center justify-center text-orbit-cyan shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Missions Flown</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              {completedReports.length}
            </div>
          </div>
        </div>

        <div className="space-panel p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Saved Designs</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              {savedMissions.length}
            </div>
          </div>
        </div>

        <div className="space-panel p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Orbit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Target Worlds</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              4 Bodies
            </div>
          </div>
        </div>
      </div>

      {/* The Six Principal Resource Constraints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orbit-cyan" />
              THE SIX RESOURCE PILLARS
            </h2>
            <p className="text-xs text-slate-400">
              In space systems engineering, every design choice impacts all six physical constraints simultaneously.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-panel p-4 space-y-2 border-l-4 border-l-orbit-cyan">
            <div className="flex items-center gap-2 text-orbit-cyan font-mono text-xs font-bold">
              <Weight className="w-4 h-4" />
              <span>1. MASS BUDGET (kg)</span>
            </div>
            <p className="text-xs text-slate-300">
              Rockets have strict payload capacity envelopes. We calculate dry structure, instruments, 20% growth margin, and Tsiolkovsky propellant mass.
            </p>
          </div>

          <div className="space-panel p-4 space-y-2 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>2. ELECTRICAL POWER (W & Wh)</span>
            </div>
            <p className="text-xs text-slate-300">
              Solar irradiance scales inversely with distance squared. Batteries must survive orbital eclipses without exceeding 70% Depth of Discharge.
            </p>
          </div>

          <div className="space-panel p-4 space-y-2 border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <DollarSign className="w-4 h-4" />
              <span>3. BUDGET CEILING ($)</span>
            </div>
            <p className="text-xs text-slate-300">
              Every satellite bus, scientific sensor, rocket contract, and daily ground operations team must fit inside the scenario's funding cap with reserve.
            </p>
          </div>

          <div className="space-panel p-4 space-y-2 border-l-4 border-l-purple-400">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
              <Database className="w-4 h-4" />
              <span>4. DATA GENERATION & STORAGE</span>
            </div>
            <p className="text-xs text-slate-300">
              High-resolution sensors collect gigabits of telemetry. Onboard solid-state memory buffers must prevent data buffer overflow between downlink passes.
            </p>
          </div>

          <div className="space-panel p-4 space-y-2 border-l-4 border-l-blue-400">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold">
              <Radio className="w-4 h-4" />
              <span>5. COMMUNICATIONS & DOWNLINK</span>
            </div>
            <p className="text-xs text-slate-300">
              Radio link budgets determine downlink Mbps based on frequency band and distance. Missed contact passes accumulate permanent science backlogs.
            </p>
          </div>

          <div className="space-panel p-4 space-y-2 border-l-4 border-l-rose-400">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>6. MISSION TIME & ORBITS</span>
            </div>
            <p className="text-xs text-slate-300">
              Orbital periods, eclipse durations, ground track revisit frequencies, and multi-year planetary transit times govern the operational timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Playable Mission Campaigns */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orbit-cyan" />
              AVAILABLE MISSION CAMPAIGNS
            </h2>
            <p className="text-xs text-slate-400">
              Select a scenario to configure requirements, configure hardware, and launch your simulation.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('campaigns')}
            className="text-xs font-mono text-orbit-cyan hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MISSION_CAMPAIGNS.slice(0, 3).map((campaign) => (
            <div
              key={campaign.id}
              className="space-panel space-panel-hover p-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-slate-300 border border-space-border uppercase">
                    {campaign.category}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    campaign.difficultyColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    campaign.difficultyColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {campaign.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-orbit-cyan transition font-mono">
                  {campaign.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {campaign.story}
                </p>

                <div className="pt-2 border-t border-space-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">BUDGET:</span>
                    <span>{formatCurrency(campaign.budgetLimitUSD)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">LIFETIME:</span>
                    <span>{campaign.durationDays} Days</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button
                  onClick={() => loadCampaign(campaign.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded bg-space-850 hover:bg-orbit-cyan hover:text-space-950 text-slate-200 font-mono text-xs font-bold transition border border-space-border group-hover:border-orbit-cyan/50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Configure Mission</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tutorial & Simulator Architecture Overview */}
      <div className="space-panel p-6 border-space-border bg-space-900/40 space-y-3">
        <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-orbit-cyan" />
          HOW ASTRAJECT OPERATES
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          ASTRAJECT integrates deterministic two-body gravitational orbital calculations, verified launch vehicle lift envelopes,
          photovoltaic solar irradiance decay, and Li-ion battery integration. When you step through the Mission Designer, every component
          choice updates the live physics engine. Blocking errors pinpoint exactly why a configuration fails and offer actionable engineering remedies.
        </p>
        <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orbit-cyan" /> Deterministic Mulberry32 PRNG</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> CODATA Physical Constants</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> AIAA Mass Margin Standards</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Free Space Path Loss Link Budget</span>
        </div>
      </div>
    </div>
  );
}
