import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMission } from '../../state/MissionContext.jsx';
import { useTheme } from '../../state/ThemeContext.jsx';
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
  ChevronLeft,
  ChevronRight,
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
  const { isSidebarCollapsed, toggleSidebarCollapse, playUiSound } = useTheme();

  const handleSelect = (id) => {
    playUiSound('click');
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

      {/* Sidebar Navigation Drawer - Flush to screen edge */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 h-screen lg:h-[calc(100vh-4rem)] bg-space-950/95 lg:bg-space-950/80 border-r border-space-border backdrop-blur flex flex-col z-50 lg:z-30 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-space-border flex items-center justify-between">
          <span className="font-mono font-bold text-sm text-orbit-cyan tracking-wider">
            MISSION DIRECTORY
          </span>
          <button
            onClick={() => {
              playUiSound('click');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 py-3 px-2 sm:px-2.5 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLiveControl = item.id === 'control' && isSimRunning;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSelect(item.id)}
                  className={`w-full relative flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-lg text-xs font-mono transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-space-850 text-orbit-cyan border border-orbit-cyan/40 shadow-glow-cyan/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-900/60'
                  }`}
                >
                  {/* Glowing active indicator line */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-orbit-cyan shadow-glow-cyan"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-orbit-cyan'
                          : 'text-slate-500 group-hover:text-slate-300'
                      } ${isLiveControl ? 'text-emerald-400 animate-spin' : ''}`}
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isSidebarCollapsed && (
                    <>
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
                    </>
                  )}
                </button>

                {/* Hover Tooltip in Collapsed Desktop Mode */}
                {isSidebarCollapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-space-950/95 border border-space-border text-slate-200 text-xs font-mono shadow-2xl z-50 whitespace-nowrap items-center gap-2 pointer-events-none animate-fade-in backdrop-blur">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-orbit-cyan/15 text-orbit-cyan border border-orbit-cyan/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer with Collapse Toggle and Status */}
        <div className="p-3 border-t border-space-border text-[11px] font-mono text-slate-500 flex flex-col gap-2">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">SAVED DESIGNS:</span>
                <span className="font-bold text-orbit-cyan">{savedMissions.length}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  v1.0.0 — Offline-Ready
                </span>
                <button
                  onClick={toggleSidebarCollapse}
                  className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 hover:text-orbit-cyan px-1.5 py-0.5 rounded hover:bg-space-900 border border-transparent hover:border-space-border transition"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Collapse</span>
                </button>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <span 
                className="w-6 h-6 rounded-full bg-space-900 border border-space-border text-orbit-cyan font-bold text-[10px] flex items-center justify-center"
                title={`${savedMissions.length} Saved Missions`}
              >
                {savedMissions.length}
              </span>
              <button
                onClick={toggleSidebarCollapse}
                className="p-1.5 text-slate-400 hover:text-orbit-cyan rounded hover:bg-space-900 transition"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
