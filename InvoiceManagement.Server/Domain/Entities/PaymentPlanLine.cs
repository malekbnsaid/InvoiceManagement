using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class PaymentPlanLine : BaseEntity
    {
        public int Year { get; set; }
        public decimal Amount { get; set; }
        public CurrencyType Currency { get; set; }
        public string PaymentType { get; set; } = string.Empty; // e.g., "Monthly", "Quarterly", "Annually"
        public string? Description { get; set; }
        
        // Foreign key
        public int ProjectId { get; set; }
        
        // Navigation property
        public Project Project { get; set; } = null!;
    }
} 