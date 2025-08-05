using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<Invoice> CreateFromOcrResultAsync(OcrResult ocrResult, string createdBy);
        Task<Invoice> GetByIdAsync(int id);
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<Invoice> UpdateAsync(int id, Invoice invoice);
        Task<bool> DeleteAsync(int id);
    }
} 