param([ValidateSet('host','client')][string]$View='host', [switch]$NoOpen)
$ErrorActionPreference='Stop'
$projectDir=Split-Path $PSScriptRoot -Parent
$baseUrl='http://127.0.0.1:59435'
function Test-Party {
  try {
    $request=[System.Net.WebRequest]::Create("$baseUrl/api/health")
    $request.Proxy=$null
    $request.Timeout=2000
    $response=$request.GetResponse()
    $reader=New-Object System.IO.StreamReader($response.GetResponseStream())
    $result=$reader.ReadToEnd() | ConvertFrom-Json
    $reader.Dispose(); $response.Dispose()
    return $result.ok -eq $true
  } catch { return $false }
}
if (-not (Test-Party)) {
  $nodePath=Join-Path $projectDir 'runtime-cache\windows-smoke\node-v24.21.0-win-x64\node.exe'
  if (-not (Test-Path -LiteralPath $nodePath)) { $nodePath=(Get-Command node -ErrorAction Stop).Source }
  $env:PARTY_PORT='59435'
  $env:PARTY_NO_BROWSER='1'
  $env:PARTY_DEV='1'
  $serverPath=Join-Path $projectDir 'server.js'
  Start-Process -FilePath $nodePath -ArgumentList @('"'+$serverPath+'"') -WorkingDirectory $projectDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectDir 'tests\quick-test.log') -RedirectStandardError (Join-Path $projectDir 'tests\quick-test-error.log')
  for ($attempt=0;$attempt -lt 40;$attempt++) { if (Test-Party) { break }; Start-Sleep -Milliseconds 250 }
  if (-not (Test-Party)) { throw 'Could not start Local Party. See tests/quick-test-error.log.' }
}
$pageUrl=if ($View -eq 'host') { "$baseUrl/host" } else { "$baseUrl/" }
Write-Output "Current project: $projectDir"
Write-Output "Host: $baseUrl/host"
Write-Output "Client on this computer: $baseUrl/"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | ForEach-Object { Write-Output "Phone (same Wi-Fi): http://$($_.IPAddress):59435/" }
if (-not $NoOpen) { Start-Process $pageUrl }
