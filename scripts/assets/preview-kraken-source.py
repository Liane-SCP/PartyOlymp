import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/model-research'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'octopus-joachim-bornemann.blend'))
scene=bpy.context.scene;arm=bpy.data.objects['Armature'];body=bpy.data.objects['Octopus body']
arm.animation_data_create().action=bpy.data.actions['PoseLib'];arm.animation_data.action_slot=bpy.data.actions['PoseLib'].slots[0]
arm.hide_set(False);arm.data.pose_position='POSE'
scene.world=bpy.data.worlds.new('Review world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.015,.02,.03,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
camera_data=bpy.data.cameras.new('Review');camera=bpy.data.objects.new('Review',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=3
for name,loc,power in [('Key',(-2,1,3),170),('Rim',(2,0,-2),180),('Fill',(1,-2,2),100)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=3;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
for frame in [1,2,3,4]:
    scene.frame_set(frame);bpy.context.view_layer.update();evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get());points=[body.matrix_world@v.co for v in evaluated.data.vertices]
    lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)]);center=(lo+hi)/2
    camera.location=center+Vector((.05,-.1,3));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.ortho_scale=max(hi-lo)*1.16
    print('SOURCE_POSE',frame,list(lo),list(hi),flush=True)
    scene.render.filepath=str(OUT/f'kraken-source-pose-{frame}.png');bpy.ops.render.render(write_still=True)
