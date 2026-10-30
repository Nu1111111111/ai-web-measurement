# Runs one wave from this machine: head stratum, then tail stratum, one after the other.
# Keeps Windows from idle-sleeping while it runs (SetThreadExecutionState, released on exit;
# no power settings are changed). Resumable: re-running the same command continues a run.
#
#   powershell -File scripts/run-local-wave.ps1 -Wave wave1 -Vantage de-residential
#   powershell -File scripts/run-local-wave.ps1 -Wave wave2 -Domains 'config/wave2-{stratum}.txt'
param(
  [Parameter(Mandatory)] [string] $Wave,
  [string] $Vantage = 'de-residential',
  [string[]] $Strata = @('head', 'tail'),
  [string] $Domains = '',  # domain list per stratum; {stratum} is replaced by head/tail
  [int] $MaxRestarts = 100
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

Add-Type -Namespace Win32 -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
[void][Win32.Power]::SetThreadExecutionState([uint32]2147483649)  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED (0x80000001)
try {
  foreach ($s in $Strata) {
    $run = "$Wave-$s-$Vantage"
    Write-Host "== $run  $(Get-Date -Format s)"
    # Node 24 on Windows occasionally dies natively (0xC0000409, no message) after a few
    # hundred domains. The run is resumable and each start is a new manifest session, so
    # restart; domains in flight at the crash are measured again from scratch.
    for ($attempt = 1; ; $attempt++) {
      $extra = if ($Domains) { @('--domains', $Domains.Replace('{stratum}', $s)) } else { @() }
      node src/measure.js --vantage $Vantage --stratum $s --run $run @extra
      if ($LASTEXITCODE -eq 0) { break }
      if ($attempt -ge $MaxRestarts) { throw "measure.js failed $attempt times for $run (last exit $LASTEXITCODE)" }
      Write-Host "== restart $attempt of $run after exit $LASTEXITCODE  $(Get-Date -Format s)"
      Start-Sleep -Seconds 5
    }
  }
  Write-Host "== done  $(Get-Date -Format s)"
} finally {
  [void][Win32.Power]::SetThreadExecutionState([uint32]2147483648)  # ES_CONTINUOUS (0x80000000): release
}
