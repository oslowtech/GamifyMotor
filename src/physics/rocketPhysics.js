/**
 * Rocket Flight Physics Engine
 * Comprehensive aerodynamics, stability, and recovery simulation
 */

// Physical constants
export const ROCKET_CONSTANTS = {
  GRAVITY: 9.81, // m/s²
  AIR_DENSITY_SEA: 1.225, // kg/m³
  AIR_PRESSURE_SEA: 101325, // Pa
  TEMP_SEA_LEVEL: 288.15, // K (15°C)
  LAPSE_RATE: 0.0065, // K/m
  GAS_CONSTANT: 287.05, // J/(kg·K)
  MOLAR_MASS_AIR: 0.0289644, // kg/mol
};

// Body tube materials
export const BODY_MATERIALS = {
  CARDBOARD: {
    name: 'Cardboard',
    density: 680, // kg/m³
    color: '#8B7355',
  },
  PHENOLIC: {
    name: 'Phenolic',
    density: 1400,
    color: '#4A3C2A',
  },
  FIBERGLASS: {
    name: 'Fiberglass',
    density: 1850,
    color: '#E8E8D0',
  },
  CARBON_FIBER: {
    name: 'Carbon Fiber',
    density: 1600,
    color: '#2A2A2A',
  },
  BLUE_TUBE: {
    name: 'Blue Tube',
    density: 1100,
    color: '#3366AA',
  },
};

// Nose cone shapes and their drag coefficients
export const NOSE_SHAPES = {
  CONICAL: {
    name: 'Conical',
    cdMultiplier: 1.0,
    cpFactor: 0.666, // CP from tip as fraction of length
  },
  OGIVE: {
    name: 'Ogive',
    cdMultiplier: 0.85,
    cpFactor: 0.466,
  },
  PARABOLIC: {
    name: 'Parabolic',
    cdMultiplier: 0.80,
    cpFactor: 0.50,
  },
  ELLIPTICAL: {
    name: 'Elliptical',
    cdMultiplier: 0.75,
    cpFactor: 0.333,
  },
  HAACK: {
    name: 'Von Kármán (Haack)',
    cdMultiplier: 0.70,
    cpFactor: 0.45,
  },
};

// Fin shapes
export const FIN_SHAPES = {
  TRAPEZOIDAL: 'trapezoidal',
  CLIPPED_DELTA: 'clipped_delta',
  ELLIPTICAL: 'elliptical',
  RECTANGULAR: 'rectangular',
};

// Recovery device types
export const RECOVERY_TYPES = {
  STREAMER: {
    name: 'Streamer',
    cdMultiplier: 0.4,
  },
  PARACHUTE: {
    name: 'Parachute',
    cd: 1.5,
  },
  DROGUE: {
    name: 'Drogue Chute',
    cd: 1.2,
  },
};

// Default rocket configuration
export const DEFAULT_ROCKET_CONFIG = {
  // Nose cone
  noseCone: {
    shape: 'OGIVE',
    length: 0.15, // m
    diameter: 0.054, // m (54mm)
    material: 'FIBERGLASS',
    mass: 0.05, // kg
    shoulderLength: 0.03, // m
  },
  
  // Body tube sections
  bodyTubes: [
    {
      id: 'upper',
      name: 'Upper Body',
      length: 0.20, // m
      outerDiameter: 0.054, // m
      wallThickness: 0.002, // m
      material: 'BLUE_TUBE',
      position: 0.15, // from nose tip
    },
    {
      id: 'avionics',
      name: 'Avionics Bay',
      length: 0.10, // m
      outerDiameter: 0.054,
      wallThickness: 0.002,
      material: 'BLUE_TUBE',
      position: 0.35,
    },
    {
      id: 'lower',
      name: 'Lower Body',
      length: 0.30, // m
      outerDiameter: 0.054,
      wallThickness: 0.002,
      material: 'BLUE_TUBE',
      position: 0.45,
    },
  ],
  
  // Fins
  fins: {
    count: 4,
    shape: FIN_SHAPES.TRAPEZOIDAL,
    rootChord: 0.08, // m
    tipChord: 0.04, // m
    span: 0.06, // m
    sweepAngle: 30, // degrees
    thickness: 0.003, // m
    material: 'FIBERGLASS',
    position: 0.68, // from nose tip (at lower body)
    canards: false,
  },
  
  // Canards (optional)
  canards: {
    enabled: false,
    count: 4,
    rootChord: 0.03,
    tipChord: 0.015,
    span: 0.025,
    position: 0.12, // near nose
  },
  
  // Motor mount
  motorMount: {
    diameter: 0.038, // 38mm motor
    length: 0.20,
    position: 0.55, // from nose tip
  },
  
  // Payload section
  payload: {
    mass: 0.10, // kg
    position: 0.05, // from nose tip (inside nose)
    description: 'Altimeter/Tracker',
  },
  
  // Avionics
  avionics: {
    enabled: true,
    mass: 0.08, // kg
    position: 0.38, // in avionics bay
    altimeter: true,
    gps: false,
    camera: false,
    accelerometer: true,
  },
  
  // Camera (optional)
  camera: {
    enabled: false,
    mass: 0.03,
    position: 0.30,
    type: 'side-mount',
  },
  
  // Recovery system
  recovery: {
    type: 'dual', // 'single' or 'dual'
    
    // Drogue (for dual deployment)
    drogue: {
      enabled: true,
      diameter: 0.30, // m (12 inch)
      cd: 1.2,
      deployAltitude: null, // null = at apogee
      position: 0.35,
    },
    
    // Main parachute
    main: {
      enabled: true,
      diameter: 0.90, // m (36 inch)
      cd: 1.5,
      deployAltitude: 150, // m AGL
      position: 0.20,
    },
    
    // Streamer (for small rockets)
    streamer: {
      enabled: false,
      length: 1.0,
      width: 0.05,
      cd: 0.4,
    },
  },
  
  // Rail/Launch settings
  launch: {
    railLength: 1.5, // m
    railAngle: 5, // degrees from vertical
    railDirection: 0, // azimuth in degrees
  },
};

/**
 * Calculate air density at altitude using ISA model
 */
export function getAirDensity(altitude) {
  const { AIR_DENSITY_SEA, TEMP_SEA_LEVEL, LAPSE_RATE, GRAVITY, GAS_CONSTANT } = ROCKET_CONSTANTS;
  
  if (altitude < 0) altitude = 0;
  if (altitude > 11000) altitude = 11000; // Troposphere limit
  
  const T = TEMP_SEA_LEVEL - LAPSE_RATE * altitude;
  const exponent = GRAVITY / (LAPSE_RATE * GAS_CONSTANT) - 1;
  const density = AIR_DENSITY_SEA * Math.pow(T / TEMP_SEA_LEVEL, exponent);
  
  return Math.max(density, 0.001);
}

/**
 * Calculate drag coefficient based on Mach number
 */
export function getDragCoefficient(mach, baseCd = 0.5) {
  // Transonic drag rise model
  if (mach < 0.8) {
    return baseCd;
  } else if (mach < 1.2) {
    // Transonic region - drag increases
    const rise = (mach - 0.8) / 0.4;
    return baseCd * (1 + 0.8 * rise);
  } else {
    // Supersonic - drag decreases slightly
    return baseCd * 1.6 * Math.pow(1.2 / mach, 0.3);
  }
}

/**
 * Calculate speed of sound at altitude
 */
export function getSpeedOfSound(altitude) {
  const { TEMP_SEA_LEVEL, LAPSE_RATE } = ROCKET_CONSTANTS;
  const T = TEMP_SEA_LEVEL - LAPSE_RATE * Math.min(altitude, 11000);
  return Math.sqrt(1.4 * 287.05 * T); // sqrt(gamma * R * T)
}

/**
 * Calculate fin center of pressure using Barrowman equations
 */
export function calculateFinCP(fin, bodyDiameter) {
  const { rootChord, tipChord, span, sweepAngle } = fin;
  
  // Leading edge sweep in radians
  const sweepRad = (sweepAngle * Math.PI) / 180;
  
  // Fin planform area
  const finArea = 0.5 * (rootChord + tipChord) * span;
  
  // Leading edge position at tip
  const leadingEdgeSweep = span * Math.tan(sweepRad);
  
  // Barrowman CP calculation for single fin
  const cpFromRoot = (leadingEdgeSweep * (rootChord + 2 * tipChord)) / (3 * (rootChord + tipChord))
    + (rootChord + tipChord - rootChord * tipChord / (rootChord + tipChord)) / 6;
  
  return cpFromRoot;
}

/**
 * Calculate normal force coefficient for fins (Barrowman)
 */
export function calculateFinCN(fin, bodyDiameter, finCount) {
  const { rootChord, tipChord, span } = fin;
  
  // Interference factor for body tube
  const interfereFactor = 1 + bodyDiameter / (2 * span + bodyDiameter);
  
  // Fin aspect ratio
  const finArea = 0.5 * (rootChord + tipChord) * span;
  const aspectRatio = (2 * span * span) / finArea;
  
  // CN alpha per fin (Barrowman)
  const cnAlphaPerFin = (4 * finCount * (span / bodyDiameter) ** 2) / 
    (1 + Math.sqrt(1 + (2 * span / (rootChord + tipChord)) ** 2));
  
  return cnAlphaPerFin * interfereFactor;
}

/**
 * Calculate rocket's center of gravity
 */
export function calculateCG(rocketConfig, motorMass = 0, propellantMass = 0) {
  let totalMass = 0;
  let momentSum = 0;
  
  // Nose cone
  const noseMass = rocketConfig.noseCone.mass;
  const noseCG = rocketConfig.noseCone.length * 0.6; // CG at 60% of length for hollow nose
  totalMass += noseMass;
  momentSum += noseMass * noseCG;
  
  // Body tubes
  rocketConfig.bodyTubes.forEach(tube => {
    const material = BODY_MATERIALS[tube.material];
    const volume = Math.PI * tube.length * (
      (tube.outerDiameter / 2) ** 2 - (tube.outerDiameter / 2 - tube.wallThickness) ** 2
    );
    const mass = volume * material.density;
    const cg = tube.position + tube.length / 2;
    totalMass += mass;
    momentSum += mass * cg;
  });
  
  // Fins
  const finMaterial = BODY_MATERIALS[rocketConfig.fins.material] || BODY_MATERIALS.FIBERGLASS;
  const finArea = 0.5 * (rocketConfig.fins.rootChord + rocketConfig.fins.tipChord) * rocketConfig.fins.span;
  const finVolume = finArea * rocketConfig.fins.thickness * rocketConfig.fins.count;
  const finMass = finVolume * finMaterial.density;
  const finCG = rocketConfig.fins.position + rocketConfig.fins.rootChord * 0.4;
  totalMass += finMass;
  momentSum += finMass * finCG;
  
  // Canards (if enabled)
  if (rocketConfig.canards?.enabled) {
    const canardArea = 0.5 * (rocketConfig.canards.rootChord + rocketConfig.canards.tipChord) * rocketConfig.canards.span;
    const canardMass = canardArea * 0.003 * finMaterial.density * rocketConfig.canards.count;
    const canardCG = rocketConfig.canards.position + rocketConfig.canards.rootChord * 0.4;
    totalMass += canardMass;
    momentSum += canardMass * canardCG;
  }
  
  // Payload
  totalMass += rocketConfig.payload.mass;
  momentSum += rocketConfig.payload.mass * rocketConfig.payload.position;
  
  // Avionics
  if (rocketConfig.avionics.enabled) {
    totalMass += rocketConfig.avionics.mass;
    momentSum += rocketConfig.avionics.mass * rocketConfig.avionics.position;
  }
  
  // Camera
  if (rocketConfig.camera?.enabled) {
    totalMass += rocketConfig.camera.mass;
    momentSum += rocketConfig.camera.mass * rocketConfig.camera.position;
  }
  
  // Motor (at motor mount position)
  const motorCG = rocketConfig.motorMount.position + rocketConfig.motorMount.length * 0.5;
  totalMass += motorMass;
  momentSum += motorMass * motorCG;
  
  // Propellant (slightly forward of motor end due to grain)
  const propCG = rocketConfig.motorMount.position + rocketConfig.motorMount.length * 0.4;
  totalMass += propellantMass;
  momentSum += propellantMass * propCG;
  
  // Recovery systems mass
  if (rocketConfig.recovery.drogue?.enabled) {
    totalMass += 0.02; // Estimate drogue mass
    momentSum += 0.02 * rocketConfig.recovery.drogue.position;
  }
  if (rocketConfig.recovery.main?.enabled) {
    totalMass += 0.05; // Estimate main chute mass
    momentSum += 0.05 * rocketConfig.recovery.main.position;
  }
  
  return {
    cg: totalMass > 0 ? momentSum / totalMass : 0,
    totalMass,
  };
}

/**
 * Calculate rocket's center of pressure (Barrowman method)
 */
export function calculateCP(rocketConfig) {
  const bodyDiameter = rocketConfig.noseCone.diameter;
  const bodyRadius = bodyDiameter / 2;
  const bodyArea = Math.PI * bodyRadius * bodyRadius;
  
  let cnAlphaSum = 0;
  let cpMomentSum = 0;
  
  // Nose cone contribution
  const noseShape = NOSE_SHAPES[rocketConfig.noseCone.shape];
  const noseCN = 2; // CN_alpha for nose cone
  const noseCP = rocketConfig.noseCone.length * noseShape.cpFactor;
  cnAlphaSum += noseCN;
  cpMomentSum += noseCN * noseCP;
  
  // Body tube contribution (negligible for well-designed rockets)
  // Adding small contribution for transitions
  
  // Fin contribution
  const { fins } = rocketConfig;
  const finCN = calculateFinCN(fins, bodyDiameter, fins.count);
  const finCPFromRoot = calculateFinCP(fins, bodyDiameter);
  const finCP = fins.position + finCPFromRoot;
  cnAlphaSum += finCN;
  cpMomentSum += finCN * finCP;
  
  // Canards contribution (destabilizing)
  if (rocketConfig.canards?.enabled) {
    const canardCN = calculateFinCN(rocketConfig.canards, bodyDiameter, rocketConfig.canards.count) * 0.5;
    const canardCP = rocketConfig.canards.position + rocketConfig.canards.rootChord * 0.4;
    cnAlphaSum += canardCN;
    cpMomentSum += canardCN * canardCP;
  }
  
  return {
    cp: cnAlphaSum > 0 ? cpMomentSum / cnAlphaSum : 0,
    cnAlpha: cnAlphaSum,
  };
}

/**
 * Calculate static stability margin in calibers
 */
export function calculateStabilityMargin(rocketConfig, motorMass = 0, propellantMass = 0) {
  const { cg, totalMass } = calculateCG(rocketConfig, motorMass, propellantMass);
  const { cp } = calculateCP(rocketConfig);
  
  const bodyDiameter = rocketConfig.noseCone.diameter;
  const stabilityMargin = (cp - cg) / bodyDiameter;
  
  return {
    cg,
    cp,
    stabilityMargin,
    totalMass,
    isStable: stabilityMargin >= 1.0 && stabilityMargin <= 3.0,
    isOverstable: stabilityMargin > 3.0,
    isUnstable: stabilityMargin < 1.0,
  };
}

/**
 * Calculate total rocket length
 */
export function calculateTotalLength(rocketConfig) {
  let maxPosition = rocketConfig.noseCone.length;
  
  rocketConfig.bodyTubes.forEach(tube => {
    const end = tube.position + tube.length;
    if (end > maxPosition) maxPosition = end;
  });
  
  // Account for fin trailing edge
  const finEnd = rocketConfig.fins.position + rocketConfig.fins.rootChord;
  if (finEnd > maxPosition) maxPosition = finEnd;
  
  return maxPosition;
}

/**
 * Calculate rocket reference area
 */
export function calculateReferenceArea(rocketConfig) {
  const r = rocketConfig.noseCone.diameter / 2;
  return Math.PI * r * r;
}

/**
 * Calculate base drag coefficient
 */
export function calculateBaseCd(rocketConfig) {
  const noseShape = NOSE_SHAPES[rocketConfig.noseCone.shape];
  const finCount = rocketConfig.fins.count;
  
  // Base CD contributions
  let cd = 0.3; // Body friction
  cd *= noseShape.cdMultiplier; // Nose shape
  cd += 0.02 * finCount; // Fin interference
  cd += 0.05; // Base drag
  
  if (rocketConfig.camera?.enabled) {
    cd += 0.08; // Camera protrusion
  }
  
  return cd;
}

/**
 * Main Rocket Flight Simulation
 */
export class RocketFlightSimulation {
  constructor(rocketConfig, motorData) {
    this.rocketConfig = { ...DEFAULT_ROCKET_CONFIG, ...rocketConfig };
    this.motorData = motorData; // { thrustCurve: [{time, thrust}], totalImpulse, propellantMass, motorMass, burnTime }
    
    this.reset();
  }
  
  reset() {
    this.time = 0;
    this.dt = 0.01; // 10ms timestep
    
    // Position and velocity (in launch frame, z is up)
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    
    // Angular state
    this.attitude = { pitch: 0, yaw: 0, roll: 0 }; // radians
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
    
    // Phase tracking
    this.phase = 'pad'; // pad, boost, coast, drogue, main, landed
    this.onRail = true;
    this.motorBurnout = false;
    this.hasAscended = false; // Track if rocket has started ascending
    this.apogeeReached = false;
    this.drogueDeployed = false;
    this.mainDeployed = false;
    this.landed = false;
    
    // Key events
    this.apogeeAltitude = 0;
    this.apogeeTime = 0;
    this.maxVelocity = 0;
    this.maxAcceleration = 0;
    this.maxMach = 0;
    this.railExitVelocity = 0;
    
    // Current propellant mass
    this.propellantRemaining = this.motorData?.propellantMass || 0;
    this.initialPropellantMass = this.propellantRemaining;
    
    // Calculate initial stability
    this.updateStability();
    
    // Flight data history
    this.history = {
      time: [],
      altitude: [],
      velocity: [],
      acceleration: [],
      mach: [],
      thrust: [],
      drag: [],
      phase: [],
      stabilityMargin: [],
      positionX: [],
      positionY: [],
      positionZ: [],
    };
  }
  
  updateStability() {
    const motorMass = this.motorData?.motorMass || 0;
    this.stability = calculateStabilityMargin(
      this.rocketConfig,
      motorMass,
      this.propellantRemaining
    );
  }
  
  getCurrentThrust() {
    if (!this.motorData?.thrustCurve || this.motorBurnout) return 0;
    
    const curve = this.motorData.thrustCurve;
    if (!curve || curve.length === 0) return 0;
    
    if (this.time >= this.motorData.burnTime) {
      this.motorBurnout = true;
      return 0;
    }
    
    // Handle time before first data point
    if (this.time <= curve[0].time) {
      return curve[0].thrust;
    }
    
    // Handle time after last data point  
    if (this.time >= curve[curve.length - 1].time) {
      this.motorBurnout = true;
      return 0;
    }
    
    // Linear interpolation on thrust curve
    for (let i = 0; i < curve.length - 1; i++) {
      if (this.time >= curve[i].time && this.time < curve[i + 1].time) {
        const t = (this.time - curve[i].time) / (curve[i + 1].time - curve[i].time);
        return curve[i].thrust + t * (curve[i + 1].thrust - curve[i].thrust);
      }
    }
    
    return 0;
  }
  
  getTotalMass() {
    return this.stability.totalMass;
  }
  
  launch() {
    this.phase = 'boost';
    // Apply rail angle
    const railAngleRad = (this.rocketConfig.launch.railAngle * Math.PI) / 180;
    const railDirRad = (this.rocketConfig.launch.railDirection * Math.PI) / 180;
    
    this.attitude.pitch = railAngleRad;
    this.attitude.yaw = railDirRad;
  }
  
  update(deltaTime) {
    if (this.landed) return this.getState();
    
    const dt = deltaTime || this.dt;
    this.time += dt;
    
    // Get current conditions
    const altitude = this.position.z;
    const airDensity = getAirDensity(altitude);
    const speedOfSound = getSpeedOfSound(altitude);
    
    // Calculate velocity magnitude
    const speed = Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
    const mach = speed / speedOfSound;
    
    // Update max values
    this.maxVelocity = Math.max(this.maxVelocity, speed);
    this.maxMach = Math.max(this.maxMach, mach);
    
    // Get thrust
    const thrust = this.getCurrentThrust();
    
    // Update propellant mass
    if (thrust > 0 && this.propellantRemaining > 0) {
      const burnFraction = dt / this.motorData.burnTime;
      this.propellantRemaining -= this.initialPropellantMass * burnFraction;
      this.propellantRemaining = Math.max(0, this.propellantRemaining);
      this.updateStability();
    }
    
    // Calculate drag
    const baseCd = calculateBaseCd(this.rocketConfig);
    const cd = getDragCoefficient(mach, baseCd);
    const refArea = calculateReferenceArea(this.rocketConfig);
    
    // Select drag area based on phase (parachute adds area)
    let dragArea = refArea;
    let dragCd = cd;
    
    if (this.drogueDeployed && !this.mainDeployed) {
      const drogueArea = Math.PI * (this.rocketConfig.recovery.drogue.diameter / 2) ** 2;
      dragArea = drogueArea;
      dragCd = this.rocketConfig.recovery.drogue.cd;
    } else if (this.mainDeployed) {
      const mainArea = Math.PI * (this.rocketConfig.recovery.main.diameter / 2) ** 2;
      dragArea = mainArea;
      dragCd = this.rocketConfig.recovery.main.cd;
    }
    
    // Drag force magnitude: 0.5 * rho * v^2 * Cd * A
    const dragForce = 0.5 * airDensity * speed * speed * dragCd * dragArea;
    
    // Get total mass
    const mass = this.getTotalMass();
    
    // Calculate forces in body frame, then rotate to world
    // Simplified: assume rocket points in direction of velocity during flight
    
    // Thrust force (along rocket axis)
    const thrustAngle = this.attitude.pitch;
    const thrustDir = {
      x: Math.sin(thrustAngle) * Math.cos(this.attitude.yaw),
      y: Math.sin(thrustAngle) * Math.sin(this.attitude.yaw),
      z: Math.cos(thrustAngle),
    };
    
    // Drag opposes velocity
    const dragDir = speed > 0.1 ? {
      x: -this.velocity.x / speed,
      y: -this.velocity.y / speed,
      z: -this.velocity.z / speed,
    } : { x: 0, y: 0, z: 0 };
    
    // Net force
    const force = {
      x: thrust * thrustDir.x + dragForce * dragDir.x,
      y: thrust * thrustDir.y + dragForce * dragDir.y,
      z: thrust * thrustDir.z + dragForce * dragDir.z - mass * ROCKET_CONSTANTS.GRAVITY,
    };
    
    // Acceleration
    this.acceleration = {
      x: force.x / mass,
      y: force.y / mass,
      z: force.z / mass,
    };
    
    const accelMag = Math.sqrt(
      this.acceleration.x ** 2 + this.acceleration.y ** 2 + this.acceleration.z ** 2
    );
    this.maxAcceleration = Math.max(this.maxAcceleration, accelMag);
    
    // Check if on rail
    if (this.onRail) {
      const distanceOnRail = Math.sqrt(
        this.position.x ** 2 + this.position.y ** 2 + this.position.z ** 2
      );
      if (distanceOnRail >= this.rocketConfig.launch.railLength) {
        this.onRail = false;
        this.railExitVelocity = speed;
      }
      
      // Constrain motion to rail direction
      if (this.onRail) {
        const railAngle = (this.rocketConfig.launch.railAngle * Math.PI) / 180;
        const railSpeed = Math.max(0, 
          this.acceleration.x * thrustDir.x + 
          this.acceleration.y * thrustDir.y + 
          this.acceleration.z * thrustDir.z
        );
        this.acceleration = {
          x: railSpeed * thrustDir.x,
          y: railSpeed * thrustDir.y,
          z: railSpeed * thrustDir.z,
        };
      }
    } else {
      // Off rail - update attitude to follow velocity (weathercocking)
      // Rocket naturally aligns with velocity due to aerodynamic stability
      if (speed > 1) {
        const targetPitch = Math.acos(Math.max(-1, Math.min(1, this.velocity.z / speed)));
        const targetYaw = Math.atan2(this.velocity.y, this.velocity.x);
        
        // Smoothly interpolate attitude (stability margin affects rate)
        const stabilityFactor = Math.min(1, this.stability.stabilityMargin / 2);
        const correctionRate = 0.1 * stabilityFactor;
        
        this.attitude.pitch += (targetPitch - this.attitude.pitch) * correctionRate;
        this.attitude.yaw += (targetYaw - this.attitude.yaw) * correctionRate;
      }
    }
    
    // Integrate velocity
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;
    this.velocity.z += this.acceleration.z * dt;
    
    // Integrate position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    
    // Update phase
    this.updatePhase();
    
    // Record history
    if (this.history.time.length === 0 || 
        this.time - this.history.time[this.history.time.length - 1] >= 0.05) {
      this.history.time.push(this.time);
      this.history.altitude.push(altitude);
      this.history.velocity.push(speed);
      this.history.acceleration.push(accelMag / ROCKET_CONSTANTS.GRAVITY); // in G's
      this.history.mach.push(mach);
      this.history.thrust.push(thrust);
      this.history.drag.push(dragForce);
      this.history.phase.push(this.phase);
      this.history.stabilityMargin.push(this.stability.stabilityMargin);
      this.history.positionX.push(this.position.x);
      this.history.positionY.push(this.position.y);
      this.history.positionZ.push(this.position.z);
    }
    
    return this.getState();
  }
  
  updatePhase() {
    const altitude = this.position.z;
    const verticalVelocity = this.velocity.z;
    
    // Track if we've ever had positive velocity (ascending)
    if (verticalVelocity > 1) {
      this.hasAscended = true;
    }
    
    // Detect apogee - must have ascended first, and now descending
    if (!this.apogeeReached && this.hasAscended && verticalVelocity <= 0) {
      this.apogeeReached = true;
      this.apogeeAltitude = altitude;
      this.apogeeTime = this.time;
      
      // Deploy drogue at apogee (if dual deployment)
      if (this.rocketConfig.recovery.type === 'dual' && 
          this.rocketConfig.recovery.drogue?.enabled) {
        this.drogueDeployed = true;
        this.phase = 'drogue';
      } else if (this.rocketConfig.recovery.main?.enabled) {
        // Single deployment - deploy main at apogee
        this.mainDeployed = true;
        this.phase = 'main';
      }
    }
    
    // Deploy main chute at altitude (dual deployment)
    if (this.drogueDeployed && !this.mainDeployed && 
        altitude <= this.rocketConfig.recovery.main.deployAltitude) {
      this.mainDeployed = true;
      this.phase = 'main';
    }
    
    // Update boost/coast phase
    if (this.phase === 'boost' && this.motorBurnout) {
      this.phase = 'coast';
    }
    
    // Detect landing
    if (altitude <= 0 && this.time > 1) {
      this.position.z = 0;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.landed = true;
      this.phase = 'landed';
    }
  }
  
  getState() {
    const speed = Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
    const altitude = this.position.z;
    const speedOfSound = getSpeedOfSound(altitude);
    
    return {
      time: this.time,
      position: { ...this.position },
      velocity: { ...this.velocity },
      acceleration: { ...this.acceleration },
      speed,
      altitude,
      mach: speed / speedOfSound,
      phase: this.phase,
      onRail: this.onRail,
      motorBurnout: this.motorBurnout,
      apogeeReached: this.apogeeReached,
      drogueDeployed: this.drogueDeployed,
      mainDeployed: this.mainDeployed,
      landed: this.landed,
      apogeeAltitude: this.apogeeAltitude,
      apogeeTime: this.apogeeTime,
      maxVelocity: this.maxVelocity,
      maxAcceleration: this.maxAcceleration,
      maxMach: this.maxMach,
      railExitVelocity: this.railExitVelocity,
      thrust: this.getCurrentThrust(),
      propellantRemaining: this.propellantRemaining,
      stability: this.stability,
      history: this.history,
      rocketConfig: this.rocketConfig,
      attitude: { ...this.attitude },
    };
  }
  
  /**
   * Run complete simulation to landing
   */
  runToCompletion(maxTime = 300) {
    this.launch();
    
    while (!this.landed && this.time < maxTime) {
      this.update(this.dt);
    }
    
    return this.getState();
  }
}

export default RocketFlightSimulation;
