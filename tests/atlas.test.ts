import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { catalog } from "../lib/game/catalog";
import { journeyLayout, islandThemes, islandViewSize } from "../lib/journey-world";
import { createJourneyScene } from "../components/olymp/journey-scene";

const selections = catalog.map(g => ({ id: g.id, rounds: 3, seconds: 45 }));
test("Every catalog game has its own physical island, unique theme and landmark", () => {
  const nodes = journeyLayout(selections);
  assert.equal(nodes.length, catalog.length);
  assert.equal(new Set(nodes.map(n => n.theme.landmark)).size, catalog.length);
  assert.equal(new Set(nodes.map(n => n.theme.name)).size, catalog.length);
  const world = createJourneyScene(T, selections, 0, 0, [], 0, []);
  const represented = new Set<number>();
  world.scene.traverse(object => {
    const mesh = object as T.InstancedMesh;
    if (!mesh.isInstancedMesh) return;
    for (const index of mesh.userData.islandIndices ?? []) if (index >= 0) represented.add(index);
  });
  assert.equal(represented.size, catalog.length, "Every selected game contributes rendered geometry, including islands beyond the old five-island window");
  for (const [i, g] of catalog.entries()) {
    assert.equal(world.roots[i].userData.landmark, islandThemes[g.id].landmark);
    assert.ok(world.scene.getObjectByName(islandThemes[g.id].landmark));
  }
  assert.ok(world.scene.getObjectByName("titan-guardian"));
  assert.ok(world.scene.getObjectByName("kraken-leviathan"));
  assert.ok(world.scene.getObjectByName("dragon-over-the-hort"));
  world.dispose();
});
test("Scenic chapters share an identity and render distinct ground palettes across the full catalog",()=>{
 const nodes=journeyLayout(selections),world=createJourneyScene(T,selections,0,0,[],0,[]);
 assert.equal(new Set(nodes.map(n=>n.region.id)).size,6);
 for(const n of nodes){assert.equal(n.realm,n.region.name);assert.equal(world.roots[n.index].userData.region,n.region.id);assert.equal(n.region,nodes.find(other=>other.chapter===n.chapter)!.region);}
 const terrainColors=new Set<string>(),instanceTints=new Set<string>(),tint=new T.Color();world.scene.traverse(o=>{if(o instanceof T.InstancedMesh){if(o.instanceColor)for(let i=0;i<o.count;i++){o.getColorAt(i,tint);instanceTints.add(tint.getHexString());}if(o.geometry.userData.organicCoast){const c=o.geometry.getAttribute('color');terrainColors.add([c.getX(0),c.getY(0),c.getZ(0)].map(v=>v.toFixed(5)).join(','));}}});
 assert.ok(terrainColors.size>=6,'Chapter ground palettes are absent from the rendered geometry');
 for(const n of nodes.filter(n=>n.game!=='dragon'&&n.game!=='kraken'))for(const color of n.region.foliage)assert.ok(instanceTints.has(color.slice(1)),'Batching lost the original regional leaf color');
 for(const name of['department-store-miniature','dice-salon-miniature','card-treehouse-miniature','measuring-hall-miniature','color-laboratory-miniature'])assert.ok(world.scene.getObjectByName(name),name);
 world.dispose();
});

test("Boss realms are three times wider and nine times the land area; all islands remain separated", () => {
  for (const selection of [selections, Array.from({ length: 40 }, () => selections[1])]) {
    const nodes = journeyLayout(selection);
    for (const a of nodes) for (const b of nodes) {
      if (a.index >= b.index) continue;
      assert.ok(Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]) > a.radius + b.radius + 5);
    }
  }
  const nodes = journeyLayout(selections), normal = nodes.find(n => !n.boss)!;
  for (const boss of nodes.filter(n => n.boss)) {
    assert.ok(Math.abs(boss.radius / normal.radius - 3) < 1e-10);
    assert.ok(Math.abs(boss.radius ** 2 / normal.radius ** 2 - 9) < 1e-10);
    assert.ok(islandViewSize(boss, 1.5) > islandViewSize(normal, 1.5));
  }
});
test("40 occurrences, repeated minigames and repeated bosses remain distinct and pickable", () => {
  const long = Array.from({ length: 40 }, (_, i) => selections[i % selections.length]);
  const world = createJourneyScene(T, long, 39, 20, [{ color: "#bcff5c" }], 20, [{ index: 0, victory: true }]);
  assert.equal(world.roots.length, 40); assert.equal(new Set(world.roots.map(r => r.position.toArray().join())).size, 40);
  assert.equal(world.nodes[0].game, world.nodes[21].game);
  assert.notDeepEqual(world.nodes[0].position, world.nodes[21].position);
  world.update(4, false); world.scene.updateMatrixWorld(true);
  const ray = new T.Raycaster(new T.Vector3(...world.nodes[39].position).add(new T.Vector3(0, 30, 0)), new T.Vector3(0, -1, 0));
  const ids = ray.intersectObjects(world.pickables, false).map(hit => hit.object.userData.islandIndex ?? hit.object.userData.islandIndices?.[hit.instanceId ?? -1]);
  assert.ok(ids.includes(39), "The last island can be selected on its actual batched geometry");
  const matrix = new T.Matrix4();
  world.scene.traverse(object => {
    if (!(object instanceof T.InstancedMesh)) return;
    for (let i = 0; i < object.count; i++) { object.getMatrixAt(i, matrix); assert.ok(matrix.elements.every(Number.isFinite)); }
  });
  world.dispose();
});
