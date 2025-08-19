using System;
using System.Text.Json.Serialization;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class InvoiceLineItem : BaseEntity
    {
        public int InvoiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
        public string? ItemNumber { get; set; }
        public string? Unit { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? DiscountRate { get; set; }
        public double? ConfidenceScore { get; set; }
        
        // Navigation property
        [JsonIgnore]
        public virtual Invoice Invoice { get; set; } = null!;
    }
} 