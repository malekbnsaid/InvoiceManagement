using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class Employee : BaseEntity
    {
        // Personal Information
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Mobile { get; set; }
        
        // Authentication & Authorization
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public Role Role { get; set; }
        public bool IsActive { get; set; } = true;
        public string RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        
        // Last Login Information
        public DateTime? LastLoginDate { get; set; }
        
        // Foreign keys
        public int DepartmentId { get; set; }
        
        // Navigation properties
        public DepartmentHierarchy Department { get; set; }
    }
} 