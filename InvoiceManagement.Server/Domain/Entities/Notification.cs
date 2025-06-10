using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public int ERPEmployeeId { get; set; }
        public ERPEmployee? ERPEmployee { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public new DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Related entity (optional)
        public string ActionUrl { get; set; } = string.Empty;
    }
} 