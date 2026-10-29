"""Export the artist's native 141-bone hierarchy, preserving original skin weights."""
import bpy, bmesh, sys, math, json, importlib.util
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('kraken_source',Path(__file__).with_name('prepare-kraken.py'))
source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
OUT=ROOT/'outputs/model-research'; PUBLIC=ROOT/'public/boss-models'
bpy.ops.wm.open_mainfile(filepath=str(source.SOURCE))
scene=bpy.context.scene
arm=bpy.data.objects['Armature'];body=bpy.data.objects['Octopus body']
pose=bpy.data.actions['PoseLib'];arm.animation_data_create().action=pose;arm.animation_data.action_slot=pose.slots[0]
arm.hide_set(False);arm.hide_render=False
arm.data.pose_position='REST';scene.frame_set(1);bpy.context.view_layer.update()
source.select(body)
before=sum(len(p.vertices)-2 for p in body.data.polygons)
# The artist's straight rest-pose arms require their longitudinal loops when
# bending. Global collapse removed those loops while retaining tiny suckers:
# individual edges grew from 0.058 to 1.307 units, bridging entire tentacles.
# Protect the original sparse skin topology and simplify only dense detail.
# Edit-mode decimation leaves unselected vertices and their authored weights
# intact, unlike a weighted global collapse that can still erase these loops.
longest=[0.0]*len(body.data.vertices)
for edge in body.data.edges:
    a,b=edge.vertices
    length=(body.data.vertices[a].co-body.data.vertices[b].co).length
    longest[a]=max(longest[a],length);longest[b]=max(longest[b],length)
protected=sum(length>=.003 for length in longest)
original_max_edge=max(longest)
bpy.ops.object.mode_set(mode='EDIT')
bm=bmesh.from_edit_mesh(body.data);bm.select_mode={'VERT'};bm.verts.ensure_lookup_table()
for vertex in bm.verts:vertex.select_set(longest[vertex.index]<.003)
bm.select_flush_mode();bmesh.update_edit_mesh(body.data)
bpy.ops.mesh.decimate(ratio=.07,use_vertex_group=False)
bpy.ops.object.mode_set(mode='OBJECT')
triangles=sum(len(p.vertices)-2 for p in body.data.polygons)
max_edge=max((body.data.vertices[e.vertices[0]].co-body.data.vertices[e.vertices[1]].co).length for e in body.data.edges)
assert triangles<=180000, f'Browser triangle budget exceeded: {triangles}'
assert max_edge<=original_max_edge*1.02, f'Tentacle topology lost: {max_edge}'
print('PRESERVED_SKIN',json.dumps({'protectedVertices':protected,'trianglesBefore':before,'trianglesAfter':triangles,'maxEdgeBefore':original_max_edge,'maxEdgeAfter':max_edge}),flush=True)
# Changed topology creates a different UV atlas. Never reuse the old global-
# collapse bake, whose pixels belong to entirely different surface islands.
source.OUT=OUT/'kraken-preserved-uv-v1';source.OUT.mkdir(parents=True,exist_ok=True)
source.texture_bake(body)
# The native sixteen joints per arm retain a smooth silhouette with standard glTF skinning.
for bone in arm.data.bones: bone.bbone_segments=1
for modifier in body.modifiers:
    if modifier.type=='ARMATURE': modifier.use_deform_preserve_volume=False
arm.data.pose_position='POSE'
eyes=[bpy.data.objects['Eye.L.'],bpy.data.objects['Eye.R.']]
for eye in eyes:
    for slot in eye.material_slots:
        old=slot.material;material=bpy.data.materials.new('Kraken eye '+old.name);material.use_nodes=True
        bsdf=material.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value=(.015,.009,.006,1) if 'schwarz' in old.name else (.43,.28,.13,1)
        bsdf.inputs['Roughness'].default_value=.15
        slot.material=material
clips=[('idle',4,[(0,4),(.5,3.88),(1,4)]),('rise',3,[(0,2),(.7,4),(1,4)]),('attack',2.4,[(0,4),(.45,3.86),(.72,3.95),(1,4)]),('hit',.8,[(0,4),(.4,3.68),(1,4)]),('defeat',3.5,[(0,4),(.65,3),(1,2)])]

def cinematic_basis(pb, clip, progress):
    """Fan the artist's existing arm chains, without moving the mantle.

    Pair 002 bends mostly in depth in the source pose. A local quarter-turn
    reveals its existing S-curve to the camera. Attack adds a smooth lateral
    fan through the four original arm roots; no new bones or weights are used.
    """
    parts=pb.name.split('.')
    if len(parts)!=3 or parts[0]!='Tentakel' or parts[2] not in ['001','002','003','004']:
        return pb.matrix_basis.copy()
    side=-1 if parts[1]=='R' else 1
    number=int(parts[2])
    desired=pb.matrix.copy()
    if number==2:
        roll=90.0
        if clip=='idle':roll+=3*math.sin(progress*math.tau)
        elif clip=='rise':
            u=min(1,progress/.7);roll=35+55*u*u*(3-2*u)
        elif clip=='defeat':
            u=min(1,max(0,(progress-.2)/.8));roll*=1-u*u*(3-2*u)
        desired=desired@Matrix.Rotation(math.radians(side*roll),4,'Y')
    if clip=='attack':
        spread=math.sin(progress*math.pi)**2
        angle={1:-20,2:25,3:35,4:-40}[number]*spread
        origin=pb.head.copy()
        desired=Matrix.Translation(origin)@Matrix.Rotation(math.radians(-side*angle),4,'Z')@Matrix.Translation(-origin)@desired
    return pb.bone.convert_local_to_pose(
        desired,pb.bone.matrix_local,
        parent_matrix=pb.parent.matrix,
        parent_matrix_local=pb.parent.bone.matrix_local,
        invert=True,
    )

scene.render.fps=24
actions=[]
for name,duration,keys in clips:
    frames=round(duration*24);samples={p.name:[] for p in arm.pose.bones}
    arm.animation_data.action=pose;arm.animation_data.action_slot=pose.slots[0]
    for frame in range(frames+1):
        t=frame/frames
        for k in range(len(keys)-1):
            start,first=keys[k];end,last=keys[k+1]
            if t<=end+1e-8:
                u=(t-start)/(end-start);u=u*u*(3-2*u);p=first+(last-first)*u;break
        scene.frame_set(math.floor(p),subframe=p%1);bpy.context.view_layer.update()
        for pb in arm.pose.bones:
            loc,rot,scale=cinematic_basis(pb,name,t).decompose()
            if samples[pb.name] and rot.dot(samples[pb.name][-1][1])<0:rot.negate()
            samples[pb.name].append((loc.copy(),rot.copy(),scale.copy()))
    action=bpy.data.actions.new(name);action.use_fake_user=True
    for name_bone,values in samples.items():
        for prop,index in [('location',0),('rotation_quaternion',1),('scale',2)]:
            for axis in range(len(values[0][index])):
                curve=action.fcurves.new(data_path=f'pose.bones["{name_bone}"].{prop}',index=axis)
                curve.keyframe_points.add(len(values));curve.keyframe_points.foreach_set('co',[number for frame,value in enumerate(values) for number in (frame,value[index][axis])])
                for point in curve.keyframe_points:point.interpolation='LINEAR'
                curve.update()
    actions.append((name,action,frames))
arm.animation_data.action=None
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'
for track in list(arm.animation_data.nla_tracks):arm.animation_data.nla_tracks.remove(track)
for name,action,frames in actions:
    track=arm.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,0,action);strip.action_frame_start=0;strip.action_frame_end=frames
    strip.action_slot=action.slots[0]
wrapper=arm.parent
wrapper.rotation_euler.x=math.pi/2
scene.frame_start=0;scene.frame_end=96;scene.frame_set(0)
source.select(arm)
for ob in [body,*eyes,wrapper]:ob.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'kraken-native.blend'))
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'kraken.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_skins=True,export_all_influences=False,export_yup=True,export_apply=False)
(PUBLIC/'kraken-license.txt').write_text('Octopus vulgaris procedural & rigged\nAuthor: Joachim Bornemann\nSource: https://www.blenderkit.com/asset-gallery-detail/85c9bbbe-b4ab-4247-b17d-31be195132a8/\nLicense: CC0 1.0 Universal\nhttps://creativecommons.org/publicdomain/zero/1.0/\nAdaptation: selective detail reduction preserving original tentacle loops and skin weights; baked 2048-pixel PBR textures; original 141-bone skeleton, standard linear skeletal skinning, five animation clips interpolated from original artist poses with cinematic arm-root fan and spread; upright presentation.\n',encoding='utf8')
(OUT/'kraken-native-report.json').write_text(json.dumps({'sourceBones':len(arm.data.bones),'protectedVertices':protected,'vertices':len(body.data.vertices),'triangles':triangles,'maxEdgeBefore':original_max_edge,'maxEdgeAfter':max_edge,'animations':[name for name,_,_ in actions],'bytesBeforeTextureOptimization':(PUBLIC/'kraken.glb').stat().st_size},indent=2),encoding='utf8')
print('NATIVE_EXPORT',len(arm.data.bones),(PUBLIC/'kraken.glb').stat().st_size,flush=True)
