using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class ProjectNumberRequest : BaseEntity
    {
        // Request Information
        [Required]
        public string ProjectName { get; set; } = string.Empty;

        [Required]
        public string ProjectDescription { get; set; } = string.Empty;

        public string? ProjectNumber { get; set; }

        public string Status { get; set; } = "Pending";

        public string? RejectionReason { get; set; }

        public int DepartmentNodeId { get; set; }

        [ForeignKey("DepartmentNodeId")]
        public DepartmentNode DepartmentNode { get; set; } = null!;

        public int RequestedById { get; set; }

        [ForeignKey("RequestedById")]
        public ERPEmployee RequestedBy { get; set; } = null!;

        // Approval/Status
        public RequestStatus RequestStatus { get; set; } = RequestStatus.Pending;
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        
        // Project Number
        public string? AssignedProjectNumber { get; set; }
        
        // Foreign keys
        public int? ProjectId { get; set; }
        
        // Navigation properties
        public Project? Project { get; set; }
    }
} 