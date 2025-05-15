using System;
using System.Collections.Generic;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Invoice : BaseEntity
    {
        // Essential Invoice Information
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public decimal InvoiceValue { get; set; }
        public string Currency { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string? Subject { get; set; }
        public string? ReferenceNumber { get; set; }
        
        // Processing Information
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
        public DateTime? ReceiveDate { get; set; }
        public string? ProcessedBy { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal? PaidAmount { get; set; }
        
        // Vendor Information
        public string? VendorName { get; set; }
        
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
    }
} 