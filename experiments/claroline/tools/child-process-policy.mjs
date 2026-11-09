import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { delimiter, dirname, join, resolve, sep } from 'node:path';

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
if (!isWindows && !isLinux) throw new Error(`Unsupported platform for child-process-policy: ${process.platform}`);

const systemRoot = 'C:\\Windows';
const system32 = join(systemRoot, 'System32');
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const systemModules = [join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'Modules'), join(programFiles, 'WindowsPowerShell', 'Modules')].join(delimiter);

const LINUX_TRUSTED_PREFIXES = ['/usr/bin/', '/bin/', '/usr/sbin/', '/sbin/', '/usr/lib/jvm/', '/usr/share/maven/'];

export function verifyLinuxRootExecutable(candidatePath, { existsFn = existsSync, realpathFn = realpathSync, statFn = statSync } = {}) {
  if (typeof candidatePath !== 'string' || !candidatePath.startsWith('/')) {
    throw new Error(`refusing non-absolute Linux executable path: ${candidatePath}`);
  }
  if (!existsFn(candidatePath)) throw new Error(`Linux executable was not found: ${candidatePath}`);
  const resolved = realpathFn(candidatePath);
  if (!LINUX_TRUSTED_PREFIXES.some(prefix => resolved.startsWith(prefix))) {
    throw new Error(`refusing Linux executable outside trusted system prefixes: ${resolved}`);
  }
  const st = statFn(resolved);
  if (!st.isFile()) throw new Error(`Linux executable target is not a regular file: ${resolved}`);
  if (st.uid !== 0) throw new Error(`refusing non-root-owned Linux executable (uid=${st.uid}): ${resolved}`);
  if ((st.mode & 0o022) !== 0) throw new Error(`refusing group/world-writable Linux executable (mode=${st.mode.toString(8)}): ${resolved}`);
  if ((st.mode & 0o111) === 0) throw new Error(`Linux target is not executable: ${resolved}`);
  const parentDir = dirname(resolved);
  const parentSt = statFn(parentDir);
  if (parentSt.uid !== 0 || (parentSt.mode & 0o022) !== 0) {
    throw new Error(`refusing Linux executable in untrusted parent directory: ${parentDir}`);
  }
  return candidatePath;
}

export function parseLinuxMeminfoBytes(meminfoText) {
  const text = String(meminfoText || '');
  const availableMatch = text.match(/^MemAvailable:\s+(\d+)\s+kB$/m);
  if (!availableMatch) throw new Error('HOST_MEMORY_QUERY_FAILED: MemAvailable kB entry is missing from /proc/meminfo');
  const availableKb = Number(availableMatch[1]);
  if (!Number.isFinite(availableKb) || availableKb <= 0) {
    throw new Error('HOST_MEMORY_QUERY_FAILED: MemAvailable kB entry in /proc/meminfo is non-positive');
  }
  const totalMatch = text.match(/^MemTotal:\s+(\d+)\s+kB$/m);
  const freeMatch = text.match(/^MemFree:\s+(\d+)\s+kB$/m);
  return {
    availableBytes: availableKb * 1024,
    totalBytes: totalMatch ? Number(totalMatch[1]) * 1024 : null,
    freeBytes: freeMatch ? Number(freeMatch[1]) * 1024 : null,
  };
}

export function parseLinuxIpv4Routes(routeText) {
  const lines = String(routeText || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const routes = [];
  for (const line of lines) {
    const token = line.split(/\s+/)[0];
    if (token === 'default') {
      routes.push('0.0.0.0/0');
    } else if (/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(token)) {
      routes.push(token);
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(token)) {
      routes.push(`${token}/32`);
    }
  }
  const unique = [...new Set(routes)];
  if (!unique.length) throw new Error('HOST_ROUTE_INVENTORY_FAILED: no IPv4 route prefixes parsed');
  return unique;
}

function protectedDirectory(path) {
  const candidate = resolve(path).toLowerCase();
  const root = resolve(programFiles).toLowerCase() + sep;
  if (!candidate.startsWith(root)) throw new Error(`refusing executable outside protected Program Files: ${path}`);
  return resolve(path);
}

function findWindowsJavaHome() {
  const javaRoot = join(programFiles, 'Java');
  const candidates = readdirSync(javaRoot).filter(name => /^jdk-21(?:\.|$)/i.test(name)).sort((left, right) => right.localeCompare(left, 'en'));
  const home = candidates.map(name => join(javaRoot, name)).find(path => existsSync(join(path, 'bin', 'java.exe')));
  if (!home) throw new Error('Java 21 was not found under protected Program Files\\Java');
  protectedDirectory(home);
  protectedDirectory(join(home, 'bin'));
  return resolve(home);
}

function findWindowsMavenCommand() {
  const candidates = readdirSync(programFiles).filter(name => /^apache-maven-/i.test(name)).sort((left, right) => right.localeCompare(left, 'en'));
  for (const name of candidates) {
    const home = join(programFiles, name);
    const command = join(home, 'bin', 'mvn.cmd');
    if (!existsSync(command)) continue;
    protectedDirectory(home);
    protectedDirectory(join(home, 'bin'));
    return { home, command };
  }
  throw new Error('Maven was not found under protected Program Files');
}

function findWindowsDockerCommand(powershellPath) {
  const candidates = [
    join(programFiles, 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'resources', 'bin', 'docker.exe'),
  ].filter(Boolean);
  const command = candidates.find(existsSync);
  if (!command) throw new Error('Docker CLI was not found in a supported Docker Desktop installation path');
  const safePath = [system32, join(system32, 'WindowsPowerShell', 'v1.0')].join(delimiter);
  const env = { SystemRoot: systemRoot, windir: systemRoot, PATH: safePath, PSModulePath: systemModules };
  const script = `(Get-AuthenticodeSignature -LiteralPath '${command.replaceAll("'", "''")}').SignerCertificate.Subject`;
  const signer = execFileSync(powershellPath, ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', env }).trim();
  if (!/CN=Docker Inc(?:,|$)/i.test(signer)) throw new Error('Docker CLI signature is not verified as Docker Inc');
  return resolve(command);
}

function findLinuxJavaHome() {
  const jvmRoot = '/usr/lib/jvm';
  if (!existsSync(jvmRoot)) throw new Error('Java 21 was not found under /usr/lib/jvm');
  const candidates = readdirSync(jvmRoot)
    .filter(name => /^java-21-openjdk/i.test(name))
    .sort((left, right) => right.localeCompare(left, 'en'))
    .map(name => join(jvmRoot, name));
  for (const home of candidates) {
    const javaExe = join(home, 'bin', 'java');
    const javacExe = join(home, 'bin', 'javac');
    if (existsSync(javaExe) && existsSync(javacExe)) {
      verifyLinuxRootExecutable(javaExe);
      verifyLinuxRootExecutable(javacExe);
      return realpathSync(home);
    }
  }
  throw new Error('Java 21 was not found under /usr/lib/jvm');
}

function findLinuxMavenCommand() {
  const command = verifyLinuxRootExecutable('/usr/bin/mvn');
  const home = '/usr/share/maven';
  if (!existsSync(home)) throw new Error('Maven home /usr/share/maven was not found');
  const homeSt = statSync(realpathSync(home));
  if (!homeSt.isDirectory() || homeSt.uid !== 0 || (homeSt.mode & 0o022) !== 0) {
    throw new Error('Maven home /usr/share/maven is not a root-owned protected directory');
  }
  return { home, command };
}

function findLinuxIpCommand() {
  for (const candidate of ['/usr/sbin/ip', '/sbin/ip', '/usr/bin/ip', '/bin/ip']) {
    if (existsSync(candidate)) return verifyLinuxRootExecutable(candidate);
  }
  throw new Error('Linux ip route utility was not found under /usr/sbin or /sbin');
}

let resolvedPowershellPath = null;
let resolvedIpCliPath = null;
let resolvedDockerCliPath;
let resolvedMavenCliPath;
let resolvedDockerEnv;
let resolvedMavenEnv;

if (isWindows) {
  resolvedPowershellPath = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const javaHome = findWindowsJavaHome();
  const javaBin = protectedDirectory(join(javaHome, 'bin'));
  const maven = findWindowsMavenCommand();
  const mavenBin = protectedDirectory(join(maven.home, 'bin'));
  resolvedDockerCliPath = findWindowsDockerCommand(resolvedPowershellPath);
  resolvedMavenCliPath = resolve(maven.command);

  const basePath = [system32, mavenBin, javaBin].join(delimiter);
  const inheritedNames = [
    'ALLUSERSPROFILE', 'APPDATA', 'COMPUTERNAME', 'CommonProgramFiles', 'CommonProgramFiles(x86)', 'CommonProgramW6432',
    'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'LOGONSERVER', 'NUMBER_OF_PROCESSORS', 'OS', 'PATHEXT',
    'PROCESSOR_ARCHITECTURE', 'PROCESSOR_IDENTIFIER', 'PROCESSOR_LEVEL', 'PROCESSOR_REVISION', 'PUBLIC', 'ProgramData',
    'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432', 'SystemDrive', 'USERDOMAIN', 'USERNAME',
    'USERPROFILE',
  ];
  const safeBaseEnvironment = Object.fromEntries(inheritedNames.filter(name => process.env[name]).map(name => [name, process.env[name]]));
  const sharedEnvironment = {
    ...safeBaseEnvironment,
    SystemRoot: systemRoot,
    windir: systemRoot,
    PATH: basePath,
    PSModulePath: systemModules,
    JAVA_HOME: javaHome,
    MAVEN_HOME: maven.home,
    M2_HOME: maven.home,
    USERPROFILE: process.env.USERPROFILE || '',
    HOME: process.env.USERPROFILE || '',
    ComSpec: join(system32, 'cmd.exe'),
    // Leave TEMP/TMP unset: Windows GetTempPath falls back to USERPROFILE, avoiding inherited shared temp locations.
  };

  resolvedDockerEnv = {
    ...sharedEnvironment,
    PATH: [system32].join(delimiter),
    DOCKER_CONTEXT: 'desktop-linux',
  };
  resolvedMavenEnv = sharedEnvironment;
} else {
  const javaHome = findLinuxJavaHome();
  const javaBin = join(javaHome, 'bin');
  const maven = findLinuxMavenCommand();
  resolvedDockerCliPath = verifyLinuxRootExecutable('/usr/bin/docker');
  resolvedMavenCliPath = maven.command;
  resolvedIpCliPath = findLinuxIpCommand();

  const safeHome = process.env.HOME && /^\/(root|home\/[a-zA-Z0-9._-]+)$/.test(process.env.HOME) ? process.env.HOME : '/root';
  const safeUser = process.env.USER && /^[a-zA-Z0-9._-]+$/.test(process.env.USER) ? process.env.USER : 'runner';
  const sharedLinuxEnvironment = {
    PATH: [javaBin, '/usr/sbin', '/usr/bin', '/sbin', '/bin'].join(delimiter),
    JAVA_HOME: javaHome,
    MAVEN_HOME: maven.home,
    M2_HOME: maven.home,
    HOME: safeHome,
    USER: safeUser,
    LOGNAME: safeUser,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    DOCKER_CLI_HINTS: 'false',
    // Leave TEMP/TMP/TMPDIR unset so child processes never inherit untrusted temporary directories.
  };

  resolvedDockerEnv = {
    ...sharedLinuxEnvironment,
    PATH: ['/usr/sbin', '/usr/bin', '/sbin', '/bin'].join(delimiter),
  };
  resolvedMavenEnv = sharedLinuxEnvironment;
}

export const POWERSHELL_PATH = resolvedPowershellPath;
export const IP_CLI_PATH = resolvedIpCliPath;
export const DOCKER_CLI_PATH = resolvedDockerCliPath;
export const MAVEN_CLI_PATH = resolvedMavenCliPath;
export const DOCKER_ENV = resolvedDockerEnv;
export const MAVEN_ENV = resolvedMavenEnv;

export function readHostFreeMemoryBytes({
  platform = process.platform,
  spawnSyncFn = spawnSync,
  readFileSyncFn = readFileSync,
  powershellPath = POWERSHELL_PATH,
  dockerEnv = DOCKER_ENV,
} = {}) {
  if (platform === 'win32') {
    const memQuery = spawnSyncFn(powershellPath, ['-NoProfile', '-NonInteractive', '-Command', '[Console]::Out.Write((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory)'], { encoding: 'utf8', env: dockerEnv, windowsHide: true });
    const freeKb = Number(String(memQuery.stdout || '').trim());
    if (memQuery.status !== 0 || !Number.isFinite(freeKb) || freeKb <= 0) {
      throw new Error('HOST_MEMORY_QUERY_FAILED: Win32_OperatingSystem.FreePhysicalMemory was not readable');
    }
    return freeKb * 1024;
  }
  if (platform === 'linux') {
    const content = readFileSyncFn('/proc/meminfo', 'utf8');
    return parseLinuxMeminfoBytes(content).availableBytes;
  }
  throw new Error(`Unsupported platform for readHostFreeMemoryBytes: ${platform}`);
}

export function readHostIpv4Routes({
  platform = process.platform,
  spawnSyncFn = spawnSync,
  powershellPath = POWERSHELL_PATH,
  ipCliPath = IP_CLI_PATH,
  dockerEnv = DOCKER_ENV,
} = {}) {
  if (platform === 'win32') {
    const result = spawnSyncFn(powershellPath, ['-NoProfile', '-NonInteractive', '-Command', 'Get-NetRoute -AddressFamily IPv4 | Select-Object -ExpandProperty DestinationPrefix'], { encoding: 'utf8', env: dockerEnv, windowsHide: true });
    if (result.status !== 0) throw new Error(`HOST_ROUTE_INVENTORY_FAILED: ${String(result.stderr || result.stdout || '').trim()}`);
    const routes = String(result.stdout || '').split(/\r?\n/).map(value => value.trim()).filter(value => /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(value));
    if (!routes.length) throw new Error('HOST_ROUTE_INVENTORY_FAILED: no IPv4 route prefixes returned');
    return routes;
  }
  if (platform === 'linux') {
    const result = spawnSyncFn(ipCliPath || '/usr/sbin/ip', ['-4', 'route', 'show'], { encoding: 'utf8', env: dockerEnv, windowsHide: true });
    if (result.status !== 0) throw new Error(`HOST_ROUTE_INVENTORY_FAILED: ${String(result.stderr || result.stdout || '').trim()}`);
    return parseLinuxIpv4Routes(result.stdout);
  }
  throw new Error(`Unsupported platform for readHostIpv4Routes: ${platform}`);
}

export function invokeMaven(mavenArgs, {
  cwd,
  env = MAVEN_ENV,
  platform = process.platform,
  spawnSyncFn = spawnSync,
  powershellPath = POWERSHELL_PATH,
  mavenCliPath = MAVEN_CLI_PATH,
} = {}) {
  if (!Array.isArray(mavenArgs) || mavenArgs.some(arg => typeof arg !== 'string' || /[\r\n\0]/.test(arg))) {
    throw new Error('Unsafe or non-string Maven argument rejected');
  }
  if (platform === 'win32') {
    const psQuote = value => `'${String(value).replace(/'/g, "''")}'`;
    const command = `& ${psQuote(mavenCliPath)} ${mavenArgs.map(psQuote).join(' ')}`;
    return spawnSyncFn(powershellPath, ['-NoProfile', '-NonInteractive', '-Command', command], { cwd, encoding: 'utf8', env, windowsHide: true });
  }
  if (platform === 'linux') {
    return spawnSyncFn(mavenCliPath, mavenArgs, { cwd, encoding: 'utf8', env, windowsHide: true });
  }
  throw new Error(`Unsupported platform for invokeMaven: ${platform}`);
}

