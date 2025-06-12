using System;

namespace InvoiceManagement.Server.Models
{
    public class ProjectDeleteRequest
    {
        public int ProjectId { get; set; }
        public string RequestedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public string Reason { get; set; }
        public bool IsPendingDeletion { get; set; }
    }
} 