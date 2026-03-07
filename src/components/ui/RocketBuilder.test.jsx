/**
 * Minimal Rocket Builder Test - for debugging
 */
import React, { useState, Suspense, useEffect } from 'react';
import useMotorStore from '../../store/motorStore';
import useRocketStore from '../../store/rocketStore';

// Lazy load the real RocketBuilder
const RocketBuilderReal = React.lazy(() => import('./RocketBuilder'));

export default function RocketBuilderTest() {
  const [showReal, setShowReal] = useState(false);
  const [error, setError] = useState(null);
  const [storeStatus, setStoreStatus] = useState('checking...');
  const { setCurrentPage } = useMotorStore();
  
  // Check store status on mount
  useEffect(() => {
    try {
      const rocketStore = useRocketStore.getState();
      const motorStore = useMotorStore.getState();
      setStoreStatus(`Rocket config: ${rocketStore.rocketConfig ? 'OK' : 'MISSING'}, Motor store: ${motorStore ? 'OK' : 'MISSING'}`);
      console.log('Store check:', { rocketStore, motorStore });
    } catch (e) {
      setStoreStatus(`Error: ${e.message}`);
      console.error('Store check error:', e);
    }
  }, []);
  
  console.log('RocketBuilderTest rendering, showReal:', showReal);
  
  if (showReal) {
    return (
      <Suspense fallback={
        <div style={{ 
          padding: '40px', 
          color: 'white', 
          background: '#1a1a2e', 
          minHeight: '100vh' 
        }}>
          <h2>Loading Rocket Builder...</h2>
        </div>
      }>
        <ErrorBoundarySimple onError={setError}>
          <RocketBuilderReal />
        </ErrorBoundarySimple>
      </Suspense>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        color: '#ff6b6b', 
        background: '#1a1a2e', 
        minHeight: '100vh' 
      }}>
        <h2>Error Loading Rocket Builder</h2>
        <pre style={{ background: '#232340', padding: '20px', borderRadius: '8px' }}>
          {error.toString()}
        </pre>
        <button 
          onClick={() => { setError(null); setShowReal(false); }}
          style={buttonStyle}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: '40px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #0a0a15, #1a1a2e)', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px'
    }}>
      <h1>Rocket Builder Debug</h1>
      <p style={{ color: '#aaa' }}>Basic React rendering works.</p>
      <p style={{ color: '#88ff88', fontFamily: 'monospace' }}>Store Status: {storeStatus}</p>
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button 
          onClick={() => setShowReal(true)}
          style={{ ...buttonStyle, background: '#FF6B35' }}
        >
          Load Full Rocket Builder
        </button>
        <button 
          onClick={() => setCurrentPage('simulator')}
          style={{ ...buttonStyle, background: '#3366AA' }}
        >
          Back to Simulator
        </button>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '12px 24px',
  background: '#FF6B35',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

// Simple error boundary
class ErrorBoundarySimple extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rocket Builder Error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
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
          <h2>Something went wrong</h2>
          <pre style={{ background: '#232340', padding: '20px', borderRadius: '8px' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
