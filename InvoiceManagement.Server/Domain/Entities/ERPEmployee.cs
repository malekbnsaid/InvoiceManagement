using System;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class ERPEmployee : BaseEntity
    {
        // Primary identifier from ERP system
        public string EmployeeNumber { get; set; } = string.Empty;

        // Personal Information
        public string EmployeeName { get; set; } = string.Empty;
        public string? EmployeeNameAr { get; set; }
        public string? QID { get; set; }
        public string? Email { get; set; }

        // Department Information
        public string? Department { get; set; }
        public string? DepartmentAr { get; set; }
        public int DepartmentID { get; set; }

        // Job Information
        public string? JobNumber { get; set; }
        public string? JobTitle { get; set; }
        public string? JobTitleAr { get; set; }
        public string? JobGrade { get; set; }
        public string? JobGradeAr { get; set; }
        public string? BasicSalary { get; set; }

        // Nationality Information
        public int NationalityId { get; set; }
        public string? Nationality { get; set; }
        public string? NationalityAr { get; set; }

        // Employment Information
        public DateTime DateOfEmployment { get; set; }
        public string? ContractType { get; set; }
        public string? Status { get; set; }
        public string? Manager_Id { get; set; }
        public string? Remark { get; set; }

        // Metadata
        public DateTime Rec_DateTime { get; set; }
        public string? Rec_UserId { get; set; }
        public string? Rec_IPAddress { get; set; }
        public bool Rec_IsActive { get; set; }
    }
} 