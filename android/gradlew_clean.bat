@echo off
echo Cleaning Android build...
cd /d "%~dp0"
call gradlew clean
echo Clean completed. Now run gradlew bundleRelease
pause