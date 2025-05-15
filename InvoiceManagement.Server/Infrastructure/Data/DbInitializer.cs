using System;
using System.Linq;
using System.Threading.Tasks;
using InvoiceManagement.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

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
                
                // Seed department hierarchy data
                await SeedDepartmentHierarchyAsync(context);
                
                logger.LogInformation("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while initializing the database");
                throw;
            }
        }

        private static async Task SeedDepartmentHierarchyAsync(ApplicationDbContext context)
        {
            if (!await context.DepartmentHierarchies.AnyAsync())
            {
                var departmentHierarchies = new List<DepartmentHierarchy>
                {
                    // IT Department - Information Security Office (ISO)
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 1,
                        SectionName = "Information Security Office",
                        SectionAbbreviation = "ISO",
                        UnitId = 1,
                        UnitName = "Security Operations"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 1,
                        SectionName = "Information Security Office",
                        SectionAbbreviation = "ISO",
                        UnitId = 2,
                        UnitName = "Governance & Compliance"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 1,
                        SectionName = "Information Security Office",
                        SectionAbbreviation = "ISO",
                        UnitId = 3,
                        UnitName = "Risk Management"
                    },
                    
                    // IT Department - Technical Support Services (TSS)
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 2,
                        SectionName = "Technical Support Services",
                        SectionAbbreviation = "TSS",
                        UnitId = 4,
                        UnitName = "Desktop Support"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 2,
                        SectionName = "Technical Support Services",
                        SectionAbbreviation = "TSS",
                        UnitId = 5,
                        UnitName = "Service Desk"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 2,
                        SectionName = "Technical Support Services",
                        SectionAbbreviation = "TSS",
                        UnitId = 6,
                        UnitName = "Device Management"
                    },
                    
                    // IT Department - Infrastructure & Systems Support (ISS)
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 3,
                        SectionName = "Infrastructure & Systems Support",
                        SectionAbbreviation = "ISS",
                        UnitId = 7,
                        UnitName = "Network Infrastructure"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 3,
                        SectionName = "Infrastructure & Systems Support",
                        SectionAbbreviation = "ISS",
                        UnitId = 8,
                        UnitName = "Server Management"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 3,
                        SectionName = "Infrastructure & Systems Support",
                        SectionAbbreviation = "ISS",
                        UnitId = 9,
                        UnitName = "Cloud Services"
                    },
                    
                    // IT Department - Applications (APP)
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 4,
                        SectionName = "Applications",
                        SectionAbbreviation = "APP",
                        UnitId = 10,
                        UnitName = "Business Applications"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 4,
                        SectionName = "Applications",
                        SectionAbbreviation = "APP",
                        UnitId = 11,
                        UnitName = "Custom Development"
                    },
                    new DepartmentHierarchy
                    {
                        DepartmentId = 1,
                        DepartmentName = "Information Technology",
                        SectionId = 4,
                        SectionName = "Applications",
                        SectionAbbreviation = "APP",
                        UnitId = 12,
                        UnitName = "Application Integration"
                    }
                };

                await context.DepartmentHierarchies.AddRangeAsync(departmentHierarchies);
                await context.SaveChangesAsync();
            }
        }
    }
} 