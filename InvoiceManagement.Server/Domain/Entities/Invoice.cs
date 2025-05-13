using System;
using System.Collections.Generic;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Invoice : BaseEntity
    {
        // Basic Invoice Info
        public string InvoiceNumber { get; set; }
        public DateTime InvoiceDate { get; set; }
        public decimal InvoiceValue { get; set; }
        public string Currency { get; set; }
        
        // OCR-extracted Vendor Info
        public string VendorName { get; set; }
        public string VendorAddress { get; set; }
        public string VendorTaxId { get; set; }
        
        // Invoice Processing
        public DateTime? ReceiveDate { get; set; }
        public string InvoiceReceiver { get; set; }
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
        
        // Payment Info
        public decimal? PaidAmount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string PaymentReference { get; set; }
        
        // Period Info (Optional)
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
        
        // Additional References
        public string Remark { get; set; }
        public string ReceiptNumber { get; set; }
        public string ReferenceNumber { get; set; }
        public int? CCAcountNumber { get; set; }
        
        // File Storage
        public string FilePath { get; set; }
        public string FileName { get; set; }
        public string FileType { get; set; }
        public long? FileSize { get; set; }
        
        // OCR Processing
        public float? OcrConfidence { get; set; }
        public bool IsOcrVerified { get; set; }
        public DateTime? OcrProcessedDate { get; set; }
        public string OcrRawData { get; set; }
        
        // Duplicate Detection
        public bool IsPotentialDuplicate { get; set; }
        public int? DuplicateOfInvoiceId { get; set; }
        
        // Foreign keys
        public int? ProjectId { get; set; }
        public int? LPOId { get; set; }
        
        // Navigation properties
        public Project Project { get; set; }
        public LPO LPO { get; set; }
        public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
        public Invoice DuplicateOfInvoice { get; set; }
    }
} 