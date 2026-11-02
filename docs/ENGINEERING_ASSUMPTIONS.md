# ORBITFORGE: Engineering Models & Physical Assumptions

This document describes the physical approximations, mathematical models, standards, and assumptions implemented within the ORBITFORGE simulation engine.

---

## 1. Dimensional Units & Standard Constants

All internal physics calculations strictly use standard SI units:
- **Length / Distance**: Meters ($\text{m}$) or kilometers ($\text{km}$)
- **Mass**: Kilograms ($\text{kg}$)
- **Time**: Seconds ($\text{s}$)
- **Velocity**: Meters per second ($\text{m/s}$)
- **Power**: Watts ($\text{W}$)
- **Energy**: Joules ($\text{J}$) or Watt-hours ($\text{Wh}$)
- **Angle**: Radians ($\text{rad}$) internally, converted to degrees ($\text{deg}$) for display.

### Physical Constants (CODATA 2018 / IAU Standards)
- **Universal Gravitational Constant ($G$)**: $6.67430 \times 10^{-11} \text{ m}^3\text{kg}^{-1}\text{s}^{-2}$
- **Standard Earth Surface Gravity ($g_0$)**: $9.80665 \text{ m/s}^2$
- **Speed of Light ($c$)**: $299,792,458 \text{ m/s}$
- **Solar Irradiance at 1.0 AU ($S_0$)**: $1,361.0 \text{ W/m}^2$
- **Astronomical Unit ($1 \text{ AU}$)**: $149,597,870,700 \text{ m}$

---

## 2. Orbital Mechanics & Astrodynamics

### Assumptions:
1. **Two-Body Gravitational Model**: The central body is treated as an ideal point mass / spherically symmetric body. Higher-order gravitational harmonics ($J_2$, $J_3$), atmospheric drag decay, and third-body perturbations are excluded from real-time orbital integration to ensure deterministic performance.
2. **Circular and Keplerian Orbits**:
   - Orbital radius: $r = R_{central} + h$
   - Circular orbital velocity:
     $$v = \sqrt{\frac{\mu}{r}}$$
   - Orbital period (Kepler's Third Law):
     $$T = 2\pi \sqrt{\frac{r^3}{\mu}}$$
     where $\mu = G \cdot M_{body}$ is the standard gravitational parameter.
3. **Eclipse Geometry (Cylindrical Shadow Model)**:
   - For circular orbits, the half-angle subtended by the central body is:
     $$\alpha = \arcsin\left(\frac{R_{central}}{r}\right)$$
   - The worst-case fractional eclipse time per orbit is:
     $$f_{eclipse} = \frac{2\alpha}{2\pi} = \frac{\alpha}{\pi}$$
   - The eclipse duration is $T_{eclipse} = f_{eclipse} \times T$.

### Hohmann Transfer Calculations
- Delta-V for coplanar circular orbit transfers between $r_1$ and $r_2$:
  $$a_{tx} = \frac{r_1 + r_2}{2}$$
  $$\Delta v_1 = \left| \sqrt{\frac{\mu}{r_1}} \left(\sqrt{\frac{2 r_2}{r_1 + r_2}} - 1\right) \right|$$
  $$\Delta v_2 = \left| \sqrt{\frac{\mu}{r_2}} \left(1 - \sqrt{\frac{2 r_1}{r_1 + r_2}}\right) \right|$$
  $$\Delta v_{total} = \Delta v_1 + \Delta v_2$$

---

## 3. Mass Budget & Propulsion

1. **Dry Mass Summation**:
   $$m_{dry} = m_{bus} + m_{power} + m_{instruments} + m_{comms} + m_{adcs} + m_{computing} + m_{thermal} + m_{prop\_dry}$$
2. **Aerospace Design Margin (AIAA S-120-2006)**:
   A standard 20% mass growth allowance is applied to all dry hardware subsystems:
   $$m_{margin} = m_{dry} \times 0.20$$
   $$m_{dry\_with\_margin} = m_{dry} + m_{margin}$$
3. **Tsiolkovsky Rocket Equation for Propellant Sizing**:
   For maneuvers requiring velocity change $\Delta v$:
   $$m_{wet} = m_{dry\_with\_margin} \cdot \exp\left(\frac{\Delta v}{I_{sp} \cdot g_0}\right)$$
   $$m_{propellant} = m_{wet} - m_{dry\_with\_margin}$$
   Where $I_{sp}$ is the specific impulse in seconds.

---

## 4. Electrical Power & Energy Balance

1. **Solar Array Irradiance Scaling (Inverse-Square Law)**:
   Power generation scales inversely with the square of the distance from the Sun $d_{AU}$:
   $$P_{gen}(d) = \frac{P_{nominal}}{d_{AU}^2}$$
   - At Earth (1.0 AU): 100%
   - At Mars (1.524 AU): ~43.0%
   - At Asteroid 16 Psyche (2.92 AU): ~11.7%
2. **Radioisotope Thermoelectric Generators (RTG)**:
   RTGs generate constant power $P_{rtg}$ continuously, unaffected by solar distance or planetary eclipse.
3. **Day/Night Energy Balance**:
   - Daylight Power Margin:
     $$\Delta P_{day} = P_{gen} - P_{load\_day}$$
   - Eclipse Energy Consumption:
     $$E_{eclipse} = P_{load\_eclipse} \times \left(\frac{T_{eclipse}}{3600}\right) \text{ Wh}$$
   - Battery Depth of Discharge (DoD):
     $$\text{DoD} = \frac{E_{eclipse}}{C_{battery}} \times 100\%$$
     A warning is triggered if $\text{DoD} > 70\%$; a fatal brownout occurs if $\text{DoD} \ge 100\%$.

---

## 5. Communications & Telemetry Downlink

1. **Effective Downlink Bandwidth**:
   Modeled with free-space path loss attenuation based on distance to Earth ground stations / DSN:
   - Low Earth Orbit (LEO): 100% of nominal link rate
   - Geostationary Orbit (GEO): ~60%
   - Lunar Distance: ~25% RF / ~60% Laser Optical
   - Mars Distance: ~2.5% RF / ~15% Laser Optical
2. **Contact Opportunities**:
   - LEO Polar Orbit (Sun-Sync): ~110 minutes of contact per day across polar ground stations (Svalbard, Fairbanks).
   - Deep Space: ~4 to 6 hours scheduled Deep Space Network (DSN) tracking per day.
3. **Backlog Accumulation**:
   $$\Delta_{backlog} = \text{DataGeneratedPerDay} - \text{DownlinkCapacityPerDay}$$
   If $\Delta_{backlog} > 0$, an engineering bottleneck warning is generated.

---

## 6. Deterministic Simulation & Anomalies

- All pseudo-random events (subsystem degradation, solar particle noise) are seeded using the **Mulberry32 PRNG**.
- When supplied with identical seeds and mission configurations, simulation runs reproduce identical telemetry traces, event timestamps, and objective scores.
