# ORBITFORGE: User Guide & Flight Operations Manual

Welcome to **ORBITFORGE**, the interactive space mission design simulator.

---

## Quick Start: Your First Earth Observation Mission

1. **Open ORBITFORGE**: Start on the **Home Dashboard**. Review the Six Resource Pillars in the top ribbon (Mass, Power, Budget, Data, Comms, Time).
2. **Select a Campaign**: Navigate to **Mission Campaigns** and select **Sentinel-Terra: Earth Climate Observer**.
3. **Step Through Mission Designer**:
   - **Step 1 (Objectives)**: Review mission goals (Collect 250 GB of imagery, downlink >90%, maintain battery DoD <60%).
   - **Step 2 (Bus)**: Select the **AeroSat-150 SmallSat Bus** or **OrbitalStandard-500 Bus**.
   - **Step 3 (Instruments)**: Equip the **High-Resolution Optical Imager** and **Multispectral Environmental Imager**.
   - **Step 4 (Power)**: Choose **Deployable GaAs Triple-Junction Wings** (1,100 W) and the **1,500 Wh Space Li-Ion Battery**.
   - **Step 5 (Comms & ADCS)**: Install the **X-Band Steerable Horn Antenna** (45 Mbps) and **3-Axis Reaction Wheels with Star Trackers**.
   - **Step 6 (Orbit)**: Select **Sun-Synchronous Orbit (SSO)** at 705 km, 98.2° inclination.
   - **Step 7 (Launch Vehicle)**: Select the flight-proven **Falcon 9 Block 5**.
   - **Step 8 (Review & Launch)**: Confirm all constraint errors are resolved.
4. **Flight Control & Simulation**:
   - Click **Proceed to Launch Simulation** or the **FLIGHT CONTROL** button.
   - Click **LAUNCH MISSION**.
   - Adjust simulation acceleration between **1x**, **2x**, **5x**, and **10x**.
   - Watch the spacecraft transition from *LAUNCH* $\rightarrow$ *STAGE SEP* $\rightarrow$ *COMMISSIONING* $\rightarrow$ *SCIENCE OPS*.
   - Observe real-time 3D orbit passes over Fairbanks and Svalbard ground stations, downlinking science telemetry.
5. **Debrief & Optimization**:
   - When the mission duration completes, open the **Mission Reports** screen to inspect your final score and letter grade (A+, A, B, C, F).
   - Export telemetry logs as a CSV file or your mission design as a JSON file.
   - Open **Design Optimizer** to compare saved missions side-by-side.

---

## Local Team Mode (Collaborative Roles)

Use the role selector in the top navbar to assign engineering specialties:
- **Mission Planner**: Defines objectives, mission lifetime, and budget limits.
- **Spacecraft Engineer**: Sizes the bus structure, solar wings, battery packs, and thrusters.
- **Payload Scientist**: Selects optical, radar, and spectrometer instruments to maximize scientific return.
- **Flight Operations Engineer**: Oversees live telemetry, downlink rates, and orbital maneuvers in Mission Control.
