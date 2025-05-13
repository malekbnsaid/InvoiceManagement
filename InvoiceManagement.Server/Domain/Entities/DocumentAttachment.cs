using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class DocumentAttachment : BaseEntity
    {
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public string FilePath { get; set; }
        public string FileType { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; }
        
        public string Description { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public string UploadedBy { get; set; }
        
        // Document is related to either an Invoice, Project, or LPO
        public int? InvoiceId { get; set; }
        public int? ProjectId { get; set; }
        public int? LPOId { get; set; }
        
        // Navigation properties
        public Invoice Invoice { get; set; }
        public Project Project { get; set; }
        public LPO LPO { get; set; }
    }
} 