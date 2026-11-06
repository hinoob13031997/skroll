// Closed lathe profile: a flat underside, a softly rounded lip, and a half-ellipsoid.
// Kept independent of the renderer so the real product shape can be checked without WebGL.
export function gummyProfile(segments=80){
 const points=[[0,0],[.5,0],[.91,0]];
 for(let i=1;i<=12;i++){const a=-Math.PI/2+i/12*Math.PI/2;points.push([.91+.09*Math.cos(a),.09+.09*Math.sin(a)]);}
 for(let i=1;i<=segments;i++){const a=i/segments*Math.PI/2;points.push([i===segments?0:Math.cos(a),.09+1.08*Math.sin(a)]);}
 return points;
}
export function gummyBubbles(count=24){
 let seed=8317;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const bubbles=[];
 while(bubbles.length<count){const x=(random()-.5)*1.55,y=.13+random()*.88,z=(random()-.5)*.95;
  if(x*x+((y-.09)/1.08)**2+(z/.7)**2>.72)continue;
  bubbles.push({x,y:y-.585,z,radius:.008+random()*.018});
 }
 return bubbles;
}
export function nextGummyPose(pose,action){
 const step=.26;
 if(action==='reset')return{yaw:-.12,pitch:.06};
 return{yaw:pose.yaw+(action==='left'?-step:action==='right'?step:0),pitch:pose.pitch+(action==='up'?-step:action==='down'?step:0)};
}
