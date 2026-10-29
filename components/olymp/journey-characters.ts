import type * as Three from "three";
import type { Appearance } from "@/lib/appearance";
import { emoteMotions } from "@/lib/emotes";
export interface MapCharacter {id?:string;name?:string;color:string;avatar?:number;look?:Appearance}
/** The same SVG wardrobe on a camera-facing sprite as the boss arenas. */
export function createMapCharacter(T:typeof Three,player:MapCharacter) {
  const root=new T.Group();root.name=`map-character-${player.id??"crew"}`;root.userData.dynamic=true;root.userData.avatarStyle="boss-sprite";
  const material=new T.SpriteMaterial({transparent:true,depthWrite:false,opacity:0});
  const sprite=new T.Sprite(material);sprite.name="boss-style-avatar";sprite.scale.set(1.2,1.2,1);sprite.position.y=0.62;root.add(sprite);
  const baseGeometry=new T.RingGeometry(0.32,0.4,24),baseMaterial=new T.MeshBasicMaterial({color:player.color,transparent:true,opacity:0.4,depthWrite:false});
  const base=new T.Mesh(baseGeometry,baseMaterial);base.rotation.x=-Math.PI/2;base.position.y=0.025;root.add(base);
  let request=0,disposed=false;const images=new Map<HTMLImageElement,(ready:boolean)=>void>();
  return {root,
    setAvatar(source:SVGElement):Promise<boolean>{
      if(disposed)return Promise.resolve(false);
      return new Promise(resolve=>{
      const version=++request,clone=source.cloneNode(true) as SVGElement;
      clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("width","256");clone.setAttribute("height","256");
      const img=new Image();images.set(img,resolve);
      img.onload=()=>{images.delete(img);img.onload=null;img.onerror=null;if(disposed||version!==request){resolve(false);return;}
        const tex=new T.Texture(img);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;
        material.map?.dispose();material.map=tex;material.opacity=1;material.needsUpdate=true;
        root.userData.avatarReady=true;
        resolve(true);
      };
      img.onerror=()=>{images.delete(img);img.onload=null;img.onerror=null;resolve(false);};
      img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      });
    },
    update(t:number,walking:boolean,emote:number|null,reduced:boolean){
      if(emote!==null&&emote<0)emote=null;
      const motion=emote===null?"":emoteMotions[emote]??"cheer";
      sprite.position.y=0.62+(reduced?0:walking?Math.abs(Math.sin(t*12))*0.07:emote!==null&&["cheer","launch","dance","laugh"].includes(motion)?Math.abs(Math.sin(t*6))*0.16:0);
      material.rotation=reduced?0:emote!==null?Math.sin(t*5)*0.11:walking?Math.sin(t*12)*0.045:0;
    },
    dispose(){disposed=true;request++;images.forEach((resolve,img)=>{img.onload=null;img.onerror=null;img.src="";resolve(false);});images.clear();material.map?.dispose();material.dispose();baseGeometry.dispose();baseMaterial.dispose();}
  };
}
