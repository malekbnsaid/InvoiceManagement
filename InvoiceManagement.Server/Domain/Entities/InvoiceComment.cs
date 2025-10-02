using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class InvoiceComment
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? ModifiedAt { get; set; }
        public string? ModifiedBy { get; set; }

        // Navigation property
        public Invoice? Invoice { get; set; }
    }
}
