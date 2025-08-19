using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class DocumentVersion : BaseEntity
    {
        // Version Information
        public int VersionNumber { get; set; }
        public string VersionLabel { get; set; } = string.Empty; // e.g., "Draft", "Final", "Revision 1"
        public string ChangeDescription { get; set; } = string.Empty;
        public DateTime VersionDate { get; set; } = DateTime.UtcNow;
        
        // Document Reference
        public int DocumentAttachmentId { get; set; }
        public DocumentAttachment DocumentAttachment { get; set; } = null!;
        
        // File Information for this version
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileHash { get; set; } = string.Empty; // For integrity verification
        
        // Change Tracking
        public string ChangedBy { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true; // Only one version should be active per document
    }
} 