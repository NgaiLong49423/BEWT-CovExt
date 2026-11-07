$ErrorActionPreference = 'Stop'

$project = 'bewt-covext-expresscart-b31302f'
$compose = Join-Path $PSScriptRoot '..\compose.yaml'
$suiteTest = Join-Path $PSScriptRoot '..\bewt-suite\src\test\java\tests\AddUserTest.java'
$appId = (& docker compose -p $project -f $compose ps -q app).Trim()
if (-not $appId) { throw 'Experiment app container is not running.' }

$owner = (& docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' $appId).Trim()
if ($owner -ne $project) { throw 'Container Compose project label does not match experiment namespace.' }

$testSource = Get-Content -LiteralPath $suiteTest -Raw
$email = [regex]::Match($testSource, '\.setEmail\("([^"]+)"\)').Groups[1].Value
$password = [regex]::Match($testSource, '\.setPassword\("([^"]+)"\)').Groups[1].Value
if (-not $email -or -not $password) { throw 'Could not read the expected experiment fixture fields.' }

$inputJson = @{ email = $email; password = $password } | ConvertTo-Json -Compress
$nodeScript = @'
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', async () => {
  const { email, password } = JSON.parse(input);
  const client = await MongoClient.connect(process.env.databaseConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const result = await client.db('expresscart_experiment').collection('users').updateOne(
      { userEmail: email, isAdmin: true, isOwner: true },
      { $set: { userPassword: bcrypt.hashSync(password, 10) } }
    );
    process.stdout.write(JSON.stringify({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }) + '\n');
    if (result.matchedCount !== 1) process.exitCode = 2;
  } finally { await client.close(); }
});
'@

$result = $inputJson | & docker exec -i $appId node -e $nodeScript
if ($LASTEXITCODE -ne 0) { throw 'Experiment fixture preparation failed; Docker output was suppressed.' }
$counts = $result | ConvertFrom-Json
if ($counts.matchedCount -ne 1) { throw 'Expected exactly one experiment owner fixture.' }
Write-Output "EXPERIMENT_FIXTURE_PREPARED matched=$($counts.matchedCount) modified=$($counts.modifiedCount)"
Remove-Variable password, inputJson -ErrorAction SilentlyContinue
