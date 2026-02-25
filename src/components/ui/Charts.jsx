/**
 * Performance Charts Component
 * Real-time thrust and pressure graphs
 */
import React, { useMemo } from 'react';
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
import './Charts.css';


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

export default function Charts() {
  const { state, showCharts, ignite, reset, isRunning } = useMotorStore();
  
  const history = state?.history || {
    time: [],
    pressure: [],
    thrust: [],
    burnRate: [],
    stress: [],
  };
  
  // Sample data for better performance
  const maxPoints = 200;
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
      stress: history.stress.filter((_, i) => i % step === 0),
    };
  }, [history]);
  
  const thrustChartData = {
    labels: sampledData.time.map(t => t.toFixed(2)),
    datasets: [
      {
        label: 'Thrust (N)',
        data: sampledData.thrust,
        borderColor: 'rgb(255, 99, 71)',
        backgroundColor: 'rgba(255, 99, 71, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  
  const pressureChartData = {
    labels: sampledData.time.map(t => t.toFixed(2)),
    datasets: [
      {
        label: 'Chamber Pressure (MPa)',
        data: sampledData.pressure,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Stress (MPa)',
        data: sampledData.stress,
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.5,
        borderDash: [5, 5],
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#FFFFFF',
          font: {
            size: 10,
          },
        },
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
          color: '#AAAAAA',
        },
        ticks: {
          color: '#888888',
          maxTicksLimit: 8,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        display: true,
        ticks: {
          color: '#888888',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };
  
  if (!showCharts) return null;
  
  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <h3>Thrust Profile</h3>
        <div className="chart">
          <Line data={thrustChartData} options={chartOptions} />
        </div>
      </div>
      
      <div className="chart-wrapper">
        <h3>Pressure & Stress</h3>
        <div className="chart">
          <Line data={pressureChartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="chart-controls">
        <button 
          className="ignite-btn" 
          onClick={ignite}
          disabled={isRunning || state?.isBurnedOut || state?.hasExploded}
        >
          🔥 {state?.isBurnedOut ? 'Burned Out' : state?.hasExploded ? 'CATO!' : isRunning ? 'Burning...' : 'IGNITE'}
        </button>
        <button className="reset-btn" onClick={reset}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
