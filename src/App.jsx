/**
 * Main App Component
 * 3D Solid Rocket Motor Simulator with Full Rocket Flight Simulation
 */
import React from 'react';
import { Leva } from 'leva';
import Scene from './components/3d/Scene';
import ControlPanel from './components/ui/ControlPanel';
import Charts from './components/ui/Charts';
import StatusDisplay from './components/ui/StatusDisplay';
import ReportPage from './components/ui/ReportPage';
import RocketBuilder from './components/ui/RocketBuilder';
import FlightSimulation from './components/ui/FlightSimulation';
import useMotorStore from './store/motorStore';
import useRocketStore from './store/rocketStore';
import './App.css';

function App() {
  const { currentPage } = useMotorStore();
  const { viewMode } = useRocketStore();
  
  // Render Report Page
  if (currentPage === 'report') {
    return <ReportPage />;
  }
  
  // Render Rocket Builder
  if (currentPage === 'rocket') {
    // Check if we're in flight mode
    if (viewMode === 'flight' || viewMode === 'results') {
      return <FlightSimulation />;
    }
    try {
      return <RocketBuilder />;
    } catch (error) {
      console.error('Error rendering RocketBuilder:', error);
      return (
        <div style={{ padding: '40px', color: 'red', background: '#1a1a2e', minHeight: '100vh' }}>
          <h2>Error loading Rocket Builder</h2>
          <pre>{error.message}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
  }
  
  // Render Simulator (default)
  const { setCurrentPage } = useMotorStore();
  
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 Solid Motor Simulator</h1>
          <p className="subtitle">Real-time 3D Propulsion Analysis</p>
        </div>
        <div className="header-controls">
          <button 
            className="rocket-builder-btn"
            onClick={() => setCurrentPage('rocket')}
          >
            🚀 Build Rocket
          </button>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
          >
            View Source
          </a>
        </div>
      </header>
      
      {/* Main 3D Canvas */}
      <main className="canvas-container">
        <Scene />
        
        {/* UI Overlays */}
        <Charts />
        <StatusDisplay />
        
        {/* Instructions Overlay */}
        <div className="instructions">
          <p>🖱️ <strong>Orbit:</strong> Left-click + drag</p>
          <p>🔍 <strong>Zoom:</strong> Scroll wheel</p>
          <p>🎯 <strong>Pan:</strong> Right-click + drag</p>
        </div>
      </main>
      
      {/* Leva Control Panel */}
      <Leva 
        collapsed={false}
        flat={false}
        theme={{
          colors: {
            elevation1: '#1a1a2e',
            elevation2: '#232340',
            elevation3: '#2d2d50',
            accent1: '#FF6B35',
            accent2: '#FF8855',
            accent3: '#FFAA77',
            highlight1: '#FFFFFF',
            highlight2: '#CCCCCC',
            highlight3: '#AAAAAA',
          },
          fontSizes: {
            root: '11px',
          },
          space: {
            sm: '6px',
            md: '10px',
            rowGap: '7px',
            colGap: '7px',
          },
        }}
        titleBar={{
          title: '⚙️ Motor Configuration',
        }}
      />
      <ControlPanel />
      
      {/* Footer */}
      <footer className="app-footer">
        <span>Built with React Three Fiber | Physics simulation for educational purposes</span>
      </footer>
    </div>
  );
}

export default App;
