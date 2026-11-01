/**
 * SafeStep — What-If Live Telemetry & Safety Warning Panel
 *
 * Displays live kinematic telemetry, path intersection status,
 * safety warning banners with written labels, and explicit simulation indicators.
 */

import React from 'react';
import {
  WhatIfCrossingType,
  WhatIfPedestrianBehavior,
  WhatIfRiskCategory,
  WhatIfScenarioMetrics,
} from '../../services/safeStepWhatIfRiskEngine';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Gauge,
  Ruler,
  Clock,
  Footprints,
  Navigation,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SafeStepWhatIfTelemetryProps {
  metrics: WhatIfScenarioMetrics;
  pedestrianBehavior: WhatIfPedestrianBehavior;
  crossingType: WhatIfCrossingType;
  simulationStatus: 'Ready' | 'Running' | 'Paused' | 'Early Warning Engaged' | 'Emergency Braking Active';
}

export const SafeStepWhatIfTelemetry: React.FC<SafeStepWhatIfTelemetryProps> = ({
  metrics,
  pedestrianBehavior,
  crossingType,
  simulationStatus,
}) => {
  const getBannerStyles = (category: WhatIfRiskCategory) => {
    switch (category) {
      case 'CRITICAL RISK':
        return {
          container: 'bg-rose-50 border-rose-300 text-rose-950',
          badge: 'bg-rose-600 text-white',
          icon: <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />,
          title: 'CRITICAL RISK',
          defaultMessage: 'Immediate potential conflict detected. Apply appropriate braking.',
        };
      case 'HIGH RISK':
        return {
          container: 'bg-orange-50 border-orange-300 text-orange-950',
          badge: 'bg-orange-600 text-white',
          icon: <ShieldAlert className="w-6 h-6 text-orange-600 shrink-0" />,
          title: 'HIGH RISK',
          defaultMessage: 'Potential pedestrian conflict detected. Slow down and prepare to stop.',
        };
      case 'MODERATE RISK':
        return {
          container: 'bg-amber-50 border-amber-300 text-amber-950',
          badge: 'bg-amber-500 text-white',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />,
          title: 'MODERATE RISK',
          defaultMessage: 'An approaching pedestrian may enter the vehicle\'s path. Reduce speed if necessary.',
        };
      case 'LOW RISK':
      default:
        return {
          container: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />,
          title: 'LOW RISK',
          defaultMessage: 'Continue monitoring the road and remain alert.',
        };
    }
  };

  const banner = getBannerStyles(metrics.riskCategory);

  return (
    <div className="space-y-5">
      {/* SECTION 7: SAFETY WARNING BANNER */}
      <section
        role="alert"
        aria-live="assertive"
        className={`p-5 rounded-2xl border-2 transition-all shadow-xs ${banner.container}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {banner.icon}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">{banner.title}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${banner.badge}`}>
                  Simulated Advisory
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {banner.defaultMessage}
              </p>
              <div className="mt-1 text-xs font-medium text-slate-700">
                <span className="font-bold underline">Physical Rationale:</span> {metrics.rationale}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-slate-500 block">Recommended Action:</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5">
              {metrics.recommendedAction}
            </span>
          </div>
        </div>

        {metrics.uncertaintyWarning && (
          <div className="mt-3 pt-2.5 border-t border-amber-300/60 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <HelpCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{metrics.uncertaintyWarning}</span>
          </div>
        )}
      </section>

      {/* SECTION 8: SIMULATION TELEMETRY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* Metric 1: Vehicle Speed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Vehicle Speed</span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {metrics.vehicleSpeedKmh}
            </span>
            <span className="text-xs font-semibold text-slate-500">km/h ({metrics.vehicleSpeedMs} m/s)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            Simulated CAN Bus
          </div>
        </div>

        {/* Metric 2: Distance to Conflict Point */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Distance to Conflict</span>
            <Ruler className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {metrics.distanceMeters}
            </span>
            <span className="text-xs font-semibold text-slate-500">metres</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            Spatial Clearance
          </div>
        </div>

        {/* Metric 3: Estimated Vehicle Arrival Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Estimated Arrival</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {metrics.estimatedArrivalTimeSec !== null ? `${metrics.estimatedArrivalTimeSec}s` : 'Stationary'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            TTC = Distance / Speed
          </div>
        </div>

        {/* Metric 4: Estimated Stopping Distance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Stopping Dist</span>
            <Navigation className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {metrics.totalStoppingDistanceMeters}m
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            Reaction ({metrics.reactionDistanceMeters}m) + Brake ({metrics.brakingDistanceMeters}m)
          </div>
        </div>
      </div>

      {/* ADDITIONAL TELEMETRY ROW */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Pedestrian Status</span>
          <span className="font-semibold text-slate-900 capitalize block mt-0.5">
            {pedestrianBehavior.replace(/_/g, ' ')}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Crossing Type</span>
          <span className="font-semibold text-slate-900 capitalize block mt-0.5">
            {crossingType === 'zebra' ? 'Designated Zebra Crosswalk' : 'Unmarked Roadway'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Trajectory Intersection</span>
          <span className={`font-semibold block mt-0.5 ${metrics.pathConflictPredicted ? 'text-rose-600' : 'text-emerald-600'}`}>
            {metrics.pathConflictPredicted ? 'Conflict Vector Detected' : 'Clear Corridor'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Simulation Status</span>
          <span className="font-bold text-slate-900 block mt-0.5">
            {simulationStatus}
          </span>
        </div>
      </div>
    </div>
  );
};
