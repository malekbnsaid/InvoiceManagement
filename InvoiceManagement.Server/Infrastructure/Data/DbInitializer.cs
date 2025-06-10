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
                
                // Seed department data
                await SeedDepartmentNodesAsync(context);
                
                // Seed employee data
                await SeedEmployeesAsync(context);
                
                logger.LogInformation("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while initializing the database");
                throw;
            }
        }

        private static async Task SeedEmployeesAsync(ApplicationDbContext context)
        {
            if (!await context.ERPEmployees.AnyAsync())
            {
                var employees = new[]
                {
                    new ERPEmployee
                    {
                        EmployeeNumber = "EMP001",
                        EmployeeName = "John Doe",
                        Email = "john.doe@company.com",
                        Department = "Information Technology Department",
                        DepartmentID = 1574,
                        JobTitle = "IT Manager",
                        CreatedBy = "System",
                        CreatedAt = DateTime.UtcNow,
                        Rec_DateTime = DateTime.UtcNow,
                        Rec_IsActive = true
                    },
                    new ERPEmployee
                    {
                        EmployeeNumber = "EMP002",
                        EmployeeName = "Jane Smith",
                        Email = "jane.smith@company.com",
                        Department = "IT Management Department",
                        DepartmentID = 1575,
                        JobTitle = "Project Manager",
                        CreatedBy = "System",
                        CreatedAt = DateTime.UtcNow,
                        Rec_DateTime = DateTime.UtcNow,
                        Rec_IsActive = true
                    },
                    new ERPEmployee
                    {
                        EmployeeNumber = "EMP003",
                        EmployeeName = "Bob Wilson",
                        Email = "bob.wilson@company.com",
                        Department = "Infrastructure & Systems Section",
                        DepartmentID = 1649,
                        JobTitle = "Systems Engineer",
                        CreatedBy = "System",
                        CreatedAt = DateTime.UtcNow,
                        Rec_DateTime = DateTime.UtcNow,
                        Rec_IsActive = true
                    }
                };

                context.ERPEmployees.AddRange(employees);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedDepartmentNodesAsync(ApplicationDbContext context)
        {
            if (!await context.Departments.AnyAsync())
            {
                // Create IT Department (top level)
                var itDepartment = new DepartmentNode
                {
                    DepartmentNumber = 1574,
                    DepartmentNameEnglish = "Information Technology Department",
                    DepartmentNameArabic = "تقنية المعلومات"
                };
                context.Departments.Add(itDepartment);
                await context.SaveChangesAsync();

                // Create IT Management Department
                var itManagement = new DepartmentNode
                {
                    DepartmentNumber = 1575,
                    DepartmentNameEnglish = "IT Management Department",
                    DepartmentNameArabic = "إدارة نظم المعلومات",
                    ParentId = 1574
                };
                context.Departments.Add(itManagement);
                await context.SaveChangesAsync();

                // Create Sections
                var sections = new[]
                {
                    new DepartmentNode
                    {
                        DepartmentNumber = 1649,
                        DepartmentNameEnglish = "Infrastructure & Systems Section",
                        DepartmentNameArabic = "قسم البنية التحتية لنظم المعلومات",
                        ParentId = 1575,
                        SectionAbbreviation = "ISS"
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1650,
                        DepartmentNameEnglish = "Technical Support Section",
                        DepartmentNameArabic = "قسم الدعم الفني",
                        ParentId = 1575,
                        SectionAbbreviation = "TSS"
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1651,
                        DepartmentNameEnglish = "Application Section",
                        DepartmentNameArabic = "قسم النظم التطبيقية",
                        ParentId = 1575,
                        SectionAbbreviation = "APP"
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1652,
                        DepartmentNameEnglish = "Information Security Office",
                        DepartmentNameArabic = "قسم امن المعلومات",
                        ParentId = 1575,
                        SectionAbbreviation = "ISO"
                    }
                };
                context.Departments.AddRange(sections);
                await context.SaveChangesAsync();

                // Create Units
                var units = new[]
                {
                    // ISS Units
                    new DepartmentNode
                    {
                        DepartmentNumber = 1643,
                        DepartmentNameEnglish = "Systems Management Unit",
                        DepartmentNameArabic = "وحدة إدارة الأنظمة",
                        ParentId = 1649
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1644,
                        DepartmentNameEnglish = "Database Management Unit",
                        DepartmentNameArabic = "وحدة إدارة قواعد البيانات",
                        ParentId = 1649
                    },

                    // TSS Units
                    new DepartmentNode
                    {
                        DepartmentNumber = 1645,
                        DepartmentNameEnglish = "Networking Unit",
                        DepartmentNameArabic = "وحدة الشبكات",
                        ParentId = 1650
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1646,
                        DepartmentNameEnglish = "Users Support Unit",
                        DepartmentNameArabic = "وحدة دعم المستخدمين",
                        ParentId = 1650
                    },

                    // APP Units
                    new DepartmentNode
                    {
                        DepartmentNumber = 1647,
                        DepartmentNameEnglish = "Administrative Applications Unit",
                        DepartmentNameArabic = "وحدة التطبيقات الإدارية",
                        ParentId = 1651
                    },
                    new DepartmentNode
                    {
                        DepartmentNumber = 1648,
                        DepartmentNameEnglish = "Web Development Unit",
                        DepartmentNameArabic = "وحدة تطوير الويب",
                        ParentId = 1651
                    }
                };
                context.Departments.AddRange(units);
                await context.SaveChangesAsync();
            }
        }
    }
} 