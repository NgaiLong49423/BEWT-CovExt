$ErrorActionPreference = 'Stop'

$project = 'bewt-covext-expresscart-b31302f'
$compose = Join-Path $PSScriptRoot '..\compose.yaml'
$envFile = Join-Path $PSScriptRoot '..\.env'
$mongoContainer = (& docker compose -p $project -f $compose ps -q mongo).Trim()
$appContainer = (& docker compose -p $project -f $compose ps -q app).Trim()
if (-not $mongoContainer -or -not $appContainer) { throw 'Both experiment containers must be running.' }

foreach ($container in @($mongoContainer, $appContainer)) {
    $owner = (& docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' $container).Trim()
    if ($owner -ne $project) { throw 'Container ownership label does not match the experiment namespace.' }
}

if (-not (Test-Path -LiteralPath $envFile)) { throw 'Experiment .env file is missing.' }
$envLines = [System.Collections.Generic.List[string]]::new()
Get-Content -LiteralPath $envFile | ForEach-Object { $envLines.Add($_) }
$emailLine = $envLines | Where-Object { $_ -match '^ADMIN_EMAIL=' } | Select-Object -First 1
$passwordLine = $envLines | Where-Object { $_ -match '^ADMIN_PASSWORD=' } | Select-Object -First 1

$email = if ($emailLine) { $emailLine.Substring('ADMIN_EMAIL='.Length) } else {
    $query = 'var d=db.getSiblingDB("expresscart_experiment"); var a=d.users.find({isAdmin:true,isOwner:true},{userEmail:1}).toArray(); if(a.length!==1) quit(3); print(a[0].userEmail);'
    (& docker exec $mongoContainer mongo --quiet --eval $query | Out-String).Trim()
}
if (-not $email) { throw 'Exactly one experiment owner fixture must exist.' }

$password = if ($passwordLine) { $passwordLine.Substring('ADMIN_PASSWORD='.Length) } else {
    $bytes = [byte[]]::new(32)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}
if (-not $password) { throw 'Experiment admin password could not be configured.' }

foreach ($name in @('ADMIN_EMAIL', 'ADMIN_PASSWORD')) {
    $envLines.RemoveAll([Predicate[string]]{ param($line) $line -match "^$name=" }) | Out-Null
}
$envLines.Add("ADMIN_EMAIL=$email")
$envLines.Add("ADMIN_PASSWORD=$password")
Set-Content -LiteralPath $envFile -Value $envLines -Encoding utf8

$payload = @{ email = $email; password = $password } | ConvertTo-Json -Compress
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
    process.stdout.write(JSON.stringify({ matchedCount: result.matchedCount }) + '\n');
    if (result.matchedCount !== 1) process.exitCode = 2;
  } finally { await client.close(); }
});
'@
$result = $payload | & docker exec -i $appContainer node -e $nodeScript
if ($LASTEXITCODE -ne 0) { throw 'Admin fixture preparation failed; credential values were suppressed.' }
$counts = $result | ConvertFrom-Json
if ($counts.matchedCount -ne 1) { throw 'Expected exactly one experiment owner fixture.' }
Write-Output 'EXPERIMENT_ADMIN_FIXTURE_PREPARED matched=1; credential values redacted.'
Remove-Variable password, payload -ErrorAction SilentlyContinue
