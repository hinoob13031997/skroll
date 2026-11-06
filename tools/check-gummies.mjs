import assert from 'node:assert/strict';
import {LatheGeometry,Vector2,Vector3,Box3,Mesh,MeshBasicMaterial,Raycaster} from '../vendor/three/three.core.js';
import {gummyProfile,gummyBubbles,nextGummyPose} from '../src/gummy-shape.js';
for(const detail of [64,88]){
 const profile=gummyProfile(detail),geometry=new LatheGeometry(profile.map(([r,y])=>new Vector2(r,y-.585)),detail===64?128:192);
 geometry.scale(1,1,.7);geometry.computeVertexNormals();geometry.computeBoundingBox();
 const bounds=geometry.boundingBox;
 assert.ok(Math.abs(bounds.min.y+.585)<1e-6);assert.ok(Math.abs(bounds.max.y-.585)<1e-6);
 assert.ok(Math.abs(bounds.min.x+1)<1e-6);assert.ok(Math.abs(bounds.max.x-1)<1e-6);
 assert.ok(Math.abs(bounds.max.z-.7)<1e-6);
 for(const key of ['position','normal'])for(const n of geometry.getAttribute(key).array)assert.ok(Number.isFinite(n));
 // Weld duplicated UV seam / pole vertices for a topology check. Every surface edge has two faces.
 const positions=geometry.getAttribute('position'),ids=[],weld=new Map();
 for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*1e6)).join(',');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 const edges=new Map(),index=geometry.index.array;
 for(let i=0;i<index.length;i+=3){const face=[ids[index[i]],ids[index[i+1]],ids[index[i+2]]];if(new Set(face).size<3)continue;for(let k=0;k<3;k++){const a=face[k],b=face[(k+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}}
 assert.ok([...edges.values()].every(n=>n===2),'closed watertight mesh after welding UV seams');
 const mesh=new Mesh(geometry,new MeshBasicMaterial());mesh.updateMatrixWorld(true);
 // Inspect the flat underside from below, away from the degenerate lathe pole.
 const below=new Raycaster(new Vector3(.2,-3,.1),new Vector3(0,1,0)).intersectObject(mesh);
 assert.ok(below.length>0);assert.ok(Math.abs(below[0].point.y+.585)<1e-5);
 // Rays still hit a closed volume after every orientation, including its back and underside.
 let orientations=0;
 for(let yaw=0;yaw<Math.PI*2;yaw+=Math.PI/8)for(let pitch=0;pitch<Math.PI*2;pitch+=Math.PI/8){
  mesh.rotation.set(pitch,yaw,0,'YXZ');mesh.updateMatrixWorld(true);
  const hits=new Raycaster(new Vector3(.037,.021,4),new Vector3(0,0,-1)).intersectObject(mesh);
  assert.ok(hits.length>0,`closed shape at ${yaw}, ${pitch}`);orientations++;
 }
 const bubbles=gummyBubbles(28);assert.equal(bubbles.length,28);
 for(const b of bubbles){assert.ok(b.y-b.radius>-.585);assert.ok(b.radius>0&&b.radius<.03);}
 console.log(`PASS ${detail}-segment profile: flat underside, finite smooth mesh, ${orientations} full-rotation poses and internal bubbles.`);
 mesh.material.dispose();geometry.dispose();
}
let pose=nextGummyPose({},'reset');for(let i=0;i<40;i++)pose=nextGummyPose(pose,'right');assert.ok(pose.yaw>Math.PI*2);
for(let i=0;i<40;i++)pose=nextGummyPose(pose,'up');assert.ok(pose.pitch<-Math.PI*2);
assert.deepEqual(nextGummyPose(pose,'reset'),{yaw:-.12,pitch:.06});
console.log('PASS 360-degree controls and reset.');
