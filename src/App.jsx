/**
 * Main App Component
 * 3D Solid Rocket Motor Simulator
 */
import React from 'react';
import { Leva } from 'leva';
import Scene from './components/3d/Scene';
import ControlPanel from './components/ui/ControlPanel';
import Charts from './components/ui/Charts';
import StatusDisplay from './components/ui/StatusDisplay';
import ReportPage from './components/ui/ReportPage';
import useMotorStore from './store/motorStore';
import './App.css';

function App() {
  const { currentPage } = useMotorStore();
  
  // Render Report Page
  if (currentPage === 'report') {
    return <ReportPage />;
  }
  
  // Render Simulator (default)
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 Solid Motor Simulator</h1>
          <p className="subtitle">Real-time 3D Propulsion Analysis</p>
        </div>
        <div className="header-controls">
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
