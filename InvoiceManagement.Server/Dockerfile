# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Use the official .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the backend project file
COPY ["InvoiceManagement.Server/InvoiceManagement.Server.csproj", "InvoiceManagement.Server/"]

# Restore dependencies
RUN dotnet restore "InvoiceManagement.Server/InvoiceManagement.Server.csproj"

# Copy only the backend source code
COPY ["InvoiceManagement.Server/", "InvoiceManagement.Server/"]

# Build the application
WORKDIR "/src/InvoiceManagement.Server"
RUN dotnet build "InvoiceManagement.Server.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "InvoiceManagement.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create documents directory for file uploads
RUN mkdir -p /app/Documents

ENTRYPOINT ["dotnet", "InvoiceManagement.Server.dll"]
