import * as T from 'three';import type {locationKit} from './location-kit';

/** Fixed river banks frame the bounded, moving trail without occupying its lanes. */
export function createExpeditionGorge(k:ReturnType<typeof locationKit>){
 const root=new T.Group();root.name='expedition-river-gorge';k.root.add(root);const {block,model}=k;
 const positions:number[]=[],colors:number[]=[],indices:number[]=[],stone=new T.Color('#71817a'),grass=new T.Color('#8c9d6e'),deep=new T.Color('#4e6964');
 for(const side of[-1,1]){const base=positions.length/3;for(let row=0;row<4;row++)for(let i=0;i<=16;i++){const x=-44+i*5.5,edge=11.7+Math.sin(i*.91+side)*1.1,h=(side<0?3.6:1.25)+Math.sin(i*1.4+side)*.45,z=side*(row===0?edge:row===1?edge+1.8:23),y=row===0?-1.2:row===1?h:row===2?h+.35:-5.5;positions.push(x,y,z);const c=(row===0?deep:row===1?stone:row===2?grass:deep).clone().multiplyScalar(.96+.04*Math.sin(i*2.1+row));colors.push(c.r,c.g,c.b);}
  for(let row=0;row<3;row++)for(let i=0;i<16;i++){const a=base+row*17+i,b=a+1,c=a+17,d=c+1;indices.push(...(side<0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();k.geometries.add(geometry);const material=k.mat('#f9fbf5');material.vertexColors=true;material.flatShading=true;material.side=T.DoubleSide;const banks=new T.Mesh(geometry,material);banks.name='faceted-river-banks';banks.receiveShadow=true;root.add(banks);
 // A narrow stream follows the actual rear cliff slope instead of floating above it.
 const cliff=(i:number)=>({x:-44+i*5.5,z:-(11.7+Math.sin(i*.91-1)*1.1),h:3.6+Math.sin(i*1.4-1)*.45}),a=cliff(4),b=cliff(5),fallPositions:number[]=[];
 for(const u of[.39,.61]){const x=T.MathUtils.lerp(a.x,b.x,u),z=T.MathUtils.lerp(a.z,b.z,u),h=T.MathUtils.lerp(a.h,b.h,u);fallPositions.push(x,h+.02,z-1.8+.045,x,-1.17,z+.045);}
 const fallGeometry=new T.BufferGeometry();fallGeometry.setAttribute('position',new T.Float32BufferAttribute(fallPositions,3));fallGeometry.setIndex([0,1,2,2,1,3]);fallGeometry.computeVertexNormals();k.geometries.add(fallGeometry);const fall=new T.Mesh(fallGeometry,k.mat('#a4cebf'));fall.name='cliff-waterfall';root.add(fall);
 block('waterfall-foam','#c6dfc8',[(a.x+b.x)/2,-1.16,(a.z+b.z)/2+.3],[1.7,.018,.35],root);
 for(let i=0;i<6;i++){const x=-29+i*11.5;model('nature/tree_plateau',[x,3.8,-18.5],6+(i%3)*.8,i*.71,root);}
 for(const [x,z,y,h]of[[-24,-15.8,3.5,2.7],[-2,-15.8,3.5,2.1],[23,-15.8,3.5,3],[-20,16.5,1.3,1.8],[13,16.5,1.3,1.9]])model('nature/rock_largeA',[x,y,z],h,x*.1,root);
 for(const x of[-29,-3,22])model('nature/rock_largeA',[x,-1.2,-11.25],2.7,x*.17,root);
 for(let i=0;i<22;i++){const x=Math.sin(i*4.17)*29,z=-9+(i%9)*2.1;const flow=block('river-current-streak','#85b2ac',[x,-1.175,z],[1.1+(i%4)*.45,.018,.055],root);flow.rotation.y=Math.sin(i)*.07;}
 return root;
}

export function decorateExpeditionIsland(k:ReturnType<typeof locationKit>,group:T.Group,slot:number){
 const {block,model}=k;
 if(slot===0){model('props/expedition-tent',[-.3,.1,-5.7],1.8,0,group);for(let i=0;i<5;i++)block('camp-boardwalk-seam','#796346',[-3.8+i*1.4,.14,-.8],[.025,.012,4.7],group);for(const x of[-3.5,-2.6])block('camp-supply-case','#aa936c',[x,.26,-4.5],[.6,.55,.65],group);}
 else{model('props/expedition-ruin-arch',[0,0,-4.3],3.8,slot===1?.07:-.1,group);for(let i=0;i<5;i++){const stone=block('ruin-fallen-block',i%2?'#aaa885':'#c6bd9a',[-2.8+i*.45,.12,-3.8+(i%2)*.4],[.5,.25,.4],group);stone.rotation.y=i*.43;}for(const x of[-2.3,2.5])model('nature/plant_bush',[x,.05,-4.5],.8,x,group);}
}
