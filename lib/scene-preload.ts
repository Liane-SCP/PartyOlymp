export type SceneAsset={path:string;bytes:number};
export type ScenePreloadPlan={key:string;id:string;assets:readonly SceneAsset[]};
export function nextSceneTarget(room:any):{key:string;id:string}|null{
 if(!room||!['travel','rules','countdown','playing','reveal','standings','paused'].includes(room.phase))return null;
 const index=room.index+(['reveal','standings','paused'].includes(room.phase)?1:0),id=room.selection?.[index]?.id;
 return typeof id==='string'?{key:`${room.code}:${index}:${id}`,id}:null;
}

/** Raw model bytes only. No scene, Three instance or GPU resource lives in this cache. */
export class ScenePreloader{
 private buffers=new Map<string,ArrayBuffer>();private controller:AbortController|null=null;private key='';private pending:Promise<void>=Promise.resolve();
 private jobs=new Map<string,Promise<void>>();private queue:SceneAsset[]=[];
 private loaded=0;private failed=0;private paused=false;private resumeWork:(()=>Promise<void>)|null=null;
 constructor(private fetcher:typeof fetch=globalThis.fetch.bind(globalThis),readonly limit=24*1024*1024){}
 start(plan:ScenePreloadPlan){
  if(this.key===plan.key){
   if(this.paused){this.paused=false;const resume=this.resumeWork;if(resume)this.pending=this.pending.then(resume);}
   return this.pending;
  }
  this.stop();this.key=plan.key;this.loaded=0;this.failed=0;const controller=this.controller=new AbortController();
  let budget=0;const queue=this.queue=plan.assets.filter((a,i,all)=>/^\/(adventure-models|boss-models)\/[\w/-]+\.glb$/.test(a.path)&&a.bytes>0&&Number.isSafeInteger(a.bytes)&&all.findIndex(x=>x.path===a.path)===i).filter(a=>{if(budget+a.bytes>this.limit)return false;budget+=a.bytes;return true;});
  const worker=async()=>{while(queue.length&&!this.paused&&!controller.signal.aborted){const asset=queue.shift()!;const job=(async()=>{try{const response=await this.fetcher(asset.path,{signal:controller.signal,cache:'force-cache',credentials:'same-origin'});if(!response.ok)throw Error('Asset unavailable');const bytes=await response.arrayBuffer();if(controller.signal.aborted)return;if(bytes.byteLength!==asset.bytes)throw Error('Asset size changed');this.buffers.set(asset.path,bytes);this.loaded++;}catch{if(!controller.signal.aborted)this.failed++;}})();this.jobs.set(asset.path,job);await job;if(this.jobs.get(asset.path)===job)this.jobs.delete(asset.path);}};
  this.resumeWork=()=>Promise.all([worker(),worker()]).then(()=>{});
  this.pending=this.resumeWork();return this.pending;
 }
 take(path:string){const bytes=this.buffers.get(path);this.buffers.delete(path);return bytes;}
 async read(path:string){await this.jobs.get(path);return this.take(path);}
 pause(){this.paused=true;}
 stop(){this.controller?.abort();this.controller=null;this.key='';this.paused=false;this.resumeWork=null;this.buffers.clear();this.jobs.clear();this.queue.length=0;}
 stats(){return{key:this.key,loaded:this.loaded,failed:this.failed,files:this.buffers.size,bytes:[...this.buffers.values()].reduce((n,b)=>n+b.byteLength,0)};}
}
export const scenePreloader=new ScenePreloader();
