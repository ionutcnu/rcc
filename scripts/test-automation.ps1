param(
    [switch]$Headless,
    [switch]$Record
)

$APP_PORT = 3000
$APP_URL = "http://localhost:$APP_PORT"
$MAX_WAIT_TIME = 60000  # 60 seconds
$CHECK_INTERVAL = 1000  # 1 second

$script:appProcess = $null
$script:appStartedByScript = $false

function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForServer {
    param(
        [string]$Url,
        [int]$Timeout = $MAX_WAIT_TIME
    )
    
    $startTime = Get-Date
    $loginUrl = "$Url/login"
    
    while ($true) {
        $timeElapsed = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($timeElapsed -ge $Timeout) {
            throw "Server failed to start within $Timeout ms"
        }
        
        try {
            $response = Invoke-WebRequest -Uri $loginUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
                Write-Host "✅ Server and routes are ready!" -ForegroundColor Green
                return
            }
        }
        catch {
            $elapsedSeconds = [math]::Round($timeElapsed / 1000)
            Write-Host "[WAIT] Server not ready yet... ($elapsedSeconds s)" -ForegroundColor Yellow
        }
        
        Start-Sleep -Milliseconds $CHECK_INTERVAL
    }
}

function Start-App {
    Write-Host "🚀 Starting the application..." -ForegroundColor Yellow
    
    $script:appProcess = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput "app_output.log" -RedirectStandardError "app_error.log"
    
    # Wait a bit for the process to start
    Start-Sleep -Seconds 3
    
    # Check if process is still running
    if ($script:appProcess.HasExited) {
        $errorContent = Get-Content "app_error.log" -ErrorAction SilentlyContinue
        throw "Failed to start application. Error: $errorContent"
    }
    
    $script:appStartedByScript = $true
    
    # Monitor the output file for startup confirmation
    $timeout = 30
    $elapsed = 0
    $appReady = $false
    
    while ($elapsed -lt $timeout) {
        if (Test-Path "app_output.log") {
            $content = Get-Content "app_output.log" -ErrorAction SilentlyContinue
            if ($content -match "Ready|started server|Local:" -and -not $appReady) {
                $appReady = $true
                Write-Host "[APP] Application started successfully" -ForegroundColor Green
                # Wait a bit more for routes to be fully ready
                Start-Sleep -Seconds 2
                break
            }
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
}

function Invoke-CypressTests {
    Write-Host "🧪 Running Cypress tests..." -ForegroundColor Yellow
    
    if ($Headless) {
        $cypressArgs = @("run", "cypress:run")
    }
    else {
        $cypressArgs = @("run", "cypress:run", "--headed")
    }
      if ($Record) {
        $recordKey = $env:CYPRESS_RECORD_KEY
        if (-not $recordKey) {
            Write-Host "❌ CYPRESS_RECORD_KEY environment variable is required for recording" -ForegroundColor Red
            throw "Missing CYPRESS_RECORD_KEY"
        }
        $cypressArgs += @("--record", "--key", $recordKey)
    }
    
    try {
        $cypressProcess = Start-Process -FilePath "bun" -ArgumentList $cypressArgs -Wait -PassThru -NoNewWindow
        
        if ($cypressProcess.ExitCode -eq 0) {
            Write-Host "✅ All tests passed!" -ForegroundColor Green
        }
        else {
            throw "Cypress tests failed with exit code $($cypressProcess.ExitCode)"
        }
    }
    catch {
        throw "Failed to run Cypress tests: $($_.Exception.Message)"
    }
}

function Stop-AppProcess {
    if ($script:appProcess -and $script:appStartedByScript -and -not $script:appProcess.HasExited) {
        Write-Host "🧹 Cleaning up: stopping the application..." -ForegroundColor Yellow
        
        try {
            $script:appProcess.Kill()
            $script:appProcess.WaitForExit(5000)
        }
        catch {
            Write-Warning "Failed to stop application process gracefully"
        }
    }
    
    # Clean up log files
    Remove-Item "app_output.log" -ErrorAction SilentlyContinue
    Remove-Item "app_error.log" -ErrorAction SilentlyContinue
}

# Main execution
try {
    Write-Host "🔍 Checking if application is already running..." -ForegroundColor Cyan
    
    $isPortInUse = Test-PortInUse -Port $APP_PORT
    
    if ($isPortInUse) {
        Write-Host "✅ Application is already running on port $APP_PORT" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Application is not running on port $APP_PORT" -ForegroundColor Red
        Start-App
        
        # Wait for the server to be fully ready
        Wait-ForServer -Url $APP_URL
    }
    
    # Run Cypress tests
    Invoke-CypressTests
    
    Write-Host "🎉 Test automation completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Stop-AppProcess
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-AppProcess
}