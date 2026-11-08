@echo off
setlocal

REM Format: YYYYMMDD_HHMMSS
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TIMESTAMP=%%I"

if not defined TIMESTAMP (
    echo ERROR: could not determine timestamp.
    exit /b 1
)

echo Timestamp = %TIMESTAMP%

git add .

REM Check if there are staged changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    git commit -m "%TIMESTAMP%"
    git push
) else (
    echo Nothing to commit, working tree clean.
    git push
)

endlocal