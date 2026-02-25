/**
 * Report Page Component
 * Displays comprehensive motor analysis with all graphs and downloadable report
 */
import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import useMotorStore from '../../store/motorStore';
import './ReportPage.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ReportPage() {
  const { state, setCurrentPage } = useMotorStore();
  const reportRef = useRef(null);
  
  const history = state?.history || {
    time: [],
    pressure: [],
    thrust: [],
    burnRate: [],
    innerRadius: [],
    Kn: [],
    stress: [],
  };
  
  const config = state?.config || {};
  
  // Sample data for better performance
  const maxPoints = 300;
  const sampledData = useMemo(() => {
    if (history.time.length <= maxPoints) {
      return history;
    }
    
    const step = Math.ceil(history.time.length / maxPoints);
    return {
      time: history.time.filter((_, i) => i % step === 0),
      pressure: history.pressure.filter((_, i) => i % step === 0),
      thrust: history.thrust.filter((_, i) => i % step === 0),
      burnRate: history.burnRate.filter((_, i) => i % step === 0),
      innerRadius: history.innerRadius.filter((_, i) => i % step === 0),
      Kn: history.Kn.filter((_, i) => i % step === 0),
      stress: history.stress.filter((_, i) => i % step === 0),
    };
  }, [history]);
  
  // Common chart options
  const createChartOptions = (title, yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333333',
          font: { size: 11, weight: 'bold' },
        },
      },
      title: {
        display: true,
        text: title,
        color: '#1a1a2e',
        font: { size: 14, weight: 'bold' },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time (s)',
          color: '#555555',
        },
        ticks: {
          color: '#666666',
          maxTicksLimit: 10,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
          color: '#555555',
        },
        ticks: {
          color: '#666666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  });
  
  // Chart datasets
  const thrustChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [{
      label: 'Thrust (N)',
      data: sampledData.thrust,
      borderColor: 'rgb(220, 53, 69)',
      backgroundColor: 'rgba(220, 53, 69, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  
  const pressureChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [{
      label: 'Chamber Pressure (MPa)',
      data: sampledData.pressure,
      borderColor: 'rgb(0, 123, 255)',
      backgroundColor: 'rgba(0, 123, 255, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  
  const burnRateChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [{
      label: 'Burn Rate (mm/s)',
      data: sampledData.burnRate,
      borderColor: 'rgb(255, 153, 0)',
      backgroundColor: 'rgba(255, 153, 0, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  
  const knChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [{
      label: 'Kn (Area Ratio)',
      data: sampledData.Kn,
      borderColor: 'rgb(111, 66, 193)',
      backgroundColor: 'rgba(111, 66, 193, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  
  const stressChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [
      {
        label: 'Hoop Stress (MPa)',
        data: sampledData.stress,
        borderColor: 'rgb(40, 167, 69)',
        backgroundColor: 'rgba(40, 167, 69, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Yield Strength (MPa)',
        data: sampledData.time.map(() => (config.material?.yieldStrength || 2.75e8) / 1e6),
        borderColor: 'rgb(220, 53, 69)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  
  const regressionChartData = {
    labels: sampledData.time.map(t => t.toFixed(3)),
    datasets: [{
      label: 'Inner Radius (mm)',
      data: sampledData.innerRadius,
      borderColor: 'rgb(23, 162, 184)',
      backgroundColor: 'rgba(23, 162, 184, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  
  // Calculate motor classification
  const getMotorClass = (totalImpulse) => {
    if (totalImpulse <= 1.25) return 'A';
    if (totalImpulse <= 2.5) return 'B';
    if (totalImpulse <= 5) return 'C';
    if (totalImpulse <= 10) return 'D';
    if (totalImpulse <= 20) return 'E';
    if (totalImpulse <= 40) return 'F';
    if (totalImpulse <= 80) return 'G';
    if (totalImpulse <= 160) return 'H';
    if (totalImpulse <= 320) return 'I';
    if (totalImpulse <= 640) return 'J';
    if (totalImpulse <= 1280) return 'K';
    if (totalImpulse <= 2560) return 'L';
    if (totalImpulse <= 5120) return 'M';
    return 'N+';
  };
  
  // Generate report data for download
  const generateReportData = () => {
    const avgThrust = state?.totalImpulse && state?.burnTime 
      ? state.totalImpulse / state.burnTime 
      : 0;
    
    return {
      generatedAt: new Date().toISOString(),
      motorDesignation: `${getMotorClass(state?.totalImpulse || 0)}${Math.round(avgThrust)}`,
      summary: {
        totalImpulse: state?.totalImpulse?.toFixed(2) + ' N·s',
        burnTime: state?.burnTime?.toFixed(3) + ' s',
        averageThrust: avgThrust.toFixed(2) + ' N',
        maxThrust: state?.maxThrust?.toFixed(2) + ' N',
        maxPressure: ((state?.maxPressure || 0) / 1e6).toFixed(3) + ' MPa',
        status: state?.hasExploded ? 'CATO (Catastrophic Failure)' : 
                state?.isBurnedOut ? 'Burnout Complete' : 'Not Fired',
      },
      propellant: {
        name: config.propellant?.name || 'Unknown',
        density: (config.propellant?.density || 0) + ' kg/m³',
        burnRateCoefficient: config.propellant?.burnRateCoeff || 0,
        burnRateExponent: config.propellant?.burnRateExponent || 0,
        characteristicVelocity: config.propellant?.characteristicVelocity + ' m/s',
      },
      grain: {
        type: config.grainConfig?.type || 'BATES',
        outerDiameter: ((config.grainConfig?.outerRadius || 0) * 2000).toFixed(1) + ' mm',
        coreDiameter: ((config.grainConfig?.coreRadius || 0) * 2000).toFixed(1) + ' mm',
        segmentLength: ((config.grainConfig?.length || 0) * 1000).toFixed(1) + ' mm',
        segments: config.grainConfig?.segments || 0,
        totalLength: (((config.grainConfig?.length || 0) * (config.grainConfig?.segments || 0)) * 1000).toFixed(1) + ' mm',
      },
      nozzle: {
        throatDiameter: ((config.nozzle?.throatDiameter || 0) * 1000).toFixed(2) + ' mm',
        exitDiameter: ((config.nozzle?.exitDiameter || 0) * 1000).toFixed(2) + ' mm',
        expansionRatio: (Math.pow((config.nozzle?.exitDiameter || 0) / (config.nozzle?.throatDiameter || 1), 2)).toFixed(2),
        efficiency: ((config.nozzle?.efficiency || 0) * 100).toFixed(1) + '%',
      },
      casing: {
        material: config.material?.name || 'Aluminum',
        innerDiameter: ((config.casing?.innerRadius || 0) * 2000).toFixed(1) + ' mm',
        wallThickness: ((config.casing?.wallThickness || 0) * 1000).toFixed(2) + ' mm',
        yieldStrength: ((config.material?.yieldStrength || 0) / 1e6).toFixed(1) + ' MPa',
      },
      dataPoints: history.time.length,
      history: {
        time: history.time,
        thrust: history.thrust,
        pressure: history.pressure,
        burnRate: history.burnRate,
        Kn: history.Kn,
        stress: history.stress,
        innerRadius: history.innerRadius,
      },
    };
  };
  
  // Download JSON report
  const downloadJSONReport = () => {
    const data = generateReportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motor-report-${data.motorDesignation}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Download CSV data
  const downloadCSVData = () => {
    const headers = ['Time (s)', 'Thrust (N)', 'Pressure (MPa)', 'Burn Rate (mm/s)', 'Kn', 'Stress (MPa)', 'Inner Radius (mm)'];
    const rows = history.time.map((t, i) => [
      t.toFixed(4),
      (history.thrust[i] || 0).toFixed(4),
      (history.pressure[i] || 0).toFixed(4),
      (history.burnRate[i] || 0).toFixed(4),
      (history.Kn[i] || 0).toFixed(4),
      (history.stress[i] || 0).toFixed(4),
      (history.innerRadius[i] || 0).toFixed(4),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motor-data-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Calculate summary stats
  const avgThrust = state?.totalImpulse && state?.burnTime 
    ? state.totalImpulse / state.burnTime 
    : 0;
  
  const hasData = history.time.length > 0;
  
  return (
    <div className="report-page" ref={reportRef}>
      {/* Header */}
      <header className="report-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setCurrentPage('simulator')}>
            ← Back to Simulator
          </button>
        </div>
        <div className="header-center">
          <h1>Motor Analysis Report</h1>
          <p className="motor-designation">
            {hasData ? `Motor Class: ${getMotorClass(state?.totalImpulse || 0)}${Math.round(avgThrust)}` : 'No simulation data'}
          </p>
        </div>
        <div className="header-right">
          <button className="download-btn json" onClick={downloadJSONReport} disabled={!hasData}>
            📄 Download JSON
          </button>
          <button className="download-btn csv" onClick={downloadCSVData} disabled={!hasData}>
            📊 Download CSV
          </button>
        </div>
      </header>
      
      {/* Configuration Summary */}
      <section className="config-section">
        <h2>Motor Configuration</h2>
        <div className="config-grid">
          {/* Propellant */}
          <div className="config-card">
            <h3>Propellant</h3>
            <div className="config-items">
              <div className="config-item">
                <span className="label">Type:</span>
                <span className="value">{config.propellant?.name || 'KNSB'}</span>
              </div>
              <div className="config-item">
                <span className="label">Density:</span>
                <span className="value">{config.propellant?.density || 0} kg/m³</span>
              </div>
              <div className="config-item">
                <span className="label">Burn Rate (a):</span>
                <span className="value">{config.propellant?.burnRateCoeff || 0} mm/s</span>
              </div>
              <div className="config-item">
                <span className="label">Exponent (n):</span>
                <span className="value">{config.propellant?.burnRateExponent || 0}</span>
              </div>
              <div className="config-item">
                <span className="label">c*:</span>
                <span className="value">{config.propellant?.characteristicVelocity || 0} m/s</span>
              </div>
            </div>
          </div>
          
          {/* Grain Geometry */}
          <div className="config-card">
            <h3>Grain Geometry</h3>
            <div className="config-items">
              <div className="config-item">
                <span className="label">Type:</span>
                <span className="value">{config.grainConfig?.type || 'BATES'}</span>
              </div>
              <div className="config-item">
                <span className="label">Outer Diameter:</span>
                <span className="value">{((config.grainConfig?.outerRadius || 0) * 2000).toFixed(1)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Core Diameter:</span>
                <span className="value">{((config.grainConfig?.coreRadius || 0) * 2000).toFixed(1)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Segment Length:</span>
                <span className="value">{((config.grainConfig?.length || 0) * 1000).toFixed(1)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Segments:</span>
                <span className="value">{config.grainConfig?.segments || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Nozzle */}
          <div className="config-card">
            <h3>Nozzle</h3>
            <div className="config-items">
              <div className="config-item">
                <span className="label">Throat Diameter:</span>
                <span className="value">{((config.nozzle?.throatDiameter || 0) * 1000).toFixed(2)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Exit Diameter:</span>
                <span className="value">{((config.nozzle?.exitDiameter || 0) * 1000).toFixed(2)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Expansion Ratio:</span>
                <span className="value">{(Math.pow((config.nozzle?.exitDiameter || 1) / (config.nozzle?.throatDiameter || 1), 2)).toFixed(2)}</span>
              </div>
              <div className="config-item">
                <span className="label">Efficiency:</span>
                <span className="value">{((config.nozzle?.efficiency || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          {/* Casing */}
          <div className="config-card">
            <h3>Casing</h3>
            <div className="config-items">
              <div className="config-item">
                <span className="label">Material:</span>
                <span className="value">{config.material?.name || 'Aluminum'}</span>
              </div>
              <div className="config-item">
                <span className="label">Inner Diameter:</span>
                <span className="value">{((config.casing?.innerRadius || 0) * 2000).toFixed(1)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Wall Thickness:</span>
                <span className="value">{((config.casing?.wallThickness || 0) * 1000).toFixed(2)} mm</span>
              </div>
              <div className="config-item">
                <span className="label">Yield Strength:</span>
                <span className="value">{((config.material?.yieldStrength || 0) / 1e6).toFixed(0)} MPa</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Performance Summary */}
      <section className="performance-section">
        <h2>Performance Summary</h2>
        <div className="performance-grid">
          <div className={`perf-card ${state?.hasExploded ? 'danger' : ''}`}>
            <div className="perf-value">{state?.hasExploded ? 'CATO' : state?.isBurnedOut ? 'Complete' : 'Standby'}</div>
            <div className="perf-label">Status</div>
          </div>
          <div className="perf-card highlight">
            <div className="perf-value">{(state?.totalImpulse || 0).toFixed(2)}</div>
            <div className="perf-label">Total Impulse (N·s)</div>
          </div>
          <div className="perf-card">
            <div className="perf-value">{(state?.burnTime || 0).toFixed(3)}</div>
            <div className="perf-label">Burn Time (s)</div>
          </div>
          <div className="perf-card">
            <div className="perf-value">{avgThrust.toFixed(1)}</div>
            <div className="perf-label">Average Thrust (N)</div>
          </div>
          <div className="perf-card highlight">
            <div className="perf-value">{(state?.maxThrust || 0).toFixed(1)}</div>
            <div className="perf-label">Max Thrust (N)</div>
          </div>
          <div className="perf-card">
            <div className="perf-value">{((state?.maxPressure || 0) / 1e6).toFixed(3)}</div>
            <div className="perf-label">Max Pressure (MPa)</div>
          </div>
        </div>
      </section>
      
      {/* Charts Section */}
      {hasData ? (
        <section className="charts-section">
          <h2>Performance Graphs</h2>
          
          <div className="charts-grid">
            {/* Thrust Profile */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={thrustChartData} options={createChartOptions('Thrust Profile', 'Thrust (N)')} />
              </div>
            </div>
            
            {/* Pressure Profile */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={pressureChartData} options={createChartOptions('Chamber Pressure', 'Pressure (MPa)')} />
              </div>
            </div>
            
            {/* Burn Rate */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={burnRateChartData} options={createChartOptions('Burn Rate', 'Rate (mm/s)')} />
              </div>
            </div>
            
            {/* Kn Ratio */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={knChartData} options={createChartOptions('Kn (Area Ratio)', 'Kn')} />
              </div>
            </div>
            
            {/* Stress vs Yield */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={stressChartData} options={createChartOptions('Casing Stress Analysis', 'Stress (MPa)')} />
              </div>
            </div>
            
            {/* Grain Regression */}
            <div className="report-chart">
              <div className="chart-container">
                <Line data={regressionChartData} options={createChartOptions('Grain Regression', 'Inner Radius (mm)')} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="no-data-section">
          <div className="no-data-message">
            <h3>No Simulation Data</h3>
            <p>Run a simulation in the simulator to generate performance data and graphs.</p>
            <button className="primary-btn" onClick={() => setCurrentPage('simulator')}>
              Go to Simulator
            </button>
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="report-footer">
        <p>Generated by Solid Motor Simulator | {new Date().toLocaleString()}</p>
        <p className="disclaimer">For educational purposes only. Always follow proper safety protocols when working with rocket motors.</p>
      </footer>
    </div>
  );
}
