using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Project : BaseEntity
    {
        // Basic Information
        public string ProjectNumber { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Project name is required")]
        public string Name { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        // Management
        [Required(ErrorMessage = "Project manager is required")]
        public int ProjectManagerId { get; set; }
        
        // Financial
        public decimal? Budget { get; set; }
        public decimal? Cost { get; set; }
        
        // Status
        public bool IsApproved { get; set; }
        
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