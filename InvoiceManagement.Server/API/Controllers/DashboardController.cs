using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Infrastructure.Data;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Services;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardController> _logger;
        private readonly ICurrencyExchangeService _currencyExchangeService;

        public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger, ICurrencyExchangeService currencyExchangeService)
        {
            _context = context;
            _logger = logger;
            _currencyExchangeService = currencyExchangeService;
        }

        [HttpGet("test")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                _logger.LogInformation("Testing database connection...");
                
                var projectCount = await _context.Projects.CountAsync();
                var invoiceCount = await _context.Invoices.CountAsync();
                
                return Ok(new 
                { 
                    message = "Database connection successful",
                    projectCount = projectCount,
                    invoiceCount = invoiceCount,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database connection test failed: {Message}", ex.Message);
                return StatusCode(500, new { error = "Database connection failed", details = ex.Message });
            }
        }

        [HttpGet("simple-projects")]
        public IActionResult GetSimpleProjects()
        {
            try
            {
                _logger.LogInformation("Simple projects endpoint called");
                
                var simpleProjects = new[]
                {
                    new
                    {
                        Id = 1,
                        Name = "Test Project 1",
                        ProjectNumber = "PRJ-001",
                        Section = "General",
                        Department = "General",
                        Status = 2,
                        Budget = 100000,
                        CreatedAt = DateTime.UtcNow.AddDays(-5),
                        ModifiedAt = DateTime.UtcNow.AddDays(-1),
                        CompletionPercentage = 75
                    },
                    new
                    {
                        Id = 2,
                        Name = "Test Project 2", 
                        ProjectNumber = "PRJ-002",
                        Section = "General",
                        Department = "General",
                        Status = 0,
                        Budget = 50000,
                        CreatedAt = DateTime.UtcNow.AddDays(-3),
                        ModifiedAt = DateTime.UtcNow,
                        CompletionPercentage = 25
                    }
                };

                _logger.LogInformation("Returning {Count} simple projects", simpleProjects.Length);
                return Ok(simpleProjects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in simple projects: {Message}", ex.Message);
                return StatusCode(500, new { error = "Simple projects failed", details = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                _logger.LogInformation("Dashboard stats requested");

                // Get basic counts first
                var totalProjects = await _context.Projects.CountAsync();
                var totalInvoices = await _context.Invoices.CountAsync();
                
                _logger.LogInformation($"Found {totalProjects} projects and {totalInvoices} invoices");

                // Get status counts with error handling
                var pendingInvoices = 0;
                var approvedInvoices = 0;
                var completedInvoices = 0;
                
                try
                {
                    pendingInvoices = await _context.Invoices.CountAsync(i => (int)i.Status == 0); // Submitted
                    approvedInvoices = await _context.Invoices.CountAsync(i => (int)i.Status == 2); // Approved
                    completedInvoices = await _context.Invoices.CountAsync(i => (int)i.Status == 5); // Completed (was 4, now 5)
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error counting invoices by status, using 0");
                }

                // Calculate budget with error handling
                var totalBudget = 0m;
                var totalSpent = 0m;
                
                try
                {
                    totalBudget = await _context.Projects.SumAsync(p => p.Budget ?? 0);
                    
                    // Get completed invoices and convert to QAR
                    var completedInvoicesForTotal = await _context.Invoices
                        .Where(i => (int)i.Status == 5) // Only count Completed invoices
                        .ToListAsync();
                    
                    totalSpent = completedInvoicesForTotal
                        .Sum(invoice => _currencyExchangeService.ConvertToQAR(invoice.InvoiceValue, invoice.Currency));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error calculating budget/spending, using 0");
                }

                var budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

                // Get recent activity counts
                var recentProjects = 0;
                var recentInvoices = 0;
                
                try
                {
                    var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                    recentProjects = await _context.Projects.CountAsync(p => p.CreatedAt >= thirtyDaysAgo);
                    recentInvoices = await _context.Invoices.CountAsync(i => i.CreatedAt >= thirtyDaysAgo);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error counting recent activity, using 0");
                }

                var stats = new
                {
                    TotalProjects = totalProjects,
                    TotalInvoices = totalInvoices,
                    PendingInvoices = pendingInvoices,
                    ApprovedInvoices = approvedInvoices,
                    CompletedInvoices = completedInvoices,
                    TotalBudget = totalBudget,
                    TotalSpent = totalSpent,
                    BudgetUtilization = Math.Round(budgetUtilization, 1),
                    RecentProjects = recentProjects,
                    RecentInvoices = recentInvoices,
                    RemainingBudget = totalBudget - totalSpent
                };

                _logger.LogInformation("Dashboard stats calculated successfully");
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard statistics: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("recent-projects")]
        public async Task<IActionResult> GetRecentProjects(int limit = 5)
        {
            try
            {
                _logger.LogInformation("🔍 Recent projects requested with limit: {Limit}", limit);

                // First check if we have any projects at all
                var totalProjects = await _context.Projects.CountAsync();
                _logger.LogInformation("🔍 Total projects in database: {TotalProjects}", totalProjects);

                if (totalProjects == 0)
                {
                    _logger.LogInformation("🔍 No projects found in database, returning empty array");
                    return Ok(new List<object>());
                }

                // Get projects from database with section information
                var projects = await _context.Projects
                    .Include(p => p.Section)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(limit)
                    .Select(p => new
                    {
                        Id = p.Id,
                        Name = p.Name ?? "Unnamed Project",
                        ProjectNumber = p.ProjectNumber ?? "N/A",
                        Section = p.Section != null ? p.Section.DepartmentNameEnglish : "General",
                        Department = p.Section != null && p.Section.Parent != null ? p.Section.Parent.DepartmentNameEnglish : "General",
                        Status = p.IsApproved ? 2 : 0, // 2 = Approved, 0 = Pending
                        Budget = p.Budget ?? 0,
                        CreatedAt = p.CreatedAt,
                        ModifiedAt = p.ModifiedAt,
                        CompletionPercentage = 0 // Simplified for now
                    })
                    .ToListAsync();

                _logger.LogInformation("🔍 Found {Count} recent projects", projects.Count);
                _logger.LogInformation("🔍 Projects data: {Projects}", System.Text.Json.JsonSerializer.Serialize(projects));
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent projects: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("recent-invoices")]
        public async Task<IActionResult> GetRecentInvoices(int limit = 5)
        {
            try
            {
                _logger.LogInformation("Recent invoices requested with limit: {Limit}", limit);

                var invoices = await _context.Invoices
                    .OrderByDescending(i => i.CreatedAt)
                    .Take(limit)
                    .Select(i => new
                    {
                        Id = i.Id,
                        InvoiceNumber = i.InvoiceNumber ?? "N/A",
                        InvoiceDate = i.InvoiceDate,
                        InvoiceValue = i.InvoiceValue,
                        Currency = i.Currency.ToString(),
                        Status = (int)i.Status,
                        ProjectReference = i.ProjectReference ?? "N/A",
                        VendorName = i.VendorName ?? "Unknown Vendor",
                        CreatedAt = i.CreatedAt,
                        Vendor = (object?)null
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {Count} recent invoices", invoices.Count);
                return Ok(invoices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent invoices: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("projects-needing-approval")]
        public async Task<IActionResult> GetProjectsNeedingApproval(int limit = 10)
        {
            try
            {
                _logger.LogInformation("Projects needing approval requested with limit: {Limit}", limit);

                var projects = await _context.Projects
                    .Include(p => p.Section)
                    .Where(p => !p.IsApproved) // Projects that are not approved yet
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(limit)
                    .Select(p => new
                    {
                        Id = p.Id,
                        Name = p.Name ?? "Unnamed Project",
                        ProjectNumber = p.ProjectNumber ?? "N/A",
                        Section = p.Section != null ? p.Section.DepartmentNameEnglish : "General",
                        Department = p.Section != null && p.Section.Parent != null ? p.Section.Parent.DepartmentNameEnglish : "General",
                        Budget = p.Budget ?? 0,
                        CreatedAt = p.CreatedAt,
                        ModifiedAt = p.ModifiedAt,
                        Status = "Pending Approval",
                        ApprovalDate = p.ApprovalDate,
                        ApprovedBy = p.ApprovedBy
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {Count} projects needing approval", projects.Count);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects needing approval: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("department-breakdown")]
        public async Task<IActionResult> GetDepartmentBreakdown()
        {
            try
            {
                _logger.LogInformation("🔍 Department breakdown requested");

                // First check if we have any projects at all
                var totalProjects = await _context.Projects.CountAsync();
                _logger.LogInformation("🔍 Total projects for department breakdown: {TotalProjects}", totalProjects);

                if (totalProjects == 0)
                {
                    _logger.LogInformation("🔍 No projects found for department breakdown, returning empty array");
                    return Ok(new List<object>());
                }

                // Get all projects with their sections
                var projectsWithSections = await _context.Projects
                    .Include(p => p.Section)
                    .ToListAsync();

                // Get all completed invoices with their project references
                var completedInvoices = await _context.Invoices
                    .Where(i => i.Status == Domain.Enums.InvoiceStatus.Completed)
                    .ToListAsync();

                _logger.LogInformation("🔍 Found {CompletedInvoices} completed invoices", completedInvoices.Count);

                // Group projects by section and calculate spent amounts
                var departments = projectsWithSections
                    .GroupBy(p => p.Section != null ? p.Section.DepartmentNameEnglish : "General")
                    .Select(g => {
                        var sectionName = g.Key;
                        var projectNumbers = g.Select(p => p.ProjectNumber).ToList();
                        
                        // Calculate spent amount from completed invoices linked to projects in this section
                        var spentAmount = completedInvoices
                            .Where(invoice => !string.IsNullOrEmpty(invoice.ProjectReference) && 
                                            projectNumbers.Contains(invoice.ProjectReference))
                            .Sum(invoice => _currencyExchangeService.ConvertToQAR(invoice.InvoiceValue, invoice.Currency));

                        _logger.LogInformation("🔍 Section {Section}: {ProjectCount} projects, {SpentAmount} spent", 
                            sectionName, g.Count(), spentAmount);

                        return new
                        {
                            Section = sectionName,
                            ProjectCount = g.Count(),
                            TotalBudget = g.Sum(p => p.Budget ?? 0),
                            SpentAmount = spentAmount
                        };
                    })
                    .OrderByDescending(d => d.TotalBudget)
                    .ToList();

                _logger.LogInformation("🔍 Found {Count} sections", departments.Count);
                _logger.LogInformation("🔍 Department data: {Departments}", System.Text.Json.JsonSerializer.Serialize(departments));
                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving department breakdown: {Message}", ex.Message);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("status-breakdown")]
        public async Task<IActionResult> GetStatusBreakdown()
        {
            try
            {
                var invoiceStatusBreakdown = await _context.Invoices
                    .GroupBy(i => i.Status)
                    .Select(g => new
                    {
                        Status = g.Key.ToString(), // Convert enum to string
                        StatusValue = (int)g.Key,  // Keep numeric value for reference
                        Count = g.Count(),
                        TotalValue = g.Sum(i => i.InvoiceValue)
                    })
                    .OrderBy(s => s.StatusValue)
                    .ToListAsync();

                var projectStatusBreakdown = await _context.Projects
                    .GroupBy(p => p.IsApproved)
                    .Select(g => new
                    {
                        Status = g.Key ? "Approved" : "Pending",
                        StatusValue = g.Key ? 1 : 0,
                        Count = g.Count()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Invoices = invoiceStatusBreakdown,
                    Projects = projectStatusBreakdown
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving status breakdown");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("monthly-trends")]
        public async Task<IActionResult> GetMonthlyTrends(int months = 12)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddMonths(-months);
                
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
                        InvoiceCount = g.Count(),
                        TotalValue = g.Sum(i => i.InvoiceValue),
                        ApprovedCount = g.Count(i => (int)i.Status == 2),
                        CompletedCount = g.Count(i => (int)i.Status == 5) // Fixed: was 4, now 5
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                return Ok(monthlyData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving monthly trends");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
