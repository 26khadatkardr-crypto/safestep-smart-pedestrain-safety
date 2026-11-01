/**
 * SafeStep — Nagpur Pedestrian Safety & Smart Crossing System
 * Flagship Three-Column Google Maps-Inspired Synchronized Dashboard
 *
 * Left Sidebar:  Pedestrian Mode, Location, Crossing Request Button, Route Options, Accessibility
 * Center:        Large Interactive Nagpur Map (Leaflet / Carto Voyager) with live markers & risk zones
 * Right Sidebar: Driver Mode, Crossing Warning Card, Vehicle Telemetry, Simulation Controls
 */

import React, { useState } from 'react';
import {
  Car,
  Footprints,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Route,
  Navigation,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  CheckCircle2,
  XCircle,
  Radio,
  Volume2,
  VolumeX,
  Gauge,
  Clock,
  Compass,
  ArrowRight,
  Zap,
  Hand,
  Sparkles,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { SafetyMap } from '../map/SafetyMap';
import { soundService } from '../../services/SoundService';
import { SCENARIO_PRESETS } from '../../services/MockData';
import { ScenarioId, MobilityProfile } from '../../types';

export const DualViewMode: React.FC = () => {
  const {
    vehicle,
    pedestrian,
    conflictAssessment,
    scenario,
    loadScenario,
    activeScenarioId,
    isPlaying,
    togglePlay,
    resetSimulation,
    stepSimulation,
    triggerBrakeAssist,
    slowDownVehicle,
    brakingOutcomeMessage,
    clearBrakingOutcome,
    activeCrossingRequest,
    requestCrossing,
    cancelCrossingRequest,
    completeCrossingRequest,
    acknowledgeDriverWarning,
    driverYieldAction,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    settings,
    updateSettings,
    setPedestrianProfile,
    setPedestrianIntent,
    isLiveGpsActive,
    toggleLiveGps,
    liveGpsState,
    setIsSettingsOpen,
    distanceVehToPedMeters,
    isUnder50mProximity,
    isCollisionOccurred,
  } = useSafety();

  const [nearestNotice, setNearestNotice] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const risk = conflictAssessment.riskLevel;

  // Handle Pedestrian Crossing Request
  const handleCrossingRequest = () => {
    setRequestError(null);
    const result = requestCrossing();
    if (!result.success) {
      setRequestError(result.message);
    }
  };

  // Locate nearest crossing with voice feedback
  const handleLocateCrossing = () => {
    setNearestNotice('Nearest verified crossing: Manas Square & Tekdi Road Zebra Crossing (with tactile paving & ADA curb cuts).');
    if (settings.voiceAlerts) {
      soundService.speakGuidance('Nearest designated crossing is Manas Square, thirty five meters ahead with tactile paving.', 'green', true);
    }
  };

  // Crossing Status Banner text
  const getCrossingStatusText = () => {
    if (!activeCrossingRequest) return 'Ready to request a crossing.';
    switch (activeCrossingRequest.status) {
      case 'requested':
        return 'Crossing request sent to the driver dashboard.';
      case 'waiting_for_vehicle':
        return 'Waiting for the simulated vehicle to respond.';
      case 'vehicle_slowing':
        return 'Vehicle is slowing down in the simulation.';
      case 'vehicle_stopped':
        return 'The simulated vehicle has stopped. Check the road carefully before crossing.';
      case 'completed':
        return 'Crossing marked as completed.';
      default:
        return 'Ready to request a crossing.';
    }
  };

  // Toggle pedestrian hold at curb
  const isPedestrianHolding = !pedestrian.intentToCross || pedestrian.speedKmh === 0;
  const togglePedestrianHold = () => {
    if (pedestrian.intentToCross) {
      setPedestrianIntent(false);
      soundService.speakGuidance('Pedestrian held at sidewalk curb until vehicle passes.', 'yellow', true);
    } else {
      setPedestrianIntent(true);
      soundService.speakGuidance('Pedestrian released to cross roadway.', 'green', true);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] w-full flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR: PEDESTRIAN SAFETY & NAVIGATION                */}
      {/* ============================================================== */}
      <aside className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto p-4 space-y-4 shadow-xs z-10">
        {/* A. Pedestrian Mode Status Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedestrian Mode</h2>
                <div className="text-sm font-extrabold text-slate-900 leading-none">
                  {pedestrian.name}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Commuter
            </span>
          </div>

          {/* Current Pedestrian Location */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" />
              Current Pedestrian Location
            </div>
            <div className="font-semibold text-slate-800 leading-tight">
              {isLiveGpsActive && liveGpsState.coords
                ? `GPS: ${liveGpsState.coords.lat.toFixed(5)}, ${liveGpsState.coords.lng.toFixed(5)}`
                : 'Sitabuldi Sidewalk, near Manas Square, Tekdi Road'}
            </div>
            <div className="text-[10px] text-slate-500">
              Nagpur, Maharashtra · Facing West toward Sitabuldi Fort
            </div>
          </div>

          {/* Mobility Profile Quick Select */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mobility Profile
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['standard', 'senior', 'wheelchair'] as MobilityProfile[]).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setPedestrianProfile(prof)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all capitalize cursor-pointer text-center ${
                    pedestrian.mobilityProfile === prof
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* B. Large Prominent Pedestrian Crossing Request Button Card */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>Smart Crossing Request</span>
            </div>
            {activeCrossingRequest && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {activeCrossingRequest.id}
              </span>
            )}
          </div>

          {/* THE PROMINENT CROSSING BUTTON */}
          <button
            onClick={handleCrossingRequest}
            disabled={activeCrossingRequest !== null && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled'}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md active:scale-98 ${
              activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled'
                ? activeCrossingRequest.status === 'vehicle_stopped'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-blue-700 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-lg'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-lg leading-none">
              🚶
            </div>
            <span className="tracking-wide">REQUEST TO CROSS ROAD</span>
          </button>

          {/* Error Message if coordinates unavailable */}
          {requestError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{requestError}</span>
            </div>
          )}

          {/* CROSSING STATUS MESSAGE DISPLAY */}
          <div
            className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
              activeCrossingRequest?.status === 'vehicle_stopped'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : activeCrossingRequest?.status === 'vehicle_slowing'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : activeCrossingRequest
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeCrossingRequest?.status === 'vehicle_stopped'
                    ? 'bg-emerald-500'
                    : activeCrossingRequest?.status === 'vehicle_slowing'
                    ? 'bg-amber-500 animate-pulse'
                    : activeCrossingRequest
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>Crossing Status: {activeCrossingRequest ? activeCrossingRequest.status.replace('_', ' ').toUpperCase() : 'STANDBY'}</span>
            </div>
            <p className="font-semibold text-xs leading-relaxed">
              {getCrossingStatusText()}
            </p>

            {/* Active Request Details */}
            {activeCrossingRequest && (
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Target Crossing</span>
                  <span className="font-bold text-slate-800">Manas Sq Zebra</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Approaching Car</span>
                  <span className="font-bold font-mono text-blue-700">
                    {activeCrossingRequest.currentDistanceMeters ?? Math.round(distanceVehToPedMeters)}m ({vehicle.speedKmh} km/h)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cancel or Complete Action Buttons */}
          {activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled' && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => completeCrossingRequest()}
                className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Mark Completed
              </button>
              <button
                onClick={() => cancelCrossingRequest('User cancelled in Pedestrian UI')}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* C. Route Options & Find Safe Route */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Route className="w-3.5 h-3.5 text-blue-600" />
              <span>Route Options</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{routes.length} paths available</span>
          </div>

          <div className="space-y-2">
            {routes.map((rt) => {
              const isSelected = rt.id === selectedRouteId;
              return (
                <div
                  key={rt.id}
                  onClick={() => setSelectedRouteId(rt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 leading-tight">{rt.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rt.averageSafetyIndex >= 9
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      ★ {rt.averageSafetyIndex}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>{rt.distanceMeters}m</span>
                    <span>·</span>
                    <span>~{rt.estimatedMinutes} min</span>
                    <span>·</span>
                    <span>{rt.isWheelchairAccessible ? '♿ ADA Compliant' : '⚠️ Has Steps'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedRouteId('route-accessible')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Find Safe Route</span>
          </button>
        </div>

        {/* D. Accessibility & Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Accessibility & Preferences</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => updateSettings({ voiceAlerts: !settings.voiceAlerts })}
              className={`p-2.5 rounded-xl border font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                settings.voiceAlerts
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {settings.voiceAlerts ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>Voice Guidance</span>
            </button>

            <button
              onClick={handleLocateCrossing}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Compass className="w-4 h-4 text-slate-600" />
              <span>Nearest Crossing</span>
            </button>
          </div>

          {nearestNotice && (
            <p className="text-[11px] font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              {nearestNotice}
            </p>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. CENTER PANEL: LARGE INTERACTIVE NAGPUR MAP                   */}
      {/* ============================================================== */}
      <main className="flex-1 h-full min-h-[420px] relative overflow-hidden bg-slate-100 flex flex-col">
        <SafetyMap
          interactiveHeight="h-full"
          showConflictZones={true}
        />
      </main>

      {/* ============================================================== */}
      {/* 3. RIGHT SIDEBAR: DRIVER DASHBOARD & SIMULATION CONTROLS       */}
      {/* ============================================================== */}
      <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 bg-white border-l border-slate-200 overflow-y-auto p-4 space-y-4 shadow-xs z-10">
        {/* A. Driver Mode Status Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Driver Mode</h2>
                <div className="text-sm font-extrabold text-slate-900 leading-none">
                  {vehicle.name}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Connected V2X
            </span>
          </div>

          {/* Real-time Vehicle Speed Readout */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                Current Vehicle Speed
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {vehicle.speedKmh} <span className="text-xs font-sans text-slate-500 font-bold">km/h</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                AEB Braking Status
              </div>
              <span
                className={`inline-block font-extrabold text-xs px-2.5 py-1 rounded-lg mt-0.5 ${
                  vehicle.isBraking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : vehicle.speedKmh === 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {vehicle.isBraking ? 'BRAKE ACTIVE' : vehicle.speedKmh === 0 ? 'STOPPED (0 km/h)' : 'CRUISING'}
              </span>
            </div>
          </div>
        </div>

        {/* B. PROMINENT DRIVER WARNING: PEDESTRIAN WANTS TO CROSS */}
        {activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled' ? (
          <div className="bg-amber-50 rounded-2xl border-2 border-amber-400 p-4 shadow-md space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  PEDESTRIAN WANTS TO CROSS
                </h3>
                <p className="text-[11px] font-semibold text-amber-800 leading-tight">
                  A pedestrian has submitted a crossing request near your vehicle.
                </p>
              </div>
            </div>

            {/* Actual Values From Simulation */}
            <div className="bg-white/90 rounded-xl p-3 border border-amber-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Distance to Pedestrian</span>
                  <span className="text-sm font-black font-mono text-amber-900">
                    {activeCrossingRequest.currentDistanceMeters ?? Math.round(distanceVehToPedMeters)} m away
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Vehicle Speed</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {vehicle.speedKmh} km/h
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-700">
                <span className="font-bold text-slate-500">Location: </span>
                <span className="font-semibold text-slate-900">Manas Square & Tekdi Road Zebra Crossing</span>
              </div>

              <div className="p-2 bg-amber-100/70 rounded-lg text-amber-950 font-extrabold text-[11px] leading-tight border border-amber-300">
                RECOMMENDED ACTION: SLOW DOWN AND PREPARE TO STOP.
              </div>
            </div>

            {/* Yield / Acknowledge Action Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={driverYieldAction}
                disabled={vehicle.speedKmh === 0}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Yield & Slow Down</span>
              </button>
              <button
                onClick={acknowledgeDriverWarning}
                className="py-2.5 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        ) : (
          /* Standard Risk Alert when no crossing request is pending */
          <div
            className={`rounded-2xl border p-4 space-y-2.5 shadow-xs transition-all ${
              risk === 'red'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : risk === 'yellow'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : risk === 'unknown'
                ? 'bg-slate-100 border-slate-300 text-slate-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {risk === 'red' && <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
              {risk === 'yellow' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              {risk === 'green' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
              {risk === 'unknown' && <HelpCircle className="w-5 h-5 text-slate-600 shrink-0" />}
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {risk === 'red'
                  ? 'STOP — HIGH COLLISION RISK'
                  : risk === 'yellow'
                  ? 'SLOW DOWN — PEDESTRIAN CONFLICT'
                  : risk === 'unknown'
                  ? 'DETECTION DATA UNKNOWN'
                  : 'LOWER DETECTED RISK'}
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              {conflictAssessment.recommendedDriverAction}
            </p>
          </div>
        )}

        {/* C. Vehicle Kinematics & Stopping Distance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Spatial & Stopping Kinematics
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Dist to Conflict</span>
              <span className="text-sm font-black font-mono text-slate-900">
                {conflictAssessment.distanceMeters}m
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Stopping Distance</span>
              <span className="text-sm font-black font-mono text-blue-600">
                {conflictAssessment.estimatedStoppingDistanceMeters}m
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Arrival Window:</span>
            <span className="font-mono font-bold text-slate-800">
              {conflictAssessment.timeToConflictPointSec !== null ? `${conflictAssessment.timeToConflictPointSec}s` : 'Diverging'}
            </span>
          </div>
        </div>

        {/* D. Simulation Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Simulation Controls
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">10Hz Kinematic</span>
          </div>

          {/* Scenario Preset Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Scenario Preset
            </label>
            <select
              value={activeScenarioId}
              onChange={(e) => loadScenario(e.target.value as ScenarioId)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              {Object.values(SCENARIO_PRESETS).map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.code}: {sc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Run, Step, Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Run Simulation'}</span>
            </button>

            <button
              onClick={stepSimulation}
              disabled={isPlaying}
              className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              title="Step Forward (Single Tick)"
            >
              <StepForward className="w-4 h-4" />
            </button>

            <button
              onClick={resetSimulation}
              className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Emergency Brake Assist & Hold Pedestrian Controls */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={triggerBrakeAssist}
              disabled={vehicle.speedKmh === 0}
              className="py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Brake Assist</span>
            </button>

            <button
              onClick={togglePedestrianHold}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                isPedestrianHolding
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{isPedestrianHolding ? 'Release Pedestrian' : 'Hold at Curb'}</span>
            </button>
          </div>

          {/* Braking outcome notice if triggered */}
          {brakingOutcomeMessage && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] font-semibold leading-relaxed">
              {brakingOutcomeMessage}
            </div>
          )}

          {/* Scenario Description */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800 block mb-0.5">{scenario.title}</strong>
            {scenario.description}
          </div>
        </div>
      </aside>
    </div>
  );
};
