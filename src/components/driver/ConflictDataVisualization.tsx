/**
 * SafeStep — Historical Conflict Data Visualization
 *
 * Utilizes Recharts to render historical pedestrian-vehicle conflict data trends,
 * time-of-day risk distributions, infrastructure conflict breakdowns,
 * and driver reaction lead-time metrics.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';
import {
  TrendingDown,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Layers,
  Info,
  Filter,
  CheckCircle2,
  Car,
  Activity,
  History,
  Radio,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';


// 1. 24-Hour Hourly Conflict Trend Data
const HOURLY_CONFLICT_DATA = [
  { time: '06:00', redAlerts: 0, yellowAlerts: 1, totalConflicts: 1, avgClosingSpeed: 44, pedestriansPresent: 6 },
  { time: '07:00', redAlerts: 1, yellowAlerts: 4, totalConflicts: 5, avgClosingSpeed: 42, pedestriansPresent: 28 },
  { time: '08:00', redAlerts: 3, yellowAlerts: 9, totalConflicts: 12, avgClosingSpeed: 38, pedestriansPresent: 64 },
  { time: '09:00', redAlerts: 2, yellowAlerts: 6, totalConflicts: 8, avgClosingSpeed: 40, pedestriansPresent: 45 },
  { time: '10:00', redAlerts: 1, yellowAlerts: 3, totalConflicts: 4, avgClosingSpeed: 41, pedestriansPresent: 30 },
  { time: '11:00', redAlerts: 1, yellowAlerts: 4, totalConflicts: 5, avgClosingSpeed: 39, pedestriansPresent: 38 },
  { time: '12:00', redAlerts: 3, yellowAlerts: 8, totalConflicts: 11, avgClosingSpeed: 36, pedestriansPresent: 72 },
  { time: '13:00', redAlerts: 2, yellowAlerts: 5, totalConflicts: 7, avgClosingSpeed: 39, pedestriansPresent: 51 },
  { time: '14:00', redAlerts: 1, yellowAlerts: 3, totalConflicts: 4, avgClosingSpeed: 43, pedestriansPresent: 35 },
  { time: '15:00', redAlerts: 4, yellowAlerts: 10, totalConflicts: 14, avgClosingSpeed: 37, pedestriansPresent: 85 }, // School zone peak
  { time: '16:00', redAlerts: 3, yellowAlerts: 9, totalConflicts: 12, avgClosingSpeed: 38, pedestriansPresent: 78 },
  { time: '17:00', redAlerts: 5, yellowAlerts: 13, totalConflicts: 18, avgClosingSpeed: 35, pedestriansPresent: 95 }, // Evening peak
  { time: '18:00', redAlerts: 4, yellowAlerts: 11, totalConflicts: 15, avgClosingSpeed: 36, pedestriansPresent: 90 },
  { time: '19:00', redAlerts: 2, yellowAlerts: 6, totalConflicts: 8, avgClosingSpeed: 41, pedestriansPresent: 55 },
  { time: '20:00', redAlerts: 2, yellowAlerts: 4, totalConflicts: 6, avgClosingSpeed: 44, pedestriansPresent: 34 },
  { time: '21:00', redAlerts: 1, yellowAlerts: 2, totalConflicts: 3, avgClosingSpeed: 46, pedestriansPresent: 20 },
  { time: '22:00', redAlerts: 0, yellowAlerts: 2, totalConflicts: 2, avgClosingSpeed: 48, pedestriansPresent: 12 },
];

// 2. 7-Day Day-by-Day Historical Trend Data (Showing proactive alerts reducing severe conflicts)
const SEVEN_DAY_DATA = [
  { day: 'Mon', date: 'Oct 20', redAlerts: 8, yellowAlerts: 24, safeClearances: 142, preventedIncidents: 6 },
  { day: 'Tue', date: 'Oct 21', redAlerts: 7, yellowAlerts: 26, safeClearances: 158, preventedIncidents: 5 },
  { day: 'Wed', date: 'Oct 22', redAlerts: 6, yellowAlerts: 21, safeClearances: 165, preventedIncidents: 6 },
  { day: 'Thu', date: 'Oct 23', redAlerts: 5, yellowAlerts: 19, safeClearances: 172, preventedIncidents: 4 },
  { day: 'Fri', date: 'Oct 24', redAlerts: 6, yellowAlerts: 28, safeClearances: 189, preventedIncidents: 7 },
  { day: 'Sat', date: 'Oct 25', redAlerts: 3, yellowAlerts: 16, safeClearances: 135, preventedIncidents: 3 },
  { day: 'Sun', date: 'Oct 26', redAlerts: 2, yellowAlerts: 12, safeClearances: 118, preventedIncidents: 2 },
];

// 3. 30-Day Aggregated Trend (Weekly Buckets)
const THIRTY_DAY_DATA = [
  { period: 'Week 1', redAlerts: 48, yellowAlerts: 162, avgLeadTimeSec: 2.4, systemAdoptionPct: 45 },
  { period: 'Week 2', redAlerts: 39, yellowAlerts: 148, avgLeadTimeSec: 2.8, systemAdoptionPct: 62 },
  { period: 'Week 3', redAlerts: 31, yellowAlerts: 135, avgLeadTimeSec: 3.2, systemAdoptionPct: 78 },
  { period: 'Week 4', redAlerts: 24, yellowAlerts: 126, avgLeadTimeSec: 3.5, systemAdoptionPct: 89 },
];

// 4. Infrastructure Breakdown Data (Conflict frequency by roadway type)
const INFRASTRUCTURE_CONFLICT_DATA = [
  {
    type: 'Midblock Unmarked',
    redAlerts: 26,
    yellowAlerts: 48,
    total: 74,
    description: 'Roadway segments without zebra markings or pedestrian signals',
  },
  {
    type: 'Bus Terminal Curve',
    redAlerts: 19,
    yellowAlerts: 35,
    total: 54,
    description: 'Parked buses obstructing lateral pedestrian line-of-sight',
  },
  {
    type: 'Commercial Corridor',
    redAlerts: 14,
    yellowAlerts: 42,
    total: 56,
    description: 'High retail foot-traffic with frequent curb crossing attempts',
  },
  {
    type: 'Zebra Crosswalk',
    redAlerts: 5,
    yellowAlerts: 28,
    total: 33,
    description: 'Designated high-visibility street crossing with curb ramps',
  },
  {
    type: 'Signalized Intersection',
    redAlerts: 2,
    yellowAlerts: 16,
    total: 18,
    description: 'Full signal-phased crossing with accessible pedestrian countdown',
  },
];

// 5. Driver Deceleration & Lead-Time Efficacy
const REACTION_EFFICACY_DATA = [
  { speedBracket: '20-29 km/h', avgDecelTimeSec: 1.1, stoppingDistMeters: 6.2, complianceRate: 98 },
  { speedBracket: '30-39 km/h', avgDecelTimeSec: 1.4, stoppingDistMeters: 11.5, complianceRate: 94 },
  { speedBracket: '40-49 km/h', avgDecelTimeSec: 1.8, stoppingDistMeters: 18.2, complianceRate: 88 },
  { speedBracket: '50+ km/h', avgDecelTimeSec: 2.2, stoppingDistMeters: 26.8, complianceRate: 74 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit = 'events' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1.5 min-w-[140px]">
        <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400">Grand Ave Corridor</span>
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ConflictDataVisualization: React.FC = () => {
  const { eventLog, clearEventLog } = useSafety();
  const [timeframe, setTimeframe] = useState<'hourly' | 'weekly' | 'monthly'>('weekly');
  const [metricFilter, setMetricFilter] = useState<'all' | 'high_risk' | 'caution'>('all');

  // Compute live session telemetry metrics from event log
  const sessionStats = useMemo(() => {
    const totalEvents = eventLog.length;
    const highRiskEvents = eventLog.filter((e) => e.riskLevel === 'red').length;
    const mediumRiskEvents = eventLog.filter((e) => e.riskLevel === 'yellow').length;
    const lowRiskEvents = eventLog.filter((e) => e.riskLevel === 'green').length;
    const brakeInterventions = eventLog.filter((e) => e.type === 'brake_assist').length;
    const conflictsAvoided = eventLog.filter((e) => e.outcome === 'avoided').length;
    const conflictsMitigated = eventLog.filter((e) => e.outcome === 'mitigated').length;

    const highRiskPct = totalEvents > 0 ? Math.round((highRiskEvents / totalEvents) * 100) : 0;
    const medRiskPct = totalEvents > 0 ? Math.round((mediumRiskEvents / totalEvents) * 100) : 0;
    const lowRiskPct = totalEvents > 0 ? Math.round((lowRiskEvents / totalEvents) * 100) : 0;

    return {
      totalEvents,
      highRiskEvents,
      mediumRiskEvents,
      lowRiskEvents,
      highRiskPct,
      medRiskPct,
      lowRiskPct,
      brakeInterventions,
      conflictsAvoided,
      conflictsMitigated,
    };
  }, [eventLog]);

  return (
    <div className="space-y-6">
      {/* 1. CURRENT LIVE SESSION SIMULATION TELEMETRY STRIP */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Current Live Session Telemetry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  REAL-TIME SIMULATION
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Active Simulation Run Metrics
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {sessionStats.totalEvents} recorded event{sessionStats.totalEvents === 1 ? '' : 's'}
            </span>
            {sessionStats.totalEvents > 0 && (
              <button
                onClick={clearEventLog}
                className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                title="Reset session telemetry log"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {sessionStats.totalEvents === 0 ? (
          <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
            <Radio className="w-7 h-7 text-slate-600 mx-auto animate-pulse" />
            <h4 className="text-sm font-bold text-slate-300">No Session Conflict Events Logged Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Run the pedestrian crossing simulation, switch scenarios (e.g. Scenario D), adjust weather, or trigger Brake Assist to capture live kinematic safety events.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Session Events
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
                  {sessionStats.totalEvents}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Logged kinematic state transitions</div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Risk Distribution</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {sessionStats.highRiskEvents} Red
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {sessionStats.mediumRiskEvents} Yel
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {sessionStats.lowRiskEvents} Grn
                  </span>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex mt-2">
                  <div style={{ width: `${sessionStats.highRiskPct}%` }} className="bg-rose-500" />
                  <div style={{ width: `${sessionStats.medRiskPct}%` }} className="bg-amber-400" />
                  <div style={{ width: `${sessionStats.lowRiskPct}%` }} className="bg-emerald-500" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Brake Interventions</span>
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
                  {sessionStats.brakeInterventions}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Simulated emergency stops triggered</div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Conflicts Avoided</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
                  {sessionStats.conflictsAvoided}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {sessionStats.conflictsMitigated > 0 ? `+${sessionStats.conflictsMitigated} mitigated speed` : 'Full stop before conflict'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. HISTORICAL BENCHMARK HEADER & CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Simulated Historical Baseline</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              AGGREGATED BENCHMARK
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            Corridor Conflict Trends & Predictive Analytics
          </h2>
          <p className="mt-1 text-xs text-slate-600 max-w-xl leading-relaxed">
            Corridor-level kinematic evaluation tracking conflict frequencies, high-risk braking triggers,
            and safety mitigation trends along Grand Ave & 4th St.
          </p>
        </div>

        {/* Timeframe Segmented Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setTimeframe('hourly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'hourly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24h Hourly Profile
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'weekly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4-Week Trend
          </button>
        </div>
      </div>

      {/* KPI METRIC STRIP (HISTORICAL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">High Collision Risks</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">37</span>
            <span className="text-xs font-semibold text-rose-600">-42% vs baseline</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Red Alert stop events this period</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Caution Decelerations</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">146</span>
            <span className="text-xs font-semibold text-emerald-600">Early Yields</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Yellow alerts prompted driver slowdown</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Avg Alert Lead-Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">3.4s</span>
            <span className="text-xs font-semibold text-slate-500">before conflict point</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Safe reaction interval for 40 km/h</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Peak Conflict Window</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-slate-900">17:00 – 18:30</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Evening rush & low sunset sun glare</p>
        </div>
      </div>

      {/* PRIMARY CONFLICT TREND CHART */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {timeframe === 'hourly' && '24-Hour Diurnal Conflict Cycle (Hourly Incident Breakdown)'}
              {timeframe === 'weekly' && '7-Day Longitudinal Conflict Trajectory (Oct 20 – Oct 26)'}
              {timeframe === 'monthly' && '4-Week Aggregated Safety Adoption Trend'}
            </h3>
            <p className="text-xs text-slate-500">
              Correlating high-risk brake incidents (Red) and caution notifications (Yellow) along monitored roadways.
            </p>
          </div>

          {/* Metric Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400 text-[11px] font-semibold uppercase">Filter:</span>
            <button
              onClick={() => setMetricFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setMetricFilter('high_risk')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricFilter === 'high_risk' ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Red (High Risk)
            </button>
            <button
              onClick={() => setMetricFilter('caution')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricFilter === 'caution' ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Yellow (Caution)
            </button>
          </div>
        </div>

        {/* CHART RENDERER BASED ON TIMEFRAME */}
        <div className="h-72 w-full pt-2">
          {timeframe === 'hourly' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_CONFLICT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip content={<CustomTooltip unit="events" />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
                {(metricFilter === 'all' || metricFilter === 'caution') && (
                  <Area
                    type="monotone"
                    dataKey="yellowAlerts"
                    name="Caution Decelerations (Yellow)"
                    stroke="#d97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorYellow)"
                  />
                )}
                {(metricFilter === 'all' || metricFilter === 'high_risk') && (
                  <Area
                    type="monotone"
                    dataKey="redAlerts"
                    name="Stop - High Risk Conflicts (Red)"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRed)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {timeframe === 'weekly' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SEVEN_DAY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip content={<CustomTooltip unit="events" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                {(metricFilter === 'all' || metricFilter === 'high_risk') && (
                  <Bar
                    dataKey="redAlerts"
                    name="High Risk Conflicts (Red)"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                )}
                {(metricFilter === 'all' || metricFilter === 'caution') && (
                  <Bar
                    dataKey="yellowAlerts"
                    name="Caution Alerts (Yellow)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                )}
                {metricFilter === 'all' && (
                  <Bar
                    dataKey="preventedIncidents"
                    name="Prevented Conflicts (Braked in Time)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}

          {timeframe === 'monthly' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={THIRTY_DAY_DATA} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  unit="s"
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                <Bar
                  yAxisId="left"
                  dataKey="redAlerts"
                  name="High-Risk Conflicts (Red)"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  yAxisId="left"
                  dataKey="yellowAlerts"
                  name="Caution Events (Yellow)"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgLeadTimeSec"
                  name="Avg Warning Lead-Time (Seconds)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* DUAL COLUMN: INFRASTRUCTURE BREAKDOWN & REACTION EFFICACY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infrastructure Risk Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>Conflict Frequency by Roadway Infrastructure Type</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies locations where lack of crossing facilities produces elevated collision risk.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={INFRASTRUCTURE_CONFLICT_DATA}
                margin={{ top: 5, right: 20, left: 45, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis
                  dataKey="type"
                  type="category"
                  tick={{ fontSize: 10.5, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={110}
                />
                <Tooltip content={<CustomTooltip unit="events" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="redAlerts" name="High Risk (Red)" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="yellowAlerts" name="Caution (Yellow)" fill="#f59e0b" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Safety Insight:</strong> Unmarked midblock crossings account for <strong>68% of all high-risk RED alerts</strong>. Adding designated zebra crossings with ADA curb ramps significantly lowers conflict probability.
            </p>
          </div>
        </div>

        {/* Speed & Stopping Distance Efficacy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-700" />
              <span>Speed vs Stopping Distance & Compliance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical stopping distances and driver yield compliance rates after receiving a SafeStep alert.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REACTION_EFFICACY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="speedBracket" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} unit="m" />
                <Tooltip content={<CustomTooltip unit="meters" />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" iconSize={8} />
                <Bar
                  dataKey="stoppingDistMeters"
                  name="Required Stopping Distance (Meters)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Under 30 km/h</span>
              <span className="font-bold text-sm">98% Yield Compliance</span>
              <span className="block text-[10px] opacity-80 mt-0.5">Safe full stop in 6.2m</span>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-900">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">Above 50 km/h</span>
              <span className="font-bold text-sm">74% Yield Compliance</span>
              <span className="block text-[10px] opacity-80 mt-0.5">Requires 26.8m stopping distance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
