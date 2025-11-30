# Remove all references to original_* fields that don't exist in schema

$file = "client/src/pages/project-detail.tsx"
$content = Get-Content $file -Raw

# Remove the original_quantity column from CSV export (line 370)
$content = $content -replace ',\s*takeoff\.original_quantity\?\.\w+\(\)\s*\|\|\s*""', ''

# Remove all conditional rendering based on original_* fields
$content = $content -replace '\{takeoff\.original_quantity[^}]+\}', ''
$content = $content -replace '\{takeoff\.original_area[^}]+\}', ''
$content = $content -replace '\{takeoff\.original_length[^}]+\}', ''
$content = $content -replace '\{takeoff\.original_cost_per_unit[^}]+\}', ''

# Remove className conditions based on original_* fields
$content = $content -replace 'className=\{takeoff\.original_[^}]+\}', 'className=""'

# Remove onClick handlers that reference original_* fields
$content = $content -replace 'if \(takeoff\.original_quantity\)[^;]+;', ''
$content = $content -replace 'if \(takeoff\.original_area\)[^;]+;', ''
$content = $content -replace 'if \(takeoff\.original_length\)[^;]+;', ''
$content = $content -replace 'if \(takeoff\.original_cost_per_unit\)[^;]+;', ''

# Remove disabled condition based on original_* fields
$content = $content -replace 'disabled=\{!takeoff\.original_quantity[^}]+\}', 'disabled={true}'

Set-Content $file $content -NoNewline
Write-Host "Removed original_* field references from project-detail.tsx"
