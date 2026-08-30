param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath,
  [string]$AvdName = "Pixel_8"
)

$ErrorActionPreference = "Stop"

$sdkRoot = if ($env:ANDROID_SDK_ROOT) {
  $env:ANDROID_SDK_ROOT
} elseif ($env:ANDROID_HOME) {
  $env:ANDROID_HOME
} else {
  Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$adb = Join-Path $sdkRoot "platform-tools\adb.exe"
$emulator = Join-Path $sdkRoot "emulator\emulator.exe"
$resolvedApk = (Resolve-Path -LiteralPath $ApkPath).Path

if (-not (Test-Path -LiteralPath $adb)) {
  throw "adb non trovato in $adb. Apri Android Studio e installa Android SDK Platform-Tools."
}
if (-not (Test-Path -LiteralPath $emulator)) {
  throw "Emulatore Android non trovato in $emulator."
}

$devices = & $adb devices
if (-not ($devices -match "emulator-\d+\s+device")) {
  Write-Host "Avvio dell'emulatore $AvdName..."
  Start-Process -FilePath $emulator -ArgumentList "-avd", $AvdName
}

Write-Host "Attendo che Android sia pronto..."
& $adb wait-for-device
$deadline = (Get-Date).AddMinutes(4)
do {
  Start-Sleep -Seconds 2
  $bootCompleted = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
} while ($bootCompleted -ne "1" -and (Get-Date) -lt $deadline)

if ($bootCompleted -ne "1") {
  throw "L'emulatore non ha completato l'avvio entro quattro minuti."
}

Write-Host "Installazione di $resolvedApk..."
& $adb install -r $resolvedApk
if ($LASTEXITCODE -ne 0) {
  throw "Installazione APK non riuscita."
}

Write-Host "Urveya installata. Avvio dell'app..."
& $adb shell monkey -p com.urveya.app -c android.intent.category.LAUNCHER 1 | Out-Null

