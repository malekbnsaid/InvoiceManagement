using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        
        // Target user
        public int ERPEmployeeId { get; set; }
        
        // Related entity (optional)
        public string EntityType { get; set; } = string.Empty; // "Invoice", "Project", "LPO", etc.
        public int? EntityId { get; set; }
        public string ActionUrl { get; set; } = string.Empty;
        
        // Navigation properties
        public ERPEmployee Employee { get; set; } = null!;
    }
} 