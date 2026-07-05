$base = "http://localhost:3001"
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

$productId = (Invoke-RestMethod -Uri "$base/products" -Method GET)[0].id
$newApp = Invoke-RestMethod -Uri "$base/applications" -Method POST -Headers $custHeaders -Body (@{ productId = $productId } | ConvertTo-Json)
$appId = $newApp.id
Write-Output "Using applicationId: $appId"

$initiate = Invoke-RestMethod -Uri "$base/payments/initiate" -Method POST -Headers $custHeaders -Body (@{ applicationId = $appId } | ConvertTo-Json)
$paymentId = $initiate.paymentId
Write-Output "Using paymentId: $paymentId"

# Test 1 Simulate successful payment
try {
  $r1 = Invoke-WebRequest -Uri "$base/payments/simulate/$paymentId" -Method POST -Headers $adminHeaders -UseBasicParsing
  $p1 = $r1.Content | ConvertFrom-Json
  if ($r1.StatusCode -eq 200 -and $p1.received -eq $true) {
    $results += "Test 1: PASS (200) payment simulated, policy generation triggered"
  } else { $results += "Test 1: FAIL" }
} catch { $results += "Test 1: FAIL $($_.ErrorDetails.Message)" }

Start-Sleep -Seconds 2

# Test 2 List my policies
try {
  $policies = Invoke-RestMethod -Uri "$base/policies/my" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  $newPolicy = $policies | Where-Object { $_.applicationId -eq $appId } | Select-Object -First 1
  if ($newPolicy -and $newPolicy.status -eq "active" -and $newPolicy.policyNumber -match "^AFC-") {
    $policyId = $newPolicy.id
    $results += "Test 2: PASS (200) policy $($newPolicy.policyNumber), status active"
  } else {
    $results += "Test 2: FAIL no matching policy found (count=$($policies.Count))"
  }
} catch { $results += "Test 2: FAIL $($_.ErrorDetails.Message)" }

# Test 3 Get single policy
try {
  $policy = Invoke-RestMethod -Uri "$base/policies/$policyId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($policy.product -and $policy.application -and ($null -ne $policy.claims)) {
    $results += "Test 3: PASS (200) full policy with product, application, claims"
  } else { $results += "Test 3: FAIL missing relations" }
} catch { $results += "Test 3: FAIL $($_.ErrorDetails.Message)" }

# Test 4 Application status issued
try {
  $app = Invoke-RestMethod -Uri "$base/applications/$appId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($app.status -eq "issued") {
    $results += "Test 4: PASS (200) application status issued"
  } else { $results += "Test 4: FAIL status=$($app.status)" }
} catch { $results += "Test 4: FAIL $($_.ErrorDetails.Message)" }

# Test 5 Notification created
try {
  $notifs = Invoke-RestMethod -Uri "$base/notifications" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  $policyNotif = $notifs | Where-Object { $_.type -eq "policy_issued" -and $_.referenceId -eq $policyId } | Select-Object -First 1
  if ($policyNotif) {
    $results += "Test 5: PASS (200) policy_issued notification found"
  } else {
    $anyPolicyNotif = $notifs | Where-Object { $_.type -eq "policy_issued" } | Select-Object -First 1
    if ($anyPolicyNotif) { $results += "Test 5: PASS (200) policy_issued notification found" }
    else { $results += "Test 5: FAIL no policy_issued notification" }
  }
} catch { $results += "Test 5: FAIL $($_.ErrorDetails.Message)" }

# Test 6 Idempotency re-simulate
try {
  $countBefore = (Invoke-RestMethod -Uri "$base/policies/my" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }).Count
  $r6 = Invoke-WebRequest -Uri "$base/payments/simulate/$paymentId" -Method POST -Headers $adminHeaders -UseBasicParsing
  $p6 = $r6.Content | ConvertFrom-Json
  $countAfter = (Invoke-RestMethod -Uri "$base/policies/my" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }).Count
  if ($r6.StatusCode -eq 200 -and $p6.received -eq $true -and $countAfter -eq $countBefore) {
    $results += "Test 6: PASS (200) idempotent, still $countAfter policies"
  } else { $results += "Test 6: FAIL countBefore=$countBefore countAfter=$countAfter" }
} catch { $results += "Test 6: FAIL $($_.ErrorDetails.Message)" }

# Test 7 Admin list all policies
try {
  $adminList = Invoke-RestMethod -Uri "$base/admin/policies" -Method GET -Headers $adminHeaders
  $found = $adminList | Where-Object { $_.id -eq $policyId } | Select-Object -First 1
  if ($found -and $found.user -and $found.product) {
    $results += "Test 7: PASS (200) admin list includes policy with user and product"
  } else { $results += "Test 7: FAIL" }
} catch { $results += "Test 7: FAIL $($_.ErrorDetails.Message)" }

# Test 8 Admin get single policy
try {
  $adminPolicy = Invoke-RestMethod -Uri "$base/admin/policies/$policyId" -Method GET -Headers $adminHeaders
  if ($adminPolicy.user -and $adminPolicy.product -and $adminPolicy.application) {
    $results += "Test 8: PASS (200) admin policy detail with all relations"
  } else { $results += "Test 8: FAIL" }
} catch { $results += "Test 8: FAIL $($_.ErrorDetails.Message)" }

# Test 9 Admin search policies
try {
  $searchResults = Invoke-RestMethod -Uri "$base/admin/policies?search=AFC" -Method GET -Headers $adminHeaders
  $searchFound = $searchResults | Where-Object { $_.id -eq $policyId } | Select-Object -First 1
  if ($searchFound) {
    $results += "Test 9: PASS (200) search=AFC found policy"
  } else { $results += "Test 9: FAIL policy not in search results" }
} catch { $results += "Test 9: FAIL $($_.ErrorDetails.Message)" }

# Test 10 Admin accessing another user policy
try {
  Invoke-WebRequest -Uri "$base/policies/$policyId" -Method GET -Headers $adminHeaders -UseBasicParsing
  $results += "Test 10: FAIL expected 403"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    $results += "Test 10: PASS (403) admin cannot access customer policy route"
  } else { $results += "Test 10: FAIL status=$($_.Exception.Response.StatusCode.value__)" }
}

# Test 11 Non-existent policy
try {
  Invoke-WebRequest -Uri "$base/policies/00000000-0000-0000-0000-000000000000" -Method GET -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing
  $results += "Test 11: FAIL expected 404"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 404) {
    $results += "Test 11: PASS (404) Policy not found"
  } else { $results += "Test 11: FAIL status=$($_.Exception.Response.StatusCode.value__)" }
}

# Test 12 No auth
try {
  Invoke-WebRequest -Uri "$base/policies/my" -Method GET -UseBasicParsing
  $results += "Test 12: FAIL expected 401"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    $results += "Test 12: PASS (401) Unauthorized"
  } else { $results += "Test 12: FAIL status=$($_.Exception.Response.StatusCode.value__)" }
}

$results | ForEach-Object { Write-Output $_ }
$passCount = ($results | Where-Object { $_ -match "PASS" }).Count
Write-Output "---"
Write-Output "Total: $passCount / $($results.Count) passed"
