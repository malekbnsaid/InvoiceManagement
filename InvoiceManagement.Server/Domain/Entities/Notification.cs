using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public string Title { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        
        // Target user
        public int EmployeeId { get; set; }
        
        // Related entity (optional)
        public string EntityType { get; set; } // "Invoice", "Project", "LPO", etc.
        public int? EntityId { get; set; }
        public string ActionUrl { get; set; }
        
        // Navigation properties
        public Employee Employee { get; set; }
    }
} 