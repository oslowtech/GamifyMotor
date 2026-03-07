/**
 * Rocket Builder Component
 * Comprehensive UI for designing custom rockets
 */
import React, { useEffect, Suspense, Component } from 'react';
import useRocketStore, { BODY_MATERIALS, NOSE_SHAPES, FIN_SHAPES } from '../../store/rocketStore';
import useMotorStore from '../../store/motorStore';
import RocketPreview3D from '../3d/RocketPreview3D';
import './RocketBuilder.css';

// Error Boundary for catching render errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('RocketBuilder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          color: '#ff6b6b', 
          background: '#1a1a2e',
          minHeight: '100vh'
        }}>
          <h2>Something went wrong in Rocket Builder</h2>
          <pre style={{ 
            background: '#232340', 
            padding: '20px', 
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#FF6B35',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Tab Components
function NoseConeTab() {
  const { rocketConfig, updateNoseCone } = useRocketStore();
  
  // Safety check
  if (!rocketConfig?.noseCone) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { noseCone } = rocketConfig;
  
  return (
    <div className="config-section">
      <h3>Nose Cone Configuration</h3>
      
      <div className="config-row">
        <label>Shape</label>
        <select 
          value={noseCone.shape} 
          onChange={(e) => updateNoseCone({ shape: e.target.value })}
        >
          {Object.entries(NOSE_SHAPES).map(([key, shape]) => (
            <option key={key} value={key}>{shape.name}</option>
          ))}
        </select>
      </div>
      
      <div className="config-row">
        <label>Length (mm)</label>
        <input 
          type="range" 
          min="50" 
          max="400" 
          value={noseCone.length * 1000}
          onChange={(e) => updateNoseCone({ length: e.target.value / 1000 })}
        />
        <span className="value">{(noseCone.length * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Diameter (mm)</label>
        <input 
          type="range" 
          min="20" 
          max="150" 
          value={noseCone.diameter * 1000}
          onChange={(e) => updateNoseCone({ diameter: e.target.value / 1000 })}
        />
        <span className="value">{(noseCone.diameter * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Material</label>
        <select 
          value={noseCone.material} 
          onChange={(e) => updateNoseCone({ material: e.target.value })}
        >
          {Object.entries(BODY_MATERIALS).map(([key, mat]) => (
            <option key={key} value={key}>{mat.name}</option>
          ))}
        </select>
      </div>
      
      <div className="config-row">
        <label>Mass (g)</label>
        <input 
          type="range" 
          min="10" 
          max="500" 
          value={noseCone.mass * 1000}
          onChange={(e) => updateNoseCone({ mass: e.target.value / 1000 })}
        />
        <span className="value">{(noseCone.mass * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Shoulder Length (mm)</label>
        <input 
          type="range" 
          min="10" 
          max="100" 
          value={noseCone.shoulderLength * 1000}
          onChange={(e) => updateNoseCone({ shoulderLength: e.target.value / 1000 })}
        />
        <span className="value">{(noseCone.shoulderLength * 1000).toFixed(0)}</span>
      </div>
    </div>
  );
}

function BodyTubesTab() {
  const { rocketConfig, updateBodyTube, addBodyTube, removeBodyTube } = useRocketStore();
  
  if (!rocketConfig?.bodyTubes) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { bodyTubes, noseCone } = rocketConfig;
  
  return (
    <div className="config-section">
      <h3>Body Tubes</h3>
      
      <div className="body-tubes-list">
        {bodyTubes.map((tube, index) => (
          <div key={tube.id} className="body-tube-item">
            <div className="tube-header">
              <input 
                type="text" 
                value={tube.name}
                onChange={(e) => updateBodyTube(tube.id, { name: e.target.value })}
                className="tube-name-input"
              />
              {bodyTubes.length > 1 && (
                <button 
                  className="remove-btn" 
                  onClick={() => removeBodyTube(tube.id)}
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="config-row">
              <label>Length (mm)</label>
              <input 
                type="range" 
                min="30" 
                max="500" 
                value={tube.length * 1000}
                onChange={(e) => updateBodyTube(tube.id, { length: e.target.value / 1000 })}
              />
              <span className="value">{(tube.length * 1000).toFixed(0)}</span>
            </div>
            
            <div className="config-row">
              <label>Outer Diameter (mm)</label>
              <input 
                type="range" 
                min="20" 
                max="150" 
                value={tube.outerDiameter * 1000}
                onChange={(e) => updateBodyTube(tube.id, { outerDiameter: e.target.value / 1000 })}
              />
              <span className="value">{(tube.outerDiameter * 1000).toFixed(0)}</span>
            </div>
            
            <div className="config-row">
              <label>Wall Thickness (mm)</label>
              <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.1"
                value={tube.wallThickness * 1000}
                onChange={(e) => updateBodyTube(tube.id, { wallThickness: e.target.value / 1000 })}
              />
              <span className="value">{(tube.wallThickness * 1000).toFixed(1)}</span>
            </div>
            
            <div className="config-row">
              <label>Material</label>
              <select 
                value={tube.material} 
                onChange={(e) => updateBodyTube(tube.id, { material: e.target.value })}
              >
                {Object.entries(BODY_MATERIALS).map(([key, mat]) => (
                  <option key={key} value={key}>{mat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="config-row">
              <label>Position from Nose (mm)</label>
              <input 
                type="range" 
                min="0" 
                max="1500" 
                value={tube.position * 1000}
                onChange={(e) => updateBodyTube(tube.id, { position: e.target.value / 1000 })}
              />
              <span className="value">{(tube.position * 1000).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="add-btn" onClick={() => addBodyTube()}>
        + Add Body Section
      </button>
    </div>
  );
}

function FinsTab() {
  const { rocketConfig, updateFins, updateCanards } = useRocketStore();
  
  if (!rocketConfig?.fins) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { fins, canards } = rocketConfig;
  
  return (
    <div className="config-section">
      <h3>Fin Configuration</h3>
      
      <div className="config-row">
        <label>Number of Fins</label>
        <select 
          value={fins.count} 
          onChange={(e) => updateFins({ count: parseInt(e.target.value) })}
        >
          <option value={3}>3 Fins</option>
          <option value={4}>4 Fins</option>
          <option value={6}>6 Fins</option>
        </select>
      </div>
      
      <div className="config-row">
        <label>Fin Shape</label>
        <select 
          value={fins.shape} 
          onChange={(e) => updateFins({ shape: e.target.value })}
        >
          <option value={FIN_SHAPES.TRAPEZOIDAL}>Trapezoidal</option>
          <option value={FIN_SHAPES.CLIPPED_DELTA}>Clipped Delta</option>
          <option value={FIN_SHAPES.ELLIPTICAL}>Elliptical</option>
          <option value={FIN_SHAPES.RECTANGULAR}>Rectangular</option>
        </select>
      </div>
      
      <div className="config-row">
        <label>Root Chord (mm)</label>
        <input 
          type="range" 
          min="30" 
          max="200" 
          value={fins.rootChord * 1000}
          onChange={(e) => updateFins({ rootChord: e.target.value / 1000 })}
        />
        <span className="value">{(fins.rootChord * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Tip Chord (mm)</label>
        <input 
          type="range" 
          min="10" 
          max="150" 
          value={fins.tipChord * 1000}
          onChange={(e) => updateFins({ tipChord: e.target.value / 1000 })}
        />
        <span className="value">{(fins.tipChord * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Span (mm)</label>
        <input 
          type="range" 
          min="20" 
          max="150" 
          value={fins.span * 1000}
          onChange={(e) => updateFins({ span: e.target.value / 1000 })}
        />
        <span className="value">{(fins.span * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Sweep Angle (°)</label>
        <input 
          type="range" 
          min="0" 
          max="60" 
          value={fins.sweepAngle}
          onChange={(e) => updateFins({ sweepAngle: parseFloat(e.target.value) })}
        />
        <span className="value">{fins.sweepAngle.toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Thickness (mm)</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="0.5"
          value={fins.thickness * 1000}
          onChange={(e) => updateFins({ thickness: e.target.value / 1000 })}
        />
        <span className="value">{(fins.thickness * 1000).toFixed(1)}</span>
      </div>
      
      <div className="config-row">
        <label>Position from Nose (mm)</label>
        <input 
          type="range" 
          min="200" 
          max="1500" 
          value={fins.position * 1000}
          onChange={(e) => updateFins({ position: e.target.value / 1000 })}
        />
        <span className="value">{(fins.position * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Material</label>
        <select 
          value={fins.material} 
          onChange={(e) => updateFins({ material: e.target.value })}
        >
          {Object.entries(BODY_MATERIALS).map(([key, mat]) => (
            <option key={key} value={key}>{mat.name}</option>
          ))}
        </select>
      </div>
      
      {/* Canards Section */}
      <h3 className="subsection-title">Canards (Optional)</h3>
      
      <div className="config-row">
        <label>Enable Canards</label>
        <input 
          type="checkbox" 
          checked={canards?.enabled || false}
          onChange={(e) => updateCanards({ enabled: e.target.checked })}
        />
      </div>
      
      {canards?.enabled && (
        <>
          <div className="config-row">
            <label>Number of Canards</label>
            <select 
              value={canards.count || 4} 
              onChange={(e) => updateCanards({ count: parseInt(e.target.value) })}
            >
              <option value={2}>2 Canards</option>
              <option value={4}>4 Canards</option>
            </select>
          </div>
          
          <div className="config-row">
            <label>Root Chord (mm)</label>
            <input 
              type="range" 
              min="10" 
              max="60" 
              value={(canards.rootChord || 0.03) * 1000}
              onChange={(e) => updateCanards({ rootChord: e.target.value / 1000 })}
            />
            <span className="value">{((canards.rootChord || 0.03) * 1000).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Span (mm)</label>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={(canards.span || 0.025) * 1000}
              onChange={(e) => updateCanards({ span: e.target.value / 1000 })}
            />
            <span className="value">{((canards.span || 0.025) * 1000).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Position from Nose (mm)</label>
            <input 
              type="range" 
              min="50" 
              max="300" 
              value={(canards.position || 0.12) * 1000}
              onChange={(e) => updateCanards({ position: e.target.value / 1000 })}
            />
            <span className="value">{((canards.position || 0.12) * 1000).toFixed(0)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function RecoveryTab() {
  const { rocketConfig, updateRecovery } = useRocketStore();
  
  if (!rocketConfig?.recovery) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { recovery } = rocketConfig;
  
  return (
    <div className="config-section">
      <h3>Recovery System</h3>
      
      <div className="config-row">
        <label>Deployment Type</label>
        <select 
          value={recovery.type} 
          onChange={(e) => updateRecovery({ type: e.target.value })}
        >
          <option value="single">Single Deployment (Main at Apogee)</option>
          <option value="dual">Dual Deployment (Drogue + Main)</option>
        </select>
      </div>
      
      {recovery.type === 'dual' && (
        <>
          <h4 className="recovery-section-title">Drogue Chute</h4>
          
          <div className="config-row">
            <label>Enable Drogue</label>
            <input 
              type="checkbox" 
              checked={recovery.drogue?.enabled ?? true}
              onChange={(e) => updateRecovery({ drogue: { enabled: e.target.checked } })}
            />
          </div>
          
          {recovery.drogue?.enabled && (
            <>
              <div className="config-row">
                <label>Diameter (cm)</label>
                <input 
                  type="range" 
                  min="15" 
                  max="100" 
                  value={(recovery.drogue?.diameter || 0.3) * 100}
                  onChange={(e) => updateRecovery({ drogue: { diameter: e.target.value / 100 } })}
                />
                <span className="value">{((recovery.drogue?.diameter || 0.3) * 100).toFixed(0)}</span>
              </div>
              
              <div className="config-row">
                <label>Drag Coefficient</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  value={recovery.drogue?.cd || 1.2}
                  onChange={(e) => updateRecovery({ drogue: { cd: parseFloat(e.target.value) } })}
                />
                <span className="value">{(recovery.drogue?.cd || 1.2).toFixed(1)}</span>
              </div>
            </>
          )}
        </>
      )}
      
      <h4 className="recovery-section-title">Main Parachute</h4>
      
      <div className="config-row">
        <label>Enable Main Chute</label>
        <input 
          type="checkbox" 
          checked={recovery.main?.enabled ?? true}
          onChange={(e) => updateRecovery({ main: { enabled: e.target.checked } })}
        />
      </div>
      
      {recovery.main?.enabled && (
        <>
          <div className="config-row">
            <label>Diameter (cm)</label>
            <input 
              type="range" 
              min="30" 
              max="300" 
              value={(recovery.main?.diameter || 0.9) * 100}
              onChange={(e) => updateRecovery({ main: { diameter: e.target.value / 100 } })}
            />
            <span className="value">{((recovery.main?.diameter || 0.9) * 100).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Drag Coefficient</label>
            <input 
              type="range" 
              min="0.8" 
              max="2.5" 
              step="0.1"
              value={recovery.main?.cd || 1.5}
              onChange={(e) => updateRecovery({ main: { cd: parseFloat(e.target.value) } })}
            />
            <span className="value">{(recovery.main?.cd || 1.5).toFixed(1)}</span>
          </div>
          
          {recovery.type === 'dual' && (
            <div className="config-row">
              <label>Deploy Altitude (m AGL)</label>
              <input 
                type="range" 
                min="50" 
                max="500" 
                step="10"
                value={recovery.main?.deployAltitude || 150}
                onChange={(e) => updateRecovery({ main: { deployAltitude: parseInt(e.target.value) } })}
              />
              <span className="value">{recovery.main?.deployAltitude || 150}</span>
            </div>
          )}
        </>
      )}
      
      <h4 className="recovery-section-title">Streamer (Alternative)</h4>
      
      <div className="config-row">
        <label>Use Streamer Instead</label>
        <input 
          type="checkbox" 
          checked={recovery.streamer?.enabled ?? false}
          onChange={(e) => updateRecovery({ streamer: { enabled: e.target.checked } })}
        />
      </div>
      
      {recovery.streamer?.enabled && (
        <>
          <div className="config-row">
            <label>Length (cm)</label>
            <input 
              type="range" 
              min="30" 
              max="200" 
              value={(recovery.streamer?.length || 1.0) * 100}
              onChange={(e) => updateRecovery({ streamer: { length: e.target.value / 100 } })}
            />
            <span className="value">{((recovery.streamer?.length || 1.0) * 100).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Width (cm)</label>
            <input 
              type="range" 
              min="2" 
              max="15" 
              value={(recovery.streamer?.width || 0.05) * 100}
              onChange={(e) => updateRecovery({ streamer: { width: e.target.value / 100 } })}
            />
            <span className="value">{((recovery.streamer?.width || 0.05) * 100).toFixed(0)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function AvionicsTab() {
  const { rocketConfig, updateAvionics, updatePayload, updateCamera } = useRocketStore();
  
  if (!rocketConfig?.avionics) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { avionics, payload, camera } = rocketConfig;
  
  return (
    <div className="config-section">
      <h3>Payload</h3>
      
      <div className="config-row">
        <label>Payload Mass (g)</label>
        <input 
          type="range" 
          min="0" 
          max="1000" 
          value={payload.mass * 1000}
          onChange={(e) => updatePayload({ mass: e.target.value / 1000 })}
        />
        <span className="value">{(payload.mass * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Position from Nose (mm)</label>
        <input 
          type="range" 
          min="0" 
          max="200" 
          value={payload.position * 1000}
          onChange={(e) => updatePayload({ position: e.target.value / 1000 })}
        />
        <span className="value">{(payload.position * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Description</label>
        <input 
          type="text" 
          value={payload.description || ''}
          onChange={(e) => updatePayload({ description: e.target.value })}
          placeholder="e.g., Altimeter, Tracker"
        />
      </div>
      
      <h3>Avionics Bay</h3>
      
      <div className="config-row">
        <label>Enable Avionics</label>
        <input 
          type="checkbox" 
          checked={avionics.enabled}
          onChange={(e) => updateAvionics({ enabled: e.target.checked })}
        />
      </div>
      
      {avionics.enabled && (
        <>
          <div className="config-row">
            <label>Avionics Mass (g)</label>
            <input 
              type="range" 
              min="10" 
              max="300" 
              value={avionics.mass * 1000}
              onChange={(e) => updateAvionics({ mass: e.target.value / 1000 })}
            />
            <span className="value">{(avionics.mass * 1000).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Position from Nose (mm)</label>
            <input 
              type="range" 
              min="100" 
              max="800" 
              value={avionics.position * 1000}
              onChange={(e) => updateAvionics({ position: e.target.value / 1000 })}
            />
            <span className="value">{(avionics.position * 1000).toFixed(0)}</span>
          </div>
          
          <div className="avionics-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={avionics.altimeter}
                onChange={(e) => updateAvionics({ altimeter: e.target.checked })}
              />
              Altimeter
            </label>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={avionics.accelerometer}
                onChange={(e) => updateAvionics({ accelerometer: e.target.checked })}
              />
              Accelerometer
            </label>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={avionics.gps}
                onChange={(e) => updateAvionics({ gps: e.target.checked })}
              />
              GPS Tracker
            </label>
          </div>
        </>
      )}
      
      <h3>Camera</h3>
      
      <div className="config-row">
        <label>Enable Camera</label>
        <input 
          type="checkbox" 
          checked={camera?.enabled ?? false}
          onChange={(e) => updateCamera({ enabled: e.target.checked })}
        />
      </div>
      
      {camera?.enabled && (
        <>
          <div className="config-row">
            <label>Camera Mass (g)</label>
            <input 
              type="range" 
              min="10" 
              max="150" 
              value={(camera.mass || 0.03) * 1000}
              onChange={(e) => updateCamera({ mass: e.target.value / 1000 })}
            />
            <span className="value">{((camera.mass || 0.03) * 1000).toFixed(0)}</span>
          </div>
          
          <div className="config-row">
            <label>Mount Type</label>
            <select 
              value={camera.type || 'side-mount'} 
              onChange={(e) => updateCamera({ type: e.target.value })}
            >
              <option value="side-mount">Side Mount</option>
              <option value="nose-down">Nose Down-Looking</option>
              <option value="fin-cam">Fin Camera</option>
            </select>
          </div>
          
          <div className="config-row">
            <label>Position from Nose (mm)</label>
            <input 
              type="range" 
              min="50" 
              max="600" 
              value={(camera.position || 0.3) * 1000}
              onChange={(e) => updateCamera({ position: e.target.value / 1000 })}
            />
            <span className="value">{((camera.position || 0.3) * 1000).toFixed(0)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function MotorTab() {
  const { rocketConfig, updateMotorMount, updateLaunch, motorData, setMotorData } = useRocketStore();
  const { state: motorState, exportMotor } = useMotorStore();
  
  if (!rocketConfig?.motorMount) {
    return <div className="config-section"><p>Loading...</p></div>;
  }
  
  const { motorMount, launch } = rocketConfig;
  const fileInputRef = React.useRef(null);
  
  // Import motor data from motor simulator (direct)
  const importMotorFromSimulator = () => {
    // First try to get exported motor data
    const exported = exportMotor();
    if (exported) {
      setMotorData({
        name: exported.name,
        thrustCurve: exported.thrustCurve,
        totalImpulse: exported.classification.totalImpulse,
        propellantMass: exported.mass.propellant,
        motorMass: exported.mass.empty,
        burnTime: exported.classification.burnTime,
        maxThrust: exported.classification.maxThrust,
        motorClass: exported.classification.motorClass,
        averageThrust: exported.classification.averageThrust,
        specificImpulse: exported.performance.specificImpulse,
        diameter: exported.geometry.diameter,
        length: exported.geometry.length,
      });
      return;
    }
    
    // Fallback to basic state import
    if (motorState && motorState.history && motorState.history.time.length > 0) {
      const thrustCurve = motorState.history.time.map((t, i) => ({
        time: t,
        thrust: motorState.history.thrust[i],
      }));
      
      const propellant = motorState.config?.propellant;
      const grainConfig = motorState.config?.grainConfig;
      
      let propellantMass = 0.1;
      if (propellant && grainConfig) {
        const grainVolume = Math.PI * 
          (grainConfig.outerRadius ** 2 - grainConfig.coreRadius ** 2) * 
          grainConfig.length * 
          (grainConfig.segments || 1);
        propellantMass = grainVolume * propellant.density;
      }
      
      setMotorData({
        thrustCurve,
        totalImpulse: motorState.totalImpulse || 0,
        propellantMass,
        motorMass: 0.15,
        burnTime: motorState.burnTime || thrustCurve[thrustCurve.length - 1]?.time || 2,
        maxThrust: motorState.maxThrust || 0,
      });
    } else {
      alert('Please run the motor simulation first before importing!');
    }
  };
  
  // Import motor from JSON file
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate it's a motor file
        if (!data.thrustCurve || !data.classification) {
          throw new Error('Invalid motor file format');
        }
        
        setMotorData({
          name: data.name || 'Imported Motor',
          thrustCurve: data.thrustCurve,
          totalImpulse: data.classification.totalImpulse,
          propellantMass: data.mass?.propellant || 0.1,
          motorMass: data.mass?.empty || 0.1,
          burnTime: data.classification.burnTime,
          maxThrust: data.classification.maxThrust,
          motorClass: data.classification.motorClass,
          averageThrust: data.classification.averageThrust,
          specificImpulse: data.performance?.specificImpulse,
          diameter: data.geometry?.diameter,
          length: data.geometry?.length,
        });
      } catch (err) {
        alert('Error loading motor file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  return (
    <div className="config-section">
      <h3>Motor Mount</h3>
      
      <div className="config-row">
        <label>Motor Diameter (mm)</label>
        <select 
          value={motorMount.diameter * 1000} 
          onChange={(e) => updateMotorMount({ diameter: parseFloat(e.target.value) / 1000 })}
        >
          <option value="18">18mm (A-C)</option>
          <option value="24">24mm (D-E)</option>
          <option value="29">29mm (E-G)</option>
          <option value="38">38mm (G-I)</option>
          <option value="54">54mm (J-K)</option>
          <option value="75">75mm (K-M)</option>
          <option value="98">98mm (M-O)</option>
        </select>
      </div>
      
      <div className="config-row">
        <label>Mount Length (mm)</label>
        <input 
          type="range" 
          min="50" 
          max="500" 
          value={motorMount.length * 1000}
          onChange={(e) => updateMotorMount({ length: e.target.value / 1000 })}
        />
        <span className="value">{(motorMount.length * 1000).toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Position from Nose (mm)</label>
        <input 
          type="range" 
          min="200" 
          max="1500" 
          value={motorMount.position * 1000}
          onChange={(e) => updateMotorMount({ position: e.target.value / 1000 })}
        />
        <span className="value">{(motorMount.position * 1000).toFixed(0)}</span>
      </div>
      
      <div className="motor-import-section">
        <h4>Load Motor</h4>
        
        <div className="import-buttons">
          <button className="import-motor-btn" onClick={importMotorFromSimulator}>
            Import from Simulator
          </button>
          
          <div className="file-import">
            <input 
              type="file" 
              accept=".json,.motor.json"
              ref={fileInputRef}
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
            <button 
              className="import-motor-btn secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Load from File
            </button>
          </div>
        </div>
        
        {motorData && (
          <div className="imported-motor-info">
            <h4>{motorData.name || `Class ${motorData.motorClass || '?'} Motor`}</h4>
            <div className="motor-stats">
              <div className="stat">
                <span className="stat-label">Class</span>
                <span className="stat-value">{motorData.motorClass || 'N/A'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Impulse</span>
                <span className="stat-value">{motorData.totalImpulse?.toFixed(1)} N·s</span>
              </div>
              <div className="stat">
                <span className="stat-label">Max Thrust</span>
                <span className="stat-value">{motorData.maxThrust?.toFixed(1)} N</span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Thrust</span>
                <span className="stat-value">{motorData.averageThrust?.toFixed(1) || 'N/A'} N</span>
              </div>
              <div className="stat">
                <span className="stat-label">Burn Time</span>
                <span className="stat-value">{motorData.burnTime?.toFixed(2)} s</span>
              </div>
              <div className="stat">
                <span className="stat-label">Propellant</span>
                <span className="stat-value">{(motorData.propellantMass * 1000).toFixed(0)} g</span>
              </div>
              <div className="stat">
                <span className="stat-label">Motor Mass</span>
                <span className="stat-value">{((motorData.motorMass + motorData.propellantMass) * 1000).toFixed(0)} g</span>
              </div>
              <div className="stat">
                <span className="stat-label">Isp</span>
                <span className="stat-value">{motorData.specificImpulse?.toFixed(0) || 'N/A'} s</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <h3>Launch Settings</h3>
      
      <div className="config-row">
        <label>Rail Length (m)</label>
        <input 
          type="range" 
          min="0.5" 
          max="3" 
          step="0.1"
          value={launch.railLength}
          onChange={(e) => updateLaunch({ railLength: parseFloat(e.target.value) })}
        />
        <span className="value">{launch.railLength.toFixed(1)}</span>
      </div>
      
      <div className="config-row">
        <label>Launch Angle (°)</label>
        <input 
          type="range" 
          min="0" 
          max="15" 
          value={launch.railAngle}
          onChange={(e) => updateLaunch({ railAngle: parseFloat(e.target.value) })}
        />
        <span className="value">{launch.railAngle.toFixed(0)}</span>
      </div>
      
      <div className="config-row">
        <label>Azimuth (°)</label>
        <input 
          type="range" 
          min="0" 
          max="360" 
          value={launch.railDirection}
          onChange={(e) => updateLaunch({ railDirection: parseFloat(e.target.value) })}
        />
        <span className="value">{launch.railDirection.toFixed(0)}</span>
      </div>
    </div>
  );
}

// Stability Display Component
function StabilityDisplay() {
  const { stability, rocketConfig } = useRocketStore();
  
  if (!stability || !rocketConfig?.noseCone) return null;
  
  const getStabilityColor = () => {
    if (stability.isUnstable) return '#FF4444';
    if (stability.isOverstable) return '#FFAA44';
    return '#44FF44';
  };
  
  const getStabilityText = () => {
    if (stability.isUnstable) return 'UNSTABLE';
    if (stability.isOverstable) return 'OVERSTABLE';
    return 'STABLE';
  };
  
  const stabilityMargin = stability.stabilityMargin ?? 0;
  const cg = stability.cg ?? 0;
  const cp = stability.cp ?? 0;
  const totalMass = stability.totalMass ?? 0;
  const diameter = rocketConfig.noseCone?.diameter ?? 0.054;
  
  return (
    <div className="stability-display">
      <h3>Stability Analysis</h3>
      
      <div className="stability-indicator" style={{ borderColor: getStabilityColor() }}>
        <span className="stability-value" style={{ color: getStabilityColor() }}>
          {stabilityMargin.toFixed(2)} cal
        </span>
        <span className="stability-status" style={{ color: getStabilityColor() }}>
          {getStabilityText()}
        </span>
      </div>
      
      <div className="stability-details">
        <div className="detail-row">
          <span>Center of Gravity (CG)</span>
          <span>{(cg * 1000).toFixed(1)} mm</span>
        </div>
        <div className="detail-row">
          <span>Center of Pressure (CP)</span>
          <span>{(cp * 1000).toFixed(1)} mm</span>
        </div>
        <div className="detail-row">
          <span>Total Mass</span>
          <span>{(totalMass * 1000).toFixed(0)} g</span>
        </div>
        <div className="detail-row">
          <span>Body Diameter</span>
          <span>{(diameter * 1000).toFixed(0)} mm</span>
        </div>
      </div>
      
      <p className="stability-note">
        Recommended: 1.0 - 2.0 calibers for optimal stability.
        {stabilityMargin < 1.0 && ' Add more fin area or move fins back.'}
        {stabilityMargin > 3.0 && ' Rocket may weathercock. Reduce fin size.'}
      </p>
    </div>
  );
}

// Main Rocket Builder Component
export default function RocketBuilder() {
  const { 
    activeTab, 
    setActiveTab, 
    calculateStability,
    initFlightSimulation,
    launchRocket,
    motorData,
    resetRocket,
    rocketConfig,
    show3DPreview,
    setShow3DPreview,
  } = useRocketStore();
  const { setCurrentPage } = useMotorStore();
  
  // Log for debugging
  React.useEffect(() => {
    console.log('RocketBuilder mounted');
    console.log('rocketConfig:', rocketConfig);
    console.log('activeTab:', activeTab);
  }, []);
  
  useEffect(() => {
    calculateStability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Safety check
  if (!rocketConfig) {
    return (
      <div style={{ 
        padding: '40px', 
        color: '#ff6b6b', 
        background: '#1a1a2e',
        minHeight: '100vh'
      }}>
        <h2>Loading rocket configuration...</h2>
        <p>If this persists, try refreshing the page.</p>
      </div>
    );
  }
  
  const handleStartFlight = () => {
    if (!motorData) {
      alert('Please import a motor from the motor simulator first!');
      return;
    }
    initFlightSimulation();
    launchRocket();
  };
  
  const tabs = [
    { id: 'nosecone', label: 'Nose Cone', icon: '▲' },
    { id: 'body', label: 'Body', icon: '▮' },
    { id: 'fins', label: 'Fins', icon: '◢' },
    { id: 'recovery', label: 'Recovery', icon: '⟡' },
    { id: 'avionics', label: 'Avionics', icon: '◉' },
    { id: 'motor', label: 'Motor', icon: '●' },
  ];
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'nosecone': return <NoseConeTab />;
      case 'body': return <BodyTubesTab />;
      case 'fins': return <FinsTab />;
      case 'recovery': return <RecoveryTab />;
      case 'avionics': return <AvionicsTab />;
      case 'motor': return <MotorTab />;
      default: return <NoseConeTab />;
    }
  };
  
  return (
    <ErrorBoundary>
    <div className="rocket-builder">
      <header className="builder-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setCurrentPage('simulator')}>
            ← Back to Motor Simulator
          </button>
          <img src="/Screenshot_2026-03-07_070651-removebg-preview.png" alt="IGNITION" className="builder-logo" />
          <span className="page-title">Rocket Designer</span>
        </div>
        <div className="header-actions">
          <button className="reset-btn" onClick={resetRocket}>
            Reset Design
          </button>
          <button 
            className="launch-btn" 
            onClick={handleStartFlight}
            disabled={!motorData}
          >
            Launch Simulation
          </button>
        </div>
      </header>
      
      <div className="builder-content">
        <div className="builder-sidebar">
          <nav className="tab-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="tab-content">
            {renderActiveTab()}
          </div>
        </div>
        
        <div className="builder-preview">
          <div className="preview-3d">
            {show3DPreview ? (
              <Suspense fallback={
                <div className="preview-loading">
                  Loading 3D Preview...
                </div>
              }>
                <RocketPreview3D />
              </Suspense>
            ) : (
              <div className="preview-loading" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '10px'
              }}>
                <p>3D Preview disabled</p>
                <button 
                  onClick={() => setShow3DPreview(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#FF6B35',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Enable 3D Preview
                </button>
              </div>
            )}
          </div>
          
          <StabilityDisplay />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
