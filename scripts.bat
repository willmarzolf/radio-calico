@echo off
REM Radio Calico - Windows Batch Scripts
REM Alternative to Makefile for Windows users

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="dev" goto dev
if "%1"=="dev-docker" goto dev-docker
if "%1"=="prod" goto prod
if "%1"=="prod-build" goto prod-build
if "%1"=="prod-up" goto prod-up
if "%1"=="prod-down" goto prod-down
if "%1"=="test" goto test
if "%1"=="test-backend" goto test-backend
if "%1"=="test-frontend" goto test-frontend
if "%1"=="test-coverage" goto test-coverage
if "%1"=="install" goto install
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="stop" goto stop
if "%1"=="clean" goto clean

echo Unknown command: %1
goto help

:help
echo Radio Calico - Available Commands
echo.
echo Development:
echo   scripts dev        - Start development server
echo   scripts dev-docker - Start development with Docker
echo   scripts install    - Install dependencies
echo.
echo Production:
echo   scripts prod       - Start production environment
echo   scripts prod-build - Build production images
echo   scripts prod-up    - Start production containers
echo   scripts prod-down  - Stop production containers
echo.
echo Testing:
echo   scripts test         - Run all tests
echo   scripts test-backend - Run backend tests only
echo   scripts test-frontend - Run frontend tests only
echo   scripts test-coverage - Generate coverage report
echo.
echo Management:
echo   scripts status - Show container status
echo   scripts logs   - Show container logs
echo   scripts stop   - Stop all containers
echo   scripts clean  - Clean up Docker resources
goto end

:install
echo Installing dependencies...
npm install
goto end

:dev
echo Starting development server...
npm run dev
goto end

:dev-docker
echo Starting development with Docker...
docker-compose up
goto end

:prod-build
echo Building production images...
docker-compose -f docker-compose.prod.yml build
goto end

:prod-up
echo Starting production environment...
docker-compose -f docker-compose.prod.yml up -d
echo Production started at http://localhost
goto end

:prod-down
echo Stopping production environment...
docker-compose -f docker-compose.prod.yml down
goto end

:prod
call :prod-build
call :prod-up
goto end

:test
echo Running all tests...
npm test
goto end

:test-backend
echo Running backend tests...
npm run test:backend
goto end

:test-frontend
echo Running frontend tests...
npm run test:frontend
goto end

:test-coverage
echo Generating test coverage...
npm run test:coverage
goto end

:status
echo Container Status:
docker-compose -f docker-compose.prod.yml ps 2>nul
docker-compose ps 2>nul
goto end

:logs
echo Production logs:
docker-compose -f docker-compose.prod.yml logs -f
goto end

:stop
echo Stopping all containers...
docker-compose -f docker-compose.prod.yml down 2>nul
docker-compose down 2>nul
goto end

:clean
echo Cleaning up Docker resources...
docker-compose -f docker-compose.prod.yml down -v 2>nul
docker-compose down -v 2>nul
docker image prune -f
docker volume prune -f
echo Cleanup completed
goto end

:end