import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Merge only explicitly static siblings, retaining moving ship/cannon parents. */
export function batchArena(root: THREE.Object3D) {
  const source = new Set<THREE.BufferGeometry>();
  const parents: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node.children.length) parents.push(node);
  });
  for (const parent of parents) {
    const batches = new Map<string, THREE.Mesh[]>();
    for (const object of parent.children) {
      const mesh = object as THREE.Mesh;
      if (
        !mesh.isMesh ||
        (mesh as THREE.InstancedMesh).isInstancedMesh ||
        mesh.userData.dynamic ||
        Array.isArray(mesh.material)
      )
        continue;
      const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
      const batch = batches.get(key) ?? [];
      batch.push(mesh);
      batches.set(key, batch);
    }
    for (const meshes of batches.values()) {
      if (meshes.length < 2) continue;
      const transformed = meshes.map((mesh) => {
        mesh.updateMatrix();
        source.add(mesh.geometry);
        const geometry = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrix);
        return geometry;
      });
      const geometry = mergeGeometries(transformed, false);
      for (const g of transformed) g.dispose();
      if (!geometry) continue;
      const batch = new THREE.Mesh(geometry, meshes[0].material);
      batch.castShadow = meshes[0].castShadow;
      batch.receiveShadow = meshes[0].receiveShadow;
      batch.name = "batched-arena";
      batch.matrixAutoUpdate = false;
      for (const mesh of meshes) parent.remove(mesh);
      parent.add(batch);
    }
  }
  const retained = new Set<THREE.BufferGeometry>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) retained.add(mesh.geometry);
  });
  for (const geometry of source)
    if (!retained.has(geometry)) geometry.dispose();
}
