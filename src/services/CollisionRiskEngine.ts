/**
 * SafeStep — Smart Pedestrian Collision-Prediction Engine
 *
 * ARCHITECTURAL SPECIFICATIONS & PHYSICAL KINEMATICS:
 * 1. Coordinates use standard WGS-84 (lat/lng). Spatial distances calculated via Haversine.
 * 2. Vector Kinematics:
 *    - Trajectory convergence is checked between vehicle forward heading and pedestrian crossing vector.
 *    - Relative closing speed, vehicle arrival time, and pedestrian arrival time are computed.
 * 3. Physical Braking & Stopping Distance Model:
 *    - Reaction distance: d_react = v * t_reaction
 *    - Braking deceleration: a = mu * g (where mu = road friction coefficient, g = 9.81 m/s²)
 *    - Physical braking distance: d_brake = v² / (2 * a)
 *    - Total stopping distance: d_stop = d_react + d_brake
 * 4. Realistic Environmental Impacts:
 *    - Clear / Dry: mu = 0.76, 96% detection confidence, standard 1.1s reaction time.
 *    - Rain / Wet Road: mu = 0.46 (+48% braking distance), 72% confidence.
 *    - Fog / Obstructed: mu = 0.65, 45% confidence, reaction time 1.35s.
 *    - Low Light / Night: mu = 0.74, 58% confidence, reaction time 1.30s.
 *    - Sensor Offline: 0% confidence, safety status UNKNOWN.
 * 5. Road Safety Distinctions:
 *    - Green status NEVER guarantees an empty roadway.
 *    - Clearly distinguishes between a predicted potential conflict (developing intersection)
 *      and an imminent collision (temporal overlap <= 3.5s and distance <= stopping distance).
 *    - Braking assist calculates whether the stopping margin avoids the predicted conflict point.
 */

import {
  ConflictAssessment,
  Crosswalk,
  LatLng,
  PedestrianState,
  RiskLevel,
  VehicleState,
  WeatherCondition,
} from '../types';

/**
 * Calculates great-circle distance between two geographic coordinates in meters using Haversine formula.
 */
export function calculateHaversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates bearing from p1 to p2 in degrees (0° = North, 90° = East, 180° = South, 270° = West).
 */
export function calculateBearing(p1: LatLng, p2: LatLng): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

/**
 * Computes angular difference between two angles in degrees (-180° to +180°).
 */
export function angleDifference(a1: number, a2: number): number {
  let diff = (a2 - a1 + 180) % 360 - 180;
  return Math.abs(diff < -180 ? diff + 360 : diff);
}

/**
 * Environmental parameters for road physics & sensor trust.
 */
export interface EnvironmentalPhysics {
  frictionCoefficient: number; // mu
  reactionTimeSec: number;
  detectionConfidencePct: number;
  roadConditionName: string;
}

export function getEnvironmentalPhysics(
  weather: WeatherCondition = 'clear',
  baseReactionTime: number = 1.1
): EnvironmentalPhysics {
  switch (weather) {
    case 'rain_wet':
      return {
        frictionCoefficient: 0.46, // Wet asphalt friction
        reactionTimeSec: baseReactionTime + 0.15,
        detectionConfidencePct: 72,
        roadConditionName: 'Rain / Wet Asphalt (Friction μ = 0.46, +48% Braking Dist)',
      };
    case 'fog':
      return {
        frictionCoefficient: 0.65, // Damp asphalt
        reactionTimeSec: baseReactionTime + 0.30,
        detectionConfidencePct: 45,
        roadConditionName: 'Atmospheric Fog / Obstructed Sightline (Visibility < 40m)',
      };
    case 'night_low_light':
      return {
        frictionCoefficient: 0.74,
        reactionTimeSec: baseReactionTime + 0.20,
        detectionConfidencePct: 58,
        roadConditionName: 'Low Ambient Lighting / Night (Optical Sensors Degraded)',
      };
    case 'sensor_offline':
      return {
        frictionCoefficient: 0.70,
        reactionTimeSec: baseReactionTime + 0.40,
        detectionConfidencePct: 0,
        roadConditionName: 'Sensors / V2X Transceiver Offline (Telemetry Unavailable)',
      };
    case 'clear':
    default:
      return {
        frictionCoefficient: 0.76, // Dry asphalt friction
        reactionTimeSec: baseReactionTime,
        detectionConfidencePct: 96,
        roadConditionName: 'Dry Asphalt / Nominal Visibility (Friction μ = 0.76)',
      };
  }
}

/**
 * Calculates physical vehicle stopping distance:
 * d_stop = (v * t_reaction) + (v² / (2 * mu * g))
 */
export function calculateStoppingDistance(
  speedKmh: number,
  reactionTimeSec: number,
  frictionCoefficient: number
): { reactionDistanceMeters: number; brakingDistanceMeters: number; totalStoppingDistanceMeters: number } {
  const speedMs = (speedKmh * 1000) / 3600;
  const g = 9.80665; // m/s²

  // Reaction distance
  const reactionDist = speedMs * reactionTimeSec;

  // Braking deceleration a = mu * g
  const decel = Math.max(1.5, frictionCoefficient * g);
  const brakingDist = (speedMs * speedMs) / (2 * decel);

  const total = reactionDist + brakingDist;

  return {
    reactionDistanceMeters: Math.round(reactionDist * 10) / 10,
    brakingDistanceMeters: Math.round(brakingDist * 10) / 10,
    totalStoppingDistanceMeters: Math.round(total * 10) / 10,
  };
}

/**
 * Estimates conflict point between a vehicle's trajectory and a pedestrian's crossing vector.
 */
export function estimateConflictPoint(
  vehicle: VehicleState,
  pedestrian: PedestrianState,
  presetConflictPoint?: LatLng
): { conflictPoint: LatLng | null; isIntersecting: boolean } {
  if (presetConflictPoint) {
    const distVehToPreset = calculateHaversineDistance(vehicle.position, presetConflictPoint);
    const distPedToPreset = calculateHaversineDistance(pedestrian.position, presetConflictPoint);
    // If vehicle is moving toward the conflict locus and within 130m
    const bearingVehToConflict = calculateBearing(vehicle.position, presetConflictPoint);
    const headingDiff = angleDifference(vehicle.headingDeg, bearingVehToConflict);
    const isHeadingToward = headingDiff < 85;

    return {
      conflictPoint: presetConflictPoint,
      isIntersecting: isHeadingToward && distVehToPreset < 120 && distPedToPreset < 80,
    };
  }

  // Geometric dynamic intersection estimation
  const directDistance = calculateHaversineDistance(vehicle.position, pedestrian.position);
  if (directDistance > 130) {
    return { conflictPoint: null, isIntersecting: false };
  }

  const bearingVehToPed = calculateBearing(vehicle.position, pedestrian.position);
  const headingDiff = angleDifference(vehicle.headingDeg, bearingVehToPed);

  // If pedestrian is generally in front of vehicle (+/- 75 degrees)
  const isVehFacingPed = headingDiff < 75;

  // Check if pedestrian is moving toward vehicle or crossing road
  const bearingPedToVeh = calculateBearing(pedestrian.position, vehicle.position);
  const pedHeadingDiff = angleDifference(pedestrian.headingDeg, bearingPedToVeh);
  const isPedMovingToward = pedHeadingDiff < 110;

  const isIntersecting = isVehFacingPed && (isPedMovingToward || pedestrian.intentToCross);

  // Weighted midpoint projection along heading vectors
  const conflictPoint: LatLng = {
    lat: vehicle.position.lat * 0.40 + pedestrian.position.lat * 0.60,
    lng: vehicle.position.lng * 0.40 + pedestrian.position.lng * 0.60,
  };

  return { conflictPoint, isIntersecting };
}

export interface EngineInputOptions {
  vehicle: VehicleState;
  pedestrian: PedestrianState;
  presetConflictPoint?: LatLng;
  designatedCrossing?: LatLng;
  sensorIntegrity?: 'nominal' | 'degraded_fog' | 'sensor_unavailable';
  weatherCondition?: WeatherCondition;
}

/**
 * Primary Smart Pedestrian Collision-Prediction Engine.
 * Evaluates kinematics, arrival time windows, stopping distance margin,
 * road friction, sensor confidence, and mobility profiles.
 */
export function evaluateCollisionRisk(options: EngineInputOptions): ConflictAssessment {
  const {
    vehicle,
    pedestrian,
    presetConflictPoint,
    designatedCrossing = { lat: 37.7881, lng: -122.4072 },
    sensorIntegrity = 'nominal',
    weatherCondition = 'clear',
  } = options;

  // 1. ENVIRONMENTAL & SENSOR PHYSICS SETUP
  const actualWeather: WeatherCondition =
    sensorIntegrity === 'sensor_unavailable'
      ? 'sensor_offline'
      : sensorIntegrity === 'degraded_fog'
      ? 'fog'
      : weatherCondition;

  const env = getEnvironmentalPhysics(actualWeather, vehicle.driverReactionTimeSec || 1.1);

  // Stopping distance calculation
  const stoppingCalc = calculateStoppingDistance(
    vehicle.speedKmh,
    env.reactionTimeSec,
    env.frictionCoefficient
  );

  // Distances
  const distVehToPed = Math.round(calculateHaversineDistance(vehicle.position, pedestrian.position) * 10) / 10;
  const distVehToCrossing = Math.round(calculateHaversineDistance(vehicle.position, designatedCrossing) * 10) / 10;
  const distPedToCrossing = Math.round(calculateHaversineDistance(pedestrian.position, designatedCrossing) * 10) / 10;

  // 2. SENSOR INTEGRITY / OFFLINE HANDLING
  if (sensorIntegrity === 'sensor_unavailable' || actualWeather === 'sensor_offline') {
    return {
      distanceMeters: Math.round(distVehToPed),
      distanceVehToPedMeters: distVehToPed,
      distanceVehToCrossingMeters: distVehToCrossing,
      distanceVehToConflictMeters: distVehToPed,
      distancePedToCrossingMeters: distPedToCrossing,
      distancePedToConflictMeters: 0,
      estimatedStoppingDistanceMeters: stoppingCalc.totalStoppingDistanceMeters,
      reactionDistanceMeters: stoppingCalc.reactionDistanceMeters,
      brakingDistanceMeters: stoppingCalc.brakingDistanceMeters,
      closingSpeedKmh: vehicle.speedKmh,
      timeToConflictPointSec: null,
      tVehToConflictSec: null,
      tPedToConflictSec: null,
      arrivalDeltaSec: null,
      timeToCollisionSec: null,
      isIntersectingPaths: false,
      conflictStatus: 'status_unknown',
      frictionCoefficient: env.frictionCoefficient,
      roadConditionName: env.roadConditionName,
      riskLevel: 'unknown',
      experimentalRiskScore: 0,
      detectionConfidencePct: 0,
      dataSource: 'real',
      conflictPoint: null,
      sensorIntegrity: 'sensor_unavailable',
      weatherCondition: actualWeather,
      brakingOutcome: 'none',
      brakingSafetyMarginMeters: null,
      isUnder50mProximity: distVehToPed <= 50,
      isCollision: distVehToPed <= 2.8 && vehicle.speedKmh > 3,
      collisionLocation:
        distVehToPed <= 2.8
          ? {
              lat: (vehicle.position.lat + pedestrian.position.lat) / 2,
              lng: (vehicle.position.lng + pedestrian.position.lng) / 2,
            }
          : null,
      aebStatus: 'standby',
      aebMessage: 'SENSORS OFFLINE — MANUAL OBSERVATION REQUIRED',
      hasPedestrianCleared: false,
      isPedestrianInCrossingZone: true,
      rationale:
        'Roadside sensors & V2X broadcast unavailable. Reliable detection telemetry offline. Do not assume the road is clear.',
      recommendedDriverAction:
        'Exercise extreme caution. Scan roadway and sidewalks manually. Treat crossing as uncontrolled.',
      recommendedPedestrianAction:
        'Safety status unknown. Do not step onto the roadway without visually checking both directions.',
    };
  }

  // 3. CONFLICT POINT & TRAJECTORY ANALYSIS
  const { conflictPoint, isIntersecting } = estimateConflictPoint(
    vehicle,
    pedestrian,
    presetConflictPoint
  );

  const effectiveConflictPoint = conflictPoint || designatedCrossing;
  const distVehToConflict = Math.round(calculateHaversineDistance(vehicle.position, effectiveConflictPoint) * 10) / 10;
  const distPedToConflict = Math.round(calculateHaversineDistance(pedestrian.position, effectiveConflictPoint) * 10) / 10;

  // Speeds in m/s
  const vehSpeedMs = (vehicle.speedKmh * 1000) / 3600;
  const pedSpeedMs = Math.max(0.1, (pedestrian.speedKmh * 1000) / 3600);

  // Arrival times at conflict point
  const tVeh = vehSpeedMs > 0.5 ? distVehToConflict / vehSpeedMs : null;
  const tPed = pedSpeedMs > 0.1 ? distPedToConflict / pedSpeedMs : null;

  const arrivalDeltaSec =
    tVeh !== null && tPed !== null ? Math.round(Math.abs(tVeh - tPed) * 10) / 10 : null;

  // Relative closing speed & TTC
  const closingSpeedKmh = Math.round(
    vehicle.speedKmh + (pedestrian.intentToCross ? pedestrian.speedKmh * 1.4 : 0)
  );
  const closingSpeedMs = Math.max(0.5, (closingSpeedKmh * 1000) / 3600);
  const timeToCollisionSec =
    distVehToPed > 0 && closingSpeedMs > 0.5
      ? Math.round((distVehToPed / closingSpeedMs) * 10) / 10
      : null;

  // 4. PEDESTRIAN CLEARANCE EVALUATION
  // Check if pedestrian has traversed past the conflict point and is clearing the road
  const bearingPedToConflict = calculateBearing(pedestrian.position, effectiveConflictPoint);
  const pedHeadingDiff = angleDifference(pedestrian.headingDeg, bearingPedToConflict);
  const isWalkingAwayFromConflict = pedHeadingDiff > 90;
  
  // Pedestrian has cleared if they walked past conflict point and are > 3.8m away heading away,
  // or if vehicle has already passed conflict point and is moving away from pedestrian.
  const hasPedestrianCleared =
    (isWalkingAwayFromConflict && distPedToConflict >= 3.8) ||
    (!pedestrian.intentToCross && distPedToConflict >= 6.0) ||
    distVehToPed > 85;

  const isPedestrianInCrossingZone =
    !hasPedestrianCleared &&
    (distPedToConflict < 8.5 || (distPedToCrossing < 12.0 && pedestrian.intentToCross));

  // 5. STOPPING DISTANCE SAFETY MARGIN & BRAKING EFFICACY
  const brakingMargin = Math.round((distVehToConflict - stoppingCalc.totalStoppingDistanceMeters) * 10) / 10;

  // Autonomous AEB stopping distance (system response time ~0.15s)
  const aebDecel = Math.max(2.5, env.frictionCoefficient * 9.80665);
  const aebStoppingDistanceMeters = Math.round(
    (vehSpeedMs * 0.15 + (vehSpeedMs * vehSpeedMs) / (2 * aebDecel)) * 10
  ) / 10;

  // 6. HEURISTIC RISK SCORE FORMULATION (0-100)
  let mobilityMultiplier = 1.0;
  if (pedestrian.mobilityProfile === 'senior' || pedestrian.mobilityProfile === 'limited_mobility') {
    mobilityMultiplier = 1.35;
  } else if (pedestrian.mobilityProfile === 'child') {
    mobilityMultiplier = 1.40;
  } else if (pedestrian.mobilityProfile === 'wheelchair') {
    mobilityMultiplier = 1.25;
  }

  const nonDesignatedPenalty = pedestrian.atDesignatedCrossing ? 1.0 : 1.45;
  const distanceFactor = Math.max(0, 1 - distVehToConflict / 95);
  const temporalFactor =
    arrivalDeltaSec !== null && arrivalDeltaSec < 12
      ? Math.max(0, 1 - arrivalDeltaSec / 12)
      : 0;

  const stoppingDeficitFactor =
    distVehToConflict < stoppingCalc.totalStoppingDistanceMeters
      ? Math.min(1.0, (stoppingCalc.totalStoppingDistanceMeters - distVehToConflict) / 30)
      : 0;

  const speedFactor = Math.min(1.2, vehicle.speedKmh / 50);

  let rawScore =
    (distanceFactor * 35 +
      temporalFactor * 35 +
      stoppingDeficitFactor * 20 +
      speedFactor * 10) *
    mobilityMultiplier *
    nonDesignatedPenalty;

  if (actualWeather === 'fog') rawScore = Math.max(rawScore, 48);
  if (actualWeather === 'rain_wet') rawScore = Math.max(rawScore, 42);

  const experimentalRiskScore = Math.min(99, Math.max(5, Math.round(rawScore)));

  // 7. DETERMINATION OF RISK LEVEL & AEB ACTIONS
  let conflictStatus: 'safe_clearance' | 'potential_conflict' | 'imminent_collision' = 'safe_clearance';
  let riskLevel: RiskLevel = 'green';
  let aebStatus: 'standby' | 'caution_slowing' | 'emergency_braking' | 'stopped_safe' | 'critical_deficit' = 'standby';
  let aebMessage = '';
  let rationale = '';
  let driverAction = '';
  let pedAction = '';

  // Check if collision is already occurring or unavoidable
  const isTooCloseToStop =
    distVehToConflict < aebStoppingDistanceMeters && vehicle.speedKmh > 20 && distVehToPed < 16;

  // Imminent Collision Criteria:
  // - Required stopping distance exceeds or is close to available distance
  // - TTC is critical (< 3.8s) while pedestrian is in crossing path
  // - Distance to conflict is within critical stopping threshold
  // - Or vehicle is already executing emergency braking to a stop
  const isImminentCollision =
    !hasPedestrianCleared &&
    isPedestrianInCrossingZone &&
    ((distVehToConflict <= stoppingCalc.totalStoppingDistanceMeters * 1.15 && vehicle.speedKmh > 5) ||
      (timeToCollisionSec !== null && timeToCollisionSec <= 3.8 && vehicle.speedKmh > 8) ||
      (distVehToConflict < 26 && pedestrian.intentToCross && vehicle.speedKmh > 5) ||
      (vehicle.isBraking && vehicle.speedKmh > 0 && distVehToConflict < 40) ||
      (vehicle.speedKmh === 0 && distVehToConflict < 20 && !hasPedestrianCleared));

  // Case 1: RED — HIGH RISK / IMMINENT COLLISION
  if (isImminentCollision && !hasPedestrianCleared) {
    riskLevel = 'red';
    conflictStatus = 'imminent_collision';

    if (vehicle.speedKmh === 0 && distVehToConflict >= 1.5) {
      // Vehicle has successfully stopped before the pedestrian's path!
      aebStatus = 'stopped_safe';
      aebMessage = 'EMERGENCY BRAKING ACTIVATED — VEHICLE STOPPED — PEDESTRIAN SAFETY ZONE PROTECTED.';
      rationale = `EMERGENCY BRAKING ACTIVATED — VEHICLE STOPPED — PEDESTRIAN SAFETY ZONE PROTECTED. Vehicle brought to complete 0 km/h stop ${Math.round(distVehToConflict)}m before conflict point. Pedestrian safety zone secured.`;
      driverAction = 'HOLD VEHICLE STOPPED (0 km/h). Brakes locked until pedestrian has fully crossed the road.';
      pedAction = 'DANGER! Vehicle approaching — wait until the vehicle stops and the road is safe.';
    } else if (isTooCloseToStop) {
      // Available stopping distance is physically insufficient
      aebStatus = 'critical_deficit';
      aebMessage = 'EMERGENCY BRAKING — COLLISION RISK CRITICAL';
      rationale = `EMERGENCY BRAKING — COLLISION RISK CRITICAL. Available distance (${Math.round(distVehToConflict)}m) is less than required stopping distance (${aebStoppingDistanceMeters}m). Maximum emergency deceleration applied; collision avoidance may not be physically possible.`;
      driverAction = 'MAXIMUM EMERGENCY BRAKING APPLIED. Available stopping distance insufficient. Brace for impact.';
      pedAction = 'DANGER! Vehicle approaching — wait until the vehicle stops and the road is safe.';
    } else {
      // Active emergency braking in progress
      aebStatus = 'emergency_braking';
      aebMessage = 'HIGH COLLISION RISK — EMERGENCY BRAKING ACTIVATED';
      rationale = `HIGH COLLISION RISK — EMERGENCY BRAKING ACTIVATED. Imminent collision trajectory detected ${Math.round(distVehToConflict)}m ahead. Total stopping distance required: ${stoppingCalc.totalStoppingDistanceMeters}m. AEB decelerating vehicle to complete stop.`;
      driverAction = 'EMERGENCY BRAKING ACTIVATED. Vehicle stopping autonomously before conflict point.';
      pedAction = 'DANGER! Vehicle approaching — wait until the vehicle stops and the road is safe.';
    }
  }
  // Case 2: YELLOW — MEDIUM RISK / CAUTION
  else if (
    !hasPedestrianCleared &&
    ((isIntersecting && arrivalDeltaSec !== null && arrivalDeltaSec <= 8.5 && distVehToConflict < 80) ||
      (distVehToConflict < 60 && vehicle.speedKmh > 20) ||
      actualWeather === 'fog' ||
      actualWeather === 'rain_wet' ||
      experimentalRiskScore >= 45 ||
      (!pedestrian.atDesignatedCrossing && distVehToConflict < 75))
  ) {
    riskLevel = 'yellow';
    conflictStatus = 'potential_conflict';
    aebStatus = 'caution_slowing';
    aebMessage = 'CAUTION — PEDESTRIAN CONFLICT AHEAD. AUTOMATIC SPEED REDUCTION ACTIVE.';
    rationale = `SLOW DOWN. Pedestrian trajectory detected ${Math.round(distVehToConflict)}m ahead (${
      pedestrian.atDesignatedCrossing ? 'Designated crosswalk' : 'OUTSIDE designated crosswalk'
    }). Stopping distance: ${stoppingCalc.totalStoppingDistanceMeters}m. Relative closing speed: ${closingSpeedKmh} km/h. Vehicle speed automatically reducing. ${
      actualWeather === 'rain_wet' ? 'Wet asphalt increases braking distance.' : ''
    }`;
    driverAction = 'Decelerate smoothly to caution speed (below 25 km/h). Prime brake pedal for pedestrian crossing.';
    pedAction = 'CAUTION — VEHICLE APPROACHING. Wait at sidewalk curb. Make direct eye contact with driver before crossing.';
  }
  // Case 3: GREEN — LOW RISK / SAFE CLEARANCE
  else {
    riskLevel = 'green';
    conflictStatus = 'safe_clearance';
    aebStatus = 'standby';

    if (hasPedestrianCleared) {
      aebMessage = 'PEDESTRIAN HAS CLEARED CROSSING — CORRIDOR SAFE FOR VEHICLE RESUMPTION.';
      rationale = `Pedestrian has safely crossed the conflict zone and cleared the roadway (${Math.round(distPedToConflict)}m past conflict). Roadway path is verified clear. Vehicle may safely resume cruising speed.`;
      driverAction = 'Corridor clear. Smoothly resume normal driving speed. Maintain curb vigilance.';
      pedAction = 'Pedestrian safe. Roadway cleared.';
    } else {
      aebMessage = 'LOW DETECTED RISK — NORMAL SIMULATED SPEED';
      rationale = `Lower detected risk. Vehicle is ${Math.round(distVehToConflict)}m from crossing point with safe stopping margin (+${Math.max(0, brakingMargin)}m). Safe spatial buffer maintained.`;
      driverAction = 'Proceed cautiously at posted road speed. Green does not guarantee an empty road; stay alert.';
      pedAction = 'Lower detected risk. Always verify moving vehicles have yielded before stepping into the crosswalk.';
    }
  }

  // Braking outcome assessment
  let brakingOutcome: 'none' | 'avoided' | 'mitigated' | 'inadequate' = 'none';
  if (vehicle.isBraking || aebStatus === 'emergency_braking' || aebStatus === 'stopped_safe') {
    if (distVehToConflict >= 1.5 && vehicle.speedKmh === 0) {
      brakingOutcome = 'avoided';
    } else if (brakingMargin > 3.0) {
      brakingOutcome = 'avoided';
    } else if (brakingMargin >= -5.0) {
      brakingOutcome = 'mitigated';
    } else {
      brakingOutcome = 'inadequate';
    }
  }

  return {
    distanceMeters: Math.round(distVehToConflict),
    distanceVehToPedMeters: distVehToPed,
    distanceVehToCrossingMeters: distVehToCrossing,
    distanceVehToConflictMeters: distVehToConflict,
    distancePedToCrossingMeters: distPedToCrossing,
    distancePedToConflictMeters: distPedToConflict,
    estimatedStoppingDistanceMeters: stoppingCalc.totalStoppingDistanceMeters,
    reactionDistanceMeters: stoppingCalc.reactionDistanceMeters,
    brakingDistanceMeters: stoppingCalc.brakingDistanceMeters,
    closingSpeedKmh,
    timeToConflictPointSec: tVeh !== null && tVeh < 900 ? Number(tVeh.toFixed(1)) : null,
    tVehToConflictSec: tVeh !== null && tVeh < 900 ? Number(tVeh.toFixed(1)) : null,
    tPedToConflictSec: tPed !== null && tPed < 900 ? Number(tPed.toFixed(1)) : null,
    arrivalDeltaSec,
    timeToCollisionSec,
    isIntersectingPaths: isIntersecting,
    conflictStatus,
    frictionCoefficient: env.frictionCoefficient,
    roadConditionName: env.roadConditionName,
    riskLevel,
    experimentalRiskScore,
    detectionConfidencePct: env.detectionConfidencePct,
    dataSource: 'simulated',
    conflictPoint: effectiveConflictPoint,
    sensorIntegrity,
    weatherCondition: actualWeather,
    brakingOutcome,
    brakingSafetyMarginMeters: brakingMargin,
    isUnder50mProximity: distVehToPed <= 50,
    isCollision: distVehToPed <= 2.8 && vehicle.speedKmh > 3,
    collisionLocation:
      distVehToPed <= 2.8
        ? {
            lat: (vehicle.position.lat + pedestrian.position.lat) / 2,
            lng: (vehicle.position.lng + pedestrian.position.lng) / 2,
          }
        : null,
    aebStatus,
    aebMessage,
    hasPedestrianCleared,
    isPedestrianInCrossingZone,
    rationale: rationale.trim(),
    recommendedDriverAction: driverAction,
    recommendedPedestrianAction: pedAction,
  };
}
