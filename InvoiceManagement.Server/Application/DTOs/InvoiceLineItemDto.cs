using System;

namespace InvoiceManagement.Server.Application.DTOs
{
    public class InvoiceLineItemDto
    {
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
    }
} 