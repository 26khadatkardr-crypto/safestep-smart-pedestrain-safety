/**
 * SafeStep — What-If Safety Simulator Standalone Entry
 *
 * Mounts the independent What-If Simulator without modifying existing app entries.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeStepWhatIfSimulator } from './components/whatif/SafeStepWhatIfSimulator';
import './index.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <SafeStepWhatIfSimulator />
    </React.StrictMode>
  );
}
