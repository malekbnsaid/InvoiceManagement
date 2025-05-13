using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string EntityName { get; set; }
        public string Action { get; set; } // Created, Updated, Deleted
        public string UserId { get; set; } // Employee ID
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Changes { get; set; } // JSON of before/after values
        public string EntityId { get; set; } // ID of the affected entity
    }
} 