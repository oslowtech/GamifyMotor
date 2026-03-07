/**
 * Flight Simulation Component
 * Real-time 3D rocket flight visualization with telemetry
 */
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Html, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import useRocketStore from '../../store/rocketStore';
import useMotorStore from '../../store/motorStore';
import './FlightSimulation.css';

// 3D Rocket Model Component
function Rocket3D({ flightState, rocketConfig }) {
  const rocketRef = useRef();
  const flameRef = useRef();
  
  const position = flightState?.position || { x: 0, y: 0, z: 0 };
  const attitude = flightState?.attitude || { pitch: 0, yaw: 0, roll: 0 };
  const thrust = flightState?.thrust || 0;
  const phase = flightState?.phase || 'pad';
  
  // Scale factor for visualization (1 unit = 100m altitude)
  const SCALE = 100;
  
  useFrame((state, delta) => {
    if (!rocketRef.current) return;
    
    // Apply attitude from physics
    // Physics: pitch = angle from vertical (z), yaw = rotation around z
    // Three.js: need to convert to Euler angles
    // Rocket model points up (+Y in local space), physics +Z is up
    
    // Create rotation: first rotate around X by pitch (tilt from vertical)
    // then rotate around Y by yaw (compass direction)
    const euler = new THREE.Euler(
      attitude.pitch,  // Tilt forward/back
      -attitude.yaw,   // Compass direction (negate for Three.js convention)
      0,
      'YXZ'
    );
    
    const targetQuat = new THREE.Quaternion().setFromEuler(euler);
    rocketRef.current.quaternion.slerp(targetQuat, 0.15);
    
    // Animate flame
    if (flameRef.current && thrust > 0) {
      flameRef.current.scale.y = 1 + Math.random() * 0.3;
      flameRef.current.scale.x = 0.8 + Math.random() * 0.2;
    }
  });
  
  const bodyLength = 0.8;
  const bodyRadius = 0.05;
  const noseLength = 0.2;
  
  // Scale factor: 1 Three.js unit = SCALE meters
  // This allows us to see a 1000m flight in reasonable view space
  //const SCALE = 100;
  
  return (
    <group 
      ref={rocketRef}
      position={[position.x / SCALE, position.z / SCALE, -position.y / SCALE]} 
    >
      {/* Nose cone */}
      <mesh position={[0, bodyLength / 2 + noseLength / 2, 0]}>
        <coneGeometry args={[bodyRadius, noseLength, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Body tube */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyLength, 16]} />
        <meshStandardMaterial color="#3366AA" metalness={0.3} roughness={0.6} />
      </mesh>
      
      {/* Fins */}
      {[0, 90, 180, 270].slice(0, rocketConfig?.fins?.count || 4).map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.sin(angle * Math.PI / 180) * (bodyRadius + 0.04),
            -bodyLength / 2 + 0.08,
            Math.cos(angle * Math.PI / 180) * (bodyRadius + 0.04)
          ]}
          rotation={[0, -angle * Math.PI / 180, 0]}
        >
          <boxGeometry args={[0.08, 0.1, 0.01]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      ))}
      
      {/* Engine flame */}
      {thrust > 0 && (
        <group ref={flameRef} position={[0, -bodyLength / 2 - 0.15, 0]}>
          <mesh>
            <coneGeometry args={[0.03, 0.3, 8]} />
            <meshBasicMaterial color="#FF6600" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <coneGeometry args={[0.02, 0.2, 8]} />
            <meshBasicMaterial color="#FFFF00" transparent opacity={0.8} />
          </mesh>
          <pointLight color="#FF6600" intensity={2} distance={5} />
        </group>
      )}
    </group>
  );
}

// Parachute visualization - rendered separately to always face up
function ParachuteDisplay({ flightState, position }) {
  if (!flightState) return null;
  
  const SCALE = 100;
  const pos = position || flightState.position || { x: 0, y: 0, z: 0 };
  
  // Position parachute above the rocket in world space
  const worldX = pos.x / SCALE;
  const worldY = pos.z / SCALE; // Physics z = Three.js y
  const worldZ = -pos.y / SCALE;
  
  return (
    <>
      {/* Main parachute */}
      {flightState.mainDeployed && (
        <group position={[worldX, worldY + 0.8, worldZ]}>
          {/* Canopy - hemisphere opening downward (dome shape) */}
          <mesh>
            <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#FF4444" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          {/* Shroud lines connecting to rocket */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <Line
              key={i}
              points={[
                [Math.sin(angle * Math.PI / 180) * 0.35, -0.05, Math.cos(angle * Math.PI / 180) * 0.35],
                [0, -0.8, 0]
              ]}
              color="#FFFFFF"
              lineWidth={1}
            />
          ))}
        </group>
      )}
      
      {/* Drogue parachute */}
      {flightState.drogueDeployed && !flightState.mainDeployed && (
        <group position={[worldX, worldY + 0.5, worldZ]}>
          {/* Smaller drogue canopy - dome opening downward */}
          <mesh>
            <sphereGeometry args={[0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#FF8800" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          {/* Shroud lines */}
          {[0, 90, 180, 270].map((angle, i) => (
            <Line
              key={i}
              points={[
                [Math.sin(angle * Math.PI / 180) * 0.12, -0.02, Math.cos(angle * Math.PI / 180) * 0.12],
                [0, -0.5, 0]
              ]}
              color="#FFFFFF"
              lineWidth={1}
            />
          ))}
        </group>
      )}
    </>
  );
}

// Ground and environment
function Environment({ maxAltitude }) {
  const SCALE = 100; // 1 Three.js unit = 100 meters
  const groundSize = Math.max(20, maxAltitude / SCALE * 2);
  
  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>
      
      {/* Grid */}
      <gridHelper args={[groundSize, 40, '#446644', '#334433']} position={[0, 0.01, 0]} />
      
      {/* Launch rail */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.8} />
      </mesh>
      
      {/* Altitude markers */}
      {[100, 200, 500, 1000, 2000].filter(h => h < maxAltitude * 1.2).map(height => (
        <group key={height} position={[0, height / SCALE, 0]}>
          <Text
            position={[2, 0, 0]}
            fontSize={0.15}
            color="#FFFFFF"
            anchorX="left"
          >
            {height}m
          </Text>
        </group>
      ))}
    </>
  );
}

// Flight path trail
function FlightTrail({ history }) {
  if (!history || history.altitude.length < 2) return null;
  
  const SCALE = 100; // 1 Three.js unit = 100 meters
  
  // Use actual 3D positions if available, otherwise just altitude
  const points = history.altitude.map((alt, i) => {
    const x = (history.positionX?.[i] || 0) / SCALE;
    const y = (history.positionZ?.[i] || alt) / SCALE; // z is altitude in physics, y is up in Three.js
    const z = -(history.positionY?.[i] || 0) / SCALE; // Negate Y for Three.js convention
    return [x, y, z];
  });
  
  return (
    <Line
      points={points}
      color="#44AAFF"
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
}

// Camera controller that follows rocket
function CameraController({ flightState, viewMode }) {
  const cameraRef = useRef();
  const SCALE = 100; // 1 Three.js unit = 100 meters
  
  useFrame(() => {
    if (!cameraRef.current || !flightState) return;
    
    // Convert physics coordinates to Three.js (physics z=up -> Three.js y=up)
    const pos = flightState.position || { x: 0, y: 0, z: 0 };
    const rocketX = pos.x / SCALE;
    const rocketY = pos.z / SCALE;
    const rocketZ = -pos.y / SCALE;
    
    if (viewMode === 'follow') {
      // Follow camera - offset behind and above rocket
      cameraRef.current.position.lerp(
        new THREE.Vector3(rocketX + 5, rocketY + 2, rocketZ + 5),
        0.05
      );
      cameraRef.current.lookAt(rocketX, rocketY, rocketZ);
    } else if (viewMode === 'ground') {
      // Ground tracking view
      cameraRef.current.position.set(10, 2, 10);
      cameraRef.current.lookAt(rocketX, Math.min(rocketY, 30), rocketZ);
    }
  });
  
  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[10, 5, 10]}
      fov={60}
    />
  );
}

// Telemetry HUD
function TelemetryHUD({ flightState }) {
  if (!flightState) return null;
  
  const formatTime = (t) => t.toFixed(2) + 's';
  const formatAlt = (a) => a.toFixed(1) + 'm';
  const formatVel = (v) => v.toFixed(1) + 'm/s';
  const formatG = (g) => (g / 9.81).toFixed(2) + 'G';
  
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'boost': return '#FF6600';
      case 'coast': return '#FFAA00';
      case 'drogue': return '#FF8844';
      case 'main': return '#44FF44';
      case 'landed': return '#4488FF';
      default: return '#FFFFFF';
    }
  };
  
  return (
    <div className="telemetry-hud">
      <div className="telemetry-grid">
        <div className="telemetry-item">
          <span className="label">TIME</span>
          <span className="value">{formatTime(flightState.time)}</span>
        </div>
        <div className="telemetry-item">
          <span className="label">ALTITUDE</span>
          <span className="value">{formatAlt(flightState.altitude)}</span>
        </div>
        <div className="telemetry-item">
          <span className="label">VELOCITY</span>
          <span className="value">{formatVel(flightState.speed)}</span>
        </div>
        <div className="telemetry-item">
          <span className="label">MACH</span>
          <span className="value">{flightState.mach.toFixed(3)}</span>
        </div>
        <div className="telemetry-item">
          <span className="label">ACCEL</span>
          <span className="value">{formatG(flightState.acceleration?.z || 0)}</span>
        </div>
        <div className="telemetry-item">
          <span className="label">THRUST</span>
          <span className="value">{flightState.thrust.toFixed(1)}N</span>
        </div>
      </div>
      
      <div className="phase-indicator" style={{ borderColor: getPhaseColor(flightState.phase) }}>
        <span style={{ color: getPhaseColor(flightState.phase) }}>
          {flightState.phase.toUpperCase()}
        </span>
      </div>
      
      <div className="event-indicators">
        {flightState.apogeeReached && (
          <div className="event apogee">
            APOGEE: {flightState.apogeeAltitude.toFixed(1)}m
          </div>
        )}
        {flightState.drogueDeployed && (
          <div className="event drogue">DROGUE DEPLOYED</div>
        )}
        {flightState.mainDeployed && (
          <div className="event main">MAIN DEPLOYED</div>
        )}
        {flightState.landed && (
          <div className="event landed">LANDED</div>
        )}
      </div>
    </div>
  );
}

// Flight Charts
function FlightCharts({ history }) {
  const canvasRef = useRef();
  
  useEffect(() => {
    if (!canvasRef.current || !history || history.time.length < 2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw altitude
    const maxAlt = Math.max(...history.altitude, 100);
    const maxTime = Math.max(...history.time, 10);
    
    ctx.strokeStyle = '#44AAFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.altitude.forEach((alt, i) => {
      const x = (history.time[i] / maxTime) * (width - 40) + 20;
      const y = height - 20 - (alt / maxAlt) * (height - 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw velocity
    const maxVel = Math.max(...history.velocity, 100);
    ctx.strokeStyle = '#FF6644';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.velocity.forEach((vel, i) => {
      const x = (history.time[i] / maxTime) * (width - 40) + 20;
      const y = height - 20 - (vel / maxVel) * (height - 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#44AAFF';
    ctx.font = '12px sans-serif';
    ctx.fillText('Altitude', 25, 20);
    ctx.fillStyle = '#FF6644';
    ctx.fillText('Velocity', 90, 20);
    
  }, [history]);
  
  return (
    <div className="flight-charts">
      <canvas ref={canvasRef} width={300} height={150} />
    </div>
  );
}

// Results Panel
function ResultsPanel({ flightState, onReset, onBack }) {
  if (!flightState) return null;
  
  return (
    <div className="results-panel">
      <h2>Flight Results</h2>
      
      <div className="results-grid">
        <div className="result-item highlight">
          <span className="label">Apogee</span>
          <span className="value">{flightState.apogeeAltitude.toFixed(1)} m</span>
          <span className="sub">({(flightState.apogeeAltitude * 3.281).toFixed(0)} ft)</span>
        </div>
        
        <div className="result-item">
          <span className="label">Max Velocity</span>
          <span className="value">{flightState.maxVelocity.toFixed(1)} m/s</span>
          <span className="sub">({(flightState.maxVelocity * 2.237).toFixed(1)} mph)</span>
        </div>
        
        <div className="result-item">
          <span className="label">Max Mach</span>
          <span className="value">{flightState.maxMach.toFixed(3)}</span>
        </div>
        
        <div className="result-item">
          <span className="label">Max Acceleration</span>
          <span className="value">{(flightState.maxAcceleration / 9.81).toFixed(1)} G</span>
        </div>
        
        <div className="result-item">
          <span className="label">Rail Exit Velocity</span>
          <span className="value">{flightState.railExitVelocity.toFixed(1)} m/s</span>
        </div>
        
        <div className="result-item">
          <span className="label">Time to Apogee</span>
          <span className="value">{flightState.apogeeTime.toFixed(2)} s</span>
        </div>
        
        <div className="result-item">
          <span className="label">Total Flight Time</span>
          <span className="value">{flightState.time.toFixed(2)} s</span>
        </div>
        
        <div className="result-item">
          <span className="label">Stability at Launch</span>
          <span className="value">{flightState.stability?.stabilityMargin?.toFixed(2)} cal</span>
        </div>
      </div>
      
      <div className="results-actions">
        <button className="btn-secondary" onClick={onReset}>
          Fly Again
        </button>
        <button className="btn-primary" onClick={onBack}>
          Back to Builder
        </button>
      </div>
    </div>
  );
}

// Main Flight Simulation Component
export default function FlightSimulation() {
  const { 
    flightState, 
    isFlying, 
    stepFlight, 
    resetFlight,
    initFlightSimulation,
    launchRocket,
    rocketConfig,
    viewMode,
    setViewMode,
    runSimulationToCompletion,
    timeScale,
    setTimeScale,
  } = useRocketStore();
  
  const { setCurrentPage } = useMotorStore();
  const [cameraMode, setCameraMode] = useState('follow');
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  
  // Animation loop
  useEffect(() => {
    if (!isFlying) return;
    
    const animate = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;
      
      // Only step if we have a valid positive delta time
      if (deltaTime > 0.001) {
        stepFlight(deltaTime);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlying, stepFlight]);
  
  const handleRelaunch = () => {
    resetFlight();
    initFlightSimulation();
    launchRocket();
  };
  
  const handleBackToBuilder = () => {
    setViewMode('builder');
  };
  
  const handleSkipToEnd = () => {
    runSimulationToCompletion();
  };
  
  const maxAltitude = flightState?.apogeeAltitude || flightState?.altitude || 500;
  
  return (
    <div className="flight-simulation">
      <header className="flight-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBackToBuilder}>
            ← Back to Designer
          </button>
          <img src="/Screenshot_2026-03-07_070651-removebg-preview.png" alt="IGNITION" className="flight-logo" />
          <span className="page-title">Flight Simulation</span>
        </div>
        
        <div className="header-controls">
          <div className="time-scale-control">
            <label>Time Scale:</label>
            <select value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))}>
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
          
          <div className="camera-control">
            <label>Camera:</label>
            <select value={cameraMode} onChange={(e) => setCameraMode(e.target.value)}>
              <option value="follow">Follow</option>
              <option value="ground">Ground</option>
              <option value="free">Free</option>
            </select>
          </div>
          
          {isFlying && (
            <button className="skip-btn" onClick={handleSkipToEnd}>
              Skip to End →
            </button>
          )}
        </div>
      </header>
      
      <div className="flight-content">
        <div className="flight-3d">
          <Canvas>
            <CameraController flightState={flightState} viewMode={cameraMode} />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} />
            
            <Sky sunPosition={[100, 50, 100]} />
            
            <Environment maxAltitude={maxAltitude} />
            <FlightTrail history={flightState?.history} />
            <Rocket3D flightState={flightState} rocketConfig={rocketConfig} />
            <ParachuteDisplay flightState={flightState} />
            
            {cameraMode === 'free' && (
              <OrbitControls enablePan enableZoom enableRotate />
            )}
          </Canvas>
        </div>
        
        <div className="flight-overlay">
          <TelemetryHUD flightState={flightState} />
          
          {flightState?.history && (
            <FlightCharts history={flightState.history} />
          )}
        </div>
        
        {viewMode === 'results' && (
          <ResultsPanel 
            flightState={flightState}
            onReset={handleRelaunch}
            onBack={handleBackToBuilder}
          />
        )}
      </div>
    </div>
  );
}
