/**
 * Motor Assembly Component
 * Combines casing, grain, nozzle, and flame
 * Motor is vertical along Y-axis: forward closure at top, nozzle at bottom
 */
import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Casing from './Casing';
import Grain from './Grain';
import Nozzle from './Nozzle';
import Flame, { Shockwave, Fireball } from './Flame';
import useMotorStore from '../../store/motorStore';

export default function MotorAssembly() {
  const groupRef = useRef();
  const [explosionProgress, setExplosionProgress] = useState(0);
  
  const { state, step, viewMode, showHeatMap, showParticles, cameraShake } = useMotorStore();
  
  // Run simulation each frame
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    step(dt);
    
    // Camera shake
    if (groupRef.current && cameraShake > 0) {
      groupRef.current.position.x = (Math.random() - 0.5) * cameraShake;
      groupRef.current.position.y = (Math.random() - 0.5) * cameraShake;
    } else if (groupRef.current) {
      groupRef.current.position.x = 0;
      groupRef.current.position.y = 0;
    }
    
    // Explosion animation
    if (state?.hasExploded && explosionProgress < 1) {
      setExplosionProgress(p => Math.min(p + delta * 2, 1));
    }
  });
  
  // Reset explosion
  useEffect(() => {
    if (state && !state.hasExploded) setExplosionProgress(0);
  }, [state?.hasExploded]);
  
  if (!state) return null;
  
  const { config, grainBurnProgress, chamberPressure, thrust, burnRate, stress, isBurning, hasExploded } = state;
  
  // Geometry calculations
  const segmentGap = 0.006;
  const grainLength = config.grainConfig.length * config.grainConfig.segments + (config.grainConfig.segments - 1) * segmentGap;
  const casingLength = grainLength + 0.03; // Extra space at ends
  const nozzleLength = 0.06;
  const closureThickness = 0.012;
  
  // Scale motor for visibility (meters -> visible 3D)
  const SCALE = 6;
  
  return (
    <group ref={groupRef} scale={[SCALE, SCALE, SCALE]}>
      {/* Casing - centered at origin */}
      <Casing
        innerRadius={config.casing.innerRadius}
        wallThickness={config.casing.wallThickness}
        length={casingLength}
        stress={stress || 0}
        yieldStrength={config.material.yieldStrength}
        materialColor={config.material.color}
        viewMode={viewMode}
        hasExploded={hasExploded}
        explosionProgress={explosionProgress}
      />
      
      {/* Grain - inside casing */}
      {!hasExploded && (
        <Grain
          outerRadius={config.grainConfig.outerRadius}
          innerRadius={config.grainConfig.coreRadius}
          length={config.grainConfig.length}
          segments={config.grainConfig.segments}
          viewMode={viewMode}
          burnProgress={grainBurnProgress || 0}
          isBurning={isBurning}
          showHeatMap={showHeatMap}
          chamberPressure={chamberPressure || 0}
        />
      )}
      
      {/* Nozzle - at bottom of casing */}
      {!hasExploded && (
        <Nozzle
          throatDiameter={config.nozzle.throatDiameter}
          exitDiameter={config.nozzle.exitDiameter}
          inletDiameter={config.casing.innerRadius * 1.8}
          length={nozzleLength}
          viewMode={viewMode}
          isBurning={isBurning}
          position={[0, -casingLength / 2, 0]}
        />
      )}
      
      {/* Forward Closure - at top of casing */}
      {!hasExploded && (
        <ForwardClosure
          radius={config.casing.innerRadius + config.casing.wallThickness}
          thickness={closureThickness}
          position={[0, casingLength / 2 + closureThickness / 2, 0]}
          viewMode={viewMode}
          color={config.material.color}
        />
      )}
      
      {/* Flame - from nozzle exit */}
      <Flame
        position={[0, -casingLength / 2 - nozzleLength - 0.005, 0]}
        thrust={thrust || 0}
        maxThrust={5000}
        exitRadius={config.nozzle.exitDiameter / 2}
        isBurning={isBurning && !hasExploded}
        showParticles={showParticles}
      />
      
      {/* Explosion effects */}
      {hasExploded && (
        <>
          <Fireball position={[0, 0, 0]} progress={explosionProgress} maxRadius={0.4} />
          <Shockwave position={[0, 0, 0]} progress={explosionProgress} maxRadius={1.5} />
        </>
      )}
    </group>
  );
}

// Forward closure (bulkhead) - simple solid disk
function ForwardClosure({ radius, thickness, position, viewMode, color }) {
  const thetaLength = viewMode === 'cutaway' ? Math.PI * 1.5 : Math.PI * 2;
  
  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius, thickness, 48, 1, false, 0, thetaLength]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}
