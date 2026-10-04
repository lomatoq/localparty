// Local +Z is the rear of the arrow; the point embeds into the target at -Z.
// Share the scene's shaded materials and keep three readable swept feather vanes.
export function createRangeArrow(THREE,materialFor){
 const arrow=new THREE.Group();arrow.name='range-arrow';
 const mesh=(name,geometry,color,metal=0)=>{const part=new THREE.Mesh(geometry,materialFor(color,metal));part.name=name;part.castShadow=part.receiveShadow=true;arrow.add(part);return part;};
 const shaft=mesh('shaft',new THREE.CylinderGeometry(1.9,2.05,105,12),'#caa36a');shaft.rotation.x=Math.PI/2;shaft.position.z=46.5;
 const point=mesh('embedded-point',new THREE.ConeGeometry(4.5,13,6),'#c8dce0',.45);point.rotation.x=-Math.PI/2;point.position.z=-5.5;
 const collar=mesh('point-collar',new THREE.CylinderGeometry(2.7,2.7,4,10),'#aabec5',.35);collar.rotation.x=Math.PI/2;collar.position.z=1;
 const feather=new THREE.Shape();feather.moveTo(2,62);feather.lineTo(3.8,62);feather.quadraticCurveTo(12,65,12,73);feather.lineTo(10,89);feather.quadraticCurveTo(7,93,2,93);feather.closePath();
 const vaneGeometry=new THREE.ExtrudeGeometry(feather,{depth:1.4,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.45,bevelSize:.55,bevelSegments:2});vaneGeometry.translate(0,0,-.7);
 for(let i=0;i<3;i++){const fin=new THREE.Group();fin.name='fletching-'+i;fin.rotation.z=-.45+i*Math.PI*2/3;arrow.add(fin);const vane=new THREE.Mesh(i?vaneGeometry.clone():vaneGeometry,materialFor(i===1?'#eadfc0':'#bca0e6'));vane.name='feather-vane';vane.rotation.x=Math.PI/2;vane.castShadow=vane.receiveShadow=true;fin.add(vane);}
 const binding=mesh('rear-binding',new THREE.CylinderGeometry(2.45,2.45,3,10),'#755551');binding.rotation.x=Math.PI/2;binding.position.z=94.5;
 const nock=mesh('rear-nock',new THREE.TorusGeometry(2.25,.75,6,12),'#e4c48d');nock.position.z=98;
 return arrow;
}
