using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Entities;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Net.Http;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IOcrService _ocrService;
        private readonly IInvoiceService _invoiceService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<InvoicesController> _logger;

        public InvoicesController(
            IOcrService ocrService,
            IInvoiceService invoiceService,
            IHttpClientFactory httpClientFactory,
            ILogger<InvoicesController> logger)
        {
            _ocrService = ocrService;
            _invoiceService = invoiceService;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpPost("process")]
        public async Task<ActionResult<OcrResult>> ProcessInvoice(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var tempPath = Path.GetTempFileName();
            try
            {
                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Process with OCR
                var ocrResult = await _ocrService.ProcessInvoiceAsync(tempPath);
                
                // Save to database if processing was successful
                if (ocrResult.IsProcessed)
                {
                    try
                    {
                        await _invoiceService.CreateFromOcrResultAsync(ocrResult, User.Identity?.Name ?? "system");
                        _logger.LogInformation("Successfully saved invoice {InvoiceNumber} to database", ocrResult.InvoiceNumber);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to save invoice to database, but OCR processing was successful");
                        // We still return the OCR result even if database save fails
                    }
                }

                // Return the OCR result directly
                return Ok(ocrResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing invoice");
                return StatusCode(500, "An error occurred while processing the invoice");
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetAll()
        {
            var invoices = await _invoiceService.GetAllAsync();
            return Ok(invoices);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetById(int id)
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
                return NotFound();

            return Ok(invoice);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Invoice>> Update(int id, Invoice invoice)
        {
            try
            {
                var updatedInvoice = await _invoiceService.UpdateAsync(id, invoice);
                return Ok(updatedInvoice);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _invoiceService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("test")]
        public async Task<ActionResult> TestOcr()
        {
            var sampleInvoicePath = Path.Combine(Directory.GetCurrentDirectory(), "SampleData", "sample-invoice.pdf");
            
            if (!System.IO.File.Exists(sampleInvoicePath))
                return NotFound("Sample invoice file not found");

            try
            {
                var result = await _ocrService.ProcessInvoiceAsync(sampleInvoicePath);
                if (!result.IsProcessed)
                    return BadRequest(result.ErrorMessage ?? "Failed to process invoice");

                var invoice = await _invoiceService.CreateFromOcrResultAsync(result, "system");
                return Ok(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing OCR");
                return StatusCode(500, $"Error testing OCR: {ex.Message}");
            }
        }

        [HttpPost("test-url")]
        public async Task<ActionResult> TestOcrFromUrl([FromBody] string invoiceUrl)
        {
            if (string.IsNullOrEmpty(invoiceUrl))
                return BadRequest("URL is required");

            var tempPath = Path.GetTempFileName();
            try
            {
                // Download the file
                var httpClient = _httpClientFactory.CreateClient();
                var response = await httpClient.GetAsync(invoiceUrl);
                if (!response.IsSuccessStatusCode)
                    return BadRequest($"Failed to download file: {response.StatusCode}");

                // Save to temp file
                using (var stream = await response.Content.ReadAsStreamAsync())
                using (var fileStream = new FileStream(tempPath, FileMode.Create))
                {
                    await stream.CopyToAsync(fileStream);
                }

                // Process with OCR
                var result = await _ocrService.ProcessInvoiceAsync(tempPath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing invoice from URL");
                return StatusCode(500, $"Error processing invoice: {ex.Message}");
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }
        }

        [HttpPost("test-diagnostic")]
        public async Task<ActionResult> TestOcrDiagnostic(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var tempPath = Path.GetTempFileName();
            try
            {
                _logger.LogInformation("Starting OCR diagnostic test");
                
                // Save the uploaded file
                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                
                _logger.LogInformation("File saved to temporary location: {TempPath}", tempPath);

                // Process with OCR
                var ocrResult = await _ocrService.ProcessInvoiceAsync(tempPath);
                
                // Create a diagnostic response
                var diagnosticResult = new
                {
                    IsProcessed = ocrResult.IsProcessed,
                    ErrorMessage = ocrResult.ErrorMessage,
                    ConfidenceScore = ocrResult.ConfidenceScore,
                    ExtractedFields = new
                    {
                        InvoiceNumber = ocrResult.InvoiceNumber,
                        InvoiceDate = ocrResult.InvoiceDate,
                        DueDate = ocrResult.DueDate,
                        InvoiceValue = ocrResult.InvoiceValue,
                        TotalAmount = ocrResult.TotalAmount,
                        TaxAmount = ocrResult.TaxAmount,
                        Currency = ocrResult.Currency,
                        VendorName = ocrResult.VendorName,
                        VendorTaxId = ocrResult.VendorTaxId
                    },
                    FieldConfidenceScores = ocrResult.FieldConfidenceScores,
                    RawText = ocrResult.RawText
                };

                return Ok(diagnosticResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR diagnostic test");
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }
        }
    }
} 