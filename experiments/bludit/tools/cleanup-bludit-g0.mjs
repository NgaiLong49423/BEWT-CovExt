import { execFileSync } from 'node:child_process';
import { labelsForRun, fullLabelsMatch, assertOwnedContainer, assertOwnedNetwork } from './bludit-g0.mjs';
export class CleanupBlockedError extends Error { constructor(message, options) { super(message, options); this.name = 'CleanupBlockedError'; this.outcome = 'BLOCKED'; } }
const detail = e => String(e?.stderr?.toString().trim() || e?.stdout?.toString().trim() || e?.message || e);
const dockerCli = args => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
export function isNotFound(e, kind, target) {
 if(e?.status!==1) return false;
 const msg=detail(e);
 const lower=msg.toLowerCase();
 return kind==="container" ? lower===("error: no such object: "+target).toLowerCase() : kind==="network" ? lower===("error response from daemon: network "+target+" not found").toLowerCase() : false;
}
function inspect(exec, kind, target) {
 try { const value=JSON.parse(exec(kind==='container'?['inspect',target]:['network','inspect',target])); if(!Array.isArray(value)||value.length!==1) throw Error('unexpected inspect count'); return value[0]; }
 catch(e) { if(isNotFound(e,kind,target)) return null; throw new CleanupBlockedError(`${kind} inspect not verified NOT_FOUND: ${detail(e)}`,{cause:e}); }
}
const filters = labels => Object.entries(labels).flatMap(([k,v])=>['--filter',`label=${k}=${v}`]);
function listed(exec,args){const s=exec(args);return s?s.split(String.fromCharCode(10)).filter(Boolean):[];}
export function inventory(exec=dockerCli) {
 try {
  return {
   containers: listed(exec,['ps','-aq','--no-trunc']).sort(),
   networks: listed(exec,['network','ls','-q','--no-trunc']).sort(),
   volumes: listed(exec,['volume','ls','-q']).sort(),
   images: listed(exec,['image','ls','-q','--no-trunc']).sort()
  };
 } catch(e) { throw new CleanupBlockedError(`Docker inventory blocked: ${detail(e)}`,{cause:e}); }
}
function removeRun({record, baseline, dockerExec=dockerCli, captureInventory=()=>inventory(dockerExec)}) {
 const labels=labelsForRun(record.runId);
 if(!Array.isArray(record.containers)||record.containers.length>2||new Set(record.containers.map(c=>c.id)).size!==2) throw new CleanupBlockedError('record must include zero to two unique recorded application/browser containers');
 if(!record.network||!record.imageDigest?.match(/^sha256:[a-f0-9]{64}$/)) throw new CleanupBlockedError('recorded network and image digest are required');
 if(!baseline?.containers||!baseline.networks||!baseline.volumes||!baseline.images) throw new CleanupBlockedError('pre-run inventory is incomplete');
 const resources=[];
 for(const r of record.containers) {
  const byId=inspect(dockerExec,'container',r.id), byName=inspect(dockerExec,'container',r.name);
  if(byName&&byName.Id!==r.id) throw new CleanupBlockedError(`stale recorded name ${r.name} resolves to another ID`);
  if(Boolean(byId)!==Boolean(byName)) throw new CleanupBlockedError(`recorded ID/name lookup mismatch for ${r.name}`);
  if(byId) assertOwnedContainer(byId,{id:r.id,name:r.name,imageRef:r.imageRef,labels});
  resources.push(byId);
 }
 const netId=inspect(dockerExec,'network',record.network.id), netName=inspect(dockerExec,'network',record.network.name);
 if(netName&&netName.Id!==record.network.id) throw new CleanupBlockedError('stale network name resolves to another network');
 if(Boolean(netId)!==Boolean(netName)) throw new CleanupBlockedError('recorded network ID/name lookup mismatch');
 if(netId) assertOwnedNetwork(netId,{id:record.network.id,name:record.network.name,labels,containerIds:record.containers.map(c=>c.id)});
 for(let i=0;i<resources.length;i++) if(resources[i]?.State?.Running) dockerExec(['stop',record.containers[i].id]);
 for(let i=0;i<resources.length;i++) if(resources[i]) dockerExec(['rm',record.containers[i].id]);
 if(netId) {
  const fresh=inspect(dockerExec,'network',record.network.name);
  if(!fresh) throw new CleanupBlockedError('network disappeared before verified removal');
  assertOwnedNetwork(fresh,{id:record.network.id,name:record.network.name,labels,containerIds:[]});
  dockerExec(['network','rm',record.network.id]);
 }
 for(const [kind,args] of [
  ['container',['ps','-aq','--no-trunc',...filters(labels)]],
  ['network',['network','ls','-q','--no-trunc',...filters(labels)]],
  ['volume',['volume','ls','-q',...filters(labels)]]
 ]) if(listed(dockerExec,args).length) throw new CleanupBlockedError(`residual run-owned ${kind} resources remain`);
 for(const r of record.containers) if(inspect(dockerExec,'container',r.id)||inspect(dockerExec,'container',r.name)) throw new CleanupBlockedError(`recorded container ${r.name} remains`);
 if(inspect(dockerExec,'network',record.network.id)||inspect(dockerExec,'network',record.network.name)) throw new CleanupBlockedError('recorded network remains');
 const after=captureInventory();
 for(const key of ['containers','networks','volumes','images']) {
  const beforeSet=new Set(baseline[key]); const afterSet=new Set(after[key]);
  const removed=[...beforeSet].filter(id=>!afterSet.has(id));
  if(removed.length) throw new CleanupBlockedError(`pre-existing Docker ${key} disappeared: ${removed.join(',')}`);
 }
 return {runId:record.runId,outcome:'PASS',recordedContainers:record.containers.map(x=>x.id),recordedNetwork:record.network.id,residuals:{containers:0,networks:0,volumes:0},protectedExistingResources:'PRESERVED'};
}
export function runCleanup(options) { try { return removeRun(options); } catch(e) { if(e instanceof CleanupBlockedError) throw e; throw new CleanupBlockedError(`cleanup BLOCKED: ${detail(e)}`,{cause:e}); } }
export function runCleanupWithExitCode(options, proc=process) { try { return {outcome:'PASS',result:runCleanup(options)}; } catch(e) { proc.exitCode=1; return {outcome:'BLOCKED',reason:detail(e)}; } }


