"""Prepare Joachim Bornemann's CC0 skeletal octopus for Krakensturm.

Run with Blender in background mode and --disable-autoexec. The source remains
unchanged. All derived assets retain the original weighted character skeleton.
"""
import bpy
import json
import os
import sys
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "outputs/model-research/octopus-joachim-bornemann.blend"
OUT = ROOT / "outputs/model-research"
PUBLIC = ROOT / "public/boss-models"


def inspect():
    result = {
        "version": bpy.app.version_string,
        "objects": [],
        "actions": [],
        "materials": [],
        "collections": [c.name for c in bpy.data.collections],
    }
    for ob in bpy.data.objects:
        entry = {
            "name": ob.name, "type": ob.type, "parent": ob.parent.name if ob.parent else None,
            "location": list(ob.location), "rotation": list(ob.rotation_euler),
            "scale": list(ob.scale), "dimensions": list(ob.dimensions),
            "modifiers": [{"name": m.name, "type": m.type, "show_viewport": m.show_viewport,
                           "object": getattr(getattr(m, "object", None), "name", None)} for m in ob.modifiers],
            "materials": [m.name for m in ob.data.materials] if ob.type == "MESH" else [],
        }
        if ob.type == "MESH":
            entry.update(vertices=len(ob.data.vertices), faces=len(ob.data.polygons),
                         uv_layers=list(ob.data.uv_layers.keys()),
                         vertex_groups=[v.name for v in ob.vertex_groups])
        if ob.type == "ARMATURE":
            entry["bones"] = [{"name": bone.name, "parent": bone.parent.name if bone.parent else None,
                              "deform": bone.use_deform, "segments": bone.bbone_segments,
                              "head": list(bone.head_local), "tail": list(bone.tail_local),
                              "constraints": [{"type": c.type, "name": c.name} for c in ob.pose.bones[bone.name].constraints]}
                             for bone in ob.data.bones]
            entry["pose_library"] = getattr(getattr(ob, "pose_library", None), "name", None)
        result["objects"].append(entry)
    for a in bpy.data.actions:
        result["actions"].append({"name": a.name, "range": list(a.frame_range),
                                  "markers": [{"name": p.name, "frame": p.frame} for p in getattr(a, "pose_markers", [])],
                                  "fcurves": len(a.fcurves) if hasattr(a, "fcurves") else None})
    for m in bpy.data.materials:
        result["materials"].append({"name": m.name, "nodes": [{"name": n.name, "type": n.type,
                                                                             "image": n.image.name if n.type == "TEX_IMAGE" and n.image else None}
                                                                            for n in m.node_tree.nodes] if m.use_nodes else []})
    (OUT / "kraken-inspection.json").write_text(json.dumps(result, indent=2), encoding="utf8")
    print(json.dumps({"objects": [(x["name"], x["type"], x.get("vertices"), len(x.get("bones", []))) for x in result["objects"]],
                      "actions": result["actions"], "materials": [x["name"] for x in result["materials"]]}, indent=2))


def select(ob):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def texture_bake(body):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 4
    scene.render.bake.margin = 12
    scene.render.bake.use_clear = True
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    select(body)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.003, correct_aspect=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    images = {}
    for channel, bake_type in [("color", "DIFFUSE"), ("normal", "NORMAL"), ("roughness", "ROUGHNESS")]:
        cache = OUT / f"kraken-{channel}.png"
        if cache.exists():
            images[channel] = bpy.data.images.load(str(cache), check_existing=True)
            if channel != "color": images[channel].colorspace_settings.name = "Non-Color"
            continue
        image = bpy.data.images.new(f"Kraken_{channel}", width=2048, height=2048, alpha=False)
        if channel != "color":
            image.colorspace_settings.name = "Non-Color"
        for material in body.data.materials:
            node = material.node_tree.nodes.new("ShaderNodeTexImage")
            node.name = f"BAKE_{channel}"
            node.image = image
            material.node_tree.nodes.active = node
            node.select = True
        print(f"BAKING {channel}", flush=True)
        bpy.ops.object.bake(type=bake_type)
        image.filepath_raw = str(cache)
        image.file_format = "PNG"
        image.save()
        images[channel] = image
    material = bpy.data.materials.new("Kraken • weathered wet skin")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Roughness"].default_value = 0.32
    for channel, image in images.items():
        node = nodes.new("ShaderNodeTexImage")
        node.image = image
        if channel == "color": links.new(node.outputs["Color"], shader.inputs["Base Color"])
        elif channel == "roughness":
            remap = nodes.new("ShaderNodeMapRange")
            remap.inputs["To Min"].default_value = 0.18
            remap.inputs["To Max"].default_value = 0.48
            links.new(node.outputs["Color"], remap.inputs["Value"])
            # A texture directly connected exports reliably. Keep authored roughness.
            links.new(node.outputs["Color"], shader.inputs["Roughness"])
        else:
            normal = nodes.new("ShaderNodeNormalMap")
            normal.inputs["Strength"].default_value = 0.6
            links.new(node.outputs["Color"], normal.inputs["Color"])
            links.new(normal.outputs["Normal"], shader.inputs["Normal"])
    body.data.materials.clear()
    body.data.materials.append(material)
    for polygon in body.data.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True


def prepare():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    original = bpy.data.objects["Armature"]
    body = bpy.data.objects["Octopus body"]
    old_action = bpy.data.actions["PoseLib"]
    original.animation_data_create().action = old_action
    original.animation_data.action_slot = old_action.slots[0]
    scene.frame_set(1)
    bpy.context.view_layer.update()
    original.data.pose_position = "REST"
    for modifier in list(body.modifiers):
        if modifier.type == "ARMATURE": body.modifiers.remove(modifier)
    select(body)
    before = sum(len(p.vertices) - 2 for p in body.data.polygons)
    decimate = body.modifiers.new("Browser silhouette optimization", "DECIMATE")
    decimate.ratio = min(1, 82000 / before)
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    print(f"MESH {before} -> {len(body.data.polygons)} triangles", flush=True)
    texture_bake(body)
    original.data.pose_position = "POSE"
    scene.frame_set(1)
    bpy.context.view_layer.update()

    # Convert B-Bone boundary transforms to ordinary weighted joints. This is
    # Blender's documented B-Bone deformation formula, not automatic re-rigging:
    # https://docs.blender.org/api/4.5/bpy.types.PoseBone.html#bpy.types.PoseBone.bbone_segment_matrix
    spec = []
    for bone in original.data.bones:
        pb = original.pose.bones[bone.name]
        count = bone.bbone_segments
        for index in range(count + 1 if count > 1 else 1):
            matrix = bone.matrix_local @ pb.bbone_segment_matrix(index, rest=True) if count > 1 else bone.matrix_local.copy()
            spec.append({"source": bone.name, "segment": index, "count": count,
                         "name": f"{bone.name}_joint_{index:02}", "rest": matrix})
    arm_data = bpy.data.armatures.new("KrakenSkeleton")
    arm = bpy.data.objects.new("KrakenSkeleton", arm_data)
    scene.collection.objects.link(arm)
    arm.matrix_world = original.matrix_world.copy()
    select(arm)
    bpy.ops.object.mode_set(mode="EDIT")
    root = arm_data.edit_bones.new("KrakenRoot")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.05)
    for entry in spec:
        bone = arm_data.edit_bones.new(entry["name"])
        bone.head = entry["rest"].translation
        bone.tail = bone.head + entry["rest"].to_3x3() @ Vector((0, 0.02, 0))
        bone.matrix = entry["rest"]
        bone.parent = root
        bone.use_deform = True
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones: pb.rotation_mode = "QUATERNION"
    source_groups = {group.index: group.name for group in body.vertex_groups}
    weight_rows = []
    to_armature = original.matrix_world.inverted() @ body.matrix_world
    for vertex in body.data.vertices:
        point = to_armature @ vertex.co
        weights = {}
        for influence in vertex.groups:
            name = source_groups[influence.group]
            pb = original.pose.bones.get(name)
            if pb is None or influence.weight <= 0: continue
            if pb.bone.bbone_segments > 1:
                index, blend = pb.bbone_segment_index(point)
                for i, fraction in [(index, 1 - blend), (index + 1, blend)]:
                    key = f"{name}_joint_{i:02}"
                    weights[key] = weights.get(key, 0) + influence.weight * fraction
            else:
                key = f"{name}_joint_00"
                weights[key] = weights.get(key, 0) + influence.weight
        # Three.js uses four GPU skin influences. Keep and normalize the four
        # strongest contributions from the exact original deformation weights.
        strongest = sorted(weights.items(), key=lambda item: item[1], reverse=True)[:4]
        total = sum(weight for _, weight in strongest)
        weight_rows.append({name: weight / total for name, weight in strongest} if total else {})
    body.vertex_groups.clear()
    groups = {entry["name"]: body.vertex_groups.new(name=entry["name"]) for entry in spec}
    for index, row in enumerate(weight_rows):
        for name, weight in row.items():
            if weight > 1e-6: groups[name].add([index], weight, "REPLACE")
    world = body.matrix_world.copy()
    body.parent = arm
    body.matrix_world = world
    modifier = body.modifiers.new("Original weighted skeleton", "ARMATURE")
    modifier.object = arm
    modifier.use_deform_preserve_volume = False

    # Skin the original eye meshes rigidly to their actual source head bone,
    # preserving their original bone-parent motion rather than leaving them floating.
    eyes = [bpy.data.objects["Eye.L."], bpy.data.objects["Eye.R."]]
    for eye in eyes:
        print("EYE_PARENT", eye.name, eye.parent_type, eye.parent_bone, flush=True)
        world = eye.matrix_world.copy()
        source_name = eye.parent_bone if eye.parent_bone in original.data.bones else "Bone"
        eye.parent = arm
        eye.parent_type = "OBJECT"
        eye.matrix_world = world
        eye.vertex_groups.clear()
        eye.vertex_groups.new(name=f"{source_name}_joint_00").add(list(range(len(eye.data.vertices))), 1, "REPLACE")
        modifier = eye.modifiers.new("Head attachment", "ARMATURE")
        modifier.object = arm
        # Retain the original sculpt's material partition for sclera and pupil.
        for slot in eye.material_slots:
            old = slot.material
            mat = bpy.data.materials.new(f"Kraken eye {old.name}")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            bsdf.inputs["Base Color"].default_value = (0.015, 0.009, 0.006, 1) if "schwarz" in old.name else (0.43, 0.28, 0.13, 1)
            bsdf.inputs["Roughness"].default_value = 0.14
            bsdf.inputs["Coat Weight"].default_value = 0.5
            slot.material = mat

    clips = [
        ("idle", 4.0, [(0, 2), (0.5, 3), (1, 2)]),
        ("rise", 3.0, [(0, 1), (0.65, 3), (1, 2)]),
        ("attack", 2.4, [(0, 2), (0.32, 4), (0.6, 1.7), (1, 2)]),
        ("hit", 0.8, [(0, 2), (0.3, 3.5), (1, 2)]),
        ("defeat", 3.5, [(0, 2), (0.5, 4), (1, 1)]),
    ]
    # Avoid switching an action on the source while its four poses are sampled.
    scene.render.fps = 24
    for name, duration, keys in clips:
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        arm.animation_data_create().action = None
        frames = round(duration * 24)
        samples = {entry["name"]: {"location": [], "rotation_quaternion": [], "scale": []} for entry in spec}
        inverse_rest = {entry["name"]: arm.data.bones[entry["name"]].matrix_local.inverted() for entry in spec}
        for frame in range(frames + 1):
            t = frame / frames
            for k in range(len(keys) - 1):
                start, first = keys[k]
                end, last = keys[k + 1]
                if t <= end + 1e-8:
                    u = (t - start) / (end - start)
                    u = u * u * (3 - 2 * u)
                    pose_time = first + (last - first) * u
                    break
            scene.frame_set(math.floor(pose_time), subframe=pose_time % 1)
            bpy.context.view_layer.update()
            for entry in spec:
                pb = original.pose.bones[entry["source"]]
                matrix = pb.matrix @ pb.bbone_segment_matrix(entry["segment"], rest=False) if entry["count"] > 1 else pb.matrix.copy()
                location, rotation, scale = (inverse_rest[entry["name"]] @ matrix).decompose()
                values = samples[entry["name"]]
                if values["rotation_quaternion"] and rotation.dot(values["rotation_quaternion"][-1]) < 0: rotation.negate()
                values["location"].append(location.copy())
                values["rotation_quaternion"].append(rotation.copy())
                values["scale"].append(scale.copy())
        # Batch curve writes avoid re-evaluating hundreds of bones per key insert.
        for bone_name, properties in samples.items():
            for property_name, values in properties.items():
                for axis in range(len(values[0])):
                    curve = action.fcurves.new(data_path=f'pose.bones["{bone_name}"].{property_name}', index=axis)
                    curve.keyframe_points.add(len(values))
                    curve.keyframe_points.foreach_set("co", [number for frame, value in enumerate(values) for number in (frame, value[axis])])
                    for point in curve.keyframe_points: point.interpolation = "LINEAR"
                    curve.update()
        track = arm.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, 0, action)
        strip.action_frame_start = 0
        strip.action_frame_end = frames
        track.mute = True
        print("CLIP", name, frames, flush=True)
    arm.animation_data.action = None
    for track in arm.animation_data.nla_tracks: track.mute = False
    # Keep the source rig for inspection in the intermediate .blend, but don't export it.
    original.hide_render = True
    original.hide_set(True)
    if original.parent: original.parent.hide_render = True
    # Rotate the entire imported animal upright; local +Y mantle becomes up,
    # dorsal side becomes glTF +Z. The runtime handles normalization.
    wrapper = bpy.data.objects.new("Kraken", None)
    scene.collection.objects.link(wrapper)
    world = arm.matrix_world.copy()
    arm.parent = wrapper
    arm.matrix_world = world
    wrapper.rotation_euler.x = math.pi / 2
    scene.frame_start = 0
    scene.frame_end = 96
    select(arm)
    for ob in [body, *eyes, wrapper]: ob.select_set(True)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "kraken-prepared.blend"))
    bpy.ops.export_scene.gltf(filepath=str(PUBLIC / "kraken.glb"), export_format="GLB", use_selection=True,
                              export_animations=True, export_animation_mode="NLA_TRACKS",
                              export_force_sampling=True, export_frame_range=False,
                              export_skins=True, export_all_influences=False,
                              export_yup=True, export_apply=False,
                              export_extras=True)
    info = {"originalBones": len(original.data.bones), "exportBones": len(arm.data.bones),
            "vertices": len(body.data.vertices), "triangles": sum(len(p.vertices)-2 for p in body.data.polygons),
            "animations": [{"name": name, "seconds": duration} for name, duration, _ in clips],
            "bytes": (PUBLIC / "kraken.glb").stat().st_size,
            "orientation": "Upright glTF +Y, dorsal/front +Z; preserve wrapper transform",
            "method": "B-Bone boundary matrices sampled from author's PoseLib; original skin weights split using Blender bbone_segment_index; no automatic reweighting"}
    (OUT / "kraken-export-report.json").write_text(json.dumps(info, indent=2), encoding="utf8")
    (PUBLIC / "kraken-license.txt").write_text(
        "Octopus vulgaris procedural & rigged\nAuthor: Joachim Bornemann\n"
        "Source: https://www.blenderkit.com/asset-gallery-detail/85c9bbbe-b4ab-4247-b17d-31be195132a8/\n"
        "License: CC0 1.0 Universal\nhttps://creativecommons.org/publicdomain/zero/1.0/\n"
        "Adaptation for Party Olymp: mesh simplification, procedural skin baked to textures, "
        "B-Bone segment deformation exported as skeletal joints, five animation clips "
        "interpolated from the original artist's four poses, upright presentation.\n", encoding="utf8")
    print(json.dumps(info, indent=2), flush=True)


def preview():
    bpy.ops.wm.open_mainfile(filepath=str(OUT / "kraken-prepared.blend"))
    scene = bpy.context.scene
    arm = bpy.data.objects["KrakenSkeleton"]
    for track in arm.animation_data.nla_tracks: track.mute = track.name != "idle"
    scene.frame_set(0)
    bpy.context.view_layer.update()
    meshes = [ob for ob in arm.children if ob.type == "MESH"]
    points = [ob.matrix_world @ vertex.co for ob in meshes for vertex in ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
    lower = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    upper = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (lower + upper) / 2
    size = max(upper-lower)
    print("PREVIEW_BOUNDS", list(lower), list(upper), flush=True)
    camera_data = bpy.data.cameras.new("Kraken review camera")
    camera = bpy.data.objects.new("Kraken review camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = center + Vector((size * 0.36, -size * 1.5, size * 0.12))
    camera.rotation_euler = (center-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = size * 1.25
    scene.camera = camera
    for name, offset, power, color in [("Key", (1, -1, 1.5), 180, (0.56,0.76,1)), ("Rim", (-1, .6, 1), 280, (.16,.75,1)), ("Fill", (-1,-.5,0), 90, (1,.64,.34))]:
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = power * size * size
        light_data.color = color
        light_data.shape = 'DISK'
        light_data.size = size
        light = bpy.data.objects.new(name, light_data)
        scene.collection.objects.link(light)
        light.location = center + Vector(offset) * size
        light.rotation_euler = (center-light.location).to_track_quat('-Z','Y').to_euler()
    scene.world = bpy.data.worlds.new("Kraken black review background")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.009,0.015,0.025,1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.15
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.cycles.device = 'CPU'
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    for clip, frame in [("idle",0),("attack",18),("defeat",75)]:
        for track in arm.animation_data.nla_tracks: track.mute = track.name != clip
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        points = [ob.matrix_world @ vertex.co for ob in meshes for vertex in ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
        lower = Vector(tuple(min(p[i] for p in points) for i in range(3)))
        upper = Vector(tuple(max(p[i] for p in points) for i in range(3)))
        print("CLIP_BOUNDS", clip, list(lower), list(upper), flush=True)
        print("VISIBILITY", [(ob.name,ob.hide_render,ob.hide_viewport,ob.hide_get()) for ob in [arm,*meshes,scene.camera]], flush=True)
        scene.render.filepath = str(OUT / f"kraken-preview-{clip}.png")
        bpy.ops.render.render(write_still=True)


def diagnose():
    bpy.ops.wm.open_mainfile(filepath=str(OUT / "kraken-prepared.blend"))
    arm = bpy.data.objects["KrakenSkeleton"]
    body = bpy.data.objects["Octopus body"]
    original = bpy.data.objects["Armature"]
    for track in arm.animation_data.nla_tracks:
        print("TRACK",track.name,[(s.action.name,s.action_slot_handle,len(s.action.slots),s.frame_start,s.frame_end) for s in track.strips], flush=True)
    for frame in [0,1,2,3,4,18,75]:
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        p=arm.pose.bones['Tentakel.R.001_joint_00']
        src=original.pose.bones['Tentakel.R.001']
        print("FRAME",frame,"derived",list(p.location),list(p.scale),list(p.rotation_quaternion),"source",list(src.rotation_quaternion),list(src.scale), "body", body.hide_render,flush=True)
    action=bpy.data.actions['idle']
    for f in list(action.fcurves)[:10]: print("CURVE",f.data_path,f.array_index,[(p.co[0],p.co[1]) for p in list(f.keyframe_points)[::24]],flush=True)


def diagnose_source():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    arm = bpy.data.objects['Armature']
    print("ARM_VIS",arm.hide_viewport,arm.hide_get(),arm.hide_render,arm.data.pose_position,flush=True)
    arm.hide_set(False)
    arm.hide_viewport = False
    arm.data.pose_position = 'POSE'
    arm.animation_data_create().action=bpy.data.actions['PoseLib']
    action = bpy.data.actions['PoseLib']
    arm.animation_data.action_slot = action.slots[0]
    print("SOURCE_ACTION",arm.animation_data.action_slot_handle,[(s.identifier,s.handle) for s in action.slots],arm.animation_data.use_nla,flush=True)
    for f in action.fcurves:
        if abs(f.evaluate(1)-f.evaluate(4)) > .1:
            print("CHANGING",f.data_path,f.array_index,[f.evaluate(x) for x in [1,2,3,4]],f.mute,flush=True)
            break
    for frame in [1,2,3,4]:
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        for name in ['Tentakel.R.001','Tentakel.R.010','Tentakel.L.018']:
            pb=arm.pose.bones[name]
            ev=evaluated.pose.bones[name]
            print("SOURCE",frame,name,"quat",list(pb.rotation_quaternion),"mat",list(pb.matrix.to_quaternion()),"eval",list(ev.matrix.to_quaternion()),"curve",pb.bbone_curveinx,pb.bbone_curveinz,flush=True)


if __name__ == "__main__":
    if "--source" in sys.argv: diagnose_source()
    elif "--diagnose" in sys.argv: diagnose()
    elif "--preview" in sys.argv: preview()
    else:
        bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
        inspect()
        if "--prepare" in sys.argv: prepare()
