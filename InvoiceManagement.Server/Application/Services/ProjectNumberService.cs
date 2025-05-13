using System;
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

        public ProjectNumberService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateProjectNumberAsync(int sectionId, int unitId)
        {
            // Get the section information to retrieve the abbreviation
            var section = await _context.Sections
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                throw new ArgumentException("Section not found");

            if (string.IsNullOrEmpty(section.Abbreviation))
                throw new ArgumentException("Section abbreviation is not set");

            // Get current date for month and year
            var currentDate = DateTime.UtcNow;
            var month = currentDate.Month.ToString(); // No leading zero
            var year = currentDate.Year.ToString();

            // Format: ABBR/MM/YYYY
            var projectNumber = $"{section.Abbreviation}/{month}/{year}";

            return projectNumber;
        }
    }
} 