import type * as Three from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { ArenaFrame, BossKind } from "./boss-models";
import { createColossusArmor } from "./boss-colossus-armor";
import {scenePreloader} from '@/lib/scene-preload';

type T = typeof import("three");
export interface RiggedBoss {
  root: Three.Group;
  model: Three.Group;
  mouth: Three.Object3D | null;
  update: (frame: ArenaFrame) => void;
  /** Releases this asset's animations, skeletons, geometry and embedded textures. */
  dispose: () => void;
  animations: string[];
  bones: number;
}

function disposeModel(model: Three.Object3D) {
  const geometries = new Set<Three.BufferGeometry>();
  const materials = new Set<Three.Material>();
  const textures = new Set<Three.Texture>();
  const skeletons = new Set<Three.Skeleton>();
  model.traverse((node) => {
    const mesh = node as Three.SkinnedMesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    if (mesh.isSkinnedMesh) skeletons.add(mesh.skeleton);
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value)
          textures.add(value as Three.Texture);
      }
    }
  });
  for (const skeleton of skeletons) skeleton.dispose();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  const images = new Set<ImageBitmap>();
  for (const texture of textures) {
    texture.dispose();
    const image = texture.source.data as ImageBitmap | undefined;
    if (image && typeof image.close === "function") images.add(image);
  }
  for (const image of images) image.close();
}

/** Authored, skinned character assets. Cinematics use their real animation clips. */
export async function loadBossRig(
  THREE: T,
  kind: BossKind,
): Promise<RiggedBoss> {
  const url=`/boss-models/${kind}.glb`,prepared=await scenePreloader.read(url),loader=new GLTFLoader();
  const gltf = prepared?await loader.parseAsync(prepared,'/boss-models/'):await loader.loadAsync(url);
  return prepareBossRig(THREE, kind, gltf);
}

/** Separate preparation also allows the real GLBs to be checked without WebGL. */
export function prepareBossRig(
  THREE: T,
  kind: BossKind,
  gltf: GLTF,
): RiggedBoss {
  const model = gltf.scene;
  let bones = 0,
    skins = 0;
  const configuredMaterials = new Set<Three.Material>();
  model.traverse((node) => {
    if ((node as Three.Bone).isBone) bones++;
    const mesh = node as Three.SkinnedMesh;
    if (mesh.isSkinnedMesh) {
      skins++;
      mesh.frustumCulled = false;
    }
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = true;
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      if (configuredMaterials.has(material)) continue;
      configuredMaterials.add(material);
      const pbr = material as Three.MeshStandardMaterial;
      if (!pbr.isMeshStandardMaterial) continue;
      pbr.envMapIntensity = kind === "kraken" ? 1.1 : 0.6;
      pbr.metalness = Math.min(pbr.metalness, 0.25);
      if (kind === "kraken") pbr.roughness = Math.min(pbr.roughness, 0.42);
      if (kind === "colossus") {
        pbr.roughness = Math.max(0.65, pbr.roughness);
        pbr.color.multiplyScalar(0.82);
      }
    }
  });
  if (!skins || !bones || !gltf.animations.length) {
    disposeModel(model);
    throw new Error(`Missing skeletal animation in ${kind}`);
  }
  const root = new THREE.Group();
  root.name = `rigged-${kind}`;
  root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations;
  const find = (expressions: RegExp[]) => {
    for (const expression of expressions) {
      const clip = clips.find((c) => expression.test(c.name));
      if (clip) return clip;
    }
    return null;
  };
  const idle = find([/^idle(?:_loop)?$/i, /^idle/i, /idle/i]) ?? clips[0];
  const intro = find([/sleep.?end/i, /^rise/i, /^intro/i, /roar/i]) ?? idle;
  const attack =
    find([/^attack1$/i, /^attack/i, /throw.?rock$/i, /^bite$/i, /roar/i]) ??
    idle;
  const hits = clips.filter(
    (clip) => /^hurt\d*$/i.test(clip.name) || /^hit/i.test(clip.name),
  );
  const death = find([/^death$/i, /defeat|death|die/i]);
  const roar = find([/^roar$/i, /attack2/i]) ?? attack;
  const actions = new Map(clips.map((clip) => [clip, mixer.clipAction(clip)]));
  type Mode = "idle" | "intro" | "attack" | "hit" | "break" | "death";
  type Playback = {
    action: Three.AnimationAction;
    clip: Three.AnimationClip;
    mode: Mode;
    start: number;
    clock: "time" | "elapsed";
    loop: boolean;
  };
  let current: Playback | null = null;
  let previous: { action: Three.AnimationAction; time: number } | null = null;
  let blendStarted = 0;
  const blendDuration = 0.24;
  const play = (
    clip: Three.AnimationClip,
    mode: Mode,
    start: number,
    clock: Playback["clock"],
    time: number,
    motion: number,
  ) => {
    const action = actions.get(clip)!;
    previous?.action.stop();
    previous =
      current && current.action !== action && motion > 0
        ? { action: current.action, time: current.action.time }
        : null;
    if (current && current.action !== action && !previous)
      current.action.stop();
    action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveWeight(1).play();
    // Sample authored tracks against the cinematic clock. A clamped frame delta
    // would make a returning background tab miss the full defeat animation.
    action.paused = true;
    action.clampWhenFinished = true;
    current = { action, clip, mode, start, clock, loop: mode === "idle" };
    blendStarted = time;
  };
  const sample = (frame: Pick<ArenaFrame, "time" | "elapsed" | "motion">) => {
    if (!current) return;
    const age = Math.max(0, frame[current.clock] - current.start);
    const duration = Math.max(0.001, current.clip.duration);
    // Reduced motion still receives the final authored defeat pose, without
    // cycling idle, attack or recoil animations between state changes.
    current.action.time = !frame.motion
      ? current.mode === "death"
        ? duration
        : Math.min(0.4, duration * 0.2)
      : current.loop
        ? age % duration
        : Math.min(age, duration);
    const blend = frame.motion
      ? Math.min(1, Math.max(0, (frame.time - blendStarted) / blendDuration))
      : 1;
    current.action.setEffectiveWeight(previous ? blend : 1);
    if (previous) {
      if (blend >= 1) {
        previous.action.stop();
        previous = null;
      } else {
        previous.action.time = previous.time;
        previous.action.setEffectiveWeight(1 - blend);
      }
    }
    mixer.update(0);
  };
  play(idle, "idle", 0, "time", 0, 0);
  sample({ time: 0, elapsed: 0, motion: 1 });
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model, true),
    size = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  const scale =
    kind === "dragon"
      ? 2
      : kind === "colossus"
        ? 7.5 / Math.max(size.y, 0.01)
        : Math.min(6.3 / Math.max(size.y, 0.01), 13.5 / Math.max(size.x, 0.01));
  model.scale.multiplyScalar(scale);
  // Long dragon tails remain behind the face and do not pull its framing sideways.
  model.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    kind === "dragon" ? 0 : -center.z * scale,
  );
  root.position.set(
    0,
    kind === "kraken" ? -0.3 : kind === "colossus" ? 0.24 : 0,
    kind === "dragon" ? -3.5 : -2.8,
  );
  const homeY = root.position.y;
  const armor = kind === "colossus" ? createColossusArmor(THREE, model) : null;
  let previousStage = "",
    previousElapsed = -1,
    previousPhase = -1;
  let lastReaction = -100,
    reactionCount = 0,
    breakReacted = false,
    disposed = false;
  const mouth =
    model.getObjectByName("breath_socket") ??
    model.getObjectByName("head") ??
    null;
  const update = (frame: ArenaFrame) => {
    if (disposed) return;
    const {
      stage,
      elapsed,
      time,
      impact,
      phase,
      motion,
      breakProgress,
      victory,
    } = frame;
    const reveal = stage === "roundReveal" || stage === "done";
    // `done` continues the same reveal; it must not restart a dying character.
    const sequence = reveal ? "reveal" : stage;
    const changed =
      sequence !== previousStage ||
      elapsed < previousElapsed - 0.2 ||
      (phase !== previousPhase && stage === "intro");
    if (changed) {
      breakReacted = false;
      lastReaction = -100;
      reactionCount = 0;
      if (stage === "intro" && motion && elapsed < intro.duration)
        play(intro, "intro", 0, "elapsed", time, motion);
      else if (
        reveal &&
        motion &&
        elapsed < (kind === "dragon" ? roar : attack).duration
      )
        play(
          kind === "dragon" ? roar : attack,
          "attack",
          0,
          "elapsed",
          time,
          motion,
        );
      else play(idle, "idle", time, "time", time, motion);
    }
    previousStage = sequence;
    previousElapsed = elapsed;
    previousPhase = phase;
    if (reveal && victory > 0) {
      if (current?.mode !== "death")
        play(death ?? idle, "death", 9.5, "elapsed", time, motion);
    } else if (reveal && breakProgress > 0 && !breakReacted) {
      breakReacted = true;
      if (motion && elapsed < 8 + roar.duration)
        play(roar, "break", 8, "elapsed", time, motion);
    } else if (
      reveal &&
      motion &&
      !breakReacted &&
      hits.length &&
      impact > 0.3 &&
      time - lastReaction > 0.68
    ) {
      play(
        hits[reactionCount++ % hits.length],
        "hit",
        time,
        "time",
        time,
        motion,
      );
      lastReaction = time;
    }
    if (
      current &&
      current.mode !== "idle" &&
      current.mode !== "death" &&
      frame[current.clock] - current.start >= current.clip.duration
    ) {
      play(idle, "idle", time, "time", time, motion);
    }
    sample(frame);
    armor?.update(frame);
    const dying = current?.mode === "death";
    root.rotation.set(0, kind === "dragon" ? -0.18 : 0, 0);
    root.position.y = homeY;
    if (dying) {
      if (!death && kind === "dragon") {
        root.rotation.z = -0.68 * victory;
        root.position.y = homeY - victory * 1.4;
      }
      // Allow the Kraken's tentacle-collapse performance before sinking.
      if (kind === "kraken") {
        const sink = motion
          ? Math.min(1, Math.max(0, (elapsed - 12) / 3.5))
          : 1;
        root.position.y = homeY - sink * 6.4;
      }
    } else if (motion) {
      root.rotation.x = impact * 0.06;
      root.rotation.z =
        breakProgress > 0 && breakProgress < 1
          ? Math.sin(breakProgress * Math.PI) * 0.07
          : 0;
      if (kind === "kraken")
        root.position.y = homeY + Math.sin(time * 0.7) * 0.1;
    }
    root.userData.phase = phase;
    root.userData.animation = current?.clip.name;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    armor?.dispose();
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    root.removeFromParent();
    disposeModel(model);
  };
  return {
    root,
    model,
    mouth,
    update,
    dispose,
    animations: clips.map((c) => c.name),
    bones,
  };
}
