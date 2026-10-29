import * as T from 'three';
export const printedCardPickLayer=31;
/** Scene-owned rounded cards, one body batch and one printed face batch. */
export function createPrintedCardBatch(parent:T.Group,texture:T.Texture|null,backSlot:number,capacity=384,proxyCount=60,name='printed-card'){
 const cellW=128,cellH=176,atlasW=1024,atlasH=1232;
 const paper=new T.MeshStandardMaterial({color:'#f6edda',roughness:.8}),ink=new T.MeshBasicMaterial({map:texture,color:texture?'#ffffff':'#fff7e4',alphaTest:.4,toneMapped:false});
 const shape=new T.Shape(),w=.675,h=.95,r=.1;shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
 const bodyGeometry=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,steps:1,curveSegments:3});bodyGeometry.translate(0,0,-.0175);
 const body=new T.InstancedMesh(bodyGeometry,paper,capacity);body.name=name+'-bodies';body.castShadow=body.receiveShadow=true;body.instanceMatrix.setUsage(T.DynamicDrawUsage);parent.add(body);
 const faceGeometry=new T.BufferGeometry(),positions=new Float32Array(capacity*24),normals=new Float32Array(capacity*24),uvs=new Float32Array(capacity*16),indices:number[]=[];
 for(let i=0;i<capacity;i++){const n=i*8;indices.push(n,n+2,n+1,n+2,n+3,n+1,n+4,n+5,n+6,n+6,n+5,n+7);}
 faceGeometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));faceGeometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));faceGeometry.setAttribute('uv',new T.BufferAttribute(uvs,2).setUsage(T.DynamicDrawUsage));faceGeometry.setIndex(indices);
 const faces=new T.Mesh(faceGeometry,ink);faces.name=name+'-faces';parent.add(faces);
 const proxyGeometry=new T.BoxGeometry(1.35,1.9,.04),proxyFace=new T.PlaneGeometry(1.31,1.86);
 const cards=Array.from({length:proxyCount},(_,i)=>{const root=new T.Group();root.name=`card-${i}`;parent.add(root);const plate=new T.Mesh(proxyGeometry,paper);plate.layers.set(31);root.add(plate);const object=new T.Mesh(proxyFace,ink);object.layers.set(31);object.name=`card-value-${i}`;root.add(object);return {root,plate,face:{object:object as T.Mesh<T.BufferGeometry,T.Material>,set(text:string){object.userData.text=text;}}};});

 const matrices=Array.from({length:capacity},()=>new T.Matrix4()),slots=new Int16Array(capacity),previous=new Float64Array(capacity*17),normalMatrix=new T.Matrix3(),point=new T.Vector3(),normal=new T.Vector3();let previousCount=-1,disposed=false;

 const vertices=[[-.655,.93],[.655,.93],[-.655,-.93],[.655,-.93]];let count=0;
 return {cards,begin(){count=0;},add(m:T.Matrix4,slot:number){if(disposed||count>=capacity)return;matrices[count].copy(m);slots[count++]=slot;},flush(){if(disposed)return;
  let changed=count!==previousCount;for(let i=0;i<count;i++){for(let j=0;j<16;j++)if(previous[i*17+j]!==matrices[i].elements[j]){changed=true;previous[i*17+j]=matrices[i].elements[j];}if(previous[i*17+16]!==slots[i]){changed=true;previous[i*17+16]=slots[i];}}
  if(changed){previousCount=count;for(let i=0;i<count;i++){const m=matrices[i];body.setMatrixAt(i,m);normalMatrix.getNormalMatrix(m);for(let side=0;side<2;side++){const slot=side?backSlot:slots[i],x=slot%8*cellW,y=Math.floor(slot/8)*cellH;normal.set(0,0,side?-1:1).applyMatrix3(normalMatrix).normalize();for(let v=0;v<4;v++){point.set(vertices[v][0],vertices[v][1],side?-.029:.029).applyMatrix4(m);const at=i*8+side*4+v;(faceGeometry.getAttribute('position') as T.BufferAttribute).setXYZ(at,point.x,point.y,point.z);(faceGeometry.getAttribute('normal') as T.BufferAttribute).setXYZ(at,normal.x,normal.y,normal.z);(faceGeometry.getAttribute('uv') as T.BufferAttribute).setXY(at,(x+3+(v%2)*(cellW-6))/atlasW,1-(y+3+(v>=2?cellH-6:0))/atlasH);}}}body.count=count;body.instanceMatrix.needsUpdate=true;body.computeBoundingSphere();faces.visible=count>0;faceGeometry.setDrawRange(0,count*12);for(const name of['position','normal','uv'])faceGeometry.getAttribute(name).needsUpdate=true;faceGeometry.computeBoundingSphere();}

 return count;},dispose(){if(disposed)return;disposed=true;cards.forEach(c=>c.root.removeFromParent());body.removeFromParent();faces.removeFromParent();body.dispose();for(const g of[bodyGeometry,faceGeometry,proxyGeometry,proxyFace])g.dispose();paper.dispose();ink.dispose();texture?.dispose();}};
}
