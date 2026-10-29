import type * as Three from "three";
import type { ArenaFrame } from "./boss-models";

type T = typeof import("three");
export interface ColossusArmor {
  update: (frame: ArenaFrame) => void;
  /** Call before the owning rig disposes its shared skeleton and textures. */
  dispose: () => void;
  triangles: { body: number; helmet: number; breastplate: number };
}

/** Removable plates cut from the original sculpt, retaining its UVs and weights. */
export function createColossusArmor(
  THREE: T,
  model: Three.Group,
): ColossusArmor | null {
  const source = model.getObjectByName("stone") as
    Three.SkinnedMesh | undefined;
  const chest = model.getObjectByName("chest");
  if (
    !source?.isSkinnedMesh ||
    !source.geometry.index ||
    !chest ||
    !source.parent
  )
    return null;
  const original = source.geometry;
  const sourceIndex = original.index!;
  const material = (
    Array.isArray(source.material) ? source.material[0] : source.material
  ) as Three.MeshStandardMaterial;
  if (!material.isMeshStandardMaterial) return null;
  model.updateWorldMatrix(true, false);
  model.updateMatrixWorld(true);
  const toModel = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const meshToModel = new THREE.Matrix4().multiplyMatrices(
    toModel,
    source.matrixWorld,
  );
  const points: Three.Vector3[] = [];
  for (let i = 0; i < original.attributes.position.count; i++)
    points.push(
      source
        .getVertexPosition(i, new THREE.Vector3())
        .applyMatrix4(meshToModel),
    );
  const body: number[] = [],
    helmet: number[] = [],
    breastplate: number[] = [];
  const centroid = new THREE.Vector3();
  const skinIndices = original.attributes.skinIndex,
    weights = original.attributes.skinWeight;
  const faceBones = new Set(
    source.skeleton.bones.map((bone, i) =>
      /head|jaw|eyebrow/i.test(bone.name) ? i : -1,
    ),
  );
  const faceWeight = (index: number) => {
    let weight = 0;
    for (let j = 0; j < 4; j++)
      if (faceBones.has(skinIndices.getComponent(index, j)))
        weight += weights.getComponent(index, j);
    return weight;
  };
  for (let i = 0; i < sourceIndex.count; i += 3) {
    const ids = [
      sourceIndex.getX(i),
      sourceIndex.getX(i + 1),
      sourceIndex.getX(i + 2),
    ];
    centroid.set(0, 0, 0);
    for (const index of ids) centroid.addScaledVector(points[index], 1 / 3);
    // Keep the painted eyes, brow and jaw intact beneath the stone crown.
    const crown =
      centroid.y > 4.92 &&
      Math.abs(centroid.x) < 1.5 &&
      ids.every((index) => points[index].z < 1.65 || points[index].y > 4.82);
    const plate =
      !crown &&
      (centroid.x / 0.88) ** 2 + ((centroid.y - 3.62) / 0.68) ** 2 < 1 &&
      centroid.z > 1.06 &&
      ids.reduce((sum, id) => sum + faceWeight(id), 0) / 3 < 0.2;
    (crown ? helmet : plate ? breastplate : body).push(...ids);
  }
  // A different artist asset must not acquire accidental cuts from these masks.
  if (
    helmet.length < 90 ||
    breastplate.length < 60 ||
    body.length < sourceIndex.count * 0.6
  )
    return null;
  const geometries: Three.BufferGeometry[] = [],
    materials: Three.Material[] = [];
  const subset = (indices: number[]) => {
    const geometry = original.clone();
    geometry.setIndex(indices);
    geometry.clearGroups();
    geometries.push(geometry);
    return geometry;
  };
  const attach = (geometry: Three.BufferGeometry, surface: Three.Material) => {
    const mesh = new THREE.SkinnedMesh(geometry, surface);
    mesh.position.copy(source.position);
    mesh.quaternion.copy(source.quaternion);
    mesh.scale.copy(source.scale);
    mesh.bindMode = source.bindMode;
    mesh.bind(source.skeleton, source.bindMatrix);
    mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = true;
    source.parent!.add(mesh);
    return mesh;
  };
  source.geometry = subset(body);

  // Move inner surfaces in bind space so they continue using the author's real
  // skeleton. The inverse blended bone transform maps a posed point back to it.
  const boneMatrix = new THREE.Matrix4(),
    blended = new THREE.Matrix4(),
    desired = new THREE.Vector3();
  const fromModel = meshToModel.clone().invert();
  const toBindPosition = (index: number, point: Three.Vector3) => {
    blended.elements.fill(0);
    for (let j = 0; j < 4; j++) {
      const weight = weights.getComponent(index, j);
      if (!weight) continue;
      const bone = skinIndices.getComponent(index, j);
      boneMatrix.multiplyMatrices(
        source.skeleton.bones[bone].matrixWorld,
        source.skeleton.boneInverses[bone],
      );
      for (let k = 0; k < 16; k++)
        blended.elements[k] += boneMatrix.elements[k] * weight;
    }
    blended
      .premultiply(source.bindMatrixInverse)
      .multiply(source.bindMatrix)
      .invert();
    return desired.copy(point).applyMatrix4(fromModel).applyMatrix4(blended);
  };
  const linerMaterial = material.clone();
  linerMaterial.color.multiplyScalar(0.25);
  linerMaterial.emissive.setHex(0);
  linerMaterial.emissiveMap = null;
  linerMaterial.roughness = 1;
  linerMaterial.side = THREE.DoubleSide;
  materials.push(linerMaterial);
  const fragmentsRoot = new THREE.Group();
  fragmentsRoot.name = "colossus-authored-armor-fragments";
  model.add(fragmentsRoot);
  const sections = [helmet, breastplate].map((indices, section) => {
    const armor = attach(subset(indices), material);
    armor.name = section ? "colossus-breastplate" : "colossus-stone-crown";
    const inner = subset(indices);
    const position = inner.attributes.position as Three.BufferAttribute;
    for (const index of new Set(indices)) {
      const point = points[index].clone();
      if (!section) {
        point.x *= 0.94;
        point.y = Math.min(point.y, 4.78 + Math.max(0, point.y - 4.78) * 0.18);
        point.z = (point.z - 0.45) * 0.93 + 0.45;
      } else {
        point.z -= 0.44;
        point.x *= 0.95;
      }
      const bind = toBindPosition(index, point);
      position.setXYZ(index, bind.x, bind.y, bind.z);
    }
    position.needsUpdate = true;
    inner.computeVertexNormals();
    const lining = attach(inner, linerMaterial);
    lining.name = section ? "colossus-inner-chest" : "colossus-inner-crown";
    lining.visible = false;
    const buckets = Array.from(
      { length: section ? 4 : 5 },
      () => [] as number[],
    );
    for (let i = 0; i < indices.length; i += 3) {
      centroid
        .copy(points[indices[i]])
        .add(points[indices[i + 1]])
        .add(points[indices[i + 2]])
        .multiplyScalar(1 / 3);
      const bucket = section
        ? Number(centroid.x >= 0) + Number(centroid.y >= 3.6) * 2
        : Math.min(4, Math.max(0, Math.floor(((centroid.x + 1.5) / 3) * 5)));
      buckets[bucket].push(indices[i], indices[i + 1], indices[i + 2]);
    }
    const fragments = buckets
      .filter((bucket) => bucket.length)
      .map((ids, order) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(new Float32Array(ids.length * 3), 3),
        );
        const uv = new Float32Array(ids.length * 2);
        ids.forEach((index, i) => {
          uv[i * 2] = original.attributes.uv.getX(index);
          uv[i * 2 + 1] = original.attributes.uv.getY(index);
        });
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        geometries.push(geometry);
        const surface = material.clone();
        surface.side = THREE.DoubleSide;
        surface.transparent = true;
        materials.push(surface);
        const mesh = new THREE.Mesh(geometry, surface);
        mesh.castShadow = true;
        mesh.visible = false;
        mesh.frustumCulled = false;
        fragmentsRoot.add(mesh);
        return { mesh, ids, center: new THREE.Vector3(), order, surface };
      });
    return { armor, lining, fragments, baked: false };
  });

  const core = new THREE.Group();
  core.name = "colossus-exposed-core";
  core.visible = false;
  const corePoint = new THREE.Vector3(0, 3.62, 1.33).applyMatrix4(
    model.matrixWorld,
  );
  core.position.copy(chest.worldToLocal(corePoint));
  chest.add(core);
  const coreGeometry = new THREE.SphereGeometry(0.37, 24, 16);
  geometries.push(coreGeometry);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa12e,
    emissive: 0xff6b0b,
    emissiveIntensity: 4.5,
    roughness: 0.38,
    metalness: 0.1,
  });
  materials.push(coreMaterial);
  const heart = new THREE.Mesh(coreGeometry, coreMaterial);
  core.add(heart);
  const glowPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const radius = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5),
        i = (y * 32 + x) * 4;
      glowPixels[i] = 255;
      glowPixels[i + 1] = 102;
      glowPixels[i + 2] = 19;
      glowPixels[i + 3] = Math.round(Math.max(0, 1 - radius) ** 2 * 205);
    }
  const glowTexture = new THREE.DataTexture(glowPixels, 32, 32);
  glowTexture.needsUpdate = true;
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
  });
  materials.push(glowMaterial);
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.setScalar(1.5);
  core.add(glow);
  const coreLight = new THREE.PointLight(0xff7d22, 5, 3.4, 2);
  // Keep the light count stable across armor phases: no mid-fight shader variant compile.
  coreLight.position.copy(core.position);
  chest.add(coreLight);
  coreLight.intensity = 0;
  let disposed = false;
  const bake = (part: (typeof sections)[number]) => {
    model.updateWorldMatrix(true, false);
    model.updateMatrixWorld(true);
    meshToModel.multiplyMatrices(
      toModel.copy(model.matrixWorld).invert(),
      source.matrixWorld,
    );
    for (const fragment of part.fragments) {
      const position = fragment.mesh.geometry.attributes
        .position as Three.BufferAttribute;
      fragment.center.set(0, 0, 0);
      fragment.ids.forEach((index, i) => {
        const point = source
          .getVertexPosition(index, desired)
          .applyMatrix4(meshToModel);
        position.setXYZ(i, point.x, point.y, point.z);
        fragment.center.add(point);
      });
      fragment.center.multiplyScalar(1 / fragment.ids.length);
      for (let i = 0; i < position.count; i++)
        position.setXYZ(
          i,
          position.getX(i) - fragment.center.x,
          position.getY(i) - fragment.center.y,
          position.getZ(i) - fragment.center.z,
        );
      position.needsUpdate = true;
      fragment.mesh.geometry.computeVertexNormals();
    }
    part.baked = true;
  };
  const update = (frame: ArenaFrame) => {
    if (disposed) return;
    const revealing = frame.stage === "roundReveal" || frame.stage === "done";
    sections.forEach((part, index) => {
      const breaking =
        revealing && frame.phase === index && frame.breakProgress > 0;
      const removed = frame.phase > index || breaking;
      part.armor.visible = !removed;
      part.lining.visible = removed;
      if (!removed) part.baked = false;
      const age = Math.max(0, frame.elapsed - 8),
        flying = breaking && frame.motion > 0 && age < 2.2;
      if (flying && !part.baked) bake(part);
      for (const fragment of part.fragments) {
        fragment.mesh.visible = flying;
        if (!flying) continue;
        const side = fragment.center.x < 0 ? -1 : 1;
        fragment.mesh.position
          .copy(fragment.center)
          .addScaledVector(
            desired.set(
              side * (1.15 + fragment.order * 0.23),
              index ? 1.25 : 2.4,
              0.85 + fragment.order * 0.19,
            ),
            age,
          );
        fragment.mesh.position.y -= 2.25 * age * age;
        fragment.mesh.rotation.set(
          age * (index ? 1.15 : 0.8),
          side * age * 0.85,
          side * age * 0.6,
        );
        fragment.surface.opacity = Math.min(1, Math.max(0, (2.2 - age) / 0.65));
      }
    });
    core.visible =
      frame.phase >= 2 ||
      (frame.phase === 1 && revealing && frame.breakProgress > 0);
    const pulse = frame.motion ? Math.sin(frame.time * 5) * 0.045 : 0;
    const power = 1 - frame.victory;
    heart.scale.setScalar(1 + pulse);
    coreMaterial.emissiveIntensity = (4.5 + pulse * 12) * power;
    glowMaterial.opacity = (0.8 + pulse) * power;
    coreLight.intensity = core.visible ? (5 + pulse * 18) * power : 0;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    source.geometry = original;
    for (const part of sections) {
      part.armor.removeFromParent();
      part.lining.removeFromParent();
    }
    core.removeFromParent();
    coreLight.removeFromParent();
    fragmentsRoot.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    for (const surface of materials) surface.dispose();
    glowTexture.dispose();
  };
  return {
    update,
    dispose,
    triangles: {
      body: body.length / 3,
      helmet: helmet.length / 3,
      breastplate: breastplate.length / 3,
    },
  };
}
