import type * as Three from "three";
import type { Selection } from "@/lib/game/types";
import { journeyLayout, journeyBounds } from "@/lib/journey-world";
import { createIslandTerrain } from "./journey-terrain";
import { createMapCharacter, type MapCharacter } from "./journey-characters";
import { mapSpawn, sampleMapMove, type MapMove, type CrewTravel } from "@/lib/game/journey-motion";
import {journeyTransitKind,journeyTransitFrame,transitPassenger} from '@/lib/journey-transit';
import {createJourneyVessel} from './journey-vessel';
import {journeyWalkHeight,journeyLandmarkScale,journeyBridgePoint,journeyBridgePassenger} from '@/lib/journey-plaza';
import {createAdventureModels} from './adventure-models';

/** A persistent world with every island; static detail is instanced across the whole map. */
export function createJourneyScene(T: typeof Three, selection: Selection[], selected: number, current: number,
  crew: MapCharacter[], completed: number, trophies: { index: number; victory: boolean }[]) {
  const nodes = journeyLayout(selection), bounds = journeyBounds(nodes), scene = new T.Scene();
  const skyPixels=new Uint8Array(128*4);for(let y=0;y<128;y++){const c=new T.Color("#98adb4").lerp(new T.Color("#233b58"),y/127);skyPixels.set([Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255),255],y*4);}
  const sky=new T.DataTexture(skyPixels,1,128);sky.needsUpdate=true;sky.magFilter=T.LinearFilter;scene.background=sky;scene.fog = new T.FogExp2("#809cab", 0.0018);
  const geometries = new Set<Three.BufferGeometry>(), materials = new Set<Three.Material>();
  const palette = new Map<string, Three.MeshStandardMaterial>();
  const mat = (color: string | number, glow = false, metal = false) => {
    const key = `${color}:${glow}:${metal}`; if (palette.has(key)) return palette.get(key)!;
    const m = new T.MeshStandardMaterial({ color, metalness: metal ? 0.7 : 0.05, roughness: metal ? 0.3 : 0.85,
      ...(glow ? { emissive: color, emissiveIntensity: 1.4 } : {}) });
    materials.add(m); palette.set(key, m); return m;
  };
  const geo = <G extends Three.BufferGeometry>(g: G) => { geometries.add(g); return g; };
  const box = geo(new T.BoxGeometry(1, 1, 1)), cylinder = geo(new T.CylinderGeometry(1, 1, 1, 16));
  const cone = geo(new T.ConeGeometry(1, 1, 9)), crystal = geo(new T.OctahedronGeometry(1));
  const sphere = geo(new T.IcosahedronGeometry(1, 1)), smooth = geo(new T.SphereGeometry(1, 16, 10));
  const torus = geo(new T.TorusGeometry(1, 0.035, 6, 64)), arch = geo(new T.TorusGeometry(1, 0.075, 6, 40, Math.PI));
  const shape = new T.Shape(); shape.moveTo(-1, 0); shape.lineTo(1, 0); shape.lineTo(0, 0.7); shape.closePath();
  const roof = geo(new T.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false })); roof.translate(0, 0, -0.5);
  const plazaTop=geo(new T.RingGeometry(.47,.82,48));plazaTop.rotateX(-Math.PI/2);
  const plazaBorders=[geo(new T.RingGeometry(.47,.485,48)),geo(new T.RingGeometry(.805,.82,48))];plazaBorders.forEach(g=>g.rotateX(-Math.PI/2));
  const stone = mat("#65718a"), cliff = mat("#34425d"), marble = mat("#ebe2ce"), gold = mat("#f1c77e", false, true);
  const glow = mat("#ffdc94", true), dark = mat("#182334"), wood = mat("#77594d"), green = mat("#4c8a78");
  const pink = mat("#e39bc5"), violet = mat("#9478be"), blue = mat("#69b5d4"), red = mat("#d77370");
  const colors = ["#e38eaa", "#83bddf", "#b7cf85", "#c4a0eb", "#ebbc7c", "#80c9bc"];
  const piece = (g: Three.BufferGeometry, m: Three.Material, p: Three.Object3D, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
    const mesh = new T.Mesh(g, m); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); p.add(mesh); return mesh;
  };
  const block = (p: Three.Object3D, m: Three.Material, x: number, y: number, z: number, w: number, h: number, d: number) => piece(box, m, p, x, y, z, w, h, d);
  const disc = (p: Three.Object3D, m: Three.Material, x: number, y: number, z: number, r: number, h: number) => piece(cylinder, m, p, x, y, z, r, h, r);
  const ring = (p: Three.Object3D, m: Three.Material, x: number, y: number, z: number, r: number, flat = true) => {
    const mesh = piece(torus, m, p, x, y, z, r); if (flat) mesh.rotation.x = Math.PI / 2; return mesh;
  };
  const group = (p: Three.Object3D, name: string, dynamic = false) => { const g = new T.Group(); g.name = name; g.userData.dynamic = dynamic; p.add(g); return g; };
  const animated: { root: Three.Object3D; update: (t: number) => void }[] = [];
  const animate = (root: Three.Object3D, update: (t: number) => void) => { root.userData.dynamic = true; animated.push({ root, update }); };
  const tree = (p: Three.Object3D, x: number, z: number, h = 1.5) => {
    disc(p, wood, x, h * 0.24, z, 0.1, h * 0.5); piece(cone, green, p, x, h * 0.7, z, h * 0.4, h, h * 0.4); piece(cone, green, p, x, h, z, h * 0.26, h * 0.7, h * 0.26);
  };
  const house = (p: Three.Object3D, x: number, z: number, s: number, tint = marble) => {
    block(p, tint, x, s * 0.55, z, s, s, s * 0.8); piece(roof, red, p, x, s * 1.1, z, s * 0.7, s * 0.8, s);
    block(p, wood, x, s * 0.3, z + s * 0.405, s * 0.23, s * 0.45, 0.05);
  };
  const pillar = (p: Three.Object3D, x: number, z: number, h: number) => {
    disc(p, gold, x, 0.3, z, 0.48, 0.35); disc(p, marble, x, h / 2 + 0.4, z, 0.3, h);
    block(p, marble, x, h + 0.5, z, 0.9, 0.3, 0.9); ring(p, gold, x, h * 0.7, z, 0.32);
  };
  const banner = (p: Three.Object3D, x: number, z: number, color: string, h = 3) => {
    disc(p, gold, x, h / 2, z, 0.045, h); block(p, mat(color), x + 0.32, h - 0.5, z, 0.65, 0.85, 0.05); piece(crystal, glow, p, x, h + 0.1, z, 0.1);
  };
  const ship = (p: Three.Object3D, x: number, z: number, s = 1) => {
    piece(sphere, wood, p, x, 0.8 * s, z, 0.75 * s, 0.4 * s, 1.8 * s); disc(p, wood, x, 2 * s, z, 0.07 * s, 3.5 * s);
    block(p, marble, x + 0.6 * s, 2.4 * s, z, 1.1 * s, 1.9 * s, 0.05); block(p, gold, x, s, z, 1.1 * s, 0.1, 2.5 * s);
  };
  const pixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (y * 64 + x) * 4, d = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5); pixels[i] = pixels[i + 1] = pixels[i + 2] = 255; pixels[i + 3] = Math.round(Math.max(0, 1 - d) ** 2.5 * 255); }
  const lightTexture = new T.DataTexture(pixels, 64, 64); lightTexture.needsUpdate = true;
  const aura = (p: Three.Object3D, color: string, x: number, y: number, z: number, size: number, opacity = 0.5) => {
    const m = new T.SpriteMaterial({ color, map: lightTexture, blending: T.AdditiveBlending, depthWrite: false, opacity }); materials.add(m);
    const s = new T.Sprite(m); s.position.set(x, y, z); s.scale.set(size, size, 1); p.add(s); return s;
  };
  scene.add(new T.HemisphereLight(0xe5f2ff, 0x425247, 2.3));
  const sun = new T.DirectionalLight(0xffe3ae, 3.2); sun.position.set(-30, 70, 40); scene.add(sun);
  const rim = new T.DirectionalLight(0xb1d5e7, 2.2); rim.position.set(30, 30, -60); scene.add(rim);
  const roots: Three.Group[] = [], pickables: Three.Object3D[] = [];
  const landMat=new T.MeshStandardMaterial({vertexColors:true,roughness:0.95,metalness:0});materials.add(landMat);
  for (const node of nodes) {
    const { index, radius: r, theme, game: id,region } = node;
    const root = group(scene, `island-root-${index}`); root.position.set(...node.position);
    Object.assign(root.userData, { islandIndex: index, game: id, radius: r, landmark: theme.landmark,region:region.id }); roots.push(root);
    const landColor=new T.Color(theme.ground).lerp(new T.Color(region.ground),node.boss ? .2 : .65);
    const terrain=geo(createIslandTerrain(T,r,index,`#${landColor.getHexString()}`,region));
    const ground=piece(terrain,landMat,root,0,0,0,1);ground.name="organic-island-terrain";
    for(let k=0;k<(node.boss?11:5);k++){
      const a=Math.PI+(k+0.4)/(node.boss?11:5)*Math.PI,rr=r*(0.86+Math.sin(k+index)*0.02);
      const x=Math.cos(a)*rr,z=Math.sin(a)*rr,h=node.boss?1.1+(k%3)*.1:.9+(k%3)*.22;
      if(id!=="dragon"&&id!=="kraken"){
        const growth=group(root,`region-${region.growth}-${k}`);
        if(region.growth==='crystal'){
          growth.scale.y=.85;
          for(let leaf=0;leaf<3;leaf++)piece(crystal,mat(region.foliage[leaf]),growth,x+(leaf-1)*h*.19,h*(.45+leaf*.12),z,h*.18,h*(.6+leaf*.15),h*.2);
        }else{
          disc(growth,wood,x,h*.4,z,.08,h*.8);
          for(let leaf=0;leaf<3;leaf++){
            const tint=mat(region.foliage[leaf]);
            if(region.growth==='palm') {const frond=piece(roof,tint,growth,x,h*.95,z,h*.65,h*.12,h*.25);frond.rotation.y=leaf*Math.PI*2/3;frond.rotation.z=.15;}
            else if(region.growth==='canopy')piece(sphere,tint,growth,x+Math.sin(leaf*2.4)*h*.22,h*(.8+leaf*.13),z+Math.cos(leaf*2.4)*h*.16,h*.38,h*.42,h*.35);
            else piece(cone,tint,growth,x,h*(.65+leaf*.22),z,h*(region.growth==='cypress'?.2:.45-leaf*.09),h*(region.growth==='cypress'?.95:.65),h*(region.growth==='cypress'?.2:.45-leaf*.09));
          }
        }
      } else piece(sphere,stone,root,x,0.25,z,0.4,0.35,0.35);
    }
    for(let k=0;k<(node.boss?35:12);k++){
      const a=k*2.3999+index,rr=r*(0.82+(k%4)*0.025),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
      const grass=piece(region.growth==='crystal'?crystal:cone,mat(region.foliage[k%3]),root,x,0.24,z,0.08,0.28,0.08);grass.rotation.z=Math.sin(k)*0.25;
      if(k%3===0)piece(sphere,mat(region.flowers[Math.floor(k/3)%3]),root,x,0.4,z,0.065);
    }
    if(id!=="dragon"&&region.water&&index%3!==1){
      const x=-r*0.86,z=r*0.28;
      const path=new T.CatmullRomCurve3([new T.Vector3(x,0.1,z),new T.Vector3(x-r*0.08,-r*0.4,z),new T.Vector3(x-r*0.15,-r*1.4,z+r*0.12),new T.Vector3(x-r*0.25,-r*1.9,z+r*0.18)]);
      piece(geo(new T.TubeGeometry(path,16,r*0.055,6,false)),mat("#90c8d2"),root,0,0,0,1);
      aura(root,"#bfdfe2",x-r*0.25,-r*1.85,z+r*0.18,r*1.3,0.26);
    }
    const landmark = group(root, theme.landmark);
    if (id === "colossus") {
      for (let k = 0; k < 7; k++) block(landmark, marble, 0, 0.15 + k * 0.22, 6.5 - k * 0.7, 8.5 - k * 0.12, 0.25, 1.2);
      block(landmark, stone, 0, 1.35, -1, 12, 1.5, 9);
      for (const x of [-5, -3, 3, 5]) for (const z of [-4, 2]) pillar(landmark, x, z, 8.3);
      for (const x of [-5, 5]) pillar(landmark, x, -1, 8.3);
      block(landmark, marble, 0, 9.1, -1, 12.7, 0.8, 8.8); piece(roof, marble, landmark, 0, 9.5, -1, 6.7, 4, 9.2);
      for (const x of [-6.7, 6.7]) { disc(landmark, stone, x, 1.5, 3.5, 1.1, 3); ring(landmark, glow, x, 3, 3.5, 1.1); const rune = piece(crystal, mat(theme.color, true), landmark, x, 4.2, 3.5, 0.6, 1.2, 0.6); animate(rune, t => { rune.position.y = 4.2 + Math.sin(t + x) * 0.3; rune.rotation.y = t * 0.35; }); }
      const guardian = group(landmark, "titan-guardian"); guardian.position.z = 4.2;
      piece(sphere, stone, guardian, 0, 3.5, 0, 1.8, 2.2, 1.1); block(guardian, marble, 0, 6.1, 0, 2.4, 2.3, 1.8);
      for (const side of [-1, 1]) { piece(sphere, cliff, guardian, side * 2, 3, 0.3, 0.75, 2, 0.8); block(guardian, mat(theme.color, true), side * 0.55, 6.35, 0.93, 0.48, 0.2, 0.06); }
      piece(crystal, glow, guardian, 0, 3.8, 1.1, 0.4, 0.65, 0.12); ring(landmark, mat(theme.color, true), 0, 5.5, -4.5, 3.8, false); aura(landmark, theme.color, 0, 6, -2, 18, 0.55);
    } else if (id === "kraken") {
      disc(landmark, mat("#267b96", false, true), 0, 0.18, 0, 8.7, 0.25);
      for (let k = 0; k < 6; k++) { const wave = ring(landmark, mat(k % 2 ? "#5fcee1" : "#358ca8", true), 0, 0.35 + k * 0.03, 0, 1.5 + k * 1.1); animate(wave, t => { wave.rotation.z = t * 0.12 * (k % 2 ? 1 : -1); wave.position.y = 0.35 + k * 0.03 + Math.sin(t * 1.5 + k) * 0.04; }); }
      const monster = group(landmark, "kraken-leviathan"); piece(smooth, violet, monster, 0, 3.2, -0.7, 2.6, 3.5, 2.1);
      for (const side of [-1, 1]) { piece(sphere, marble, monster, side * 0.9, 4.2, 1.2, 0.5, 0.65, 0.3); piece(sphere, mat("#70f5e8", true), monster, side * 0.9, 4.2, 1.49, 0.21, 0.42, 0.12); }
      for (let k = 0; k < 8; k++) {
        const arm = group(landmark, `kraken-tentacle-${k}`, true); arm.rotation.y = k * Math.PI / 4; const length = 5.5 + k % 3 * 0.7;
        const path = new T.CatmullRomCurve3([new T.Vector3(1.2, 1.2, 0), new T.Vector3(3, 0.6, 0), new T.Vector3(length, 1.5, 0), new T.Vector3(length - 0.2, 4 + k % 3, 0), new T.Vector3(length - 1.4, 4.8 + k % 3, 0)]);
        piece(geo(new T.TubeGeometry(path, 16, 0.5, 6, false)), violet, arm, 0, 0, 0, 1);
        for (let j = 0; j < 4; j++) piece(sphere, pink, arm, length - 0.1, 1.7 + j * 0.65, 0.4, 0.14);
        animate(arm, t => { arm.rotation.z = Math.sin(t * 0.8 + k) * 0.055; });
      }
      for (const side of [-1, 1]) { disc(landmark, stone, side * 7.5, 2, -3, 0.65, 4); disc(landmark, marble, side * 7.5, 4.1, -3, 0.8, 0.4); aura(landmark, "#a7efff", side * 7.5, 4.5, -3, 5); }
      ship(landmark, -4.5, 5.5, 1.2); ship(landmark, 5, 3, 0.8); aura(landmark, theme.color, 0, 1, 0, 18, 0.35);
    } else if (id === "dragon") {
      const lava = mat("#ff9b50", true), obsidian = mat("#4d4556");
      piece(cone, obsidian, landmark, 0, 3, -1.5, 6.3, 6.5, 5); disc(landmark, lava, 0, 6.1, -1.5, 2.3, 0.2); ring(landmark, gold, 0, 6.2, -1.5, 2.4);
      for (let k = 0; k < 5; k++) { const vein = block(landmark, lava, (k - 2) * 1.2, 2.5, 2.2, 0.3, 5, 0.1); vein.rotation.z = (k - 2) * 0.28; }
      for (const side of [-1, 1]) { disc(landmark, obsidian, side * 6.4, 2.2, 1, 1, 4.4); piece(cone, gold, landmark, side * 6.4, 5.3, 1, 1.5, 2, 1.5); banner(landmark, side * 7.5, 4, "#f0bb75", 4); }
      for (let k = 0; k < 20; k++) disc(landmark, gold, Math.sin(k * 7) * 4.5, 0.3 + k % 4 * 0.16, 3 + Math.cos(k * 4) * 2.7, 0.5 + k % 3 * 0.2, 0.2);
      const dragon = group(landmark, "dragon-over-the-hort", true); dragon.position.set(0, 8, -1.5);
      piece(smooth, gold, dragon, 0, 0, 0, 1.15, 1.6, 1); piece(sphere, gold, dragon, 0, 1.9, 0.4, 0.9, 0.7, 1.2);
      for (const side of [-1, 1]) { const wing = group(dragon, `dragon-wing-${side}`); wing.position.x = side * 0.9;
        const membrane = piece(roof, mat("#d29462"), wing, side * 2.2, 0.2, -0.4, 3, 4, 0.2); membrane.rotation.z = side * 0.2;
        const bone = block(wing, gold, side * 2, 1.1, -0.4, 4.6, 0.12, 0.15); bone.rotation.z = side * 0.45;
        animate(wing, t => { wing.rotation.z = side * (0.15 + Math.sin(t * 1.2) * 0.15); });
        piece(cone, gold, dragon, side * 0.5, 2.7, 0.4, 0.18, 0.9, 0.18); piece(sphere, lava, dragon, side * 0.45, 2.1, 1.38, 0.13);
      }
      animate(dragon, t => { dragon.position.y = 8 + Math.sin(t * 0.8) * 0.35; });
      for (let k = 0; k < 9; k++) { const ember = piece(crystal, lava, landmark, Math.sin(k * 5) * 2, 6 + k * 0.5, -1.5 + Math.cos(k * 4), 0.1); animate(ember, t => { ember.position.y = 6 + (t * 0.7 + k * 0.7) % 5; }); }
      aura(landmark, "#ffc17c", 0, 6, -1.5, 20, 0.65);
    } else {
      if (id === "code" || id === "blocks") {
        for (let k = 0; k < 4; k++) { const x = (k - 1.5) * 1.05; disc(landmark, dark, x, 0.25, 0, 0.5, 0.5); piece(crystal, mat(colors[k], true), landmark, x, 1.8 + k % 2 * 0.3, 0, 0.45, 1.3, 0.45); ring(landmark, gold, x, 0.6, 0, 0.5); }
        block(landmark, marble, 0, 0.3, 1.7, 3, 0.35, 0.7);
      } else if (id === "budget") {
        const store=group(landmark,'department-store-miniature');
        block(store,marble,0,1.65,-.1,2.6,3,1.3);
        for(const y of[.95,2.1])for(const x of[-.82,0,.82])block(store,blue,x,y,.57,.65,.78,.04);
        for(const y of[1.5,2.7])block(store,gold,0,y,.63,2.8,.12,.18);
        block(store,wood,0,.55,.65,.52,.8,.08);
        const awning=piece(roof,red,store,0,1.4,.8,1.4,.3,.65);awning.rotation.x=.15;
        block(store,green,0,3.35,-.1,2.85,.3,1.5);
        for(const x of[-.8,0,.8])block(store,gold,x,3.72,-.1,.4,.4,.15);
      } else if (id === "auction") {
        for (const side of [-1, 1]) { for (const x of [side * 1.6 - 0.5, side * 1.6 + 0.5]) disc(landmark, wood, x, 1, -0.7, 0.055, 2);
          block(landmark, side < 0 ? pink : blue, side * 1.6, 2.1, -0.7, 1.4, 0.15, 1.6); block(landmark, wood, side * 1.6, 0.65, -0.7, 1.3, 0.25, 1.2);
          for (let k = 0; k < 4; k++) piece(sphere, mat(colors[k]), landmark, side * 1.6 + (k % 2 - 0.5) * 0.4, 0.95, -0.7 + Math.floor(k / 2) * 0.3, 0.18); }
        if (id === "auction") { disc(landmark, marble, 0, 0.3, 1.1, 0.9, 0.5); const hammer = block(landmark, gold, 0, 2, 1, 1.6, 0.55, 0.5); hammer.rotation.z = -0.4; block(landmark, wood, 0, 1.1, 1, 0.15, 1.6, 0.15); }
        else for (let k = 0; k < 3; k++) { block(landmark, wood, (k - 1) * 0.9, 0.6, 1.2, 0.7, 0.8, 0.65); block(landmark, gold, (k - 1) * 0.9, 1.02, 1.2, 0.8, 0.12, 0.7); }
      } else if (id === "timing") {
        for (const y of [0.4, 4.7]) disc(landmark, gold, 0, y, 0, 1.55, 0.3);
        for (let k = 0; k < 4; k++) pillar(landmark, Math.cos(k * Math.PI / 2 + 0.8) * 1.3, Math.sin(k * Math.PI / 2 + 0.8) * 1.3, 4);
        const a = piece(cone, blue, landmark, 0, 3.55, 0, 1.05, 2, 1.05); a.rotation.z = Math.PI; piece(cone, gold, landmark, 0, 1.5, 0, 1.05, 2, 1.05); disc(landmark, glow, 0, 2.6, 0, 0.04, 1.6);
        const dial = ring(landmark, gold, 0, 2.6, -1.4, 2.1, false); animate(dial, t => { dial.rotation.y = t * 0.12; });
      } else if (id === "bomb") {
        disc(landmark, stone, 0, 0.4, 0, 2, 0.7); piece(smooth, dark, landmark, 0, 1.7, 0, 1.3); const fuse = ring(landmark, wood, 0.4, 3.2, 0, 0.5, false); fuse.rotation.z = 0.5;
        const spark = piece(crystal, mat("#ffb671", true), landmark, 0.85, 3.6, 0, 0.22); animate(spark, t => { spark.scale.setScalar(0.22 + Math.sin(t * 8) * 0.06); });
        for (const x of [-2, 2]) disc(landmark, stone, x, 1.1, -0.5, 0.45, 2.2);
      } else if (id === "chain") {
        for (let k = 0; k < 5; k++) { const link = ring(landmark, gold, (k - 2) * 0.8, 1.1, 0, 0.65, false); link.rotation.y = k % 2 * Math.PI / 2; } tree(landmark, -1.8, -1.2, 2); tree(landmark, 1.8, -1.2, 2.2);
      } else if (id === "categories") {
        for (let k = 0; k < 7; k++) { const a = k * Math.PI * 2 / 7; house(landmark, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.8 + k % 3 * 0.2, mat(colors[k % colors.length])); } disc(landmark, marble, 0, 0.8, 0, 0.5, 1.6); piece(crystal, glow, landmark, 0, 2, 0, 0.45);
      } else if (id === "geo") {
        disc(landmark, marble, 0, 0.3, 0, 2.1, 0.5); pillar(landmark, 0, 0, 1.2); const globe = group(landmark, "world-globe", true); globe.position.y = 2.7; piece(smooth, blue, globe, 0, 0, 0, 1.35);
        for (let k = 0; k < 7; k++) piece(sphere, green, globe, Math.cos(k * 3) * 1.15, Math.sin(k * 5) * 0.8, Math.sin(k * 3) * 1.15, 0.38, 0.5, 0.2);
        const orbit = ring(globe, gold, 0, 0, 0, 1.65, false); orbit.rotation.z = 0.35; animate(globe, t => { globe.rotation.y = t * 0.15; });
      } else if (id === "typer") {
        const track = disc(landmark, dark, 0, 0.25, 0, 2.7, 0.3); track.scale.z = 1.8;
        for (const r of [1.4, 1.8, 2.2]) { const lane = ring(landmark, glow, 0, 0.45, 0, r); lane.scale.z = r * 0.65; }
        for (const x of [-1, 1]) disc(landmark, gold, x, 1.2, 1.3, 0.06, 2.4); for (let k = 0; k < 6; k++) block(landmark, k % 2 ? marble : dark, (k - 2.5) * 0.34, 2.4, 1.3, 0.34, 0.4, 0.12);
      } else if (id === "herd") {
        house(landmark, -1.1, -0.7, 1.2); tree(landmark, 1.7, -1.2, 1.8); for (let k = 0; k < 5; k++) { const x = Math.sin(k * 4) * 1.8, z = 0.5 + Math.cos(k * 4); piece(sphere, marble, landmark, x, 0.7, z, 0.42, 0.3, 0.3); piece(sphere, dark, landmark, x + 0.3, 0.7, z, 0.18); }
      } else if (id === "spectrum") {
        const hall=group(landmark,'measuring-hall-miniature');
        block(hall,blue,0,2,-.65,3.1,3.6,.25);block(hall,gold,0,3.9,-.65,3.4,.2,.4);
        block(hall,marble,0,1,.1,3,.7,.6);for(let k=0;k<=10;k++)block(hall,dark,(k-5)*.25,1.18,.42,.035,k%2?.12:.25,.035);
        for(const [x,tint]of[[-1,red],[1,blue]] as const){block(hall,tint,x,1.65,.5,.12,1.2,.12);block(hall,tint,x,.45,.2,1,.3,.9);}
      } else if (id === "dice") {
        const salon=group(landmark,'dice-salon-miniature');
        disc(salon,wood,0,.22,0,1.65,.2);block(salon,wood,0,1.5,-1.25,2.5,2.5,.16);
        for(const x of[-.85,.85]){block(salon,gold,x,1.8,-1.14,.45,.75,.08);piece(sphere,glow,salon,x,2.4,-1,.12);}
        disc(salon,wood,0,.65,0,.2,.8);disc(salon,green,0,1.1,0,.88,.15);
        for(let k=0;k<6;k++){const a=k*Math.PI/3,x=Math.sin(a)*1.28,z=Math.cos(a)*1.05;disc(salon,red,x,.62,z,.24,.18);disc(salon,wood,x,.35,z,.08,.5);}
        for(let k=0;k<3;k++){const die=block(salon,marble,(k-1)*.35,1.32,0,.24,.24,.24);die.rotation.y=k*.4;piece(sphere,dark,salon,(k-1)*.35,1.45,0,.035);}
      } else if (id === "wiki") {
        for (const x of [-1.8, 1.8]) { block(landmark, wood, x, 1.4, -0.6, 0.7, 2.7, 2); for (let k = 0; k < 5; k++) block(landmark, mat(colors[k]), x, 0.5 + k * 0.45, -0.6, 0.8, 0.28, 1.7); }
        for (const side of [-1, 1]) { const page = block(landmark, marble, side * 0.7, 1.6, 0.6, 1.4, 0.15, 1.8); page.rotation.z = side * 0.25; } pillar(landmark, 0, 1, 0.9); piece(crystal, glow, landmark, 0, 2.9, 0.6, 0.25);
      } else if (id === "picture") {
        block(landmark, gold, 0, 2, 0, 4.3, 3.1, 0.3); for (let x = 0; x < 7; x++) for (let y = 0; y < 5; y++) block(landmark, mat(colors[(x * 3 + y * 2) % colors.length]), (x - 3) * 0.5, 0.9 + y * 0.5, 0.19, 0.46, 0.46, 0.1); for (const x of [-1.4, 1.4]) {block(landmark, marble, x, 0.4, 0, 0.3, 0.8, 0.5);disc(landmark,dark,x,2,-.35,.055,4);block(landmark,dark,x,4,-.35,.55,.35,.5);block(landmark,glow,x,4,-.08,.4,.2,.04);}block(landmark,dark,0,4.2,-.35,3.4,.12,.15);
      } else if (id === "blackjack") {
        disc(landmark, dark, 0, 0.4, 0, 2.4, 0.6); disc(landmark, green, 0, 0.8, 0, 2.1, 0.15); for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; disc(landmark, gold, Math.cos(a) * 1.5, 1.05, Math.sin(a) * 1.5, 0.25, 0.15); }
        for (const x of [-1, 1]) { const card = block(landmark, marble, x * 0.55, 2.3, -0.3, 1, 1.8, 0.13); card.rotation.z = x * 0.23; piece(sphere, x < 0 ? red : dark, landmark, x * 0.55, 2.3, -0.2, 0.22); }
        for (const x of [-2, 2]) pillar(landmark, x, -1.5, 3.8); piece(smooth, gold, landmark, 0, 4.8, -1.5, 1.7, 0.8, 0.9);
      } else if (id === "cards") {
        const home=group(landmark,'card-treehouse-miniature');disc(home,wood,0,1.4,0,.38,2.5);disc(home,wood,0,1.55,0,1.65,.2);
        block(home,wood,0,2.35,-1,2.3,1.6,.15);piece(roof,green,home,0,3.15,-.5,1.6,.8,1.4);
        for(const side of[-1,1])piece(sphere,green,home,side*1.1,3.2,-.8,.8,.65,.8);
        disc(home,green,0,2.05,.25,.75,.12);disc(home,wood,0,1.85,.25,.12,.5);
        for(let k=0;k<4;k++){const a=k*Math.PI/2,x=Math.sin(a)*1.05,z=.25+Math.cos(a)*.85;disc(home,mat(colors[k]),x,1.8,z,.2,.18);banner(home,x,z,colors[k],2.5);}
      } else if (id === "color") {
        const lab=group(landmark,'color-laboratory-miniature');block(lab,marble,0,1,0,2.9,.25,1.2);
        for(const [k,tint]of[red,green,blue].entries()){const x=(k-1)*.9;disc(lab,tint,x,1.8,-.2,.26,1.4);disc(lab,dark,x,2.55,-.2,.3,.15);block(lab,dark,x,.8,0,.15,.65,.9);block(lab,tint,x,1.2,.55,.55,.15,.5);}
        for(const x of[-1.3,1.3])block(lab,dark,x,.55,0,.15,.8,.9);
      } else if (id === "size") {
        for (let k = 0; k < 4; k++) house(landmark, -1.8 + k * 0.7, 1.5, 0.4); const giant = group(landmark, "giant-monument"); giant.position.x = 0.5;
        for (const side of [-1, 1]) { disc(giant, marble, side * 0.55, 1.3, 0, 0.3, 2.6); block(giant, marble, side * 1.2, 3.4, 0, 1.2, 0.45, 0.45); } block(giant, marble, 0, 3, 0, 1.5, 1.7, 0.8); piece(sphere, marble, giant, 0, 4.5, 0, 0.6);
      } else ship(landmark, 0, 0, 0.9);
      for (let k = 0; k < 3; k++) { const a = k * 2.4 + index; piece(sphere, stone, root, Math.cos(a) * 2.7, 0.3, Math.sin(a) * 2.7, 0.3, 0.2, 0.25); }
    }
    landmark.scale.setScalar(journeyLandmarkScale(node));
    const promenade=group(root,'crew-island-promenade'),walkHeight=journeyWalkHeight(node);
    piece(plazaTop,mat(`#${new T.Color(region.path[0]).lerp(landColor,.4).getHexString()}`),promenade,0,walkHeight+.005,0,r,1,r);
    plazaBorders.forEach(g=>piece(g,mat(region.path[1]),promenade,0,walkHeight+.01,0,r,1,r));
    for(let k=0;k<24;k++){const a=k*Math.PI/12,rr=r*.645,tile=block(promenade,mat(region.path[1]),Math.cos(a)*rr,walkHeight+.012,Math.sin(a)*rr,.025,.012,r*.3);tile.rotation.y=Math.PI/2-a;}
    Object.assign(root.userData,{walkHeight,landmarkScale:landmark.scale.x});
    if (node.boss && trophies.some(t => t.index === index && t.victory)) { const trophy = group(root, "boss-trophy"); trophy.position.set(0, walkHeight+.3, r * 0.42); ring(trophy, glow, 0, .4, 0, .45, false); piece(crystal, gold, trophy, 0, .4, 0, .22, .35, .22); }
    for (let k = 0; k < (node.boss ? 5 : 2); k++) { const a = k * 2.3999 + index, shard = piece(crystal, cliff, root, Math.cos(a) * (r + 1.7), -2 - k % 3, Math.sin(a) * (r + 1.7), node.boss ? 0.9 : 0.45, node.boss ? 1.6 : 0.7, node.boss ? 0.9 : 0.45); shard.rotation.z = a; }
  }
  const route = group(scene, "constellation-route");
  const plazaModels=createAdventureModels(),plazaNode=nodes[current],plazaProps=group(scene,'current-crew-promenade-models',true),plazaJobs:Promise<unknown>[]=[];
  if(plazaNode){
    const r=plazaNode.radius,h=journeyWalkHeight(plazaNode);plazaProps.position.set(...plazaNode.position);plazaProps.userData.islandIndex=current;
    const ports=[nodes[current-1],nodes[current+1]].filter(Boolean).map(n=>Math.atan2(n.position[2]-plazaNode.position[2],n.position[0]-plazaNode.position[0]));
    let placed=0;for(let k=0;k<12&&placed<4;k++){const a=.3+k*Math.PI/6;if(ports.some(p=>Math.abs(Math.atan2(Math.sin(a-p),Math.cos(a-p)))<.45))continue;
      const x=Math.cos(a)*r*.98,z=Math.sin(a)*r*.98;
      disc(plazaProps,mat(plazaNode.region.path[1]),x,h-.25,z,.2,.5);
      const support=block(plazaProps,wood,Math.cos(a)*r*.88,h-.12,Math.sin(a)*r*.88,.3,.18,r*.28);support.rotation.y=Math.PI/2-a;
      if(typeof window!=='undefined')plazaJobs.push(plazaModels.place({id:placed%2?'furniture/lampRoundTable':'furniture/pottedPlant',parent:plazaProps,position:[x,h,z],height:placed%2?.3:.34,name:`crew-garden-model-${placed}`}));
      placed++;
    }
  }
  const legKinds=nodes.slice(1).map((node,i)=>journeyTransitKind(nodes[i],node));
  const vessel=createJourneyVessel(T,(current>0&&legKinds[current-1]!=='bridge')||(current<legKinds.length&&legKinds[current]!=='bridge'));scene.add(vessel.root,vessel.gangway);
  const routePoint=(from:number,to:number,f:number)=>new T.Vector3(...journeyBridgePoint(nodes[from],nodes[to],f));
  for (let i = 1; i < nodes.length; i++) { const distance=new T.Vector3(...nodes[i-1].position).distanceTo(new T.Vector3(...nodes[i].position));
    if(nodes[i].chapter!==nodes[i-1].chapter){
      const transit=journeyTransitFrame(nodes[i-1],nodes[i],1),gate=group(route,`realm-gateway-${nodes[i].chapter}`);
      gate.position.fromArray(transit.targetPort);gate.rotation.y=Math.atan2(transit.direction[0],transit.direction[1]);
      for(const side of[-1,1]){pillar(gate,side*1.1,0,2.2);banner(gate,side*1.5,0,nodes[i].theme.color,2.1);}
      block(gate,marble,0,3,0,2.9,.4,.5);piece(crystal,glow,gate,0,3.6,0,.24,.4,.24);
    }
    if(legKinds[i-1]!=='bridge'){
      const frame=journeyTransitFrame(nodes[i-1],nodes[i],0);
      for(const [side,position]of [['departure',frame.sourcePort],['arrival',frame.targetPort]] as const){const dock=group(route,`${side}-vessel-dock-${i}`);dock.position.fromArray(position);dock.rotation.y=Math.atan2(frame.direction[0],frame.direction[1]);block(dock,wood,0,-.105,0,2.8,.12,1.6);for(const x of[-1.3,1.3]){disc(dock,stone,x,.16,0,.1,.4);ring(dock,gold,x,.4,0,.15);}}
      const marks=Math.min(32,Math.max(8,Math.ceil(distance/6)));for(let k=1;k<marks;k++){const f=journeyTransitFrame(nodes[i-1],nodes[i],.25+.57*k/marks),p=f.position;piece(sphere,i<=completed?glow:mat('#a8c4ca'),route,p[0],p[1]-.9,p[2],.09);}
      continue;
    }
    const bridgeLength=routePoint(i-1,i,0).distanceTo(routePoint(i-1,i,1)),boards=Math.max(16,Math.ceil(bridgeLength/.48));
    for(let k=0;k<=boards;k++){
      const f=k/boards,p=routePoint(i-1,i,f),direction=f<1?routePoint(i-1,i,f+.005).sub(p).normalize():p.clone().sub(routePoint(i-1,i,.995)).normalize();
      const plank=block(route,mat(nodes[i].region.path[k%3?0:1]),p.x,p.y-0.08,p.z,2.2,0.09,bridgeLength/boards*0.92);plank.rotation.y=Math.atan2(direction.x,direction.z);
      if(k%8===0)for(const side of[-1,1]){const x=p.x+direction.z*side*1.15,z=p.z-direction.x*side*1.15;disc(route,wood,x,p.y+0.35,z,0.055,0.9);piece(sphere,i<=completed?glow:mat("#d0d6bf"),route,x,p.y+0.82,z,0.1);}
    }
  }
  const final = nodes.at(-1), penultimate=nodes.at(-2),olympus = group(scene, "olympus-destination");
  const ascent=final&&penultimate?new T.Vector3(final.position[0]-penultimate.position[0],0,final.position[2]-penultimate.position[2]).normalize():new T.Vector3(0,0,-1);
  olympus.position.set((final?.position[0]??0)+ascent.x*42,(final?.position[1]??0)+9,(final?.position[2]??0)+ascent.z*42);
  piece(cone, stone, olympus, 0, 1, 0, 11, 13, 9); piece(cone, marble, olympus, 0, 6, 0, 4.2, 6, 3.6); disc(olympus, marble, 0, 8.5, 0, 5, 0.8);
  const temple = group(olympus, "olympus-temple"); temple.position.y = 8.7; for (const x of [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5]) pillar(temple, x, 0, 4.8); piece(roof, gold, temple, 0, 5.6, 0, 4.6, 3, 3.8);
  const sunRing = ring(olympus, glow, 0, 12, -4, 7.5, false); sunRing.name = "olympus-halo"; sunRing.userData.dynamic = true; aura(olympus, "#ffdf9f", 0, 12, -5, 37, 0.55);
  if (final) for (let k = 0; k < 24; k++) { const from = new T.Vector3(...final.position), p = from.lerp(olympus.position, k / 24); piece(sphere, glow, route, p.x, p.y + 0.7, p.z, 0.1); }
  const cloudMat = new T.SpriteMaterial({ color: 0x9fb7d2, map: lightTexture, transparent: true, opacity: 0.18, depthWrite: false }); materials.add(cloudMat); const clouds = group(scene, "cloud-sea");
  for (let k = 0; k < Math.min(100, 30 + nodes.length * 2); k++) {
    const cloud = new T.Sprite(cloudMat); cloud.position.set(bounds.x + Math.sin(k * 13.7) * (bounds.width / 2 + 25), -8 - k % 4 * 2, bounds.z + Math.cos(k * 7.6) * (bounds.depth / 2 + 20));
    cloud.scale.set(18 + k % 5 * 4, 4 + k % 3, 1); clouds.add(cloud);
  }
  // Keep clouds dynamic so their shared parent can drift after batching.
  clouds.userData.dynamic = true;
  const starGeo = geo(new T.BufferGeometry()), positions: number[] = []; for (let k = 0; k < 400; k++) positions.push(bounds.x + Math.sin(k * 8.7) * (bounds.width + 70), 14 + k % 40, bounds.z + Math.cos(k * 3.8) * (bounds.depth + 70)); starGeo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  const starMat = new T.PointsMaterial({ size: 0.11, color: 0xffe4ac, transparent: true, opacity: 0.75 }); materials.add(starMat); scene.add(new T.Points(starGeo, starMat));
  const highlight = group(scene, "selected-island-beacon", true), focusRing = ring(highlight, glow, 0, 0.55, 0, 1), focusAura = aura(highlight, "#ffe1a3", 0, 0.6, 0, 10, 0.18);focusRing.visible=false;
  function setSelected(index: number) { const node = nodes[Math.max(0, Math.min(nodes.length - 1, index))]; if (!node) return; highlight.position.set(...node.position); focusRing.scale.setScalar(node.radius * 1.08); focusAura.scale.set(node.radius * 3, node.radius * 3, 1); } setSelected(selected);
  scene.updateMatrixWorld(true);
  const batches = new Map<string, { geometry: Three.BufferGeometry; material: Three.Material; meshes: Three.Mesh[]; indices: number[];colors:Three.Color[] }>(), originals: Three.Mesh[] = [];
  scene.traverse(object => {
    if (!(object instanceof T.Mesh) || Array.isArray(object.material)) return;
    let parent: Three.Object3D | null = object, index = -1, dynamic = false;
    while (parent) { if (parent.userData.dynamic) dynamic = true; if (typeof parent.userData.islandIndex === "number") index = parent.userData.islandIndex; parent = parent.parent; }
    if (dynamic) { if (index >= 0) { object.userData.islandIndex = index; pickables.push(object); } return; }
    // These opaque palette materials differ only in their diffuse tint. Keep
    // that exact linear color per instance, instead of one draw per region hue.
    // Terrain vertex colors and emissive surfaces retain their own materials.
    const tint=object.material instanceof T.MeshStandardMaterial&&!object.material.vertexColors&&object.material.emissive.getHex()===0;
    const material=tint?mat('#ffffff',false,(object.material as Three.MeshStandardMaterial).metalness>.5):object.material;
    const key = `${object.geometry.uuid}:${material.uuid}`;
    if (!batches.has(key)) batches.set(key, { geometry: object.geometry, material, meshes: [], indices: [],colors:[] });
    const batch = batches.get(key)!; batch.meshes.push(object); batch.indices.push(index);batch.colors.push(tint?(object.material as Three.MeshStandardMaterial).color.clone():new T.Color('#ffffff')); originals.push(object);
  });
  const instances: Three.InstancedMesh[] = [];
  for (const batch of batches.values()) { const mesh = new T.InstancedMesh(batch.geometry, batch.material, batch.meshes.length); batch.meshes.forEach((object, i) => {mesh.setMatrixAt(i, object.matrixWorld);mesh.setColorAt(i,batch.colors[i]);});mesh.instanceColor!.needsUpdate=true;mesh.userData.islandIndices = batch.indices; mesh.name = "archipelago-static-batch"; mesh.computeBoundingSphere(); scene.add(mesh); instances.push(mesh); if (batch.indices.some(i => i >= 0)) pickables.push(mesh); }
  originals.forEach(mesh => mesh.removeFromParent());
  const characters=crew.map((player,k)=>{
    const actor=createMapCharacter(T,player);scene.add(actor.root);const p=mapSpawn(k,crew.length),node=nodes[current];
    if(node)actor.root.position.set(node.position[0]+p.x*node.radius,node.position[1]+journeyWalkHeight(node)+.05,node.position[2]+p.z*node.radius);
    return {...actor,id:player.id??`crew-${k}`,slot:k};
  });
  const transitAt=(travel:CrewTravel,now:number)=>{const from=nodes[travel.from],to=nodes[travel.to];return from&&to&&travel.duration>0&&now>=travel.at&&now<travel.at+travel.duration?journeyTransitFrame(from,to,(now-travel.at)/travel.duration):null;};
  return { scene, nodes, bounds, roots, pickables, olympus: olympus.position.clone(), setSelected,
    characters, routePoint,transitAt,transportReady:vessel.ready,plazaReady:Promise.allSettled(plazaJobs),
    update(t: number, reduced: boolean, state?:{now:number;moves?:Record<string,MapMove>;travel?:CrewTravel;emotes?:{player:string;emote:number;at:number}[]}) {
      animated.forEach(entry => entry.update(reduced ? 0 : t)); clouds.position.x = reduced ? 0 : Math.sin(t * 0.03) * 1.2; focusRing.rotation.z = reduced ? 0 : t * 0.08; focusAura.material.opacity = reduced ? 0.16 : 0.15 + Math.sin(t * 1.3) * 0.025;
      scene.userData.plaza={...plazaModels.stats(),walkHeight:plazaNode?journeyWalkHeight(plazaNode):0};
      const sharedTravel=state?.travel,sharedNow=state?.now??0,transit=sharedTravel&&sharedTravel.to===current?transitAt(sharedTravel,sharedNow):null;
      vessel.update(reduced?null:transit,sharedTravel?(sharedNow-sharedTravel.at)/1000:0);scene.userData.transit={kind:transit?.kind??'none',phase:reduced&&transit?'still':transit?.kind==='bridge'?(transit.f<.2?'gather':transit.f<.87?'travelling':'landing'):transit?.phase??'idle',visible:vessel.root.visible,position:transit?.position??null,...vessel.stats()};
      for(const actor of characters){
        const node=nodes[current];if(!node)continue;const now=state?.now??0,move=state?.moves?.[actor.id],travel=state?.travel;
        const activeTravel=!!travel&&travel.to===current&&now>=travel.at&&now<travel.at+travel.duration&&nodes[travel.from];
        const local=move?.index===current?sampleMapMove(move,reduced?move.at+move.duration:now):mapSpawn(actor.slot,crew.length);
        if(activeTravel&&!reduced){
          if(transit&&transit.kind!=='bridge')actor.root.position.fromArray(transitPassenger(nodes[travel!.from],node,transit,travel!.starts?.[actor.id]??mapSpawn(actor.slot,crew.length),local,actor.slot,crew.length));
          else{
          actor.root.position.fromArray(journeyBridgePassenger(nodes[travel!.from],node,(now-travel!.at)/travel!.duration,travel!.starts?.[actor.id]??mapSpawn(actor.slot,crew.length),local,actor.slot));
          }
        }
        else actor.root.position.set(node.position[0]+local.x*node.radius,node.position[1]+journeyWalkHeight(node)+.05,node.position[2]+local.z*node.radius);
        const walking=!reduced&&!!activeTravel&&(!transit||transit.kind==='bridge'||transit.phase!=='travelling')||!!move&&move.index===current&&now<move.at+move.duration;
        const emote=state?.emotes?.findLast(e=>e.player===actor.id&&now-e.at>=0&&now-e.at<4500);
        actor.root.userData.walking=walking;actor.root.userData.emote=emote?.emote??null;
        actor.update(t,walking,emote?.emote??null,reduced);
      }
    },
    dispose() { vessel.dispose();plazaModels.dispose();characters.forEach(c=>c.dispose());geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); instances.forEach(m => m.dispose()); lightTexture.dispose();sky.dispose(); },
  };
}
