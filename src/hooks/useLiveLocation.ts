/**
 * SafeStep — Live GPS Location Hook
 *
 * Tracks real live position via navigator.geolocation.watchPosition,
 * computes smoothed speed & heading, maintains position trail (last 50 fixes),
 * monitors GPS heartbeat (10s lost timeout), and provides throttled Nominatim
 * reverse-geocoding.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { LatLng, LiveGpsState } from '../types';

interface ReverseGeocodeCache {
  lat: number;
  lng: number;
  name: string;
  timestamp: number;
}

// Distance helper for moving average & caching
function haversineMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearingDeg(p1: LatLng, p2: LatLng): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function useLiveLocation(enabled: boolean) {
  const [gpsState, setGpsState] = useState<LiveGpsState>({
    isActive: false,
    coords: null,
    accuracyMeters: null,
    speedKmh: null,
    headingDeg: null,
    status: 'idle',
    errorMessage: null,
    lastUpdatedTimestamp: null,
    streetName: null,
    trail: [],
  });

  const watchIdRef = useRef<number | null>(null);
  const recentFixesRef = useRef<Array<{ coords: LatLng; timestamp: number }>>([]);
  const lastGeocodeRef = useRef<ReverseGeocodeCache | null>(null);
  const lastGeocodeCallTimeRef = useRef<number>(0);
  const heartbeatTimerRef = useRef<number | null>(null);

  // Reverse geocoding throttled to 1 request / 5s with distance caching
  const reverseGeocode = useCallback(async (coords: LatLng) => {
    const now = Date.now();
    // Cache check: if within 25m and under 60s old
    if (
      lastGeocodeRef.current &&
      haversineMeters(lastGeocodeRef.current, coords) < 25 &&
      now - lastGeocodeRef.current.timestamp < 60000
    ) {
      return lastGeocodeRef.current.name;
    }

    if (now - lastGeocodeCallTimeRef.current < 5000) {
      return lastGeocodeRef.current?.name ?? null;
    }

    lastGeocodeCallTimeRef.current = now;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SafeStepPedestrianSafety/1.0',
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data.address || {};
      const roadName =
        addr.road ||
        addr.pedestrian ||
        addr.footway ||
        addr.cycleway ||
        addr.suburb ||
        addr.neighbourhood ||
        data.display_name?.split(',')[0] ||
        'Local Street';

      const result = roadName;
      lastGeocodeRef.current = {
        lat: coords.lat,
        lng: coords.lng,
        name: result,
        timestamp: now,
      };
      return result;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      setGpsState((prev) => ({
        ...prev,
        isActive: false,
        status: 'idle',
        errorMessage: null,
      }));
      return;
    }

    // Check Geolocation Support & Secure Context
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsState((prev) => ({
        ...prev,
        isActive: false,
        status: 'error',
        errorMessage: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setGpsState((prev) => ({
      ...prev,
      isActive: true,
      status: 'acquiring',
      errorMessage: null,
    }));

    // Reset fixes history
    recentFixesRef.current = [];

    // Heartbeat check for 10s loss of signal
    heartbeatTimerRef.current = window.setInterval(() => {
      setGpsState((curr) => {
        if (
          curr.status === 'locked' &&
          curr.lastUpdatedTimestamp &&
          Date.now() - curr.lastUpdatedTimestamp > 10000
        ) {
          return {
            ...curr,
            status: 'lost',
            errorMessage: 'GPS signal lost. Displaying last known position.',
          };
        }
        return curr;
      });
    }, 2500);

    const onPositionSuccess = async (pos: GeolocationPosition) => {
      const now = Date.now();
      const newCoords: LatLng = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      // Moving average calculation for speed & heading
      const fixes = recentFixesRef.current;
      fixes.push({ coords: newCoords, timestamp: now });
      if (fixes.length > 5) fixes.shift();

      let computedSpeedKmh = pos.coords.speed !== null && !isNaN(pos.coords.speed)
        ? Math.round(pos.coords.speed * 3.6 * 10) / 10
        : null;

      let computedHeading = pos.coords.heading !== null && !isNaN(pos.coords.heading)
        ? Math.round(pos.coords.heading)
        : null;

      if (fixes.length >= 2) {
        const prev = fixes[fixes.length - 2];
        const distM = haversineMeters(prev.coords, newCoords);
        const timeDiffSec = (now - prev.timestamp) / 1000;

        if (timeDiffSec > 0.4) {
          // If native speed was missing, compute from distance / time
          if (computedSpeedKmh === null) {
            const rawSpeed = (distM / timeDiffSec) * 3.6;
            computedSpeedKmh = Math.min(25, Math.round(rawSpeed * 10) / 10);
          }

          // If native heading was missing and moved > 1.5m, compute bearing
          if (computedHeading === null && distM > 1.5) {
            computedHeading = Math.round(calculateBearingDeg(prev.coords, newCoords));
          }
        }
      }

      // Reverse geocode
      const street = await reverseGeocode(newCoords);

      setGpsState((prev) => {
        const newTrail = [...prev.trail, newCoords].slice(-50);
        return {
          isActive: true,
          coords: newCoords,
          accuracyMeters: Math.round(pos.coords.accuracy),
          speedKmh: computedSpeedKmh ?? (prev.speedKmh ?? 0),
          headingDeg: computedHeading ?? (prev.headingDeg ?? 0),
          status: 'locked',
          errorMessage: null,
          lastUpdatedTimestamp: now,
          streetName: street || prev.streetName,
          trail: newTrail,
        };
      });
    };

    const onPositionError = (err: GeolocationPositionError) => {
      let friendlyMessage = 'Unable to acquire GPS location.';
      if (err.code === err.PERMISSION_DENIED) {
        friendlyMessage =
          'Location access was denied. Please allow location permissions in your browser bar, or continue in simulated mode.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        friendlyMessage = 'GPS position is currently unavailable on this device.';
      } else if (err.code === err.TIMEOUT) {
        friendlyMessage = 'GPS request timed out. Re-trying location acquisition...';
      }

      setGpsState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: friendlyMessage,
      }));
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onPositionSuccess,
        onPositionError,
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } catch (e: any) {
      setGpsState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: e?.message || 'Error initializing GPS watchPosition.',
      }));
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [enabled, reverseGeocode]);

  return gpsState;
}
