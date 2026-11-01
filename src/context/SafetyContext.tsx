/**
 * SafeStep — Shared Real-Time Safety Context
 *
 * Synchronizes simulation and telemetry state between Driver Mode and Pedestrian Mode.
 * Manages collision prediction, braking kinematics, weather physics, dynamic risk zones,
 * scenario presets, and deduplicated safety event logging.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { evaluateCollisionRisk, calculateHaversineDistance } from '../services/CollisionRiskEngine';
import {
  MOCK_CROSSWALKS,
  MOCK_HAZARD_ZONES,
  MOCK_PEDESTRIAN_ROUTES,
  MOCK_TRAFFIC_SEGMENTS,
  SCENARIO_PRESETS,
} from '../services/MockData';
import { soundService } from '../services/SoundService';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useNearbyRoads } from '../hooks/useNearbyRoads';
import {
  AppMode,
  ConflictAssessment,
  Crosswalk,
  HazardZone,
  LatLng,
  LiveGpsState,
  MapLayerVisibility,
  MobilityProfile,
  NearbyRoadInfo,
  PedestrianRouteOption,
  PedestrianState,
  RiskLevel,
  RoadTrafficSegment,
  SafetyAlert,
  ScenarioDefinition,
  ScenarioId,
  SimulationEventLogEntry,
  TrafficLevel,
  UserSafetySettings,
  VehicleState,
  WeatherCondition,
  CrossingRequestStatus,
  PedestrianCrossingRequest,
  CrossingTimelineEvent,
} from '../types';

interface SafetyContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  activeScenarioId: ScenarioId;
  scenario: ScenarioDefinition;
  loadScenario: (id: ScenarioId) => void;

  // Real-time Road Users
  vehicle: VehicleState;
  pedestrian: PedestrianState;
  conflictAssessment: ConflictAssessment;
  crosswalks: Crosswalk[];
  hazardZones: HazardZone[];
  routes: PedestrianRouteOption[];
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;

  // Simulation controls
  isPlaying: boolean;
  simulationProgress: number; // 0.0 to 1.0
  playbackSpeed: number; // 1x or 2x
  togglePlay: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;

  // Interactive controls & Speed regulation
  setVehicleSpeed: (speedKmh: number) => void;
  triggerEmergencyBrake: () => void;
  triggerBrakeAssist: () => void;
  slowDownVehicle: (deltaKmh?: number) => void;
  brakingOutcomeMessage: string | null;
  clearBrakingOutcome: () => void;

  // 50-Meter Warning Announcement & Proximity Threshold
  isUnder50mProximity: boolean;
  distanceVehToPedMeters: number;
  playProximityAnnouncement: () => void;
  warningDistanceThresholdMeters: number;
  setWarningDistanceThresholdMeters: (meters: number) => void;

  // Connected Pedestrian Crossing Request & Driver Warning System
  activeCrossingRequest: PedestrianCrossingRequest | null;
  requestCrossing: () => { success: boolean; message: string; request?: PedestrianCrossingRequest };
  cancelCrossingRequest: (reason?: string) => void;
  completeCrossingRequest: () => void;
  acknowledgeDriverWarning: () => void;
  driverYieldAction: () => void;

  // Collision Management & Pedestrian Stop
  isCollisionOccurred: boolean;
  collisionLocation: LatLng | null;
  triggerSimulatedCollision: () => void;
  clearCollision: () => void;

  // Road Traffic Status
  trafficSegments: RoadTrafficSegment[];
  trafficPreset: 'congested' | 'moderate' | 'light';
  setTrafficPreset: (preset: 'congested' | 'moderate' | 'light') => void;
  setSegmentTrafficLevel: (segmentId: string, level: TrafficLevel) => void;

  // Pedestrian controls
  setPedestrianProfile: (profile: MobilityProfile) => void;
  setPedestrianIntent: (intent: boolean) => void;
  setPedestrianAtCrossing: (atCrossing: boolean) => void;
  setPedestrianSpeed: (speedKmh: number) => void;

  // Scenario D Unexpected Entry controls
  pedestrianEntryPosition: 'curb_west' | 'curb_mid' | 'curb_east';
  setPedestrianEntryPosition: (pos: 'curb_west' | 'curb_mid' | 'curb_east') => void;

  // Environmental & Weather Simulation
  weatherCondition: WeatherCondition;
  setWeatherCondition: (weather: WeatherCondition) => void;
  setSensorIntegrity: (status: 'nominal' | 'degraded_fog' | 'sensor_unavailable') => void;

  updateVehiclePosition: (pos: LatLng) => void;
  updatePedestrianPosition: (pos: LatLng) => void;

  // Alerts & Telemetry Event Log
  alerts: SafetyAlert[];
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  eventLog: SimulationEventLogEntry[];
  clearEventLog: () => void;

  // Map Layer Visibility
  mapLayers: MapLayerVisibility;
  toggleMapLayer: (layer: keyof MapLayerVisibility) => void;

  // Live GPS Tracking
  isLiveGpsActive: boolean;
  toggleLiveGps: () => void;
  liveGpsState: LiveGpsState;
  nearbyRoadInfo: NearbyRoadInfo;
  recenterMapSignal: number;
  triggerRecenterMap: () => void;

  // Settings & Accessibility
  settings: UserSafetySettings;
  updateSettings: (partial: Partial<UserSafetySettings>) => void;
  requestRealGeolocation: () => Promise<boolean>;
  isRealLocationActive: boolean;
  userCoords: LatLng | null;

  // Modals
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isPrivacyOpen: boolean;
  setIsPrivacyOpen: (open: boolean) => void;
}

const DEFAULT_SETTINGS: UserSafetySettings = {
  language: 'en',
  textSize: 'normal',
  highContrast: false,
  soundAlerts: true,
  voiceAlerts: true,
  vibrationAlerts: true,
  mobilityProfile: 'standard',
  preferDesignatedCrossings: true,
  wheelchairRoutingRequired: false,
  avoidSteepInclines: false,
  locationPermissionGranted: false,
  anonymizeLocationData: true,
  allowTelemetrySharing: true,
  emergencyContactName: 'Family Contact',
  emergencyContactPhone: '+1 (555) 019-2834',
};

// Initial demonstration event log entries so the user has an immediate view of session safety history
const INITIAL_SIMULATION_EVENTS: SimulationEventLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: '10:14:02',
    type: 'scenario_loaded',
    title: 'Scenario Preset Initialized',
    description: 'Scenario A: Pedestrian Approaching Busy Road loaded into kinematic engine.',
    riskLevel: 'green',
    vehicleSpeedKmh: 38,
    stoppingDistanceMeters: 17.5,
    distanceToConflictMeters: 74,
    outcome: 'Corridor Clear',
  },
  {
    id: 'log-seed-2',
    timestamp: '10:14:15',
    type: 'conflict_predicted',
    title: 'Pedestrian Conflict Predicted',
    description: 'Pedestrian trajectory intersects vehicle forward path at Grand Ave zebra crossing.',
    riskLevel: 'yellow',
    vehicleSpeedKmh: 38,
    stoppingDistanceMeters: 17.5,
    distanceToConflictMeters: 42,
    outcome: 'Caution Issued',
  },
  {
    id: 'log-seed-3',
    timestamp: '10:14:22',
    type: 'brake_assist',
    title: 'Brake Assist Engaged',
    description: 'Braking model applied deceleration (-7.2 m/s²). Vehicle halted 8.2m before zebra crossing.',
    riskLevel: 'green',
    vehicleSpeedKmh: 0,
    stoppingDistanceMeters: 0,
    distanceToConflictMeters: 8.2,
    outcome: 'Conflict Avoided (Safe Margin: +8.2m)',
  },
];

const SafetyContext = createContext<SafetyContextType | null>(null);

/**
 * Linear interpolation between waypoints
 */
function interpolatePath(path: LatLng[], progress: number): LatLng {
  if (path.length === 0) return { lat: 21.1488, lng: 79.0884 };
  if (path.length === 1 || progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  const totalSegments = path.length - 1;
  const scaled = progress * totalSegments;
  const index = Math.floor(scaled);
  const segmentProgress = scaled - index;

  const start = path[index];
  const end = path[Math.min(index + 1, path.length - 1)];

  return {
    lat: start.lat + (end.lat - start.lat) * segmentProgress,
    lng: start.lng + (end.lng - start.lng) * segmentProgress,
  };
}

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>('dual_view');
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('scenario_a');
  const [scenario, setScenario] = useState<ScenarioDefinition>(SCENARIO_PRESETS['scenario_a']);

  const [vehicle, setVehicle] = useState<VehicleState>(SCENARIO_PRESETS['scenario_a'].initialVehicle);
  const [pedestrian, setPedestrian] = useState<PedestrianState>(SCENARIO_PRESETS['scenario_a'].initialPedestrian);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-accessible');

  // Weather Condition Simulation
  const [weatherCondition, setWeatherConditionState] = useState<WeatherCondition>('clear');

  // Scenario D Unexpected Entry Position
  const [pedestrianEntryPosition, setPedestrianEntryPosition] = useState<'curb_west' | 'curb_mid' | 'curb_east'>('curb_mid');

  // Brake Assist Outcome Feedback
  const [brakingOutcomeMessage, setBrakingOutcomeMessage] = useState<string | null>(null);

  // Simulation playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Alerts & Event Log
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [eventLog, setEventLog] = useState<SimulationEventLogEntry[]>(INITIAL_SIMULATION_EVENTS);

  // Map Layer Visibility
  const [mapLayers, setMapLayers] = useState<MapLayerVisibility>({
    hazardZones: true,
    conflictZones: true,
    vehicleCorridor: true,
    pedestrianPath: true,
    crosswalks: true,
    gpsTrail: true,
    trafficStatus: true,
  });

  const toggleMapLayer = (layer: keyof MapLayerVisibility) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Collision state & Impact location
  const [isCollisionOccurred, setIsCollisionOccurred] = useState<boolean>(false);
  const [collisionLocation, setCollisionLocation] = useState<LatLng | null>(null);

  // Road Traffic Segments state
  const [trafficSegments, setTrafficSegments] = useState<RoadTrafficSegment[]>(MOCK_TRAFFIC_SEGMENTS);
  const [trafficPreset, setTrafficPresetState] = useState<'congested' | 'moderate' | 'light'>('congested');

  // Ref to track if under 50m warning was already announced for current approach
  const wasUnder50mRef = useRef<boolean>(false);

  // Connected Pedestrian Crossing Request state & Configurable warning distance (default 50m)
  const [activeCrossingRequest, setActiveCrossingRequest] = useState<PedestrianCrossingRequest | null>(() => {
    try {
      const saved = localStorage.getItem('safestep_active_crossing_request');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status !== 'completed' && parsed.status !== 'cancelled') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [warningDistanceThresholdMeters, setWarningDistanceThresholdMeters] = useState<number>(50);

  const syncCrossingRequest = useCallback((req: PedestrianCrossingRequest | null) => {
    setActiveCrossingRequest(req);
    try {
      if (req) {
        localStorage.setItem('safestep_active_crossing_request', JSON.stringify(req));
      } else {
        localStorage.removeItem('safestep_active_crossing_request');
      }
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('safestep_crossing_channel');
        bc.postMessage({ type: 'CROSSING_REQUEST_SYNC', payload: req });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, []);

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('safestep_crossing_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'CROSSING_REQUEST_SYNC') {
        setActiveCrossingRequest(event.data.payload);
      }
    };
    return () => {
      bc.close();
    };
  }, []);

  const [isRealLocationActive, setIsRealLocationActive] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);

  // Live GPS Tracking integration
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [recenterMapSignal, setRecenterMapSignal] = useState<number>(0);
  const triggerRecenterMap = () => setRecenterMapSignal((prev) => prev + 1);

  const toggleLiveGps = () => {
    setIsLiveGpsActive((prev) => {
      const next = !prev;
      if (next) {
        setIsPlaying(false);
      }
      return next;
    });
  };

  const liveGpsState = useLiveLocation(isLiveGpsActive);
  const nearbyRoadInfo = useNearbyRoads(liveGpsState.coords, isLiveGpsActive);

  // Synchronize pedestrian state when live GPS is active
  useEffect(() => {
    if (isLiveGpsActive && liveGpsState.coords) {
      setPedestrian((prev) => ({
        ...prev,
        position: liveGpsState.coords!,
        speedKmh: liveGpsState.speedKmh ?? prev.speedKmh,
        headingDeg: liveGpsState.headingDeg ?? prev.headingDeg,
        dataSource: 'app_broadcast',
      }));
    }
  }, [isLiveGpsActive, liveGpsState.coords, liveGpsState.speedKmh, liveGpsState.headingDeg]);

  // Synchronize simulated vehicle along nearest road corridor when live GPS is active
  useEffect(() => {
    if (isLiveGpsActive && liveGpsState.coords && nearbyRoadInfo.nearestRoadCoordinates.length >= 2) {
      const roadPts = nearbyRoadInfo.nearestRoadCoordinates;
      setVehicle((v) => ({
        ...v,
        position: roadPts[0],
        headingDeg: v.headingDeg,
      }));
    }
  }, [isLiveGpsActive, liveGpsState.coords, nearbyRoadInfo.nearestRoadCoordinates]);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Settings from localStorage with fallback
  const [settings, setSettings] = useState<UserSafetySettings>(() => {
    try {
      const saved = localStorage.getItem('safestep_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const lastAlertLevelRef = useRef<RiskLevel | null>(null);
  const simulationTimerRef = useRef<number | null>(null);

  // Sync sound service mute state
  useEffect(() => {
    soundService.setMuted(!settings.soundAlerts);
    soundService.setVoiceEnabled(settings.voiceAlerts);
  }, [settings.soundAlerts, settings.voiceAlerts]);

  // Deduplicated event logger helper
  const addEventLogEntry = useCallback(
    (entry: Omit<SimulationEventLogEntry, 'id' | 'timestamp'>) => {
      const newEntry: SimulationEventLogEntry = {
        ...entry,
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setEventLog((prev) => [newEntry, ...prev.slice(0, 49)]); // buffer up to 50 items
    },
    []
  );

  // Load a scenario
  const loadScenario = (id: ScenarioId) => {
    const preset = SCENARIO_PRESETS[id] || SCENARIO_PRESETS['scenario_a'];
    setActiveScenarioId(id);
    setScenario(preset);
    setVehicle({ ...preset.initialVehicle });
    setPedestrian({ ...preset.initialPedestrian });
    setSimulationProgress(0);
    setIsPlaying(false);
    setIsLiveGpsActive(false);
    setBrakingOutcomeMessage(null);
    setIsCollisionOccurred(false);
    setCollisionLocation(null);
    wasUnder50mRef.current = false;
    syncCrossingRequest(null);

    // Weather reset to preset condition
    if (preset.sensorIntegrity === 'degraded_fog') {
      setWeatherConditionState('fog');
    } else if (preset.sensorIntegrity === 'sensor_unavailable') {
      setWeatherConditionState('sensor_offline');
    } else {
      setWeatherConditionState('clear');
    }

    // Apply wheelchair setting if wheelchair scenario
    if (id === 'scenario_d') {
      setSelectedRouteId('route-accessible');
      updateSettings({ wheelchairRoutingRequired: true, mobilityProfile: 'wheelchair' });
    }

    // Scenario D Unexpected Entry default
    if (id === 'scenario_d_unexpected') {
      setPedestrianEntryPosition('curb_mid');
      updateSettings({ preferDesignatedCrossings: false });
    }

    addEventLogEntry({
      type: 'scenario_loaded',
      title: `Loaded ${preset.code}: ${preset.title}`,
      description: preset.description,
      riskLevel: preset.sensorIntegrity === 'sensor_unavailable' ? 'unknown' : 'green',
      vehicleSpeedKmh: preset.initialVehicle.speedKmh,
      outcome: 'Scenario Ready',
    });
  };

  // Adjust Pedestrian Entry Position for Scenario D (outside crosswalk)
  useEffect(() => {
    if (activeScenarioId === 'scenario_d_unexpected') {
      let offsetLat = 0;
      let offsetLng = 0;
      if (pedestrianEntryPosition === 'curb_west') {
        offsetLat = -0.00015;
        offsetLng = -0.00012;
      } else if (pedestrianEntryPosition === 'curb_east') {
        offsetLat = 0.00015;
        offsetLng = 0.00012;
      }

      const basePed = SCENARIO_PRESETS['scenario_d_unexpected'].initialPedestrian;
      const newPos = { lat: basePed.position.lat + offsetLat, lng: basePed.position.lng + offsetLng };
      setPedestrian((p) => ({
        ...p,
        position: newPos,
        atDesignatedCrossing: false,
      }));
    }
  }, [pedestrianEntryPosition, activeScenarioId]);

  // Evaluate conflict assessment in real time using the kinematic engine
  const effectiveConflictPoint =
    isLiveGpsActive && nearbyRoadInfo.conflictLocus
      ? nearbyRoadInfo.conflictLocus
      : scenario.conflictPoint;

  const effectivePedestrian =
    isLiveGpsActive && liveGpsState.coords
      ? {
          ...pedestrian,
          position: liveGpsState.coords,
          speedKmh: liveGpsState.speedKmh ?? pedestrian.speedKmh,
          headingDeg: liveGpsState.headingDeg ?? pedestrian.headingDeg,
          atDesignatedCrossing:
            nearbyRoadInfo.distanceToCrosswalkMeters !== null &&
            nearbyRoadInfo.distanceToCrosswalkMeters < 15,
        }
      : pedestrian;

  const conflictAssessment = evaluateCollisionRisk({
    vehicle,
    pedestrian: effectivePedestrian,
    presetConflictPoint: effectiveConflictPoint,
    sensorIntegrity:
      isLiveGpsActive && liveGpsState.status === 'lost'
        ? 'sensor_unavailable'
        : scenario.sensorIntegrity,
    weatherCondition,
  });

  // Sound & Speech alert triggers on state transition (Deduplicated alerts)
  useEffect(() => {
    const currentLevel = conflictAssessment.riskLevel;
    if (currentLevel !== lastAlertLevelRef.current) {
      const prevLevel = lastAlertLevelRef.current;
      lastAlertLevelRef.current = currentLevel;

      if (settings.soundAlerts) {
        soundService.playAlertTone(currentLevel);
      }
      if (settings.vibrationAlerts) {
        soundService.triggerVibration(currentLevel);
      }
      if (settings.voiceAlerts) {
        if (currentLevel === 'red') {
          soundService.speakGuidance('High collision danger. Stop immediately.', 'red', true);
        } else if (currentLevel === 'yellow') {
          soundService.speakGuidance('Caution. Pedestrian conflict ahead.', 'yellow');
        } else if (currentLevel === 'green' && prevLevel === 'red') {
          soundService.speakGuidance('Conflict resolved. Safe clearance.', 'green');
        }
      }

      // Append active alert record
      if (currentLevel !== 'green') {
        const newAlert: SafetyAlert = {
          id: `alert-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          level: currentLevel,
          recipient: 'both',
          title:
            currentLevel === 'red'
              ? 'STOP — HIGH COLLISION RISK'
              : currentLevel === 'yellow'
              ? 'SLOW DOWN — PEDESTRIAN CONFLICT'
              : 'SAFETY STATUS UNKNOWN',
          message: conflictAssessment.rationale,
          actionGuidance: conflictAssessment.recommendedDriverAction,
          dismissed: false,
        };
        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);
      }

      // Record in Simulation Event Log
      addEventLogEntry({
        type:
          currentLevel === 'red'
            ? 'risk_escalated'
            : currentLevel === 'yellow'
            ? 'conflict_predicted'
            : 'conflict_resolved',
        title:
          currentLevel === 'red'
            ? 'High Collision Risk Flagged'
            : currentLevel === 'yellow'
            ? 'Potential Pedestrian Conflict'
            : 'Safe Clearance Restored',
        description: conflictAssessment.rationale,
        riskLevel: currentLevel,
        vehicleSpeedKmh: vehicle.speedKmh,
        stoppingDistanceMeters: conflictAssessment.estimatedStoppingDistanceMeters,
        distanceToConflictMeters: conflictAssessment.distanceVehToConflictMeters,
        outcome: conflictAssessment.conflictStatus,
      });
    }
  }, [
    conflictAssessment.riskLevel,
    conflictAssessment.rationale,
    conflictAssessment.recommendedDriverAction,
    conflictAssessment.estimatedStoppingDistanceMeters,
    conflictAssessment.distanceVehToConflictMeters,
    conflictAssessment.conflictStatus,
    vehicle.speedKmh,
    settings.soundAlerts,
    settings.vibrationAlerts,
    settings.voiceAlerts,
    addEventLogEntry,
  ]);

  // 50-Meter Warning Announcement Effect
  useEffect(() => {
    const distVehToPed = conflictAssessment.distanceVehToPedMeters;
    if (distVehToPed <= 50 && distVehToPed > 0 && !isCollisionOccurred) {
      if (!wasUnder50mRef.current) {
        wasUnder50mRef.current = true;
        if (settings.voiceAlerts) {
          soundService.speakProximityUnder50m(distVehToPed, mode);
        }
        if (settings.soundAlerts) {
          soundService.playAlertTone('yellow');
        }
        addEventLogEntry({
          type: 'proximity_warning',
          title: '50-Meter Proximity Warning Broadcasted',
          description: `Distance between vehicle and pedestrian is ${Math.round(distVehToPed)}m. Spoken warning announcement issued.`,
          riskLevel: 'yellow',
          vehicleSpeedKmh: vehicle.speedKmh,
          stoppingDistanceMeters: conflictAssessment.estimatedStoppingDistanceMeters,
          distanceToConflictMeters: distVehToPed,
          outcome: 'Voice Alert (<50m)',
        });
      }
    } else if (distVehToPed > 55) {
      wasUnder50mRef.current = false;
    }
  }, [
    conflictAssessment.distanceVehToPedMeters,
    isCollisionOccurred,
    mode,
    settings.voiceAlerts,
    settings.soundAlerts,
    vehicle.speedKmh,
    conflictAssessment.estimatedStoppingDistanceMeters,
    addEventLogEntry,
  ]);

  // Collision Detection Effect: Pedestrians & Vehicles Stop Immediately
  useEffect(() => {
    const distVehToPed = conflictAssessment.distanceVehToPedMeters;
    if (
      !isCollisionOccurred &&
      ((distVehToPed <= 2.8 && vehicle.speedKmh > 3) || conflictAssessment.isCollision)
    ) {
      const collisionLoc = conflictAssessment.conflictPoint || {
        lat: (vehicle.position.lat + pedestrian.position.lat) / 2,
        lng: (vehicle.position.lng + pedestrian.position.lng) / 2,
      };

      setIsCollisionOccurred(true);
      setCollisionLocation(collisionLoc);
      setIsPlaying(false);

      // PEDESTRIAN STOPS
      setPedestrian((p) => ({
        ...p,
        speedKmh: 0,
        position: collisionLoc,
      }));

      // CAR STOPS
      setVehicle((v) => ({
        ...v,
        speedKmh: 0,
        targetSpeedKmh: 0,
        isBraking: false,
        position: collisionLoc,
      }));

      soundService.speakCollisionAlert();

      addEventLogEntry({
        type: 'collision_event',
        title: 'Roadway Collision Occurred — Pedestrian & Vehicle Halted',
        description: 'Impact detected at Tekdi Road corridor, Nagpur. Pedestrian halted immediately; vehicle brought to 0 km/h emergency stop.',
        riskLevel: 'red',
        vehicleSpeedKmh: 0,
        distanceToConflictMeters: 0,
        outcome: 'Pedestrian & Vehicle Halted',
      });
    }
  }, [
    conflictAssessment.distanceVehToPedMeters,
    conflictAssessment.isCollision,
    conflictAssessment.conflictPoint,
    vehicle.speedKmh,
    vehicle.position,
    pedestrian.position,
    isCollisionOccurred,
    addEventLogEntry,
  ]);

  // Refs to ensure simulation tick loop accesses latest values without stale closures
  const activeCrossingRequestRef = useRef<PedestrianCrossingRequest | null>(activeCrossingRequest);
  useEffect(() => {
    activeCrossingRequestRef.current = activeCrossingRequest;
  }, [activeCrossingRequest]);

  const warningDistanceThresholdRef = useRef<number>(warningDistanceThresholdMeters);
  useEffect(() => {
    warningDistanceThresholdRef.current = warningDistanceThresholdMeters;
  }, [warningDistanceThresholdMeters]);

  // Simulation tick loop (10Hz / 100ms) with physical deceleration when braking or yielding to crossing
  useEffect(() => {
    if (!isPlaying) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }

    const intervalMs = 100;
    const progressIncrement = 0.007 * playbackSpeed;

    simulationTimerRef.current = window.setInterval(() => {
      setSimulationProgress((prev) => {
        // If collision occurred, freeze progress entirely
        if (isCollisionOccurred) {
          setIsPlaying(false);
          return prev;
        }

        const next = prev + progressIncrement;
        if (next >= 1.0) {
          setIsPlaying(false);
          addEventLogEntry({
            type: 'conflict_resolved',
            title: 'Scenario Simulation Completed',
            description: 'Vehicles and pedestrians completed simulated trajectories.',
            riskLevel: 'green',
            vehicleSpeedKmh: vehicle.speedKmh,
            outcome: 'Completed',
          });
          return 1.0;
        }

        // Interpolate positions along scenario paths
        const newVehPos = interpolatePath(scenario.vehiclePath, next);
        const newPedPos = interpolatePath(scenario.pedestrianPath, next);

        setVehicle((v) => {
          let updatedSpeed = v.speedKmh;
          let stillBraking = v.isBraking;

          const currentReq = activeCrossingRequestRef.current;
          const isReqActive =
            currentReq !== null &&
            currentReq.status !== 'completed' &&
            currentReq.status !== 'cancelled';

          const distVehToPed = Math.round(calculateHaversineDistance(v.position, newPedPos) * 10) / 10;
          const isWithinYieldTrigger = distVehToPed <= warningDistanceThresholdRef.current;
          const shouldYieldForCrossing = isReqActive && isWithinYieldTrigger;

          if (v.isBraking || shouldYieldForCrossing) {
            stillBraking = true;
            // Apply physics deceleration: a = mu * g (m/s²).
            // In 0.1s, deltaV_kmh = (mu * 9.81 * 0.1) * 3.6
            const mu = conflictAssessment.frictionCoefficient || 0.75;
            const decelKmhPerTick = Math.max(2.8, mu * 9.81 * 0.1 * 3.6);
            updatedSpeed = Math.max(0, Math.round((v.speedKmh - decelKmhPerTick) * 10) / 10);

            if (updatedSpeed === 0 && v.speedKmh > 0) {
              stillBraking = false;
              if (shouldYieldForCrossing) {
                soundService.speakCrossingVehicleStopped();
                setBrakingOutcomeMessage(
                  'Yield Complete: Simulated vehicle stopped at crossing to let pedestrian cross safely (0 km/h).'
                );
              } else {
                soundService.speakBrakeAssistStopped();
                setBrakingOutcomeMessage('Brake Assist Complete: Car successfully brought to a complete stop (0 km/h).');
              }
            }
          } else if (!isCollisionOccurred) {
            // Smoothly approach target speed
            if (v.speedKmh < v.targetSpeedKmh) {
              updatedSpeed = Math.min(v.targetSpeedKmh, v.speedKmh + 2);
            } else if (v.speedKmh > v.targetSpeedKmh) {
              updatedSpeed = Math.max(v.targetSpeedKmh, v.speedKmh - 2);
            }
          }

          // If car has stopped (speed 0), keep vehicle stationary at current location
          const nextVehPos = updatedSpeed === 0 ? v.position : newVehPos;

          return {
            ...v,
            position: nextVehPos,
            speedKmh: updatedSpeed,
            isBraking: stillBraking,
          };
        });

        // Update pedestrian: if collision occurs, pedestrian stops!
        setPedestrian((p) => {
          if (isCollisionOccurred || p.speedKmh === 0) {
            return { ...p, speedKmh: 0 };
          }
          return {
            ...p,
            position: newPedPos,
          };
        });

        return next;
      });
    }, intervalMs);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [
    isPlaying,
    playbackSpeed,
    scenario,
    conflictAssessment.frictionCoefficient,
    vehicle.speedKmh,
    isCollisionOccurred,
    addEventLogEntry,
  ]);

  // Synchronize crossing request status with vehicle proximity and deceleration state
  useEffect(() => {
    if (!activeCrossingRequest) return;
    if (activeCrossingRequest.status === 'completed' || activeCrossingRequest.status === 'cancelled') return;

    const dist = conflictAssessment.distanceVehToPedMeters;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isWithinThreshold = dist <= warningDistanceThresholdMeters;

    let nextStatus = activeCrossingRequest.status;
    const newTimeline = [...activeCrossingRequest.timeline];

    if (isWithinThreshold) {
      if (vehicle.speedKmh === 0) {
        if (activeCrossingRequest.status !== 'vehicle_stopped') {
          nextStatus = 'vehicle_stopped';
          if (!newTimeline.some((t) => t.step === 5)) {
            newTimeline.push({
              step: 5,
              title: 'Vehicle stopped, confirmed by the simulation',
              description: 'Simulated vehicle reached 0 km/h and is holding position at the crossing.',
              timestamp: nowTime,
            });
          }
        }
      } else {
        if (activeCrossingRequest.status !== 'vehicle_slowing') {
          nextStatus = 'vehicle_slowing';
          if (!newTimeline.some((t) => t.step === 3)) {
            newTimeline.push({
              step: 3,
              title: 'Vehicle proximity warning activated',
              description: `Vehicle is ${Math.round(dist)}m away (<= ${warningDistanceThresholdMeters}m trigger threshold).`,
              timestamp: nowTime,
            });
          }
          if (!newTimeline.some((t) => t.step === 4)) {
            newTimeline.push({
              step: 4,
              title: 'Simulated vehicle began slowing down',
              description: 'Controlled kinematic deceleration active to yield right-of-way for crossing.',
              timestamp: nowTime,
            });
          }
          soundService.speakCrossingVehicleSlowing();
        }
      }
    } else {
      if (activeCrossingRequest.status === 'requested') {
        nextStatus = 'waiting';
      }
    }

    if (
      nextStatus !== activeCrossingRequest.status ||
      Math.round(dist) !== activeCrossingRequest.currentDistanceMeters ||
      newTimeline.length !== activeCrossingRequest.timeline.length
    ) {
      syncCrossingRequest({
        ...activeCrossingRequest,
        status: nextStatus,
        currentDistanceMeters: Math.round(dist),
        timeline: newTimeline,
      });
    }
  }, [
    activeCrossingRequest,
    conflictAssessment.distanceVehToPedMeters,
    vehicle.speedKmh,
    warningDistanceThresholdMeters,
    syncCrossingRequest,
  ]);

  const togglePlay = () => {
    if (isCollisionOccurred) {
      clearCollision();
    }
    setIsPlaying((p) => !p);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setSimulationProgress(0);
    setVehicle({ ...scenario.initialVehicle });
    setPedestrian({ ...scenario.initialPedestrian });
    setBrakingOutcomeMessage(null);
    setIsCollisionOccurred(false);
    setCollisionLocation(null);
    wasUnder50mRef.current = false;
    syncCrossingRequest(null);

    addEventLogEntry({
      type: 'scenario_loaded',
      title: 'Simulation Reset',
      description: 'Vehicle and pedestrian positions returned to initial scenario coordinates.',
      riskLevel: 'green',
      vehicleSpeedKmh: scenario.initialVehicle.speedKmh,
      outcome: 'Reset to 0%',
    });
  };

  // Connected Pedestrian Crossing Request Handlers
  const requestCrossing = useCallback((): {
    success: boolean;
    message: string;
    request?: PedestrianCrossingRequest;
  } => {
    // Prevent duplicate active requests
    if (
      activeCrossingRequest &&
      activeCrossingRequest.status !== 'completed' &&
      activeCrossingRequest.status !== 'cancelled'
    ) {
      return {
        success: false,
        message: 'A crossing request is already active. Please wait for the vehicle to stop or cancel before requesting again.',
      };
    }

    if (!pedestrian.position) {
      return {
        success: false,
        message: 'Simulated pedestrian position is unavailable. Unable to register crossing request coordinates.',
      };
    }

    // Identify nearest crossing
    let nearestCrossingName = 'Grand Ave & 4th St Zebra Crossing';
    let nearestCrossingPos: LatLng = scenario.conflictPoint;
    let minD = Infinity;

    MOCK_CROSSWALKS.forEach((cw) => {
      const d = calculateHaversineDistance(pedestrian.position, cw.position);
      if (d < minD) {
        minD = d;
        nearestCrossingName = cw.name;
        nearestCrossingPos = cw.position;
      }
    });

    const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const distVehToPed = conflictAssessment.distanceVehToPedMeters;

    const isWithinWarning = distVehToPed <= warningDistanceThresholdMeters;
    const initialStatus: CrossingRequestStatus = isWithinWarning
      ? vehicle.speedKmh === 0
        ? 'vehicle_stopped'
        : 'vehicle_slowing'
      : 'requested';

    const newRequest: PedestrianCrossingRequest = {
      id: reqId,
      pedestrianId: pedestrian.id,
      pedestrianName: pedestrian.name,
      requestedAt: nowTime,
      timestampMs: Date.now(),
      pedestrianPosition: { ...pedestrian.position },
      crossingLocationName: nearestCrossingName,
      crossingPosition: { ...nearestCrossingPos },
      status: initialStatus,
      distanceAtRequestMeters: Math.round(distVehToPed),
      currentDistanceMeters: Math.round(distVehToPed),
      driverAcknowledged: false,
      driverActionTaken: isWithinWarning ? 'slowing' : 'none',
      warningDistanceThresholdMeters,
      timeline: [
        {
          step: 1,
          title: 'Pedestrian requested to cross',
          description: `Crossing request registered for ${pedestrian.name} at ${nearestCrossingName} (${Math.round(distVehToPed)}m from vehicle).`,
          timestamp: nowTime,
        },
        {
          step: 2,
          title: 'Driver dashboard received the request',
          description: `V2X alert broadcasted to approaching driver cockpit. Initial distance: ${Math.round(distVehToPed)}m.`,
          timestamp: nowTime,
        },
        ...(isWithinWarning
          ? [
              {
                step: 3,
                title: 'Vehicle proximity warning activated',
                description: `Vehicle is ${Math.round(distVehToPed)}m away (<= ${warningDistanceThresholdMeters}m threshold).`,
                timestamp: nowTime,
              },
              {
                step: 4,
                title: 'Simulated vehicle began slowing down',
                description: 'Vehicle initiated controlled kinematic deceleration to yield.',
                timestamp: nowTime,
              },
            ]
          : []),
      ],
    };

    syncCrossingRequest(newRequest);
    soundService.speakCrossingRequested(nearestCrossingName);

    addEventLogEntry({
      type: 'crossing_requested',
      title: 'Pedestrian Crossing Request Registered',
      description: `Pedestrian ${pedestrian.name} requested to cross at ${nearestCrossingName}. Driver notified (${Math.round(distVehToPed)}m away).`,
      riskLevel: isWithinWarning ? 'yellow' : 'green',
      vehicleSpeedKmh: vehicle.speedKmh,
      distanceToConflictMeters: distVehToPed,
      outcome: `Requested (${Math.round(distVehToPed)}m)`,
    });

    if (isWithinWarning && vehicle.speedKmh > 0) {
      setVehicle((v) => ({ ...v, isBraking: true }));
    }

    if (!isPlaying && !isCollisionOccurred) {
      setIsPlaying(true);
    }

    return {
      success: true,
      message: 'Crossing request sent to the driver dashboard.',
      request: newRequest,
    };
  }, [
    activeCrossingRequest,
    pedestrian,
    scenario.conflictPoint,
    conflictAssessment.distanceVehToPedMeters,
    warningDistanceThresholdMeters,
    vehicle.speedKmh,
    isPlaying,
    isCollisionOccurred,
    syncCrossingRequest,
    addEventLogEntry,
  ]);

  const cancelCrossingRequest = useCallback(
    (reason?: string) => {
      if (!activeCrossingRequest) return;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const updated: PedestrianCrossingRequest = {
        ...activeCrossingRequest,
        status: 'cancelled',
        timeline: [
          ...activeCrossingRequest.timeline,
          {
            step: activeCrossingRequest.timeline.length + 1,
            title: 'Crossing request cancelled',
            description: reason || 'Pedestrian cancelled crossing request. Normal vehicle cruise restored.',
            timestamp: nowTime,
          },
        ],
      };
      syncCrossingRequest(updated);
      setVehicle((v) => ({ ...v, isBraking: false, targetSpeedKmh: scenario.initialVehicle.speedKmh }));

      addEventLogEntry({
        type: 'crossing_cancelled',
        title: 'Crossing Request Cancelled',
        description: `Request ${activeCrossingRequest.id} cancelled. Normal traffic flow resumed.`,
        riskLevel: 'green',
        vehicleSpeedKmh: vehicle.speedKmh,
        outcome: 'Cancelled',
      });
    },
    [activeCrossingRequest, scenario.initialVehicle.speedKmh, vehicle.speedKmh, syncCrossingRequest, addEventLogEntry]
  );

  const completeCrossingRequest = useCallback(() => {
    if (!activeCrossingRequest) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updated: PedestrianCrossingRequest = {
      ...activeCrossingRequest,
      status: 'completed',
      timeline: [
        ...activeCrossingRequest.timeline,
        {
          step: 6,
          title: 'Pedestrian crossing status updated',
          description: 'Crossing marked as completed. Pedestrian crossed roadway safely.',
          timestamp: nowTime,
        },
      ],
    };
    syncCrossingRequest(updated);
    soundService.speakCrossingCompleted();

    addEventLogEntry({
      type: 'crossing_completed',
      title: 'Pedestrian Crossing Completed',
      description: `Crossing ${activeCrossingRequest.id} completed. Safe clearance restored.`,
      riskLevel: 'green',
      vehicleSpeedKmh: vehicle.speedKmh,
      outcome: 'Completed',
    });
  }, [activeCrossingRequest, vehicle.speedKmh, syncCrossingRequest, addEventLogEntry]);

  const acknowledgeDriverWarning = useCallback(() => {
    if (!activeCrossingRequest) return;
    const updated: PedestrianCrossingRequest = {
      ...activeCrossingRequest,
      driverAcknowledged: true,
    };
    syncCrossingRequest(updated);
    addEventLogEntry({
      type: 'crossing_acknowledged',
      title: 'Driver Acknowledged Pedestrian Crossing Warning',
      description: `Driver confirmed visual awareness of crossing request ${activeCrossingRequest.id}.`,
      riskLevel: 'yellow',
      vehicleSpeedKmh: vehicle.speedKmh,
      outcome: 'Acknowledged',
    });
  }, [activeCrossingRequest, vehicle.speedKmh, syncCrossingRequest, addEventLogEntry]);

  const stepSimulation = () => {
    if (isCollisionOccurred) return;
    setSimulationProgress((prev) => {
      const next = Math.min(1.0, prev + 0.08);
      const newVehPos = vehicle.speedKmh > 0 ? interpolatePath(scenario.vehiclePath, next) : vehicle.position;
      const newPedPos = pedestrian.speedKmh > 0 ? interpolatePath(scenario.pedestrianPath, next) : pedestrian.position;
      setVehicle((v) => ({ ...v, position: newVehPos }));
      setPedestrian((p) => ({ ...p, position: newPedPos }));
      return next;
    });
  };

  const setSimulationSpeed = (speed: number) => setPlaybackSpeed(speed);

  // Speed regulation with physics target
  const setVehicleSpeed = (speedKmh: number) => {
    const clamped = Math.max(0, Math.min(90, Math.round(speedKmh)));
    setVehicle((v) => ({
      ...v,
      speedKmh: clamped,
      targetSpeedKmh: clamped,
      isBraking: false,
    }));
    addEventLogEntry({
      type: 'speed_regulated',
      title: `Vehicle Speed Regulated: ${clamped} km/h`,
      description: `Target speed adjusted from ${vehicle.speedKmh} km/h to ${clamped} km/h.`,
      riskLevel: conflictAssessment.riskLevel,
      vehicleSpeedKmh: clamped,
      outcome: `${clamped} km/h`,
    });
  };

  // Functional Slow Down Control (-10 km/h)
  const slowDownVehicle = (deltaKmh: number = 10) => {
    const newSpeed = Math.max(10, vehicle.speedKmh - deltaKmh);
    setVehicle((v) => ({
      ...v,
      targetSpeedKmh: newSpeed,
      speedKmh: newSpeed,
      isBraking: false,
    }));
    addEventLogEntry({
      type: 'speed_regulated',
      title: `Driver Slow Down Engaged: -${deltaKmh} km/h`,
      description: `Speed reduced to ${newSpeed} km/h to increase stopping distance margin.`,
      riskLevel: 'yellow',
      vehicleSpeedKmh: newSpeed,
      outcome: `Speed: ${newSpeed} km/h`,
    });
  };

  // Functional Brake Assist with Defined Kinematic Model & Complete Stop
  const triggerBrakeAssist = () => {
    const initialSpeed = vehicle.speedKmh;
    const distToConflict = conflictAssessment.distanceVehToConflictMeters;
    const requiredStoppingDist = conflictAssessment.estimatedStoppingDistanceMeters;
    const safetyMargin = Math.round((distToConflict - requiredStoppingDist) * 10) / 10;
    const mu = conflictAssessment.frictionCoefficient;
    const decelMs2 = Math.round(mu * 9.81 * 10) / 10;

    let outcomeText = '';
    let outcomeStatus = '';

    if (safetyMargin > 2.0) {
      outcomeText = `Brake Assist Applied: Decelerating at ${decelMs2} m/s². Bringing car to full stop (+${safetyMargin}m margin ahead of conflict point). Conflict avoided.`;
      outcomeStatus = `Avoided (+${safetyMargin}m)`;
    } else if (safetyMargin >= -5.0) {
      outcomeText = `Brake Assist Applied: Decelerating at ${decelMs2} m/s². Bringing car to complete stop. Tight clearance (${safetyMargin}m buffer).`;
      outcomeStatus = 'Mitigated (Stopping)';
    } else {
      outcomeText = `Brake Assist Applied: Decelerating at ${decelMs2} m/s² to 0 km/h. Emergency stop engaged.`;
      outcomeStatus = 'Emergency Braking to 0 km/h';
    }

    setBrakingOutcomeMessage(outcomeText);

    // Apply immediate braking and target speed 0 to bring car to complete stop
    setVehicle((v) => ({
      ...v,
      isBraking: true,
      targetSpeedKmh: 0,
      speedKmh: Math.max(0, Math.round(v.speedKmh * 0.35)), // immediate strong initial deceleration
    }));

    soundService.speakGuidance('Brake assist engaged. Bringing vehicle to complete stop.', 'yellow', true);

    addEventLogEntry({
      type: 'brake_assist',
      title: 'Brake Assist Applied — Stopping Car',
      description: outcomeText,
      riskLevel: safetyMargin > 0 ? 'green' : 'yellow',
      vehicleSpeedKmh: initialSpeed,
      stoppingDistanceMeters: requiredStoppingDist,
      distanceToConflictMeters: distToConflict,
      outcome: outcomeStatus,
    });
  };

  const triggerEmergencyBrake = () => {
    triggerBrakeAssist();
  };

  const driverYieldAction = useCallback(() => {
    triggerBrakeAssist();
    if (activeCrossingRequest) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const updated: PedestrianCrossingRequest = {
        ...activeCrossingRequest,
        driverAcknowledged: true,
        driverActionTaken: 'slowing',
        status: 'vehicle_slowing',
        timeline: [
          ...activeCrossingRequest.timeline,
          {
            step: activeCrossingRequest.timeline.length + 1,
            title: 'Driver yielded and engaged deceleration',
            description: 'Driver manually confirmed yield action and applied deceleration.',
            timestamp: nowTime,
          },
        ],
      };
      syncCrossingRequest(updated);
    }
  }, [triggerBrakeAssist, activeCrossingRequest, syncCrossingRequest]);

  const clearBrakingOutcome = () => setBrakingOutcomeMessage(null);

  // Proximity warning speech replay
  const playProximityAnnouncement = () => {
    const dist = conflictAssessment.distanceVehToPedMeters;
    soundService.speakProximityUnder50m(dist, mode);
  };

  // Trigger manual simulated collision for testing
  const triggerSimulatedCollision = () => {
    const locus = scenario.conflictPoint || { lat: 37.7881, lng: -122.4072 };
    setIsCollisionOccurred(true);
    setCollisionLocation(locus);
    setIsPlaying(false);

    // Pedestrian stops at locus
    setPedestrian((p) => ({ ...p, position: locus, speedKmh: 0 }));
    // Car stops at locus
    setVehicle((v) => ({ ...v, position: locus, speedKmh: 0, targetSpeedKmh: 0, isBraking: false }));

    soundService.speakCollisionAlert();

    addEventLogEntry({
      type: 'collision_event',
      title: 'Simulated Roadway Collision — Pedestrian Halted',
      description: 'Collision simulated on roadway at Grand Ave & 4th St. Pedestrian and vehicle immediately halted.',
      riskLevel: 'red',
      vehicleSpeedKmh: 0,
      outcome: 'Pedestrian & Vehicle Halted',
    });
  };

  const clearCollision = () => {
    setIsCollisionOccurred(false);
    setCollisionLocation(null);
  };

  // Road Traffic Preset and Segment controls
  const setTrafficPreset = (preset: 'congested' | 'moderate' | 'light') => {
    setTrafficPresetState(preset);
    setTrafficSegments((prev) =>
      prev.map((seg) => {
        if (preset === 'congested') {
          if (seg.id === 'seg-grand-west') {
            return {
              ...seg,
              level: 'congested',
              speedKmh: 12,
              description: 'Congested (Red) — Heavy stop-and-go queue near bus terminal',
            };
          }
          if (seg.id === 'seg-4th-st') {
            return {
              ...seg,
              level: 'manageable',
              speedKmh: 28,
              description: 'Manageable (Yellow) — Moderate traffic flow at intersection',
            };
          }
          return {
            ...seg,
            level: 'manageable',
            speedKmh: 35,
            description: 'Manageable (Yellow) — Moderate arterial volume',
          };
        } else if (preset === 'moderate') {
          if (seg.id === 'seg-grand-west') {
            return {
              ...seg,
              level: 'manageable',
              speedKmh: 28,
              description: 'Manageable (Yellow) — Moderate traffic flow',
            };
          }
          if (seg.id === 'seg-4th-st') {
            return {
              ...seg,
              level: 'manageable',
              speedKmh: 34,
              description: 'Manageable (Yellow) — Steady progression',
            };
          }
          return {
            ...seg,
            level: 'free_flow',
            speedKmh: 46,
            description: 'No Traffic (Green) — Free flowing corridor',
          };
        } else {
          return {
            ...seg,
            level: 'free_flow',
            speedKmh: 48,
            description: 'No Traffic (Green) — Clear open roadway',
          };
        }
      })
    );
  };

  const setSegmentTrafficLevel = (segmentId: string, level: TrafficLevel) => {
    setTrafficSegments((prev) =>
      prev.map((seg) =>
        seg.id === segmentId
          ? {
              ...seg,
              level,
              speedKmh: level === 'congested' ? 14 : level === 'manageable' ? 32 : 48,
              description: `${
                level === 'congested'
                  ? 'Congested (Red)'
                  : level === 'manageable'
                  ? 'Manageable (Yellow)'
                  : 'No Traffic (Green)'
              } — ${seg.name}`,
            }
          : seg
      )
    );
  };

  // Environmental Weather Condition setter
  const setWeatherCondition = (weather: WeatherCondition) => {
    setWeatherConditionState(weather);
    if (weather === 'fog') {
      setScenario((s) => ({ ...s, sensorIntegrity: 'degraded_fog' }));
    } else if (weather === 'sensor_offline') {
      setScenario((s) => ({ ...s, sensorIntegrity: 'sensor_unavailable' }));
    } else {
      setScenario((s) => ({ ...s, sensorIntegrity: 'nominal' }));
    }

    addEventLogEntry({
      type: 'weather_changed',
      title: `Atmospheric Condition: ${weather.replace('_', ' ').toUpperCase()}`,
      description: `Road friction and sensor confidence updated for ${weather}.`,
      riskLevel: weather === 'sensor_offline' ? 'unknown' : weather === 'fog' ? 'yellow' : 'green',
      vehicleSpeedKmh: vehicle.speedKmh,
      outcome: weather,
    });
  };

  const setSensorIntegrity = (status: 'nominal' | 'degraded_fog' | 'sensor_unavailable') => {
    setScenario((s) => ({ ...s, sensorIntegrity: status }));
    if (status === 'degraded_fog') setWeatherConditionState('fog');
    else if (status === 'sensor_unavailable') setWeatherConditionState('sensor_offline');
    else setWeatherConditionState('clear');
  };

  const setPedestrianProfile = (profile: MobilityProfile) => {
    let speed = 4.8;
    if (profile === 'senior') speed = 2.6;
    if (profile === 'wheelchair') speed = 3.6;
    if (profile === 'child') speed = 5.0;

    setPedestrian((p) => ({
      ...p,
      mobilityProfile: profile,
      speedKmh: speed,
    }));
    updateSettings({ mobilityProfile: profile });
  };

  const setPedestrianSpeed = (speedKmh: number) => {
    setPedestrian((p) => ({ ...p, speedKmh: Math.max(0.5, Math.min(12, speedKmh)) }));
  };

  const setPedestrianIntent = (intent: boolean) => {
    setPedestrian((p) => ({ ...p, intentToCross: intent }));
  };

  const setPedestrianAtCrossing = (atCrossing: boolean) => {
    setPedestrian((p) => ({ ...p, atDesignatedCrossing: atCrossing }));
  };

  const updateVehiclePosition = (pos: LatLng) => {
    setVehicle((v) => ({ ...v, position: pos }));
  };

  const updatePedestrianPosition = (pos: LatLng) => {
    setPedestrian((p) => ({ ...p, position: pos }));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAlerts = () => setAlerts([]);
  const clearEventLog = () => setEventLog([]);

  const updateSettings = (partial: Partial<UserSafetySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('safestep_settings', JSON.stringify(next));
      } catch {
        // storage disabled or quota exceeded
      }
      return next;
    });
  };

  const requestRealGeolocation = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported in this environment.');
      return false;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setIsRealLocationActive(true);
          updateSettings({ locationPermissionGranted: true });
          resolve(true);
        },
        () => {
          setIsRealLocationActive(false);
          resolve(false);
        },
        { timeout: 7000 }
      );
    });
  };

  return (
    <SafetyContext.Provider
      value={{
        mode,
        setMode,
        activeScenarioId,
        scenario,
        loadScenario,
        vehicle,
        pedestrian,
        conflictAssessment,
        crosswalks: MOCK_CROSSWALKS,
        hazardZones: MOCK_HAZARD_ZONES,
        routes: MOCK_PEDESTRIAN_ROUTES,
        selectedRouteId,
        setSelectedRouteId,
        isPlaying,
        simulationProgress,
        playbackSpeed,
        togglePlay,
        resetSimulation,
        stepSimulation,
        setSimulationSpeed,
        setVehicleSpeed,
        triggerEmergencyBrake,
        triggerBrakeAssist,
        slowDownVehicle,
        brakingOutcomeMessage,
        clearBrakingOutcome,
        isUnder50mProximity: conflictAssessment.distanceVehToPedMeters <= 50 && conflictAssessment.distanceVehToPedMeters > 0,
        distanceVehToPedMeters: conflictAssessment.distanceVehToPedMeters,
        playProximityAnnouncement,
        warningDistanceThresholdMeters,
        setWarningDistanceThresholdMeters,
        activeCrossingRequest,
        requestCrossing,
        cancelCrossingRequest,
        completeCrossingRequest,
        acknowledgeDriverWarning,
        driverYieldAction,
        isCollisionOccurred,
        collisionLocation,
        triggerSimulatedCollision,
        clearCollision,
        trafficSegments,
        trafficPreset,
        setTrafficPreset,
        setSegmentTrafficLevel,
        setPedestrianProfile,
        setPedestrianIntent,
        setPedestrianAtCrossing,
        setPedestrianSpeed,
        pedestrianEntryPosition,
        setPedestrianEntryPosition,
        weatherCondition,
        setWeatherCondition,
        setSensorIntegrity,
        updateVehiclePosition,
        updatePedestrianPosition,
        alerts,
        dismissAlert,
        clearAlerts,
        eventLog,
        clearEventLog,
        mapLayers,
        toggleMapLayer,
        isLiveGpsActive,
        toggleLiveGps,
        liveGpsState,
        nearbyRoadInfo,
        recenterMapSignal,
        triggerRecenterMap,
        settings,
        updateSettings,
        requestRealGeolocation,
        isRealLocationActive,
        userCoords,
        isSettingsOpen,
        setIsSettingsOpen,
        isPrivacyOpen,
        setIsPrivacyOpen,
      }}
    >
      <div
        className={`${settings.highContrast ? 'high-contrast-theme' : ''} ${
          settings.textSize === 'large'
            ? 'text-lg'
            : settings.textSize === 'extra-large'
            ? 'text-xl'
            : 'text-base'
        }`}
      >
        {children}
      </div>
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
};
