import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

export const DOCKER_CLI = 'docker';
export const MAVEN_CLI = 'mvn';

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateRunId(runId) {
  if (typeof runId !== 'string' || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
    throw new Error(`INVALID_RUN_ID: '${runId}' must be 3-63 lowercase alphanumeric/dash characters`);
  }
  return runId;
}

export function labelsForRun(appId, runId) {
  return {
    project: 'bewt-covext',
    owner: 'bewt-covext',
    'managed-by': 'bewt-covext-agent',
    app: appId,
    task: `g0-${appId}`,
    runId,
  };
}

export function labelArgs(labels) {
  return Object.entries(labels).flatMap(([k, v]) => ['--label', `${k}=${v}`]);
}

export function selectLoopbackPort() {
  return new Promise((res, rej) => {
    const s = createServer();
    s.once('error', rej);
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address();
      if (!addr || typeof addr === 'string') {
        s.close();
        rej(new Error('Failed to select loopback port'));
        return;
      }
      const port = addr.port;
      s.close((err) => (err ? rej(err) : res(port)));
    });
  });
}

export function dockerCli(args) {
  return execFileSync(DOCKER_CLI, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function snapshotInventory() {
  const list = (cmd) => {
    try {
      const out = dockerCli(cmd);
      return out ? out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).sort() : [];
    } catch {
      return [];
    }
  };
  return {
    containers: list(['ps', '-aq', '--no-trunc']),
    networks: list(['network', 'ls', '-q', '--no-trunc']),
    volumes: list(['volume', 'ls', '-q']),
    timestamp: new Date().toISOString(),
  };
}

export async function waitHttpReady(url, label, timeoutMs = 120000, validator = (body, res) => res.ok) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const body = await res.text();
      if (validator(body, res)) {
        return { outcome: 'PASS', status: res.status, url };
      }
      lastErr = `HTTP ${res.status}: validator failed`;
    } catch (e) {
      lastErr = e.message;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} readiness timeout (${timeoutMs}ms): ${lastErr}`);
}

export function sanitizeEvidenceText(text) {
  return String(text || '')
    .replace(/\bn0tl[\w-]+\b/gi, '<TEST_FIXTURE_SECRET>')
    .replace(/[A-Z]:[\\/][^\r\n"'<>\s]*/gi, '<LOCAL_PATH>')
    .replace(/\/home\/[a-zA-Z0-9._-]+\/[^\r\n"'<>\s]*/g, '<LOCAL_PATH>')
    .replaceAll(REPO_ROOT, '<REPOSITORY_ROOT>')
    .replaceAll(REPO_ROOT.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
}

export function sanitizeSurefireXml(rawXml) {
  return rawXml
    .replace(/<properties>[\s\S]*?<\/properties>/g, '<properties/>')
    .replace(/<system-out>[\s\S]*?<\/system-out>/g, '<system-out/>')
    .replace(/<system-err>[\s\S]*?<\/system-err>/g, '<system-err/>')
    .replaceAll(REPO_ROOT, '<REPOSITORY_ROOT>')
    .replaceAll(REPO_ROOT.replaceAll('\\', '/'), '<REPOSITORY_ROOT>');
}

export function parseSurefireSummary(xmlContent, expectedClass) {
  const testsMatch = /tests="(\d+)"/.exec(xmlContent);
  const failuresMatch = /failures="(\d+)"/.exec(xmlContent);
  const errorsMatch = /errors="(\d+)"/.exec(xmlContent);
  const skippedMatch = /skipped="(\d+)"/.exec(xmlContent);

  const tests = testsMatch ? parseInt(testsMatch[1], 10) : 0;
  const failures = failuresMatch ? parseInt(failuresMatch[1], 10) : 0;
  const errors = errorsMatch ? parseInt(errorsMatch[1], 10) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

  const outcome = (tests > 0 && failures === 0 && errors === 0) ? 'PASS' : 'FAIL';
  return {
    outcome,
    tests,
    failures,
    errors,
    skipped,
    expectedClass,
  };
}

export const APPS = {
  bludit: {
    appId: 'bludit',
    image: 'bludit/docker:2.3.4@sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9',
    appInternalPort: 80,
    suitePath: 'experiments/bludit/bewt-suite',
    testClass: 'tests.AddContentTest',
    installerClass: 'tests.Installer',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remoteUrl',
    getAppUrl: (host, port) => `http://${host}:${port}/admin`,
    testEnv: { BLUDIT_TEST_PASSWORD: 'n0tl34k1ngP4ssw0rd' },
  },
  claroline: {
    appId: 'claroline',
    image: 'olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af',
    appInternalPort: 80,
    suitePath: 'experiments/claroline/bewt-suite',
    testClass: 'test.Claroline_AddUserTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port, appName) => `http://${appName}/claroline11110/claroline/index.php`,
  },
  expresscart: {
    appId: 'expresscart',
    image: 'bewt-covext/expresscart:1.1.19-b31302f',
    appInternalPort: 1111,
    hasDb: true,
    dbImage: 'mongo:4.4.29',
    dbInternalPort: 27017,
    suitePath: 'experiments/expresscart/bewt-suite',
    testClass: 'tests.AddUserTest',
    appUrlProperty: 'expresscart.baseUrl',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}`,
    appEnv: (dbHost) => ({
      NODE_ENV: 'production',
      PORT: '1111',
      NODE_PATH: '/var/expressCart',
      databaseConnectionString: `mongodb://${dbHost}:27017/expresscart_experiment`,
    }),
  },
  joomla: {
    appId: 'joomla',
    image: 'joomla:3.10.11@sha256:1cb08c55b99dfe231825291634b814b038f98a85442169d7811731bf43912971',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mysql:5.6',
    dbInternalPort: 3306,
    suitePath: 'experiments/joomla/bewt-suite',
    testClass: 'base.AdminLoginTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}/`,
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'joomla',
    },
    appEnv: (dbHost) => ({
      JOOMLA_DB_HOST: dbHost,
      JOOMLA_DB_USER: 'root',
      JOOMLA_DB_PASSWORD: 'root',
      JOOMLA_DB_NAME: 'joomla',
    }),
    testEnv: {
      BEWT_ADMIN_USERNAME: 'admin',
      BEWT_ADMIN_PASSWORD: 'adminpassword123',
    },
  },
  kanboard: {
    appId: 'kanboard',
    image: 'kanboard/kanboard:v1.2.15@sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e',
    appInternalPort: 80,
    suitePath: 'experiments/kanboard/bewt-suite',
    testClass: 'tests.AddNewProject',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}`,
    testEnv: { KANBOARD_TEST_PASSWORD: 'admin' },
    volumes: [
      { suffix: 'data', mount: '/var/www/app/data' },
      { suffix: 'plugins', mount: '/var/www/app/plugins' },
    ],
  },
  mantisbt: {
    appId: 'mantisbt',
    image: 'olianasd/mantisbt-strongpsw:1.2.0@sha256:5c26712d1ade6204613e5a2059d6effbcd0c945bc9a77940b39509ca19d72c01',
    appInternalPort: 80,
    suitePath: 'experiments/mantisbt/bewt-suite',
    testClass: 'base.AddUser',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}/mantisbt/`,
    testEnv: {
      BEWT_ADMIN_USERNAME: 'administrator',
      BEWT_ADMIN_PASSWORD: 'root',
    },
  },
  mediawiki: {
    appId: 'mediawiki',
    image: 'mediawiki:1.40.0@sha256:5cb83f2b332e05982a8642aff6a4265aa28d11ec66195a2b872cf5f2c234299d',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mariadb:10.5',
    dbInternalPort: 3306,
    suitePath: 'experiments/mediawiki/bewt-suite',
    testClass: 'mediawiki.CreatePageTest',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}/`,
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'mediawiki',
    },
    testEnv: {
      BEWT_ADMIN_USERNAME: 'Admin',
      BEWT_ADMIN_PASSWORD: 'adminpassword123',
    },
  },
  prestashop: {
    appId: 'prestashop',
    image: 'prestashop/prestashop:1.6.1.23@sha256:c6b779bca959503d25058cec1fa7f6a4cea940694ce099d2e47e4e23a8637b2e',
    appInternalPort: 80,
    hasDb: true,
    dbImage: 'mysql:5.7',
    dbInternalPort: 3306,
    suitePath: 'experiments/prestashop/bewt-suite',
    testClass: 'tests.AddNewCategory',
    appUrlProperty: 'app.url',
    webdriverUrlProperty: 'webdriver.remote.url',
    getAppUrl: (host, port) => `http://${host}:${port}/administrator/`,
    dbEnv: {
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_DATABASE: 'prestashop',
    },
    appEnv: (dbHost) => ({
      DB_SERVER: dbHost,
      DB_USER: 'root',
      DB_PASSWD: 'root',
      DB_NAME: 'prestashop',
      PS_DEV_MODE: '0',
    }),
    testEnv: {
      BEWT_ADMIN_USERNAME: 'admin@prestashop.com',
      BEWT_ADMIN_PASSWORD: 'adminpassword123',
    },
  },
};

export async function runG0Workflow(appId, rawRunId, options = {}) {
  const validRunId = validateRunId(rawRunId);
  const cfg = APPS[appId];
  if (!cfg) throw new Error(`UNKNOWN_APP_ID: '${appId}'`);

  const evidenceDir = resolve(REPO_ROOT, options.evidenceDir || `docs/tasks/g0-evidence/${appId}/${validRunId}`);
  mkdirSync(evidenceDir, { recursive: true });

  const labels = labelsForRun(appId, validRunId);
  const labelsCli = labelArgs(labels);

  const baselineInventory = snapshotInventory();
  writeFileSync(join(evidenceDir, 'docker-before.json'), `${JSON.stringify(baselineInventory, null, 2)}\n`);

  const netName = `bewt-covext-${appId}-${validRunId}-net`;
  const appName = `bewt-covext-${appId}-${validRunId}`;
  const dbName = `bewt-covext-${appId}-db-${validRunId}`;
  const browserName = `bewt-covext-${appId}-selenium-${validRunId}`;

  const createdContainers = [];
  const createdVolumes = [];
  let networkCreated = false;
  let exitCode = 1;
  const runRecord = {
    appId,
    runId: validRunId,
    startedAtUtc: new Date().toISOString(),
    labels,
    containers: [],
    network: null,
    volumes: [],
  };

  try {
    // 1. Create network
    dockerCli(['network', 'create', ...labelsCli, netName]);
    networkCreated = true;
    const netInfo = JSON.parse(dockerCli(['network', 'inspect', netName]))[0];
    runRecord.network = { id: netInfo.Id, name: netName };

    // 2. Named volumes if any
    if (cfg.volumes) {
      for (const vol of cfg.volumes) {
        const vName = `bewt-covext-${appId}-${vol.suffix}-${validRunId}`;
        dockerCli(['volume', 'create', ...labelsCli, vName]);
        createdVolumes.push(vName);
        runRecord.volumes.push({ name: vName, mount: vol.mount });
      }
    }

    // 3. Start DB container if needed
    if (cfg.hasDb) {
      const dbEnvArgs = Object.entries(cfg.dbEnv || {}).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
      dockerCli([
        'run', '-d',
        '--name', dbName,
        '--network', netName,
        ...labelsCli,
        ...dbEnvArgs,
        cfg.dbImage,
      ]);
      createdContainers.push(dbName);
      runRecord.containers.push({ role: 'db', name: dbName });
      // Wait for DB port to accept connections inside network
      await new Promise((r) => setTimeout(r, 12000));
    }

    // 4. Allocate ports and start App and Selenium containers
    const appPort = await selectLoopbackPort();
    const browserPort = await selectLoopbackPort();
    runRecord.appPort = appPort;
    runRecord.browserPort = browserPort;

    // Browser container
    dockerCli([
      'run', '-d',
      '--name', browserName,
      '--network', netName,
      '-p', `127.0.0.1:${browserPort}:4444`,
      '-e', 'SE_NODE_MAX_SESSIONS=1',
      '-e', 'SCREEN_WIDTH=1920',
      '-e', 'SCREEN_HEIGHT=1080',
      ...labelsCli,
      'selenium/standalone-chrome:latest',
    ]);
    createdContainers.push(browserName);
    runRecord.containers.push({ role: 'browser', name: browserName, port: browserPort });

    // App container
    const appEnvObj = cfg.appEnv ? cfg.appEnv(dbName) : {};
    const appEnvArgs = Object.entries(appEnvObj).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
    const volArgs = (cfg.volumes || []).flatMap((v) => {
      const vName = `bewt-covext-${appId}-${v.suffix}-${validRunId}`;
      return ['-v', `${vName}:${v.mount}`];
    });

    if (appId === 'claroline') {
      // Claroline start
      dockerCli([
        'run', '-d',
        '--name', appName,
        '--network', netName,
        '-p', `127.0.0.1:${appPort}:${cfg.appInternalPort}`,
        ...labelsCli,
        cfg.image,
        '/bin/sh', '-c', './run-services-docker.sh bash && sleep infinity',
      ]);
    } else {
      dockerCli([
        'run', '-d',
        '--name', appName,
        '--network', netName,
        '-p', `127.0.0.1:${appPort}:${cfg.appInternalPort}`,
        ...labelsCli,
        ...appEnvArgs,
        ...volArgs,
        cfg.image,
      ]);
    }
    createdContainers.push(appName);
    runRecord.containers.push({ role: 'app', name: appName, port: appPort });

    // 5. Readiness verification
    const seleniumStatusUrl = `http://127.0.0.1:${browserPort}/status`;
    await waitHttpReady(seleniumStatusUrl, 'Selenium', 90000, (body) => {
      try {
        return JSON.parse(body)?.value?.ready === true;
      } catch {
        return false;
      }
    });

    const hostAppProbeUrl = `http://127.0.0.1:${appPort}${cfg.appUrlPath || '/'}`;
    await waitHttpReady(hostAppProbeUrl, `${appId} App`, 120000);

    // 6. Application-specific setup fixtures
    if (appId === 'mediawiki') {
      // CLI automated installation
      try {
        dockerCli([
          'exec', appName,
          'php', 'maintenance/install.php',
          '--dbserver', dbName,
          '--dbtype', 'mysql',
          '--dbname', 'mediawiki',
          '--dbuser', 'root',
          '--dbpass', 'root',
          '--installdbuser', 'root',
          '--installdbpass', 'root',
          '--pass', 'adminpassword123',
          '--scriptpath', '',
          'E2E Web Testing wiki',
          'Admin',
        ]);
      } catch (e) {
        // If maintenance/install.php not directly at root, check maintenance path
      }
    } else if (appId === 'prestashop') {
      // PrestaShop install cleanup fixture: remove install/ and rename admin
      try {
        dockerCli(['exec', appName, 'rm', '-rf', '/var/www/html/install']);
        dockerCli(['exec', appName, 'mv', '/var/www/html/admin', '/var/www/html/administrator']);
      } catch {
        // ok if directories were already cleaned or alternate layout
      }
    } else if (appId === 'bludit') {
      // For Bludit, if installer test exists, run installer test first
      if (cfg.installerClass) {
        const instArgs = [
          '-B',
          '-f', `${cfg.suitePath}/pom.xml`,
          `-Dtest=${cfg.installerClass}`,
          `-D${cfg.appUrlProperty}=http://127.0.0.1:${appPort}/`,
          `-D${cfg.webdriverUrlProperty}=http://127.0.0.1:${browserPort}/wd/hub`,
          'test',
        ];
        const instRes = spawnSync(MAVEN_CLI, instArgs, {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          env: { ...process.env, ...(cfg.testEnv || {}) },
          timeout: 180000,
        });
        writeFileSync(join(evidenceDir, 'installer-maven.stdout.log'), sanitizeEvidenceText(instRes.stdout));
        writeFileSync(join(evidenceDir, 'installer-maven.stderr.log'), sanitizeEvidenceText(instRes.stderr));
      }
    }

    // 7. Execute Base Selenium smoke test
    const targetAppUrl = cfg.getAppUrl
      ? cfg.getAppUrl('127.0.0.1', appPort, appName)
      : `http://127.0.0.1:${appPort}/`;
    const remoteWebdriverUrl = `http://127.0.0.1:${browserPort}/wd/hub`;

    const testEnvVars = {
      ...process.env,
      ...(cfg.testEnv || {}),
      BEWT_APP_URL: targetAppUrl,
      BEWT_WEBDRIVER_URL: remoteWebdriverUrl,
    };

    const mavenStartTime = Date.now();
    const mvnArgs = [
      '-B',
      '-f', `${cfg.suitePath}/pom.xml`,
      `-Dtest=${cfg.testClass}`,
      `-D${cfg.appUrlProperty}=${targetAppUrl}`,
      `-D${cfg.webdriverUrlProperty}=${remoteWebdriverUrl}`,
      'clean', 'test',
    ];

    const mvnRes = spawnSync(MAVEN_CLI, mvnArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: testEnvVars,
      timeout: 300000,
    });

    writeFileSync(join(evidenceDir, 'maven.stdout.log'), sanitizeEvidenceText(mvnRes.stdout));
    writeFileSync(join(evidenceDir, 'maven.stderr.log'), sanitizeEvidenceText(mvnRes.stderr));
    writeFileSync(join(evidenceDir, 'maven-exit.json'), JSON.stringify({
      exitCode: mvnRes.status,
      signal: mvnRes.signal,
      command: `mvn -B -f ${cfg.suitePath}/pom.xml -Dtest=${cfg.testClass} test`,
    }, null, 2));

    // 8. Capture and sanitize Surefire JUnit report
    const surefireXmlName = `TEST-${cfg.testClass}.xml`;
    const surefirePath = resolve(REPO_ROOT, cfg.suitePath, 'target/surefire-reports', surefireXmlName);

    let junitOutcome = 'NOT_FOUND';
    let surefireSummary = null;
    if (existsSync(surefirePath) && statSync(surefirePath).mtimeMs >= mavenStartTime - 1000) {
      const rawXml = readFileSync(surefirePath, 'utf8');
      const safeXml = sanitizeSurefireXml(rawXml);
      writeFileSync(join(evidenceDir, surefireXmlName), safeXml);

      surefireSummary = parseSurefireSummary(rawXml, cfg.testClass);
      junitOutcome = surefireSummary.outcome;

      writeFileSync(join(evidenceDir, 'surefire-hash.json'), JSON.stringify({
        originalXmlSha256: sha256(rawXml),
        sanitizedXmlSha256: sha256(safeXml),
      }, null, 2));
    }
    writeFileSync(join(evidenceDir, 'junit-result.json'), JSON.stringify({
      outcome: junitOutcome,
      summary: surefireSummary,
    }, null, 2));

    if (mvnRes.status === 0 && junitOutcome === 'PASS') {
      exitCode = 0;
    }
  } catch (err) {
    writeFileSync(join(evidenceDir, 'run-failure.txt'), `${err.name}: ${err.message}\n${err.stack || ''}`);
  } finally {
    // 9. Fail-closed cleanup
    const cleanupReport = {
      runId: validRunId,
      appId,
      stoppedContainers: [],
      removedContainers: [],
      removedVolumes: [],
      removedNetwork: null,
      zeroResidualVerified: false,
    };

    for (const c of createdContainers) {
      try {
        dockerCli(['stop', c]);
        cleanupReport.stoppedContainers.push(c);
      } catch {}
      try {
        dockerCli(['rm', '-f', c]);
        cleanupReport.removedContainers.push(c);
      } catch {}
    }

    for (const v of createdVolumes) {
      try {
        dockerCli(['volume', 'rm', '-f', v]);
        cleanupReport.removedVolumes.push(v);
      } catch {}
    }

    if (networkCreated) {
      try {
        dockerCli(['network', 'rm', netName]);
        cleanupReport.removedNetwork = netName;
      } catch {}
    }

    // Verify inventory returns to zero residual
    const postInventory = snapshotInventory();
    const residualContainers = postInventory.containers.filter((c) => !baselineInventory.containers.includes(c));
    const residualNetworks = postInventory.networks.filter((n) => !baselineInventory.networks.includes(n));
    const residualVolumes = postInventory.volumes.filter((v) => !baselineInventory.volumes.includes(v));

    cleanupReport.zeroResidualVerified = (
      residualContainers.length === 0 &&
      residualNetworks.length === 0 &&
      residualVolumes.length === 0
    );
    cleanupReport.outcome = cleanupReport.zeroResidualVerified ? 'PASS' : 'FAIL_RESIDUALS_EXIST';

    writeFileSync(join(evidenceDir, 'cleanup-result.json'), JSON.stringify(cleanupReport, null, 2));
    writeFileSync(join(evidenceDir, 'run-record.json'), JSON.stringify(runRecord, null, 2));
  }

  return {
    appId,
    runId: validRunId,
    exitCode,
    outcome: exitCode === 0 ? 'PASS' : 'FAIL',
    evidenceDir,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  const appId = process.argv[2] || '';
  const runId = process.argv[3] || '';
  if (!appId || !runId) {
    console.error('Usage: node unified-g0-runner.mjs <appId> <runId>');
    process.exit(1);
  }
  runG0Workflow(appId, runId)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
