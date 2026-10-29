"use client";
import {startVisibleFrameLoop} from "@/lib/visible-frame-loop";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Compass, Crosshair, Expand, Footprints, Smile, Users, Map as MapIcon, Minus, Plus, X } from "lucide-react";
import { byId } from "@/lib/game/catalog";
import { islandThemes, islandViewSize, journeyLayout,JOURNEY_CAMERA } from "@/lib/journey-world";
import type { Selection } from "@/lib/game/types";
import { isBoss } from "@/lib/game/boss-rules";
import type { MapCharacter } from "./journey-characters";
import type { MapMove, CrewTravel } from "@/lib/game/journey-motion";
import { Avatar } from "./art";
import { EmotePicker } from "./emote-picker";
import { emoteNames } from "@/lib/emotes";
import {layoutJourneyLabels,type MapRect} from '@/lib/journey-labels';
import {transitVesselPoints,journeyTransitCue} from '@/lib/journey-transit';
import {sound} from '@/lib/audio';
import {AdventureQuality,qualityProfiles,validQuality} from '@/lib/adventure-quality';
import {useGraphicsQuality} from './use-graphics-quality';
import {journeyWalkHeight} from '@/lib/journey-plaza';

interface Props {
  cinematic?: boolean;
  selection: Selection[]; selected: number; current: number; crew: MapCharacter[];
  completed: number; trophies: { index: number; victory: boolean }[]; reduced: boolean; onSelect: (index: number) => void;
  me?:string;canMove?:boolean;moves?:Record<string,MapMove>;travel?:CrewTravel;emotes?:{id?:string;player:string;emote:number;at:number}[];serverTime?:number;act?:(a:any)=>Promise<unknown>;
}
interface Controls { focus: (i: number) => void; region:(chapter:number)=>void; zoom: (factor: number) => void; overview: () => void; pan: (x: number, y: number) => void }
export function JourneyMap({ selection, selected, current, crew, completed, trophies, reduced, onSelect,me,canMove,moves,travel,emotes=[],serverTime,act,cinematic=false }: Props) {
  const [fullscreen, setFullscreen] = useState(false), [status, setStatus] = useState("loading"),[retry,setRetry]=useState(0);
  const [overview, setOverview] = useState(false), [zoom, setZoom] = useState(100);
  const [regionView,setRegionView]=useState<number|null>(null),viewRef=useRef<{mode:'island'|'all'|'region';chapter:number|null}>({mode:'island',chapter:null});
  const [calm, setCalm] = useState(reduced);
  const [trip,setTrip]=useState<{kind:string;phase:string}|null>(null);
  const [quality,setQuality]=useGraphicsQuality(),qualityRef=useRef(quality);qualityRef.current=quality;
  const transitLocked=!!travel&&(serverTime??Date.now())>=travel.at&&(serverTime??Date.now())<travel.at+travel.duration;
  const [walkingMode,setWalkingMode]=useState(true),[emoteMenu,setEmoteMenu]=useState(false),[favorites,setFavorites]=useState([0,4,9,20,37,46]);
  const [message,setMessage]=useState("");
  const [showNames,setShowNames]=useState(false);
  const avatarSource=useRef<HTMLDivElement>(null),avatarLabels=useRef<HTMLDivElement>(null),clockOffset=useRef((serverTime??Date.now())-Date.now());
  const live=useRef({moves,travel,emotes,canMove,act,walkingMode,showNames,calm});live.current={moves,travel,emotes,canMove,act,walkingMode,showNames,calm};
  useEffect(()=>{clockOffset.current=(serverTime??Date.now())-Date.now();},[serverTime]);
  useEffect(()=>{setMessage("");setEmoteMenu(false);},[current]);
  const mount = useRef<HTMLDivElement>(null), markers = useRef<HTMLDivElement>(null);
  const olympusLabel = useRef<HTMLDivElement>(null);
  const controls = useRef<Controls | null>(null), selectedRef = useRef(selected), onSelectRef = useRef(onSelect);
  const closeButton = useRef<HTMLButtonElement>(null), expandButton = useRef<HTMLButtonElement>(null);
  selectedRef.current = selected; onSelectRef.current = onSelect;
  const theme = islandThemes[selection[selected]?.id] ?? islandThemes.picture;
  const islands=journeyLayout(selection),selectedRealm=islands[selected],chapters=[...new Set(islands.map(n=>n.chapter))].map(chapter=>({chapter,nodes:islands.filter(n=>n.chapter===chapter)})),region=regionView===null?null:chapters.find(c=>c.chapter===regionView),activeChapter=regionView??selectedRealm?.chapter??0;
  const boss = isBoss(selection[selected]?.id);
  const selectionKey = selection.map(s => s.id).join(), crewKey = crew.map(p => `${p.id}:${p.color}:${JSON.stringify(p.look)}`).join(), trophyKey = JSON.stringify(trophies);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setCalm(reduced || mq.matches);
    update(); mq.addEventListener("change", update); return () => mq.removeEventListener("change", update);
  }, [reduced]);
  useEffect(() => {viewRef.current={mode:'island',chapter:null};controls.current?.focus(selected); setOverview(false);setRegionView(null); }, [selected]);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "Tab") {
        const list = mount.current?.parentElement?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])');
        if (!list?.length) return;
        const visible = [...list].filter(b => b.getClientRects().length > 0), first = visible[0], last = visible.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); expandButton.current?.focus(); };
  }, [fullscreen]);
  useEffect(() => {
    const host = mount.current; if (!host) return;
    let cancelled = false, stopFrames = () => {}; let dispose = () => {};
    setStatus("loading");
    void (async () => {
      try {
        const [T, { createJourneyScene }] = await Promise.all([import("three"), import("./journey-scene")]);
        if (cancelled) return;
        const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        const qualityController=new AdventureQuality(matchMedia('(pointer: coarse)').matches);
        let appliedQuality='',inView=true,lastRendered=0,renderCount=0;
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
        const canvas = renderer.domElement; canvas.setAttribute("aria-hidden", "true"); host.appendChild(canvas);
        let ownedWorld:ReturnType<typeof createJourneyScene>|undefined,released=false;const release=()=>{if(released)return;released=true;ownedWorld?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};dispose=release;
        const world = ownedWorld=createJourneyScene(T, selection, selectedRef.current, current, crew, completed, trophies);
        const faceKeys=new Map<string,string>();
        const camera = new T.OrthographicCamera(-30, 30, 20, -20, 0.1, 20000);
        const target = new T.Vector3(), desired = new T.Vector3();
        let viewSize = 40, desiredSize = 40, aspect = 1, width = 1, height = 1, isOverview = false,viewChapter:number|null=null,metricsDirty=true,followTravel=true,wasFollowingTravel=false;
        const bounds = world.bounds;
        const clamp = () => {
          desired.x = T.MathUtils.clamp(desired.x, bounds.x - bounds.width / 2 - 12, bounds.x + bounds.width / 2 + 12);
          desired.z = T.MathUtils.clamp(desired.z, bounds.z - bounds.depth / 2 - 45, bounds.z + bounds.depth / 2 + 12);
          desiredSize = T.MathUtils.clamp(desiredSize, 9, Math.max(350, (bounds.width + bounds.depth + 150) / aspect));
        };
        const focus = (index: number) => {
          const node = world.nodes[index]; if (!node) return;
          followTravel=index===current;
          desired.set(node.position[0], node.position[1] + (node.boss ? 3 : 1.2), node.position[2]);
          desiredSize = islandViewSize(node, aspect); isOverview = false;viewChapter=null;viewRef.current={mode:'island',chapter:null};setRegionView(null);setOverview(false);metricsDirty=true; world.setSelected(index); clamp();
        };
        const frameArea = (chapter:number|null) => {
          const areaNodes=world.nodes.filter(node=>chapter===null||node.chapter===chapter);
          const right = new T.Vector3(JOURNEY_CAMERA[2], 0, -JOURNEY_CAMERA[0]).normalize(), up = new T.Vector3(...JOURNEY_CAMERA).normalize().cross(right);
          const extents: { r: number; u: number }[] = [];
          const include = (x: number, y: number, z: number, radius: number, bottom: number, top: number) => {
            for (const dx of [-radius, radius]) for (const dz of [-radius, radius]) for (const dy of [bottom, top]) {
              const p = new T.Vector3(x + dx, y + dy, z + dz); extents.push({ r: p.dot(right), u: p.dot(up) });
            }
          };
          areaNodes.forEach(node => include(...node.position, node.radius + 2.3, -node.radius * 1.8, node.boss ? 13 : 6));
          if(chapter===null)include(world.olympus.x, world.olympus.y, world.olympus.z, 12, -6, 23);
          const minR = Math.min(...extents.map(p => p.r)), maxR = Math.max(...extents.map(p => p.r));
          const minU = Math.min(...extents.map(p => p.u)), maxU = Math.max(...extents.map(p => p.u));
          // Preserve the region's actual depth as well as its projected center.
          // Starting at the whole voyage center can put a distant short region
          // behind the near plane even though its 2D extents appear to fit.
          if(chapter===null)desired.set(bounds.x,0,bounds.z);else desired.copy(areaNodes.reduce((sum,n)=>sum.add(new T.Vector3(...n.position)),new T.Vector3()).multiplyScalar(1/areaNodes.length));
          desired.addScaledVector(right, (minR + maxR) / 2 - desired.dot(right));
          desired.addScaledVector(up, (minU + maxU) / 2 - desired.dot(up));
          // Compose the complete voyage inside the clear area above the caption,
          // keeping the departure islands and Olympus clear of the tool rail.
          const caption=host.parentElement?.querySelector<HTMLElement>('.journey-location');
          const safeTop=width<600?180:100,safeBottom=Math.max(205,caption?caption.offsetHeight+parseFloat(getComputedStyle(caption).bottom)+18:205),safeLeft=28,safeRight=85;
          const safeHeight=Math.max(80,height-safeTop-safeBottom),safeWidth=Math.max(80,width-safeLeft-safeRight);
          desiredSize = Math.max((maxU-minU+12)*height/safeHeight,(maxR-minR+12)*height/safeWidth);
          desired.addScaledVector(right,(safeRight-safeLeft)*0.5*desiredSize/height);
          desired.addScaledVector(up,-(safeBottom-safeTop)*0.5*desiredSize/height);
          isOverview = chapter===null;viewChapter=chapter;followTravel=false;viewRef.current={mode:chapter===null?'all':'region',chapter};setOverview(isOverview);setRegionView(chapter);metricsDirty=true; clamp();
        };
        const fullMap=()=>frameArea(null),regionMap=(chapter:number)=>{if(world.nodes.some(n=>n.chapter===chapter))frameArea(chapter);};
        const leaveArea=()=>{isOverview=false;viewChapter=null;followTravel=false;viewRef.current={mode:'island',chapter:null};setOverview(false);setRegionView(null);metricsDirty=true;};
        const zoomBy = (factor: number) => { desiredSize *= factor;leaveArea(); clamp(); };
        // Isometric camera basis: horizontal dragging follows the view, not the grid axes.
        const pan = (dx: number, dy: number) => {
          const scale = desiredSize / height;
          desired.x += (-dx * 0.88 + dy * 0.58) * scale;
          desired.z += (dx * 0.48 + dy * 1.05) * scale;
          leaveArea(); clamp();
        };
        controls.current = { focus,region:regionMap, zoom: zoomBy, overview: fullMap, pan };
        const resize = () => {
          width = host.clientWidth; height = Math.max(1, host.clientHeight); aspect = width / height;
            qualityController.resetWindow();lastRendered=0;
          renderer.setSize(width, height);metricsDirty=true;if (isOverview) fullMap();else if(viewChapter!==null)regionMap(viewChapter);
        };
        const observer = new ResizeObserver(resize); observer.observe(host); resize();const previousView=viewRef.current;if(previousView.mode==='all')fullMap();else if(previousView.mode==='region'&&previousView.chapter!==null)regionMap(previousView.chapter);else focus(selectedRef.current);
        const visibility=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;lastRendered=0;qualityController.resetWindow();},{rootMargin:'100px'});visibility.observe(host);
        target.copy(desired); viewSize = desiredSize;
        const raycaster = new T.Raycaster(), pointer = new T.Vector2();
        const floorPlane=new T.Plane(),walkPoint=new T.Vector3();let lastWalk=-1000;
        let hoveredCrew:string|null=null,hoverUntil=0,crewPress:string|null=null;
        const crewSprites=world.characters.flatMap(actor=>{const sprite=actor.root.getObjectByName('boss-style-avatar');return sprite?[sprite]:[];});
        const pickCrew=(e:PointerEvent)=>{if(isOverview||viewChapter!==null)return null;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const sprite=raycaster.intersectObjects(crewSprites.filter(sprite=>sprite.parent?.userData.avatarReady),false)[0]?.object;return sprite?world.characters.find(actor=>actor.root.children.includes(sprite))?.id??null:null;};
        const points = new Map<number, { x: number; y: number }>();
        let press = { x: 0, y: 0 }, moved = false, pinch = 0;
        const down = (e: PointerEvent) => { canvas.setPointerCapture(e.pointerId); points.set(e.pointerId, { x: e.clientX, y: e.clientY }); press = { x: e.clientX, y: e.clientY }; moved = false;crewPress=pickCrew(e);
          if (points.size === 2) { const p = [...points.values()]; pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); moved = true; } };
        const move = (e: PointerEvent) => {
          const old = points.get(e.pointerId); if (!old){hoveredCrew=pickCrew(e);hoverUntil=performance.now()+2500;return;}
          const dx = e.clientX - old.x, dy = e.clientY - old.y; points.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) moved = true;
          if (points.size === 2) { const p = [...points.values()], distance = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); if (distance > 1 && pinch > 1) zoomBy(pinch / distance); pinch = distance; }
          else if (moved) pan(dx, dy);
        };
        const up = (e: PointerEvent) => {
          if (!points.has(e.pointerId)) return;
          points.delete(e.pointerId);
          if(!moved&&e.type!=='pointercancel'&&crewPress){hoveredCrew=crewPress;hoverUntil=performance.now()+4500;const actor=crew.find(p=>p.id===crewPress);setMessage(actor?.name??'Crewmitglied');crewPress=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(!points.size)pinch=0;return;}
          crewPress=null;
          if (!moved && e.type !== "pointercancel") {
            const rect = canvas.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(world.pickables, false).find(h => {
              const index = h.object.userData.islandIndex ?? h.object.userData.islandIndices?.[h.instanceId ?? -1]; return typeof index === "number" && index >= 0;
            });
            if (hit) {
              const index = hit.object.userData.islandIndex ?? hit.object.userData.islandIndices?.[hit.instanceId ?? -1];
              const travel=live.current.travel,now=Date.now()+clockOffset.current,locked=travel&&now>=travel.at&&now<travel.at+travel.duration;
              if(index===current&&!locked&&!isOverview&&viewChapter===null&&live.current.canMove&&live.current.walkingMode&&live.current.act&&performance.now()-lastWalk>300){
                const node=world.nodes[current];floorPlane.set(new T.Vector3(0,1,0),-node.position[1]-journeyWalkHeight(node)-.05);
                if(raycaster.ray.intersectPlane(floorPlane,walkPoint)){
                  lastWalk=performance.now();void live.current.act({type:"mapMove",index:current,x:(walkPoint.x-node.position[0])/node.radius,z:(walkPoint.z-node.position[2])/node.radius}).then(ok=>setMessage(ok?"Deine Figur läuft zum Ziel.":"Dieses Laufziel ist gerade nicht verfügbar."));
                }
              } else {onSelectRef.current(index); focus(index);}
            }
          }
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
          if (!points.size) pinch = 0;
        };
        const wheel = (e: WheelEvent) => { e.preventDefault(); zoomBy(Math.exp(T.MathUtils.clamp(e.deltaY, -100, 100) * 0.002)); };
        const lost = (e: Event) => { e.preventDefault(); cancelled=true; dispose(); setStatus("fallback"); };
        canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("wheel", wheel, { passive: false }); canvas.addEventListener("webglcontextlost", lost);
        const labelElements = [...(markers.current?.querySelectorAll<HTMLButtonElement>("[data-island]") ?? [])];
        const crewLabels=[...(avatarLabels.current?.querySelectorAll<HTMLElement>("[data-player]")??[])];
        const obstacleSelector='.atlas-title,.atlas-badge,.atlas-tools,.journey-location,.atlas-social,.atlas-walk-controls,.atlas-hint,.atlas-pan,.journey-map-controls';let obstacles=[...(host.parentElement?.querySelectorAll<HTMLElement>(obstacleSelector)??[])];
        const labelSizes=new Map<HTMLElement,{width:number;height:number}>();let blocked:MapRect[]=[],captionTop=height-205,previousTrip='',lastTripObserved=0;
        const hudObserver=new ResizeObserver(()=>{metricsDirty=true;if(isOverview)fullMap();else if(viewChapter!==null)regionMap(viewChapter);});obstacles.forEach(el=>hudObserver.observe(el));
        const projected = new T.Vector3(); let previous = -100, previousZoom = -1, last = performance.now(), start = last;
        const draw = (now: number) => {
          const calm=live.current.calm;
          if(document.hidden||!inView){lastRendered=0;qualityController.resetWindow();return;}
          const tier=qualityController.choose(qualityRef.current),profile=qualityProfiles[tier];
          if(now-previous<1000/profile.fps-1)return;previous=now;
          const frameStart=performance.now();
          const ratio=Math.min(devicePixelRatio||1,profile.dpr);
          if(appliedQuality!==tier||renderer.getPixelRatio()!==ratio){appliedQuality=tier;renderer.setPixelRatio(ratio);qualityController.resetWindow();qualityController.metrics={p95:0,renderP95:0,samples:0};lastRendered=0;}
          const dt = Math.min(0.1, (now - last) / 1000); last = now;
          const syncedNow=Date.now()+clockOffset.current;world.update((now-start)/1000,calm,{now:syncedNow,moves:live.current.moves,travel:live.current.travel,emotes:live.current.emotes});
          const currentTravel=live.current.travel,travelling=currentTravel&&currentTravel.to===current&&syncedNow<currentTravel.at+currentTravel.duration&&syncedNow>=currentTravel.at,transit=currentTravel?world.transitAt(currentTravel,syncedNow):null;
          const tripState=world.scene.userData.transit,tripKey=transit&&!calm?`${tripState.kind}:${tripState.phase}`:'';if(tripKey!==previousTrip){const cue=journeyTransitCue(previousTrip,tripKey,syncedNow-lastTripObserved);if(cue&&sound.ctx?.state==='running')sound.play(cue);previousTrip=tripKey;setTrip(tripKey?{kind:tripState.kind,phase:tripState.phase}:null);}lastTripObserved=syncedNow;
          if(travelling&&!calm&&followTravel&&!isOverview&&viewChapter===null&&selectedRef.current===current&&!points.size){
            if(transit){
              const right=new T.Vector3(JOURNEY_CAMERA[2],0,-JOURNEY_CAMERA[0]).normalize(),up=new T.Vector3(...JOURNEY_CAMERA).normalize().cross(right),points=(transit.kind==='bridge'?[]:transitVesselPoints(transit)).map(p=>new T.Vector3(...p));world.characters.forEach(actor=>{points.push(actor.root.position.clone(),actor.root.position.clone().add(new T.Vector3(0,1.4,0)));});
              const r=points.map(p=>p.dot(right)),u=points.map(p=>p.dot(up)),minR=Math.min(...r),maxR=Math.max(...r),minU=Math.min(...u),maxU=Math.max(...u),top=width<600?180:100,bottom=Math.max(180,height-captionTop+18),left=28,rail=85;
              desiredSize=Math.max(14,(maxU-minU+4)*height/Math.max(100,height-top-bottom),(maxR-minR+4)*height/Math.max(100,width-left-rail));desired.fromArray(transit.position);desired.addScaledVector(right,(minR+maxR)/2-desired.dot(right));desired.addScaledVector(up,(minU+maxU)/2-desired.dot(up));desired.addScaledVector(right,(rail-left)*.5*desiredSize/height);desired.addScaledVector(up,-(bottom-top)*.5*desiredSize/height);
            }else if(world.nodes[currentTravel.from]){const f=(syncedNow-currentTravel.at)/currentTravel.duration;desired.copy(world.routePoint(currentTravel.from,current,f));desired.y+=2;desiredSize=Math.max(desiredSize,islandViewSize(world.nodes[current],aspect)*1.1);}
            if(!wasFollowingTravel){target.copy(desired);viewSize=desiredSize;}wasFollowingTravel=true;
          }else if(wasFollowingTravel){if((calm||!travelling)&&!isOverview&&viewChapter===null&&selectedRef.current===current)focus(current);wasFollowingTravel=false;}
          const ease = calm ? 1 : 1 - Math.exp(-dt * 6); target.lerp(desired, ease); viewSize += (desiredSize - viewSize) * ease;
          camera.left = -viewSize * aspect / 2; camera.right = viewSize * aspect / 2; camera.top = viewSize / 2; camera.bottom = -viewSize / 2; camera.updateProjectionMatrix();
          const cameraDistance=Math.max(1,viewSize/130);
          if(world.scene.fog instanceof T.FogExp2)world.scene.fog.density=0.0018/cameraDistance;
          camera.position.set(target.x + JOURNEY_CAMERA[0]*cameraDistance, target.y + JOURNEY_CAMERA[1]*cameraDistance, target.z + JOURNEY_CAMERA[2]*cameraDistance); camera.lookAt(target); camera.updateMatrixWorld();
          world.characters.forEach((actor,i)=>{
            const source=avatarSource.current?.children[i],key=source?.getAttribute("data-face")??"idle";
            if(source&&faceKeys.get(actor.id)!==key){const svg=source.querySelector("svg");if(svg){actor.setAvatar(svg);faceKeys.set(actor.id,key);}}
          });
          renderer.render(world.scene, camera);
          crewLabels.forEach(el=>{
            const actor=world.characters.find(c=>c.id===el.dataset.player);if(!actor)return;
            projected.copy(actor.root.position).add(new T.Vector3(0,1.85,0)).project(camera);
            const aboard=tripState?.visible,identified=live.current.showNames||actor.id===me||actor.id===hoveredCrew&&now<hoverUntil||actor.root.userData.emote!==null||!aboard&&(crew.length<=4||!travelling&&actor.root.userData.walking);el.style.display=Math.abs(projected.x)<0.93&&Math.abs(projected.y)<0.88&&viewSize<110&&identified?"":"none";
            el.style.left=`${(projected.x*0.5+0.5)*width}px`;el.style.top=`${(-projected.y*0.5+0.5)*height}px`;
          });
          if(metricsDirty){
            const nextObstacles=[...(host.parentElement?.querySelectorAll<HTMLElement>(obstacleSelector)??[])];obstacles.filter(el=>!nextObstacles.includes(el)).forEach(el=>hudObserver.unobserve(el));nextObstacles.filter(el=>!obstacles.includes(el)).forEach(el=>hudObserver.observe(el));obstacles=nextObstacles;
            // Batch the writes and then the reads. Hidden labels are measured
            // once here, not by forcing layout in every animation frame.
            const elements=[...labelElements,...(olympusLabel.current?[olympusLabel.current]:[])];elements.forEach(el=>el.style.display='');
            elements.forEach(el=>labelSizes.set(el,{width:el.offsetWidth,height:el.offsetHeight}));
            const bounds=host.getBoundingClientRect();blocked=obstacles.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {left:b.left-bounds.left,top:b.top-bounds.top,width:b.width,height:b.height};});captionTop=(obstacles.find(el=>el.classList.contains('journey-location'))?.getBoundingClientRect().top??bounds.bottom-205)-bounds.top;metricsDirty=labelElements.length>0&&labelElements.every(el=>!labelSizes.get(el)?.width);
          }
          // Selected/current and boss labels win space before ordinary labels.
          const ordered = [...labelElements].sort((a, b) => {
            const priority = (e: HTMLButtonElement) => Number(e.dataset.island) === selectedRef.current ? 0 : Number(e.dataset.island) === current ? 1 : world.nodes[Number(e.dataset.island)].boss ? 2 : 3;
            return priority(a) - priority(b);
          });
          const candidates:{id:string;x:number;y:number;width:number;height:number}[]=[];
          if(olympusLabel.current){projected.copy(world.olympus).add(new T.Vector3(0,-1,11)).project(camera);if(Math.abs(projected.x)<.98&&Math.abs(projected.y)<.9)candidates.push({id:'olympus',x:(projected.x*.5+.5)*width,y:(-projected.y*.5+.5)*height,...labelSizes.get(olympusLabel.current)!});}
          ordered.forEach(el => {
            const node = world.nodes[Number(el.dataset.island)], [x, y, z] = node.position;
            projected.set(x, y + 0.5, z + node.radius + 1.8).project(camera);
            const px = (projected.x * 0.5 + 0.5) * width, py = (-projected.y * 0.5 + 0.5) * height;
            const inView = Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.86 && projected.z > -1 && projected.z < 1;
            if(inView&&(viewChapter===null||node.chapter===viewChapter))candidates.push({id:el.dataset.island!,x:px,y:py,...labelSizes.get(el)!});
          });
          const placed=layoutJourneyLabels(candidates,width,height,blocked);
          for(const el of[...labelElements,...(olympusLabel.current?[olympusLabel.current]:[])]){const box=placed.get(el===olympusLabel.current?'olympus':el.dataset.island!);el.style.display=box?'':'none';if(box){el.style.left=`${box.left+box.width/2}px`;el.style.top=`${box.top}px`;}}
          const percent = Math.round(40 / viewSize * 100); if (percent !== previousZoom) { previousZoom = percent; setZoom(percent); }
          canvas.dataset.avatarStyle="boss-sprite";
          canvas.dataset.readyAvatars=String(world.characters.filter(c=>c.root.userData.avatarReady).length);
          canvas.dataset.mapView=isOverview?'all':viewChapter!==null?'region':'island';canvas.dataset.regionChapter=viewChapter===null?'':String(viewChapter);
          canvas.dataset.transit=JSON.stringify(tripState);
          canvas.dataset.plaza=JSON.stringify(world.scene.userData.plaza);
          canvas.dataset.cameraPosition=camera.position.toArray().join(',');
          canvas.dataset.memory=JSON.stringify(renderer.info.memory);
          qualityController.sample(lastRendered?now-lastRendered:0,performance.now()-frameStart,qualityRef.current);lastRendered=now;renderCount++;
          Object.assign(canvas.dataset,{quality:tier,targetFps:String(profile.fps),renderCount:String(renderCount),pixelRatio:String(renderer.getPixelRatio()),bufferWidth:String(canvas.width),bufferHeight:String(canvas.height),frameP95:qualityController.metrics.p95.toFixed(2),renderP95:qualityController.metrics.renderP95.toFixed(2)});
          Object.assign(canvas.dataset, { journeyFrame: ((now - start) / 1000).toFixed(2), islandCount: String(world.nodes.length), selectedIsland: String(selectedRef.current), viewSize: viewSize.toFixed(2), cameraTarget: target.toArray().map(n => n.toFixed(2)).join(","), drawCalls: String(renderer.info.render.calls),crewPositions:JSON.stringify(world.characters.map(c=>({id:c.id,position:c.root.position.toArray(),walking:c.root.userData.walking,emote:c.root.userData.emote}))),travelling:String(!!travelling) });
        };
        let disposed=false;dispose = () => { if(disposed)return;disposed=true;stopFrames(); controls.current = null; observer.disconnect();hudObserver.disconnect();visibility.disconnect();
          canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); canvas.removeEventListener("wheel", wheel); canvas.removeEventListener("webglcontextlost", lost);
          release(); };
        stopFrames=startVisibleFrameLoop(draw,stamp=>{previous=-100;last=stamp;lastRendered=0;qualityController.resetWindow();}); setStatus("ready");
      } catch { dispose();if (!cancelled) setStatus("fallback"); }
    })();
    return () => { cancelled = true; dispose(); };
  }, [selectionKey, current, crewKey, completed, trophyKey, fullscreen,retry]);
  const go = (i: number) => { onSelect(i); controls.current?.focus(i); };
  const own=crew.find(p=>p.id===me);
  const sendEmote=async(id:number)=>{setEmoteMenu(false);const ok=await act?.({type:"emote",emote:id});setMessage(ok?`${emoteNames[id]} gesendet.`:"Dein Emote ist gleich wieder bereit.");};
  const content = <div inert={cinematic||undefined} aria-hidden={cinematic||undefined} className={`journey-world journey-atlas journey-${status} ${cinematic?'atlas-cinematic':''} ${fullscreen ? "atlas-fullscreen" : ""} ${overview ? "atlas-overview" : ""}`} role={fullscreen ? "dialog" : undefined} aria-modal={fullscreen ? true : undefined} aria-label={fullscreen ? "Die große Inselwelt" : undefined}>
    <div className="journey-canvas" ref={mount}/><div className="journey-world-shade"/>
    <header className="atlas-title"><Compass size={19}/><div><span>PARTY OLYMP · WELTENATLAS</span><strong>{selection.length} {selection.length===1?'Insel':'Inseln'}. Eine Legende.</strong></div></header>
    <div className="atlas-badge"><span>{overview ? "DIE GESAMTE ODYSSEE" : (region?.nodes[0].realm??selectedRealm?.realm)?.toLocaleUpperCase("de")}</span><label className="atlas-quality">Grafik<select aria-label="Grafikqualität der Weltkarte" value={quality} onChange={e=>setQuality(validQuality(e.target.value))}><option value="auto">Automatisch</option><option value="high">Hoch</option><option value="medium">Mittel</option><option value="low">Sparsam</option></select></label></div>
    <div className="atlas-markers" ref={markers} aria-label="Inseln auf der Karte">{selection.map((s, i) => <button key={i} data-island={i} className={`atlas-marker ${isBoss(s.id) ? "is-boss" : ""} ${selected === i ? "is-selected" : ""} ${i < completed ? "is-complete" : ""}`} onClick={() => go(i)} aria-label={`Insel ${i + 1}: ${byId(s.id).name}`} aria-pressed={selected === i}>
      <b>{i < completed ? "✓" : i + 1}</b><span>{byId(s.id).name}</span>{i === current && <small>CREW</small>}
    </button>)}</div>
    <div className="atlas-olympus" ref={olympusLabel}>OLYMP<span>DAS ZIEL EURER REISE</span></div>
    <div className="atlas-avatars" ref={avatarLabels} aria-label="Die Crew auf der Karte">{crew.map((p,i)=>{
      const active=emotes.findLast(e=>e.player===p.id&&(serverTime??Date.now())-e.at<4500);
      return <div key={p.id??i} data-player={p.id??`crew-${i}`} data-emote={active?.emote??""} className={`atlas-avatar-label ${p.id===me?"is-me":""} ${active?"is-emoting":""}`}>
        {active&&<div className="atlas-reaction"><strong>{emoteNames[active.emote]}</strong></div>}
        <span>{p.name??`Crew ${i+1}`}{p.id===me?" · DU":""}</span>
      </div>;
    })}</div>
    <div ref={avatarSource} aria-hidden="true" style={{display:"none"}}>{crew.map((p,i)=>{const active=emotes.findLast(e=>e.player===p.id&&(serverTime??Date.now())-e.at>=0&&(serverTime??Date.now())-e.at<4500);return <span key={p.id??i} data-face={active?.id??active?.emote??"idle"}><Avatar avatar={p.avatar} color={p.color} look={p.look} emote={active?.emote??-1}/></span>;})}</div>
    {status !== "ready" && <div className="journey-world-fallback"><Compass size={40}/><strong>{status === "loading" ? "Die Himmelsinseln erwachen …" : "Euer Weg steht in den Sternen."}</strong><span>Jede Disziplin hat ihre eigene Insel. Erkunde sie über die Etappenliste.</span>{status==='fallback'&&<button className="scene-retry" type="button" onClick={()=>setRetry(n=>n+1)}>3D erneut laden</button>}</div>}
    <div className="atlas-tools" aria-label="Kartensteuerung">
      <button aria-label="Karte vergrößern" disabled={status !== "ready"} onClick={() => controls.current?.zoom(0.78)}><Plus size={17}/></button>
      <output aria-label="Kartenzoom">{zoom}%</output>
      <button aria-label="Karte verkleinern" disabled={status !== "ready"} onClick={() => controls.current?.zoom(1.28)}><Minus size={17}/></button>
      <i/>
      <button aria-label="Alle Inseln anzeigen" aria-pressed={overview} title="Alle Inseln" disabled={status !== "ready"} onClick={() => controls.current?.overview()}><MapIcon size={17}/></button>
      <button aria-label="Reisegebiet ansehen" aria-pressed={regionView!==null} title="Reisegebiet" disabled={status !== "ready"} onClick={()=>controls.current?.region(activeChapter)}><Compass size={17}/></button>
      <button aria-label="Zur Crew springen" title="Zur Crew" onClick={() => go(current)}><Crosshair size={17}/></button>
      <button aria-label="Crew-Namen anzeigen" aria-pressed={showNames} title={showNames?'Crew-Namen ausblenden':'Crew-Namen einblenden'} disabled={status!=="ready"} onClick={()=>setShowNames(value=>!value)}><Users size={17}/></button>
      {canMove&&<button aria-label="Auf der Insel laufen" disabled={transitLocked} title="Auf der aktuellen Insel laufen" aria-pressed={walkingMode} onClick={()=>setWalkingMode(v=>!v)}><Footprints size={17}/></button>}
      {fullscreen ? <button ref={closeButton} aria-label="Große Karte schließen" onClick={() => setFullscreen(false)}><X size={18}/></button> : <button ref={expandButton} aria-label="Karte im Vollbild öffnen" title="Große Karte" onClick={() => setFullscreen(true)}><Expand size={17}/></button>}
    </div>
    <div className="journey-location">{trip&&<div className="atlas-transit-status" role="status">{trip.kind==='bridge'?(trip.phase==='gather'?'Zur Brücke':trip.phase==='landing'?'Die Crew erreicht die Insel':'Gemeinsam über die Brücke'):trip.phase==='gather'?'Alle an den Anleger':trip.phase==='boarding'?'Die Crew steigt ein':trip.phase==='landing'?'Anlegen und aussteigen':'Gemeinsam unterwegs'} <b>{trip.kind==='bridge'?'Zu Fuß':trip.kind==='ferry'?'Wolkenfähre':'Luftschiff'}</b></div>}<span>{overview ? "DIE GESAMTE ODYSSEE" : region?'EIN GEBIET EURER REISE':`${selected < completed ? "ERKUNDET" : selected === current ? "EURE AKTUELLE INSEL" : "NOCH ZU ENTDECKEN"} · ${String(selected + 1).padStart(2, "0")}`}</span><h3>{overview ? "Eure Reise zum Olymp" : region?region.nodes[0].realm:theme.name}</h3><p>{overview ? "Wähle ein Gebiet, um seine Inseln näher zu erkunden." : region?`Etappen ${region.nodes[0].index+1}–${region.nodes.at(-1)!.index+1} · ${region.nodes.length} ${region.nodes.length===1?'Insel':'Inseln'}`:theme.subtitle}</p>{!region&&<small>{overview ? `${selection.length} ${selection.length===1?'Insel':'Inseln'} · ${selection.filter(s => isBoss(s.id)).length} Boss-Reiche` : `${byId(selection[selected].id).name} ${boss ? "· Monumentales Boss-Reich" : "· Eigene Minispiel-Insel"}`}</small>}
      {(overview||region)&&<nav className="atlas-region-nav" aria-label="Reisegebiete erkunden"><button aria-label="Vorheriges Reisegebiet" disabled={status!=='ready'||activeChapter<=0} onClick={()=>controls.current?.region(activeChapter-1)}><ChevronLeft size={18}/></button><select aria-label="Reisegebiet" value={regionView??''} disabled={status!=='ready'} onChange={e=>{if(e.target.value!=='')controls.current?.region(Number(e.target.value));}}><option value="" disabled>Gebiet auswählen …</option>{chapters.map(c=><option key={c.chapter} value={c.chapter}>{c.chapter+1}. {c.nodes[0].realm}</option>)}</select><button aria-label="Nächstes Reisegebiet" disabled={status!=='ready'||activeChapter>=chapters.length-1} onClick={()=>controls.current?.region(activeChapter+1)}><ChevronRight size={18}/></button></nav>}
    </div>
    <div className="journey-map-controls"><button aria-label="Vorherige Insel" disabled={selected <= 0} onClick={() => go(selected - 1)}><ChevronLeft size={18}/></button><button aria-label="Nächste Insel" disabled={selected >= selection.length - 1} onClick={() => go(selected + 1)}><ChevronRight size={18}/></button></div>
    <div className="atlas-hint">{overview||region?'Insel wählen: näher ansehen · ':canMove&&walkingMode?"Boden: laufen · Figur: Name · ":""}Ziehen: Karte erkunden · Scrollen / zwei Finger: Zoom</div>
    <div className="atlas-social"><button aria-label="Karten-Emotes öffnen" onClick={()=>setEmoteMenu(v=>!v)}><Smile size={17}/><span>Emotes</span></button>{favorites.slice(0,4).map(id=><button key={id} aria-label={`Karten-Emote: ${emoteNames[id]}`} onClick={()=>void sendEmote(id)}><Avatar avatar={own?.avatar} color={own?.color} look={own?.look} emote={id}/></button>)}</div>
    {emoteMenu&&<div className="atlas-emote-menu"><EmotePicker avatar={own?.avatar} color={own?.color} look={own?.look} onSend={id=>void sendEmote(id)} favorites={favorites} onFavorites={setFavorites} onClose={()=>setEmoteMenu(false)}/></div>}
    <div className="atlas-feedback" role="status">{message}</div>
    {canMove&&walkingMode&&selected===current&&!transitLocked&&!overview&&regionView===null&&<div className="atlas-walk-controls" aria-label="Deine Figur bewegen">{[{label:"links",x:-0.68,z:0,arrow:"←"},{label:"nach hinten",x:0,z:-0.68,arrow:"↑"},{label:"nach vorne",x:0,z:0.68,arrow:"↓"},{label:"rechts",x:0.68,z:0,arrow:"→"}].map(d=><button key={d.label} aria-label={`Figur ${d.label} bewegen`} onClick={()=>void act?.({type:"mapMove",index:current,x:d.x,z:d.z})}>{d.arrow}</button>)}</div>}
    <div className="atlas-pan" aria-label="Karte mit Tasten verschieben"><button aria-label="Karte nach links" disabled={status !== "ready"} onClick={() => controls.current?.pan(90, 0)}>←</button><button aria-label="Karte nach oben" disabled={status !== "ready"} onClick={() => controls.current?.pan(0, 90)}>↑</button><button aria-label="Karte nach unten" disabled={status !== "ready"} onClick={() => controls.current?.pan(0, -90)}>↓</button><button aria-label="Karte nach rechts" disabled={status !== "ready"} onClick={() => controls.current?.pan(-90, 0)}>→</button></div>
  </div>;
  return fullscreen ? createPortal(content, document.body) : content;
}
