@echo off
setlocal EnableExtensions
rem ============================================================
rem  Gen onsyuri_index.json for the "game/" folder layout
rem  Usage:  gen_index.bat [title]
rem    title  optional; default reuses the existing index.json
rem           title, otherwise the current folder name
rem  Layout: <this folder> game\**   ->  onsyuri_index.json
rem ============================================================
cd /d "%~dp0"
set "PS1=%TEMP%\ons_gen_index_%RANDOM%%RANDOM%.ps1"
more +17 "%~f0" > "%PS1%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" %*
set "RC=%ERRORLEVEL%"
del "%PS1%" >nul 2>&1
if "%~1"=="" pause
exit /b %RC%
param(
    [string]$Title = "",
    [string]$GameDir = "game",
    [string]$OutFile = "onsyuri_index.json"
)

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$gamePath = Join-Path $root $GameDir
$outPath = Join-Path $root $OutFile

if (-not (Test-Path -LiteralPath $gamePath)) {
    Write-Host "[ERROR] game folder not found: $gamePath"
    exit 2
}

$title = $Title
$gamedir = ""
$savedir = ""

if (-not $title -and (Test-Path -LiteralPath $outPath)) {
    try {
        $old = Get-Content -LiteralPath $outPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($old.title) { $title = [string]$old.title }
        if ($old.gamedir) { $gamedir = [string]$old.gamedir }
        if ($old.savedir) { $savedir = [string]$old.savedir }
    } catch { }
}
if (-not $title) { $title = Split-Path -Leaf $root }
if (-not $gamedir) { $gamedir = "/onsyuri/" + $title }
if (-not $savedir) { $savedir = "/onsyuri_save/" + $title }

function EscJson([string]$s) {
    $sb = New-Object System.Text.StringBuilder
    foreach ($ch in $s.ToCharArray()) {
        $c = [int]$ch
        if ($ch -eq [char]34) { [void]$sb.Append('\"') }
        elseif ($ch -eq [char]92) { [void]$sb.Append('\\') }
        elseif ($c -eq 8) { [void]$sb.Append('\b') }
        elseif ($c -eq 12) { [void]$sb.Append('\f') }
        elseif ($c -eq 10) { [void]$sb.Append('\n') }
        elseif ($c -eq 13) { [void]$sb.Append('\r') }
        elseif ($c -eq 9) { [void]$sb.Append('\t') }
        elseif ($c -lt 32) { [void]$sb.Append(('\u{0:x4}' -f $c)) }
        elseif ($c -gt 126) { [void]$sb.Append(('\u{0:x4}' -f $c)) }
        else { [void]$sb.Append($ch) }
    }
    return $sb.ToString()
}

$files = @()
Get-ChildItem -LiteralPath $gamePath -File -Recurse -Force |
    ForEach-Object {
        $rel = $_.FullName.Substring($gamePath.Length).TrimStart([char]92, [char]47)
        $files += ($rel -replace '\\', '/')
    }
if ($files.Count -gt 1) { [Array]::Sort($files, [System.StringComparer]::Ordinal) }

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("{`n")
[void]$sb.Append('  "title": "' + (EscJson $title) + '",' + "`n")
[void]$sb.Append('  "gamedir": "' + (EscJson $gamedir) + '",' + "`n")
[void]$sb.Append('  "savedir": "' + (EscJson $savedir) + '",' + "`n")
[void]$sb.Append('  "args": [],' + "`n")
[void]$sb.Append('  "lazyload": true,' + "`n")
[void]$sb.Append('  "files": [' + "`n")
for ($i = 0; $i -lt $files.Count; $i++) {
    $rel = EscJson $files[$i]
    $comma = if ($i -lt $files.Count - 1) { "," } else { "" }
    [void]$sb.Append("    {`n")
    [void]$sb.Append('      "path": "' + $rel + '",' + "`n")
    [void]$sb.Append('      "url": "game/' + $rel + '"' + "`n")
    [void]$sb.Append("    }" + $comma + "`n")
}
[void]$sb.Append("  ]`n}")

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), $utf8)

Write-Host ""
Write-Host "  title   : $title"
Write-Host "  gamedir : $gamedir"
Write-Host "  savedir : $savedir"
Write-Host "  files   : $($files.Count)"
Write-Host "  output  : $outPath"
Write-Host ""
exit 0
