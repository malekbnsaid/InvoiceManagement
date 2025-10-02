using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Interfaces;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InvoiceManagement.Server.Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IRepository<Invoice> _invoiceRepository;
        private readonly ILogger<InvoiceService> _logger;
        private readonly ApplicationDbContext _context;

        public InvoiceService(
            IRepository<Invoice> invoiceRepository,
            ILogger<InvoiceService> logger,
            ApplicationDbContext context)
        {
            _invoiceRepository = invoiceRepository;
            _logger = logger;
            _context = context;
        }

        public async Task<Invoice> CreateFromOcrResultAsync(OcrResult ocrResult, string createdBy, string? filePath = null, string? fileName = null, string? fileType = null, long? fileSize = null, string? projectReference = null)
        {
            try
            {
                _logger.LogInformation("Starting invoice creation from OCR result. Invoice Number: {InvoiceNumber}, Line Items Count: {LineItemsCount}, ProjectReference: {ProjectReference}", 
                    ocrResult.InvoiceNumber, ocrResult.LineItems?.Count ?? 0, projectReference);
                
                // Log line items details for debugging
                if (ocrResult.LineItems?.Any() == true)
                {
                    _logger.LogInformation("OCR Result contains {Count} line items:", ocrResult.LineItems.Count);
                    foreach (var item in ocrResult.LineItems)
                    {
                        _logger.LogInformation("Line Item: Description='{Description}', Qty={Quantity}, Price={Price}, Amount={Amount}", 
                            item.Description, item.Quantity, item.UnitPrice, item.Amount);
                    }
                }
                else
                {
                    _logger.LogWarning("OCR Result contains NO line items!");
                }

                var invoice = new Invoice
                {
                    // Essential Invoice Information
                    InvoiceNumber = ocrResult.InvoiceNumber,
                    InvoiceDate = ocrResult.InvoiceDate ?? DateTime.UtcNow,
                    DueDate = ocrResult.DueDate,
                    InvoiceValue = ocrResult.TotalAmount ?? ocrResult.InvoiceValue ?? 0,
                    Currency = ocrResult.Currency ?? Domain.Enums.CurrencyType.USD,
                    Subject = ocrResult.Description,
                    ReferenceNumber = ocrResult.ReferenceNumber,

                    // Customer Information
                    CustomerName = ocrResult.CustomerName,
                    CustomerNumber = ocrResult.CustomerNumber,
                    BillingAddress = ocrResult.BillingAddress,
                    ShippingAddress = ocrResult.ShippingAddress,

                    // Vendor Information
                    VendorName = ocrResult.VendorName,
                    VendorAddress = ocrResult.VendorAddress,
                    VendorTaxNumber = ocrResult.VendorTaxId,
                    VendorPhone = ocrResult.VendorPhone,
                    VendorEmail = ocrResult.VendorEmail,

                    // Financial Information
                    SubTotal = ocrResult.SubTotal ?? 0,
                    TaxAmount = ocrResult.TaxAmount ?? 0,
                    TaxRate = ocrResult.TaxRate,
                    PurchaseOrderNumber = ocrResult.PurchaseOrderNumber,
                    PaymentTerms = ocrResult.PaymentTerms,

                    // Processing Information
                    Status = Domain.Enums.InvoiceStatus.Submitted,
                    ProcessedDate = DateTime.UtcNow,
                    ProcessedBy = createdBy,
                    ReceiveDate = DateTime.UtcNow,

                    // Document Information
                    FilePath = filePath ?? string.Empty,
                    FileName = fileName ?? string.Empty,
                    FileType = fileType ?? string.Empty,
                    FileSize = fileSize ?? 0,
                    Remark = null, // Leave empty for actual remarks, not OCR data

                    // Project Information
                    ProjectReference = projectReference,

                    // Audit Information
                    CreatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow
                };

                // Add line items
                if (ocrResult.LineItems?.Any() == true)
                {
                    var lineItems = new List<InvoiceLineItem>();
                    
                    foreach (var dto in ocrResult.LineItems)
                    {
                        var lineItem = new InvoiceLineItem
                        {
                            Description = dto.Description ?? string.Empty,
                            Quantity = dto.Quantity,
                            UnitPrice = dto.UnitPrice,
                            Amount = dto.Amount,
                            ItemNumber = dto.ItemNumber,
                            Unit = dto.Unit,
                            TaxAmount = dto.TaxAmount,
                            TaxRate = dto.TaxRate,
                            DiscountAmount = dto.DiscountAmount,
                            DiscountRate = dto.DiscountRate,
                            ConfidenceScore = dto.ConfidenceScore,
                            CreatedBy = createdBy,
                            CreatedAt = DateTime.UtcNow
                        };
                        
                        lineItems.Add(lineItem);
                    }
                    
                // Set the line items on the invoice
                invoice.LineItems = lineItems;
                
                _logger.LogInformation("Invoice created with ProjectReference: '{ProjectReference}'", invoice.ProjectReference);
                    
                    _logger.LogInformation("Added {Count} line items to invoice {InvoiceNumber}", 
                        lineItems.Count, invoice.InvoiceNumber);
                }
                else
                {
                    _logger.LogWarning("No line items found in OCR result for invoice {InvoiceNumber}", 
                        invoice.InvoiceNumber);
                }

                // Save the invoice first to get the ID
                await _invoiceRepository.AddAsync(invoice);
                await _invoiceRepository.SaveChangesAsync();
                
                _logger.LogInformation("Invoice saved successfully with ID: {InvoiceId}, Number: {InvoiceNumber}", 
                    invoice.Id, invoice.InvoiceNumber);
                
                // Now save the line items separately to ensure they are treated as new entities
                if (invoice.LineItems?.Any() == true)
                {
                    foreach (var lineItem in invoice.LineItems)
                    {
                        lineItem.InvoiceId = invoice.Id;
                        lineItem.Id = 0; // Ensure EF treats as new entity
                        _context.InvoiceLineItems.Add(lineItem);
                    }
                    
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Saved {Count} line items for invoice {InvoiceNumber}", 
                        invoice.LineItems.Count, invoice.InvoiceNumber);
                }

                // Create document attachment if file information is provided
                if (!string.IsNullOrEmpty(filePath) && !string.IsNullOrEmpty(fileName))
                {
                    var documentAttachment = new DocumentAttachment
                    {
                        FileName = fileName,
                        OriginalFileName = fileName,
                        FilePath = filePath,
                        FileType = fileType ?? Path.GetExtension(fileName),
                        FileSize = fileSize ?? 0,
                        ContentType = GetContentType(fileType ?? Path.GetExtension(fileName)),
                        Description = $"Invoice document for {invoice.InvoiceNumber}",
                        UploadDate = DateTime.UtcNow,
                        UploadedBy = createdBy,
                        InvoiceId = invoice.Id,
                        VersionNumber = 1,
                        IsCurrentVersion = true,
                        ChangeDescription = "Initial upload",
                        CreatedBy = createdBy,
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    // Add to invoice attachments
                    if (invoice.Attachments == null)
                        invoice.Attachments = new List<DocumentAttachment>();
                    
                    invoice.Attachments.Add(documentAttachment);
                    await _invoiceRepository.SaveChangesAsync();
                    
                    _logger.LogInformation("Created document attachment for invoice {InvoiceNumber}", invoice.InvoiceNumber);
                }
                
                _logger.LogInformation("Created invoice {InvoiceNumber} from OCR result with confidence {Confidence}", 
                    invoice.InvoiceNumber, ocrResult.ConfidenceScore);
                
                return invoice;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice from OCR result");
                throw;
            }
        }

        private string GetContentType(string fileExtension)
        {
            return fileExtension?.ToLowerInvariant() switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".tiff" or ".tif" => "image/tiff",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }

        public async Task<Invoice?> GetByIdAsync(int id)
        {
            return await _context.Invoices
                .Include(i => i.LineItems)
                .Include(i => i.Vendor)
                .Include(i => i.Project)
                .Include(i => i.LPO)
                .Include(i => i.StatusHistories)
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<IEnumerable<Invoice>> GetAllAsync()
        {
            var invoices = await _context.Invoices
                .Include(i => i.LineItems)
                .Include(i => i.Vendor)
                .Include(i => i.Project)
                .Include(i => i.LPO)
                .Include(i => i.StatusHistories)
                .Include(i => i.Attachments)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
                
            _logger.LogInformation("Retrieved {Count} invoices from database", invoices.Count);
            foreach (var invoice in invoices.Take(5)) // Log first 5 invoices
            {
                _logger.LogInformation("Invoice: ID={Id}, Number={Number}, Vendor={Vendor}, Date={Date}, Value={Value}", 
                    invoice.Id, invoice.InvoiceNumber, invoice.VendorName, invoice.InvoiceDate, invoice.InvoiceValue);
            }
            
            return invoices;
        }

        public async Task<Invoice> UpdateAsync(int id, Invoice invoice)
        {
            var existingInvoice = await _invoiceRepository.GetByIdAsync(id);
            if (existingInvoice == null)
                throw new KeyNotFoundException($"Invoice with ID {id} not found");

            // Update properties
            existingInvoice.InvoiceNumber = invoice.InvoiceNumber;
            existingInvoice.InvoiceDate = invoice.InvoiceDate;
            existingInvoice.DueDate = invoice.DueDate;
            existingInvoice.InvoiceValue = invoice.InvoiceValue;
            existingInvoice.Currency = invoice.Currency;
            existingInvoice.VendorName = invoice.VendorName;
            existingInvoice.VendorTaxNumber = invoice.VendorTaxNumber;
            existingInvoice.Subject = invoice.Subject;
            existingInvoice.Status = invoice.Status;
            existingInvoice.ModifiedAt = DateTime.UtcNow;

            await _invoiceRepository.UpdateAsync(existingInvoice);
            await _invoiceRepository.SaveChangesAsync();
            return existingInvoice;
        }

        public async Task<Invoice> UpdateInvoiceDirectly(Invoice invoice)
        {
            _logger.LogInformation("UpdateInvoiceDirectly: Starting update for invoice ID {Id}, Number: {Number}", invoice.Id, invoice.InvoiceNumber);
            
            // Ensure the entity is tracked by the context
            _context.Entry(invoice).State = EntityState.Modified;
            
            _logger.LogInformation("UpdateInvoiceDirectly: Entity state set to Modified, calling SaveChangesAsync");
            var result = await _context.SaveChangesAsync();
            
            _logger.LogInformation("UpdateInvoiceDirectly: SaveChangesAsync completed, {Count} entities updated", result);
            return invoice;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(id);
            if (invoice == null)
                return false;

            await _invoiceRepository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> CleanupOcrRemarksAsync()
        {
            try
            {
                var allInvoices = await _invoiceRepository.GetAllAsync();
                var updatedCount = 0;

                foreach (var invoice in allInvoices)
                {
                    // Check if the remark contains OCR data (confidence score and raw text)
                    if (!string.IsNullOrEmpty(invoice.Remark) && 
                        (invoice.Remark.Contains("OCR Confidence:") || 
                         invoice.Remark.Contains("Raw Text:")))
                    {
                        invoice.Remark = null; // Clear the OCR data
                        await _invoiceRepository.UpdateAsync(invoice);
                        updatedCount++;
                    }
                }

                if (updatedCount > 0)
                {
                    await _invoiceRepository.SaveChangesAsync();
                    _logger.LogInformation("Cleaned up OCR data from remarks for {Count} invoices", updatedCount);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up OCR remarks");
                return false;
            }
        }

        // Comments functionality
        public async Task<IEnumerable<InvoiceComment>> GetInvoiceCommentsAsync(int invoiceId)
        {
            try
            {
                return await _context.InvoiceComments
                    .Where(c => c.InvoiceId == invoiceId)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching comments for invoice {InvoiceId}", invoiceId);
                throw;
            }
        }

        public async Task<InvoiceComment> AddInvoiceCommentAsync(InvoiceComment comment)
        {
            try
            {
                _context.InvoiceComments.Add(comment);
                await _context.SaveChangesAsync();
                return comment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment for invoice {InvoiceId}", comment.InvoiceId);
                throw;
            }
        }

        public async Task<InvoiceComment?> GetInvoiceCommentByIdAsync(int commentId)
        {
            try
            {
                return await _context.InvoiceComments
                    .FirstOrDefaultAsync(c => c.Id == commentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching comment {CommentId}", commentId);
                throw;
            }
        }

        public async Task<InvoiceComment> UpdateInvoiceCommentAsync(InvoiceComment comment)
        {
            try
            {
                _context.InvoiceComments.Update(comment);
                await _context.SaveChangesAsync();
                return comment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment {CommentId}", comment.Id);
                throw;
            }
        }

        public async Task<bool> DeleteInvoiceCommentAsync(int commentId)
        {
            try
            {
                var comment = await _context.InvoiceComments.FindAsync(commentId);
                if (comment == null)
                    return false;

                _context.InvoiceComments.Remove(comment);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
                throw;
            }
        }

        // Status history functionality
        public async Task<IEnumerable<StatusHistory>> GetStatusHistoryAsync(int invoiceId)
        {
            try
            {
                return await _context.StatusHistories
                    .Where(s => s.InvoiceId == invoiceId)
                    .OrderBy(s => s.ChangeDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching status history for invoice {InvoiceId}", invoiceId);
                throw;
            }
        }

        public async Task<StatusHistory> AddStatusHistoryAsync(StatusHistory history)
        {
            try
            {
                _context.StatusHistories.Add(history);
                await _context.SaveChangesAsync();
                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding status history for invoice {InvoiceId}", history.InvoiceId);
                throw;
            }
        }
    }
} 