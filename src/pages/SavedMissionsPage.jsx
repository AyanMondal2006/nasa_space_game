import React, { useRef, useState } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { 
  FolderArchive, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  Play, 
  Layers, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Check
} from 'lucide-react';
import { formatCurrency, formatMass } from '../utils/formatters.js';

export default function SavedMissionsPage() {
  const { 
    savedMissions, 
    loadSavedMission, 
    deleteSavedMission, 
    duplicateSavedMission, 
    saveCurrentMission, 
    currentMission, 
    setActiveTab, 
    importMissionJSON, 
    exportCurrentMission 
  } = useMission();

  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = importMissionJSON(content);
      if (res.success) {
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError(res.error || 'Failed to import JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>LOCAL MISSION REPOSITORY & PERSISTENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            Saved Missions
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Manage your persistent spacecraft configurations. Duplicate designs for iterative optimization,
            export to validated JSON, or import shared aerospace architectures.
          </p>
        </div>

        {/* Import / Export / Save Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white"
          >
            <Upload className="w-3.5 h-3.5 text-orbit-cyan" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={exportCurrentMission}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white"
          >
            <Download className="w-3.5 h-3.5 text-orbit-cyan" />
            <span>Export Active</span>
          </button>

          <button
            onClick={saveCurrentMission}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-orbit-cyan text-space-950 text-xs font-mono font-bold hover:bg-sky-300 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Save Current Draft</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {importSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Mission JSON imported and loaded into active workspace!</span>
        </div>
      )}

      {importError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Import Failed: {importError}</span>
        </div>
      )}

      {/* Saved Missions Grid */}
      {savedMissions.length === 0 ? (
        <div className="space-panel p-12 text-center space-y-3 max-w-lg mx-auto my-8">
          <Layers className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-mono font-bold text-base text-white">No Saved Missions Yet</h3>
          <p className="text-xs text-slate-400">
            Click "Save Current Draft" above to archive your current mission configuration for future comparison and simulation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedMissions.map((mission) => {
            const isCurrentlyActive = currentMission?.id === mission.id;

            return (
              <div
                key={mission.id}
                className={`space-panel p-5 flex flex-col justify-between transition border-2 ${
                  isCurrentlyActive
                    ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20'
                    : 'border-space-border bg-space-900/60 hover:border-slate-500'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-slate-300 uppercase">
                      Dest: {mission.destination}
                    </span>
                    {mission.savedAt && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(mission.savedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-mono font-bold text-base text-white">{mission.title}</h3>
                    <span className="text-xs text-orbit-cyan font-mono">{mission.scenarioId || 'Custom'}</span>
                  </div>

                  <div className="pt-2 border-t border-space-border/50 text-xs font-mono space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Bus Chassis:</span>
                      <span className="text-slate-200">{mission.spacecraft?.bus?.name || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Array:</span>
                      <span className="text-amber-400">{mission.spacecraft?.power?.name || 'Solar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instruments:</span>
                      <span className="text-emerald-400">{mission.spacecraft?.instruments?.length || 0} Sensors</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Launch Vehicle:</span>
                      <span className="text-slate-200">{mission.launchVehicle?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-space-border/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => loadSavedMission(mission)}
                    className="flex-1 py-1.5 rounded bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-xs font-mono font-bold text-slate-200 transition"
                  >
                    Load Design
                  </button>

                  <button
                    onClick={() => duplicateSavedMission(mission.id)}
                    className="p-2 rounded bg-space-900 hover:bg-space-800 text-slate-400 hover:text-white border border-space-border"
                    title="Duplicate Mission"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteSavedMission(mission.id)}
                    className="p-2 rounded bg-space-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-space-border"
                    title="Delete Mission"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
