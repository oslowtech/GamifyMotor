# 🚀 GamifyMotor: 3D Solid Rocket Motor Simulator

A modern, interactive web app for simulating, visualizing, and analyzing solid rocket motors in real time. Built with React, React Three Fiber, Zustand, Leva, and Chart.js.

---

## Features

- **3D Visualization:**
  - Realistic cutaway and exterior views of a solid rocket motor
  - Animated burn regression, flame, and CATO (explosion) effects
  - Adjustable motor geometry: grain, casing, nozzle, propellant
- **Physics Engine:**
  - Verified KNSB propellant data (Richard Nakka)
  - Real-time chamber pressure, thrust, burn rate, Kn, stress, and more
  - Iterative solver for accurate pressure and regression
- **Interactive UI:**
  - Leva panel for live parameter tuning
  - Ignite/reset controls, view mode, heat map, and more
- **Performance Graphs:**
  - Thrust, pressure, burn rate, Kn, stress, regression
  - Downloadable CSV/JSON report with all simulation data
- **Report Page:**
  - Full configuration summary and all graphs
  - Motor classification (NAR A-N+)
  - Exportable data for further analysis

---

## Quick Start

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the development server:**
   ```sh
   npm run dev
   ```
   The app will open at [http://localhost:3002](http://localhost:3002) (or next available port).

---

## Usage

- **Configure Motor:**
  - Use the Leva panel (left) to set grain, casing, nozzle, and propellant parameters
- **Ignite:**
  - Click the orange **IGNITE** button below the graphs to start the simulation
- **View Report:**
  - Click **View Report** in the Leva panel to see all graphs and download data
- **Reset:**
  - Click **Reset** to reconfigure and run again

---

## Technologies

- [React](https://react.dev/)
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)
- [@react-three/drei](https://github.com/pmndrs/drei)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Leva](https://leva.pmnd.rs/)
- [Chart.js](https://www.chartjs.org/)
- [Three.js](https://threejs.org/)

---

## Physics Reference

- **Burn Rate Law:**
  - $r = a \left(\frac{P}{P_{ref}}\right)^n$
  - KNSB: $a = 8.26$ mm/s, $n = 0.319$, $P_{ref} = 6.895$ MPa
- **Propellant:**
  - Density: 1841 kg/m³
  - Characteristic velocity ($c^*$): 885 m/s
  - Ratio of specific heats ($\gamma$): 1.133
- **Motor Class:**
  - NAR A-N+ based on total impulse

---

## Project Structure

- `src/components/3d/` — 3D motor, grain, casing, nozzle, flame
- `src/components/ui/` — UI panels, charts, report page
- `src/physics/` — Physics engine and constants
- `src/store/` — Zustand state management

---

## License

MIT License. For educational and non-commercial use only.

---

## Credits

- Physics data: [Richard Nakka's Rocketry Research](http://www.nakka-rocketry.net/)
- 3D/React inspiration: [pmndrs](https://github.com/pmndrs)
