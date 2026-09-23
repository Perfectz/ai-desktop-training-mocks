param(
  [int]$Port = 4193
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$docsPath = Join-Path $repoRoot "docs"

Write-Host "Serving training mocks at http://127.0.0.1:$Port/"
python -m http.server $Port --bind 127.0.0.1 --directory $docsPath
