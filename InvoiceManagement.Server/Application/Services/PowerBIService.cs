// Temporarily disabled Power BI service to fix build issues
/*
using Microsoft.Identity.Client;
using Microsoft.PowerBI.Api;
using Microsoft.PowerBI.Api.Models;
using Microsoft.Rest;
using InvoiceManagement.Server.Application.Interfaces;
using System.Text.Json;

namespace InvoiceManagement.Server.Application.Services
{
    public class PowerBIService : IPowerBIService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<PowerBIService> _logger;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _tenantId;
        private readonly string _workspaceId;
        private readonly string _authority;

        public PowerBIService(IConfiguration configuration, ILogger<PowerBIService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _clientId = _configuration["PowerBI:ClientId"] ?? throw new ArgumentNullException("PowerBI:ClientId");
            _clientSecret = _configuration["PowerBI:ClientSecret"] ?? throw new ArgumentNullException("PowerBI:ClientSecret");
            _tenantId = _configuration["PowerBI:TenantId"] ?? throw new ArgumentNullException("PowerBI:TenantId");
            _workspaceId = _configuration["PowerBI:WorkspaceId"] ?? throw new ArgumentNullException("PowerBI:WorkspaceId");
            _authority = $"https://login.microsoftonline.com/{_tenantId}/oauth2/v2.0/token";
        }

        public async Task<string> GetAccessTokenAsync()
        {
            try
            {
                var app = ConfidentialClientApplicationBuilder
                    .Create(_clientId)
                    .WithClientSecret(_clientSecret)
                    .WithAuthority(_authority)
                    .Build();

                var scopes = new[] { "https://analysis.windows.net/powerbi/api/.default" };
                var result = await app.AcquireTokenForClient(scopes).ExecuteAsync();

                _logger.LogInformation("Successfully acquired Power BI access token");
                return result.AccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire Power BI access token");
                throw;
            }
        }

        public async Task<EmbedToken> GetEmbedTokenAsync(string reportId, string datasetId)
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var embedTokenRequest = new GenerateTokenRequest(
                    accessLevel: "View",
                    datasetId: datasetId,
                    identities: new List<EffectiveIdentity>
                    {
                        new EffectiveIdentity(
                            username: "admin@olympic.qa",
                            roles: new List<string> { "Admin" },
                            datasets: new List<string> { datasetId }
                        )
                    }
                );

                var embedToken = await powerBIClient.Reports.GenerateTokenAsync(
                    Guid.Parse(_workspaceId),
                    Guid.Parse(reportId),
                    embedTokenRequest
                );

                _logger.LogInformation("Successfully generated Power BI embed token for report {ReportId}", reportId);
                return embedToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate Power BI embed token for report {ReportId}", reportId);
                throw;
            }
        }

        public async Task<List<Report>> GetReportsAsync()
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var reports = await powerBIClient.Reports.GetReportsInGroupAsync(Guid.Parse(_workspaceId));
                
                _logger.LogInformation("Successfully retrieved {Count} Power BI reports", reports.Value.Count);
                return reports.Value.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI reports");
                throw;
            }
        }

        public async Task<Report> GetReportAsync(string reportId)
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var report = await powerBIClient.Reports.GetReportInGroupAsync(
                    Guid.Parse(_workspaceId),
                    Guid.Parse(reportId)
                );

                _logger.LogInformation("Successfully retrieved Power BI report {ReportId}", reportId);
                return report;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI report {ReportId}", reportId);
                throw;
            }
        }

        public async Task<List<Dataset>> GetDatasetsAsync()
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var datasets = await powerBIClient.Datasets.GetDatasetsInGroupAsync(Guid.Parse(_workspaceId));
                
                _logger.LogInformation("Successfully retrieved {Count} Power BI datasets", datasets.Value.Count);
                return datasets.Value.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI datasets");
                throw;
            }
        }

        public async Task<Dataset> GetDatasetAsync(string datasetId)
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var dataset = await powerBIClient.Datasets.GetDatasetInGroupAsync(
                    Guid.Parse(_workspaceId),
                    Guid.Parse(datasetId)
                );

                _logger.LogInformation("Successfully retrieved Power BI dataset {DatasetId}", datasetId);
                return dataset;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI dataset {DatasetId}", datasetId);
                throw;
            }
        }

        public async Task<Group> GetWorkspaceAsync(string workspaceId)
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var workspace = await powerBIClient.Groups.GetGroupAsync(Guid.Parse(workspaceId));

                _logger.LogInformation("Successfully retrieved Power BI workspace {WorkspaceId}", workspaceId);
                return workspace;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI workspace {WorkspaceId}", workspaceId);
                throw;
            }
        }

        public async Task<List<Group>> GetWorkspacesAsync()
        {
            try
            {
                var accessToken = await GetAccessTokenAsync();
                var tokenCredentials = new TokenCredentials(accessToken, "Bearer");

                using var powerBIClient = new PowerBIClient(new Uri("https://api.powerbi.com/"), tokenCredentials);

                var workspaces = await powerBIClient.Groups.GetGroupsAsync();
                
                _logger.LogInformation("Successfully retrieved {Count} Power BI workspaces", workspaces.Value.Count);
                return workspaces.Value.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Power BI workspaces");
                throw;
            }
        }
    }
}
*/
