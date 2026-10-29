import * as T from 'three';import type {locationKit} from './location-kit';

export function createNavigationWorkshop(k:ReturnType<typeof locationKit>,props:T.Group){const {block,model}=k;
 // Abstract window panes and navigation equipment never describe a hidden location.
 for(const x of[-10.1,-6.1,6.1,10.1]){block('navigation-window-frame','#d9c395',[x,6.1,-9.75],[3.1,4.4,.18],props);block('navigation-window-sky','#90b8bc',[x,6.1,-9.62],[2.8,4.1,.08],props);for(const y of[5,6.3,7.4])block('navigation-window-slat','#d9c395',[x,y,-9.53],[2.8,.06,.06],props);}
 for(const y of[.6,2.1])block('navigation-wall-rail','#a48c65',[0,y,-9.65],[24,.14,.16],props);
 for(const x of[-11.5,-8.1,0,8.1,11.5])block('navigation-wall-rib','#8c765b',[x,4.7,-9.67],[.12,8.6,.14],props);
 block('navigation-equipment-bench','#a48c65',[10.6,1.18,-.8],[3.6,.18,1.5],props);for(const x of[9.2,12])block('navigation-bench-leg','#8c765b',[x,.73,-.8],[.16,.9,1.2],props);
 model('props/navigation-compass',[10.6,1.28,-.75],.9,.1,props);
 for(let i=0;i<4;i++)block('rolled-navigation-chart','#eadcba',[9.3+i*.58,.62,-.8],[.38,.5,.85],props);
 for(const x of[-10.7,-9.8])block('travel-case','#a88c64',[x,.75,-6.4],[.75,.8,.8],props);
 block('globe-dais-border','#ddc491',[-5,.38,0],[7.9,.12,7.9],props);block('globe-dais-inset','#708a83',[-5,.46,0],[7.55,.05,7.55],props);
}
