import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCw, Box } from 'lucide-react';

/**
 * Interactive 3D Assembled Spacecraft Viewer
 * Dynamically builds 3D geometry representing the user's selected spacecraft bus,
 * solar panel arrays or RTG, high-gain dish or patch antenna, payloads, and thrusters.
 */
export default function SpacecraftViewer3D({ spacecraft, highlightedCategory }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelGroupRef = useRef(null);

  const [activeHighlight, setActiveHighlight] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.8, 2.2, 3.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // Dynamic Spacecraft Assembly Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Mouse rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      modelGroup.rotation.y += dx * 0.008;
      modelGroup.rotation.x += dy * 0.008;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animationId;
    let isVisible = true;
    let observer;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (isVisible) {
        if (!isDragging) {
          modelGroup.rotation.y += 0.003;
        }
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (observer) observer.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry when spacecraft configuration changes
  useEffect(() => {
    if (!modelGroupRef.current) return;
    const group = modelGroupRef.current;

    // Clear old children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const category = highlightedCategory || activeHighlight;

    // 1. Bus Structure Box
    const busGeo = new THREE.BoxGeometry(1.0, 1.2, 1.0);
    const busMat = new THREE.MeshStandardMaterial({
      color: category === 'bus' ? 0x38bdf8 : 0xd1d5db,
      metalness: 0.8,
      roughness: 0.3,
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    group.add(bus);

    // Multi-Layer Insulation (Gold Foil patch)
    const mliGeo = new THREE.PlaneGeometry(0.8, 1.0);
    const mliMat = new THREE.MeshStandardMaterial({
      color: category === 'thermal' ? 0x10b981 : 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const mliMesh = new THREE.Mesh(mliGeo, mliMat);
    mliMesh.position.set(0, 0, 0.505);
    group.add(mliMesh);

    // 2. Power Subsystem
    const isRTG = spacecraft?.power?.isRTG;
    if (isRTG) {
      // Cylinder RTG with cooling fins
      const rtgGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16);
      const rtgMat = new THREE.MeshStandardMaterial({
        color: category === 'power' ? 0x38bdf8 : 0x475569,
        metalness: 0.5,
        roughness: 0.5,
      });
      const rtg = new THREE.Mesh(rtgGeo, rtgMat);
      rtg.position.set(0.65, 0.2, 0);
      group.add(rtg);
    } else {
      // Deployable Solar Wings
      const wingGeo = new THREE.BoxGeometry(1.8, 0.04, 0.6);
      const wingMat = new THREE.MeshStandardMaterial({
        color: category === 'power' ? 0x38bdf8 : 0x0369a1,
        metalness: 0.9,
        roughness: 0.15,
      });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-1.45, 0, 0);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(1.45, 0, 0);
      group.add(leftWing);
      group.add(rightWing);
    }

    // 3. Communications Dish or Horn
    const isOptical = spacecraft?.comms?.isOptical;
    if (isOptical) {
      // Optical Laser Telescope Aperture
      const laserGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.4, 16);
      const laserMat = new THREE.MeshStandardMaterial({
        color: category === 'comms' ? 0x10b981 : 0x0f172a,
        metalness: 0.9,
      });
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.position.set(0, 0.75, 0.2);
      group.add(laser);
    } else {
      // High-gain parabolic dish
      const dishGeo = new THREE.ConeGeometry(0.45, 0.25, 24, 1, true);
      const dishMat = new THREE.MeshStandardMaterial({
        color: category === 'comms' ? 0x38bdf8 : 0xf8fafc,
        metalness: 0.7,
        roughness: 0.3,
        side: THREE.DoubleSide,
      });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0, 0.75, 0);
      dish.rotation.x = Math.PI;
      group.add(dish);
    }

    // 4. Instruments / Payloads (Cameras & Optical sensor tubes)
    const instCount = spacecraft?.instruments?.length || 1;
    for (let i = 0; i < Math.min(3, instCount); i++) {
      const camGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.45, 16);
      const camMat = new THREE.MeshStandardMaterial({
        color: category === 'payload' ? 0x10b981 : 0x1e293b,
        metalness: 0.8,
      });
      const cam = new THREE.Mesh(camGeo, camMat);
      const xOffset = (i - (Math.min(3, instCount) - 1) / 2) * 0.35;
      cam.position.set(xOffset, 0, 0.6);
      cam.rotation.x = Math.PI / 2;
      group.add(cam);
    }

    // 5. Propulsion Engine Nozzle
    const nozGeo = new THREE.ConeGeometry(0.25, 0.4, 16, 1, true);
    const nozMat = new THREE.MeshStandardMaterial({
      color: category === 'propulsion' ? 0xf59e0b : 0x334155,
      metalness: 0.9,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const nozzle = new THREE.Mesh(nozGeo, nozMat);
    nozzle.position.set(0, -0.75, 0);
    group.add(nozzle);
  }, [spacecraft, highlightedCategory, activeHighlight]);

  return (
    <div className="relative w-full h-[320px] rounded-lg overflow-hidden bg-space-900/60 border border-space-border flex flex-col">
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Subsystem quick overlay tags */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5 justify-center pointer-events-auto">
        {['bus', 'power', 'payload', 'comms', 'thermal', 'propulsion'].map((cat) => (
          <button
            key={cat}
            onMouseEnter={() => setActiveHighlight(cat)}
            onMouseLeave={() => setActiveHighlight(null)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase transition border ${
              (highlightedCategory === cat || activeHighlight === cat)
                ? 'bg-orbit-cyan/20 border-orbit-cyan text-orbit-cyan font-bold'
                : 'bg-space-950/80 border-space-border text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
