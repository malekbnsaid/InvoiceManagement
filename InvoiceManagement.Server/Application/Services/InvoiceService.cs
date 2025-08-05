using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InvoiceManagement.Server.Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IRepository<Invoice> _invoiceRepository;
        private readonly ILogger<InvoiceService> _logger;

        public InvoiceService(
            IRepository<Invoice> invoiceRepository,
            ILogger<InvoiceService> logger)
        {
            _invoiceRepository = invoiceRepository;
            _logger = logger;
        }

        public async Task<Invoice> CreateFromOcrResultAsync(OcrResult ocrResult, string createdBy)
        {
            try
            {
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
                    Status = Domain.Enums.InvoiceStatus.Pending,
                    ProcessedDate = DateTime.UtcNow,
                    ProcessedBy = createdBy,
                    ReceiveDate = DateTime.UtcNow,

                    // Audit Information
                    CreatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow,
                    
                    // Document Information
                    Remark = $"OCR Confidence: {ocrResult.ConfidenceScore}. Raw Text: {ocrResult.RawText}"
                };

                await _invoiceRepository.AddAsync(invoice);
                await _invoiceRepository.SaveChangesAsync(); // Add this line to save changes
                
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

        public async Task<Invoice> GetByIdAsync(int id)
        {
            return await _invoiceRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Invoice>> GetAllAsync()
        {
            return await _invoiceRepository.GetAllAsync();
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
            existingInvoice.Subject = invoice.Subject;
            existingInvoice.Status = invoice.Status;
            existingInvoice.ModifiedAt = DateTime.UtcNow;

            await _invoiceRepository.UpdateAsync(existingInvoice);
            return existingInvoice;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(id);
            if (invoice == null)
                return false;

            await _invoiceRepository.DeleteAsync(id);
            return true;
        }
    }
} 