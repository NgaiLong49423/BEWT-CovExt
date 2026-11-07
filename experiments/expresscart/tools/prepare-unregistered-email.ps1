param(
    [Parameter(Mandatory = $true)]
    [string]$EvidencePath
)

$ErrorActionPreference = 'Stop'
$project = 'bewt-covext-expresscart-b31302f'
$compose = Join-Path $PSScriptRoot '..\compose.yaml'
$mongo = (& docker compose -p $project -f $compose ps -q mongo).Trim()
if (-not $mongo) { throw 'Experiment Mongo container is not running.' }
$owner = (& docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' $mongo).Trim()
if ($owner -ne $project) { throw 'Mongo Compose project label does not match the experiment namespace.' }

$email = 'absent_' + [guid]::NewGuid().ToString('N') + '@example.com'
$query = "var d=db.getSiblingDB('expresscart_experiment'); print(d.customers.countDocuments({email:'$email'}));"
$matches = (& docker exec $mongo mongo --quiet --eval $query | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $matches -ne '0') {
    throw 'Generated email was not proven absent from experiment customers; no test was started.'
}

$env:TEST_UNREGISTERED_EMAIL = $email
$evidence = @{
    capturedAt = (Get-Date -Format o)
    composeProject = $project
    email = $email
    collection = 'customers'
    exactEmailMatchCountBeforeTest = 0
    result = 'PASS'
} | ConvertTo-Json
Set-Content -LiteralPath $EvidencePath -Value $evidence -Encoding utf8
Write-Output 'EC-C04 fixture preflight PASS; exact address is in the run-scoped fixture evidence.'
