// Temporarily disabled PowerBIDataController to fix build issues
/*
using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.Services;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PowerBIDataController : ControllerBase
    {
        private readonly PowerBIDataExportService _dataExportService;
        private readonly ILogger<PowerBIDataController> _logger;

        public PowerBIDataController(PowerBIDataExportService dataExportService, ILogger<PowerBIDataController> logger)
        {
            _dataExportService = dataExportService;
            _logger = logger;
        }

        [HttpGet("analytics")]
        public async Task<ActionResult> GetAnalyticsData()
        {
            try
            {
                _logger.LogInformation("Exporting analytics data for Power BI");
                var data = await _dataExportService.GetInvoiceAnalyticsDataAsync();
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting analytics data for Power BI");
                return StatusCode(500, new { error = "Failed to export analytics data", details = ex.Message });
            }
        }

        [HttpGet("department-breakdown")]
        public async Task<ActionResult> GetDepartmentBreakdownData()
        {
            try
            {
                _logger.LogInformation("Exporting department breakdown data for Power BI");
                var data = await _dataExportService.GetDepartmentBreakdownDataAsync();
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting department breakdown data for Power BI");
                return StatusCode(500, new { error = "Failed to export department breakdown data", details = ex.Message });
            }
        }

        [HttpGet("monthly-trends")]
        public async Task<ActionResult> GetMonthlyTrendsData([FromQuery] int months = 12)
        {
            try
            {
                _logger.LogInformation("Exporting monthly trends data for Power BI (last {Months} months)", months);
                var data = await _dataExportService.GetMonthlyTrendsDataAsync(months);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting monthly trends data for Power BI");
                return StatusCode(500, new { error = "Failed to export monthly trends data", details = ex.Message });
            }
        }

        [HttpGet("vendor-analytics")]
        public async Task<ActionResult> GetVendorAnalyticsData()
        {
            try
            {
                _logger.LogInformation("Exporting vendor analytics data for Power BI");
                var data = await _dataExportService.GetVendorAnalyticsDataAsync();
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting vendor analytics data for Power BI");
                return StatusCode(500, new { error = "Failed to export vendor analytics data", details = ex.Message });
            }
        }
    }
}
*/
