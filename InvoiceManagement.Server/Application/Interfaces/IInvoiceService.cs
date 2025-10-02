using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<Invoice> CreateFromOcrResultAsync(OcrResult ocrResult, string createdBy, string? filePath = null, string? fileName = null, string? fileType = null, long? fileSize = null, string? projectReference = null);
        Task<Invoice?> GetByIdAsync(int id);
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<Invoice> UpdateAsync(int id, Invoice invoice);
        Task<Invoice> UpdateInvoiceDirectly(Invoice invoice);
        Task<bool> DeleteAsync(int id);
        Task<bool> CleanupOcrRemarksAsync();
        
        // Comments functionality
        Task<IEnumerable<InvoiceComment>> GetInvoiceCommentsAsync(int invoiceId);
        Task<InvoiceComment> AddInvoiceCommentAsync(InvoiceComment comment);
        Task<InvoiceComment?> GetInvoiceCommentByIdAsync(int commentId);
        Task<InvoiceComment> UpdateInvoiceCommentAsync(InvoiceComment comment);
        Task<bool> DeleteInvoiceCommentAsync(int commentId);
        
        // Status history functionality
        Task<IEnumerable<StatusHistory>> GetStatusHistoryAsync(int invoiceId);
        Task<StatusHistory> AddStatusHistoryAsync(StatusHistory history);
    }
} 