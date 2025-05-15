using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class DepartmentHierarchy : BaseEntity
    {
        // Department Information
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;

        // Section Information - Important for project number generation
        public int SectionId { get; set; }
        public string SectionName { get; set; } = string.Empty;
        public string SectionAbbreviation { get; set; } = string.Empty;  // Used in project number format

        // Unit Information
        public int UnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
    }
} 