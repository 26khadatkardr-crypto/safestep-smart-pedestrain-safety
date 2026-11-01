/**
 * SafeStep — Pedestrian Mode Dashboard
 *
 * Highly accessible, high-contrast, large-button interface designed
 * for all pedestrians including children, seniors, and wheelchair users.
 */

import React, { useState } from 'react';
import {
  Footprints,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Volume2,
  CheckCircle2,
  MapPin,
  Search,
  Accessibility,
  ArrowRight,
  Route,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { SafetyMap } from '../map/SafetyMap';
import { SimulationControls } from '../simulation/SimulationControls';
import { soundService } from '../../services/SoundService';

export const PedestrianDashboard: React.FC = () => {
  const {
    conflictAssessment,
    pedestrian,
    vehicle,
    crosswalks,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    settings,
    updateSettings,
    setPedestrianIntent,
    setPedestrianProfile,
    setMode,
    requestRealGeolocation,
    isRealLocationActive,
    scenario,
    isUnder50mProximity,
    distanceVehToPedMeters,
    playProximityAnnouncement,
    isCollisionOccurred,
    clearCollision,
    trafficSegments,
    activeCrossingRequest,
    requestCrossing,
    cancelCrossingRequest,
    completeCrossingRequest,
    warningDistanceThresholdMeters,
  } = useSafety();

  const [destinationQuery, setDestinationQuery] = useState<string>('Grand Ave Transit Station');
  const [navigationActive, setNavigationActive] = useState<boolean>(false);
  const [nearestCrossingNotice, setNearestCrossingNotice] = useState<string | null>(null);

  const risk = conflictAssessment.riskLevel;

  // Warning styling & content tailored for pedestrian safety
  const warningConfig = {
    green: {
      bg: 'bg-emerald-50 border-emerald-400 text-emerald-950',
      badgeBg: 'bg-emerald-600 text-white',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />,
      title: 'LOWER DETECTED RISK',
      body: 'No immediate conflict has been detected. Check that the road is clear before crossing.',
      advice: 'Look both ways. Never step onto the roadway without confirming moving cars have yielded.',
    },
    yellow: {
      bg: 'bg-amber-50 border-amber-400 text-amber-950',
      badgeBg: 'bg-amber-600 text-white',
      icon: <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />,
      title: 'CAUTION — POSSIBLE VEHICLE CONFLICT',
      body: 'A potential traffic hazard has been detected. Wait or reassess the situation.',
      advice: 'Stay on the sidewalk curb. Make direct eye contact with the approaching driver before attempting to cross.',
    },
    red: {
      bg: 'bg-rose-50 border-rose-400 text-rose-950',
      badgeBg: 'bg-rose-600 text-white',
      icon: <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />,
      title: 'DANGER — DO NOT CROSS',
      body: 'A high-risk situation has been detected. Stay off the road and wait for conditions to improve.',
      advice: 'STOP AT CURB. Vehicle is approaching rapidly and may not be able to stop in time.',
    },
    unknown: {
      bg: 'bg-slate-100 border-slate-400 text-slate-900',
      badgeBg: 'bg-slate-700 text-white',
      icon: <HelpCircle className="w-8 h-8 text-slate-600 shrink-0" />,
      title: 'SAFETY STATUS UNKNOWN',
      body: 'Reliable traffic information is unavailable. Check traffic carefully and use a designated crossing whenever possible.',
      advice: 'Camera / V2X sensors offline. Assume vehicles do NOT see you. Use designated signalized crossing.',
    },
  }[risk];

  const handleLocateNearestCrossing = () => {
    const zebra = crosswalks.find((c) => c.isWheelchairAccessible) || crosswalks[0];
    setNearestCrossingNotice(`Nearest verified crossing is "${zebra.name}" (~35 meters North-East with ADA curb cuts).`);
    if (settings.voiceAlerts) {
      soundService.speakGuidance(`Nearest designated crossing is ${zebra.name}, thirty five meters ahead.`, 'green', true);
    }
  };

  const handleSpeakStatus = () => {
    soundService.speakGuidance(`${warningConfig.title}. ${warningConfig.body}`, risk, true);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* A. WELCOME PANEL */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Footprints className="w-4 h-4 text-emerald-600" />
            <span>Pedestrian Safety Companion</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Let's Find a Safer Way.
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            Live crossing risk detection, accessible route guidance, and real-time alerts for approaching vehicles.
          </p>
        </div>

        {/* Mobility Mode Quick Select */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-500 mr-1">Your Profile:</div>
          <button
            onClick={() => setPedestrianProfile('standard')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              pedestrian.mobilityProfile === 'standard'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setPedestrianProfile('senior')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              pedestrian.mobilityProfile === 'senior'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Senior (Extended Time)
          </button>
          <button
            onClick={() => {
              setPedestrianProfile('wheelchair');
              setSelectedRouteId('route-accessible');
              updateSettings({ wheelchairRoutingRequired: true });
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
              pedestrian.mobilityProfile === 'wheelchair'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>Wheelchair / Ramps</span>
          </button>
        </div>
      </section>

      {/* ACTIVE COLLISION ALERT BANNER */}
      {isCollisionOccurred && (
        <section
          role="alert"
          aria-live="assertive"
          className="p-5 lg:p-6 rounded-2xl border-2 border-rose-600 bg-rose-600 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-start gap-3.5">
            <span className="text-3xl">💥</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg lg:text-xl font-black tracking-tight uppercase">
                  Roadway Collision Occurred — Pedestrian Halted
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-white text-rose-700">
                  HALTED ON ROAD
                </span>
              </div>
              <p className="mt-1 text-sm text-rose-100 font-medium leading-relaxed">
                Impact occurred on roadway corridor. Pedestrian has stopped on the roadway; approaching vehicle emergency halted at 0 km/h.
              </p>
              <div className="mt-1 text-xs text-rose-200">
                Automated emergency signal sent to first responders. Remain stationary and wait for assistance.
              </div>
            </div>
          </div>
          <button
            onClick={clearCollision}
            className="shrink-0 px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs rounded-xl shadow transition-colors cursor-pointer"
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
          className="p-4 lg:p-5 rounded-2xl border-2 border-amber-400 bg-amber-500 text-slate-950 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-slate-950 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider">
                  ⚠️ 50-Meter Proximity Warning Announcement
                </h3>
                <span className="bg-slate-950 text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
                  {Math.round(distanceVehToPedMeters)}m
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-950 font-semibold">
                Approaching vehicle is within 50 meters! Automatic voice announcement issued. Stay on curb until car stops completely!
              </p>
            </div>
          </div>
          <button
            onClick={playProximityAnnouncement}
            className="shrink-0 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
            <span>Replay Voice Alert</span>
          </button>
        </section>
      )}

      {/* ============================================================== */}
      {/* 1. PROMINENT PEDESTRIAN CROSSING REQUEST FEATURE & TIMELINE     */}
      {/* ============================================================== */}
      <section
        aria-label="Pedestrian Crossing Request System"
        className="bg-white rounded-2xl border-2 border-blue-500 p-5 lg:p-6 shadow-md space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white shadow-xs">
                <Footprints className="w-4 h-4" />
              </span>
              <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">
                Connected Pedestrian Crossing Request
              </h2>
              {activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled' ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 animate-pulse">
                  ACTIVE REQUEST
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                  READY
                </span>
              )}
            </div>
            <p className="text-xs lg:text-sm text-slate-600">
              Broadcasts a V2X crossing signal to approaching vehicles, displays a cockpit warning to drivers, and initiates yielding deceleration.
            </p>
          </div>

          {/* Current Request Status Message Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">
                Current Status:
              </span>
              <span className="font-bold text-slate-900">
                {activeCrossingRequest ? (
                  activeCrossingRequest.status === 'requested' ? (
                    'Crossing request sent to the driver dashboard.'
                  ) : activeCrossingRequest.status === 'waiting' ? (
                    'Waiting for the simulated vehicle to respond.'
                  ) : activeCrossingRequest.status === 'vehicle_slowing' ? (
                    'Vehicle is slowing down in the simulation.'
                  ) : activeCrossingRequest.status === 'vehicle_stopped' ? (
                    'The simulated vehicle has stopped. Check the road carefully before crossing.'
                  ) : activeCrossingRequest.status === 'completed' ? (
                    'Crossing marked as completed.'
                  ) : (
                    'Ready to request a crossing.'
                  )
                ) : (
                  'Ready to request a crossing.'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Request Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {(!activeCrossingRequest || activeCrossingRequest.status === 'completed' || activeCrossingRequest.status === 'cancelled') ? (
            <button
              onClick={() => {
                const res = requestCrossing();
                setNearestCrossingNotice(res.message);
              }}
              className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base lg:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Footprints className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="block leading-tight tracking-wide uppercase">REQUEST TO CROSS ROAD</span>
                <span className="block text-xs text-blue-100 font-normal">Ready to request a crossing.</span>
              </div>
            </button>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              {activeCrossingRequest.status === 'vehicle_stopped' ? (
                <button
                  onClick={completeCrossingRequest}
                  className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm lg:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Mark Crossing as Completed</span>
                </button>
              ) : (
                <div className="flex-1 py-3 px-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping shrink-0" />
                  <div>
                    <span className="font-bold block">
                      {activeCrossingRequest.status === 'vehicle_slowing'
                        ? 'Vehicle is slowing down in the simulation.'
                        : activeCrossingRequest.status === 'waiting'
                        ? 'Waiting for the simulated vehicle to respond.'
                        : 'Crossing request sent to the driver dashboard.'}
                    </span>
                    <span className="text-[11px] text-blue-700">
                      Driver cockpit alerted. Trigger threshold: {warningDistanceThresholdMeters}m.
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => cancelCrossingRequest()}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          )}

          {/* Quick Speak button for accessibility */}
          <button
            onClick={() => {
              if (activeCrossingRequest) {
                soundService.speakGuidance(
                  activeCrossingRequest.status === 'vehicle_stopped'
                    ? 'The simulated vehicle has stopped. Check the road carefully before crossing.'
                    : activeCrossingRequest.status === 'vehicle_slowing'
                    ? 'Vehicle is slowing down in the simulation.'
                    : 'Crossing request sent to the driver dashboard. Waiting for simulated vehicle to respond.',
                  'yellow',
                  true
                );
              } else {
                soundService.speakGuidance('Ready to request a crossing. Press the blue request button to notify approaching drivers.', 'green', true);
              }
            }}
            className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="Hear Crossing Status"
          >
            <Volume2 className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline">Hear Status</span>
          </button>
        </div>

        {/* Live Crossing Request Details & Visual Event Timeline (Requirement 6) */}
        {activeCrossingRequest && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Metadata Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Request ID</span>
                <span className="font-mono font-bold text-slate-900 truncate block">
                  {activeCrossingRequest.id}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Crossing Point</span>
                <span className="font-semibold text-slate-900 truncate block">
                  {activeCrossingRequest.crossingLocationName || 'Grand Ave Zebra Crossing'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Vehicle Distance</span>
                <span className="font-mono font-bold text-blue-700 block">
                  {activeCrossingRequest.currentDistanceMeters ?? Math.round(distanceVehToPedMeters)} m
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Vehicle Speed</span>
                <span className="font-mono font-bold text-slate-900 block">
                  {vehicle.speedKmh} km/h
                </span>
              </div>
            </div>

            {/* Visual Timeline of Events (Requirement 6) */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Visual Crossing Timeline (Coordinated Simulation Progress)
              </span>
              <div className="space-y-1.5">
                {activeCrossingRequest.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-slate-600 font-normal ml-1.5">— {item.description}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CROSSING RISK BANNER (ACCESSIBLE, PROMINENT, HIGH CONTRAST) */}
      <section
        role="alert"
        aria-live="assertive"
        className={`p-6 rounded-2xl border-2 transition-all ${warningConfig.bg} shadow-md`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {warningConfig.icon}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl lg:text-2xl font-black tracking-tight">
                  {warningConfig.title}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${warningConfig.badgeBg}`}>
                  {risk.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold leading-relaxed">
                {warningConfig.body}
              </p>
              <div className="mt-2 text-sm opacity-90 flex items-center gap-1.5">
                <span className="font-bold underline">Advice:</span>
                <span>{warningConfig.advice}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
            <button
              onClick={handleSpeakStatus}
              className="px-4 py-3 bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              title="Hear status spoken aloud"
            >
              <Volume2 className="w-5 h-5 text-slate-800" />
              <span>Hear Status</span>
            </button>
            <button
              onClick={() => setPedestrianIntent(!pedestrian.intentToCross)}
              className={`px-4 py-3 font-bold text-sm rounded-xl text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                pedestrian.intentToCross ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {pedestrian.intentToCross ? 'Hold at Sidewalk' : 'Ready to Cross'}
            </button>
          </div>
        </div>

        {/* Proximity Details for Pedestrian */}
        <div className="mt-4 pt-3 border-t border-slate-300/60 flex flex-wrap items-center justify-between text-xs font-medium text-slate-700 gap-2">
          <div className="flex items-center gap-2">
            <span>Nearest Vehicle Distance:</span>
            <span className="font-mono font-bold text-sm">{conflictAssessment.distanceMeters}m</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Estimated Vehicle Speed:</span>
            <span className="font-mono font-bold text-sm">{vehicle.speedKmh} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Sensor Source:</span>
            <span className="capitalize">{scenario.sensorIntegrity === 'nominal' ? 'Roadside Vision + V2P' : scenario.sensorIntegrity === 'degraded_fog' ? 'Vision Degraded (Fog)' : 'Sensors Offline'}</span>
          </div>
        </div>
      </section>

      {/* MAIN ACTION BUTTONS */}
      <section aria-label="Main pedestrian actions" className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <button
          onClick={() => {
            setSelectedRouteId('route-accessible');
            if (settings.voiceAlerts) {
              soundService.speakGuidance('Calculating safest route with designated signalized crossings and wheelchair curb ramps.', 'green', true);
            }
          }}
          className="p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Route className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-900">Find Safer Route</span>
          <span className="text-xs text-slate-500">Crossings & curb cuts</span>
        </button>

        <button
          onClick={handleSpeakStatus}
          className="p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-900">Check Crossing Risk</span>
          <span className="text-xs text-slate-500">Assess approaching traffic</span>
        </button>

        <button
          onClick={handleLocateNearestCrossing}
          className="p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-900">Locate Crossing</span>
          <span className="text-xs text-slate-500">Zebra & signalized ramps</span>
        </button>

        <button
          onClick={() => {
            setNavigationActive(!navigationActive);
            if (!navigationActive && settings.voiceAlerts) {
              soundService.speakGuidance('Safe navigation started. Follow tactile pedestrian footpath toward Grand Ave.', 'green', true);
            }
          }}
          className={`p-4 border-2 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm transition-all group ${
            navigationActive
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
            navigationActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'
          }`}>
            <Navigation className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold">
            {navigationActive ? 'Navigation Active' : 'Start Navigation'}
          </span>
          <span className={`text-xs ${navigationActive ? 'text-slate-300' : 'text-slate-500'}`}>
            Turn-by-turn guidance
          </span>
        </button>
      </section>

      {/* Nearest Crossing Banner Notice */}
      {nearestCrossingNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{nearestCrossingNotice}</span>
          </div>
          <button
            onClick={() => setNearestCrossingNotice(null)}
            className="text-xs font-semibold text-blue-800 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SIMULATION CONTROLLER */}
      <SimulationControls />

      {/* B. DESTINATION SEARCH & ROUTE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route Planner & Preferences */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-700" />
                <span>Pedestrian Route Planner</span>
              </h3>
              <button
                onClick={() => requestRealGeolocation()}
                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                  isRealLocationActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isRealLocationActive ? 'Real GPS Locked' : 'Use Current GPS'}
              </button>
            </div>

            {/* Destination Input */}
            <div>
              <label htmlFor="destination-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Destination Address:
              </label>
              <div className="relative">
                <input
                  id="destination-input"
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  placeholder="Enter street or building..."
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* SAFETY PREFERENCE CONTROLS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Safety & Accessibility Filters:
              </div>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                <span className="font-medium text-slate-800">Wheelchair-Accessible Route</span>
                <input
                  type="checkbox"
                  checked={settings.wheelchairRoutingRequired}
                  onChange={(e) => {
                    updateSettings({ wheelchairRoutingRequired: e.target.checked });
                    if (e.target.checked) setSelectedRouteId('route-accessible');
                  }}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                <span className="font-medium text-slate-800">Prefer Designated Crossings</span>
                <input
                  type="checkbox"
                  checked={settings.preferDesignatedCrossings}
                  onChange={(e) => updateSettings({ preferDesignatedCrossings: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                <span className="font-medium text-slate-800">Spoken Audio Instructions</span>
                <input
                  type="checkbox"
                  checked={settings.voiceAlerts}
                  onChange={(e) => updateSettings({ voiceAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                <span className="font-medium text-slate-800">Vibration Haptic Feedback</span>
                <input
                  type="checkbox"
                  checked={settings.vibrationAlerts}
                  onChange={(e) => updateSettings({ vibrationAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                <span className="font-medium text-slate-800">High-Contrast Display</span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </label>
            </div>
          </div>

          {/* ROUTE RECOMMENDATION EXPLANATION & COMPARISON */}
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recommended Route Rationale:</span>
              </div>
              <p className="leading-relaxed">
                {selectedRouteId === 'route-accessible'
                  ? 'Selected "Accessible Grand Transit Promenade": Avoids uncontrolled road crossings, provides 100% compliant curb cut ramps and audible signals with a 9.4/10 safety index, despite adding 90m compared to the midblock shortcut.'
                  : selectedRouteId === 'route-parkway-signalized'
                  ? 'Selected "Parkway Signalized Protected Bypass": Maximum safety rating (9.7/10) with multi-phase countdown signals and median pedestrian refuge, prioritizing zero exposure to free-flowing vehicles.'
                  : 'Direct Midblock Shortcut selected: Warning — involves crossing multi-lane roadway outside designated zebra crossing with concrete curb steps. Exercise extreme vigilance.'}
              </p>
              <div className="text-[10px] text-emerald-700 italic">
                *Simulated safety estimate. No route can guarantee accident prevention; always verify traffic yields before crossing.
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Compare Available Routes ({routes.length}):
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Simulated Estimates</span>
            </div>

            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              const isRecommended = r.id === 'route-accessible';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-white shadow-md ring-1 ring-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.tagline}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono tabular-nums text-slate-900">
                        {r.estimatedMinutes} min
                      </span>
                      <div className="text-[11px] text-slate-500">{r.distanceMeters}m</div>
                    </div>
                  </div>

                  {/* Safety Rating Meter */}
                  <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">Safety Assessment:</span>
                    <span className={`font-mono font-bold ${
                      r.averageSafetyIndex >= 9 ? 'text-emerald-700' : r.averageSafetyIndex >= 7 ? 'text-blue-700' : 'text-rose-700'
                    }`}>
                      {r.averageSafetyIndex} / 10
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                    {r.isWheelchairAccessible && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">
                        ADA Compliant Ramps
                      </span>
                    )}
                    {r.hasDesignatedCrossings ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200">
                        Designated Crossings Only
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded border border-rose-200">
                        Midblock Road Crossing (Hazardous)
                      </span>
                    )}
                  </div>

                  <ul className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    {r.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {r.caveats.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Map & Real-Time Street Perception */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Interactive Pedestrian Safety Map</h3>
                <p className="text-xs text-slate-500">
                  Showing designated zebra crossings, sidewalk paths, and approaching vehicle trajectories.
                </p>
              </div>
              <button
                onClick={() => setMode('driver')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline flex items-center gap-1"
              >
                <span>Switch to Driver Mode</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <SafetyMap
              interactiveHeight="h-[480px]"
              showConflictZones={true}
            />
          </div>

          {/* Infrastructure Reality Note */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 leading-relaxed">
            <strong className="text-slate-800 block">Civic Safety Infrastructure Notice:</strong>
            <p>
              SafeStep connects with compliant smart-city vision nodes and V2X-equipped vehicles. Detecting non-participating road users (unconnected older vehicles or pedestrians without devices) relies on compatible roadside camera infrastructure and municipal edge sensors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
