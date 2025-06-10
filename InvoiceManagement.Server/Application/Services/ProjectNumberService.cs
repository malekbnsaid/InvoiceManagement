using System;
using System.Linq;
using System.Threading.Tasks;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceManagement.Server.Application.Services
{
    public class ProjectNumberService : IProjectNumberService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDepartmentService _departmentService;

        public ProjectNumberService(
            ApplicationDbContext context,
            IDepartmentService departmentService)
        {
            _context = context;
            _departmentService = departmentService;
        }

        public async Task<string> GenerateProjectNumberAsync(int sectionId)
        {
            // Get section abbreviation from the DepartmentHierarchy
            string sectionAbbreviation = await _departmentService.GetSectionAbbreviationAsync(sectionId);
            
            if (string.IsNullOrEmpty(sectionAbbreviation))
            {
                throw new Exception($"Section with ID {sectionId} not found or has no abbreviation.");
            }
            
            // Get current month and year
            var currentDate = DateTime.UtcNow;
            int month = currentDate.Month;
            int year = currentDate.Year;
            
            // Count existing projects in this section for this month/year to determine sequence number
            int count = await _context.Projects
                .Where(p => p.SectionId == sectionId && 
                           p.CreatedAt.Month == month && 
                           p.CreatedAt.Year == year)
                .CountAsync();
            
            // Format: SECTION-ABBR/MONTH/YEAR/SEQUENCE
            string projectNumber = $"{sectionAbbreviation}/{month}/{year}/{count + 1}";
            
            return projectNumber;
        }
    }
} 