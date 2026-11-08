import test from 'node:test'; import assert from 'node:assert/strict';
import { CleanupBlockedError, isNotFound, runCleanup, runCleanupWithExitCode } from '../cleanup-bludit-g0.mjs';
import { labelsForRun } from '../bludit-g0.mjs';
const runId='t03b1-a-20261108-r1', labels=labelsForRun(runId), ids=['a'.repeat(64),'b'.repeat(64)], networkId='c'.repeat(64), names=['bewt-covext-bludit-'+runId,'bewt-covext-bludit-selenium-'+runId], networkName='bewt-covext-bludit-'+runId+'-net';
const record=()=>({runId,imageDigest:'sha256:'+'f'.repeat(64),containers:ids.map((id,i)=>({id,name:names[i],imageRef:'image@sha256:'+'f'.repeat(64)})),network:{id:networkId,name:networkName}});
const baseline=()=>({containers:['x'],networks:['y'],volumes:['z'],images:['i']});
const dockerError=(message,status=1)=>Object.assign(new Error(message),{status,stderr:Buffer.from(message)});
function fake({empty=false,inspectFailure=null,residual=false,stale=false,partial=false}={}) {
 const state={containers:new Map(),networks:new Map(),calls:[],mutations:[],empty,inspectFailure,residual,stale,partial};
 const cs=ids.map((id,i)=>({Id:stale&&i===0?'d'.repeat(64):id,Name:'/'+names[i],Config:{Image:'image@sha256:'+'f'.repeat(64),Labels:labels},State:{Running:true},Mounts:[]}));
 const n={Id:networkId,Name:networkName,Labels:labels,Containers:Object.fromEntries(cs.map(c=>[c.Id,{}]))};
 if(!empty){cs.forEach(c=>state.containers.set(c.Id,c));state.networks.set(n.Id,n);}
 const exec=args=>{
  state.calls.push(args);
  if(args[0]==='inspect'||(args[0]==='network'&&args[1]==='inspect')) {
   if(state.inspectFailure) throw state.inspectFailure;
   const kind=args[0]==='network'?'network':'container',target=args.at(-1),map=kind==='network'?state.networks:state.containers;
   let v=map.get(target)||[...map.values()].find(x=>kind==="network"?x.Name===target:x.Name.slice(1)===target);
   if(v)return JSON.stringify([v]);
   throw dockerError(kind==='network'?`Error response from daemon: network ${target} not found`:`Error: No such object: ${target}`);
  }
  if(args[0]==='ps')return [...state.containers.keys(),...(residual?['e'.repeat(64)]:[])].join(String.fromCharCode(10));
  if(args[0]==='network'&&args[1]==='rm'){state.mutations.push(args);state.networks.clear();return '';}
  if(args[0]==='network')return state.networks.size?[networkId]:residual?[networkId]:'';
  if(args[0]==='volume')return '';
  if(args[0]==='stop') {state.mutations.push(args);const c=state.containers.get(args[1]);if(c)c.State.Running=false;return '';}
  if(args[0]==='rm') {state.mutations.push(args);if(partial&&args[1]===ids[1])throw dockerError('daemon failure',2);state.containers.delete(args[1]);for(const n of state.networks.values())delete n.Containers[args[1]];return '';}
  return '';
 };
 return {state,exec};
}
const cleanup=f=>runCleanup({record:record(),baseline:baseline(),dockerExec:f.exec,captureInventory:()=>baseline()});
test('only exact missing object errors count as NOT_FOUND; daemon, permission, transport and unknown failures block without mutation',()=>{
 assert.equal(isNotFound(dockerError(`Error: No such object: ${ids[0]}`),'container',ids[0]),true);
 for(const e of [dockerError('Error response from daemon: connection refused'),dockerError('permission denied'),dockerError('unknown failure',2)]) {const f=fake({inspectFailure:e});assert.throws(()=>cleanup(f),CleanupBlockedError);assert.deepEqual(f.state.mutations,[]);}
});
test('idempotent cleanup passes only when recorded resources are genuinely absent',()=>{const f=fake({empty:true});assert.equal(cleanup(f).outcome,'PASS');});
test('partial teardown blocks, stale IDs block before mutation, residual labeled resources block PASS',()=>{
 const p=fake({partial:true});assert.throws(()=>cleanup(p),CleanupBlockedError);
 const s=fake({stale:true});assert.throws(()=>cleanup(s),CleanupBlockedError);assert.deepEqual(s.state.mutations,[]);
 const r=fake({residual:true});assert.throws(()=>cleanup(r),/residual run-owned/);
});
test('blocked cleanup sets process exit code nonzero',()=>{const f=fake({inspectFailure:dockerError('error during connect: pipe missing',2)});const proc={exitCode:0};assert.equal(runCleanupWithExitCode({record:record(),baseline:baseline(),dockerExec:f.exec,captureInventory:()=>baseline()},proc).outcome,'BLOCKED');assert.equal(proc.exitCode,1);});


test('NOT_FOUND requires an exact Docker resource kind and target',()=>{
 assert.equal(isNotFound(dockerError(`Error response from daemon: network ${networkName} not found`),'network',networkName),true);
 assert.equal(isNotFound(dockerError(`Error response from daemon: network ${networkName} not found`),'network','other-network'),false);
 assert.equal(isNotFound(dockerError(`Error: No such object: ${ids[0]}`),'container',ids[1]),false);
});
