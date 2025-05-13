using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Section : BaseEntity
    {
        public string Name { get; set; }
        public string Abbreviation { get; set; }
        
        // Foreign keys
        public int DepartmentId { get; set; }
        
        // Navigation properties
        public Department Department { get; set; }
        public ICollection<Unit> Units { get; set; } = new List<Unit>();
    }
} 