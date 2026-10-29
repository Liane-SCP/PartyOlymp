import type * as Three from "three";
import type { BossKind } from "./boss-models";
import { batchArena } from "./boss-batching";

export interface SpectacleFrame {
  time: number;
  elapsed: number;
  stage: string;
  impact: number;
  phaseBroken: boolean;
  victory: boolean;
  reduced: boolean;
  intense: boolean;
  strength?:number;
}

/** Bounded pools: no geometry, material or light allocation during a battle. */
export function createBossSpectacle(
  T: typeof Three,
  kind: BossKind,
  target: Three.Vector3,
  glow: Three.Texture,
) {
  const root = new T.Group();
  const color = new T.Color(
    kind === "colossus" ? "#ad73ff" : kind === "kraken" ? "#39ddff" : "#ffb82e",
  );
  const hot = new T.Color(
    kind === "colossus" ? "#ffe6ba" : kind === "kraken" ? "#d1ffff" : "#ff5835",
  );
  const additive = (c: Three.Color, opacity = 0) =>
    new T.MeshBasicMaterial({
      color: c.clone().multiplyScalar(2.6),
      transparent: true,
      opacity,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
      forceSinglePass: true,
      toneMapped: false,
    });
  const rings = Array.from({ length: 5 }, (_, i) => {
    const mesh = new T.Mesh(
      new T.RingGeometry(0.94, 1, 96),
      additive(i % 2 ? hot : color),
    );
    mesh.position.copy(target);
    if (i % 2) mesh.rotation.x = -Math.PI / 2;
    root.add(mesh);
    return mesh;
  });
  const halo = new T.Sprite(
    new T.SpriteMaterial({
      map: glow,
      color: color.clone().multiplyScalar(1.8),
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.position.copy(target).add(new T.Vector3(0, 0, -0.6));
  root.add(halo);
  const rays = Array.from({ length: 14 }, (_, i) => {
    const mesh = new T.Mesh(
      new T.PlaneGeometry(1.4, 11),
      new T.ShaderMaterial({
        uniforms: {
          tint: { value: (i % 3 ? color : hot).clone().multiplyScalar(2.6) },
          strength: { value: 0 },
        },
        vertexShader: `varying vec2 beamUv;
          void main() { beamUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `varying vec2 beamUv; uniform vec3 tint; uniform float strength;
          void main() {
            float width = mix(.12, .5, beamUv.y);
            float edge = pow(max(0., 1. - abs(beamUv.x - .5) / width), 2.5);
            float ends = smoothstep(0., .15, beamUv.y) * (1. - smoothstep(.7, 1., beamUv.y));
            gl_FragColor = vec4(tint, edge * ends * strength);
          }`,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
        forceSinglePass: true,
        toneMapped: false,
      }),
    );
    mesh.position.set(
      Math.sin(i * 2.399) * 5.3,
      3.4,
      Math.cos(i * 2.399) * 4 - 2.8,
    );
    mesh.rotation.set(0, 0, Math.sin(i) * 0.35);
    root.add(mesh);
    return mesh;
  });
  const sigil = new T.Group();
  sigil.position.set(0, 0.12, -2.8);
  sigil.rotation.x = -Math.PI / 2;
  const sigilMaterials: Three.MeshBasicMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = additive(i % 2 ? hot : color);
    sigilMaterials.push(mat);
    sigil.add(
      new T.Mesh(new T.RingGeometry(2.6 + i * 1.05, 2.64 + i * 1.05, 96), mat),
    );
  }
  const runeGeo = new T.PlaneGeometry(0.08, 0.42);
  for (let i = 0; i < 32; i++) {
    const rune = new T.Mesh(runeGeo, sigilMaterials[i % 3]);
    rune.position.set(
      Math.sin((i * Math.PI) / 16) * 3.5,
      Math.cos((i * Math.PI) / 16) * 3.5,
      0,
    );
    rune.rotation.z = (-i * Math.PI) / 16;
    sigil.add(rune);
  }
  root.add(sigil);
  batchArena(sigil);
  const count = 720;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = (i % 4 ? color : hot).clone().multiplyScalar(2.1);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute(
    "position",
    new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage),
  );
  geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  const sparks = new T.Points(
    geo,
    new T.PointsMaterial({
      map: glow,
      vertexColors: true,
      size: 0.19,
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sparks.frustumCulled = false;
  root.add(sparks);
  // Visible lightning branches belong to the storm arena, golden rays to the vault.
  const boltPositions = new Float32Array(8 * 12 * 2 * 3);
  const boltGeo = new T.BufferGeometry();
  boltGeo.setAttribute("position", new T.BufferAttribute(boltPositions, 3));
  for (let b = 0; b < 8; b++)
    for (let j = 0; j < 12; j++) {
      for (let end = 0; end < 2; end++) {
        const t = (j + end) / 12;
        const n = ((b * 12 + j) * 2 + end) * 3;
        boltPositions[n] =
          (b % 2 ? 1 : -1) * (4 + b * 0.42) +
          Math.sin((j + end) * 9 + b) * 0.45;
        boltPositions[n + 1] = 10 - t * 10;
        boltPositions[n + 2] = -5 - b * 0.5;
      }
    }
  const bolts = new T.LineSegments(
    boltGeo,
    new T.LineBasicMaterial({
      color: hot.clone().multiplyScalar(4),
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      toneMapped: false,
      depthWrite: false,
    }),
  );
  root.add(bolts);
  const light = new T.PointLight(color, 0, 26, 2);
  light.position.copy(target).add(new T.Vector3(0, 1, 2));
  root.add(light);
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    root,
    update(f: SpectacleFrame) {
      const reveal = f.stage === "roundReveal" || f.stage === "done";
      const power = (f.intense ? 1 : 0.32)*(f.strength??1);
      const charge = reveal && f.elapsed<3.45 ? Math.sin(clamp(f.elapsed / 3.45) * Math.PI) : 0;
      const arrival =
        f.stage === "intro" ? Math.sin(clamp(f.elapsed / 6) * Math.PI) : 0;
      const rupture =
        reveal && f.phaseBroken
          ? Math.max(0, 1 - Math.abs(f.elapsed - 8.7) / 1.4)
          : 0;
      const victory = reveal && f.victory ? clamp((f.elapsed - 10) / 1.4) : 0;
      const energy = Math.max(
        charge * 0.65,
        arrival * 0.6,
        Math.min(1, f.impact),
        rupture,
        victory * 0.7,
      );
      const moving = !f.reduced;
      root.visible = true;
      halo.material.opacity = (0.08 + energy * 0.25) * power;
      halo.scale.setScalar(5 + energy * 5);
      light.intensity = (12 + energy * 95) * power;
      sigil.rotation.z = moving
        ? f.time * (kind === "colossus" ? 0.13 : -0.09)
        : 0;
      sigil.scale.setScalar(1 + energy * 0.12);
      sigilMaterials.forEach((m) => {
        m.opacity =
          (kind === "colossus" ? 0.22 : 0.08) * power + energy * 0.28 * power;
      });
      rays.forEach((ray, i) => {
        ray.material.uniforms.strength.value = (0.055 + energy * 0.3) * power;
        ray.scale.set(1 + energy * 1.6, 1 + energy * 0.5, 1);
        ray.rotation.z = moving ? Math.sin(f.time * 0.5 + i) * 0.23 : 0;
      });
      rings.forEach((ring, i) => {
        const age =
          reveal && f.victory && f.elapsed >= 10
            ? ((f.elapsed - 10) % 2.8) - i * 0.16
            : reveal && f.phaseBroken && f.elapsed >= 8
              ? f.elapsed - 8 - i * 0.16
              : f.stage === "intro"
                ? f.elapsed - 1.2 - i * 0.24
                : reveal
                  ? ((f.elapsed - 4.2) % 1.1) - i * 0.09
                  : -1;
        const alive = age > 0 && age < 1.65 && moving && (kind==='colossus'||arrival>0||rupture>0||victory>0||f.impact>0);
        ring.visible = alive;
        ring.scale.setScalar(0.5 + Math.max(0, age) * (rupture > 0 ? 7 : 4.5));
        ring.material.opacity = alive ? (1 - age / 1.65) * 0.65 * power : 0;
      });
      const burst = rupture > 0 || victory > 0 || f.impact > 0 || arrival > 0;
      sparks.visible = moving && (burst || charge > 0);
      sparks.material.opacity = Math.min(0.95, 0.35 + energy * 0.5) * power;
      if (sparks.visible)
        for (let i = 0; i < count; i++) {
          const a = i * 2.399;
          const cycle =
            victory > 0
              ? (f.elapsed - 10 + (i % 7) * 0.32) % 2.7
              : (f.time * 0.9 + i * 0.013) % 1.8;
          const spread =
            charge > 0 && !burst
              ? 5 * (1 - cycle / 1.8)
              : cycle * (2 + (i % 9) * 0.38);
          const fountain = victory > 0;
          positions[i * 3] = fountain
            ? Math.sin(a) * spread + Math.sin(i % 7) * 3
            : target.x + Math.sin(a) * spread;
          positions[i * 3 + 1] = fountain
            ? 2 + cycle * (5 + (i % 5)) - cycle * cycle * 2.5
            : target.y + Math.cos(i * 0.91) * spread;
          positions[i * 3 + 2] = target.z + Math.cos(a) * spread * 0.7;
        }
      if (sparks.visible) geo.attributes.position.needsUpdate = true;
      const storm =
        kind === "kraken" && moving
          ? Math.max(
              arrival * 0.8,
              rupture,
              f.impact * 0.6,
              Math.max(0, 1 - Math.abs((f.time % 13) - 10) / 0.65),
            )
          : 0;
      bolts.material.opacity = storm * 0.7 * power;
      return { energy, charge, rupture, victory };
    },
  };
}
