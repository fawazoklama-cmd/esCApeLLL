import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { animateCharacterRig, buildSurvivorCharacter } from '../game/characters3d';
import type { CharacterAnimState, CharacterId, ThemeMode } from '../types/game';

interface CharacterPreview3DProps {
  character: CharacterId;
  animState: CharacterAnimState;
  theme: ThemeMode;
}

export default function CharacterPreview3D({ character, animState, theme }: CharacterPreview3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ character, animState, theme });
  stateRef.current = { character, animState, theme };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 360, container.clientHeight || 420);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 360) / (container.clientHeight || 420),
      0.1,
      50
    );
    camera.position.set(0, 1.35, 3.85);
    camera.lookAt(0, 0.98, 0);

    const hemi = new THREE.HemisphereLight(0xa8d5ff, 0xffb6d9, 0.65);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff5e8, 1.15);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb6d9, 0.85);
    rim.position.set(-3, 2, -4);
    scene.add(rim);

    // Turntable Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.7 })
    );
    pedestal.position.y = -0.07;
    const pedestalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.96, 0.03, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0x6eb4ff,
        emissive: 0x6eb4ff,
        emissiveIntensity: 0.9,
      })
    );
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.y = 0.01;
    scene.add(pedestal, pedestalRing);

    const rigs = {
      camelia: buildSurvivorCharacter('camelia'),
      elio: buildSurvivorCharacter('elio'),
    };
    rigs.camelia.root.rotation.y = Math.PI;
    rigs.elio.root.rotation.y = Math.PI;
    scene.add(rigs.camelia.root, rigs.elio.root);

    let yaw = Math.PI;
    let isDragging = false;
    let lastX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      yaw += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

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
      const dt = Math.min(Math.max(0, (nowMs - lastFrameMs) / 1000), 0.05);
      lastFrameMs = nowMs;
      const elapsed = (nowMs - startTimeMs) / 1000;
      const st = stateRef.current;

      rigs.camelia.root.visible = st.character === 'camelia';
      rigs.elio.root.visible = st.character === 'elio';
      const activeRig = rigs[st.character];

      if (!isDragging && !isSoftwareGl) {
        yaw += dt * 0.32;
      }
      activeRig.root.rotation.y = yaw;
      animateCharacterRig(activeRig, st.animState, elapsed, dt, 0, elapsed * 9);

      const ringColor = st.character === 'camelia' ? 0xffb6d9 : 0x6eb4ff;
      (pedestalRing.material as THREE.MeshStandardMaterial).color.setHex(ringColor);
      (pedestalRing.material as THREE.MeshStandardMaterial).emissive.setHex(ringColor);

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="character-preview-canvas"
      className="w-full h-full min-h-[320px] cursor-grab active:cursor-grabbing"
    />
  );
}
