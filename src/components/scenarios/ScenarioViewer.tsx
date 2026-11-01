/**
 * SafeStep — Scenarios Demonstration Suite
 *
 * Dedicated evaluator view for running and auditing Scenarios A through G.
 */

import React from 'react';
import { CheckCircle2, Play, ArrowRight, ShieldAlert, AlertTriangle, Eye, ShieldCheck, HelpCircle, FlaskConical } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { SCENARIO_PRESETS } from '../../services/MockData';
import { ScenarioId } from '../../types';

export const ScenarioViewer: React.FC = () => {
  const { activeScenarioId, loadScenario, setMode } = useSafety();

  const handleLaunchScenario = (id: ScenarioId, targetMode: 'driver' | 'pedestrian' | 'dual_view') => {
    loadScenario(id);
    setMode(targetMode);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <FlaskConical className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Safety Verification & Scenario Testing
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Verify SafeStep's collision-risk algorithms across seven deterministic real-world mobility scenarios.
              Each scenario tests dynamic kinematic formulas, pedestrian mobility profiles, and degraded sensor fallbacks.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.values(SCENARIO_PRESETS).map((s) => {
          const isActive = s.id === activeScenarioId;
          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-100 rounded-lg text-slate-700">
                    {s.code}
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Active Preset
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {s.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {s.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">
                    Expected System Behavior:
                  </div>
                  <p className="text-slate-600 leading-normal">{s.expectedResult}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleLaunchScenario(s.id, 'pedestrian')}
                  className="flex-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer text-center"
                >
                  Pedestrian Mode
                </button>
                <button
                  onClick={() => handleLaunchScenario(s.id, 'driver')}
                  className="flex-1 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Driver Mode
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
