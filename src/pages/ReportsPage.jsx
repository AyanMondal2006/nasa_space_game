import React, { useRef } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { exportService } from '../services/exportService.js';
import { 
  FileText, 
  Download, 
  Printer, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Layers, 
  Zap, 
  Database,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatCurrency, formatMass, formatPower, formatMET, formatDataSize } from '../utils/formatters.js';

export default function ReportsPage() {
  const { currentMission, simState, completedReports, setActiveTab } = useMission();
  const printRef = useRef(null);

  // If simulation has score, use live state; else use most recent report from history
  const activeReport = simState?.score ? {
    missionTitle: currentMission?.title,
    scenarioId: currentMission?.scenarioId,
    destination: currentMission?.destination,
    status: simState.status,
    score: simState.score,
    telemetryHistory: simState.telemetryHistory,
    events: simState.events,
    totalCollectedGB: ((simState.totalDataCollectedMB || 0) / 1024).toFixed(2),
    totalDownlinkedGB: ((simState.totalDataDownlinkedMB || 0) / 1024).toFixed(2),
    finalMET: simState.missionTimeSeconds,
    completedAt: new Date().toISOString(),
  } : (completedReports[0] || null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!activeReport) return;
    exportService.exportTelemetryCSV(activeReport.telemetryHistory, activeReport.missionTitle);
  };

  const handleExportJSON = () => {
    if (!currentMission) return;
    exportService.exportMissionJSON(currentMission);
  };

  if (!activeReport) {
    return (
      <div className="space-panel p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <FileText className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold font-mono text-white">No Mission Debrief Available</h2>
        <p className="text-sm text-slate-400">
          Run your mission in Mission Control to completion to generate detailed flight analytics,
          objective evaluations, and lessons learned.
        </p>
        <button
          onClick={() => setActiveTab('control')}
          className="px-5 py-2.5 rounded bg-orbit-cyan text-space-950 font-mono text-xs font-bold hover:bg-sky-300 transition"
        >
          Go to Mission Control
        </button>
      </div>
    );
  }

  const { score, metricsSummary, achievements, designMistakes, recommendations } = activeReport.score || {};

  // Scoring chart data
  const scoreData = [
    { name: 'Objectives', value: activeReport.score?.breakdown?.primaryObjectives || 0, max: 35, color: '#38bdf8' },
    { name: 'Science', value: activeReport.score?.breakdown?.scienceValue || 0, max: 15, color: '#10b981' },
    { name: 'Resources', value: activeReport.score?.breakdown?.resourceEfficiency || 0, max: 15, color: '#f59e0b' },
    { name: 'Budget', value: activeReport.score?.breakdown?.budgetPerformance || 0, max: 10, color: '#a855f7' },
    { name: 'Downlink', value: activeReport.score?.breakdown?.dataDownlink || 0, max: 10, color: '#3b82f6' },
    { name: 'Reliability', value: activeReport.score?.breakdown?.reliability || 0, max: 10, color: '#ec4899' },
    { name: 'Margin', value: activeReport.score?.breakdown?.designMargin || 0, max: 5, color: '#14b8a6' },
  ];

  return (
    <div className="space-y-6 pb-16 print:bg-white print:text-black" ref={printRef}>
      {/* Top Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>POST-FLIGHT MISSION REPORT & DEBRIEF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {activeReport.missionTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white"
            title="Download Telemetry as CSV"
          >
            <Download className="w-3.5 h-3.5 text-orbit-cyan" />
            <span>Telemetry CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white"
            title="Export Mission Design as JSON"
          >
            <Download className="w-3.5 h-3.5 text-orbit-cyan" />
            <span>Mission JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-orbit-cyan text-space-950 text-xs font-mono font-bold hover:bg-sky-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Flight Score & Grade Hero Banner */}
      <div className="space-panel p-6 bg-space-900/90 border-orbit-cyan/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orbit-cyan/20 to-blue-600/30 border-2 border-orbit-cyan flex flex-col items-center justify-center shrink-0 shadow-glow-cyan">
            <span className="text-[10px] font-mono font-bold text-orbit-cyan uppercase">GRADE</span>
            <span className="text-3xl font-black font-mono text-white">{activeReport.score?.grade || 'A'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              FINAL MISSION EVALUATION SCORE
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-center gap-3">
              <span>{activeReport.score?.finalScore || 0} / 100</span>
              <span className={`text-xs px-2.5 py-0.5 rounded font-sans font-bold uppercase ${
                activeReport.score?.isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {activeReport.score?.isSuccess ? 'MISSION SUCCESS' : 'FAILED OBJECTIVES'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Completed at {formatMET(activeReport.finalMET || 0)} across {activeReport.destination?.toUpperCase()} trajectory.
            </p>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono shrink-0">
          <div className="p-2.5 rounded bg-space-950 border border-space-border">
            <span className="text-[10px] text-slate-500 block">SCIENCE COLLECTED</span>
            <span className="text-orbit-cyan font-bold text-sm">{activeReport.totalCollectedGB} GB</span>
          </div>
          <div className="p-2.5 rounded bg-space-950 border border-space-border">
            <span className="text-[10px] text-slate-500 block">DATA DOWNLINKED</span>
            <span className="text-emerald-400 font-bold text-sm">{activeReport.totalDownlinkedGB} GB</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown Bar Chart */}
      <div className="space-panel p-5 space-y-3">
        <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
          Scoring Component Breakdown
        </h3>
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.1)" />
              <XAxis type="number" domain={[0, 35]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#060d1f', borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: '0.375rem', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {scoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engineering Lessons Learned & Post-Mission Optimizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Achievements */}
        <div className="space-panel p-5 space-y-3 border-l-4 border-l-emerald-400">
          <h3 className="font-mono font-bold text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Key Engineering Achievements
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(achievements || ['Completed planned simulation timeline nominal execution']).map((ach, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Design Mistakes & Recommendations */}
        <div className="space-panel p-5 space-y-3 border-l-4 border-l-amber-400">
          <h3 className="font-mono font-bold text-sm text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Recommended Optimizations for Next Flight
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(recommendations || ['Maintain current operational margins for extended mission phase']).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Replay or Duplicate Action */}
      <div className="flex justify-end gap-3 print:hidden">
        <button
          onClick={() => setActiveTab('comparison')}
          className="px-5 py-2.5 rounded bg-space-850 hover:bg-space-800 border border-space-border text-slate-200 font-mono text-xs transition"
        >
          Compare with Previous Missions
        </button>
        <button
          onClick={() => setActiveTab('designer')}
          className="flex items-center gap-2 px-5 py-2.5 rounded bg-orbit-cyan text-space-950 font-mono text-xs font-bold hover:bg-sky-300 transition shadow-glow-cyan"
        >
          <span>Optimize Mission in Designer</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
