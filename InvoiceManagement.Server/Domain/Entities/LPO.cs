using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class LPO : BaseEntity
    {
        // Basic Information
        public string LPONumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        
        // Financial
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public decimal? RemainingAmount { get; set; }
        
        // Timeline
        public DateTime StartDate { get; set; }
        public DateTime CompletionDate { get; set; }
        
        // Foreign keys
        public int ProjectId { get; set; }
        public int? VendorId { get; set; }
        
        // Navigation properties
        public Project Project { get; set; } = null!;
        public Vendor? Vendor { get; set; }
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 