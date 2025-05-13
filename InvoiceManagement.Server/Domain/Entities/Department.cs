using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Department : BaseEntity
    {
        public string Name { get; set; }
        
        // Navigation properties
        public ICollection<Section> Sections { get; set; } = new List<Section>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
} 