using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class StatusHistory : BaseEntity
    {
        public int InvoiceId { get; set; }
        public InvoiceStatus PreviousStatus { get; set; }
        public InvoiceStatus NewStatus { get; set; }
        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;
        public string ChangedBy { get; set; }
        public string Comments { get; set; }
        
        // Performance Metrics
        public int DaysInPreviousStatus { get; set; }
        
        // Navigation properties
        public Invoice Invoice { get; set; }
    }
} 