/**
 * SafeStep — What-If Road Canvas
 *
 * Interactive, animated top-down SVG road simulation scene.
 * Visualizes roadway, vehicle motion, pedestrian traversal, zebra crossings,
 * predicted trajectory corridors, and stopping distance buffers.
 */

import React from 'react';
import {
  WhatIfCrossingType,
  WhatIfPedestrianBehavior,
  WhatIfRiskCategory,
  WhatIfScenarioMetrics,
  WhatIfVisibility,
} from '../../services/safeStepWhatIfRiskEngine';

interface SafeStepWhatIfRoadCanvasProps {
  metrics: WhatIfScenarioMetrics;
  crossingType: WhatIfCrossingType;
  pedestrianBehavior: WhatIfPedestrianBehavior;
  visibility: WhatIfVisibility;
  simulationProgress: number; // 0.0 to 1.0
  isEarlyWarningActive: boolean;
  isBraking: boolean;
  currentSpeedKmh: number;
}

export const SafeStepWhatIfRoadCanvas: React.FC<SafeStepWhatIfRoadCanvasProps> = ({
  metrics,
  crossingType,
  pedestrianBehavior,
  visibility,
  simulationProgress,
  isEarlyWarningActive,
  isBraking,
  currentSpeedKmh,
}) => {
  // Canvas coordinate system: 1000px width x 380px height
  // Conflict point is at X = 780, Y = 190 (middle of the road)
  const CONFLICT_X = 780;
  const ROAD_Y_TOP = 100;
  const ROAD_Y_BOTTOM = 280;
  const ROAD_Y_CENTER = 190;

  // Initial vehicle position based on distance:
  // 100m distance maps to X = 120; 5m maps to X = 740
  // Scale: 1 meter approx 6.6 pixels
  const validDist = Math.max(5, Math.min(100, Number(metrics.distanceMeters) || 45));
  const startX = Math.max(80, Math.min(CONFLICT_X - 30, CONFLICT_X - validDist * 6.6));

  // Forward stopping destination:
  // If safetyMargin > 0, the car stops safely before the conflict point
  // Otherwise it reaches the conflict locus
  const stoppingDistPx = Math.max(0, Number(metrics.totalStoppingDistanceMeters) || 0) * 6.6;
  const stopsSafely = Number(metrics.safetyMarginMeters) > 0;
  const targetStopX = stopsSafely
    ? Math.max(startX + 25, Math.min(CONFLICT_X - 35, startX + stoppingDistPx))
    : CONFLICT_X;

  const validProgress = Math.max(0, Math.min(1.0, Number(simulationProgress) || 0));
  const rawVehicleX = startX + (targetStopX - startX) * validProgress;
  const currentVehicleX = Number.isFinite(rawVehicleX) ? Math.max(startX, Math.min(CONFLICT_X + 10, rawVehicleX)) : startX;

  // Stopping distance indicator marker position
  const predictedStopX = Math.min(960, Math.max(currentVehicleX + 20, currentVehicleX + (Number(metrics.totalStoppingDistanceMeters) || 0) * 6.6));

  // Pedestrian position based on behavior and simulation progress:
  // Waiting: Top sidewalk (Y = 60)
  // Approaching: Walking down toward curb (Y = 60 -> 95)
  // Beginning to cross: At curb edge (Y = 100 -> 130)
  // Already crossing: Walking across road (Y = 130 -> 260)
  let pedBaseY = 60;
  if (pedestrianBehavior === 'approaching') {
    pedBaseY = 60 + 35 * simulationProgress;
  } else if (pedestrianBehavior === 'beginning_to_cross') {
    pedBaseY = 95 + 40 * simulationProgress;
  } else if (pedestrianBehavior === 'already_crossing') {
    pedBaseY = 130 + 130 * simulationProgress;
  }

  // Risk color mapping
  const riskColor = {
    'LOW RISK': '#10b981',
    'MODERATE RISK': '#f59e0b',
    'HIGH RISK': '#f97316',
    'CRITICAL RISK': '#ef4444',
  }[metrics.riskCategory];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md select-none">
      <svg
        viewBox="0 0 1000 380"
        className="w-full h-auto block"
        aria-label="Interactive Top-Down Road Safety Scene"
      >
        <defs>
          {/* Asphalt pattern */}
          <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Sidewalk pattern */}
          <pattern id="sidewalkTiles" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>

          {/* Headlights beam */}
          <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 240, 180, 0.45)" />
            <stop offset="100%" stopColor="rgba(255, 240, 180, 0.0)" />
          </linearGradient>

          {/* Fog Gradient */}
          <linearGradient id="fogOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(241, 245, 249, 0.35)" />
            <stop offset="50%" stopColor="rgba(226, 232, 240, 0.6)" />
            <stop offset="100%" stopColor="rgba(241, 245, 249, 0.4)" />
          </linearGradient>
        </defs>

        {/* 1. SIDEWALKS */}
        {/* Top Sidewalk */}
        <rect x="0" y="0" width="1000" height="100" fill="url(#sidewalkTiles)" />
        {/* Tactile paving yellow stripe along top curb */}
        <rect x="0" y="88" width="1000" height="12" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />

        {/* Bottom Sidewalk */}
        <rect x="0" y="280" width="1000" height="100" fill="url(#sidewalkTiles)" />
        {/* Tactile paving yellow stripe along bottom curb */}
        <rect x="0" y="280" width="1000" height="12" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />

        {/* 2. ROADWAY ASPHALT */}
        <rect x="0" y={ROAD_Y_TOP} width="1000" height="180" fill="url(#asphaltGrad)" />

        {/* Curb borders */}
        <line x1="0" y1={ROAD_Y_TOP} x2="1000" y2={ROAD_Y_TOP} stroke="#94a3b8" strokeWidth="3" />
        <line x1="0" y1={ROAD_Y_BOTTOM} x2="1000" y2={ROAD_Y_BOTTOM} stroke="#94a3b8" strokeWidth="3" />

        {/* Center Dashed Line */}
        <line
          x1="0"
          y1={ROAD_Y_CENTER}
          x2="1000"
          y2={ROAD_Y_CENTER}
          stroke="#f8fafc"
          strokeWidth="3"
          strokeDasharray="25, 20"
        />

        {/* White Edge Lines */}
        <line x1="0" y1="115" x2="1000" y2="115" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8, 12" />
        <line x1="0" y1="265" x2="1000" y2="265" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8, 12" />

        {/* 3. DISTANCE TICKS / SCALE */}
        <g opacity="0.6">
          {[100, 75, 50, 25, 10].map((dist) => {
            const tickX = CONFLICT_X - dist * 6.6;
            if (tickX < 20) return null;
            return (
              <g key={dist}>
                <line x1={tickX} y1="92" x2={tickX} y2="108" stroke="#ffffff" strokeWidth="1.5" />
                <line x1={tickX} y1="272" x2={tickX} y2="288" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x={tickX}
                  y="85"
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {dist}m
                </text>
              </g>
            );
          })}
        </g>

        {/* 4. CROSSING INFRASTRUCTURE */}
        {crossingType === 'zebra' ? (
          /* Zebra Crossing Stripes */
          <g id="zebra-crossing">
            {/* White reflective stripes */}
            {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162].map((offset) => (
              <rect
                key={offset}
                x={CONFLICT_X - 25}
                y={ROAD_Y_TOP + offset + 2}
                width="50"
                height="12"
                fill="#ffffff"
                rx="1"
              />
            ))}
            <text
              x={CONFLICT_X}
              y="315"
              fill="#0284c7"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              DESIGNATED ZEBRA CROSSING
            </text>
          </g>
        ) : (
          /* Unmarked Road Crossing Zone */
          <g id="unmarked-crossing">
            <rect
              x={CONFLICT_X - 30}
              y={ROAD_Y_TOP}
              width="60"
              height="180"
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6, 6"
            />
            <text
              x={CONFLICT_X}
              y="315"
              fill="#d97706"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              UNMARKED ROAD CROSSING
            </text>
          </g>
        )}

        {/* 5. DESIGNATED CONFLICT ZONE */}
        <g id="conflict-zone">
          <ellipse
            cx={CONFLICT_X}
            cy={ROAD_Y_CENTER + 40}
            rx="35"
            ry="25"
            fill="none"
            stroke={riskColor}
            strokeWidth="2.5"
            strokeDasharray="4, 4"
          />
          <text
            x={CONFLICT_X}
            y={ROAD_Y_CENTER + 44}
            fill={riskColor}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            CONFLICT PT
          </text>
        </g>

        {/* 6. PREDICTED VEHICLE TRAJECTORY CORRIDOR */}
        <line
          x1={currentVehicleX + 45}
          y1={ROAD_Y_CENTER + 40}
          x2={CONFLICT_X}
          y2={ROAD_Y_CENTER + 40}
          stroke={riskColor}
          strokeWidth="2"
          strokeDasharray="6, 6"
          opacity="0.8"
        />

        {/* 7. PREDICTED PEDESTRIAN TRAJECTORY */}
        <line
          x1={CONFLICT_X}
          y1={pedBaseY + 10}
          x2={CONFLICT_X}
          y2={ROAD_Y_BOTTOM - 20}
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="4, 4"
          opacity="0.75"
        />

        {/* 8. ESTIMATED STOPPING DISTANCE OVERLAY */}
        {currentSpeedKmh > 0 && (
          <g id="stopping-distance-indicator">
            <line
              x1={currentVehicleX + 45}
              y1={ROAD_Y_CENTER + 70}
              x2={predictedStopX}
              y2={ROAD_Y_CENTER + 70}
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <circle cx={predictedStopX} cy={ROAD_Y_CENTER + 70} r="4" fill="#e2e8f0" />
            <text
              x={(currentVehicleX + 45 + predictedStopX) / 2}
              y={ROAD_Y_CENTER + 83}
              fill="#e2e8f0"
              fontSize="9.5"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Stop Dist: {metrics.totalStoppingDistanceMeters}m
            </text>
          </g>
        )}

        {/* 9. VEHICLE (HEADLIGHTS, CHASSIS, DIRECTION) */}
        <g id="vehicle" transform={`translate(${currentVehicleX}, ${ROAD_Y_CENTER + 15})`}>
          {/* Headlights beam */}
          <polygon
            points="65,15 170,-10 170,60 65,35"
            fill="url(#headlightBeam)"
            opacity={visibility === 'poor' ? 0.4 : 0.8}
          />

          {/* Vehicle Body Shadow */}
          <rect x="-2" y="-2" width="74" height="42" rx="10" fill="rgba(0,0,0,0.4)" />

          {/* Main Car Body */}
          <rect
            x="0"
            y="0"
            width="70"
            height="38"
            rx="8"
            fill="#0f172a"
            stroke={isEarlyWarningActive ? '#f59e0b' : '#38bdf8'}
            strokeWidth="2"
          />

          {/* Windshield & Cabin */}
          <rect x="22" y="6" width="26" height="26" rx="4" fill="#1e293b" />
          <polygon points="12,10 20,8 20,30 12,28" fill="#334155" />
          <polygon points="48,8 58,10 58,28 48,30" fill="#334155" />

          {/* Wheels */}
          <rect x="10" y="-3" width="14" height="4" rx="2" fill="#020617" />
          <rect x="46" y="-3" width="14" height="4" rx="2" fill="#020617" />
          <rect x="10" y="37" width="14" height="4" rx="2" fill="#020617" />
          <rect x="46" y="37" width="14" height="4" rx="2" fill="#020617" />

          {/* Front Headlights */}
          <circle cx="68" cy="8" r="3" fill="#fef08a" />
          <circle cx="68" cy="30" r="3" fill="#fef08a" />

          {/* Rear Brake Lights (Glow red when braking or early warning active) */}
          <rect
            x="0"
            y="6"
            width="3"
            height="6"
            rx="1"
            fill={isBraking || isEarlyWarningActive ? '#ef4444' : '#7f1d1d'}
          />
          <rect
            x="0"
            y="26"
            width="3"
            height="6"
            rx="1"
            fill={isBraking || isEarlyWarningActive ? '#ef4444' : '#7f1d1d'}
          />

          {/* Speed badge on top of car */}
          <rect x="16" y="11" width="38" height="16" rx="4" fill="#ffffff" />
          <text
            x="35"
            y="23"
            fill="#0f172a"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {Math.round(currentSpeedKmh)} km/h
          </text>
        </g>

        {/* 10. PEDESTRIAN FIGURE & MOTION INDICATOR */}
        <g id="pedestrian" transform={`translate(${CONFLICT_X}, ${pedBaseY})`}>
          {/* Subtle safety aura */}
          <circle
            cx="0"
            cy="0"
            r="16"
            fill="none"
            stroke={pedestrianBehavior === 'waiting' ? '#10b981' : '#f59e0b'}
            strokeWidth="1.5"
            strokeDasharray="2, 2"
          />

          {/* Pedestrian Head */}
          <circle cx="0" cy="-6" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

          {/* Pedestrian Torso */}
          <rect x="-4" y="-1" width="8" height="12" rx="3" fill="#0284c7" />

          {/* Direction indicator arrow */}
          {pedestrianBehavior !== 'waiting' && (
            <polygon points="-3,14 3,14 0,20" fill="#38bdf8" />
          )}

          {/* Pedestrian Label */}
          <text
            x="14"
            y="2"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Pedestrian
          </text>
        </g>

        {/* 11. VISIBILITY FOG OVERLAY (IF POOR) */}
        {visibility === 'poor' && (
          <rect x="0" y="0" width="1000" height="380" fill="url(#fogOverlay)" pointerEvents="none" />
        )}
      </svg>

      {/* Floating Canvas Badges */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium text-white">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: riskColor }}></span>
          <span>{metrics.riskCategory}</span>
        </div>
        <span className="text-slate-500">|</span>
        <span>Distance: <strong className="font-mono text-white">{metrics.distanceMeters}m</strong></span>
        <span className="text-slate-500">|</span>
        <span>
          Arrival:{' '}
          <strong className="font-mono text-white">
            {metrics.estimatedArrivalTimeSec !== null ? `${metrics.estimatedArrivalTimeSec}s` : 'Stationary'}
          </strong>
        </span>
      </div>

      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 shadow-sm">
        <span className="text-slate-400">Simulation Status:</span>{' '}
        <span className="font-semibold text-white">
          {isBraking ? 'Braking Engaged' : isEarlyWarningActive ? 'Early Alert Active' : 'Normal Driving'}
        </span>
      </div>
    </div>
  );
};
