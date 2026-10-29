import * as T from 'three';
import type {locationKit} from './location-kit';

/** One atlas and one draw for all low seat-front displays. Public rows only. */
export function createAuctionPlacards(k:ReturnType<typeof locationKit>,seats:T.Vector3[]){
 const width=512,rowHeight=96,canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=width;canvas.height=Math.max(1,seats.length)*rowHeight;}
 const context=canvas?.getContext('2d'),texture=canvas?new T.CanvasTexture(canvas):null;if(texture){texture.colorSpace=T.SRGBColorSpace;k.textures.add(texture);}
 const geometry=new T.BufferGeometry(),positions:number[]=[],uv:number[]=[],indices:number[]=[];
 seats.forEach((p,i)=>{const x=p.x,y=p.y+.15,z=p.z+1.42,n=positions.length/3;positions.push(x-1.75,y-.32,z,x+1.75,y-.32,z,x+1.75,y+.32,z,x-1.75,y+.32,z);const bottom=1-(i+1)/seats.length,top=1-i/seats.length;uv.push(0,bottom,1,bottom,1,top,0,top);indices.push(n,n+1,n+2,n,n+2,n+3);});
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeBoundingSphere();k.geometries.add(geometry);
 const material=new T.MeshBasicMaterial({map:texture,color:texture?'#ffffff':'#31505a',toneMapped:false}),mesh=new T.Mesh(geometry,material);mesh.name='auction-low-seat-placards';k.root.add(mesh);
 const cache:string[]=[];
 return {mesh,positions:seats.map(p=>[p.x,p.y+.15,p.z+1.42]),update(rows:{name:string;bid:number|null;status:string;leading:boolean;passed:boolean}[]){let dirty=false;rows.forEach((row,i)=>{const key=JSON.stringify(row);if(cache[i]===key)return;cache[i]=key;dirty=true;if(!context)return;const top=i*rowHeight;context.fillStyle=row.leading?'#52624e':row.passed?'#334751':'#29434c';context.fillRect(0,top,width,rowHeight);context.fillStyle=row.leading?'#f4d68d':'#ecdfbf';context.textAlign='center';context.textBaseline='middle';context.font='700 29px sans-serif';context.fillText(`${String(i+1).padStart(2,'0')} · ${row.name}`,width/2,top+29,width-26);context.font='600 24px sans-serif';context.fillText(`${row.bid??'—'} · ${row.status}`,width/2,top+68,width-26);});if(dirty&&texture)texture.needsUpdate=true;}};
}
