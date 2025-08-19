using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Application.DTOs
{
    public class OcrResult
    {
        // Invoice Details
        [JsonPropertyName("invoiceNumber")]
        public string InvoiceNumber { get; set; } = string.Empty;
        [JsonPropertyName("invoiceDate")]
        public DateTime? InvoiceDate { get; set; }
        [JsonPropertyName("invoiceValue")]
        public decimal? InvoiceValue { get; set; }
        [JsonPropertyName("currency")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public CurrencyType? Currency { get; set; }
        [JsonPropertyName("dueDate")]
        public DateTime? DueDate { get; set; }
        
        // Financial Information
        [JsonPropertyName("subTotal")]
        public decimal? SubTotal { get; set; }
        [JsonPropertyName("taxAmount")]
        public decimal? TaxAmount { get; set; }
        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; set; }
        [JsonPropertyName("taxRate")]
        public string? TaxRate { get; set; }
        
        // Line Items
        [JsonPropertyName("lineItems")]
        public List<InvoiceLineItemDto> LineItems { get; set; } = new();
        
        // Vendor Information
        [JsonPropertyName("vendorName")]
        public string VendorName { get; set; } = string.Empty;
        [JsonPropertyName("vendorTaxId")]
        public string VendorTaxId { get; set; } = "PENDING";  // Default value for required field
        [JsonPropertyName("vendorAddress")]
        public string? VendorAddress { get; set; }
        [JsonPropertyName("vendorPhone")]
        public string? VendorPhone { get; set; }
        [JsonPropertyName("vendorEmail")]
        public string? VendorEmail { get; set; }
        
        // Customer Information
        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }
        [JsonPropertyName("customerNumber")]
        public string? CustomerNumber { get; set; }
        [JsonPropertyName("billingAddress")]
        public string? BillingAddress { get; set; }
        [JsonPropertyName("shippingAddress")]
        public string? ShippingAddress { get; set; }
        
        // Additional Information
        [JsonPropertyName("purchaseOrderNumber")]
        public string? PurchaseOrderNumber { get; set; }
        [JsonPropertyName("paymentTerms")]
        public string? PaymentTerms { get; set; }
        [JsonPropertyName("referenceNumber")]
        public string? ReferenceNumber { get; set; }
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        [JsonPropertyName("remark")]
        public string? Remark { get; set; }
        
        // Processing Information
        [JsonPropertyName("confidenceScore")]
        public double ConfidenceScore { get; set; }
        [JsonPropertyName("isProcessed")]
        public bool IsProcessed { get; set; }
        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }
        
        // Raw OCR Data
        [JsonPropertyName("rawText")]
        public string RawText { get; set; } = string.Empty;
        [JsonPropertyName("fieldConfidenceScores")]
        public Dictionary<string, double> FieldConfidenceScores { get; set; } = new();
    }
} 