import React from 'react';
import { useMission } from '../../state/MissionContext.jsx';
import {
  Home,
  Compass,
  Sliders,
  Cpu,
  Orbit,
  Rocket,
  Activity,
  FileText,
  GitCompare,
  BookOpen,
  FolderArchive,
  Settings,
  X,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home Dashboard', icon: Home, badge: null },
  { id: 'campaigns', label: 'Mission Campaigns', icon: Compass, badge: 'Scenarios' },
  { id: 'designer', label: 'Mission Designer', icon: Sliders, badge: 'Step-by-Step' },
  { id: 'spacecraft', label: 'Spacecraft Lab', icon: Cpu, badge: '3D Config' },
  { id: 'orbit', label: 'Orbit Explorer', icon: Orbit, badge: 'Mechanics' },
  { id: 'launch', label: 'Launch & Deployment', icon: Rocket, badge: 'Vehicles' },
  { id: 'control', label: 'Mission Control', icon: Activity, badge: 'Live Ops' },
  { id: 'reports', label: 'Mission Reports', icon: FileText, badge: 'Debrief' },
  { id: 'comparison', label: 'Design Optimizer', icon: GitCompare, badge: 'Compare' },
  { id: 'learning', label: 'Learning Center', icon: BookOpen, badge: '10 Guides' },
  { id: 'saved', label: 'Saved Missions', icon: FolderArchive, badge: null },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
];

export default function Sidebar({ isOpen, onClose }) {
  const { activeTab, setActiveTab, savedMissions, isSimRunning } = useMission();

  const handleSelect = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-space-950/80 backdrop-blur-sm z-45 lg:hidden"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-space-950/95 lg:bg-space-950/80 border-r border-space-border backdrop-blur flex flex-col z-50 lg:z-30 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-space-border flex items-center justify-between">
          <span className="font-mono font-bold text-sm text-orbit-cyan tracking-wider">
            MISSION DIRECTORY
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLiveControl = item.id === 'control' && isSimRunning;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition group select-none ${
                  isActive
                    ? 'bg-space-850 text-orbit-cyan border border-orbit-cyan/40 shadow-glow-cyan/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-orbit-cyan'
                        : 'text-slate-500 group-hover:text-slate-300'
                    } ${isLiveControl ? 'text-emerald-400 animate-spin' : ''}`}
                  />
                  <span>{item.label}</span>
                </div>

                {isLiveControl ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    LIVE
                  </span>
                ) : item.badge ? (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans ${
                    isActive 
                      ? 'bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30' 
                      : 'bg-space-900 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-space-border text-[11px] font-mono text-slate-500 flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400">
            <span>SAVED DESIGNS:</span>
            <span className="font-bold text-orbit-cyan">{savedMissions.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            ASTRAJECT v1.0.0 — Offline-Ready
          </div>
        </div>
      </aside>
    </>
  );
}
