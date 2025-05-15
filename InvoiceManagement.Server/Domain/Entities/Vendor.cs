using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Vendor : BaseEntity
    {
        // Basic Information
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Mobile { get; set; }
        public string? Website { get; set; }
        
        // Address
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        
        // Financial Information
        public string? TaxId { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? IBAN { get; set; }
        public string? SwiftCode { get; set; }
        
        // Classification
        public string? Category { get; set; }
        public string? VendorCode { get; set; }
        public string? Specialty { get; set; }
        public string? ServiceType { get; set; }
        public string? IndustryType { get; set; }
        
        // Status
        public bool IsActive { get; set; }
        public string? Notes { get; set; }
        
        // Navigation properties
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<LPO> LPOs { get; set; } = new List<LPO>();
    }
} 