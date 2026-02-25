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
}));

export default useMotorStore;
export { PROPELLANTS, MATERIALS, GRAIN_TYPES };
