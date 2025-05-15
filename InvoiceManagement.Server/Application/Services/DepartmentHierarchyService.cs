using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;

namespace InvoiceManagement.Server.Application.Services
{
    public interface IDepartmentHierarchyService
    {
        Task<List<DepartmentHierarchy>> GetAllAsync();
        Task<DepartmentHierarchy> GetByIdAsync(int id);
        Task<List<DepartmentHierarchy>> GetByDepartmentIdAsync(int departmentId);
        Task<List<DepartmentHierarchy>> GetBySectionIdAsync(int sectionId);
        Task<List<DepartmentHierarchy>> GetUnitsBySectionIdAsync(int sectionId);
        Task<string> GetSectionAbbreviationAsync(int sectionId);
        Task<DepartmentHierarchy> CreateAsync(DepartmentHierarchy departmentHierarchy);
        Task<DepartmentHierarchy> UpdateAsync(DepartmentHierarchy departmentHierarchy);
        Task DeleteAsync(int id);
    }

    public class DepartmentHierarchyService : IDepartmentHierarchyService
    {
        private readonly ApplicationDbContext _context;

        public DepartmentHierarchyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DepartmentHierarchy>> GetAllAsync()
        {
            return await _context.DepartmentHierarchies.ToListAsync();
        }

        public async Task<DepartmentHierarchy> GetByIdAsync(int id)
        {
            return await _context.DepartmentHierarchies.FindAsync(id);
        }

        public async Task<List<DepartmentHierarchy>> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.DepartmentHierarchies
                .Where(dh => dh.DepartmentId == departmentId)
                .ToListAsync();
        }

        public async Task<List<DepartmentHierarchy>> GetBySectionIdAsync(int sectionId)
        {
            return await _context.DepartmentHierarchies
                .Where(dh => dh.SectionId == sectionId)
                .ToListAsync();
        }
        
        public async Task<List<DepartmentHierarchy>> GetUnitsBySectionIdAsync(int sectionId)
        {
            return await _context.DepartmentHierarchies
                .Where(dh => dh.SectionId == sectionId)
                .OrderBy(dh => dh.UnitName)
                .ToListAsync();
        }
        
        public async Task<string> GetSectionAbbreviationAsync(int sectionId)
        {
            var section = await _context.DepartmentHierarchies
                .Where(dh => dh.SectionId == sectionId)
                .FirstOrDefaultAsync();
                
            return section?.SectionAbbreviation;
        }

        public async Task<DepartmentHierarchy> CreateAsync(DepartmentHierarchy departmentHierarchy)
        {
            _context.DepartmentHierarchies.Add(departmentHierarchy);
            await _context.SaveChangesAsync();
            return departmentHierarchy;
        }

        public async Task<DepartmentHierarchy> UpdateAsync(DepartmentHierarchy departmentHierarchy)
        {
            _context.Entry(departmentHierarchy).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return departmentHierarchy;
        }

        public async Task DeleteAsync(int id)
        {
            var departmentHierarchy = await _context.DepartmentHierarchies.FindAsync(id);
            if (departmentHierarchy != null)
            {
                _context.DepartmentHierarchies.Remove(departmentHierarchy);
                await _context.SaveChangesAsync();
            }
        }
    }
} 