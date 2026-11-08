param([Parameter(Mandatory = $true)][string]$RunId)
$ErrorActionPreference = 'Stop'

function Write-Utf8([string]$Path, [string]$Text) {
    [IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}
function Write-Json([string]$Path, $Value, [int]$Depth = 12) {
    Write-Utf8 $Path (($Value | ConvertTo-Json -Depth $Depth) + "`n")
}
function Get-Sha256Hex([byte[]]$Bytes) {
    $hasher = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($hasher.ComputeHash($Bytes)).Replace('-', '') }
    finally { $hasher.Dispose() }
}
function Invoke-DockerCapture([string[]]$Arguments, [string]$LogPath = $null) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $lines = @(& docker @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    if ($LogPath) { Write-Utf8 $LogPath (($lines -join "`n") + "`n") }
    return @{ ExitCode = $exitCode; Lines = @($lines) }
}
function Invoke-DockerRequired([string[]]$Arguments, [string]$Purpose) {
    $result = Invoke-DockerCapture $Arguments
    if ($result.ExitCode -ne 0) { throw "Docker $Purpose failed with exit $($result.ExitCode): $($result.Lines -join ' ')" }
    return $result.Lines
}
function Get-DockerIds([string[]]$Arguments) {
    return @((Invoke-DockerRequired $Arguments 'inventory') | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() } | Sort-Object -Unique)
}
function Get-Inventory {
    return [ordered]@{
        timestamp = [DateTimeOffset]::UtcNow.ToString('o')
        containers = Get-DockerIds @('ps', '-aq', '--no-trunc')
        networks = Get-DockerIds @('network', 'ls', '-q', '--no-trunc')
        volumes = Get-DockerIds @('volume', 'ls', '-q')
        images = Get-DockerIds @('image', 'ls', '-q', '--no-trunc')
    }
}
function Get-RunLabels {
    return @('--filter', 'label=project=bewt-covext', '--filter', 'label=owner=bewt-covext', '--filter', 'label=managed-by=bewt-covext-agent', '--filter', 'label=app=bludit', '--filter', 'label=task=t03b1-g0', "--filter", "label=runId=$RunId")
}
function Get-CreateId($Result, [string]$Kind) {
    $ids = @($Result.Lines | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[a-fA-F0-9]{64}$' })
    if ($ids.Count -ne 1) { throw "$Kind creation did not return exactly one full Docker resource ID" }
    return $ids[0].ToLowerInvariant()
}
function Save-Owned {
    Write-Json (Join-Path $runDir 'owned-resources.json') $owned 8
}
function Save-MavenLog([string]$Path, [object[]]$Lines) {
    $text = $Lines -join "`n"
    $text = $text.Replace($repoRoot, '<repository>')
    $text = [regex]::Replace($text, '(?i)[A-Z]:\\Users\\[^\\\s;"<>]+(?:\\[^\s;"<>]*)*', '<machine-local-path>')
    $text = [regex]::Replace($text, '(?i)[A-Z]:\\Program Files\\[^\s;"<>]+', '<machine-install-path>')
    Write-Utf8 $Path ($text + "`n")
}
function Get-JUnitSummary([xml]$Document) {
    $suite = $Document.DocumentElement
    if ($suite.LocalName -eq 'testsuites') {
        $suites = @($Document.SelectNodes('//*[local-name()="testsuite"]'))
        if ($suites.Count -ne 1) { throw 'BLOCKED: expected exactly one Surefire testsuite' }
        $suite = $suites[0]
    }
    $cases = @($Document.SelectNodes('//*[local-name()="testcase"]'))
    return [ordered]@{
        suite = $suite.GetAttribute('name')
        tests = [int]$suite.GetAttribute('tests')
        failures = [int]$suite.GetAttribute('failures')
        errors = [int]$suite.GetAttribute('errors')
        skipped = [int]$suite.GetAttribute('skipped')
        testcaseCount = $cases.Count
        testcaseNames = @($cases | ForEach-Object { $_.GetAttribute('name') })
        testcaseClasses = @($cases | ForEach-Object { $_.GetAttribute('classname') })
        failureElements = @($Document.SelectNodes('//*[local-name()="failure"]')).Count
        errorElements = @($Document.SelectNodes('//*[local-name()="error"]')).Count
        skippedElements = @($Document.SelectNodes('//*[local-name()="skipped"]')).Count
    }
}
function Save-SanitizedJUnit([string]$ClassName, [string]$TargetPath) {
    $fileName = "TEST-$ClassName.xml"
    if (-not (Test-Path -LiteralPath $TargetPath -PathType Leaf)) {
        throw "BLOCKED: expected Surefire XML missing at experiments/bludit/bewt-suite/target/surefire-reports/$fileName"
    }
    $rawBytes = [IO.File]::ReadAllBytes($TargetPath)
    $sourceHash = Get-Sha256Hex $rawBytes
    $document = New-Object System.Xml.XmlDocument
    $document.XmlResolver = $null
    $document.PreserveWhitespace = $false
    $document.Load($TargetPath)
    $summary = Get-JUnitSummary $document
    if ($summary.suite -ne $ClassName -or $summary.tests -ne 1 -or $summary.testcaseCount -ne 1 -or $summary.failures -ne 0 -or $summary.errors -ne 0 -or $summary.skipped -ne 0 -or $summary.failureElements -ne 0 -or $summary.errorElements -ne 0 -or $summary.skippedElements -ne 0 -or $summary.testcaseClasses[0] -ne $ClassName) {
        throw "FAIL: Surefire XML mismatch for ${ClassName}: $($summary | ConvertTo-Json -Compress)"
    }
    foreach ($node in @($document.SelectNodes('//*[local-name()="properties" or local-name()="system-out" or local-name()="system-err"]'))) {
        [void]$node.ParentNode.RemoveChild($node)
    }
    $publicDir = Join-Path $runDir 'surefire-public'
    [void][IO.Directory]::CreateDirectory($publicDir)
    $safeName = "TEST-$ClassName.sanitized.xml"
    $publicPath = Join-Path $publicDir $safeName
    $settings = New-Object System.Xml.XmlWriterSettings
    $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
    $settings.Indent = $true
    $settings.OmitXmlDeclaration = $false
    $writer = [System.Xml.XmlWriter]::Create($publicPath, $settings)
    try { $document.Save($writer) } finally { $writer.Dispose() }
    $publicDocument = New-Object System.Xml.XmlDocument
    $publicDocument.XmlResolver = $null
    $publicDocument.Load($publicPath)
    $publicSummary = Get-JUnitSummary $publicDocument
    if ($publicSummary.tests -ne $summary.tests -or $publicSummary.testcaseCount -ne $summary.testcaseCount -or $publicSummary.failures -ne $summary.failures -or $publicSummary.errors -ne $summary.errors -or $publicSummary.skipped -ne $summary.skipped -or $publicSummary.testcaseNames[0] -ne $summary.testcaseNames[0] -or $publicSummary.testcaseClasses[0] -ne $summary.testcaseClasses[0]) {
        throw "FAIL: XML sanitization changed test outcomes for ${ClassName}"
    }
    return @{ Summary = $summary; Evidence = [ordered]@{ sourcePath = "experiments/bludit/bewt-suite/target/surefire-reports/$fileName"; sourceSha256Original = $sourceHash; sanitizedPath = "surefire-public/$safeName" } }
}
function Invoke-MavenClass([string]$ClassName, [string]$AppUrl, [string]$WebDriverUrl) {
    $targetReports = 'experiments/bludit/bewt-suite/target/surefire-reports'
    [void][IO.Directory]::CreateDirectory((Join-Path $repoRoot $targetReports))
    $xmlPath = Join-Path $repoRoot "$targetReports/TEST-$ClassName.xml"
    $textPath = Join-Path $repoRoot "$targetReports/$ClassName.txt"
    Remove-Item -LiteralPath $xmlPath, $textPath -Force -ErrorAction SilentlyContinue
    $logName = if ($ClassName -eq 'tests.Installer') { 'maven-installer.log' } else { 'maven-business.log' }
    $logPath = Join-Path $runDir $logName
    $arguments = @('-B', '-f', 'experiments/bludit/bewt-suite/pom.xml', "-Dtest=$ClassName", "-Dapp.url=$AppUrl", "-Dwebdriver.remoteUrl=$WebDriverUrl", 'test')
    $command = 'mvn ' + ($arguments -join ' ')
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $lines = @(& mvn @arguments 2>&1 | ForEach-Object { $_.ToString() })
    $mavenExitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    Save-MavenLog $logPath $lines
    $entry = [ordered]@{ class = $ClassName; command = $command; exitCode = $mavenExitCode; junitXmlPath = "$targetReports/TEST-$ClassName.xml"; junit = $null; evidence = $null; outcome = 'XML_PENDING' }
    $script:mavenResults[$ClassName] = $entry
    Write-Json (Join-Path $runDir 'maven-command-results.json') @{ runId = $RunId; classes = $script:mavenResults } 10
    if (-not (Test-Path -LiteralPath $xmlPath -PathType Leaf)) {
        $entry.outcome = 'BLOCKED_XML_MISSING'
        Write-Json (Join-Path $runDir 'maven-command-results.json') @{ runId = $RunId; classes = $script:mavenResults } 10
        throw "BLOCKED: Maven exit $mavenExitCode for $ClassName but expected XML is missing at $targetReports/TEST-$ClassName.xml"
    }
    try { $junit = Save-SanitizedJUnit $ClassName $xmlPath } catch {
        $entry.outcome = 'BLOCKED_XML_VALIDATION'
        $entry.xmlValidationError = $_.Exception.Message
        Write-Json (Join-Path $runDir 'maven-command-results.json') @{ runId = $RunId; classes = $script:mavenResults } 10
        throw
    }
    $entry.junit = $junit.Summary
    $entry.evidence = $junit.Evidence
    $entry.outcome = if ($mavenExitCode -eq 0) { 'PASS' } else { 'FAIL_MAVEN_EXIT_NONZERO' }
    Write-Json (Join-Path $runDir 'maven-command-results.json') @{ runId = $RunId; classes = $script:mavenResults } 10
    if ($mavenExitCode -ne 0) { throw "FAIL: Maven exit $mavenExitCode conflicts with the JUnit result for $ClassName" }
    return $entry
}
function Test-Sentinel([string]$Url, [string]$Destination) {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $response = @(& curl.exe --silent --show-error $Url 2>&1 | ForEach-Object { $_.ToString() })
    $curlExit = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    if ($curlExit -ne 0) { throw "BLOCKED: homepage probe failed with curl exit $curlExit" }
    $body = $response -join "`n"
    $present = [bool][regex]::IsMatch($body, [regex]::Escape('Test Content'))
    $digest = Get-Sha256Hex ([Text.Encoding]::UTF8.GetBytes($body))
    Write-Json $Destination @{ present = $present; responseSha256 = $digest; checkedAt = [DateTimeOffset]::UtcNow.ToString('o') } 5
    return $present
}

if ($RunId -notmatch '^[a-z0-9][a-z0-9-]{2,62}$') { throw 'invalid run ID' }
$repoRoot = (Resolve-Path '.').Path
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'experiments/bludit/bewt-suite/pom.xml'))) { throw 'run this script from the repository root' }
$runDir = Join-Path $repoRoot "docs/tasks/T03-B1/evidence/$RunId"
if (Test-Path -LiteralPath $runDir) { throw "BLOCKED: immutable evidence directory already exists for run ID $RunId" }
[void](New-Item -ItemType Directory -Path $runDir -ErrorAction Stop)
$appName = "bewt-covext-bludit-$RunId"
$browserName = "bewt-covext-bludit-selenium-$RunId"
$networkName = "$appName-net"
$appRef = 'bludit/docker:2.3.4@sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9'
$browserRef = 'selenium/standalone-chrome:4.34.0@sha256:bcb1d054f3c88ef618cd92a8124d894038fb5f670bf7d427f5e5bbb60882b6f6'
$labels = @('project=bewt-covext', 'owner=bewt-covext', 'managed-by=bewt-covext-agent', 'app=bludit', 'task=t03b1-g0', "runId=$RunId")
$runLabelArgs = Get-RunLabels
$owned = [ordered]@{ runId = $RunId; imageDigest = 'sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9'; browserImageDigest = 'sha256:bcb1d054f3c88ef618cd92a8124d894038fb5f670bf7d427f5e5bbb60882b6f6'; containers = @(); network = $null }
$networkAttempted = $false
$runOutcome = 'BLOCKED'
$failureReason = $null
$cleanupOutcome = 'NOT_RUN'
$scriptFailed = 0
$installerResult = $null
$businessResult = $null
$script:mavenResults = [ordered]@{}
$baseline = $null
$cleanupResultPath = Join-Path $runDir 'cleanup-result.json'

try {
    Copy-Item -LiteralPath (Join-Path $repoRoot 'config/apps/bludit.json') -Destination (Join-Path $runDir 'runtime-manifest.json')
    $manifestHash = (Get-FileHash -LiteralPath (Join-Path $runDir 'runtime-manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Utf8 (Join-Path $runDir 'runtime-manifest.sha256') "$manifestHash  runtime-manifest.json`n"
    Save-Owned

    [void](Invoke-DockerRequired @('info', '--format', '{{.ServerVersion}}') 'daemon preflight')
    $ownershipQueries = @()
    $ownershipQueries += [pscustomobject]@{ Kind = 'containers'; Arguments = @('ps', '-aq', '--no-trunc') }
    $ownershipQueries += [pscustomobject]@{ Kind = 'networks'; Arguments = @('network', 'ls', '-q', '--no-trunc') }
    $ownershipQueries += [pscustomobject]@{ Kind = 'volumes'; Arguments = @('volume', 'ls', '-q') }
    foreach ($query in $ownershipQueries) {
        $queryArguments = @($query.Arguments) + $runLabelArgs
        $matches = @(Invoke-DockerRequired $queryArguments 'run ID ownership preflight' | Where-Object { $_.Trim() })
        if ($matches.Count -gt 0) { throw "BLOCKED: run ID $RunId already has resources with the complete task ownership labels" }
    }
    $baseline = Get-Inventory
    Write-Json (Join-Path $runDir 'docker-before.json') $baseline 8

    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 16
    $rng.GetBytes($bytes)
    $env:BLUDIT_TEST_PASSWORD = ([BitConverter]::ToString($bytes).Replace('-', '')) + 'Aa1!'
    $rng.Dispose()

    # Persist ownership as soon as each Docker create returns a verifiable full ID, before starting that container.
    $networkAttempted = $true
    $networkArgs = @('network', 'create', '--driver', 'bridge')
    foreach ($label in $labels) { $networkArgs += @('--label', $label) }
    $networkArgs += $networkName
    $networkCreate = Invoke-DockerCapture $networkArgs (Join-Path $runDir 'docker-network-create.log')
    $networkId = $null
    if (@($networkCreate.Lines | Where-Object { $_ -match '^[a-fA-F0-9]{64}$' }).Count -eq 1) {
        $networkId = Get-CreateId $networkCreate 'network'
        $owned.network = @{ id = $networkId; name = $networkName }
        Save-Owned
    }
    if ($networkCreate.ExitCode -ne 0) { throw "BLOCKED: Docker network create exited $($networkCreate.ExitCode): $($networkCreate.Lines -join ' ')" }
    if (-not $networkId) { throw 'BLOCKED: Docker network create returned no verifiable full ID' }

    $appCreateArgs = @('create', '--name', $appName, '--network', $networkName, '--publish', '127.0.0.1::80')
    foreach ($label in $labels) { $appCreateArgs += @('--label', $label) }
    $appCreateArgs += $appRef
    $appCreate = Invoke-DockerCapture $appCreateArgs (Join-Path $runDir 'docker-create-app.log')
    $appId = $null
    if (@($appCreate.Lines | Where-Object { $_ -match '^[a-fA-F0-9]{64}$' }).Count -eq 1) {
        $appId = Get-CreateId $appCreate 'app container'
        $owned.containers += @{ role = 'app'; id = $appId; name = $appName; imageRef = $appRef }
        Save-Owned
    }
    if ($appCreate.ExitCode -ne 0) { throw "BLOCKED: Docker app container create exited $($appCreate.ExitCode): $($appCreate.Lines -join ' ')" }
    if (-not $appId) { throw 'BLOCKED: Docker app container create returned no verifiable full ID' }
    $appStart = Invoke-DockerCapture @('start', $appId) (Join-Path $runDir 'docker-start-app.log')
    if ($appStart.ExitCode -ne 0) { throw "BLOCKED: Docker app container start exited $($appStart.ExitCode): $($appStart.Lines -join ' ')" }

    $browserCreateArgs = @('create', '--name', $browserName, '--network', $networkName, '--publish', '127.0.0.1::4444', '--shm-size=2g')
    foreach ($label in $labels) { $browserCreateArgs += @('--label', $label) }
    $browserCreateArgs += $browserRef
    $browserCreate = Invoke-DockerCapture $browserCreateArgs (Join-Path $runDir 'docker-create-browser.log')
    $browserId = $null
    if (@($browserCreate.Lines | Where-Object { $_ -match '^[a-fA-F0-9]{64}$' }).Count -eq 1) {
        $browserId = Get-CreateId $browserCreate 'Selenium container'
        $owned.containers += @{ role = 'browser'; id = $browserId; name = $browserName; imageRef = $browserRef }
        Save-Owned
    }
    if ($browserCreate.ExitCode -ne 0) { throw "BLOCKED: Docker Selenium container create exited $($browserCreate.ExitCode): $($browserCreate.Lines -join ' ')" }
    if (-not $browserId) { throw 'BLOCKED: Docker Selenium container create returned no verifiable full ID' }
    $browserStart = Invoke-DockerCapture @('start', $browserId) (Join-Path $runDir 'docker-start-browser.log')
    if ($browserStart.ExitCode -ne 0) { throw "BLOCKED: Docker Selenium container start exited $($browserStart.ExitCode): $($browserStart.Lines -join ' ')" }

    $appPortLines = Invoke-DockerRequired @('port', $appId, '80/tcp') 'app port lookup'
    $browserPortLines = Invoke-DockerRequired @('port', $browserId, '4444/tcp') 'Selenium port lookup'
    $appPortMatch = [regex]::Match(($appPortLines -join ' '), '127\.0\.0\.1:(\d+)')
    $browserPortMatch = [regex]::Match(($browserPortLines -join ' '), '127\.0\.0\.1:(\d+)')
    if (-not $appPortMatch.Success -or -not $browserPortMatch.Success) { throw 'BLOCKED: Docker did not publish both ports on loopback' }
    $appPort = $appPortMatch.Groups[1].Value
    $browserPort = $browserPortMatch.Groups[1].Value
    $appUrl = "http://$appName/admin"
    $webdriverUrl = "http://127.0.0.1:$browserPort/wd/hub"
    Write-Json (Join-Path $runDir 'runtime-endpoints.json') @{ appName = $appName; browserName = $browserName; appHostPort = $appPort; browserHostPort = $browserPort; appUrl = $appUrl; webdriverUrl = $webdriverUrl } 5

    $appReady = $false
    $appHttpStatus = $null
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $appHttpStatus = (& curl.exe --silent --output NUL --write-out '%{http_code}' "http://127.0.0.1:$appPort/admin" 2>$null | Out-String).Trim()
        if ($LASTEXITCODE -eq 0 -and $appHttpStatus -match '^(200|301|302|303)$') { $appReady = $true; break }
        Start-Sleep -Seconds 1
    }
    $seleniumReady = $false
    $seleniumStatus = $null
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        try {
            $seleniumStatus = (& curl.exe --silent --show-error "http://127.0.0.1:$browserPort/status" | ConvertFrom-Json)
            if ($LASTEXITCODE -eq 0 -and $seleniumStatus.value.ready) { $seleniumReady = $true; break }
        } catch { }
        Start-Sleep -Seconds 1
    }
    $seleniumVersion = if ($seleniumStatus) { $seleniumStatus.value.nodes[0].version } else { $null }
    $browserVersion = if ($seleniumStatus) { $seleniumStatus.value.nodes[0].slots[0].stereotype.browserVersion } else { $null }
    Write-Json (Join-Path $runDir 'readiness.json') @{ appReady = [bool]$appReady; seleniumReady = [bool]$seleniumReady; appHttpStatus = $appHttpStatus; seleniumVersion = $seleniumVersion; browserVersion = $browserVersion; checkedAt = [DateTimeOffset]::UtcNow.ToString('o') } 6
    if (-not $appReady -or -not $seleniumReady) { throw 'BLOCKED: app or Selenium readiness not verified' }

    $appVersion = Invoke-DockerRequired @('exec', $appId, 'sh', '-lc', 'grep -Rhn "define.*BLUDIT_VERSION" /usr/share/nginx/html/bl-kernel 2>/dev/null | head -5') 'Bludit version probe'
    Write-Utf8 (Join-Path $runDir 'observed-container-version.txt') (($appVersion -join "`n") + "`n")

    $installerResult = Invoke-MavenClass 'tests.Installer' $appUrl $webdriverUrl
    $sentinelUrl = "http://127.0.0.1:$appPort/"
    $sentinelBefore = Test-Sentinel $sentinelUrl (Join-Path $runDir 'sentinel-state-before-test.json')
    if ($sentinelBefore -ne $false) { throw 'FAIL: Test Content sentinel must be absent before AddContentTest' }
    $businessResult = Invoke-MavenClass 'tests.AddContentTest' $appUrl $webdriverUrl
    $sentinelAfter = Test-Sentinel $sentinelUrl (Join-Path $runDir 'sentinel-state-after-test.json')
    if ($sentinelAfter -ne $true) { throw 'FAIL: Test Content sentinel must be present after AddContentTest' }

    $combined = [ordered]@{ tests = 2; failures = 0; errors = 0; skipped = 0; installer = $installerResult.junit; business = $businessResult.junit }
    Write-Json (Join-Path $runDir 'junit-summary.json') $combined 10
    Write-Json (Join-Path $runDir 'maven-and-sentinel-result.json') @{ installerExitCode = $installerResult.exitCode; businessExitCode = $businessResult.exitCode; installerJUnit = $installerResult.junit; businessJUnit = $businessResult.junit; sentinelBefore = $sentinelBefore; sentinelAfter = $sentinelAfter } 10
    $runOutcome = 'PASS'
    Write-Output 'RUNTIME_TESTS_PASS'
} catch {
    $scriptFailed = 1
    $failureReason = $_.Exception.Message
    Write-Utf8 (Join-Path $runDir 'run-error.txt') ($failureReason + "`n")
    Write-Output ('RUN_BLOCKED: ' + $failureReason)
} finally {
    Remove-Item Env:\BLUDIT_TEST_PASSWORD -ErrorAction SilentlyContinue
    if ($owned.network) {
        try {
            Save-Owned
            $oldPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            $cleanupLines = @(& node --experimental-strip-types experiments/bludit/tools/cleanup-run.mjs (Join-Path $runDir 'owned-resources.json') (Join-Path $runDir 'docker-before.json') $cleanupResultPath 2>&1 | ForEach-Object { $_.ToString() })
            $cleanupCode = $LASTEXITCODE
            $ErrorActionPreference = $oldPreference
            Write-Utf8 (Join-Path $runDir 'cleanup-console.log') (($cleanupLines -join "`n") + "`n")
            if ($cleanupCode -eq 0) { $cleanupOutcome = 'PASS'; Write-Output 'CLEANUP_PASS' }
            else { $cleanupOutcome = 'BLOCKED'; $scriptFailed = 1; Write-Output 'CLEANUP_BLOCKED' }
        } catch {
            $cleanupOutcome = 'BLOCKED'
            $scriptFailed = 1
            Write-Json (Join-Path $runDir 'cleanup-result.json') @{ outcome = 'BLOCKED'; reason = $_.Exception.Message } 4
            Write-Output ('CLEANUP_BLOCKED: ' + $_.Exception.Message)
        }
    } elseif ($networkAttempted) {
        # Never discover-and-delete: Docker may have created a resource without returning a trusted ID.
        try {
            $ownershipQueries = @()
            $ownershipQueries += [pscustomobject]@{ Kind = 'containers'; Arguments = @('ps', '-aq', '--no-trunc') }
            $ownershipQueries += [pscustomobject]@{ Kind = 'networks'; Arguments = @('network', 'ls', '-q', '--no-trunc') }
            $ownershipQueries += [pscustomobject]@{ Kind = 'volumes'; Arguments = @('volume', 'ls', '-q') }
            foreach ($query in $ownershipQueries) {
                $queryArguments = @($query.Arguments) + $runLabelArgs
                $found = @(Invoke-DockerRequired $queryArguments 'unrecorded resource audit' | Where-Object { $_.Trim() })
                if ($found.Count) { throw "unrecorded task-labeled resource(s) remain; left untouched: $($found -join ',')" }
            }
        } catch {
            $scriptFailed = 1
            $failureReason = "BLOCKED: no verified recorded network ID; $($_.Exception.Message)"
            Write-Json (Join-Path $runDir 'cleanup-result.json') @{ outcome = 'BLOCKED'; reason = $failureReason } 4
        }
    }
    if ($baseline) {
        try {
            $after = Get-Inventory
            Write-Json (Join-Path $runDir 'docker-after.json') $after 8
            $comparison = [ordered]@{ runId = $RunId; preexistingResourcesPreserved = $true; removedPreexisting = [ordered]@{}; addedResourcesAfterCleanup = [ordered]@{} }
            foreach ($kind in @('containers', 'networks', 'volumes', 'images')) {
                $beforeSet = @($baseline[$kind])
                $afterSet = @($after[$kind])
                $removed = @($beforeSet | Where-Object { $_ -notin $afterSet })
                $added = @($afterSet | Where-Object { $_ -notin $beforeSet })
                $comparison.removedPreexisting[$kind] = $removed
                $comparison.addedResourcesAfterCleanup[$kind] = $added
                if ($removed.Count) { $comparison.preexistingResourcesPreserved = $false; $scriptFailed = 1 }
            }
            Write-Json (Join-Path $runDir 'docker-reset-comparison.json') $comparison 8
        } catch {
            $scriptFailed = 1
            Write-Utf8 (Join-Path $runDir 'docker-after-error.txt') ($_.Exception.Message + "`n")
        }
    }
    if ($scriptFailed -eq 0 -and $runOutcome -eq 'PASS' -and $cleanupOutcome -eq 'PASS') { $runOutcome = 'PASS' }
    else { $runOutcome = 'BLOCKED'; $scriptFailed = 1 }
    $installerExitForResult = if ($installerResult) { $installerResult.exitCode } elseif ($script:mavenResults.Contains('tests.Installer')) { $script:mavenResults['tests.Installer'].exitCode } else { $null }
    $businessExitForResult = if ($businessResult) { $businessResult.exitCode } elseif ($script:mavenResults.Contains('tests.AddContentTest')) { $script:mavenResults['tests.AddContentTest'].exitCode } else { $null }
    $beforeForResult = $null
    $afterForResult = $null
    if (Test-Path (Join-Path $runDir 'sentinel-state-before-test.json')) { $beforeForResult = (Get-Content (Join-Path $runDir 'sentinel-state-before-test.json') -Raw | ConvertFrom-Json).present }
    if (Test-Path (Join-Path $runDir 'sentinel-state-after-test.json')) { $afterForResult = (Get-Content (Join-Path $runDir 'sentinel-state-after-test.json') -Raw | ConvertFrom-Json).present }
    Write-Json (Join-Path $runDir 'run-result.json') @{ runId = $RunId; outcome = $runOutcome; reason = $failureReason; installerExitCode = $installerExitForResult; businessExitCode = $businessExitForResult; sentinelBefore = $beforeForResult; sentinelAfter = $afterForResult; cleanupOutcome = $cleanupOutcome } 8
}

if ($scriptFailed -ne 0) { Write-Output 'RUN_BLOCKED'; exit 1 }
Write-Output 'RUN_C_PASS'
exit 0