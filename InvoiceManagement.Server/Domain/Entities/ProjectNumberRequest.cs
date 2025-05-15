using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class ProjectNumberRequest : BaseEntity
    {
        // Request Information
        public string RequestTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        
        // Approval/Status
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        
        // Project Number
        public string? AssignedProjectNumber { get; set; }
        
        // Foreign keys - Important for project number generation
        public int DepartmentHierarchyId { get; set; }
        public int? ProjectId { get; set; }
        
        // Navigation properties
        public DepartmentHierarchy DepartmentHierarchy { get; set; } = null!;
        public Project? Project { get; set; }
    }
} 