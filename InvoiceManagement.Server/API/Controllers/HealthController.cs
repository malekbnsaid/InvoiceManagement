using Microsoft.AspNetCore.Mvc;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ILogger<HealthController> _logger;

        public HealthController(ILogger<HealthController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Get()
        {
            _logger.LogInformation("Health check requested");
            
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
            });
        }

        [HttpGet("ready")]
        public IActionResult Ready()
        {
            _logger.LogInformation("Readiness check requested");
            
            // Add any readiness checks here (database connectivity, external services, etc.)
            return Ok(new
            {
                Status = "Ready",
                Timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("live")]
        public IActionResult Live()
        {
            _logger.LogInformation("Liveness check requested");
            
            // Add any liveness checks here
            return Ok(new
            {
                Status = "Alive",
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
