using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class LPO : BaseEntity
    {
        // LPO Identification
        public string LPONumber { get; set; }
        public DateTime IssueDate { get; set; }
        
        // Supplier info (legacy fields, now linked to Vendor entity)
        public string SupplierName { get; set; }
        public string SupplierEmail { get; set; }
        public string SupplierPhone { get; set; }
        
        // LPO Details
        public string Description { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime CompletionDate { get; set; }
        public string Status { get; set; } // Active, Completed, Cancelled
        public decimal? RemainingAmount { get; set; } // Amount that hasn't been invoiced yet
        
        // Prediction vs. Actual Tracking
        public string PredictionData { get; set; } // Stored as JSON
        public bool HasActuals { get; set; } // Flag to indicate if actuals have replaced predictions
        
        // Foreign keys
        public int ProjectId { get; set; }
        public int? VendorId { get; set; }
        
        // Navigation properties
        public Project Project { get; set; }
        public Vendor Vendor { get; set; }
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 