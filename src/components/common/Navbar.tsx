/**
 * SafeStep — Modern Google Maps-Inspired Navigation Header
 *
 * Implements:
 * - SafeStep Brand mark & Logo
 * - Embedded Destination Search field with instant query sync
 * - Clean Mode Switcher (Pedestrian, Driver, Dual Simulator, Test Scenarios, Home)
 * - Live GPS / Current Location control
 * - Accessibility Settings quick launcher
 * - User Profile & System Preferences trigger
 */

import React, { useState } from 'react';
import {
  Navigation,
  Search,
  MapPin,
  Sliders,
  Volume2,
  VolumeX,
  User,
  Radio,
  Footprints,
  Car,
  Activity,
  FlaskConical,
  Home,
  Check,
  Settings,
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { AppMode } from '../../types';

export const Navbar: React.FC = () => {
  const {
    mode,
    setMode,
    setIsSettingsOpen,
    settings,
    updateSettings,
    isLiveGpsActive,
    toggleLiveGps,
    liveGpsState,
    requestRealGeolocation,
    routes,
    setSelectedRouteId,
  } = useSafety();

  const [searchQuery, setSearchQuery] = useState<string>('Sitabuldi Metro Station');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  const nagpurDestinations = [
    'Sitabuldi Metro Station',
    'Nagpur Railway Station (West Portal)',
    'Zero Mile Stone (Center of India)',
    'Manas Square & Tekdi Road Crossing',
    'Sitabuldi Fort Heritage Area',
    'Raman Science Centre & Planetarium',
    'Deekshabhoomi',
  ];

  const handleNavClick = (targetMode: AppMode) => {
    setMode(targetMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDestination = (dest: string) => {
    setSearchQuery(dest);
    setShowSearchDropdown(false);
    setSelectedRouteId('route-accessible');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedRouteId('route-accessible');
    setShowSearchDropdown(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="w-full px-3 sm:px-5 lg:px-6 h-15 flex items-center justify-between gap-3">
        {/* LEFT: SafeStep Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('dual_view')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
            title="SafeStep Nagpur Home"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              <Navigation className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                SafeStep <span className="text-blue-600 font-bold text-xs uppercase ml-1">Nagpur</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 hidden sm:block">
                Smart Pedestrian Safety System
              </div>
            </div>
          </button>
        </div>

        {/* CENTER-LEFT: Google Maps-Style Destination Search Box */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-2 relative">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-200 focus-within:border-blue-500 rounded-full px-3.5 py-1.5 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search Nagpur destination or crossing..."
              className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            <button
              type="submit"
              className="ml-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-full transition-colors cursor-pointer shrink-0"
            >
              Directions
            </button>
          </form>

          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nagpur Landmarks & Crossings
              </div>
              {nagpurDestinations.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => handleSelectDestination(dest)}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{dest}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CENTER-RIGHT: Segmented Navigation Mode Selector */}
        <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => handleNavClick('dual_view')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'dual_view'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavClick('pedestrian')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'pedestrian'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Pedestrian</span>
          </button>
          <button
            onClick={() => handleNavClick('driver')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'driver'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Driver</span>
          </button>
          <button
            onClick={() => handleNavClick('scenarios')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'scenarios'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Scenarios</span>
          </button>
        </nav>

        {/* RIGHT: GPS Control, Accessibility, Audio, Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live GPS Control Button */}
          <button
            onClick={toggleLiveGps}
            title={isLiveGpsActive ? 'Live GPS Active — Click to switch to simulation' : 'Turn on Live GPS Position'}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiveGpsActive
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveGpsActive ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isLiveGpsActive ? 'Live GPS' : 'GPS Off'}</span>
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            title={settings.soundAlerts ? 'Mute Alerts' : 'Enable Voice & Audio Alerts'}
            aria-label="Toggle Sound"
          >
            {settings.soundAlerts ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Accessibility Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Accessibility Preferences"
            aria-label="Accessibility"
          >
            <Sliders className="w-4 h-4 text-slate-700" />
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            title="System Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>

          {/* User Profile / System Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="User Settings & Info"
            >
              <User className="w-4 h-4 text-slate-700" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">Pedestrian Safety Profile</div>
                  <div className="text-[11px] text-slate-500 font-medium">SafeStep Navigation v2.4</div>
                </div>

                <button
                  onClick={() => {
                    handleNavClick('pedestrian');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                >
                  <span>Pedestrian Mode</span>
                  {mode === 'pedestrian' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => {
                    handleNavClick('driver');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                >
                  <span>Driver Safety Mode</span>
                  {mode === 'driver' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Accessibility & Filters</span>
                </button>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleNavClick('landing');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>Home & Overview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAV TABS */}
      <div className="md:hidden flex items-center justify-around px-2 py-1.5 border-t border-slate-100 bg-white text-xs font-medium text-slate-600">
        <button
          onClick={() => handleNavClick('pedestrian')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
            mode === 'pedestrian' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Pedestrian</span>
        </button>
        <button
          onClick={() => handleNavClick('driver')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
            mode === 'driver' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Driver</span>
        </button>
        <button
          onClick={() => handleNavClick('dual_view')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
            mode === 'dual_view' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Dual</span>
        </button>
        <button
          onClick={() => handleNavClick('scenarios')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
            mode === 'scenarios' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Scenarios</span>
        </button>
        <button
          onClick={() => handleNavClick('landing')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
            mode === 'landing' ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>
    </header>
  );
};
