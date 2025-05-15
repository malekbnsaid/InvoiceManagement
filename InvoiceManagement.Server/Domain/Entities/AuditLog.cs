using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // Created, Updated, Deleted
        public string UserId { get; set; } = string.Empty; // Employee ID
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Changes { get; set; } = string.Empty; // JSON of before/after values
        public string EntityId { get; set; } = string.Empty; // ID of the affected entity
    }
} 