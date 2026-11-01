/**
 * SafeStep — Two-Scenario Comparison Component
 *
 * Compares Scenario A (Original Driving Conditions) with Scenario B (Early Warning & Response).
 * Features independent cards, dynamic deltas, and verified conflict resolution logic.
 */

import React from 'react';
import {
  WhatIfComparisonResult,
} from '../../services/safeStepWhatIfRiskEngine';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Gauge,
  Ruler,
} from 'lucide-react';

interface SafeStepWhatIfComparisonProps {
  comparison: WhatIfComparisonResult;
}

export const SafeStepWhatIfComparison: React.FC<SafeStepWhatIfComparisonProps> = ({
  comparison,
}) => {
  const { scenarioA, scenarioB, speedDeltaKmh, stoppingDistanceReductionMeters, arrivalMarginIncreaseSec, conflictResolved, summaryExplanation } = comparison;

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'CRITICAL RISK':
        return 'bg-rose-600 text-white';
      case 'HIGH RISK':
        return 'bg-orange-600 text-white';
      case 'MODERATE RISK':
        return 'bg-amber-500 text-white';
      case 'LOW RISK':
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const getRiskBorder = (category: string) => {
    switch (category) {
      case 'CRITICAL RISK':
        return 'border-rose-300 bg-rose-50/50';
      case 'HIGH RISK':
        return 'border-orange-300 bg-orange-50/50';
      case 'MODERATE RISK':
        return 'border-amber-300 bg-amber-50/50';
      case 'LOW RISK':
      default:
        return 'border-emerald-300 bg-emerald-50/50';
    }
  };

  return (
    <div className="space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Two-Scenario Comparative Impact Assessment
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating how proactive driver warning transforms kinetic stopping distance and clearance buffers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conflictResolved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conflict Resolved</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Conflict Persists</span>
            </span>
          )}
        </div>
      </div>

      {/* TWO INDEPENDENT SCENARIO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SCENARIO A: ORIGINAL CONDITIONS */}
        <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${getRiskBorder(scenarioA.riskCategory)}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Baseline Condition
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                SCENARIO A: Original Driving Conditions
              </h4>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${getRiskBadge(scenarioA.riskCategory)}`}>
              {scenarioA.riskCategory}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-0.5">Original Speed</span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioA.vehicleSpeedKmh} km/h
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-0.5">Original Distance</span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioA.distanceMeters}m
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-0.5">Estimated Arrival Time</span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioA.estimatedArrivalTimeSec !== null ? `${scenarioA.estimatedArrivalTimeSec}s` : 'Stationary'}
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-0.5">Est. Stopping Distance</span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioA.totalStoppingDistanceMeters}m
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Predicted Path Conflict:</span>
              <span className={`font-semibold ${scenarioA.pathConflictPredicted ? 'text-rose-700' : 'text-emerald-700'}`}>
                {scenarioA.pathConflictPredicted ? 'Yes — Trajectories Intersect' : 'No Intersecting Path'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Stopping Margin:</span>
              <span className={`font-mono font-bold ${scenarioA.safetyMarginMeters < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {scenarioA.safetyMarginMeters >= 0 ? `+${scenarioA.safetyMarginMeters}m (Safe)` : `${scenarioA.safetyMarginMeters}m (Overshoot)`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Experimental Risk Score:</span>
              <span className="font-mono font-bold text-slate-900">
                {scenarioA.experimentalRiskScore}/100
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200 leading-relaxed">
            {scenarioA.rationale}
          </p>
        </div>

        {/* SCENARIO B: EARLY WARNING & RESPONSE */}
        <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${getRiskBorder(scenarioB.riskCategory)}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                With SafeStep Proactive Intervention
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                SCENARIO B: Early Warning & Response
              </h4>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${getRiskBadge(scenarioB.riskCategory)}`}>
              {scenarioB.riskCategory}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Updated Speed</span>
                {speedDeltaKmh > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    -{speedDeltaKmh} km/h
                  </span>
                )}
              </div>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioB.vehicleSpeedKmh} km/h
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-0.5">Updated Distance</span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioB.distanceMeters}m
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Updated Arrival</span>
                {arrivalMarginIncreaseSec > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    +{arrivalMarginIncreaseSec}s
                  </span>
                )}
              </div>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioB.estimatedArrivalTimeSec !== null ? `${scenarioB.estimatedArrivalTimeSec}s` : 'Stationary'}
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Stopping Distance</span>
                {stoppingDistanceReductionMeters > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    -{stoppingDistanceReductionMeters}m
                  </span>
                )}
              </div>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {scenarioB.totalStoppingDistanceMeters}m
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Updated Path Conflict:</span>
              <span className={`font-semibold ${scenarioB.pathConflictPredicted ? 'text-amber-700' : 'text-emerald-700'}`}>
                {scenarioB.pathConflictPredicted ? 'Mitigated / Controlled Deceleration' : 'Resolved'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Updated Safety Buffer:</span>
              <span className="font-mono font-bold text-emerald-800">
                +{scenarioB.safetyMarginMeters}m clear
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Updated Risk Score:</span>
              <span className="font-mono font-bold text-slate-900">
                {scenarioB.experimentalRiskScore}/100
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200 leading-relaxed">
            {scenarioB.rationale}
          </p>
        </div>
      </div>

      {/* COMPARISON DELTA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Kinematic Variance & Safety Gain Matrix
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4">Scenario A (Baseline)</th>
                <th className="py-3 px-4">Scenario B (Early Warning)</th>
                <th className="py-3 px-4">Observed Difference (Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Vehicle Speed</td>
                <td className="py-3 px-4 font-mono">{scenarioA.vehicleSpeedKmh} km/h</td>
                <td className="py-3 px-4 font-mono">{scenarioB.vehicleSpeedKmh} km/h</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">-{speedDeltaKmh} km/h</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Total Stopping Distance</td>
                <td className="py-3 px-4 font-mono">{scenarioA.totalStoppingDistanceMeters}m</td>
                <td className="py-3 px-4 font-mono">{scenarioB.totalStoppingDistanceMeters}m</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">-{stoppingDistanceReductionMeters}m reduction</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Time to Conflict Locus</td>
                <td className="py-3 px-4 font-mono">{scenarioA.estimatedArrivalTimeSec ?? 'Stationary'}</td>
                <td className="py-3 px-4 font-mono">{scenarioB.estimatedArrivalTimeSec ?? 'Stationary'}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">+{arrivalMarginIncreaseSec}s gained buffer</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Safety Clearance Margin</td>
                <td className="py-3 px-4 font-mono">{scenarioA.safetyMarginMeters}m</td>
                <td className="py-3 px-4 font-mono">{scenarioB.safetyMarginMeters}m</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                  +{(scenarioB.safetyMarginMeters - scenarioA.safetyMarginMeters).toFixed(1)}m expansion
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Experimental Risk Score</td>
                <td className="py-3 px-4 font-mono">{scenarioA.experimentalRiskScore}/100</td>
                <td className="py-3 px-4 font-mono">{scenarioB.experimentalRiskScore}/100</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                  -{scenarioA.experimentalRiskScore - scenarioB.experimentalRiskScore} points
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Analytical Conclusion:</strong> {summaryExplanation}
          </p>
        </div>
      </div>
    </div>
  );
};
