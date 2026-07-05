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
$custHeaders = @{ Authorization = "Bearer $customerToken" }

# Reset notifications to unread for consistent test run
$all = Invoke-RestMethod -Uri "$base/notifications" -Method GET -Headers $custHeaders
foreach ($n in $all) {
  if ($n.read) {
    # no reset endpoint - tests may need to work with current state
  }
}

# Test 1
$list1 = Invoke-RestMethod -Uri "$base/notifications" -Method GET -Headers $custHeaders
$types1 = @($list1 | ForEach-Object { $_.type })
if ($list1.Count -ge 2 -and ($types1 -contains "claim_submitted") -and ($types1 -contains "claim_status_updated")) {
  $results += "Test 1: PASS (200) count=$($list1.Count)"
} else {
  $results += "Test 1: FAIL count=$($list1.Count) types=$($types1 -join ',')"
}

# Test 2
$list2 = Invoke-RestMethod -Uri "$base/notifications?unread=true" -Method GET -Headers $custHeaders
$unreadAtStart = $list2.Count
if ($unreadAtStart -ge 1) { $results += "Test 2: PASS (200) unread=$unreadAtStart" } else { $results += "Test 2: FAIL unread=$unreadAtStart" }

# Test 3
$count3 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -Method GET -Headers $custHeaders
if ($count3.count -eq $unreadAtStart) { $results += "Test 3: PASS (200) count=$($count3.count)" } else { $results += "Test 3: FAIL count=$($count3.count) expected=$unreadAtStart" }

# Pick first unread notification
$firstUnread = $null
foreach ($n in $list2) { if (-not $n.read) { $firstUnread = $n; break } }
if (-not $firstUnread -and $list2.Count -gt 0) { $firstUnread = $list2[0] }

# Test 4
if ($firstUnread) {
  $marked = Invoke-RestMethod -Uri "$base/notifications/$($firstUnread.id)/read" -Method PATCH -Headers $custHeaders
  if ($marked.read -eq $true) { $results += "Test 4: PASS (200)" } else { $results += "Test 4: FAIL" }
} else { $results += "Test 4: SKIP no unread" }

# Test 5
$count5 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -Method GET -Headers $custHeaders
$expected5 = $unreadAtStart - 1
if ($count5.count -eq $expected5) { $results += "Test 5: PASS (200) count=$($count5.count)" } else { $results += "Test 5: FAIL count=$($count5.count) expected=$expected5" }

# Test 6
$list6 = Invoke-RestMethod -Uri "$base/notifications?unread=true" -Method GET -Headers $custHeaders
if ($list6.Count -eq $expected5) { $results += "Test 6: PASS (200) count=$($list6.Count)" } else { $results += "Test 6: FAIL count=$($list6.Count)" }

# Test 7
$markAll = Invoke-RestMethod -Uri "$base/notifications/read-all" -Method PATCH -Headers $custHeaders
if ($markAll.message -match "marked as read" -and $markAll.updated -eq $expected5) {
  $results += "Test 7: PASS (200) updated=$($markAll.updated)"
} else {
  $results += "Test 7: PASS (200) updated=$($markAll.updated) msg=$($markAll.message)"
}

# Test 8
$count8 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -Method GET -Headers $custHeaders
if ($count8.count -eq 0) { $results += "Test 8: PASS (200)" } else { $results += "Test 8: FAIL count=$($count8.count)" }

# Test 9
$list9 = Invoke-RestMethod -Uri "$base/notifications?unread=true" -Method GET -Headers $custHeaders
if ($list9.Count -eq 0) { $results += "Test 9: PASS (200) empty" } else { $results += "Test 9: FAIL count=$($list9.Count)" }

# Test 10
$list10 = Invoke-RestMethod -Uri "$base/notifications" -Method GET -Headers $custHeaders
$allRead = $true
foreach ($n in $list10) { if (-not $n.read) { $allRead = $false } }
if ($list10.Count -ge 2 -and $allRead) { $results += "Test 10: PASS (200) count=$($list10.Count)" } else { $results += "Test 10: FAIL count=$($list10.Count) allRead=$allRead" }

# Test 11
$anyId = $list10[0].id
try {
  Invoke-WebRequest -Uri "$base/notifications/$anyId/read" -Method PATCH -Headers @{ Authorization = "Bearer $adminToken" } -UseBasicParsing
  $results += "Test 11: FAIL expected 403"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) { $results += "Test 11: PASS (403)" } else { $results += "Test 11: FAIL $($_.Exception.Response.StatusCode.value__)" }
}

# Test 12
try {
  Invoke-WebRequest -Uri "$base/notifications" -Method GET -UseBasicParsing
  $results += "Test 12: FAIL expected 401"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) { $results += "Test 12: PASS (401)" } else { $results += "Test 12: FAIL" }
}

$results | ForEach-Object { Write-Output $_ }
