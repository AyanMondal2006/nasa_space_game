import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Compass, Eye, ShieldAlert } from 'lucide-react';

/**
 * High-Fidelity 3D Interactive Orbital Simulator
 * Built with Three.js. Renders central celestial body, inclined orbital ring,
 * spacecraft model with animated orbit trajectory, and planetary day/night terminator.
 */
export default function SpaceVisualization3D({
  bodyId = 'earth',
  altitudeKm = 500,
  inclinationDeg = 45,
  orbitAngleRad = 0,
  isInEclipse = false,
  isContacting = false,
  subSatelliteCoords = { latitude: 0, longitude: 0 },
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const planetMeshRef = useRef(null);
  const atmosphereMeshRef = useRef(null);
  const orbitLineRef = useRef(null);
  const spacecraftGroupRef = useRef(null);
  const trajectoryPointsRef = useRef([]);
  const trajectoryLineRef = useRef(null);

  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState('3D'); // '3D' | 'GROUND_TRACK'
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(20, 5, 10);
    scene.add(sunLight);

    // 3. Central Celestial Body
    const planetRadius = 4.0;
    const sphereGeo = new THREE.SphereGeometry(planetRadius, 48, 48);

    let planetColor = 0x2563eb;
    let atmosphereColor = 0x38bdf8;

    if (bodyId === 'moon') {
      planetColor = 0x94a3b8;
      atmosphereColor = 0x000000;
    } else if (bodyId === 'mars') {
      planetColor = 0xc2410c;
      atmosphereColor = 0xf97316;
    } else if (bodyId === 'asteroid') {
      planetColor = 0x78716c;
      atmosphereColor = 0x000000;
    }

    const planetMat = new THREE.MeshStandardMaterial({
      color: planetColor,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: false,
    });

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    scene.add(planetMesh);
    planetMeshRef.current = planetMesh;

    // Atmospheric Glow Ring (if body has atmosphere)
    if (atmosphereColor !== 0x000000) {
      const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.05, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      scene.add(atmoMesh);
      atmosphereMeshRef.current = atmoMesh;
    }

    // Latitude / Longitude Coordinate Wireframe Grid
    const gridGeo = new THREE.SphereGeometry(planetRadius * 1.002, 16, 12);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    planetMesh.add(gridMesh);

    // Starfield Particle Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 120;
      starCoords[i + 1] = (Math.random() - 0.5) * 120;
      starCoords[i + 2] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 4. Orbital Ring
    const orbitRadius = planetRadius + Math.max(1.5, Math.min(6.5, (altitudeKm / 1000) * 1.5 + 1.2));
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(120);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);

    // Rotate orbit ring by inclination
    orbitLine.rotation.x = (inclinationDeg * Math.PI) / 180;
    scene.add(orbitLine);
    orbitLineRef.current = orbitLine;

    // 5. Spacecraft Model Group
    const scGroup = new THREE.Group();

    // Spacecraft Bus Box
    const busGeo = new THREE.BoxGeometry(0.35, 0.35, 0.5);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7, roughness: 0.3 });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    scGroup.add(busMesh);

    // Solar Wings
    const wingGeo = new THREE.BoxGeometry(0.9, 0.02, 0.25);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.65, 0, 0);
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.65, 0, 0);
    scGroup.add(leftWing);
    scGroup.add(rightWing);

    // High-Gain Dish Antenna
    const dishGeo = new THREE.ConeGeometry(0.18, 0.12, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.set(0, 0.25, 0);
    dishMesh.rotation.x = Math.PI;
    scGroup.add(dishMesh);

    // Sub-satellite Nadir Laser Beam (pointing down toward body)
    const beamGeo = new THREE.CylinderGeometry(0.01, 0.04, orbitRadius - planetRadius, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: isContacting ? 0x10b981 : 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, -(orbitRadius - planetRadius) / 2, 0);
    scGroup.add(beamMesh);

    scene.add(scGroup);
    spacecraftGroupRef.current = scGroup;

    // 6. Mouse Orbit Drag Controls
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      scene.rotation.y += deltaX * 0.005;
      scene.rotation.x += deltaY * 0.005;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(7, Math.min(30, camera.position.z + e.deltaY * 0.015));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 7. Animation Loop with Visibility Throttling
    let animationFrameId;
    let isVisible = true;
    let observer;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isVisible) {
        // Rotate planet slowly
        if (planetMeshRef.current && isRotating) {
          planetMeshRef.current.rotation.y += 0.001;
        }

        renderer.render(scene, camera);
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [bodyId]);

  // Update Spacecraft Position along 3D Orbit
  useEffect(() => {
    if (!spacecraftGroupRef.current) return;

    const planetRadius = 4.0;
    const orbitRadius = planetRadius + Math.max(1.5, Math.min(6.5, (altitudeKm / 1000) * 1.5 + 1.2));
    const incRad = (inclinationDeg * Math.PI) / 180;

    // True anomaly in orbital plane
    const xOrb = orbitRadius * Math.cos(orbitAngleRad);
    const zOrb = orbitRadius * Math.sin(orbitAngleRad);

    // Rotate into inclined plane
    const x = xOrb;
    const y = -zOrb * Math.sin(incRad);
    const z = zOrb * Math.cos(incRad);

    spacecraftGroupRef.current.position.set(x, y, z);
    // Align spacecraft orientation facing forward along velocity vector
    spacecraftGroupRef.current.lookAt(0, 0, 0);

    // Update orbit line rotation if inclination changes
    if (orbitLineRef.current) {
      orbitLineRef.current.rotation.x = incRad;
    }
  }, [orbitAngleRad, altitudeKm, inclinationDeg]);

  const handleZoom = (delta) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(7, Math.min(30, cameraRef.current.position.z + delta));
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !sceneRef.current) return;
    cameraRef.current.position.set(0, 8, 16);
    sceneRef.current.rotation.set(0, 0, 0);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-lg overflow-hidden bg-space-950/80 border border-space-border flex flex-col">
      {/* 3D Canvas container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing relative" />

      {/* Flight Telemetry HUD Overlays */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-space-900/90 border border-space-border backdrop-blur">
          <span className={`w-2 h-2 rounded-full ${isInEclipse ? 'bg-amber-400 status-dot-amber' : 'bg-emerald-400 status-dot-emerald'}`} />
          <span className="text-xs font-mono font-medium text-slate-200">
            {isInEclipse ? 'ECLIPSE (UMBRA)' : 'DIRECT SUNLIGHT'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-space-900/90 border border-space-border backdrop-blur">
          <span className={`w-2 h-2 rounded-full ${isContacting ? 'bg-orbit-cyan status-dot-cyan' : 'bg-slate-500'}`} />
          <span className="text-xs font-mono font-medium text-slate-200">
            {isContacting ? 'DOWNLINK: ACTIVE AOS' : 'DOWNLINK: STANDBY LOS'}
          </span>
        </div>
      </div>

      {/* Coordinates readout */}
      <div className="absolute top-3 right-3 px-3 py-1.5 rounded bg-space-900/90 border border-space-border text-xs font-mono text-slate-300 pointer-events-none flex flex-col items-end">
        <div>LAT: <span className="text-orbit-cyan font-bold">{subSatelliteCoords.latitude.toFixed(2)}°</span></div>
        <div>LON: <span className="text-orbit-cyan font-bold">{subSatelliteCoords.longitude.toFixed(2)}°</span></div>
        <div>ALT: <span className="text-emerald-400 font-bold">{altitudeKm.toFixed(0)} km</span></div>
      </div>

      {/* Camera / Interactive Toolbar */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 rounded-md bg-space-900/90 border border-space-border backdrop-blur">
        <button
          onClick={() => handleZoom(-2)}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(2)}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-800 transition"
          title="Reset Camera"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`p-1.5 rounded transition ${isRotating ? 'text-orbit-cyan bg-space-800' : 'text-slate-400 hover:text-white'}`}
          title="Toggle Planetary Rotation"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
