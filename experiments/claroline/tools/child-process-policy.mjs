import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { delimiter, join, resolve, sep } from 'node:path';

const systemRoot = 'C:\\Windows';
export const POWERSHELL_PATH = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const system32 = join(systemRoot, 'System32');
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const systemModules = [join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'Modules'), join(programFiles, 'WindowsPowerShell', 'Modules')].join(delimiter);

function protectedDirectory(path) {
  const candidate = resolve(path).toLowerCase();
  const root = resolve(programFiles).toLowerCase() + sep;
  if (!candidate.startsWith(root)) throw new Error(`refusing executable outside protected Program Files: ${path}`);
  return resolve(path);
}

function findJavaHome() {
  const javaRoot = join(programFiles, 'Java');
  const candidates = readdirSync(javaRoot).filter(name => /^jdk-21(?:\.|$)/i.test(name)).sort((left, right) => right.localeCompare(left, 'en'));
  const home = candidates.map(name => join(javaRoot, name)).find(path => existsSync(join(path, 'bin', 'java.exe')));
  if (!home) throw new Error('Java 21 was not found under protected Program Files\\Java');
  protectedDirectory(home);
  protectedDirectory(join(home, 'bin'));
  return resolve(home);
}

function findMavenCommand() {
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

function findDockerCommand() {
  const candidates = [
    join(programFiles, 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'resources', 'bin', 'docker.exe'),
  ].filter(Boolean);
  const command = candidates.find(existsSync);
  if (!command) throw new Error('Docker CLI was not found in a supported Docker Desktop installation path');
  const safePath = [system32, join(system32, 'WindowsPowerShell', 'v1.0')].join(delimiter);
  const env = { SystemRoot: systemRoot, windir: systemRoot, PATH: safePath, PSModulePath: systemModules };
  const script = `(Get-AuthenticodeSignature -LiteralPath '${command.replaceAll("'", "''")}').SignerCertificate.Subject`;
  const signer = execFileSync(POWERSHELL_PATH, ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', env }).trim();
  if (!/CN=Docker Inc(?:,|$)/i.test(signer)) throw new Error('Docker CLI signature is not verified as Docker Inc');
  return resolve(command);
}

const javaHome = findJavaHome();
const javaBin = protectedDirectory(join(javaHome, 'bin'));
const maven = findMavenCommand();
const mavenBin = protectedDirectory(join(maven.home, 'bin'));
export const DOCKER_CLI_PATH = findDockerCommand();
export const MAVEN_CLI_PATH = resolve(maven.command);

const basePath = [system32, mavenBin, javaBin].join(delimiter);
const inheritedNames = [
  'ALLUSERSPROFILE', 'APPDATA', 'COMPUTERNAME', 'CommonProgramFiles', 'CommonProgramFiles(x86)', 'CommonProgramW6432',
  'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'LOGONSERVER', 'NUMBER_OF_PROCESSORS', 'OS', 'PATHEXT',
  'PROCESSOR_ARCHITECTURE', 'PROCESSOR_IDENTIFIER', 'PROCESSOR_LEVEL', 'PROCESSOR_REVISION', 'PUBLIC', 'ProgramData',
  'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432', 'SystemDrive', 'TEMP', 'TMP', 'USERDOMAIN', 'USERNAME',
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
  TEMP: process.env.TEMP || join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local', 'Temp'),
  TMP: process.env.TMP || join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local', 'Temp'),
};

export const DOCKER_ENV = {
  ...sharedEnvironment,
  PATH: [system32].join(delimiter),
  DOCKER_CONTEXT: 'desktop-linux',
};

export const MAVEN_ENV = sharedEnvironment;
