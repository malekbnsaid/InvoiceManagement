using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
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

                // Validate date fields
                if (project.ExpectedStart.HasValue && project.ExpectedEnd.HasValue)
                {
                    if (project.ExpectedEnd.Value < project.ExpectedStart.Value)
                    {
                        Console.WriteLine("Validation Error: Expected end date is before start date");
                        validationErrors.Add("ExpectedEnd", new List<string> { "Expected end date must be after expected start date." });
                    }
                }

                // Return validation errors if any
                if (validationErrors.Any())
                {
                    Console.WriteLine($"Validation errors found: {JsonSerializer.Serialize(validationErrors, _jsonOptions)}");
                    return BadRequest(new { errors = validationErrors });
                }

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
        public async Task<IActionResult> DeleteProject(int id)
        {
            var result = await _projectService.DeleteProjectAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // POST: api/Projects/5/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveProject(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PONumber))
                {
                    return BadRequest(new { error = "PO Number is required for approval" });
                }

                var approvalResult = await _projectService.ApproveProjectAsync(id, request.ApprovedBy ?? User.Identity?.Name ?? "System");
                if (!approvalResult)
                    return NotFound();

                var poUpdateResult = await _projectService.UpdatePONumberAsync(id, request.PONumber, request.ApprovedBy ?? User.Identity?.Name ?? "System");
                if (!poUpdateResult)
                    return BadRequest(new { error = "Failed to update PO number" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Projects/5/reject
        [HttpPost("{id}/reject")]
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
            var result = await _projectService.UpdateProjectStatusAsync(id, status, User.Identity.Name);
            if (!result)
                return NotFound();

            return NoContent();
        }

        public class ProjectWrapper
        {
            public Project project { get; set; }
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