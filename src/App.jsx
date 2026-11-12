import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionProvider, useMission } from './state/MissionContext.jsx';
import { ThemeProvider, useTheme } from './state/ThemeContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import ResourcePillarsBar from './components/common/ResourcePillarsBar.jsx';
import LoadingSkeleton from './components/common/LoadingSkeleton.jsx';
import FlightAcademyTour from './components/common/FlightAcademyTour.jsx';
import { Radio, CheckCircle, X } from 'lucide-react';

// Code-split dynamic routes for dramatic performance gain & bundle reduction
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage.jsx'));
const MissionDesignerPage = lazy(() => import('./pages/MissionDesignerPage.jsx'));
const SpacecraftLabPage = lazy(() => import('./pages/SpacecraftLabPage.jsx'));
const OrbitExplorerPage = lazy(() => import('./pages/OrbitExplorerPage.jsx'));
const LaunchPage = lazy(() => import('./pages/LaunchPage.jsx'));
const MissionControlPage = lazy(() => import('./pages/MissionControlPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage.jsx'));
const LearningCenterPage = lazy(() => import('./pages/LearningCenterPage.jsx'));
const SavedMissionsPage = lazy(() => import('./pages/SavedMissionsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));

function MainApp() {
  const { activeTab, validationResults, currentMission, importedToast, setImportedToast } = useMission();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-launch Flight Academy tour on first visit
  useEffect(() => {
    try {
      const completed = localStorage.getItem('astraject_tour_completed');
      if (completed !== 'true') {
        setIsTourOpen(true);
      }
    } catch {}
  }, []);

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex flex-col bg-space-950 text-slate-100 starfield-bg relative overflow-x-hidden selection:bg-orbit-cyan/30 selection:text-white"
    >
      {/* Subtle ambient nebula gradient overlay anchored to active theme */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-orbit-cyan/5 to-transparent z-0" />

      {/* Deep-link Mission Received Toast Banner */}
      <AnimatePresence>
        {importedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-space-900/95 border border-orbit-cyan/60 shadow-glow-cyan text-xs font-mono flex items-center gap-3 backdrop-blur"
          >
            <div className="w-6 h-6 rounded-full bg-orbit-cyan/20 flex items-center justify-center text-orbit-cyan">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-orbit-cyan block">MISSION LINK IMPORTED</span>
              <span className="text-[11px] text-slate-300">
                Configuration "{currentMission?.title}" loaded from shared deep-link.
              </span>
            </div>
            <button
              onClick={() => setImportedToast(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-space-850"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Console Navigation Bar - Full Width */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* Main Workspace: Docked Sidebar + Full Fluid Workspace */}
      <div className="flex-1 flex w-full min-h-0 relative z-10">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)]">
          {/* Live Engineering Resource Constraints Bar */}
          <ResourcePillarsBar
            validationResults={validationResults}
            currentMission={currentMission}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
            <Suspense fallback={<LoadingSkeleton />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.995 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {activeTab === 'home' && <HomePage onOpenTour={() => setIsTourOpen(true)} />}
                  {activeTab === 'campaigns' && <CampaignsPage />}
                  {activeTab === 'designer' && <MissionDesignerPage />}
                  {activeTab === 'spacecraft' && <SpacecraftLabPage />}
                  {activeTab === 'orbit' && <OrbitExplorerPage />}
                  {activeTab === 'launch' && <LaunchPage />}
                  {activeTab === 'control' && <MissionControlPage />}
                  {activeTab === 'reports' && <ReportsPage />}
                  {activeTab === 'comparison' && <ComparisonPage />}
                  {activeTab === 'learning' && <LearningCenterPage />}
                  {activeTab === 'saved' && <SavedMissionsPage />}
                  {activeTab === 'settings' && <SettingsPage />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
        </div>
      </div>

      {/* Interactive Guided Flight Academy Onboarding Modal */}
      <FlightAcademyTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MissionProvider>
        <MainApp />
      </MissionProvider>
    </ThemeProvider>
  );
}
