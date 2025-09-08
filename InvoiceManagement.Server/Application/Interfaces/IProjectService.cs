using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IProjectService
    {
        Task<IEnumerable<Project>> GetAllProjectsAsync();
        Task<Project?> GetProjectByIdAsync(int id);
        Task<Project?> GetProjectByNumberAsync(string projectNumber);
        Task<Project> CreateProjectAsync(Project project);
        Task<Project?> UpdateProjectAsync(Project project);
        Task<bool> DeleteProjectAsync(int id);
        
        // Additional business operations
        Task<bool> ApproveProjectAsync(int id, string approvedBy, string poNumber);
        Task<bool> RejectProjectAsync(int id, string rejectedBy, string reason);
        Task<IEnumerable<Project>> GetProjectsBySectionAsync(int sectionId);
        Task<IEnumerable<Project>> GetProjectsByManagerAsync(int projectManagerId);
        Task<decimal> GetTotalProjectBudgetAsync(int id);
        Task<decimal> GetTotalProjectSpendAsync(int id);
        Task<bool> UpdateProjectStatusAsync(int id, string status, string updatedBy);
        Task<bool> UpdateProjectCostAsync(int id, decimal newCost, string updatedBy);
        
        // Payment plan validation methods
        Task<decimal> GetTotalPaymentPlanAmountAsync(int projectId);
        Task<bool> ValidatePaymentPlanAgainstBudgetAsync(int projectId, decimal? newBudget = null);

        // Deletion approval methods
        Task<bool> RequestProjectDeletionAsync(int id, string requestedBy);
        Task<bool> ApproveDeletionAsync(int id, string approvedBy);
        Task<bool> RejectDeletionAsync(int id, string rejectedBy, string reason);
    }
} 