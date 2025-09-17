using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.Services;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InvoiceWorkflowController : ControllerBase
    {
        private readonly AutomatedInvoiceWorkflowService _workflowService;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoiceWorkflowController> _logger;

        public InvoiceWorkflowController(
            AutomatedInvoiceWorkflowService workflowService,
            IInvoiceService invoiceService,
            ILogger<InvoiceWorkflowController> logger)
        {
            _workflowService = workflowService;
            _invoiceService = invoiceService;
            _logger = logger;
        }

        /// <summary>
        /// Trigger automated workflow action
        /// </summary>
        [HttpPost("{invoiceId}/trigger/{action}")]
        public async Task<IActionResult> TriggerWorkflowAction(int invoiceId, string action)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {invoiceId} not found");
                }

                var userId = User.Identity?.Name ?? "system";
                await _workflowService.ProcessInvoiceWorkflow(invoice, action, userId);

                return Ok(new { message = $"Workflow action '{action}' processed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing workflow action {action} for invoice {invoiceId}");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get valid transitions for current status
        /// </summary>
        [HttpGet("{invoiceId}/transitions")]
        public async Task<IActionResult> GetValidTransitions(int invoiceId)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {invoiceId} not found");
                }

                var transitions = _workflowService.GetValidTransitions(invoice.Status);
                return Ok(transitions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting transitions for invoice {invoiceId}");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Check if status can be changed manually
        /// </summary>
        [HttpPost("{invoiceId}/can-change-status")]
        public async Task<IActionResult> CanChangeStatus(int invoiceId, [FromBody] ChangeStatusRequest request)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {invoiceId} not found");
                }

                var canChange = _workflowService.CanChangeStatusManually(invoice.Status, request.Status);
                return Ok(new { canChange });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking status change for invoice {invoiceId}");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Manually change status (with validation)
        /// </summary>
        [HttpPost("{invoiceId}/change-status")]
        public async Task<IActionResult> ChangeStatus(int invoiceId, [FromBody] ChangeStatusRequest request)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {invoiceId} not found");
                }

                var canChange = _workflowService.CanChangeStatusManually(invoice.Status, request.Status);
                if (!canChange)
                {
                    return BadRequest(new { error = $"Cannot change status from {invoice.Status} to {request.Status}" });
                }

                var userId = User.Identity?.Name ?? "system";
                invoice.Status = request.Status;
                invoice.ProcessedBy = userId;
                invoice.ProcessedDate = DateTime.UtcNow;

                await _invoiceService.UpdateAsync(invoice.Id, invoice);

                return Ok(new { message = "Status changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error changing status for invoice {invoiceId}");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }

}
