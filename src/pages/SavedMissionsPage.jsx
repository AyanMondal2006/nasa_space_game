
import React, { useRef, useState } from 'react';
import { useMission } from '../state/MissionContext.jsx';

import {
  FolderArchive,
  Plus,
  Upload,
  Download,
  Trash2,
  Copy,
  Layers,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function SavedMissionsPage() {
  const {
    savedMissions,
    loadSavedMission,
    deleteSavedMission,
    duplicateSavedMission,
    saveCurrentMission,
    currentMission,
    importMissionJSON,
    exportCurrentMission,
  } = useMission();

  const fileInputRef = useRef(null);

  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [operationNotice, setOperationNotice] = useState(null);

  const showNotice = (type, message) => {
    setOperationNotice({ type, message });
  };

  // --------------------------------------------------
  // SAVE CURRENT MISSION
  // --------------------------------------------------

  const handleSaveCurrent = () => {
    const result = saveCurrentMission();

    if (!result?.success) {
      showNotice(
        'error',
        result?.error || 'Mission could not be saved.'
      );
      return;
    }

    showNotice(
      'success',
      result.message || 'Mission saved successfully.'
    );
  };

  // --------------------------------------------------
  // LOAD SAVED MISSION
  // --------------------------------------------------

  const handleLoadMission = (mission) => {
    const result = loadSavedMission(mission);

    if (!result?.success) {
      showNotice(
        'error',
        result?.error || 'Mission could not be loaded.'
      );
      return;
    }

    if (!result.persisted) {
      showNotice(
        'warning',
        result.error ||
          'Mission loaded for this session, but the active draft could not be persisted.'
      );
      return;
    }

    showNotice(
      'success',
      `"${mission.title}" loaded into Mission Designer.`
    );
  };

  // --------------------------------------------------
  // DUPLICATE SAVED MISSION
  // --------------------------------------------------

  const handleDuplicateMission = (missionId) => {
    const duplicated = duplicateSavedMission(missionId);

    if (!duplicated) {
      showNotice(
        'error',
        'Mission duplication failed. Check browser storage and try again.'
      );
      return;
    }

    showNotice(
      'success',
      `"${duplicated.title}" created successfully.`
    );
  };

  // --------------------------------------------------
  // DELETE SAVED MISSION
  // --------------------------------------------------

  const handleDeleteMission = (missionId) => {
    const result = deleteSavedMission(missionId);

    if (!result?.success) {
      showNotice(
        'error',
        result?.error || 'Mission could not be deleted.'
      );
      return;
    }

    showNotice(
      'success',
      result.message || 'Mission deleted successfully.'
    );
  };

  // --------------------------------------------------
  // IMPORT MISSION JSON
  // --------------------------------------------------

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setOperationNotice(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;

      const result = importMissionJSON(
        typeof content === 'string' ? content : ''
      );

      if (result.success) {
        setImportSuccess(true);
        setImportError(null);

        showNotice(
          'success',
          result.message || 'Mission imported successfully.'
        );

        setTimeout(() => {
          setImportSuccess(false);
        }, 3000);

      } else {
        setImportSuccess(false);

        setImportError(
          result.error || 'Failed to import JSON file.'
        );

        showNotice(
          'error',
          result.error || 'Failed to import JSON file.'
        );
      }
    };

    reader.onerror = () => {
      const message =
        'Unable to read the selected file. Please try another JSON file.';

      setImportError(message);
      setImportSuccess(false);
      showNotice('error', message);
    };

    reader.readAsText(file);

    // Allow the same file to be selected again.
    e.target.value = '';
  };

  // --------------------------------------------------
  // EXPORT ACTIVE MISSION
  // --------------------------------------------------

  const handleExportCurrent = () => {
    const result = exportCurrentMission();

    if (!result?.success) {
      showNotice(
        'error',
        result?.error || 'Mission export could not be started.'
      );
      return;
    }

    showNotice(
      'success',
      result.message || 'Mission export initiated.'
    );
  };

  return (
    <div className="space-y-6 pb-16">

      {/* HEADER */}
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
            Manage your persistent spacecraft configurations.
            Duplicate designs for iterative optimization,
            export to validated JSON, or import shared aerospace architectures.
          </p>
        </div>

        {/* IMPORT / EXPORT / SAVE ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
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
            onClick={handleExportCurrent}
            disabled={!currentMission}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-orbit-cyan" />
            <span>Export Active</span>
          </button>

          <button
            onClick={handleSaveCurrent}
            disabled={!currentMission}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-orbit-cyan text-space-950 text-xs font-mono font-bold hover:bg-sky-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Save Current Draft</span>
          </button>

        </div>
      </div>

      {/* OPERATION NOTIFICATIONS */}
      {operationNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            operationNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : operationNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {operationNotice.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}

          <span>{operationNotice.message}</span>
        </div>
      )}

      {/* IMPORT SUCCESS */}
      {importSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />

          <span>
            Mission JSON imported and loaded into active workspace!
          </span>
        </div>
      )}

      {/* IMPORT ERROR */}
      {importError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />

          <span>Import Failed: {importError}</span>
        </div>
      )}

      {/* SAVED MISSIONS GRID */}
      {savedMissions.length === 0 ? (

        <div className="space-panel p-12 text-center space-y-3 max-w-lg mx-auto my-8">

          <Layers className="w-10 h-10 text-slate-500 mx-auto" />

          <h3 className="font-mono font-bold text-base text-white">
            No Saved Missions Yet
          </h3>

          <p className="text-xs text-slate-400">
            Click "Save Current Draft" above to archive your
            current mission configuration for future comparison
            and simulation.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {savedMissions.map((mission) => {

            const isCurrentlyActive =
              currentMission?.id === mission.id;

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
                    <h3 className="font-mono font-bold text-base text-white">
                      {mission.title}
                    </h3>

                    <span className="text-xs text-orbit-cyan font-mono">
                      {mission.scenarioId || 'Custom'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-space-border/50 text-xs font-mono space-y-1 text-slate-400">

                    <div className="flex justify-between gap-3">
                      <span>Bus Chassis:</span>

                      <span className="text-slate-200 text-right">
                        {mission.spacecraft?.bus?.name || 'Standard'}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Power Array:</span>

                      <span className="text-amber-400 text-right">
                        {mission.spacecraft?.power?.name || 'Solar'}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Instruments:</span>

                      <span className="text-emerald-400 text-right">
                        {mission.spacecraft?.instruments?.length || 0} Sensors
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Launch Vehicle:</span>

                      <span className="text-slate-200 text-right">
                        {mission.launchVehicle?.name || 'Not selected'}
                      </span>
                    </div>

                  </div>

                </div>

                {/* MISSION ACTIONS */}
                <div className="pt-4 mt-3 border-t border-space-border/50 flex items-center justify-between gap-2">

                  <button
                    onClick={() => handleLoadMission(mission)}
                    className="flex-1 py-1.5 rounded bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-xs font-mono font-bold text-slate-200 transition"
                  >
                    Load Design
                  </button>

                  <button
                    onClick={() => handleDuplicateMission(mission.id)}
                    className="p-2 rounded bg-space-900 hover:bg-space-800 text-slate-400 hover:text-white border border-space-border"
                    title="Duplicate Mission"
                    aria-label={`Duplicate ${mission.title}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteMission(mission.id)}
                    className="p-2 rounded bg-space-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-space-border"
                    title="Delete Mission"
                    aria-label={`Delete ${mission.title}`}
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
