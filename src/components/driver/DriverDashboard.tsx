/**
 * SafeStep — Driver Mode Dashboard
 *
 * Provides real-time collision-risk awareness, spatial conflict mapping,
 * actionable audio-visual alerts, physical stopping-distance metrics,
 * weather condition readouts, and deduplicated telemetry event inspection.
 */

import React, { useState } from 'react';
import {
  Gauge,
  Users,
  AlertTriangle,
  Radio,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Volume2,
  VolumeX,
  Sliders,
  MapPin,
  Compass,
  ArrowRight,
  Clock,
  Car,
  Footprints,
  Eye,
  LogOut,
  ChevronRight,
  Layers,
  History,
  TrendingDown,
  BarChart3,
  CloudRain,
  CloudFog,
  Sun,
  Activity,
  Trash2,
  CheckCircle2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { SafetyMap } from '../map/SafetyMap';
import { SimulationControls } from '../simulation/SimulationControls';
import { ConflictDataVisualization } from './ConflictDataVisualization';
import { soundService } from '../../services/SoundService';

export const DriverDashboard: React.FC = () => {
  const {
    vehicle,
    pedestrian,
    conflictAssessment,
    hazardZones,
    scenario,
    setMode,
    setIsSettingsOpen,
    setVehicleSpeed,
    triggerBrakeAssist,
    slowDownVehicle,
    brakingOutcomeMessage,
    clearBrakingOutcome,
    settings,
    updateSettings,
    alerts,
    eventLog,
    clearEventLog,
    isLiveGpsActive,
    liveGpsState,
    nearbyRoadInfo,
    weatherCondition,
    isUnder50mProximity,
    distanceVehToPedMeters,
    playProximityAnnouncement,
    isCollisionOccurred,
    clearCollision,
    trafficSegments,
    activeCrossingRequest,
    acknowledgeDriverWarning,
    driverYieldAction,
    warningDistanceThresholdMeters,
  } = useSafety();

  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'zones' | 'history'>('map');
  const [selectedPedestrianView, setSelectedPedestrianView] = useState<boolean>(true);

  const risk = conflictAssessment.riskLevel;

  // Warning Banner configuration
  const warningConfig = {
    red: {
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      badge: 'bg-rose-600 text-white',
      icon: <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />,
      title: 'STOP — HIGH COLLISION RISK',
      defaultMsg: 'A significant potential conflict requires immediate action. Brake safely and stop if necessary.',
      action: 'Firmly depress brake pedal. Yield right-of-way immediately.',
    },
    yellow: {
      bg: 'bg-amber-50 border-amber-300 text-amber-950',
      badge: 'bg-amber-500 text-white',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />,
      title: 'SLOW DOWN — PEDESTRIAN CONFLICT AHEAD',
      defaultMsg: 'A potential conflict is developing. Reduce speed and prepare to stop.',
      action: 'Decelerate below 25 km/h. Cover brake pedal and monitor curb periphery.',
    },
    green: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />,
      title: 'LOWER DETECTED RISK',
      defaultMsg: 'No immediate pedestrian conflict predicted by current model. Continue cautiously.',
      action: 'Maintain speed with active curb awareness. Green does not guarantee road is empty.',
    },
    unknown: {
      bg: 'bg-slate-100 border-slate-300 text-slate-900',
      badge: 'bg-slate-700 text-white',
      icon: <HelpCircle className="w-6 h-6 text-slate-600 shrink-0" />,
      title: 'SAFETY STATUS UNKNOWN',
      defaultMsg: 'Reliable sensor or V2X communication is offline. Do not assume road is clear.',
      action: 'Rely solely on manual visual scanning. Treat crossing as uncontrolled.',
    },
  }[risk];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Driver Mode</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Connected V2X Simulator</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge className="w-4 h-4" />
                <span>Live Cockpit & Map</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'alerts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Safety Event Log</span>
              </div>
              {eventLog.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded">
                  {eventLog.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('zones')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'zones' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Conflict Zones</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{hazardZones.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Conflict Analytics</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                Recharts
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Quick weather status chip */}
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-500">Condition:</span>
            <span className="font-semibold text-slate-800 capitalize flex items-center gap-1">
              {weatherCondition === 'rain_wet' && <CloudRain className="w-3.5 h-3.5 text-blue-600" />}
              {weatherCondition === 'fog' && <CloudFog className="w-3.5 h-3.5 text-amber-600" />}
              {weatherCondition === 'clear' && <Sun className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{weatherCondition.replace('_', ' ')}</span>
            </span>
          </div>

          {/* Audio toggle quick control */}
          <button
            onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {settings.soundAlerts ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>Audible Warning Chime</span>
            </div>
            <span className="text-[11px] font-semibold">{settings.soundAlerts ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Driver Settings</span>
          </button>

          <button
            onClick={() => setMode('landing')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Driver Mode</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-y-auto max-w-7xl">
        {/* ============================================================== */}
        {/* SECTION A — DRIVER ALERT: ACTIVE CROSSING REQUEST & WARNINGS   */}
        {/* ============================================================== */}
        {activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled' ? (
          <section
            role="alert"
            aria-live="assertive"
            className={`p-5 lg:p-6 rounded-2xl border-2 shadow-lg transition-all ${
              risk === 'red' || conflictAssessment.distanceVehToConflictMeters < conflictAssessment.estimatedStoppingDistanceMeters
                ? 'bg-rose-50 border-rose-500 text-rose-950'
                : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    risk === 'red' ? 'bg-rose-600 text-white shadow-md' : 'bg-amber-500 text-slate-950 shadow-md'
                  }`}
                >
                  <Footprints className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg lg:text-xl font-black uppercase tracking-tight">
                      PEDESTRIAN WANTS TO CROSS
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                        risk === 'red' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {activeCrossingRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-300">
                      ID: {activeCrossingRequest.id}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    A pedestrian has submitted a crossing request near your vehicle.
                  </p>

                  {/* Actual Real Values Displayed */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1 text-slate-700">
                    <div>
                      <span className="font-medium text-slate-500">Distance: </span>
                      <strong className="font-mono text-sm text-slate-950">
                        Pedestrian crossing request detected — {Math.round(conflictAssessment.distanceVehToPedMeters)} m away.
                      </strong>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Speed: </span>
                      <strong className="font-mono text-sm text-slate-950">{vehicle.speedKmh} km/h</strong>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Location: </span>
                      <strong className="text-slate-950">
                        {activeCrossingRequest.crossingLocationName || 'Grand Ave Zebra Crossing'}
                      </strong>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Risk: </span>
                      <strong
                        className={`uppercase font-bold ${
                          risk === 'red' ? 'text-rose-700' : risk === 'yellow' ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {risk}
                      </strong>
                    </div>
                  </div>

                  {/* Required Action Guidance */}
                  <div className="mt-2 text-xs font-extrabold uppercase tracking-wide text-slate-900 bg-white/70 p-2 rounded-lg border border-slate-200">
                    RECOMMENDED ACTION: SLOW DOWN AND PREPARE TO STOP.
                  </div>

                  {/* Stopping Distance Inadequate Alert */}
                  {conflictAssessment.distanceVehToConflictMeters < conflictAssessment.estimatedStoppingDistanceMeters && vehicle.speedKmh > 5 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        URGENT: Insufficient stopping distance available! Required stopping distance (
                        {conflictAssessment.estimatedStoppingDistanceMeters}m) exceeds available distance (
                        {conflictAssessment.distanceVehToConflictMeters}m). Emergency braking applied — stop before crossing may not be possible!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Driver */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-stretch lg:self-auto shrink-0">
                {!activeCrossingRequest.driverAcknowledged ? (
                  <button
                    onClick={acknowledgeDriverWarning}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Acknowledge Warning
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300">
                    ✓ Acknowledged by Driver
                  </span>
                )}

                {vehicle.speedKmh > 0 ? (
                  <button
                    onClick={driverYieldAction}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Slow Down & Yield (Brake)
                  </button>
                ) : (
                  <span className="px-3.5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vehicle Stopped (0 km/h)</span>
                  </span>
                )}

                <button
                  onClick={() => soundService.speakCrossingRequested(activeCrossingRequest.crossingLocationName)}
                  title="Replay Voice Alert"
                  className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voice</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-900">SECTION A — DRIVER ALERT:</span>
              <span>No pending pedestrian crossing requests in corridor. Active V2X scanning enabled.</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Trigger: {warningDistanceThresholdMeters}m</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION C — VEHICLE STATUS: 5 COORDINATED TELEMETRY CARDS      */}
        {/* ============================================================== */}
        <section aria-label="Section C — Vehicle Status" className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>SECTION C — VEHICLE STATUS & TELEMETRY</span>
            <span>Synchronized Kinematic Model</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card 1: Current Speed */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Current Speed</span>
                <Gauge className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {vehicle.speedKmh}
                </span>
                <span className="text-xs font-semibold text-slate-500">km/h</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Target: {vehicle.targetSpeedKmh} km/h</span>
                <span className="font-mono">Limit: 40</span>
              </div>
            </div>

            {/* Card 2: Distance to Pedestrian / Crossing */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Distance to Crossing</span>
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {Math.round(conflictAssessment.distanceVehToCrossingMeters)}
                </span>
                <span className="text-xs font-semibold text-slate-500">meters</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>To Ped: {Math.round(conflictAssessment.distanceVehToPedMeters)}m</span>
                <span className="font-mono">Locus: {conflictAssessment.distanceVehToConflictMeters}m</span>
              </div>
            </div>

            {/* Card 3: Crossing Request Status */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Crossing Request</span>
                <Footprints className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <span className="text-xs font-black uppercase tracking-wide block text-slate-900 truncate">
                  {activeCrossingRequest ? activeCrossingRequest.status.replace('_', ' ') : 'NO REQUEST'}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block truncate">
                  {activeCrossingRequest ? (activeCrossingRequest.driverAcknowledged ? 'Driver Acknowledged' : 'Pending Ack') : 'Standby Mode'}
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>V2X Status:</span>
                <span className="font-bold text-blue-600">Connected</span>
              </div>
            </div>

            {/* Card 4: Current Risk Level */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Current Risk Level</span>
                {risk === 'red' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-md uppercase tracking-wider ${
                    risk === 'red'
                      ? 'bg-rose-100 text-rose-800'
                      : risk === 'yellow'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {risk.toUpperCase()}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {conflictAssessment.experimentalRiskScore}/100
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 truncate">
                {conflictAssessment.conflictStatus.replace('_', ' ')}
              </div>
            </div>

            {/* Card 5: Simulated Braking Status */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Braking Status</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs font-black uppercase tracking-wide block truncate ${
                    vehicle.speedKmh === 0
                      ? 'text-emerald-700'
                      : vehicle.isBraking
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {vehicle.speedKmh === 0
                    ? 'CONFIRMED STOPPED'
                    : vehicle.isBraking
                    ? 'DECELERATING / YIELD'
                    : 'CRUISING'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  d_stop: {conflictAssessment.estimatedStoppingDistanceMeters}m
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Friction μ:</span>
                <span className="font-mono font-bold">{conflictAssessment.frictionCoefficient}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE COLLISION ALERT BANNER */}
        {isCollisionOccurred && (
          <section
            role="alert"
            aria-live="assertive"
            className="p-4 lg:p-5 rounded-xl border-2 border-rose-600 bg-rose-600 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-start gap-3.5">
              <span className="text-3xl">💥</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight uppercase">Roadway Collision Occurred</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-white text-rose-700">
                    IMPACT DETECTED
                  </span>
                </div>
                <p className="mt-1 text-sm text-rose-100 font-medium leading-relaxed">
                  Collision detected at Grand Ave corridor. Pedestrian has stopped on the roadway; vehicle brought to emergency stop (0 km/h).
                </p>
                <div className="mt-1 text-xs text-rose-200">
                  Automated accident response protocol initiated. Emergency contacts and responders alerted.
                </div>
              </div>
            </div>
            <button
              onClick={clearCollision}
              className="shrink-0 px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs rounded-lg shadow transition-colors cursor-pointer"
            >
              Clear Collision
            </button>
          </section>
        )}

        {/* 50-METER PROXIMITY WARNING ANNOUNCEMENT BANNER */}
        {isUnder50mProximity && !isCollisionOccurred && (
          <section
            role="alert"
            aria-live="assertive"
            className="p-3.5 lg:p-4 rounded-xl border-2 border-amber-400 bg-amber-500 text-slate-950 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    ⚠️ Warning Announcement: Pedestrian Under 50 Meters
                  </h3>
                  <span className="bg-slate-950 text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
                    {Math.round(distanceVehToPedMeters)}m
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-900 font-medium">
                  Pedestrian is within 50 meters of vehicle corridor. Automatic voice announcement broadcasted. Slow down immediately!
                </p>
              </div>
            </div>
            <button
              onClick={playProximityAnnouncement}
              className="shrink-0 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Voice Alert</span>
            </button>
          </section>
        )}

        {/* PRIMARY WARNING BANNER */}
        <section
          role="alert"
          aria-live="assertive"
          className={`p-4 lg:p-5 rounded-xl border-2 transition-all ${warningConfig.bg} shadow-sm`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {warningConfig.icon}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight">{warningConfig.title}</h2>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${warningConfig.badge}`}>
                    {risk.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 font-mono px-2 py-0.5 bg-white/70 rounded border border-slate-200">
                    Status: {conflictAssessment.conflictStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium leading-relaxed">
                  {conflictAssessment.rationale || warningConfig.defaultMsg}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                  <span className="underline">Required Driver Action:</span>
                  <span>{conflictAssessment.recommendedDriverAction || warningConfig.action}</span>
                </div>
              </div>
            </div>

            {/* Quick emergency brake action */}
            {risk === 'red' && (
              <button
                onClick={triggerBrakeAssist}
                className="shrink-0 px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md transition-colors cursor-pointer"
              >
                Apply Emergency Brake
              </button>
            )}
          </div>
        </section>

        {/* SIMULATION CONTROLS */}
        <SimulationControls />

        {/* TAB 1: CONFLICT DATA VISUALIZATION (RECHARTS) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Telemetry Analytics Engine · Recharts Integration
              </span>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Return to Live Cockpit Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <ConflictDataVisualization />
          </div>
        )}

        {/* TAB 2: LIVE COCKPIT & MAP */}
        {activeTab === 'map' && (
          <div className="space-y-5">
            {/* INTERACTIVE MAP & TELEMETRY SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Map Column */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">Live Spatial Awareness Corridor</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {isLiveGpsActive && liveGpsState.coords ? (
                      <>
                        <span className="font-semibold text-slate-800">
                          {liveGpsState.streetName || (liveGpsState.isResolvingAddress ? 'Resolving street via Nominatim...' : 'Active GPS Roadway')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-blue-600 font-bold">
                          {liveGpsState.coords.lat.toFixed(4)}°N, {Math.abs(liveGpsState.coords.lng).toFixed(4)}°W
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Grand Ave & 4th St</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">37.788°N, 122.407°W</span>
                      </>
                    )}
                  </div>
                </div>

                <SafetyMap
                  interactiveHeight="h-[460px]"
                  onSelectPedestrian={() => setSelectedPedestrianView(true)}
                  showConflictZones={true}
                />

                {/* Road Speed Regulator */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span>Vehicle Speed Regulator:</span>
                    <span className="font-mono font-bold">{vehicle.speedKmh} km/h</span>
                    {vehicle.isBraking && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        BRAKING ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => slowDownVehicle(10)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer"
                    >
                      -10 km/h
                    </button>
                    <button
                      onClick={() => setVehicleSpeed(25)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer"
                    >
                      Cautious (25 km/h)
                    </button>
                    <button
                      onClick={() => setVehicleSpeed(40)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer"
                    >
                      Standard (40 km/h)
                    </button>
                    <button
                      onClick={() => setVehicleSpeed(vehicle.speedKmh + 10)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer"
                    >
                      +10 km/h
                    </button>
                  </div>
                </div>
              </div>

              {/* TELEMETRY INSPECTOR PANEL */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-bold text-slate-900">Spatial Telemetry Inspector</h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">ID: {pedestrian.id}</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Explicit distance breakdown */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Distance to Conflict Locus:</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {conflictAssessment.distanceVehToConflictMeters} m
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Distance to Zebra Crossing:</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {conflictAssessment.distanceVehToCrossingMeters} m
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Distance to Pedestrian:</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {conflictAssessment.distanceVehToPedMeters} m
                      </span>
                    </div>

                    {/* Stopping distance needed */}
                    <div className="flex items-center justify-between bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/80">
                      <span className="text-amber-900 font-medium">Stopping Distance Needed:</span>
                      <span className="font-mono font-bold text-amber-950">
                        {conflictAssessment.estimatedStoppingDistanceMeters} m
                      </span>
                    </div>

                    {/* Estimated Time to Conflict Point */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vehicle Arrival Time (t_veh):</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {conflictAssessment.tVehToConflictSec !== null
                          ? `${conflictAssessment.tVehToConflictSec}s`
                          : 'Non-Intersecting'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pedestrian Arrival Time (t_ped):</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {conflictAssessment.tPedToConflictSec !== null
                          ? `${conflictAssessment.tPedToConflictSec}s`
                          : 'Stationary'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Arrival Temporal Gap (|Δt|):</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {conflictAssessment.arrivalDeltaSec !== null
                          ? `${conflictAssessment.arrivalDeltaSec}s overlap`
                          : 'Diverging'}
                      </span>
                    </div>

                    {/* Relative Closing Speed */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Relative Closing Speed:</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {conflictAssessment.closingSpeedKmh} km/h
                      </span>
                    </div>

                    {/* Crossing Location Verification */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Crossing Location:</span>
                      <span
                        className={`font-semibold ${
                          pedestrian.atDesignatedCrossing ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {pedestrian.atDesignatedCrossing
                          ? 'Designated Zebra Crosswalk'
                          : 'Outside Designated Crossing'}
                      </span>
                    </div>

                    {/* Experimental Risk Index */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500">Experimental Risk Score:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {conflictAssessment.experimentalRiskScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            risk === 'red' ? 'bg-rose-500' : risk === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${conflictAssessment.experimentalRiskScore}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        *Heuristic risk index calculated from kinematics & geometry. Not a calibrated probability.
                      </p>
                    </div>

                    {/* Data Source & Sensor Confidence */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sensor Data Source:</span>
                        <span className="font-medium text-slate-700 capitalize">
                          {isLiveGpsActive ? 'Real Device GPS (W3C)' : pedestrian.dataSource.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Detection Confidence:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {conflictAssessment.detectionConfidencePct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={triggerBrakeAssist}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Brake Assist
                    </button>
                    <button
                      onClick={() => slowDownVehicle(10)}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Slow Down (-10)
                    </button>
                  </div>
                </div>

                {/* RECENT ALERTS BUFFER (QUICK STRIP) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Recent Safety Event Buffer
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Deduplicated</span>
                  </div>
                  {eventLog.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No active critical events recorded in session.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {eventLog.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-lg border text-xs ${
                            item.riskLevel === 'red'
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : item.riskLevel === 'yellow'
                              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{item.title}</span>
                            <span className="text-[10px] font-mono opacity-60">{item.timestamp}</span>
                          </div>
                          <p className="mt-1 text-[11px] opacity-90 line-clamp-2">{item.description}</p>
                          {item.outcome && (
                            <div className="mt-1 font-mono text-[10px] font-semibold opacity-75">
                              Outcome: {item.outcome}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK HISTORICAL CONFLICT TRENDS PREVIEW STRIP */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Historical Conflict Data Trends Available</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>24h Diurnal Curve</span>
                    <span aria-hidden="true">·</span>
                    <span>7-Day Conflict Rates</span>
                    <span aria-hidden="true">·</span>
                    <span>Road Infrastructure Risk Mapping</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Open Data Visualization Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DEDUPLICATED SAFETY EVENT LOG */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Session Safety Event Log</h3>
                <p className="text-xs text-slate-500">
                  Deduplicated record of predicted conflicts, braking assists, speed adjustments, and risk transitions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearEventLog}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Log</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Analytics</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {eventLog.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">No session events recorded yet.</p>
                <p>Run simulations or trigger brake assist to populate the event buffer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventLog.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border text-xs ${
                      log.riskLevel === 'red'
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                        : log.riskLevel === 'yellow'
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-2">
                        {log.riskLevel === 'red' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                        {log.riskLevel === 'yellow' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        {log.riskLevel === 'green' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                        {log.title}
                      </span>
                      <span className="font-mono text-[11px] opacity-75">{log.timestamp}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{log.description}</p>
                    <div className="mt-2 pt-1 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                      <span>Speed: {log.vehicleSpeedKmh} km/h</span>
                      {log.stoppingDistanceMeters !== undefined && (
                        <span>Stopping Dist: {log.stoppingDistanceMeters}m</span>
                      )}
                      {log.distanceToConflictMeters !== undefined && (
                        <span>Dist to Conflict: {log.distanceToConflictMeters}m</span>
                      )}
                      {log.outcome && (
                        <span className="font-semibold text-slate-800">Outcome: {log.outcome}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MUNICIPAL CONFLICT ZONES */}
        {activeTab === 'zones' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Municipal Conflict Zones & Road Hazards</h3>
                <p className="text-xs text-slate-500">Designated high-risk perimeters mapped across the Grand Ave corridor.</p>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Conflict Risk Trends by Infrastructure Type</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hazardZones.map((hz) => (
                <div
                  key={hz.id}
                  className={`p-4 rounded-xl border-2 space-y-2 ${
                    hz.riskRating === 'high' ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      hz.riskRating === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {hz.riskRating} Risk Zone
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{hz.radiusMeters}m Radius</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{hz.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{hz.description}</p>
                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                    Coord: {hz.center.lat.toFixed(4)}°N, {Math.abs(hz.center.lng).toFixed(4)}°W
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
