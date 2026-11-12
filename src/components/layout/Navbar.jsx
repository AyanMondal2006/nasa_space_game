import React, { useState, useRef, useEffect } from 'react';
import { useMission } from '../../state/MissionContext.jsx';
import { useTheme } from '../../state/ThemeContext.jsx';
import { shareService } from '../../utils/shareService.js';
import { 
  Rocket, 
  Orbit, 
  Save, 
  Users, 
  Menu, 
  X, 
  Palette,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Share2,
  GraduationCap,
  Undo2,
  Redo2,
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarOpen, onOpenTour }) {
  const { 
    currentMission, 
    activeTab,
    setActiveTab, 
    saveCurrentMission, 
    teamRole, 
    setTeamRole,
    isSimRunning,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMission();

  const {
    theme,
    setTheme,
    themes,
    currentThemeMeta,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    soundEnabled,
    setSoundEnabled,
    playUiSound,
  } = useTheme();

  const [savedToast, setSavedToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close theme dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    playUiSound('beep');
    saveCurrentMission();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleShare = async () => {
    playUiSound('beep');
    const res = await shareService.copyShareUrlToClipboard(currentMission);
    if (res.success) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const roles = [
    'Mission Planner',
    'Spacecraft Engineer',
    'Payload Scientist',
    'Flight Operations Engineer',
  ];

  return (
    <header className="w-full bg-space-950/90 border-b border-space-border backdrop-blur sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Desktop/Mobile Sidebar Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => {
              playUiSound('click');
              onToggleSidebar();
            }}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-space-900 border border-space-border transition"
            title="Toggle Mobile Menu"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Sidebar Collapse / Expand Toggle */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex p-2 text-slate-400 hover:text-orbit-cyan rounded-md hover:bg-space-900 border border-space-border transition items-center justify-center group"
            title={isSidebarCollapsed ? 'Expand Sidebar [Ctrl+B]' : 'Collapse Sidebar to Icon Rail [Ctrl+B]'}
            aria-label="Toggle Sidebar Collapse"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-orbit-cyan group-hover:scale-110 transition-transform" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400 group-hover:text-orbit-cyan transition" />
            )}
          </button>

          {/* Brand Logo & Title */}
          <div 
            onClick={() => {
              playUiSound('click');
              setActiveTab('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orbit-cyan/20 to-blue-600/30 border border-orbit-cyan/40 flex items-center justify-center text-orbit-cyan group-hover:border-orbit-cyan transition shadow-glow-cyan">
              <Orbit className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-base text-white flex items-center gap-1.5 font-mono">
                ASTRAJECT
                <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-orbit-cyan/15 text-orbit-cyan border border-orbit-cyan/30">
                  SIMULATOR
                </span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-0.5 hidden sm:inline">
                Design the Mission. Engineer the Future.
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Mission Status & Destination Tag */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-space-900/80 border border-space-border text-xs font-mono">
          <span className="text-slate-400">ACTIVE MISSION:</span>
          <span className="font-semibold text-orbit-cyan truncate max-w-[200px]">
            {currentMission?.title || 'Untitled Mission'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="uppercase text-slate-300 font-medium">
            {currentMission?.destination || 'Earth'}
          </span>
        </div>

        {/* Right: Flight Academy, Undo/Redo, Theme, Audio, Share, Save & Flight Control */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Flight Academy Guided Tour Button */}
          {onOpenTour && (
            <button
              onClick={() => {
                playUiSound('click');
                onOpenTour();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono border border-space-border bg-space-900/80 hover:bg-space-850 hover:border-orbit-cyan/40 text-slate-200 transition"
              title="Open Flight Academy Orientation Tour"
            >
              <GraduationCap className="w-3.5 h-3.5 text-orbit-cyan" />
              <span className="hidden xl:inline text-[11px]">Academy</span>
            </button>
          )}

          {/* Undo / Redo for Spacecraft Design */}
          {activeTab === 'designer' && (
            <div className="hidden sm:flex items-center bg-space-900/80 border border-space-border rounded p-0.5">
              <button
                onClick={() => {
                  playUiSound('click');
                  undo();
                }}
                disabled={!canUndo}
                className={`p-1 rounded transition ${
                  canUndo ? 'text-slate-200 hover:text-white hover:bg-space-850' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Undo last modification [Ctrl+Z]"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  playUiSound('click');
                  redo();
                }}
                disabled={!canRedo}
                className={`p-1 rounded transition ${
                  canRedo ? 'text-slate-200 hover:text-white hover:bg-space-850' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Redo modification [Ctrl+Y]"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Theme Switcher Popover */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                playUiSound('click');
                setThemeDropdownOpen(!themeDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border border-space-border bg-space-900/80 hover:bg-space-850 hover:border-orbit-cyan/40 text-slate-200 transition"
              title="Change Mission Console Theme"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: currentThemeMeta.accentColor }}
              />
              <Palette className="w-3.5 h-3.5 text-orbit-cyan" />
              <span className="hidden xl:inline text-[11px]">{currentThemeMeta.label}</span>
            </button>

            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-space-950/95 border border-space-border shadow-2xl p-2 z-50 backdrop-blur font-mono text-xs animate-fade-in">
                <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-space-border mb-1 flex items-center justify-between">
                  <span>Console Theme</span>
                  <span className="text-orbit-cyan font-semibold">5 Themes</span>
                </div>
                <div className="space-y-1">
                  {themes.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition ${
                          isSelected
                            ? 'bg-space-850 text-white border border-orbit-cyan/40 font-bold'
                            : 'text-slate-300 hover:bg-space-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: t.accentColor }}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs leading-none">{t.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{t.badge}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orbit-cyan" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded text-xs font-mono border transition flex items-center gap-1 ${
              soundEnabled
                ? 'bg-orbit-cyan/15 text-orbit-cyan border-orbit-cyan/40'
                : 'bg-space-900/60 border-space-border text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Telemetry Audio Active (Click to mute)' : 'Muted (Click to enable audio beeps)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-orbit-cyan" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline text-[10px]">
              {soundEnabled ? 'AUDIO ON' : 'MUTE'}
            </span>
          </button>

          {/* Deep-link Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border border-space-border bg-space-900/80 hover:bg-space-850 hover:border-orbit-cyan/40 text-slate-200 transition"
            title="Copy One-Click Deep-Link Share URL to Clipboard"
          >
            <Share2 className="w-3.5 h-3.5 text-orbit-cyan" />
            <span className="hidden sm:inline text-[11px]">{shareToast ? 'Link Copied!' : 'Share'}</span>
          </button>

          {/* Save Mission Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-space-border bg-space-900/80 hover:bg-space-800 text-slate-200 hover:text-white transition"
            title="Save Mission Configuration"
          >
            <Save className="w-3.5 h-3.5 text-orbit-cyan" />
            <span className="hidden sm:inline">{savedToast ? 'Saved!' : 'Save'}</span>
          </button>

          {/* Quick Mission Control Flight Action */}
          <button
            onClick={() => {
              playUiSound('switch');
              setActiveTab('control');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition shadow-sm ${
              isSimRunning 
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-orbit-cyan/15 text-orbit-cyan hover:bg-orbit-cyan hover:text-space-950 border border-orbit-cyan/40 shadow-glow-cyan'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{isSimRunning ? 'SIM RUNNING' : 'FLIGHT CONTROL'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
