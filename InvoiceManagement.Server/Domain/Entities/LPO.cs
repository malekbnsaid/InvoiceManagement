using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using InvoiceManagement.Server.Domain.Enums;

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
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public CurrencyType Currency { get; set; }
        public decimal? RemainingAmount { get; set; }
        
        // Timeline
        public DateTime StartDate { get; set; }
        public DateTime CompletionDate { get; set; }
        
        // Foreign keys
        public int ProjectId { get; set; }
        public int? VendorId { get; set; }
        
        // Navigation properties
        public virtual Project Project { get; set; } = null!;
        public virtual Vendor? Vendor { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
} 