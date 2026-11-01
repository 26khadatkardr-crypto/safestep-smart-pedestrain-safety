/**
 * SafeStep — Smart Pedestrian Safety System
 * Core domain types and simulation definitions
 */

export type AppMode = 'landing' | 'driver' | 'pedestrian' | 'scenarios' | 'dual_view';

export type RiskLevel = 'red' | 'yellow' | 'green' | 'unknown';

export type MobilityProfile = 
  | 'standard' 
  | 'senior' 
  | 'wheelchair' 
  | 'child' 
  | 'limited_mobility' 
  | 'visual_impairment' 
  | 'hearing_impairment';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface VehicleState {
  id: string;
  name: string;
  position: LatLng;
  speedKmh: number;
  targetSpeedKmh: number;
  headingDeg: number;
  isBraking: boolean;
  driverReactionTimeSec: number;
  dataSource: 'simulated' | 'connected_vehicle_v2x';
}

export interface PedestrianState {
  id: string;
  name: string;
  position: LatLng;
  speedKmh: number;
  headingDeg: number;
  mobilityProfile: MobilityProfile;
  atDesignatedCrossing: boolean;
  intentToCross: boolean;
  dataSource: 'simulated' | 'app_broadcast' | 'roadside_vision_sensor';
}

export interface Crosswalk {
  id: string;
  name: string;
  position: LatLng;
  type: 'zebra' | 'signalized' | 'midblock_unmarked' | 'ramp_curb_cut';
  isWheelchairAccessible: boolean;
  hasTactilePaving: boolean;
  hasAudibleSignal: boolean;
  lightingCondition: 'good' | 'poor' | 'fair';
}

export interface HazardZone {
  id: string;
  name: string;
  center: LatLng;
  radiusMeters: number;
  riskRating: 'high' | 'medium' | 'low';
  hazardType: 'blind_curve' | 'construction' | 'high_speed_stretch' | 'poor_visibility';
  description: string;
}

export type WeatherCondition =
  | 'clear'
  | 'fog'
  | 'rain_wet'
  | 'night_low_light'
  | 'sensor_offline';

export interface ConflictAssessment {
  distanceMeters: number; // primary distance to conflict point (or pedestrian)
  distanceVehToPedMeters: number; // straight-line distance between vehicle and pedestrian
  distanceVehToCrossingMeters: number; // distance from vehicle to designated crosswalk
  distanceVehToConflictMeters: number; // distance from vehicle to predicted conflict point
  distancePedToCrossingMeters: number; // distance from pedestrian to designated crosswalk
  distancePedToConflictMeters: number; // distance from pedestrian to conflict point
  estimatedStoppingDistanceMeters: number; // reaction distance + physical braking distance
  stoppingDistanceMeters?: number; // convenience alias
  reactionDistanceMeters: number;
  brakingDistanceMeters: number;
  closingSpeedKmh: number;
  timeToConflictPointSec: number | null; // vehicle arrival time at conflict point
  timeToCollisionSec?: number | null; // legacy alias
  tVehToConflictSec: number | null;
  tPedToConflictSec: number | null;
  arrivalDeltaSec: number | null; // |tVeh - tPed| arrival temporal overlap
  isIntersectingPaths: boolean; // whether physical trajectory vectors converge
  conflictStatus: 'safe_clearance' | 'potential_conflict' | 'imminent_collision' | 'status_unknown';
  frictionCoefficient: number; // road friction mu (e.g. 0.75 dry, 0.45 wet)
  roadConditionName: string;
  riskLevel: RiskLevel;
  experimentalRiskScore: number; // 0 to 100, labeled as experimental heuristic
  detectionConfidencePct: number; // 0 to 100%
  dataSource: 'simulated' | 'real';
  conflictPoint: LatLng | null;
  rationale: string;
  sensorIntegrity: 'nominal' | 'degraded_fog' | 'sensor_unavailable';
  weatherCondition: WeatherCondition;
  brakingOutcome: 'none' | 'avoided' | 'mitigated' | 'inadequate';
  brakingSafetyMarginMeters: number | null;
  isUnder50mProximity: boolean; // whether distance between driver and pedestrian is under 50m
  isCollision: boolean; // whether an impact/collision occurred
  collisionLocation: LatLng | null;
  recommendedDriverAction: string;
  recommendedPedestrianAction: string;
  aebStatus?: string;
  aebMessage?: string;
  hasPedestrianCleared?: boolean;
  isPedestrianInCrossingZone?: boolean;
}

export type TrafficLevel = 'congested' | 'manageable' | 'free_flow';

export interface RoadTrafficSegment {
  id: string;
  name: string;
  level: TrafficLevel; // 'congested' (red), 'manageable' (yellow), 'free_flow' (green)
  speedKmh: number;
  description: string;
  path: LatLng[];
}

export type CrossingRequestStatus =
  | 'idle'
  | 'requested'
  | 'waiting'
  | 'waiting_for_vehicle'
  | 'vehicle_slowing'
  | 'vehicle_stopped'
  | 'completed'
  | 'cancelled';

export interface CrossingTimelineEvent {
  step: number;
  title: string;
  description: string;
  timestamp: string;
}

export interface PedestrianCrossingRequest {
  id: string;
  pedestrianId: string;
  pedestrianName: string;
  requestedAt: string;
  timestampMs: number;
  pedestrianPosition: LatLng | null;
  crossingLocationName: string | null;
  crossingPosition: LatLng | null;
  status: CrossingRequestStatus;
  distanceAtRequestMeters: number | null;
  currentDistanceMeters: number | null;
  driverAcknowledged: boolean;
  driverActionTaken: 'none' | 'slowing' | 'stopped' | 'yielded';
  warningDistanceThresholdMeters: number; // default 50 meters
  timeline: CrossingTimelineEvent[];
}

export interface SimulationEventLogEntry {
  id: string;
  timestamp: string;
  type:
    | 'detection'
    | 'risk_escalated'
    | 'risk_reduced'
    | 'conflict_predicted'
    | 'driver_warning'
    | 'proximity_warning'
    | 'collision_event'
    | 'brake_assist'
    | 'speed_regulated'
    | 'conflict_resolved'
    | 'scenario_loaded'
    | 'weather_changed'
    | 'crossing_requested'
    | 'crossing_acknowledged'
    | 'crossing_completed'
    | 'crossing_cancelled';
  title: string;
  description: string;
  riskLevel: RiskLevel;
  vehicleSpeedKmh: number;
  stoppingDistanceMeters?: number;
  distanceToConflictMeters?: number;
  outcome?: string;
}

export interface MapLayerVisibility {
  hazardZones: boolean;
  conflictZones: boolean;
  vehicleCorridor: boolean;
  pedestrianPath: boolean;
  crosswalks: boolean;
  gpsTrail: boolean;
  trafficStatus: boolean;
}

export interface SafetyAlert {
  id: string;
  timestamp: string;
  level: RiskLevel;
  recipient: 'driver' | 'pedestrian' | 'both';
  title: string;
  message: string;
  actionGuidance: string;
  dismissed: boolean;
}

export interface PedestrianRouteOption {
  id: string;
  name: string;
  tagline: string;
  distanceMeters: number;
  estimatedMinutes: number;
  hasDesignatedCrossings: boolean;
  isWheelchairAccessible: boolean;
  hasStairs: boolean;
  hasCurbRamps: boolean;
  averageSafetyIndex: number; // 1-10
  routeWaypoints: LatLng[];
  features: string[];
  caveats: string[];
}

export type ScenarioId = 
  | 'scenario_a' // Pedestrian approaching busy road
  | 'scenario_b' // Pedestrian enters road unexpectedly (jaywalking)
  | 'scenario_c' // Vehicle approaching at high speed (58 km/h)
  | 'scenario_d' // Pedestrian safely clears road
  | 'scenario_d_unexpected' // Scenario D: Unexpected Pedestrian Entry
  | 'scenario_e' // Unavoidable collision test
  | 'scenario_f' // Sensor offline (Unknown Status)
  | 'scenario_g' // Vehicle and pedestrian moving apart
  | 'scenario_senior' // Senior citizen crossing (extended exposure)
  | 'scenario_wheelchair' // Wheelchair-accessible route comparison
  | 'scenario_fog'; // Poor visibility / monsoon

export interface ScenarioDefinition {
  id: ScenarioId;
  code: string;
  title: string;
  description: string;
  expectedResult: string;
  initialVehicle: VehicleState;
  initialPedestrian: PedestrianState;
  sensorIntegrity: 'nominal' | 'degraded_fog' | 'sensor_unavailable';
  conflictPoint: LatLng;
  vehiclePath: LatLng[];
  pedestrianPath: LatLng[];
  entryOffsetMeters?: number; // For Scenario D unexpected entry positioning
}

export interface UserSafetySettings {
  language: string;
  textSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  soundAlerts: boolean;
  voiceAlerts: boolean;
  vibrationAlerts: boolean;
  mobilityProfile: MobilityProfile;
  preferDesignatedCrossings: boolean;
  wheelchairRoutingRequired: boolean;
  avoidSteepInclines: boolean;
  locationPermissionGranted: boolean;
  anonymizeLocationData: boolean;
  allowTelemetrySharing: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface LiveGpsState {
  isActive: boolean;
  coords: LatLng | null;
  accuracyMeters: number | null;
  speedKmh: number | null;
  headingDeg: number | null;
  status: 'idle' | 'acquiring' | 'locked' | 'active' | 'lost' | 'error';
  errorMessage: string | null;
  lastUpdatedTimestamp: number | null;
  streetName: string | null;
  trail: LatLng[];
  isResolvingAddress?: boolean;
}

export interface NearbyRoadInfo {
  nearestRoadName: string | null;
  nearestRoadCoordinates: LatLng[];
  distanceToRoadMeters: number | null;
  nearestCrosswalk: LatLng | null;
  distanceToCrosswalkMeters: number | null;
  conflictLocus: LatLng | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
}

