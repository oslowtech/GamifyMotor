/**
 * Flame and Exhaust Effects Component
 * Simplified version with reliable rendering
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Flame({
  position = [0, -0.32, 0],
  thrust = 0,
  maxThrust = 3000,
  exitRadius = 0.012,
  isBurning = false,
  showParticles = true,
}) {
  const flameRef = useRef();
  const coreRef = useRef();
  const particlesRef = useRef();
  const timeRef = useRef(0);
  
  const normalizedThrust = Math.min(thrust / maxThrust, 1);
  const flameLength = 0.1 + normalizedThrust * 0.4;
  const flameRadius = exitRadius * (1.5 + normalizedThrust);
  
  // Simple particle system - particles move along negative Y
  const particleCount = 200;
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * exitRadius * 0.5;
      positions[i * 3] = Math.cos(angle) * r;     // X
      positions[i * 3 + 1] = -Math.random() * 0.3; // Y (downward)
      positions[i * 3 + 2] = Math.sin(angle) * r;  // Z
      
      // Orange to yellow gradient
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.1;
    }
    
    return { positions, colors };
  }, [exitRadius]);
  
  // Animation
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    // Animate flame
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(timeRef.current * 15) * 0.1;
      flameRef.current.scale.x = 1 + Math.cos(timeRef.current * 12) * 0.05;
      flameRef.current.scale.z = flameRef.current.scale.x;
    }
    
    if (coreRef.current) {
      coreRef.current.scale.y = 1 + Math.sin(timeRef.current * 20) * 0.15;
    }
    
    // Update particles - move along Y axis (downward)
    if (particlesRef.current && showParticles && isBurning) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        // Move particles downward (negative Y)
        positions[i * 3 + 1] -= delta * (2 + normalizedThrust * 3);
        
        // Add some spread in XZ plane
        positions[i * 3] += (Math.random() - 0.5) * delta * 0.5;
        positions[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.5;
        
        // Reset particles that are too far down
        if (positions[i * 3 + 1] < -flameLength * 2) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * exitRadius * 0.5;
          positions[i * 3] = Math.cos(angle) * r;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = Math.sin(angle) * r;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  if (!isBurning || normalizedThrust < 0.01) {
    return null;
  }
  
  return (
    <group position={position}>
      {/* Outer flame cone - orange/yellow - pointing down */}
      <mesh ref={flameRef} rotation={[Math.PI, 0, 0]} position={[0, -flameLength / 2, 0]}>
        <coneGeometry args={[flameRadius, flameLength, 24, 1, true]} />
        <meshBasicMaterial
          color="#FF6622"
          transparent
          opacity={0.7 * normalizedThrust}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner flame core - blue/white */}
      <mesh ref={coreRef} rotation={[Math.PI, 0, 0]} position={[0, -flameLength * 0.35, 0]}>
        <coneGeometry args={[flameRadius * 0.4, flameLength * 0.7, 16, 1, true]} />
        <meshBasicMaterial
          color="#88CCFF"
          transparent
          opacity={0.9 * normalizedThrust}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Bright center */}
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -flameLength * 0.15, 0]}>
        <coneGeometry args={[flameRadius * 0.2, flameLength * 0.3, 8, 1, true]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95 * normalizedThrust}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Shock diamonds (Mach diamonds) at high thrust */}
      {normalizedThrust > 0.4 && (
        <>
          {[0.25, 0.45, 0.65].map((offset, i) => (
            <mesh 
              key={i}
              position={[0, -flameLength * offset, 0]}
              rotation={[Math.PI / 2, Math.PI / 4, 0]}
            >
              <planeGeometry args={[
                exitRadius * (1.2 - offset * 0.8), 
                exitRadius * (1.2 - offset * 0.8)
              ]} />
              <meshBasicMaterial
                color="#FFFF88"
                transparent
                opacity={0.5 * normalizedThrust * (1 - offset)}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </>
      )}
      
      {/* Particle system for exhaust */}
      {showParticles && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particleData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={particleData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.008}
            transparent
            opacity={0.8 * normalizedThrust}
            blending={THREE.AdditiveBlending}
            vertexColors
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
      
      {/* Exhaust glow lights - along Y axis */}
      <pointLight
        color="#FF5500"
        intensity={normalizedThrust * 3}
        distance={1}
        position={[0, -flameLength * 0.3, 0]}
      />
      <pointLight
        color="#FFAA44"
        intensity={normalizedThrust * 1}
        distance={2}
        position={[0, -flameLength * 0.6, 0]}
      />
    </group>
  );
}

// Shockwave effect for explosions
export function Shockwave({ position, progress, maxRadius = 1 }) {
  const radius = progress * maxRadius;
  const opacity = 1 - progress;
  
  if (progress >= 1) return null;
  
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.9, radius, 64]} />
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={opacity * 0.5}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Explosion fireball effect
export function Fireball({ position, progress, maxRadius = 0.3 }) {
  const radius = progress * maxRadius;
  const opacity = Math.max(0, 1 - progress * 1.5);
  
  if (progress >= 1) return null;
  
  return (
    <group position={position}>
      {/* Core fireball */}
      <mesh>
        <sphereGeometry args={[radius * 0.6, 32, 32]} />
        <meshBasicMaterial
          color="#FFFF00"
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer fireball */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#FF4400"
          transparent
          opacity={opacity * 0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Light */}
      <pointLight
        color="#FF6600"
        intensity={opacity * 10}
        distance={2}
      />
    </group>
  );
}
