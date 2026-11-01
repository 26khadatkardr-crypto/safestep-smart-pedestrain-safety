/**
 * SafeStep — What-If Safety Simulator (Standalone Page Component)
 *
 * Provides an isolated, interactive what-if simulation environment to test how
 * vehicle speed, approach distance, pedestrian behaviors, crossing infrastructure,
 * and early warnings influence collision risks and stopping margins.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  calculateWhatIfRisk,
  compareWhatIfScenarios,
  WhatIfCrossingType,
  WhatIfPedestrianBehavior,
  WhatIfVisibility,
} from '../../services/safeStepWhatIfRiskEngine';
import { SafeStepWhatIfRoadCanvas } from './SafeStepWhatIfRoadCanvas';
import { SafeStepWhatIfControls } from './SafeStepWhatIfControls';
import { SafeStepWhatIfTelemetry } from './SafeStepWhatIfTelemetry';
import { SafeStepWhatIfComparison } from './SafeStepWhatIfComparison';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Car,
  Footprints,
  Activity,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';

export const SafeStepWhatIfSimulator: React.FC = () => {
  // Independent simulation states
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState<number>(45);
  const [vehicleDistanceMeters, setVehicleDistanceMeters] = useState<number>(45);
  const [pedestrianBehavior, setPedestrianBehavior] = useState<WhatIfPedestrianBehavior>('beginning_to_cross');
  const [crossingType, setCrossingType] = useState<WhatIfCrossingType>('zebra');
  const [visibility, setVisibility] = useState<WhatIfVisibility>('good');

  // Animation and intervention states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [isEarlyWarningActive, setIsEarlyWarningActive] = useState<boolean>(false);
  const [isEmergencyStopActive, setIsEmergencyStopActive] = useState<boolean>(false);
  const [currentDynamicSpeedKmh, setCurrentDynamicSpeedKmh] = useState<number>(45);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Synchronize dynamic speed with slider when not animating
  useEffect(() => {
    if (!isPlaying && simulationProgress === 0) {
      setCurrentDynamicSpeedKmh(vehicleSpeedKmh);
    }
  }, [vehicleSpeedKmh, isPlaying, simulationProgress]);

  // Calculate live metrics for current simulation state
  const currentMetrics = calculateWhatIfRisk({
    vehicleSpeedKmh: isPlaying ? currentDynamicSpeedKmh : vehicleSpeedKmh,
    vehicleDistanceMeters,
    pedestrianBehavior,
    crossingType,
    visibility,
    isEarlyWarningActive,
    isEmergencyStopActive,
  });

  // Calculate Two-Scenario Comparison (Scenario A: Baseline vs Scenario B: Early Warning)
  const comparison = compareWhatIfScenarios({
    vehicleSpeedKmh,
    vehicleDistanceMeters,
    pedestrianBehavior,
    crossingType,
    visibility,
  });

  const speedRef = useRef<number>(vehicleSpeedKmh);

  // Keep speedRef updated
  useEffect(() => {
    speedRef.current = currentDynamicSpeedKmh;
  }, [currentDynamicSpeedKmh]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaMs = Math.min(100, Math.max(1, timestamp - lastTimeRef.current));
      lastTimeRef.current = timestamp;

      // Step progress forward based on vehicle speed
      const speedFactor = Math.max(0.1, speedRef.current / 50);
      const progressDelta = (deltaMs / 3200) * speedFactor;

      setSimulationProgress((prev) => {
        const next = prev + progressDelta;
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      // Decelerate speed if braking or early warning active
      if (isEmergencyStopActive || isEarlyWarningActive) {
        setCurrentDynamicSpeedKmh((v) => Math.max(0, v - (isEmergencyStopActive ? 1.4 : 0.7)));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isEarlyWarningActive, isEmergencyStopActive]);

  const handleStartSimulation = () => {
    if (simulationProgress >= 1.0) {
      setSimulationProgress(0);
      setCurrentDynamicSpeedKmh(vehicleSpeedKmh);
    }
    setIsPlaying(true);
  };

  const handlePauseSimulation = () => {
    setIsPlaying(false);
  };

  const handleResumeSimulation = () => {
    setIsPlaying(true);
  };

  const handleResetSimulation = () => {
    setIsPlaying(false);
    setSimulationProgress(0);
    setIsEarlyWarningActive(false);
    setIsEmergencyStopActive(false);
    setCurrentDynamicSpeedKmh(vehicleSpeedKmh);
  };

  const handleSimulateEarlyWarning = () => {
    setIsEarlyWarningActive(true);
    setIsEmergencyStopActive(false);
    // Reduce target speed smoothly
    setCurrentDynamicSpeedKmh((prev) => Math.max(15, Math.round(prev * 0.55)));
  };

  const handleSimulateEmergencyStop = () => {
    setIsEmergencyStopActive(true);
    setIsEarlyWarningActive(true);
    setCurrentDynamicSpeedKmh(0);
  };

  // Determine current simulation status label
  const getSimulationStatus = () => {
    if (isEmergencyStopActive) return 'Emergency Braking Active';
    if (isEarlyWarningActive) return 'Early Warning Engaged';
    if (isPlaying) return 'Running';
    if (simulationProgress > 0 && simulationProgress < 1) return 'Paused';
    return 'Ready';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* BRAND & NAVIGATION HEADER */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              SS
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              SafeStep Smart Safety System
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What-If Safety Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Simulate how vehicle approach speed, distance, pedestrian posture, and early braking alerts
            transform collision risk, stopping distances, and clearance margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Main Applet</span>
          </a>
        </div>
      </header>

      {/* TOP-DOWN ANIMATED ROAD SCENE */}
      <section aria-label="Animated Road Scene" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold uppercase tracking-wider text-slate-700">
            Top-Down Road Dynamics & Conflict Visualization
          </span>
          <span className="font-mono">Scale: 1000px × 380px (WGS Simulated Grid)</span>
        </div>
        <SafeStepWhatIfRoadCanvas
          metrics={currentMetrics}
          crossingType={crossingType}
          pedestrianBehavior={pedestrianBehavior}
          visibility={visibility}
          simulationProgress={simulationProgress}
          isEarlyWarningActive={isEarlyWarningActive}
          isBraking={isEmergencyStopActive || currentDynamicSpeedKmh < vehicleSpeedKmh}
          currentSpeedKmh={currentDynamicSpeedKmh}
        />
      </section>

      {/* SAFETY WARNING & TELEMETRY PANELS */}
      <SafeStepWhatIfTelemetry
        metrics={currentMetrics}
        pedestrianBehavior={pedestrianBehavior}
        crossingType={crossingType}
        simulationStatus={getSimulationStatus()}
      />

      {/* SIMULATION CONTROLS */}
      <SafeStepWhatIfControls
        vehicleSpeedKmh={vehicleSpeedKmh}
        setVehicleSpeedKmh={setVehicleSpeedKmh}
        vehicleDistanceMeters={vehicleDistanceMeters}
        setVehicleDistanceMeters={setVehicleDistanceMeters}
        pedestrianBehavior={pedestrianBehavior}
        setPedestrianBehavior={setPedestrianBehavior}
        crossingType={crossingType}
        setCrossingType={setCrossingType}
        visibility={visibility}
        setVisibility={setVisibility}
        isPlaying={isPlaying}
        onStartSimulation={handleStartSimulation}
        onPauseSimulation={handlePauseSimulation}
        onResumeSimulation={handleResumeSimulation}
        onResetSimulation={handleResetSimulation}
        onSimulateEarlyWarning={handleSimulateEarlyWarning}
        onSimulateEmergencyStop={handleSimulateEmergencyStop}
        isEarlyWarningActive={isEarlyWarningActive}
        isEmergencyStopActive={isEmergencyStopActive}
      />

      {/* TWO-SCENARIO COMPARISON (SCENARIO A VS SCENARIO B) */}
      <SafeStepWhatIfComparison comparison={comparison} />

      {/* DOCUMENTED ASSUMPTIONS & EXPERIMENTAL LIMITATIONS */}
      <footer className="p-5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed shadow-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Physics Assumptions & Experimental Model Boundaries</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>
            <strong>Kinematics:</strong> Stopping distance is calculated via standard AASHTO mechanics: reaction distance (d_react = v × t_react) plus braking distance (d_brake = v² / 2a).
          </li>
          <li>
            <strong>Driver Reaction:</strong> Assumes 1.1s nominal driver perception-reaction time on good visibility, reduced to 0.5s when primed by an early SafeStep audible-visual warning, and extended to 1.9s under poor visibility.
          </li>
          <li>
            <strong>Braking Deceleration:</strong> Configured for dry asphalt at 6.8 m/s² under standard braking and 7.8 m/s² during emergency brake assist.
          </li>
          <li>
            <strong>Safety Disclaimer:</strong> This module is an independent analytical tool with simulated variables. It does not replace direct driver vigilance, physical braking capability, or road traffic regulations.
          </li>
        </ul>
      </footer>
    </div>
  );
};
