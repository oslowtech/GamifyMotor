/**
 * Rocket Physics Test Script
 * Verifies the flight simulation calculations are correct
 */
import { 
  RocketFlightSimulation,
  DEFAULT_ROCKET_CONFIG,
  calculateStabilityMargin,
  calculateTotalLength,
  getAirDensity,
  getSpeedOfSound,
} from './rocketPhysics.js';

// Console colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const pass = (msg) => console.log(`${colors.green}✓ PASS${colors.reset}: ${msg}`);
const fail = (msg) => console.log(`${colors.red}✗ FAIL${colors.reset}: ${msg}`);
const info = (msg) => console.log(`${colors.blue}ℹ INFO${colors.reset}: ${msg}`);
const header = (msg) => console.log(`\n${colors.yellow}=== ${msg} ===${colors.reset}\n`);

// Test helper
function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    pass(`${message}: ${actual.toFixed(4)} ≈ ${expected.toFixed(4)}`);
    return true;
  } else {
    fail(`${message}: ${actual.toFixed(4)} ≠ ${expected.toFixed(4)} (diff: ${diff.toFixed(4)})`);
    return false;
  }
}

function assertTrue(condition, message) {
  if (condition) {
    pass(message);
    return true;
  } else {
    fail(message);
    return false;
  }
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  header('Air Density Tests');
  
  // Test air density at sea level
  const rhoSea = getAirDensity(0);
  if (assertClose(rhoSea, 1.225, 0.01, 'Air density at sea level')) passed++; else failed++;
  
  // Test air density at 1000m
  const rho1000 = getAirDensity(1000);
  if (assertClose(rho1000, 1.112, 0.02, 'Air density at 1000m')) passed++; else failed++;
  
  // Test air density at 5000m
  const rho5000 = getAirDensity(5000);
  if (assertClose(rho5000, 0.736, 0.02, 'Air density at 5000m')) passed++; else failed++;
  
  header('Speed of Sound Tests');
  
  // Speed of sound at sea level
  const sosSea = getSpeedOfSound(0);
  if (assertClose(sosSea, 340.3, 1, 'Speed of sound at sea level')) passed++; else failed++;
  
  // Speed of sound at 10000m
  const sos10k = getSpeedOfSound(10000);
  if (assertClose(sos10k, 299.5, 2, 'Speed of sound at 10000m')) passed++; else failed++;
  
  header('Rocket Configuration Tests');
  
  // Test total length calculation
  const totalLength = calculateTotalLength(DEFAULT_ROCKET_CONFIG);
  if (assertTrue(totalLength > 0.5 && totalLength < 2, `Total length reasonable: ${(totalLength * 1000).toFixed(0)}mm`)) passed++; else failed++;
  
  header('Stability Tests');
  
  // Test stability calculation
  const stability = calculateStabilityMargin(DEFAULT_ROCKET_CONFIG, 0.15, 0.1);
  
  info(`CG: ${(stability.cg * 1000).toFixed(1)}mm from nose`);
  info(`CP: ${(stability.cp * 1000).toFixed(1)}mm from nose`);
  info(`Stability Margin: ${stability.stabilityMargin.toFixed(2)} calibers`);
  info(`Total Mass: ${(stability.totalMass * 1000).toFixed(0)}g`);
  
  if (assertTrue(stability.cg > 0, 'CG is positive')) passed++; else failed++;
  if (assertTrue(stability.cp > stability.cg, 'CP is aft of CG (stable)')) passed++; else failed++;
  if (assertTrue(stability.stabilityMargin > 0.5, 'Stability margin > 0.5 cal')) passed++; else failed++;
  if (assertTrue(stability.totalMass > 0.2, 'Total mass > 200g')) passed++; else failed++;
  
  header('Flight Simulation Tests');
  
  // Create mock motor data (similar to G motor)
  const mockMotorData = {
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.05, thrust: 150 },
      { time: 0.1, thrust: 120 },
      { time: 0.5, thrust: 100 },
      { time: 1.0, thrust: 90 },
      { time: 1.5, thrust: 80 },
      { time: 1.8, thrust: 50 },
      { time: 2.0, thrust: 0 },
    ],
    totalImpulse: 160, // G motor
    propellantMass: 0.1, // 100g propellant
    motorMass: 0.15, // 150g casing
    burnTime: 2.0,
  };
  
  // Create simulation
  const sim = new RocketFlightSimulation(DEFAULT_ROCKET_CONFIG, mockMotorData);
  
  info('Initial state:');
  const initialState = sim.getState();
  if (assertTrue(initialState.altitude === 0, 'Initial altitude is 0')) passed++; else failed++;
  if (assertTrue(initialState.speed === 0, 'Initial speed is 0')) passed++; else failed++;
  if (assertTrue(initialState.phase === 'pad', 'Initial phase is pad')) passed++; else failed++;
  
  // Run simulation to completion
  info('Running simulation...');
  const finalState = sim.runToCompletion();
  
  info(`\nFlight Results:`);
  info(`Apogee: ${finalState.apogeeAltitude.toFixed(1)}m (${(finalState.apogeeAltitude * 3.281).toFixed(0)}ft)`);
  info(`Max Velocity: ${finalState.maxVelocity.toFixed(1)}m/s (${(finalState.maxVelocity * 2.237).toFixed(1)}mph)`);
  info(`Max Mach: ${finalState.maxMach.toFixed(3)}`);
  info(`Max Acceleration: ${(finalState.maxAcceleration / 9.81).toFixed(1)}G`);
  info(`Rail Exit Velocity: ${finalState.railExitVelocity.toFixed(1)}m/s`);
  info(`Time to Apogee: ${finalState.apogeeTime.toFixed(2)}s`);
  info(`Total Flight Time: ${finalState.time.toFixed(2)}s`);
  
  // Verify flight results are reasonable for a G motor
  if (assertTrue(finalState.apogeeAltitude > 100, 'Apogee > 100m for G motor')) passed++; else failed++;
  if (assertTrue(finalState.apogeeAltitude < 2000, 'Apogee < 2000m (realistic)')) passed++; else failed++;
  if (assertTrue(finalState.maxVelocity > 50, 'Max velocity > 50m/s')) passed++; else failed++;
  if (assertTrue(finalState.maxVelocity < 300, 'Max velocity < 300m/s (subsonic)')) passed++; else failed++;
  if (assertTrue(finalState.maxMach < 1, 'Remained subsonic (Mach < 1)')) passed++; else failed++;
  if (assertTrue(finalState.maxAcceleration > 20, 'Max accel > 2G')) passed++; else failed++;
  if (assertTrue(finalState.railExitVelocity > 10, 'Rail exit > 10m/s (safe)')) passed++; else failed++;
  if (assertTrue(finalState.landed, 'Rocket landed')) passed++; else failed++;
  if (assertTrue(finalState.apogeeReached, 'Apogee was reached')) passed++; else failed++;
  if (assertTrue(finalState.mainDeployed, 'Main chute deployed')) passed++; else failed++;
  if (assertTrue(finalState.time < 300, 'Total flight < 5 min')) passed++; else failed++;
  
  // Verify history data
  if (assertTrue(finalState.history.time.length > 10, 'History has data points')) passed++; else failed++;
  if (assertTrue(finalState.history.altitude.length === finalState.history.time.length, 'History arrays match')) passed++; else failed++;
  
  header('Test Summary');
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  
  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
