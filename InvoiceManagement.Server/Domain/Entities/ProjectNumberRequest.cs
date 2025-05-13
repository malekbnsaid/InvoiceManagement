using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class ProjectNumberRequest : BaseEntity
    {
        public string RequestTitle { get; set; }
        public string Description { get; set; }
        public string RequestedBy { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public string ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        
        public string AssignedProjectNumber { get; set; }
        public string RejectionReason { get; set; }
        
        // Notification Tracking
        public bool NotificationSent { get; set; }
        public DateTime? NotificationDate { get; set; }
        
        // External Reference
        public string ExternalReference { get; set; }
        public string BusinessJustification { get; set; }
        
        // Foreign keys
        public int UnitId { get; set; }
        public int? ProjectId { get; set; }
        
        // Navigation properties
        public Unit Unit { get; set; }
        public Project Project { get; set; }
    }
} 