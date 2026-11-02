import React, { useState } from 'react';
import { persistenceService } from '../services/persistenceService.js';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Moon, 
  ShieldCheck, 
  Info, 
  RotateCcw,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => persistenceService.getSettings());
  const [saveToast, setSaveToast] = useState(false);

  const handleToggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    persistenceService.saveSettings(next);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleChangeSpeed = (val) => {
    const next = { ...settings, simulationDefaultSpeed: Number(val) };
    setSettings(next);
    persistenceService.saveSettings(next);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset simulator to default settings? Saved missions will be preserved.')) {
      const def = {
        soundEnabled: false,
        highContrast: false,
        reduceMotion: false,
        simulationDefaultSpeed: 1,
        units: 'SI',
      };
      setSettings(def);
      persistenceService.saveSettings(def);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>SIMULATOR PREFERENCES & CONFIGURATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize simulation defaults, display modes, telemetry units, and review engineering disclaimers.
        </p>
      </div>

      {/* Preferences Panel */}
      <div className="space-panel p-6 space-y-5">
        <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
          Simulation & Interface Options
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Telemetry Sound Effects</span>
              <span className="text-xs text-slate-400">Audio beeps on critical phase transitions and ground station contacts</span>
            </div>
            <button
              onClick={() => handleToggle('soundEnabled')}
              className={`p-2 rounded border transition ${
                settings.soundEnabled
                  ? 'bg-orbit-cyan text-space-950 border-orbit-cyan font-bold'
                  : 'bg-space-900 border-space-border text-slate-400'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Default Simulation Speed</span>
              <span className="text-xs text-slate-400">Time acceleration multiplier when launching new missions</span>
            </div>
            <select
              value={settings.simulationDefaultSpeed || 1}
              onChange={(e) => handleChangeSpeed(e.target.value)}
              className="px-3 py-1.5 rounded bg-space-900 border border-space-border text-xs font-mono text-white focus:outline-none"
            >
              <option value="1">1x Real Time (60s / tick)</option>
              <option value="2">2x Speed (120s / tick)</option>
              <option value="5">5x Speed (300s / tick)</option>
              <option value="10">10x Speed (600s / tick)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Physical Units</span>
              <span className="text-xs text-slate-400">International System of Units (SI: km, kg, Watts, m/s)</span>
            </div>
            <span className="text-xs font-mono font-bold text-orbit-cyan px-2 py-1 rounded bg-orbit-cyan/15 border border-orbit-cyan/30">
              METRIC (SI)
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </button>

          {saveToast && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Settings Saved
            </span>
          )}
        </div>
      </div>

      {/* Official Disclaimer Panel */}
      <div className="space-panel p-6 space-y-3 border-l-4 border-l-orbit-cyan bg-space-900/40">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
          <Info className="w-4 h-4 text-orbit-cyan" />
          <span>Independent Educational Simulator Disclaimer</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ASTRAJECT is an independent educational simulation inspired by the 2026 NASA Space Apps Challenge problem
          statement titled "Space Mission Design Game." This software is not an official product of the National Aeronautics
          and Space Administration (NASA), the European Space Agency (ESA), or any commercial aerospace launch contractor.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Physical orbital mechanics calculations employ two-body spherical Keplerian approximations (v = sqrt(&mu;/r), T = 2&pi; sqrt(r&sup3;/&mu;))
          and ideal Tsiolkovsky delta-V budgets. Advanced physical perturbations such as atmospheric drag decay, non-spherical J2 geopotential harmonics,
          and solar radiation pressure are simplified for educational accessibility.
        </p>
      </div>
    </div>
  );
}
