/**
 * De Laval Nozzle Component
 * Converging-diverging nozzle, centered at its inlet
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Nozzle({
  throatDiameter = 0.010,
  exitDiameter = 0.020,
  inletDiameter = 0.035,
  length = 0.06,
  viewMode = 'cutaway',
  isBurning = false,
  position = [0, 0, 0],
}) {
  const glowRef = useRef();
  const throatR = throatDiameter / 2;
  const exitR = exitDiameter / 2;
  const inletR = inletDiameter / 2;
  const wall = 0.004;
  
  const convLen = length * 0.4;
  const throatLen = length * 0.1;
  const divLen = length * 0.5;
  
  const segments = 48;
  const thetaLength = viewMode === 'cutaway' ? Math.PI * 1.5 : Math.PI * 2;
  
  // Outer shell profile (LatheGeometry uses Y as axis, points are [radius, y])
  const outerGeom = useMemo(() => {
    const pts = [];
    // Y=0 is inlet (top), negative Y goes down
    pts.push(new THREE.Vector2(inletR + wall, 0));
    pts.push(new THREE.Vector2(throatR + wall, -convLen));
    pts.push(new THREE.Vector2(throatR + wall, -convLen - throatLen));
    pts.push(new THREE.Vector2(exitR + wall, -length));
    return new THREE.LatheGeometry(pts, segments, 0, thetaLength);
  }, [inletR, throatR, exitR, wall, convLen, throatLen, length, thetaLength]);
  
  // Inner surface profile
  const innerGeom = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(inletR, 0));
    pts.push(new THREE.Vector2(throatR, -convLen));
    pts.push(new THREE.Vector2(throatR, -convLen - throatLen));
    pts.push(new THREE.Vector2(exitR, -length));
    return new THREE.LatheGeometry(pts, segments, 0, thetaLength);
  }, [inletR, throatR, exitR, convLen, throatLen, length, thetaLength]);
  
  // Throat glow animation
  useFrame((state) => {
    if (glowRef.current && isBurning) {
      glowRef.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 12) * 0.1;
    }
  });
  
  return (
    <group position={position}>
      {/* Outer shell */}
      <mesh geometry={outerGeom}>
        <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} side={THREE.FrontSide} />
      </mesh>
      
      {/* Inner surface (graphite) */}
      <mesh geometry={innerGeom}>
        <meshStandardMaterial color="#1A1A1A" metalness={0.2} roughness={0.8} side={THREE.BackSide} />
      </mesh>
      
      {/* Exit ring */}
      <mesh position={[0, -length, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[exitR, exitR + wall, segments, 1, 0, thetaLength]} />
        <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Throat glow when burning */}
      {isBurning && (
        <mesh ref={glowRef} position={[0, -convLen - throatLen / 2, 0]}>
          <torusGeometry args={[throatR, 0.003, 8, segments, thetaLength]} />
          <meshBasicMaterial color="#FF4400" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}
