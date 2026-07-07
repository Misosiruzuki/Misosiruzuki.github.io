@echo off
title GitHub Pages Auto Push

echo ================================
echo GitHub Pages Auto Push
echo ================================
echo.

REM 作業フォルダへ移動
cd /d "C:\Users\Misosiruzuki\Documents\Codex\2026-06-28\infinite-runner-factory-prestige-1-30\outputs\github-pages"

REM Git管理されていなければ初期化
if not exist ".git" (
    echo Initializing Git repository...
    call git init
)

REM originが無ければ追加
call git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding GitHub remote...
    call git remote add origin git@github.com:Misosiruzuki/Misosiruzuki.github.io.git
)

REM mainブランチへ変更
call git branch -M main

echo.
echo Adding files...
call git add -A

echo.
set /p msg=Commit message (Enterで既定): 

if "%msg%"=="" set msg=Update from Codex

echo.
echo Committing...
call git commit -m "%msg%"

echo.
echo Pushing to GitHub...
call git push -u origin main

echo.
echo ================================
echo Finished.
echo ================================
pause