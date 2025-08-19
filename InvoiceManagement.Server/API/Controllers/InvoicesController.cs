using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Services.OCR;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Net.Http;
using Azure;
using System;
using System.Linq;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.Extensions.DependencyInjection;
using InvoiceManagement.Server.Application.Services.OCR;

namespace InvoiceManagement.Server.API.Controllers
{
    public class ErrorResponse
    {
        public string Message { get; set; }
        public string[] Details { get; set; }

        public ErrorResponse(string message, params string[] details)
        {
            Message = message;
            Details = details ?? Array.Empty<string>();
        }
    }

    public class CreateInvoiceRequest
    {
        [JsonPropertyName("ocrResult")]
        public OcrResult OcrResult { get; set; } = null!;
        [JsonPropertyName("filePath")]
        public string? FilePath { get; set; }
        [JsonPropertyName("fileName")]
        public string? FileName { get; set; }
        [JsonPropertyName("fileType")]
        public string? FileType { get; set; }
        [JsonPropertyName("fileSize")]
        public long? FileSize { get; set; }
    }

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

            // Validate file size (10MB max)
            if (file.Length > 10 * 1024 * 1024)
                return BadRequest("File size exceeds maximum limit of 10MB");

            // Validate file type
            var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/tiff" };
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif" };
            
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types are: {string.Join(", ", allowedExtensions)}");
            }

            // Create a temporary file with the correct extension
            var tempFileName = $"{Path.GetFileNameWithoutExtension(Path.GetTempFileName())}{extension}";
            var tempPath = Path.Combine(Path.GetTempPath(), tempFileName);

            try
            {
                _logger.LogInformation("Processing invoice file: {FileName}, Size: {Size} bytes", file.FileName, file.Length);

                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Validate file format
                var isValidFormat = await _ocrService.ValidateInvoiceFormatAsync(tempPath);
                if (!isValidFormat)
                {
                    return BadRequest("Invalid invoice format. Please ensure the file is a valid invoice document.");
                }

                // Process with OCR
                var ocrResult = await _ocrService.ProcessInvoiceAsync(tempPath);
                
                if (!ocrResult.IsProcessed)
                {
                    _logger.LogWarning("OCR processing failed for file {FileName}: {Error}", 
                        file.FileName, ocrResult.ErrorMessage);
                    return BadRequest(ocrResult.ErrorMessage ?? "Failed to process invoice");
                }

                _logger.LogInformation("OCR processing completed for file {FileName} with confidence {Confidence}", 
                    file.FileName, ocrResult.ConfidenceScore);
                
                return Ok(ocrResult);
            }
            catch (ArgumentNullException ex)
            {
                _logger.LogError(ex, "Configuration error while processing invoice");
                return StatusCode(500, "Azure Form Recognizer is not properly configured");
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Form Recognizer API error");
                return StatusCode(500, $"Azure Form Recognizer error: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing invoice");
                return StatusCode(500, "An unexpected error occurred while processing the invoice");
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
            }
        }

        [HttpPost]
        public async Task<ActionResult<Invoice>> Create([FromBody] CreateInvoiceRequest request)
        {
            _logger.LogInformation("Received invoice creation request: {@Request}", 
                new { 
                    request?.OcrResult?.InvoiceNumber,
                    request?.OcrResult?.InvoiceDate,
                    request?.OcrResult?.InvoiceValue,
                    request?.OcrResult?.TotalAmount,
                    request?.OcrResult?.VendorName,
                    request?.OcrResult?.VendorTaxId,
                    LineItemCount = request?.OcrResult?.LineItems?.Count ?? 0,
                    FileName = request?.FileName,
                    FileSize = request?.FileSize
                });

            if (request?.OcrResult == null)
            {
                _logger.LogWarning("Received null OCR result");
                return BadRequest(new ErrorResponse("OCR result is required"));
            }

            var ocrResult = request.OcrResult;

            // Validate required fields
            var validationErrors = new List<string>();
            
            // Essential Invoice Information
            if (string.IsNullOrEmpty(ocrResult.InvoiceNumber))
            {
                validationErrors.Add("Invoice number is required");
            }
            if (!ocrResult.InvoiceDate.HasValue)
            {
                validationErrors.Add("Invoice date is required");
            }
            if (!ocrResult.InvoiceValue.HasValue && !ocrResult.TotalAmount.HasValue)
            {
                validationErrors.Add("Invoice amount is required");
            }

            // Vendor Information
            if (string.IsNullOrEmpty(ocrResult.VendorName))
            {
                validationErrors.Add("Vendor name is required");
            }
            if (string.IsNullOrEmpty(ocrResult.VendorTaxId))
            {
                // If VendorTaxId is not available in OCR result, use a default value
                ocrResult.VendorTaxId = "PENDING"; // This will be updated later by the vendor
            }

            if (validationErrors.Any())
            {
                _logger.LogWarning("Validation failed: {Errors}", string.Join(", ", validationErrors));
                return BadRequest(new ErrorResponse("Validation failed", validationErrors.ToArray()));
            }

            try
            {
                _logger.LogInformation("Creating invoice from OCR result with invoice number: {InvoiceNumber}", 
                    ocrResult.InvoiceNumber);

                var invoice = await _invoiceService.CreateFromOcrResultAsync(
                    ocrResult, 
                    User.Identity?.Name ?? "system",
                    request.FilePath,
                    request.FileName,
                    request.FileType,
                    request.FileSize
                );
                
                _logger.LogInformation("Created invoice {InvoiceNumber} with ID {InvoiceId}", 
                    invoice.InvoiceNumber, invoice.Id);
                
                // Get the fresh invoice from the database to ensure we have all properties
                var savedInvoice = await _invoiceService.GetByIdAsync(invoice.Id);
                if (savedInvoice == null)
                {
                    _logger.LogError("Failed to retrieve saved invoice with ID {InvoiceId}", invoice.Id);
                    return StatusCode(500, new ErrorResponse(
                        "Invoice was saved but could not be retrieved",
                        $"Invoice ID: {invoice.Id}"
                    ));
                }

                _logger.LogInformation("Successfully retrieved saved invoice {InvoiceNumber}", 
                    savedInvoice.InvoiceNumber);
                return Ok(savedInvoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice from OCR result: {Message}", ex.Message);
                return StatusCode(500, new ErrorResponse(
                    "An error occurred while saving the invoice",
                    ex.Message
                ));
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
            try
            {
                var result = await _invoiceService.DeleteAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting invoice {Id}", id);
                return StatusCode(500, new ErrorResponse("An error occurred while deleting the invoice"));
            }
        }

        [HttpPost("cleanup-ocr-remarks")]
        public async Task<ActionResult> CleanupOcrRemarks()
        {
            try
            {
                _logger.LogInformation("Starting OCR remarks cleanup");
                var result = await _invoiceService.CleanupOcrRemarksAsync();
                
                if (result)
                {
                    _logger.LogInformation("Successfully cleaned up OCR remarks");
                    return Ok(new { Message = "OCR remarks cleanup completed successfully" });
                }
                else
                {
                    _logger.LogWarning("OCR remarks cleanup failed");
                    return StatusCode(500, new ErrorResponse("Failed to cleanup OCR remarks"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during OCR remarks cleanup");
                return StatusCode(500, new ErrorResponse("An error occurred during OCR remarks cleanup"));
            }
        }

        // POST: api/invoices/test-line-item-extraction
        [HttpPost("test-line-item-extraction")]
        public IActionResult TestLineItemExtraction([FromBody] string rawText)
        {
            try
            {
                _logger.LogInformation("Testing line item extraction with text length: {Length}", rawText?.Length ?? 0);
                
                // Check if rawText is null or empty
                if (string.IsNullOrEmpty(rawText))
                {
                    return BadRequest("Raw text cannot be null or empty");
                }
                
                // Get the line item extractor service
                var lineItemExtractor = HttpContext.RequestServices.GetRequiredService<LineItemExtractionService>();
                
                // Extract line items from the raw text
                var lineItems = lineItemExtractor.ExtractLineItemsFromText(rawText);
                
                var result = new
                {
                    InputTextLength = rawText.Length,
                    InputTextSample = rawText.Length > 200 ? rawText.Substring(0, 200) + "..." : rawText,
                    ExtractedLineItemsCount = lineItems.Count,
                    LineItems = lineItems.Select(li => new
                    {
                        Description = li.Description,
                        Quantity = li.Quantity,
                        UnitPrice = li.UnitPrice,
                        Amount = li.Amount,
                        ConfidenceScore = li.ConfidenceScore
                    }).ToList()
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing line item extraction");
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/invoices/debug-ocr
        [HttpPost("debug-ocr")]
        public async Task<IActionResult> DebugOcr([FromForm] IFormFile file)
        {
            try
            {
                _logger.LogInformation("Debug OCR processing for file: {FileName}", file?.FileName);
                
                if (file == null || file.Length == 0)
                    return BadRequest("No file provided");
                
                // Save the uploaded file temporarily
                var tempFilePath = Path.GetTempFileName();
                using (var stream = new System.IO.FileStream(tempFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                
                try
                {
                    // Get the OCR service
                    var ocrService = HttpContext.RequestServices.GetRequiredService<IOcrService>();
                    
                    // Process the invoice
                    var ocrResult = await ocrService.ProcessInvoiceAsync(tempFilePath);
                    
                    // Get the line item extractor service
                    var lineItemExtractor = HttpContext.RequestServices.GetRequiredService<LineItemExtractionService>();
                    
                    // Extract line items from the raw text
                    var lineItems = lineItemExtractor.ExtractLineItemsFromText(ocrResult.RawText ?? string.Empty);
                    
                    var result = new
                    {
                        FileName = file.FileName,
                        FileSize = file.Length,
                        RawTextLength = ocrResult.RawText?.Length ?? 0,
                        RawTextSample = ocrResult.RawText?.Length > 1000 ? ocrResult.RawText.Substring(0, 1000) + "..." : ocrResult.RawText,
                        RawTextLines = ocrResult.RawText?.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length ?? 0,
                        First20Lines = ocrResult.RawText?.Split('\n', StringSplitOptions.RemoveEmptyEntries).Take(20).Select((line, i) => new { Index = i + 1, Line = line.Trim() }).ToList(),
                        ExtractedLineItemsCount = lineItems.Count,
                        LineItems = lineItems.Select(li => new
                        {
                            Description = li.Description,
                            Quantity = li.Quantity,
                            UnitPrice = li.UnitPrice,
                            Amount = li.Amount,
                            ConfidenceScore = li.ConfidenceScore
                        }).ToList(),
                        OcrResult = new
                        {
                            InvoiceNumber = ocrResult.InvoiceNumber,
                            VendorName = ocrResult.VendorName,
                            TotalAmount = ocrResult.TotalAmount,
                            Currency = ocrResult.Currency,
                            LineItemsCount = ocrResult.LineItems?.Count ?? 0
                        }
                    };
                    
                    return Ok(result);
                }
                finally
                {
                    // Clean up the temporary file
                    if (System.IO.File.Exists(tempFilePath))
                    {
                        System.IO.File.Delete(tempFilePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error debugging OCR");
                return BadRequest(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
} 