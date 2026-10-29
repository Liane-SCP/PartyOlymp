import * as T from 'three';
import {createAdventureModels} from './adventure-models';
import {batchStaticMeshes} from './static-batches';
import {createDiceCrewTable} from './dice-crew-table';
import type {MapCharacter} from './journey-characters';
import {diceTotal} from '@/lib/game/games/dice';
import {diceTableLayout} from '@/lib/dice-presentation';
import {createSalonRoom} from './salon-room';

/** The salon has its own architecture and seating; no shared island arena. */
export function createSalon(scene:T.Scene,crew:MapCharacter[],me:string){
 const players=crew.length;
 const layout=diceTableLayout(players);
 const root=new T.Group();root.name='dice-salon';scene.add(root);
 const assets=createAdventureModels(),room=createSalonRoom(root,assets,layout);
 const errors:string[]=[];
 const place=(id:string,position:[number,number,number],height:number,rotation=0,parent:T.Object3D=root)=>assets.place({id,parent,position,height,rotation}).catch(()=>{errors.push(id);return null;});
 const jobs:Promise<unknown>[]=[];
 jobs.push(place('furniture/rugRound',[0,.28,0],.07).then(o=>{if(o){o.scale.x=(layout.radiusX*2+1.6)/o.userData.nativeSize[0];o.scale.z=(layout.radiusZ*2+1.5)/o.userData.nativeSize[2];}}));
 jobs.push(place('furniture/tableRound',[0,.32,0],1.2).then(o=>{if(o){o.scale.x*=5.8*layout.radiusX/7.5;o.scale.z*=4.2*layout.radiusZ/5.4;}}));
 function updateScore(p:any){const values=p?.sheet??Array(13).fill(null);scene.userData.diceSheet={total:diceTotal(values),entries:values.filter((v:any)=>v!==null).length,values:[...values]};}
 const seats=Array.from({length:players},(_,i)=>{const angle=Math.PI/2+i/Math.max(1,players)*Math.PI*2;return new T.Vector3(Math.cos(angle)*layout.radiusX,.65,Math.sin(angle)*layout.radiusZ);});
 seats.forEach((p,i)=>{const rotation=Math.atan2(p.x,p.z)+Math.PI;jobs.push(place('furniture/chairCushion',[p.x,.3,p.z],2,rotation));});
 const crewTable=createDiceCrewTable(root,assets,crew,me,seats);
 let disposed=false,releaseBatches=()=>{};
 const ready=Promise.all([...jobs,crewTable.ready,room.ready]).then(()=>{if(disposed)return;releaseBatches=batchStaticMeshes(root,{mergeUnique:true});scene.userData.assetErrors=[...errors,...room.errors,...(crewTable.root.userData.assetErrors??[])];scene.userData.assetsReady=scene.userData.assetErrors.length===0;});
 return {root,seats,crewTable,updateScore,updateAmbience:room.update,ready,stats:assets.stats,dispose(){disposed=true;releaseBatches();crewTable.dispose();room.dispose();assets.dispose();root.removeFromParent();}};
}
