// Temporarily disabled Power BI controller to fix build issues
/*
using Microsoft.AspNetCore.Mvc;
using Microsoft.PowerBI.Api.Models;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.DTOs;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PowerBIController : ControllerBase
    {
        private readonly IPowerBIService _powerBIService;
        private readonly ILogger<PowerBIController> _logger;

        public PowerBIController(IPowerBIService powerBIService, ILogger<PowerBIController> logger)
        {
            _powerBIService = powerBIService;
            _logger = logger;
        }

        [HttpGet("reports")]
        public async Task<ActionResult<List<ReportDto>>> GetReports()
        {
            try
            {
                _logger.LogInformation("Retrieving Power BI reports");
                var reports = await _powerBIService.GetReportsAsync();
                
                var reportDtos = reports.Select(r => new ReportDto
                {
                    Id = r.Id.ToString(),
                    Name = r.Name,
                    WebUrl = r.WebUrl,
                    EmbedUrl = r.EmbedUrl,
                    DatasetId = r.DatasetId,
                    IsFromPbix = r.IsFromPbix,
                    IsOwnedByMe = r.IsOwnedByMe,
                    IsPublished = r.IsPublished,
                    CreatedDate = r.CreatedDate,
                    ModifiedDate = r.ModifiedDate
                }).ToList();

                return Ok(reportDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Power BI reports");
                return StatusCode(500, new { error = "Failed to retrieve Power BI reports", details = ex.Message });
            }
        }

        [HttpGet("reports/{reportId}")]
        public async Task<ActionResult<ReportDto>> GetReport(string reportId)
        {
            try
            {
                _logger.LogInformation("Retrieving Power BI report {ReportId}", reportId);
                var report = await _powerBIService.GetReportAsync(reportId);
                
                var reportDto = new ReportDto
                {
                    Id = report.Id.ToString(),
                    Name = report.Name,
                    WebUrl = report.WebUrl,
                    EmbedUrl = report.EmbedUrl,
                    DatasetId = report.DatasetId,
                    IsFromPbix = report.IsFromPbix,
                    IsOwnedByMe = report.IsOwnedByMe,
                    IsPublished = report.IsPublished,
                    CreatedDate = report.CreatedDate,
                    ModifiedDate = report.ModifiedDate
                };

                return Ok(reportDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Power BI report {ReportId}", reportId);
                return StatusCode(500, new { error = "Failed to retrieve Power BI report", details = ex.Message });
            }
        }

        [HttpPost("reports/{reportId}/embed")]
        public async Task<ActionResult<EmbedTokenDto>> GetEmbedToken(string reportId, [FromBody] EmbedTokenRequest request)
        {
            try
            {
                _logger.LogInformation("Generating embed token for report {ReportId}", reportId);
                
                if (string.IsNullOrEmpty(request.DatasetId))
                {
                    return BadRequest(new { error = "DatasetId is required" });
                }

                var embedToken = await _powerBIService.GetEmbedTokenAsync(reportId, request.DatasetId);
                
                var embedTokenDto = new EmbedTokenDto
                {
                    Token = embedToken.Token,
                    TokenId = embedToken.TokenId,
                    Expiration = embedToken.Expiration,
                    AccessLevel = embedToken.AccessLevel
                };

                return Ok(embedTokenDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating embed token for report {ReportId}", reportId);
                return StatusCode(500, new { error = "Failed to generate embed token", details = ex.Message });
            }
        }

        [HttpGet("datasets")]
        public async Task<ActionResult<List<DatasetDto>>> GetDatasets()
        {
            try
            {
                _logger.LogInformation("Retrieving Power BI datasets");
                var datasets = await _powerBIService.GetDatasetsAsync();
                
                var datasetDtos = datasets.Select(d => new DatasetDto
                {
                    Id = d.Id.ToString(),
                    Name = d.Name,
                    IsRefreshable = d.IsRefreshable,
                    IsEffectiveIdentityRequired = d.IsEffectiveIdentityRequired,
                    IsEffectiveIdentityRolesRequired = d.IsEffectiveIdentityRolesRequired,
                    IsOnPremGatewayRequired = d.IsOnPremGatewayRequired,
                    CreatedDate = d.CreatedDate,
                    ContentProviderType = d.ContentProviderType,
                    CreateReportEmbedURL = d.CreateReportEmbedURL,
                    QnaEmbedURL = d.QnaEmbedURL
                }).ToList();

                return Ok(datasetDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Power BI datasets");
                return StatusCode(500, new { error = "Failed to retrieve Power BI datasets", details = ex.Message });
            }
        }

        [HttpGet("workspaces")]
        public async Task<ActionResult<List<WorkspaceDto>>> GetWorkspaces()
        {
            try
            {
                _logger.LogInformation("Retrieving Power BI workspaces");
                var workspaces = await _powerBIService.GetWorkspacesAsync();
                
                var workspaceDtos = workspaces.Select(w => new WorkspaceDto
                {
                    Id = w.Id.ToString(),
                    Name = w.Name,
                    IsReadOnly = w.IsReadOnly,
                    IsOnDedicatedCapacity = w.IsOnDedicatedCapacity,
                    CapacityId = w.CapacityId,
                    Description = w.Description,
                    Type = w.Type,
                    State = w.State,
                    IsOrphaned = w.IsOrphaned
                }).ToList();

                return Ok(workspaceDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Power BI workspaces");
                return StatusCode(500, new { error = "Failed to retrieve Power BI workspaces", details = ex.Message });
            }
        }
    }
}
*/
