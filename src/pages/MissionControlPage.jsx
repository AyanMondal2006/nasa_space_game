import React, { useState, useEffect, useRef } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { useTheme } from '../state/ThemeContext.jsx';
import { soundFx } from '../utils/soundEffects.js';
import SpaceVisualization3D from '../components/visualization/SpaceVisualization3D.jsx';
import CanvasErrorBoundary from '../components/common/CanvasErrorBoundary.jsx';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  Battery, 
  Zap, 
  Radio, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatMass, formatPower, formatMET, formatDataSize } from '../utils/formatters.js';

export default function MissionControlPage() {
  const { 
    currentMission, 
    simState, 
    isSimRunning, 
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    setSimulationSpeed, 
    restartSimulation, 
    setActiveTab 
  } = useMission();

  const [activeTelemetryTab, setActiveTelemetryTab] = useState('power'); // 'power' | 'battery' | 'data' | 'downlink'
  const { soundEnabled } = useTheme();
  const prevContactRef = useRef(false);
  const prevStatusRef = useRef(null);

  const state = simState || {};
  const isCompleted = state.status === 'COMPLETED';
  const isFailed = state.status === 'FAILED';
  const activeAnomalies = Array.isArray(state.activeAnomalies) ? state.activeAnomalies : [];

  // Ground Station Radio & Burn Immersion Acoustic Cues
  useEffect(() => {
    if (!soundEnabled) return;
    const contacting = Boolean(state.isContactingGroundStation);
    if (contacting && !prevContactRef.current) {
      soundFx.playQuindarIntro();
    } else if (!contacting && prevContactRef.current) {
      soundFx.playQuindarOutro();
    }
    prevContactRef.current = contacting;

    if (state.status && state.status !== prevStatusRef.current) {
      if (state.status === 'ORBIT_INSERTION') {
        soundFx.playBurnTone();
      } else if (state.status === 'FAILED') {
        soundFx.playAlertWarning();
      }
      prevStatusRef.current = state.status;
    }
  }, [state.isContactingGroundStation, state.status, soundEnabled]);

  return (
    <div className="space-y-4 pb-16">
      {/* Top Operations Control Bar */}
      <div className="space-panel p-4 flex flex-wrap items-center justify-between gap-4 bg-space-950/95 border-space-border shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orbit-cyan/15 border border-orbit-cyan/40 flex items-center justify-center text-orbit-cyan shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                FLIGHT OPERATIONS CENTER
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isFailed ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                isSimRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
                'bg-space-850 text-slate-400 border border-space-border'
              }`}>
                PHASE: {state.status || 'STANDBY'}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-orbit-cyan mt-0.5">
              {formatMET(state.missionTimeSeconds || 0)}
            </div>
          </div>
        </div>

        {/* Flight Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Speeds: 1x, 2x, 5x, 10x */}
          <div className="flex items-center bg-space-900 border border-space-border rounded-lg p-0.5 font-mono text-xs">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2.5 py-1 rounded transition ${
                  state.simulationSpeed === spd
                    ? 'bg-orbit-cyan text-space-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Start / Pause / Resume Controls */}
          {state.status === 'PRE_LAUNCH' ? (
            <button
              onClick={startSimulation}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-space-950 font-mono font-bold text-xs transition shadow-glow-emerald"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH MISSION</span>
            </button>
          ) : isSimRunning ? (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-space-950 font-mono font-bold text-xs transition"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE SIM</span>
            </button>
          ) : !isCompleted && !isFailed ? (
            <button
              onClick={resumeSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-space-950 font-mono font-bold text-xs transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME SIM</span>
            </button>
          ) : null}

          {/* Restart */}
          <button
            onClick={restartSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-space-900 hover:bg-space-850 border border-space-border text-slate-300 font-mono text-xs transition"
            title="Restart Mission from Pad"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          {/* Return to Designer */}
          <button
            onClick={() => setActiveTab('designer')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-space-900 hover:bg-space-850 border border-space-border text-slate-300 font-mono text-xs transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modify Design</span>
          </button>

          {/* View Report if completed */}
          {(isCompleted || isFailed) && (
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orbit-cyan text-space-950 font-mono font-bold text-xs transition shadow-glow-cyan"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>VIEW MISSION REPORT</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Panel | Center 3D | Right Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PANEL: Mission Status & Subsystem Health */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mission Objectives Progress */}
          <div className="space-panel p-4 space-y-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Mission Objectives
            </span>
            <div className="space-y-2.5">
              {(currentMission?.objectives || []).map((obj) => {
                const prog = state.objectivesProgress?.[obj.id] || 0;
                return (
                  <div key={obj.id} className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span className="truncate max-w-[160px]">{obj.title}</span>
                      <span className={`font-bold ${prog >= 100 ? 'text-emerald-400' : 'text-orbit-cyan'}`}>
                        {prog}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-space-950 overflow-hidden border border-space-border/60">
                      <div
                        className={`h-full transition-all duration-300 ${
                          prog >= 100 ? 'bg-emerald-400' : 'bg-orbit-cyan'
                        }`}
                        style={{ width: `${Math.min(100, prog)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subsystem Health Board */}
          <div className="space-panel p-4 space-y-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Subsystems Health Board
            </span>
            <div className="space-y-2 text-xs font-mono">
              {Object.entries(state.subsystemHealth || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-slate-300">
                  <span className="uppercase text-slate-400">{key}:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${val > 90 ? 'text-emerald-400' : val > 70 ? 'text-amber-400' : 'text-crimson'}`}>
                      {val}%
                    </span>
                    <span className={`w-2 h-2 rounded-full ${val > 90 ? 'bg-emerald-400 status-dot-emerald' : val > 70 ? 'bg-amber-400' : 'bg-rose-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Anomalies */}
          <div className="space-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-space-border/60 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Anomalies
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                activeAnomalies.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {activeAnomalies.length} ACTIVE
              </span>
            </div>

            {activeAnomalies.length === 0 ? (
              <div className="rounded-lg bg-space-950/60 border border-space-border/60 p-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  NO ACTIVE ANOMALIES
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  No temporary anomaly is currently affecting spacecraft operations.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAnomalies.map((anomaly) => {
                  const effects = anomaly.effects || {};
                  const impacts = [];

                  if (
                    Number.isFinite(effects.powerGenerationMultiplier) &&
                    effects.powerGenerationMultiplier < 1
                  ) {
                    impacts.push(
                      `Power generation reduced by ${Math.round((1 - effects.powerGenerationMultiplier) * 100)}%`
                    );
                  }

                  if (
                    Number.isFinite(effects.dataCollectionMultiplier) &&
                    effects.dataCollectionMultiplier < 1
                  ) {
                    impacts.push(
                      `Data collection reduced by ${Math.round((1 - effects.dataCollectionMultiplier) * 100)}%`
                    );
                  }

                  if (
                    Number.isFinite(effects.downlinkMultiplier) &&
                    effects.downlinkMultiplier < 1
                  ) {
                    impacts.push(
                      `Downlink reduced by ${Math.round((1 - effects.downlinkMultiplier) * 100)}%`
                    );
                  }

                  if (
                    Number.isFinite(effects.additionalPowerLoadW) &&
                    effects.additionalPowerLoadW > 0
                  ) {
                    impacts.push(
                      `Additional power load: +${effects.additionalPowerLoadW} W`
                    );
                  }

                  const remainingSeconds =
                    Number.isFinite(anomaly.expiresAtSeconds)
                      ? Math.max(
                          0,
                          anomaly.expiresAtSeconds -
                            (Number(state.missionTimeSeconds) || 0)
                        )
                      : null;

                  const appliedHealthImpact =
                    Number.isFinite(anomaly.appliedHealthImpact)
                      ? anomaly.appliedHealthImpact
                      : 0;

                  return (
                    <div
                      key={anomaly.id}
                      className="rounded-lg bg-amber-950/20 border border-amber-500/30 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {anomaly.title || anomaly.id}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            SUBSYSTEM: {anomaly.subsystem?.toUpperCase() || 'UNKNOWN'}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 shrink-0">
                          WARNING
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {anomaly.message || 'Temporary spacecraft anomaly detected.'}
                      </p>

                      <div className="rounded bg-space-950/70 border border-space-border/60 p-2 space-y-1.5">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                          Operational Impact
                        </div>
                        {impacts.length > 0 ? (
                          impacts.map((impact, index) => (
                            <div
                              key={`${anomaly.id}-impact-${index}`}
                              className="text-[10px] font-mono text-amber-300"
                            >
                              • {impact}
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            No operational effect details available.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-space-950/60 rounded p-2">
                          <span className="text-slate-500 block">TIME REMAINING</span>
                          <span className="text-amber-300 font-bold">
                            {remainingSeconds === null
                              ? 'UNKNOWN'
                              : formatMET(remainingSeconds)}
                          </span>
                        </div>
                        <div className="bg-space-950/60 rounded p-2">
                          <span className="text-slate-500 block">HEALTH IMPACT</span>
                          <span className="text-rose-300 font-bold">
                            -{appliedHealthImpact} POINTS
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 border-t border-space-border/50 pt-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        AUTO-RECOVERY ARMED
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-[9px] font-mono text-slate-500">
              Historical triggers and recovery confirmations are recorded in Mission Events Log.
            </div>
          </div>
        </div>

        {/* CENTER: 3D Animated Orbital Spacecraft Track */}
        <div className="lg:col-span-6 h-[460px] rounded-xl overflow-hidden border border-space-border relative shadow-2xl">
          <CanvasErrorBoundary>
            <SpaceVisualization3D
              bodyId={currentMission?.destination || 'earth'}
              altitudeKm={currentMission?.orbit?.altitudeKm || 500}
              inclinationDeg={currentMission?.orbit?.inclinationDeg || 45}
              orbitAngleRad={state.orbitAngleRad || 0}
              isInEclipse={state.isInEclipse || false}
              isContacting={state.isContactingGroundStation || false}
              subSatelliteCoords={{ latitude: state.latitude || 0, longitude: state.longitude || 0 }}
            />
          </CanvasErrorBoundary>
        </div>

        {/* RIGHT PANEL: Live Telemetry Gauges */}
        <div className="lg:col-span-3 space-y-4">
          {/* Battery State Gauge */}
          <div className="space-panel p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 uppercase">
                <Battery className="w-4 h-4 text-emerald-400" /> Battery Charge
              </span>
              <span className={`font-bold text-sm ${
                (state.batteryPercent || 100) > 40 ? 'text-emerald-400' : 'text-crimson animate-pulse'
              }`}>
                {(state.batteryPercent || 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-space-950 overflow-hidden border border-space-border p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  (state.batteryPercent || 100) > 60 ? 'bg-emerald-400' : (state.batteryPercent || 100) > 30 ? 'bg-amber-400' : 'bg-crimson'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, state.batteryPercent || 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>{state.batteryEnergyWh?.toFixed(0)} Wh</span>
              <span>Capacity: {state.batteryCapacityWh?.toFixed(0)} Wh</span>
            </div>
          </div>

          {/* Power Balance Gauge */}
          <div className="space-panel p-4 space-y-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 uppercase">
              <Zap className="w-4 h-4 text-amber-400" /> Power Generation vs Load
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">SOLAR GEN</span>
                <span className="text-amber-400 font-bold text-sm">
                  {formatPower(state.currentPowerGenerationW || 0)}
                </span>
              </div>
              <div className="p-2 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">ACTIVE LOAD</span>
                <span className="text-slate-200 font-bold text-sm">
                  {formatPower(state.currentPowerConsumptionW || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Data Buffer & Downlink */}
          <div className="space-panel p-4 space-y-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 uppercase">
              <Database className="w-4 h-4 text-purple-400" /> Onboard Data Buffer
            </span>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">Buffer Occupied:</span>
              <span className="text-purple-400 font-bold">
                {formatDataSize(state.onboardStoredDataMB || 0)} / {((state.maxStorageMB || 1024) / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden border border-space-border">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(100, ((state.onboardStoredDataMB || 0) / (state.maxStorageMB || 1)) * 100)}%` }}
              />
            </div>
            <div className="pt-2 border-t border-space-border/50 text-[11px] text-slate-400 flex justify-between">
              <span>Total Downlinked:</span>
              <span className="text-emerald-400 font-bold">
                {((state.totalDataDownlinkedMB || 0) / 1024).toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: Live Recharts Curves & Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Telemetry Charts (7 Cols) */}
        <div className="lg:col-span-7 space-panel p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border/60 pb-2">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orbit-cyan" /> Live Flight Telemetry Curves
            </span>
            <div className="flex gap-1">
              {[
                { id: 'power', label: 'Power (W)' },
                { id: 'battery', label: 'Battery (%)' },
                { id: 'data', label: 'Stored (MB)' },
                { id: 'downlink', label: 'Downlink (Mbps)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTelemetryTab(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                    activeTelemetryTab === tab.id
                      ? 'bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/40 font-bold'
                      : 'text-slate-400 hover:text-white bg-space-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.telemetryHistory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.1)" />
                <XAxis dataKey="timeFormatted" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#060d1f', borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: '0.375rem', fontSize: '11px', color: '#fff' }}
                />
                {activeTelemetryTab === 'power' && (
                  <>
                    <Line type="monotone" dataKey="powerGenerationW" name="Solar Gen (W)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="powerConsumptionW" name="Load (W)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </>
                )}
                {activeTelemetryTab === 'battery' && (
                  <Line type="monotone" dataKey="batteryPercent" name="Battery (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                )}
                {activeTelemetryTab === 'data' && (
                  <Line type="monotone" dataKey="storedDataMB" name="Stored Buffer (MB)" stroke="#a855f7" strokeWidth={2} dot={false} />
                )}
                {activeTelemetryTab === 'downlink' && (
                  <Line type="monotone" dataKey="downlinkMbps" name="Throughput (Mbps)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mission Event Log (5 Cols) */}
        <div className="lg:col-span-5 space-panel p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-space-border/60 pb-2">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orbit-cyan" /> Mission Events Log
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {(state.events || []).length} Recorded
            </span>
          </div>

          <div className="flex-1 max-h-48 overflow-y-auto space-y-2 pr-1">
            {(state.events || []).map((evt) => (
              <div
                key={evt.id}
                className={`p-2 rounded text-xs font-mono flex items-start gap-2 border ${
                  evt.severity === 'CRITICAL' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' :
                  evt.severity === 'WARNING' ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' :
                  evt.severity === 'SUCCESS' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
                  evt.severity === 'MILESTONE' ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' :
                  'bg-space-950/60 border-space-border/60 text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-500 shrink-0 font-bold">{evt.timeFormatted}</span>
                <span className="text-[10px] font-bold uppercase px-1 rounded bg-space-900 shrink-0">
                  {evt.category}
                </span>
                <span className="text-[11px] leading-tight">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
