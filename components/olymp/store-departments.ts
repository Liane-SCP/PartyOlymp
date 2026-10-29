import type {locationKit} from './location-kit';
import * as T from 'three';

type DepartmentSign={text:string;position:[number,number,number];width:number;height:number;color:string;background:string;font:number};
function departmentSigns(k:ReturnType<typeof locationKit>,specs:DepartmentSign[]){
 if(typeof document==='undefined'){for(const s of specs)k.sign(s.text,s.position,s.width,s.height,s.color,s.background,s.font);return;}
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const c=canvas.getContext('2d')!,vertices:number[]=[],uv:number[]=[],indices:number[]=[];
 specs.forEach((s,i)=>{const top=i*96;c.fillStyle=s.background;c.fillRect(0,top,768,96);c.fillStyle=s.color;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.round(96*s.font)}px system-ui`;c.fillText(s.text,384,top+48,730);const[x,y,z]=s.position,w=s.width/2,h=s.height/2,n=i*4;vertices.push(x-w,y-h,z,x+w,y-h,z,x-w,y+h,z,x+w,y+h,z);uv.push(1/768,1-(top+95)/512,767/768,1-(top+95)/512,1/768,1-(top+1)/512,767/768,1-(top+1)/512);indices.push(n,n+1,n+2,n+1,n+3,n+2);});
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;k.textures.add(texture);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);k.geometries.add(geometry);const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture,toneMapped:false}));mesh.name='department-wayfinding-atlas';k.root.add(mesh);
}

/** Three different shop-in-shop displays, entirely behind the playable offer aisles. */
export function createStoreDepartments(k:ReturnType<typeof locationKit>){
 const {block,model}=k,labels:DepartmentSign[]=[];
 for(const [x,color,title]of[[-8.1,'#a7654b','01 · FEINKOST'],[0,'#39676d','02 · TECHNIK'],[8.1,'#a58248','03 · WOHNEN']] as const){
  block('department-wall-panel',color,[x,2.8,-8.65],[7.2,4.9,.24]);
  block('department-header-frame','#e1c38e',[x,4.8,-4.5],[7.4,.85,.26]);
  labels.push({text:title,position:[x,4.8,-4.34],width:7,height:.64,color:'#273f43',background:'#f3e4c3',font:.48});
  block('department-base-inlay',color,[x,.25,-5.8],[7.2,.025,4.6]);
 }
 // Pantry: shallow wooden shelves, real low-poly food and an imported fridge.
 const pantryX=-7.1;
 for(const y of[.85,2.15])block('pantry-oak-shelf','#c29a65',[pantryX,y,-6.35],[4.3,.16,1.4]);
 for(const side of[-1,1])block('pantry-upright','#7c5940',[pantryX+side*2.05,1.45,-6.35],[.13,2.6,1.4]);
 const food=['food/apple','food/bread','food/carton','food/bottle-oil','food/banana','food/pizza-box'];
 for(let row=0;row<2;row++)for(let i=0;i<6;i++)model(food[(i+row*2)%food.length],[pantryX-1.7+i*.67,.94+row*1.3,-6.15],.48);
 model('furniture/kitchenFridge',[-10.7,.3,-6.7],3.2);
 block('pantry-lower-counter','#c29a65',[pantryX,.55,-4.55],[4.4,.6,1.2]);
 for(let i=0;i<4;i++){block('produce-crate-divider','#7c5940',[pantryX-1.6+i*1.05,.94,-4.55],[.06,.25,1.12]);model(i%2?'food/banana':'food/apple',[pantryX-1.1+i*.83,.9,-4.5],.36);}
 // Technology: paired demonstration desks and an illuminated display backdrop.
 for(const x of[-1.45,1.45]){
  model('furniture/desk',[x,.3,-5.85],1.45);
  model('furniture/computerScreen',[x,1.75,-6.05],1.05);
  model('furniture/computerKeyboard',[x,1.75,-5.45],.08);
  block('tech-demo-floor-marker','#c8ba8d',[x,.27,-4.1],[1.8,.025,.5]);
 }
 block('technology-display-frame','#c7b17e',[0,3.45,-8.35],[4.9,1.8,.2]);
 labels.push({text:'ENTDECKEN · AUSPROBIEREN',position:[0,3.45,-8.23],width:4.65,height:1.55,color:'#bfe0d5',background:'#203f49',font:.25});
 for(const x of[-3.25,3.25])block('technology-light-inlay','#b7d1c4',[x,2.8,-8.46],[.08,3.6,.04]);
 // Home: a furnished room vignette rather than another row of pantry shelves.
 model('furniture/rugRound',[8,.28,-6],.045).then(rug=>{if(rug){rug.scale.x=5.9/rug.userData.nativeSize[0];rug.scale.z=4/rug.userData.nativeSize[2];}});
 model('furniture/chairCushion',[6.6,.33,-5.9],2.1,.22);
 model('furniture/cabinetBedDrawerTable',[9.1,.33,-5.9],1.45);
 model('furniture/lampRoundTable',[9.1,1.78,-5.9],.95);
 model('furniture/bookcaseOpen',[10.5,.3,-7.7],3.25);
 model('furniture/books',[10.4,1.6,-7.5],.48);
 model('furniture/lampRoundFloor',[5.2,.3,-7.5],3.1);
 for(const x of[-12.35,-4.05,4.05,12.35]){
  block('gallery-support-column','#dbc49b',[x,2.85,-9.75],[.3,5.1,.5]);
  block('gallery-column-capital','#ead7ae',[x,5.3,-9.75],[.75,.35,.85]);
 }
 // The guide is behind the offers; it does not add a foreground obstruction.
 labels.push({text:'AKTIONSFLÄCHE · ANGEBOTE DIESER RUNDE',position:[0,5.75,-6.22],width:11.2,height:.45,color:'#f1dfb8',background:'#355d60',font:.49});
 departmentSigns(k,labels);
 block('welcome-floor-inlay','#4f7770',[0,.25,10.3],[6.6,.025,1.25]);
 for(const side of[-1,1]){block('department-floor-border','#b9975c',[side*12.5,.252,-5],[.07,.015,9]);model('furniture/lampWall',[side*12,4.6,-10.25],.9);}
}
