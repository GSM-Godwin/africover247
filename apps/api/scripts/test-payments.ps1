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
try {
  $newApp = Invoke-RestMethod -Uri "$base/applications" -Method POST -Headers $custHeaders -Body (@{ productId = $productId } | ConvertTo-Json)
  $appId = $newApp.id
} catch {
  $draft = Invoke-RestMethod -Uri "$base/applications/my/draft/$productId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($draft -and $draft.status -eq "draft") { $appId = $draft.id }
  else {
    $products = Invoke-RestMethod -Uri "$base/products" -Method GET
    foreach ($p in $products) {
      try {
        $newApp = Invoke-RestMethod -Uri "$base/applications" -Method POST -Headers $custHeaders -Body (@{ productId = $p.id } | ConvertTo-Json)
        $appId = $newApp.id
        break
      } catch {}
    }
  }
}
Write-Output "Using applicationId: $appId"

# Test 1
try {
  $r1 = Invoke-WebRequest -Uri "$base/payments/initiate" -Method POST -Headers $custHeaders -Body (@{ applicationId = $appId } | ConvertTo-Json) -UseBasicParsing
  $p1 = $r1.Content | ConvertFrom-Json
  $paymentId = $p1.paymentId
  if ($r1.StatusCode -eq 200 -and $p1.checkoutUrl -match "callback" -and $paymentId) {
    $results += "Test 1: PASS (200) paymentId=$paymentId"
  } else { $results += "Test 1: FAIL" }
} catch { $results += "Test 1: FAIL - $($_.ErrorDetails.Message)" }

# Test 2
try {
  $app2 = Invoke-RestMethod -Uri "$base/applications/$appId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($app2.status -eq "pending_payment") { $results += "Test 2: PASS (200)" } else { $results += "Test 2: FAIL status=$($app2.status)" }
} catch { $results += "Test 2: FAIL" }

# Test 3
try {
  $s3 = Invoke-RestMethod -Uri "$base/payments/status/$appId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($s3.applicationStatus -eq "pending_payment" -and $s3.payment.status -eq "pending") { $results += "Test 3: PASS (200)" } else { $results += "Test 3: FAIL" }
} catch { $results += "Test 3: FAIL" }

# Test 4
try {
  Invoke-WebRequest -Uri "$base/payments/initiate" -Method POST -Headers $custHeaders -Body (@{ applicationId = $appId } | ConvertTo-Json) -UseBasicParsing
  $results += "Test 4: FAIL expected 400"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 400) { $results += "Test 4: PASS (400)" } else { $results += "Test 4: FAIL" }
}

# Test 5
try {
  $r5 = Invoke-WebRequest -Uri "$base/payments/simulate/$paymentId" -Method POST -Headers $adminHeaders -UseBasicParsing
  $p5 = $r5.Content | ConvertFrom-Json
  if ($p5.received -eq $true) { $results += "Test 5: PASS (200)" } else { $results += "Test 5: FAIL" }
} catch { $results += "Test 5: FAIL - $($_.ErrorDetails.Message)" }

# Test 6
try {
  $s6 = Invoke-RestMethod -Uri "$base/payments/status/$appId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($s6.applicationStatus -eq "paid" -and $s6.payment.status -eq "successful") { $results += "Test 6: PASS (200)" } else { $results += "Test 6: FAIL" }
} catch { $results += "Test 6: FAIL" }

# Test 7
try {
  $app7 = Invoke-RestMethod -Uri "$base/applications/$appId" -Method GET -Headers @{ Authorization = "Bearer $customerToken" }
  if ($app7.status -eq "paid") { $results += "Test 7: PASS (200)" } else { $results += "Test 7: FAIL status=$($app7.status)" }
} catch { $results += "Test 7: FAIL" }

# Test 8
try {
  $r8 = Invoke-WebRequest -Uri "$base/payments/webhook" -Method POST -ContentType "application/json" -Headers @{ "x-paystack-signature" = "stub-signature" } -Body (@{ event = "charge.success"; data = @{ reference = $paymentId; amount = 4500000; status = "success" } } | ConvertTo-Json -Depth 5) -UseBasicParsing
  if (($r8.Content | ConvertFrom-Json).received -eq $true) { $results += "Test 8: PASS (200)" } else { $results += "Test 8: FAIL" }
} catch { $results += "Test 8: FAIL - $($_.ErrorDetails.Message)" }

# Test 9
try {
  Invoke-WebRequest -Uri "$base/payments/initiate" -Method POST -Headers $custHeaders -Body (@{ applicationId = $appId } | ConvertTo-Json) -UseBasicParsing
  $results += "Test 9: FAIL expected 400"
} catch {
  $msg = $_.ErrorDetails.Message
  if ($_.Exception.Response.StatusCode.value__ -eq 400 -and $msg -match "already been paid") { $results += "Test 9: PASS (400)" } else { $results += "Test 9: FAIL $msg" }
}

# Test 10
try {
  Invoke-WebRequest -Uri "$base/payments/initiate" -Method POST -ContentType "application/json" -Body (@{ applicationId = $appId } | ConvertTo-Json) -UseBasicParsing
  $results += "Test 10: FAIL expected 401"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) { $results += "Test 10: PASS (401)" } else { $results += "Test 10: FAIL" }
}

# Test 11
try {
  Invoke-WebRequest -Uri "$base/payments/simulate/$paymentId" -Method POST -Headers @{ Authorization = "Bearer $customerToken" } -UseBasicParsing
  $results += "Test 11: FAIL expected 403"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) { $results += "Test 11: PASS (403)" } else { $results += "Test 11: FAIL" }
}

$results | ForEach-Object { Write-Output $_ }
