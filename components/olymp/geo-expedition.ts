import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {globePoint,globeLocation,globeRoute,type GlobePin} from '@/lib/globe-math';
import {geoCrewSeat,geoCrewCards,geoFlightFrame,geoResultSelection} from '@/lib/geo-presentation';
import {createNavigationWorkshop} from './navigation-workshop';
import {createNavigationCrewCards} from './navigation-crew-cards';

export function createGeoExpedition(scene:T.Scene,crew:{id?:string;color:string;name?:string}[],me:string){
 const k=locationKit(scene,'geo-expedition-base'),{root,block:primitive,sign,model}=k,props=new T.Group();props.name='expedition-provisions';root.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,size,parent);
 block('cliff-station-foundation','#617b79',[0,-.6,0],[29,1.4,23]);block('wooden-travel-deck','#b6a27c',[0,.17,0],[28,.3,22]);
 for(let i=-13;i<=13;i++)block('deck-plank-seam','#847253',[i,.33,0],[.035,.018,22]);
 for(const side of[-1,1]){for(let i=0;i<7;i++)block('station-railing-post','#77705d',[side*13.5,1.5,-9+i*3],[.16,2.4,.16]);block('station-railing','#d2bd94',[side*13.5,2.6,0],[.2,.16,19]);model('furniture/bookcaseOpen',[side*11.2,.34,-7.8],3.5,0,props);model('nature/tree_plateau',[side*16,-.8,-10],9,0,props);model('nature/rock_largeA',[side*15,-3.1,5],5.6,0,props);}
 block('briefing-wall','#547a80',[0,5.5,-10],[25,10.5,.3]);sign('DIE BASIS DER WELTENREISENDEN',[0,9.5,-9.75],20,.9,'#f2e0b9','#365c67');
 for(const side of[-1,1]){block('roof-pillar','#8c765b',[side*12,5.4,-9],[.4,10.4,.4]);const beam=block('canopy-slope','#d7bd8e',[side*6,11.2,-7],[12.6,.25,5.5]);beam.rotation.z=side*-.14;}
 createNavigationWorkshop(k,props);
 const globe=new T.Group();globe.name='geographic-globe';globe.position.set(-5,4.1,0);root.add(globe);
 const globeMaterial=new T.MeshStandardMaterial({color:'#5c91a1',roughness:.9}),sphereGeometry=new T.SphereGeometry(3.3,64,40);k.geometries.add(sphereGeometry);const sphere=new T.Mesh(sphereGeometry,globeMaterial);sphere.name='interactive-earth';sphere.userData.pick='geoGlobe';globe.add(sphere);
 block('globe-plinth','#647c7d',[-5,.9,0],[4.2,1.2,4.2]);const torusGeometry=new T.TorusGeometry(3.55,.075,6,80);k.geometries.add(torusGeometry);const armillary=new T.Mesh(torusGeometry,k.mat('#d9be84'));armillary.name='globe-meridian-frame';armillary.position.copy(globe.position);armillary.rotation.y=.25;root.add(armillary);
 const sphereMarker=new T.SphereGeometry(.16,10,8);k.geometries.add(sphereMarker);
 function marker(name:string,color:string){const mesh=new T.Mesh(sphereMarker,new T.MeshBasicMaterial({color,toneMapped:false}));mesh.name=name;mesh.visible=false;globe.add(mesh);return mesh;}
 const own=marker('own-private-world-pin','#fff2cc'),target=marker('revealed-world-destination','#ffd061');target.scale.setScalar(1.5);
 const revealPins=crew.map((p,i)=>marker(`revealed-world-pin-${i}`,p.color)),flight=marker('world-reveal-flight','#ffffff');
 const routes=crew.map((p,i)=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(37*3),3));k.geometries.add(geometry);const line=new T.Line(geometry,new T.LineBasicMaterial({color:p.color,transparent:true,opacity:.8}));line.name=`public-great-circle-${i}`;line.visible=false;globe.add(line);return line;});
 block('panorama-screen-frame','#d0ba8d',[5.2,5.2,-4.6],[9.1,6.1,.4]);
 const placeholder=new T.DataTexture(new Uint8Array([44,72,79,255]),1,1);placeholder.needsUpdate=true;
 const uniforms={photo:{value:placeholder as T.Texture},view:{value:new T.Vector4(0,0,75*Math.PI/180,8.5/5.5)}};
 const screenMaterial=new T.ShaderMaterial({uniforms,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform sampler2D photo;uniform vec4 view;void main(){vec2 sampleUv=vUv;float fit=view.w/(8.5/5.5);if(fit>1.0)sampleUv.y=(vUv.y-.5)*fit+.5;else sampleUv.x=(vUv.x-.5)/fit+.5;if(sampleUv.x<0.0||sampleUv.x>1.0||sampleUv.y<0.0||sampleUv.y>1.0){gl_FragColor=vec4(.06,.11,.14,1.0);return;}vec3 d=normalize(vec3((sampleUv.x*2.0-1.0)*view.w*tan(view.z*.5),(sampleUv.y*2.0-1.0)*tan(view.z*.5),1.0));float cp=cos(view.y),sp=sin(view.y);d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);float cy=cos(view.x),sy=sin(view.x);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);gl_FragColor=texture2D(photo,vec2(fract(atan(d.x,d.z)/6.2831853+.5),.5-asin(clamp(d.y,-1.0,1.0))/3.14159265));
#include <colorspace_fragment>
}`});
 const screenGeometry=new T.PlaneGeometry(8.5,5.5);k.geometries.add(screenGeometry);const screen=new T.Mesh(screenGeometry,screenMaterial);screen.name='actual-panorama-window';screen.position.set(5.2,5.2,-4.37);screen.userData.pick='geoPhoto';root.add(screen);
 sign('PANORAMA ÖFFNEN · UMSEHEN · HINWEISE FINDEN',[5.2,1.8,-4.2],9,.65,'#f0dfb9','#365c67');
 const status=sign('DREHE DEN GLOBUS · TIPPE FÜR DEINEN PIN',[0,8,-8],20,.75,'#f0dfb9','#365c67');
 const confirm=block('geo-confirm-button','#baceaa',[0,1.1,3],[4.5,.3,1.4],root);confirm.userData.dynamic=true;confirm.userData.pick='geoConfirm';const confirmText=sign('ORT VERDECKT FESTLEGEN',[0,1.27,3],4.2,.65,'#2a4749','#e0d5ae');confirmText.rotation.x=-Math.PI/2;
 const map=block('precise-map-desk','#c6b18d',[5,1.2,3.1],[5.4,.2,3],root);map.userData.dynamic=true;map.userData.pick='geoMap';const mapText=sign('GENAUE KARTE ÖFFNEN',[5,1.32,3.1],5,.75,'#31565c','#ecdfbb');mapText.rotation.x=-Math.PI/2;
 const seats=crew.map((_,i)=>new T.Vector3(...geoCrewSeat(i,crew.length))),crewCards=createNavigationCrewCards(root,seats);
 const ownSeat=crew.findIndex(p=>p.id===me),chartGeometry=new T.PlaneGeometry(2.35,.85);chartGeometry.rotateX(-Math.PI/2);k.geometries.add(chartGeometry);const ownChart=new T.Mesh(chartGeometry,new T.MeshBasicMaterial({visible:false,toneMapped:false}));ownChart.name='geo-own-chart-action';ownChart.userData.pick='geoMap';ownChart.userData.pickDisabled=true;if(ownSeat>=0)ownChart.position.set(seats[ownSeat].x,1.27,seats[ownSeat].z-.65);root.add(ownChart);
 seats.forEach(p=>{model('furniture/stoolBar',[p.x,.34,p.z],1.4,0,props);model('furniture/table',[p.x,.34,p.z-.65],.85,0,props).then(table=>{if(!table)return;const size=new T.Box3().setFromObject(table).getSize(new T.Vector3());table.scale.x*=2.6/size.x;table.scale.z*=1.1/size.z;});block('crew-navigation-paper','#eadcba',[p.x,1.21,p.z-.65],[2.35,.025,.85]);for(const dx of[-.65,0,.65])block('crew-chart-grid','#abc0ae',[p.x+dx,1.228,p.z-.65],[.012,.008,.7]);const pencil=block('crew-navigation-pencil','#ad8c5b',[p.x+.85,1.255,p.z-.95],[.55,.035,.035]);pencil.rotation.y=.2;});
 model('food/bag',[11,.34,4],1.7,0,props);model('furniture/books',[10,1.1,-7.6],.7,0,props);model('furniture/pottedPlant',[-11.5,.34,-2.2],3.2,0,props);
 const selectionGeometry=new T.RingGeometry(.46,.52,32);selectionGeometry.rotateX(-Math.PI/2);k.geometries.add(selectionGeometry);const selectionRing=new T.Mesh(selectionGeometry,new T.MeshBasicMaterial({color:'#ffd061',toneMapped:false}));selectionRing.name='geo-highlighted-crew-desk';selectionRing.scale.x=2.2;selectionRing.visible=false;root.add(selectionRing);
 const photoRequests=new Set<HTMLImageElement>();let disposed=false,release=()=>{},mapTexture:T.Texture|undefined,photoTexture:T.Texture|undefined,photoSource='',routeKey='',orientationKey='',lastRound:unknown;
 const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 function point(mesh:T.Object3D,pin:GlobePin,radius=3.5){const p=globePoint(pin,radius);mesh.position.set(p.x,p.y,p.z);}
 return {...k,seats,globe,sphere,screen,ready,pickables:[sphere,screen,confirm,map,ownChart],
  prepareVariants(){const objects=[target,flight,...revealPins,...routes,selectionRing],visibility=objects.map(o=>o.visible);objects.forEach(o=>o.visible=true);return()=>objects.forEach((o,i)=>o.visible=visibility[i]);},
  rotate(dx:number,dy:number){globe.rotation.y+=dx*.008;globe.rotation.x=Math.max(-1.45,Math.min(1.45,globe.rotation.x+dy*.006));},
  pinFromWorld(p:T.Vector3){globe.updateWorldMatrix(true,false);return globeLocation(globe.worldToLocal(p.clone()));},
  setView(yaw:number,pitch:number,fov:number,aspect:number){uniforms.view.value.set(yaw,pitch,fov*Math.PI/180,aspect);screen.userData.view=[yaw,pitch,fov,aspect];},
  setWorld(data:any){if(disposed||typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d')!;c.fillStyle='#4e8d9f';c.fillRect(0,0,1024,512);c.fillStyle='#afc39d';c.strokeStyle='#e1d3aa';c.lineWidth=.6;
   for(const feature of data.features??[]){const polygons=feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates:feature.geometry?.type==='Polygon'?[feature.geometry.coordinates]:[];for(const polygon of polygons){c.beginPath();for(const ring of polygon){ring.forEach(([lon,lat]:number[],i:number)=>{const x=(lon+180)/360*1024,y=(90-lat)/180*512;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.closePath();}c.fill('evenodd');c.stroke();}}
   mapTexture?.dispose();mapTexture=new T.CanvasTexture(canvas);mapTexture.colorSpace=T.SRGBColorSpace;globeMaterial.map=mapTexture;globeMaterial.color.set('#ffffff');globeMaterial.needsUpdate=true;root.userData.mapReady=true;
  },
  update(now:number,game:any,draft:any,reduced:boolean){
   ownChart.userData.pickDisabled=ownSeat<0||draft.geoView!=='desk';globe.visible=armillary.visible=draft.geoView!=='desk';crewCards.orient(ownSeat,draft.geoView==='desk');
   const reveal=['roundReveal','done'].includes(game.stage),pin=reveal?game.mine?.answer:game.mine?.submitted?game.mine.answer:draft.pin??game.mine?.answer,place=reveal?game.reveal?.place:null,rows=reveal?game.reveal?.players??[]:[];
   if(lastRound!==game.round){lastRound=game.round;routeKey='';orientationKey='';globe.rotation.set(0,0,0);}
   own.visible=!!pin&&!reveal;if(pin)point(own,pin);target.visible=!!place;if(place)point(target,place);
   sphere.userData.pickDisabled=!root.userData.mapReady;confirm.userData.pickDisabled=!pin||reveal||!game.mine||!!game.mine.submitted||!!game.mine.abandoned;confirm.visible=confirmText.visible=!reveal;
   const key=`${game.round}:${reveal}:${JSON.stringify(rows)}`;if(key!==routeKey){routeKey=key;revealPins.forEach((marker,i)=>{const row=rows.find((r:any)=>r.id===crew[i].id);marker.visible=!!place&&!!row?.guess;routes[i].visible=marker.visible;if(marker.visible){point(marker,row.guess);const a=routes[i].geometry.attributes.position;for(let j=0;j<=36;j++){const q=globeRoute(row.guess,place,j/36,3.56);a.setXYZ(j,q.x,q.y,q.z);}a.needsUpdate=true;routes[i].geometry.computeBoundingSphere();}});}
   const selected=geoResultSelection(game,crew,draft),orientation=`${routeKey}:${selected?.id??''}`;
   if(orientation!==orientationKey){orientationKey=orientation;if(place){const midpoint=selected?globeRoute(selected.guess,place,.5,1):null,focus=midpoint?globeLocation(midpoint):place;globe.rotation.set(focus.lat*Math.PI/180,-Math.PI/2-focus.lon*Math.PI/180,0);}}
   revealPins.forEach((marker,i)=>{marker.scale.setScalar(selected?.index===i?1.8:1);(routes[i].material as T.LineBasicMaterial).opacity=selected?(selected.index===i?1:.18):.8;});
   selectionRing.visible=!!selected;if(selected)selectionRing.position.set(seats[selected.index].x,1.238,seats[selected.index].z-.65);
   root.userData.highlight=selected?{id:selected.id,index:selected.index,name:selected.name,distance:selected.distance,seat:seats[selected.index].toArray(),routes:routes.map((r,i)=>({id:crew[i].id,visible:r.visible,opacity:(r.material as T.LineBasicMaterial).opacity,scale:revealPins[i].scale.x}))}:null;
   const travel=geoFlightFrame(game,now,reduced);flight.visible=travel.visible&&(!selected||selected.id===me);if(flight.visible){const q=globeRoute(pin,place,travel.progress,3.7);flight.position.set(q.x,q.y,q.z);}
   const cards=geoCrewCards(game,crew).map(card=>({...card,highlighted:!!selected&&card.id===selected.id}));crewCards.update(cards);root.userData.crewCards=cards;root.userData.flight={...travel,visible:flight.visible,position:flight.visible?flight.position.toArray():null};
   const ownResult=rows.find((r:any)=>r.id===me);status.userData.setText(selected?`${selected.name} · ${typeof selected.distance==='number'?Math.round(selected.distance).toLocaleString('de-DE')+' KM ZUM ZIEL':'TIPP IM VERGLEICH'}`:place?`${place.name??'DER GESUCHTE ORT'}${typeof ownResult?.distance==='number'?` · DEIN WEG ${Math.round(ownResult.distance).toLocaleString('de-DE')} KM`:''}`:pin?`${Number(pin.lat).toFixed(2)}° · ${Number(pin.lon).toFixed(2)}°${game.mine?.submitted?' · VERSIEGELT':' · AUF DER KARTE VERFEINERN'}`:'DREHE DEN GLOBUS · TIPPE FÜR DEINEN PIN');
   if(game.image&&game.image!==photoSource&&typeof Image!=='undefined'){photoSource=game.image;const source=photoSource;uniforms.photo.value=placeholder;screen.userData.source='';photoTexture?.dispose();photoTexture=undefined;const request=new Image();photoRequests.add(request);request.onload=()=>{photoRequests.delete(request);if(disposed||source!==photoSource)return;photoTexture=new T.Texture(request);photoTexture.colorSpace=T.SRGBColorSpace;photoTexture.flipY=false;photoTexture.needsUpdate=true;uniforms.photo.value=photoTexture;screen.userData.source=source;};request.onerror=()=>photoRequests.delete(request);request.src=source;}
   root.userData.pin=pin??null;root.userData.revealCount=rows.filter((r:any)=>r.guess).length;root.userData.targetVisible=!!place;
  },dispose(){disposed=true;crewCards.dispose();release();photoRequests.forEach(request=>{request.onload=null;request.onerror=null;request.src='';});photoRequests.clear();placeholder.dispose();mapTexture?.dispose();photoTexture?.dispose();screenMaterial.dispose();globeMaterial.dispose();routes.forEach(r=>(r.material as T.Material).dispose());k.dispose();}};
}
