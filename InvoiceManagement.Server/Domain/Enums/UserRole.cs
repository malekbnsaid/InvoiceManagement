namespace InvoiceManagement.Server.Domain.Enums
{
    public enum UserRole
    {
        Admin = 1,           // Full access to everything
        Head = 2,            // Department head level access
        PMO = 3,             // Project Management Office - approves projects
        PM = 4,              // Project Manager - creates projects
        Secretary = 5,       // Uploads invoices
        ReadOnly = 6         // Read-only access
    }
} 