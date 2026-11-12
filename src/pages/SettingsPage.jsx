import React, { useState } from 'react';
import { persistenceService } from '../services/persistenceService.js';
import { useTheme } from '../state/ThemeContext.jsx';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Palette, 
  Info, 
  RotateCcw,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => persistenceService.getSettings());
  const [saveToast, setSaveToast] = useState(false);
  const { theme, setTheme, themes, soundEnabled, setSoundEnabled, playUiSound } = useTheme();

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setSettings(prev => ({ ...prev, soundEnabled: next }));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleChangeSpeed = (val) => {
    playUiSound('click');
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
      setSoundEnabled(false);
      setTheme('cyber');
      persistenceService.saveSettings(def);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>SIMULATOR PREFERENCES & CONFIGURATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Console Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize simulation defaults, visual theme styles, sound telemetry, and review orbital physics disclaimers.
        </p>
      </div>

      {/* Theme Selection Section */}
      <div className="space-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-orbit-cyan" />
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              Mission Console Themes
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current: <span className="text-orbit-cyan font-bold uppercase">{theme}</span>
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Select an aerospace color scheme for HUD overlays, telemetry graphs, glowing borders, and navigation indicators.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-space-850/90 border-orbit-cyan shadow-glow-cyan'
                    : 'bg-space-900/60 border-space-border hover:border-slate-500 hover:bg-space-850/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white leading-none">
                        {t.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block">
                        {t.badge}
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="px-1.5 py-0.5 rounded bg-orbit-cyan text-space-950 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : null}
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {t.description}
                </p>

                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className="h-1.5 flex-1 rounded-full"
                    style={{ backgroundColor: t.accentColor }}
                  />
                  <span
                    className="h-1.5 flex-1 rounded-full opacity-60"
                    style={{ backgroundColor: t.secondaryColor }}
                  />
                  <span className="h-1.5 w-4 rounded-full bg-slate-700" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferences Panel */}
      <div className="space-panel p-6 space-y-5">
        <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
          Simulation & Audio Options
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Telemetry Sound Effects</span>
              <span className="text-xs text-slate-400">Synthesized audio clicks & beeps on telemetry updates, navigation, and saves</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded border transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-orbit-cyan text-space-950 border-orbit-cyan font-bold shadow-glow-cyan'
                  : 'bg-space-900 border-space-border text-slate-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-xs font-mono font-bold hidden sm:inline">
                {soundEnabled ? 'ENABLED' : 'MUTED'}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Default Simulation Speed</span>
              <span className="text-xs text-slate-400">Time acceleration multiplier when launching new missions</span>
            </div>
            <select
              value={settings.simulationDefaultSpeed || 1}
              onChange={(e) => handleChangeSpeed(e.target.value)}
              className="px-3 py-1.5 rounded bg-space-900 border border-space-border text-xs font-mono text-white focus:outline-none cursor-pointer"
            >
              <option value="1">1x Real Time (60s / tick)</option>
              <option value="2">2x Speed (120s / tick)</option>
              <option value="5">5x Speed (300s / tick)</option>
              <option value="10">10x Speed (600s / tick)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded bg-space-950 border border-space-border">
            <div>
              <span className="font-mono text-sm text-white font-bold block">Physical Units</span>
              <span className="text-xs text-slate-400">International System of Units (SI: km, kg, Watts, m/s)</span>
            </div>
            <span className="text-xs font-mono font-bold text-orbit-cyan px-2.5 py-1 rounded bg-orbit-cyan/15 border border-orbit-cyan/30">
              METRIC (SI)
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition"
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
          ASTRAJECT is an independent educational simulation inspired by the NASA Space Apps Challenge problem
          statement titled "Space Mission Design Game." This software is not an official product of NASA, ESA,
          or any commercial aerospace launch contractor.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Physical orbital mechanics calculations employ two-body Keplerian approximations (v = sqrt(&mu;/r), T = 2&pi; sqrt(r&sup3;/&mu;))
          and ideal Tsiolkovsky delta-V budgets. Advanced physical perturbations such as atmospheric drag decay, non-spherical J2 geopotential harmonics,
          and solar radiation pressure are simplified for educational accessibility.
        </p>
      </div>
    </div>
  );
}
