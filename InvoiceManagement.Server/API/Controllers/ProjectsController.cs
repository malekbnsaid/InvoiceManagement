using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json;

namespace InvoiceManagement.Server.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ApplicationDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };

        public ProjectsController(IProjectService projectService, ApplicationDbContext context)
        {
            _projectService = projectService;
            _context = context;
        }

        // GET: api/Projects
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }

        // GET: api/Projects/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
                return NotFound();

            return Ok(project);
        }

        // GET: api/Projects/number/{projectNumber}
        [HttpGet("number/{projectNumber}")]
        public async Task<ActionResult<Project>> GetProjectByNumber(string projectNumber)
        {
            var project = await _projectService.GetProjectByNumberAsync(projectNumber);
            if (project == null)
                return NotFound();

            return Ok(project);
        }

        // POST: api/Projects
        [HttpPost]
        [Authorize(Policy = "PMOrHigher")]
        public async Task<ActionResult<Project>> CreateProject([FromBody] Project project)
        {
            try
            {
                // Log incoming data
                var requestBody = JsonSerializer.Serialize(project, _jsonOptions);
                Console.WriteLine($"Received project data: {requestBody}");

                // Log all properties for debugging
                Console.WriteLine($"Project Name: {project.Name}");
                Console.WriteLine($"Section ID: {project.SectionId}");
                Console.WriteLine($"Project Manager ID: {project.ProjectManagerId}");
                Console.WriteLine($"Budget: {project.Budget}");
                Console.WriteLine($"Expected Start: {project.ExpectedStart}");
                Console.WriteLine($"Expected End: {project.ExpectedEnd}");
                Console.WriteLine($"Tender Date: {project.TenderDate}");
                Console.WriteLine($"Project Number: {project.ProjectNumber}");

                // Validate required fields
                var validationErrors = new Dictionary<string, List<string>>();

                // Check if section exists using DepartmentNumber
                Console.WriteLine($"Looking for section with DepartmentNumber={project.SectionId} and ParentId=1575");
                var section = await _context.Departments
                    .Where(d => d.DepartmentNumber == project.SectionId && d.ParentId == 1575)
                    .FirstOrDefaultAsync();
                
                if (section == null)
                {
                    Console.WriteLine($"Section with Department Number {project.SectionId} not found or is not a section");
                    // Let's check if the department exists at all and what its ParentId is
                    var anyDepartment = await _context.Departments
                        .FirstOrDefaultAsync(d => d.DepartmentNumber == project.SectionId);
                    if (anyDepartment != null)
                    {
                        Console.WriteLine($"Found department but with ParentId={anyDepartment.ParentId}, expected 1575");
                    }
                    validationErrors.Add("Section", new List<string> { $"Section with ID {project.SectionId} not found or is not a valid section." });
                }
                else
                {
                    Console.WriteLine($"Section found: {section.DepartmentNameEnglish} with ParentId={section.ParentId}");
                    project.Section = section;
                }

                // Check if project manager exists
                var projectManager = await _context.ERPEmployees.FindAsync(project.ProjectManagerId);
                if (projectManager == null)
                {
                    Console.WriteLine($"Project Manager with ID {project.ProjectManagerId} not found");
                    validationErrors.Add("ProjectManager", new List<string> { $"Project Manager with ID {project.ProjectManagerId} not found." });
                }
                else
                {
                    Console.WriteLine($"Project Manager found: {projectManager.EmployeeName}");
                    project.ProjectManager = projectManager;
                }

                if (string.IsNullOrWhiteSpace(project.Name))
                {
                    Console.WriteLine("Validation Error: Name is required");
                    validationErrors.Add("Name", new List<string> { "The Name field is required." });
                }

                // Validate budget with business rules
                if (project.Budget.HasValue)
                {
                    if (project.Budget.Value < 1000)
                    {
                        validationErrors.Add("Budget", new List<string> { "Minimum budget is $1,000. Projects under this amount should be handled as expenses." });
                    }
                    if (project.Budget.Value > 100000000) // $100M
                    {
                        validationErrors.Add("Budget", new List<string> { "Maximum budget is $100,000,000. Please contact administration for larger projects." });
                    }
                }

                // Validate payment plan lines if provided
                if (project.PaymentPlanLines != null && project.PaymentPlanLines.Any())
                {
                    var currentYear = DateTime.Now.Year;
                    var totalPaymentPlan = 0m;
                    
                    for (int i = 0; i < project.PaymentPlanLines.Count; i++)
                    {
                        var line = project.PaymentPlanLines.ElementAt(i);
                        var lineErrors = new List<string>();
                        
                        // Validate year
                        if (line.Year < currentYear)
                        {
                            lineErrors.Add("Cannot create payments for past years");
                        }
                        if (line.Year > currentYear + 10)
                        {
                            lineErrors.Add("Cannot create payments more than 10 years in the future");
                        }
                        
                        // Validate amount
                        if (line.Amount < 100)
                        {
                            lineErrors.Add("Each payment must be at least $100");
                        }
                        if (line.Amount > 5000000)
                        {
                            lineErrors.Add("Individual payments cannot exceed $5,000,000");
                        }
                        
                        if (lineErrors.Any())
                        {
                            validationErrors.Add($"PaymentPlanLines[{i}]", lineErrors);
                        }
                        
                        totalPaymentPlan += line.Amount;
                    }
                    
                    // Check currency consistency
                    var currencies = project.PaymentPlanLines.Select(p => p.Currency).Distinct().ToList();
                    if (currencies.Count > 1)
                    {
                        validationErrors.Add("PaymentPlanLines", new List<string> { "All payment plan lines must use the same currency." });
                    }
                    
                    // Check payment plan vs budget variance (warning, not error)
                    if (project.Budget.HasValue && totalPaymentPlan > 0)
                    {
                        var variance = Math.Abs(totalPaymentPlan - project.Budget.Value) / project.Budget.Value;
                        if (variance > 0.5m) // 50% variance
                        {
                            Console.WriteLine($"Warning: Payment plan variance is {variance:P1} - this may need review");
                        }
                    }

                    // Validate project duration vs payment plan alignment
                    if (project.ExpectedStart.HasValue && project.ExpectedEnd.HasValue)
                    {
                        var projectDuration = project.ExpectedEnd.Value - project.ExpectedStart.Value;
                        var projectMonths = projectDuration.TotalDays / 30.44; // Average days per month
                        var uniquePaymentYears = project.PaymentPlanLines.Select(p => p.Year).Distinct().Count();
                        
                        // Critical: Short projects with multi-year payment plans
                        if (projectMonths < 6 && uniquePaymentYears > 1)
                        {
                            validationErrors.Add("PaymentPlanLines", new List<string> 
                            { 
                                $"Project duration ({Math.Round(projectMonths)} months) is too short for a {uniquePaymentYears}-year payment plan. Short projects should have single-year payments." 
                            });
                        }
                        
                        // Warning: Medium projects with very long payment plans
                        if (projectMonths < 12 && uniquePaymentYears > 2)
                        {
                            Console.WriteLine($"Warning: Project duration ({Math.Round(projectMonths)} months) seems short for a {uniquePaymentYears}-year payment plan");
                        }
                        
                        // Warning: Very long projects with single-year payments
                        if (projectMonths > 24 && uniquePaymentYears == 1)
                        {
                            Console.WriteLine($"Warning: Project duration ({Math.Round(projectMonths / 12)} years) is long but payment plan is only for 1 year");
                        }
                        
                        // Check if payment years align with project timeline
                        var projectStartYear = project.ExpectedStart.Value.Year;
                        var projectEndYear = project.ExpectedEnd.Value.Year;
                        var paymentYearsOutsideProject = project.PaymentPlanLines
                            .Where(p => p.Year < projectStartYear || p.Year > projectEndYear)
                            .Select(p => p.Year)
                            .Distinct()
                            .ToList();
                            
                        if (paymentYearsOutsideProject.Any())
                        {
                            validationErrors.Add("PaymentPlanLines", new List<string> 
                            { 
                                $"Payment plan includes years ({string.Join(", ", paymentYearsOutsideProject)}) outside project timeline ({projectStartYear}-{projectEndYear})." 
                            });
                        }
                    }
                }

                // Validate date fields with business rules
                if (project.ExpectedStart.HasValue && project.ExpectedEnd.HasValue)
                {
                    if (project.ExpectedEnd.Value < project.ExpectedStart.Value)
                    {
                        Console.WriteLine("Validation Error: Expected end date is before start date");
                        validationErrors.Add("ExpectedEnd", new List<string> { "Expected end date must be after expected start date." });
                    }
                    else
                    {
                        // Check project duration (1 day to 10 years)
                        var duration = project.ExpectedEnd.Value - project.ExpectedStart.Value;
                        if (duration.TotalDays < 1)
                        {
                            validationErrors.Add("ExpectedEnd", new List<string> { "Project duration must be at least 1 day." });
                        }
                        if (duration.TotalDays > 3650) // 10 years
                        {
                            validationErrors.Add("ExpectedEnd", new List<string> { "Project duration cannot exceed 10 years. Please break into smaller projects." });
                        }
                    }
                }

                // Validate start date is not in the past
                if (project.ExpectedStart.HasValue && project.ExpectedStart.Value < DateTime.Today)
                {
                    validationErrors.Add("ExpectedStart", new List<string> { "Project start date cannot be in the past." });
                }

                // Validate end date is not in the past
                if (project.ExpectedEnd.HasValue && project.ExpectedEnd.Value < DateTime.Today)
                {
                    validationErrors.Add("ExpectedEnd", new List<string> { "Project end date cannot be in the past." });
                }

                // Validate tender date is before start date
                if (project.TenderDate.HasValue && project.ExpectedStart.HasValue)
                {
                    if (project.TenderDate.Value >= project.ExpectedStart.Value)
                    {
                        validationErrors.Add("TenderDate", new List<string> { "Tender date must be before project start date." });
                    }
                }

                // Note: Tender date validation removed - now handled as warning only
                // The client-side validation will show warnings for tender dates in the past

                // Return validation errors if any
                if (validationErrors.Any())
                {
                    Console.WriteLine($"Validation errors found: {JsonSerializer.Serialize(validationErrors, _jsonOptions)}");
                    return BadRequest(new { errors = validationErrors });
                }

                // Set the creator information
                project.CreatedBy = User.Identity?.Name ?? "System";
                
                // Create the project
                var createdProject = await _projectService.CreateProjectAsync(project);
                Console.WriteLine($"Project created successfully with ID: {createdProject.Id}");
                return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating project: {ex}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }
                return BadRequest(new { errors = new { General = new[] { ex.Message } } });
            }
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        [Authorize(Policy = "PMOrHigher")]
        public async Task<IActionResult> UpdateProject(int id, Project project)
        {
            if (id != project.Id)
                return BadRequest();

            var updatedProject = await _projectService.UpdateProjectAsync(project);
            if (updatedProject == null)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "PMOOrHigher")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var result = await _projectService.DeleteProjectAsync(id);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"Error deleting project: {ex}");
                return StatusCode(500, new { error = "An error occurred while deleting the project." });
            }
        }

        // POST: api/Projects/5/approve
        [HttpPost("{id}/approve")]
        [Authorize(Policy = "PMOOrHigher")]
        public async Task<IActionResult> ApproveProject(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PONumber))
                {
                    return BadRequest(new { error = "PO Number is required for approval" });
                }

                var result = await _projectService.ApproveProjectAsync(
                    id, 
                    request.ApprovedBy ?? User.Identity?.Name ?? "System",
                    request.PONumber
                );

                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Projects/5/reject
        [HttpPost("{id}/reject")]
        [Authorize(Policy = "PMOOrHigher")]
        public async Task<IActionResult> RejectProject(int id, [FromBody] RejectionRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Reason))
                {
                    return BadRequest(new { error = "Rejection reason is required" });
                }

                var result = await _projectService.RejectProjectAsync(id, request.RejectedBy ?? User.Identity?.Name ?? "System", request.Reason);
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Projects/section/5
        [HttpGet("section/{sectionId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjectsBySection(int sectionId)
        {
            var projects = await _projectService.GetProjectsBySectionAsync(sectionId);
            return Ok(projects);
        }

        // GET: api/Projects/manager/5
        [HttpGet("manager/{managerId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjectsByManager(int managerId)
        {
            var projects = await _projectService.GetProjectsByManagerAsync(managerId);
            return Ok(projects);
        }

        // GET: api/Projects/5/budget
        [HttpGet("{id}/budget")]
        public async Task<ActionResult<decimal>> GetProjectBudget(int id)
        {
            var budget = await _projectService.GetTotalProjectBudgetAsync(id);
            return Ok(budget);
        }

        // GET: api/Projects/5/spend
        [HttpGet("{id}/spend")]
        public async Task<ActionResult<decimal>> GetProjectSpend(int id)
        {
            var spend = await _projectService.GetTotalProjectSpendAsync(id);
            return Ok(spend);
        }

        // PUT: api/Projects/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateProjectStatus(int id, [FromBody] string status)
        {
            var userName = User.Identity?.Name ?? "System";
            var result = await _projectService.UpdateProjectStatusAsync(id, status, userName);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // POST: api/Projects/5/delete-request
        [HttpPost("{id}/delete-request")]
        public async Task<IActionResult> RequestDeletion(int id)
        {
            try
            {
                var result = await _projectService.RequestProjectDeletionAsync(id, User.Identity?.Name ?? "System");
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Projects/5/approve-deletion
        [HttpPost("{id}/approve-deletion")]
        public async Task<IActionResult> ApproveDeletion(int id)
        {
            try
            {
                var result = await _projectService.ApproveDeletionAsync(id, User.Identity?.Name ?? "System");
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Projects/5/reject-deletion
        [HttpPost("{id}/reject-deletion")]
        public async Task<IActionResult> RejectDeletion(int id, [FromBody] RejectionRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Reason))
                {
                    return BadRequest(new { error = "Rejection reason is required" });
                }

                var result = await _projectService.RejectDeletionAsync(
                    id,
                    request.RejectedBy ?? User.Identity?.Name ?? "System",
                    request.Reason
                );

                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        public class ProjectWrapper
        {
            public Project? project { get; set; }
        }

        public class ApprovalRequest
        {
            public string? PONumber { get; set; }
            public string? ApprovedBy { get; set; }
        }

        public class RejectionRequest
        {
            public string? Reason { get; set; }
            public string? RejectedBy { get; set; }
        }
    }
} 