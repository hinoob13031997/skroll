export function legacyWorldHash(hash){
 const id=String(hash).replace(/^#/,'').replace(/^world-/,'');
 return ['luna','saturn','venus','mars','earth','neptune'].includes(id)?'#world-'+id:'#worlds';
}
