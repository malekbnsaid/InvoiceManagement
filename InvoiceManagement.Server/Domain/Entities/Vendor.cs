using System;
using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Vendor : BaseEntity
    {
        public string Name { get; set; }
        public string ContactPerson { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Mobile { get; set; }
        public string Website { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
        public string TaxId { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string IBAN { get; set; }
        public string SwiftCode { get; set; }
        public bool IsActive { get; set; }
        public string Notes { get; set; }
        public string Category { get; set; }
        public string VendorCode { get; set; }
        
        // Navigation properties
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<LPO> LPOs { get; set; } = new List<LPO>();
    }
} 