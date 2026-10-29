/** Scenic chapter identities; independent of scoring and the chosen game order. */
export const journeyRegions = [
  {id:'groves',name:'Die Morgenhaine',ground:'#859c70',stone:'#768374',soil:'#908269',depth:'#405a59',foliage:['#52775d','#769665','#a0ae77'],flowers:['#edcf8f','#d6aab5','#c5dcb0'],path:['#9c8972','#b6a388'],growth:'canopy',water:true},
  {id:'trade-winds',name:'Der Wind der Wunder',ground:'#baa482',stone:'#9b9684',soil:'#a1886e',depth:'#4c6871',foliage:['#4d8983','#6fa39a','#9fc0a5'],flowers:['#f2c99a','#eaa8a6','#c6d8c8'],path:['#998773','#c0ac8b'],growth:'palm',water:false},
  {id:'star-reef',name:'Das Sternenriff',ground:'#7d999f',stone:'#78869b',soil:'#918c9e',depth:'#3b526f',foliage:['#7897ad','#9c9fbe','#bdc8cb'],flowers:['#d4bbdf','#b9d9e2','#e9d6b4'],path:['#8ba6ad','#b1c5c6'],growth:'crystal',water:true},
  {id:'old-realms',name:'Die vergessenen Reiche',ground:'#8a917a',stone:'#a4a590',soil:'#827a68',depth:'#4b5b5b',foliage:['#536e69','#6f8879','#94a18a'],flowers:['#d5c5a0','#b9c5aa','#dbb8ad'],path:['#a6a58e','#cac5ac'],growth:'cedar',water:true},
  {id:'sky-crown',name:'Die Himmelskrone',ground:'#a3a8a2',stone:'#abaaba',soil:'#928c9e',depth:'#535b7b',foliage:['#6c8594','#8d9baf','#b3bfcb'],flowers:['#dfcde6','#ebd9b0','#bad5df'],path:['#9da3b6','#c1c3d2'],growth:'cedar',water:false},
  {id:'olympus-gates',name:'Vor den Toren des Olymps',ground:'#b7b59d',stone:'#c0bda7',soil:'#9a8b74',depth:'#5d6577',foliage:['#6c8274','#91a18b','#bac5a0'],flowers:['#ead9aa','#eee3ca','#cad4b4'],path:['#b6b29a','#dfd8bb'],growth:'cypress',water:false},
] as const;
export type JourneyRegion=typeof journeyRegions[number];
export function regionForChapter(chapter:number,count:number):JourneyRegion {
 return journeyRegions[Math.min(journeyRegions.length-1,Math.floor(chapter/Math.max(1,count-1)*(journeyRegions.length-1)))];
}
