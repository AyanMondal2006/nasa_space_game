import React, { useState } from 'react';
import { MissionProvider, useMission } from './state/MissionContext.jsx';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-space-950 text-slate-100 starfield-bg">
      {/* Top Console Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace: Sidebar + Dynamic Section */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Live Engineering Resource Constraints Bar */}
          <ResourcePillarsBar
            validationResults={validationResults}
            currentMission={currentMission}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
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
        </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MissionProvider>
      <MainApp />
    </MissionProvider>
  );
}
