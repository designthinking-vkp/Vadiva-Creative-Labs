/**
 * VADIVA CREATIVE LABS - CINEMATIC ANIMATED HERO (Three.js WebGL Engine)
 * 
 * CORE STORYTELLING ARC: IDEA -> BUILD -> TEST -> IMPACT
 * 
 * Scene 1 — IDEA (0s - 4.5s):
 * A glowing spark of inspiration appears. Clean geometric particles coalesce into a 
 * 3D wireframe blueprint of an autonomous robotic rover and articulated arm.
 * 
 * Scene 2 — BUILD (4.5s - 9.5s):
 * The blueprint transforms into a physical robotic build. Mechanical limbs, turntable base,
 * PCB motherboard, microcontrollers, and actuators assemble and lock into place.
 * 
 * Scene 3 — TEST (9.5s - 14.5s):
 * The prototype comes alive. The robotic arm articulates through calibration cycles,
 * sensor scanning cones sweep the workspace, test waveforms illuminate circuit traces,
 * and diagnostic LED telemetry indicates operational readiness.
 * 
 * Scene 4 — IMPACT (14.5s - 19.5s):
 * Camera draws back to reveal the connected innovation ecosystem. Glowing national campus
 * network orbits radiate outwards, connecting students to real-world STEM possibilities.
 * Seamless loop returns gently to the spark of the next IDEA.
 * 
 * RESPONSIVE & COMPACT:
 * - Desktop: Rendered cleanly in right visual zone with subtle parallax.
 * - Mobile: Camera reframed to center on the robotic prototype, reduced particle count,
 *   compact container bounds, and performance optimizations.
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.info('[Vadiva Hero] prefers-reduced-motion enabled. Using static fallback.');
    return;
  }

  // WebGL context verification
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    console.warn('[Vadiva Hero] WebGL or Three.js unavailable. Using CSS fallback.');
    return;
  }

  const heroSection = document.querySelector('.hero');
  const canvas = document.getElementById('vadiva-hero-canvas');
  if (!heroSection || !canvas) return;

  heroSection.classList.add('hero-canvas-active');

  // Story Stage Duration Constants (Total Cycle = 19.0s)
  const DURATION_IDEA = 4.5;
  const DURATION_BUILD = 5.0;
  const DURATION_TEST = 5.0;
  const DURATION_IMPACT = 4.5;
  const TOTAL_CYCLE = DURATION_IDEA + DURATION_BUILD + DURATION_TEST + DURATION_IMPACT; // 19.0s

  // Brand Color Palette
  const COLOR_ORANGE = 0xf37e4b;
  const COLOR_ORANGE_BRIGHT = 0xff9e75;
  const COLOR_BLUE_ELECTRIC = 0x38bdf8;
  const COLOR_BLUE_DARK = 0x0f172a;
  const COLOR_CYAN = 0x0cb8c0;
  const COLOR_WHITE = 0xffffff;

  // Scene, Camera, Renderer Setup
  let scene, camera, renderer;
  let currentWidth = heroSection.clientWidth || window.innerWidth;
  let currentHeight = heroSection.clientHeight || 680;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060a1a, 0.035);

  camera = new THREE.PerspectiveCamera(46, currentWidth / currentHeight, 0.1, 100);
  camera.position.set(2.0, 0.5, 7.2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(currentWidth, currentHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting Configuration
  const ambientLight = new THREE.AmbientLight(0x1a264a, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const orangeRimLight = new THREE.PointLight(COLOR_ORANGE, 2.8, 18);
  orangeRimLight.position.set(2.5, 1.2, 2.5);
  scene.add(orangeRimLight);

  const electricFillLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 2.4, 20);
  electricFillLight.position.set(0.5, 2.2, -1.8);
  scene.add(electricFillLight);

  // Interactive Mouse Parallax
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    mouse.targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.targetY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Master Innovation Group (Anchored in right half on desktop, centered on mobile)
  const innovationRoot = new THREE.Group();
  innovationRoot.position.set(1.5, -0.15, 0);
  scene.add(innovationRoot);

  // ===========================================================================
  // SCENE 1: IDEA — THE BLUEPRINT & CONVERGING THOUGHT PARTICLES
  // ===========================================================================
  const groupIdea = new THREE.Group();
  innovationRoot.add(groupIdea);

  // 1. Blueprint Particles
  const isNarrowScreen = window.innerWidth <= 768;
  const particleCount = isNarrowScreen ? 320 : 640;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 1.45 + (Math.random() - 0.5) * 0.4;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particleData.push({
      origX: x, origY: y, origZ: z,
      r: r, theta: theta, phi: phi,
      speed: 0.3 + Math.random() * 0.7
    });

    if (Math.random() > 0.4) {
      particleColors[i * 3] = 0.95;
      particleColors[i * 3 + 1] = 0.49;
      particleColors[i * 3 + 2] = 0.29; // Orange
    } else {
      particleColors[i * 3] = 0.22;
      particleColors[i * 3 + 1] = 0.74;
      particleColors[i * 3 + 2] = 0.97; // Electric Blue
    }
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.052,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  groupIdea.add(particleSystem);

  // 2. Blueprint Wireframe Sphere & Coordinate Latitudes
  const blueprintWireMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
  });
  const blueprintSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 2), blueprintWireMat);
  groupIdea.add(blueprintSphere);

  // Blueprint Concept Compass Rings
  const compassRing1 = new THREE.Mesh(
    new THREE.RingGeometry(1.65, 1.68, 48),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE, side: THREE.DoubleSide, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
  );
  compassRing1.rotation.x = Math.PI * 0.4;
  groupIdea.add(compassRing1);

  const compassRing2 = new THREE.Mesh(
    new THREE.RingGeometry(1.85, 1.88, 48),
    new THREE.MeshBasicMaterial({ color: COLOR_CYAN, side: THREE.DoubleSide, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
  );
  compassRing2.rotation.y = Math.PI * 0.3;
  groupIdea.add(compassRing2);

  // Central Core "Idea Spark"
  const sparkSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 20, 20),
    new THREE.MeshBasicMaterial({ color: COLOR_WHITE, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9 })
  );
  groupIdea.add(sparkSphere);


  // ===========================================================================
  // SCENE 2: BUILD — ROBOTIC PROTOTYPE ASSEMBLY & LAB PEDESTAL
  // ===========================================================================
  const groupBuild = new THREE.Group();
  innovationRoot.add(groupBuild);

  // 1. Hexagonal Laboratory Test Pedestal
  const pedestalGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.28, 6);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x111c38,
    metalness: 0.8,
    roughness: 0.3,
    transparent: true,
    opacity: 0.95
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -1.15;
  groupBuild.add(pedestal);

  // Glowing Hex Pedestal Accent Edge
  const pedestalRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.22, 2.22, 0.05, 6),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
  );
  pedestalRim.position.y = -1.02;
  groupBuild.add(pedestalRim);

  // 2. Physical Student Robotics Prototype: Articulated 4-Axis Robotic Arm
  const robotArmGroup = new THREE.Group();
  robotArmGroup.position.set(0.4, -1.0, 0);
  groupBuild.add(robotArmGroup);

  // Base Turntable
  const armTurntableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const armOrangeMat = new THREE.MeshStandardMaterial({
    color: COLOR_ORANGE,
    metalness: 0.5,
    roughness: 0.2,
    emissive: 0x9a3412,
    emissiveIntensity: 0.35
  });
  const armTurntable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 20), armTurntableMat);
  robotArmGroup.add(armTurntable);

  // Base Servo Ring
  const servoRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.03, 12, 32),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, blending: THREE.AdditiveBlending })
  );
  servoRing.rotation.x = Math.PI / 2;
  servoRing.position.y = 0.1;
  robotArmGroup.add(servoRing);

  // Shoulder Joint & Lower Arm
  const armShoulder = new THREE.Group();
  armShoulder.position.set(0, 0.25, 0);
  robotArmGroup.add(armShoulder);

  const shoulderSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 18), armOrangeMat);
  armShoulder.add(shoulderSphere);

  const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.24), armTurntableMat);
  lowerArm.position.set(0, 0.58, 0);
  armShoulder.add(lowerArm);

  // Elbow Joint & Upper Forearm
  const armElbow = new THREE.Group();
  armElbow.position.set(0, 1.15, 0);
  armShoulder.add(armElbow);

  const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), armOrangeMat);
  armElbow.add(elbowSphere);

  const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.2), armTurntableMat);
  upperArm.position.set(0, 0.52, 0);
  armElbow.add(upperArm);

  // Wrist & Actuator End Effector
  const armWrist = new THREE.Group();
  armWrist.position.set(0, 1.05, 0);
  armElbow.add(armWrist);

  const wristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), armOrangeMat);
  armWrist.add(wristSphere);

  // Dual Claw Gripper (Mechanical Prototype)
  const gripperMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
  const clawLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.08), gripperMat);
  clawLeft.position.set(-0.1, 0.22, 0);
  clawLeft.rotation.z = -0.15;
  armWrist.add(clawLeft);

  const clawRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.08), gripperMat);
  clawRight.position.set(0.1, 0.22, 0);
  clawRight.rotation.z = 0.15;
  armWrist.add(clawRight);

  // Tool Focal Point Light
  const toolSparkLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 1.2, 4);
  toolSparkLight.position.set(0, 0.35, 0);
  armWrist.add(toolSparkLight);

  // 3. Embedded Engineering Modules: Microcontroller PCB & Breadboard Prototype
  const pcbWorkbench = new THREE.Group();
  pcbWorkbench.position.set(-0.85, -0.92, 0.2);
  groupBuild.add(pcbWorkbench);

  // PCB Board
  const pcbBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.05, 0.95),
    new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 })
  );
  pcbWorkbench.add(pcbBoard);

  // MCU Chip
  const mcuChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.08, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
  );
  mcuChip.position.set(0, 0.06, 0);
  pcbWorkbench.add(mcuChip);

  // Power LED
  const pcbLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 10),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE, blending: THREE.AdditiveBlending })
  );
  pcbLed.position.set(0.4, 0.06, 0.3);
  pcbWorkbench.add(pcbLed);


  // ===========================================================================
  // SCENE 3: TEST — SENSOR SWEEPS, CIRCUIT WAVEFORMS & ACTIVE EXPERIMENTATION
  // ===========================================================================
  const groupTest = new THREE.Group();
  innovationRoot.add(groupTest);

  // 1. Sweeping Ultrasonic/LiDAR Sensor Cone from Robot Hand
  const sensorConeGeo = new THREE.ConeGeometry(0.9, 2.0, 24, 1, true);
  const sensorConeMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sensorCone = new THREE.Mesh(sensorConeGeo, sensorConeMat);
  sensorCone.position.set(0.4, 0.4, 0.2);
  sensorCone.rotation.x = Math.PI; // Point down toward workbench
  groupTest.add(sensorCone);

  // 2. Oscilloscope / Circuit Sine Waveform Curves
  const wavePoints = [];
  for (let w = 0; w <= 48; w++) {
    const wx = (w / 48) * 3.0 - 1.5;
    const wy = Math.sin((w / 48) * Math.PI * 4) * 0.25;
    wavePoints.push(new THREE.Vector3(wx, wy, 0));
  }
  const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePoints);
  const waveMat = new THREE.LineBasicMaterial({
    color: COLOR_ORANGE,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const circuitWave = new THREE.Line(waveGeo, waveMat);
  circuitWave.position.set(0, 0.9, 0.2);
  groupTest.add(circuitWave);

  // 3. Dynamic Test Data Ring (Holographic Calibration Meter)
  const testDial = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.25, 32),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, wireframe: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  testDial.position.set(0.4, 0.6, 0);
  testDial.rotation.y = Math.PI * 0.2;
  groupTest.add(testDial);


  // ===========================================================================
  // SCENE 4: IMPACT — NATIONAL INNOVATION ECOSYSTEM & GLOBAL CONNECTIVITY
  // ===========================================================================
  const groupImpact = new THREE.Group();
  innovationRoot.add(groupImpact);

  // 1. Ecosystem Orbital Rings
  const orbitGroup = new THREE.Group();
  groupImpact.add(orbitGroup);

  for (let o = 0; o < 3; o++) {
    const orbitPts = [];
    const rX = 2.4 + o * 0.4;
    const rZ = 1.6 + o * 0.3;
    for (let a = 0; a <= 48; a++) {
      const angle = (a / 48) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(angle) * rX, 0, Math.sin(angle) * rZ));
    }
    const oLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPts),
      new THREE.LineBasicMaterial({
        color: o % 2 === 0 ? COLOR_ORANGE : COLOR_BLUE_ELECTRIC,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      })
    );
    oLine.rotation.x = Math.PI * (0.2 + o * 0.18);
    oLine.rotation.z = Math.PI * (0.12 * o);
    orbitGroup.add(oLine);

    // Connected Node Satellite
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: o % 2 === 0 ? COLOR_ORANGE_BRIGHT : COLOR_BLUE_ELECTRIC, blending: THREE.AdditiveBlending })
    );
    orbitGroup.add(sat);
  }

  // 2. Global Luminous Impact Sphere
  const impactCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 2),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, wireframe: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
  );
  impactCore.position.set(0, 0.2, 0);
  groupImpact.add(impactCore);


  // ===========================================================================
  // HUD UI BINDINGS & STORY STATE SYNCHRONIZATION
  // ===========================================================================
  const stagePillTag = document.querySelector('.stage-tag');
  const stagePillTitle = document.getElementById('stage-title-text');
  const stagePillDesc = document.getElementById('stage-desc-text');
  const hudTelTitle = document.getElementById('hud-telemetry-title');
  const hudTelMetric = document.getElementById('hud-telemetry-metric');
  const navButtons = document.querySelectorAll('.scene-step-btn');
  const navProgressBar = document.querySelector('.scene-nav-progress');

  const STORY_METADATA = [
    {
      tag: 'STAGE 01',
      title: 'IDEA',
      desc: 'Blueprint Conception',
      telTitle: 'STUDENT INVENTIONS',
      telMetric: 'Structured Pedagogy Activated'
    },
    {
      tag: 'STAGE 02',
      title: 'BUILD',
      desc: 'Physical Robotics Prototyping',
      telTitle: 'MAKER FORGE LAB',
      telMetric: 'Actuators & Sensors Assembled'
    },
    {
      tag: 'STAGE 03',
      title: 'TEST',
      desc: 'Real-World Calibration',
      telTitle: 'SYSTEM VALIDATION',
      telMetric: 'Real-Time Sensor Feeds Active'
    },
    {
      tag: 'STAGE 04',
      title: 'IMPACT',
      desc: 'National Innovation Ecosystem',
      telTitle: '28+ PARTNER CAMPUSES',
      telMetric: '10,000+ Students Impacted'
    }
  ];

  let manualTimeOverride = null;

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-scene'), 10) || 0;
      switch (idx) {
        case 0: manualTimeOverride = 0.5; break;
        case 1: manualTimeOverride = 4.8; break;
        case 2: manualTimeOverride = 9.8; break;
        case 3: manualTimeOverride = 14.8; break;
      }
    });
  });

  function updateStoryHUD(activeStageIndex, progress) {
    const meta = STORY_METADATA[activeStageIndex];
    if (meta) {
      if (stagePillTag) stagePillTag.textContent = meta.tag;
      if (stagePillTitle) stagePillTitle.textContent = meta.title;
      if (stagePillDesc) stagePillDesc.textContent = meta.desc;
      if (hudTelTitle) hudTelTitle.textContent = meta.telTitle;
      if (hudTelMetric) hudTelMetric.textContent = meta.telMetric;
    }

    if (navButtons.length > 0) {
      navButtons.forEach((btn, idx) => {
        if (idx === activeStageIndex) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        }
      });
    }

    if (navProgressBar) {
      navProgressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }


  // ===========================================================================
  // MAIN ANIMATION LOOP & STORY ARC CHOREOGRAPHY
  // ===========================================================================
  const clock = new THREE.Clock();
  let accumulatedTime = 0;
  let isVisible = true;
  let animFrameId = null;

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    if (!isVisible) return; // Pause rendering if scrolled out of view

    const delta = clock.getDelta();
    accumulatedTime += delta;

    if (manualTimeOverride !== null) {
      accumulatedTime = manualTimeOverride;
      manualTimeOverride = null;
    }

    const cycleTime = accumulatedTime % TOTAL_CYCLE;
    const progress = cycleTime / TOTAL_CYCLE;

    // Mouse Parallax Lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Determine Active Scene & Transition Weights (Smooth Continuous Blending)
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    let activeIndex = 0;

    if (cycleTime < 4.5) {
      activeIndex = 0; // IDEA
      w1 = 1.0;
      if (cycleTime > 3.5) {
        const t = (cycleTime - 3.5) / 1.0;
        w1 = 1.0 - t;
        w2 = t;
      }
    } else if (cycleTime < 9.5) {
      activeIndex = 1; // BUILD
      const tScene = cycleTime - 4.5;
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
    } else if (cycleTime < 14.5) {
      activeIndex = 2; // TEST
      const tScene = cycleTime - 9.5;
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
      activeIndex = 3; // IMPACT
      const tScene = cycleTime - 14.5;
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

    updateStoryHUD(activeIndex, progress);

    // Apply Opacity & Transformations to Groups
    groupIdea.visible = w1 > 0.01;
    particleMat.opacity = w1 * 0.95;
    blueprintWireMat.opacity = w1 * 0.45;
    sparkSphere.material.opacity = w1 * 0.9;

    groupBuild.visible = (w2 > 0.01 || w3 > 0.01);
    // Keep robot prototype visible and prominent during both BUILD and TEST
    const robotVisibility = Math.max(w2, w3, (w4 > 0 ? 0.3 * w4 : 0));
    groupBuild.scale.setScalar(0.9 + robotVisibility * 0.1);
    pedestalMat.opacity = 0.4 + robotVisibility * 0.55;

    groupTest.visible = w3 > 0.01;
    sensorConeMat.opacity = w3 * 0.35;
    waveMat.opacity = w3 * 0.8;
    testDial.material.opacity = w3 * 0.6;

    groupImpact.visible = w4 > 0.01;
    impactCore.material.opacity = w4 * 0.55;

    // -------------------------------------------------------------------------
    // INTERNAL OBJECT MOTION & KINEMATICS
    // -------------------------------------------------------------------------

    // 1. Scene 1 Particles & Blueprint Rotation
    if (groupIdea.visible) {
      blueprintSphere.rotation.y += 0.006;
      compassRing1.rotation.z += 0.008;
      compassRing2.rotation.z -= 0.006;

      const positions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i];
        const angle = p.theta + accumulatedTime * p.speed * 0.3;
        const curR = p.r + Math.sin(accumulatedTime * 2.5 + i) * 0.05;
        positions[i * 3] = curR * Math.sin(p.phi) * Math.cos(angle);
        positions[i * 3 + 1] = curR * Math.sin(p.phi) * Math.sin(angle);
        positions[i * 3 + 2] = curR * Math.cos(p.phi);
      }
      particleGeo.attributes.position.needsUpdate = true;
    }

    // 2. Robotic Arm Articulation (Active during BUILD & TEST)
    if (groupBuild.visible) {
      const armTime = accumulatedTime * 1.5;
      armTurntable.rotation.y = Math.sin(armTime * 0.4) * 0.4;
      armShoulder.rotation.z = Math.sin(armTime * 0.7) * 0.22 - 0.15;
      armElbow.rotation.z = Math.cos(armTime * 0.8) * 0.3 + 0.25;
      armWrist.rotation.y = armTime * 1.2;

      // LED Pulsing
      pcbLed.scale.setScalar(0.85 + Math.sin(accumulatedTime * 8) * 0.25);
    }

    // 3. Sensor Cone & Circuit Wave Animation during TEST
    if (groupTest.visible) {
      sensorCone.rotation.y += 0.03;
      testDial.rotation.z += 0.01;

      // Animate wave vertices
      const waveArray = waveGeo.attributes.position.array;
      for (let w = 0; w <= 48; w++) {
        waveArray[w * 3 + 1] = Math.sin((w / 48) * Math.PI * 4 + accumulatedTime * 6) * 0.25;
      }
      waveGeo.attributes.position.needsUpdate = true;
    }

    // 4. Impact Ecosystem Orbitals
    if (groupImpact.visible) {
      impactCore.rotation.y += 0.008;
      orbitGroup.rotation.y += 0.007;
    }

    // -------------------------------------------------------------------------
    // ADAPTIVE CAMERA PATH (Desktop vs Mobile Framing)
    // -------------------------------------------------------------------------
    const isMobile = window.innerWidth <= 768;

    let targetCamX = isMobile ? 0 : (1.6 + mouse.x * 0.5);
    let targetCamY = isMobile ? -0.1 : (0.4 + mouse.y * 0.35);
    let targetCamZ = isMobile ? 6.2 : 7.2;

    if (activeIndex === 0) {
      // IDEA: Forward glide
      targetCamZ = isMobile ? 6.4 : 7.5;
    } else if (activeIndex === 1) {
      // BUILD: Focus down into the robotic workshop
      targetCamZ = isMobile ? 5.8 : 6.6;
      targetCamY = isMobile ? -0.2 : (0.3 + mouse.y * 0.35);
    } else if (activeIndex === 2) {
      // TEST: Level framing showing prototype & sensor sweep
      targetCamZ = isMobile ? 6.0 : 6.8;
      targetCamY = isMobile ? -0.1 : (0.45 + mouse.y * 0.35);
    } else {
      // IMPACT: Pull back to reveal full interconnected ecosystem
      targetCamZ = isMobile ? 6.6 : 7.6;
      targetCamY = isMobile ? 0 : (0.4 + mouse.y * 0.35);
    }

    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;

    const lookTargetX = isMobile ? 0 : 1.5;
    const lookTargetY = isMobile ? -0.2 : 0.05;
    camera.lookAt(lookTargetX, lookTargetY, 0);

    renderer.render(scene, camera);
  }

  // ===========================================================================
  // RESPONSIVE VIEWPORT & RESIZE OBSERVER
  // ===========================================================================
  function handleResize() {
    if (!heroSection || !renderer || !camera) return;

    const isMobile = window.innerWidth <= 768;
    const visualContainer = document.querySelector('.hero-visual');

    // On mobile, size to the dedicated compact visual area
    if (isMobile && visualContainer) {
      currentWidth = visualContainer.clientWidth || window.innerWidth;
      currentHeight = visualContainer.clientHeight || 290;
      innovationRoot.position.set(0, -0.1, 0); // Perfectly centered
      camera.fov = 48;
    } else {
      currentWidth = heroSection.clientWidth || window.innerWidth;
      currentHeight = heroSection.clientHeight || 700;
      innovationRoot.position.set(1.5, -0.15, 0); // Positioned in right column
      camera.fov = 46;
    }

    camera.aspect = currentWidth / currentHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(currentWidth, currentHeight);
  }

  window.addEventListener('resize', handleResize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(heroSection);
  }
  handleResize(); // Initial call

  // IntersectionObserver to pause loop off-screen
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    observer.observe(heroSection);
  }

  // Start animation loop
  animFrameId = requestAnimationFrame(animate);

  console.info('[Vadiva Hero] Rebuilt 4-Scene Story (IDEA -> BUILD -> TEST -> IMPACT) Loaded.');
})();
