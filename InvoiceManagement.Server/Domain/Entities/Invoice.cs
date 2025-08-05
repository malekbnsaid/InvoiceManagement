using System;
using System.Collections.Generic;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Invoice : BaseEntity
    {
        // Essential Invoice Information
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal InvoiceValue { get; set; }
        public CurrencyType Currency { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Subject { get; set; }
        public string? ReferenceNumber { get; set; }
        
        // New OCR-specific Fields
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerNumber { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public string? PaymentTerms { get; set; }
        public string? TaxRegistrationNumber { get; set; }
        
        // Enhanced Financial Information
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? TaxRate { get; set; }
        
        // Processing Information
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
        public DateTime? ReceiveDate { get; set; }
        public string? ProcessedBy { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal? PaidAmount { get; set; }
        
        // Vendor Information
        public string? VendorName { get; set; }
        public string? VendorAddress { get; set; }
        public string? VendorTaxNumber { get; set; }
        public string? VendorPhone { get; set; }
        public string? VendorEmail { get; set; }
        
        // Project Information
        public string? ProjectReference { get; set; }
        
        // Document Information
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long? FileSize { get; set; }
        
        // Additional Information
        public string? Remark { get; set; }
        
        // Duplicate Detection
        public bool IsPotentialDuplicate { get; set; }
        public int? DuplicateOfInvoiceId { get; set; }
        
        // Foreign Keys - Relationships
        public int? ProjectId { get; set; }
        public int? LPOId { get; set; }
        public int? VendorId { get; set; }
        
        // Navigation Properties
        public Project? Project { get; set; }
        public LPO? LPO { get; set; }
        public Vendor? Vendor { get; set; }
        public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
        public Invoice? DuplicateOfInvoice { get; set; }
        public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    }
} 