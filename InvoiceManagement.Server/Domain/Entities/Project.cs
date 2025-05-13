using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Project : BaseEntity
    {
        // Project Identification
        public string ProjectNumber { get; set; }
        public string Name { get; set; }
        
        // Project Details
        public string Description { get; set; }
        public string ProjectManager { get; set; }
        public decimal? Budget { get; set; }
        public decimal? Cost { get; set; }
        
        // Project Timeline
        public DateTime? ExpectedStart { get; set; }
        public DateTime? ExpectedEnd { get; set; }
        public DateTime? ActualStart { get; set; }
        public DateTime? ActualEnd { get; set; }
        
        // Project Request Details
        public string RequestedBy { get; set; }
        public DateTime? RequestDate { get; set; }
        public bool IsApproved { get; set; }
        public string ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        
        // Procurement Details
        public string PONumber { get; set; } // Purchase Order number
        public DateTime? PurchaseDate { get; set; } // Date of purchase
        public string PaymentPlan { get; set; } // For upcoming years
        public int? CompletionPercentage { get; set; } // Status tracking
        
        // Foreign keys
        public int UnitId { get; set; }
        
        // Navigation properties
        public Unit Unit { get; set; }
        public ICollection<LPO> LPOs { get; set; } = new List<LPO>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 