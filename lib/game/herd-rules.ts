export function herdKey(value:string){
 return value.trim().toLocaleLowerCase('de').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^(der|die|das|ein|eine)\s+/,'').replace(/[^a-z0-9]/g,'');
}
