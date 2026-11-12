import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionProvider, useMission } from './state/MissionContext.jsx';
import { ThemeProvider, useTheme } from './state/ThemeContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import ResourcePillarsBar from './components/common/ResourcePillarsBar.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import MissionDesignerPage from './pages/MissionDesignerPage.jsx';
import SpacecraftLabPage from './pages/SpacecraftLabPage.jsx';
import OrbitExplorerPage from './pages/OrbitExplorerPage.jsx';
import LaunchPage from './pages/LaunchPage.jsx';
import MissionControlPage from './pages/MissionControlPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';
import LearningCenterPage from './pages/LearningCenterPage.jsx';
import SavedMissionsPage from './pages/SavedMissionsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function MainApp() {
  const { activeTab, validationResults, currentMission } = useMission();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex flex-col bg-space-950 text-slate-100 starfield-bg relative overflow-x-hidden selection:bg-orbit-cyan/30 selection:text-white"
    >
      {/* Subtle ambient nebula gradient overlay anchored to active theme */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-orbit-cyan/5 to-transparent z-0" />

      {/* Top Console Navigation Bar - Full Width */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {activeTab === 'home' && <HomePage />}
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
          </main>
        </div>
      </div>
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
