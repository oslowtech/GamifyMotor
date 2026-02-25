/**
 * Control Panel Component
 * UI for motor configuration and simulation control
 */
import React from 'react';
import { useControls, button, folder } from 'leva';
import useMotorStore, { PROPELLANTS, MATERIALS, GRAIN_TYPES } from '../../store/motorStore';

export default function ControlPanel() {
  const {
    state,
    initSimulation,
    ignite,
    reset,
    setTimeScale,
    setViewMode,
    setShowHeatMap,
    setShowParticles,
    setPropellant,
    setMaterial,
    setGrainType,
    updateConfig,
    isRunning,
    viewMode,
    showHeatMap,
    showParticles,
    timeScale,
    setCurrentPage,
  } = useMotorStore();
  
  // Initialize simulation on first render
  React.useEffect(() => {
    initSimulation({});
  }, [initSimulation]);
  
  // Simulation Controls
  useControls('Simulation', {
    'View Report': button(() => setCurrentPage('report')),
    'Reset': button(() => reset()),
    'Time Scale': {
      value: timeScale,
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: (v) => setTimeScale(v),
    },
  });
  
  // View Controls
  useControls('View', {
    'View Mode': {
      value: viewMode,
      options: {
        'Cutaway': 'cutaway',
        'Exterior': 'exterior',
        'Transparent': 'transparent',
      },
      onChange: (v) => setViewMode(v),
    },
    'Heat Map': {
      value: showHeatMap,
      onChange: (v) => setShowHeatMap(v),
    },
    'Particles': {
      value: showParticles,
      onChange: (v) => setShowParticles(v),
    },
  });
  
  // Motor Configuration
  useControls('Motor Design', {
    ...folder({
      'Propellant': {
        value: 'KNSB',
        options: Object.keys(PROPELLANTS),
        onChange: (v) => setPropellant(v),
      },
      'Casing Material': {
        value: 'ALUMINUM',
        options: Object.keys(MATERIALS),
        onChange: (v) => setMaterial(v),
      },
    }, { collapsed: false }),
  });
  
  // Grain Configuration
  useControls('Grain Geometry', {
    'Grain Type': {
      value: 'bates',
      options: {
        'BATES': GRAIN_TYPES.BATES,
        'Star': GRAIN_TYPES.STAR,
        'Cylindrical': GRAIN_TYPES.CYLINDRICAL,
      },
      onChange: (v) => setGrainType(v),
    },
    'Segments': {
      value: 4,
      min: 1,
      max: 8,
      step: 1,
      onChange: (v) => updateConfig({ grainConfig: { segments: v } }),
    },
    'Core Diameter (mm)': {
      value: 19,
      min: 8,
      max: 40,
      step: 1,
      onChange: (v) => updateConfig({ grainConfig: { coreRadius: v / 2000 } }),
    },
    'Outer Diameter (mm)': {
      value: 57,
      min: 30,
      max: 80,
      step: 1,
      onChange: (v) => updateConfig({ grainConfig: { outerRadius: v / 2000 } }),
    },
    'Segment Length (mm)': {
      value: 65,
      min: 30,
      max: 150,
      step: 5,
      onChange: (v) => updateConfig({ grainConfig: { length: v / 1000 } }),
    },
  });
  
  // Nozzle Configuration
  useControls('Nozzle', {
    'Throat Diameter (mm)': {
      value: 9,
      min: 4,
      max: 20,
      step: 0.5,
      onChange: (v) => updateConfig({ nozzle: { throatDiameter: v / 1000 } }),
    },
    'Exit Diameter (mm)': {
      value: 18,
      min: 8,
      max: 40,
      step: 1,
      onChange: (v) => updateConfig({ nozzle: { exitDiameter: v / 1000 } }),
    },
    'Nozzle Efficiency': {
      value: 0.90,
      min: 0.75,
      max: 0.98,
      step: 0.01,
      onChange: (v) => updateConfig({ nozzle: { efficiency: v } }),
    },
  });
  
  // Casing Configuration
  useControls('Casing', {
    'Wall Thickness (mm)': {
      value: 3,
      min: 1,
      max: 8,
      step: 0.5,
      onChange: (v) => updateConfig({ casing: { wallThickness: v / 1000 } }),
    },
    'Inner Diameter (mm)': {
      value: 60,
      min: 40,
      max: 100,
      step: 1,
      onChange: (v) => updateConfig({ casing: { innerRadius: v / 2000 } }),
    },
  });
  
  return null;
}
