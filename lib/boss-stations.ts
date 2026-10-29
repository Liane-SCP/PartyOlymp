export function bossStation(index:number,count:number,ship=false){
 const spacing=Math.min(1.72,10.8/Math.max(1,count-1)),x=(index-(count-1)/2)*spacing;
 const cannonZ=2.75+Math.pow(Math.abs(x)/5.4,3)*1.4;
 return {x,z:ship?cannonZ+.85:3.7+Math.abs(x)*.035,cannonZ,spacing};
}
