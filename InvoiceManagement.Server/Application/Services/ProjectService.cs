using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;

namespace InvoiceManagement.Server.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IProjectNumberService _projectNumberService;

        public ProjectService(
            ApplicationDbContext context,
            IAuditService auditService,
            IProjectNumberService projectNumberService)
        {
            _context = context;
            _auditService = auditService;
            _projectNumberService = projectNumberService;
        }

        public async Task<IEnumerable<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects
                .Include(p => p.Section)
                .Include(p => p.ProjectManager)
                .ToListAsync();
        }

        public async Task<Project> GetProjectByIdAsync(int id)
        {
            return await _context.Projects
                .Include(p => p.Section)
                .Include(p => p.ProjectManager)
                .Include(p => p.LPOs)
                .Include(p => p.Invoices)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Project> GetProjectByNumberAsync(string projectNumber)
        {
            return await _context.Projects
                .Include(p => p.Section)
                .Include(p => p.ProjectManager)
                .FirstOrDefaultAsync(p => p.ProjectNumber == projectNumber);
        }

        public async Task<Project> CreateProjectAsync(Project project)
        {
            // Load the Section and ProjectManager
            var section = await _context.Departments.FindAsync(project.SectionId);
            var projectManager = await _context.ERPEmployees.FindAsync(project.ProjectManagerId);

            if (section == null)
                throw new Exception($"Section with ID {project.SectionId} not found.");
            if (projectManager == null)
                throw new Exception($"Project Manager with ID {project.ProjectManagerId} not found.");

            // Generate project number
            project.ProjectNumber = await _projectNumberService.GenerateProjectNumberAsync(project.SectionId);
            
            // Set creation metadata
            project.CreatedAt = DateTime.UtcNow;
            project.Section = section;
            project.ProjectManager = projectManager;
            
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            // Log the creation
            await _auditService.LogAuditAsync(
                "Project",
                project.Id.ToString(),
                "Create",
                project.CreatedBy,
                $"Created project: {project.Name}"
            );

            return project;
        }

        public async Task<Project> UpdateProjectAsync(Project project)
        {
            var existingProject = await _context.Projects.FindAsync(project.Id);
            if (existingProject == null)
                return null;

            // Update metadata
            project.ModifiedAt = DateTime.UtcNow;
            
            _context.Entry(existingProject).CurrentValues.SetValues(project);
            await _context.SaveChangesAsync();

            // Log the update
            await _auditService.LogAuditAsync(
                "Project",
                project.Id.ToString(),
                "Update",
                project.ModifiedBy ?? "System",
                $"Updated project: {project.Name}"
            );

            return project;
        }

        public async Task<bool> DeleteProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            // Log the deletion
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "Delete",
                "System",
                $"Deleted project: {project.Name}"
            );

            return true;
        }

        public async Task<bool> ApproveProjectAsync(int id, string approvedBy)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            project.IsApproved = true;
            project.ApprovalDate = DateTime.UtcNow;
            project.ApprovedBy = approvedBy;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = approvedBy;

            await _context.SaveChangesAsync();

            // Log the approval
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "Approve",
                approvedBy,
                $"Approved project: {project.Name}"
            );

            return true;
        }

        public async Task<bool> RejectProjectAsync(int id, string rejectedBy, string reason)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            project.IsApproved = false;
            project.RejectionReason = reason;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = rejectedBy;

            await _context.SaveChangesAsync();

            // Log the rejection
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "Reject",
                rejectedBy,
                $"Rejected project: {project.Name}. Reason: {reason}"
            );

            return true;
        }

        public async Task<bool> UpdatePONumberAsync(int id, string poNumber, string updatedBy)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            project.PONumber = poNumber;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = updatedBy;

            await _context.SaveChangesAsync();

            // Log the PO number update
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "UpdatePONumber",
                updatedBy,
                $"Updated PO number to {poNumber}"
            );

            return true;
        }

        public async Task<IEnumerable<Project>> GetProjectsBySectionAsync(int sectionId)
        {
            return await _context.Projects
                .Include(p => p.Section)
                .Include(p => p.ProjectManager)
                .Where(p => p.SectionId == sectionId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Project>> GetProjectsByManagerAsync(int projectManagerId)
        {
            return await _context.Projects
                .Include(p => p.Section)
                .Where(p => p.ProjectManagerId == projectManagerId)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalProjectBudgetAsync(int id)
        {
            var project = await _context.Projects
                .Include(p => p.LPOs)
                .FirstOrDefaultAsync(p => p.Id == id);

            return project?.Budget ?? 0;
        }

        public async Task<decimal> GetTotalProjectSpendAsync(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Invoices)
                .FirstOrDefaultAsync(p => p.Id == id);

            return project?.Invoices?.Sum(i => i.InvoiceValue) ?? 0;
        }

        public async Task<bool> UpdateProjectStatusAsync(int id, string status, string updatedBy)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            // Update status and metadata
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = updatedBy;

            await _context.SaveChangesAsync();

            // Log the status update
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "StatusUpdate",
                updatedBy,
                $"Updated project status: {status}"
            );

            return true;
        }
    }
} 