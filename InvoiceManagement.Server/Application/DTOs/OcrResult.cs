using System;
using System.Collections.Generic;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Application.DTOs
{
    public class OcrResult
    {
        // Invoice Details
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime? InvoiceDate { get; set; }
        public decimal? InvoiceValue { get; set; }
        public CurrencyType? Currency { get; set; }
        public DateTime? DueDate { get; set; }
        
        // Financial Information
        public decimal? SubTotal { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? TaxRate { get; set; }
        
        // Vendor Information
        public string VendorName { get; set; } = string.Empty;
        public string VendorTaxId { get; set; } = string.Empty;
        public string? VendorAddress { get; set; }
        public string? VendorPhone { get; set; }
        public string? VendorEmail { get; set; }
        
        // Customer Information
        public string? CustomerName { get; set; }
        public string? CustomerNumber { get; set; }
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        
        // Additional Information
        public string? PurchaseOrderNumber { get; set; }
        public string? PaymentTerms { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public string? Remark { get; set; }
        
        // Processing Information
        public double ConfidenceScore { get; set; }
        public bool IsProcessed { get; set; }
        public string? ErrorMessage { get; set; }
        
        // Raw OCR Data
        public string RawText { get; set; } = string.Empty;
        public Dictionary<string, double> FieldConfidenceScores { get; set; } = new();
    }
} 