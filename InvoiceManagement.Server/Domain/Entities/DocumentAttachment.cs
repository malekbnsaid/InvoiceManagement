using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class DocumentAttachment : BaseEntity
    {
        // File Information
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Upload Information
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public string UploadedBy { get; set; } = string.Empty;
        
        // Related Entity (only one of these should be set)
        public int? InvoiceId { get; set; }
        public int? ProjectId { get; set; }
        public int? LPOId { get; set; }
        
        // Navigation properties
        public Invoice? Invoice { get; set; }
        public Project? Project { get; set; }
        public LPO? LPO { get; set; }
        
        // Simple versioning (optional)
        public int VersionNumber { get; set; } = 1;
        public bool IsCurrentVersion { get; set; } = true;
        public string? ChangeDescription { get; set; }
    }
} 