import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { animateCharacterRig, buildSurvivorCharacter, type CharacterRig } from '../game/characters3d';
import {
  buildAreaLandmark,
  createCoinMesh,
  createObstacleGroup,
  type AnimatedObstacleMesh,
} from '../game/obstacles3d';
import {
  checkObstacleCollision,
  getAreaForDistance,
  getMultiplier,
  getObstacleSpec,
  getSpeedForDistance,
  getSpeedLevel,
  GRAVITY,
  JUMP_VELOCITY,
  LANE_POSITIONS,
  seededRandom,
  SLIDE_DURATION_SEC,
} from '../game/rules';
import { soundEngine } from '../game/audio';
import type {
  AreaId,
  CharacterAnimState,
  CharacterId,
  GameMode,
  GamePhase,
  GraphicsQuality,
  LiveHudSnapshot,
  ObstacleType,
  RunSummary,
  ThemeMode,
} from '../types/game';

export interface GameCanvasHandle {
  triggerMoveLeft: () => void;
  triggerMoveRight: () => void;
  triggerJump: () => void;
  triggerSlide: () => void;
  reviveRunner: () => void;
  resetRun: (seed?: number) => void;
}

interface GameCanvasProps {
  phase: GamePhase;
  mode: GameMode;
  character: CharacterId;
  theme: ThemeMode;
  graphicsQuality: GraphicsQuality;
  runSeed: number;
  duelOpponent?: {
    distance: number;
    score: number;
    alive: boolean;
    connected: boolean;
  };
  countdownValue: number;
  onHudUpdate: (snapshot: LiveHudSnapshot) => void;
  onTogglePause: () => void;
  onRunEnded: (summary: RunSummary) => void;
  onTelemetryTick?: (distance: number, score: number, alive: boolean) => void;
}

interface ActiveObstacle {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
  width: number;
  minY: number;
  maxY: number;
  halfDepth: number;
  visual: AnimatedObstacleMesh;
  passed: boolean;
}

interface ActiveCoin {
  id: number;
  lane: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  mesh: THREE.Group;
}

interface ActiveLandmark {
  z: number;
  group: THREE.Group;
  area: AreaId;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

const OBSTACLE_TYPES: ObstacleType[] = [
  'broken_car',
  'energy_barrier',
  'laser_gate',
  'falling_debris',
  'falling_rock',
  'broken_bridge',
  'abandoned_vehicle',
  'collapsed_building',
];

function createRoadTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Cracked futuristic asphalt base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grain & surface cracks
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.09)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 6);
  }

  // Stylized cracks
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.lineWidth = 2;
  for (let c = 0; c < 6; c++) {
    ctx.beginPath();
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 60;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Lane dividers (Sky Blue & Soft Pink dashes)
  const drawLaneDash = (x: number, color: string) => {
    ctx.fillStyle = color;
    for (let y = 16; y < 512; y += 96) {
      ctx.fillRect(x - 4, y, 8, 52);
    }
  };
  drawLaneDash(170, 'rgba(110, 180, 255, 0.65)');
  drawLaneDash(342, 'rgba(255, 182, 217, 0.65)');

  // Outer shoulder stripes
  ctx.fillStyle = 'rgba(168, 213, 255, 0.45)';
  ctx.fillRect(10, 0, 10, 512);
  ctx.fillStyle = 'rgba(255, 182, 217, 0.45)';
  ctx.fillRect(492, 0, 10, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

const _dummyObj = new THREE.Object3D();
const _pColor = new THREE.Color();

const GameCanvas3D = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas3D(
  {
    phase,
    mode,
    character,
    theme,
    graphicsQuality,
    runSeed,
    duelOpponent,
    countdownValue,
    onHudUpdate,
    onTogglePause,
    onRunEnded,
    onTelemetryTick,
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Synced refs so WebGL scene never tears down on React state changes
  const propsRef = useRef({
    phase,
    mode,
    character,
    theme,
    graphicsQuality,
    runSeed,
    duelOpponent,
    countdownValue,
  });
  propsRef.current = {
    phase,
    mode,
    character,
    theme,
    graphicsQuality,
    runSeed,
    duelOpponent,
    countdownValue,
  };

  const callbacksRef = useRef({
    onHudUpdate,
    onTogglePause,
    onRunEnded,
    onTelemetryTick,
  });
  callbacksRef.current = {
    onHudUpdate,
    onTogglePause,
    onRunEnded,
    onTelemetryTick,
  };

  const actionsRef = useRef<{
    moveLeft: () => void;
    moveRight: () => void;
    jump: () => void;
    slide: () => void;
    revive: () => void;
    reset: (seed?: number) => void;
  }>({
    moveLeft: () => {},
    moveRight: () => {},
    jump: () => {},
    slide: () => {},
    revive: () => {},
    reset: () => {},
  });

  useImperativeHandle(ref, () => ({
    triggerMoveLeft: () => actionsRef.current.moveLeft(),
    triggerMoveRight: () => actionsRef.current.moveRight(),
    triggerJump: () => actionsRef.current.jump(),
    triggerSlide: () => actionsRef.current.slide(),
    reviveRunner: () => actionsRef.current.revive(),
    resetRun: (seed?: number) => actionsRef.current.reset(seed),
  }));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL (SwiftShader / llvmpipe / WARP)
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0xa8d5ff, 0.011);
    scene.fog = fog;
    scene.background = new THREE.Color(0x6eb4ff);

    // Mandatory studio environment map for PBR reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      60,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      240
    );
    camera.position.set(0, 4.4, 8.2);

    // Post-processing Bloom composer (used on High quality when hardware WebGL is active)
    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight),
        0.28,
        0.55,
        0.82
      );
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
    }

    // 3-Point + Hemisphere Sky Lighting
    const hemiLight = new THREE.HemisphereLight(0xa8d5ff, 0xffb6d9, 0.68);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.25);
    keyLight.position.set(14, 24, 16);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 75;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb6d9, 0.6);
    rimLight.position.set(-10, 8, -14);
    scene.add(rimLight);

    // Celestial Sky Props: Sun / Moon / Stars / Instanced Clouds
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(10, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff8dc, fog: false })
    );
    sunDisc.position.set(20, 26, -120);
    scene.add(sunDisc);

    const moonGroup = new THREE.Group();
    const moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(9, 32),
      new THREE.MeshBasicMaterial({ color: 0xf0f9ff, fog: false })
    );
    const moonGlow = new THREE.Mesh(
      new THREE.CircleGeometry(15, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb6d9, transparent: true, opacity: 0.24, fog: false })
    );
    moonGlow.position.z = -0.5;
    moonGroup.add(moonGlow, moonDisc);
    moonGroup.position.set(-16, 23, -120);
    scene.add(moonGroup);

    // Night Starfield (InstancedMesh)
    const STAR_COUNT = 160;
    const starMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.42, 0),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc, fog: false }),
      STAR_COUNT
    );
    for (let i = 0; i < STAR_COUNT; i++) {
      _dummyObj.position.set(
        (Math.random() - 0.5) * 200,
        8 + Math.random() * 44,
        -55 - Math.random() * 105
      );
      const s = 0.55 + Math.random() * 1.15;
      _dummyObj.scale.set(s, s, s);
      _dummyObj.updateMatrix();
      starMesh.setMatrixAt(i, _dummyObj.matrix);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    starMesh.frustumCulled = false;
    scene.add(starMesh);

    // Drifting Clouds (InstancedMesh)
    const CLOUD_COUNT = 36;
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
    });
    const cloudMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(3.2, 1), cloudMat, CLOUD_COUNT);
    const cloudPositions: Array<{ x: number; y: number; z: number; sx: number; sy: number; speed: number }> = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      cloudPositions.push({
        x: (Math.random() - 0.5) * 140,
        y: 12 + Math.random() * 24,
        z: -20 - Math.random() * 130,
        sx: 1.4 + Math.random() * 1.8,
        sy: 0.5 + Math.random() * 0.45,
        speed: 0.6 + Math.random() * 1.1,
      });
    }
    cloudMesh.frustumCulled = false;
    scene.add(cloudMesh);

    // Endless Skyway Track Surface
    const roadTex = createRoadTexture(renderer.capabilities.getMaxAnisotropy());
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.14,
    });
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 220), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -90);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Glowing Side Guardrails
    const railMatL = new THREE.MeshStandardMaterial({
      color: 0x6eb4ff,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.95,
      roughness: 0.25,
    });
    const railMatR = new THREE.MeshStandardMaterial({
      color: 0xffb6d9,
      emissive: 0xec4899,
      emissiveIntensity: 0.95,
      roughness: 0.25,
    });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 220), railMatL);
    railL.position.set(-4.72, 0.14, -90);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 220), railMatR);
    railR.position.set(4.72, 0.14, -90);
    scene.add(railL, railR);

    // Distant horizon plateau below the skyway
    const abyssMat = new THREE.MeshStandardMaterial({
      color: 0xa8d5ff,
      roughness: 0.95,
      metalness: 0.0,
    });
    const abyssPlane = new THREE.Mesh(new THREE.PlaneGeometry(360, 260), abyssMat);
    abyssPlane.rotation.x = -Math.PI / 2;
    abyssPlane.position.set(0, -14, -100);
    scene.add(abyssPlane);

    // Build both character rigs upfront so character switching is instant
    const rigs: Record<CharacterId, CharacterRig> = {
      camelia: buildSurvivorCharacter('camelia'),
      elio: buildSurvivorCharacter('elio'),
    };
    scene.add(rigs.camelia.root);
    scene.add(rigs.elio.root);

    // Pooled Instanced Particle Ring Buffer (Zero-GC)
    const PARTICLE_CAP = 96;
    const particleMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      PARTICLE_CAP
    );
    particleMesh.frustumCulled = false;
    scene.add(particleMesh);
    const particles: ParticleSlot[] = Array.from({ length: PARTICLE_CAP }, () => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      scale: 1,
    }));
    let particleCursor = 0;

    function emitParticles(x: number, y: number, z: number, count: number, colorHex: number, spread = 4.2) {
      _pColor.setHex(colorHex);
      for (let i = 0; i < count; i++) {
        const slot = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_CAP;
        slot.active = true;
        slot.x = x + (Math.random() - 0.5) * 0.4;
        slot.y = y + Math.random() * 0.4;
        slot.z = z + (Math.random() - 0.5) * 0.4;
        slot.vx = (Math.random() - 0.5) * spread;
        slot.vy = 1.5 + Math.random() * spread * 0.8;
        slot.vz = (Math.random() - 0.5) * spread + 2;
        slot.life = 0;
        slot.maxLife = 0.35 + Math.random() * 0.35;
        slot.scale = 0.6 + Math.random() * 0.9;
        particleMesh.setColorAt(particleCursor, _pColor);
      }
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    }

    // Dynamic Spawned Entities
    const obstaclesGroup = new THREE.Group();
    const coinsGroup = new THREE.Group();
    const landmarksGroup = new THREE.Group();
    scene.add(obstaclesGroup, coinsGroup, landmarksGroup);

    let activeObstacles: ActiveObstacle[] = [];
    let activeCoins: ActiveCoin[] = [];
    let activeLandmarks: ActiveLandmark[] = [];
    let entityIdCounter = 1;

    // Gameplay Simulation State
    let rng = seededRandom(propsRef.current.runSeed || 1337);
    let laneIndex = 1; // 0, 1, 2
    let playerX = 0;
    let playerY = 0;
    let playerVy = 0;
    let isSliding = false;
    let slideTimer = 0;
    let dodgeTimer = 0;
    let dodgeDir: 'left' | 'right' = 'left';
    let distance = 0;
    let score = 0;
    let coins = 0;
    let coinStreak = 0;
    let runElapsedSec = 0;
    let runCyclePhase = 0;
    let footstepAccum = 0;
    let revivesUsed = 0;
    let invulnTimer = 0;
    let hitstopTimer = 0;
    let trauma = 0;
    let nextObstacleSpawnDist = 28;
    let nextLandmarkSpawnDist = 0;
    let lastHudEmitAt = 0;
    let lastTelemetryAt = 0;
    let endedTriggered = false;
    let prevPhase: GamePhase = propsRef.current.phase;
    let lastSeed = propsRef.current.runSeed;

    function clearWorldEntities() {
      for (const o of activeObstacles) obstaclesGroup.remove(o.visual.group);
      for (const c of activeCoins) coinsGroup.remove(c.mesh);
      for (const l of activeLandmarks) landmarksGroup.remove(l.group);
      activeObstacles = [];
      activeCoins = [];
      activeLandmarks = [];
    }

    function seedInitialLandmarks() {
      for (let z = -10; z >= -140; z -= 22) {
        const area = getAreaForDistance(Math.abs(z));
        for (const side of [-1, 1] as const) {
          const lm = buildAreaLandmark(area, side);
          lm.position.set(side * 10.5, 0, z);
          landmarksGroup.add(lm);
          activeLandmarks.push({ z, group: lm, area });
        }
      }
      nextLandmarkSpawnDist = 22;
    }

    let runEndTimeoutId: number | null = null;

    function resetSimulation(seedOverride?: number) {
      if (runEndTimeoutId !== null) {
        window.clearTimeout(runEndTimeoutId);
        runEndTimeoutId = null;
      }
      clearWorldEntities();
      const seed = seedOverride ?? propsRef.current.runSeed ?? 1337;
      lastSeed = seed;
      rng = seededRandom(seed);
      laneIndex = 1;
      playerX = 0;
      playerY = 0;
      playerVy = 0;
      isSliding = false;
      slideTimer = 0;
      dodgeTimer = 0;
      distance = 0;
      score = 0;
      coins = 0;
      coinStreak = 0;
      runElapsedSec = 0;
      runCyclePhase = 0;
      footstepAccum = 0;
      revivesUsed = 0;
      invulnTimer = 0;
      hitstopTimer = 0;
      trauma = 0;
      nextObstacleSpawnDist = 30;
      endedTriggered = false;
      seedInitialLandmarks();
      emitHudSnapshot(true);
    }

    function emitHudSnapshot(force = false) {
      const now = performance.now();
      if (!force && now - lastHudEmitAt < 90) return;
      lastHudEmitAt = now;
      const p = propsRef.current;
      callbacksRef.current.onHudUpdate({
        distance: Math.floor(distance),
        score: Math.floor(score),
        coins,
        speedLevel: getSpeedLevel(distance),
        multiplier: getMultiplier(coins, distance),
        area: getAreaForDistance(distance),
        revivesUsed,
        countdownValue: p.countdownValue,
        opponentDistance: p.duelOpponent?.distance ?? 0,
        opponentScore: p.duelOpponent?.score ?? 0,
        opponentAlive: p.duelOpponent?.alive ?? true,
        opponentConnected: p.duelOpponent?.connected ?? true,
      });
    }

    function spawnObstacleWave(zPos: number) {
      const difficulty = Math.min(1, distance / 1400);
      const count = rng() < 0.25 + difficulty * 0.35 ? 2 : 1;
      const lanes = [0, 1, 2];
      // Shuffle lanes deterministically
      for (let i = lanes.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
      }

      const usedLanes: number[] = [];
      for (let k = 0; k < count; k++) {
        const lane = lanes[k];
        usedLanes.push(lane);
        const type = OBSTACLE_TYPES[Math.floor(rng() * OBSTACLE_TYPES.length)];
        const spec = getObstacleSpec(type);
        const visual = createObstacleGroup(type);
        visual.group.position.set(LANE_POSITIONS[lane], 0, zPos);
        obstaclesGroup.add(visual.group);
        activeObstacles.push({
          id: entityIdCounter++,
          ...spec,
          lane,
          z: zPos,
          visual,
          passed: false,
        });

        // Spawn coins arc above jump obstacles or under slide gates
        if (type === 'broken_car' || type === 'energy_barrier' || type === 'broken_bridge') {
          for (let ci = -1; ci <= 1; ci++) {
            const cMesh = createCoinMesh();
            const cy = 1.65 - Math.abs(ci) * 0.25;
            const cz = zPos + ci * 1.5;
            cMesh.position.set(LANE_POSITIONS[lane], cy, cz);
            coinsGroup.add(cMesh);
            activeCoins.push({
              id: entityIdCounter++,
              lane,
              x: LANE_POSITIONS[lane],
              y: cy,
              z: cz,
              collected: false,
              mesh: cMesh,
            });
          }
        } else if (type === 'laser_gate' || type === 'falling_debris') {
          const cMesh = createCoinMesh();
          cMesh.position.set(LANE_POSITIONS[lane], 0.45, zPos);
          coinsGroup.add(cMesh);
          activeCoins.push({
            id: entityIdCounter++,
            lane,
            x: LANE_POSITIONS[lane],
            y: 0.45,
            z: zPos,
            collected: false,
            mesh: cMesh,
          });
        }
      }

      // Open lane coin trail
      const openLane = lanes[count];
      if (openLane !== undefined && rng() < 0.72) {
        const coinCount = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < coinCount; i++) {
          const cMesh = createCoinMesh();
          const cz = zPos - 3 - i * 2.1;
          cMesh.position.set(LANE_POSITIONS[openLane], 0.75, cz);
          coinsGroup.add(cMesh);
          activeCoins.push({
            id: entityIdCounter++,
            lane: openLane,
            x: LANE_POSITIONS[openLane],
            y: 0.75,
            z: cz,
            collected: false,
            mesh: cMesh,
          });
        }
      }
    }

    // Player Control Handlers
    const moveLeft = () => {
      if (propsRef.current.phase !== 'playing' || propsRef.current.countdownValue > 0) return;
      if (laneIndex > 0) {
        laneIndex--;
        dodgeDir = 'left';
        dodgeTimer = 0.22;
        soundEngine.playDodge();
      }
    };

    const moveRight = () => {
      if (propsRef.current.phase !== 'playing' || propsRef.current.countdownValue > 0) return;
      if (laneIndex < 2) {
        laneIndex++;
        dodgeDir = 'right';
        dodgeTimer = 0.22;
        soundEngine.playDodge();
      }
    };

    const jump = () => {
      if (propsRef.current.phase !== 'playing' || propsRef.current.countdownValue > 0) return;
      if (playerY <= 0.08) {
        playerVy = JUMP_VELOCITY;
        isSliding = false;
        slideTimer = 0;
        soundEngine.playJump();
        emitParticles(playerX, 0.15, 0, 6, 0x6eb4ff, 3.2);
      }
    };

    const slide = () => {
      if (propsRef.current.phase !== 'playing' || propsRef.current.countdownValue > 0) return;
      if (playerY > 0.2) {
        // Fast-drop slam into slide
        playerVy = -26;
      }
      isSliding = true;
      slideTimer = SLIDE_DURATION_SEC;
      soundEngine.playSlide();
      emitParticles(playerX, 0.15, 0.2, 5, 0xffb6d9, 2.8);
    };

    const revive = () => {
      revivesUsed++;
      endedTriggered = false;
      invulnTimer = 2.6;
      playerY = 0;
      playerVy = 0;
      isSliding = false;
      // Clear immediate nearby obstacles so revive is fair
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        if (activeObstacles[i].z > -18 && activeObstacles[i].z < 6) {
          obstaclesGroup.remove(activeObstacles[i].visual.group);
          activeObstacles.splice(i, 1);
        }
      }
      emitParticles(playerX, 0.9, 0, 18, 0x6eb4ff, 6.0);
    };

    actionsRef.current = {
      moveLeft,
      moveRight,
      jump,
      slide,
      revive,
      reset: resetSimulation,
    };

    // Keyboard & Touch Swipe Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const key = e.key;
      if (key === 'Escape') {
        if (propsRef.current.phase === 'playing' || propsRef.current.phase === 'paused') {
          e.preventDefault();
          callbacksRef.current.onTogglePause();
        }
        return;
      }

      if (propsRef.current.phase !== 'playing') return;

      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        moveLeft();
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        moveRight();
      } else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') {
        e.preventDefault();
        jump();
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        e.preventDefault();
        slide();
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (propsRef.current.phase !== 'playing' || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) moveLeft();
        else moveRight();
      } else {
        if (dy < 0) jump();
        else slide();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('touchend', onTouchEnd, { passive: true });

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Initialize world landmarks on mount
    seedInitialLandmarks();

    // Theme & Quality Configuration
    const daySky = new THREE.Color(0x6eb4ff);
    const nightSky = new THREE.Color(0x0b1021);
    const dayFogColor = new THREE.Color(0xa8d5ff);
    const nightFogColor = new THREE.Color(0x1b1533);
    const currentBg = new THREE.Color(propsRef.current.theme === 'night' ? 0x0b1021 : 0x6eb4ff);
    const currentFog = new THREE.Color(propsRef.current.theme === 'night' ? 0x1b1533 : 0xa8d5ff);

    let lastQuality: GraphicsQuality | null = null;
    function applyQuality(quality: GraphicsQuality) {
      if (quality === lastQuality) return;
      lastQuality = quality;
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        return;
      }
      if (quality === 'low') {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
      } else if (quality === 'medium') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
      }
    }

    // Main Render Loop (with software-WebGL afterDraw pacing)
    let frameId = 0;
    let disposed = false;
    const startTimeMs = performance.now();
    let lastFrameMs = startTimeMs;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const rawDt = Math.max(0, (nowMs - lastFrameMs) / 1000);
      lastFrameMs = nowMs;
      const dt = Math.min(rawDt, 0.05);
      const elapsed = (nowMs - startTimeMs) / 1000;
      const p = propsRef.current;

      applyQuality(p.graphicsQuality);

      // Reset simulation when entering playing from title or when seed changes
      if (p.phase === 'playing' && (prevPhase === 'title' || p.runSeed !== lastSeed)) {
        resetSimulation(p.runSeed);
      }
      prevPhase = p.phase;

      // Fast, Crisp Day / Night Transition
      const isNight = p.theme === 'night';
      const targetBg = isNight ? nightSky : daySky;
      const targetFog = isNight ? nightFogColor : dayFogColor;
      const lerpFactor = Math.min(1, 1 - Math.exp(-16 * Math.max(dt, 0.04)));
      currentBg.lerp(targetBg, lerpFactor);
      currentFog.lerp(targetFog, lerpFactor);
      if (
        Math.abs(currentBg.r - targetBg.r) < 0.01 &&
        Math.abs(currentBg.g - targetBg.g) < 0.01 &&
        Math.abs(currentBg.b - targetBg.b) < 0.01
      ) {
        currentBg.copy(targetBg);
        currentFog.copy(targetFog);
      }
      (scene.background as THREE.Color).copy(currentBg);
      fog.color.copy(currentFog);
      abyssMat.color.copy(currentFog);

      sunDisc.visible = !isNight;
      moonGroup.visible = isNight;
      starMesh.visible = isNight;
      cloudMat.color.setHex(isNight ? 0x4b5582 : 0xffffff);
      cloudMat.opacity = isNight ? 0.62 : 0.88;

      hemiLight.color.setHex(isNight ? 0x6eb4ff : 0xa8d5ff);
      hemiLight.groundColor.setHex(isNight ? 0x28213f : 0xffb6d9);
      hemiLight.intensity = isNight ? 0.48 : 0.68;
      keyLight.intensity = isNight ? 0.82 : 1.25;
      keyLight.color.setHex(isNight ? 0xbfdbfe : 0xfff5e8);
      rimLight.intensity = isNight ? 0.95 : 0.55;
      railMatL.emissiveIntensity = isNight ? 1.8 : 0.85;
      railMatR.emissiveIntensity = isNight ? 1.8 : 0.85;

      // Active character visibility
      rigs.camelia.root.visible = p.character === 'camelia';
      rigs.elio.root.visible = p.character === 'elio';
      const activeRig = rigs[p.character];

      // Update drifting clouds
      for (let i = 0; i < CLOUD_COUNT; i++) {
        const c = cloudPositions[i];
        const zSpeed = p.phase === 'playing' && p.countdownValue === 0 ? getSpeedForDistance(distance) * 0.22 : c.speed;
        c.z += zSpeed * dt;
        if (c.z > 25) {
          c.z = -140;
          c.x = (Math.random() - 0.5) * 140;
        }
        _dummyObj.position.set(c.x, c.y, c.z);
        _dummyObj.scale.set(c.sx, c.sy, c.sx * 0.75);
        _dummyObj.rotation.set(0, i * 0.4, 0);
        _dummyObj.updateMatrix();
        cloudMesh.setMatrixAt(i, _dummyObj.matrix);
      }
      cloudMesh.instanceMatrix.needsUpdate = true;

      // Update pooled particles
      for (let i = 0; i < PARTICLE_CAP; i++) {
        const slot = particles[i];
        if (!slot.active) {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.set(0, 0, 0);
          _dummyObj.updateMatrix();
          particleMesh.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        slot.life += dt;
        if (slot.life >= slot.maxLife) {
          slot.active = false;
          continue;
        }
        slot.vy -= 14 * dt;
        slot.x += slot.vx * dt;
        slot.y += slot.vy * dt;
        slot.z += slot.vz * dt;
        const s = slot.scale * (1 - slot.life / slot.maxLife);
        _dummyObj.position.set(slot.x, slot.y, slot.z);
        _dummyObj.scale.set(s, s, s);
        _dummyObj.rotation.set(slot.life * 6, slot.life * 4, 0);
        _dummyObj.updateMatrix();
        particleMesh.setMatrixAt(i, _dummyObj.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      // Title Screen: Cinematic Live World Camera Tour (Character framed right-of-center on desktop)
      if (p.phase === 'title') {
        activeRig.root.position.set(0, 0, 0);
        activeRig.root.rotation.y = Math.PI; // Face toward camera
        activeRig.root.visible = true;
        animateCharacterRig(activeRig, 'idle', elapsed, dt, 0, 0);

        const isWide = camera.aspect > 1.15;
        const baseOrbit = isWide ? -0.45 : 0;
        const orbit = baseOrbit + Math.sin(elapsed * 0.32) * (isWide ? 1.1 : 0.8);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, orbit, 3, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.25 + Math.sin(elapsed * 0.5) * 0.2, 3, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 5.1, 3, dt);
        camera.lookAt(isWide ? -1.1 : 0, 1.25, -3.5);
        camera.fov = THREE.MathUtils.damp(camera.fov, 54, 4, dt);
        camera.updateProjectionMatrix();
      } else if (p.phase === 'playing') {
        // Gameplay Simulation
        activeRig.root.rotation.y = 0; // Face forward down -Z track

        if (hitstopTimer > 0) {
          hitstopTimer -= dt;
        } else if (p.countdownValue <= 0 && !endedTriggered) {
          runElapsedSec += dt;
          if (invulnTimer > 0) {
            invulnTimer -= dt;
            activeRig.root.visible = Math.floor(invulnTimer * 16) % 2 === 0;
          }

          const speed = getSpeedForDistance(distance);
          const dz = speed * dt;
          distance += dz;
          const mult = getMultiplier(coins, distance);
          score += dz * 10 * mult;

          // Scroll road texture cleanly
          roadTex.offset.y -= dz * 0.064;

          // Lane horizontal spring damping
          const targetX = LANE_POSITIONS[laneIndex];
          const prevX = playerX;
          playerX = THREE.MathUtils.damp(playerX, targetX, 18, dt);
          const laneTilt = THREE.MathUtils.clamp((prevX - playerX) * 4.5, -1, 1);

          // Vertical jump physics
          if (playerY > 0 || playerVy > 0) {
            playerY += playerVy * dt;
            playerVy += GRAVITY * dt;
            if (playerY <= 0) {
              playerY = 0;
              playerVy = 0;
              emitParticles(playerX, 0.1, 0, 4, 0xffffff, 2.4);
            }
          }

          // Slide & Dodge timers
          if (slideTimer > 0) {
            slideTimer -= dt;
            if (slideTimer <= 0) isSliding = false;
          }
          if (dodgeTimer > 0) dodgeTimer -= dt;

          // Footsteps synced to distance traveled
          runCyclePhase += dz * 0.95;
          footstepAccum += dz;
          if (playerY <= 0.05 && !isSliding && footstepAccum >= 2.8) {
            footstepAccum = 0;
            soundEngine.playFootstep();
          }

          // Choose character animation state
          let animState: CharacterAnimState = 'run';
          if (playerY > 0.12) animState = 'jump';
          else if (isSliding) animState = 'slide';
          else if (dodgeTimer > 0) animState = dodgeDir === 'left' ? 'dodge_left' : 'dodge_right';

          activeRig.root.position.set(playerX, playerY, 0);
          activeRig.shadowDisc.position.y = -playerY + 0.018;
          const shadowScale = Math.max(0.45, 1 - playerY * 0.18);
          activeRig.shadowDisc.scale.set(shadowScale, shadowScale, 1);
          animateCharacterRig(activeRig, animState, elapsed, dt, laneTilt, runCyclePhase);

          // Spawn obstacles & landmarks ahead
          if (distance >= nextObstacleSpawnDist) {
            spawnObstacleWave(-105);
            const minGap = Math.max(17, 29 - distance * 0.008);
            nextObstacleSpawnDist = distance + minGap + rng() * 10;
          }

          if (distance >= nextLandmarkSpawnDist) {
            const area = getAreaForDistance(distance + 95);
            for (const side of [-1, 1] as const) {
              const lm = buildAreaLandmark(area, side);
              lm.position.set(side * 10.5, 0, -118);
              landmarksGroup.add(lm);
              activeLandmarks.push({ z: -118, group: lm, area });
            }
            nextLandmarkSpawnDist = distance + 22;
          }

          // Advance & animate landmarks
          for (let i = activeLandmarks.length - 1; i >= 0; i--) {
            const lm = activeLandmarks[i];
            lm.z += dz;
            lm.group.position.z = lm.z;
            if (lm.z > 22) {
              landmarksGroup.remove(lm.group);
              activeLandmarks.splice(i, 1);
            }
          }

          // Advance coins & check pickup
          for (let i = activeCoins.length - 1; i >= 0; i--) {
            const c = activeCoins[i];
            c.z += dz;
            c.mesh.position.z = c.z;
            c.mesh.rotation.y += dt * 4.2;
            if (!c.collected && Math.abs(c.z) < 1.05 && Math.abs(c.x - playerX) < 0.95 && Math.abs(c.y - (playerY + 0.9)) < 1.15) {
              c.collected = true;
              coins++;
              coinStreak++;
              score += 25 * mult;
              soundEngine.playCoin(coinStreak);
              emitParticles(c.x, c.y, 0, 6, 0xffb6d9, 3.6);
              coinsGroup.remove(c.mesh);
              activeCoins.splice(i, 1);
              continue;
            }
            if (c.z > 12) {
              coinsGroup.remove(c.mesh);
              activeCoins.splice(i, 1);
            }
          }

          // Advance obstacles, animate hazards, & check collision
          for (let i = activeObstacles.length - 1; i >= 0; i--) {
            const o = activeObstacles[i];
            o.z += dz;
            o.visual.group.position.z = o.z;

            // Animate hazard parts
            if (o.visual.pulseMat) {
              o.visual.pulseMat.emissiveIntensity = 1.0 + Math.sin(elapsed * 8 + o.id) * 0.45;
            }
            if (o.visual.spinner) {
              o.visual.spinner.rotation.y += dt * 2.5;
            }
            if (o.visual.fallingBody && o.type === 'falling_debris') {
              o.visual.fallingBody.position.y = o.visual.baseY + Math.sin(elapsed * 3.5 + o.id) * 0.22;
            }

            if (
              invulnTimer <= 0 &&
              checkObstacleCollision({ x: playerX, y: playerY, z: 0, isSliding }, o)
            ) {
              // Collision Hit!
              endedTriggered = true;
              hitstopTimer = 0.06;
              trauma = 0.95;
              soundEngine.playCollision();
              emitParticles(playerX, playerY + 0.8, 0, 22, 0xffb6d9, 6.8);

              const finalSummary: RunSummary = {
                mode: p.mode,
                character: p.character,
                score: Math.round(score),
                distance: Math.round(distance),
                coins,
                speedLevel: getSpeedLevel(distance),
                durationSec: Number(runElapsedSec.toFixed(2)),
                areaReached: getAreaForDistance(distance),
              };
              emitHudSnapshot(true);
              callbacksRef.current.onTelemetryTick?.(Math.round(distance), Math.round(score), false);
              runEndTimeoutId = window.setTimeout(() => {
                runEndTimeoutId = null;
                if (!disposed) {
                  callbacksRef.current.onRunEnded(finalSummary);
                }
              }, 380);
              break;
            }

            if (o.z > 14) {
              obstaclesGroup.remove(o.visual.group);
              activeObstacles.splice(i, 1);
            }
          }

          // Online Duel telemetry broadcast every ~350ms
          if (p.mode === 'duel') {
            const nowMs = performance.now();
            if (nowMs - lastTelemetryAt >= 350) {
              lastTelemetryAt = nowMs;
              callbacksRef.current.onTelemetryTick?.(Math.round(distance), Math.round(score), true);
            }
          }

          emitHudSnapshot(false);
        } else {
          // Countdown or brief post-hit beat
          activeRig.root.position.set(playerX, playerY, 0);
          animateCharacterRig(activeRig, endedTriggered ? 'defeat' : 'idle', elapsed, dt, 0, runCyclePhase);
        }

        // Dynamic Chase Camera + Speed FOV kick + Trauma Shake
        const speedNorm = (getSpeedForDistance(distance) - 18) / 27;
        const targetFov = 60 + speedNorm * 9;
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
        camera.updateProjectionMatrix();

        trauma = Math.max(0, trauma - dt * 1.9);
        const shake = trauma * trauma * 0.42;
        const shakeX = (Math.random() - 0.5) * shake;
        const shakeY = (Math.random() - 0.5) * shake;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, playerX * 0.62, 8, dt) + shakeX;
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.15 + playerY * 0.42, 8, dt) + shakeY;
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 7.6, 8, dt);
        camera.lookAt(playerX * 0.4, 1.35 + playerY * 0.3, -10);
      } else if (p.phase === 'gameover') {
        activeRig.root.position.set(playerX, 0, 0);
        animateCharacterRig(activeRig, 'defeat', elapsed, dt, 0, 0);
      }

      if (composer && p.graphicsQuality === 'high' && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (runEndTimeoutId !== null) {
        window.clearTimeout(runEndTimeoutId);
        runEndTimeoutId = null;
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      envTarget.dispose();
      roadTex.dispose();
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="game-canvas-container"
      className="fixed inset-0 w-full h-full overflow-hidden"
    />
  );
});

export default GameCanvas3D;
