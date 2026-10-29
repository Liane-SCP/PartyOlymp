import {bossStation} from "@/lib/boss-stations";
import {krakenFireAt} from '@/lib/kraken-salvo';
import type * as Three from "three";

export type BossKind = "colossus" | "kraken" | "dragon";
type T = typeof import("three");
export interface ArenaFrame {
  time: number;
  elapsed: number;
  phase: number;
  stage: string;
  impact: number;
  breakProgress: number;
  victory: number;
  motion: number;
  salvo?:boolean[];
}
export interface BossArena {
  root: Three.Group;
  boss: Three.Group;
  target: Three.Vector3;
  update: (frame: ArenaFrame) => void;
  palette: { background: number; fog: number; key: number; glow: number };
  playerHeight: number;
  crewParent?: Three.Group;
  cannons?: Three.Group[];
}

/** Environments only: all three creatures are external authored skeletal models. */
export function createBossArena(
  THREE: T,
  kind: BossKind,
  playerCount = 12,
): BossArena {
  const root = new THREE.Group(),
    boss = new THREE.Group();
  root.add(boss);
  const mats = new Map<string, Three.MeshStandardMaterial>();
  const mat = (color: number, metalness = 0.05, roughness = 0.8) => {
    const key = `${color}/${metalness}/${roughness}`;
    if (!mats.has(key))
      mats.set(
        key,
        new THREE.MeshStandardMaterial({ color, metalness, roughness }),
      );
    return mats.get(key)!;
  };
  const iron = mat(0x20252a, 0.82, 0.28);
  const loadSet = (
    material: Three.MeshStandardMaterial,
    prefix: string,
    repeat: number,
  ) => {
    for (const [key, suffix] of [
      ["map", "color"],
      ["normalMap", "normal"],
      ["roughnessMap", "roughness"],
    ] as const) {
      const texture = new THREE.TextureLoader().load(
        `/boss-environment/${prefix}-${suffix}.jpg`,
      );
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.anisotropy = 4;
      if (key === "map") texture.colorSpace = THREE.SRGBColorSpace;
      material[key] = texture;
    }
    material.normalScale.set(0.8, 0.8);
  };
  const box = new THREE.BoxGeometry(1, 1, 1),
    cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
  const mesh = (
    geometry: Three.BufferGeometry,
    material: Three.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    parent: Three.Object3D = root,
  ) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    item.castShadow = item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const tube = (
    points: number[][],
    radius: number,
    material: Three.Material,
    parent: Three.Object3D = root,
  ) =>
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          points.map(
            (p) => new THREE.Vector3(...(p as [number, number, number])),
          ),
        ),
        32,
        radius,
        6,
        false,
      ),
      material,
      0,
      0,
      0,
      1,
      1,
      1,
      parent,
    );
  const torches: Three.PointLight[] = [];
  const torch = (x: number, y: number, z: number) => {
    mesh(cylinder, iron, x, y - 0.55, z, 0.12, 1.1, 0.12);
    mesh(new THREE.CylinderGeometry(0.26, 0.15, 0.25, 12), iron, x, y, z);
    const light = new THREE.PointLight(0xff993d, 13, 12, 2);
    light.position.set(x, y + 0.2, z);
    root.add(light);
    torches.push(light);
    const flame = mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc05a }),
      x,
      y + 0.18,
      z,
      1,
      2,
      1,
    );
    flame.castShadow = false;
  };
  if (kind === "colossus") {
    const stone = mat(0x6f747c, 0.05, 0.92),
      rock = new THREE.IcosahedronGeometry(1, 2);
    loadSet(stone, "stone", 3);
    mesh(new THREE.CylinderGeometry(7.2, 7.5, 0.6, 64), stone, 0, -0.32, -1.1);
    mesh(new THREE.CylinderGeometry(3.7, 4, 0.32, 32), stone, 0, 0.08, -2.8);
    const rune = new THREE.MeshStandardMaterial({
      color: 0x657876,
      roughness: 0.6,
      emissive: 0x224944,
      emissiveIntensity: 0.45,
    });
    const circle = mesh(
      new THREE.TorusGeometry(6.25, 0.018, 6, 96),
      rune,
      0,
      0.02,
      -1.1,
    );
    circle.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7 - 0.5) * 2.6,
        x = Math.sin(angle) * 8.4,
        z = -Math.cos(angle) * 6.4 - 2.1,
        h = [4.6, 6.7, 8.1, 8.8, 8.6, 7.3, 5.6, 3.6][i];
      mesh(new THREE.CylinderGeometry(0.46, 0.61, h, 20), stone, x, h / 2, z);
      mesh(box, stone, x, 0.24, z, 1.5, 0.46, 1.5);
      mesh(box, stone, x, h - 0.1, z, 1.35, 0.35, 1.35);
      if (i > 1 && i < 6)
        mesh(box, stone, x, h + 0.2, z, 2.6, 0.45, 0.8).rotation.z =
          (i % 2 ? 1 : -1) * 0.04;
    }
    mesh(
      new THREE.TorusGeometry(4.35, 0.36, 12, 64, Math.PI),
      stone,
      0,
      4,
      -7.3,
    );
    for (const x of [-4.35, 4.35]) mesh(box, stone, x, 2, -7.3, 0.8, 4, 0.8);
    for (let i = 0; i < 25; i++) {
      const angle = i * 2.399,
        r = 6.8 + (i % 4) * 0.37;
      mesh(
        rock,
        stone,
        Math.sin(angle) * r,
        -0.03,
        Math.cos(angle) * 4.7 - 2,
        0.2 + (i % 5) * 0.1,
        0.15 + (i % 3) * 0.1,
        0.27 + (i % 3) * 0.2,
      ).rotation.set(i, 0, i * 0.7);
    }
    torch(-4.9, 2, -1.8);
    torch(4.9, 2, -1.8);
    return {
      root,
      boss,
      target: new THREE.Vector3(0, 3.7, -2.5),
      playerHeight: 0,
      palette: {
        background: 0x05090f,
        fog: 0x080e15,
        key: 0xaec1d5,
        glow: 0x8cbec0,
      },
      update(f) {
        torches.forEach(
          (l, i) =>
            (l.intensity =
              12 + (f.motion ? Math.sin(f.time * 8 + i * 2) * 2 : 0)),
        );
      },
    };
  }
  if (kind === "kraken") {
    const wood = mat(0x8b7964, 0.02, 0.85);
    loadSet(wood, "wood", 2.5);
    const sea = new THREE.PlaneGeometry(240, 240, 96, 72);
    sea.rotateX(-Math.PI / 2);
    // Restrained dielectric reflections preserve dark storm water even when the
    // photographed sky contains a bright horizon; the surface is not chrome.
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x04131d,
      metalness: 0,
      roughness: 0.43,
      envMapIntensity: 0.28,
    });
    const ocean = mesh(sea, seaMat, 0, -0.25, -17);
    ocean.name = "storm-ocean";
    ocean.userData.dynamic = true;
    ocean.castShadow = false;
    const waterClock = { value: 0 };
    seaMat.onBeforeCompile = (shader) => {
      shader.uniforms.waterTime = waterClock;
      shader.vertexShader = `uniform float waterTime;\n${shader.vertexShader}`
        .replace(
          "#include <beginnormal_vertex>",
          `
          float wa = position.x*.48 + position.z*.25 + waterTime*.85;
          float wb = position.z*.8 - position.x*.17 + waterTime*1.4;
          vec3 objectNormal = normalize(vec3(-(cos(wa)*.0768-cos(wb)*.0136),1.,-(cos(wa)*.04+cos(wb)*.064)));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        )
        .replace(
          "#include <begin_vertex>",
          `vec3 transformed = vec3(position); transformed.y += sin(wa)*.16 + sin(wb)*.08;`,
        );
    };
    seaMat.customProgramCacheKey = () => "boss-ocean-gpu-v1";
    // Rotate around the deck's centre. Character roots remain in the scene and
    // are never reparented into this restrained cinematic boat motion.
    const ship = new THREE.Group(),
      shipParts = new THREE.Group();
    ship.name = "kraken-ship";
    ship.position.set(0, 0.5, 5.1);
    shipParts.position.set(0, -0.5, -5.1);
    ship.add(shipParts);
    root.add(ship);
    const rope=mat(0x9e947f);
    for(const side of[-1,1]){
      const points:number[][]=[];
      for(let i=0;i<=12;i++){const x=-6.6+i*1.1,z=5.1+side*(2.55-Math.pow(Math.abs(x)/6.6,3)*1.65);points.push([x,1.38,z]);mesh(box,wood,x,1.05,z,.08,.7,.08,shipParts);}
      tube(points,.045,wood,shipParts);
    }
    mesh(cylinder,wood,-6.1,4.4,5.4,.13,7.5,.13,shipParts);
    tube([[-6.1,7.9,5.4],[-5.8,3.6,4.2],[-4.9,.9,3.3]],.019,rope,shipParts);
    tube([[-6.1,7.9,5.4],[-3.9,2.8,6.7],[0,.9,7.3]],.019,rope,shipParts);
    const cannons: Three.Group[] = [],
      spacing = Math.min(1.72, 10.8 / Math.max(1, playerCount - 1));
    const barrel = new THREE.CylinderGeometry(0.13, 0.19, 0.98, 20),
      muzzle = new THREE.TorusGeometry(0.133, 0.026, 6, 24),
      wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 14);
    for (let i = 0; i < playerCount; i++) {
      const gun = new THREE.Group();
      const station=bossStation(i,playerCount,true);
      gun.position.set(station.x,0.84,station.cannonZ);
      gun.userData.homeZ=station.cannonZ;
      shipParts.add(gun);
      cannons.push(gun);
      mesh(box, wood, 0, 0.06, 0, 0.44, 0.22, 0.55, gun);
      mesh(barrel, iron, 0, 0.36, -0.24, 1, 1, 1, gun).rotation.x =
        -Math.PI / 2 + 0.18;
      mesh(muzzle, iron, 0, 0.455, -0.72, 1, 1, 1, gun);
      for (const side of [-1, 1])
        mesh(wheel, iron, side * 0.25, 0.09, 0.03, 1, 1, 1, gun).rotation.z =
          Math.PI / 2;
    }
    const foam = new THREE.MeshBasicMaterial({
      color: 0xa5bdc6,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    });
    const rings = Array.from({ length: 3 }, (_, i) => {
      const ring = mesh(
        new THREE.TorusGeometry(2.9 + i * 0.7, 0.025, 4, 96),
        foam,
        0,
        0.015,
        -2.6,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.userData.dynamic = true;
      ring.castShadow = ring.receiveShadow = false;
      return ring;
    });
    return {
      root,
      boss,
      target: new THREE.Vector3(0, 3, -2.6),
      playerHeight: 0.75,
      crewParent: shipParts,
      cannons,
      palette: {
        background: 0x040c15,
        fog: 0x091825,
        key: 0x839caf,
        glow: 0x477c93,
      },
      update(f) {
        if (f.motion) waterClock.value = f.time;
        cannons.forEach((gun, i) => {
          const t =
            f.elapsed - krakenFireAt(i,playerCount);
          gun.position.z =
            gun.userData.homeZ +
            (f.stage === "roundReveal" && f.salvo?.[i] && t >= 0 && t < 0.5
              ? Math.sin((t / 0.5) * Math.PI) * 0.18 * f.motion
              : 0);
        });
        rings.forEach((ring, i) =>
          ring.scale.setScalar(
            1 + (f.motion ? Math.sin(f.time * 0.8 + i) * 0.04 : 0),
          ),
        );
        const breaking =
          f.breakProgress > 0 && f.breakProgress < 1
            ? Math.sin(f.breakProgress * Math.PI)
            : 0;
        ship.rotation.x = f.motion
          ? Math.sin(f.time * 0.55) * 0.005 + breaking * 0.024
          : 0;
        ship.rotation.z = f.motion
          ? Math.sin(f.time * 0.7) * 0.007 +
            Math.sin(f.breakProgress * Math.PI * 2) * breaking * 0.045
          : 0;
        ship.position.y = 0.5 - (f.motion ? breaking * 0.04 : 0);
      },
    };
  }
  const gold = mat(0xb98c3a, 0.87, 0.25),
    darkGold = mat(0x63461d, 0.8, 0.36);
  const basalt = mat(0x343134, 0.15, 0.69);
  loadSet(basalt, "stone", 3.5);
  mesh(new THREE.CylinderGeometry(7.8, 8.2, 0.55, 64), basalt, 0, -0.3, -1.7);
  for (let i = 0; i < 11; i++) {
    const angle = (i / 10 - 0.5) * 2.6,
      x = Math.sin(angle) * 8.8,
      z = -Math.cos(angle) * 6.2 - 3,
      h = 6 + (i % 3) * 1.3;
    mesh(new THREE.CylinderGeometry(0.64, 0.92, h, 7), basalt, x, h / 2, z);
    mesh(cylinder, darkGold, x, h * 0.25, z, 0.71, 0.17, 0.71);
    mesh(cylinder, darkGold, x, h * 0.75, z, 0.71, 0.12, 0.71);
  }
  const coins = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.025, 12),
      gold,
      950,
    ),
    dummy = new THREE.Object3D();
  for (let i = 0; i < 950; i++) {
    const radius = Math.sqrt((i * 0.618033) % 1) * 4.5,
      a = i * 2.399;
    dummy.position.set(
      Math.cos(a) * radius,
      Math.max(0, 0.77 - radius * 0.16) + (i % 7) * 0.025,
      Math.sin(a) * radius * 0.76 - 2.9,
    );
    dummy.rotation.set(Math.sin(i) * 0.27, a, Math.cos(i) * 0.3);
    dummy.scale.setScalar(0.8 + (i % 4) * 0.15);
    dummy.updateMatrix();
    coins.setMatrixAt(i, dummy.matrix);
  }
  coins.castShadow = false;
  coins.receiveShadow = true;
  root.add(coins);
  for (const side of [-1, 1]) {
    const chest = new THREE.Group();
    chest.position.set(side * 4.9, 0.1, -0.7);
    chest.rotation.y = side * 0.3;
    root.add(chest);
    mesh(box, mat(0x302019, 0.03, 0.8), 0, 0.38, 0, 1.55, 0.76, 1, chest);
    mesh(
      new THREE.CylinderGeometry(0.51, 0.51, 1.55, 24, 1, false, 0, Math.PI),
      darkGold,
      0,
      0.8,
      0,
      1,
      1,
      1,
      chest,
    ).rotation.z = Math.PI / 2;
    for (const x of [-0.55, 0.55])
      mesh(box, gold, x, 0.43, 0.51, 0.08, 0.79, 0.04, chest);
    mesh(box, gold, 0, 0.68, 0.55, 0.15, 0.24, 0.07, chest);
    torch(side * 5.2, 2.5, -4.5);
  }
  return {
    root,
    boss,
    target: new THREE.Vector3(0, 4.7, -0.2),
    playerHeight: 0,
    palette: {
      background: 0x0b0707,
      fog: 0x150b08,
      key: 0xd3b394,
      glow: 0xa85d2c,
    },
    update(f) {
      torches.forEach(
        (l, i) =>
          (l.intensity =
            18 +
            (f.motion ? Math.sin(f.time * 7 + i * 3) * 3 : 0) +
            f.phase * 3),
      );
    },
  };
}
