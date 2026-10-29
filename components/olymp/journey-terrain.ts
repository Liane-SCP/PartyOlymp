import type * as Three from "three";
/** Area-normalized organic coast: the nominal island radii still describe equal land areas. */
export function coastProfile(seed: number, segments=64) {
  const radii=Array.from({length:segments},(_,i)=>{
    const a=i/segments*Math.PI*2;
    return 0.96+0.1*Math.sin(a*3+seed*1.7)+0.065*Math.cos(a*5-seed*0.9)+0.035*Math.sin(a*7+seed);
  });
  let area=0;for(let i=0;i<segments;i++)area+=radii[i]*radii[(i+1)%segments]*Math.sin(Math.PI*2/segments)/2;
  const normalization=Math.sqrt(Math.PI/area);return radii.map(r=>r*normalization);
}
export function createIslandTerrain(T:typeof Three,radius:number,seed:number,ground:string,palette?:{stone:string;soil:string;depth:string;foliage:readonly string[]}) {
  const coast=coastProfile(seed), segments=coast.length, positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const top=new T.Color(ground), moss=new T.Color(palette?.foliage[1]??"#8da077"), rock=new T.Color(palette?.stone??"#68736f"), soil=new T.Color(palette?.soil??"#81745f"), depth=new T.Color(palette?.depth??"#35475a");
  // A broad, level clearing with an irregular grassy lip and stratified cliffs.
  const rings=[{r:0.01,y:0.15},{r:0.55,y:0.15},{r:0.83,y:0.11},{r:1,y:0},{r:0.99,y:-0.5},{r:0.87,y:-radius*0.45},{r:0.58,y:-radius*1.05},{r:0.12,y:-radius*1.9}];
  rings.forEach((ring,j)=>{
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2, edge=j<2?1:coast[i];
      const rough=j>3?Math.sin(i*1.71+seed+j)*radius*0.035:0;
      positions.push(Math.cos(a)*radius*ring.r*edge,ring.y+rough,Math.sin(a)*radius*ring.r*edge);
      const c=j<4?top.clone().lerp(moss,0.12+Math.sin(i*2.3+seed)*0.08):j===4?soil.clone():rock.clone().lerp(depth,(j-4)/3);
      c.multiplyScalar(0.94+Math.sin(i*1.7+seed+j)*0.06);colors.push(c.r,c.g,c.b);
    }
  });
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const n=(i+1)%segments,a=j*segments+i,b=j*segments+n,c=(j+1)*segments+i,d=(j+1)*segments+n;
    indices.push(a,b,c,b,d,c);
  }
  const center=positions.length/3;positions.push(0,rings[0].y,0);colors.push(...colors.slice(0,3));for(let i=0;i<segments;i++)indices.push(center,(i+1)%segments,i);
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.userData.organicCoast=coast; return geometry;
}
