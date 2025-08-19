using System;
using System.ComponentModel.DataAnnotations;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Models
{
    public class ProjectDeleteRequest
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public string RequestedBy { get; set; } = string.Empty;
        
        [Required]
        public string Reason { get; set; } = string.Empty;
        
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        
        public string? ApprovedBy { get; set; }
        
        public DateTime? ApprovalDate { get; set; }
        
        public string? ApprovalComments { get; set; }
        
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        
        public Project Project { get; set; } = null!;
    }
} 