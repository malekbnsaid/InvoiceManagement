#!/bin/bash

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
until docker exec invoice-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd123" -Q "SELECT 1" > /dev/null 2>&1; do
    echo "SQL Server is not ready yet. Waiting..."
    sleep 2
done

echo "SQL Server is ready!"

# Run Entity Framework migrations
echo "Running database migrations..."
docker exec invoice-backend dotnet ef database update

echo "Database initialization complete!"


