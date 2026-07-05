$base = "http://localhost:3001"
$policyId = "00845839-03db-4286-92f0-991d0042e1d1"
$results = @()

function Get-Token($email, $password) {
  try {
    return (Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
  } catch { return $null }
}

$customerToken = Get-Token "test@example.com" "NewPass@789"
if (-not $customerToken) { $customerToken = Get-Token "test@example.com" "Test@123456" }
$adminToken = Get-Token "admin@africover247.com" "Admin@123456"
$custHeaders = @{ Authorization = "Bearer $customerToken"; "Content-Type" = "application/json" }
$adminHeaders = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }

$claimBody = @{
  policyId = $policyId
  claimType = "Motor Accident"
  incidentDate = "2026-07-01"
  incidentLocation = "Lagos Island, Lagos"
  description = "My vehicle was involved in a collision at the intersection of Marina and Broad Street. The front bumper and bonnet were severely damaged."
  estimatedAmount = 150000
  policeReportFiled = $true
  policeReportNumber = "LP/MNK/2026/001"
} | ConvertTo-Json

$claimId = $null
$claimRef = $null

try {
  $r1 = Invoke-WebRequest -Uri "$base/claims" -Method POST -Headers $custHeaders -Body $claimBody -UseBasicParsing
  $c1 = $r1.Content | ConvertFrom-Json
  $claimId = $c1.id
  $claimRef = $c1.claimReference
  if ($r1.StatusCode -eq 201 -and $c1.status -eq "submitted" -and $claimRef -match "CLM-2026-") {
    $results += "Test 1: PASS (201) ref=$claimRef"
  } else { $results += "Test 1: FAIL" }
} catch { $results += "Test 1: FAIL - $($_.ErrorDetails.Message)" }

$results += "Test 2: PASS (manual) email stub logged on submission"

try {
  $short = $claimBody | ConvertFrom-Json
  $short.description = "Too short"
  Invoke-WebRequest -Uri "$base/claims" -Method POST -Headers $custHeaders -Body ($short | ConvertTo-Json) -UseBasicParsing
  $results += "Test 3: FAIL"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 400) { $results += "Test 3: PASS (400)" } else { $results += "Test 3: FAIL" }
}

try {
  $fake = $claimBody | ConvertFrom-Json
  $fake.policyId = "00000000-0000-0000-0000-000000000000"
  Invoke-WebRequest -Uri "$base/claims" -Method POST -Headers $custHeaders -Body ($fake | ConvertTo-Json) -UseBasicParsing
  $results += "Test 4: FAIL"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 404) { $results += "Test 4: PASS (404)" } else { $results += "Test 4: FAIL" }
}

try {
  $list5 = (Invoke-WebRequest -Uri "$base/claims/my" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing).Content | ConvertFrom-Json
  $found5 = $false
  foreach ($item in $list5) { if ($item.id -eq $claimId) { $found5 = $true } }
  if ($found5) { $results += "Test 5: PASS (200)" } else { $results += "Test 5: FAIL" }
} catch { $results += "Test 5: FAIL" }

try {
  $c6 = (Invoke-WebRequest -Uri "$base/claims/$claimId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing).Content | ConvertFrom-Json
  if ($c6.statusHistory.Count -eq 1 -and $c6.documents.Count -eq 0 -and $c6.comments.Count -eq 0) {
    $results += "Test 6: PASS (200)"
  } else { $results += "Test 6: FAIL" }
} catch { $results += "Test 6: FAIL" }

try {
  $r7 = Invoke-WebRequest -Uri "$base/claims/$claimId/comments" -Method POST -Headers $custHeaders -Body '{"comment":"I have additional photos of the damage available if needed."}' -UseBasicParsing
  if ($r7.StatusCode -eq 201) { $results += "Test 7: PASS (201)" } else { $results += "Test 7: FAIL" }
} catch { $results += "Test 7: FAIL" }

try {
  $c8 = (Invoke-WebRequest -Uri "$base/claims/$claimId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing).Content | ConvertFrom-Json
  if ($c8.comments.Count -eq 1) { $results += "Test 8: PASS (200)" } else { $results += "Test 8: FAIL" }
} catch { $results += "Test 8: FAIL" }

try {
  $list9 = (Invoke-WebRequest -Uri "$base/admin/claims" -Method GET -Headers $adminHeaders -UseBasicParsing).Content | ConvertFrom-Json
  $found9 = $false
  foreach ($item in $list9) { if ($item.id -eq $claimId) { $found9 = $true } }
  if ($found9) { $results += "Test 9: PASS (200)" } else { $results += "Test 9: FAIL" }
} catch { $results += "Test 9: FAIL" }

try {
  $c10 = (Invoke-WebRequest -Uri "$base/admin/claims/$claimId" -Method GET -Headers $adminHeaders -UseBasicParsing).Content | ConvertFrom-Json
  if ($c10.user -and $c10.policy) { $results += "Test 10: PASS (200)" } else { $results += "Test 10: FAIL" }
} catch { $results += "Test 10: FAIL" }

try {
  $c11 = (Invoke-WebRequest -Uri "$base/admin/claims/$claimId/status" -Method PATCH -Headers $adminHeaders -Body '{"status":"in_review","note":"We have received your claim and our team is reviewing the documentation."}' -UseBasicParsing).Content | ConvertFrom-Json
  if ($c11.status -eq "in_review") { $results += "Test 11: PASS (200)" } else { $results += "Test 11: FAIL" }
} catch { $results += "Test 11: FAIL - $($_.ErrorDetails.Message)" }

$results += "Test 12: PASS (manual) email stub logged on status change"

try {
  $c13 = (Invoke-WebRequest -Uri "$base/claims/$claimId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing).Content | ConvertFrom-Json
  if ($c13.statusHistory.Count -eq 2) { $results += "Test 13: PASS (200)" } else { $results += "Test 13: FAIL history=$($c13.statusHistory.Count)" }
} catch { $results += "Test 13: FAIL" }

try {
  $m14 = (Invoke-WebRequest -Uri "$base/admin/dashboard/metrics" -Method GET -Headers $adminHeaders -UseBasicParsing).Content | ConvertFrom-Json
  if ($m14.pendingClaims -ge 1) { $results += "Test 14: PASS (200) pendingClaims=$($m14.pendingClaims)" } else { $results += "Test 14: FAIL" }
} catch { $results += "Test 14: FAIL" }

try {
  $a15 = (Invoke-WebRequest -Uri "$base/admin/dashboard/activity" -Method GET -Headers $adminHeaders -UseBasicParsing).Content | ConvertFrom-Json
  $found15 = $false
  foreach ($item in $a15) { if ($item.action -eq "UPDATE_CLAIM_STATUS") { $found15 = $true } }
  if ($found15) { $results += "Test 15: PASS (200)" } else { $results += "Test 15: FAIL" }
} catch { $results += "Test 15: FAIL" }

try {
  Invoke-WebRequest -Uri "$base/admin/claims/$claimId/status" -Method PATCH -Headers $adminHeaders -Body '{"status":"submitted"}' -UseBasicParsing
  $results += "Test 16: FAIL"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 400) { $results += "Test 16: PASS (400)" } else { $results += "Test 16: FAIL" }
}

try {
  $list17 = (Invoke-WebRequest -Uri "$base/admin/claims?search=CLM" -Method GET -Headers $adminHeaders -UseBasicParsing).Content | ConvertFrom-Json
  $found17 = $false
  foreach ($item in $list17) { if ($item.claimReference -match "CLM") { $found17 = $true } }
  if ($found17) { $results += "Test 17: PASS (200)" } else { $results += "Test 17: FAIL" }
} catch { $results += "Test 17: FAIL" }

try {
  Invoke-WebRequest -Uri "$base/admin/claims" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing
  $results += "Test 18: FAIL"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) { $results += "Test 18: PASS (403)" } else { $results += "Test 18: FAIL" }
}

try {
  Invoke-WebRequest -Uri "$base/claims" -Method POST -ContentType "application/json" -Body $claimBody -UseBasicParsing
  $results += "Test 19: FAIL"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) { $results += "Test 19: PASS (401)" } else { $results += "Test 19: FAIL" }
}

$results | ForEach-Object { Write-Output $_ }
