import type * as Three from 'three';
import type {qualityProfiles} from '@/lib/adventure-quality';
type Profile=(typeof qualityProfiles)[keyof typeof qualityProfiles];

export function configureAdventureRenderer(T:typeof Three,renderer:Three.WebGLRenderer,scene:Three.Scene,profile:Profile,pixelRatio:number){
 renderer.setPixelRatio(Math.min(pixelRatio,profile.dpr));renderer.shadowMap.enabled=profile.shadows;
 scene.traverse(object=>{
  if(object instanceof T.DirectionalLight&&object.castShadow){object.shadow.mapSize.set(profile.shadowSize,profile.shadowSize);object.shadow.map?.dispose();object.shadow.map=null;}
  if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])material.needsUpdate=true;
 });
}

/** Draw into the still-hidden actual canvas: preserve its output and tone-mapping variant. */
export async function prepareAdventureRenderer(T:typeof Three,renderer:Three.WebGLRenderer,scene:Three.Scene,camera:Three.Camera,cancelled:()=>boolean){
 await renderer.compileAsync(scene,camera);if(cancelled())return false;
 renderer.render(scene,camera);
 return !cancelled();
}
