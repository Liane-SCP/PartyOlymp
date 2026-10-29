'use client';
import {useEffect} from 'react';
import {nextSceneTarget,scenePreloader} from '@/lib/scene-preload';
import {scenePreloadAssets} from '@/lib/scene-preload-assets';
import {prepareSceneModules} from './scene-modules';

export function useScenePreparation(room:any){
 const target=nextSceneTarget(room),key=target?.key??'',id=target?.id??'',allowed=!!target&&room.phase!=='playing';
 useEffect(()=>()=>scenePreloader.stop(),[]);
 useEffect(()=>{
  const assets=scenePreloadAssets[id as keyof typeof scenePreloadAssets];
  if(!key||!assets){scenePreloader.stop();return;}
  if(!allowed){scenePreloader.pause();return;}
  const connection=(navigator as Navigator&{connection?:EventTarget&{saveData?:boolean;effectiveType?:string}}).connection;
  let timer:ReturnType<typeof setTimeout>|undefined,generation=0;
  const prepare=()=>{const current=++generation;clearTimeout(timer);document.documentElement.dataset.scenePreparation=JSON.stringify({id,status:'waiting'});if(document.hidden||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType??'')){scenePreloader.pause();return;}timer=setTimeout(()=>{void Promise.allSettled([scenePreloader.start({key,id,assets}),prepareSceneModules(id)]).then(results=>{if(current===generation)document.documentElement.dataset.scenePreparation=JSON.stringify({id,status:'prepared',modules:results[1].status==='fulfilled'?'ready':'failed',...scenePreloader.stats()});});},700);};
  document.addEventListener('visibilitychange',prepare);connection?.addEventListener('change',prepare);prepare();
  return()=>{generation++;clearTimeout(timer);scenePreloader.pause();document.removeEventListener('visibilitychange',prepare);connection?.removeEventListener('change',prepare);};
 },[key,id,allowed]);
}
