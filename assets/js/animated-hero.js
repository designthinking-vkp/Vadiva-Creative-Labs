/**
 * VADIVA CREATIVE LABS — CONTINUOUS 3D HERO ANIMATION STORY
 * 
 * Educational Philosophy:
 * "Education should go beyond acquiring information. Students should have opportunities
 * to think independently, design solutions, build working prototypes, test their ideas,
 * and develop practical skills."
 * 
 * Single Evolving Visual Object:
 * SPARK -> BLUEPRINT GLOBE -> WORKBENCH & ROBOT -> CALIBRATION CAGE & SENSOR TEST -> INNOVATION NETWORK -> SPARK
 * 
 * Exact 20.0-Second Continuous Story Timeline:
 * 
 * 01 — IDEA: The birth of an invention (0.0s – 5.0s)
 * - 0.0–1.0s: The spark appears in deep navy. Orange & electric-blue particles drift.
 *             One orange particle glows intensely, emits a soft pulse, camera pushes forward.
 * - 1.0–2.5s: The idea takes shape. Thin blue lines expand into geometric triangles assembling
 *             a 3D wireframe globe. Orange particles orbit, elliptical paths move around it,
 *             center glows softly.
 * - 2.5–4.0s: A world of possibilities. Blue network connections illuminate sequentially.
 *             Orange pulse travels across globe. Circular blueprint forms at center.
 * - 4.0–5.0s: Transition to BUILD. Outer wireframe reorganizes, lines converge toward center
 *             blueprint. Circular blueprint expands and rotates into a horizontal engineering
 *             workbench as camera moves downward.
 * 
 * 02 — BUILD: Turning imagination into something real (5.0s – 10.0s)
 * - 5.0–6.0s: Workbench emerges. Circular robotic base appears, outer ring illuminates electric blue,
 *             orange light orbits its circumference. Camera settles into 3/4 view.
 * - 6.0–7.5s: Components assemble. Three mechanical parts descend along controlled paths:
 *             1. Lower rotating base / actuator
 *             2. Middle mechanical elbow joint
 *             3. Upper manipulator / sensor assembly
 *             Connections snap into place with subtle mechanical movement and blue pulses.
 * - 7.5–8.5s: Prototype activates. Blue circuit path illuminates across workbench.
 *             Robotic assembly articulates through sequenced joint rotations.
 *             Orange signal pulse passes from base to end effector.
 * - 8.5–10.0s: Transition to TEST. Robot returns to neutral. Thin blue wireframe appears
 *              around it forming a 3D measurement cage. Camera pushes closer.
 * 
 * 03 — TEST: Proving that the idea works (10.0s – 15.0s)
 * - 10.0–11.0s: Testing environment activates. Wireframe cage expands. Measurement grid lines connect,
 *               orange marker points appear at joints and movement paths.
 * - 11.0–12.5s: Sensors evaluate movement. Robot executes controlled test movement. Trajectory lines
 *               trace path, orange joint markers pulse, holographic reference rings display calibration.
 * - 12.5–13.5s: Refinement & improvement (Iteration). Robot pauses, makes a small adjustment.
 *               Misaligned wireframe segment shifts into perfect position. Robot repeats movement
 *               smoothly as measurement lines lock into green/cyan alignment.
 * - 13.5–15.0s: Transition to IMPACT. Calibration cage expands beyond robot. Lines extend outward into
 *               connected network nodes. Camera pulls back smoothly.
 * 
 * 04 — IMPACT: One invention becomes part of something bigger (15.0s – 20.0s)
 * - 15.0–16.0s: Network expands. Connected lines radiate in all directions with blue intersection nodes
 *               and orange data pulses. Robot remains visible as central seed.
 * - 16.0–17.0s: Individual ideas connect into spherical structure. 4 innovation discipline clusters
 *               (Robotics/Engineering, AI/Tech, Creative Design, Collaboration) take shape.
 * - 17.0–18.5s: Ecosystem comes together. Camera pulls back to reveal complete digital globe of
 *               interconnected lines and nodes rotating slowly in harmony.
 * - 18.5–20.0s: Return to the beginning. Outer lines fade, central point brightens, one orange particle
 *               separates and drifts forward as camera approaches, looping seamlessly into Scene 01.
 */

(function () {
  'use strict';

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.info('[Vadiva Hero] prefers-reduced-motion is active. Ambient CSS fallback rendered.');
    return;
  }

  // WebGL support detection
  function isWebGLAvailable() {
    try {
      const testCanvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    console.warn('[Vadiva Hero] WebGL/Three.js not available. Using CSS fallback.');
    return;
  }

  const heroSection = document.querySelector('.hero');
  const canvas = document.getElementById('vadiva-hero-canvas');
  if (!heroSection || !canvas) return;

  heroSection.classList.add('hero-canvas-active');

  // Exact 20.0-second timeline configuration
  const TOTAL_CYCLE = 20.0;

  // Brand Palette
  const COLOR_ORANGE = 0xf37e4b;
  const COLOR_ORANGE_BRIGHT = 0xff9e75;
  const COLOR_BLUE_ELECTRIC = 0x38bdf8;
  const COLOR_BLUE_NAVY = 0x0f172a;
  const COLOR_CYAN = 0x0cb8c0;
  const COLOR_WHITE = 0xffffff;
  const COLOR_SUCCESS = 0x10b981;

  // Scene, Camera, Renderer Setup
  let scene, camera, renderer;
  let currentWidth = heroSection.clientWidth || window.innerWidth;
  let currentHeight = heroSection.clientHeight || 700;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060a1a, 0.032);

  camera = new THREE.PerspectiveCamera(46, currentWidth / currentHeight, 0.1, 100);
  camera.position.set(2.0, 0.4, 7.2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(currentWidth, currentHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a264a, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
  mainLight.position.set(4, 7, 5);
  scene.add(mainLight);

  const orangePointLight = new THREE.PointLight(COLOR_ORANGE, 2.8, 18);
  orangePointLight.position.set(2.4, 1.2, 2.5);
  scene.add(orangePointLight);

  const electricPointLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 2.2, 20);
  electricPointLight.position.set(0.6, 2.2, -1.8);
  scene.add(electricPointLight);

  // Mouse Parallax Interaction
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

  // Master Innovation Group
  const innovationRoot = new THREE.Group();
  innovationRoot.position.set(1.5, -0.15, 0);
  scene.add(innovationRoot);

  // ===========================================================================
  // 1. SCENE 01: IDEA (The Spark -> Blueprint Globe -> Circular Blueprint)
  // ===========================================================================
  const ideaGroup = new THREE.Group();
  innovationRoot.add(ideaGroup);

  // The Primary Spark Particle (The Birth of the Idea)
  const sparkGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: COLOR_WHITE,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });
  const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
  sparkMesh.position.set(0, 0, 0);
  ideaGroup.add(sparkMesh);

  // Spark Aura Halo
  const sparkHaloGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const sparkHaloMat = new THREE.MeshBasicMaterial({
    color: COLOR_ORANGE_BRIGHT,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const sparkHaloMesh = new THREE.Mesh(sparkHaloGeo, sparkHaloMat);
  sparkMesh.add(sparkHaloMesh);

  // Drifting Ambient Particles (Navy, Electric Blue, Orange)
  const isMobile = window.innerWidth <= 768;
  const particleCount = isMobile ? 260 : 540;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleMeta = [];

  for (let i = 0; i < particleCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 1.35 + (Math.random() - 0.5) * 0.35;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particleMeta.push({
      baseR: r,
      theta: theta,
      phi: phi,
      speed: 0.2 + Math.random() * 0.8,
      driftX: (Math.random() - 0.5) * 0.02,
      driftY: (Math.random() - 0.5) * 0.02
    });

    if (Math.random() > 0.45) {
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

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const particleSystem = new THREE.Points(particleGeo, particleMaterial);
  ideaGroup.add(particleSystem);

  // Assembling Wireframe Blueprint Globe (Triangular Icosahedron Geometry)
  const globeWireGeo = new THREE.IcosahedronGeometry(1.4, 2);
  const globeWireMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    wireframe: true,
    transparent: true,
    opacity: 0.0, // Fades in 1.0 - 2.5s
    blending: THREE.AdditiveBlending
  });
  const globeWireMesh = new THREE.Mesh(globeWireGeo, globeWireMat);
  ideaGroup.add(globeWireMesh);

  // Elliptical Blueprint Latitude Paths
  const orbitCurve1 = new THREE.Mesh(
    new THREE.RingGeometry(1.65, 1.68, 48),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  orbitCurve1.rotation.x = Math.PI * 0.38;
  ideaGroup.add(orbitCurve1);

  const orbitCurve2 = new THREE.Mesh(
    new THREE.RingGeometry(1.85, 1.88, 48),
    new THREE.MeshBasicMaterial({ color: COLOR_CYAN, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  orbitCurve2.rotation.y = Math.PI * 0.25;
  ideaGroup.add(orbitCurve2);

  // The Central Circular Blueprint (Forms 2.5s - 4.0s, expands to workbench at 4.0s - 5.0s)
  const circularBlueprintGroup = new THREE.Group();
  circularBlueprintGroup.position.set(0, 0, 0);
  ideaGroup.add(circularBlueprintGroup);

  const blueprintRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 0.92, 48),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  circularBlueprintGroup.add(blueprintRing);

  const blueprintInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.48, 36),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  circularBlueprintGroup.add(blueprintInnerRing);


  // ===========================================================================
  // 2. SCENE 02: BUILD (Workbench, Controlled Assembly & Activation)
  // ===========================================================================
  const buildGroup = new THREE.Group();
  innovationRoot.add(buildGroup);

  // 1. Physical Engineering Workbench
  const workbenchMat = new THREE.MeshStandardMaterial({
    color: 0x111c38,
    metalness: 0.85,
    roughness: 0.25,
    transparent: true,
    opacity: 0.0
  });
  const workbench = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.25, 32), workbenchMat);
  workbench.position.y = -1.15;
  buildGroup.add(workbench);

  // Illuminated Outer Circumference Track (Electric Blue)
  const workbenchTrack = new THREE.Mesh(
    new THREE.TorusGeometry(2.32, 0.035, 16, 64),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  workbenchTrack.rotation.x = Math.PI / 2;
  workbenchTrack.position.y = -1.02;
  buildGroup.add(workbenchTrack);

  // Orbiting Orange Circumference Light Runner
  const orbitLightMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE_BRIGHT, blending: THREE.AdditiveBlending })
  );
  orbitLightMesh.position.set(2.32, -1.02, 0);
  buildGroup.add(orbitLightMesh);

  // Workbench Blue Circuit Paths (Surface PCB Traces)
  const circuitTraceMat = new THREE.LineBasicMaterial({ color: COLOR_CYAN, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
  const circuitPoints = [
    new THREE.Vector3(-1.4, -1.01, -0.6), new THREE.Vector3(-0.6, -1.01, -0.6),
    new THREE.Vector3(-0.6, -1.01, 0.2), new THREE.Vector3(0.0, -1.01, 0.2),
    new THREE.Vector3(0.0, -1.01, 0.8), new THREE.Vector3(0.8, -1.01, 0.8)
  ];
  const circuitTrace = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circuitPoints), circuitTraceMat);
  buildGroup.add(circuitTrace);

  // 2. THE THREE MECHANICAL ROBOTIC COMPONENTS (Descending Assembly 6.0s - 7.5s)
  const robotRoot = new THREE.Group();
  robotRoot.position.set(0.3, -1.02, 0);
  buildGroup.add(robotRoot);

  const armDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 });
  const armOrangeMat = new THREE.MeshStandardMaterial({
    color: COLOR_ORANGE,
    metalness: 0.5,
    roughness: 0.25,
    emissive: 0x9a3412,
    emissiveIntensity: 0.3
  });

  // COMPONENT 1: Lower Actuator & Rotating Turntable Base
  const comp1Group = new THREE.Group();
  robotRoot.add(comp1Group);

  const baseTurntable = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.3, 24), armDarkMat);
  comp1Group.add(baseTurntable);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.53, 0.03, 12, 32),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, blending: THREE.AdditiveBlending })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.1;
  comp1Group.add(baseRing);

  // COMPONENT 2: Middle Mechanical Joint & Lower Arm
  const comp2Group = new THREE.Group();
  comp2Group.position.set(0, 0.25, 0);
  comp1Group.add(comp2Group);

  const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), armOrangeMat);
  comp2Group.add(shoulderBall);

  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.24), armDarkMat);
  lowerBeam.position.set(0, 0.58, 0);
  comp2Group.add(lowerBeam);

  // COMPONENT 3: Upper Mechanical Joint & Actuator Sensor Tool Head
  const comp3Group = new THREE.Group();
  comp3Group.position.set(0, 1.15, 0);
  comp2Group.add(comp3Group);

  const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), armOrangeMat);
  comp3Group.add(elbowBall);

  const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.2), armDarkMat);
  upperBeam.position.set(0, 0.52, 0);
  comp3Group.add(upperBeam);

  const wristJoint = new THREE.Group();
  wristJoint.position.set(0, 1.05, 0);
  comp3Group.add(wristJoint);

  const wristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), armOrangeMat);
  wristJoint.add(wristSphere);

  // Gripper Actuator Claws
  const clawMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
  const clawLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.08), clawMat);
  clawLeft.position.set(-0.09, 0.2, 0);
  clawLeft.rotation.z = -0.15;
  wristJoint.add(clawLeft);

  const clawRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.08), clawMat);
  clawRight.position.set(0.09, 0.2, 0);
  clawRight.rotation.z = 0.15;
  wristJoint.add(clawRight);

  // Focal End Effector Light & Activation Signal Pulse
  const toolPointLight = new THREE.PointLight(COLOR_BLUE_ELECTRIC, 0.0, 5);
  toolPointLight.position.set(0, 0.32, 0);
  wristJoint.add(toolPointLight);

  // Orange Signal Pulse Capsule (Travels from base to gripper during activation)
  const signalPulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshBasicMaterial({ color: COLOR_ORANGE_BRIGHT, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  robotRoot.add(signalPulse);


  // ===========================================================================
  // 3. SCENE 03: TEST (3D Measurement Cage, Sensor Sweep, Iterative Correction)
  // ===========================================================================
  const testGroup = new THREE.Group();
  innovationRoot.add(testGroup);

  // 1. 3D Wireframe Measurement & Calibration Cage (Surrounds the Robot)
  const cageGeo = new THREE.BoxGeometry(2.4, 3.2, 2.4);
  const cageMat = new THREE.MeshBasicMaterial({
    color: COLOR_BLUE_ELECTRIC,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  const calibrationCage = new THREE.Mesh(cageGeo, cageMat);
  calibrationCage.position.set(0.3, 0.5, 0);
  testGroup.add(calibrationCage);

  // Measurement Key Point Markers (Orange Node Dots at Key Joints & Vertices)
  const markerGroup = new THREE.Group();
  testGroup.add(markerGroup);

  const markerGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const markerMat = new THREE.MeshBasicMaterial({ color: COLOR_ORANGE_BRIGHT, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.0 });

  const markerPositions = [
    new THREE.Vector3(0.3, -1.0, 0), // Base
    new THREE.Vector3(0.3, -0.75, 0), // Shoulder
    new THREE.Vector3(0.3, 0.4, 0),   // Elbow
    new THREE.Vector3(0.3, 1.45, 0),  // Wrist
    new THREE.Vector3(-0.9, 0.5, -1.2), // Cage corners
    new THREE.Vector3(1.5, 0.5, -1.2),
    new THREE.Vector3(1.5, 0.5, 1.2),
    new THREE.Vector3(-0.9, 0.5, 1.2)
  ];
  const markers = [];
  markerPositions.forEach(pos => {
    const m = new THREE.Mesh(markerGeo, markerMat);
    m.position.copy(pos);
    markerGroup.add(m);
    markers.push(m);
  });

  // 2. Trajectory Trace Line (Recorded Path of Robot Gripper Motion)
  const trajectoryPoints = [];
  for (let t = 0; t <= 36; t++) {
    const angle = (t / 36) * Math.PI;
    const tx = 0.3 + Math.sin(angle) * 0.8;
    const ty = 1.1 + Math.cos(angle) * 0.35;
    const tz = Math.sin(angle * 2) * 0.4;
    trajectoryPoints.push(new THREE.Vector3(tx, ty, tz));
  }
  const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
  const trajectoryMat = new THREE.LineBasicMaterial({ color: COLOR_CYAN, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
  const trajectoryLine = new THREE.Line(trajectoryGeo, trajectoryMat);
  testGroup.add(trajectoryLine);

  // 3. Sensor Scanning Sweep Cone (Represents simulated calibration)
  const sensorConeGeo = new THREE.ConeGeometry(0.85, 1.8, 24, 1, true);
  const sensorConeMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sensorCone = new THREE.Mesh(sensorConeGeo, sensorConeMat);
  sensorCone.position.set(0.3, 1.2, 0.2);
  sensorCone.rotation.x = Math.PI;
  testGroup.add(sensorCone);

  // 4. Misaligned Wireframe Segment for "Refinement and Improvement" (12.5s - 13.5s)
  const misalignedSegGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.6, 1.2, 0),
    new THREE.Vector3(0.3, 1.5, 0.3),
    new THREE.Vector3(1.1, 1.2, 0)
  ]);
  const misalignedSegMat = new THREE.LineBasicMaterial({ color: COLOR_ORANGE, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
  const misalignedSegment = new THREE.Line(misalignedSegGeo, misalignedSegMat);
  testGroup.add(misalignedSegment);


  // ===========================================================================
  // 4. SCENE 04: IMPACT (Network Nodes, 4 Innovation Clusters, Digital Globe Loop)
  // ===========================================================================
  const impactGroup = new THREE.Group();
  innovationRoot.add(impactGroup);

  // Expanding Ecosystem Orbital Paths
  const orbitalRingsGroup = new THREE.Group();
  impactGroup.add(orbitalRingsGroup);

  for (let o = 0; o < 4; o++) {
    const ringPts = [];
    const radX = 2.4 + o * 0.35;
    const radZ = 1.7 + o * 0.25;
    for (let a = 0; a <= 48; a++) {
      const angle = (a / 48) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(angle) * radX, 0, Math.sin(angle) * radZ));
    }
    const oLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({
        color: o % 2 === 0 ? COLOR_ORANGE : COLOR_BLUE_ELECTRIC,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      })
    );
    oLine.rotation.x = Math.PI * (0.22 + o * 0.16);
    oLine.rotation.z = Math.PI * (0.12 * o);
    orbitalRingsGroup.add(oLine);
  }

  // 4 Innovation Discipline Clusters (Distinct geometric nodes):
  // 1. Robotics & Engineering (Octahedron)
  // 2. Artificial Intelligence & Technology (Dodecahedron)
  // 3. Creative Design & Problem-Solving (Torus)
  // 4. Collaboration & Learning (Tetrahedron)
  const clusterGroup = new THREE.Group();
  impactGroup.add(clusterGroup);

  const cluster1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: COLOR_ORANGE_BRIGHT, wireframe: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending }));
  cluster1.position.set(-2.2, 0.9, 0.4);
  clusterGroup.add(cluster1);

  const cluster2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, wireframe: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending }));
  cluster2.position.set(2.2, 1.1, -0.3);
  clusterGroup.add(cluster2);

  const cluster3 = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 12, 24), new THREE.MeshBasicMaterial({ color: COLOR_CYAN, wireframe: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending }));
  cluster3.position.set(-1.6, -1.1, 0.6);
  clusterGroup.add(cluster3);

  const cluster4 = new THREE.Mesh(new THREE.TetrahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: COLOR_WHITE, wireframe: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending }));
  cluster4.position.set(1.7, -1.0, 0.5);
  clusterGroup.add(cluster4);

  // Grand Complete Innovation Globe (Forms 17.0s - 18.5s)
  const finalGlobe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.65, 2),
    new THREE.MeshBasicMaterial({ color: COLOR_BLUE_ELECTRIC, wireframe: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
  );
  impactGroup.add(finalGlobe);


  // ===========================================================================
  // HUD UI ELEMENTS & REAL-TIME STORY SYNCHRONIZATION
  // ===========================================================================
  const stagePillTag = document.querySelector('.stage-tag');
  const stagePillTitle = document.getElementById('stage-title-text');
  const stagePillDesc = document.getElementById('stage-desc-text');
  const hudTelTitle = document.getElementById('hud-telemetry-title');
  const hudTelMetric = document.getElementById('hud-telemetry-metric');
  const navButtons = document.querySelectorAll('.scene-step-btn');
  const navProgressBar = document.querySelector('.scene-nav-progress');

  const STORY_STAGES = [
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
      telTitle: 'MAKERFORGE LAB',
      telMetric: 'Actuators & Sensors Assembled'
    },
    {
      tag: 'STAGE 03',
      title: 'TEST',
      desc: 'Real-World Calibration',
      telTitle: 'SYSTEM VALIDATION',
      telMetric: 'Simulated Calibration & Active Testing'
    },
    {
      tag: 'STAGE 04',
      title: 'IMPACT',
      desc: 'National Innovation Ecosystem',
      telTitle: '28+ PARTNER CAMPUSES',
      telMetric: '10,000+ Students Impacted'
    }
  ];

  let manualTimeJump = null;

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stageIdx = parseInt(btn.getAttribute('data-scene'), 10) || 0;
      switch (stageIdx) {
        case 0: manualTimeJump = 0.1; break;
        case 1: manualTimeJump = 5.1; break;
        case 2: manualTimeJump = 10.1; break;
        case 3: manualTimeJump = 15.1; break;
      }
    });
  });

  function updateHUD(stageIndex, progressPercent) {
    const data = STORY_STAGES[stageIndex];
    if (data) {
      if (stagePillTag) stagePillTag.textContent = data.tag;
      if (stagePillTitle) stagePillTitle.textContent = data.title;
      if (stagePillDesc) stagePillDesc.textContent = data.desc;
      if (hudTelTitle) hudTelTitle.textContent = data.telTitle;
      if (hudTelMetric) hudTelMetric.textContent = data.telMetric;
    }

    if (navButtons.length > 0) {
      navButtons.forEach((btn, i) => {
        if (i === stageIndex) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        }
      });
    }

    if (navProgressBar) {
      navProgressBar.style.width = `${(progressPercent * 100).toFixed(1)}%`;
    }
  }


  // ===========================================================================
  // CONTINUOUS 20-SECOND ANIMATION LOOP & DETAILED STAGE TIMELINE
  // ===========================================================================
  const clock = new THREE.Clock();
  let time = 0;
  let isVisible = true;
  let animId = null;

  function animate() {
    animId = requestAnimationFrame(animate);
    if (!isVisible) return; // Conserve resources when off-screen

    const delta = clock.getDelta();
    time += delta;

    if (manualTimeJump !== null) {
      time = manualTimeJump;
      manualTimeJump = null;
    }

    const t = time % TOTAL_CYCLE;
    const progress = t / TOTAL_CYCLE;

    // Mouse Parallax Lerping
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Active Stage Index: 0 (0-5s), 1 (5-10s), 2 (10-15s), 3 (15-20s)
    let currentStage = 0;
    if (t >= 15.0) currentStage = 3;
    else if (t >= 10.0) currentStage = 2;
    else if (t >= 5.0) currentStage = 1;

    updateHUD(currentStage, progress);

    // -------------------------------------------------------------------------
    // STAGE 01: IDEA (0.0s – 5.0s)
    // -------------------------------------------------------------------------
    if (t < 5.0) {
      ideaGroup.visible = true;

      // 0.0–1.0s: The spark appears & intensifies
      if (t < 1.0) {
        const p1 = t / 1.0;
        sparkMesh.scale.setScalar(0.4 + p1 * 0.8);
        sparkMat.opacity = Math.min(1.0, p1 * 1.5);
        sparkHaloMat.opacity = Math.sin(p1 * Math.PI) * 0.8;
        particleMaterial.opacity = p1 * 0.7;
        globeWireMat.opacity = 0;
        blueprintRing.material.opacity = 0;
        blueprintInnerRing.material.opacity = 0;
      }
      // 1.0–2.5s: The idea takes shape (Lines assemble into 3D wireframe globe)
      else if (t < 2.5) {
        const p2 = (t - 1.0) / 1.5;
        sparkMesh.scale.setScalar(1.2 - p2 * 0.4);
        globeWireMat.opacity = p2 * 0.45;
        orbitCurve1.material.opacity = p2 * 0.5;
        orbitCurve2.material.opacity = p2 * 0.35;
        particleMaterial.opacity = 0.7 + Math.sin(p2 * Math.PI) * 0.25;
      }
      // 2.5–4.0s: A world of possibilities (Globe complete, orange pulse, center blueprint forms)
      else if (t < 4.0) {
        const p3 = (t - 2.5) / 1.5;
        globeWireMat.opacity = 0.45;
        orbitCurve1.material.opacity = 0.5;
        orbitCurve2.material.opacity = 0.35;
        // Circular blueprint forms near center
        blueprintRing.material.opacity = p3 * 0.8;
        blueprintInnerRing.material.opacity = p3 * 0.7;
        circularBlueprintGroup.scale.setScalar(0.7 + p3 * 0.3);
      }
      // 4.0–5.0s: Transition to BUILD (Outer wireframe reorganizes, blueprint expands/rotates into horizontal workbench)
      else {
        const p4 = (t - 4.0) / 1.0;
        globeWireMat.opacity = (1.0 - p4) * 0.45;
        orbitCurve1.material.opacity = (1.0 - p4) * 0.5;
        orbitCurve2.material.opacity = (1.0 - p4) * 0.35;
        sparkMat.opacity = (1.0 - p4);

        // Circular blueprint expands and tilts from vertical to horizontal workbench
        circularBlueprintGroup.rotation.x = p4 * (Math.PI / 2);
        circularBlueprintGroup.position.y = -p4 * 1.15;
        circularBlueprintGroup.scale.setScalar(1.0 + p4 * 1.4);
        blueprintRing.material.opacity = (1.0 - p4) * 0.8;

        // Workbench fades in concurrently
        buildGroup.visible = true;
        workbenchMat.opacity = p4 * 0.95;
        workbenchTrack.material.opacity = p4 * 0.8;
      }

      // Continuous Idea Rotation
      globeWireMesh.rotation.y += 0.007;
      globeWireMesh.rotation.x += 0.003;
      orbitCurve1.rotation.z += 0.008;
      orbitCurve2.rotation.z -= 0.006;
      circularBlueprintGroup.rotation.z += 0.01;

      // Animate thought particles
      const pArr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const m = particleMeta[i];
        const ang = m.theta + time * m.speed * 0.25;
        const curR = m.baseR + Math.sin(time * 2.0 + i) * 0.04;
        pArr[i * 3] = curR * Math.sin(m.phi) * Math.cos(ang);
        pArr[i * 3 + 1] = curR * Math.sin(m.phi) * Math.sin(ang);
        pArr[i * 3 + 2] = curR * Math.cos(m.phi);
      }
      particleGeo.attributes.position.needsUpdate = true;
    } else {
      ideaGroup.visible = false;
    }

    // -------------------------------------------------------------------------
    // STAGE 02: BUILD (5.0s – 10.0s)
    // -------------------------------------------------------------------------
    if (t >= 4.5 && t < 10.5) {
      buildGroup.visible = true;

      // 5.0–6.0s: Workbench emerges & circular base appears
      if (t < 6.0) {
        const b1 = Math.max(0, (t - 5.0) / 1.0);
        workbenchMat.opacity = 0.95;
        workbenchTrack.material.opacity = 0.8;
        circuitTraceMat.opacity = b1 * 0.6;
        comp1Group.position.y = (1.0 - b1) * 0.8; // Base settles down
        comp1Group.scale.setScalar(b1);
        comp2Group.position.y = 2.0; // Keep upper parts high
        comp3Group.position.y = 2.0;
        comp2Group.scale.setScalar(0);
        comp3Group.scale.setScalar(0);
      }
      // 6.0–7.5s: Three mechanical components descend and assemble
      else if (t < 7.5) {
        const b2 = (t - 6.0) / 1.5;
        comp1Group.position.y = 0;
        comp1Group.scale.setScalar(1);

        // Lower joint / beam descends (6.0 - 6.75s)
        const pComp2 = Math.min(1.0, b2 * 1.6);
        comp2Group.position.y = (1.0 - pComp2) * 1.5 + 0.25;
        comp2Group.scale.setScalar(Math.min(1, pComp2 * 1.2));

        // Upper gripper descends & locks into joint (6.75 - 7.5s)
        const pComp3 = Math.max(0, Math.min(1.0, (b2 - 0.4) * 1.8));
        comp3Group.position.y = (1.0 - pComp3) * 1.6 + 1.15;
        comp3Group.scale.setScalar(Math.min(1, pComp3 * 1.2));

        // Pulse at connection moment
        if (pComp3 > 0.85) {
          toolPointLight.intensity = (pComp3 - 0.85) * 6.0;
        }
      }
      // 7.5–8.5s: Prototype activates (Joint rotations, circuit illumination, orange signal pulse)
      else if (t < 8.5) {
        const b3 = (t - 7.5) / 1.0;
        comp2Group.position.y = 0.25;
        comp3Group.position.y = 1.15;
        comp2Group.scale.setScalar(1);
        comp3Group.scale.setScalar(1);
        circuitTraceMat.opacity = 0.9;

        // Controlled sequenced joint movements
        robotRoot.rotation.y = Math.sin(b3 * Math.PI) * 0.45;
        comp2Group.rotation.z = Math.sin(b3 * Math.PI) * 0.3 - 0.1;
        comp3Group.rotation.z = Math.cos(b3 * Math.PI) * 0.35 + 0.15;
        wristJoint.rotation.y = b3 * Math.PI * 1.5;

        // Orange signal pulse travels from base (y = -1.0) to tool (y = 1.4)
        signalPulse.material.opacity = 0.9;
        signalPulse.position.y = -1.0 + b3 * 2.4;
        signalPulse.position.x = 0.3 + Math.sin(b3 * Math.PI) * 0.1;
        toolPointLight.intensity = 1.0 + Math.sin(b3 * Math.PI * 3) * 0.5;
      }
      // 8.5–10.0s: Transition to TEST (Robot returns to neutral, 3D measurement cage forms)
      else {
        const b4 = (t - 8.5) / 1.5;
        signalPulse.material.opacity = 0;
        // Return robot to neutral
        robotRoot.rotation.y *= (1.0 - b4 * 0.2);
        comp2Group.rotation.z *= (1.0 - b4 * 0.2);
        comp3Group.rotation.z *= (1.0 - b4 * 0.2);

        // 3D Measurement cage appears & aligns with robot
        testGroup.visible = true;
        cageMat.opacity = b4 * 0.5;
        markerMat.opacity = b4 * 0.8;
      }

      // Orbiting light moving around base track
      const trackAng = time * 2.5;
      orbitLightMesh.position.x = Math.cos(trackAng) * 2.32;
      orbitLightMesh.position.z = Math.sin(trackAng) * 2.32;
    }

    // -------------------------------------------------------------------------
    // STAGE 03: TEST (10.0s – 15.0s)
    // -------------------------------------------------------------------------
    if (t >= 9.5 && t < 15.5) {
      buildGroup.visible = true; // Robot prototype remains visible at center
      testGroup.visible = true;

      // 10.0–11.0s: Testing environment activates (Measurement cage expands, orange markers at joints)
      if (t < 11.0) {
        const s1 = (t - 10.0) / 1.0;
        cageMat.opacity = 0.5 + s1 * 0.2;
        markerMat.opacity = 0.8 + s1 * 0.2;
        trajectoryMat.opacity = s1 * 0.4;
      }
      // 11.0–12.5s: Sensors evaluate movement (Controlled test movement, trajectory lines trace, markers pulse)
      else if (t < 12.5) {
        const s2 = (t - 11.0) / 1.5;
        cageMat.opacity = 0.7;
        trajectoryMat.opacity = 0.9;
        sensorConeMat.opacity = 0.4;

        // Controlled test motion
        const movePhase = Math.sin(s2 * Math.PI * 2);
        robotRoot.rotation.y = movePhase * 0.35;
        comp2Group.rotation.z = -0.1 + movePhase * 0.22;
        comp3Group.rotation.z = 0.2 - movePhase * 0.28;

        // Sensor sweep rotation
        sensorCone.rotation.y += 0.04;

        // Markers pulse when reaching test extremes
        const pulseVal = Math.abs(Math.sin(s2 * Math.PI * 4));
        markerMat.opacity = 0.6 + pulseVal * 0.4;

        // Show misaligned segment before correction
        misalignedSegMat.opacity = 0.75;
      }
      // 12.5–13.5s: Refinement and improvement (Robot pauses, misaligned wireframe shifts, repeating movement smoothly)
      else if (t < 13.5) {
        const s3 = (t - 12.5) / 1.0;

        // Small pause and micro-adjustment
        robotRoot.rotation.y = Math.sin(s3 * Math.PI) * 0.08;
        comp2Group.rotation.z = 0.05 * Math.sin(s3 * Math.PI);

        // Misaligned wireframe segment shifts smoothly into alignment & turns green/cyan
        misalignedSegment.position.y = (1.0 - s3) * 0.2;
        misalignedSegment.rotation.z = (1.0 - s3) * 0.15;
        if (s3 > 0.6) {
          misalignedSegMat.color.setHex(COLOR_SUCCESS);
          cageMat.color.setHex(COLOR_CYAN);
        }
      }
      // 13.5–15.0s: Transition to IMPACT (Calibration cage lines expand outward into connected nodes)
      else {
        const s4 = (t - 13.5) / 1.5;
        misalignedSegMat.opacity = (1.0 - s4);

        // Cage expands outward
        calibrationCage.scale.setScalar(1.0 + s4 * 1.5);
        cageMat.opacity = (1.0 - s4) * 0.6;

        // Reveal impact network
        impactGroup.visible = true;
        orbitalRingsGroup.children.forEach(c => { c.material.opacity = s4 * 0.55; });
        cluster1.material.opacity = s4 * 0.7;
        cluster2.material.opacity = s4 * 0.7;
        cluster3.material.opacity = s4 * 0.7;
        cluster4.material.opacity = s4 * 0.7;
      }
    } else if (t < 4.5 || t >= 15.5) {
      testGroup.visible = false;
    }

    // -------------------------------------------------------------------------
    // STAGE 04: IMPACT (15.0s – 20.0s)
    // -------------------------------------------------------------------------
    if (t >= 14.5) {
      impactGroup.visible = true;

      // 15.0–16.0s: Network expands, small nodes appear, robot becomes central seed
      if (t < 16.0) {
        const m1 = (t - 15.0) / 1.0;
        buildGroup.visible = true;
        buildGroup.scale.setScalar(1.0 - m1 * 0.35); // Robot scales down smoothly into central seed
        workbenchMat.opacity = (1.0 - m1 * 0.6);

        orbitalRingsGroup.children.forEach(c => { c.material.opacity = 0.55; });
        cluster1.material.opacity = 0.7;
        cluster2.material.opacity = 0.7;
        cluster3.material.opacity = 0.7;
        cluster4.material.opacity = 0.7;
        finalGlobe.material.opacity = m1 * 0.3;
      }
      // 16.0–17.0s: Individual ideas connect into 4 distinct innovation discipline clusters
      else if (t < 17.0) {
        const m2 = (t - 16.0) / 1.0;
        buildGroup.visible = (m2 < 0.8);
        finalGlobe.material.opacity = 0.3 + m2 * 0.3;

        // Animate distinct clusters
        cluster1.rotation.y += 0.02; // Robotics
        cluster2.rotation.x += 0.018; // AI
        cluster3.rotation.z += 0.025; // Design
        cluster4.rotation.y += 0.022; // Collaboration
      }
      // 17.0–18.5s: Ecosystem comes together (Complete digital globe, harmonious rotation, calm view)
      else if (t < 18.5) {
        finalGlobe.material.opacity = 0.65;
        orbitalRingsGroup.children.forEach(c => { c.material.opacity = 0.6; });

        finalGlobe.rotation.y += 0.006;
        orbitalRingsGroup.rotation.y += 0.005;

        cluster1.rotation.y += 0.015;
        cluster2.rotation.x += 0.015;
        cluster3.rotation.z += 0.015;
        cluster4.rotation.y += 0.015;
      }
      // 18.5–20.0s: Return to the beginning (Outer lines fade, central point brightens, one orange particle separates & drifts forward)
      else {
        const m4 = (t - 18.5) / 1.5;

        // Outer lines fade away
        finalGlobe.material.opacity = (1.0 - m4) * 0.65;
        orbitalRingsGroup.children.forEach(c => { c.material.opacity = (1.0 - m4) * 0.6; });
        cluster1.material.opacity = (1.0 - m4) * 0.7;
        cluster2.material.opacity = (1.0 - m4) * 0.7;
        cluster3.material.opacity = (1.0 - m4) * 0.7;
        cluster4.material.opacity = (1.0 - m4) * 0.7;

        // Center brightens and prepares for the opening spark
        ideaGroup.visible = true;
        sparkMesh.scale.setScalar(0.2 + m4 * 0.4);
        sparkMat.opacity = m4;
        sparkHaloMat.opacity = m4 * 0.6;
        sparkMesh.position.z = m4 * 0.8; // One particle drifts forward toward camera
      }
    } else {
      impactGroup.visible = false;
      if (t < 4.5) {
        buildGroup.visible = false;
        sparkMesh.position.z = 0;
      }
    }

    // -------------------------------------------------------------------------
    // ADAPTIVE CAMERA CINEMATICS (Continuous Eased Motion Across All 4 Scenes)
    // -------------------------------------------------------------------------
    const isNarrow = window.innerWidth <= 768;

    let targetCamX = isNarrow ? 0 : (1.6 + mouse.x * 0.5);
    let targetCamY = isNarrow ? -0.1 : (0.4 + mouse.y * 0.35);
    let targetCamZ = isNarrow ? 6.2 : 7.2;

    // Stage 01 (0-5s): Camera slowly pushes toward glowing spark and globe
    if (t < 5.0) {
      const p = t / 5.0;
      targetCamZ = isNarrow ? (6.6 - p * 0.4) : (7.6 - p * 0.6);
      targetCamY = isNarrow ? (-0.1 - p * 0.1) : (0.35 - p * 0.15 + mouse.y * 0.35);
    }
    // Stage 02 (5-10s): Camera moves downward toward surface, settles into 3/4 view
    else if (t < 10.0) {
      const p = (t - 5.0) / 5.0;
      targetCamZ = isNarrow ? (6.0 - p * 0.2) : (6.8 - p * 0.3);
      targetCamY = isNarrow ? -0.2 : (0.2 + p * 0.15 + mouse.y * 0.35);
      targetCamX = isNarrow ? 0 : (1.7 + mouse.x * 0.5);
    }
    // Stage 03 (10-15s): Level engineering inspection view, pushes closer to calibrate
    else if (t < 15.0) {
      const p = (t - 10.0) / 5.0;
      targetCamZ = isNarrow ? (5.8 + p * 0.3) : (6.5 + p * 0.4);
      targetCamY = isNarrow ? -0.1 : (0.4 + mouse.y * 0.35);
    }
    // Stage 04 (15-20s): Camera pulls back smoothly to reveal complete ecosystem, then approaches spark
    else {
      const p = (t - 15.0) / 5.0;
      if (p < 0.7) {
        // Pull back reveal (15 - 18.5s)
        targetCamZ = isNarrow ? (6.2 + (p / 0.7) * 0.6) : (7.0 + (p / 0.7) * 0.7);
        targetCamY = isNarrow ? 0 : (0.45 + mouse.y * 0.35);
      } else {
        // Return to opening composition (18.5 - 20.0s)
        const pr = (p - 0.7) / 0.3;
        targetCamZ = isNarrow ? (6.8 - pr * 0.2) : (7.7 - pr * 0.1);
        targetCamY = isNarrow ? -0.1 : (0.35 + mouse.y * 0.35);
      }
    }

    // Smooth Easing Lerp
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;

    const lookX = isNarrow ? 0 : 1.5;
    const lookY = isNarrow ? -0.15 : 0.0;
    camera.lookAt(lookX, lookY, 0);

    renderer.render(scene, camera);
  }

  // ===========================================================================
  // RESIZE & PERFORMANCE HANDLING
  // ===========================================================================
  function onResize() {
    if (!heroSection || !renderer || !camera) return;

    const isSmall = window.innerWidth <= 768;
    const visualBox = document.querySelector('.hero-visual');

    if (isSmall && visualBox) {
      currentWidth = visualBox.clientWidth || window.innerWidth;
      currentHeight = visualBox.clientHeight || 290;
      innovationRoot.position.set(0, -0.1, 0);
      camera.fov = 48;
    } else {
      currentWidth = heroSection.clientWidth || window.innerWidth;
      currentHeight = heroSection.clientHeight || 700;
      innovationRoot.position.set(1.5, -0.15, 0);
      camera.fov = 46;
    }

    camera.aspect = currentWidth / currentHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(currentWidth, currentHeight);
  }

  window.addEventListener('resize', onResize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => onResize());
    observer.observe(heroSection);
  }
  onResize();

  // IntersectionObserver to pause render loop off-screen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    io.observe(heroSection);
  }

  // Start continuous loop
  animId = requestAnimationFrame(animate);

  console.info('[Vadiva Hero] Continuous 20s Evolving Story (IDEA -> BUILD -> TEST -> IMPACT) Loaded.');
})();
