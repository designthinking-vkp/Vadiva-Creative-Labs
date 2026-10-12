/**
 * VADIVA CREATIVE LABS - CINEMATIC ANIMATED HERO (Three.js WebGL Experience)
 * 
 * 4 Connected Continuous Cinematic Stages:
 * - Scene 1: The Spark (0s - 4s) -> Electric blue & orange particles assemble a glowing digital globe with network lines
 * - Scene 2: The Makers (4s - 9s) -> Modern robotics maker lab with animated articulated robotic arm, circuit breadboards & glowing mechanical prototypes
 * - Scene 3: The Breakthrough (9s - 14s) -> Holographic engineering HUD rings, floating technical circuit pathways, AI neural network matrix
 * - Scene 4: The Future (14s - 19s) -> Global interconnected innovation ecosystem, radiating energy pulses, camera pull-back settling smoothly to loop
 *
 * Performance Optimized:
 * - Single WebGLRenderer with requestAnimationFrame
 * - Reused geometries and materials
 * - Throttled DPR (max 2)
 * - content-visibility / IntersectionObserver awareness (pauses off-screen)
 * - Graceful fallback if WebGL unavailable or prefers-reduced-motion active
 */

(function () {
  'use strict';

  // Check reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.info('[Vadiva Hero] Reduced motion requested. Keeping ambient fallback.');
    return;
  }

  // Check WebGL availability
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    console.warn('[Vadiva Hero] WebGL or Three.js not available. Using CSS fallback.');
    return;
  }

  const container = document.querySelector('.hero');
  const canvas = document.getElementById('vadiva-hero-canvas');
  if (!container || !canvas) return;

  // Mark container as active for smooth CSS blend
  container.classList.add('hero-canvas-active');

  // Configuration constants
  const DURATION_SCENE_1 = 4.0;
  const DURATION_SCENE_2 = 5.0;
  const DURATION_SCENE_3 = 5.0;
  const DURATION_SCENE_4 = 5.0;
  const TOTAL_CYCLE = DURATION_SCENE_1 + DURATION_SCENE_2 + DURATION_SCENE_3 + DURATION_SCENE_4; // 19s

  // Brand Palette
  const COLOR_ORANGE = 0xf37e4b;
  const COLOR_ORANGE_BRIGHT = 0xff9e75;
  const COLOR_BLUE_ELECTRIC = 0x38bdf8;
  const COLOR_BLUE_NAVY = 0x0f172a;
  const COLOR_CYAN = 0x0cb8c0;
  const COLOR_GOLD = 0xfbbf24;

  // Scene, Camera, Renderer
  let scene, camera, renderer;
  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || 700;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060919, 0.038);

  camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
  camera.position.set(2.2, 0.6, 7.5);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a264a, 1.2);
  scene.add(ambientLight);

  const mainSpotLight = new THREE.DirectionalLight(0xffffff, 1.4);
  mainSpotLight.position.set(5, 8, 5);
  scene.add(mainSpotLight);

  const orangePointLight = new THREE.PointLight(COLOR_ORANGE, 2.5, 20);
  orangePointLight.position.set(3, 1, 3);
  scene.add(orangePointLight);

  const bluePointLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 2.2, 22);
  bluePointLight.position.set(1, 2, -2);
  scene.add(bluePointLight);

  // Interactive Mouse Parallax
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    mouse.targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.targetY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Master Root Anchor shifted slightly to the RIGHT to leave Left zone completely clear for text
  const heroWorld = new THREE.Group();
  heroWorld.position.set(1.5, -0.2, 0);
  scene.add(heroWorld);

  // ---------------------------------------------------------------------------
  // OBJECT HIERARCHIES FOR THE 4 SCENES
  // ---------------------------------------------------------------------------

  // Group 1: The Spark & Digital Globe
  const groupSpark = new THREE.Group();
  heroWorld.add(groupSpark);

  // Particle cloud for Spark
  const sparkCount = 950;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkColors = new Float32Array(sparkCount * 3);
  const sparkOrig = [];

  for (let i = 0; i < sparkCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 1.6 + (Math.random() - 0.5) * 0.35;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    sparkPos[i * 3] = x;
    sparkPos[i * 3 + 1] = y;
    sparkPos[i * 3 + 2] = z;
    sparkOrig.push({ x, y, z, r, theta, phi, speed: 0.2 + Math.random() * 0.8 });

    // Alternating orange and electric blue
    if (Math.random() > 0.42) {
      sparkColors[i * 3] = 0.95;
      sparkColors[i * 3 + 1] = 0.49;
      sparkColors[i * 3 + 2] = 0.29; // Orange
    } else {
      sparkColors[i * 3] = 0.22;
      sparkColors[i * 3 + 1] = 0.74;
      sparkColors[i * 3 + 2] = 0.97; // Cyan/Blue
    }
  }

  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

  const sparkMat = new THREE.PointsMaterial({
    size: 0.052,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  groupSpark.add(sparkPoints);

  // Digital Globe Wireframe Mesh
  const globeWireGeo = new THREE.IcosahedronGeometry(1.55, 3);
  const globeWireMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const globeWire = new THREE.Mesh(globeWireGeo, globeWireMat);
  groupSpark.add(globeWire);

  // Glowing Core Sphere
  const globeCoreGeo = new THREE.SphereGeometry(1.15, 24, 24);
  const globeCoreMat = new THREE.MeshBasicMaterial({
    color: 0x0e2554,
    transparent: true,
    opacity: 0.55
  });
  const globeCore = new THREE.Mesh(globeCoreGeo, globeCoreMat);
  groupSpark.add(globeCore);

  // Concentric Energy Latitude Rings
  const ringGeo1 = new THREE.RingGeometry(1.85, 1.88, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const energyRing1 = new THREE.Mesh(ringGeo1, ringMat1);
  energyRing1.rotation.x = Math.PI * 0.42;
  groupSpark.add(energyRing1);

  const ringGeo2 = new THREE.RingGeometry(2.1, 2.13, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const energyRing2 = new THREE.Mesh(ringGeo2, ringMat2);
  energyRing2.rotation.y = Math.PI * 0.35;
  energyRing2.rotation.z = Math.PI * 0.15;
  groupSpark.add(energyRing2);


  // ---------------------------------------------------------------------------
  // GROUP 2: THE MAKERS (Robotics Lab Prototype & Mechanical Arm)
  // ---------------------------------------------------------------------------
  const groupMakers = new THREE.Group();
  heroWorld.add(groupMakers);

  // Heavy Sci-Fi Workbench / Platform Pedestal
  const benchBaseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.3, 32);
  const benchBaseMat = new THREE.MeshStandardMaterial({
    color: 0x111c38,
    metalness: 0.85,
    roughness: 0.25,
    transparent: true,
    opacity: 0.95
  });
  const benchBase = new THREE.Mesh(benchBaseGeo, benchBaseMat);
  benchBase.position.y = -1.2;
  groupMakers.add(benchBase);

  // Illuminated Workbench Circuit Trim Ring
  const benchTrimGeo = new THREE.TorusGeometry(2.42, 0.04, 16, 64);
  const benchTrimMat = new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });
  const benchTrim = new THREE.Mesh(benchTrimGeo, benchTrimMat);
  benchTrim.rotation.x = Math.PI / 2;
  benchTrim.position.y = -1.05;
  groupMakers.add(benchTrim);

  // ARTICULATED ROBOTIC ARM HIERARCHY
  const robotRoot = new THREE.Group();
  robotRoot.position.set(0.6, -1.05, 0);
  groupMakers.add(robotRoot);

  // Turntable Base
  const armBaseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 24);
  const armDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.3
  });
  const armAccentMat = new THREE.MeshStandardMaterial({
    color: COLOR_ORANGE,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.4
  });
  const armTurntable = new THREE.Mesh(armBaseGeo, armDarkMat);
  robotRoot.add(armTurntable);

  // Shoulder Joint & Bicep
  const shoulderJoint = new THREE.Group();
  shoulderJoint.position.set(0, 0.25, 0);
  robotRoot.add(shoulderJoint);

  const shoulderSphere = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), armAccentMat);
  shoulderJoint.add(shoulderSphere);

  const bicepGeo = new THREE.BoxGeometry(0.24, 1.25, 0.28);
  const bicepMesh = new THREE.Mesh(bicepGeo, armDarkMat);
  bicepMesh.position.set(0, 0.62, 0);
  shoulderJoint.add(bicepMesh);

  // Elbow Joint & Forearm
  const elbowJoint = new THREE.Group();
  elbowJoint.position.set(0, 1.25, 0);
  shoulderJoint.add(elbowJoint);

  const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), armAccentMat);
  elbowJoint.add(elbowSphere);

  const forearmGeo = new THREE.BoxGeometry(0.2, 1.1, 0.22);
  const forearmMesh = new THREE.Mesh(forearmGeo, armDarkMat);
  forearmMesh.position.set(0, 0.55, 0);
  elbowJoint.add(forearmMesh);

  // Wrist & Manipulator Gripper (End Effector)
  const wristJoint = new THREE.Group();
  wristJoint.position.set(0, 1.1, 0);
  elbowJoint.add(wristJoint);

  const wristGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
  const wristMesh = new THREE.Mesh(wristGeo, armAccentMat);
  wristMesh.rotation.z = Math.PI / 2;
  wristJoint.add(wristMesh);

  // Laser / Laser Welding Focus Tool tip
  const toolTipGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
  const toolTipMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    blending: THREE.AdditiveBlending
  });
  const toolTip = new THREE.Mesh(toolTipGeo, toolTipMat);
  toolTip.position.set(0, 0.25, 0);
  wristJoint.add(toolTip);

  // Active Sparking Node at tool tip
  const sparkPointLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 1.2, 5);
  sparkPointLight.position.set(0, 0.45, 0);
  wristJoint.add(sparkPointLight);

  // LABORATORY PROTOTYPE COMPONENTS (Microcontroller, Printed Circuit Boards, Sensors)
  const labComponents = new THREE.Group();
  labComponents.position.set(-0.8, -0.9, 0.2);
  groupMakers.add(labComponents);

  // Main PCB Motherboard
  const pcbGeo = new THREE.BoxGeometry(1.4, 0.06, 1.1);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Tech emerald green
    metalness: 0.3,
    roughness: 0.6
  });
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  labComponents.add(pcbMesh);

  // Microcontroller IC Chip
  const icGeo = new THREE.BoxGeometry(0.42, 0.1, 0.42);
  const icMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.2
  });
  const icMesh = new THREE.Mesh(icGeo, icMat);
  icMesh.position.set(0, 0.08, 0);
  labComponents.add(icMesh);

  // Pulsing Diagnostic LED on PCB
  const ledGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE,
    blending: THREE.AdditiveBlending
  });
  const ledMesh = new THREE.Mesh(ledGeo, ledMat);
  ledMesh.position.set(0.45, 0.08, 0.35);
  labComponents.add(ledMesh);

  // Additional engineering capacitors / modules
  for (let c = 0; c < 4; c++) {
    const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(-0.45 + c * 0.12, 0.12, -0.32);
    labComponents.add(capMesh);
  }


  // ---------------------------------------------------------------------------
  // GROUP 3: THE BREAKTHROUGH (Holographic Blueprints, Diagrams, Neural AI Grid)
  // ---------------------------------------------------------------------------
  const groupBreakthrough = new THREE.Group();
  heroWorld.add(groupBreakthrough);

  // Holographic Floating Blueprint Rings & Radar Glyphs
  const holoRingsGroup = new THREE.Group();
  groupBreakthrough.add(holoRingsGroup);

  const holoRingMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const holoRing1 = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 36), holoRingMat);
  holoRing1.rotation.x = Math.PI * 0.3;
  holoRingsGroup.add(holoRing1);

  const holoRing2 = new THREE.Mesh(new THREE.RingGeometry(1.8, 1.95, 48), new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  }));
  holoRing2.rotation.y = Math.PI * 0.25;
  holoRingsGroup.add(holoRing2);

  // Futuristic 3D Wireframe Polyhedron (Digital Blueprint Architecture)
  const polyGeo = new THREE.OctahedronGeometry(1.2, 1);
  const polyMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  const holoPoly = new THREE.Mesh(polyGeo, polyMat);
  holoPoly.position.set(0, 0.6, 0);
  groupBreakthrough.add(holoPoly);

  // Floating Neural Nodes & Circuit Synapses
  const neuralCount = 42;
  const neuralPoints = [];
  const neuralSpheres = [];

  for (let n = 0; n < neuralCount; n++) {
    const nPos = new THREE.Vector3(
      (Math.random() - 0.5) * 4.2,
      (Math.random() - 0.5) * 3.2 + 0.5,
      (Math.random() - 0.5) * 2.8
    );
    neuralPoints.push(nPos);

    const nMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.4 ? COLOR_ORANGE : COLOR_BLUE_ELECTRIC,
      blending: THREE.AdditiveBlending
    });
    const nMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), nMat);
    nMesh.position.copy(nPos);
    groupBreakthrough.add(nMesh);
    neuralSpheres.push({ mesh: nMesh, base: nPos.clone(), speed: 0.5 + Math.random() * 1.5 });
  }

  // Neural Connection Lines
  const lineMat = new THREE.LineBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  const lineGeo = new THREE.BufferGeometry();
  const lineCoords = [];

  for (let i = 0; i < neuralPoints.length; i++) {
    for (let j = i + 1; j < neuralPoints.length; j++) {
      if (neuralPoints[i].distanceTo(neuralPoints[j]) < 1.4) {
        lineCoords.push(
          neuralPoints[i].x, neuralPoints[i].y, neuralPoints[i].z,
          neuralPoints[j].x, neuralPoints[j].y, neuralPoints[j].z
        );
      }
    }
  }
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
  const neuralLines = new THREE.LineSegments(lineGeo, lineMat);
  groupBreakthrough.add(neuralLines);


  // ---------------------------------------------------------------------------
  // GROUP 4: THE FUTURE (Global Ecosystem, Radiant Orbital Tracks)
  // ---------------------------------------------------------------------------
  const groupFuture = new THREE.Group();
  heroWorld.add(groupFuture);

  // Grand Future Core - Polished Luminous Planetary Network
  const futureCoreGeo = new THREE.DodecahedronGeometry(1.6, 2);
  const futureCoreMat = new THREE.MeshStandardMaterial({
    color: 0x091b40,
    emissive: 0x0c3166,
    metalness: 0.9,
    roughness: 0.15,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });
  const futureCore = new THREE.Mesh(futureCoreGeo, futureCoreMat);
  futureCore.position.set(0, 0.4, 0);
  groupFuture.add(futureCore);

  // Multiple Elliptical Global Orbital Trails (Global Institutional Scale)
  const orbitGroup = new THREE.Group();
  futureCore.add(orbitGroup);

  for (let o = 0; o < 3; o++) {
    const curvePoints = [];
    const radiusX = 2.4 + o * 0.4;
    const radiusZ = 1.6 + o * 0.3;
    for (let a = 0; a <= 64; a++) {
      const angle = (a / 64) * Math.PI * 2;
      curvePoints.push(new THREE.Vector3(Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ));
    }
    const orbitCurveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const orbitCurveMat = new THREE.LineBasicMaterial({
      color: o % 2 === 0 ? COLOR_ORANGE : COLOR_BLUE_ELECTRIC,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const orbitLine = new THREE.Line(orbitCurveGeo, orbitCurveMat);
    orbitLine.rotation.x = Math.PI * (0.2 + o * 0.22);
    orbitLine.rotation.z = Math.PI * (0.15 * o);
    orbitGroup.add(orbitLine);

    // Orbiting Satellite Node
    const satMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 14, 14),
      new THREE.MeshBasicMaterial({ color: o % 2 === 0 ? COLOR_ORANGE_BRIGHT : COLOR_BLUE_ELECTRIC, blending: THREE.AdditiveBlending })
    );
    orbitGroup.add(satMesh);
  }

  // Radiating Light Pulse Flare Sphere
  const flareGeo = new THREE.SphereGeometry(0.35, 24, 24);
  const flareMat = new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE_BRIGHT,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const flareMesh = new THREE.Mesh(flareGeo, flareMat);
  flareMesh.position.set(0, 0.4, 0);
  groupFuture.add(flareMesh);


  // ---------------------------------------------------------------------------
  // HUD UI INTERACTION & SCENE SYNC
  // ---------------------------------------------------------------------------
  const sceneNavButtons = document.querySelectorAll('.scene-step-btn');
  const sceneProgressBar = document.querySelector('.scene-nav-progress');
  const hudTitle = document.querySelector('.hud-telemetry .hud-title');
  const hudMetric = document.querySelector('.hud-telemetry .hud-metric');

  const SCENE_NAMES = [
    { name: 'THE SPARK', metric: 'Global Innovation Seeds' },
    { name: 'THE MAKERS', metric: 'Active Robotics Lab' },
    { name: 'THE BREAKTHROUGH', metric: 'Holographic Prototyping' },
    { name: 'THE FUTURE', metric: 'National Ecosystem' }
  ];

  let manualTimeOverride = null;

  sceneNavButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const step = parseInt(btn.getAttribute('data-scene'), 10) || 0;
      switch (step) {
        case 0: manualTimeOverride = 0.5; break;
        case 1: manualTimeOverride = 4.5; break;
        case 2: manualTimeOverride = 9.5; break;
        case 3: manualTimeOverride = 14.5; break;
      }
    });
  });

  function updateHUD(currentSceneIndex, progressWithinTotal) {
    if (sceneNavButtons.length > 0) {
      sceneNavButtons.forEach((btn, idx) => {
        if (idx === currentSceneIndex) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    if (sceneProgressBar) {
      sceneProgressBar.style.width = `${(progressWithinTotal * 100).toFixed(1)}%`;
    }

    if (hudTitle && SCENE_NAMES[currentSceneIndex]) {
      hudTitle.textContent = SCENE_NAMES[currentSceneIndex].name;
    }
    if (hudMetric && SCENE_NAMES[currentSceneIndex]) {
      hudMetric.textContent = SCENE_NAMES[currentSceneIndex].metric;
    }
  }


  // ---------------------------------------------------------------------------
  // CONTINUOUS 4-SCENE CHOREOGRAPHY & ANIMATION LOOP
  // ---------------------------------------------------------------------------
  let clock = new THREE.Clock();
  let accumulatedTime = 0;
  let isVisible = true;
  let reqId = null;

  // Smooth blending helper
  function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  function animate() {
    reqId = requestAnimationFrame(animate);

    if (!isVisible) return; // Pause GPU cycles when off-screen

    const delta = clock.getDelta();
    accumulatedTime += delta;

    if (manualTimeOverride !== null) {
      accumulatedTime = manualTimeOverride;
      manualTimeOverride = null;
    }

    // Loop cycle 0s -> 19s
    const cycleTime = accumulatedTime % TOTAL_CYCLE;
    const progressTotal = cycleTime / TOTAL_CYCLE;

    // Mouse lerp for gentle camera parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // -------------------------------------------------------------------------
    // SCENE WEIGHT CALCULATION (Continuous Overlaps)
    // -------------------------------------------------------------------------
    // Scene 1: 0 - 4s
    // Scene 2: 4 - 9s
    // Scene 3: 9 - 14s
    // Scene 4: 14 - 19s (Loops back seamlessly to Scene 1)
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    let activeSceneIndex = 0;

    if (cycleTime < 4.0) {
      activeSceneIndex = 0;
      // Fade in from loop end (0 -> 1) and fade out toward 4s
      w1 = 1.0;
      if (cycleTime > 3.0) {
        const t = (cycleTime - 3.0) / 1.0;
        w1 = 1.0 - t;
        w2 = t;
      }
    } else if (cycleTime < 9.0) {
      activeSceneIndex = 1;
      const tScene = cycleTime - 4.0;
      if (tScene < 1.0) {
        w2 = tScene;
        w1 = 1.0 - tScene;
      } else if (tScene > 4.0) {
        const tOut = (tScene - 4.0) / 1.0;
        w2 = 1.0 - tOut;
        w3 = tOut;
      } else {
        w2 = 1.0;
      }
    } else if (cycleTime < 14.0) {
      activeSceneIndex = 2;
      const tScene = cycleTime - 9.0;
      if (tScene < 1.0) {
        w3 = tScene;
        w2 = 1.0 - tScene;
      } else if (tScene > 4.0) {
        const tOut = (tScene - 4.0) / 1.0;
        w3 = 1.0 - tOut;
        w4 = tOut;
      } else {
        w3 = 1.0;
      }
    } else {
      activeSceneIndex = 3;
      const tScene = cycleTime - 14.0;
      if (tScene < 1.0) {
        w4 = tScene;
        w3 = 1.0 - tScene;
      } else if (tScene > 4.0) {
        // Seamless loop back to Scene 1
        const tOut = (tScene - 4.0) / 1.0;
        w4 = 1.0 - tOut;
        w1 = tOut;
      } else {
        w4 = 1.0;
      }
    }

    updateHUD(activeSceneIndex, progressTotal);

    // Apply Opacity & Visibility to Groups
    groupSpark.visible = w1 > 0.01;
    groupSpark.position.y = (1.0 - w1) * 0.4;
    groupSpark.scale.setScalar(0.75 + w1 * 0.25);
    sparkMat.opacity = w1 * 0.9;
    globeWireMat.opacity = w1 * 0.35;
    energyRing1.material.opacity = w1 * 0.45;
    energyRing2.material.opacity = w1 * 0.35;

    groupMakers.visible = w2 > 0.01;
    groupMakers.position.y = -0.2 - (1.0 - w2) * 0.6;
    groupMakers.scale.setScalar(0.85 + w2 * 0.15);
    benchBaseMat.opacity = w2 * 0.95;
    benchTrimMat.opacity = w2 * 0.75;

    groupBreakthrough.visible = w3 > 0.01;
    groupBreakthrough.position.y = (1.0 - w3) * 0.3;
    groupBreakthrough.scale.setScalar(0.8 + w3 * 0.2);
    holoPoly.material.opacity = w3 * 0.65;
    holoRingMat.opacity = w3 * 0.6;
    lineMat.opacity = w3 * 0.35;

    groupFuture.visible = w4 > 0.01;
    groupFuture.scale.setScalar(0.85 + w4 * 0.15);
    futureCoreMat.opacity = w4 * 0.7;
    flareMat.opacity = w4 * 0.85;

    // -------------------------------------------------------------------------
    // INTERNAL KINEMATICS & PROCEDURAL ANIMATIONS
    // -------------------------------------------------------------------------

    // 1. Spark Particles & Rotating Wireframe Globe
    if (groupSpark.visible) {
      globeWire.rotation.y += 0.005;
      globeWire.rotation.x += 0.002;
      energyRing1.rotation.z += 0.008;
      energyRing2.rotation.z -= 0.006;

      const positions = sparkGeo.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        const orig = sparkOrig[i];
        const pAngle = orig.theta + accumulatedTime * orig.speed * 0.25;
        const currentR = orig.r + Math.sin(accumulatedTime * 2 + i) * 0.04;
        positions[i * 3] = currentR * Math.sin(orig.phi) * Math.cos(pAngle);
        positions[i * 3 + 1] = currentR * Math.sin(orig.phi) * Math.sin(pAngle);
        positions[i * 3 + 2] = currentR * Math.cos(orig.phi);
      }
      sparkGeo.attributes.position.needsUpdate = true;
    }

    // 2. Robotic Arm Precision Articulation
    if (groupMakers.visible) {
      const armTime = accumulatedTime * 1.6;
      robotRoot.rotation.y = Math.sin(armTime * 0.5) * 0.45;
      shoulderJoint.rotation.z = Math.sin(armTime * 0.8) * 0.28 - 0.2;
      shoulderJoint.rotation.x = Math.cos(armTime * 0.6) * 0.15;
      elbowJoint.rotation.z = Math.cos(armTime * 0.9) * 0.35 + 0.3;
      wristJoint.rotation.y = armTime * 1.5;

      // Pulsing weld spark
      sparkPointLight.intensity = 0.8 + Math.random() * 1.2;
      ledMesh.scale.setScalar(0.9 + Math.sin(accumulatedTime * 8) * 0.25);
    }

    // 3. Holographic Tech Diagrams & Neural AI Network
    if (groupBreakthrough.visible) {
      holoPoly.rotation.x += 0.01;
      holoPoly.rotation.y += 0.014;
      holoRing1.rotation.z += 0.008;
      holoRing2.rotation.z -= 0.012;

      for (let n = 0; n < neuralSpheres.length; n++) {
        const node = neuralSpheres[n];
        node.mesh.position.y = node.base.y + Math.sin(accumulatedTime * node.speed + n) * 0.12;
      }
    }

    // 4. Global Orbiters & Pulsing Flare
    if (groupFuture.visible) {
      futureCore.rotation.y += 0.008;
      futureCore.rotation.x = Math.sin(accumulatedTime * 0.4) * 0.15;
      orbitGroup.rotation.y += 0.006;
      flareMesh.scale.setScalar(1.0 + Math.sin(accumulatedTime * 3) * 0.2);
    }

    // -------------------------------------------------------------------------
    // CINEMATIC CAMERA PATH (Smooth Transitions Across 4 Scenes)
    // -------------------------------------------------------------------------
    // Scene 1: Camera glides slowly forward toward the digital globe
    // Scene 2: Camera pans slightly right and tilts down into the robotics workbench
    // Scene 3: Camera rotates to capture holographic depth
    // Scene 4: Camera gracefully pulls back to reveal the full global innovation ecosystem
    let targetCamX = 1.8 + mouse.x * 0.6;
    let targetCamY = 0.4 + mouse.y * 0.4;
    let targetCamZ = 7.0;

    if (activeSceneIndex === 0) {
      // The Spark: slow forward approach (7.6 -> 6.8)
      const p = (cycleTime / 4.0);
      targetCamZ = 7.6 - p * 0.8;
      targetCamX = 1.6 + mouse.x * 0.5;
      targetCamY = 0.3 + mouse.y * 0.4;
    } else if (activeSceneIndex === 1) {
      // The Makers: pan right, look closer at robotics bench (6.8 -> 6.2)
      const p = ((cycleTime - 4.0) / 5.0);
      targetCamZ = 6.8 - p * 0.4;
      targetCamX = 1.9 + mouse.x * 0.6;
      targetCamY = 0.5 + p * 0.2 + mouse.y * 0.4;
    } else if (activeSceneIndex === 2) {
      // The Breakthrough: elevate slightly for holographic depth
      const p = ((cycleTime - 9.0) / 5.0);
      targetCamZ = 6.4 + p * 0.4;
      targetCamX = 1.8 - p * 0.2 + mouse.x * 0.6;
      targetCamY = 0.7 + mouse.y * 0.4;
    } else {
      // The Future: pull back smoothly (6.8 -> 7.6) preparing seamless return to Scene 1
      const p = ((cycleTime - 14.0) / 5.0);
      targetCamZ = 6.8 + p * 0.8;
      targetCamX = 1.6 + mouse.x * 0.5;
      targetCamY = 0.5 - p * 0.2 + mouse.y * 0.4;
    }

    // Camera Eased Lerp
    camera.position.x += (targetCamX - camera.position.x) * 0.04;
    camera.position.y += (targetCamY - camera.position.y) * 0.04;
    camera.position.z += (targetCamZ - camera.position.z) * 0.04;
    camera.lookAt(1.5, 0.1, 0);

    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------------------
  // RESPONSIVENESS & INTERSECTION OBSERVER FOR PERFORMANCE
  // ---------------------------------------------------------------------------
  function onResize() {
    if (!container || !renderer || !camera) return;
    width = container.clientWidth;
    height = container.clientHeight;

    // Mobile / Tablet Framing Adjustments
    if (width <= 992) {
      heroWorld.position.set(0, -0.1, 0); // Center on mobile/tablet
      camera.fov = 54;
      camera.position.z = 8.5;
    } else {
      heroWorld.position.set(1.5, -0.2, 0); // Offset to right on desktop
      camera.fov = 48;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', onResize, { passive: true });
  onResize(); // Initial sizing

  // IntersectionObserver: Pause rendering when scrolled out of view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    observer.observe(container);
  }

  // Start the animation loop
  reqId = requestAnimationFrame(animate);

  console.info('[Vadiva Hero] Cinematic 4-Scene WebGL Experience Initialized.');
})();
