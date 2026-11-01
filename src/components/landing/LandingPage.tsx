/**
 * SafeStep — Landing Page
 *
 * Implements the domain-native marketing & safety presentation:
 * - Anti-slop aesthetic: Plus Jakarta Sans typography, 60-30-10 color discipline
 * - Zero-pill metadata
 * - High-fidelity generated imagery with fallback containers
 * - Interactive mode selection (Driver vs Pedestrian)
 * - How it works & Accessibility architecture
 */

import React, { useState } from 'react';
import {
  Car,
  Footprints,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Volume2,
  Accessibility,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Zap,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';

export const LandingPage: React.FC = () => {
  const { setMode, setIsSettingsOpen, setIsPrivacyOpen } = useSafety();
  const [heroImageLoaded, setHeroImageLoaded] = useState(true);

  return (
    <div className="bg-[#f8fafc] text-slate-900 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative px-6 lg:px-12 pt-12 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-semibold tracking-wider uppercase text-blue-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              <span>Intelligent Road Safety Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] text-balance">
              Safer Roads Start with Smarter Decisions.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              SafeStep connects drivers and pedestrians through intelligent safety alerts,
              road-risk awareness, and accessible route guidance. Detect early. Alert instantly. Cross safely.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setMode('dual_view')}
                className="px-6 py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 group"
              >
                <span>Start SafeStep</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <a
                href="#features"
                className="px-6 py-3.5 bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-xs"
              >
                Explore Features
              </a>
            </div>

            {/* Quiet Metadata strip */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>Dual Interactive Cockpits</span>
              <span aria-hidden="true">·</span>
              <span>Sub-second Kinematic TTC</span>
              <span aria-hidden="true">·</span>
              <span>Accessible Routing & Audio Chimes</span>
            </div>
          </div>

          {/* Hero Visual Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-slate-900 aspect-16/9 lg:aspect-4/3 group">
              <img
                src="/src/assets/images/hero_pedestrian_safety_1793091839473.jpg"
                alt="Urban pedestrian crossing corridor with smart streetlights"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
                onError={() => setHeroImageLoaded(false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

              {/* In-situ Live Telemetry Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/70 shadow-lg text-xs text-slate-800">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>Grand Ave Safety Perimeter</span>
                  </span>
                  <span className="text-emerald-700 font-mono">Sensors Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Monitored Zebra Crosswalks: 4</span>
                  <span>Closing Speed Threshold: 25 km/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. MODE SELECTION (TWO PROMINENT CARDS) */}
      <section id="modes" className="px-6 lg:px-12 py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Select Your Mobility Experience
            </h2>
            <p className="text-sm text-slate-600">
              SafeStep adapts in real time to whether you are in the driver's seat or navigating on foot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CARD 1: DRIVER MODE */}
            <div className="bg-[#f8fafc] rounded-2xl border-2 border-slate-200 hover:border-slate-400 transition-all p-6 lg:p-8 flex flex-col justify-between shadow-xs group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Car className="w-6 h-6" />
                </div>

                <div className="aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-800">
                  <img
                    src="/src/assets/images/driver_mode_preview_1793091840421.jpg"
                    alt="Driver cockpit heads-up road view"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-xl font-bold text-slate-900">Driver Mode</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Receive pedestrian alerts, monitor potential conflict zones, and navigate with improved road awareness.
                </p>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time pedestrian trajectory conflict prediction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated emergency brake-assist simulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Distinct multi-tone audible warnings for Red & Yellow alerts</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setMode('driver')}
                  className="w-full py-3 px-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Driver Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CARD 2: PEDESTRIAN MODE */}
            <div className="bg-[#f8fafc] rounded-2xl border-2 border-slate-200 hover:border-slate-400 transition-all p-6 lg:p-8 flex flex-col justify-between shadow-xs group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Footprints className="w-6 h-6" />
                </div>

                <div className="aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-800">
                  <img
                    src="/src/assets/images/pedestrian_mode_preview_1793091840518.jpg"
                    alt="Pedestrian sidewalk with accessible tactile ramps"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-xl font-bold text-slate-900">Pedestrian Mode</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Explore safer routes, find suitable crossings, and receive warnings about potential traffic hazards.
                </p>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Wheelchair-accessible route planning with verified curb cuts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>High-contrast, large touch-target buttons with voice output</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Clear crossing risk banner (Green / Yellow / Red / Unknown)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setMode('pedestrian')}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Pedestrian Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (EDITORIAL NUMBERING) */}
      <section id="how-it-works" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-blue-700">
              Kinematic Pipeline
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How SafeStep Predicts Conflict Points
            </h2>
            <p className="text-sm text-slate-600">
              Unlike static maps, SafeStep calculates spatial overlap in continuous micro-steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-2xl font-black font-mono text-slate-400">01.</div>
              <h3 className="text-base font-bold text-slate-900">Trajectory Estimation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The engine takes vehicle position, pedestrian coordinates, speed, and heading angle to project forward paths over a 12-second horizon.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-2xl font-black font-mono text-slate-400">02.</div>
              <h3 className="text-base font-bold text-slate-900">Spatial & Temporal Window</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes time-to-conflict point (TTC = Distance / Closing Velocity). Compares arrival times; if both occupy the conflict point within 4 seconds, high risk triggers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-2xl font-black font-mono text-slate-400">03.</div>
              <h3 className="text-base font-bold text-slate-900">Instant Contextual Warnings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drivers receive braking prompts; pedestrians hear spoken warnings and feel tactile vibrations. If sensors fail, the system outputs UNKNOWN rather than a false safe signal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* D. FEATURES BENTO GRID */}
      <section id="features" className="px-6 lg:px-12 py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-blue-700">
              Comprehensive Safety Architecture
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Safety Features Engineered for Real Roads
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Collision Prediction Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates closing velocities, blind-corner hazards, and pedestrian speed profiles with clear physical formulas.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <Accessibility className="w-6 h-6 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Accessible Route Selection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritizes routes with ADA-compliant curb cuts, signalized crossings with push-buttons, and smooth walkways.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <Volume2 className="w-6 h-6 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Multi-Sensory Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Web Audio API synthesizer, Web Speech vocal guidance, and mobile vibration haptics keep users alert without distraction.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <Layers className="w-6 h-6 text-slate-800" />
              <h3 className="text-base font-bold text-slate-900">Uncontrolled Crossing Awareness</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies midblock crossing risks and bus terminal blind curves where zebra markings are absent.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <Radio className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Sensor Confidence Auditing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects fog degradation or sensor dropout, cleanly transitioning to UNKNOWN status instead of generating dangerous false greens.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">7 Interactive Scenarios</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built-in demonstration suite covers jaywalking, senior citizen pace, wheelchair routing, fog, sensor offline, and diverging paths.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACCESSIBILITY SECTION */}
      <section id="accessibility" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-semibold tracking-wider uppercase text-blue-700">
            Universal Design
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Every Road User
          </h2>
          <p className="text-sm text-slate-600">
            Road safety is a fundamental civic right. SafeStep includes dedicated preferences tailored to distinct mobility needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Children</h4>
            <p className="text-xs text-slate-600">
              Simplified interface, unmistakable color indicators, and early lateral crossing buffer.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Senior Citizens</h4>
            <p className="text-xs text-slate-600">
              Large text, high contrast, spoken instructions, and extended crossing-time allowances (14s+).
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Wheelchair Users</h4>
            <p className="text-xs text-slate-600">
              Strict avoidance of stairs, prioritizes verified ADA curb cut ramps and level crossings.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Visual Impairments</h4>
            <p className="text-xs text-slate-600">
              Full screen-reader semantic landmarks, audible multi-frequency warning chimes, and tactile vibration.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Hearing Impairments</h4>
            <p className="text-xs text-slate-600">
              High-contrast text banners, written instructions, and device haptic pulses.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Limited Mobility</h4>
            <p className="text-xs text-slate-600">
              Avoids steep inclines and uncontrolled multi-lane road crossings.
            </p>
          </div>
        </div>
      </section>

      {/* E. LEGAL DISCLAIMER & FOOTER */}
      <section className="px-6 lg:px-12 py-12 bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>R&D Safety Prototype Notice</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SafeStep is a developing safety prototype. It cannot guarantee accident prevention and must not replace direct observation, traffic laws, or established road-safety practices.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>
              <span className="font-bold text-white">SafeStep</span> — Smart Pedestrian Safety System
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="hover:text-white transition-colors underline"
              >
                Privacy & Sensing Charter
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="hover:text-white transition-colors underline"
              >
                Accessibility Preferences
              </button>
              <button
                onClick={() => setMode('scenarios')}
                className="hover:text-white transition-colors underline"
              >
                Verification Scenarios
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
