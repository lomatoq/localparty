'use strict';
const fs=require('node:fs'),path=require('node:path');
const src=path.resolve('docs/qa/art-direction-v2'),out=path.resolve('.localparty-build/screen-review/design-v2');
fs.mkdirSync(out,{recursive:true});for(const file of ['index.html','prototype.css','README.md'])fs.copyFileSync(path.join(src,file),path.join(out,file));
fs.cpSync(path.join(src,'fonts'),path.join(out,'fonts'),{recursive:true});
fs.writeFileSync(path.join(out,'prototype.js'),fs.readFileSync(path.join(src,'prototype.js'),'utf8').replace('../../../public/assets/','./assets/'));
for(const file of ['branding/heypals-logo.png','gameplay/tabletop/hockey-field.webp']){const dest=path.join(out,'assets',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join('public/assets',file),dest);}
console.log(out+'/index.html');
