using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class DepartmentNode
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int DepartmentNumber { get; set; }
        
        public string? DepartmentNameArabic { get; set; }
        
        [Required]
        public string DepartmentNameEnglish { get; set; } = string.Empty;
        
        public string? SectionAbbreviation { get; set; }
        
        public int? ParentId { get; set; }

        // Navigation property
        [ForeignKey("ParentId")]
        public DepartmentNode? Parent { get; set; }

        public ICollection<DepartmentNode> Children { get; set; } = new List<DepartmentNode>();
    }
} 