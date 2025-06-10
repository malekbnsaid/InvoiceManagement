using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;

namespace InvoiceManagement.Server.Application.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly ApplicationDbContext _context;

        public DepartmentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DepartmentNode>> GetAllAsync()
        {
            return await _context.Departments
                .Include(d => d.Parent)
                .Include(d => d.Children)
                .ToListAsync();
        }

        public async Task<DepartmentNode?> GetByNumberAsync(int departmentNumber)
        {
            return await _context.Departments
                .Include(d => d.Parent)
                .Include(d => d.Children)
                .FirstOrDefaultAsync(d => d.DepartmentNumber == departmentNumber);
        }

        public async Task<List<DepartmentNode>> GetDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.Children)
                .Where(d => d.ParentId == null || d.ParentId == 1574)
                .ToListAsync();
        }

        public async Task<List<DepartmentNode>> GetSectionsAsync(int departmentNumber)
        {
            return await _context.Departments
                .Include(d => d.Children)
                .Where(d => d.ParentId == 1575)
                .ToListAsync();
        }

        public async Task<List<DepartmentNode>> GetUnitsAsync(int sectionNumber)
        {
            var section = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentNumber == sectionNumber && d.ParentId == 1575);
            
            if (section == null)
                return new List<DepartmentNode>();

            return await _context.Departments
                .Where(d => d.ParentId == sectionNumber)
                .ToListAsync();
        }

        public async Task<string?> GetSectionAbbreviationAsync(int sectionNumber)
        {
            var section = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentNumber == sectionNumber && d.ParentId == 1575);
            return section?.SectionAbbreviation;
        }

        public async Task<DepartmentNode> CreateAsync(DepartmentNode department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<DepartmentNode> UpdateAsync(DepartmentNode department)
        {
            var existing = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentNumber == department.DepartmentNumber);

            if (existing == null)
                throw new KeyNotFoundException($"Department with number {department.DepartmentNumber} not found.");

            _context.Entry(existing).CurrentValues.SetValues(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task DeleteAsync(int departmentNumber)
        {
            var department = await _context.Departments
                .Include(d => d.Children)
                .FirstOrDefaultAsync(d => d.DepartmentNumber == departmentNumber);

            if (department == null)
                return;

            if (department.Children.Any())
                throw new InvalidOperationException("Cannot delete department with children.");

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
        }
    }
} 