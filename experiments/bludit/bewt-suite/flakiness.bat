@echo off
setlocal enabledelayedexpansion

REM ======= NUMBER OF RUNS ==========
set n=50

for /L %%i in (1,1,%n%) do (
    echo.
    echo [RUN %%i OF %n%]
    echo Starting browser container...
    docker run -d -p 4444:4444 -p 7900:7900 --shm-size="2g" --name=browser selenium/standalone-chrome:138.0-chromedriver-138.0

    timeout /t 5 /nobreak >nul

    echo Starting Bludit container...
    docker run --name bludit -p 8080:80 -d bludit/docker:2.3.4

    timeout /t 10 /nobreak >nul

    echo Running tests with Manve...
    mvn -Dtest=TestSuite test

    echo Saving results...
    mkdir "..\..\..\..\flakycheck\bludit-2.3.4\conf1\%%i"
    xcopy /E /Y "target\surefire-reports\*" "..\..\..\..\flakycheck\bludit-2.3.4\conf1\%%i"

    echo Stopping and removing Docker containers...
    docker stop browser >nul
    docker rm browser >nul
    docker stop bludit >nul
    docker rm bludit >nul

    timeout /t 5 /nobreak >nul
)

echo.
echo ======= DONE =======
pause
