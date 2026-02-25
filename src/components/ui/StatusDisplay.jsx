/**
 * Status Display Component
 * Shows real-time motor telemetry and warnings
 */
import React from 'react';
import useMotorStore from '../../store/motorStore';
import './StatusDisplay.css';

export default function StatusDisplay() {
  const { state } = useMotorStore();
  
  if (!state) return null;
  
  const {
    time,
    chamberPressure,
    thrust,
    burnRate,
    safetyFactor,
    grainBurnProgress,
    isBurning,
    isBurnedOut,
    hasExploded,
    totalImpulse,
    config,
  } = state;
  
  // Format values with NaN protection
  const formatPressure = (p) => {
    const val = (p || 0) / 1e6;
    return isNaN(val) || !isFinite(val) ? '0.00' : val.toFixed(2);
  };
  const formatThrust = (t) => {
    const val = t || 0;
    return isNaN(val) || !isFinite(val) ? '0.0' : val.toFixed(1);
  };
  const formatBurnRate = (r) => {
    const val = r || 0;
    return isNaN(val) || !isFinite(val) ? '0.00' : val.toFixed(2);
  };
  const formatSF = (sf) => {
    if (!sf || isNaN(sf) || !isFinite(sf)) return '>10';
    return sf > 10 ? '>10' : sf.toFixed(2);
  };
  const formatImpulse = (i) => {
    const val = i || 0;
    return isNaN(val) || !isFinite(val) ? '0.0' : val.toFixed(1);
  };
  const formatProgress = (p) => {
    const val = (p || 0) * 100;
    return isNaN(val) || !isFinite(val) ? '0.0' : val.toFixed(1);
  };
  
  // Status indicators
  const getStatusClass = () => {
    if (hasExploded) return 'status-cato';
    if (isBurnedOut) return 'status-complete';
    if (isBurning) return 'status-burning';
    return 'status-ready';
  };
  
  const getStatusText = () => {
    if (hasExploded) return 'CATO - STRUCTURAL FAILURE';
    if (isBurnedOut) return 'BURNOUT COMPLETE';
    if (isBurning) return 'BURNING';
    return 'READY';
  };
  
  // Safety factor warning
  const getSafetyClass = () => {
    if (safetyFactor < 1) return 'danger';
    if (safetyFactor < 1.5) return 'warning';
    if (safetyFactor < 2) return 'caution';
    return 'safe';
  };
  
  return (
    <div className="status-display">
      {/* Main Status Banner */}
      <div className={`status-banner ${getStatusClass()}`}>
        <span className="status-indicator"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {/* CATO Warning Overlay */}
      {hasExploded && (
        <div className="cato-overlay">
          <div className="cato-text">
            <span className="cato-icon">💥</span>
            <span>CATO</span>
            <span className="cato-subtitle">Catastrophic Failure</span>
          </div>
        </div>
      )}
      
      {/* Telemetry Grid */}
      <div className="telemetry-grid">
        <div className="telemetry-item">
          <span className="telemetry-label">Time</span>
          <span className="telemetry-value">{time.toFixed(2)}<span className="unit">s</span></span>
        </div>
        
        <div className="telemetry-item">
          <span className="telemetry-label">Chamber Pressure</span>
          <span className="telemetry-value">{formatPressure(chamberPressure)}<span className="unit">MPa</span></span>
        </div>
        
        <div className="telemetry-item highlight">
          <span className="telemetry-label">Thrust</span>
          <span className="telemetry-value">{formatThrust(thrust)}<span className="unit">N</span></span>
        </div>
        
        <div className="telemetry-item">
          <span className="telemetry-label">Burn Rate</span>
          <span className="telemetry-value">{formatBurnRate(burnRate)}<span className="unit">mm/s</span></span>
        </div>
        
        <div className={`telemetry-item ${getSafetyClass()}`}>
          <span className="telemetry-label">Safety Factor</span>
          <span className="telemetry-value">{formatSF(safetyFactor)}</span>
        </div>
        
        <div className="telemetry-item">
          <span className="telemetry-label">Grain Consumed</span>
          <span className="telemetry-value">{formatProgress(grainBurnProgress)}<span className="unit">%</span></span>
        </div>
        
        <div className="telemetry-item wide">
          <span className="telemetry-label">Total Impulse</span>
          <span className="telemetry-value">{formatImpulse(totalImpulse)}<span className="unit">N·s</span></span>
        </div>
      </div>
      
      {/* Motor Class Classification */}
      <div className="motor-class">
        <span className="class-label">Motor Class:</span>
        <span className="class-value">{getMotorClass(totalImpulse)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="burn-progress">
        <div className="progress-label">Burn Progress</div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${grainBurnProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Classify motor by total impulse (NAR classification)
function getMotorClass(impulse) {
  if (impulse <= 0.625) return 'A';
  if (impulse <= 1.25) return 'A';
  if (impulse <= 2.5) return 'B';
  if (impulse <= 5) return 'C';
  if (impulse <= 10) return 'D';
  if (impulse <= 20) return 'E';
  if (impulse <= 40) return 'F';
  if (impulse <= 80) return 'G';
  if (impulse <= 160) return 'H';
  if (impulse <= 320) return 'I';
  if (impulse <= 640) return 'J';
  if (impulse <= 1280) return 'K';
  if (impulse <= 2560) return 'L';
  if (impulse <= 5120) return 'M';
  if (impulse <= 10240) return 'N';
  if (impulse <= 20480) return 'O';
  return 'P+';
}
