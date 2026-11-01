/**
 * SafeStep — What-If Simulator Control Panel
 *
 * Implements speed & distance sliders, pedestrian behavior modes,
 * crossing infrastructure selection, visibility conditions,
 * and playback/intervention triggers.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  BellRing,
  AlertOctagon,
  Gauge,
  Ruler,
  Footprints,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  WhatIfCrossingType,
  WhatIfPedestrianBehavior,
  WhatIfVisibility,
} from '../../services/safeStepWhatIfRiskEngine';

interface SafeStepWhatIfControlsProps {
  vehicleSpeedKmh: number;
  setVehicleSpeedKmh: (speed: number) => void;
  vehicleDistanceMeters: number;
  setVehicleDistanceMeters: (dist: number) => void;
  pedestrianBehavior: WhatIfPedestrianBehavior;
  setPedestrianBehavior: (behavior: WhatIfPedestrianBehavior) => void;
  crossingType: WhatIfCrossingType;
  setCrossingType: (crossing: WhatIfCrossingType) => void;
  visibility: WhatIfVisibility;
  setVisibility: (vis: WhatIfVisibility) => void;
  isPlaying: boolean;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
  onResetSimulation: () => void;
  onSimulateEarlyWarning: () => void;
  onSimulateEmergencyStop: () => void;
  isEarlyWarningActive: boolean;
  isEmergencyStopActive: boolean;
}

export const SafeStepWhatIfControls: React.FC<SafeStepWhatIfControlsProps> = ({
  vehicleSpeedKmh,
  setVehicleSpeedKmh,
  vehicleDistanceMeters,
  setVehicleDistanceMeters,
  pedestrianBehavior,
  setPedestrianBehavior,
  crossingType,
  setCrossingType,
  visibility,
  setVisibility,
  isPlaying,
  onStartSimulation,
  onPauseSimulation,
  onResumeSimulation,
  onResetSimulation,
  onSimulateEarlyWarning,
  onSimulateEmergencyStop,
  isEarlyWarningActive,
  isEmergencyStopActive,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm space-y-6">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-slate-800" />
          <h3 className="text-base font-bold text-slate-900">What-If Scenario Parameters</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">Independent Local State</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CONTROL A: VEHICLE SPEED */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="speed-slider" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-500" />
              <span>Vehicle Speed:</span>
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black font-mono text-slate-900 tabular-nums">
                {vehicleSpeedKmh}
              </span>
              <span className="text-xs font-semibold text-slate-500">km/h</span>
            </div>
          </div>
          <input
            id="speed-slider"
            type="range"
            min="0"
            max="80"
            step="1"
            value={vehicleSpeedKmh}
            onChange={(e) => setVehicleSpeedKmh(Number(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0 km/h (Stationary)</span>
            <span>40 km/h (City)</span>
            <span>80 km/h</span>
          </div>
          {/* Quick Speed Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 25, 40, 60].map((preset) => (
              <button
                key={preset}
                onClick={() => setVehicleSpeedKmh(preset)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  vehicleSpeedKmh === preset
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset === 0 ? 'Stop' : `${preset} km/h`}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROL B: VEHICLE DISTANCE */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="distance-slider" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-slate-500" />
              <span>Distance to Conflict:</span>
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black font-mono text-slate-900 tabular-nums">
                {vehicleDistanceMeters}
              </span>
              <span className="text-xs font-semibold text-slate-500">metres</span>
            </div>
          </div>
          <input
            id="distance-slider"
            type="range"
            min="5"
            max="100"
            step="1"
            value={vehicleDistanceMeters}
            onChange={(e) => setVehicleDistanceMeters(Number(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>5m (Critical Close)</span>
            <span>50m</span>
            <span>100m (Distant)</span>
          </div>
          {/* Quick Distance Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            {[15, 35, 60, 90].map((preset) => (
              <button
                key={preset}
                onClick={() => setVehicleDistanceMeters(preset)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  vehicleDistanceMeters === preset
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>
        </div>

        {/* CONTROL C: PEDESTRIAN BEHAVIOUR */}
        <div className="space-y-2.5">
          <label htmlFor="pedestrian-behavior-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-slate-500" />
            <span>Pedestrian Behaviour:</span>
          </label>
          <select
            id="pedestrian-behavior-select"
            value={pedestrianBehavior}
            onChange={(e) => setPedestrianBehavior(e.target.value as WhatIfPedestrianBehavior)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="waiting">Waiting on the footpath</option>
            <option value="approaching">Approaching the road</option>
            <option value="beginning_to_cross">Beginning to cross (curb)</option>
            <option value="already_crossing">Already crossing (in-lane)</option>
          </select>
          <p className="text-[11px] text-slate-500 leading-snug">
            {pedestrianBehavior === 'waiting' && 'Pedestrian stationary on sidewalk; no roadway path conflict.'}
            {pedestrianBehavior === 'approaching' && 'Pedestrian in motion toward street; potential crossing vector.'}
            {pedestrianBehavior === 'beginning_to_cross' && 'Pedestrian entering roadway corridor; immediate attention needed.'}
            {pedestrianBehavior === 'already_crossing' && 'Pedestrian traversing lane; high risk of direct physical overlap.'}
          </p>
        </div>

        {/* CONTROL D: CROSSING TYPE */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Crossing Infrastructure:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCrossingType('zebra')}
              className={`p-2.5 text-xs font-semibold rounded-xl border transition-all text-left ${
                crossingType === 'zebra'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">Zebra Crossing</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Designated high-visibility stripes</div>
            </button>
            <button
              onClick={() => setCrossingType('unmarked')}
              className={`p-2.5 text-xs font-semibold rounded-xl border transition-all text-left ${
                crossingType === 'unmarked'
                  ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">Unmarked Road</div>
              <div className="text-[10px] text-slate-500 mt-0.5">No painted lines or signal phase</div>
            </button>
          </div>
        </div>

        {/* CONTROL E: VISIBILITY */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Environmental Visibility:</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['good', 'moderate', 'poor'] as const).map((vis) => (
              <button
                key={vis}
                onClick={() => setVisibility(vis)}
                className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                  visibility === vis
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {vis}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            {visibility === 'good' && 'Clear daylight; 1.0s standard reaction.'}
            {visibility === 'moderate' && 'Dusk/overcast; 1.4s reaction buffer.'}
            {visibility === 'poor' && 'Heavy fog/rain; 1.9s reaction + uncertainty.'}
          </div>
        </div>

        {/* CONTROL F: SIMULATION INTERVENTIONS */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            What-If Safety Interventions:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSimulateEarlyWarning}
              className={`p-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                isEarlyWarningActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <BellRing className="w-4 h-4 shrink-0" />
              <span>Simulate Early Warning</span>
            </button>
            <button
              onClick={onSimulateEmergencyStop}
              className={`p-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                isEmergencyStopActive
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Emergency Stop</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Early warning cuts reaction delay; emergency stop applies maximum 7.8 m/s² deceleration.
          </p>
        </div>
      </div>

      {/* PLAYBACK ACTION BUTTONS */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={onStartSimulation}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
            >
              <Play className="w-4 h-4" />
              <span>Start Simulation</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-xs"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Simulation</span>
            </button>
          )}

          <button
            onClick={onResumeSimulation}
            disabled={isPlaying}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-40"
          >
            Resume
          </button>

          <button
            onClick={onResetSimulation}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Simulation Ready · Deterministic Kinematics Model</span>
        </div>
      </div>
    </div>
  );
};
