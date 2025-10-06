@echo off
echo Waiting for SQL Server to be ready...

:wait
docker exec invoice-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd123" -Q "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo SQL Server is not ready yet. Waiting...
    timeout /t 2 /nobreak >nul
    goto wait
)

echo SQL Server is ready!

echo Running database migrations...
docker exec invoice-backend dotnet ef database update

echo Database initialization complete!
pause


