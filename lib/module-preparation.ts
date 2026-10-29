/** Share in-flight imports as well as resolved exports. A failed import may be retried. */
export function createModuleLoader<T>(load:()=>Promise<T>){
 let pending:Promise<T>|undefined;
 return ()=>pending??=(Promise.resolve().then(load).catch(error=>{pending=undefined;throw error;}));
}
