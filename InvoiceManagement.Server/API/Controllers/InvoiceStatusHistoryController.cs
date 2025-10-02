using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceStatusHistoryController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoiceStatusHistoryController> _logger;

        public InvoiceStatusHistoryController(IInvoiceService invoiceService, ILogger<InvoiceStatusHistoryController> logger)
        {
            _invoiceService = invoiceService;
            _logger = logger;
        }

        // GET: api/InvoiceStatusHistory/{invoiceId}
        [HttpGet("{invoiceId}")]
        public async Task<ActionResult<IEnumerable<StatusHistory>>> GetStatusHistory(int invoiceId)
        {
            try
            {
                _logger.LogInformation("Fetching status history for invoice {InvoiceId}", invoiceId);
                var history = await _invoiceService.GetStatusHistoryAsync(invoiceId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching status history for invoice {InvoiceId}", invoiceId);
                return StatusCode(500, "An error occurred while fetching status history");
            }
        }

        // POST: api/InvoiceStatusHistory
        [HttpPost]
        public async Task<ActionResult<StatusHistory>> AddStatusHistory([FromBody] StatusHistory history)
        {
            try
            {
                _logger.LogInformation("Adding status history for invoice {InvoiceId}", history.InvoiceId);
                var newHistory = await _invoiceService.AddStatusHistoryAsync(history);
                return CreatedAtAction(nameof(GetStatusHistory), new { invoiceId = newHistory.InvoiceId }, newHistory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding status history for invoice {InvoiceId}", history.InvoiceId);
                return StatusCode(500, "An error occurred while adding status history");
            }
        }
    }
}
