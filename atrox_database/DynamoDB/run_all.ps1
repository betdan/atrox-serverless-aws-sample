$ErrorActionPreference = "Stop"

& "$PSScriptRoot\create_atrox_idempotency.ps1"
& "$PSScriptRoot\create_atrox_audit.ps1"
