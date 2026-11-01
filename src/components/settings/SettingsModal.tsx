/**
 * SafeStep — User Settings & Accessibility Modal
 */

import React from 'react';
import { X, Volume2, Smartphone, Type, Sliders, Shield, MapPin, Eye, Bell, HeartHandshake } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { MobilityProfile } from '../../types';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    setIsPrivacyOpen,
    requestRealGeolocation,
    isRealLocationActive,
  } = useSafety();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-800" />
            <h2 className="text-lg font-bold text-slate-900">Safety & Accessibility Settings</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Accessibility & Display */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Display & Accessibility
          </h3>

          {/* Text Size */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Text Scale:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extra-large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSettings({ textSize: size })}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all capitalize ${
                    settings.textSize === size
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {size.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">High-Contrast Mode</span>
              <span className="text-[11px] text-slate-500">
                Enhance edge contrast and thicken borders for outdoor readability
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded"
            />
          </label>

          {/* Mobility Profile */}
          <div className="space-y-2">
            <label htmlFor="mobility-profile-select" className="text-xs font-semibold text-slate-700 block">
              Mobility Profile (adjusts crossing arrival buffer):
            </label>
            <select
              id="mobility-profile-select"
              value={settings.mobilityProfile}
              onChange={(e) => updateSettings({ mobilityProfile: e.target.value as MobilityProfile })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="standard">Standard Walking Pace (4.8 km/h)</option>
              <option value="senior">Senior Citizen / Extended Crossing Buffer (2.6 km/h)</option>
              <option value="wheelchair">Wheelchair User / ADA Curb Cut Priority (3.6 km/h)</option>
              <option value="child">Child / Early Warning Buffer</option>
              <option value="limited_mobility">Limited Mobility / Avoid Stairs</option>
              <option value="visual_impairment">Visual Impairment / Voice & Tactile Priority</option>
              <option value="hearing_impairment">Hearing Impairment / High-Contrast Visual Priority</option>
            </select>
          </div>
        </div>

        {/* Section 2: Audio & Haptics */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Alert Signals & Guidance
          </h3>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Audible Sound Tones</span>
              <span className="text-[11px] text-slate-500">Synthesized multi-tone warbles for urgent warnings</span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundAlerts}
              onChange={(e) => updateSettings({ soundAlerts: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Spoken Voice Alerts</span>
              <span className="text-[11px] text-slate-500">Text-to-speech road risk instructions</span>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceAlerts}
              onChange={(e) => updateSettings({ voiceAlerts: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Vibration Haptics</span>
              <span className="text-[11px] text-slate-500">Tactile pulses for mobile phones & wearable devices</span>
            </div>
            <input
              type="checkbox"
              checked={settings.vibrationAlerts}
              onChange={(e) => updateSettings({ vibrationAlerts: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded"
            />
          </label>
        </div>

        {/* Section 3: Geolocation & Privacy */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Privacy & Location Controls
          </h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Real Browser Geolocation</span>
              <span className="text-[11px] text-slate-500">
                {isRealLocationActive ? 'Active (Local only, not stored)' : 'Currently using simulated smart-corridor'}
              </span>
            </div>
            <button
              onClick={() => requestRealGeolocation()}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              {isRealLocationActive ? 'Refresh GPS' : 'Enable GPS'}
            </button>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Anonymize Location Broadcast</span>
              <span className="text-[11px] text-slate-500">
                Fuzzes device ID; only proximity kinematic vector is broadcast
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.anonymizeLocationData}
              onChange={(e) => updateSettings({ anonymizeLocationData: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded"
            />
          </label>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsPrivacyOpen(true);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Read Road-Safety Privacy Charter
            </button>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
