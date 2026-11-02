/**
 * Educational Learning Center Curriculum
 * Comprehensive aerospace engineering guide with clear explanations, practical examples,
 * SI formulas, unit explanations, interactive quizzes with instant feedback, and simulator links.
 */

export const EDUCATIONAL_MODULES = [
  {
    id: 'edu-intro-space-missions',
    title: 'Introduction to Space Mission Design',
    category: 'Foundations',
    readTimeMinutes: 4,
    simulatorLink: 'designer',
    summary: 'How aerospace engineers translate high-level science questions into physical spacecraft architectures.',
    content: `
### The Mission Design Lifecycle

Every space mission begins not with metal and fuel, but with a scientific question: *What are we trying to discover, measure, or communicate?*

Mission designers follow the **NASA Systems Engineering V-Model**:
1. **Define Objectives**: State the scientific goal (e.g., "Map polar water ice deposits").
2. **Derive Requirements**: Translate goals into numbers (e.g., "Must achieve 15 m spatial resolution with 120 GB data downlink per week").
3. **Architecture Trade-offs**: Choose the destination body, orbital regime, launch vehicle class, and power architecture.
4. **Subsystem Sizing**: Size the battery, solar panels, propellant tanks, and communication dishes to satisfy requirements with strict engineering margins.

### The Six Principal Constraints

In spaceflight, you can never optimize one parameter in isolation. Every decision is tied to the **Six Resource Pillars**:
- **Mass (kg)**: Launch vehicles have strict lift capacity limits. Every kilogram launched costs thousands of dollars.
- **Power (Watts)**: Electricity must be generated (solar or nuclear) and stored (batteries) through day and night.
- **Budget ($)**: Hardware, launch contracts, and daily ground operations teams have a hard financial ceiling.
- **Data (MB/GB)**: Science instruments generate continuous data streams that can overflow solid-state storage.
- **Communications (Mbps)**: Radio frequency signals weaken with the square of the distance across space.
- **Time (MET)**: Mission lifetime, orbital periods, eclipse windows, and ground station contact passes determine operational rhythm.
    `,
    formula: {
      title: 'Payload Mass Fraction',
      equation: 'f_{payload} = \\frac{m_{payload}}{m_{launch}} \\times 100\\%',
      explanation: 'Typical scientific missions have a payload mass fraction of only 10% to 25%. The remaining 75-90% is structure, power, tanks, propellant, and avionics required just to keep the instruments alive.',
      units: 'Dimensionless percentage (%)',
    },
    quiz: {
      question: 'Why cannot an engineer simply add 5 more high-resolution cameras to increase science output without modifying anything else?',
      options: [
        'Because space treaties forbid more than 2 cameras per satellite.',
        'Because adding cameras increases mass, power consumption, data volume, and downlink demand simultaneously.',
        'Because cameras only work in deep space, not in planetary orbit.',
        'Because rocket fairings are strictly transparent.',
      ],
      correctIndex: 1,
      explanation: 'Adding instruments increases mass (affecting launch capacity), draws more electrical power (requiring larger solar panels and batteries), and generates more data (requiring higher storage and communication bandwidth). This cascade of dependencies is the core challenge of systems engineering.',
    },
  },

  {
    id: 'edu-orbital-mechanics',
    title: 'Orbital Mechanics & Trajectories',
    category: 'Astrodynamics',
    readTimeMinutes: 6,
    simulatorLink: 'orbit',
    summary: 'The physics of gravity, circular orbits, Keplerian periods, velocities, and Hohmann transfers.',
    content: `
### Falling Around the Earth

An orbit is not a place where gravity ceases to exist. At 400 km altitude (where the International Space Station orbits), Earth's gravity is still **89% as strong** as it is on the ground!

A spacecraft stays in orbit because it is moving horizontally so fast that as gravity pulls it downward toward Earth, the surface of Earth curves away beneath it at the exact same rate. The spacecraft is perpetually "falling around" the planet.

### Circular Orbital Velocity

For a circular orbit around a spherical central body of mass $M$, the inward gravitational force exactly matches the required centripetal acceleration:

$$\\frac{G M m}{r^2} = \\frac{m v^2}{r} \\implies v = \\sqrt{\\frac{\\mu}{r}}$$

Where:
- $\\mu = G M$ is the central body's standard gravitational parameter ($3.986 \\times 10^{14} \\text{ m}^3/\\text{s}^2$ for Earth).
- $r = R_{body} + h$ is the orbital radius measured from the **center** of the body.
- $v$ is the orbital velocity in $\\text{m/s}$.

Notice an apparent paradox: **the higher the orbit, the slower the spacecraft travels!**
- In Low Earth Orbit (400 km): $v \\approx 7.67 \\text{ km/s}$ (Period: 92.5 minutes).
- In Geostationary Orbit (35,786 km): $v \\approx 3.07 \\text{ km/s}$ (Period: 24 hours).
- The Moon (384,400 km): $v \\approx 1.02 \\text{ km/s}$ (Period: 27.3 days).
    `,
    formula: {
      title: 'Orbital Period (Kepler’s Third Law)',
      equation: 'T = 2\\pi \\sqrt{\\frac{r^3}{\\mu}}',
      explanation: 'Computes the duration in seconds for a satellite to complete one full revolution around the central body.',
      units: 'T in seconds (s), r in meters (m), \\mu in m³/s²',
    },
    quiz: {
      question: 'If a satellite at 400 km altitude fires its thrusters forward (prograde) to raise its altitude to 1,000 km, what happens to its final orbital speed?',
      options: [
        'Its orbital speed increases because it added kinetic energy.',
        'Its orbital speed decreases because higher orbits have lower circular orbital velocity.',
        'Its orbital speed remains identical because gravity is constant in vacuum.',
        'Its speed immediately drops to zero.',
      ],
      correctIndex: 1,
      explanation: 'While the spacecraft fires thrusters to climb uphill in Earth’s gravity well, potential energy increases at the expense of kinetic energy. The new higher circular orbit at 1,000 km has a slower orbital speed (~7.35 km/s) than at 400 km (~7.67 km/s).',
    },
  },

  {
    id: 'edu-power-energy',
    title: 'Spacecraft Power & Day/Night Energy Balance',
    category: 'Subsystems',
    readTimeMinutes: 5,
    simulatorLink: 'spacecraft',
    summary: 'Solar arrays vs RTGs, inverse-square law attenuation, and battery Depth-of-Discharge (DoD).',
    content: `
### Watts vs Watt-Hours: The Critical Distinction

A common beginner mistake is confusing **power** with **energy**:
- **Power (Watts, W)**: The instantaneous rate of electricity flow. If your cameras and computers consume 300 W, your solar panels must generate at least 300 W right now.
- **Energy (Watt-hours, Wh)**: Power integrated over time ($E = P \\times t$). A 300 W load running for a 0.6-hour eclipse consumes $300 \\times 0.6 = 180 \\text{ Wh}$ of energy from the battery pack.

### The Inverse-Square Law of Solar Irradiance

At Earth (1.0 AU from the Sun), solar panels receive approximately **1,361 Watts of sunlight per square meter** ($S_0$).
Because light spreads outward spherically, solar flux decreases with the square of the distance $d$:

$$S(d) = \\frac{S_0}{d_{AU}^2}$$

- **At Earth (1.0 AU)**: $1361 \\text{ W/m}^2$ (100%)
- **At Mars (1.524 AU)**: $1361 / (1.524^2) \\approx 586 \\text{ W/m}^2$ (**Only 43%**!)
- **At Jupiter (5.2 AU)**: $1361 / (5.2^2) \\approx 50 \\text{ W/m}^2$ (**Only 3.7%**!)

This is why outer planet missions (Voyager, Cassini, New Horizons) use nuclear **Radioisotope Thermoelectric Generators (RTGs)** instead of massive, fragile solar panels.

### Battery Depth of Discharge (DoD)

Lithium-ion cells in space cannot be drained to 0% every orbit without rapidly dying. Spacecraft engineers restrict regular eclipse cycles to **30% to 60% DoD** so the battery can survive 50,000+ charge cycles over 10 years.
    `,
    formula: {
      title: 'Battery Depth of Discharge (DoD)',
      equation: '\\text{DoD} = \\frac{P_{eclipse} \\times t_{eclipse}}{C_{battery}} \\times 100\\%',
      explanation: 'Measures the fraction of total installed battery capacity consumed during each planetary shadow transit.',
      units: 'Percentage (%), where ≤ 70% is recommended for flight safety.',
    },
    quiz: {
      question: 'A spacecraft solar array generates 1,000 W in Earth orbit. How much power will this exact same array generate in Mars orbit (1.524 AU)?',
      options: [
        '1,000 W (solar cells produce the same power anywhere in vacuum)',
        '656 W (decreases linearly with distance)',
        'Approximately 430 W (decreases with the inverse square of distance)',
        'Zero W (solar cells cannot operate past Earth)',
      ],
      correctIndex: 2,
      explanation: 'Solar irradiance follows the inverse-square law: 1,000 W / (1.524)² = 1,000 / 2.3225 ≈ 430 W. Missions to Mars require more than double the solar array area of an Earth-orbiting spacecraft to get the same wattage.',
    },
  },

  {
    id: 'edu-communications-link',
    title: 'Space Communications & Downlink Budgets',
    category: 'Subsystems',
    readTimeMinutes: 5,
    simulatorLink: 'control',
    summary: 'Frequency bands (S, X, Ka, Optical), propagation delays, and data backlog management.',
    content: `
### The Tyranny of Distance

Radio waves travel at the speed of light ($c = 300,000 \\text{ km/s}$). While communications with a Low Earth Orbit satellite take only 3 milliseconds, communicating across interplanetary distances involves real physical lag:
- **Low Earth Orbit (400 km)**: ~0.003 seconds
- **Moon (384,400 km)**: ~1.3 seconds
- **Mars (at closest approach, 55 million km)**: ~3.1 minutes
- **Mars (at solar conjunction, 400 million km)**: ~22 minutes

### Frequency Bands & Antenna Aperture

Higher radio frequencies allow tighter, more focused beams that transmit dramatically higher data rates for the same power:
- **S-Band (2-4 GHz)**: Wide beam, low gain (~1-2 Mbps). Highly robust; works even if spacecraft is tumbling. Used for emergency commanding.
- **X-Band (8-12 GHz)**: Medium-high bandwidth (~20-50 Mbps). Standard NASA deep space science downlink band.
- **Ka-Band (26-40 GHz)**: High bandwidth (~100-300 Mbps). Requires precise parabolic dish pointing toward Earth ground stations.
- **Deep Space Optical Comms (Laser, 1550 nm)**: Extremely narrow coherent light beams offering 10x-100x higher data throughput across deep space.
    `,
    formula: {
      title: 'Free Space Path Loss (FSPL)',
      equation: 'FSPL = \\left(\\frac{4 \\pi d f}{c}\\right)^2',
      explanation: 'Quantifies the signal attenuation in vacuum as distance d and frequency f increase.',
      units: 'Ratio or decibels (dB)',
    },
    quiz: {
      question: 'Why does a Mars mission require autonomous onboard decision-making rather than continuous joystick control from Earth?',
      options: [
        'Because spacecraft computers prefer autonomy over human operators.',
        'Because radio signals take between 4 and 22 minutes each way to travel between Earth and Mars.',
        'Because Earth ground stations only operate on weekends.',
        'Because Mars magnetic field blocks all radio waves.',
      ],
      correctIndex: 1,
      explanation: 'With a one-way light time of 4 to 22 minutes, an emergency signal sent by the spacecraft takes 15 minutes to reach Earth, and the command response takes another 15 minutes to return. By the time operators receive an alert, the event has already transpired 30 minutes in the past.',
    },
  },

  {
    id: 'edu-mass-propulsion',
    title: 'The Tsiolkovsky Rocket Equation & Mass Margins',
    category: 'Propulsion',
    readTimeMinutes: 6,
    simulatorLink: 'spacecraft',
    summary: 'How Delta-V, Specific Impulse (Isp), and exponential propellant scaling govern spaceflight.',
    content: `
### The Tsiolkovsky Rocket Equation

Formulated by Russian pioneer Konstantin Tsiolkovsky in 1903, this is the most famous equation in aerospace engineering:

$$\\Delta v = I_{sp} g_0 \\ln\\left(\\frac{m_{wet}}{m_{dry}}\\right)$$

Rearranging for propellant mass:

$$m_{prop} = m_{dry} \\left(\\exp\\left(\\frac{\\Delta v}{I_{sp} g_0}\\right) - 1\\right)$$

Where:
- $\\Delta v$ is the total change in velocity required for the mission maneuvers ($\\text{m/s}$).
- $I_{sp}$ is the rocket engine's **Specific Impulse** (seconds), representing fuel efficiency.
- $g_0 = 9.80665 \\text{ m/s}^2$ is standard gravity.
- $m_{dry}$ is the dry spacecraft structure and payload mass.
- $m_{prop}$ is the propellant mass required.

### Notice the Exponential!

Because propellant mass scales **exponentially** with required $\\Delta v$, doubling the velocity change more than doubles the required propellant.
This highlights why electric ion propulsion (Specific Impulse $I_{sp} \\approx 1,850 \\text{ s}$) is transformative compared to chemical hydrazine ($I_{sp} \\approx 235 \\text{ s}$): high $I_{sp}$ drastically cuts required propellant mass!
    `,
    formula: {
      title: 'Tsiolkovsky Rocket Equation',
      equation: '\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_{initial}}{m_{final}}\\right)',
      explanation: 'Relates delta-V maneuver capability directly to rocket exhaust velocity and wet-to-dry mass ratio.',
      units: '\\Delta v in m/s, I_{sp} in seconds (s), g_0 in m/s²',
    },
    quiz: {
      question: 'Which propulsion technology provides the highest Specific Impulse (Isp) and requires the least propellant mass for large delta-V maneuvers?',
      options: [
        'Cold Gas Thrusters (~70s Isp)',
        'Monopropellant Hydrazine (~235s Isp)',
        'Bi-propellant Hypergolic (~320s Isp)',
        'Hall-Effect Electric Xenon Thruster (~1,850s Isp)',
      ],
      correctIndex: 3,
      explanation: 'Hall-Effect Electric Propulsion accelerates xenon ions using electromagnetic fields up to tens of km/s, achieving an Isp of ~1,850 seconds—nearly six times higher than the best chemical engines, saving hundreds of kilograms of propellant.',
    },
  },
];
