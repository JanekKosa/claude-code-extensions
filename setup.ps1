<#
.SYNOPSIS
    Sets up this repository's Claude Code add-ons on this Windows machine. SETUP.md explains it.

.DESCRIPTION
    Builds, tests and installs the claude-toolbar VS Code extension, adds this folder as a Claude Code plugin
    marketplace, installs every mod the marketplace lists, and links the skills of skills\ into Claude's and Copilot's
    skill folders. Running it again is safe: it repeats the checks and changes only what is out of date.

    Windows PowerShell 5.1 runs this file, so it stays plain ASCII: 5.1 reads a UTF-8 file without a BOM as ANSI.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1
#>

$ErrorActionPreference = 'Stop'

$RepoRoot = $PSScriptRoot
$ToolbarFolder = Join-Path $RepoRoot 'claude-toolbar'
$MarketplaceFile = Join-Path $RepoRoot '.claude-plugin\marketplace.json'
$MinimumNodeMajor = 20
$HomeFolder = $env:USERPROFILE
$ClaudeConfigFolder = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HomeFolder '.claude' }
$ExtensionsFolder = if ($env:VSCODE_EXTENSIONS) { $env:VSCODE_EXTENSIONS } else { Join-Path $HomeFolder '.vscode\extensions' }

$Warnings = New-Object System.Collections.Generic.List[string]

function Write-Step {
    param([string]$Text)
    Write-Host ''
    Write-Host "==> $Text"
}

function Invoke-Native {
    <# Runs a program and stops the setup if it fails. Continue here keeps a program's stderr from reading as an error. #>
    param([string]$FilePath, [string[]]$Arguments)
    $ErrorActionPreference = 'Continue'
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "'$FilePath $($Arguments -join ' ')' failed with exit code $LASTEXITCODE."
    }
}

function Get-JsonFile {
    param([string]$Path)
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Test-SamePath {
    param([string]$First, [string]$Second)
    if (-not $First -or -not $Second) { return $false }
    return [System.IO.Path]::GetFullPath($First).TrimEnd('\') -ieq [System.IO.Path]::GetFullPath($Second).TrimEnd('\')
}

function Find-VsCode {
    <# Never the 'code' on PATH: Cursor and other forks install a 'code' of their own, and it would get the extension. #>
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\bin\code.cmd'),
        (Join-Path $env:ProgramFiles 'Microsoft VS Code\bin\code.cmd')
    )
    if (${env:ProgramFiles(x86)}) {
        $candidates += Join-Path ${env:ProgramFiles(x86)} 'Microsoft VS Code\bin\code.cmd'
    }
    return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Find-ClaudeExe {
    <# The claude.exe of the newest Claude extension. The 'claude' on PATH can be far older and is not used. #>
    $pattern = '^anthropic\.claude-code-(\d+\.\d+\.\d+)'
    $folders = Get-ChildItem -LiteralPath $ExtensionsFolder -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match $pattern } |
        Sort-Object { [void]($_.Name -match $pattern); [version]$Matches[1] } -Descending
    foreach ($folder in $folders) {
        $exe = Join-Path $folder.FullName 'resources\native-binary\claude.exe'
        if (Test-Path -LiteralPath $exe) { return $exe }
    }
    return $null
}

function Get-ClaudeJson {
    <# Runs a claude command that prints a JSON array, and returns its items one by one. #>
    param([string[]]$Arguments)
    $ErrorActionPreference = 'Continue'
    $text = (& $script:Claude @Arguments) -join "`n"
    if ($LASTEXITCODE -ne 0) {
        throw "'claude $($Arguments -join ' ')' failed with exit code $LASTEXITCODE."
    }
    # In 5.1 ConvertFrom-Json hands an array over as one object. Going through a variable unrolls it.
    $parsed = $text | ConvertFrom-Json
    return $parsed | ForEach-Object { $_ }
}

function Set-SkillLink {
    <# Links one skill into one skills folder as a junction, which needs no administrator rights. #>
    param([string]$SkillFolder, [string]$SkillsRoot)
    $link = Join-Path $SkillsRoot (Split-Path $SkillFolder -Leaf)
    New-Item -ItemType Directory -Force -Path $SkillsRoot | Out-Null
    $existing = Get-Item -LiteralPath $link -Force -ErrorAction SilentlyContinue
    if ($existing) {
        if (-not ($existing.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "$link is a real folder, not a link. Look at it and move it away, then run the setup again."
        }
        if (Test-SamePath (@($existing.Target)[0]) $SkillFolder) {
            Write-Host "Already linked: $link"
            return
        }
        # The link only, without recursing: Remove-Item -Recurse in 5.1 can delete what a junction points at.
        [System.IO.Directory]::Delete($link)
    }
    New-Item -ItemType Junction -Path $link -Target $SkillFolder | Out-Null
    Write-Host "Linked: $link"
}

function Assert-Prerequisites {
    Write-Step 'Checking what this machine has'

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is not on the PATH. Install Node.js $MinimumNodeMajor or newer, then run the setup again."
    }
    $nodeVersion = (& node --version).TrimStart('v')
    if (([version]$nodeVersion).Major -lt $MinimumNodeMajor) {
        throw "Node.js $nodeVersion is too old: this needs $MinimumNodeMajor or newer."
    }
    Write-Host "Node.js: $nodeVersion"

    $script:Code = Find-VsCode
    if (-not $script:Code) {
        throw 'VS Code is not installed in its usual folders. Install VS Code, then run the setup again.'
    }
    $toolbarManifest = Get-JsonFile (Join-Path $ToolbarFolder 'package.json')
    $script:ToolbarId = "$($toolbarManifest.publisher).$($toolbarManifest.name)"
    $script:ToolbarVersion = $toolbarManifest.version
    $requiredVsCode = [version]($toolbarManifest.engines.vscode -replace '[^\d.]', '')
    $vsCodeVersion = [version](@(& $script:Code --version)[0])
    if ($vsCodeVersion -lt $requiredVsCode) {
        throw "VS Code $vsCodeVersion is too old: the toolbar needs $requiredVsCode or newer. Update it (Help > Check for Updates)."
    }
    Write-Host "VS Code: $vsCodeVersion ($script:Code)"

    $script:Claude = Find-ClaudeExe
    if (-not $script:Claude) {
        Write-Host "Claude's VS Code extension is not installed. Installing it."
        Invoke-Native $script:Code @('--install-extension', 'anthropic.claude-code')
        $script:Claude = Find-ClaudeExe
    }
    if (-not $script:Claude) {
        throw "Claude's VS Code extension has no claude.exe in $ExtensionsFolder."
    }
    Write-Host "Claude: $(& $script:Claude --version) ($script:Claude)"
}

function Install-Toolbar {
    Write-Step 'Building and testing claude-toolbar'
    Push-Location -LiteralPath $ToolbarFolder
    try {
        # npm.cmd by name: a machine's execution policy can refuse npm.ps1, which plain 'npm' may pick.
        Invoke-Native 'npm.cmd' @('ci', '--no-fund', '--no-audit')
        Invoke-Native 'npm.cmd' @('run', 'typecheck')
        Invoke-Native 'npm.cmd' @('test')
        Invoke-Native 'npm.cmd' @('run', 'package')
        Invoke-Native 'npm.cmd' @('run', 'test:integration')

        Write-Step 'Installing claude-toolbar into VS Code'
        Invoke-Native $script:Code @('--install-extension', (Join-Path $ToolbarFolder 'claude-toolbar.vsix'), '--force')

        Write-Step 'Checking the copy VS Code runs'
        $env:CLAUDE_TOOLBAR_FOLDER = Join-Path $ExtensionsFolder "$script:ToolbarId-$script:ToolbarVersion"
        try {
            Invoke-Native 'npm.cmd' @('run', 'test:integration')
        } finally {
            Remove-Item Env:\CLAUDE_TOOLBAR_FOLDER -ErrorAction SilentlyContinue
        }
    } finally {
        Pop-Location
    }
}

function Install-Mods {
    $marketplace = Get-JsonFile $MarketplaceFile

    Write-Step 'Validating and testing the mods'
    Invoke-Native $script:Claude @('plugin', 'validate', $RepoRoot)
    foreach ($mod in $marketplace.plugins) {
        $folder = Join-Path $RepoRoot ($mod.source -replace '^\./', '')
        Invoke-Native $script:Claude @('plugin', 'validate', $folder)
        Invoke-Native $script:Claude @('plugin', 'test', $folder)
    }

    Write-Step "Adding the marketplace $($marketplace.name)"
    $added = Get-ClaudeJson @('plugin', 'marketplace', 'list', '--json') | Where-Object { $_.name -eq $marketplace.name }
    if ($added -and -not (Test-SamePath $added.path $RepoRoot)) {
        # The repo moved, or was cloned again: the marketplace still reads the old folder.
        Write-Host "It reads another folder ($($added.path)). Pointing it here."
        Invoke-Native $script:Claude @('plugin', 'marketplace', 'remove', $marketplace.name)
    }
    Invoke-Native $script:Claude @('plugin', 'marketplace', 'add', $RepoRoot)

    Write-Step 'Installing the mods'
    foreach ($mod in $marketplace.plugins) {
        Invoke-Native $script:Claude @('plugin', 'install', "$($mod.name)@$($marketplace.name)", '--scope', 'user')
    }

    Write-Step 'Checking the installed mods'
    $installed = Get-ClaudeJson @('plugin', 'list', '--json')
    foreach ($mod in $marketplace.plugins) {
        $id = "$($mod.name)@$($marketplace.name)"
        $folder = Join-Path $RepoRoot ($mod.source -replace '^\./', '')
        $entry = $installed | Where-Object { $_.id -eq $id }
        if (-not $entry -or -not $entry.enabled -or -not (Test-SamePath $entry.readFromFolder $folder)) {
            throw "$id is not installed and enabled from $folder."
        }
        Write-Host "OK: $id, read from $($entry.readFromFolder)"
    }
}

function Install-SkillLinks {
    Write-Step 'Linking the skills'
    $skillRoots = @(Join-Path $ClaudeConfigFolder 'skills')
    $copilotFolder = Join-Path $HomeFolder '.copilot'
    if (Test-Path -LiteralPath $copilotFolder) {
        $skillRoots += Join-Path $copilotFolder 'skills'
    }
    foreach ($skill in Get-ChildItem -LiteralPath (Join-Path $RepoRoot 'skills') -Directory) {
        foreach ($root in $skillRoots) {
            Set-SkillLink $skill.FullName $root
        }
    }
}

function Add-MissingPartWarnings {
    <# What the setup cannot supply: the mod is installed, but it draws nothing without it. #>
    $registerScript = Join-Path $HomeFolder '.claude\skills\orchestrate-agents\scripts\register.mjs'
    if (-not (Test-Path -LiteralPath $registerScript)) {
        $Warnings.Add("decisions-pane: the agent team is not here ($registerScript). The pane stays empty until it is.")
    }
}

try {
    Assert-Prerequisites
    Install-Toolbar
    Install-Mods
    Install-SkillLinks
    Add-MissingPartWarnings
} catch {
    Write-Host ''
    Write-Host "SETUP FAILED: $($_.Exception.Message)"
    exit 1
}

Write-Host ''
Write-Host 'SETUP DONE.'
foreach ($warning in $Warnings) {
    Write-Host "WARNING: $warning"
}
Write-Host 'Last step, by hand: in VS Code, run Developer: Reload Window. Until then the toolbar and the mods do not show.'
exit 0
