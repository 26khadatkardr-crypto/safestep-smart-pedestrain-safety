/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SafetyProvider, useSafety } from './context/SafetyContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { PedestrianDashboard } from './components/pedestrian/PedestrianDashboard';
import { DualViewMode } from './components/dual/DualViewMode';
import { ScenarioViewer } from './components/scenarios/ScenarioViewer';
import { SettingsModal } from './components/settings/SettingsModal';
import { PrivacyModal } from './components/privacy/PrivacyModal';

const AppContent: React.FC = () => {
  const { mode } = useSafety();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Navbar />

      <div className="flex-1">
        {mode === 'landing' && <LandingPage />}
        {mode === 'driver' && <DriverDashboard />}
        {mode === 'pedestrian' && <PedestrianDashboard />}
        {mode === 'dual_view' && <DualViewMode />}
        {mode === 'scenarios' && <ScenarioViewer />}
      </div>

      <SettingsModal />
      <PrivacyModal />
    </div>
  );
};

export default function App() {
  return (
    <SafetyProvider>
      <AppContent />
    </SafetyProvider>
  );
}
