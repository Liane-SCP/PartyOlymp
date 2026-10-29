"use client";
import {startVisibleFrameLoop} from "@/lib/visible-frame-loop";
import {useEffect,useRef,type MutableRefObject} from 'react';
import {AdventureQuality,qualityProfiles,type QualityChoice} from '@/lib/adventure-quality';
import {ceremonyCrewCamera} from '@/lib/ceremony';
import {Avatar} from './art';
import type {CeremonyPlayer} from './victory-ceremony';

export function CeremonyWorld({players,time,calm,intense,selected,quality,onStatus,retry=0}:{players:CeremonyPlayer[];time:MutableRefObject<number>;calm:boolean;intense:boolean;selected:string;quality:QualityChoice;onStatus:(s:'loading'|'ready'|'fallback')=>void;retry?:number}){
 const mount=useRef<HTMLDivElement>(null),source=useRef<HTMLDivElement>(null),live=useRef({calm,intense,selected,quality});live.current={calm,intense,selected,quality};
 const signature=JSON.stringify(players.map(p=>[p.id,p.name,p.rank,p.points,p.avatar,p.color,p.look]));
 useEffect(()=>{
  const container=mount.current;if(!container)return;let cancelled=false,stopFrames=()=>{},teardown=()=>{};onStatus('loading');
  async function start(){try{
   const [T,{createCeremonyScene}]=await Promise.all([import('three'),import('./ceremony-scene')]);if(cancelled)return;
   const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});let arena:ReturnType<typeof createCeremonyScene>|null=null,observer:ResizeObserver|null=null,visibility:IntersectionObserver|null=null,released=false;const canvas=renderer.domElement;
   const lost=(e:Event)=>{e.preventDefault();cancelled=true;teardown();onStatus('fallback');};
   teardown=()=>{if(released)return;released=true;stopFrames();observer?.disconnect();visibility?.disconnect();canvas.removeEventListener('webglcontextlost',lost);arena?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
   renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;canvas.setAttribute('aria-hidden','true');container!.appendChild(canvas);canvas.addEventListener('webglcontextlost',lost);
   arena=createCeremonyScene(T,players);const world=arena,camera=new T.PerspectiveCamera(37,1,.1,180),controller=new AdventureQuality(container!.clientWidth<600);let width=0,height=0,ratio=0,previous=0,painted=0,inView=true,snapshot=0,first=true;
   const resize=()=>{const w=container!.clientWidth,h=container!.clientHeight;if(w<=0||h<=0||w===width&&h===height)return;width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
   const apply=()=>{const tier=controller.choose(live.current.quality),next=Math.min(devicePixelRatio,qualityProfiles[tier].dpr);if(next!==ratio){ratio=next;renderer.setPixelRatio(next);width=height=0;resize();}return tier;};
   observer=new ResizeObserver(resize);observer.observe(container!);visibility=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(!inView){painted=0;controller.resetWindow();}},{rootMargin:'100px'});visibility.observe(container!);apply();resize();
   const nodes=source.current?.querySelectorAll('[data-ceremony-avatar]');const loaded=await Promise.all(world.actors.map((actor,i)=>{const svg=nodes?.[i]?.querySelector('svg');return svg?actor.setAvatar(svg):Promise.resolve(false);}));if(cancelled){teardown();return;}if(loaded.some(ok=>!ok))throw new Error('Crew appearance unavailable');
   world.update(10,false,true,live.current.selected);const fit=ceremonyCrewCamera(14,width,height,true,world.layout);camera.position.fromArray(fit.position);camera.lookAt(new T.Vector3(...fit.target));await renderer.compileAsync(world.scene,camera);if(cancelled){teardown();return;}canvas.dataset.preparedPrograms=String(renderer.info.programs?.length??0);canvas.dataset.shaderPreparation='ready';
   const draw=(stamp:number)=>{const tier=apply(),profile=qualityProfiles[tier];if(document.hidden||!inView||width<=0||height<=0){previous=painted=0;controller.resetWindow();return;}if(stamp-previous<1000/profile.fps-1)return;previous=stamp;const current=live.current,t=time.current,lens=ceremonyCrewCamera(t,width,height,current.calm,world.layout);camera.position.fromArray(lens.position);camera.lookAt(new T.Vector3(...lens.target));world.update(t,current.calm,current.intense,current.selected);const began=performance.now();renderer.render(world.scene,camera);if(painted)controller.sample(stamp-painted,performance.now()-began,current.quality);painted=stamp;
    if(first){first=false;canvas.dataset.firstPrograms=String(renderer.info.programs?.length??0);}if(stamp-snapshot>250){snapshot=stamp;Object.assign(canvas.dataset,{ceremonyTime:t.toFixed(2),cameraPosition:camera.position.toArray().join(','),cameraTarget:JSON.stringify(lens.target),safe:JSON.stringify(lens.safe),fireworks:String(world.scene.userData.fireworksActive===true),quality:tier,readyAvatars:String(world.actors.filter(a=>a.root.userData.avatarReady).length),programs:String(renderer.info.programs?.length??0),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),textures:String(renderer.info.memory.textures),geometries:String(renderer.info.memory.geometries),frameP95:String(controller.metrics.p95),renderP95:String(controller.metrics.renderP95),crew:JSON.stringify(world.actors.map(a=>({id:a.id,rank:a.rank,position:a.root.position.toArray(),visible:a.root.visible,selected:!!a.root.userData.selected,style:a.root.userData.avatarStyle}))) });}
   };stopFrames=startVisibleFrameLoop(draw,()=>{previous=painted=0;controller.resetWindow();});onStatus('ready');
  }catch{teardown();if(!cancelled)onStatus('fallback');}}
  void start();return()=>{cancelled=true;teardown();};
 },[signature,retry]);
 return <><div className="ceremony-viewport" ref={mount}/><div ref={source} hidden aria-hidden="true">{players.map(p=><span key={p.id} data-ceremony-avatar={p.id}><Avatar avatar={p.avatar} color={p.color} look={p.look} emote={4}/></span>)}</div></>;
}
