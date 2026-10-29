/** A short stereo hall; early reflections keep action cues crisp. */
export function createHallImpulse(ctx:BaseAudioContext){
  const length=Math.ceil(ctx.sampleRate*0.85),buffer=ctx.createBuffer(2,length,ctx.sampleRate);
  for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);for(let i=0;i<length;i++){const t=i/length;data[i]=(Math.random()*2-1)*Math.pow(1-t,3)*0.25;}for(const [delay,level] of [[0.029,0.25],[0.061,0.16],[0.113,0.08]])data[Math.floor((delay+channel*.003)*ctx.sampleRate)]+=level;}
  return buffer;
}
