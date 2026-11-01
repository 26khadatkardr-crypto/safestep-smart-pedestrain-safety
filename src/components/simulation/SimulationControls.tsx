/**
 * SafeStep — Real-Time Simulation Controller
 *
 * Controls multi-scenario execution, playback speed, stepping,
 * functional brake-assist with kinematic feedback, weather simulation,
 * Scenario D unexpected pedestrian entry adjustments, and map layer toggles.
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Navigation,
  AlertCircle,
  CloudRain,
  CloudFog,
  Sun,
  Moon,
  WifiOff,
  Layers,
  Sliders,
  CheckCircle2,
  X,
  Gauge,
  UserCheck,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { SCENARIO_PRESETS } from '../../services/MockData';
import { ScenarioId, WeatherCondition } from '../../types';

export const SimulationControls: React.FC = () => {
  const {
    activeScenarioId,
    loadScenario,
    isPlaying,
    togglePlay,
    resetSimulation,
    stepSimulation,
    playbackSpeed,
    setSimulationSpeed,
    simulationProgress,
    triggerBrakeAssist,
    slowDownVehicle,
    brakingOutcomeMessage,
    clearBrakingOutcome,
    vehicle,
    setVehicleSpeed,
    pedestrian,
    setPedestrianIntent,
    setPedestrianSpeed,
    pedestrianEntryPosition,
    setPedestrianEntryPosition,
    scenario,
    weatherCondition,
    setWeatherCondition,
    mapLayers,
    toggleMapLayer,
    isLiveGpsActive,
    toggleLiveGps,
    liveGpsState,
    conflictAssessment,
    isCollisionOccurred,
    triggerSimulatedCollision,
    clearCollision,
    isUnder50mProximity,
    playProximityAnnouncement,
    distanceVehToPedMeters,
  } = useSafety();

  const [showWeatherDrawer, setShowWeatherDrawer] = useState<boolean>(false);
  const [showLayerToggles, setShowLayerToggles] = useState<boolean>(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3.5">
      {/* ROW 1: Scenario Select, Playback Controls, Actions & Weather */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Scenario Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label htmlFor="scenario-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Scenario Preset:
          </label>
          <select
            id="scenario-select"
            value={activeScenarioId}
            onChange={(e) => loadScenario(e.target.value as ScenarioId)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all max-w-[280px] sm:max-w-none"
          >
            {Object.values(SCENARIO_PRESETS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={togglePlay}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Run Simulation'}</span>
          </button>

          <button
            onClick={stepSimulation}
            disabled={isPlaying}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
            title="Advance 1 step"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={resetSimulation}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Reset positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Live Interventions: Brake Assist, Slow Down, Collision, 50m Warning */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={triggerBrakeAssist}
            disabled={vehicle.speedKmh <= 0}
            className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors whitespace-nowrap shadow-xs disabled:opacity-50 cursor-pointer"
            title="Apply brake assist to bring car to a complete 0 km/h stop"
          >
            Brake Assist (Stop Car)
          </button>

          <button
            onClick={() => slowDownVehicle(10)}
            disabled={vehicle.speedKmh <= 10}
            className="px-2.5 py-1.5 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
            title="Reduce speed by 10 km/h"
          >
            Slow Down (-10)
          </button>

          <button
            onClick={triggerSimulatedCollision}
            className="px-2.5 py-1.5 text-xs font-bold bg-rose-950 text-rose-200 border border-rose-800 rounded-lg hover:bg-rose-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Simulate collision impact: Pedestrian and car halt immediately"
          >
            <span>💥</span>
            <span>Test Collision (Stop Pedestrian)</span>
          </button>

          <button
            onClick={playProximityAnnouncement}
            className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-400 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Trigger voice warning announcement (<50m proximity)"
          >
            <span>🔊</span>
            <span>Warning (&lt;50m Voice)</span>
          </button>

          <button
            onClick={() => setPedestrianIntent(!pedestrian.intentToCross)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            {pedestrian.intentToCross ? 'Hold Pedestrian' : 'Begin Crossing'}
          </button>

          {/* Weather Selector Quick Group */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setWeatherCondition('clear')}
              title="Clear & Dry Road (μ = 0.76)"
              className={`p-1.5 rounded transition-colors ${
                weatherCondition === 'clear' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWeatherCondition('fog')}
              title="Atmospheric Fog / Obstructed Sightline"
              className={`p-1.5 rounded transition-colors ${
                weatherCondition === 'fog' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudFog className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWeatherCondition('rain_wet')}
              title="Rain & Wet Asphalt (μ = 0.46, +48% Stopping Dist)"
              className={`p-1.5 rounded transition-colors ${
                weatherCondition === 'rain_wet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWeatherCondition('night_low_light')}
              title="Low Ambient Lighting / Night"
              className={`p-1.5 rounded transition-colors ${
                weatherCondition === 'night_low_light' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWeatherCondition('sensor_offline')}
              title="Sensor & V2X Hardware Offline (Status UNKNOWN)"
              className={`p-1.5 rounded transition-colors ${
                weatherCondition === 'sensor_offline' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Weather Drawer Details */}
          <button
            onClick={() => setShowWeatherDrawer(!showWeatherDrawer)}
            className="p-1.5 text-xs text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Show environmental physics details"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Live GPS Toggle */}
          <button
            onClick={toggleLiveGps}
            title={isLiveGpsActive ? "Switch back to simulated pedestrian" : "Track real device position via browser GPS"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${
              isLiveGpsActive
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLiveGpsActive ? 'text-white' : 'text-blue-600'}`} />
            <span>{isLiveGpsActive ? 'Live GPS: ON' : 'Live GPS'}</span>
            {isLiveGpsActive && (liveGpsState.status === 'active' || liveGpsState.status === 'locked') && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* COLLISION ALERT BANNER */}
      {isCollisionOccurred && (
        <div className="bg-rose-50 border-2 border-rose-500 text-rose-950 p-3 rounded-xl flex items-start justify-between gap-3 text-xs shadow-md animate-pulse">
          <div className="flex items-start gap-2">
            <span className="text-xl">💥</span>
            <div>
              <div className="font-extrabold text-rose-900 uppercase tracking-wider text-[11px]">
                Roadway Collision Event Detected
              </div>
              <p className="mt-0.5 leading-relaxed font-semibold">
                Impact occurred on roadway. Pedestrian has stopped at collision point; vehicle brought to complete stop (0 km/h).
              </p>
              <p className="text-[10px] text-rose-700 mt-0.5 italic">
                *Simulated collision response protocol: pedestrian movement frozen, ADAS emergency stopped.
              </p>
            </div>
          </div>
          <button
            onClick={clearCollision}
            className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Clear Collision
          </button>
        </div>
      )}

      {/* BRAKING OUTCOME NOTIFICATION BANNER */}
      {brakingOutcomeMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-xl flex items-start justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                Simulated Braking Model Response
              </div>
              <p className="mt-0.5 leading-relaxed">{brakingOutcomeMessage}</p>
              <p className="text-[10px] text-emerald-700 mt-1 italic">
                *Software kinematic simulation (not physical vehicle actuation). Braking efficacy calculated from stopping distance margin.
              </p>
            </div>
          </div>
          <button
            onClick={clearBrakingOutcome}
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md hover:bg-emerald-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ENVIRONMENTAL PHYSICS DETAILS DRAWER */}
      {showWeatherDrawer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span>Environmental Simulation Assumptions:</span>
              <span className="font-mono text-blue-700 uppercase">{weatherCondition}</span>
            </span>
            <button
              onClick={() => setWeatherCondition('clear')}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
            >
              Reset to Clear / Dry Road
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Road Friction (μ):</span>
              <span className="font-mono font-bold text-slate-800">
                {conflictAssessment.frictionCoefficient}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {weatherCondition === 'rain_wet' ? 'Wet asphalt (-40% grip)' : 'Standard dry tire grip'}
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Stopping Distance:</span>
              <span className="font-mono font-bold text-slate-800">
                {conflictAssessment.estimatedStoppingDistanceMeters}m
              </span>
              <span className="text-[10px] text-slate-400 block">
                React: {conflictAssessment.reactionDistanceMeters}m | Brake: {conflictAssessment.brakingDistanceMeters}m
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Sensor Visibility:</span>
              <span className="font-mono font-bold text-slate-800">
                {conflictAssessment.detectionConfidencePct}%
              </span>
              <span className="text-[10px] text-slate-400 block">
                {weatherCondition === 'fog' ? 'Scattered camera feed' : 'Nominal sightline'}
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Deceleration (a):</span>
              <span className="font-mono font-bold text-slate-800">
                {(conflictAssessment.frictionCoefficient * 9.81).toFixed(1)} m/s²
              </span>
              <span className="text-[10px] text-slate-400 block">Maximum physical stopping rate</span>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL PANEL FOR SCENARIO D: UNEXPECTED PEDESTRIAN ENTRY */}
      {activeScenarioId === 'scenario_d_unexpected' && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 text-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                Scenario D Controls: Unexpected Pedestrian Entry
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              Non-Designated Road Crossing Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Pedestrian Entry Position */}
            <div>
              <span className="text-slate-600 block mb-1 font-medium">Pedestrian Entry Location:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-amber-200">
                <button
                  onClick={() => setPedestrianEntryPosition('curb_west')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                    pedestrianEntryPosition === 'curb_west'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  West Curb
                </button>
                <button
                  onClick={() => setPedestrianEntryPosition('curb_mid')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                    pedestrianEntryPosition === 'curb_mid'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Midblock
                </button>
                <button
                  onClick={() => setPedestrianEntryPosition('curb_east')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                    pedestrianEntryPosition === 'curb_east'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  East Curb
                </button>
              </div>
            </div>

            {/* Pedestrian Crossing Speed */}
            <div>
              <div className="flex items-center justify-between text-slate-600 mb-1 font-medium">
                <span>Pedestrian Speed:</span>
                <span className="font-mono font-bold">{pedestrian.speedKmh.toFixed(1)} km/h</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.2"
                value={pedestrian.speedKmh}
                onChange={(e) => setPedestrianSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-amber-200 rounded-lg"
              />
            </div>

            {/* Vehicle Approach Speed */}
            <div>
              <div className="flex items-center justify-between text-slate-600 mb-1 font-medium">
                <span>Vehicle Approach Speed:</span>
                <span className="font-mono font-bold">{vehicle.speedKmh} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                step="5"
                value={vehicle.speedKmh}
                onChange={(e) => setVehicleSpeed(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-[11px] text-amber-900">
            <span>
              Distance to conflict: <strong>{conflictAssessment.distanceVehToConflictMeters}m</strong>
            </span>
            <span>
              Stopping distance needed: <strong>{conflictAssessment.estimatedStoppingDistanceMeters}m</strong>
            </span>
            <span>
              Time to conflict: <strong>{conflictAssessment.timeToConflictPointSec !== null ? `${conflictAssessment.timeToConflictPointSec}s` : 'Diverging'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* MAP LAYER VISIBILITY TOGGLES (COLLAPSIBLE) */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayerToggles(!showLayerToggles)}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded hover:bg-slate-100 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Map Layer Controls</span>
          </button>
        </div>

        {showLayerToggles && (
          <div className="flex flex-wrap items-center gap-2 py-1">
            <button
              onClick={() => toggleMapLayer('conflictZones')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                mapLayers.conflictZones
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Conflict Zones {mapLayers.conflictZones ? '✓' : '✗'}
            </button>
            <button
              onClick={() => toggleMapLayer('hazardZones')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                mapLayers.hazardZones
                  ? 'bg-rose-100 border-rose-300 text-rose-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Hazard Zones {mapLayers.hazardZones ? '✓' : '✗'}
            </button>
            <button
              onClick={() => toggleMapLayer('vehicleCorridor')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                mapLayers.vehicleCorridor
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Vehicle Corridor {mapLayers.vehicleCorridor ? '✓' : '✗'}
            </button>
            <button
              onClick={() => toggleMapLayer('crosswalks')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                mapLayers.crosswalks
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Crosswalks {mapLayers.crosswalks ? '✓' : '✗'}
            </button>
            <button
              onClick={() => toggleMapLayer('trafficStatus')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                mapLayers.trafficStatus
                  ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Traffic Status (Red/Yellow/Green) {mapLayers.trafficStatus ? '✓' : '✗'}
            </button>
          </div>
        )}
      </div>

      {/* Progress & Scenario Description */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{scenario.code}:</span>
          <span className="line-clamp-1">{scenario.description}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full transition-all duration-150"
              style={{ width: `${Math.round(simulationProgress * 100)}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-slate-700">
            {Math.round(simulationProgress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
