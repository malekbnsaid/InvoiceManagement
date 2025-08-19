using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IVendorService
    {
        Task<IEnumerable<Vendor>> GetAllVendorsAsync();
        Task<Vendor?> GetVendorByIdAsync(int id);
        Task<Vendor> CreateVendorAsync(Vendor vendor);
        Task<Vendor?> UpdateVendorAsync(Vendor vendor);
        Task<bool> DeleteVendorAsync(int id);
        Task<IEnumerable<Vendor>> GetVendorsByCategoryAsync(string category);
        Task<Vendor?> GetVendorByTaxIdAsync(string taxId);
    }
} 