using System;
using System.Linq;
using System.Threading.Tasks;
using InvoiceManagement.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InvoiceManagement.Server.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

            try
            {
                // Apply pending migrations
                await context.Database.MigrateAsync();
                
                // Seed IT Department data if it doesn't exist
                await SeedItDepartmentAsync(context);
                
                logger.LogInformation("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while initializing the database");
                throw;
            }
        }

        private static async Task SeedItDepartmentAsync(ApplicationDbContext context)
        {
            // Check if we already have data
            if (await context.Departments.AnyAsync())
                return;

            // Create IT Department
            var itDepartment = new Department
            {
                Name = "Information Technology"
            };
            
            context.Departments.Add(itDepartment);
            await context.SaveChangesAsync();

            // Create sections
            var iso = new Section 
            { 
                Name = "Information Security Office", 
                Abbreviation = "ISO",
                DepartmentId = itDepartment.Id
            };
            
            var tss = new Section 
            { 
                Name = "Technical Support Services", 
                Abbreviation = "TSS",
                DepartmentId = itDepartment.Id
            };
            
            var iss = new Section 
            { 
                Name = "Infrastructure & Systems Support", 
                Abbreviation = "ISS",
                DepartmentId = itDepartment.Id
            };
            
            var app = new Section 
            { 
                Name = "Applications", 
                Abbreviation = "APP",
                DepartmentId = itDepartment.Id
            };
            
            context.Sections.AddRange(iso, tss, iss, app);
            await context.SaveChangesAsync();

            // Create units for ISO section
            var isoUnits = new[]
            {
                new Unit { Name = "Security Operations", SectionId = iso.Id },
                new Unit { Name = "Governance & Compliance", SectionId = iso.Id },
                new Unit { Name = "Risk Management", SectionId = iso.Id }
            };
            
            // Create units for TSS section
            var tssUnits = new[]
            {
                new Unit { Name = "Desktop Support", SectionId = tss.Id },
                new Unit { Name = "Service Desk", SectionId = tss.Id },
                new Unit { Name = "Device Management", SectionId = tss.Id }
            };
            
            // Create units for ISS section
            var issUnits = new[]
            {
                new Unit { Name = "Network Infrastructure", SectionId = iss.Id },
                new Unit { Name = "Server Management", SectionId = iss.Id },
                new Unit { Name = "Cloud Services", SectionId = iss.Id }
            };
            
            // Create units for APP section
            var appUnits = new[]
            {
                new Unit { Name = "Business Applications", SectionId = app.Id },
                new Unit { Name = "Custom Development", SectionId = app.Id },
                new Unit { Name = "Application Integration", SectionId = app.Id }
            };
            
            context.Units.AddRange(isoUnits);
            context.Units.AddRange(tssUnits);
            context.Units.AddRange(issUnits);
            context.Units.AddRange(appUnits);
            
            await context.SaveChangesAsync();
        }
    }
} 