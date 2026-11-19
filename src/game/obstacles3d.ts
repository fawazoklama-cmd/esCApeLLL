import * as THREE from 'three';
import type { AreaId, ObstacleType } from '../types/game';

export interface AnimatedObstacleMesh {
  group: THREE.Group;
  type: ObstacleType;
  spinner?: THREE.Object3D;
  pulseMat?: THREE.MeshStandardMaterial;
  fallingBody?: THREE.Object3D;
  baseY: number;
}

export function createObstacleGroup(type: ObstacleType): AnimatedObstacleMesh {
  const group = new THREE.Group();

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.72,
  });
  const rustBody = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.78,
    metalness: 0.24,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const pinkNeonMat = new THREE.MeshStandardMaterial({
    color: 0xffb6d9,
    emissive: 0xff5fa2,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.1,
  });
  const blueNeonMat = new THREE.MeshStandardMaterial({
    color: 0x6eb4ff,
    emissive: 0x3b82f6,
    emissiveIntensity: 1.3,
    roughness: 0.2,
    metalness: 0.1,
  });
  const cautionMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.55,
    roughness: 0.45,
  });

  if (type === 'broken_car') {
    // Low jumpable wrecked futuristic coupe
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 2.3), rustBody);
    chassis.position.y = 0.42;
    chassis.rotation.z = 0.06;
    chassis.castShadow = true;
    group.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.36, 1.15), darkMetal);
    cabin.position.set(0, 0.82, 0.08);
    cabin.rotation.z = 0.06;
    group.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.28, 0.1), blueNeonMat);
    windshield.position.set(0, 0.8, -0.5);
    windshield.rotation.x = -0.3;
    group.add(windshield);

    const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const wx of [-0.8, 0.8]) {
      for (const wz of [-0.72, 0.72]) {
        const wheel = new THREE.Mesh(wheelGeo, darkMetal);
        wheel.position.set(wx, 0.26, wz);
        group.add(wheel);
      }
    }

    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.08), pinkNeonMat);
    tailLight.position.set(0, 0.48, 1.16);
    group.add(tailLight);

    return { group, type, pulseMat: pinkNeonMat, baseY: 0 };
  }

  if (type === 'abandoned_vehicle') {
    // Tall armored hover-van (must dodge around)
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.45, 2.8), rustBody);
    hull.position.y = 1.05;
    hull.castShadow = true;
    group.add(hull);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 2.3), darkMetal);
    roof.position.y = 1.88;
    group.add(roof);

    const frontStripe = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.1), cautionMat);
    frontStripe.position.set(0, 0.72, 1.41);
    group.add(frontStripe);

    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.4, 10), blueNeonMat);
    thrusterL.position.set(-0.68, 0.28, 0);
    group.add(thrusterL);
    const thrusterR = thrusterL.clone();
    thrusterR.position.x = 0.68;
    group.add(thrusterR);

    return { group, type, pulseMat: blueNeonMat, baseY: 0 };
  }

  if (type === 'energy_barrier') {
    // Low pulsing energy fence (jump over)
    const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.15, 8);
    const postL = new THREE.Mesh(postGeo, darkMetal);
    postL.position.set(-0.98, 0.58, 0);
    postL.castShadow = true;
    const postR = postL.clone();
    postR.position.x = 0.98;
    group.add(postL, postR);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.14), pinkNeonMat);
    beam.position.y = 0.85;
    const beamLow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.14), blueNeonMat);
    beamLow.position.y = 0.42;
    group.add(beam, beamLow);

    return { group, type, pulseMat: pinkNeonMat, baseY: 0 };
  }

  if (type === 'laser_gate') {
    // Overhead gantry with sweeping high laser beams (SLIDE under!)
    const pillarGeo = new THREE.BoxGeometry(0.22, 2.8, 0.26);
    const pillarL = new THREE.Mesh(pillarGeo, darkMetal);
    pillarL.position.set(-1.12, 1.4, 0);
    pillarL.castShadow = true;
    const pillarR = pillarL.clone();
    pillarR.position.x = 1.12;
    group.add(pillarL, pillarR);

    const header = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.34, 0.42), darkMetal);
    header.position.y = 2.7;
    group.add(header);

    const laserPanel = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.15, 0.12), pinkNeonMat);
    laserPanel.position.y = 1.72;
    group.add(laserPanel);

    const arrowBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.2), blueNeonMat);
    arrowBar.position.set(0, 1.08, 0.16);
    group.add(arrowBar);

    return { group, type, pulseMat: pinkNeonMat, baseY: 0 };
  }

  if (type === 'falling_debris') {
    // Overhead suspended slab + warning shadow ring (SLIDE under!)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.88, 20),
      new THREE.MeshBasicMaterial({ color: 0xffb6d9, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    group.add(ring);

    const fallingBody = new THREE.Group();
    fallingBody.position.y = 1.85;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 1.25), concreteMat);
    slab.rotation.z = 0.14;
    slab.castShadow = true;
    fallingBody.add(slab);

    const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), darkMetal);
    rebar.rotation.z = Math.PI / 2 + 0.1;
    rebar.position.y = -0.35;
    fallingBody.add(rebar);

    const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 1.3), cautionMat);
    glowStrip.position.y = -0.52;
    fallingBody.add(glowStrip);

    group.add(fallingBody);
    return { group, type, fallingBody, baseY: 1.85 };
  }

  if (type === 'falling_rock') {
    // Low jagged boulder (jump over or dodge)
    const fallingBody = new THREE.Group();
    const rockMain = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), concreteMat);
    rockMain.position.y = 0.68;
    rockMain.castShadow = true;
    fallingBody.add(rockMain);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), pinkNeonMat);
    crystal.position.set(0.38, 0.95, 0.25);
    crystal.rotation.z = -0.4;
    fallingBody.add(crystal);

    group.add(fallingBody);
    return { group, type, fallingBody, spinner: crystal, baseY: 0 };
  }

  if (type === 'broken_bridge') {
    // Glowing hazard chasm strip across the lane (JUMP across!)
    const chasm = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.18, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    chasm.position.y = 0.01;
    group.add(chasm);

    const edgeFront = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 0.22), cautionMat);
    edgeFront.position.set(0, 0.09, 1.38);
    const edgeBack = edgeFront.clone();
    edgeBack.position.z = -1.38;
    group.add(edgeFront, edgeBack);

    return { group, type, pulseMat: cautionMat, baseY: 0 };
  }

  // collapsed_building: Tall monolith ruin blocking full lane (must dodge!)
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.15, 4.1, 2.4), concreteMat);
  pillar.position.y = 2.05;
  pillar.rotation.z = 0.08;
  pillar.castShadow = true;
  group.add(pillar);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.45, 2.5), darkMetal);
  frame.position.y = 3.2;
  group.add(frame);

  const holoSign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.12), blueNeonMat);
  holoSign.position.set(0, 2.1, 1.24);
  group.add(holoSign);

  return { group, type, pulseMat: blueNeonMat, baseY: 0 };
}

export function createCoinMesh(): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.08, 8, 18),
    new THREE.MeshStandardMaterial({
      color: 0xffb6d9,
      emissive: 0xff5fa2,
      emissiveIntensity: 0.85,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({
      color: 0x6eb4ff,
      emissive: 0x3b82f6,
      emissiveIntensity: 1.0,
      metalness: 0.5,
      roughness: 0.15,
    })
  );
  g.add(outer, core);
  return g;
}

export function buildAreaLandmark(area: AreaId, side: -1 | 1): THREE.Group {
  const g = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
  const lightTowerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, metalness: 0.2 });
  const pinkFoliageMat = new THREE.MeshStandardMaterial({
    color: 0xffb6d9,
    emissive: 0xec4899,
    emissiveIntensity: 0.2,
    roughness: 0.72,
  });
  const skyAccentMat = new THREE.MeshStandardMaterial({
    color: 0x6eb4ff,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.0 });

  if (area === 'skyline_ruins') {
    const height = 10 + Math.random() * 14;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(4.2, height, 4.2), stoneMat);
    tower.position.y = height * 0.5 - 2;
    g.add(tower);

    const holo = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 3.2), skyAccentMat);
    holo.position.set(-side * 2.25, height * 0.55, 0);
    g.add(holo);

    // Overgrown survivor tree sprouting from ruin ledge
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.6, 6), stoneMat);
    trunk.position.set(-side * 1.4, height - 1.5, 0.8);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), pinkFoliageMat);
    crown.position.set(-side * 1.4, height + 0.1, 0.8);
    g.add(trunk, crown);
  } else if (area === 'pink_valley') {
    // Tall cliff spire + stylized pink-blossom survivor tree
    const cliff = new THREE.Mesh(new THREE.ConeGeometry(4.5, 16, 6), stoneMat);
    cliff.position.set(side * 3.5, 5, 0);
    g.add(cliff);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 4.2, 7), stoneMat);
    trunk.position.y = 2.1;
    const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 0), pinkFoliageMat);
    canopy1.position.set(0, 4.8, 0);
    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), pinkFoliageMat);
    canopy2.position.set(-side * 1.2, 4.2, 0.7);
    g.add(trunk, canopy1, canopy2);
  } else if (area === 'broken_bridge') {
    // Suspension pylon & snapped cable
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 18, 1.1), lightTowerMat);
    pylon.position.y = 8;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.9), skyAccentMat);
    cross.position.set(-side * 1.1, 14, 0);
    g.add(pylon, cross);
  } else if (area === 'cloud_district') {
    // High-altitude white sky spire & layered cloud puffs
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 22, 8), lightTowerMat);
    spire.position.y = 7;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.22, 8, 20), skyAccentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 11;
    g.add(spire, ring);

    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.8 + i * 0.4, 10, 8), cloudMat);
      puff.position.set(side * (i * 1.4 - 1), -1.5 + i * 0.6, (i - 1) * 1.8);
      puff.scale.y = 0.6;
      g.add(puff);
    }
  } else {
    // abandoned_station: Futuristic monorail arch & terminal awning
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7.5, 1.6), stoneMat);
    col.position.y = 3.75;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 5.2), lightTowerMat);
    canopy.position.set(-side * 1.4, 7.4, 0);
    canopy.rotation.z = side * 0.2;
    const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 4.8), pinkFoliageMat);
    neonStrip.position.set(-side * 3.2, 6.9, 0);
    g.add(col, canopy, neonStrip);
  }

  return g;
}
