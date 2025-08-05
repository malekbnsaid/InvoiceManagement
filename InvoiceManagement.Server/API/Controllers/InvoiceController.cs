using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.DTOs;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly IOcrService _ocrService;
        private readonly ILogger<InvoiceController> _logger;
        private readonly string _uploadDirectory;

        public InvoiceController(
            IOcrService ocrService,
            ILogger<InvoiceController> logger,
            IConfiguration configuration)
        {
            _ocrService = ocrService;
            _logger = logger;
            _uploadDirectory = configuration["FileStorage:UploadDirectory"] ?? "Uploads";
            
            // Ensure upload directory exists
            if (!Directory.Exists(_uploadDirectory))
            {
                Directory.CreateDirectory(_uploadDirectory);
            }
        }

        [HttpPost("upload")]
        public async Task<ActionResult<OcrResult>> UploadAndProcessInvoice(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Validate file type
                var allowedTypes = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedTypes.Contains(fileExtension))
                {
                    return BadRequest("Invalid file type. Only PDF and image files are allowed.");
                }

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(_uploadDirectory, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Validate invoice format
                var isValidFormat = await _ocrService.ValidateInvoiceFormatAsync(filePath);
                if (!isValidFormat)
                {
                    System.IO.File.Delete(filePath);
                    return BadRequest("Invalid invoice format");
                }

                // Process with OCR
                var result = await _ocrService.ProcessInvoiceAsync(filePath);
                if (!result.IsProcessed)
                {
                    System.IO.File.Delete(filePath);
                    return BadRequest(result.ErrorMessage);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing invoice");
                return StatusCode(500, "An error occurred while processing the invoice");
            }
        }

        [HttpGet("confidence/{fileName}")]
        public async Task<ActionResult<double>> GetConfidenceScore(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_uploadDirectory, fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("File not found");
                }

                var score = await _ocrService.GetConfidenceScoreAsync(filePath);
                return Ok(score);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting confidence score");
                return StatusCode(500, "An error occurred while getting the confidence score");
            }
        }
    }
} 