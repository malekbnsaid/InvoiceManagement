using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace InvoiceManagement.Server.Domain.Entities
{
    public enum ApprovalStatus
    {
        Pending,
        SectionHeadApproved,
        DepartmentHeadApproved,
        FinanceApproved,
        Rejected
    }

    public class Project : BaseEntity
    {
        // Basic Information
        public string ProjectNumber { get; set; } = string.Empty;
        public string? PONumber { get; set; }
        
        [Required(ErrorMessage = "Project name is required")]
        public string Name { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        // Management
        [Required(ErrorMessage = "Project manager is required")]
        public int ProjectManagerId { get; set; }
        
        // Financial
        public decimal? Budget { get; set; }
        public decimal? Cost { get; set; }
        
        // PMO Approval
        public bool IsApproved { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? ApprovedBy { get; set; }
        public string? RejectionReason { get; set; }
        
        // Timeline
        public DateTime? ExpectedStart { get; set; }
        public DateTime? ExpectedEnd { get; set; }
        public DateTime? TenderDate { get; set; }
        
        // Payment Plan
        public ICollection<PaymentPlanLine> PaymentPlanLines { get; set; } = new List<PaymentPlanLine>();
        
        // Foreign keys
        [Required(ErrorMessage = "Section is required")]
        public int SectionId { get; set; }
        
        // Navigation properties
        [ForeignKey("SectionId")]
        public virtual DepartmentNode? Section { get; set; }
        
        [ForeignKey("ProjectManagerId")]
        public virtual ERPEmployee? ProjectManager { get; set; }
        
        public virtual ICollection<LPO> LPOs { get; set; } = new List<LPO>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 