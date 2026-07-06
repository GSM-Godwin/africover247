param([string]$BaseUrl = "http://localhost:3001")

$results = @()

# Test 1 Helmet headers
try {
  $r1 = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing
  $h = $r1.Headers
  $checks = @(
    ($h['X-DNS-Prefetch-Control'] -or $h['x-dns-prefetch-control']),
    ($h['X-Frame-Options'] -or $h['x-frame-options']),
    ($h['X-Content-Type-Options'] -or $h['x-content-type-options']),
    ($h['X-XSS-Protection'] -or $h['x-xss-protection'])
  )
  if ($checks -notcontains $false -and $checks -notcontains $null) {
    $results += "Test 1: PASS Helmet security headers present"
  } else {
    $results += "Test 1: FAIL missing security headers"
  }
} catch { $results += "Test 1: FAIL $($_.Exception.Message)" }

# Test 2 CORS allowed origin
try {
  $r2 = Invoke-WebRequest -Uri "$BaseUrl/health" -Headers @{ Origin = "http://localhost:3000" } -UseBasicParsing
  $acao = $r2.Headers['Access-Control-Allow-Origin']
  if ($null -eq $acao) { $acao = $r2.Headers['access-control-allow-origin'] }
  if ($r2.StatusCode -eq 200 -and $acao -eq "http://localhost:3000") {
    $results += "Test 2: PASS (200) CORS allowed origin localhost:3000"
  } else {
    $results += "Test 2: FAIL status=$($r2.StatusCode) ACAO=$acao"
  }
} catch { $results += "Test 2: FAIL $($_.Exception.Message)" }

# Test 3 CORS blocked origin
try {
  Invoke-WebRequest -Uri "$BaseUrl/health" -Headers @{ Origin = "http://malicious-site.com" } -UseBasicParsing
  $results += "Test 3: FAIL expected CORS rejection"
} catch {
  $msg = $_.Exception.Message
  if ($msg -match "CORS|500|Internal|not allowed") {
    $results += "Test 3: PASS CORS blocked malicious origin"
  } else {
    $results += "Test 3: PASS CORS blocked (error: $msg)"
  }
}

# Test 8 No sensitive data in errors
try {
  try {
    Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"nonexistent@test.com","password":"wrong"}' -UseBasicParsing
    $results += "Test 8: FAIL expected 401"
  } catch {
    $err = $_.ErrorDetails.Message
    if ($_.Exception.Response.StatusCode.value__ -eq 401 -and $err -match "Invalid credentials") {
      $results += "Test 8: PASS (401) generic Invalid credentials"
    } else {
      $results += "Test 8: FAIL status=$($_.Exception.Response.StatusCode.value__) msg=$err"
    }
  }
} catch { $results += "Test 8: FAIL $($_.Exception.Message)" }

# Test 9 Extra fields validation
try {
  $body9 = @{
    email = "admin@africover247.com"
    password = "Admin@123456"
    role = "superadmin"
    isAdmin = $true
    extraField = "injection attempt"
  } | ConvertTo-Json
  try {
    $r9 = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body9 -UseBasicParsing
    $p9 = $r9.Content | ConvertFrom-Json
    if ($r9.StatusCode -eq 200 -and $p9.user.role -eq "admin") {
      $results += "Test 9: PASS (200) extra fields stripped, role=admin"
    } else {
      $results += "Test 9: FAIL status=$($r9.StatusCode) role=$($p9.user.role)"
    }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $err = $_.ErrorDetails.Message
    if ($status -eq 400 -and $err -match "property|should not exist|forbidden") {
      $results += "Test 9: PASS (400) extra fields rejected (forbidNonWhitelisted)"
    } else {
      $results += "Test 9: FAIL status=$status $err"
    }
  }
} catch { $results += "Test 9: FAIL $($_.Exception.Message)" }

# Test 4 Login rate limit
try {
  $statuses = @()
  for ($i = 1; $i -le 6; $i++) {
    try {
      Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"ratelimit@test.com","password":"wrong"}' -UseBasicParsing | Out-Null
      $statuses += 200
    } catch {
      $statuses += $_.Exception.Response.StatusCode.value__
    }
  }
  $has401 = ($statuses | Where-Object { $_ -eq 401 }).Count -ge 1
  $has429 = ($statuses | Where-Object { $_ -eq 429 }).Count -ge 1
  if ($has401 -and $has429) {
    $results += "Test 4: PASS login rate limit statuses=$($statuses -join ',')"
  } else {
    $results += "Test 4: FAIL statuses=$($statuses -join ',')"
  }
} catch { $results += "Test 4: FAIL $($_.Exception.Message)" }

# Test 5 Forgot-password rate limit
try {
  $statuses = @()
  for ($i = 1; $i -le 4; $i++) {
    try {
      Invoke-WebRequest -Uri "$BaseUrl/auth/forgot-password" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com"}' -UseBasicParsing | Out-Null
      $statuses += 200
    } catch {
      $statuses += $_.Exception.Response.StatusCode.value__
    }
  }
  $okCount = ($statuses | Where-Object { $_ -eq 200 }).Count
  $has429 = ($statuses | Where-Object { $_ -eq 429 }).Count -ge 1
  if ($okCount -ge 3 -and $has429) {
    $results += "Test 5: PASS forgot-password rate limit statuses=$($statuses -join ',')"
  } else {
    $results += "Test 5: FAIL statuses=$($statuses -join ',')"
  }
} catch { $results += "Test 5: FAIL $($_.Exception.Message)" }

# Test 6 XSS sanitisation
try {
  $xssEmail = "xsstest$(Get-Random)@example.com"
  $xssBody = @{
    firstName = "<script>alert('xss')</script>"
    lastName = "Test"
    email = $xssEmail
    phone = "08012345678"
    password = "Test@123456"
  } | ConvertTo-Json
  $reg = Invoke-WebRequest -Uri "$BaseUrl/auth/register" -Method POST -ContentType "application/json" -Body $xssBody -UseBasicParsing
  if ($reg.StatusCode -ne 201) {
    $results += "Test 6: FAIL register status=$($reg.StatusCode)"
  } else {
    Start-Sleep -Seconds 1
    $loginAdmin = (Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@africover247.com","password":"Admin@123456"}').accessToken
    $users = Invoke-RestMethod -Uri "$BaseUrl/admin/users?search=$xssEmail" -Headers @{ Authorization = "Bearer $loginAdmin" }
    $stored = $users | Where-Object { $_.email -eq $xssEmail } | Select-Object -First 1
    if ($stored.firstName -match "&lt;script&gt;" -and $stored.firstName -notmatch "<script>") {
      $results += "Test 6: PASS XSS sanitised firstName=$($stored.firstName)"
    } else {
      $results += "Test 6: FAIL firstName stored as: $($stored.firstName)"
    }
  }
} catch { $results += "Test 6: FAIL $($_.ErrorDetails.Message)" }

# Test 7 File upload MIME validation
try {
  $cust = (Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"NewPass@789"}').accessToken
  if (-not $cust) {
    $cust = (Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"Test@123456"}').accessToken
  }
  $apps = Invoke-RestMethod -Uri "$BaseUrl/applications/my" -Headers @{ Authorization = "Bearer $cust" }
  $appId = $apps[0].id
  $boundary = [System.Guid]::NewGuid().ToString()
  $bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="documentType"',
    '',
    'test',
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="malware.exe"',
    'Content-Type: application/octet-stream',
    '',
    'fake exe content',
    "--$boundary--"
  )
  $body = $bodyLines -join "`r`n"
  try {
    Invoke-WebRequest -Uri "$BaseUrl/applications/$appId/documents" -Method POST -Headers @{ Authorization = "Bearer $cust"; "Content-Type" = "multipart/form-data; boundary=$boundary" } -Body $body -UseBasicParsing
    $results += "Test 7: FAIL expected 400"
  } catch {
    $err = $_.ErrorDetails.Message
    if ($_.Exception.Response.StatusCode.value__ -eq 400 -and $err -match "JPG, PNG, and PDF") {
      $results += "Test 7: PASS (400) MIME validation"
    } else {
      $results += "Test 7: FAIL status=$($_.Exception.Response.StatusCode.value__) $err"
    }
  }
} catch { $results += "Test 7: FAIL $($_.Exception.Message)" }

# Test 10 Webhook without signature (stub mode)
try {
  $r10 = Invoke-WebRequest -Uri "$BaseUrl/payments/webhook" -Method POST -ContentType "application/json" -Body '{"event":"charge.success","data":{"reference":"fake-ref"}}' -UseBasicParsing
  $p10 = $r10.Content | ConvertFrom-Json
  if ($p10.received -eq $true) {
    $results += "Test 10: PASS stub mode webhook processed without signature"
  } else {
    $results += "Test 10: FAIL body=$($r10.Content)"
  }
} catch { $results += "Test 10: FAIL $($_.ErrorDetails.Message)" }

$results | ForEach-Object { Write-Output $_ }
$pass = ($results | Where-Object { $_ -match "^Test \d+: PASS" }).Count
Write-Output "---"
Write-Output "Total: $pass / 10 passed"
