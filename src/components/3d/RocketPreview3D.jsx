/**
 * 3D Rocket Preview Component
 * Real-time 3D visualization of rocket design in builder
 */
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import useRocketStore from '../../store/rocketStore';
import { calculateTotalLength } from '../../physics/rocketPhysics';

// Nose cone mesh based on shape
function NoseCone({ config, material }) {
  const { shape, length, diameter } = config;
  const radius = diameter / 2;
  
  // Ensure valid dimensions
  const safeLength = Math.max(length || 0.1, 0.01);
  const safeRadius = Math.max(radius || 0.025, 0.005);
  
  const geometry = React.useMemo(() => {
    const points = [];
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      let x, y;
      
      switch (shape) {
        case 'OGIVE':
          // Tangent ogive - with safety checks
          const rho = (safeRadius * safeRadius + safeLength * safeLength) / (2 * safeRadius);
          y = t * safeLength;
          const sqrtArg = rho * rho - Math.pow(safeLength - y, 2);
          x = sqrtArg > 0 ? Math.sqrt(sqrtArg) - (rho - safeRadius) : safeRadius * t;
          break;
        case 'CONICAL':
          y = t * safeLength;
          x = safeRadius * t;
          break;
        case 'ELLIPTICAL':
          const angle = (Math.PI / 2) * (1 - t);
          y = safeLength * (1 - Math.cos(angle));
          x = safeRadius * Math.sin(angle);
          break;
        case 'PARABOLIC':
          y = t * safeLength;
          x = safeRadius * Math.sqrt(t);
          break;
        case 'HAACK':
          // Von Kármán curve (LD-Haack with C=0)
          const theta = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * t)));
          y = t * safeLength;
          const haackArg = (theta - Math.sin(2 * theta) / 2) / Math.PI;
          x = safeRadius * Math.sqrt(Math.max(0, haackArg));
          break;
        default:
          y = t * safeLength;
          x = safeRadius * t;
      }
      
      // Ensure x is always positive and finite
      const safeX = Math.max(isFinite(x) ? x : 0.001, 0.001);
      points.push(new THREE.Vector2(safeX, y));
    }
    
    return new THREE.LatheGeometry(points, 32);
  }, [shape, safeLength, safeRadius]);
  
  return (
    <mesh geometry={geometry} position={[0, safeLength / 2, 0]} rotation={[Math.PI, 0, 0]}>
      <meshStandardMaterial 
        color={material?.color || '#888888'} 
        metalness={0.4} 
        roughness={0.5} 
      />
    </mesh>
  );
}

// Body tube mesh
function BodyTube({ tube, material }) {
  const { length, outerDiameter, wallThickness, position } = tube;
  const outerRadius = outerDiameter / 2;
  const innerRadius = outerRadius - wallThickness;
  
  return (
    <group position={[0, -position - length / 2, 0]}>
      <mesh>
        <cylinderGeometry args={[outerRadius, outerRadius, length, 32]} />
        <meshStandardMaterial 
          color={material?.color || '#4466AA'} 
          metalness={0.2} 
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

// Fin mesh - properly oriented trapezoidal fins
function Fin({ config, index, totalFins, bodyRadius }) {
  const { rootChord, tipChord, span, sweepAngle, thickness, position } = config;
  const angle = (index / totalFins) * Math.PI * 2;
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const leadingEdgeSweep = span * Math.tan(sweepRad);
  
  // Create fin shape in XY plane (X = outward, Y = along rocket axis)
  const shape = React.useMemo(() => {
    const s = new THREE.Shape();
    // Start at root leading edge (attached to body)
    s.moveTo(0, 0);
    // Go to root trailing edge
    s.lineTo(0, -rootChord);
    // Go to tip trailing edge (outward + back)
    s.lineTo(span, -rootChord + leadingEdgeSweep - tipChord);
    // Go to tip leading edge (outward)
    s.lineTo(span, -rootChord + leadingEdgeSweep);
    // Close back to start
    s.closePath();
    return s;
  }, [rootChord, tipChord, span, leadingEdgeSweep]);
  
  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: false,
  };
  
  return (
    <group rotation={[0, angle, 0]}>
      <mesh 
        position={[bodyRadius, -position, -thickness / 2]}
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="#555555" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

// CG/CP markers
function StabilityMarkers({ stability, rocketConfig, totalLength }) {
  if (!stability) return null;
  
  const { cg, cp } = stability;
  const diameter = rocketConfig.noseCone.diameter;
  
  return (
    <>
      {/* CG Marker (green) */}
      <group position={[diameter / 2 + 0.02, -cg, 0]}>
        <mesh>
          <sphereGeometry args={[0.008, 16, 16]} />
          <meshBasicMaterial color="#44FF44" />
        </mesh>
        <Html position={[0.02, 0, 0]} style={{ fontSize: '10px', color: '#44FF44', whiteSpace: 'nowrap' }}>
          CG
        </Html>
      </group>
      
      {/* CP Marker (red) */}
      <group position={[diameter / 2 + 0.02, -cp, 0]}>
        <mesh>
          <sphereGeometry args={[0.008, 16, 16]} />
          <meshBasicMaterial color="#FF4444" />
        </mesh>
        <Html position={[0.02, 0, 0]} style={{ fontSize: '10px', color: '#FF4444', whiteSpace: 'nowrap' }}>
          CP
        </Html>
      </group>
    </>
  );
}

// Main rocket assembly
function RocketAssembly() {
  const { rocketConfig, stability } = useRocketStore();
  const groupRef = useRef();
  
  // Safety check
  if (!rocketConfig || !rocketConfig.noseCone || !rocketConfig.bodyTubes || !rocketConfig.fins) {
    return null;
  }
  
  const totalLength = calculateTotalLength(rocketConfig);
  const bodyRadius = rocketConfig.noseCone.diameter / 2;
  
  // Slow rotation for preview
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });
  
  // Get materials
  const getMaterial = (materialKey) => {
    const materials = {
      CARDBOARD: { color: '#8B7355' },
      PHENOLIC: { color: '#4A3C2A' },
      FIBERGLASS: { color: '#E8E8D0' },
      CARBON_FIBER: { color: '#2A2A2A' },
      BLUE_TUBE: { color: '#3366AA' },
    };
    return materials[materialKey] || materials.FIBERGLASS;
  };
  
  return (
    <group ref={groupRef} position={[0, totalLength / 2, 0]}>
      {/* Nose cone */}
      <NoseCone 
        config={rocketConfig.noseCone} 
        material={getMaterial(rocketConfig.noseCone.material)}
      />
      
      {/* Body tubes */}
      {rocketConfig.bodyTubes.map((tube) => (
        <BodyTube 
          key={tube.id} 
          tube={tube} 
          material={getMaterial(tube.material)}
        />
      ))}
      
      {/* Fins */}
      {Array.from({ length: rocketConfig.fins.count }).map((_, i) => (
        <Fin 
          key={i}
          config={rocketConfig.fins}
          index={i}
          totalFins={rocketConfig.fins.count}
          bodyRadius={bodyRadius}
        />
      ))}
      
      {/* Stability markers */}
      <StabilityMarkers 
        stability={stability} 
        rocketConfig={rocketConfig}
        totalLength={totalLength}
      />
    </group>
  );
}

// Main preview component
export default function RocketPreview3D() {
  const { rocketConfig } = useRocketStore();
  
  // Safety check for rocketConfig
  if (!rocketConfig || !rocketConfig.noseCone) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0a15',
        color: '#888'
      }}>
        Loading rocket configuration...
      </div>
    );
  }
  
  const totalLength = calculateTotalLength(rocketConfig);
  const cameraDistance = Math.max(totalLength * 2, 0.5);
  
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      style={{ background: 'linear-gradient(to bottom, #0a0a15, #1a1a2e)' }}
      gl={{ antialias: true, failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a15');
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[cameraDistance * 0.6, cameraDistance * 0.3, cameraDistance * 0.6]}
        fov={45}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} />
      
      <RocketAssembly />
      
      <Environment preset="city" />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={0.2}
        maxDistance={2}
        autoRotate={false}
      />
      
      {/* Ground reference grid */}
      <gridHelper args={[1, 20, '#333366', '#222244']} position={[0, 0, 0]} />
    </Canvas>
  );
}
