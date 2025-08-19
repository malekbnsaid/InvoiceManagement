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
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.ProjectManager)
                    .Include(p => p.Section)
                    .ToListAsync();
                
                return projects ?? Enumerable.Empty<Project>();
            }
            catch (Exception)
            {
                return Enumerable.Empty<Project>();
            }
        }

        public async Task<Project?> GetProjectByIdAsync(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.ProjectManager)
                    .Include(p => p.Section)
                    .FirstOrDefaultAsync(p => p.Id == id);
                
                return project;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Project?> GetProjectByNumberAsync(string projectNumber)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Section)
                    .Include(p => p.ProjectManager)
                    .FirstOrDefaultAsync(p => p.ProjectNumber == projectNumber);
                
                return project;
            }
            catch (Exception)
            {
                return null;
            }
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

        public async Task<Project?> UpdateProjectAsync(Project project)
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
            var project = await _context.Projects
                .Include(p => p.LPOs)
                .Include(p => p.Invoices)
                .Include(p => p.PaymentPlanLines)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return false;

            // Check if project is in deletion workflow
            if (project.IsPendingDeletion)
                throw new InvalidOperationException("Project is already in deletion workflow. Use the workflow endpoints instead.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Remove related entities first
                if (project.PaymentPlanLines?.Any() == true)
                    _context.Set<PaymentPlanLine>().RemoveRange(project.PaymentPlanLines);
                
                if (project.LPOs?.Any() == true)
                    _context.LPOs.RemoveRange(project.LPOs);
                    
                if (project.Invoices?.Any() == true)
                    _context.Invoices.RemoveRange(project.Invoices);

            _context.Projects.Remove(project);

                // Log the deletion before committing
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "Delete",
                "System",
                $"Deleted project: {project.Name}"
            );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

            return true;
        }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> ApproveProjectAsync(int id, string approvedBy, string poNumber)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
            project.IsApproved = true;
                project.ApprovalDate = DateTime.UtcNow;
                project.ApprovedBy = approvedBy;
                project.PONumber = poNumber;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = approvedBy;

                // Set actual start date since project is now approved
                project.SetActualStartDate();

            await _context.SaveChangesAsync();

            // Log the approval
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "Approve",
                approvedBy,
                    $"Approved project: {project.Name} with PO number: {poNumber}"
                );

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
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

        public async Task<bool> UpdateProjectCostAsync(int id, decimal newCost, string updatedBy)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            project.UpdateCost(newCost);
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = updatedBy;

            await _context.SaveChangesAsync();

            // Log the cost update
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "UpdateCost",
                updatedBy,
                $"Updated project cost to: {newCost}"
            );

            return true;
        }

        public async Task<bool> RequestProjectDeletionAsync(int id, string requestedBy)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return false;

            project.IsPendingDeletion = true;
            project.DeletionRequestDate = DateTime.UtcNow;
            project.DeletionRequestedBy = requestedBy;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = requestedBy;

            await _context.SaveChangesAsync();

            // Log the deletion request
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "DeletionRequest",
                requestedBy,
                $"Requested deletion of project: {project.Name}"
            );

            return true;
        }

        public async Task<bool> ApproveDeletionAsync(int id, string approvedBy)
        {
            var project = await _context.Projects
                .Include(p => p.LPOs)
                .Include(p => p.Invoices)
                .Include(p => p.PaymentPlanLines)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null || !project.IsPendingDeletion)
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Remove related entities first
                if (project.PaymentPlanLines?.Any() == true)
                    _context.Set<PaymentPlanLine>().RemoveRange(project.PaymentPlanLines);
                
                if (project.LPOs?.Any() == true)
                    _context.LPOs.RemoveRange(project.LPOs);
                    
                if (project.Invoices?.Any() == true)
                    _context.Invoices.RemoveRange(project.Invoices);

                project.IsDeletionApproved = true;
                project.DeletionApprovedDate = DateTime.UtcNow;
                project.DeletionApprovedBy = approvedBy;
                project.ModifiedAt = DateTime.UtcNow;
                project.ModifiedBy = approvedBy;

                _context.Projects.Remove(project);

                // Log the deletion approval before committing
                await _auditService.LogAuditAsync(
                    "Project",
                    id.ToString(),
                    "DeletionApproved",
                    approvedBy,
                    $"Approved deletion of project: {project.Name}"
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> RejectDeletionAsync(int id, string rejectedBy, string reason)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null || !project.IsPendingDeletion)
                return false;

            project.IsPendingDeletion = false;
            project.IsDeletionApproved = false;
            project.DeletionRejectionReason = reason;
            project.ModifiedAt = DateTime.UtcNow;
            project.ModifiedBy = rejectedBy;

            await _context.SaveChangesAsync();

            // Log the deletion rejection
            await _auditService.LogAuditAsync(
                "Project",
                id.ToString(),
                "DeletionRejected",
                rejectedBy,
                $"Rejected deletion of project: {project.Name}. Reason: {reason}"
            );

            return true;
        }
    }
} 