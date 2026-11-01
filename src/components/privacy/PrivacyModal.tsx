/**
 * SafeStep — Privacy & Road Safety Charter
 */

import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Radio, AlertOctagon, HeartHandshake } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';

export const PrivacyModal: React.FC = () => {
  const { isPrivacyOpen, setIsPrivacyOpen } = useSafety();

  if (!isPrivacyOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Privacy & Sensing Infrastructure Charter</h2>
          </div>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <span>1. Zero Persistent Location Retention</span>
            </h3>
            <p>
              SafeStep does not store persistent historical breadcrumbs of your daily routes. Geolocation coordinates are evaluated in volatile memory solely to calculate spatial proximity and closing velocity vectors against nearby road users.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-700" />
              <span>2. No Public Broadcast of Personal Identity</span>
            </h3>
            <p>
              Your personal profile, contact information, and identity are never transmitted across the V2X wireless channel. Only an ephemeral velocity-vector token (e.g. “RoadUser_ClassB_Heading42”) is shared with localized road nodes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-700" />
              <span>3. External Sensing Infrastructure Dependency</span>
            </h3>
            <p>
              SafeStep relies on multi-layer sensing. Detecting non-participating road users (e.g. older vehicles without connected hardware, or pedestrians who do not carry a mobile device) requires compatible municipal edge cameras, optical sensors, or radar mounted on roadside traffic infrastructure.
            </p>
          </section>

          <section className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-700" />
              <span>Legal Safety Disclaimer</span>
            </div>
            <p className="text-[11px] leading-normal">
              SafeStep is a research & development prototype designed to enhance road awareness. It cannot guarantee accident prevention and must NEVER replace direct visual scanning, adherence to traffic signals, or established road safety vigilance.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
