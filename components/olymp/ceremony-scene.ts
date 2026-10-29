import type * as Three from "three";
import { ceremonyHeight, ceremonyProgress, ceremonyLayout, ceremonyReveal } from "@/lib/ceremony";
import {createMapCharacter} from "./journey-characters";
import {batchStaticMeshes} from "./static-batches";
import type { CeremonyPlayer } from "./victory-ceremony";

/** The finale uses real geometry, lighting and instancing; no video or remote assets. */
export function createCeremonyScene(T: typeof Three, players: CeremonyPlayer[]) {
  const layout=ceremonyLayout(players),availableRanks=layout.groups.map(g=>g.rank),celebrationStart=ceremonyReveal(1,availableRanks)+.6;
  const scene = new T.Scene();
  scene.background = new T.Color(0x060b18);
  scene.fog = null;
  const materials: Three.Material[] = [];
  const geometries: Three.BufferGeometry[] = [];
  const mat = (color: number | string, metalness = 0, roughness = 0.5, glow = false) => {
    const m = new T.MeshStandardMaterial({ color, metalness:Math.min(.2,metalness), roughness:Math.max(.65,roughness),
      ...(glow ? { emissive: color, emissiveIntensity: 1.8 } : {}) });
    materials.push(m); return m;
  };
  const gold = mat(0xffc457, 0.85, 0.24);
  const dark = mat(0x101b30, 0.7, 0.32);
  const black = mat(0x0d1524, 0.05, 0.5);
  const glow = mat(0xffcf73, 0.3, 0.3, true);
  const medals = [gold, mat(0xc6ddf1, 0.8, 0.25), mat(0xd08b62, 0.75, 0.32)];
  const sphere = new T.SphereGeometry(1, 24, 16);
  const cube = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 48);
  geometries.push(sphere, cube, cylinder);
  function mesh(geo: Three.BufferGeometry, material: Three.Material, parent: Three.Object3D,
    position: number[], scale: number[]) {
    const m = new T.Mesh(geo, material);
    m.position.set(...position as [number, number, number]);
    m.scale.set(...scale as [number, number, number]);
    parent.add(m); return m;
  }
  function torus(radius: number, tube: number, material: Three.Material, parent: Three.Object3D) {
    const g = new T.TorusGeometry(radius, tube, 8, 72); geometries.push(g);
    const m = new T.Mesh(g, material); parent.add(m); return m;
  }
  scene.add(new T.HemisphereLight(0xd5e8ff, 0x111122, 2.3));
  const key = new T.DirectionalLight(0xffe9bb, 4); key.position.set(3, 8, 7); scene.add(key);
  const rim = new T.DirectionalLight(0x6e8cff, 4); rim.position.set(-6, 5, -4); scene.add(rim);
  const floor = mesh(cylinder, dark, scene, [0, -0.25, 0], [10, 0.45, 7.2]);
  floor.name = "ceremony-stage";
  for (const radius of [4.9, 6.1]) {
    const ring = torus(radius, 0.025, glow, scene); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02;
  }
  // A curved hall of illuminated columns frames the podium.
  for (let i = 0; i < 13; i++) {
    const angle = Math.PI * (0.12 + i * 0.76 / 12);
    const x = Math.cos(angle) * 8.5, z = -Math.sin(angle) * 6 - 1.5;
    mesh(cylinder, dark, scene, [x, 2.8, z], [0.24, 5.6, 0.24]);
    mesh(cylinder, glow, scene, [x, 2.9, z], [0.065, 5.7, 0.065]);
    mesh(sphere, gold, scene, [x, 5.85, z], [0.23, 0.23, 0.23]);
  }
  const beams = new T.Group();beams.userData.dynamic=true; scene.add(beams);
  const beamMat = new T.MeshBasicMaterial({ color: 0xffd68c, transparent: true,
    opacity: 0.045, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  materials.push(beamMat);
  for (let i = 0; i < 7; i++) {
    const g = new T.ConeGeometry(0.75, 11, 16, 1, true); geometries.push(g);
    const beam = new T.Mesh(g, beamMat);
    beam.position.set((i - 3) * 2.1, 5.3, -4);
    beam.rotation.z = (i - 3) * 0.11;
    beams.add(beam);
  }
  const podium=layout.groups.map(group=>{
    const rank=group.rank,metal=medals[rank-1],root=new T.Group();root.userData.dynamic=true;root.name='ceremony-rank-'+rank;root.position.x=group.x;scene.add(root);
    const radiusX=group.width/2,radiusZ=group.depth/2;
    const pedestal=mesh(cylinder,dark,root,[0,.5,0],[radiusX,1,radiusZ]);
    const trim=mesh(cylinder,metal,root,[0,1,0],[radiusX+.035,.09,radiusZ+.035]);
    const badge=mesh(sphere,metal,root,[0,.5,radiusZ],[.34,.34,.06]),digit=new T.Group();root.add(digit);
    const bars=rank===1?[[0,0,.1,.42]]:rank===2?[[0,.2,.28,.06],[.12,.1,.06,.2],[0,0,.28,.06],[-.12,-.1,.06,.2],[0,-.2,.28,.06]]:[[0,.2,.28,.06],[.12,0,.06,.4],[0,0,.28,.06],[0,-.2,.28,.06]];
    for(const [x,y,w,h]of bars)mesh(cube,black,digit,[x,y,radiusZ+.08],[w,h,.04]);
    return {root,pedestal,trim,badge,digit,rank};
  });
  const actors=players.map(p=>{const actor=createMapCharacter(T,p),place=layout.places.find(slot=>slot.id===p.id)!;actor.root.position.set(...place.position);actor.root.scale.setScalar(1.35);actor.root.userData.ceremonyRank=p.rank;scene.add(actor.root);return {...actor,id:p.id,rank:p.rank,place};});
  const trophy = new T.Group(); scene.add(trophy);
  trophy.userData.dynamic=true;trophy.scale.setScalar(0.8);
  const bowlGeo=new T.LatheGeometry([new T.Vector2(0.12,0),new T.Vector2(0.23,0.18),new T.Vector2(0.53,0.36),new T.Vector2(0.62,0.76)],48);
  geometries.push(bowlGeo);
  mesh(bowlGeo,gold,trophy,[0,0.25,0],[1,1,1]);
  mesh(cylinder,gold,trophy,[0,0.1,0],[0.1,0.35,0.1]);
  mesh(cylinder,gold,trophy,[0,-0.12,0],[0.32,0.1,0.32]);
  for(const side of [-1,1]) {
    const handle=torus(0.3,0.055,gold,trophy);handle.position.set(side*0.56,0.7,0);handle.scale.x=0.75;
  }
  const halo=torus(1,0.015,glow,trophy);halo.position.y=0.5;
  const starGeo=new T.OctahedronGeometry(0.06); geometries.push(starGeo);
  const stars=new T.InstancedMesh(starGeo,glow,100);scene.add(stars);
  const dummy=new T.Object3D();
  for(let i=0;i<100;i++) {
    dummy.position.set(Math.sin(i*137.5)*13,3+(i%17)*0.4,-5-Math.cos(i*71)*6);
    dummy.scale.setScalar(0.3+(i%5)*0.15);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);
  }
  const confettiGeo=new T.PlaneGeometry(0.065,0.14);geometries.push(confettiGeo);
  const confettiMat=new T.MeshBasicMaterial({side:T.DoubleSide});materials.push(confettiMat);
  const confetti=new T.InstancedMesh(confettiGeo,confettiMat,360);confetti.frustumCulled=false;scene.add(confetti);
  const colors=[0xffcf73,0xbcff5c,0x9b8aff,0x56d9ff,0xff7b9d];
  for(let i=0;i<360;i++) confetti.setColorAt(i,new T.Color(colors[i%5]));
  const fireGeo=new T.SphereGeometry(0.055,6,4);geometries.push(fireGeo);
  const fireMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});materials.push(fireMat);
  const fireworks=new T.InstancedMesh(fireGeo,fireMat,864);fireworks.frustumCulled=false;fireworks.name="3d-firework-bursts";scene.add(fireworks);
  const rockets=new T.InstancedMesh(fireGeo,fireMat,18);rockets.frustumCulled=false;rockets.name="3d-firework-rockets";scene.add(rockets);
  const fireColors=[0xffd483,0x8be7ff,0xd0a0ff,0xffa2b8,0xa7ffbd,0xffdc91];
  for(let i=0;i<864;i++)fireworks.setColorAt(i,new T.Color(fireColors[Math.floor(i/144)]));
  for(let i=0;i<18;i++)rockets.setColorAt(i,new T.Color(fireColors[Math.floor(i/3)]));
  const releaseBatch=batchStaticMeshes(scene,{mergeUnique:true});
  function update(time:number,reduced:boolean,intense=true,selected:string|null=null){
    const t=reduced?14:time;
    podium.forEach(p=>{const reveal=ceremonyProgress(t,p.rank,availableRanks),height=ceremonyHeight(p.rank);p.root.visible=reveal>0;p.pedestal.scale.y=height*reveal;p.pedestal.position.y=height*reveal/2;p.trim.position.y=height*reveal;p.badge.position.y=height*reveal/2;p.digit.position.y=p.badge.position.y;});
    actors.forEach(actor=>{const reveal=actor.rank<=3?ceremonyProgress(t,actor.rank,availableRanks):1;actor.root.visible=reveal>0;actor.root.position.set(actor.place.position[0],actor.rank<=3?ceremonyHeight(actor.rank)*reveal:.04,actor.place.position[2]);actor.update(t,false,4,reduced);const ring=actor.root.children[1] as Three.Mesh;ring.scale.setScalar(actor.id===selected?1.45:1);(ring.material as Three.Material&{opacity:number}).opacity=actor.id===selected?.95:.3;actor.root.userData.selected=actor.id===selected;});
    trophy.visible=t>=celebrationStart;
    trophy.position.set(layout.groups.find(g=>g.rank===1)?.x??0,4.1+Math.max(0,1-(t-celebrationStart)/2)*.5+(reduced?0:Math.sin(t*1.3)*0.08),-2.2);
    trophy.rotation.y=reduced?0:t*0.45;
    beams.rotation.y=reduced?0:Math.sin(t*0.2)*0.12;
    stars.rotation.y=reduced?0:t*0.008;
    confetti.visible=intense&&!reduced&&t>celebrationStart+.5&&t<26;
    if(confetti.visible) for(let i=0;i<360;i++) {
      const age=(t-celebrationStart-.5+(i%30)*0.15)%7;
      dummy.position.set(Math.sin(i*43.7)*7+Math.sin(t+i)*0.25,9-age*1.65,-3+Math.cos(i*21.2)*4);
      dummy.rotation.set(t+i,t*0.8+i,t*1.2+i);dummy.scale.setScalar(1);dummy.updateMatrix();confetti.setMatrixAt(i,dummy.matrix);
    }
    confetti.instanceMatrix.needsUpdate=true;
    fireworks.visible=rockets.visible=intense&&!reduced&&t>=celebrationStart&&t<25;
    scene.userData.fireworksActive=fireworks.visible;
    if(fireworks.visible) {
      for(let cluster=0;cluster<6;cluster++) {
        const elapsed=t-celebrationStart-cluster*0.65;
        const age=elapsed<0?-1:elapsed%4.5;
        const x=(cluster%2?1:-1)*(4.2+Math.floor(cluster/2)*1.2),z=-3.5-Math.floor(cluster/2)*1.4;
        for(let trail=0;trail<3;trail++) {
          const launch=age-trail*0.05;
          dummy.position.set(x,0.5+Math.max(0,launch)*5.7,z);
          dummy.scale.set(1.6-trail*0.3,5-trail,1.6-trail*0.3);
          if(launch<0||launch>0.9)dummy.scale.setScalar(0);
          dummy.rotation.set(0,0,0);dummy.updateMatrix();rockets.setMatrixAt(cluster*3+trail,dummy.matrix);
        }
        for(let spark=0;spark<48;spark++) for(let trail=0;trail<3;trail++) {
          const burst=age-0.9-trail*0.045,active=burst>=0&&burst<2.5;
          const a=spark*2.39996,y=(spark/47)*2-1,r=Math.sqrt(1-y*y),spread=Math.max(0,burst)*2.5;
          dummy.position.set(x+Math.cos(a)*r*spread,5.7+y*spread-burst*burst*0.75,z+Math.sin(a)*r*spread);
          dummy.scale.setScalar(active?(1-burst/2.5)*(1.4-trail*0.32):0);dummy.rotation.set(0,0,0);dummy.updateMatrix();
          fireworks.setMatrixAt(cluster*144+spark*3+trail,dummy.matrix);
        }
      }
      fireworks.instanceMatrix.needsUpdate=true;rockets.instanceMatrix.needsUpdate=true;
    }
  }
  return { scene, actors, layout, update, dispose() {
    actors.forEach(a=>a.dispose());releaseBatch();
    for(const g of new Set(geometries))g.dispose();
    for(const m of new Set(materials))m.dispose();
    confetti.dispose();fireworks.dispose();rockets.dispose();stars.dispose();
  }};
}
