using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class StatusHistory : BaseEntity
    {
        // Status Information
        public InvoiceStatus PreviousStatus { get; set; }
        public InvoiceStatus NewStatus { get; set; }
        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;
        public string ChangedBy { get; set; } = string.Empty;
        public string? Comments { get; set; }
        
        // Foreign Keys
        public int InvoiceId { get; set; }
        
        // Navigation properties
        public Invoice Invoice { get; set; } = null!;
    }
} 