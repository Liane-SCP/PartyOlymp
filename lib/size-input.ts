export const SIZE_DIAL_MIN=Math.log(.001),SIZE_DIAL_MAX=Math.log(1e8);
export function validSizeInput(value:unknown):number|null{
 if(typeof value!=='number'&&typeof value!=='string'||typeof value==='string'&&!value.trim())return null;
 const n=Number(value);return Number.isFinite(n)&&n>0&&n<=1e8?n:null;
}
/** Relative screen travel keeps the initial size on pointer-down and uses the object's measurement direction. */
export function sizeDragCm(start:number,dx:number,dy:number,axis:'x'|'y'){
 const value=validSizeInput(start)??100,delta=(axis==='x'?dx:-dy)/120;
 if(delta===0)return value;
 return Number(Math.min(1e8,Math.max(Number.MIN_VALUE,Math.exp(Math.max(Math.log(Number.MIN_VALUE),Math.min(SIZE_DIAL_MAX,Math.log(value)+delta))))).toPrecision(6));
}
