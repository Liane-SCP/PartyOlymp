import {createModuleLoader} from '@/lib/module-preparation';

export const loadAdventureModules=createModuleLoader(()=>Promise.all([
 import('three'),import('./adventure-scene'),
]));
export const loadSkyModule=createModuleLoader(()=>import('three/addons/loaders/HDRLoader.js'));

export const loadBossModules=createModuleLoader(()=>Promise.all([
 import('three'),
 import('./boss-models'),
 import('./boss-rig'),
 import('./boss-spectacle'),
 import('three/addons/postprocessing/EffectComposer.js'),
 import('three/addons/postprocessing/RenderPass.js'),
 import('./boss-bloom'),
 import('three/addons/postprocessing/OutputPass.js'),
 import('./boss-batching'),
 import('./boss-venue'),
 import('./kraken-salvo'),
 import('./dragon-salvo'),
]));

/** Import definitions only; scene construction belongs to the actual mounted renderer. */
export function prepareSceneModules(id:string){
 return ['colossus','kraken','dragon'].includes(id)?Promise.all([loadBossModules(),loadSkyModule()]):loadAdventureModules();
}
