/**
 * Zustand store for motor simulation state management
 */
import { create } from 'zustand';
import { MotorSimulation, PROPELLANTS, MATERIALS, GRAIN_TYPES } from '../physics/motorPhysics';

const useMotorStore = create((set, get) => ({
  // Simulation instance
  simulation: null,
  
  // Simulation state
  state: null,
  isRunning: false,
  timeScale: 1,
  
  // View settings
  viewMode: 'cutaway', // 'cutaway', 'exterior', 'transparent', 'nozzle'
  showHeatMap: false,
  showFlowLines: false,
  showParticles: true,
  
  // Camera settings
  cameraShake: 0,
  
  // UI visibility
  showCharts: true,
  showControls: true,
  
  // Page navigation
  currentPage: 'simulator', // 'simulator' or 'report'
  
  // Initialize simulation
  initSimulation: (config) => {
    const simulation = new MotorSimulation(config);
    set({ 
      simulation, 
      state: simulation.getState(),
      isRunning: false 
    });
  },
  
  // Update simulation config
  updateConfig: (newConfig) => {
    const { simulation } = get();
    if (simulation) {
      simulation.updateConfig(newConfig);
      set({ state: simulation.getState() });
    }
  },
  
  // Ignite motor
  ignite: () => {
    const { simulation } = get();
    if (simulation) {
      simulation.ignite();
      set({ isRunning: true, state: simulation.getState() });
    }
  },
  
  // Step simulation
  step: (deltaTime) => {
    const { simulation, isRunning, timeScale } = get();
    if (simulation && isRunning) {
      const state = simulation.update(deltaTime * timeScale);
      
      // Calculate camera shake based on thrust
      const maxThrust = 5000; // N
      const shakeIntensity = Math.min(state.thrust / maxThrust, 1) * 0.02;
      
      // Add extra shake on explosion
      let cameraShake = shakeIntensity;
      if (state.hasExploded) {
        const explosionAge = state.time - state.explosionTime;
        if (explosionAge < 0.5) {
          cameraShake = 0.1 * (1 - explosionAge / 0.5);
        }
      }
      
      set({ state, cameraShake });
      
      // Stop simulation if burned out or exploded
      if (state.isBurnedOut || state.hasExploded) {
        set({ isRunning: false });
      }
    }
  },
  
  // Pause/resume simulation
  toggleRunning: () => {
    set((state) => ({ isRunning: !state.isRunning }));
  },
  
  // Reset simulation
  reset: () => {
    const { simulation } = get();
    if (simulation) {
      simulation.reset();
      set({ 
        state: simulation.getState(),
        isRunning: false,
        cameraShake: 0 
      });
    }
  },
  
  // Set time scale
  setTimeScale: (scale) => {
    set({ timeScale: scale });
  },
  
  // View mode setters
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowHeatMap: (show) => set({ showHeatMap: show }),
  setShowFlowLines: (show) => set({ showFlowLines: show }),
  setShowParticles: (show) => set({ showParticles: show }),
  setShowCharts: (show) => set({ showCharts: show }),
  setShowControls: (show) => set({ showControls: show }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Set propellant
  setPropellant: (propellantKey) => {
    const { simulation } = get();
    if (simulation && PROPELLANTS[propellantKey]) {
      simulation.config.propellant = PROPELLANTS[propellantKey];
      set({ state: simulation.getState() });
    }
  },
  
  // Set material
  setMaterial: (materialKey) => {
    const { simulation } = get();
    if (simulation && MATERIALS[materialKey]) {
      simulation.config.material = MATERIALS[materialKey];
      set({ state: simulation.getState() });
    }
  },
  
  // Set grain type
  setGrainType: (grainType) => {
    const { simulation } = get();
    if (simulation) {
      simulation.config.grainConfig.type = grainType;
      set({ state: simulation.getState() });
    }
  },
  
  // Export motor data to JSON file
  exportMotor: () => {
    const { simulation, state } = get();
    if (!simulation || !state) {
      alert('Please run the simulation first before exporting');
      return null;
    }
    
    // Calculate total propellant mass
    const config = simulation.config;
    const grainVolume = config.grainConfig.segments * (
      Math.PI * (config.grainConfig.outerRadius ** 2 - config.grainConfig.coreRadius ** 2) * 
      config.grainConfig.length
    );
    const propellantMass = grainVolume * config.propellant.density;
    
    // Estimate motor casing mass
    const casingLength = config.grainConfig.segments * (config.grainConfig.length + 0.002); // 2mm gap
    const casingVolume = Math.PI * (
      (config.casing.innerRadius + config.casing.wallThickness) ** 2 - 
      config.casing.innerRadius ** 2
    ) * casingLength;
    const casingMass = casingVolume * config.material.density;
    
    // Nozzle mass estimate
    const nozzleMass = 0.05; // ~50g estimate
    
    const motorData = {
      version: '1.0',
      name: `Custom ${getMotorClass(state.totalImpulse)} Motor`,
      manufacturer: 'GamifyMotor Simulator',
      createdAt: new Date().toISOString(),
      
      // Classification
      classification: {
        totalImpulse: state.totalImpulse,
        motorClass: getMotorClass(state.totalImpulse),
        averageThrust: state.totalImpulse / state.burnTime,
        maxThrust: state.maxThrust,
        burnTime: state.burnTime,
      },
      
      // Mass properties
      mass: {
        propellant: propellantMass,
        casing: casingMass,
        nozzle: nozzleMass,
        total: propellantMass + casingMass + nozzleMass,
        empty: casingMass + nozzleMass,
      },
      
      // Geometry
      geometry: {
        diameter: config.casing.innerRadius * 2 + config.casing.wallThickness * 2,
        length: casingLength + 0.03, // + nozzle
      },
      
      // Propellant info
      propellant: {
        name: config.propellant.name,
        density: config.propellant.density,
      },
      
      // Performance data
      performance: {
        maxPressure: state.maxPressure,
        specificImpulse: state.totalImpulse / (propellantMass * 9.81),
      },
      
      // Thrust curve (time, thrust pairs)
      thrustCurve: state.history.time.map((t, i) => ({
        time: t,
        thrust: state.history.thrust[i],
      })),
      
      // Full config for reference
      config: {
        propellant: config.propellant,
        grainConfig: config.grainConfig,
        nozzle: config.nozzle,
        casing: config.casing,
        material: config.material,
      },
    };
    
    return motorData;
  },
  
  // Download motor as file
  downloadMotor: () => {
    const motorData = get().exportMotor();
    if (!motorData) return;
    
    const blob = new Blob([JSON.stringify(motorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${motorData.classification.motorClass}-motor-${Date.now()}.motor.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));

// Helper function to get motor class from total impulse
function getMotorClass(totalImpulse) {
  if (totalImpulse <= 0.3125) return '1/8A';
  if (totalImpulse <= 0.625) return '1/4A';
  if (totalImpulse <= 1.25) return '1/2A';
  if (totalImpulse <= 2.5) return 'A';
  if (totalImpulse <= 5) return 'B';
  if (totalImpulse <= 10) return 'C';
  if (totalImpulse <= 20) return 'D';
  if (totalImpulse <= 40) return 'E';
  if (totalImpulse <= 80) return 'F';
  if (totalImpulse <= 160) return 'G';
  if (totalImpulse <= 320) return 'H';
  if (totalImpulse <= 640) return 'I';
  if (totalImpulse <= 1280) return 'J';
  if (totalImpulse <= 2560) return 'K';
  if (totalImpulse <= 5120) return 'L';
  if (totalImpulse <= 10240) return 'M';
  return 'N+';
}

export default useMotorStore;
export { PROPELLANTS, MATERIALS, GRAIN_TYPES };
