"use client";
import {startVisibleFrameLoop} from "@/lib/visible-frame-loop";
import {bossStation} from "@/lib/boss-stations";
import {colossusRuneOrigin} from '@/lib/colossus-runes';
import {krakenShot,krakenTarget} from '@/lib/kraken-salvo';
import {dragonShot} from '@/lib/dragon-salvo';
import {dragonPortrait,dragonActionPose,dragonTrackedStation} from '@/lib/dragon-camera';
import {colossusPortrait,colossusActionPose,colossusTrackedStation} from '@/lib/colossus-camera';
import {krakenPortrait,krakenActionPose,krakenTrackedStation} from '@/lib/kraken-camera';
import type {createKrakenSalvo} from './kraken-salvo';
import type {createDragonSalvo} from './dragon-salvo';
import type {createBossVenue} from "./boss-venue";
import {loadBossModules,loadSkyModule} from './scene-modules';


import { useEffect, useRef, useState } from "react";
import type * as Three from "three";
import type { Appearance } from "@/lib/appearance";
import { Avatar } from "./art";
import type { BossKind } from "./boss-models";
import type { RiggedBoss } from "./boss-rig";
import { emoteMotions } from "@/lib/emotes";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import {
  BossFrameClock,
  BossResolution,
  BossGpuTimer,
} from "@/lib/boss-performance";

export interface BossSceneProps {
  kind: BossKind;
  phase: number;
  stage: string;
  startedAt: number;
  now: number;
  reveal?: {
    outcomes?: Array<{
      id: string;
      score?: number;
      damage?: number;
      accuracy?: number;
      submitted?: boolean;
    }>;
    totalDamage?: number;
    phaseBroken?: boolean;
    victory?: boolean;
    [key: string]: unknown;
  } | null;
  players: Array<{
    id: string;
    name: string;
    color: string;
    avatar: number;
    look?: Appearance;
  }>;
  me: string;
  emotes?: Array<{ id: string; player: string; emote: number; at: number }>;
  submitted: Record<string, boolean>;
  mineDice?: import('@/lib/colossus-runes').RuneHand;
  mineDragon?:{risk:import('@/lib/dragon-altar').DragonRisk;guess?:number;sealed?:boolean};
  product?: {id:string;name:string;image:string};
  active?:boolean;
  stationFocus?:boolean;
  crewOverview?:boolean;
  onInteraction?:(action:string)=>void;
  reducedMotion?: boolean;
  intense?: boolean;
}

/** Three independent cinematics share only the rendering and resource lifecycle. */
export function BossScene(props: BossSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const avatarSource = useRef<HTMLDivElement>(null);
  const latest = useRef({ ...props, receivedAt: 0 });
  latest.current = {
    ...props,
    receivedAt: typeof performance === "undefined" ? 0 : performance.now(),
  };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const rosterKey = props.players
    .map(
      (p) =>
        `${p.id}:${p.name}:${p.color}:${p.avatar}:${JSON.stringify(p.look)}`,
    )
    .join("|");

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let stopFrames = () => {};
    let renderer: Three.WebGLRenderer | undefined;
    let scene: Three.Scene | undefined;
    let rig: RiggedBoss | undefined;
    let venue:ReturnType<typeof createBossVenue>|undefined;
    let krakenSalvo:ReturnType<typeof createKrakenSalvo>|undefined;
    let dragonSalvo:ReturnType<typeof createDragonSalvo>|undefined;
    let clearVenueEvents=()=>{};
    let environment: Three.WebGLRenderTarget | undefined;
    let composer: EffectComposer | undefined;
    let gpuTimer: BossGpuTimer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let loseContext: ((event:Event) => void) | undefined;
    const textures = new Set<Three.Texture>();
    const images = new Set<HTMLImageElement>();
    setReady(false);
    setFailed(false);

    loadBossModules()
      .then(
        ([
          THREE,
          { createBossArena },
          { loadBossRig },
          { createBossSpectacle },
          { EffectComposer },
          { RenderPass },
          { BossBloom },
          { OutputPass },
          { batchArena },
          {createBossVenue},
          {createKrakenSalvo},
          {createDragonSalvo},
        ]) => {
          if (cancelled) return;
          try {
            renderer = new THREE.WebGLRenderer({
              antialias: false,
              alpha: false,
              powerPreference: "high-performance",
            });
          } catch {
            fail();
            return;
          }
          const r = renderer;
          r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
          r.outputColorSpace = THREE.SRGBColorSpace;
          r.toneMapping = THREE.ACESFilmicToneMapping;
          r.toneMappingExposure = props.kind === "kraken" ? 1.15 : 1.1;
          r.shadowMap.enabled = true;
          r.shadowMap.type = THREE.PCFShadowMap;
          r.shadowMap.autoUpdate = false;
          r.info.autoReset = false;
          gpuTimer = new BossGpuTimer(r.getContext() as WebGL2RenderingContext);
          r.domElement.className = "boss-scene-canvas";
          r.domElement.style.cssText =
            "width:100%;height:100%;display:block;position:absolute;inset:0";
          r.domElement.setAttribute("aria-hidden", "true");
          r.domElement.dataset.boss = props.kind;
          r.domElement.dataset.engine = "three";
          r.domElement.style.opacity = "0";
          loseContext = (event) => { event.preventDefault();fail(); };
          r.domElement.addEventListener("webglcontextlost", loseContext);
          host.insertBefore(r.domElement, host.firstChild);
          scene = new THREE.Scene();
          const s = scene;
          const arena = createBossArena(
            THREE,
            props.kind,
            props.players.length,
          );
          s.add(arena.root);
          batchArena(arena.root);
          venue=createBossVenue(s,arena,props.kind,props.players,props.me,props.product);
          if(props.kind==='kraken'&&arena.cannons)krakenSalvo=createKrakenSalvo(s,arena.cannons,props.players.map(p=>p.id),arena.target);
          if(props.kind==='dragon')dragonSalvo=createDragonSalvo(s,props.players.map(p=>p.id),props.players.map(p=>p.color),arena.target);
          const modelReady = loadBossRig(THREE, props.kind)
            .then((loaded) => {
              if (cancelled) {
                loaded.dispose();
                return;
              }
              rig = loaded;
              arena.boss.add(loaded.root);
              r.domElement.dataset.rigged = "true";
              r.domElement.dataset.bones = String(loaded.bones);
              r.domElement.dataset.animations = loaded.animations.join(",");
            })
            .catch((error) => {
              if (!cancelled) {
                console.warn("Boss model could not load", error);
                fail();
              }
            });
          // A photographed, overcast environment gives skin, stone and wet surfaces natural reflections.
          const skyReady = loadSkyModule()
            .then(async ({ HDRLoader }) => {
              if (cancelled) return;
              const hdr = await new HDRLoader().loadAsync(
                "/boss-environment/night-sky.hdr",
              );
              if (cancelled) {
                hdr.dispose();
                return;
              }
              const pmrem = new THREE.PMREMGenerator(r);
              environment = pmrem.fromEquirectangular(hdr);
              s.environment = environment.texture;
              s.environmentIntensity = props.kind === "kraken" ? 0.8 : 0.38;
              hdr.dispose();
              pmrem.dispose();
            })
            .catch(() => {
              /* Direct arena lighting also works if the sky is unavailable. */
            });
          s.background = new THREE.Color(arena.palette.background);
          s.fog = new THREE.FogExp2(
            arena.palette.fog,
            props.kind === "kraken" ? 0.018 : 0.025,
          );
          const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 120);
          const ray=new THREE.Raycaster(),pointerPoint=new THREE.Vector2();let pressed:{key:string;x:number;y:number}|null=null;
          function hit(e:PointerEvent){
            const b=r.domElement.getBoundingClientRect(),targets=(venue?.pickables??[]).filter(p=>!p.userData.pickDisabled&&p.visible);
            pointerPoint.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointerPoint,camera);
            const direct=ray.intersectObjects(targets,false)[0]?.object;if(direct)return direct;
            // Small dice and portrait cannons retain a 44px touch target.
            let nearest:Three.Object3D|undefined,best=22;
            for(const target of targets){const key=String(target.userData.pick),cannon=key==='cannon'&&e.pointerType==='touch',altar=latest.current.stationFocus&&e.pointerType==='touch'&&(key.startsWith('risk:')||key==='estimate');if(!cannon&&!altar&&!(latest.current.stationFocus&&key.startsWith('hold')))continue;let anchor:Three.Object3D|null=target;while(anchor&&!anchor.userData.authoredCannon)anchor=anchor.parent;const p=cannon&&anchor?anchor.localToWorld(new THREE.Vector3(0,.455,-.72)):target.getWorldPosition(new THREE.Vector3());p.project(camera);if(p.z< -1||p.z>1)continue;const distance=Math.hypot(b.left+(p.x+1)*b.width/2-e.clientX,b.top+(1-p.y)*b.height/2-e.clientY);if(distance<best){best=distance;nearest=target;}}
            return nearest;
          }
          const down=(e:PointerEvent)=>{if(e.button!==0||r.domElement.style.opacity!=="1"||!latest.current.active)return;const object=hit(e);if(!object)return;e.preventDefault();r.domElement.setPointerCapture(e.pointerId);pressed={key:object.userData.pick,x:e.clientX,y:e.clientY};if(pressed.key==='cannon')latest.current.onInteraction?.('cannonStart');};
          const up=(e:PointerEvent)=>{if(!pressed)return;const press=pressed;pressed=null;if(r.domElement.hasPointerCapture(e.pointerId))r.domElement.releasePointerCapture(e.pointerId);if(press.key==='cannon')latest.current.onInteraction?.('cannonFire');else if(e.type!=='pointercancel'&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<6)latest.current.onInteraction?.(press.key);};
          const move=(e:PointerEvent)=>{if(!pressed)r.domElement.style.cursor=latest.current.active&&hit(e)?'pointer':'default';};
          r.domElement.style.touchAction='none';r.domElement.addEventListener('pointerdown',down);r.domElement.addEventListener('pointerup',up);r.domElement.addEventListener('pointercancel',up);r.domElement.addEventListener('pointermove',move);
          clearVenueEvents=()=>{r.domElement.removeEventListener('pointerdown',down);r.domElement.removeEventListener('pointerup',up);r.domElement.removeEventListener('pointercancel',up);r.domElement.removeEventListener('pointermove',move);};
          composer = new EffectComposer(r);
          composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
          composer.addPass(new RenderPass(s, camera));
          const bloom = new BossBloom();
          composer.addPass(bloom);
          composer.addPass(new OutputPass());
          r.domElement.dataset.effects =
            "bloom,runes,shockwaves,light-shafts,fireworks,camera-director";
          const hemispheric = new THREE.HemisphereLight(
            props.kind === "kraken" ? 0xafd9fa : 0xd9eaff,
            arena.palette.background,
            1.1,
          );
          s.add(hemispheric);
          const keyLight = new THREE.DirectionalLight(arena.palette.key, 2.8);
          keyLight.position.set(-4, 10, 7);
          keyLight.castShadow = true;
          keyLight.shadow.mapSize.set(1024, 1024);
          keyLight.shadow.camera.left = -9;
          keyLight.shadow.camera.right = 9;
          keyLight.shadow.camera.top = 9;
          keyLight.shadow.camera.bottom = -5;
          keyLight.shadow.normalBias = 0.04;
          keyLight.shadow.bias = -0.0003;
          keyLight.shadow.radius = 2;
          s.add(keyLight);
          const rim = new THREE.DirectionalLight(arena.palette.glow, 3.2);
          rim.position.set(4, 6, -8);
          s.add(rim);
          const fill = new THREE.PointLight(arena.palette.glow, 20, 22, 2);
          fill.position.set(0, 2.5, 2.3);
          s.add(fill);
          const impactLight = new THREE.PointLight(
            props.kind === "kraken" ? 0x8bf6ff : 0xffd689,
            0,
            16,
            2,
          );
          impactLight.position
            .copy(arena.target)
            .add(new THREE.Vector3(0, 0, 2));
          s.add(impactLight);

          const glowCanvas = document.createElement("canvas");
          glowCanvas.width = glowCanvas.height = 64;
          const gc = glowCanvas.getContext("2d")!;
          const gradient = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(0.2, "rgba(255,255,255,.7)");
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          gc.fillStyle = gradient;
          gc.fillRect(0, 0, 64, 64);
          const glowTexture = new THREE.CanvasTexture(glowCanvas);
          textures.add(glowTexture);
          const spectacle = createBossSpectacle(
            THREE,
            props.kind,
            arena.target,
            glowTexture,
          );
          s.add(spectacle.root);
          const firePositions = new Float32Array(75 * 3);
          const fireGeometry = new THREE.BufferGeometry();
          fireGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(firePositions, 3).setUsage(
              THREE.DynamicDrawUsage,
            ),
          );
          const fireMaterial = new THREE.PointsMaterial({
            color: 0xff871f,
            size: 0.48,
            map: glowTexture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const dragonFire = new THREE.Points(fireGeometry, fireMaterial);
          dragonFire.frustumCulled = false;
          s.add(dragonFire);
          const fireLight = new THREE.PointLight(0xff7c24, 0, 12, 2);
          s.add(fireLight);
          const mouthPosition = new THREE.Vector3();

          // Dust, sea spray, or volcanic embers, all in one draw call.
          const particleCount = props.kind === "kraken" ? 280 : 160;
          const ambiencePositions = new Float32Array(particleCount * 3);
          const ambienceGeo = new THREE.BufferGeometry();
          ambienceGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(ambiencePositions, 3).setUsage(
              THREE.DynamicDrawUsage,
            ),
          );
          const ambienceMat = new THREE.PointsMaterial({
            color:
              props.kind === "kraken"
                ? 0xa8d7f2
                : props.kind === "dragon"
                  ? 0xffb748
                  : 0x85dccc,
            size: props.kind === "kraken" ? 0.055 : 0.065,
            map: glowTexture,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          const ambience = new THREE.Points(ambienceGeo, ambienceMat);
          ambience.frustumCulled = false;
          s.add(ambience);

          // Player figures use their actual assembled character, including accessories.
          const characters = props.players.map((player, i) => {
            const group = new THREE.Group();
            const spacing = Math.min(
              1.72,
              10.8 / Math.max(1, props.players.length - 1),
            );
            const station=bossStation(i,props.players.length,props.kind==="kraken");
            const baseX=station.x,baseZ=station.z;
            group.position.set(baseX, arena.playerHeight + 0.56, baseZ);
            const color = new THREE.Color(player.color || "#bcff5c");
            const baseMaterial = new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: 0.4,
              depthWrite: false,
            });
            const base = new THREE.Mesh(
              new THREE.RingGeometry(0.32, 0.4, 24),
              baseMaterial,
            );
            base.rotation.x = -Math.PI / 2;
            base.position.y = arena.playerHeight + 0.045;
            base.position.x = baseX;
            base.position.z = baseZ;
            (arena.crewParent??s).add(base);
            // A sprite is visible immediately, then replaced by the full SVG wardrobe.
            const faceCanvas = document.createElement("canvas");
            faceCanvas.width = faceCanvas.height = 128;
            const face = faceCanvas.getContext("2d")!;
            face.fillStyle = player.color || "#bcff5c";
            face.beginPath();
            face.roundRect(18, 12, 92, 100, 30);
            face.fill();
            face.fillStyle = "#152035";
            face.beginPath();
            face.arc(46, 54, 6, 0, Math.PI * 2);
            face.arc(82, 54, 6, 0, Math.PI * 2);
            face.fill();
            face.lineWidth = 5;
            face.strokeStyle = "#152035";
            face.beginPath();
            face.arc(64, 67, 16, 0.15, Math.PI - 0.15);
            face.stroke();
            const texture = new THREE.CanvasTexture(faceCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            textures.add(texture);
            const spriteMat = new THREE.SpriteMaterial({
              map: texture,
              transparent: true,
              depthWrite: false,
            });
            const sprite = new THREE.Sprite(spriteMat);
            const ownScale = (player.id === props.me ? 1.1 : 1)*Math.min(1,spacing/1.13);
            sprite.scale.set(ownScale, ownScale, 1);
            group.add(sprite);
            let textureRequest = 0;
            const updateFace = () => {
              const request = ++textureRequest;
              const svg = avatarSource.current?.querySelectorAll("svg")[i];
              if (!svg) return;
              const clone = svg.cloneNode(true) as SVGElement;
              clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
              clone.setAttribute("width", "256");
              clone.setAttribute("height", "256");
              const img = new Image();
              images.add(img);
              img.onload = () => {
                images.delete(img);
                if (cancelled || request !== textureRequest) return;
                const tex = new THREE.Texture(img);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                textures.add(tex);
                const old = spriteMat.map;
                spriteMat.map = tex;
                spriteMat.needsUpdate = true;
                if (old) {
                  textures.delete(old);
                  old.dispose();
                }
              };
              img.onerror = () => images.delete(img);
              img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
            };
            updateFace();
            const emoteGlow = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: glowTexture,
                color: player.color || "#bcff5c",
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
            );
            emoteGlow.position.set(0, 0.2, -0.1);
            emoteGlow.scale.set(2.2, 2.2, 1);
            group.add(emoteGlow);
            const emotePositions = new Float32Array(24 * 3);
            const emoteGeometry = new THREE.BufferGeometry();
            emoteGeometry.setAttribute(
              "position",
              new THREE.BufferAttribute(emotePositions, 3),
            );
            const emoteSparks = new THREE.Points(
              emoteGeometry,
              new THREE.PointsMaterial({
                map: glowTexture,
                color: "#ffe899",
                size: 0.1,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false,
              }),
            );
            emoteSparks.frustumCulled = false;
            emoteSparks.visible = false;
            group.add(emoteSparks);
            const nameCanvas = document.createElement("canvas");
            nameCanvas.width = 256;
            nameCanvas.height = 48;
            const nc = nameCanvas.getContext("2d")!;
            nc.font = "600 23px system-ui, sans-serif";
            nc.textAlign = "center";
            nc.fillStyle = "#07111c";
            nc.beginPath();
            nc.roundRect(10, 2, 236, 42, 16);
            nc.fill();
            nc.fillStyle = player.id === props.me ? "#ffe0a0" : "#eff6ff";
            const name =
              player.name.length > 14
                ? player.name.slice(0, 12) + "…"
                : player.name;
            nc.fillText(name, 128, 30, 225);
            const nameTex = new THREE.CanvasTexture(nameCanvas);
            nameTex.colorSpace = THREE.SRGBColorSpace;
            textures.add(nameTex);
            const nameSprite = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: nameTex,
                transparent: true,
                depthWrite: false,
              }),
            );
            nameSprite.position.y = -0.6;
            nameSprite.scale.set(Math.min(1.22,spacing*.92),0.24,1);
            group.add(nameSprite);
            (arena.crewParent??s).add(group);
            return {
              id: player.id,
              group,
              sprite,
              base,
              baseMaterial,
              baseY: group.position.y,
              baseX,
              baseZ,
              ownScale,
              updateFace,
              emoteKey: "",
              faceEmote: -1,
              emoteGlow,
              emoteSparks,
              emotePositions,
            };
          });

          const projectileGeo =
            props.kind === "dragon" ? undefined : props.kind === "colossus"
              ? new THREE.BoxGeometry(0.23, 0.23, 0.23)
                : new THREE.SphereGeometry(0.14, 12, 8);
          const projectileMat = props.kind==='dragon'?undefined:new THREE.MeshStandardMaterial({
            color: props.kind === "kraken" ? 0x202c3b : 0xffdc82,
            metalness: 0.7,
            roughness: 0.28,
            emissive: props.kind === "kraken" ? 0x201008 : 0xbd711b,
            emissiveIntensity: 0.6,
          });
          const projectiles = props.kind==='dragon'?[]:characters.map((character) => {
            const group = new THREE.Group();
            const mesh = new THREE.Mesh(projectileGeo, projectileMat);
            group.add(mesh);
            const glow = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: glowTexture,
                color: props.kind === "kraken" ? 0xffae59 : 0xffd07b,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
            );
            glow.scale.set(0.7, 0.7, 1);
            group.add(glow);
            const trailGeo = new THREE.BufferGeometry();
            const trailPositions = new Float32Array(12 * 3);
            trailGeo.setAttribute(
              "position",
              new THREE.BufferAttribute(trailPositions, 3).setUsage(
                THREE.DynamicDrawUsage,
              ),
            );
            const trail = new THREE.Points(
              trailGeo,
              new THREE.PointsMaterial({
                color: props.kind === "kraken" ? 0xffaf72 : 0xffe7a3,
                size: 0.17,
                map: glowTexture,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
              }),
            );
            trail.frustumCulled = false;
            s.add(group, trail);
            group.visible = trail.visible = false;
            return {
              id: character.id,
              group,
              mesh,
              trail,
              trailPositions,
              end:arena.target.clone(),
              start: new THREE.Vector3(
                character.baseX,
                arena.playerHeight + 0.9,
                character.baseZ - 0.3,
              ),
            };
          });

          // One instanced mesh covers all impact fragments, coins and victory sparks.
          const fragmentCount = 240;
          const fragmentGeo =
            props.kind === "dragon"
              ? new THREE.CylinderGeometry(0.075, 0.075, 0.018, 8)
              : new THREE.IcosahedronGeometry(0.06, 0);
          const fragmentMat = new THREE.MeshStandardMaterial({
            color:
              props.kind === "kraken"
                ? 0x6ed3ec
                : props.kind === "dragon"
                  ? 0xffd269
                  : 0xa4b8bc,
            roughness: 0.44,
            metalness: 0.6,
            emissive: props.kind === "dragon" ? 0x9a520c : 0x000000,
          });
          const fragments = new THREE.InstancedMesh(
            fragmentGeo,
            fragmentMat,
            fragmentCount,
          );
          fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          fragments.frustumCulled = false;
          s.add(fragments);
          const dummy = new THREE.Object3D();
          const flashMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: props.kind === "kraken" ? 0xa8edff : 0xffd28d,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const flash = new THREE.Sprite(flashMat);
          flash.position.copy(arena.target);
          s.add(flash);
          const wave = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.04, 6, 56),
            new THREE.MeshBasicMaterial({
              color: arena.palette.glow,
              transparent: true,
              opacity: 0,
              depthWrite: false,
            }),
          );
          wave.position.copy(arena.target);
          s.add(wave);
          const cameraAim = new THREE.Vector3();
          const defaultAim = new THREE.Vector3(
            0,
            props.kind === "colossus"
              ? 3.5
              : props.kind === "kraken"
                ? 2.2
                : 1.9,
            -0.8,
          );
          let viewportWidth = 900;
          let viewportHeight=700;
          const resolution = new BossResolution();
          const clock = new BossFrameClock();
          let lastShadow = -1000,
            lastHud = -1000,
            lastReport = 0;
          let presented = 0,
            cpuTotal = 0,
            lastPresented = 0;
          let shadersReady = false;
          let focusAmount=0,focusStamp=0;
          let panoramaAmount=props.crewOverview?1:0,portraitRevealAmount=Number(['roundReveal','done'].includes(props.stage)),trackedX=bossStation(Math.max(0,props.players.findIndex(p=>p.id===props.me)),props.players.length,true).x;
          const focusPosition=new THREE.Vector3(),focusAim=new THREE.Vector3();
          const resize = () => {
            if (cancelled || !host) return;
            const { width, height } = host.getBoundingClientRect();
            if (width < 1 || height < 1) return;
            viewportWidth = width;
            viewportHeight=height;
            camera.aspect = width / height;
            // Leave the portrait action HUD below the world; the canvas stays full-bleed.
            camera.setViewOffset(
              width,
              height,
              (width > 1000 ? 40 : 0)*(1-focusAmount),
              (width <= 600
                ? height * (props.kind === "colossus" ? 0.19 : 0.16)
                : 0)*(1-focusAmount)*((props.kind==='kraken'&&krakenPortrait(width,height))||(props.kind==='dragon'&&dragonPortrait(width,height))||(props.kind==='colossus'&&colossusPortrait(width,height))?panoramaAmount:1),
              width,
              height,
            );
            camera.updateProjectionMatrix();
            const pixelRatio =
              Math.min(
                window.devicePixelRatio || 1,
                1.25,
                Math.sqrt(3686400 / (width * height)),
              ) * resolution.scale;
            r.setPixelRatio(pixelRatio);
            composer?.setPixelRatio(pixelRatio);
            r.setSize(width, height, false);
            composer?.setSize(width, height);
          };
          resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(host);
          resize();
          const seedTime = performance.now();
          let first = true;
          const clamp = (n: number, min = 0, max = 1) =>
            Math.min(max, Math.max(min, n));
          const ease = (n: number) => {
            const a = clamp(n);
            return a * a * (3 - 2 * a);
          };
          const arc = (
            out: Three.Vector3,
            start: Three.Vector3,
            end: Three.Vector3,
            progress: number,
          ) => {
            out.copy(start).lerp(end, progress);
            out.y +=
              Math.sin(progress * Math.PI) *
              (props.kind === "dragon" ? 0.8 : 1.6);
            return out;
          };
          const temp = new THREE.Vector3(),cannonEndpoint=new THREE.Vector3(),bossTarget=arena.target.toArray();
          const animate = (stamp: number) => {
            if (cancelled) return;
            if (document.hidden) return;
            const current = latest.current;
            const reduced =
              current.reducedMotion ||
              motionPreference.matches ||
              document.documentElement.dataset.motion === "reduced";
            if (!clock.ready(stamp, !!reduced)) return;
            const cpuStart = performance.now();
            const updateHud = stamp - lastHud >= 100;
            if (updateHud) lastHud = stamp;
            const serverNow =
              current.now + Math.max(0, stamp - current.receivedAt);
            const elapsed = Math.max(
              0,
              (serverNow - (current.startedAt || serverNow)) / 1000,
            );
            const time = (stamp - seedTime) / 1000;
            const reveal =
              current.stage === "roundReveal" || current.stage === "done";
            const intense = current.intense !== false;
            const motion = reduced ? 0 : 1;
            const portraitEffects=((props.kind==='kraken'&&krakenPortrait(viewportWidth,viewportHeight))||(props.kind==='dragon'&&dragonPortrait(viewportWidth,viewportHeight))||(props.kind==='colossus'&&colossusPortrait(viewportWidth,viewportHeight)))&&!current.crewOverview;
            const outcomes = reveal ? current.reveal?.outcomes || [] : [];
            const perfectSalvo =
              props.kind === "kraken" &&
              outcomes.filter((o) => (o.accuracy ?? 0) >= 0.95).length >= 2;
            let impact = 0;
            for (let i = 0; i < outcomes.length; i++) {
              if (!(props.kind==='dragon'?dragonShot(outcomes[i],i,outcomes.length).earned:Number(outcomes[i].damage ?? outcomes[i].score ?? 0)>0))
                continue;
              const impactAt =
                4.2 + i * (2.7 / Math.max(1, outcomes.length - 1));
              impact +=
                Math.max(0, 1 - (elapsed - impactAt) * 3.1) *
                Number(elapsed >= impactAt);
            }
            impact = Math.min(impact, 1.6);
            const breakProgress =
              reveal && current.reveal?.phaseBroken
                ? reduced
                  ? Number(elapsed >= 8)
                  : ease((elapsed - 8) / 1.6)
                : 0;
            const victory =
              reveal && current.reveal?.victory
                ? reduced
                  ? Number(elapsed >= 9.5)
                  : ease((elapsed - 9.5) / 2.2)
                : 0;
            const frame = {
              time,
              elapsed,
              phase: current.phase,
              stage: current.stage,
              impact: reduced ? impact * 0.3 : impact,
              breakProgress,
              victory,
              motion,
              salvo:props.kind==='kraken'?current.players.map(p=>outcomes.some(o=>o.id===p.id&&o.submitted===true)):undefined,
            };
            arena.update(frame);
            krakenSalvo?.update(elapsed,reveal,!!reduced,intense,outcomes);
            dragonSalvo?.update(elapsed,reveal,!!reduced,intense,outcomes);
            if(updateHud&&dragonSalvo)r.domElement.dataset.dragonSalvo=JSON.stringify(dragonSalvo.snapshot());
            if(updateHud&&krakenSalvo)r.domElement.dataset.krakenSalvo=JSON.stringify(krakenSalvo.snapshot());
            venue?.update({...frame,now:serverNow,submitted:current.submitted,outcomes,mineDice:current.mineDice,mineDragon:current.mineDragon,product:current.product,price:current.reveal?.price as number|undefined,active:current.active,portraitFocus:!!current.stationFocus&&current.stage==='answer'&&viewportWidth<=600});
            if(updateHud&&props.kind==='dragon')r.domElement.dataset.dragonAltar=JSON.stringify(venue?.dragonFrame());
            if(updateHud){r.domElement.dataset.venueDice=JSON.stringify(venue?.root.userData.ownDice??[]);
                r.domElement.dataset.venueHeld=JSON.stringify(venue?.root.userData.ownHeld??[]);r.domElement.dataset.venueRoll=JSON.stringify(venue?.root.userData.ownRoll??null);r.domElement.dataset.venueRuneCharge=JSON.stringify(venue?.root.userData.runeCharge??[]);}
            rig?.update(frame);
            const spectacleState = spectacle.update({
              time,
              elapsed,
              stage: current.stage,
              impact: reduced ? impact * 0.25 : impact,
              phaseBroken: !!current.reveal?.phaseBroken,
              victory: !!current.reveal?.victory,
              reduced: !!reduced,
              intense,
              strength:portraitEffects?.35:1,
            });
            bloom.strength =
              (reduced ? 0.45 : 0.75 + spectacleState.energy * 0.3) *
              (intense ? 1 : 0.4);
            if (updateHud)
              host.style.setProperty(
                "--boss-flare",
                String(
                  (reduced ? 0.08 : spectacleState.energy * 0.6) *
                    (intense ? 1 : 0.25),
                ),
              );
            if (updateHud)
              host.style.setProperty(
                "--boss-letterbox",
                `${!reduced && intense && (current.stage === "intro" || reveal) ? 12 : 0}px`,
              );
            const breath =
              props.kind === "dragon" &&
              !reduced &&
              rig?.mouth &&
              ((current.stage === "intro" && elapsed > 0.65 && elapsed < 1.7) ||
                (reveal &&
                  ((elapsed > 0.65 && elapsed < 1.7) ||
                    (breakProgress > 0 && elapsed > 8.65 && elapsed < 9.7))));
            dragonFire.visible = !!breath;
            fireLight.intensity = 0;
            if (breath && rig?.mouth) {
              rig.root.updateMatrixWorld(true);
              rig.mouth.getWorldPosition(mouthPosition);
              for (let i = 0; i < 75; i++) {
                const age = (time * 1.6 + i / 75) % 1,
                  angle = i * 2.399,
                  spread = age * 0.8;
                firePositions[i * 3] =
                  mouthPosition.x + Math.sin(angle) * spread;
                firePositions[i * 3 + 1] =
                  mouthPosition.y - age * 2.5 + Math.cos(angle) * spread * 0.5;
                firePositions[i * 3 + 2] = mouthPosition.z + age * 4.5;
              }
              fireGeometry.attributes.position.needsUpdate = true;
              fireMaterial.opacity = intense ? 0.85 : 0.4;
              fireLight.position.copy(mouthPosition);
              fireLight.intensity = 65;
            }
            const intro = current.stage === "intro" ? 1 - ease(elapsed / 5) : 0;
            // Each arrival is framed differently: rising temple, pitching ship, flying dragon.
            const portraitExtra = Math.max(0, 1.9 / camera.aspect - 1) * 5.8;
            const preferredDistance =
              (props.kind === "colossus"
                ? 17
                : props.kind === "dragon"
                  ? 16
                  : 15.4) +
              portraitExtra +
              (viewportWidth > 1000 && props.kind !== "colossus" ? 2 : 0);
            // Keep the full crew and the outer gun stations inside portrait framing.
            const distance=Math.max(preferredDistance,viewportWidth<=600
              ? (props.kind==="kraken"?7.7:6.6)/(Math.tan(21*Math.PI/180)*camera.aspect)+5
              : 0);
            const baseHeight = props.kind === "kraken" ? 7.3 : 7.1;
            if (props.kind === "colossus") {
              camera.position.set(
                Math.sin(time * 0.09) * 0.15 * motion + intro * -3.2 * motion,
                baseHeight - intro * 4.1 * motion,
                distance + intro * 1.6 * motion,
              );
            } else if (props.kind === "kraken") {
              camera.position.set(
                Math.sin(time * 0.17) * 0.12 * motion,
                baseHeight +
                  Math.sin(time * 0.65) * 0.04 * motion +
                  intro * 1.2 * motion,
                distance - intro * 2 * motion,
              );
            } else {
              camera.position.set(
                intro * 3.8 * motion + Math.sin(time * 0.1) * 0.13 * motion,
                baseHeight + intro * 3.8 * motion,
                distance + intro * 0.7 * motion,
              );
            }
            const shake =
              intense && !reduced
                ? impact * 0.06 +
                  (breakProgress > 0 && breakProgress < 1 ? 0.08 : 0)
                : 0;
            camera.position.x += Math.sin(time * 71) * shake;
            camera.position.y += Math.cos(time * 59) * shake * 0.65;
            cameraAim.copy(defaultAim);
            // Each move eases back to the readable gameplay framing before input resumes.
            const shotPower = motion * (intense ? 1 : 0.4);
            const chargeShot = reveal
              ? Math.sin(ease(elapsed / 3.45) * Math.PI)
              : 0;
            const salvoShot =
              reveal && elapsed >= 3.45 && elapsed < 7.8
                ? Math.sin(((elapsed - 3.45) / 4.35) * Math.PI)
                : 0;
            const breakShot =
              reveal && current.reveal?.phaseBroken
                ? Math.sin(ease((elapsed - 8) / 1.6) * Math.PI)
                : 0;
            const endShot =
              reveal && current.reveal?.victory ? ease((elapsed - 10) / 5) : 0;
            const arrivalOrbit =
              current.stage === "intro"
                ? Math.sin(ease(elapsed / 6) * Math.PI)
                : 0;
            const direction = props.kind === "dragon" ? -1 : 1;
            camera.position.x +=
              shotPower *
              direction *
              (arrivalOrbit * 3.5 -
                chargeShot * 2.6 +
                salvoShot * Math.sin((elapsed - 3.45) * 0.8) * 2 +
                breakShot * 1.6 +
                endShot * Math.sin((elapsed - 10) * 0.2) * 1.8);
            camera.position.y +=
              shotPower *
              (-chargeShot * 1.25 + breakShot * 1.0 + endShot * 1.2);
            camera.position.z +=
              shotPower * (-chargeShot * 1.1 - salvoShot * 1.0 + endShot * 0.8);
            cameraAim.y += shotPower * (chargeShot * 0.35 + endShot * 0.45);
            const fov =
              42 + shotPower * (-chargeShot * 3 - breakShot * 2 + endShot * 3);
            if (Math.abs(camera.fov - fov) > 0.01) {
              camera.fov = fov;
              camera.updateProjectionMatrix();
            }
            if (updateHud)
              r.domElement.dataset.cameraShot =
                current.stage === "intro"
                  ? "arrival-orbit"
                  : endShot > 0
                    ? "victory-crane"
                    : breakShot > 0
                      ? "armor-break"
                      : salvoShot > 0
                        ? "salvo-tracking"
                        : chargeShot > 0
                          ? "charge-dolly"
                          : "gameplay";
            if (current.stage === "intro" && props.kind === "dragon")
              cameraAim.y += intro * 1.5 * motion;
            const localIndex=current.players.findIndex(p=>p.id===current.me);
            const focused=!!current.stationFocus&&current.stage==="answer"&&localIndex>=0;
            const focusDelta=Math.min(.1,Math.max(0,(stamp-focusStamp)/1000));focusStamp=stamp;
            const portrait=props.kind==='kraken'&&krakenPortrait(viewportWidth,viewportHeight);
            const dragonClose=props.kind==='dragon'&&dragonPortrait(viewportWidth,viewportHeight);
            const colossusClose=props.kind==='colossus'&&colossusPortrait(viewportWidth,viewportHeight);
            panoramaAmount=reduced?Number(!!current.crewOverview):panoramaAmount+(Number(!!current.crewOverview)-panoramaAmount)*(1-Math.exp(-focusDelta*9));
            if(Math.abs(panoramaAmount-Number(!!current.crewOverview))<.001)panoramaAmount=Number(!!current.crewOverview);
            if(portrait){
              const own=Math.max(0,localIndex),wanted=reveal&&!reduced?krakenTrackedStation(elapsed,outcomes,current.players.map(p=>p.id),own):bossStation(own,current.players.length,true).x;
              trackedX=reduced?wanted:trackedX+(wanted-trackedX)*(1-Math.exp(-focusDelta*4));
              portraitRevealAmount=reduced?Number(reveal):portraitRevealAmount+(Number(reveal)-portraitRevealAmount)*(1-Math.exp(-focusDelta*6));
              const pose=krakenActionPose(viewportHeight,trackedX,portraitRevealAmount);
              focusPosition.fromArray(pose.position);focusAim.fromArray(pose.aim);camera.position.lerp(focusPosition,1-panoramaAmount);cameraAim.lerp(focusAim,1-panoramaAmount);
            }
            if(dragonClose){
              const own=Math.max(0,localIndex),wanted=reveal&&!reduced?dragonTrackedStation(elapsed,outcomes,current.players.map(p=>p.id),own):bossStation(own,current.players.length).x;
              trackedX=reduced?wanted:trackedX+(wanted-trackedX)*(1-Math.exp(-focusDelta*4));
              portraitRevealAmount=reduced?Number(reveal):portraitRevealAmount+(Number(reveal)-portraitRevealAmount)*(1-Math.exp(-focusDelta*6));
              const pose=dragonActionPose(viewportHeight,trackedX,portraitRevealAmount);
              focusPosition.fromArray(pose.position);focusAim.fromArray(pose.aim);camera.position.lerp(focusPosition,1-panoramaAmount);cameraAim.lerp(focusAim,1-panoramaAmount);
            }
            if(colossusClose){
              const own=Math.max(0,localIndex),wanted=reveal&&!reduced?colossusTrackedStation(elapsed,outcomes,current.players.map(p=>p.id),own):bossStation(own,current.players.length).x;
              trackedX=reduced?wanted:trackedX+(wanted-trackedX)*(1-Math.exp(-focusDelta*4));
              portraitRevealAmount=reduced?Number(reveal):portraitRevealAmount+(Number(reveal)-portraitRevealAmount)*(1-Math.exp(-focusDelta*6));
              const pose=colossusActionPose(viewportHeight,trackedX,portraitRevealAmount);
              focusPosition.fromArray(pose.position);focusAim.fromArray(pose.aim);camera.position.lerp(focusPosition,1-panoramaAmount);cameraAim.lerp(focusAim,1-panoramaAmount);
            }
            focusAmount=reduced?Number(focused):focusAmount+(Number(focused)-focusAmount)*(1-Math.exp(-focusDelta*9));
            if(Math.abs(focusAmount-Number(focused))<.001)focusAmount=Number(focused);
            if(focusAmount>0&&localIndex>=0){
              const station=bossStation(localIndex,current.players.length,props.kind==="kraken");
              if(props.kind==="colossus"){
                focusPosition.set(station.x+.05,2,station.z+.65+3.6);focusAim.set(station.x+.05,.35,station.z+.65);
              }else if(props.kind==="kraken"){
                focusPosition.set(station.x+1.4,4.8,station.cannonZ+4.7);focusAim.set(station.x,viewportWidth<=600?.65:1.1,station.cannonZ);
                arena.crewParent?.localToWorld(focusPosition);arena.crewParent?.localToWorld(focusAim);
              }else{
                focusPosition.set(-4.65,5.6,viewportWidth<=600?14.5+Math.max(0,844-viewportHeight)*.025:11.5);focusAim.set(-4.65,2.2,1);
              }
              camera.position.lerp(focusPosition,focusAmount);cameraAim.lerp(focusAim,focusAmount);
            }
            const view=camera.view;
            if(view){const x=(viewportWidth>1000?40:0)*(1-focusAmount),y=(viewportWidth<=600?view.fullHeight*(props.kind==="colossus"?.19:.16):0)*(1-focusAmount)*(portrait||dragonClose||colossusClose?panoramaAmount:1);if(Math.abs(view.offsetX-x)>.01||Math.abs(view.offsetY-y)>.01)camera.setViewOffset(view.fullWidth,view.fullHeight,x,y,view.width,view.height);}
            if(updateHud&&props.kind==='kraken')r.domElement.dataset.krakenCamera=focusAmount>.99?'station':portrait?(panoramaAmount>.99?'ship':panoramaAmount<.01?'action':'transition'):'wide';
            if(updateHud&&props.kind==='dragon')r.domElement.dataset.dragonCamera=focusAmount>.99?'station':dragonClose?(panoramaAmount>.99?'hort':panoramaAmount<.01?'action':'transition'):'wide';
            if(updateHud&&props.kind==='colossus')r.domElement.dataset.colossusCamera=focusAmount>.99?'station':colossusClose?(panoramaAmount>.99?'temple':panoramaAmount<.01?'action':'transition'):'wide';
            camera.lookAt(cameraAim);
            if (props.kind === "kraken")
              camera.rotateZ(
                (Math.sin(time * 0.6) * 0.004 +
                  Math.sin(breakProgress * Math.PI) * 0.035) *
                  motion,
              );
            const victoryZoom = victory * 0.8 * motion;
            camera.position.z -= victoryZoom;
            if (perfectSalvo && !reduced && elapsed >= 3.7 && elapsed < 5.5)
              camera.position.z -=
                Math.sin(((elapsed - 3.7) / 1.8) * Math.PI) * 0.85;
            impactLight.intensity =
              (impact * 48 + breakProgress * (1 - breakProgress) * 65)*(portraitEffects?.5:1);
            fill.intensity =
              20 + (current.phase === 2 ? 9 : 0) + Math.sin(time * 2) * 3;
            flashMat.opacity =
              (impact * 0.55 + breakProgress * (1 - breakProgress)) *
              (intense ? 1 : 0.4)*(portraitEffects?.45:1);
            flash.scale.setScalar(3.5 + impact * 1.5);
            const waveMat = wave.material as Three.MeshBasicMaterial;
            waveMat.opacity =
              breakProgress > 0 && breakProgress < 1
                ? (1 - breakProgress) * 0.65
                : 0;
            wave.scale.setScalar(0.8 + breakProgress * 9);
            wave.quaternion.copy(camera.quaternion);

            characters.forEach((character, i) => {
              const index = outcomes.findIndex(
                (outcome) => outcome.id === character.id,
              );
              const fireAt =
                3.45 +
                Math.max(0, index) * (2.7 / Math.max(1, outcomes.length - 1));
              const firing =
                index >= 0 &&
                (props.kind==='dragon'?dragonShot(outcomes[index],index,outcomes.length).earned:Number(outcomes[index].damage ?? outcomes[index].score ?? 0)>0) &&
                elapsed >= fireAt &&
                elapsed <= fireAt + 0.5;
              const bounce = breath
                ? -0.17
                : victory > 0
                  ? Math.max(0, Math.sin(time * 7 + i * 0.7)) * 0.3
                  : firing
                    ? Math.sin(((elapsed - fireAt) / 0.5) * Math.PI) * 0.18
                    : current.submitted[character.id]
                      ? Math.sin(time * 3 + i) * 0.035
                      : Math.sin(time * 1.6 + i) * 0.012;
              character.group.position.y = character.baseY + bounce * motion;
              character.group.rotation.z = firing
                ? Math.sin((elapsed - fireAt) * 10) * 0.08 * motion
                : 0;
              character.sprite.scale.set(
                character.ownScale * (firing ? 1.06 : 1),
                character.ownScale * (firing ? 0.96 : 1),
                1,
              );
              character.baseMaterial.opacity = current.submitted[character.id]
                ? 0.8
                : 0.28;
              character.base.scale.setScalar(
                current.submitted[character.id]
                  ? 1.08 + Math.sin(time * 3) * 0.06 * motion
                  : 1,
              );
              const reaction = current.emotes?.findLast(
                (e) =>
                  e.player === character.id &&
                  serverNow - e.at >= 0 &&
                  serverNow - e.at < 5000,
              );
              const reactionKey = reaction?.id ?? "";
              const sourceKey =
                avatarSource.current?.children[i]?.getAttribute(
                  "data-emote-key",
                ) ?? "";
              if (
                reactionKey !== character.emoteKey &&
                sourceKey === reactionKey
              ) {
                character.emoteKey = reactionKey;
                // Repeated reactions restart the motion, but reuse the same face.
                // Avoid decoding and uploading twelve identical SVG textures at once.
                const faceEmote = reaction?.emote ?? -1;
                if (character.faceEmote !== faceEmote) {
                  character.faceEmote = faceEmote;
                  character.updateFace();
                }
              }
              character.emoteGlow.material.opacity = reaction ? 0.4 : 0;
              character.emoteGlow.visible = !!reaction;
              character.emoteSparks.visible = !!reaction && !reduced;
              if (reaction) {
                const age = (serverNow - reaction.at) / 1000;
                const envelope = Math.min(1, age * 6, (5 - age) * 3);
                const action = emoteMotions[reaction.emote] ?? "cheer";
                const laugh = [
                  "laugh",
                  "giggle",
                  "sob",
                  "rage",
                  "shiver",
                ].includes(action);
                const dancing = [
                  "dance",
                  "cheer",
                  "clap",
                  "royal",
                  "flex",
                  "lucky",
                  "wink",
                  "kiss",
                ].includes(action);
                const airborne = [
                  "launch",
                  "ufo",
                  "explode",
                  "gasp",
                  "idea",
                ].includes(action);
                const droop = [
                  "sleep",
                  "sigh",
                  "dizzy",
                  "palm",
                  "hide",
                  "drop",
                ].includes(action);
                const bounce = airborne
                  ? Math.sin(Math.min(1, age / 1.2) * Math.PI) * 0.8 +
                    Math.sin(age * 3) * 0.1
                  : dancing
                    ? Math.abs(Math.sin(age * 6)) * 0.3
                    : laugh
                      ? Math.abs(Math.sin(age * 14)) * 0.09
                      : droop
                        ? -0.12
                        : Math.sin(age * 4) * 0.06;
                character.group.position.y += bounce * envelope * motion;
                character.group.rotation.z +=
                  (droop
                    ? -0.2
                    : Math.sin(age * (laugh ? 16 : 7)) *
                      (dancing ? 0.18 : 0.07)) *
                  envelope *
                  motion;
                const squash = laugh
                  ? Math.sin(age * 17) * 0.09
                  : dancing
                    ? Math.sin(age * 12) * 0.08
                    : 0;
                character.sprite.scale.set(
                  character.ownScale * (1 + envelope * 0.22 + squash * motion),
                  character.ownScale * (1 + envelope * 0.22 - squash * motion),
                  1,
                );
                character.emoteGlow.material.opacity = envelope * 0.38;
                character.baseMaterial.opacity = 1;
                character.base.scale.setScalar(
                  1.2 + Math.sin(age * 6) * 0.1 * motion,
                );
                character.emoteSparks.material.color.set(
                  action === "sob" || action === "shiver"
                    ? "#69cfff"
                    : action === "rage"
                      ? "#ff6633"
                      : action === "kiss"
                        ? "#ff83c7"
                        : "#ffe899",
                );
                character.emoteSparks.material.opacity = envelope * 0.9;
                for (let j = 0; j < 24; j++) {
                  const progress = (age * 0.6 + j / 24) % 1;
                  const angle = j * 2.399 + age * (airborne ? 2 : 0.5);
                  character.emotePositions[j * 3] =
                    Math.sin(angle) * (0.45 + progress * 0.4);
                  character.emotePositions[j * 3 + 1] =
                    action === "sob"
                      ? 0.4 - progress * 1.3
                      : progress * 1.3 - 0.3;
                  character.emotePositions[j * 3 + 2] =
                    Math.cos(angle) * 0.2 + 0.12;
                }
                character.emoteSparks.geometry.attributes.position.needsUpdate = true;
              }
            });
            if (updateHud)
              r.domElement.dataset.emotingPlayers = characters
                .filter((p) => p.emoteKey)
                .map((p) => p.id)
                .join(",");
            projectiles.forEach((projectile) => {
              const index = outcomes.findIndex(
                (outcome) => outcome.id === projectile.id,
              );
              const fireAt =
                3.45 +
                Math.max(0, index) * (2.7 / Math.max(1, outcomes.length - 1));
              const flight = (elapsed - fireAt) / 0.75;
              const cannonShot=props.kind==='kraken'?krakenShot(outcomes[index],Math.max(0,index),outcomes.length,elapsed):undefined;
              // Ease the final approach for a shared perfect shot, preserving server impact time.
              const progress =
                perfectSalvo && flight >= 0 && flight <= 1
                  ? 1 - (1 - flight) ** 2
                  : flight;
              const visible =
                props.kind !== 'dragon' &&
                !reduced &&
                index >= 0 &&
                (cannonShot?cannonShot.confirmed:Number(outcomes[index].damage ?? outcomes[index].score ?? 0)>0) &&
                progress >= 0 &&
                progress <= 1;
              projectile.group.visible = projectile.trail.visible = visible;
              if (!visible) return;
              if(props.kind==='colossus'){const station=bossStation(characters.findIndex(c=>c.id===projectile.id),characters.length);projectile.start.fromArray(colossusRuneOrigin(station));}
              let endpoint=arena.target;
              if(arena.cannons){const stationIndex=characters.findIndex(c=>c.id===projectile.id),gun=arena.cannons[stationIndex];projectile.start.set(0,.455,-.72);gun.updateWorldMatrix(true,false);gun.localToWorld(projectile.start);cannonEndpoint.fromArray(krakenTarget(stationIndex,!!cannonShot?.hit,bossTarget));endpoint=cannonEndpoint;}
              projectile.end.copy(endpoint);
              arc(
                projectile.group.position,
                projectile.start,
                endpoint,
                progress,
              );
              projectile.mesh.rotation.set(time * 12, time * 8, time * 5);
              for (let j = 0; j < 12; j++) {
                arc(
                  temp,
                  projectile.start,
                  endpoint,
                  Math.max(0, progress - j * 0.016),
                );
                projectile.trailPositions[j * 3] = temp.x;
                projectile.trailPositions[j * 3 + 1] = temp.y;
                projectile.trailPositions[j * 3 + 2] = temp.z;
              }
              projectile.trail.geometry.attributes.position.needsUpdate = true;
            });
            if(updateHud&&krakenSalvo)r.domElement.dataset.krakenProjectiles=JSON.stringify(projectiles.filter(p=>p.group.visible).map(p=>({id:p.id,start:p.start.toArray(),end:p.end.toArray(),position:p.group.position.toArray()})));
            for (let i = 0; i < particleCount; i++) {
              const a = i * 2.399;
              const x = Math.sin(a) * (3 + (i % 17) * 0.45);
              const y =
                props.kind === "kraken"
                  ? 8 - ((time * 3.6 + i * 0.271) % 9)
                  : (time * (props.kind === "dragon" ? 0.42 : 0.17) +
                      i * 0.137) %
                    8;
              ambiencePositions[i * 3] =
                x + Math.sin(time * 0.35 + i) * 0.22 * motion;
              ambiencePositions[i * 3 + 1] = reduced ? (i * 0.137) % 8 : y;
              ambiencePositions[i * 3 + 2] = Math.cos(a) * 6 - 1.5;
            }
            ambienceGeo.attributes.position.needsUpdate = true;
            ambienceMat.opacity = intense ? 0.6 : 0.22;
            if (props.kind === "kraken") {
              // Broad, soft lightning brightens the storm, never a fullscreen strobe.
              const lightningCycle = time % 16;
              const lightning =
                intense &&
                !reduced &&
                lightningCycle > 11 &&
                lightningCycle < 11.5
                  ? Math.sin((lightningCycle - 11) * Math.PI * 2)
                  : 0;
              rim.intensity = 3.2 + Math.max(0, lightning) * 3.8;
            }
            fragments.visible =
              reveal &&
              (!['kraken','dragon'].includes(props.kind)||breakProgress>0||victory>0) &&
              !reduced &&
              elapsed >= 4.2 &&
              elapsed < (victory > 0 ? 15.3 : breakProgress > 0 ? 10.8 : 8.8);
            if (fragments.visible)
              for (let i = 0; i < fragmentCount; i++) {
                const attackIndex = i % Math.max(1, outcomes.length);
                const impactAt =
                  4.2 + attackIndex * (2.7 / Math.max(1, outcomes.length - 1));
                const particleStart =
                  victory > 0
                    ? 9.5 + (i % 24) * 0.075
                    : breakProgress > 0
                      ? 8 + (i % 12) * 0.03
                      : impactAt;
                const age = elapsed - particleStart;
                const alive =
                  reveal &&
                  age > 0 &&
                  age < (victory > 0 ? 4.0 : 1.75) &&
                  (breakProgress > 0 ||
                    victory > 0 ||
                    Number(
                      outcomes[attackIndex]?.damage ??
                        outcomes[attackIndex]?.score ??
                        0,
                    ) > 0);
                if (!alive || reduced || (!intense && i % 3 !== 0)) {
                  dummy.scale.setScalar(0);
                } else {
                  const angle = i * 2.399;
                  const speed = 1.2 + (i % 13) * 0.23;
                  const spread = victory > 0 ? 1.8 : 1;
                  dummy.position.set(
                    arena.target.x + Math.sin(angle) * age * speed * spread,
                    arena.target.y +
                      age * (2 + (i % 9) * 0.32) -
                      2.7 * age * age,
                    arena.target.z + Math.cos(angle) * age * speed,
                  );
                  dummy.rotation.set(age * 4 + i, age * 6, angle);
                  dummy.scale.setScalar(
                    (victory > 0 ? 1.2 : 1) *
                      Math.min(1, (victory > 0 ? 4 : 1.75) - age),
                  );
                }
                dummy.updateMatrix();
                fragments.setMatrixAt(i, dummy.matrix);
              }
            if (fragments.visible) fragments.instanceMatrix.needsUpdate = true;
            try {
              // Static scenery reuses its shadow map; skeletal shadows refresh at 20 Hz.
              if (stamp - lastShadow >= 50 || first) {
                r.shadowMap.needsUpdate = true;
                lastShadow = stamp;
              }
              r.info.reset();
              gpuTimer?.begin();
              if (composer && intense) composer.render();
              else r.render(s, camera);
              gpuTimer?.end();
              const cpuMs = performance.now() - cpuStart;
              const frameMs = lastPresented ? stamp - lastPresented : 1000 / 60;
              lastPresented = stamp;
              presented++;
              cpuTotal += cpuMs;
              if (
                !reduced &&
                shadersReady &&
                resolution.sample(
                  gpuTimer?.milliseconds ?? frameMs,
                  stamp,
                  gpuTimer?.milliseconds != null,
                )
              )
                resize();
              if (first && rig && shadersReady) {
                first = false;
                r.domElement.style.opacity = "1";
                if (!cancelled) setReady(true);
              }
              // Exposed non-sensitive diagnostics assist local performance verification.
              if (stamp - lastReport >= 1000) {
                r.domElement.dataset.fps = String(
                  Math.round(
                    (presented * 1000) / (stamp - (lastReport || seedTime)),
                  ),
                );
                r.domElement.dataset.cpuMs = (cpuTotal / presented).toFixed(2);
                r.domElement.dataset.gpuMs =
                  gpuTimer?.milliseconds?.toFixed(2) ?? "unavailable";
                r.domElement.dataset.renderScale = resolution.scale.toFixed(2);
                r.domElement.dataset.renderPixels = String(
                  r.domElement.width * r.domElement.height,
                );
                presented = 0;
                cpuTotal = 0;
                lastReport = stamp;
                r.domElement.dataset.camera=JSON.stringify(camera.position.toArray());
                r.domElement.dataset.cameraAim=JSON.stringify(cameraAim.toArray());
                r.domElement.dataset.cameraWorld=JSON.stringify(camera.matrixWorld.toArray());
                r.domElement.dataset.cameraProjection=JSON.stringify(camera.projectionMatrix.toArray());
                r.domElement.dataset.stationFocus=String(focusAmount);
                r.domElement.dataset.venuePicks=JSON.stringify((venue?.pickables??[]).filter(p=>!p.userData.pickDisabled&&p.visible).map(p=>({key:p.userData.pick,point:p.getWorldPosition(new THREE.Vector3()).toArray()})));
                r.domElement.dataset.venue=venue?.root.name??"";
                r.domElement.dataset.venueReady=String(venue?.root.userData.assetsReady??false);r.domElement.dataset.venueCannons=JSON.stringify(venue?.cannonFrame()??[]);
                r.domElement.dataset.venuePhase=String(venue?.root.userData.phase??0);
                r.domElement.dataset.phaseSeals=String(venue?.root.userData.phaseSeals??0);
                r.domElement.dataset.venueProduct=String(venue?.root.userData.product??"");
                r.domElement.dataset.venuePrice=String(venue?.root.userData.priceVisible??false);
                r.domElement.dataset.crewOnDeck=String(!!arena.crewParent);
                {const own=characters.find(character=>character.id===props.me);if(own){const center=own.sprite.getWorldPosition(new THREE.Vector3()),size=own.sprite.getWorldScale(new THREE.Vector3()),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);r.domElement.dataset.ownCrewQuad=JSON.stringify([[-.35,-.3],[.35,-.3],[-.35,.3],[.35,.3]].map(([x,y])=>center.clone().addScaledVector(right,x*size.x).addScaledVector(up,y*size.y).project(camera).toArray()));}}
                r.domElement.dataset.drawCalls = String(r.info.render.calls);
                r.domElement.dataset.triangles = String(
                  r.info.render.triangles,
                );
                r.domElement.dataset.viewport = String(
                  Math.round(viewportWidth),
                );
              }
            } catch {
              fail();
            }
          };
          Promise.all([modelReady, skyReady, venue.ready])
            .then(async () => {
              if (cancelled) return;
              const previousTarget = r.getRenderTarget();
              r.setRenderTarget(
                latest.current.intense !== false ? composer!.readBuffer : null,
              );
              const warmup = r.compileAsync(s, camera);
              r.setRenderTarget(previousTarget);
              await warmup;
              if (!cancelled) shadersReady = true;
            })
            .catch(() => {
              fail();
            });
          stopFrames = startVisibleFrameLoop(animate,stamp=>{lastPresented=0;focusStamp=stamp;lastHud=-1000;lastShadow=-1000;});
        },
      )
      .catch(() => {
        fail();
      });

    let disposed=false;
    const dispose = () => {
      if(disposed)return;disposed=true;
      cancelled = true;
      stopFrames();
      resizeObserver?.disconnect();
      venue?.dispose();
      krakenSalvo?.dispose();
      dragonSalvo?.dispose();
      clearVenueEvents();
      rig?.dispose();
      gpuTimer?.dispose();
      environment?.dispose();
      composer?.passes.forEach((pass) => pass.dispose());
      composer?.dispose();
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
        image.src = "";
      }
      const geometries = new Set<Three.BufferGeometry>();
      const materials = new Set<Three.Material>();
      scene?.traverse((object) => {
        const shadow = (object as Three.DirectionalLight).shadow;
        shadow?.map?.dispose();
        shadow?.mapPass?.dispose();
        const mesh = object as Three.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          for (const material of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value && typeof value === "object" && "isTexture" in value)
                textures.add(value as Three.Texture);
          }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      if (renderer) {
        if (loseContext)
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            loseContext,
          );
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
      scene?.clear();
    };
    const fail=()=>{if(cancelled)return;dispose();setFailed(true);};
    return dispose;
    // Individual submissions update refs; only a different arena/wardrobe rebuilds WebGL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.kind, rosterKey, retry]);

  const title =
    props.kind === "colossus"
      ? "Runentempel des Würfelkolosses"
      : props.kind === "kraken"
        ? "Krakensturm auf hoher See"
        : "Der goldene Vulkantresor des Münzdrachen";
  return (
    <div
      ref={container}
      className={`boss-scene-wrapper boss-scene-${props.kind}${ready && !failed ? " is-ready" : ""}`}
      role="img"
      aria-label={title}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#0b1523",
      }}
    >
      {(!ready || failed) && (
        <BossSceneFallback
          kind={props.kind}
          phase={props.phase}
          failed={failed}
        />
      )}
      {failed && (
        <button
          type="button"
          className="boss-scene-retry"
          onClick={() => setRetry((n) => n + 1)}
          style={{
            position: "absolute",
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 96,
            minHeight: 44,
            zIndex: 2,
            border: "1px solid #ffffff33",
            borderRadius: 20,
            padding: "7px 12px",
            color: "#fff",
            background: "#111d2cdd",
            fontSize: 11,
          }}
        >
          Arena neu laden
        </button>
      )}
      <div className="boss-cinema-lens" aria-hidden="true">
        <i />
        <b />
        <span />
      </div>
      <div ref={avatarSource} aria-hidden="true" style={{ display: "none" }}>
        {props.players.map((player) => (
          <span
            key={player.id}
            data-emote-key={
              props.emotes?.findLast(
                (e) =>
                  e.player === player.id &&
                  props.now - e.at >= 0 &&
                  props.now - e.at < 5000,
              )?.id ?? ""
            }
          >
            <Avatar
              avatar={player.avatar}
              color={player.color}
              look={player.look}
              emote={
                props.emotes?.findLast(
                  (e) =>
                    e.player === player.id &&
                    props.now - e.at >= 0 &&
                    props.now - e.at < 5000,
                )?.emote ?? -1
              }
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function BossSceneFallback({
  kind,
  failed,
}: {
  kind: BossKind;
  phase: number;
  failed: boolean;
}) {
  return (
    <div
      className="boss-scene-fallback"
      style={{ position: "absolute", inset: 0, background: "#080d14" }}
    >
      <img
        src={`/boss-models/${kind}-poster.webp`}
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: failed ? 0.8 : 0.45,
        }}
      />
      <span
        role="status"
        style={{
          position: "absolute",
          left: 16,
          bottom: 45,
          color: "#f5e6cd",
          fontSize: 11,
          background: "#111d2cdd",
          padding: "7px 12px",
          borderRadius: 15,
        }}
      >
        {failed
          ? "Standbild · Alle Aktionen bleiben spielbar"
          : "Die Arena erwacht …"}
      </span>
    </div>
  );
}

export default BossScene;
