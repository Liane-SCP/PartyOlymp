"""Convert the author's animated Rock Golem into a self-contained, PBR glTF.

Blender 4.5 LTS:
  blender --background --factory-startup --disable-autoexec \
      --python scripts/assets/prepare-colossus.py -- --render

The original CC-BY 3.0 file is downloaded only if it is missing. Its original
armature, authored animation curves and UVs are retained; no substitute rig or
generated creature geometry is introduced.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import urllib.request

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SOURCE_URL = "https://opengameart.org/sites/default/files/RockGolem.blend"
SOURCE_PAGE = "https://opengameart.org/content/rock-golem"
ACTION_NAMES = [
    "Attack1", "Attack2", "Death", "Hurt1", "Hurt2", "Hurt3", "Idle", "Run",
    "Sleep_End", "Sleep_Idle", "Sleep_Start", "Throw_Rock", "Throw_Rock2", "Walk",
]
args = argparse.ArgumentParser()
args.add_argument("--source", type=Path, default=ROOT / "outputs/model-research/rock-golem.blend")
args.add_argument("--output", type=Path, default=ROOT / "public/boss-models/colossus.glb")
args.add_argument("--render", action="store_true")
options = args.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
options.source.parent.mkdir(parents=True, exist_ok=True)
options.output.parent.mkdir(parents=True, exist_ok=True)
if not options.source.exists():
    urllib.request.urlretrieve(SOURCE_URL, options.source)

bpy.ops.wm.open_mainfile(filepath=str(options.source), load_ui=False, use_scripts=False)
scene = bpy.context.scene
scene.render.fps = 24
armature = bpy.data.objects["Armature"]
character = bpy.data.objects["stone"]
stone_prop = bpy.data.objects.get("Rock 2")

# Old Blender Internal materials are intentionally rebuilt from the exact image
# assignments in the original file. Loading this 2.69 scene in current Blender
# otherwise silently produces plain, untextured objects.
base_color = bpy.data.textures["Golem_diff"].image
normal_color = bpy.data.textures["Golem_norm"].image
base_color.colorspace_settings.name = "sRGB"
normal_color.colorspace_settings.name = "Non-Color"


def pbr_material(name, color_image, normal_image):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = 0.87
    shader.inputs["Metallic"].default_value = 0.0
    color_image.colorspace_settings.name = "sRGB"
    normal_image.colorspace_settings.name = "Non-Color"
    diffuse = nodes.new("ShaderNodeTexImage")
    diffuse.name = "Author diffuse texture"
    diffuse.image = color_image
    diffuse.location = (-600, 200)
    normal_texture = nodes.new("ShaderNodeTexImage")
    normal_texture.name = "Author tangent normal map"
    normal_texture.image = normal_image
    normal_texture.location = (-600, -100)
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.85
    normal.location = (-260, -100)
    links.new(diffuse.outputs["Color"], shader.inputs["Base Color"])
    links.new(normal_texture.outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], shader.inputs["Normal"])
    material.diffuse_color = (0.22, 0.24, 0.27, 1)
    return material


golem_material = pbr_material("Weathered basalt · original painted atlas", base_color, normal_color)
character.data.materials.clear()
character.data.materials.append(golem_material)
if stone_prop:
    prop_mat = pbr_material("Thrown stone · original atlas", bpy.data.textures["Rock_tex"].image, bpy.data.textures["Rock_norm"].image)
    stone_prop.data.materials.clear()
    stone_prop.data.materials.append(prop_mat)

# Recover the painted red eyes as an emissive mask. All rock pixels remain black
# in this derived channel; the original diffuse and normal textures are unchanged.
pixels = list(base_color.pixels[:])
emission_pixels = [0.0] * len(pixels)
for i in range(0, len(pixels), 4):
    red, green, blue = pixels[i:i + 3]
    intensity = min(1.0, max(0.0, (red - max(green, blue) * 1.8) * 5.0))
    emission_pixels[i] = intensity
    emission_pixels[i + 1] = intensity * 0.19
    emission_pixels[i + 2] = intensity * 0.018
    emission_pixels[i + 3] = 1.0
emission = bpy.data.images.new("Colossus · painted eye emission", width=base_color.size[0], height=base_color.size[1], alpha=False)
emission.pixels[:] = emission_pixels
emission.pack()
node = golem_material.node_tree.nodes.new("ShaderNodeTexImage")
node.image = emission
shader = golem_material.node_tree.nodes.get("Principled BSDF")
shader.inputs["Emission Strength"].default_value = 2.2
golem_material.node_tree.links.new(node.outputs["Color"], shader.inputs["Emission Color"])

# Mirror has to be made real before export so both sides retain their authored
# mirrored weights. The actual Armature modifier stays live and exports as skin.
bpy.ops.object.select_all(action="DESELECT")
character.select_set(True)
bpy.context.view_layer.objects.active = character
for modifier in list(character.modifiers):
    if modifier.type == "MIRROR":
        bpy.ops.object.modifier_apply(modifier=modifier.name)
for mesh in [character, stone_prop]:
    if mesh:
        for poly in mesh.data.polygons:
            poly.use_smooth = True

# Preserve every authored boss clip, remove only the author's turntable camera
# and sun Actions, which are unrelated to the game character.
for action in list(bpy.data.actions):
    if action.name not in ACTION_NAMES:
        bpy.data.actions.remove(action)
    else:
        action.use_fake_user = True
if armature.animation_data is None:
    armature.animation_data_create()
for track in list(armature.animation_data.nla_tracks):
    armature.animation_data.nla_tracks.remove(track)
armature.animation_data.action = bpy.data.actions["Idle"]
if armature.animation_data.action.slots:
    armature.animation_data.action_slot = armature.animation_data.action.slots[0]
scene.frame_set(0)
bpy.context.view_layer.update()

keep = {armature, character}
if stone_prop:
    keep.add(stone_prop)
for obj in list(bpy.data.objects):
    if obj not in keep:
        bpy.data.objects.remove(obj, do_unlink=True)
for obj in keep:
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.hide_render = False
    obj.select_set(True)
bpy.context.view_layer.objects.active = armature
scene.frame_start = 0
scene.frame_end = 255

bpy.ops.export_scene.gltf(
    filepath=str(options.output),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,
    export_frame_step=1,
    export_def_bones=True,
    export_anim_single_armature=True,
    export_anim_slide_to_zero=True,
    export_bake_animation=True,
    export_optimize_animation_size=True,
    export_materials="EXPORT",
    export_image_format="AUTO",
    export_normals=True,
    export_tangents=True,
    export_cameras=False,
    export_lights=False,
    export_extras=False,
)

report = {
    "source": SOURCE_PAGE,
    "sourceFile": SOURCE_URL,
    "sourceSha256": hashlib.sha256(options.source.read_bytes()).hexdigest(),
    "license": "CC-BY-3.0",
    "authors": ["hendori-sama", "umask007", "Dm3d"],
    "file": str(options.output),
    "size": options.output.stat().st_size,
    "authoredBones": len(armature.data.bones),
    "vertices": len(character.data.vertices),
    "polygons": len(character.data.polygons),
    "fps": scene.render.fps,
    "actions": [{"name": bpy.data.actions[name].name, "frames": list(bpy.data.actions[name].frame_range)} for name in ACTION_NAMES],
}
report_file = ROOT / "outputs/model-research/colossus-conversion.json"
report_file.parent.mkdir(parents=True, exist_ok=True)
report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
print("COLOSSUS_EXPORT " + json.dumps(report))

if options.render:
    # Review the actual exported creature's source mesh under restrained studio
    # lighting. This setup is created AFTER export and never enters the GLB.
    armature.animation_data.action = bpy.data.actions["Idle"]
    if armature.animation_data.action.slots:
        armature.animation_data.action_slot = armature.animation_data.action.slots[0]
    scene.frame_set(36)
    bpy.context.view_layer.update()
    bounds = [character.matrix_world @ Vector(corner) for corner in character.bound_box]
    low = Vector(tuple(min(v[i] for v in bounds) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in bounds) for i in range(3)))
    center = (low + high) * 0.5
    height = high.z - low.z
    bpy.ops.mesh.primitive_plane_add(size=200, location=(center.x, center.y, low.z - 0.02))
    floor = bpy.context.object
    floor_material = bpy.data.materials.new("Review floor")
    floor_material.diffuse_color = (0.018, 0.022, 0.029, 1)
    floor.data.materials.append(floor_material)
    world = bpy.data.worlds.new("Review night")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.12, 0.15, 0.2, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25
    scene.world = world

    def aim(obj, point):
        obj.rotation_euler = (point - obj.location).to_track_quat("-Z", "Y").to_euler()

    for name, offset, energy, color, size in [
        ("Warm key", (-6, -7, 8), 1600, (1, 0.79, 0.55), 5),
        ("Soft cold fill", (5, -3, 4), 900, (0.4, 0.62, 1), 5),
        ("Rim light", (2, 4, 7), 2200, (0.49, 0.69, 1), 4),
    ]:
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.color, light.shape, light.size = energy, color, "DISK", size
        obj = bpy.data.objects.new(name, light)
        scene.collection.objects.link(obj)
        obj.location = center + Vector(offset)
        aim(obj, center)
    camera = bpy.data.cameras.new("Review camera")
    camera.lens = 55
    obj = bpy.data.objects.new("Review camera", camera)
    scene.collection.objects.link(obj)
    obj.location = center + Vector((height * 1.2, -height * 2.45, height * 0.6))
    aim(obj, center)
    scene.camera = obj
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(ROOT / "outputs/model-research/colossus-converted-preview.png")
    bpy.ops.render.render(write_still=True)
