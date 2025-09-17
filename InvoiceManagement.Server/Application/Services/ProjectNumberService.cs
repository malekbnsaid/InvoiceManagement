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

        public async Task<string> GenerateProjectNumberAsync(int sectionId, DateTime? projectStartDate = null)
        {
            // Get section abbreviation from the DepartmentHierarchy
            string? sectionAbbreviation = await _departmentService.GetSectionAbbreviationAsync(sectionId);
            
            if (string.IsNullOrEmpty(sectionAbbreviation))
            {
                throw new Exception($"Section with ID {sectionId} not found or has no abbreviation.");
            }
            
            // Use project start date if provided, otherwise use current date
            var referenceDate = projectStartDate ?? DateTime.UtcNow;
            int year = referenceDate.Year;
            
            // Debug logging
            Console.WriteLine($"ProjectNumberService: sectionId={sectionId}, projectStartDate={projectStartDate}, referenceDate={referenceDate}, year={year}");
            
            // Count existing projects in this section for this year to determine serial number
            // We count all projects for this section in this year (regardless of month)
            int count = await _context.Projects
                .Where(p => p.SectionId == sectionId && 
                           p.ExpectedStart.HasValue &&
                           p.ExpectedStart.Value.Year == year)
                .CountAsync();
            
            // Format: SECTION-ABBR/SERIAL/YEAR
            string projectNumber = $"{sectionAbbreviation}/{count + 1}/{year}";
            
            Console.WriteLine($"ProjectNumberService: Generated project number: {projectNumber}");
            
            return projectNumber;
        }
    }
} 