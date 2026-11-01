/**
 * SafeStep — What-If Safety Simulator Verification Test Suite
 *
 * Verifies all kinematic formulas, edge cases, pedestrian behaviors,
 * crossing conditions, and two-scenario comparison outputs.
 */

import {
  calculateWhatIfRisk,
  compareWhatIfScenarios,
} from './safeStepWhatIfRiskEngine.js';

interface TestCase {
  name: string;
  run: () => boolean | void;
}

const tests: TestCase[] = [
  // 1. Stationary Vehicle (0 km/h)
  {
    name: 'Stationary vehicle (0 km/h) yields LOW RISK with zero closing hazard',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 0,
        vehicleDistanceMeters: 20,
        pedestrianBehavior: 'already_crossing',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (res.riskCategory !== 'LOW RISK') throw new Error(`Expected LOW RISK, got ${res.riskCategory}`);
      if (res.vehicleSpeedMs !== 0) throw new Error('Expected 0 m/s');
      if (res.estimatedArrivalTimeSec !== null) throw new Error('Arrival time should be null for stationary car');
    },
  },

  // 2. Low-Speed Vehicle (20 km/h) with adequate distance
  {
    name: 'Low-speed vehicle (20 km/h at 40m) allows safe stopping margin',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 20,
        vehicleDistanceMeters: 40,
        pedestrianBehavior: 'beginning_to_cross',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (res.totalStoppingDistanceMeters > 15) throw new Error(`Stopping dist too high: ${res.totalStoppingDistanceMeters}`);
      if (res.safetyMarginMeters <= 0) throw new Error('Expected positive safety margin');
      if (res.riskCategory === 'CRITICAL RISK') throw new Error('Should not be critical at 20km/h and 40m');
    },
  },

  // 3. High-Speed Vehicle (80 km/h) at short distance (25m)
  {
    name: 'High-speed vehicle (80 km/h at 25m) triggers CRITICAL RISK',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 80,
        vehicleDistanceMeters: 25,
        pedestrianBehavior: 'already_crossing',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (res.riskCategory !== 'CRITICAL RISK') throw new Error(`Expected CRITICAL RISK, got ${res.riskCategory}`);
      if (res.safetyMarginMeters >= 0) throw new Error('Stopping margin must be negative (overshoot)');
      if (res.totalStoppingDistanceMeters <= 25) throw new Error('80 km/h stopping dist must exceed 25m');
    },
  },

  // 4. Pedestrian Waiting on Footpath
  {
    name: 'Pedestrian waiting on footpath produces no path conflict',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 50,
        vehicleDistanceMeters: 30,
        pedestrianBehavior: 'waiting',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (res.pathConflictPredicted !== false) throw new Error('Expected no path conflict when pedestrian is waiting');
      if (res.riskCategory !== 'LOW RISK') throw new Error(`Expected LOW RISK, got ${res.riskCategory}`);
    },
  },

  // 5. Pedestrian Approaching Road
  {
    name: 'Pedestrian approaching road flags potential convergence',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 40,
        vehicleDistanceMeters: 35,
        pedestrianBehavior: 'approaching',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (!res.pathConflictPredicted) throw new Error('Expected predicted path conflict for approaching pedestrian within arrival window');
    },
  },

  // 6. Pedestrian Crossing (Already Crossing)
  {
    name: 'Pedestrian already crossing in-lane activates direct conflict vector',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 45,
        vehicleDistanceMeters: 30,
        pedestrianBehavior: 'already_crossing',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (!res.pathConflictPredicted) throw new Error('Expected active path conflict');
      if (res.riskCategory === 'LOW RISK') throw new Error('In-lane crossing at 45km/h cannot be LOW RISK');
    },
  },

  // 7. Unmarked Crossing vs Zebra Crossing
  {
    name: 'Unmarked crossing elevates caution baseline',
    run: () => {
      const zebraRes = calculateWhatIfRisk({
        vehicleSpeedKmh: 40,
        vehicleDistanceMeters: 40,
        pedestrianBehavior: 'beginning_to_cross',
        crossingType: 'zebra',
        visibility: 'good',
      });
      const unmarkedRes = calculateWhatIfRisk({
        vehicleSpeedKmh: 40,
        vehicleDistanceMeters: 40,
        pedestrianBehavior: 'beginning_to_cross',
        crossingType: 'unmarked',
        visibility: 'good',
      });
      if (unmarkedRes.experimentalRiskScore <= zebraRes.experimentalRiskScore) {
        throw new Error('Unmarked crossing should carry higher caution score');
      }
    },
  },

  // 8. Vehicle Slowing Down & Early Warning Response
  {
    name: 'Two-scenario comparison demonstrates braking reduction and safety margin expansion',
    run: () => {
      const comp = compareWhatIfScenarios({
        vehicleSpeedKmh: 50,
        vehicleDistanceMeters: 40,
        pedestrianBehavior: 'beginning_to_cross',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (comp.speedDeltaKmh <= 0) throw new Error('Expected positive speed delta');
      if (comp.stoppingDistanceReductionMeters <= 0) throw new Error('Expected stopping distance reduction');
      if (comp.scenarioB.safetyMarginMeters <= comp.scenarioA.safetyMarginMeters) {
        throw new Error('Scenario B should expand safety margin');
      }
    },
  },

  // 9. Emergency Stopping
  {
    name: 'Emergency stop trigger applies maximum deceleration',
    run: () => {
      const normalRes = calculateWhatIfRisk({
        vehicleSpeedKmh: 50,
        vehicleDistanceMeters: 35,
        pedestrianBehavior: 'already_crossing',
        crossingType: 'zebra',
        visibility: 'good',
        isEmergencyStopActive: false,
      });
      const emergencyRes = calculateWhatIfRisk({
        vehicleSpeedKmh: 50,
        vehicleDistanceMeters: 35,
        pedestrianBehavior: 'already_crossing',
        crossingType: 'zebra',
        visibility: 'good',
        isEmergencyStopActive: true,
      });
      if (emergencyRes.totalStoppingDistanceMeters >= normalRes.totalStoppingDistanceMeters) {
        throw new Error('Emergency stop must yield shorter stopping distance');
      }
    },
  },

  // 10. Missing / Invalid Inputs Sanitization
  {
    name: 'Gracefully sanitizes negative, NaN, and extreme inputs',
    run: () => {
      const nanRes = calculateWhatIfRisk({
        vehicleSpeedKmh: NaN as any,
        vehicleDistanceMeters: -10 as any,
        pedestrianBehavior: 'waiting',
        crossingType: 'zebra',
        visibility: 'good',
      });
      if (nanRes.vehicleSpeedKmh !== 0) throw new Error('NaN speed must fall back to 0');
      if (nanRes.distanceMeters < 1) throw new Error('Negative distance must be clamped');
    },
  },

  // 11. Poor Visibility Uncertainty Warning
  {
    name: 'Poor visibility triggers empirical uncertainty warning',
    run: () => {
      const res = calculateWhatIfRisk({
        vehicleSpeedKmh: 40,
        vehicleDistanceMeters: 50,
        pedestrianBehavior: 'approaching',
        crossingType: 'zebra',
        visibility: 'poor',
      });
      if (!res.uncertaintyWarning) throw new Error('Expected uncertainty warning under poor visibility');
    },
  },
];

export function runWhatIfTestSuite(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const t of tests) {
    try {
      t.run();
      passed++;
      console.log(`[PASS] ${t.name}`);
    } catch (err: any) {
      failed++;
      const msg = `[FAIL] ${t.name}: ${err?.message || err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { passed, failed, errors };
}

// Auto-run if executed directly via node / tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('safeStepWhatIfSimulation.test')) {
  console.log('--- Running SafeStep What-If Safety Simulator Test Suite ---');
  const result = runWhatIfTestSuite();
  console.log(`\nResults: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}
