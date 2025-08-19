using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Interfaces;
using InvoiceManagement.Server.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace InvoiceManagement.Server.Application.Services
{
    public class VendorService : IVendorService
    {
        private readonly IRepository<Vendor> _vendorRepository;

        public VendorService(IRepository<Vendor> vendorRepository)
        {
            _vendorRepository = vendorRepository;
        }

        public async Task<IEnumerable<Vendor>> GetAllVendorsAsync()
        {
            return await _vendorRepository.GetAllAsync();
        }

        public async Task<Vendor?> GetVendorByIdAsync(int id)
        {
            return await _vendorRepository.GetByIdAsync(id);
        }

        public async Task<Vendor> CreateVendorAsync(Vendor vendor)
        {
            await _vendorRepository.AddAsync(vendor);
            await _vendorRepository.SaveChangesAsync();
            return vendor;
        }

        public async Task<Vendor?> UpdateVendorAsync(Vendor vendor)
        {
            await _vendorRepository.UpdateAsync(vendor);
            await _vendorRepository.SaveChangesAsync();
            return vendor;
        }

        public async Task<bool> DeleteVendorAsync(int id)
        {
            await _vendorRepository.DeleteAsync(id);
            await _vendorRepository.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Vendor>> GetVendorsByCategoryAsync(string category)
        {
            var vendors = await _vendorRepository.GetAllAsync();
            return vendors.Where(v => v.Category == category);
        }

        public async Task<Vendor?> GetVendorByTaxIdAsync(string taxId)
        {
            var vendors = await _vendorRepository.GetAllAsync();
            return vendors.FirstOrDefault(v => v.TaxId == taxId);
        }
    }
} 