import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const commit='04e0049a6cdc803a593b9b758ff42ed3090d01cd';
const manifest=JSON.parse(execFileSync('git',['show',`${commit}:docs/tasks/T03-A1/evidence/offline-verification-20261110-r9/sha256-lf.json`],{encoding:'utf8'}));
const mismatches=[];
for(const [file,expected] of Object.entries(manifest.files)) {
 const content=execFileSync('git',['show',`${commit}:${file}`]);
 const actual=createHash('sha256').update(Buffer.from(content.toString('utf8').replace(/\r\n/g,'\n'))).digest('hex');
 if(actual!==expected)mismatches.push(file);
}
console.log(JSON.stringify({commit,files:Object.keys(manifest.files).length,mismatches}));
if(mismatches.length)process.exitCode=1;
