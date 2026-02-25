/**
 * Motor Casing Component
 * Vertical cylinder along Y-axis, no internal rotation
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Casing({ 
  innerRadius = 0.04, 
  wallThickness = 0.003, 
  length = 0.35,
  stress = 0,
  yieldStrength = 276e6,
  materialColor = '#A0A0A0',
  viewMode = 'cutaway',
  hasExploded = false,
  explosionProgress = 0,
}) {
  const meshRef = useRef();
  const outerRadius = innerRadius + wallThickness;
  
  // Stress visualization (with NaN protection)
  const stressRatio = (!stress || isNaN(stress)) ? 0 : Math.min(stress / yieldStrength, 2);
  
  const casingColor = useMemo(() => {
    if (stressRatio < 0.5) return new THREE.Color(materialColor);
    if (stressRatio < 1.0) {
      return new THREE.Color(materialColor).lerp(new THREE.Color('#FFAA00'), (stressRatio - 0.5) * 2);
    }
    return new THREE.Color('#FFAA00').lerp(new THREE.Color('#FF0000'), Math.min(stressRatio - 1, 1));
  }, [stressRatio, materialColor]);
  
  const segments = 64;
  const thetaLength = viewMode === 'cutaway' ? Math.PI * 1.5 : Math.PI * 2;
  
  // Stress vibration
  useFrame((state) => {
    if (meshRef.current && !hasExploded && stressRatio > 0.8) {
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * 0.0005 * stressRatio;
    }
  });
  
  if (hasExploded) {
    return <ExplosionFragments outerRadius={outerRadius} length={length} progress={explosionProgress} />;
  }
  
  return (
    <group ref={meshRef}>
      {/* Outer surface */}
      <mesh>
        <cylinderGeometry args={[outerRadius, outerRadius, length, segments, 1, true, 0, thetaLength]} />
        <meshStandardMaterial color={casingColor} metalness={0.8} roughness={0.2} side={THREE.FrontSide} />
      </mesh>
      
      {/* Inner surface */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, length, segments, 1, true, 0, thetaLength]} />
        <meshStandardMaterial color={casingColor} metalness={0.6} roughness={0.3} side={THREE.BackSide} />
      </mesh>
      
      {/* Top ring */}
      <mesh position={[0, length / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, segments, 1, 0, thetaLength]} />
        <meshStandardMaterial color={casingColor} metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Bottom ring */}
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, segments, 1, 0, thetaLength]} />
        <meshStandardMaterial color={casingColor} metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      
    </group>
  );
}

function ExplosionFragments({ outerRadius, length, progress }) {
  const fragments = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      angle: (i / 15) * Math.PI * 2,
      velocity: { x: Math.cos((i / 15) * Math.PI * 2), y: Math.random() - 0.5, z: Math.sin((i / 15) * Math.PI * 2) },
      size: outerRadius * (0.3 + Math.random() * 0.3),
      rotSpeed: { x: Math.random() * 5, y: Math.random() * 5, z: Math.random() * 5 },
    }));
  }, [outerRadius]);
  
  return (
    <group>
      {fragments.map((f, i) => (
        <mesh
          key={i}
          position={[f.velocity.x * progress * 1.5, f.velocity.y * progress * 1.5, f.velocity.z * progress * 1.5]}
          rotation={[f.rotSpeed.x * progress, f.rotSpeed.y * progress, f.rotSpeed.z * progress]}
        >
          <boxGeometry args={[f.size, f.size * 2, f.size * 0.3]} />
          <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
