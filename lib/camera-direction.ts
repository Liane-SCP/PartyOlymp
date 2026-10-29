import {bombCameraDistance,bombCameraTarget} from './bomb-presentation';

export type CameraPoint=[number,number,number];
export interface DirectedCamera {subject:string;target:CameraPoint;yaw:number;pitch:number;distance:number}

/** Public turn ownership only. Never infer a subject from private answers or scores. */
export function cameraSubject(game:{id?:string;stage?:string;turnId?:string;buzzer?:string},personal=false,quiet=false):string|null {
 if(personal)return null;
 if(game.id==='picture')return game.stage==='answer'?game.buzzer??null:null;
 if(quiet)return null;
 if(game.id==='bomb'&&['word','judge','explosion'].includes(game.stage??''))return game.turnId??null;
 if(game.id==='chain'&&['answer','review','challenge'].includes(game.stage??''))return game.turnId??null;
 return null;
}

/** Keep the current actor and their public prop together, including the word path. */
export function turnCamera(id:string,subject:string,seat:CameraPoint,aspect:number):DirectedCamera|null {
 if(id==='bomb')return {subject,target:bombCameraTarget({x:seat[0],z:seat[2]}),yaw:0,pitch:.55,distance:bombCameraDistance(aspect)};
 if(id==='chain')return {subject,target:[seat[0]-1,seat[1]+1.5,seat[2]],yaw:0,pitch:.5,distance:Math.max(17,5.8/(Math.tan(21*Math.PI/180)*Math.max(.12,aspect)))};
 return null;
}

/** Frame-rate independent settling. No flight in reduced-motion or precision views. */
export function cameraBlend(delta:number,instant=false){return instant?1:1-Math.exp(-Math.min(.1,Math.max(0,delta))*9);}
