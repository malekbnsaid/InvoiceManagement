using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class LPO : BaseEntity
    {
        public string LPONumber { get; set; }
        public DateTime IssueDate { get; set; }
        public string SupplierName { get; set; }
        public string SupplierEmail { get; set; }
        public string SupplierPhone { get; set; }
        public string Description { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime CompletionDate { get; set; }
        
        // Foreign keys
        public int ProjectId { get; set; }
        
        // Navigation properties
        public Project Project { get; set; }
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 