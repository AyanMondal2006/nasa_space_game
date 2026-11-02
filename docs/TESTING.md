# ORBITFORGE: Testing Suite & Quality Assurance

ORBITFORGE includes automated unit and integration tests written for **Vitest**, covering the physical calculation engines, validation logic, and deterministic simulation mechanics.

---

## 1. Running Automated Tests

Run the Vitest test suite locally:

```bash
npm test
```

For continuous testing with watch mode:

```bash
npx vitest
```

---

## 2. Test Coverage & Verified Invariants

### A. Orbital Mechanics (`tests/calculations.test.js`)
- **LEO Circular Orbit Velocity**: Verified at Earth 400 km ($v \approx 7.67 \text{ km/s}$).
- **Orbital Period**: Verified Keplerian period ($T \approx 92.5 \text{ min}$).
- **Eclipse Shadow Geometry**: Verified cylindrical umbra duration ($T_{eclipse} \approx 36 \text{ min}$).
- **Hohmann Transfer Delta-V**: Verified Earth 400 km to GEO ($35,786 \text{ km}$) transfer requires $\approx 3.93 \text{ km/s}$.

### B. Mass Budget & Rocket Propulsion (`tests/calculations.test.js`)
- **Dry Mass Breakdown**: Accurate summation across 8 subsystems.
- **Design Margin**: Accurate 20% growth margin calculation.
- **Tsiolkovsky Rocket Equation**: Propellant mass sizing given $\Delta v$ and $I_{sp}$.
- **Launch Vehicle Lift Envelope**: Accurately flags payload mass overruns.

### C. Electrical Power & Battery Energy Balance (`tests/calculations.test.js`)
- **Solar Irradiance Attenuation**: Inverse-square law verified for Mars at 1.524 AU ($\approx 43\%$ solar flux).
- **Day/Night Battery DoD**: Accurate tracking of eclipse energy discharge.
- **Brownout Detection**: Catches undersized batteries.

### D. Lifecycle Budgeting & Solid-State Data
- **Hardware, Launch & Daily Operations**: Verified with 15% programmatic contingency.
- **Buffer Overflow Risk**: Catches instrument collection rates exceeding SSR capacity.

### E. Deterministic Simulation (`tests/simulation.test.js`)
- **Mulberry32 PRNG Reproducibility**: Identical seeds produce bitwise-identical pseudorandom sequences.
- **State Machine Transitions**: Pre-launch $\rightarrow$ Launch $\rightarrow$ Stage Sep $\rightarrow$ Commissioning $\rightarrow$ Primary Ops.
- **Multi-Factor Transparent Scoring**: Verified grading algorithm (A+, A, B, C, F) and penalty enforcement.
