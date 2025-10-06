// Temporarily disabled PowerBIDataExportService to fix build issues
/*
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Infrastructure.Data;
using InvoiceManagement.Server.Domain.Enums;
using System.Text.Json;

namespace InvoiceManagement.Server.Application.Services
{
    public class PowerBIDataExportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PowerBIDataExportService> _logger;

        public PowerBIDataExportService(ApplicationDbContext context, ILogger<PowerBIDataExportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetInvoiceAnalyticsDataAsync()
        {
            try
            {
                var invoices = await _context.Invoices
                    .Include(i => i.Project)
                    .ThenInclude(p => p.Section)
                    .ToListAsync();

                var projects = await _context.Projects
                    .Include(p => p.Section)
                    .ToListAsync();

                var analyticsData = new
                {
                    Invoices = invoices.Select(i => new
                    {
                        Id = i.Id,
                        InvoiceNumber = i.InvoiceNumber,
                        VendorName = i.VendorName,
                        InvoiceDate = i.InvoiceDate,
                        DueDate = i.DueDate,
                        InvoiceValue = i.InvoiceValue,
                        Currency = i.Currency.ToString(),
                        Status = i.Status.ToString(),
                        StatusValue = (int)i.Status,
                        ProjectReference = i.ProjectReference,
                        ProjectName = i.Project?.Name,
                        ProjectNumber = i.Project?.ProjectNumber,
                        SectionName = i.Project?.Section?.DepartmentNameEnglish,
                        DepartmentName = i.Project?.Section?.Parent?.DepartmentNameEnglish,
                        CreatedAt = i.CreatedAt,
                        ModifiedAt = i.ModifiedAt,
                        ProcessedBy = i.ProcessedBy,
                        ProcessedDate = i.ProcessedDate,
                        PaymentDate = i.PaymentDate,
                        PaidAmount = i.PaidAmount,
                        VendorTaxNumber = i.VendorTaxNumber,
                        Subject = i.Subject
                    }).ToList(),
                    Projects = projects.Select(p => new
                    {
                        Id = p.Id,
                        Name = p.Name,
                        ProjectNumber = p.ProjectNumber,
                        Budget = p.Budget,
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        Status = p.Status.ToString(),
                        SectionName = p.Section?.DepartmentNameEnglish,
                        DepartmentName = p.Section?.Parent?.DepartmentNameEnglish,
                        CreatedAt = p.CreatedAt,
                        ModifiedAt = p.ModifiedAt,
                        IsApproved = p.IsApproved,
                        ApprovalDate = p.ApprovalDate,
                        ApprovedBy = p.ApprovedBy
                    }).ToList(),
                    Summary = new
                    {
                        TotalInvoices = invoices.Count,
                        TotalInvoiceValue = invoices.Sum(i => i.InvoiceValue),
                        CompletedInvoices = invoices.Count(i => i.Status == InvoiceStatus.Completed),
                        CompletedValue = invoices.Where(i => i.Status == InvoiceStatus.Completed).Sum(i => i.InvoiceValue),
                        PendingInvoices = invoices.Count(i => i.Status == InvoiceStatus.Submitted || i.Status == InvoiceStatus.UnderReview),
                        ApprovedInvoices = invoices.Count(i => i.Status == InvoiceStatus.Approved),
                        RejectedInvoices = invoices.Count(i => i.Status == InvoiceStatus.Rejected),
                        TotalProjects = projects.Count,
                        ApprovedProjects = projects.Count(p => p.IsApproved),
                        PendingProjects = projects.Count(p => !p.IsApproved),
                        TotalBudget = projects.Sum(p => p.Budget ?? 0),
                        UsedBudget = invoices.Where(i => i.Status == InvoiceStatus.Completed).Sum(i => i.InvoiceValue)
                    }
                };

                _logger.LogInformation("Successfully exported analytics data for Power BI");
                return analyticsData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting analytics data for Power BI");
                throw;
            }
        }

        public async Task<object> GetDepartmentBreakdownDataAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Section)
                    .ThenInclude(s => s.Parent)
                    .ToListAsync();

                var invoices = await _context.Invoices
                    .Where(i => i.Status == InvoiceStatus.Completed)
                    .ToListAsync();

                var departmentData = projects
                    .GroupBy(p => p.Section?.Parent?.DepartmentNameEnglish ?? "General")
                    .Select(g => new
                    {
                        DepartmentName = g.Key,
                        ProjectCount = g.Count(),
                        TotalBudget = g.Sum(p => p.Budget ?? 0),
                        UsedBudget = invoices
                            .Where(i => !string.IsNullOrEmpty(i.ProjectReference) && 
                                      g.Any(p => p.ProjectNumber == i.ProjectReference))
                            .Sum(i => i.InvoiceValue),
                        RemainingBudget = g.Sum(p => p.Budget ?? 0) - 
                                        invoices.Where(i => !string.IsNullOrEmpty(i.ProjectReference) && 
                                                           g.Any(p => p.ProjectNumber == i.ProjectReference))
                                                .Sum(i => i.InvoiceValue),
                        BudgetUtilization = g.Sum(p => p.Budget ?? 0) > 0 ? 
                                          (invoices.Where(i => !string.IsNullOrEmpty(i.ProjectReference) && 
                                                             g.Any(p => p.ProjectNumber == i.ProjectReference))
                                                   .Sum(i => i.InvoiceValue) / g.Sum(p => p.Budget ?? 0)) * 100 : 0
                    })
                    .OrderByDescending(d => d.TotalBudget)
                    .ToList();

                _logger.LogInformation("Successfully exported department breakdown data for Power BI");
                return departmentData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting department breakdown data for Power BI");
                throw;
            }
        }

        public async Task<object> GetMonthlyTrendsDataAsync(int months = 12)
        {
            try
            {
                var startDate = DateTime.Now.AddMonths(-months);
                
                var monthlyData = await _context.Invoices
                    .Where(i => i.CreatedAt >= startDate)
                    .GroupBy(i => new { 
                        Year = i.CreatedAt.Year, 
                        Month = i.CreatedAt.Month 
                    })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                        TotalInvoices = g.Count(),
                        TotalValue = g.Sum(i => i.InvoiceValue),
                        CompletedInvoices = g.Count(i => i.Status == InvoiceStatus.Completed),
                        CompletedValue = g.Where(i => i.Status == InvoiceStatus.Completed).Sum(i => i.InvoiceValue),
                        ApprovedInvoices = g.Count(i => i.Status == InvoiceStatus.Approved),
                        RejectedInvoices = g.Count(i => i.Status == InvoiceStatus.Rejected),
                        AverageInvoiceValue = g.Average(i => i.InvoiceValue)
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                _logger.LogInformation("Successfully exported monthly trends data for Power BI");
                return monthlyData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting monthly trends data for Power BI");
                throw;
            }
        }

        public async Task<object> GetVendorAnalyticsDataAsync()
        {
            try
            {
                var vendorData = await _context.Invoices
                    .GroupBy(i => i.VendorName)
                    .Select(g => new
                    {
                        VendorName = g.Key,
                        TotalInvoices = g.Count(),
                        TotalValue = g.Sum(i => i.InvoiceValue),
                        AverageInvoiceValue = g.Average(i => i.InvoiceValue),
                        CompletedInvoices = g.Count(i => i.Status == InvoiceStatus.Completed),
                        CompletedValue = g.Where(i => i.Status == InvoiceStatus.Completed).Sum(i => i.InvoiceValue),
                        PendingInvoices = g.Count(i => i.Status == InvoiceStatus.Submitted || i.Status == InvoiceStatus.UnderReview),
                        RejectedInvoices = g.Count(i => i.Status == InvoiceStatus.Rejected),
                        LastInvoiceDate = g.Max(i => i.InvoiceDate),
                        CurrencyBreakdown = g.GroupBy(i => i.Currency.ToString())
                            .Select(cg => new
                            {
                                Currency = cg.Key,
                                Count = cg.Count(),
                                TotalValue = cg.Sum(i => i.InvoiceValue)
                            }).ToList()
                    })
                    .OrderByDescending(v => v.TotalValue)
                    .ToListAsync();

                _logger.LogInformation("Successfully exported vendor analytics data for Power BI");
                return vendorData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting vendor analytics data for Power BI");
                throw;
            }
        }
    }
}
*/
