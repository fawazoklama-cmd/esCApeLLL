import * as THREE from 'three';
import type { CharacterAnimState, CharacterId } from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  hairGroup: THREE.Group;
  scarf: THREE.Mesh;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
  shadowDisc: THREE.Mesh;
}

function createFaceTexture(id: CharacterId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Calibrated warm stylized skin tone (avoids overexposure under ACES tone mapping)
  ctx.fillStyle = id === 'camelia' ? '#e5b29a' : '#d89f85';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle nose bridge & cheek shading
  ctx.fillStyle = 'rgba(180, 95, 95, 0.25)';
  ctx.beginPath();
  ctx.ellipse(68, 158, 22, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(188, 158, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(145, 80, 68, 0.28)';
  ctx.fillRect(123, 134, 10, 26);

  // Serious slanted eyebrows
  ctx.strokeStyle = id === 'camelia' ? '#2c1624' : '#0f172a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(48, 102);
  ctx.lineTo(106, 118);
  ctx.moveTo(208, 102);
  ctx.lineTo(150, 118);
  ctx.stroke();

  // Sharp high-contrast eyes
  const eyeColor = id === 'camelia' ? '#3b82f6' : '#f472b6';
  for (const cx of [78, 178]) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, 132, 25, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, 133, 21, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(cx, 133, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(cx, 134, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, 128, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Serious mouth line
  ctx.strokeStyle = '#6d3b38';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(106, 188);
  ctx.quadraticCurveTo(128, 182, 150, 188);
  ctx.stroke();

  // Stylized survivor scar (high visibility)
  ctx.strokeStyle = '#9f1239';
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (id === 'camelia') {
    ctx.moveTo(160, 150);
    ctx.lineTo(200, 184);
    ctx.moveTo(172, 155);
    ctx.lineTo(182, 146);
    ctx.moveTo(184, 173);
    ctx.lineTo(194, 164);
  } else {
    ctx.moveTo(74, 88);
    ctx.lineTo(92, 166);
    ctx.moveTo(74, 148);
    ctx.lineTo(88, 144);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(17, 24, 39, 0.55)');
  grad.addColorStop(0.6, 'rgba(17, 24, 39, 0.22)');
  grad.addColorStop(1, 'rgba(17, 24, 39, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function buildSurvivorCharacter(id: CharacterId): CharacterRig {
  const isCamelia = id === 'camelia';

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.88; // hip height above grounded feet
  root.add(bodyPivot);

  // Materials with calibrated roughness & metalness variation (>= 0.25 delta)
  const skinMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0xe5b29a : 0xd89f85,
    roughness: 0.78,
    metalness: 0.02,
  });

  const jacketMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0xf472b6 : 0x161e2e,
    roughness: 0.65,
    metalness: 0.08,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0xf8fafc : 0x3b82f6,
    roughness: 0.45,
    metalness: 0.16,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0x6eb4ff : 0xf8fafc,
    roughness: 0.28,
    metalness: 0.55,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0x28213f : 0x111827,
    roughness: 0.82,
    metalness: 0.04,
  });

  const gloveBootMat = new THREE.MeshStandardMaterial({
    color: 0x181c28,
    roughness: 0.48,
    metalness: 0.22,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.22,
    metalness: 0.88,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: isCamelia ? 0x3b2338 : 0x1e2436,
    roughness: 0.62,
    metalness: 0.05,
  });

  // Pelvis / Belt / Torn Coat Hem
  const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.26), pantsMat);
  pelvisMesh.castShadow = true;
  bodyPivot.add(pelvisMesh);

  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.28), gloveBootMat);
  beltMesh.position.y = 0.06;
  bodyPivot.add(beltMesh);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.05), metalMat);
  buckle.position.set(0, 0.06, -0.145);
  bodyPivot.add(buckle);

  // Utility thigh pouch
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.14), secondaryMat);
  pouch.position.set(0.24, -0.05, 0);
  bodyPivot.add(pouch);

  // Torso group
  const torso = new THREE.Group();
  torso.position.y = 0.1;
  bodyPivot.add(torso);

  // Inner shirt
  const shirt = new THREE.Mesh(
    new THREE.CylinderGeometry(isCamelia ? 0.17 : 0.2, isCamelia ? 0.15 : 0.18, 0.44, 10),
    secondaryMat
  );
  shirt.position.y = 0.22;
  shirt.castShadow = true;
  torso.add(shirt);

  // Open weathered survivor jacket panels
  const jacketBack = new THREE.Mesh(
    new THREE.BoxGeometry(isCamelia ? 0.4 : 0.46, 0.42, 0.22),
    jacketMat
  );
  jacketBack.position.set(0, 0.23, 0.04);
  jacketBack.castShadow = true;
  torso.add(jacketBack);

  // Torn jacket flap details (asymmetric post-war wear)
  const tornFlapL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.05), jacketMat);
  tornFlapL.position.set(-0.15, -0.04, 0.11);
  tornFlapL.rotation.z = 0.16;
  torso.add(tornFlapL);

  const tornFlapR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), accentMat);
  tornFlapR.position.set(0.15, -0.02, 0.11);
  tornFlapR.rotation.z = -0.14;
  torso.add(tornFlapR);

  // Shoulder strap / survivor pack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.14), gloveBootMat);
  pack.position.set(0, 0.24, 0.18);
  pack.castShadow = true;
  torso.add(pack);

  const packCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.04),
    new THREE.MeshStandardMaterial({
      color: isCamelia ? 0xffb6d9 : 0x6eb4ff,
      emissive: isCamelia ? 0xff69b4 : 0x3b82f6,
      emissiveIntensity: 0.7,
      roughness: 0.25,
    })
  );
  packCore.position.set(0, 0.25, 0.25);
  torso.add(packCore);

  // Flowing survivor scarf
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.56), accentMat);
  scarf.position.set(0.08, 0.44, 0.26);
  scarf.rotation.x = 0.18;
  torso.add(scarf);

  // Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), jacketMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.45;
  torso.add(collar);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.52;
  torso.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 8), skinMat);
  neck.position.y = -0.02;
  headGroup.add(neck);

  const faceTex = createFaceTexture(id);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Head cube/rounded head with face mapped to front (-Z since character runs toward -Z)
  const headMaterials = [
    skinMat, // +x
    skinMat, // -x
    skinMat, // +y
    skinMat, // -y
    skinMat, // +z (back)
    faceMat, // -z (front facing camera in menu or forward in run)
  ];
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), headMaterials);
  headMesh.position.y = 0.14;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair Group (distinct messy silhouette per character)
  const hairGroup = new THREE.Group();
  hairGroup.position.y = 0.18;
  headGroup.add(hairGroup);

  const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.32), hairMat);
  hairCrown.position.y = 0.11;
  hairGroup.add(hairCrown);

  if (isCamelia) {
    // Camelia: Long messy flowing hair strands + side locks + pink hair ribbon accent
    const backMane = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.12), hairMat);
    backMane.position.set(0, -0.1, 0.14);
    backMane.rotation.x = 0.12;
    hairGroup.add(backMane);

    const strandL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.1), hairMat);
    strandL.position.set(-0.14, -0.06, -0.06);
    strandL.rotation.z = 0.14;
    hairGroup.add(strandL);

    const strandR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.1), hairMat);
    strandR.position.set(0.14, -0.05, -0.06);
    strandR.rotation.z = -0.18;
    hairGroup.add(strandR);

    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.08), hairMat);
    bangs.position.set(-0.02, 0.07, -0.14);
    bangs.rotation.z = 0.12;
    hairGroup.add(bangs);

    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.04), accentMat);
    clip.position.set(0.12, 0.1, -0.15);
    hairGroup.add(clip);
  } else {
    // Elio: Messy tousled spiky hair locks + blue-white headband strip
    const backCrop = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.22, 0.12), hairMat);
    backCrop.position.set(0, 0.0, 0.12);
    hairGroup.add(backCrop);

    for (let i = -2; i <= 2; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 5), hairMat);
      spike.position.set(i * 0.06, 0.17, -0.05 + Math.abs(i) * 0.03);
      spike.rotation.x = -0.35;
      spike.rotation.z = -i * 0.18;
      hairGroup.add(spike);
    }

    const headband = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.055, 0.31), secondaryMat);
    headband.position.y = 0.07;
    hairGroup.add(headband);
  }

  // Arms Builder (upper arm + forearm + fingerless gloves)
  const buildArm = (side: -1 | 1): { arm: THREE.Group; forearm: THREE.Group } => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 0.39, 0);

    // Shoulder pad / torn sleeve
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.062, 0.24, 8),
      side === -1 && isCamelia ? secondaryMat : jacketMat
    );
    sleeve.position.y = -0.11;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const forearm = new THREE.Group();
    forearm.position.y = -0.24;
    arm.add(forearm);

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.22, 8), skinMat);
    lower.position.y = -0.1;
    forearm.add(lower);

    // Fingerless survivor glove
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.09), gloveBootMat);
    glove.position.y = -0.23;
    forearm.add(glove);

    const wristStrap = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.04, 0.098), accentMat);
    wristStrap.position.y = -0.16;
    forearm.add(wristStrap);

    return { arm, forearm };
  };

  const leftArmRig = buildArm(-1);
  const rightArmRig = buildArm(1);
  torso.add(leftArmRig.arm);
  torso.add(rightArmRig.arm);

  // Legs Builder (thigh + shin + combat boots)
  const buildLeg = (side: -1 | 1): { leg: THREE.Group; shin: THREE.Group } => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.115, -0.05, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.38, 8), pantsMat);
    thigh.position.y = -0.19;
    thigh.castShadow = true;
    leg.add(thigh);

    // Knee pad
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.13), secondaryMat);
    knee.position.set(0, -0.37, -0.03);
    leg.add(knee);

    const shin = new THREE.Group();
    shin.position.y = -0.39;
    leg.add(shin);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.3, 8), pantsMat);
    calf.position.y = -0.15;
    shin.add(calf);

    // Heavy Survivor Boot
    const bootShaft = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.18, 0.15), gloveBootMat);
    bootShaft.position.set(0, -0.34, 0);
    bootShaft.castShadow = true;
    shin.add(bootShaft);

    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.06, 0.24), accentMat);
    bootSole.position.set(0, -0.43, -0.03);
    shin.add(bootSole);

    return { leg, shin };
  };

  const leftLegRig = buildLeg(-1);
  const rightLegRig = buildLeg(1);
  bodyPivot.add(leftLegRig.leg);
  bodyPivot.add(rightLegRig.leg);

  // Soft Radial Ground Contact Shadow Disc
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.56, 20),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.018;
  root.add(shadowDisc);

  return {
    root,
    bodyPivot,
    torso,
    headGroup,
    hairGroup,
    scarf,
    leftArm: leftArmRig.arm,
    leftForearm: leftArmRig.forearm,
    rightArm: rightArmRig.arm,
    rightForearm: rightArmRig.forearm,
    leftLeg: leftLegRig.leg,
    leftShin: leftLegRig.shin,
    rightLeg: rightLegRig.leg,
    rightShin: rightLegRig.shin,
    shadowDisc,
  };
}

export function animateCharacterRig(
  rig: CharacterRig,
  state: CharacterAnimState,
  elapsed: number,
  dt: number,
  laneTilt = 0,
  runCyclePhase = 0
): void {
  const damp = (curr: number, target: number, lambda = 16) =>
    THREE.MathUtils.damp(curr, target, lambda, Math.min(dt, 0.05));

  let bodyY = 0.88;
  let torsoRx = 0;
  let torsoRy = 0;
  let torsoRz = laneTilt * 0.28;
  let headRx = 0;
  let headRy = 0;
  let lArmRx = 0;
  let lArmRz = 0.12;
  let lForeRx = -0.18;
  let rArmRx = 0;
  let rArmRz = -0.12;
  let rForeRx = -0.18;
  let lLegRx = 0;
  let lShinRx = 0;
  let rLegRx = 0;
  let rShinRx = 0;
  let scaleX = 1;
  let scaleY = 1;

  if (state === 'idle') {
    const breath = Math.sin(elapsed * 2.4);
    bodyY = 0.88 + breath * 0.015;
    torsoRx = 0.04 + breath * 0.02;
    headRy = Math.sin(elapsed * 0.9) * 0.14;
    lArmRx = Math.sin(elapsed * 2.4) * 0.05;
    rArmRx = -Math.sin(elapsed * 2.4) * 0.05;
    lArmRz = 0.16;
    rArmRz = -0.16;
  } else if (state === 'run') {
    const s = Math.sin(runCyclePhase);
    const c = Math.cos(runCyclePhase);
    bodyY = 0.86 + Math.abs(c) * 0.09;
    torsoRx = 0.22; // Athletic forward sprint lean
    torsoRy = s * 0.14;
    headRx = -0.14;
    lArmRx = s * 1.15;
    rArmRx = -s * 1.15;
    lForeRx = -0.95 - Math.max(0, s) * 0.35;
    rForeRx = -0.95 - Math.max(0, -s) * 0.35;
    lLegRx = -s * 1.05;
    rLegRx = s * 1.05;
    lShinRx = Math.max(0, s) * 1.25 + 0.12;
    rShinRx = Math.max(0, -s) * 1.25 + 0.12;
  } else if (state === 'jump') {
    bodyY = 0.96;
    torsoRx = 0.12;
    lArmRx = -1.25;
    rArmRx = -0.9;
    lArmRz = 0.4;
    rArmRz = -0.4;
    lForeRx = -0.45;
    rForeRx = -0.6;
    lLegRx = -0.85;
    lShinRx = 1.2;
    rLegRx = 0.32;
    rShinRx = 0.55;
    scaleX = 0.92;
    scaleY = 1.1;
  } else if (state === 'slide') {
    bodyY = 0.34;
    torsoRx = -0.82; // Low baseball slide lean-back
    headRx = 0.55;
    lArmRx = 0.65;
    lArmRz = 0.45;
    rArmRx = -0.45;
    rArmRz = -0.5;
    lLegRx = -1.25; // Extended front leg
    lShinRx = 0.15;
    rLegRx = -0.4;
    rShinRx = 1.35; // Tucked rear knee
    scaleX = 1.12;
    scaleY = 0.85;
  } else if (state === 'dodge_left' || state === 'dodge_right') {
    const dir = state === 'dodge_left' ? 1 : -1;
    bodyY = 0.9;
    torsoRx = 0.25;
    torsoRz = dir * 0.42;
    lArmRz = 0.45;
    rArmRz = -0.45;
    lLegRx = -0.45;
    rLegRx = 0.35;
    lShinRx = 0.5;
    rShinRx = 0.45;
  } else if (state === 'victory') {
    const pump = Math.sin(elapsed * 5) * 0.12;
    bodyY = 0.9 + Math.abs(Math.sin(elapsed * 3.5)) * 0.08;
    torsoRx = -0.06;
    rArmRx = -2.45 + pump;
    rArmRz = -0.25;
    rForeRx = -0.35;
    lArmRx = 0.2;
    lArmRz = 0.35;
    headRx = -0.12;
  } else if (state === 'defeat') {
    bodyY = 0.42;
    torsoRx = 0.65;
    headRx = 0.35;
    lArmRx = 0.55;
    rArmRx = 0.45;
    lArmRz = 0.28;
    rArmRz = -0.28;
    lLegRx = -1.1;
    lShinRx = 1.65;
    rLegRx = -0.8;
    rShinRx = 1.4;
  }

  rig.bodyPivot.position.y = damp(rig.bodyPivot.position.y, bodyY, 18);
  rig.torso.rotation.x = damp(rig.torso.rotation.x, torsoRx, 18);
  rig.torso.rotation.y = damp(rig.torso.rotation.y, torsoRy, 18);
  rig.torso.rotation.z = damp(rig.torso.rotation.z, torsoRz, 18);

  rig.headGroup.rotation.x = damp(rig.headGroup.rotation.x, headRx, 15);
  rig.headGroup.rotation.y = damp(rig.headGroup.rotation.y, headRy, 15);

  rig.leftArm.rotation.x = damp(rig.leftArm.rotation.x, lArmRx, 18);
  rig.leftArm.rotation.z = damp(rig.leftArm.rotation.z, lArmRz, 18);
  rig.leftForearm.rotation.x = damp(rig.leftForearm.rotation.x, lForeRx, 18);

  rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, rArmRx, 18);
  rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, rArmRz, 18);
  rig.rightForearm.rotation.x = damp(rig.rightForearm.rotation.x, rForeRx, 18);

  rig.leftLeg.rotation.x = damp(rig.leftLeg.rotation.x, lLegRx, 20);
  rig.leftShin.rotation.x = damp(rig.leftShin.rotation.x, lShinRx, 20);
  rig.rightLeg.rotation.x = damp(rig.rightLeg.rotation.x, rLegRx, 20);
  rig.rightShin.rotation.x = damp(rig.rightShin.rotation.x, rShinRx, 20);

  rig.root.scale.x = damp(rig.root.scale.x, scaleX, 14);
  rig.root.scale.y = damp(rig.root.scale.y, scaleY, 14);

  // Flowing hair and scarf secondary motion
  const flutter = Math.sin(elapsed * (state === 'run' ? 14 : 4)) * (state === 'run' ? 0.16 : 0.05);
  rig.scarf.rotation.x = 0.25 + flutter;
  rig.hairGroup.rotation.x = state === 'run' ? 0.12 + flutter * 0.5 : flutter * 0.3;
}
