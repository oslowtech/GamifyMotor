/**
 * Propellant Grain Component
 * BATES grain segments, vertical along Y-axis
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Grain({
  outerRadius = 0.038,
  innerRadius = 0.012,
  length = 0.070,
  segments = 4,
  viewMode = 'cutaway',
  burnProgress = 0,
  isBurning = false,
  showHeatMap = false,
  chamberPressure = 101325,
}) {
  const glowRef = useRef();
  
  // Calculate current inner radius based on burn
  const progress = Math.max(0, Math.min(burnProgress || 0, 0.98));
  const webThickness = outerRadius - innerRadius;
  const currentInnerRadius = innerRadius + webThickness * progress;
  
  // Grain color
  const grainColor = useMemo(() => {
    if (showHeatMap && isBurning) {
      const p = Math.min((chamberPressure || 0) / 5e6, 1);
      if (p < 0.33) return '#88DD88';
      if (p < 0.66) return '#DDDD44';
      return '#DD6644';
    }
    return '#E8E4D0'; // Cream/off-white KNSB color
  }, [showHeatMap, isBurning, chamberPressure]);
  
  // Don't render if burned out
  if (progress >= 0.98) return null;
  
  const gap = 0.006;
  const totalLength = segments * length + (segments - 1) * gap;
  const radialSegments = 48;
  const thetaLength = viewMode === 'cutaway' ? Math.PI * 1.5 : Math.PI * 2;
  
  // Animate glow
  useFrame((state) => {
    if (glowRef.current && isBurning) {
      glowRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 15) * 0.15;
    }
  });
  
  return (
    <group>
      {/* Grain segments */}
      {Array.from({ length: segments }).map((_, i) => {
        const yPos = totalLength / 2 - i * (length + gap) - length / 2;
        return (
          <GrainSegment
            key={i}
            position={[0, yPos, 0]}
            outerRadius={outerRadius}
            innerRadius={currentInnerRadius}
            length={length}
            grainColor={grainColor}
            thetaLength={thetaLength}
            radialSegments={radialSegments}
            isBurning={isBurning}
          />
        );
      })}
      
      {/* Burning glow */}
      {isBurning && (
        <mesh ref={glowRef}>
          <cylinderGeometry args={[currentInnerRadius * 0.99, currentInnerRadius * 0.99, totalLength * 0.95, 32, 1, true]} />
          <meshBasicMaterial color="#FF4400" transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
        </mesh>
      )}
      
      {/* Inner light */}
      {isBurning && <pointLight color="#FF4400" intensity={1.5} distance={0.3} />}
    </group>
  );
}

function GrainSegment({ position, outerRadius, innerRadius, length, grainColor, thetaLength, radialSegments, isBurning }) {
  const burnColor = isBurning ? '#AA5533' : grainColor;
  
  return (
    <group position={position}>
      {/* Outer surface */}
      <mesh>
        <cylinderGeometry args={[outerRadius, outerRadius, length, radialSegments, 1, true, 0, thetaLength]} />
        <meshStandardMaterial color={grainColor} roughness={0.9} metalness={0.02} side={THREE.FrontSide} />
      </mesh>
      
      {/* Inner (burning) surface */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, length, radialSegments, 1, true, 0, thetaLength]} />
        <meshStandardMaterial 
          color={burnColor} 
          roughness={0.85} 
          metalness={0.02} 
          emissive={isBurning ? '#331100' : '#000000'} 
          emissiveIntensity={isBurning ? 0.4 : 0}
          side={THREE.BackSide} 
        />
      </mesh>
      
      {/* Top end */}
      <mesh position={[0, length / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, radialSegments, 1, 0, thetaLength]} />
        <meshStandardMaterial 
          color={isBurning ? '#BB7755' : grainColor} 
          roughness={0.9} 
          emissive={isBurning ? '#221100' : '#000000'}
          emissiveIntensity={isBurning ? 0.3 : 0}
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Bottom end */}
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, radialSegments, 1, 0, thetaLength]} />
        <meshStandardMaterial 
          color={isBurning ? '#BB7755' : grainColor} 
          roughness={0.9}
          emissive={isBurning ? '#221100' : '#000000'}
          emissiveIntensity={isBurning ? 0.3 : 0}
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
}
