using System.Collections.Generic;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Unit : BaseEntity
    {
        public string Name { get; set; }
        
        // Foreign keys
        public int SectionId { get; set; }
        
        // Navigation properties
        public Section Section { get; set; }
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
} 