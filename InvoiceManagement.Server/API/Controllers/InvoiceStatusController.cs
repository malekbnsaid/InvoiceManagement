using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.Services;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceStatusController : ControllerBase
    {
        private readonly ISimpleInvoiceStatusService _statusService;

        public InvoiceStatusController(ISimpleInvoiceStatusService statusService)
        {
            _statusService = statusService;
        }

        [HttpGet("{id}/transitions")]
        public async Task<IActionResult> GetValidTransitions(int id)
        {
            try
            {
                var transitions = await _statusService.GetValidTransitionsAsync(id);
                return Ok(transitions);
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusRequest request)
        {
            try
            {
                var success = await _statusService.ChangeStatusAsync(
                    id, 
                    request.Status, 
                    request.ChangedBy, 
                    request.Reason
                );

                if (success)
                {
                    return Ok(new { message = "Status changed successfully" });
                }
                else
                {
                    return BadRequest("Invalid status transition or invoice not found");
                }
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}/can-change/{status}")]
        public async Task<IActionResult> CanChangeStatus(int id, InvoiceStatus status)
        {
            try
            {
                var canChange = await _statusService.CanChangeStatusAsync(id, status);
                return Ok(new { canChange });
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class ChangeStatusRequest
    {
        public InvoiceStatus Status { get; set; }
        public string ChangedBy { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
