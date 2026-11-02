# ORBITFORGE: Architecture & System Design

ORBITFORGE is built on an offline-first, component-driven, deterministic architecture cleanly separating physics calculations and simulation state machines from the React UI.

```
┌───────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                    │
│   React 19 + Tailwind CSS + Three.js + Recharts + Lucide  │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                    APPLICATION STATE TIER                 │
│  MissionContext (Drafts, Roles, Reports, Saved Missions)  │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
┌──────────────▼──────────────┐┌─────────────▼──────────────┐
│      ENGINEERING ENGINE     ││     SIMULATION ENGINE      │
│  - Mass Budget              ││  - State Machine Clock     │
│  - Power & Battery Balance  ││  - 3D Position & Eclipse   │
│  - Orbital Astrodynamics    ││  - Science Generation      │
│  - RF Communications Link   ││  - Contact Windows (DSN)   │
│  - Lifecycle Cost & Budget  ││  - Mulberry32 Seeded PRNG  │
│  - Constraint Validation    ││  - Multi-Factor Scoring    │
└──────────────┬──────────────┘└─────────────┬──────────────┘
               │                             │
┌──────────────▼─────────────────────────────▼──────────────┐
│                     DATA & PERSISTENCE                    │
│   Component Catalogs + LocalStorage Versioning + JSON/CSV │
└───────────────────────────────────────────────────────────┘
```

## Directory Structure

- `src/`
  - `components/`
    - `common/` (`ResourcePillarsBar`, `ValidationAlerts`)
    - `layout/` (`Navbar`, `Sidebar`)
    - `visualization/` (`SpaceVisualization3D`, `SpacecraftViewer3D`)
  - `data/`
    - `spacecraftComponents.js` (Buses, solar arrays, RTGs, batteries, instruments, antennas, ADCS, avionics, thermal, propulsion)
    - `launchVehicles.js` (Electron, Falcon 9, Atlas V, Ariane 64, Falcon Heavy)
    - `orbits.js` (LEO, SSO, GEO, Lunar Polar, Mars Science, Asteroid)
    - `missions.js` (Earth, Moon, Mars, Asteroid, Sandbox scenarios)
    - `educationalContent.js` (10 aerospace curriculum modules with quizzes)
  - `engine/`
    - `constants/physics.js` (CODATA constants and celestial bodies)
    - `calculations/` (`orbitalMechanics.js`, `mass.js`, `power.js`, `budget.js`, `data.js`, `communications.js`)
    - `validation/validateMission.js` (Rule engine with actionable fixes)
    - `simulation/` (`simulationEngine.js`, `missionScoring.js`)
    - `optimization/recommendations.js` (Automated design recommendation engine)
  - `state/MissionContext.jsx` (Global state, active mission, persistence sync)
  - `services/` (`persistenceService.js`, `exportService.js`)
  - `utils/` (`seededRandom.js`, `units.js`, `formatters.js`)
- `tests/`
  - `calculations.test.js` (SI units, orbital velocity, period, mass margins, power DoD)
  - `simulation.test.js` (State machine phases, deterministic playback, scoring)
