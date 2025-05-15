using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Project : BaseEntity
    {
        // Basic Information
        public string ProjectNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        // Management
        public int ProjectManagerId { get; set; }
        
        // Financial
        public decimal? Budget { get; set; }
        public decimal? Cost { get; set; }
        
        // Status
        public bool IsApproved { get; set; }
        public int? CompletionPercentage { get; set; }
        
        // Timeline
        public DateTime? ExpectedStart { get; set; }
        public DateTime? ExpectedEnd { get; set; }
        
        // Foreign keys - Important for project number generation
        public int SectionId { get; set; }
        
        // Navigation properties
        public DepartmentHierarchy Section { get; set; } = null!;
        public ERPEmployee ProjectManager { get; set; } = null!;
        public ICollection<LPO> LPOs { get; set; } = new List<LPO>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 