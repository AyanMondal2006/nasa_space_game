import React, { useState } from 'react';
import { useMission } from '../../state/MissionContext.jsx';
import { 
  Rocket, 
  Orbit, 
  Play, 
  Save, 
  Users, 
  Menu, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { 
    currentMission, 
    activeTab, 
    setActiveTab, 
    validationResults, 
    saveCurrentMission, 
    teamRole, 
    setTeamRole,
    isSimRunning 
  } = useMission();

  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    saveCurrentMission();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const roles = [
    'Mission Planner',
    'Spacecraft Engineer',
    'Payload Scientist',
    'Flight Operations Engineer',
  ];

  return (
    <header className="w-full bg-space-950/90 border-b border-space-border backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-space-900 border border-space-border"
            title="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => setActiveTab('home')}
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

        {/* Center: Active Mission Title & Destination */}
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

        {/* Right: Team Role Switcher, Save Button, Flight Control Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Local Team Mode Role Selector */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-900/60 border border-space-border text-xs">
            <Users className="w-3.5 h-3.5 text-orbit-cyan shrink-0" />
            <select
              value={teamRole}
              onChange={(e) => setTeamRole(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
              title="Team Collaborative Role"
            >
              {roles.map(r => (
                <option key={r} value={r} className="bg-space-900 text-slate-200">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Save Mission Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-space-border bg-space-900/80 hover:bg-space-800 text-slate-200 hover:text-white transition"
            title="Save Mission Configuration"
          >
            <Save className="w-3.5 h-3.5 text-orbit-cyan" />
            <span className="hidden sm:inline">{savedToast ? 'Saved!' : 'Save'}</span>
          </button>

          {/* Quick Mission Control button */}
          <button
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold transition shadow-sm ${
              isSimRunning 
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-orbit-cyan/15 text-orbit-cyan hover:bg-orbit-cyan hover:text-space-950 border border-orbit-cyan/40'
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
