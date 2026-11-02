# ORBITFORGE — INTERACTIVE SPACE MISSION DESIGN SIMULATOR

> **"Design the Mission. Engineer the Future."**
> Inspired by the 2026 NASA Space Apps Challenge problem statement *"Space Mission Design Game"*.

![ORBITFORGE](/orbitforge_tour_1793630459830.webp)

---

## 1. PRODUCT OVERVIEW

**ORBITFORGE** is a complete, educational space mission design simulator. It places students, aerospace enthusiasts, and engineers in the role of flight system architects at a modern mission operations center.

Rather than a static mockup, every button, slider, calculation, and component directly influences a live, deterministic aerospace simulation engine.

### Core Capabilities:
- **Playable Mission Campaigns**: Earth Climate Observer (Sentinel-Terra), Lunar Polar Ice Mapper (Artemis Scout), Mars Atmospheric & Geology Surveyor (Ares Pioneer), and Custom Sandbox Studio.
- **The Six Resource Pillars**: Real-time evaluation of **Mass (kg)**, **Power (W)**, **Budget ($)**, **Data (MB)**, **Comms (Mbps)**, and **Time (MET)**.
- **Spacecraft Laboratory**: Modular assembly across 9 categories (Bus, Solar Wings, RTGs, Batteries, Optical/SAR/Spectral Instruments, High-Gain Comms, Reaction Wheels, Avionics, Propulsion).
- **Astrodynamics & Orbit Explorer**: Real-time 3D Keplerian orbital visualization (altitude, inclination, velocity, period, eclipse shadows, Hohmann transfer delta-v calculator).
- **Launch Service Procurement**: Certified rockets (Electron, Falcon 9, Atlas V, Ariane 64, Falcon Heavy) with lift capacity envelopes.
- **Live Mission Control Center**: Real-time simulation clock, pause/resume, 1x-10x speed acceleration, 3D orbit trajectory, live telemetry charts (Recharts), and event logging.
- **Flight Scoring & Post-Mission Reports**: Multi-factor transparent scoring (Objectives 35%, Science 15%, Resources 15%, Budget 10%, Downlink 10%, Reliability 10%, Margin 5%), letter grades (A+ to F), printable debriefs, and CSV/JSON export.
- **Design Optimizer & Comparison Matrix**: Side-by-side spec comparisons with 1-click automated rule-based recommendations.
- **Integrated Learning Center**: 10 curriculum modules with physical SI equations and interactive quizzes.
- **Local Team Collaboration**: Switchable roles (Mission Planner, Spacecraft Engineer, Payload Scientist, Flight Operations Engineer).

---

## 2. GETTING STARTED & LOCAL RUN

### Prerequisites
- Node.js v18+ or v20+
- npm v9+

### Installation & Execution
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser:
# http://localhost:5173/
```

### Running Automated Test Suite
```bash
npm test
```

### Building for Production
```bash
npm run build
```

---

## 3. DEMONSTRATION SCRIPT FOR HACKATHON JUDGES

Follow this 3-minute end-to-end workflow to demonstrate full capabilities:

1. **Home Dashboard**:
   - Open `http://localhost:5173/`.
   - Point out the **Six Resource Pillars** in the top ribbon and the live 3D orbital astrodynamics canvas.
2. **Mission Campaigns**:
   - Click **Mission Campaigns** in the sidebar.
   - Choose **Sentinel-Terra: Earth Climate Observer** and click **Launch Campaign in Designer**.
3. **Mission Designer Wizard**:
   - Navigate through the steps: **Objectives** $\rightarrow$ **Bus** $\rightarrow$ **Instruments** $\rightarrow$ **Power** $\rightarrow$ **Target Orbit**.
   - Note how changing instruments immediately updates total wet launch mass, daylight power draw, and solid-state storage margins.
4. **Interactive Orbit Explorer**:
   - Open **Orbit Explorer** in the sidebar.
   - Adjust the altitude and inclination sliders to demonstrate dynamic Keplerian orbital speed and Hohmann transfer delta-V calculations.
5. **Launch & Mission Control**:
   - Click **FLIGHT CONTROL** in the top navbar.
   - Click **LAUNCH MISSION**.
   - Accelerate time to **5x** or **10x** and observe the live telemetry charts, eclipse shadow transitions, and ground station passes over Fairbanks and Svalbard.
6. **Debrief & Post-Mission Report**:
   - Open **Mission Reports** to inspect the final score, letter grade, achievements, and export the telemetry data as a CSV or JSON file.

---

## 4. INDEPENDENT EDUCATIONAL DISCLAIMER

*ORBITFORGE is an independent educational simulation inspired by the NASA Space Apps Challenge problem statement. It is not an official product of NASA, ESA, or any commercial aerospace launch contractor. Physics models utilize sensible two-body Keplerian approximations, CODATA constants, and AIAA aerospace design margins.*
