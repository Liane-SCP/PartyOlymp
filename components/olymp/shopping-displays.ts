import * as T from 'three';

// The camera renders layer 0. Layer 31 contains only the original hit surfaces;
// their parent transforms and offer indices remain available to the raycaster.
export const shoppingPickLayer=31;
const columns=4,photoWidth=400,photoHeight=260,pitchX=402,pitchY=262,labelWidth=248,labelHeight=60;
export const shoppingAtlas={width:columns*pitchX,height:978};
export function shoppingAtlasRect(index:number,label=false){return {x:index%columns*pitchX+1,y:label?786+Math.floor(index/columns)*64+1:Math.floor(index/columns)*pitchY+1,width:label?labelWidth:photoWidth,height:label?labelHeight:photoHeight};}
export function shoppingLabelLines(value:string){
 const text=String(value??'').trim().replace(/\s+/g,' ');if(text.length<=20)return [text];
 const space=text.lastIndexOf(' ',20),split=space>6?space:20,first=text.slice(0,split).trim(),rest=text.slice(split).trim();
 return [first,rest.length>20?rest.slice(0,19).trimEnd()+'…':rest];
}

/** One scene-owned atlas, two instanced stand parts and two linked face batches. */
export function createShoppingDisplays(parent:T.Group,positions:T.Vector3[],cream:T.Material,wood:T.Material,labelColor:string){
 const canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=shoppingAtlas.width;canvas.height=shoppingAtlas.height;}
 const context=canvas?.getContext('2d'),texture=canvas?new T.CanvasTexture(canvas):null;
 if(texture){texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;}
 const photoMaterial=new T.MeshBasicMaterial({map:texture,color:texture?'#ffffff':'#ece5d3',toneMapped:false});
 const labelMaterial=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide});
 const ownedGeometry=new Set<T.BufferGeometry>(),box=new T.BoxGeometry();ownedGeometry.add(box);
 const stands=[new T.InstancedMesh(box,cream,positions.length),new T.InstancedMesh(box,wood,positions.length)];
 stands.forEach((m,i)=>{m.name=i?'shopping-stand-tops':'shopping-stand-bases';m.castShadow=m.receiveShadow=true;m.instanceMatrix.setUsage(T.DynamicDrawUsage);parent.add(m);});
 function plane(index:number,label:boolean){
  const g=new T.PlaneGeometry(label?3.1:2,label?.75:1.3),uv=g.getAttribute('uv'),r=shoppingAtlasRect(index,label);
  for(let v=0;v<uv.count;v++)uv.setXY(v,(r.x+uv.getX(v)*r.width)/shoppingAtlas.width,1-(r.y+(1-uv.getY(v))*r.height)/shoppingAtlas.height);
  ownedGeometry.add(g);return g;
 }
 const stalls:T.Group[]=[],photos:T.Mesh[]=[],labels:{object:T.Mesh<T.BufferGeometry,T.Material>;set:(text:string)=>void}[]=[];
 positions.forEach((p,i)=>{
  const stall=new T.Group();stall.name=`market-stall-${i}`;stall.position.copy(p);parent.add(stall);stalls.push(stall);
  const photo=new T.Mesh(plane(i,false),photoMaterial);photo.name=`product-photo-${i}`;photo.position.set(0,2.25,.15);photo.layers.set(shoppingPickLayer);photo.userData.pick=`offer:${i}`;stall.add(photo);photos.push(photo);
  const object=new T.Mesh(plane(i,true),labelMaterial);object.name=`offer-label-${i}`;object.position.set(0,.9,1.07);object.layers.set(shoppingPickLayer);stall.add(object);
  if(context){const r=shoppingAtlasRect(i);context.fillStyle='#ece5d3';context.fillRect(r.x-1,r.y-1,r.width+2,r.height+2);}
  let previous='';labels.push({object,set(value:string){const text=String(value??'');if(text===previous)return;previous=text;object.userData.text=text;if(!context||!texture)return;const r=shoppingAtlasRect(i,true),lines=shoppingLabelLines(text);context.clearRect(r.x-1,r.y-1,r.width+2,r.height+2);context.save();context.beginPath();context.rect(r.x,r.y,r.width,r.height);context.clip();context.fillStyle=labelColor;context.textAlign='center';context.textBaseline='middle';context.font=`700 ${lines.length===2?24:Math.min(r.height*.65,r.width/Math.max(6,lines[0].length)*1.65)}px system-ui`;lines.forEach((line,row)=>context.fillText(line,r.x+r.width/2,r.y+(lines.length===2?17+row*26:r.height/2),r.width-24));context.restore();texture.needsUpdate=true;}});
 });
 function faceBatch(name:string,material:T.Material,shadow:boolean){
  const g=new T.BufferGeometry(),vertices=new Float32Array(positions.length*12),uvs=new Float32Array(positions.length*8),indices:number[]=[];
  for(let i=0;i<positions.length;i++){const n=i*4;indices.push(n,n+2,n+1,n+2,n+3,n+1);}
  const normals=new Float32Array(positions.length*12);for(let i=2;i<normals.length;i+=3)normals[i]=1;
  g.setAttribute('position',new T.BufferAttribute(vertices,3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.BufferAttribute(uvs,2).setUsage(T.DynamicDrawUsage));g.setIndex(indices);ownedGeometry.add(g);
  const mesh=new T.Mesh(g,material);mesh.name=name;mesh.castShadow=shadow;parent.add(mesh);return mesh;
 }
 const photoBatch=faceBatch('shopping-product-faces',photoMaterial,true),labelBatch=faceBatch('shopping-product-labels',labelMaterial,false);
 const baseMatrix=new T.Matrix4().compose(new T.Vector3(0,.85,0),new T.Quaternion(),new T.Vector3(3.3,1.2,2.1)),topMatrix=new T.Matrix4().compose(new T.Vector3(0,1.5,0),new T.Quaternion(),new T.Vector3(3.45,.12,2.2));
 const inverse=new T.Matrix4(),local=new T.Matrix4(),matrix=new T.Matrix4(),point=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();let previous='',disposed=false;
 function sync(){
  parent.updateWorldMatrix(true,true);inverse.copy(parent.matrixWorld).invert();
  const key=stalls.map(s=>`${s.visible}:${s.matrixWorld.elements.join(',')}`).join(';');if(key===previous)return;previous=key;
  let count=0;
  stalls.forEach((s,i)=>{if(!s.visible)return;local.multiplyMatrices(inverse,s.matrixWorld);stands[0].setMatrixAt(count,matrix.multiplyMatrices(local,baseMatrix));stands[1].setMatrixAt(count,matrix.multiplyMatrices(local,topMatrix));
   for(const [source,batch] of [[photos[i],photoBatch],[labels[i].object,labelBatch]] as const){
    local.multiplyMatrices(inverse,source.matrixWorld);const pos=source.geometry.getAttribute('position'),uv=source.geometry.getAttribute('uv'),out=batch.geometry.getAttribute('position'),outUV=batch.geometry.getAttribute('uv');
    normalMatrix.getNormalMatrix(local);normal.set(0,0,1).applyMatrix3(normalMatrix).normalize();const outNormal=batch.geometry.getAttribute('normal');
    for(let v=0;v<4;v++){point.fromBufferAttribute(pos,v).applyMatrix4(local);out.setXYZ(count*4+v,point.x,point.y,point.z);outNormal.setXYZ(count*4+v,normal.x,normal.y,normal.z);outUV.setXY(count*4+v,uv.getX(v),uv.getY(v));}
   }count++;
  });
  stands.forEach(m=>{m.count=count;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();});
  for(const mesh of[photoBatch,labelBatch]){mesh.visible=count>0;mesh.geometry.setDrawRange(0,count*6);mesh.geometry.getAttribute('position').needsUpdate=true;mesh.geometry.getAttribute('normal').needsUpdate=true;mesh.geometry.getAttribute('uv').needsUpdate=true;mesh.geometry.computeBoundingSphere();}
 }
 sync();
 return {stalls,photos,labels,sync,texture,
  clearImage(index:number){if(disposed||!context||!texture)return;const r=shoppingAtlasRect(index);context.fillStyle='#ece5d3';context.fillRect(r.x-1,r.y-1,r.width+2,r.height+2);texture.needsUpdate=true;},
  setImage(index:number,image:HTMLImageElement){if(disposed||!context||!texture)return false;const r=shoppingAtlasRect(index),fit=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight),w=image.naturalWidth*fit,h=image.naturalHeight*fit;context.fillStyle='#ffffff';context.fillRect(r.x-1,r.y-1,r.width+2,r.height+2);context.drawImage(image,r.x+(r.width-w)/2,r.y+(r.height-h)/2,w,h);texture.needsUpdate=true;return true;},
  dispose(){if(disposed)return;disposed=true;stalls.forEach(s=>s.removeFromParent());stands.forEach(m=>{m.removeFromParent();m.dispose();});photoBatch.removeFromParent();labelBatch.removeFromParent();ownedGeometry.forEach(g=>g.dispose());photoMaterial.dispose();labelMaterial.dispose();texture?.dispose();}
 };
}
