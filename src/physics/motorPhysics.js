/**
 * Solid Rocket Motor Physics Engine
 * Based on OpenMotor / OpenBurn methodology
 * Handles burn regression, pressure, thrust, and stress calculations
 */

// Physical constants
export const CONSTANTS = {
  GRAVITY: 9.81, // m/s²
  UNIVERSAL_GAS_CONSTANT: 8314, // J/(kmol·K)
  ATMOSPHERIC_PRESSURE: 101325, // Pa (1 atm)
};

// Propellant database - Richard Nakka's verified data
// Burn rate formula: r = a * (P/Pref)^n where Pref = 6.895 MPa (1000 psi)
// Converted to: r (m/s) = a * P^n with P in MPa
export const PROPELLANTS = {
  KNSB: {
    name: 'KNSB (KNO3/Sorbitol 65/35)',
    density: 1841, // kg/m³ (measured)
    // Nakka data: a = 8.26 mm/s, n = 0.319 at Pref = 6.895 MPa
    // r(mm/s) = 8.26 * (P_MPa / 6.895)^0.319
    burnRateCoeff: 8.26, // mm/s at reference
    burnRateExponent: 0.319,
    referencePressure: 6.895, // MPa
    characteristicVelocity: 885, // c* in m/s
    gamma: 1.133,
    combustionTemp: 1600, // K
    molecularMass: 39.9, // kg/kmol
  },
  KNSU: {
    name: 'KNSU (KNO3/Sucrose 65/35)',
    density: 1889, // kg/m³
    // Nakka: a = 8.26, n = 0.319
    burnRateCoeff: 8.26,
    burnRateExponent: 0.319,
    referencePressure: 6.895,
    characteristicVelocity: 914,
    gamma: 1.133,
    combustionTemp: 1720,
    molecularMass: 42.0,
  },
  KNDX: {
    name: 'KNDX (KNO3/Dextrose 65/35)',
    density: 1879, // kg/m³
    // Nakka: a = 8.87, n = 0.326
    burnRateCoeff: 8.87,
    burnRateExponent: 0.326,
    referencePressure: 6.895,
    characteristicVelocity: 889,
    gamma: 1.131,
    combustionTemp: 1710,
    molecularMass: 42.4,
  },
  APCP: {
    name: 'APCP (70% AP Composite)',
    density: 1772, // kg/m³
    // Typical amateur APCP: a ~3.5, n ~0.4
    burnRateCoeff: 3.517,
    burnRateExponent: 0.395,
    referencePressure: 6.895,
    characteristicVelocity: 1550,
    gamma: 1.25,
    combustionTemp: 3000,
    molecularMass: 26.0,
  },
};

// Casing materials
export const MATERIALS = {
  ALUMINUM: {
    name: 'Aluminum 6061-T6',
    density: 2700, // kg/m³
    yieldStrength: 276e6, // Pa
    ultimateStrength: 310e6, // Pa
    thermalConductivity: 167, // W/(m·K)
    color: '#A8A8A8',
  },
  STEEL: {
    name: 'Steel 4130',
    density: 7850,
    yieldStrength: 435e6,
    ultimateStrength: 560e6,
    thermalConductivity: 42,
    color: '#606060',
  },
  PVC: {
    name: 'PVC Schedule 40',
    density: 1400,
    yieldStrength: 52e6,
    ultimateStrength: 52e6,
    thermalConductivity: 0.19,
    color: '#E8E8E8',
  },
  COMPOSITE: {
    name: 'Carbon Fiber Composite',
    density: 1600,
    yieldStrength: 600e6,
    ultimateStrength: 800e6,
    thermalConductivity: 5,
    color: '#2D2D2D',
  },
};

// Grain geometry types
export const GRAIN_TYPES = {
  BATES: 'bates',
  STAR: 'star',
  CYLINDRICAL: 'cylindrical',
  FINOCYL: 'finocyl',
};

/**
 * Calculate burning surface area for BATES grain geometry
 * OpenMotor formula: Ab = N * [2*π*r*L + 2*π*(R²-r²)] for uninhibited ends
 */
export function calculateBurningArea(grainConfig, currentInnerRadius) {
  const { type, outerRadius, length, segments } = grainConfig;
  
  // Clamp inner radius
  const r = Math.min(Math.max(currentInnerRadius, 0.001), outerRadius * 0.99);
  const N = segments || 1;
  const L = length || 0.1;
  const R = outerRadius || 0.038;
  
  switch (type) {
    case GRAIN_TYPES.BATES: {
      // BATES grain: burns on inner core surface and both end faces
      // Core surface area: 2 * π * r * L (per segment)
      const coreArea = N * 2 * Math.PI * r * L;
      
      // End face area (both ends of each segment): 2 * π * (R² - r²)
      // Factor for inhibited ends (partial burning)
      const endInhibition = 0.3; // 30% of ends burn initially
      const endArea = N * 2 * Math.PI * (R * R - r * r) * endInhibition;
      
      return coreArea + endArea;
    }
    
    case GRAIN_TYPES.CYLINDRICAL: {
      // Simple cylindrical core (ends inhibited)
      return N * 2 * Math.PI * r * L;
    }
    
    case GRAIN_TYPES.STAR: {
      // Star grain approximation - increased perimeter
      const starMultiplier = 2.5;
      return N * 2 * Math.PI * r * L * starMultiplier;
    }
    
    default:
      return N * 2 * Math.PI * r * L;
  }
}

/**
 * Calculate burn rate using Saint-Venant's law
 * r = a * (P/Pref)^n
 * Returns burn rate in m/s
 */
export function calculateBurnRate(pressure, propellant) {
  const { burnRateCoeff, burnRateExponent, referencePressure } = propellant;
  
  // Convert pressure to MPa
  const P_MPa = Math.max(pressure / 1e6, 0.1);
  const Pref = referencePressure || 6.895;
  
  // r(mm/s) = a * (P/Pref)^n
  const rate_mm_s = burnRateCoeff * Math.pow(P_MPa / Pref, burnRateExponent);
  
  // Convert to m/s
  const rate_m_s = rate_mm_s / 1000;
  
  // Safety bounds (0.5 to 30 mm/s typical for KN propellants)
  if (!isFinite(rate_m_s) || isNaN(rate_m_s)) return 0;
  return Math.max(0, Math.min(rate_m_s, 0.030));
}

/**
 * Calculate throat area
 */
export function calculateThroatArea(throatDiameter) {
  const r = throatDiameter / 2;
  return Math.PI * r * r;
}

/**
 * Calculate chamber pressure using steady-state mass balance
 * From: ρ * r * Ab = Pc * At / c*
 * With: r = a * (P/Pref)^n
 * Solving: Pc = (ρ * a * c* * Kn / Pref^n)^(1/(1-n))
 * where Kn = Ab/At, a in m/s, Pref in Pa
 */
export function calculateChamberPressure(
  burningArea,
  throatArea,
  propellant
) {
  const { density, burnRateCoeff, burnRateExponent, referencePressure, characteristicVelocity } = propellant;
  
  // Safety checks
  if (!burningArea || burningArea <= 0) return CONSTANTS.ATMOSPHERIC_PRESSURE;
  if (!throatArea || throatArea <= 0) return CONSTANTS.ATMOSPHERIC_PRESSURE;
  
  const rho = density; // kg/m³
  const a_mm_s = burnRateCoeff; // mm/s at Pref
  const a_m_s = a_mm_s / 1000; // convert to m/s
  const n = burnRateExponent;
  const Pref = (referencePressure || 6.895) * 1e6; // Convert MPa to Pa
  const cStar = characteristicVelocity; // m/s
  const Kn = burningArea / throatArea;
  
  // Pc = (ρ * a * c* * Kn / Pref^n)^(1/(1-n))
  // But we need to be careful with units - using iterative solution instead
  
  // Iterative solution for stability
  let Pc = 2e6; // Initial guess 2 MPa
  for (let i = 0; i < 20; i++) {
    // Calculate burn rate at current pressure
    const r = a_m_s * Math.pow(Pc / Pref, n);
    // Mass flow rate generated
    const mdot_gen = rho * r * burningArea;
    // Mass flow rate out through nozzle
    const mdot_out = Pc * throatArea / cStar;
    // New pressure estimate
    const Pc_new = mdot_gen * cStar / throatArea;
    
    if (Math.abs(Pc_new - Pc) < 1000) break; // Converged within 1 kPa
    Pc = 0.7 * Pc + 0.3 * Pc_new; // Relaxation
  }
  
  if (!isFinite(Pc) || isNaN(Pc)) return CONSTANTS.ATMOSPHERIC_PRESSURE;
  
  // Clamp to realistic range (0.5-15 MPa typical for amateur motors)
  return Math.max(CONSTANTS.ATMOSPHERIC_PRESSURE, Math.min(Pc, 15e6));
}

/**
 * Calculate thrust coefficient (Cf)
 * From isentropic nozzle theory
 */
export function calculateThrustCoefficient(gamma, exitArea, throatArea, chamberPressure) {
  const Pe = CONSTANTS.ATMOSPHERIC_PRESSURE;
  const Pc = chamberPressure;
  
  if (Pc <= Pe) return 0;
  
  // Expansion ratio
  const epsilon = exitArea / throatArea;
  
  // Calculate exit pressure (approximate)
  const pressureRatio = Pe / Pc;
  
  // Thrust coefficient approximation for typical solid motor
  // Cf = sqrt( (2*γ²/(γ-1)) * (2/(γ+1))^((γ+1)/(γ-1)) * (1 - (Pe/Pc)^((γ-1)/γ)) )
  //      + ε * (Pe - Pa) / Pc  (pressure thrust term)
  
  const term1 = (2 * gamma * gamma) / (gamma - 1);
  const term2 = Math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1));
  const term3 = 1 - Math.pow(pressureRatio, (gamma - 1) / gamma);
  
  let Cf = Math.sqrt(term1 * term2 * Math.max(term3, 0));
  
  // Add pressure thrust term (typically small at sea level)
  // Neglected for simplicity
  
  // Typical Cf values: 1.2 - 1.8
  if (!isFinite(Cf) || isNaN(Cf)) Cf = 1.5;
  Cf = Math.max(1.0, Math.min(Cf, 2.2));
  
  return Cf;
}

/**
 * Calculate thrust
 * F = Cf * Pc * At
 */
export function calculateThrust(chamberPressure, throatArea, exitArea, propellant) {
  const { gamma } = propellant;
  
  if (chamberPressure <= CONSTANTS.ATMOSPHERIC_PRESSURE) return 0;
  if (throatArea <= 0) return 0;
  
  const Cf = calculateThrustCoefficient(gamma, exitArea, throatArea, chamberPressure);
  const thrust = Cf * chamberPressure * throatArea;
  
  if (!isFinite(thrust) || isNaN(thrust)) return 0;
  return Math.max(0, thrust);
}

/**
 * Calculate hoop stress in cylindrical pressure vessel
 * σ = P * r / t (thin-wall approximation)
 */
export function calculateHoopStress(pressure, innerRadius, wallThickness) {
  if (wallThickness <= 0) return Infinity;
  const stress = (pressure * innerRadius) / wallThickness;
  if (!isFinite(stress) || isNaN(stress)) return 0;
  return Math.max(0, stress);
}

/**
 * Calculate safety factor
 */
export function calculateSafetyFactor(stress, material) {
  if (stress <= 0) return 99;
  const sf = material.yieldStrength / stress;
  if (!isFinite(sf) || isNaN(sf)) return 99;
  return Math.max(0, Math.min(sf, 99));
}

/**
 * Check for structural failure (CATO)
 */
export function checkForFailure(stress, material) {
  return {
    yielding: stress > material.yieldStrength,
    catastrophic: stress > material.ultimateStrength,
  };
}

/**
 * Calculate specific impulse
 * Isp = c* * Cf / g0
 */
export function calculateIsp(cStar, thrustCoeff) {
  return (cStar * thrustCoeff) / CONSTANTS.GRAVITY;
}

/**
 * Main motor simulation state
 */
export class MotorSimulation {
  constructor(config) {
    this.config = {
      propellant: PROPELLANTS.KNSB,
      material: MATERIALS.ALUMINUM,
      grainConfig: {
        type: GRAIN_TYPES.BATES,
        outerRadius: 0.0285, // m (57mm OD, fits 60mm ID casing)
        coreRadius: 0.0095, // m (19mm core diameter)
        length: 0.065, // m (65mm per segment)
        segments: 4, // 4 BATES segments
        starPoints: 5,
        starInnerRadius: 0.006,
      },
      nozzle: {
        throatDiameter: 0.009, // m (9mm throat)
        exitDiameter: 0.018, // m (18mm exit, expansion ratio ~4)
        efficiency: 0.90, // nozzle efficiency
      },
      casing: {
        innerRadius: 0.030, // m (60mm ID casing)
        wallThickness: 0.003, // m (3mm wall)
      },
      ...config,
    };
    
    this.reset();
  }
  
  reset() {
    this.time = 0;
    this.currentInnerRadius = this.config.grainConfig.coreRadius;
    this.chamberPressure = CONSTANTS.ATMOSPHERIC_PRESSURE;
    this.thrust = 0;
    this.burnRate = 0;
    this.burnRateMmS = 0; // mm/s for display
    this.burningArea = 0;
    this.Kn = 0; // Area ratio
    this.stress = 0;
    this.safetyFactor = 99;
    this.isBurning = false;
    this.isBurnedOut = false;
    this.hasExploded = false;
    this.explosionTime = null;
    
    // Data history for graphs
    this.history = {
      time: [],
      pressure: [],
      thrust: [],
      burnRate: [],
      innerRadius: [],
      Kn: [],
      stress: [],
    };
    
    // Total impulse tracking
    this.totalImpulse = 0;
    this.burnTime = 0;
    this.maxThrust = 0;
    this.maxPressure = 0;
  }
  
  ignite() {
    if (!this.isBurnedOut && !this.hasExploded) {
      this.isBurning = true;
    }
  }
  
  update(deltaTime) {
    if (!this.isBurning || this.isBurnedOut || this.hasExploded) {
      return this.getState();
    }
    
    this.time += deltaTime;
    
    // Calculate throat and exit areas
    const throatArea = calculateThroatArea(this.config.nozzle.throatDiameter);
    const exitArea = Math.PI * Math.pow(this.config.nozzle.exitDiameter / 2, 2);
    
    // Calculate current burning area
    this.burningArea = calculateBurningArea(
      this.config.grainConfig,
      this.currentInnerRadius
    );
    
    // Calculate Kn (area ratio) - useful metric
    this.Kn = this.burningArea / throatArea;
    
    // Calculate chamber pressure
    this.chamberPressure = calculateChamberPressure(
      this.burningArea,
      throatArea,
      this.config.propellant
    );
    
    // Track max pressure
    this.maxPressure = Math.max(this.maxPressure, this.chamberPressure);
    
    // Calculate burn rate
    this.burnRate = calculateBurnRate(this.chamberPressure, this.config.propellant);
    this.burnRateMmS = this.burnRate * 1000; // Convert to mm/s
    
    // Update grain geometry (regression)
    const regression = this.burnRate * deltaTime; // m
    this.currentInnerRadius += regression;
    
    // Check if burned out (web burned through)
    const webThickness = this.config.grainConfig.outerRadius - this.config.grainConfig.coreRadius;
    const webRemaining = this.config.grainConfig.outerRadius - this.currentInnerRadius;
    
    if (webRemaining <= 0.001 || this.currentInnerRadius >= this.config.grainConfig.outerRadius * 0.98) {
      this.isBurnedOut = true;
      this.isBurning = false;
      this.burnTime = this.time;
      this.thrust = 0;
      this.chamberPressure = CONSTANTS.ATMOSPHERIC_PRESSURE;
      this.burnRate = 0;
      this.burnRateMmS = 0;
      return this.getState();
    }
    
    // Calculate thrust
    this.thrust = calculateThrust(
      this.chamberPressure,
      throatArea,
      exitArea,
      this.config.propellant
    ) * this.config.nozzle.efficiency;
    
    // Track max thrust
    this.maxThrust = Math.max(this.maxThrust, this.thrust);
    
    // Calculate stress
    this.stress = calculateHoopStress(
      this.chamberPressure,
      this.config.casing.innerRadius,
      this.config.casing.wallThickness
    );
    
    this.safetyFactor = calculateSafetyFactor(this.stress, this.config.material);
    
    // Check for failure
    const failure = checkForFailure(this.stress, this.config.material);
    if (failure.catastrophic) {
      this.hasExploded = true;
      this.explosionTime = this.time;
    }
    
    // Update total impulse (integral of thrust over time)
    this.totalImpulse += this.thrust * deltaTime;
    
    // Record history (throttle to avoid memory issues)
    if (this.history.time.length === 0 || 
        this.time - this.history.time[this.history.time.length - 1] >= 0.01) {
      this.history.time.push(this.time);
      this.history.pressure.push(this.chamberPressure / 1e6); // MPa
      this.history.thrust.push(this.thrust);
      this.history.burnRate.push(this.burnRateMmS);
      this.history.innerRadius.push(this.currentInnerRadius * 1000); // mm
      this.history.Kn.push(this.Kn);
      this.history.stress.push(this.stress / 1e6); // MPa
    }
    
    return this.getState();
  }
  
  getState() {
    const webThickness = this.config.grainConfig.outerRadius - this.config.grainConfig.coreRadius;
    const webBurned = this.currentInnerRadius - this.config.grainConfig.coreRadius;
    const grainBurnProgress = Math.max(0, Math.min(webBurned / webThickness, 1));
    
    return {
      time: this.time,
      chamberPressure: this.chamberPressure,
      thrust: this.thrust,
      burnRate: this.burnRateMmS,
      burningArea: this.burningArea,
      Kn: this.Kn,
      currentInnerRadius: this.currentInnerRadius,
      stress: this.stress,
      safetyFactor: this.safetyFactor,
      grainBurnProgress: isNaN(grainBurnProgress) ? 0 : grainBurnProgress,
      isBurning: this.isBurning,
      isBurnedOut: this.isBurnedOut,
      hasExploded: this.hasExploded,
      explosionTime: this.explosionTime,
      totalImpulse: this.totalImpulse,
      burnTime: this.burnTime,
      maxThrust: this.maxThrust,
      maxPressure: this.maxPressure,
      history: this.history,
      config: this.config,
    };
  }
  
  updateConfig(newConfig) {
    // Deep merge config
    if (newConfig.propellant) this.config.propellant = newConfig.propellant;
    if (newConfig.material) this.config.material = newConfig.material;
    if (newConfig.grainConfig) {
      this.config.grainConfig = { ...this.config.grainConfig, ...newConfig.grainConfig };
    }
    if (newConfig.nozzle) {
      this.config.nozzle = { ...this.config.nozzle, ...newConfig.nozzle };
    }
    if (newConfig.casing) {
      this.config.casing = { ...this.config.casing, ...newConfig.casing };
    }
  }
}

export default MotorSimulation;
