/**
 * SafeStep — What-If Safety Simulator Risk Engine
 *
 * INDEPENDENT CALCULATION MODULE
 *
 * Physical & Heuristic Formulas:
 * 1. Vehicle speed conversion:
 *    v_ms = v_kmh / 3.6
 *
 * 2. Estimated vehicle arrival time to conflict locus:
 *    t_arrival = distance_to_conflict / v_ms (when v_ms > 0)
 *
 * 3. Stopping distance calculation (AASHTO standard kinematics model):
 *    d_reaction = v_ms * t_reaction
 *    d_braking = (v_ms^2) / (2 * a_decel)
 *    d_total_stopping = d_reaction + d_braking
 *
 * 4. Visibility compensation:
 *    - Good: t_reaction = 1.0s, full sensor confidence
 *    - Moderate: t_reaction = 1.3s, slight delay in obstacle detection
 *    - Poor: t_reaction = 1.8s, impaired sightlines, increased uncertainty
 *
 * 5. Pedestrian trajectory & time-to-clear:
 *    Evaluates pedestrian lateral position across the lane:
 *    - waiting: lateral offset >= 2.5m from vehicle path (no immediate intersection)
 *    - approaching: moving toward curb at ~1.0 m/s
 *    - beginning_to_cross: step onto roadway curb zone
 *    - already_crossing: in lane of travel
 *
 * 6. Risk Categories:
 *    - LOW RISK: vehicle stops well before conflict or paths do not intersect
 *    - MODERATE RISK: potential trajectory convergence requiring driver vigilance
 *    - HIGH RISK: vehicle stopping distance is close to or slightly exceeds distance
 *    - CRITICAL RISK: vehicle stopping distance exceeds distance and arrival time < 2.5s
 */

export type WhatIfPedestrianBehavior =
  | 'waiting'
  | 'approaching'
  | 'beginning_to_cross'
  | 'already_crossing';

export type WhatIfCrossingType = 'zebra' | 'unmarked';

export type WhatIfVisibility = 'good' | 'moderate' | 'poor';

export type WhatIfRiskCategory = 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'CRITICAL RISK';

export interface WhatIfSimulationInput {
  vehicleSpeedKmh: number;
  vehicleDistanceMeters: number;
  pedestrianBehavior: WhatIfPedestrianBehavior;
  crossingType: WhatIfCrossingType;
  visibility: WhatIfVisibility;
  isEarlyWarningActive?: boolean;
  isEmergencyStopActive?: boolean;
}

export interface WhatIfScenarioMetrics {
  vehicleSpeedKmh: number;
  vehicleSpeedMs: number;
  distanceMeters: number;
  estimatedArrivalTimeSec: number | null; // null if vehicle is stationary
  reactionDistanceMeters: number;
  brakingDistanceMeters: number;
  totalStoppingDistanceMeters: number;
  pathConflictPredicted: boolean;
  riskCategory: WhatIfRiskCategory;
  experimentalRiskScore: number; // 0-100 heuristic
  safetyMarginMeters: number; // positive = stops before conflict, negative = overshoot
  rationale: string;
  recommendedAction: string;
  uncertaintyWarning?: string;
}

export interface WhatIfComparisonResult {
  scenarioA: WhatIfScenarioMetrics;
  scenarioB: WhatIfScenarioMetrics;
  speedDeltaKmh: number;
  stoppingDistanceReductionMeters: number;
  arrivalMarginIncreaseSec: number;
  conflictResolved: boolean;
  summaryExplanation: string;
}

/**
 * Computes deterministic physical and risk metrics for a given state
 */
export function calculateWhatIfRisk(input: WhatIfSimulationInput): WhatIfScenarioMetrics {
  // Validate and sanitize inputs
  const speedKmh = Math.max(0, Math.min(120, Number(input.vehicleSpeedKmh) || 0));
  const distance = Math.max(1, Math.min(200, Number(input.vehicleDistanceMeters) || 1));
  const speedMs = speedKmh / 3.6;

  // Configure visibility coefficients
  let reactionTimeSec = 1.1; // Baseline driver reaction time
  let decelRateMs2 = 6.8; // Dry asphalt braking deceleration rate

  if (input.visibility === 'moderate') {
    reactionTimeSec = 1.4;
  } else if (input.visibility === 'poor') {
    reactionTimeSec = 1.9;
    decelRateMs2 = 5.8; // Reduced grip / cautious initial pedal application
  }

  // Early warning reaction bonus: driver alert reduces cognitive perception-reaction delay
  if (input.isEarlyWarningActive) {
    reactionTimeSec = Math.max(0.4, reactionTimeSec - 0.6);
  }

  // Emergency stop triggers maximum braking pressure
  if (input.isEmergencyStopActive) {
    decelRateMs2 = 7.8;
    reactionTimeSec = 0.3;
  }

  // Calculate arrival time
  const arrivalTimeSec = speedMs > 0.1 ? Number((distance / speedMs).toFixed(2)) : null;

  // Stopping distance breakdown
  const reactionDist = Number((speedMs * reactionTimeSec).toFixed(1));
  const brakingDist = Number(((speedMs * speedMs) / (2 * decelRateMs2)).toFixed(1));
  const totalStoppingDist = Number((reactionDist + brakingDist).toFixed(1));
  const safetyMargin = Number((distance - totalStoppingDist).toFixed(1));

  // Determine path intersection probability
  const pedInRoadway =
    input.pedestrianBehavior === 'beginning_to_cross' ||
    input.pedestrianBehavior === 'already_crossing';
  const pedMovingTowardRoad = input.pedestrianBehavior === 'approaching';

  let pathConflict = false;
  if (pedInRoadway) {
    pathConflict = true;
  } else if (pedMovingTowardRoad) {
    // If vehicle arrives while pedestrian steps into road
    pathConflict = arrivalTimeSec !== null && arrivalTimeSec <= 6.0;
  } else {
    // Waiting on footpath
    pathConflict = false;
  }

  // Determine risk category and score
  let riskCategory: WhatIfRiskCategory = 'LOW RISK';
  let score = 15;
  let rationale = '';
  let recommendedAction = '';

  if (speedKmh <= 0.5) {
    riskCategory = 'LOW RISK';
    score = 5;
    rationale = 'Vehicle is stationary. Zero kinetic closing hazard exists.';
    recommendedAction = 'Remain stopped until pedestrian safely clears crossing corridor.';
  } else if (!pathConflict) {
    riskCategory = 'LOW RISK';
    score = Math.min(28, Math.round((speedKmh / 80) * 25));
    rationale = 'Pedestrian is positioned safely on the footpath with no projected road intersection.';
    recommendedAction = 'Continue monitoring the road and remain alert.';
  } else {
    // Conflict is predicted
    if (safetyMargin < -5 || (arrivalTimeSec !== null && arrivalTimeSec < 2.2 && distance < 25)) {
      riskCategory = 'CRITICAL RISK';
      score = 92;
      rationale = `Stopping distance (${totalStoppingDist}m) exceeds available clearance (${distance}m) by ${Math.abs(
        safetyMargin
      )}m. Estimated arrival time is only ${arrivalTimeSec}s.`;
      recommendedAction = 'Immediate potential conflict detected. Apply appropriate braking.';
    } else if (safetyMargin < 4 || (arrivalTimeSec !== null && arrivalTimeSec < 4.0)) {
      riskCategory = 'HIGH RISK';
      score = 75;
      rationale = `Vehicle stopping distance (${totalStoppingDist}m) leaves narrow buffer (${safetyMargin}m) to conflict locus. Pedestrian is in or entering roadway.`;
      recommendedAction = 'Potential pedestrian conflict detected. Slow down and prepare to stop.';
    } else if (safetyMargin < 15 || arrivalTimeSec === null || arrivalTimeSec < 7.0) {
      riskCategory = 'MODERATE RISK';
      score = 48;
      rationale = `Adequate stopping distance available (${safetyMargin}m margin), but pedestrian movement requires driver deceleration and heightened awareness.`;
      recommendedAction = 'An approaching pedestrian may enter the vehicle\'s path. Reduce speed if necessary.';
    } else {
      riskCategory = 'LOW RISK';
      score = 25;
      rationale = `Sufficient spatial buffer (${safetyMargin}m stopping margin; ${arrivalTimeSec}s arrival) allows safe deceleration.`;
      recommendedAction = 'Continue monitoring the road and remain alert.';
    }
  }

  // Unmarked crossing adjustments
  if (input.crossingType === 'unmarked' && pathConflict && riskCategory !== 'LOW RISK') {
    score = Math.min(99, score + 8);
    rationale += ' Note: Unmarked crossing lacking curb cuts or overhead signage requires additional caution.';
  }

  // Visibility uncertainty warning
  let uncertaintyWarning: string | undefined;
  if (input.visibility === 'poor') {
    uncertaintyWarning =
      'Poor atmospheric visibility restricts optical detection range. Stopping calculations carry +/- 20% empirical uncertainty.';
    if (riskCategory === 'LOW RISK' && pathConflict) {
      riskCategory = 'MODERATE RISK';
      score = Math.max(score, 45);
    }
  }

  return {
    vehicleSpeedKmh: speedKmh,
    vehicleSpeedMs: Number(speedMs.toFixed(2)),
    distanceMeters: distance,
    estimatedArrivalTimeSec: arrivalTimeSec,
    reactionDistanceMeters: reactionDist,
    brakingDistanceMeters: brakingDist,
    totalStoppingDistanceMeters: totalStoppingDist,
    pathConflictPredicted: pathConflict,
    riskCategory,
    experimentalRiskScore: score,
    safetyMarginMeters: safetyMargin,
    rationale,
    recommendedAction,
    uncertaintyWarning,
  };
}

/**
 * Compares Original Conditions (Scenario A) against Early Warning & Response (Scenario B)
 */
export function compareWhatIfScenarios(
  originalInput: WhatIfSimulationInput,
  earlyWarningSpeedKmh?: number
): WhatIfComparisonResult {
  // Scenario A: Original
  const scenarioA = calculateWhatIfRisk({
    ...originalInput,
    isEarlyWarningActive: false,
    isEmergencyStopActive: false,
  });

  // Scenario B: With Early Warning Intervention
  // Default: Driver slows down by 35% or stops
  const reducedSpeedKmh =
    earlyWarningSpeedKmh !== undefined
      ? earlyWarningSpeedKmh
      : Math.max(0, Math.round(originalInput.vehicleSpeedKmh * 0.55));

  const scenarioB = calculateWhatIfRisk({
    ...originalInput,
    vehicleSpeedKmh: reducedSpeedKmh,
    isEarlyWarningActive: true,
    isEmergencyStopActive: false,
  });

  const speedDelta = Number((scenarioA.vehicleSpeedKmh - scenarioB.vehicleSpeedKmh).toFixed(1));
  const stoppingDistReduction = Number(
    (scenarioA.totalStoppingDistanceMeters - scenarioB.totalStoppingDistanceMeters).toFixed(1)
  );

  const arrivalA = scenarioA.estimatedArrivalTimeSec ?? 999;
  const arrivalB = scenarioB.estimatedArrivalTimeSec ?? 999;
  const arrivalMarginIncrease = Number(Math.max(0, arrivalB - arrivalA).toFixed(2));

  // A conflict is verified resolved ONLY if:
  // 1. Vehicle stops safely before the conflict point (safetyMarginMeters >= 2.0), OR
  // 2. Pedestrian is no longer in path or vehicle speed is 0
  const conflictResolved =
    scenarioB.safetyMarginMeters >= 2.0 ||
    scenarioB.vehicleSpeedKmh === 0 ||
    !scenarioB.pathConflictPredicted;

  let summary = '';
  if (conflictResolved && scenarioA.riskCategory === 'CRITICAL RISK') {
    summary = `Early alert enabled a ${stoppingDistReduction}m reduction in stopping distance, successfully creating a safe ${scenarioB.safetyMarginMeters}m clearance buffer before the conflict zone.`;
  } else if (conflictResolved) {
    summary = `Deceleration from ${scenarioA.vehicleSpeedKmh} to ${scenarioB.vehicleSpeedKmh} km/h expanded arrival time by +${arrivalMarginIncrease}s, converting potential conflict into a controlled crossing.`;
  } else {
    summary = `Speed reduced by ${speedDelta} km/h, but vehicle distance (${scenarioB.distanceMeters}m) remains insufficient for a complete stop. Continued emergency braking is required.`;
  }

  return {
    scenarioA,
    scenarioB,
    speedDeltaKmh: speedDelta,
    stoppingDistanceReductionMeters: stoppingDistReduction,
    arrivalMarginIncreaseSec: arrivalMarginIncrease,
    conflictResolved,
    summaryExplanation: summary,
  };
}
