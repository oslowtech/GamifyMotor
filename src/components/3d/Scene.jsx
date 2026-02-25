/**
 * 3D Scene Component
 * Sets up the Three.js scene with lighting and camera controls
 */
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import MotorAssembly from './MotorAssembly';
import useMotorStore from '../../store/motorStore';

function Lights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-10, 5, -10]}
        intensity={0.8}
      />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#88AAFF" />
      <pointLight position={[2, 2, 0]} intensity={0.3} color="#FFFFFF" />
      <hemisphereLight args={['#6688CC', '#222244', 0.5]} />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div style={{
        color: 'white',
        fontSize: '18px',
        fontFamily: 'sans-serif',
        background: 'rgba(0,0,0,0.5)',
        padding: '12px 24px',
        borderRadius: '8px'
      }}>
        Loading Motor...
      </div>
    </Html>
  );
}

export default function Scene() {
  const { viewMode, state } = useMotorStore();
  const hasExploded = state?.hasExploded || false;
  
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      style={{ background: 'linear-gradient(to bottom, #1a1a2e, #0f0f1a)' }}
      gl={{ 
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      }}
    >
      <PerspectiveCamera 
        makeDefault 
        position={[2, 1.5, 3]} 
        fov={45}
        near={0.1}
        far={1000}
      />
      
      <Lights />
      
      <Suspense fallback={<LoadingFallback />}>
        <MotorAssembly />
        
        {/* Environment for reflections */}
        <Environment preset="night" />
        
        {/* Ground grid */}
        <Grid
          position={[0, -1.5, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#333366"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#4444AA"
          fadeDistance={15}
          fadeStrength={1}
          followCamera={false}
        />
      </Suspense>
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.5}
        target={[0, 0, 0]}
      />
      
      {/* Post-processing effects */}
      <EffectComposer enabled={true}>
        <Bloom
          intensity={hasExploded ? 1.5 : 0.3}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
