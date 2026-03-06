/**
 * Zustand store for rocket configuration and flight simulation state
 */
import { create } from 'zustand';
import { 
  RocketFlightSimulation, 
  DEFAULT_ROCKET_CONFIG,
  BODY_MATERIALS, 
  NOSE_SHAPES,
  FIN_SHAPES,
  calculateStabilityMargin,
  calculateTotalLength,
} from '../physics/rocketPhysics';

const useRocketStore = create((set, get) => ({
  // Rocket configuration
  rocketConfig: JSON.parse(JSON.stringify(DEFAULT_ROCKET_CONFIG)),
  
  // Motor data from motor simulator
  motorData: null,
  
  // Flight simulation
  flightSimulation: null,
  flightState: null,
  isFlying: false,
  timeScale: 1,
  
  // Stability calculations
  stability: null,
  
  // View state
  viewMode: 'builder', // 'builder', 'flight', 'results'
  selectedComponent: null,
  showStabilityOverlay: true,
  show3DPreview: false,  // Temporarily disabled for debugging
  
  // UI state
  activeTab: 'nosecone', // nosecone, body, fins, recovery, avionics, motor
  
  // Initialize with motor data
  setMotorData: (motorData) => {
    set({ motorData });
    get().calculateStability();
  },
  
  // Update rocket config
  updateRocketConfig: (updates) => {
    const { rocketConfig } = get();
    const newConfig = { ...rocketConfig };
    
    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
        newConfig[key] = { ...newConfig[key], ...updates[key] };
      } else {
        newConfig[key] = updates[key];
      }
    });
    
    set({ rocketConfig: newConfig });
    get().calculateStability();
  },
  
  // Update nose cone
  updateNoseCone: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        noseCone: { ...rocketConfig.noseCone, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update body tube
  updateBodyTube: (tubeId, updates) => {
    const { rocketConfig } = get();
    const bodyTubes = rocketConfig.bodyTubes.map(tube => 
      tube.id === tubeId ? { ...tube, ...updates } : tube
    );
    set({
      rocketConfig: { ...rocketConfig, bodyTubes },
    });
    get().calculateStability();
  },
  
  // Add body tube
  addBodyTube: (tube) => {
    const { rocketConfig } = get();
    const newTube = {
      id: `tube_${Date.now()}`,
      name: 'New Section',
      length: 0.15,
      outerDiameter: rocketConfig.noseCone.diameter,
      wallThickness: 0.002,
      material: 'BLUE_TUBE',
      position: calculateTotalLength(rocketConfig),
      ...tube,
    };
    set({
      rocketConfig: {
        ...rocketConfig,
        bodyTubes: [...rocketConfig.bodyTubes, newTube],
      },
    });
    get().calculateStability();
  },
  
  // Remove body tube
  removeBodyTube: (tubeId) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        bodyTubes: rocketConfig.bodyTubes.filter(t => t.id !== tubeId),
      },
    });
    get().calculateStability();
  },
  
  // Update fins
  updateFins: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        fins: { ...rocketConfig.fins, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update canards
  updateCanards: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        canards: { ...rocketConfig.canards, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update recovery system
  updateRecovery: (updates) => {
    const { rocketConfig } = get();
    const newRecovery = { ...rocketConfig.recovery };
    
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && updates[key] !== null) {
        newRecovery[key] = { ...newRecovery[key], ...updates[key] };
      } else {
        newRecovery[key] = updates[key];
      }
    });
    
    set({
      rocketConfig: { ...rocketConfig, recovery: newRecovery },
    });
  },
  
  // Update payload
  updatePayload: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        payload: { ...rocketConfig.payload, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update avionics
  updateAvionics: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        avionics: { ...rocketConfig.avionics, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update camera
  updateCamera: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        camera: { ...rocketConfig.camera, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update motor mount
  updateMotorMount: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        motorMount: { ...rocketConfig.motorMount, ...updates },
      },
    });
    get().calculateStability();
  },
  
  // Update launch settings
  updateLaunch: (updates) => {
    const { rocketConfig } = get();
    set({
      rocketConfig: {
        ...rocketConfig,
        launch: { ...rocketConfig.launch, ...updates },
      },
    });
  },
  
  // Calculate stability
  calculateStability: () => {
    try {
      const { rocketConfig, motorData } = get();
      if (!rocketConfig) {
        console.warn('No rocket config available for stability calculation');
        return;
      }
      const motorMass = motorData?.motorMass || 0.15;
      const propellantMass = motorData?.propellantMass || 0.1;
      
      const stability = calculateStabilityMargin(rocketConfig, motorMass, propellantMass);
      set({ stability });
    } catch (error) {
      console.error('Error calculating stability:', error);
    }
  },
  
  // Initialize flight simulation
  initFlightSimulation: () => {
    const { rocketConfig, motorData } = get();
    
    if (!motorData) {
      console.warn('No motor data available for flight simulation');
      return;
    }
    
    const simulation = new RocketFlightSimulation(rocketConfig, motorData);
    set({
      flightSimulation: simulation,
      flightState: simulation.getState(),
      isFlying: false,
    });
  },
  
  // Launch rocket
  launchRocket: () => {
    const { flightSimulation } = get();
    if (flightSimulation) {
      flightSimulation.launch();
      set({ isFlying: true, viewMode: 'flight' });
    }
  },
  
  // Step flight simulation
  stepFlight: (deltaTime) => {
    const { flightSimulation, isFlying, timeScale } = get();
    if (flightSimulation && isFlying) {
      const state = flightSimulation.update(deltaTime * timeScale);
      set({ flightState: state });
      
      if (state.landed) {
        set({ isFlying: false, viewMode: 'results' });
      }
    }
  },
  
  // Run simulation to completion
  runSimulationToCompletion: () => {
    const { flightSimulation } = get();
    if (flightSimulation) {
      const state = flightSimulation.runToCompletion();
      set({ 
        flightState: state, 
        isFlying: false,
        viewMode: 'results',
      });
    }
  },
  
  // Reset flight
  resetFlight: () => {
    const { flightSimulation } = get();
    if (flightSimulation) {
      flightSimulation.reset();
      set({
        flightState: flightSimulation.getState(),
        isFlying: false,
      });
    }
  },
  
  // Reset rocket to default
  resetRocket: () => {
    set({
      rocketConfig: JSON.parse(JSON.stringify(DEFAULT_ROCKET_CONFIG)),
      flightSimulation: null,
      flightState: null,
      isFlying: false,
    });
    get().calculateStability();
  },
  
  // UI state setters
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedComponent: (component) => set({ selectedComponent: component }),
  setShowStabilityOverlay: (show) => set({ showStabilityOverlay: show }),
  setShow3DPreview: (show) => set({ show3DPreview: show }),
  setTimeScale: (scale) => set({ timeScale: scale }),
}));

export default useRocketStore;
export { BODY_MATERIALS, NOSE_SHAPES, FIN_SHAPES };
